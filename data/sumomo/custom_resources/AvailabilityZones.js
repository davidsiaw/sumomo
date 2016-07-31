// return number of zones
// Zones = comma separated availability zone names

var ec2 = new aws.EC2({region: request.ResourceProperties.Region});
ec2.describeAvailabilityZones({}, function(err, data) {
  if (err)
  {
    console.log(err, err.stack); // an error occurred
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
  }
  else
  {
    var zones = data.AvailabilityZones.map(function(x) {return x.ZoneName;});
    zones_string = zones.join();

    if (request.RequestType == "Create") {

      Cloudformation.send(request, context, Cloudformation.SUCCESS, {
        Zones: zones_string
      }, "Success", String(zones.length));
    }

    if (request.RequestType == "Update") {

      Cloudformation.send(request, context, Cloudformation.SUCCESS, {
        Zones: zones_string
      }, "Success", String(zones.length));
    }

    if (request.RequestType == "Delete") {

      Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success");
    }
  }
});
