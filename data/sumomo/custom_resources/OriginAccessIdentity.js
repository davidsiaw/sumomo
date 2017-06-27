
var cloudfront = new aws.CloudFront({region: request.ResourceProperties.Region});

function randomIntInc (low, high)
{
    return Math.floor(Math.random() * (high - low + 1) + low);
}

function randomNumber()
{
  var numbers = new Array(10);
  for (var i = 0; i < numbers.length; i++)
  {
      numbers[i] = randomIntInc(1,10);
  }
  return numbers.join("");
}

function request_identity(ref, onSuccess, onError)
{
  var params = {
    CloudFrontOriginAccessIdentityConfig: {
      CallerReference: ref,
      Comment: request.ResourceProperties.Comment || "No Comment Specified"
    }
  }

  cloudfront.createCloudFrontOriginAccessIdentity(params, function(err, data) {
    if (err)
    {
      onError(err);
    }
    else
    {
      onSuccess(data);
    }
  });
}

if (request.RequestType == "Create")
{
  var ref = randomNumber();
  store.put("oai_ref", ref, function() {
    request_identity(ref, 
      function(data)
      {
        console.log(data);
        Cloudformation.send(request, context, Cloudformation.SUCCESS, {
          Id: data.CloudFrontOriginAccessIdentity.Id,
          S3CanonicalUserId: data.CloudFrontOriginAccessIdentity.S3CanonicalUserId
        }, "Success", "origin-access-identity/cloudfront/" + data.CloudFrontOriginAccessIdentity.Id);

      }, function(err)
      {
        console.log(err, err.stack);
        Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
      });
  }, function(err) {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Cannot Store OAI Reference");
  });
}

if (request.RequestType == "Update")
{
  store.get("oai_ref", function(ref) {
    request_identity(ref, 
      function(data)
      {
        console.log(data);
        Cloudformation.send(request, context, Cloudformation.SUCCESS, {
          Id: data.CloudFrontOriginAccessIdentity.Id,
          S3CanonicalUserId: data.CloudFrontOriginAccessIdentity.S3CanonicalUserId
        }, "Success", "origin-access-identity/cloudfront/" + data.CloudFrontOriginAccessIdentity.Id);

      }, function(err)
      {
        console.log(err, err.stack);
        Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
      });
  }, function(err) {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Cannot Load OAI Reference");
  });
}

if (request.RequestType == "Delete")
{
  store.get("oai_ref", function(ref) {
    request_identity(ref, 
      function(data)
      {
        var params = {
          Id: data.CloudFrontOriginAccessIdentity.Id,
        };
        cloudfront.deleteCloudFrontOriginAccessIdentity(params, function(err, data) {
          if (err)
          {
            console.log(err, err.stack);
            Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
          }
          else
          {
            Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "" );
          }
        });

      }, function(err)
      {
        console.log(err, err.stack);
        Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
      });

  }, function(err) {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Cannot Load OAI Reference");
  });
}
