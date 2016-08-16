var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

if (request.RequestType == "Delete")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success");
  return;
}

var prices = []

var exclude_string = request.ResourceProperties.ExcludeString || "" 
var look_back = request.ResourceProperties.LookBack;
var want_to_pay = request.ResourceProperties.TargetPrice;

var exclude = exclude_string.split(",")

var typeToCapability = {
  "t1.micro"    : { cpu:  1024, memory:  1024, gen: 1, ecu:   1024},
  "t2.nano"     : { cpu:  1024, memory:   512, gen: 2, ecu:   1024},
  "t2.micro"    : { cpu:  1024, memory:  1024, gen: 2, ecu:   1024},
  "t2.small"    : { cpu:  1024, memory:  2048, gen: 2, ecu:   1024},
  "t2.medium"   : { cpu:  2048, memory:  4096, gen: 2, ecu:   2048},
  "t2.large"    : { cpu:  2048, memory:  8192, gen: 2, ecu:   2048},
  "m1.small"    : { cpu:  1024, memory:  1740, gen: 1, ecu:   1024},
  "m1.medium"   : { cpu:  1024, memory:  3840, gen: 1, ecu:   2048},
  "m1.large"    : { cpu:  2048, memory:  7680, gen: 1, ecu:   4096},
  "m1.xlarge"   : { cpu:  4096, memory: 15360, gen: 1, ecu:   8192},
  "m2.xlarge"   : { cpu:  2048, memory: 17510, gen: 2, ecu:   6656},
  "m2.2xlarge"  : { cpu:  4096, memory: 35020, gen: 2, ecu:  13312},
  "m2.4xlarge"  : { cpu:  8192, memory: 70040, gen: 2, ecu:  26624},
  "m3.medium"   : { cpu:  1024, memory:  3840, gen: 3, ecu:   3072},
  "m3.large"    : { cpu:  2048, memory:  7680, gen: 3, ecu:   6656},
  "m3.xlarge"   : { cpu:  4096, memory: 15360, gen: 3, ecu:  13312},
  "m3.2xlarge"  : { cpu:  8192, memory: 30720, gen: 3, ecu:  26624},
  "m4.large"    : { cpu:  2048, memory:  8192, gen: 4, ecu:   6656},
  "m4.xlarge"   : { cpu:  4096, memory: 16384, gen: 4, ecu:  13312},
  "m4.2xlarge"  : { cpu:  8192, memory: 32768, gen: 4, ecu:  26624},
  "m4.4xlarge"  : { cpu: 16384, memory: 65536, gen: 4, ecu:  54784},
  "m4.10xlarge" : { cpu: 40960, memory:163840, gen: 4, ecu: 127488},
  "c1.medium"   : { cpu:  2048, memory:  1740, gen: 1, ecu:   5120},
  "c1.xlarge"   : { cpu:  8192, memory:  7168, gen: 1, ecu:  20480},
  "c3.large"    : { cpu:  2048, memory:  3840, gen: 3, ecu:   7168},
  "c3.xlarge"   : { cpu:  4096, memory:  7680, gen: 3, ecu:  14336},
  "c3.2xlarge"  : { cpu:  8192, memory: 15360, gen: 3, ecu:  28672},
  "c3.4xlarge"  : { cpu: 16384, memory: 30720, gen: 3, ecu:  56320},
  "c3.8xlarge"  : { cpu: 32768, memory: 61440, gen: 3, ecu: 110592},
  "c4.large"    : { cpu:  2048, memory:  3840, gen: 4, ecu:   8192},
  "c4.xlarge"   : { cpu:  4096, memory:  7680, gen: 4, ecu:  16384},
  "c4.2xlarge"  : { cpu:  8192, memory: 15360, gen: 4, ecu:  31744},
  "c4.4xlarge"  : { cpu: 16384, memory: 30720, gen: 4, ecu:  63488},
  "c4.8xlarge"  : { cpu: 36864, memory: 61440, gen: 4, ecu: 135168},
  "g2.2xlarge"  : { cpu:  8192, memory: 15360, gen: 2, ecu:  26624},
  "g2.8xlarge"  : { cpu: 32768, memory: 61440, gen: 2, ecu: 106496},
  "r3.large"    : { cpu:  2048, memory: 15616, gen: 3, ecu:   6656},
  "r3.xlarge"   : { cpu:  4096, memory: 31232, gen: 3, ecu:  13312},
  "r3.2xlarge"  : { cpu:  8192, memory: 62464, gen: 3, ecu:  26624},
  "r3.4xlarge"  : { cpu: 16384, memory:124928, gen: 3, ecu:  53248},
  "r3.8xlarge"  : { cpu: 32768, memory:249856, gen: 3, ecu: 106496},
  "i2.xlarge"   : { cpu:  4096, memory: 31232, gen: 2, ecu:  14336},
  "i2.2xlarge"  : { cpu:  8192, memory: 62464, gen: 2, ecu:  27648},
  "i2.4xlarge"  : { cpu: 16384, memory:124928, gen: 2, ecu:  54272},
  "i2.8xlarge"  : { cpu: 32768, memory:249856, gen: 2, ecu: 106496},
  "d2.xlarge"   : { cpu:  4096, memory: 31232, gen: 2, ecu:  14336},
  "d2.2xlarge"  : { cpu:  8192, memory: 62464, gen: 2, ecu:  28672},
  "d2.4xlarge"  : { cpu: 16384, memory:124928, gen: 2, ecu:  57344},
  "d2.8xlarge"  : { cpu: 32768, memory:249856, gen: 2, ecu: 118784},
  "hi1.4xlarge" : { cpu: 16384, memory: 61952, gen: 1, ecu:  35840},
  "hs1.8xlarge" : { cpu: 16384, memory:119808, gen: 1, ecu:  35840},
  "cr1.8xlarge" : { cpu: 32768, memory:249856, gen: 1, ecu:  90112},
  "cc2.8xlarge" : { cpu: 32768, memory: 62464, gen: 1, ecu:  90112}
} 

function pick_lowest_prices(prices)
{
  var item_map = {};

  for(var i in prices)
  {
    var price = prices[i];
    if (!item_map[price.type] || item_map[price.type].price > price.price)
    {
      item_map[price.type] = price;
    }
  }

  var result = [];

  for(var i in item_map)
  {
    result.push(item_map[i]);
  }

  return result;
}

function score_type(type)
{
  return (typeToCapability[type].cpu + typeToCapability[type].memory) * (1 + typeToCapability[type].gen * 0.05);
}

function difference(v1, v2)
{
  return Math.abs(v1-v2);
}

function complete()
{
  prices = pick_lowest_prices(prices);

  prices.sort(function(a,b) {
    if (a.price < b.price) {
      return -1;
    }
    if (a.price > b.price) {
      return 1;
    }
    return 0;
  });

  var index = 0;
  for(var i in prices)
  {
    index = i;
    if(prices[i].price > want_to_pay)
    {
      break;
    }
  }


  shortlist = prices.splice(0, index)

  var result = prices[0];

  if (shortlist.length != 0)
  {
    shortlist.sort(function(a,b) {
      if (score_type(a.type) > score_type(b.type)) {
        return -1;
      }
      if (score_type(a.type) < score_type(b.type)) {
        return 1;
      }
      return 0;
    });

    //for(var i in shortlist)
    //{
    //  console.log(shortlist[i]);
    //}
    result = shortlist[0];
  }

  response = {
    Price:        String(result.price + 0.0001),
    Zone:         String(result.zone),
    AveragePrice: String(result.average_price),
    HighLine:     String(result.high_line),
    HighTime:     String(result.high_time),
    LowLine:      String(result.low_line),
    LowTime:      String(result.low_time),
    CpuUnits:     String(typeToCapability[result.type].cpu),
    CpuRating:    String(typeToCapability[result.type].ecu),
    MemRating:    String(typeToCapability[result.type].memory)
  }
  Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", result.type);

  console.log(JSON.stringify(prices));

}

function get_spot_prices(zones)
{
  var newest_price={};
  var xtotal={};
  var xcount={};
  var xhigh={};
  var xlow={};
  var xhightime={};
  var xlowtime={};

  function collect_data(zone, remaining, next_token)
  {
    if (remaining === 0 || next_token === null)
    {
      for(var type in newest_price)
      {
        var included = true;
        for(var i=0;i<exclude.length;i++)
        {
          if(type.indexOf(exclude[i]) != -1)
          {
            included = false;
            break;
          }
        }

        if (!included)
        {
          continue;
        }

        prices.push({
          type: type, 
          price: newest_price[type], 
          zone: zones[0], 
          average_price: xtotal[type]/xcount[type],
          high_line: xhigh[type],
          high_time: xhightime[type],
          low_line: xlow[type],
          low_time: xlowtime[type],
        });
      }

      zones.splice(0,1);
      get_spot_prices(zones);
    }
    else
    {
      ec2.describeSpotPriceHistory({
        AvailabilityZone: zone,
        MaxResults: 1000,
        NextToken: next_token
      }, function(err, data) {
        if (err)
        {
          console.log(err, err.stack); // an error occurred
          Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
        }
        else
        {

          //console.log(JSON.stringify(data.SpotPriceHistory))
          for(var i=0;i<data.SpotPriceHistory.length;i++)
          {
            var history = data.SpotPriceHistory[i];

            if (!newest_price[history.InstanceType])
            {
              newest_price[history.InstanceType] = Number(history.SpotPrice);
              xtotal[history.InstanceType] = Number(history.SpotPrice);
              xcount[history.InstanceType] = 1;
              xhigh[history.InstanceType] = Number(history.SpotPrice);
              xlow[history.InstanceType] = Number(history.SpotPrice);
              xhightime[history.InstanceType] = history.Timestamp;
              xlowtime[history.InstanceType] = history.Timestamp;
            }
            else
            {
              xtotal[history.InstanceType]+= Number(history.SpotPrice);
              xcount[history.InstanceType]+= 1;
              if (xhigh[history.InstanceType] < Number(history.SpotPrice))
              {
                xhigh[history.InstanceType] = Number(history.SpotPrice);
                xhightime[history.InstanceType] = history.Timestamp;
              }
              if (xlow[history.InstanceType] > Number(history.SpotPrice))
              {
                xlow[history.InstanceType] = Number(history.SpotPrice);
                xlowtime[history.InstanceType] = history.Timestamp;
              }
            }
          }

          collect_data(zone, remaining-1, data.NextToken);
        }
      });
    }
  }

  if (zones.length == 0)
  {
    complete();
  }
  else
  {
    collect_data(zones[0], look_back);
  }
}

ec2.describeAvailabilityZones({}, function(err, data) {
  if (err)
  {
    console.log(err, err.stack); // an error occurred
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
  }
  else
  {
    var zones = data.AvailabilityZones.map(function(x) {return x.ZoneName;});
    get_spot_prices(zones);
  }
});


