require 'json'

puts "Updates the data in the custom_resources folder"

`aws ec2 describe-instance-types > itypes`

data = JSON.parse(File.read('itypes'))

start = {
  a: 2.0,
  c: 2.5,
  d: 2.0,
  f: 2.0,
  g: 2.0,
  h: 2.0,
  i: 3.0,
  m: 2.0,
  p: 2.0,
  r: 2.0,
  t: 1.0,
  u: 2.0,
  v: 2.0,
  x: 2.0,
  z: 2.0
}

types = []
types2 = []
data['InstanceTypes'].each do |info|

  virt = 'pv'
  if info["GpuInfo"]
    virt = 'ecs-gpu-hvm'
  elsif info["SupportedVirtualizationTypes"].last == 'hvm'
    virt = 'ecs-hvm'
  end

  mount = 'ebs'
  
  arch = info["ProcessorInfo"]["SupportedArchitectures"].last

  raise 'UNKNOWN ARCH COMBINATION' if arch == 'arm64' && mount == 's3'

  pattern = "amzn2-ami-#{virt}-2.0.*#{arch}-#{mount}"

  if arch == 'x86_64_mac'
    pattern = 'amzn-ec2-macos-*'
  end

  gennum = /[0-9]/.match(info['InstanceType']).to_s.to_i

  p gennum
  p info['InstanceType']

  ecu = (( start[ info['InstanceType'][0].to_sym ] + gennum.to_f * 0.5) * (info['VCpuInfo']['DefaultVCpus']).to_f * 1024).floor
  types << "  '#{info['InstanceType']}': { cpu: #{info['VCpuInfo']['DefaultVCpus'] * 1024}, memory: #{info["MemoryInfo"]["SizeInMiB"]}, gen: #{gennum}, ecu: #{ecu}, arch: '#{info["ProcessorInfo"]["SupportedArchitectures"].last}' }"
  types2 << "  '#{info['InstanceType']}': { pattern: '#{pattern}' }"
end

def align(arr)
  result = []
  lengths = arr[0].split(':').map{|x| x.length}

  arr.each do |x|
    tokens = x.split(':')
    tokens.each_with_index do |y,i|
      if y.length > lengths[i]
        lengths[i] = y.length
      end
    end
  end

  arr.each do |x|
    tokens = x.split(':')
    newtokens = []
    tokens.each_with_index do |y,i|
      newtokens << (' ' * (lengths[i] - y.length) + y)
    end
    result << newtokens.join(':')
  end

  result
end

types.sort!
types2.sort!

types = align(types)
types2 = align(types2)

selectspot = <<~SELECTSPOT
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
  #{types.join(",\n")}
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

SELECTSPOT

lookup = <<~AMILOOKUP
  var typeToPattern = {
  #{types2.join(",\n")}
  }

  var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

  var describeImagesParams = {
    Filters: [{ Name: "name", Values: [typeToPattern[request.ResourceProperties.InstanceType].pattern]}],
    Owners: [request.ResourceProperties.Architecture == "HVMG2" ? "679593333241" : "amazon"]
  };

  // Check if the image is a beta or rc image. The Lambda function won't return any of those images.
  function isBeta(imageName) {
      return imageName.toLowerCase().indexOf("beta") > -1 || imageName.toLowerCase().indexOf(".rc") > -1;
  }

  // Get AMI IDs with the specified name pattern and owner
  ec2.describeImages(describeImagesParams, function(err, describeImagesResult)
  {
    if (err)
    {
      console.log(err, err.stack); // an error occurred
      Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
    }
    else
    {
      var response = {}
      var id = "NONE";
      var images = describeImagesResult.Images;
      // Sort images by name in descending order. The names contain the AMI version, formatted as YYYY.MM.Ver.
      images.sort(function(x, y) { return y.Name.localeCompare(x.Name); });
      for (var j = 0; j < images.length; j++)
      {
          if (isBeta(images[j].Name)) continue;
          id = images[j].ImageId;
          response["Name"] = images[j].Name;
          response["ImageType"] = images[j].ImageType;
          response["CreationDate"] = images[j].CreationDate;
          response["Description"] = images[j].Description;
          response["RootDeviceType"] = images[j].RootDeviceType;
          response["RootDeviceName"] = images[j].RootDeviceName;
          response["VirtualizationType"] = images[j].VirtualizationType;
          break;
      }
      Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", id);
    }
  });
AMILOOKUP

File.write('data/sumomo/custom_resources/SelectSpot.js', selectspot);
File.write('data/sumomo/custom_resources/AMILookup.js', lookup);
