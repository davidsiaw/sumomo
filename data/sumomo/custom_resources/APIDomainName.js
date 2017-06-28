var apigateway = new aws.APIGateway({region: request.ResourceProperties.Region});

var params = {
  domainName: request.ResourceProperties.DomainName
}

function createName(onSuccess, onFail)
{
  if (request.ResourceProperties.CertificateArn)
  {
    params.certificateArn = request.ResourceProperties.CertificateArn;
  }
  else
  {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Parameter CertificateArn is missing");
    return;
  }

  apigateway.createDomainName(params, function(err, data)
  {
    if (err)
    {
      console.log(err, err.stack);
      onFail(err);
    }
    else
    {
      store.put(request.ResourceProperties.DomainName, request.ResourceProperties.DomainName, function()
      {
        onSuccess(data);
      }, 
      function(err) 
      {
        onFail(err);
      });
    }
  });
}

function deleteName(onSuccess, onFail)
{
  store.get(request.ResourceProperties.DomainName, function(name)
  {
    apigateway.deleteDomainName({
      domainName: name

    }, function(err, data)
    {
      if (err)
      {
        onFail(err);
      }
      else
      {
        onSuccess(name);
      }
    });
  },
  function(err)
  {
    onFail(err);
  });
}

if (request.RequestType == "Create")
{
  createName(function(data)
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data.domainName);
  },
  function(err)
  {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
  });
}

if (request.RequestType == "Update")
{
  if (request.OldResourceProperties.DomainName !== request.ResourceProperties.DomainName)
  {
    createName(function(data)
    {
      Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data.domainName);
    },
    function(err)
    {
      Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
    });
  }
}

if (request.RequestType == "Delete")
{
  deleteName(function(name)
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "");
  }, 
  function(err)
  {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
  });
}
