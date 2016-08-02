
var typeToArch = {
      "t1.micro"    : "PV64" ,
      "t2.nano"     : "HVM64",
      "t2.micro"    : "HVM64",
      "t2.small"    : "HVM64",
      "t2.medium"   : "HVM64",
      "t2.large"    : "HVM64",
      "m1.small"    : "PV64" ,
      "m1.medium"   : "PV64" ,
      "m1.large"    : "PV64" ,
      "m1.xlarge"   : "PV64" ,
      "m2.xlarge"   : "PV64" ,
      "m2.2xlarge"  : "PV64" ,
      "m2.4xlarge"  : "PV64" ,
      "m3.medium"   : "HVM64",
      "m3.large"    : "HVM64",
      "m3.xlarge"   : "HVM64",
      "m3.2xlarge"  : "HVM64",
      "m4.large"    : "HVM64",
      "m4.xlarge"   : "HVM64",
      "m4.2xlarge"  : "HVM64",
      "m4.4xlarge"  : "HVM64",
      "m4.10xlarge" : "HVM64",
      "c1.medium"   : "PV64" ,
      "c1.xlarge"   : "PV64" ,
      "c3.large"    : "HVM64",
      "c3.xlarge"   : "HVM64",
      "c3.2xlarge"  : "HVM64",
      "c3.4xlarge"  : "HVM64",
      "c3.8xlarge"  : "HVM64",
      "c4.large"    : "HVM64",
      "c4.xlarge"   : "HVM64",
      "c4.2xlarge"  : "HVM64",
      "c4.4xlarge"  : "HVM64",
      "c4.8xlarge"  : "HVM64",
      "g2.2xlarge"  : "HVMG2",
      "g2.8xlarge"  : "HVMG2",
      "r3.large"    : "HVM64",
      "r3.xlarge"   : "HVM64",
      "r3.2xlarge"  : "HVM64",
      "r3.4xlarge"  : "HVM64",
      "r3.8xlarge"  : "HVM64",
      "i2.xlarge"   : "HVM64",
      "i2.2xlarge"  : "HVM64",
      "i2.4xlarge"  : "HVM64",
      "i2.8xlarge"  : "HVM64",
      "d2.xlarge"   : "HVM64",
      "d2.2xlarge"  : "HVM64",
      "d2.4xlarge"  : "HVM64",
      "d2.8xlarge"  : "HVM64",
      "hi1.4xlarge" : "HVM64",
      "hs1.8xlarge" : "HVM64",
      "cr1.8xlarge" : "HVM64",
      "cc2.8xlarge" : "HVM64"
    }

var archToAMINamePattern = {
  "PV64": "amzn-ami-pv*.x86_64-ebs",
  "HVM64": "amzn-ami-hvm*.x86_64-gp2",
  "HVMG2": "amzn-ami-graphics-hvm-*x86_64-ebs*"
};

var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

var describeImagesParams = {
  Filters: [{ Name: "name", Values: [archToAMINamePattern[typeToArch[request.ResourceProperties.InstanceType]]]}],
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
    // Sort images by name in decscending order. The names contain the AMI version, formatted as YYYY.MM.Ver.
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
