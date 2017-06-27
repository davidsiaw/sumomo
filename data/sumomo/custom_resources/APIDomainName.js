var apigateway = new aws.APIGateway({region: request.ResourceProperties.Region});

var params = {
  domainName: request.ResourceProperties.DomainName
}

if (request.ResourceProperties.CertificateArn)
{
  params.certificateArn = request.ResourceProperties.CertificateArn;
}

function createName(onSuccess, onFail)
{
  apigateway.createDomainName(params, function(err, data)
  {
    if (err)
    {
      console.log(err, err.stack);
      onFail(err);
    }
    else
    {
      store.put("domainName", request.ResourceProperties.DomainName, function()
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
  store.get("domainName", function(name)
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
  deleteName(function(name)
  {
    createName(function(data)
    {
      Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data.domainName);
    },
    function(err)
    {
      Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
    });
  }, 
  function(err)
  {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
  });
}

if (request.RequestType == "Delete")
{
  deleteName(function(name)
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "0");
  }, 
  function(err)
  {
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
  });
}
