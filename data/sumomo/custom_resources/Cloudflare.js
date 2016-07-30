var querystring = require('querystring');
var https = require('https');

key = request.ResourceProperties.Key
email = request.ResourceProperties.Email
domain = request.ResourceProperties.Domain
entry = request.ResourceProperties.Entry
cname = request.ResourceProperties.Cname

function get(path, query, on_complete)
{
	var query_string = querystring.stringify(query);

	var get_options = {
		host: 'api.cloudflare.com',
		port: '443',
		path: '/client/v4' + path + "/?" + query_string,
		method: 'GET',
		headers: {
			'X-Auth-Key': key,
			'X-Auth-Email': email
		}
	};

	var req = https.request(get_options, function(res) {
		//console.log('statusCode: ', res.statusCode);
		//console.log('headers: ', res.headers);
		var body = "";
		res.setEncoding('utf8');
		res.on('data', function(d) {
			body += d;
		});
		res.on('end', function() {
			on_complete(JSON.parse(body));
		});
		req.on('error', function(e) {
			console.error(e);
		});
	});
	req.end();
}

function http_request(method, path, data, on_complete)
{
	post_data = JSON.stringify(data);

	var post_options = {
		host: 'api.cloudflare.com',
		port: '443',
		path: '/client/v4' + path,
		method: method,
		headers: {
			'Content-Type': 'application/json',
			'Content-Length': Buffer.byteLength(post_data),
			'X-Auth-Key': key,
			'X-Auth-Email': email
		}
	};

	var req = https.request(post_options, function(res) {
		//console.log('statusCode: ', res.statusCode);
		//console.log('headers: ', res.headers);
		var body = "";
		res.setEncoding('utf8');
		res.on('data', function(d) {
			body += d;
		});
		res.on('end', function() {
			on_complete(JSON.parse(body));
		});
		req.on('error', function(e) {
			console.error(e);
		});
	});
	req.write(post_data);
	req.end();
}

function post(path, data, on_complete)
{
	http_request("POST", path, data, on_complete)
}

function del(path, data, on_complete)
{
	http_request("DELETE", path, data, on_complete)
}

function get_zone_id(zone_name, on_complete)
{
	get("/zones", {name: zone_name}, function (data) 
	{
		on_complete(data["result"][0]["id"])
	});
}

function get_dns_record_named(zone_id, name, on_complete)
{
	get("/zones/"+zone_id+"/dns_records", {name: name}, function (data) 
	{
		on_complete(data["result"])
	});
}

function create_cname_dns_record(zone_id, type, name, content, on_complete)
{
	post("/zones/"+zone_id+"/dns_records", {
		type: type,
		name: name,
		content: content
	}, function(data) {
		on_complete(data)
	});
};

function delete_cname_dns_record(zone_id, record_id, on_complete)
{
	del("/zones/"+zone_id+"/dns_records/"+record_id, {}, function(data) {
		on_complete(data)
	});
};


console.log('REQUEST RECEIVED:\n', JSON.stringify(request));

function send_success(record_id)
{
	Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", record_id);
}

function send_failure(reason)
{
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, reason);
}

function save_data(domain_id, record_id, on_complete, on_error)
{
	store.put("domain_id", domain_id, function() {
		store.put("record_id", record_id, on_complete, on_error);
	}, on_error);
}

function load_data(on_complete, on_error)
{
	store.get("domain_id", function(domain_id) {
		store.get("record_id", function(record_id) {
			on_complete(domain_id, record_id);
		}, on_error);
	}, on_error);
}

if (request.RequestType == "Create") {

	get_zone_id(domain, function(id) 
	{
		get_dns_record_named(id, entry, function(data)
		{
			if (data.length == 0)
			{
				create_cname_dns_record(id, "CNAME", entry, cname, function(data) {
					console.log("CREATE RECORD: " + JSON.stringify(data));
					if (data.result)
					{
						save_data(id, data.result.id, 
							function() {
								send_success(data.result.id)
							}, 
							function() {
								send_failure("Failed to save data")
							}
						);
					}
					else
					{
						send_failure(JSON.stringify(data));
					}
				});
			}
			else
			{
    			send_failure("Entry " + entry + " already exists");
			}
			console.log(data);
		});
	});

    return;
}

if (request.RequestType == "Update") {

	load_data(function(domain_id, record_id) {

		delete_cname_dns_record(domain_id, record_id, function() {
			create_cname_dns_record(domain_id, "CNAME", entry, cname, function(data) {
				console.log(data);
				save_data(domain_id, data.result.id, 
					function() {
						send_success(data.result.id)
					}, 
					function() {
						send_failure("Failed to save data")
					}
				);
			});
		});

	}, send_failure.bind("Failed to load data"));


    return;
}

if (request.RequestType == "Delete") {

	load_data(function(domain_id, record_id) {

		delete_cname_dns_record(domain_id, record_id, function() {
			send_success(record_id)
		});

	}, send_failure.bind("Failed to load data"));
    return;
}
