# frozen_string_literal: true

require 'active_support/inflector'
require 'hashie'

module Sumomo
  module Stack
    def make_vpc
      make 'AWS::EC2::VPC' do
        CidrBlock '10.0.0.0/16'
        EnableDnsSupport true
        EnableDnsHostnames true
        tag 'Name', call('Fn::Join', '-', [ref('AWS::StackName')])
      end
    end

    def make_gateway
      make 'AWS::EC2::InternetGateway' do
        tag 'Name', call('Fn::Join', '-', [ref('AWS::StackName')])
      end
    end

    def make_network(
        layers: [], 
        use_vpc: nil,
        use_gateway: nil
      )
      zones = get_azs

      region = @region

      vpc = use_vpc || make_vpc

      gateway = use_gateway
      if gateway.nil?
        gateway = make_gateway
      end

      attachment = nil

      if !use_vpc && !use_gateway
        attachment = make 'AWS::EC2::VPCGatewayAttachment' do
          VpcId vpc
          InternetGatewayId gateway
        end
      end

      inet_route_table = make 'AWS::EC2::RouteTable' do
        if attachment
          depends_on attachment
        end
        VpcId vpc
        tag 'Name', call('Fn::Join', '-', ['public', ref('AWS::StackName')])
      end

      if gateway != false
        make 'AWS::EC2::Route' do
          RouteTableId inet_route_table
          DestinationCidrBlock '0.0.0.0/0'
          GatewayId gateway
        end
      end

      last_unused_number = 0

      subnet_numbers = []

      # load current config
      number_hash = {}
      subnet_hash = {}

      ec2 = Aws::EC2::Client.new(region: @region)
      ec2_subnets = ec2.describe_subnets.subnets
      ec2_subnets.each do |subnet|
        unless subnet.tags.select { |x| x.key == 'aws:cloudformation:stack-name' && x.value == @bucket_name }.length == 1
          next
        end

        layer = /^#{@bucket_name}-(?<layer_name>.+)-[a-z]+$/.match(subnet.tags.select { |x| x.key == 'Name' }.first.value)[:layer_name]
        zone = subnet.availability_zone
        number = /^10.0.(?<num>[0-9]+).0/.match(subnet.cidr_block)[:num].to_i

        key = "#{layer}/#{zone}"
        number_hash[number] = key
        subnet_hash[key] = number
      end

      # assign numbers to unassigned subnets
      layers.product(zones).each do |e|
        key = "#{e[0]}/#{e[1]}"
        if !subnet_hash.key?(key)
          loop do
            break unless number_hash.key?(last_unused_number)

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

        zone_letter = zone.sub(region.to_s, '')
        cidr = "10.0.#{subnet_number}.0/24"

        subnet = make 'AWS::EC2::Subnet', name: "SubnetFor#{layer.camelize}Layer#{zone_letter.upcase}" do
          AvailabilityZone zone
          VpcId vpc
          CidrBlock cidr

          tag('Name', call('Fn::Join', '-', [ref('AWS::StackName'), layer.to_s, zone_letter]))
        end

        make 'AWS::EC2::SubnetRouteTableAssociation', name: "SubnetRTAFor#{layer.camelize}Layer#{zone_letter.upcase}" do
          SubnetId subnet
          RouteTableId inet_route_table
        end

        subnets[layer] ||= []
        subnets[layer] << { name: subnet, cidr: cidr, zone: zone }
      end

      Hashie::Mash.new vpc: vpc, subnets: subnets, azs: zones, attachment: attachment
    end
  end
end
