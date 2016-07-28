var aws = require("aws-sdk");

Cloudformation = {}
Cloudformation.SUCCESS = "SUCCESS";
Cloudformation.FAILED = "FAILED";
Cloudformation.send = function(request, context, responseStatus, responseData, reason, physicalResourceId) {
 
    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: reason + " Log Stream: " + context.logStreamName,
        PhysicalResourceId: physicalResourceId || context.logStreamName,
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
}

Storage = {}
Storage.put = function(key, value) {

}

Storage.get = function(key) {

}

Storage.del = function(key) {

}