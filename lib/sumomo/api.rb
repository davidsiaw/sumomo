
module Sumomo
  module Stack


    class APIGenerator
      def initialize(&block)
        @methods = {}
        instance_eval(&block)
      end

      def method_missing(name, *args, &block)
        "#{name}".split("_").each do |meth|
          valid_methods = ["GET", "PUT", "POST", "PATCH", "DELETE", "HEAD", "OPTIONS"]
          if valid_methods.include?("#{meth}")
            path = args[0]
            @methods[path] = {} if !@methods.has_key?(path)
            
            @methods[path][meth] = { script: args.last, params: args.select{|arg| arg.is_a?(Symbol) && /\A[a-zA-Z\-0-9_]+\Z/.match("#{arg}") } }
          else
            super
          end
        end
      end

      def generate
        result = ""
        @methods.each do |path, resource|
            resource.each do |method, method_info|

                parameter_list = method_info[:params].join(", ")
                parameter_call_list = method_info[:params].map{|parm| "params['#{parm}']"}.join(", ")

                result += <<-SCRIPT

    router.#{method.downcase}('#{path}', prepare(function (event, callback) {

      var retval = {};

      var params = merge(event.queryStringParameters || {}, event.pathParameters || {});

      function respond_with(response_object, response_status)
      {
        var response = {
          statusCode: response_status || 200,
          headers: {
              "Content-Type" : "application/json; charset=utf-8"
          },
          body: JSON.stringify(response_object)
        };

        callback(null, response);
      }

      var retval = function (#{parameter_list}) {
        #{method_info[:script]}
      }( #{ parameter_call_list } );

    }));

              SCRIPT
            end
          end
        result
      end
    end

    def make_api(domain_name, name:, script:nil, dns:nil, cert:nil, &block)

        api = make "AWS::ApiGateway::RestApi", name: name do
            Name name
        end

        script ||= <<-SCRIPT

    'use strict';
    console.log('Loading API');

    var os                  = require('os');
    var http                = require('http');
    var url                 = require('url');
    var merge               = require('utils-merge');
    var Router              = require('router')

    var router = Router();

    function prepare(handler)
    {
        return function(request, callback)
        {
            try 
            {
                request._native_req.pathParameters = request.params
                handler(request._native_req, callback);
            }
            catch (e)
            {
                console.log(e);
                callback(e, {
                    statusCode: 500, 
                    body: JSON.stringify({message: "Internal Server Error"}, null, 2)
                });
            }
        }
    }

    // {{ ROUTES }}

    exports.handler = function(event, context, callback) {

        var request = {
            _native_req: event,
            url: "https://something" + event.path,
            method: event.httpMethod,
            params: {}
        }

        console.log(request);

        router(request, callback, function(err) {
            callback(null, {
                statusCode: 404, 
                body: JSON.stringify({message: "File not found"}, null, 2)
            })
        });
    };
    SCRIPT

        apigen = APIGenerator.new(&block);
        script.sub!("// {{ ROUTES }}", apigen.generate);

        module_dir = File.join(Gem.datadir("sumomo"), "api_modules")

        files = Dir[File.join(module_dir, "**/*")].select{|x| File.file?(x)}.map do |x| 
            { name: x.sub(/^#{module_dir}\//, ""), code: File.read(x) } 
        end

        files += [ {name:"index.js", code:script} ]

        fun = make_lambda(name: "#{name}Lambda#{@version_number}", files:files)

        resource = make "AWS::ApiGateway::Resource", name: "#{name}Resource" do
            ParentId api.RootResourceId
            PathPart "{proxy+}"
            RestApiId api
        end

        meth = make "AWS::ApiGateway::Method", name: "#{name}MethodOther" do
            RestApiId api
            ResourceId resource
            HttpMethod "ANY"
            AuthorizationType "NONE"
            Integration ({
                Type: "AWS_PROXY",
                IntegrationHttpMethod: "POST",
                Uri: call("Fn::Join", "", ["arn:aws:apigateway:" ,ref("AWS::Region") ,":lambda:path", "/2015-03-31/functions/", fun.Arn, "/invocations"])
            })
        end

        meth2 = make "AWS::ApiGateway::Method", name: "#{name}MethodRoot" do
            RestApiId api
            ResourceId api.RootResourceId
            HttpMethod "ANY"
            AuthorizationType "NONE"
            Integration ({
                Type: "AWS_PROXY",
                IntegrationHttpMethod: "POST",
                Uri: call("Fn::Join", "", ["arn:aws:apigateway:" ,ref("AWS::Region") ,":lambda:path", "/2015-03-31/functions/", fun.Arn, "/invocations"])
            })
        end

        make "AWS::Lambda::Permission", name: "#{name}LambdaPermission" do
            FunctionName fun.Arn
            Action "lambda:InvokeFunction"
            Principal "apigateway.amazonaws.com"
        end

        deployment = make "AWS::ApiGateway::Deployment", name: "#{name}Deployment#{@version_number}" do
            depends_on meth
            depends_on meth2
            RestApiId api
        end

        stage = make "AWS::ApiGateway::Stage", name: "#{name}Stage" do
            RestApiId api
            DeploymentId deployment
            StageName "test"
        end

        root_name = /(?<root_name>[^.]+\.[^.]+)$/.match(domain_name)[:root_name]

        cert ||= make "Custom::USEastCertificate", name: "#{name}Certificate" do
            DomainName domain_name
        end

        domain = make "Custom::APIDomainName", name: "#{name}DomainName" do
            DomainName domain_name
            CertificateArn cert
        end

        make "AWS::ApiGateway::BasePathMapping", name: "#{name}BasePathMapping" do
            BasePath "(none)"
            DomainName domain
            RestApiId api
            Stage stage
        end

        if dns[:type] == :cloudflare
            make "Custom::CloudflareDNSEntry", name: "#{name}CloudFlareEntry" do
                Key dns[:key]
                Email dns[:email]
                Domain root_name
                Entry domain_name.sub(/#{root_name}$/, "").chomp(".")
                CNAME call("Fn::Join", "", [api, ".execute-api.", ref("AWS::Region"), ".amazonaws.com"])
            end
            domain_name
        elsif dns[:type] == :route53
            make "AWS::Route53::RecordSet", name: "#{name}Route53Entry" do
                HostedZoneId dns[:hosted_zone]
                Name domain_name
                Type "CNAME"
            end
            domain_name
        else
            call("Fn::Join", "", [api, ".execute-api.", ref("AWS::Region"), ".amazonaws.com"])
        end
        
    end

    def cloudflare_dns(key:, email:)
        {type: :cloudflare, key: key, email: email}
    end

    def route53_dns(hosted_zone:)
        {type: :route53, hosted_zone: hosted_zone}
    end

  end
end