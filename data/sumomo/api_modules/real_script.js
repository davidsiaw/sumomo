'use strict';
console.log('Loading API');

var os                  = require('os');
var http                = require('http');
var url                 = require('url');
var merge               = require('utils-merge');
var Router              = require('router');
var aws                 = require("aws-sdk");

var router = Router();

// S3 store
function Storage()
{
    var s3 = new aws.S3({region: "{{ REGION }}"});

    this.get = function(key, onComplete, onError)
    {
        s3.getObject({
            Bucket: "{{ BUCKET }}",
            Key: "data/{{ STORE_PREFIX }}/" + key
        }, function(err, data) {
            if (err)
            {
                if (onError)
                {
                    onError(err);
                }
            }
            else 
            {
                if (onComplete)
                {
                    try
                    {
                        var val = JSON.parse(data.Body.toString());
                        onComplete(val.value);
                    }
                    catch(e)
                    {
                        if (onError)
                        {
                          onError(e);
                        }
                    }
                }
            }
        });
    }

    this.set = function(key, value, onComplete, onError)
    {
        var val = { value: value };

        s3.putObject({
            Bucket: "{{ BUCKET }}",
            Key: "data/{{ STORE_PREFIX }}/" + key,
            Body: JSON.stringify(val)
        }, function(err, data) {
            if (err)
            {
                if (onError)
                {
                    onError(err);
                }
            }
            else 
            {
                if (onComplete)
                {
                    onComplete(key);
                }
            }
        });
    }

    this.list = function(prefix, start_after, onComplete, onError)
    {
        var params = {
            Bucket: "{{ BUCKET }}",
            Prefix: "data/{{ STORE_PREFIX }}/" + prefix
        }

        if (start_after)
        {
            params.StartAfter = start_after;
        }

        s3.listObjectsV2(params, function(err, data) {
            if (err)
            {
                if (onError)
                {
                    onError(err);
                }
            }
            else
            {
                if (onComplete)
                {
                    onComplete(data.Contents.map(function(x){ return x.Key; }));
                }
            }
        });
    }

    return this;
}

var Store = new Storage();

function decode_component(str) {
    str = str.replace(/\+/g, '%20');
    str = decodeURIComponent(str);
    return str;
}

function parseQuery(queryString) {
    try
    {
        var res = JSON.parse(queryString)
        return res;
    }
    catch(e) { }
    var query = {};
    var pairs = queryString.split('&');
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        query[decode_component(pair[0])] = decode_component(pair[1] || '');
    }
    return query;
}

{{ SCRIPT }}

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