if (request.RequestType == "Create")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", request.ResourceProperties.List.length.toString());
}

if (request.RequestType == "Update")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", request.ResourceProperties.List.length.toString());
}

if (request.RequestType == "Delete")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "0");
}
