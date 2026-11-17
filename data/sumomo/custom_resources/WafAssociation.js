
// Associates a WAFv2 WebACL with a regional resource (ALB). Replaces the
// native AWS::WAFv2::WebACLAssociation, which keeps a stable physical id
// and makes Update an idempotent re-association.
//
// Why not the native AWS::WAFv2::WebACLAssociation:
//   - It has only two properties (ResourceArn, WebACLArn) and no other
//     state; there is no in-place update path, so any change replaces.
//     https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-wafv2-webaclassociation.html
//   - On replacement CFN creates the new resource before deleting the
//     old. The physical id is the composite "<resourceArn>|<webaclArn>",
//     so the "new" one is identical to the old and collides; and CFN
//     won't replace a custom-named resource at all, failing with
//     "cannot update a stack when a custom-named resource requires
//     replacing". Renaming the logical id doesn't help (same physical
//     id => "already exists in stack"); the resource has no settable
//     name to change either.
//     https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/using-cfn-updating-stacks-update-behaviors.html
// The native association can also be flagged for replacement on stack
// updates even when its inputs are unchanged, and per the above such a
// replacement always fails.
//
// Others hit the same error on this exact resource type (different
// trigger: a CloudFormation stack-tag value changing per deploy):
//   https://github.com/aws-cloudformation/cloudformation-coverage-roadmap/issues/538
//
// ResourceProperties: Region, WebACLArn, ResourceArn.

var wafv2 = new aws.WAFV2({ region: request.ResourceProperties.Region });

var webAclArn = request.ResourceProperties.WebACLArn;
var resourceArn = request.ResourceProperties.ResourceArn;

// Stable physical id => CloudFormation never sees a replacement on update.
var physicalId = "wafassoc:" + resourceArn;

function ok(reason) {
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {
    WebACLArn: webAclArn,
    ResourceArn: resourceArn
  }, reason || "Success", physicalId);
}

function fail(err) {
  console.log(err, err && err.stack);
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err, physicalId);
}

function associate(onDone) {
  wafv2.associateWebACL({ WebACLArn: webAclArn, ResourceArn: resourceArn }, function (err) {
    if (err) { fail(err); } else { onDone(); }
  });
}

if (request.RequestType == "Create" || request.RequestType == "Update") {
  // (re)point the resource at this WebACL; idempotent, so Update is a no-op.
  associate(function () { ok(); });
}

if (request.RequestType == "Delete") {
  wafv2.disassociateWebACL({ ResourceArn: resourceArn }, function (err) {
    // Treat "already gone" as success so teardown never wedges.
    var notFound = err && (
      err.code === "WAFNonexistentItemException" ||
      err.name === "WAFNonexistentItemException" ||
      /nonexistent|not.*found|does not exist/i.test(String(err.message || err))
    );
    if (err && !notFound) {
      fail(err);
    } else {
      ok("Disassociated");
    }
  });
}
