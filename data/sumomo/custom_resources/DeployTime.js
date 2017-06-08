if (request.RequestType == "Create")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", String((new Date).getTime()));
}

if (request.RequestType == "Update")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", String((new Date).getTime()));
}

if (request.RequestType == "Delete")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", String((new Date).getTime()));
}
