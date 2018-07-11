
module Sumomo
  module Stack

    class APIGenerator

      class CorsInfo
        attr_accessor :allowed_origins, :allowed_headers

        def apply(&block)
            @allowed_origins = []
            @allowed_headers = []
            instance_eval(&block) if block
        end

        def AllowOrigin(value)
            @allowed_origins << value
        end

        def AllowHeader(value)
            @allowed_headers << value
        end
      end

      def initialize(pretty_print: false, &block)
        @methods = {}
        @cors = CorsInfo.new
        @script = ""
        # defaults
        @cors.apply do
            AllowOrigin "*"
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

      def CORS(&block)
        @cors.apply(&block)
      end

      def SCRIPT(value)
        @script = value
      end

      def init_script
          @script
      end

      def self.combine_modules(dest)
          orig_modules = File.join(Gem.loaded_specs['sumomo'].full_gem_path, "data", "sumomo", "api_modules", "node_modules")

          `cp -Rad #{orig_modules}/ #{dest}/`
          `cp -Rad node_modules/* #{dest}/`
      end

      def generate

        if @pretty_print
            pretty_print = ", null, 2"
        else
            pretty_print = ""
        end

        result = ""

        all_methods = @methods.clone

        # Generate appropriate options methods as well

        @methods.each do |path, resource|
            meths = resource.map{|meth,info| meth}

            # Insert OPTIONS method if there isn't already one
            if !all_methods[path].has_key?("OPTIONS")
                all_methods[path]["OPTIONS"] = { script: <<-SCRIPT, params: [] }
                    var headers = {}
                    headers["Access-Control-Allow-Origin"] = #{@cors.allowed_origins.join(",").inspect}
                    headers["Access-Control-Request-Method"] = '*'
                    headers["Access-Control-Allow-Methods"] = '#{meths.join(', ')}'
                    headers["Access-Control-Allow-Headers"] = #{@cors.allowed_headers.join(",").inspect}

                    respond_with({methods: #{meths.inspect}}, 200, headers)
                SCRIPT
            end
        end


        all_methods.each do |path, resource|
            resource.each do |method, method_info|

                parameter_list = method_info[:params].join(", ")
                parameter_call_list = method_info[:params].map{|parm| "params['#{parm}']"}.join(", ")

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
        headers["Access-Control-Allow-Origin"] = #{@cors.allowed_origins.join(",").inspect}

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


    def make_api(domain_name, name:, script:nil, dns:nil, cert:nil, with_statements:[], &block)

        api = make "AWS::ApiGateway::RestApi", name: name do
            Name name
        end

        script ||= File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, "data", "sumomo", "api_modules", "real_script.js"))

        apigen = APIGenerator.new(&block);
        script.sub!("// {{ ROUTES }}", apigen.generate);
        script.gsub!("{{ SCRIPT }}", apigen.init_script);
        script.gsub!("{{ REGION }}", @region);
        script.gsub!("{{ BUCKET }}", @bucket_name);
        script.gsub!("{{ STORE_PREFIX }}", "functions/" + name);

        module_dir = ".build_modules"

        APIGenerator.combine_modules(module_dir)

        files = Dir[File.join(module_dir, "**/*")].select{|x| File.file?(x)}.map do |x| 
            { name: x.sub(/^#{module_dir}\//, ""), code: File.read(x) } 
        end

        files += [ {name:"index.js", code:script} ]

        fun = make_lambda(name: "#{name}Lambda#{@version_number}", files:files, with_statements:with_statements)

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
                ResourceRecords [ call("Fn::Join", "", [api, ".execute-api.", ref("AWS::Region"), ".amazonaws.com"]) ]
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
