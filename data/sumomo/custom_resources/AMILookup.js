
var archToAMINamePattern = {
  "PV64": "amzn-ami-pv*.x86_64-ebs",
  "HVM64": "amzn-ami-hvm*.x86_64-gp2",
  "HVMG2": "amzn-ami-graphics-hvm-*x86_64-ebs*"
};

var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

var describeImagesParams = {
  Filters: [{ Name: "name", Values: [archToAMINamePattern[request.ResourceProperties.Architecture]]}],
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
        break;
    }
    Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", id);
  }
});
