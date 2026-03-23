var aws = require("aws-sdk");
const { URL } = require('url');

Cloudformation = {}
Cloudformation.SUCCESS = "SUCCESS";
Cloudformation.FAILED = "FAILED";
Cloudformation.status_sent = false;
Cloudformation.send = function(request, context, responseStatus, responseData, reason, physicalResourceId) {
 
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: physicalResourceId === undefined ? context.logStreamName : physicalResourceId,
        StackId: request.StackId,
        RequestId: request.RequestId,
        LogicalResourceId: request.LogicalResourceId,
        NoEcho: false,
        Data: responseData
    });

    console.log("response to cloudformation:\n", responseBody);
 
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

    console.log("response to cloudformation params:\n", options);
 
    var request = https.request(options, function(response) {
        console.log("Status code: " + response.statusCode);
        console.log("Status message: " + response.statusMessage);
        Cloudformation.status_sent = true;
    });
 
    request.on("error", function(error) {
        console.log("send(..) failed executing https.request(..): " + error);
        Cloudformation.status_sent = true;
    });
 
    console.log("sending response to cloudformation");
    request.write(responseBody);
    request.end();
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

    console.log("store.get");
    s3.getObject({
      Bucket: bucket,
      Key: "data/" + prefix + "/" + key
    }, function(err, data) {
      console.log("store.get calback");
      if (err)
      {
        if (onError)
        {
          console.log("store.get onerror");
          onError(err);
        }
        else
        {
          console.log("store.get throw error");
          throw(err);
        }
      } 
      else 
      {
        console.log("store.get completed");
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

exports.handler = async function(request, context)
{
  console.log("Request:");
  console.log(request);
  console.log("Context:");
  console.log(context);
  
  Global.request = request;
  Global.context = context;
  var store = Storage(request.ResourceProperties.Bucket, request.LogicalResourceId, request.ResourceProperties.Region);

  setTimeout(function()
  {
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
  }, 0);

  const sleep = ms => new Promise(res => setTimeout(res, ms));

  while(!Cloudformation.status_sent) {
    console.log('await finish');
    await sleep(1000);
  }

  await sleep(2000);
}
