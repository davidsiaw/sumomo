var s3 = new aws.S3();
var name = request.ResourceProperties.BucketName;
var copy_from_dir = request.ResourceProperties.CopyFromDirectory;
var copy_from_bucket = request.ResourceProperties.CopyFromBucket;
var success_obj = {
  Arn: "arn:aws:s3:::" + name,
  DomainName: name + ".s3.amazonaws.com"
}
var error_extra = "";

function copy_file(from, from_bucket, to, to_bucket, success, fail)
{
  s3.copyObject(
    { 
      CopySource: "/" + from_bucket + "/" + from,
      Bucket: to_bucket,
      Key: to
    }, function(err, data)
    {
      if (err)
      {
        error_extra = "\nCopyobject: " + from + " " + from_bucket + " " + to + " " + to_bucket
        fail(err);
      }
      else
      {
        success(data);
      }
    }
  );
}

function actually_copy_files(files_left, success, fail)
{
  if (files_left.length == 0) { return success(); }

  var filename = files_left.shift();

  copy_file(
    filename,
    copy_from_bucket,
    filename.replace(copy_from_dir + '/', ''),
    name,
    function()
    {
      actually_copy_files(files_left, success, fail);
    },
    fail
  )
}

function copy_files(success, fail)
{
  if (!copy_from_dir || !copy_from_bucket) { return success(); }

  var files_to_copy = [];

  foreach_file(
    copy_from_bucket,
    function(file)
    {
      if (file.Key.indexOf(copy_from_dir) == 0)
      {
        files_to_copy.push(file.Key);
      }
    },
    function()
    {
      actually_copy_files(files_to_copy, success, fail);
    },
    fail
  );
}

function create_bucket(name, success, fail)
{
  var create_params = { Bucket: name };

  s3.createBucket(create_params, function(err, data)
  {
    if (err)
    {
      fail(err);
    }
    else
    {
      copy_files(success, fail);
    }
  });
}

function foreach_file(name, func, success, fail)
{
  var foreach_params = { Bucket: name };

  s3.listObjects(foreach_params, function (err, data)
  {
    if (err)
    {
      fail(err);
      return;
    }

    var items = data.Contents;

    for (var i = 0; i < items.length; i += 1)
    {
      func(items[i])
    }

    success();
  });
}

function delete_files(name, files, success, fail)
{
  var delete_files_params = {
    Bucket: name,
    Delete: {
      Objects: files,
      Quiet: false
    }
  }

  if (files.length == 0)
  {
    // If the array has zero size, AWS throws a malformed
    // XML error, which makes no sense but that is what
    // happens.
    return success();
  }

  s3.deleteObjects(delete_files_params, function(err, data)
  {
    if (err)
    {
      fail("DELETE FILES FAILED:" + err + "\n" + JSON.stringify(delete_files_params) + "\n");
      return;
    }

    success();
  });
}

function delete_bucket(name, success, fail)
{
  var delete_bucket_params = { Bucket: name };

  s3.deleteBucket(delete_bucket_params, function(err, data)
  {
    if (err)
    {
      fail("DELETE BUCKET FAILED:" + err + "\n" + JSON.stringify(delete_bucket_params) + "\n");
    }
    else
    {
      success(data);
    }
  });
}

function send_success()
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, success_obj, "Success", name);
}

function send_fail(err)
{
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err) + "\n" + error_extra);
}

function delete_all_files(success, fail)
{
  var objects = [];
  foreach_file(
    name,
    function(file)
    {
      objects.push({ Key: file.Key });
    },
    function()
    {
      delete_files(name, objects,
        function()
        {
          delete_bucket(name, success, fail);
        },
        fail
      );
    },
    fail
  )
}

if (request.RequestType == "Create")
{
  create_bucket(name, send_success, send_fail);
}

if (request.RequestType == "Update")
{
  send_success();
}

if (request.RequestType == "Delete")
{
  delete_all_files(send_success, send_fail);
}
