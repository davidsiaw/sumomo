var cert_region = request.ResourceProperties.RegionOverride || request.ResourceProperties.Region;

var acm = new aws.ACM({region: cert_region});

var arn = request.ResourceProperties.Certificate;

function wait_for_approval(on_success, on_fail)
{
  var params = {
    CertificateArn: arn
  };

  acm.describeCertificate(params, function(err, cert_data) {
    console.log('describe certificate data');
    console.log(cert_data);;
    if (err)
    {
      on_fail(err);
    }
    else
    {
      if (cert_data.Certificate.DomainValidationOptions[0].ValidationStatus === "SUCCESS")
      {
        on_success();
      }
      else if (cert_data.Certificate.DomainValidationOptions[0].ValidationStatus === "FAILED")
      {
        on_fail("Verification Failed");
      }
      else
      {
        setTimeout(function()
        {
          wait_for_approval(on_success, on_fail);
        }, 3000);
      }
    }
  });
}

function fail(err)
{
  console.log('Errored.');
  console.log(err);
  Cloudformation.send(request, context, Cloudformation.FAILED, {}, "Error: " + err);
}

function success()
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success");
}

if (request.RequestType == "Create")
{
  wait_for_approval(success, fail);
}

if (request.RequestType == "Update")
{
  wait_for_approval(success, fail);
}

if (request.RequestType == "Delete")
{
  success();
}
