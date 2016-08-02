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

		def define_custom_resource(name: nil,code:)

			name ||= make_default_resource_name("CustomResource")

			stringio = Zip::OutputStream.write_buffer do |zio|
				zio.put_next_entry("index.js")
				zio.write File.read( File.join(Gem.datadir("sumomo"), "custom_resource_utils.js") ).sub("{{ CODE }}", code)
			end
			@store.set_raw("cloudformation/function_#{name}", stringio.string)

			code_location = {"S3Bucket": @bucket_name, "S3Key": "cloudformation/function_#{name}"}
			fun = make "AWS::Lambda::Function", name: name do
				Code code_location
				Description "CF Resource Custom::#{name}"
				Handler "index.handler"
				Runtime "nodejs4.3"
				Timeout 30
				Role exec_role.Arn
			end

			@custom_resources["Custom::#{name}"] = fun
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

					resource_function_source = File.join(Gem.datadir("sumomo"), "custom_resources", "#{match[:name]}.js")
					
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

		def make_exec_role
			if @exec_role == nil
				role_policy_doc = {
					"Version" => "2012-10-17",
					"Statement" => [{
						"Effect" => "Allow",
						"Principal" => {"Service" => ["lambda.amazonaws.com"]},
						"Action" => ["sts:AssumeRole"]
					}]
				}
				bucket_name = @bucket_name
				@exec_role = make "AWS::IAM::Role", name: "LambdaFunctionExecutionRole" do
					AssumeRolePolicyDocument role_policy_doc
					Path "/"
					Policies [
						{
							"PolicyName" => "lambdapolicy",
							"PolicyDocument" => {
								"Version" => "2012-10-17",
								"Statement" => [{
									"Effect" => "Allow",
									"Action" => ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
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
								}]
							}
						}
					]
				end
			end
			@exec_role
		end


	end
end