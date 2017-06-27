require 'momo'
require 's3cabinet'
require 'aws-sdk'
require 'zip'
require 'yaml'
require "bunny/tsort"

require "sumomo/version"
require 'sumomo/ec2'
require 'sumomo/ecs'
require 'sumomo/stack'
require 'sumomo/network'
require 'sumomo/momo_extensions/resource'
require 'sumomo/momo_extensions/stack'

module Sumomo

	class SplittableTemplate

		attr_accessor :child_templates, :modified_resouces, :add_parameters, :add_outputs

		def initialize(template_str)
			@template = JSON.parse(template_str)

			@child_templates = [] # child templates
			@modified_resouces = {} # modified resources
			@add_parameters = {} # additional parameters from parent
			@add_outputs = {} # additional outputs to parent

			@inparams = {} # map from resource name to parameter names
			@outparams = {} # map from expression to new expression for getting outputs
			@params_by_resource = {} # map from resource name to parameter expression
			@expr_to_modified = {} # expr to modified expression

			@analysis = analyse
		end

		def add_child_template(parent)
			templ = {}
			parent.keys.each do |x|
				templ[x] = {}
			end
			templ["AWSTemplateFormatVersion"] = parent["AWSTemplateFormatVersion"]
			@child_templates << { 
				name: "ChildTemplate#{@child_templates.count+1}",
				template: SplittableTemplate.new(templ.to_json),
				resource: {
					"Type" => "AWS::CloudFormation::Stack",
					"Properties" => {
						"Parameters" => {},
						"TemplateURL" => ""
					}
				}
			}
		end

		def move_to_child(res_name)

			child_template = @child_templates.last
			if child_template == nil
				# no available child template
				add_child_template(@template)
				child_template = @child_templates.last
			end

			@params_by_resource[res_name] = {}

			# add resource to child
			child_template[:template].modified_resouces[res_name] = child_copy(@template["Resources"][res_name], res_name)

			# remove our resource
			@modified_resouces[res_name] = :delete

			# add parameters
			@params_by_resource[res_name].each do |k,v|
				child_template[:resource]["Properties"]["Parameters"][k] = v
				child_template[:template].add_parameters[k] = {
					"Type" => "String",
					"NoEcho" => true
				}
			end

			# add outputs and references
			@analysis[:resource_to_expr_hash][res_name].each do |expr|
				child_output_name = "ChildOutput#{@outparams.count+1}"

				@outparams[expr] = { "Fn::GetAtt" => [ child_template[:name], child_output_name ] } if !@outparams.has_key?(expr)

				child_template[:template].add_outputs[child_output_name] = {
					"Value" => expr
				}
			end


		end

		def child_copy(expr, res_name)
			if expr.is_a?(Hash)
				if (expr.has_key?("Ref") && !expr["Ref"].start_with?("AWS::")) || expr.has_key?("Fn::GetAtt")
					@inparams[expr] = "ParentValue#{@inparams.count + 1}" if !@inparams.has_key?(expr)
					@params_by_resource[res_name][@inparams[expr]] = expr
					{ "Ref" => @inparams[expr] }
				else
					expr.map { |k,v| [k, child_copy(v, res_name)] }.to_h
				end
			elsif expr.is_a?(Array)
				expr.map{ |x| child_copy(x, res_name) }.to_a
			else
				Marshal.load(Marshal.dump(expr))
			end

		end

		def result_template
			res = @template.clone

			@modified_resouces.each do |k,v|
				if v == :delete
					res["Resources"].delete(k)
				else
					res["Resources"][k] = v
				end
			end

			@child_templates.each do |t|
				res["Resources"][t[:name]] = t[:resource]
			end

			@add_parameters.each do |k,v|
				res["Parameters"][k] = v
			end

			@add_outputs.each do |k,v|
				res["Outputs"][k] = v
			end

			res["Resources"].each do |res_name, resource|
				res["Resources"][res_name] = fix_exprs(resource)
			end

			res["Outputs"].each do |output_name, output|
				res["Outputs"][output_name]["Value"] = fix_exprs(output["Value"])
			end

			res
		end

		def fix_exprs(expr)

			if expr.is_a?(Hash)
				if @outparams.has_key?(expr)
					@outparams[expr]
				else
					expr
				end
			elsif expr.is_a?(Array)
				expr.map{ |x| fix_exprs(x) }.to_a
			else
				expr
			end

		end

		def find_ref(expr)
			if expr.is_a?(Hash)
				if expr.has_key?("Ref") || expr.has_key?("Fn::GetAtt")
					[expr]
				else
					expr.values.map{ |x| find_ref(x) }.flatten
				end
			elsif expr.is_a?(Array)
				expr.map{ |x| find_ref(x) }.flatten
			else
				[]
			end
		end

		def analyse

			ref_exprs = @template["Resources"].map do |name, value|
				ref_expr_array = []
				value["Properties"].each do |propkey, propval|
					ref_expr_array += find_ref(propval)
				end
				[name, ref_expr_array]
			end.to_h

			ref_exprs["O:Output"] = []
			@template["Outputs"].each do |name, expr|
				ref_exprs["O:Output"] += find_ref(expr)
			end

			# make dependency graph
			dep_graph = {}
			expr_hash = {}
			expr_resource_hash = {}

			resource_to_expr_hash = {}

			ref_exprs.each do |res_name, exprs|
				dep_graph[res_name] = {}
				exprs.each do |expr|

					referenced_resource = nil
					if expr["Ref"]
						referenced_resource = expr["Ref"]
					elsif expr["Fn::GetAtt"]
						referenced_resource = expr["Fn::GetAtt"][0]
					end
					dep_graph[res_name][referenced_resource] = true if referenced_resource

					expr_hash[expr] = 0 if !expr_hash.has_key?(expr)
					expr_hash[expr] += 1

					expr_resource_hash[expr] = {} if !expr_resource_hash.has_key?(expr)
					expr_resource_hash[expr][res_name] = true

					resource_to_expr_hash[referenced_resource] = [] if !resource_to_expr_hash.has_key?(referenced_resource)
					resource_to_expr_hash[referenced_resource] << expr

				end
				dep_graph[res_name] = dep_graph[res_name].
					keys.
					select{|x| !x.start_with?("AWS::")}.
					map{|x| @template["Parameters"].has_key?(x) ? "P:#{x}" : x }
			end


			# reverse graph
			rev_dep_graph = {}

			dep_graph.each do |res_name,parents|
				rev_dep_graph[res_name] = {} if !rev_dep_graph.has_key?(res_name)
				parents.each do |parent|
					rev_dep_graph[parent] = {} if !rev_dep_graph.has_key?(parent)
					rev_dep_graph[parent][res_name] = true
				end
			end

			rev_dep_graph.each do |res_name, dep_hash|
				rev_dep_graph[res_name] = dep_hash.keys
			end

			#puts "Dep graph"
			#p dep_graph

			#puts "Rev dep graph"
			#p rev_dep_graph

			dep_count = {}
			@template["Resources"].keys.each do |k|
				dep_count[k] = rev_dep_graph[k].count + dep_graph[k].count
			end

			#p dep_count.to_a.sort_by{|x| x[1]}

			#puts Bunny::Tsort.tsort(dep_graph).map{|x| "#{x.inspect}\n"}

			#p template["Resources"].count

			#puts expr_resource_hash.to_yaml

			{
				ref_exprs: ref_exprs,
				dep_graph: dep_graph,
				rev_dep_graph: rev_dep_graph,
				dep_count: dep_count,
				expr_hash: expr_hash,
				expr_resource_hash: expr_resource_hash,
				resource_to_expr_hash: resource_to_expr_hash,
				layers: Bunny::Tsort.tsort(dep_graph),
				res_count: @template["Resources"].count
			}
		end
	end



	def self.make_master_key_name(name:)
		"#{name}_master_key"
	end

	def self.make_master_key_key(name:)
		"cloudformation/#{make_master_key_name(name: name)}.pem"
	end

	def self.update_stack(name:, region:, sns_arn:nil, &block)

		cf = Aws::CloudFormation::Client.new(region: region)
		s3 = Aws::S3::Client.new(region: region)
		ec2 = Aws::EC2::Client.new(region: region)

		limits = {
			resources: 6,
			parameters: 3,
			outputs: 3
		}

		begin
			s3.head_bucket(bucket: name)
		rescue Aws::S3::Errors::NotFound => e
			s3.create_bucket(bucket: name)
		end

		store = S3Cabinet::S3Cabinet.new(nil, nil, name, region)

		master_key_name = make_master_key_name(name: name)
		master_key_key = make_master_key_key(name: name)

		if !store.get(master_key_key)

			resp = nil
			begin
				puts "No master key found, creating..."
				resp = ec2.create_key_pair(key_name: master_key_name)
			rescue
				puts "Master key conflict! Deleting old one"
				ec2.delete_key_pair(key_name: master_key_name)
				resp = ec2.create_key_pair(key_name: master_key_name)
			end
			
			store.set(master_key_key, resp.key_material)
			store.set("#{master_key_key}.fingerprint", resp.key_fingerprint)

		end

		dummy_number = store.get("cloudformation/dummy_number")
		if dummy_number == nil
			dummy_number = 0
		end
		dummy_number += 1
		store.set("cloudformation/dummy_number", dummy_number)

		hidden_values = []

		template = Momo::cfl do
			inject Sumomo::Stack

			@region = region
			@version_number = dummy_number
			@custom_resources = {}
			@bucket_name = name
			@store = store
			@master_key_name = master_key_name
			@ec2 = ec2
			@cf = cf
			@s3 = s3

			make "AWS::EC2::SecurityGroup", name: "DummyResource" do
				GroupDescription "Dummy thing for Cloudformation Deployment."
				Tags [{"Key" => "Name", "Value" => "dummyfordeploy#{dummy_number}"}]
			end

			make_exec_role

			instance_eval(&block)

			hidden_values = @hidden_values

		end.templatize

		# TODO if the template is too big, split it into nested templates
		splitter = SplittableTemplate.new(template)


			splitter.move_to_child("DeployTime2")

			puts splitter.result_template.to_yaml
			splitter.child_templates.each do |t|
				puts t[:template].result_template.to_yaml
			end
			exit(1)

		#puts JSON.parse(template).to_yaml
		
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
			if e.message.end_with? "does not exist"
				update_options[:timeout_in_minutes] = 30
				update_options[:notification_arns] = sns_arn if sns_arn
				cf.create_stack(update_options)
			else
				p e
				puts "Error: #{e.message}"
			end
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

				break if /(COMPLETE$)|(FAILED$)/.match(resp.stacks[0].stack_status)

			rescue => e
				puts "describe_stacks: #{e.message}"
				break
			end
		end 
	end

	def self.delete_stack(name:, region:, retain_bucket: false)
		cf = Aws::CloudFormation::Client.new(region: region)
		ec2 = Aws::EC2::Client.new(region: region)

		cf.delete_stack(stack_name: name)
		ec2.delete_key_pair(key_name: make_master_key_name(name: name))

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
