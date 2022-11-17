var ec2 = new aws.EC2();
function success()
{
  Cloudformation.send(
    request,
    context,
    Cloudformation.SUCCESS,
    {},
    "Success",
    request.ResourceProperties.SecurityGroups.join(','));
}

function fail(err)
{
  console.log('Errored.');
  console.log(err);
  Cloudformation.send(
    request,
    context,
    Cloudformation.FAILED,
    {},
    "Error: " + err
  );
}

if (request.RequestType == "Create")
{
  success()
}

if (request.RequestType == "Update")
{
  success()
}

if (request.RequestType == "Delete")
{
  var params = {
    Filters: [
      {
        Name: 'group-id',
        Values: request.ResourceProperties.SecurityGroups
      },
      {
        Name: 'description',
        Values: ['AWS Lambda VPC ENI: *']
      }
    ]
  };
  console.log("Deleting attachments!");

  // Detach all network-interface attachments
  ec2.describeNetworkInterfaces(params).promise().then(function(data) {
    console.log("Got Interfaces:\n", JSON.stringify(data));
    return Promise.all(data.NetworkInterfaces.map(function(networkInterface) {
      var networkInterfaceId = networkInterface.NetworkInterfaceId;
      var attachmentId = networkInterface.Attachment.AttachmentId;
      return ec2.detachNetworkInterface({AttachmentId: attachmentId}).promise().then(function(data) {
        return ec2.waitFor('networkInterfaceAvailable', {NetworkInterfaceIds: [networkInterfaceId]}).promise();
      }).then(function(data) {
        console.log("Detached Interface, deleting:\n", networkInterfaceId);
        return ec2.deleteNetworkInterface({NetworkInterfaceId: networkInterfaceId}).promise();
      });
    }));
  }).then(function(data) {
    success()
  }).catch(function(err) {
    fail(err)
  });
}
