var ec2 = new aws.EC2();

// list of enis like eni-awjdhawdo,eni-awjdhawd1o
var nidlist = request.ResourceProperties.NidList;

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
    NetworkInterfaceIds: nidlist
  };

  ec2.describeNetworkInterfaces(params).promise().then(function(data) {

  	var result = [];
    for (var eni_idx in data.NetworkInterfaces)
    {
    	result.push(data.NetworkInterfaces[eni_idx].PrivateIpAddress)
    }

    success(result.join(','));

  }).catch(function(err) {
    fail(err)
  });

}

if (request.RequestType == "Delete")
{
  success("0")
}
