# frozen_string_literal: true

require 'sumomo/irregular'

module Sumomo
  module Stack
    class APIGenerator
      extend HasIrregularlyNamedFunctions

      class CorsInfo
        extend HasIrregularlyNamedFunctions
        attr_accessor :allowed_origins, :allowed_headers

        def apply(&block)
          @allowed_origins = []
          @allowed_headers = []
          instance_eval(&block) if block
        end

        defi :AllowOrigin do |value|
          @allowed_origins << value
        end

        defi :AllowHeader do |value|
          @allowed_headers << value
        end
      end

      def initialize(pretty_print: false, &block)
        @methods = {}
        @cors = CorsInfo.new
        @script = ''
        # defaults
        @cors.apply do
          AllowOrigin '*'
          AllowHeader 'origin'
          AllowHeader 'content-type'
          AllowHeader 'accept'
          AllowHeader 'cache-control'
          AllowHeader 'x-requested-with'
          AllowHeader 'if-modified-since'
        end
        @pretty_print = pretty_print
        instance_eval(&block)
      end

      def method_missing(name, *args, &block)
        name.to_s.split('_').each do |meth|
          valid_methods = %w[GET PUT POST PATCH DELETE HEAD OPTIONS]
          if valid_methods.include?(meth.to_s)
            path = args[0]
            @methods[path] = {} unless @methods.key?(path)

            @methods[path][meth] = { script: args.last, params: args.select { |arg| arg.is_a?(Symbol) && /\A[a-zA-Z\-0-9_]+\Z/.match(arg.to_s) } }
          else
            super
          end
        end
      end

      defi :CORS do |&block|
        @cors.apply(&block)
      end

      defi :SCRIPT do |value|
        @script = value
      end

      def init_script
        @script
      end

      def self.combine_modules(dest)
        orig_modules = File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'api_modules', 'node_modules')

        `cp -Ra #{orig_modules}/ #{dest}/`
        `cp -Ra node_modules/* #{dest}/`
      end

      def generate
        pretty_print = if @pretty_print
                         ', null, 2'
                       else
                         ''
                       end

        result = ''

        all_methods = @methods.clone

        # Generate appropriate options methods as well

        @methods.each do |path, resource|
          meths = resource.map { |meth, _info| meth }

          # Insert OPTIONS method if there isn't already one
          next if all_methods[path].key?('OPTIONS')

          all_methods[path]['OPTIONS'] = { script: <<-SCRIPT, params: [] }
                    var headers = {}
                    headers["Access-Control-Allow-Origin"] = #{@cors.allowed_origins.join(',').inspect}
                    headers["Access-Control-Request-Method"] = '*'
                    headers["Access-Control-Allow-Methods"] = '#{meths.join(', ')}'
                    headers["Access-Control-Allow-Headers"] = #{@cors.allowed_headers.join(',').inspect}

                    respond_with({methods: #{meths.inspect}}, 200, headers)
          SCRIPT
        end

        all_methods.each do |path, resource|
          resource.each do |method, method_info|
            parameter_list = method_info[:params].join(', ')
            parameter_call_list = method_info[:params].map { |parm| "params['#{parm}']" }.join(', ')

            result += <<-SCRIPT

    router.#{method.downcase}('#{path}', prepare(function (event, callback) {

      var retval = {};

      var bodyParameters = parseQuery(event.body);

      var params = merge(event.queryStringParameters || {}, event.pathParameters || {});
      params = merge(params, bodyParameters);

      function respond_with(response_object, response_status, response_headers)
      {
        var headers = {}
        headers["Content-Type"] = "application/json; charset=utf-8"
        headers["Access-Control-Allow-Origin"] = #{@cors.allowed_origins.join(',').inspect}

        if (response_headers)
        {
            for(var key in response_headers)
            {
                headers[key] = response_headers[key];
            }
        }

        var response = {
          statusCode: response_status || 200,
          headers: headers,
          body: JSON.stringify(response_object#{pretty_print})
        };

        return callback(null, response);
      }

      var retval = function (#{parameter_list}) {
        #{method_info[:script]}
      }( #{parameter_call_list} );

    }));

            SCRIPT
          end
        end
        result
      end
    end

    def make_api(
        domain_name,
        name:,
        script: nil,
        env: {},
        dns: nil,
        cert: nil,
        mtls_truststore: nil,
        logging: true,
        network: nil,
        layer: nil,
        with_statements: [], &block)

      api = make 'AWS::ApiGateway::RestApi', name: name do
        Name name
        DisableExecuteApiEndpoint true
      end

      if logging
        cloudwatchRole = make 'AWS::IAM::Role', name: "#{name}LoggingRole" do
          AssumeRolePolicyDocument do
            Version "2012-10-17"
            Statement [
              {
                "Effect" => "Allow",
                "Principal" => {
                  "Service" => [
                    "apigateway.amazonaws.com"
                  ]
                },
                "Action" => "sts:AssumeRole"
              }
            ]
          end
          Path '/'
          ManagedPolicyArns [ "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs" ]
        end

        make 'AWS::ApiGateway::Account' do
          depends_on api
          CloudWatchRoleArn cloudwatchRole.Arn
        end
      end

      script ||= File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'api_modules', 'real_script.js'))

      apigen = APIGenerator.new(&block)
      script.sub!('// {{ ROUTES }}', apigen.generate)
      script.gsub!('{{ SCRIPT }}', apigen.init_script)
      script.gsub!('{{ REGION }}', @region)
      script.gsub!('{{ BUCKET }}', @bucket_name)
      script.gsub!('{{ STORE_PREFIX }}', 'functions/' + name)

      module_dir = '.build_modules'

      APIGenerator.combine_modules(module_dir)

      files = Dir[File.join(module_dir, '**/*')].select { |x| File.file?(x) }.map do |x|
        { name: x.sub(%r{^#{module_dir}/}, ''), code: File.read(x) }
      end

      files += [{ name: 'index.js', code: script }]

      fun = make_lambda(
        name: "#{name}Lambda#{@version_number}",
        env: env,
        network: network,
        layer: layer,
        files: files, 
        role: custom_resource_exec_role(with_statements: with_statements) )

      resource = make 'AWS::ApiGateway::Resource', name: "#{name}Resource" do
        ParentId api.RootResourceId
        PathPart '{proxy+}'
        RestApiId api
      end

      meth = make 'AWS::ApiGateway::Method', name: "#{name}MethodOther" do
        RestApiId api
        ResourceId resource
        HttpMethod 'ANY'
        AuthorizationType 'NONE'
        Integration ({
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: call('Fn::Join', '', ['arn:aws:apigateway:', ref('AWS::Region'), ':lambda:path', '/2015-03-31/functions/', fun.Arn, '/invocations'])
        })
      end

      meth2 = make 'AWS::ApiGateway::Method', name: "#{name}MethodRoot" do
        RestApiId api
        ResourceId api.RootResourceId
        HttpMethod 'ANY'
        AuthorizationType 'NONE'
        Integration ({
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST',
          Uri: call('Fn::Join', '', ['arn:aws:apigateway:', ref('AWS::Region'), ':lambda:path', '/2015-03-31/functions/', fun.Arn, '/invocations'])
        })
      end

      make 'AWS::Lambda::Permission', name: "#{name}LambdaPermission" do
        FunctionName fun.Arn
        Action 'lambda:InvokeFunction'
        Principal 'apigateway.amazonaws.com'
      end

      deployment = make 'AWS::ApiGateway::Deployment', name: "#{name}Deployment#{@version_number}" do
        depends_on meth
        depends_on meth2
        RestApiId api
      end

      stage = make 'AWS::ApiGateway::Stage', name: "#{name}Stage" do
        RestApiId api
        DeploymentId deployment

        if logging
          MethodSettings [ 
            {
              "ResourcePath" => "/*",
              "HttpMethod" => "*",
              "DataTraceEnabled" => true,
              "LoggingLevel" => 'INFO'
            }
          ]
        end
      end

      root_name = /(?<root_name>[^.]+\.[^.]+)$/.match(domain_name)[:root_name]

      certificate_completion = cert

      bucket_name = @bucket_name
      mtls = nil
      if mtls_truststore
        filename = "#{domain_name}.truststore.pem"
        upload_file(filename, mtls_truststore)
        truststore_uri = "s3://#{bucket_name}/uploads/#{filename}"
        mtls = {
          "TruststoreUri" => truststore_uri
        }
      end

      if cert.nil?
        cert = make 'Custom::ACMCertificate', name: "#{name}Certificate" do
          DomainName domain_name
          ValidationMethod 'DNS' if dns[:type] == :route53
          RegionOverride 'us-east-1' if !mtls
        end

        certificate_completion = cert

        if dns[:type] == :route53
          make 'AWS::Route53::RecordSet', name: "#{name}CertificateRoute53Entry" do
            HostedZoneId dns[:hosted_zone]
            Name cert.RecordName
            Type cert.RecordType
            TTL 60
            ResourceRecords [cert.RecordValue]
          end

          cert_waiter = make 'Custom::ACMCertificateWaiter', name: "#{name}CertificateWaiter" do
            Certificate cert
            RegionOverride 'us-east-1' if !mtls
          end

          certificate_completion = cert_waiter
        end
      end

      domain = make 'AWS::ApiGateway::DomainName', name: "#{name}DomainName" do
        depends_on certificate_completion

        DomainName domain_name

        if mtls != nil
          RegionalCertificateArn cert
          MutualTlsAuthentication mtls
          SecurityPolicy 'TLS_1_2'
          EndpointConfiguration do
            Types [ 'REGIONAL' ]
          end
        else
          CertificateArn cert
          EndpointConfiguration do
            Types [ 'EDGE' ]
          end
        end
      end

      make 'AWS::ApiGateway::BasePathMapping', name: "#{name}BasePathMapping" do
        BasePath '(none)'
        DomainName domain
        RestApiId api
        Stage stage
      end

      if dns[:type] == :cloudflare
        make 'Custom::CloudflareDNSEntry', name: "#{name}CloudFlareEntry" do
          Key dns[:key]
          Email dns[:email]
          Domain root_name
          Entry domain_name.sub(/#{root_name}$/, '').chomp('.')
          CNAME call('Fn::Join', '', [api, '.execute-api.', ref('AWS::Region'), '.amazonaws.com'])
        end
        domain_name
      elsif dns[:type] == :route53
        make 'AWS::Route53::RecordSet', name: "#{name}Route53Entry" do
          HostedZoneId dns[:hosted_zone]
          Name domain_name

          if mtls != nil
            Type 'A'
            AliasTarget do
              DNSName domain.RegionalDomainName
              HostedZoneId domain.RegionalHostedZoneId
            end
          else
            Type 'A'
            AliasTarget do
              DNSName domain.DistributionDomainName
              HostedZoneId domain.DistributionHostedZoneId
            end          end
        end
        domain_name
      else
        call('Fn::Join', '', [api, '.execute-api.', ref('AWS::Region'), '.amazonaws.com'])
      end
    end

    def cloudflare_dns(key:, email:)
      { type: :cloudflare, key: key, email: email }
    end

    def route53_dns(hosted_zone:)
      { type: :route53, hosted_zone: hosted_zone }
    end
  end
end
