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
       "c1.medium": { cpu:   2048, memory:   1740, gen: 1, ecu:    5120 },
       "c1.xlarge": { cpu:   8192, memory:   7168, gen: 1, ecu:   20480 },
      "c3.2xlarge": { cpu:   8192, memory:  15360, gen: 3, ecu:   28672 },
      "c3.4xlarge": { cpu:  16384, memory:  30720, gen: 3, ecu:   56320 },
      "c3.8xlarge": { cpu:  32768, memory:  61440, gen: 3, ecu:  110592 },
        "c3.large": { cpu:   2048, memory:   3840, gen: 3, ecu:    7168 },
       "c3.xlarge": { cpu:   4096, memory:   7680, gen: 3, ecu:   14336 },
      "c4.2xlarge": { cpu:   8192, memory:  15360, gen: 4, ecu:   36864 },
      "c4.4xlarge": { cpu:  16384, memory:  30720, gen: 4, ecu:   73728 },
      "c4.8xlarge": { cpu:  36864, memory:  61440, gen: 4, ecu:  165888 },
        "c4.large": { cpu:   2048, memory:   3840, gen: 4, ecu:    9216 },
       "c4.xlarge": { cpu:   4096, memory:   7680, gen: 4, ecu:   18432 },
     "c5.18xlarge": { cpu:  73728, memory: 147456, gen: 5, ecu:  368640 },
      "c5.2xlarge": { cpu:   8192, memory:  16384, gen: 5, ecu:   40960 },
      "c5.4xlarge": { cpu:  16384, memory:  32768, gen: 5, ecu:   81920 },
      "c5.9xlarge": { cpu:  36864, memory:  73728, gen: 5, ecu:  184320 },
        "c5.large": { cpu:   2048, memory:   4096, gen: 5, ecu:   10240 },
       "c5.xlarge": { cpu:   4096, memory:   8192, gen: 5, ecu:   20480 },
    "c5d.18xlarge": { cpu:  73728, memory: 147456, gen: 5, ecu:  368640 },
     "c5d.2xlarge": { cpu:   8192, memory:  16384, gen: 5, ecu:   40960 },
     "c5d.4xlarge": { cpu:  16384, memory:  32768, gen: 5, ecu:   81920 },
     "c5d.9xlarge": { cpu:  36864, memory:  73728, gen: 5, ecu:  184320 },
       "c5d.large": { cpu:   2048, memory:   4096, gen: 5, ecu:   10240 },
      "c5d.xlarge": { cpu:   4096, memory:   8192, gen: 5, ecu:   20480 },
     "cc2.8xlarge": { cpu:  32768, memory:  62464, gen: 1, ecu:   90112 },
     "cr1.8xlarge": { cpu:  32768, memory: 249856, gen: 1, ecu:   90112 },
      "d2.2xlarge": { cpu:   8192, memory:  62464, gen: 2, ecu:   24576 },
      "d2.4xlarge": { cpu:  16384, memory: 124928, gen: 2, ecu:   49152 },
      "d2.8xlarge": { cpu:  36864, memory: 249856, gen: 2, ecu:  110592 },
       "d2.xlarge": { cpu:   4096, memory:  31232, gen: 2, ecu:   12288 },
     "f1.16xlarge": { cpu:  65536, memory: 999424, gen: 1, ecu:  163840 },
      "f1.2xlarge": { cpu:   8192, memory: 124928, gen: 1, ecu:   20480 },
      "f1.4xlarge": { cpu:  16384, memory: 249856, gen: 1, ecu:   40960 },
      "g2.2xlarge": { cpu:   8192, memory:  15360, gen: 2, ecu:   26624 },
      "g2.8xlarge": { cpu:  32768, memory:  61440, gen: 2, ecu:  106496 },
     "g3.16xlarge": { cpu:  65536, memory: 499712, gen: 3, ecu:  229376 },
      "g3.4xlarge": { cpu:  16384, memory: 124928, gen: 3, ecu:   57344 },
      "g3.8xlarge": { cpu:  32768, memory: 249856, gen: 3, ecu:  114688 },
     "h1.16xlarge": { cpu:  65536, memory: 262144, gen: 1, ecu:  163840 },
      "h1.2xlarge": { cpu:   8192, memory:  32768, gen: 1, ecu:   20480 },
      "h1.4xlarge": { cpu:  16384, memory:  65536, gen: 1, ecu:   40960 },
      "h1.8xlarge": { cpu:  32768, memory: 131072, gen: 1, ecu:   81920 },
     "hs1.8xlarge": { cpu:  16384, memory: 119808, gen: 1, ecu:   35840 },
      "i2.2xlarge": { cpu:   8192, memory:  62464, gen: 2, ecu:   27648 },
      "i2.4xlarge": { cpu:  16384, memory: 124928, gen: 2, ecu:   54272 },
      "i2.8xlarge": { cpu:  32768, memory: 249856, gen: 2, ecu:  106496 },
       "i2.xlarge": { cpu:   4096, memory:  31232, gen: 2, ecu:   14336 },
     "i3.16xlarge": { cpu:  65536, memory: 499712, gen: 3, ecu:  294912 },
      "i3.2xlarge": { cpu:   8192, memory:  62464, gen: 3, ecu:   36864 },
      "i3.4xlarge": { cpu:  16384, memory: 124928, gen: 3, ecu:   73728 },
      "i3.8xlarge": { cpu:  32768, memory: 249856, gen: 3, ecu:  147456 },
        "i3.large": { cpu:   2048, memory:  15616, gen: 3, ecu:    9216 },
        "i3.metal": { cpu:  73728, memory: 524288, gen: 3, ecu:  331776 },
       "i3.xlarge": { cpu:   4096, memory:  31232, gen: 3, ecu:   18432 },
        "m1.large": { cpu:   2048, memory:   7680, gen: 1, ecu:    4096 },
       "m1.medium": { cpu:   1024, memory:   3840, gen: 1, ecu:    2048 },
        "m1.small": { cpu:   1024, memory:   1740, gen: 1, ecu:    1024 },
       "m1.xlarge": { cpu:   4096, memory:  15360, gen: 1, ecu:    8192 },
      "m2.2xlarge": { cpu:   4096, memory:  35020, gen: 2, ecu:   13312 },
      "m2.4xlarge": { cpu:   8192, memory:  70040, gen: 2, ecu:   26624 },
       "m2.xlarge": { cpu:   2048, memory:  17510, gen: 2, ecu:    6656 },
      "m3.2xlarge": { cpu:   8192, memory:  30720, gen: 3, ecu:   26624 },
        "m3.large": { cpu:   2048, memory:   7680, gen: 3, ecu:    6656 },
       "m3.medium": { cpu:   1024, memory:   3840, gen: 3, ecu:    3072 },
       "m3.xlarge": { cpu:   4096, memory:  15360, gen: 3, ecu:   13312 },
     "m4.10xlarge": { cpu:  40960, memory: 163840, gen: 4, ecu:  163840 },
     "m4.16xlarge": { cpu:  65536, memory: 262144, gen: 4, ecu:  262144 },
      "m4.2xlarge": { cpu:   8192, memory:  32768, gen: 4, ecu:   32768 },
      "m4.4xlarge": { cpu:  16384, memory:  65536, gen: 4, ecu:   65536 },
        "m4.large": { cpu:   2048, memory:   8192, gen: 4, ecu:    8192 },
       "m4.xlarge": { cpu:   4096, memory:  16384, gen: 4, ecu:   16384 },
     "m5.12xlarge": { cpu:  49152, memory: 196608, gen: 5, ecu:  221184 },
     "m5.24xlarge": { cpu:  98304, memory: 393216, gen: 5, ecu:  442368 },
      "m5.2xlarge": { cpu:   8192, memory:  32768, gen: 5, ecu:   36864 },
      "m5.4xlarge": { cpu:  16384, memory:  65536, gen: 5, ecu:   73728 },
        "m5.large": { cpu:   2048, memory:   8192, gen: 5, ecu:    9216 },
       "m5.xlarge": { cpu:   4096, memory:  16384, gen: 5, ecu:   18432 },
    "m5d.12xlarge": { cpu:  49152, memory: 196608, gen: 5, ecu:  221184 },
    "m5d.24xlarge": { cpu:  98304, memory: 393216, gen: 5, ecu:  442368 },
     "m5d.2xlarge": { cpu:   8192, memory:  32768, gen: 5, ecu:   36864 },
     "m5d.4xlarge": { cpu:  16384, memory:  65536, gen: 5, ecu:   73728 },
       "m5d.large": { cpu:   2048, memory:   8192, gen: 5, ecu:    9216 },
      "m5d.xlarge": { cpu:   4096, memory:  16384, gen: 5, ecu:   18432 },
     "p2.16xlarge": { cpu:  65536, memory: 749568, gen: 2, ecu:  196608 },
      "p2.8xlarge": { cpu:  32768, memory: 499712, gen: 2, ecu:   98304 },
       "p2.xlarge": { cpu:   4096, memory:  62464, gen: 2, ecu:   12288 },
     "p3.16xlarge": { cpu:  65536, memory: 499712, gen: 3, ecu:  229376 },
      "p3.2xlarge": { cpu:   8192, memory:  62464, gen: 3, ecu:   28672 },
      "p3.8xlarge": { cpu:  32768, memory: 249856, gen: 3, ecu:  114688 },
      "r3.2xlarge": { cpu:   8192, memory:  62464, gen: 3, ecu:   26624 },
      "r3.4xlarge": { cpu:  16384, memory: 124928, gen: 3, ecu:   53248 },
      "r3.8xlarge": { cpu:  32768, memory: 249856, gen: 3, ecu:  106496 },
        "r3.large": { cpu:   2048, memory:  15616, gen: 3, ecu:    6656 },
       "r3.xlarge": { cpu:   4096, memory:  31232, gen: 3, ecu:   13312 },
     "r4.16xlarge": { cpu:  65536, memory: 499712, gen: 4, ecu:  262144 },
      "r4.2xlarge": { cpu:   8192, memory:  62464, gen: 4, ecu:   32768 },
      "r4.4xlarge": { cpu:  16384, memory: 124928, gen: 4, ecu:   65536 },
      "r4.8xlarge": { cpu:  32768, memory: 249856, gen: 4, ecu:  131072 },
        "r4.large": { cpu:   2048, memory:  15616, gen: 4, ecu:    8192 },
       "r4.xlarge": { cpu:   4096, memory:  31232, gen: 4, ecu:   16384 },
     "r5.12xlarge": { cpu:  49152, memory: 393216, gen: 5, ecu:  221184 },
     "r5.24xlarge": { cpu:  98304, memory: 786432, gen: 5, ecu:  442368 },
      "r5.2xlarge": { cpu:   8192, memory:  65536, gen: 5, ecu:   36864 },
      "r5.4xlarge": { cpu:  16384, memory: 131072, gen: 5, ecu:   73728 },
        "r5.large": { cpu:   2048, memory:  16384, gen: 5, ecu:    9216 },
       "r5.xlarge": { cpu:   4096, memory:  32768, gen: 5, ecu:   18432 },
    "r5d.12xlarge": { cpu:  49152, memory: 393216, gen: 5, ecu:  221184 },
    "r5d.24xlarge": { cpu:  98304, memory: 786432, gen: 5, ecu:  442368 },
     "r5d.2xlarge": { cpu:   8192, memory:  65536, gen: 5, ecu:   36864 },
     "r5d.4xlarge": { cpu:  16384, memory: 131072, gen: 5, ecu:   73728 },
       "r5d.large": { cpu:   2048, memory:  16384, gen: 5, ecu:    9216 },
      "r5d.xlarge": { cpu:   4096, memory:  32768, gen: 5, ecu:   18432 },
        "t1.micro": { cpu:   1024, memory:   1024, gen: 1, ecu:    1024 },
      "t2.2xlarge": { cpu:   8192, memory:  32768, gen: 2, ecu:   16384 },
        "t2.large": { cpu:   2048, memory:   8192, gen: 2, ecu:    4096 },
       "t2.medium": { cpu:   2048, memory:   4096, gen: 2, ecu:    4096 },
        "t2.micro": { cpu:   1024, memory:   1024, gen: 2, ecu:    2048 },
         "t2.nano": { cpu:   1024, memory:    512, gen: 2, ecu:    2048 },
        "t2.small": { cpu:   1024, memory:   2048, gen: 2, ecu:    2048 },
       "t2.xlarge": { cpu:   4096, memory:  16384, gen: 2, ecu:    8192 },
      "t3.2xlarge": { cpu:   8192, memory:  32768, gen: 3, ecu:   20480 },
        "t3.large": { cpu:   2048, memory:   8192, gen: 3, ecu:    5120 },
       "t3.medium": { cpu:   2048, memory:   4096, gen: 3, ecu:    5120 },
        "t3.micro": { cpu:   1024, memory:   1024, gen: 3, ecu:    2560 },
         "t3.nano": { cpu:   1024, memory:    512, gen: 3, ecu:    2560 },
        "t3.small": { cpu:   1024, memory:   2048, gen: 3, ecu:    2560 },
       "t3.xlarge": { cpu:   4096, memory:  16384, gen: 3, ecu:   10240 },
     "x1.16xlarge": { cpu:  65536, memory: 999424, gen: 1, ecu:  163840 },
     "x1.32xlarge": { cpu: 131072, memory:   1024, gen: 1, ecu:  327680 },
    "x1e.16xlarge": { cpu:  65536, memory:   1024, gen: 1, ecu:  163840 },
     "x1e.2xlarge": { cpu:   8192, memory: 249856, gen: 1, ecu:   20480 },
    "x1e.32xlarge": { cpu: 131072, memory:   3072, gen: 1, ecu:  327680 },
     "x1e.4xlarge": { cpu:  16384, memory: 499712, gen: 1, ecu:   40960 },
     "x1e.8xlarge": { cpu:  32768, memory: 999424, gen: 1, ecu:   81920 },
      "x1e.xlarge": { cpu:   4096, memory: 124928, gen: 1, ecu:   10240 },
    "z1d.12xlarge": { cpu:  49152, memory: 393216, gen: 1, ecu:  122880 },
     "z1d.2xlarge": { cpu:   8192, memory:  65536, gen: 1, ecu:   20480 },
     "z1d.3xlarge": { cpu:  12288, memory:  98304, gen: 1, ecu:   30720 },
     "z1d.6xlarge": { cpu:  24576, memory: 196608, gen: 1, ecu:   61440 },
       "z1d.large": { cpu:   2048, memory:  16384, gen: 1, ecu:    5120 },
      "z1d.xlarge": { cpu:   4096, memory:  32768, gen: 1, ecu:   10240 },
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


