
var typeToArch = {
       "c1.medium": "PV64",
       "c1.xlarge": "PV64",
      "c3.2xlarge": "HVM64",
      "c3.4xlarge": "HVM64",
      "c3.8xlarge": "HVM64",
        "c3.large": "HVM64",
       "c3.xlarge": "HVM64",
      "c4.2xlarge": "HVM64",
      "c4.4xlarge": "HVM64",
      "c4.8xlarge": "HVM64",
        "c4.large": "HVM64",
       "c4.xlarge": "HVM64",
     "c5.18xlarge": "HVM64",
      "c5.2xlarge": "HVM64",
      "c5.4xlarge": "HVM64",
      "c5.9xlarge": "HVM64",
        "c5.large": "HVM64",
       "c5.xlarge": "HVM64",
    "c5d.18xlarge": "HVM64",
     "c5d.2xlarge": "HVM64",
     "c5d.4xlarge": "HVM64",
     "c5d.9xlarge": "HVM64",
       "c5d.large": "HVM64",
      "c5d.xlarge": "HVM64",
     "cc2.8xlarge": "HVM64",
     "cr1.8xlarge": "HVM64",
      "d2.2xlarge": "HVM64",
      "d2.4xlarge": "HVM64",
      "d2.8xlarge": "HVM64",
       "d2.xlarge": "HVM64",
     "f1.16xlarge": "HVM64",
      "f1.2xlarge": "HVM64",
      "f1.4xlarge": "HVM64",
      "g2.2xlarge": "HVMG2",
      "g2.8xlarge": "HVMG2",
     "g3.16xlarge": "HVMG2",
      "g3.4xlarge": "HVMG2",
      "g3.8xlarge": "HVMG2",
     "h1.16xlarge": "HVM64",
      "h1.2xlarge": "HVM64",
      "h1.4xlarge": "HVM64",
      "h1.8xlarge": "HVM64",
     "hs1.8xlarge": "HVM64",
      "i2.2xlarge": "HVM64",
      "i2.4xlarge": "HVM64",
      "i2.8xlarge": "HVM64",
       "i2.xlarge": "HVM64",
     "i3.16xlarge": "HVM64",
      "i3.2xlarge": "HVM64",
      "i3.4xlarge": "HVM64",
      "i3.8xlarge": "HVM64",
        "i3.large": "HVM64",
        "i3.metal": "HVM64",
       "i3.xlarge": "HVM64",
        "m1.large": "PV64",
       "m1.medium": "PV64",
        "m1.small": "PV64",
       "m1.xlarge": "PV64",
      "m2.2xlarge": "PV64",
      "m2.4xlarge": "PV64",
       "m2.xlarge": "PV64",
      "m3.2xlarge": "HVM64",
        "m3.large": "HVM64",
       "m3.medium": "HVM64",
       "m3.xlarge": "HVM64",
     "m4.10xlarge": "HVM64",
     "m4.16xlarge": "HVM64",
      "m4.2xlarge": "HVM64",
      "m4.4xlarge": "HVM64",
        "m4.large": "HVM64",
       "m4.xlarge": "HVM64",
     "m5.12xlarge": "HVM64",
     "m5.24xlarge": "HVM64",
      "m5.2xlarge": "HVM64",
      "m5.4xlarge": "HVM64",
        "m5.large": "HVM64",
       "m5.xlarge": "HVM64",
    "m5d.12xlarge": "HVM64",
    "m5d.24xlarge": "HVM64",
     "m5d.2xlarge": "HVM64",
     "m5d.4xlarge": "HVM64",
       "m5d.large": "HVM64",
      "m5d.xlarge": "HVM64",
     "p2.16xlarge": "HVM64",
      "p2.8xlarge": "HVM64",
       "p2.xlarge": "HVM64",
     "p3.16xlarge": "HVM64",
      "p3.2xlarge": "HVM64",
      "p3.8xlarge": "HVM64",
      "r3.2xlarge": "HVM64",
      "r3.4xlarge": "HVM64",
      "r3.8xlarge": "HVM64",
        "r3.large": "HVM64",
       "r3.xlarge": "HVM64",
     "r4.16xlarge": "HVM64",
      "r4.2xlarge": "HVM64",
      "r4.4xlarge": "HVM64",
      "r4.8xlarge": "HVM64",
        "r4.large": "HVM64",
       "r4.xlarge": "HVM64",
     "r5.12xlarge": "HVM64",
     "r5.24xlarge": "HVM64",
      "r5.2xlarge": "HVM64",
      "r5.4xlarge": "HVM64",
        "r5.large": "HVM64",
       "r5.xlarge": "HVM64",
    "r5d.12xlarge": "HVM64",
    "r5d.24xlarge": "HVM64",
     "r5d.2xlarge": "HVM64",
     "r5d.4xlarge": "HVM64",
       "r5d.large": "HVM64",
      "r5d.xlarge": "HVM64",
        "t1.micro": "PV64",
      "t2.2xlarge": "HVM64",
        "t2.large": "HVM64",
       "t2.medium": "HVM64",
        "t2.micro": "HVM64",
         "t2.nano": "HVM64",
        "t2.small": "HVM64",
       "t2.xlarge": "HVM64",
      "t3.2xlarge": "HVM64",
        "t3.large": "HVM64",
       "t3.medium": "HVM64",
        "t3.micro": "HVM64",
         "t3.nano": "HVM64",
        "t3.small": "HVM64",
       "t3.xlarge": "HVM64",
     "x1.16xlarge": "HVM64",
     "x1.32xlarge": "HVM64",
    "x1e.16xlarge": "HVM64",
     "x1e.2xlarge": "HVM64",
    "x1e.32xlarge": "HVM64",
     "x1e.4xlarge": "HVM64",
     "x1e.8xlarge": "HVM64",
      "x1e.xlarge": "HVM64",
    "z1d.12xlarge": "HVM64",
     "z1d.2xlarge": "HVM64",
     "z1d.3xlarge": "HVM64",
     "z1d.6xlarge": "HVM64",
       "z1d.large": "HVM64",
      "z1d.xlarge": "HVM64",
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
