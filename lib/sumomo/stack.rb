
module Sumomo
	module Stack

		def hidden_value(value)
			name = make_default_resource_name("HiddenValue")
			if !@hidden_values
				@hidden_values = []
			end

			@hidden_values << {
				parameter_key: name,
				parameter_value: value
			}

			param name, type: :string
		end

		def upload_file(name,content)
			@store.set_raw("uploads/#{name}", content)
			puts "Uploaded #{name}"
		end

		def make_lambda(name: nil, files:[{name:"index.js", code:""}],
			description: "Lambda Function in #{@bucket_name}", 
			function_key: "cloudformation/lambda/function_#{name}",
			handler: "index.handler",
			runtime: "nodejs8.10",
			memory_size: 128,
			timeout: 30,
			with_statements: [])

			name ||= make_default_resource_name("Lambda")

			stringio = Zip::OutputStream.write_buffer do |zio|
				files.each do |file|
					zio.put_next_entry(file[:name])
					if file[:code]
						zio.write file[:code]
					elsif file[:path]
						zio.write File.read(file[:path])
					else
						raise "Files needs to be an array of objects with :name and :code or :path members"
					end
				end
			end

			@store.set_raw(function_key, stringio.string)

			stack = self

			code_location = {"S3Bucket": @bucket_name, "S3Key": function_key}
			fun = make "AWS::Lambda::Function", name: name do
				Code code_location
				Description description
				MemorySize memory_size
				Handler handler
				Runtime runtime
				Timeout timeout
				Role stack.exec_role(with_statements: with_statements).Arn
			end

			log_group = make "AWS::Logs::LogGroup", name: "#{name}LogGroup" do
				LogGroupName call("Fn::Join", "", ["/aws/lambda/", fun])
				RetentionInDays 30
			end

			fun
		end

		def define_custom_resource(name: nil,code:)

			name ||= make_default_resource_name("CustomResource")

			func = make_lambda(
				name: name, 
				files:[
					{
						name: "index.js", 
						code: File.read( File.join(Gem.loaded_specs['sumomo'].full_gem_path, "data", "sumomo", "custom_resource_utils.js") ).sub("{{ CODE }}", code)
					}
				],
				description: "CF Resource Custom::#{name}",
				function_key: "cloudformation/custom_resources/function_#{name}")

			@custom_resources["Custom::#{name}"] = func
		end

		def make_custom(custom_resource, options = {}, &block)
			bucket_name = @bucket_name
			stack_make "Custom::#{custom_resource.name}", options do
				ServiceToken custom_resource.Arn
				Region ref("AWS::Region")
				Bucket bucket_name
				instance_eval(&block) if block
			end
		end

		def make(type, options = {}, &block)
			match = /^Custom\:\:(?<name>[a-z0-9]+)/i.match(type)
			if match
				if !@custom_resources[type]

					resource_function_source = File.join(Gem.loaded_specs['sumomo'].full_gem_path, "data", "sumomo", "custom_resources", "#{match[:name]}.js")
					
					if File.exists? resource_function_source
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

		def exec_role(with_statements: [])

			if @exec_roles == nil
				@exec_roles = {}
			end

			statement_key = JSON.parse(with_statements.to_json)

			if !@exec_roles.has_key?(statement_key)
				name = make_default_resource_name("LambdaExecRole")

				role_policy_doc = {
					"Version" => "2012-10-17",
					"Statement" => [{
						"Effect" => "Allow",
						"Principal" => {"Service" => ["edgelambda.amazonaws.com", "lambda.amazonaws.com"]},
						"Action" => ["sts:AssumeRole"]
					}]
				}

				bucket_name = @bucket_name

				statement_list = [
					{
						"Effect" => "Allow",
						"Action" => ["logs:CreateLogStream","logs:PutLogEvents"],
						"Resource" => "arn:aws:logs:*:*:*"
					},
					{
						"Effect" => "Allow",
						"Action" => ["cloudformation:DescribeStacks", "ec2:Describe*", ],
						"Resource" => "*"
					},
					{
						"Effect" => "Allow",
						"Action" => ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
						"Resource" => "arn:aws:s3:::#{bucket_name}/*"
					},
					{
						"Effect" => "Allow",
						"Action" => ["cloudfront:CreateCloudFrontOriginAccessIdentity", "cloudfront:DeleteCloudFrontOriginAccessIdentity"],
						"Resource" => "*"
					},
					{
						"Effect" => "Allow",
						"Action" => ["apigateway:*", "cloudfront:UpdateDistribution"],
						"Resource" => "*"
					},
					{
						"Effect" => "Allow",
						"Action" => ["acm:RequestCertificate", "acm:DeleteCertificate", "acm:DescribeCertificate"],
						"Resource" => "*"
					}] + with_statements

				@exec_roles[statement_key] = make "AWS::IAM::Role", name: name do
					AssumeRolePolicyDocument role_policy_doc
					Path "/"
					Policies [
						{
							"PolicyName" => name,
							"PolicyDocument" => {
								"Version" => "2012-10-17",
								"Statement" => statement_list
							}
						}
					]
				end
			end

			@exec_roles[statement_key]

		end
	end
end
