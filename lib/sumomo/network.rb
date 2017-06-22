require "active_support/inflector"
require "hashie"

module Sumomo
	module Stack

		def make_network(layers: [])

			zones = get_azs()

			region = @region

			vpc = make "AWS::EC2::VPC" do
				CidrBlock "10.0.0.0/16"
				EnableDnsSupport true
				EnableDnsHostnames true
				tag "Name", call("Fn::Join", "-", [ref("AWS::StackName")])
			end

			gateway = make "AWS::EC2::InternetGateway" do
				tag "Name", call("Fn::Join", "-", [ref("AWS::StackName")])
			end

			attachment = make "AWS::EC2::VPCGatewayAttachment" do
				VpcId vpc
				InternetGatewayId gateway
			end

			inet_route_table = make "AWS::EC2::RouteTable" do
				depends_on attachment
				VpcId vpc
				tag "Name", call("Fn::Join", "-", ["public", ref("AWS::StackName")])
			end

			make "AWS::EC2::Route" do
				RouteTableId inet_route_table
				DestinationCidrBlock "0.0.0.0/0"
				GatewayId gateway
			end

			last_unused_number = 0

			subnet_numbers = []

			#load current config
			number_hash = {}
			subnet_hash = {}

			ec2 = Aws::EC2::Client.new(region: @region)
			ec2_subnets = ec2.describe_subnets().subnets
			ec2_subnets.each do |subnet|
				if subnet.tags.select {|x| x.key == "aws:cloudformation:stack-name" && x.value == @bucket_name}.length == 1
					layer = /^#{@bucket_name}-(?<layer_name>.+)-[a-z]+$/.match(subnet.tags.select{|x| x.key == "Name"}.first.value)[:layer_name]
					zone = subnet.availability_zone
					number = /^10.0.(?<num>[0-9]+).0/.match(subnet.cidr_block)[:num].to_i

					key = "#{layer}/#{zone}"
					number_hash[number] = key
					subnet_hash[key] = number
				end
			end

			# assign numbers to unassigned subnets
			layers.product(zones).each do |e|
				key = "#{e[0]}/#{e[1]}"
				if !subnet_hash.has_key?(key)
					loop do
						break if !number_hash.has_key?(last_unused_number)
						last_unused_number += 1
					end
					number_hash[last_unused_number] = key
					subnet_hash[key] = last_unused_number
					subnet_numbers << [e, last_unused_number]
				else
					subnet_numbers << [e, subnet_hash[key]]
				end
			end

			subnets = {}

			subnet_numbers.each do |e, subnet_number|
				layer = e[0]
				zone = e[1]

				zone_letter = zone.sub("#{region}", "")
				cidr = "10.0.#{subnet_number}.0/24"

				subnet = make "AWS::EC2::Subnet", name: "SubnetFor#{layer.camelize}Layer#{zone_letter.upcase}" do
					AvailabilityZone zone
					VpcId vpc
					CidrBlock cidr

					tag("Name", call("Fn::Join", "-", [ ref("AWS::StackName"), "#{layer}", zone_letter] ) )
				end

				make "AWS::EC2::SubnetRouteTableAssociation", name: "SubnetRTAFor#{layer.camelize}Layer#{zone_letter.upcase}" do
					SubnetId subnet
					RouteTableId inet_route_table
				end

				subnets[layer] ||= []
				subnets[layer] << {name: subnet, cidr: cidr, zone: zone}
			end

			Hashie::Mash.new vpc: vpc, subnets: subnets, azs: zones, attachment: attachment
		end
	end
end