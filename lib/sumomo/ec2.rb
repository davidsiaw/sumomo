# frozen_string_literal: true

module Sumomo
  module Stack
    def get_azs
      resp = @ec2.describe_availability_zones

      Array(resp.availability_zones.map(&:zone_name))
    end

    def allow_port(thing)
      if thing == :all
        {
          'IpProtocol' => '-1',
          'ToPort' => 65_535,
          'FromPort' => 0,
          'CidrIp' => '0.0.0.0/0'
        }
      elsif thing.is_a?(Integer) && (thing > 0) && (thing < 65_536)
        # its a port!
        {
          'IpProtocol' => 'tcp',
          'ToPort' => thing,
          'FromPort' => thing,
          'CidrIp' => '0.0.0.0/0'
        }
      elsif thing.is_a?(String) && %r{[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+/[0-9]+}.match(thing)
        # its a cidr!
        {
          'IpProtocol' => 'tcp',
          'ToPort' => 65_535,
          'FromPort' => 0,
          'CidrIp' => thing
        }
      elsif thing.is_a? Hash
        # more shit
        {
          'IpProtocol' => thing[:protocol] || 'tcp',
          'ToPort' => thing[:port] || thing[:end_port] || 0,
          'FromPort' => thing[:port] || thing[:start_port] || 65_535,
          'CidrIp' => thing[:cidr] || '0.0.0.0/0'
        }
      else
        raise 'utils.rb allow: please allow something'
      end
    end

    def http_listener(port: 80, instance_port: port)
      {
        'LoadBalancerPort' => port,
        'InstancePort' => instance_port,
        'Protocol' => 'HTTP'
      }
    end

    def https_listener(cert_arn:, instance_port: 80, port: 443)
      res = http_listener(instance_port)
      res['LoadBalancerPort'] = lb_port
      res['Protocol'] = 'HTTPS'
      res['SSLCertificateId'] = cert_arn

      res
    end

    def elb_tcp_health_check(port: 80, healthy_threshold: 2, interval: 10, timeout: 5, unhealthy_threshold: 10, path: '/')
      elb_health_check(port: port,
                       healthy_threshold: healthy_threshold,
                       interval: interval,
                       timeout: timeout,
                       unhealthy_threshold: unhealthy_threshold,
                       path: path,
                       check_type: 'TCP')
    end

    def elb_health_check(port: 80,
                         healthy_threshold: 2,
                         interval: 10,
                         timeout: 5,
                         unhealthy_threshold: 10,
                         path: '/',
                         check_type: 'HTTP')

      options[:path] = "/#{options[:path]}"
      options[:path].gsub!(%r{^[/]+}, '/')
      {
        'HealthyThreshold' => options[:healthy_threshold] || 2,
        'Interval' => options[:interval] || 10,
        'Target' => "#{check_type}:#{port}#{options[:path]}",
        'Timeout' => options[:timeout] || 5,
        'UnhealthyThreshold' => options[:unhealthy_threshold] || 10
      }
    end

    def initscript(wait_handle, asgname, script)
      call('Fn::Base64',
           call('Fn::Join', '', [

                  "#!/bin/bash -v\n",
                  "yum install -y aws-cfn-bootstrap\n",
                  "yum update -y aws-cfn-bootstrap\n",

                  "# Helper function\n",
                  "function error_exit\n",
                  "{\n",
                  '  /opt/aws/bin/cfn-signal -e 1 -r "$1" "', wait_handle, "\"\n",
                  "  exit 1\n",
                  "}\n",

                  "# Run init meta\n",
                  '/opt/aws/bin/cfn-init -s ', ref('AWS::StackId'), ' -r ', asgname, ' ',
                  '    --region ', ref('AWS::Region'), " || error_exit 'Failed to run cfn-init'\n",

                  "# Run script\n",
                  script,

                  "\n",

                  "# All is well so signal success\n",
                  '/opt/aws/bin/cfn-signal -e 0 -r "Setup complete" "', wait_handle, "\"\n"
                ]))
    end

    class EC2Tasks
      def initialize(bucket_name, &block)
        @script = ''
        @bucket_name = bucket_name
        @tags = []
        instance_eval(&block) if block
      end

      def mkdir(name)
        @script += <<~SNIPPET
          sudo mkdir -p #{name}
        SNIPPET
      end

      def download_file(name, local_path)
        @script += <<~SNIPPET
          sudo aws s3 cp s3://#{@bucket_name}/uploads/#{name} #{local_path}
        SNIPPET
      end

      attr_reader :script

      attr_reader :tags

      def tag(name, value)
        @tags << [name, value]
      end
    end

    def make_spotter(
      price:,
      network:,
      layer:,
      ec2_sns_arn: nil,
      ecs_cluster: nil,
      eip: nil,
      &block
    )
      update_time = Time.now.to_i

      spot = make 'Custom::SelectSpot' do
        DateTime update_time
        ExcludeString '1.,2.,small,micro'
        LookBack 3
        TargetPrice price
      end

      switcher1_src = define_custom_resource(name: 'ASGSelector1', code: <<-CODE
				store.get("num1", function(num) {
					num = parseInt(num);
					if (request.RequestType != "Delete")
					{
						store.put("num1", String(num+1));
					}
					else
					{
						store.put("num1", String(0));
					}

					Cloudformation.send(request, context, Cloudformation.SUCCESS, {Num: String(num)}, "Success", String(num % 2));
				}, function() {
					store.put("num1", String(1));
					Cloudformation.send(request, context, Cloudformation.SUCCESS, {Num: 1}, "Success", String(1));
				});
      CODE
                                            )

      switcher2_src = define_custom_resource(name: 'ASGSelector2', code: <<-CODE
				store.get("num2", function(num) {
					num = parseInt(num);
					if (request.RequestType != "Delete")
					{
						store.put("num2", String(num+1));
					}
					else
					{
						store.put("num1", String(0));
					}

					Cloudformation.send(request, context, Cloudformation.SUCCESS, {Num: String(num)}, "Success", String((num + 1) % 2));
				}, function() {
					store.put("num2", String(1));
					Cloudformation.send(request, context, Cloudformation.SUCCESS, {Num: 1}, "Success", String(0));
				});
      CODE
                                            )

      size_1 = make_custom switcher1_src, name: 'ASGSelector1Value' do
        DateTime update_time
      end

      size_2 = make_custom switcher2_src, name: 'ASGSelector2Value' do
        DateTime update_time
      end

      make_autoscaling_group(
        type: spot,
        network: network,
        layer: 'ecs',
        zone: spot.Zone,
        spot_price: price,
        min_size: size_1,
        ec2_sns_arn: ec2_sns_arn,
        ecs_cluster: ecs_cluster,
        eip: eip, &block
      )

      make_autoscaling_group(
        type: spot,
        network: network,
        layer: 'ecs',
        zone: spot.Zone,
        spot_price: price,
        min_size: size_2,
        ec2_sns_arn: ec2_sns_arn,
        ecs_cluster: ecs_cluster,
        eip: eip
      )
    end

    def make_autoscaling_group(
      network:,
      layer:,
      zone: nil,
      type: 'm3.medium',
      name: nil,
      elb: nil,
      min_size: 1,
      max_size: min_size,
      vol_size: 10,
      vol_type: 'gp2',
      keypair: @master_key_name,
      has_public_ips: true,
      ingress: nil,
      egress: nil,
      security_groups: [],
      machine_tag: nil,
      ec2_sns_arn: nil,
      ami_name: nil,
      ebs_root_device: nil,
      spot_price: nil,
      script: nil,
      ecs_cluster: nil,
      docker_username: '',
      docker_email: '',
      docker_password: '',
      eip: nil,
      policies: [],
      scalein_protection: true,
      &block
    )

      if ami_name.nil?

        @ami_lookup_resources ||= {}

        unless @ami_lookup_resources[type]
          @ami_lookup_resources[type] = make 'Custom::AMILookup' do
            InstanceType type
          end
        end

        ami_name = @ami_lookup_resources[type]
        if ebs_root_device.nil?
          ebs_root_device = @ami_lookup_resources[type].RootDeviceName
   end
      end

      tasks = EC2Tasks.new(@bucket_name, &block)

      task_script = tasks.script

      ingress ||= [allow_port(:all)]
      egress ||= [allow_port(:all)]
      machine_tag ||= ref('AWS::StackName')
      name ||= make_default_resource_name('AutoScalingGroup')
      script ||= ''

      bucket_name = @bucket_name

      script_arr = [script]

      script_arr << task_script

      if ecs_cluster
        script_arr << <<~ECS_START

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

      if eip
        script_arr << <<~EIP_ALLOCATE
          aws ec2 associate-address --region `cat /etc/aws_region` --instance-id `curl http://169.254.169.254/latest/meta-data/instance-id` --allocation-id `cat /etc/eip_allocation_id`
        EIP_ALLOCATE
      end

      script_arr << "service spot-watcher start" if(spot_price && ec2_sns_arn)

      unless ingress.is_a? Array
        raise 'ec2: ingress option needs to be an array'
       end
      raise 'ec2: egress option needs to be an array' unless egress.is_a? Array

      web_sec_group = make 'AWS::EC2::SecurityGroup' do
        GroupDescription "Security group for layer: #{layer}"
        SecurityGroupIngress ingress
        SecurityGroupEgress egress
        VpcId network.vpc
      end

      wait_handle = make 'AWS::CloudFormation::WaitConditionHandle'

      user_data = initscript(wait_handle, name, call('Fn::Join', "\n", script_arr))

      role_policy_doc = {
        'Version' => '2012-10-17',
        'Statement' => [{
          'Effect' => 'Allow',
          'Principal' => { 'Service' => ['ec2.amazonaws.com'] },
          'Action' => ['sts:AssumeRole']
        }]
      }

      asg_role = make 'AWS::IAM::Role' do
        AssumeRolePolicyDocument role_policy_doc
        Path '/'
        Policies [{
          'PolicyName' => 'root',
          'PolicyDocument' => {
            'Version' => '2012-10-17',
            'Statement' => [{
              'Effect' => 'Allow',
              'Action' => ['sns:Publish'],
              'Resource' => '*'
            },
                            {
                              'Effect' => 'Allow',
                              'Action' => ['s3:DeleteObject', 's3:GetObject', 's3:PutObject'],
                              'Resource' => "arn:aws:s3:::#{bucket_name}/uploads/*"
                            },
                            {
                              'Effect' => 'Allow',
                              'Action' => [
                                'ec2:AllocateAddress',
                                'ec2:AssociateAddress',
                                'ec2:DescribeAddresses',
                                'ec2:DisassociateAddress'
                              ],
                              'Resource' => '*'
                            },
                            {
                              'Effect' => 'Allow',
                              'Action' => [
                                'ecs:DeregisterContainerInstance',
                                'ecs:DiscoverPollEndpoint',
                                'ecs:Poll',
                                'ecs:RegisterContainerInstance',
                                'ecs:StartTelemetrySession',
                                'ecs:Submit*',
                                'ecr:GetAuthorizationToken',
                                'ecr:BatchCheckLayerAvailability',
                                'ecr:GetDownloadUrlForLayer',
                                'ecr:BatchGetImage',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                              ],
                              "Resource": '*'
                            }] + policies
          }
        }]
      end

      asg_profile = make 'AWS::IAM::InstanceProfile' do
        Path '/'
        Roles [asg_role]
      end

      launch_config = make 'AWS::AutoScaling::LaunchConfiguration' do
        AssociatePublicIpAddress has_public_ips
        KeyName keypair
        SecurityGroups [web_sec_group] + security_groups
        ImageId ami_name
        UserData user_data
        InstanceType type
        IamInstanceProfile asg_profile
        SpotPrice spot_price if spot_price
        BlockDeviceMappings [{
          'DeviceName' => ebs_root_device,
          'Ebs' => {
            'VolumeType' => vol_type,
            'VolumeSize' => vol_size
          }
        }]
      end

      zones_used = network.azs
      subnet_ids = network.subnets[layer].map { |x| x[:name] }

      if zone
        # if we only specified a single zone, then we have to do some processing
        res = define_custom_resource(name: "SubnetIdentifierCodeFor#{name}", code: <<-CODE
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

        zones_used = [zone]
        subnet_ids = [identifier]
      end

      asg = make 'AWS::AutoScaling::AutoScalingGroup', name: name do
        depends_on network.attachment

        AvailabilityZones zones_used

        Cooldown 30
        MinSize min_size
        MaxSize max_size

        VPCZoneIdentifier subnet_ids

        NewInstancesProtectedFromScaleIn scalein_protection

        LaunchConfigurationName launch_config
        LoadBalancerNames [elb] if elb

        if ec2_sns_arn
          NotificationConfigurations [
            {
              'NotificationTypes' => [
                'autoscaling:EC2_INSTANCE_LAUNCH',
                'autoscaling:EC2_INSTANCE_LAUNCH_ERROR',
                'autoscaling:EC2_INSTANCE_TERMINATE',
                'autoscaling:EC2_INSTANCE_TERMINATE_ERROR',
                'autoscaling:TEST_NOTIFICATION'
              ],
              'TopicARN' => ec2_sns_arn
            }
          ]
        end

        file '/etc/aws_region', content: '{{ region }}', context: {
          region: ref('AWS::Region')
        }

        if ec2_sns_arn
          file '/etc/sns_arn', content: '{{ sns_arn }}', context: {
            sns_arn: ec2_sns_arn
          }
        end

        if eip
          file '/etc/eip_allocation_id', content: '{{ id }}', context: {
            id: eip.AllocationId
          }
        end

        if spot_price && ec2_sns_arn
          watcher = File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'sources', 'spot-watcher.sh'))
          poller = File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'sources', 'spot-watcher-poller.sh'))

          file '/etc/init.d/spot-watcher', content: watcher, mode: '000700'
          file '/bin/spot-watcher', content: poller, mode: '000700', context: {
            sns_arn: ec2_sns_arn,
            region: ref('AWS::Region')
          }
        end

        if ecs_cluster
          ecs_config = <<~CONFIG
            ECS_CLUSTER={{ cluster_name }}
            ECS_ENGINE_AUTH_TYPE=docker
            ECS_ENGINE_AUTH_DATA={"https://index.docker.io/v1/":{"username":"{{docker_username}}","password":"{{docker_password}}","email":"{{docker_email}}"}}
          CONFIG

          file '/ecs.config', content: ecs_config, context: {
            cluster_name: ecs_cluster,
            docker_username: docker_username,
            docker_password: docker_password,
            docker_email: docker_email
          }
        end

        tag 'Name', machine_tag, propagate_at_launch: true

        tasks.tags.each do |t|
          tag t[0], t[1], propagate_at_launch: true
        end
      end

      asg
    end
  end
end
