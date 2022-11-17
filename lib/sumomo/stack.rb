# frozen_string_literal: true

module Sumomo
  module Stack
    def hidden_value(value)
      name = make_default_resource_name('HiddenValue')
      @hidden_values ||= []

      @hidden_values << {
        parameter_key: name,
        parameter_value: value
      }

      param name, type: :string
    end

    def upload_file(name, content)
      @store.set_raw("uploads/#{name}", content)
      puts "Uploaded #{name}"
    end

    def make_lambda(name: nil, files: [{ name: 'index.js', code: '' }],
                    description: "Lambda Function in #{@bucket_name}",
                    function_key: "cloudformation/lambda/function_#{name}",
                    handler: 'index.handler',
                    runtime: 'nodejs14.x',
                    env: {},
                    memory_size: 128,
                    timeout: 30,
                    network: nil,
                    layer: nil,
                    enable_logging: true,
                    role: nil)

      name ||= make_default_resource_name('Lambda')
      role ||= custom_resource_exec_role

      stringio = Zip::OutputStream.write_buffer do |zio|
        files.each do |file|
          zio.put_next_entry(file[:name])
          if file[:code]
            zio.write file[:code]
          elsif file[:path]
            zio.write File.read(file[:path])
          else
            raise 'Files needs to be an array of objects with :name and :code or :path members'
          end
        end
      end

      vpcconfig = nil

      if network != nil

        layer ||= network.subnets.keys.first

        ingress = [allow_port(:all)]
        egress = [allow_port(:all)]

        lambda_sec_group = make 'AWS::EC2::SecurityGroup' do
          GroupDescription "Lambda Security group for layer: #{layer}"
          SecurityGroupIngress ingress
          SecurityGroupEgress egress
          VpcId network.vpc
        end

        make 'Custom::VPCDestroyENI' do
          SecurityGroups [lambda_sec_group]
        end

        subnetids = network.subnets[layer].map { |x| x[:name] }
        vpcconfig = {
          SecurityGroupIds: [lambda_sec_group],
          SubnetIds: subnetids
        }
      end

      @store.set_raw(function_key, stringio.string)

      stack = self

      code_location = { "S3Bucket": @bucket_name, "S3Key": function_key }
      fun = make 'AWS::Lambda::Function', name: name do
        Code code_location
        Description description
        MemorySize memory_size
        Handler handler
        Runtime runtime
        Timeout timeout
        Role role.Arn
        
        Environment do
          Variables env
        end

        if !vpcconfig.nil?
          VpcConfig vpcconfig

          vpcconfig[:SecurityGroupIds].each do |x|
            depends_on x
          end

          vpcconfig[:SubnetIds].each do |x|
            depends_on x
          end
        end
      end

      if enable_logging
        make 'AWS::Logs::LogGroup', name: "#{name}LogGroup" do
          LogGroupName call('Fn::Join', '', ['/aws/lambda/', fun])
          RetentionInDays 30
        end
      end

      fun
    end

    def define_custom_resource(name: nil, code:, role: nil)
      name ||= make_default_resource_name('CustomResource')
      role ||= custom_resource_exec_role

      func = make_lambda(
        name: name,
        role: role,
        files: [
          {
            name: 'index.js',
            code: File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'custom_resource_utils.js')).sub('{{ CODE }}', code)
          }
        ],
        description: "CF Resource Custom::#{name}",
        function_key: "cloudformation/custom_resources/function_#{name}"
      )

      @custom_resources["Custom::#{name}"] = func
    end

    def make_custom(custom_resource, options = {}, &block)
      bucket_name = @bucket_name
      stack_make "Custom::#{custom_resource.name}", options do
        ServiceToken custom_resource.Arn
        Region ref('AWS::Region')
        Bucket bucket_name
        instance_eval(&block) if block
      end
    end

    def make(type, options = {}, &block)
      match = /^Custom\:\:(?<name>[a-z0-9]+)/i.match(type)
      if match
        unless @custom_resources[type]

          resource_function_source = File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'custom_resources', "#{match[:name]}.js")

          if File.exist? resource_function_source
            define_custom_resource(name: match[:name], code: File.read(resource_function_source))
          else
            throw "#{resource_function_source} does not exist"

          end
        end
        make_custom(@custom_resources[type], options, &block)
      else
        stack_make(type, options, &block)
      end
    end

    def lambda_exec_role(statements: [], principals: [])
      name = make_default_resource_name('LambdaExecRole')

      role_policy_doc = {
        'Version' => '2012-10-17',
        'Statement' => [{
          'Effect' => 'Allow',
          'Principal' => { 'Service' => principals },
          'Action' => ['sts:AssumeRole']
        }]
      }

      make 'AWS::IAM::Role', name: name do
        AssumeRolePolicyDocument role_policy_doc
        Path '/'
        Policies [
          {
            'PolicyName' => name,
            'PolicyDocument' => {
              'Version' => '2012-10-17',
              'Statement' => statements
            }
          }
        ]
      end
    end

    def custom_resource_exec_role(with_statements: [])
      @exec_roles ||= {}

      statement_key = JSON.parse(with_statements.to_json)

      @exec_roles[statement_key] ||= lambda_exec_role(
        principals: ['edgelambda.amazonaws.com', 'lambda.amazonaws.com'],
        statements: [
          {
            'Effect' => 'Allow',
            'Action' => ['logs:CreateLogStream', 'logs:PutLogEvents'],
            'Resource' => 'arn:aws:logs:*:*:*'
          },
          {
            'Effect' => 'Allow',
            'Action' => ['cloudformation:DescribeStacks', 'ec2:Describe*'],
            'Resource' => '*'
          },
          {
            'Effect' => 'Allow',
            'Action' => ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
            'Resource' => "arn:aws:s3:::#{@bucket_name}/*"
          },
          {
            'Effect' => 'Allow',
            'Action' => ['cloudfront:CreateCloudFrontOriginAccessIdentity', 'cloudfront:DeleteCloudFrontOriginAccessIdentity'],
            'Resource' => '*'
          },
          {
            'Effect' => 'Allow',
            'Action' => ['apigateway:*', 'cloudfront:UpdateDistribution'],
            'Resource' => '*'
          },
          {
            'Effect' => 'Allow',
            'Action' => ['acm:RequestCertificate', 'acm:DeleteCertificate', 'acm:DescribeCertificate'],
            'Resource' => '*'
          },
          {
            'Effect' => 'Allow',
            'Action' => ['s3:*'],
            'Resource' => 'arn:aws:s3:::*'
          }
        ] + with_statements
      )
    end
  end
end
