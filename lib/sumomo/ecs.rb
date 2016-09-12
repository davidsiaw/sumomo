
module Sumomo
	module Stack

		def sluggify(str)
			str.gsub(/[^0-9a-zA-Z]/, "_")
		end

		def make_ecs_cluster(name:"ECSCluster",services:[],machine_config:{},log_retention:30)

			ecs = make "AWS::ECS::Cluster", name: "#{name}"

			volumes = []
			machine_volume_locations = {}

			service_count = 0

			services.each do |service|

				service_count += 1

				containers = service[:containers]
				service_name = service[:name] || "Service#{service_count}"
				service_count = service[:count] || 1

				container_defs = containers.map do |container|
					definition = {}

					definition["Name"] = "#{sluggify(container[:image]).camelize}"
					definition["Name"] = container[:name] if container[:name]

					definition["Memory"] = 1024

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

					container.each do |key, value|
						if key != :files
							definition["#{key}".camelize] = value
						end
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

				ecs_service = make "AWS::ECS::Service", name: "#{name}#{service_name}" do
					Cluster ecs
					DesiredCount service_count
					TaskDefinition ecs_task
					DeploymentConfiguration deployment_config
				end
			end

			machine_config[:methods].each do |method_name|
				parameters = {ecs_cluster: ecs}

				method(method_name).parameters.each do |param|
					parameters[param[1]] = machine_config[param[1]] if (param[0] == :keyreq or param[0] == :key) and machine_config[param[1]]
				end

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
