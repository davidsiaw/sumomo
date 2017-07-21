
module Sumomo
	module Stack

		def sluggify(str)
			str.gsub(/[^0-9a-zA-Z]/, "_")
		end

		def make_ecs_role
			make "AWS::IAM::Role", name: "ECSServiceRole" do

				role_policy_doc = {
					"Version" => "2012-10-17",
					"Statement" => [{
						"Effect" => "Allow",
						"Principal" => {"Service" => ["ecs.amazonaws.com"]},
						"Action" => ["sts:AssumeRole"]
					}]
				}

				AssumeRolePolicyDocument role_policy_doc
				Path "/"
				Policies [
					{
						"PolicyName" => "ecs-service",
						"PolicyDocument" => {
							"Version" => "2012-10-17",
							"Statement" => [{
								"Effect" => "Allow",
								"Action" => [
									"ec2:AuthorizeSecurityGroupIngress",
									"ec2:Describe*",
									"elasticloadbalancing:DeregisterInstancesFromLoadBalancer",
									"elasticloadbalancing:DeregisterTargets",
									"elasticloadbalancing:Describe*",
									"elasticloadbalancing:RegisterInstancesWithLoadBalancer",
									"elasticloadbalancing:RegisterTargets"
        						],
								"Resource" => "*"
							}]
						}
					}
				]
			end
		end

		def make_ecs_cluster(name:make_default_resource_name("ECSCluster"),services:[],machine_config:{},network:,log_retention:30,dependencies:[])

			ecs = make "AWS::ECS::Cluster", name: "#{name}" do
				dependencies.each do |x|
					depends_on x
				end
			end

			volumes = []
			machine_volume_locations = {}

			service_number = 0

			services.each do |service|

				alb = service[:alb]
				certificate = service[:certificate]
				alb_ports = {}

				service_number += 1

				containers = service[:containers]
				service_name = service[:name] || "Service#{service_number}"
				service_count = service[:count] || 1

				container_defs = containers.map do |container|
					definition = {}

					definition["Name"] = "#{sluggify(container[:image]).camelize}"
					definition["Name"] = container[:name] if container[:name]

					definition["Memory"] = container[:memory] || 1024

					loggroup = make "AWS::Logs::LogGroup", name: "#{name}#{definition["Name"]}Logs" do
						LogGroupName "#{definition["Name"].underscore}_logs"
						RetentionInDays log_retention
					end

					definition["LogConfiguration"] = {
						"LogDriver" => "awslogs",
						"Options" => {
							"awslogs-group" => loggroup,
							"awslogs-region" => ref("AWS::Region")
						}
					}

					if container[:files]
						definition["MountPoints"] = container[:files].map do |file, destination|

							s3_location = "container_files/#{sluggify(service_name)}/#{definition["Name"]}/#{file}"
							volume_name = sluggify("#{definition["Name"].underscore}_#{destination}").camelize

							upload_file s3_location, File.read(file)

							machine_volume_locations[s3_location] = "/opt/s3/#{s3_location}"

							volumes << {
								"Name" => volume_name,
								"Host" => { "SourcePath" => machine_volume_locations[s3_location] }
							}

							{
								"ContainerPath" => destination,
								"SourceVolume" => volume_name
							}
						end
						container.delete(:files)
					end

					if container[:ports]
						if !alb
							definition["PortMappings"] = container[:ports].map do |from_port, to_port|
								{
									"ContainerPort" => from_port,
									"HostPort" => to_port
								}
							end

						else
							definition["PortMappings"] = container[:ports].map do |from_port, to_port|
								{
									"ContainerPort" => from_port
								}
							end

							container[:ports].each do |container_port, host_port|

								if alb_ports[host_port.to_i]
									raise "Container #{alb_ports[host_port][:name]} is already using #{host_port}"
								end

								alb_target = make "AWS::ElasticLoadBalancingV2::TargetGroup", name: "#{name}#{definition["Name"]}Target" do
									HealthCheckIntervalSeconds 60
									UnhealthyThresholdCount 10
									HealthCheckPath "/"
									Name "#{name}Port#{host_port}Target"
									Port container_port
									Protocol "HTTP"
									VpcId network[:vpc]

									if container[:alb_sticky]
										TargetGroupAttributes({
											"stickiness.enabled" => true,
											"stickiness.type" => "lb_cookie"
										}.map{|k,v| {Key: k, Value: v} })
										container.delete(:alb_sticky)
									end
								end

								alb_action = {
									"Type" => "forward",
									"TargetGroupArn" => alb_target
								}

								if certificate
									alb_listener = make "AWS::ElasticLoadBalancingV2::Listener", name: "#{name}#{definition["Name"]}Listener" do
										Certificates [{ CertificateArn: certificate }]
										DefaultActions [ alb_action ]
										LoadBalancerArn alb
										Port host_port
										Protocol "HTTPS"
									end
								else
									alb_listener = make "AWS::ElasticLoadBalancingV2::Listener", name: "#{name}#{definition["Name"]}Listener" do
										DefaultActions [ alb_action ]
										LoadBalancerArn alb
										Port host_port
										Protocol "HTTP"
									end
								end

								alb_ports[host_port.to_i] = {
									listener: alb_listener,
									target: alb_target,
									port: container_port,
									name: definition["Name"]
								}

							end

						end
						container.delete(:ports)
					end

					if container[:envvars]
						definition["Environment"] = container[:envvars].map do |var_name, var_value|
							{
								"Name" => var_name,
								"Value" => var_value
							}
						end
						container.delete(:envvars)
					end

					container.each do |key, value|
						definition["#{key}".camelize] = value
					end

					definition
				end 


				deployment_config = {
					"MaximumPercent" => 200,
					"MinimumHealthyPercent" => 50
				}

				ecs_task = make "AWS::ECS::TaskDefinition", name: "#{name}#{service_name}Task" do
					ContainerDefinitions container_defs
					Volumes volumes
				end

				stack = self

				ecs_service = make "AWS::ECS::Service", name: "#{name}#{service_name}" do
					alb_ports.each do |host_port, info|
						depends_on info[:listener]
					end

					Cluster ecs
					DesiredCount service_count
					TaskDefinition ecs_task
					DeploymentConfiguration deployment_config

					if alb_ports.keys.count != 0
						Role stack.make_ecs_role
						LoadBalancers alb_ports.values.map { |info|
							{
								"TargetGroupArn" => info[:target],
								"ContainerPort" => info[:port],
								"ContainerName" => info[:name]
							}
						}
					end

				end
			end #services

			machine_config[:methods].each do |method_name|
				parameters = {ecs_cluster: ecs}

				method(method_name).parameters.each do |param|
					parameters[param[1]] = machine_config[param[1]] if (param[0] == :keyreq or param[0] == :key) and machine_config[param[1]]
				end

				parameters[:network] = network if !parameters[:network]

				method(method_name).call(parameters) do
					machine_volume_locations.each do |s3_loc, machine_loc|
						mkdir File.dirname(machine_loc)
						download_file s3_loc, machine_loc
					end
				end
			end

			ecs
		end
	end
end
