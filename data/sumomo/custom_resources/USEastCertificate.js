var acm = new aws.ACM({region: "us-east-1"}); // MUST be us-east-1.

function extractRootDomain(domain)
{
  var splitArr = domain.split('.');
  var arrLen = splitArr.length;

  //extracting the root domain here
  if (arrLen > 2)
  {
      domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
  }
  return domain;
}

function wait_for_approval(domain_name, on_success, on_fail)
{
  setTimeout(function()
  {
    get_domain(domain_name, function(data)
    {
      var params = {
        CertificateArn: data.arn
      };
      acm.describeCertificate(params, function(err, cert_data) {
        if (err)
        {
          on_fail(err);
        }
        else
        {
          if (cert_data.Certificate.DomainValidationOptions[0].ValidationStatus === "SUCCESS")
          {
            on_success(data.arn);
          }
          else if (cert_data.Certificate.DomainValidationOptions[0].ValidationStatus === "FAILED")
          {
            on_fail("Verification Failed");
          }
          else
          {
            wait_for_approval(domain_name, on_success, on_fail);
          }
        }
      });

    }, on_fail);


  }, 3000);
}

function create(domain_name, on_success, on_fail)
{
  var params = {
    DomainName: domain_name,
    DomainValidationOptions: [
      {
        DomainName: domain_name,
        ValidationDomain: extractRootDomain(domain_name)
      },
    ]
  }

  console.log("Requesting Cert");
  acm.requestCertificate(params, function(err, data)
  {
    if (err)
    {
      on_fail(err);
    }
    else
    {
      store.put(domain_name, JSON.stringify({
        domain: domain_name,
        arn: data.CertificateArn
      }), function()
      {
        console.log("Successfully saved data", data);
        wait_for_approval(domain_name, function()
        {
          on_success(data.CertificateArn);
        }, on_fail);
      }, 
      function(err) 
      {
        on_fail(err);
      });
    }
  });
}

function get_domain(domain_name, on_success, on_fail)
{
  store.get(domain_name, function(data)
  {
    on_success(JSON.parse(data));
  },
  function(err)
  {
    on_fail(err);
  });
}

function destroy(domain_name, on_success, on_fail)
{
  get_domain(domain_name, function(data)
  {
    var params = {
      CertificateArn: data.arn
    };

    acm.deleteCertificate(params, function(err, data)
    {
      if (err)
      {
        on_fail(err);
      }
      else
      {
        on_success(data);
      }
    });
  }, on_fail)
}

function fail(err)
{
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
}


if (request.RequestType == "Create")
{
  create(request.ResourceProperties.DomainName, function(data)
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data);
  }, fail);
}

if (request.RequestType == "Update")
{
  if (request.OldResourceProperties.DomainName !== request.ResourceProperties.DomainName)
  {
    create(request.ResourceProperties.DomainName, function(data)
    {
      Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data);
    }, fail);
  }
  else
  {
    get_domain(function(data)
    {
      Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", data.arn);
    }, fail);
  }
}

if (request.RequestType == "Delete")
{
  destroy(request.ResourceProperties.DomainName, function()
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "(deleted)");
  }, 
  function()
  {
    Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", "(don't care)");
  });
}
