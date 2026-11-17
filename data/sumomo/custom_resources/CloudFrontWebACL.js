// IP allowlist for a CloudFront distribution: a CLOUDFRONT-scope WAFv2 IPSet
// plus a WebACL (DefaultAction Block, one rule allowing the IPSet).
//
// Why a custom resource: CLOUDFRONT-scope WAF resources must be created in
// us-east-1, and native AWS::WAFv2::* resources can only be created in the
// stack's own region. Same reason Custom::ACMCertificate exists.
//   https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-wafv2-webacl.html
//
// ResourceProperties: Name (WebACL name; IPSet is "<Name>-allow"), Addresses (IPv4 CIDRs).
// Returns: Arn (WebACL ARN, for DistributionConfig.WebACLId), Id, IPSetArn.
// Physical id: "<webAclArn>|<ipSetArn>".
//
// Update with the same Name edits the IPSet in place; a new Name creates a
// fresh pair (new physical id) and CloudFormation deletes the old one.
//
// The Lambda times out at 30s (make_lambda default), so retries stay well
// under that.

var waf = new aws.WAFV2({ region: "us-east-1" });
var SCOPE = "CLOUDFRONT";
var props = request.ResourceProperties;

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

function isCode(err, code) {
  return !!err && (err.code === code || err.name === code);
}

// Retry fn() while it throws one of `codes`. 10 x 2s = 20s worst case.
async function retry(fn, codes) {
  for (var attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      var retryable = codes.some(function (c) { return isCode(err, c); });
      if (!retryable || attempt >= 10) throw err;
      console.log("retrying after", err.code || err.name, "attempt", attempt);
      await sleep(2000);
    }
  }
}

// arn:aws:wafv2:us-east-1:<acct>:global/<type>/<Name>/<Id>
function parseArn(arn) {
  var parts = arn.split("/");
  return { Name: parts[parts.length - 2], Id: parts[parts.length - 1] };
}

function parsePhysicalId(pid) {
  var parts = String(pid || "").split("|");
  if (parts.length !== 2 || parts[0].indexOf("arn:") !== 0) return null; // Create never succeeded
  return { aclArn: parts[0], setArn: parts[1] };
}

function visibility(metric) {
  return {
    SampledRequestsEnabled: true,
    CloudWatchMetricsEnabled: true,
    MetricName: metric
  };
}

function result(aclArn, setArn) {
  return {
    pid: aclArn + "|" + setArn,
    data: { Arn: aclArn, Id: parseArn(aclArn).Id, IPSetArn: setArn }
  };
}

async function create() {
  var ipset = (await waf.createIPSet({
    Name: props.Name + "-allow",
    Scope: SCOPE,
    IPAddressVersion: "IPV4",
    Addresses: props.Addresses
  }).promise()).Summary;

  // A just-created IPSet can briefly be unusable in a WebACL.
  var acl = (await retry(function () {
    return waf.createWebACL({
      Name: props.Name,
      Scope: SCOPE,
      DefaultAction: { Block: {} },
      Rules: [{
        Name: "ip-allow",
        Priority: 0,
        Action: { Allow: {} },
        Statement: { IPSetReferenceStatement: { ARN: ipset.ARN } },
        VisibilityConfig: visibility(props.Name + "-ip-allow")
      }],
      VisibilityConfig: visibility(props.Name)
    }).promise();
  }, ["WAFUnavailableEntityException"])).Summary;

  return result(acl.ARN, ipset.ARN);
}

async function updateAddresses(ids) {
  var set = parseArn(ids.setArn);
  await retry(async function () {
    var current = await waf.getIPSet({ Name: set.Name, Scope: SCOPE, Id: set.Id }).promise();
    return waf.updateIPSet({
      Name: set.Name,
      Scope: SCOPE,
      Id: set.Id,
      Addresses: props.Addresses,
      LockToken: current.LockToken
    }).promise();
  }, ["WAFOptimisticLockException"]);

  return result(ids.aclArn, ids.setArn);
}

// get (for LockToken) + delete; already gone counts as deleted.
async function deleteOne(getFn, deleteFn, arn) {
  var ref = parseArn(arn);
  var base = { Name: ref.Name, Scope: SCOPE, Id: ref.Id };
  try {
    await retry(async function () {
      var current = await getFn(base).promise();
      return deleteFn(Object.assign({}, base, { LockToken: current.LockToken })).promise();
    }, ["WAFAssociatedItemException", "WAFOptimisticLockException"]);
  } catch (err) {
    if (!isCode(err, "WAFNonexistentItemException")) throw err;
  }
}

async function destroy(ids) {
  if (!ids) return;
  // WebACL first: the IPSet can't be deleted while a WebACL references it.
  await deleteOne(waf.getWebACL.bind(waf), waf.deleteWebACL.bind(waf), ids.aclArn);
  await deleteOne(waf.getIPSet.bind(waf), waf.deleteIPSet.bind(waf), ids.setArn);
}

async function main() {
  var ids = parsePhysicalId(request.PhysicalResourceId);

  if (request.RequestType === "Create") {
    return create();
  }

  if (request.RequestType === "Update") {
    var renamed = request.OldResourceProperties.Name !== props.Name;
    if (renamed || !ids) return create();
    return updateAddresses(ids);
  }

  if (request.RequestType === "Delete") {
    await destroy(ids);
    return { pid: request.PhysicalResourceId, data: {} };
  }

  throw new Error("Unknown RequestType " + request.RequestType);
}

main().then(function (r) {
  Cloudformation.send(request, context, Cloudformation.SUCCESS, r.data, "Success", r.pid);
}, function (err) {
  console.log(err, err && err.stack);
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + (err.code || "") + " " + err,
    request.PhysicalResourceId);
});
