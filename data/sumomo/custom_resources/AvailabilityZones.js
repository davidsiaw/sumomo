// return number of zones
// Zones = comma separated availability zone names

physicalId = "0"
response = {}

function send_success()
{
  if (request.RequestType == "Create")
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", physicalId);
  }

  if (request.RequestType == "Update")
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", physicalId);
  }

  if (request.RequestType == "Delete")
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success");
  }
}

function get_spot_prices(instance, zones, number)
{
  if (zones.length == 0)
  {
    send_success();
  }
  else
  {
    ec2.describeSpotPriceHistory({
      AvailabilityZone: zones[0],
      InstanceTypes: [instance],
      MaxResults: 10
    }, function(err, data) {
      if (err)
      {
        console.log(err, err.stack); // an error occurred
        Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
      }
      else
      {
        console.log("HISTORY")
        console.log(JSON.stringify(data.SpotPriceHistory))
        var price = data.SpotPriceHistory[0].SpotPrice
        if (response["ZoneSpotPrices"])
        {
          response["ZoneSpotPrices"] += ","
        }
        response["ZoneSpotPrices"] += price;
        response["ZoneSpotPrice" + number] = price;
        zones.splice(0,1);
        get_spot_prices(instance, zones, number+1);
      }
    });
  }
}

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

    physicalId = String(zones.length);
    response["Zones"] = zones.join();
    for(var i=0; i<zones.length; i++)
    {
      response["Zone"+i] = zones[i];
    }

    if (request.ResourceProperties.GetSpotPriceFor)
    {
      response["ZoneSpotPrices"] = ""
      get_spot_prices(request.ResourceProperties.GetSpotPriceFor, zones, 1);
    }
    else
    {
      send_success();
    }
  }
});
