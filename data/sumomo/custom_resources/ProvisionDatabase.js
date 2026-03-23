var rdsdataservice = new aws.RDSDataService({region: request.ResourceProperties.Region});

var SecretArn = request.ResourceProperties.SecretArn;
var DbArn = request.ResourceProperties.DbArn;
var SqlStatement = request.ResourceProperties.SqlStatement;

// optionals
var DatabaseName = request.ResourceProperties.DatabaseName;
var SchemaName = request.ResourceProperties.SchemaName;

function success()
{
  Cloudformation.send(
    request,
    context,
    Cloudformation.SUCCESS,
    {},
    "Success",
    DbArn);
}

function fail(err)
{
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
}

if (request.RequestType == "Create")
{
  var params = {
    secretArn: SecretArn, /* required */
    resourceArn: DbArn, /* required */
    sql: SqlStatement /* required */
  };

  if (DatabaseName) { params.database = DatabaseName; }
  if (SchemaName) { params.schema = SchemaName; }

  console.log("Begin execute SQL with params", params);
  rdsdataservice.executeStatement(params, function(err, data) {
  	console.log("inside execute sql");
    if (err)
    {
      console.log("Error occurred", err, err.stack); // an error occurred
      fail(err);
    }
    else
    {
      console.log("Completed", data);           // successful response
      success();
    }
  });
}

if (request.RequestType == "Update")
{
  // no-op. only used during create
  success();
}

if (request.RequestType == "Delete")
{
  // no-op. only used during create
  success();
}
