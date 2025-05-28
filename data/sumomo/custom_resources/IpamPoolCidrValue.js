var ec2 = new aws.EC2();

var vpcid = request.ResourceProperties.VpcId;
// should look like vpc-cidr-assoc-004060b3d2a912fe1
var associd = request.ResourceProperties.AssociationId;

function fail(err)
{
  console.log('Errored.');
  console.log(err);
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
}

function success(cidr_string)
{
  Cloudformation.send(
    request,
    context,
    Cloudformation.SUCCESS,
    {},
    "Success",
    cidr_string);
}

if (request.RequestType == "Create" || request.RequestType == "Update")
{
  params = {
    VpcIds: [ vpcid ]
  };

  ec2.describeVpcs(params).promise().then(function(data) {
    var vpc = data.Vpcs[0];
    var assocset = vpc.Ipv6CidrBlockAssociationSet;

    var result = null;
    var list = ""
    for (var i=0; i<assocset.length; i++)
    {
      var assoc = assocset[i];
      list += assoc.AssociationId;
      if (assoc.AssociationId == associd)
      {
        result = assoc.Ipv6CidrBlock;
        break;
      }
    }

    if (result)
    {
      success(result)
    }
    else
    {
      fail("Could not find association in " + list)
    }

  }).catch(function(err) {
    fail(err)
  });

}

if (request.RequestType == "Delete")
{
  success("0")
}
