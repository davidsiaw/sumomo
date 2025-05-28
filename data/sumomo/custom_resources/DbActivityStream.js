var rds = new aws.RDS();

var kmskeyid = request.ResourceProperties.KmsKeyId;
var dbcluster_arn = request.ResourceProperties.ClusterArn;
var mode = request.ResourceProperties.Mode; // sync or async

function fail(err)
{
  console.log('Errored.');
  console.log(err);
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
}

function success(cidr_string)
{
  Cloudformation.send(
    request,
    context,
    Cloudformation.SUCCESS,
    {},
    "Success",
    cidr_string);
}


if (request.RequestType == "Delete")
{
  params = {
    ResourceArn: dbcluster_arn,
    ApplyImmediately: true
  };

  rds.stopActivityStream(params).promise().then(function(data) {
    success(data.KinesisStreamName)

  }).catch(function(err) {
    fail(err)
  });
}


if (request.RequestType == "Update")
{
  params = {
    DBClusterIdentifier: dbcluster_arn
  };

  rds.describeDBClusters(params).promise().then(function(data) {
    success(data.DBClusters[0].ActivityStreamKinesisStreamName)

  }).catch(function(err) {
    fail(err)
  });
}

if (request.RequestType == "Create")
{
  params = {
    KmsKeyId: kmskeyid,
    Mode: mode,
    ResourceArn: dbcluster_arn,
    ApplyImmediately: true
  };

  rds.startActivityStream(params).promise().then(function(data) {
    success(data.KinesisStreamName)

  }).catch(function(err) {
    fail(err)
  });
}