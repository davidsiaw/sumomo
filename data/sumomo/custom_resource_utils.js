var aws = require("aws-sdk");

Cloudformation = {}
Cloudformation.SUCCESS = "SUCCESS";
Cloudformation.FAILED = "FAILED";
Cloudformation.status_sent = false;
Cloudformation.send = function(request, context, responseStatus, responseData, reason, physicalResourceId) {
 
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: reason + " Log Stream: " + context.logStreamName,
        PhysicalResourceId: physicalResourceId === undefined ? context.logStreamName : physicalResourceId,
        StackId: request.StackId,
        RequestId: request.RequestId,
        LogicalResourceId: request.LogicalResourceId,
        Data: responseData
    });
 
    console.log("Response body:\n", responseBody);
 
    var https = require("https");
    var url = require("url");
 
    var parsedUrl = url.parse(request.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };
 
    var request = https.request(options, function(response) {
        console.log("Status code: " + response.statusCode);
        console.log("Status message: " + response.statusMessage);
        context.done();
    });
 
    request.on("error", function(error) {
        console.log("send(..) failed executing https.request(..): " + error);
        context.done();
    });
 
    request.write(responseBody);
    request.end();
    Cloudformation.status_sent = true;
}

function Storage(bucket, prefix, region)
{
  var s3 = new aws.S3({region: region});

  this.put = function(key, value, onComplete, onError) {

    s3.putObject({
      Bucket: bucket,
      Key: "data/" + prefix + "/" + key,
      Body: value
    }, function(err, data) {
      if (err) 
      {
        if (onError)
        {
          onError(err);
        }
        else
        {
          throw(err);
        }
      } 
      else 
      {
        if (onComplete)
        {
          onComplete();
        }
      }   
    })
  }

  this.get = function(key, onComplete, onError) {

    s3.getObject({
      Bucket: bucket,
      Key: "data/" + prefix + "/" + key
    }, function(err, data) {
      if (err)
      {
        if (onError)
        {
          onError(err);
        }
        else
        {
          throw(err);
        }
      } 
      else 
      {
        if (onComplete)
        {
          onComplete(data.Body.toString());
        }
      }   
    })
  }

  return this;
}

Global = {}

process.on('uncaughtException', function(err) {
  console.log("Sending the following error to cloudformation: ");
  console.log(err);
  Cloudformation.send(Global.request, Global.context, Cloudformation.FAILED, {}, err);
});

process.on('exit', function() {
  if (!Cloudformation.status_sent)
  {
    console.log("No status sent to cloudformation, assuming FAILED");
    Cloudformation.send(Global.request, Global.context, Cloudformation.FAILED, {}, "No status sent to cloudformation");
  }
});

exports.handler = function(request, context)
{
  console.log("Request:");
  console.log(request);
  console.log("Context:");
  console.log(context);
  
  Global.request = request;
  Global.context = context;
  var store = Storage(request.ResourceProperties.Bucket, request.LogicalResourceId, request.ResourceProperties.Region);

  try
  {
      {{ CODE }}
  }
  catch (err)
  {
      console.log("Sending the following error to cloudformation: ");
      console.log(err);
      Cloudformation.send(request, context, Cloudformation.FAILED, {}, err);
  }
}
