'use strict';
console.log('Loading API');

var os                  = require('os');
var http                = require('http');
var url                 = require('url');
var merge               = require('utils-merge');
var Router              = require('router')

var router = Router();

function prepare(handler)
{
    return function(request, callback)
    {
        try 
        {
            request._native_req.pathParameters = request.params
            handler(request._native_req, callback);
        }
        catch (e)
        {
            console.log(e);
            callback(e, {
                statusCode: 500, 
                body: JSON.stringify({message: "Internal Server Error"}, null, 2)
            });
        }
    }
}

// {{ ROUTES }}

exports.handler = function(event, context, callback) {

    var request = {
        _native_req: event,
        url: "https://something" + event.path,
        method: event.httpMethod,
        params: {}
    }

    console.log(request);

    router(request, callback, function(err) {
        callback(null, {
            statusCode: 404, 
            body: JSON.stringify({message: "File not found"}, null, 2)
        })
    });
};