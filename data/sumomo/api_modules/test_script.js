'use strict';
console.log('Loading API');

var os           = require('os');
var finalhandler = require('finalhandler');
var http         = require('http');
var url          = require('url');
var merge        = require('utils-merge');
var Router       = require('router')
var fs           = require('fs')

// Simulated store
function Storage()
{
	var store = {}

	try
	{
		var store_contents = fs.readFileSync(".store")
		store = JSON.parse(store_contents)
	}
	catch (e)
	{
		console.log("Error reading .store; will start with blank store")
		console.log(e)
	}

	this.get = function(key, onComplete, onError)
	{
		if (store[key] === undefined)
		{
			if (onError)
			{
				onError({err: "no_such_key"});
			}
		}
		else
		{
			if (onComplete)
			{
				onComplete(store[key]);
			}
		}
	}

	this.set = function(key, value, onComplete, onError)
	{
		store[key] = value;
		fs.writeFile(".store", JSON.stringify(store), function()
		{
			if (onComplete)
			{
				onComplete(key);
			}
		})
	}

	return this;
}

var Store = new Storage();

var router = Router();

var response_sent = false;

var server = http.createServer(function(req, res) {

	var request = {
		_native_req: req,
		url: req.url,
		method: req.method,
		params: {}
	}

 	router(request, res, function(err) {

		res.statusCode = 404;
		res.end(JSON.stringify({message: "File not found"}));
 	});
});

function parseQuery(queryString) {
	try
	{
		var res = JSON.parse(queryString)
		return res;
	}
	catch(e) { }
    var query = {};
    var pairs = (queryString[0] === '?' ? queryString.substr(1) : queryString).split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    return query;
}

{{ SCRIPT }}

// Simulate API Gateway Lambda Proxy Event
function prepare(handler)
{
	return function(request, res)
	{
		var body = [];
		var req = request._native_req;

		function callback(exception, response)
		{
			if (response.headers)
			{
				for (var key in response.headers)
				{
					res.setHeader(key, response.headers[key]);
				}
			}
			res.statusCode = response.statusCode || 404;
			res.end(response.body || null);
		}

		req.on('data', function(chunk) {
			body.push(chunk);

		}).on('end', function() {

			var completed_body = Buffer.concat(body).toString();

			var parsed_url = url.parse(req.url, true);

			var headers = {};

			headers["Accept"] = "*/*";
			headers["CloudFront-Forwarded-Proto"] = "https";
			headers["CloudFront-Is-Desktop-Viewer"] = "true";
			headers["CloudFront-Is-Mobile-Viewer"] = "false";
			headers["CloudFront-Is-SmartTV-Viewer"] = "false";
			headers["CloudFront-Is-Tablet-Viewer"] = "false";
			headers["CloudFront-Viewer-Country"] = "US";
			headers["Content-Type"] = "";
			headers["Host"] = "";
			headers["User-Agent"] = "";
			headers["Via"] = "1.1 1234567890abcdefghijklmnopqrstuv.cloudfront.net (CloudFront)";
			headers["X-Amz-Cf-Id"] = "0000000000000000000000000-000000000-000000000000000000==";
			headers["X-Amzn-Trace-Id"] = "Root=1-00000000-ffffffffffffffffffffffff";
			headers["X-Forwarded-For"] = req.connection.remoteAddress;
			headers["X-Forwarded-Port"] = "443";
			headers["X-Forwarded-Proto"] = "https";

			for(var key in req.headers)
			{
				var uppercased = key.replace(/(^|-)[a-z]/g, function(text){ return text.toUpperCase(); });

				headers[uppercased] = req.headers[key];
			}

			var request_event = {
				resource: "/{proxy+}",
				path: parsed_url.pathname,
				httpMethod: req.method,
				headers: headers,
				queryStringParameters: url.parse(req.url, true).query,
				pathParameters: request.params,
				stageVariables: null,
				requestContext: {
					path: parsed_url.pathname,
					accountId: "000000000000",
					resourceId: "123abc",
					stage: "test",
					requestId: "00000000-0000-0000-0000-000000000000",
					identity: {
						cognitoIdentityId: null,
						accountId: null,
						cognitoIdentityId: null,
						caller: null,
						apiKey: "",
						sourceIp: req.connection.remoteAddress,
						accessKey: null,
						cognitoAuthenticationType: null,
						cognitoAuthenticationProvider: null,
						userArn: null,
						userAgent: headers["User-Agent"],
						user: null

					},
					resourcePath: "/{proxy+}",
					httpMethod: req.method,
					apiId: "12345abcde"
				},

				body: completed_body,
				isBase64Encoded: false

			};

			req._native_req = undefined;

 			try
 			{
		 		handler(request_event, callback);
 			}
 			catch (e)
 			{
				console.log(e);
				callback(e, {
		 			statusCode: 500, 
		 			body: JSON.stringify({message: "Internal Server Error"}, null, 2)
				});
 			}
		});
	};
}

// {{ ROUTES }}

console.log("Listening on port 5000")
server.listen(5000)
