function success()
{
  Cloudformation.send(
    request,
    context,
    Cloudformation.SUCCESS,
    {},
    "Success",
    request.ResourceProperties.Value);
}

if (request.RequestType == "Create")
{
  success()
}

if (request.RequestType == "Update")
{
  success()
}

if (request.RequestType == "Delete")
{
  success()
}
