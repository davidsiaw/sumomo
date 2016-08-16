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

			subnets = {}

			layers.product(zones).each_with_index do |e, subnet_number|
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