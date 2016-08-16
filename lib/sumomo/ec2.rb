
module Sumomo
	module Stack

		def get_azs
			resp = @ec2.describe_availability_zones

			Array(resp.availability_zones.map do |x|
				x.zone_name
			end)
		end

		def allow(thing)
			if (thing == :all)
				{
					"IpProtocol" => "-1",
					"ToPort" => 65535,
					"FromPort" => 0,
					"CidrIp" => "0.0.0.0/0"
				}
			elsif thing.is_a? Integer and thing > 0 and thing < 65536
				# its a port!
				{
					"IpProtocol" => "tcp",
					"ToPort" => thing,
					"FromPort" => thing,
					"CidrIp" => "0.0.0.0/0"
				}
			elsif thing.is_a? String and /[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\/[0-9]+/.match(thing)
				# its a cidr!
				{
					"IpProtocol" => "tcp",
					"ToPort" => 65535,
					"FromPort" => 0,
					"CidrIp" => thing
				}
			elsif thing.is_a? Hash
				# more shit
				{
					"IpProtocol" => thing[:protocol] || "tcp",
					"ToPort" => thing[:port] || thing[:end_port] || 0,
					"FromPort" => thing[:port] || thing[:start_port] || 65535,
					"CidrIp" => thing[:cidr] || "0.0.0.0/0"
				}
			else
				raise "utils.rb allow: please allow something"
			end
		end

		def http_listener(port: 80, instance_port: port)
			{
				"LoadBalancerPort" => port,
				"InstancePort" => instance_port,
				"Protocol" => "HTTP"
			}
		end

		def https_listener(cert_arn:, instance_port: 80, port: 443)
			res = http_listener(instance_port)
			res["LoadBalancerPort"] = lb_port
			res["Protocol"] = "HTTPS"
			res["SSLCertificateId"] = cert_arn

			return res
		end

		def elb_tcp_health_check(port: 80, healthy_threshold: 2, interval: 10, timeout: 5, unhealthy_threshold: 10, path: "/")
			elb_health_check(port: port, 
				healthy_threshold: healthy_threshold, 
				interval: interval, 
				timeout: timeout, 
				unhealthy_threshold: unhealthy_threshold, 
				path: path, 
				check_type: "TCP")
		end

		def elb_health_check(port: 80, 
			healthy_threshold: 2, 
			interval: 10, 
			timeout: 5, 
			unhealthy_threshold: 10, 
			path: "/", 
			check_type: "HTTP")

			options[:path] = "/#{options[:path]}"
			options[:path].gsub!(/^[\/]+/, "/")
			{
				"HealthyThreshold" => options[:healthy_threshold] || 2,
				"Interval" => options[:interval] || 10,
				"Target" => "#{check_type}:#{port}#{options[:path]}",
				"Timeout" => options[:timeout] || 5,
				"UnhealthyThreshold" => options[:unhealthy_threshold] || 10
			}
		end

		def initscript(wait_handle, asgname, script)

			call("Fn::Base64", 
				call("Fn::Join", "", [

					"#!/bin/bash -v\n",
					"yum update -y aws-cfn-bootstrap\n",

					"# Helper function\n",
					"function error_exit\n",
					"{\n",
					"  /opt/aws/bin/cfn-signal -e 1 -r \"$1\" \"", wait_handle, "\"\n",
					"  exit 1\n",
					"}\n",

					"# Run init meta\n",
					"/opt/aws/bin/cfn-init -s ", ref("AWS::StackId"), " -r ", asgname, " ",
					"    --region ", ref("AWS::Region"), " || error_exit 'Failed to run cfn-init'\n",

					"# Run script\n",
					script,

					"\n",

					"# All is well so signal success\n",
					"/opt/aws/bin/cfn-signal -e 0 -r \"Setup complete\" \"", wait_handle, "\"\n"
				]))
		end

		class EC2Tasks
			def initialize(bucket_name, &block)
				@script = ""
				@bucket_name = bucket_name
				instance_eval(&block) if block
			end

			def mkdir(name)
				@script += <<-SNIPPET
mkdir -p #{name}
				SNIPPET
			end

			def download_file(name, local_path)
				@script += <<-SNIPPET
aws s3 cp s3://#{@bucket_name}/uploads/#{name} #{local_path}
				SNIPPET
			end

			def script
				@script
			end
		end

		def make_autoscaling_group(
			network:, 
			layer:,
			zone:nil,
			type:"m3.medium", 
			name:nil,
			elb:nil,
			min_size:1,
			max_size:min_size,
			vol_size:10,
			vol_type:"gp2",
			keypair:@master_key_name,
			has_public_ips:true,
			ingress:nil,
			egress:nil,
			machine_tag:nil,
			ec2_sns_arn:nil,
			ami_name:,
			ebs_root_device:,
			spot_price:nil,
			script: nil,
			ecs_cluster: nil,
			docker_username:"",
			docker_email:"",
			docker_password: "",
			&block)

			tasks = EC2Tasks.new(@bucket_name, &block).script

			ingress ||= [ allow(:all) ]
			egress ||= [ allow(:all) ]
			machine_tag ||= ref("AWS::StackName")
			name ||= make_default_resource_name("AutoScalingGroup")
			script ||= ""

			bucket_name = @bucket_name

			script += "\n#{tasks}\n"

			if ecs_cluster
				script += <<-ECS_START

yum update
yum groupinstall "Development Tools"
yum install -y python screen git gcc-c++ ecs-init
curl -sSL https://get.docker.com/ | sh

cp /ecs.config /etc/ecs/ecs.config

service docker start
start ecs

curl http://localhost:51678/v1/metadata > /home/ec2-user/ecs_info

				ECS_START
			end

			script += "\nservice spot-watcher start" if spot_price and ec2_sns_arn

			raise "ec2: ingress option needs to be an array" if !ingress.is_a? Array
			raise "ec2: egress option needs to be an array" if !egress.is_a? Array

			web_sec_group = make "AWS::EC2::SecurityGroup" do
				GroupDescription "Security group for layer: #{layer}"
				SecurityGroupIngress ingress
				SecurityGroupEgress egress
				VpcId network.vpc
			end

			wait_handle = make "AWS::CloudFormation::WaitConditionHandle"

			user_data = initscript(wait_handle, name, script)

			role_policy_doc = {
				"Version" => "2012-10-17",
				"Statement" => [{
					"Effect" => "Allow",
					"Principal" => {"Service" => ["ec2.amazonaws.com"]},
					"Action" => ["sts:AssumeRole"]
				}]
			}

			asg_role = make "AWS::IAM::Role" do
				AssumeRolePolicyDocument role_policy_doc
				Path "/"
				Policies [{
					"PolicyName" => "root",
					"PolicyDocument" => {
						"Version" => "2012-10-17",
						"Statement" => [{
							"Effect" => "Allow",
							"Action" => ["sns:Publish"],
							"Resource" => "*"
						},
						{
							"Effect" => "Allow",
							"Action" => ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
							"Resource" => "arn:aws:s3:::#{bucket_name}/uploads/*"
						},
						{
							"Effect" => "Allow",
							"Action" => [
								"ecs:DeregisterContainerInstance",
								"ecs:DiscoverPollEndpoint",
								"ecs:Poll",
								"ecs:RegisterContainerInstance",
								"ecs:StartTelemetrySession",
								"ecs:Submit*",
								"ecr:GetAuthorizationToken",
								"ecr:BatchCheckLayerAvailability",
								"ecr:GetDownloadUrlForLayer",
								"ecr:BatchGetImage",
								"logs:CreateLogStream",
								"logs:PutLogEvents"
							],
							"Resource": "*"
						}]
					}
				}]
			end

			asg_profile = make "AWS::IAM::InstanceProfile" do
				Path "/"
				Roles [ asg_role ]
			end

			launch_config = make "AWS::AutoScaling::LaunchConfiguration" do
				AssociatePublicIpAddress has_public_ips
				KeyName keypair 
				SecurityGroups [ web_sec_group ]
				ImageId ami_name
				UserData user_data
				InstanceType type
				IamInstanceProfile asg_profile
				SpotPrice spot_price if spot_price
				BlockDeviceMappings [{
						"DeviceName" => ebs_root_device,
						"Ebs" => {
								"VolumeType" => vol_type,
								"VolumeSize" => vol_size,
							}
					}]
			end


			zones_used = network.azs
			subnet_ids = network.subnets[layer].map { |x| x[:name] }

			if zone
				# if we only specified a single zone, then we have to do some processing
				res = define_custom_resource(code: <<-CODE
					var ids = {};
					var zones = request.ResourceProperties.SubnetZones;
					for (var i=0;i<zones.length;i++)
					{
						ids[zones[i]] = request.ResourceProperties.SubnetIds[i];
					}

					Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success", ids[request.ResourceProperties.Zone]);
				CODE
				)

				identifier = make_custom res, name: "SubnetIdentifierFor#{name}" do
					SubnetIds network.subnets[layer].map { |x| x[:name] }
					SubnetZones network.subnets[layer].map { |x| x[:zone] }
					Zone zone
				end

				zones_used = [ zone ]
				subnet_ids = [ identifier ]
			end


			asg = make "AWS::AutoScaling::AutoScalingGroup", name: name do
				depends_on network.attachment

				AvailabilityZones zones_used

				Cooldown 30
				MinSize min_size
				MaxSize max_size

				VPCZoneIdentifier subnet_ids

				LaunchConfigurationName launch_config
				LoadBalancerNames [ elb ] if elb

				NotificationConfigurations [
					{
						"NotificationTypes" => [
							"autoscaling:EC2_INSTANCE_LAUNCH", 
							"autoscaling:EC2_INSTANCE_LAUNCH_ERROR", 
							"autoscaling:EC2_INSTANCE_TERMINATE", 
							"autoscaling:EC2_INSTANCE_TERMINATE_ERROR",
							"autoscaling:TEST_NOTIFICATION"
						],
						"TopicARN" => ec2_sns_arn
					}
				] if ec2_sns_arn

				if spot_price and ec2_sns_arn
					watcher = File.read( File.join( Gem.datadir("sumomo"), "sources", "spot-watcher.sh" ) )
					poller = File.read( File.join( Gem.datadir("sumomo"), "sources", "spot-watcher-poller.sh" ) )

					file "/etc/init.d/spot-watcher", content: watcher, mode: "000700"
					file "/bin/spot-watcher", content: poller, mode: "000700", context: {
						sns_arn: ec2_sns_arn,
						region: ref("AWS::Region")
					}
				end

				if ecs_cluster
					ecs_config = <<-CONFIG
ECS_CLUSTER={{cluster_name}}
ECS_ENGINE_AUTH_TYPE=docker
ECS_ENGINE_AUTH_DATA={"https://index.docker.io/v1/":{"username":"{{docker_username}}","password":"{{docker_password}}","email":"{{docker_email}}"}}
					CONFIG

					file "/ecs.config", content: ecs_config, context: {
						cluster_name: ecs_cluster,
						docker_username: docker_username,
						docker_password: docker_password,
						docker_email: docker_email
					}
				end

				tag "Name", machine_tag, propagate_at_launch: true
			end

			asg

		end
	end
end