
require 'momo'
require 's3cabinet'
require 'aws-sdk'
require 'zip'

require "sumomo/version"
require 'sumomo/stack'
require 'sumomo/momo_extensions/resource'
require 'sumomo/momo_extensions/stack'

module Sumomo

	def self.update_stack(name:, region:, &block)

		cf = Aws::CloudFormation::Client.new(region: region)
		s3 = Aws::S3::Client.new(region: region)

		begin
			s3.head_bucket(bucket: name)
		rescue
			s3.create_bucket(bucket: name)
		end

		store = S3Cabinet::S3Cabinet.new(nil, nil, name, region)

		dummy_number = store.get("cloudformation/dummy_number")
		if dummy_number == nil
			dummy_number = 0
		end
		dummy_number += 1
		store.set("cloudformation/dummy_number", dummy_number)

		hidden_values = []

		template = Momo::cfl do
			inject Sumomo::Stack

			@version_number = dummy_number
			@custom_resources = {}
			@bucket_name = name
			@store = store

			make "AWS::EC2::SecurityGroup", name: "DummyResource" do
				GroupDescription "Dummy thing for Cloudformation Deployment."
				Tags [{"Key" => "Name", "Value" => "dummyfordeploy#{dummy_number}"}]
			end

			make_exec_role

			instance_eval(&block)

			hidden_values = @hidden_values

		end.templatize

		store.set_raw("cloudformation/template", template)

		update_options = {
			stack_name: name, 
			template_url: store.url("cloudformation/template"), 
			parameters: hidden_values,
			capabilities: ["CAPABILITY_IAM"]

		}

		begin
			cf.update_stack(update_options)
		rescue => e
			update_options[:timeout_in_minutes] = 30
			cf.create_stack(update_options)
		end
	end

	def self.wait_for_stack(name:, region:)
		cf = Aws::CloudFormation::Client.new(region: region)

		stack_id = name

		begin
			resp = cf.describe_stack_events(stack_name: stack_id)
			top_event = resp.stack_events[0]
			top_event_id = top_event.event_id
			puts "#{top_event.logical_resource_id} #{top_event.resource_status} #{top_event.resource_status_reason}"
		rescue => e
			puts "describe_stack_events: #{e.message}"
		end

		failure_count = 0
		loop do 
			begin
				unless /^arn\:/.match(stack_id)
					stack_id = cf.describe_stacks(stack_name: stack_id).stacks[0].stack_id
					#puts "Unique Stack ID: #{stack_id}"
				end

				resp = cf.describe_stack_events(stack_name: stack_id)
				curr = 0
				lines = []
				loop do 
					curr_event = resp.stack_events[curr]
					break if curr_event.event_id == top_event_id
					lines << "#{curr_event.logical_resource_id} #{curr_event.resource_status} #{curr_event.resource_status_reason}"
					break if curr == resp.stack_events.length - 1
					curr += 1
				end

				lines.reverse.each { |x| puts x }

				top_event_id = resp.stack_events[0].event_id
			rescue => e
				puts "describe_stack_events: #{e.message}"
				failure_count += 1
				break if failure_count > 5
			end


			sleep 1
			begin
				resp = cf.describe_stacks(stack_name: stack_id)

				break if /(COMPLETE)|(FAILED)$/.match(resp.stacks[0].stack_status)

			rescue => e
				puts "describe_stacks: #{e.message}"
				break
			end
		end 
	end

	def self.delete_stack(name:, region:, retain_bucket: false)
		cf = Aws::CloudFormation::Client.new(region: region)

		cf.delete_stack(stack_name: name)

		if !retain_bucket
			self.wait_for_stack(name: name, region: region)
			s3 = Aws::S3::Resource.new(region: region)
			bucket = s3.bucket(name)
			bucket.delete!
		end
	end

	def self.get_stack_outputs(name:, region:)
		cf = Aws::CloudFormation::Client.new(region: region)

		map = {}
		cf.describe_stacks(stack_name: name).stacks[0].outputs.each do |x|
			map[x.output_key] = x.output_value
		end

		map
	end

	singleton_class.send(:alias_method, :create_stack, :update_stack)
end
