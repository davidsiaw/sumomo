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

		def define_custom_resource(name:,code:)
			@custom_resource_count += 1

			stringio = Zip::OutputStream.write_buffer do |zio|
				zio.put_next_entry("index.js")
				zio.write File.read( File.join(Gem.datadir("sumomo"), "custom_resource_utils.js") )
				zio.write code
			end
			@store.set_raw("cloudformation/function#{@custom_resource_count}", stringio.string)

			code_location = {"S3Bucket": @bucket_name, "S3Key": "cloudformation/function#{@custom_resource_count}"}
			fun = make "AWS::Lambda::Function", name: name do
				Code code_location
				Description "CF Resource Custom::#{name}"
				Handler "index.handler"
				Runtime "nodejs"
				Timeout 30
				Role exec_role.Arn
			end

			@custom_resources["Custom::#{name}"] = fun
		end

		def make_custom(custom_resource, options = {}, &block)
			stack_make "Custom::#{custom_resource.name}", options do
				ServiceToken custom_resource.Arn
				instance_eval(&block)
			end
		end

		def make(type, options = {}, &block)
			if /Custom\:\:/.match(type)
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
									"Action" => ["cloudformation:DescribeStacks"],
									"Resource" => "*"
								},
								{
									"Effect" => "Allow",
									"Action" => ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
									"Resource" => "arn:aws:s3:::#{name}/data"
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