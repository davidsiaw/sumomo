# frozen_string_literal: true

require 'momo'
require 's3cabinet'
require 'aws-sdk'
require 'zip'
require 'yaml'

require 'sumomo/version'
require 'sumomo/api'
require 'sumomo/cdn'
require 'sumomo/dns'
require 'sumomo/ec2'
require 'sumomo/ecs'
require 'sumomo/stack'
require 'sumomo/network'
require 'sumomo/momo_extensions/resource'
require 'sumomo/momo_extensions/stack'

module Sumomo
  def self.make_master_key_name(name:)
    "#{name}_master_key"
  end

  def self.make_master_key_key(name:)
    "cloudformation/#{make_master_key_name(name: name)}.pem"
  end

  def self.create_stack(name:, region:, sns_arn: nil, &block)
    cf = Aws::CloudFormation::Client.new(region: region)
    begin
      cf.describe_stacks(stack_name: name)
      raise "There is already a stack named '#{name}'"
    rescue Aws::CloudFormation::Errors::ValidationError
      update_stack(name: name, region: region, sns_arn: sns_arn, &block)
    end
  end

  def self.update_stack(name:, region:, sns_arn: nil, changeset: false, &block)
    cf = Aws::CloudFormation::Client.new(region: region)
    s3 = Aws::S3::Client.new(region: region)
    ec2 = Aws::EC2::Client.new(region: region)

    begin
      s3.head_bucket(bucket: name)
    rescue Aws::S3::Errors::NotFound => e
      s3.create_bucket(bucket: name)
    end

    store = S3Cabinet::S3Cabinet.new(nil, nil, name, region)

    master_key_name = make_master_key_name(name: name)
    master_key_key = make_master_key_key(name: name)

    unless store.get(master_key_key)

      resp = nil
      begin
        puts 'No master key found, creating...'
        resp = ec2.create_key_pair(key_name: master_key_name)
      rescue StandardError
        puts 'Master key conflict! Deleting old one'
        ec2.delete_key_pair(key_name: master_key_name)
        resp = ec2.create_key_pair(key_name: master_key_name)
      end

      store.set(master_key_key, resp.key_material)
      store.set("#{master_key_key}.fingerprint", resp.key_fingerprint)

    end

    dummy_number = store.get('cloudformation/dummy_number')
    dummy_number = 0 if dummy_number.nil?
    dummy_number += 1
    store.set('cloudformation/dummy_number', dummy_number)

    hidden_values = []

    template = Momo.cfl do
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
      @has_dummy = true
      @dummy_vpc = nil
      @timeout = nil

      instance_eval(&block)

      dummy_vpc = @dummy_vpc

      if @has_dummy
        make 'AWS::EC2::SecurityGroup', name: 'DummyResource' do
          GroupDescription 'Dummy resource for tracking Cloudformation Deployment.'
          VpcId dummy_vpc unless dummy_vpc.nil?
          Tags [{ 'Key' => 'Name', 'Value' => "dummyfordeploy#{dummy_number}" }]
        end
      end

      hidden_values = @hidden_values
    end.templatize

    # TODO: if the template is too big, split it into nested templates

    # puts JSON.parse(template).to_yaml

    store.set_raw('cloudformation/template', template)

    update_options = {
      stack_name: name,
      template_url: store.url('cloudformation/template'),
      parameters: hidden_values,
      capabilities: ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
    }

    update_options[disable_rollback] = false if !changeset

    begin
      if changeset
        cf.create_change_set(
          **update_options,
          change_set_name: "Change#{curtimestr}"
        )
      else
        cf.update_stack(update_options)
      end

    rescue StandardError => e
      if e.message.end_with? 'does not exist'
        update_options[:timeout_in_minutes] = @timeout if @timeout
        update_options[:notification_arns] = sns_arn if sns_arn
        cf.create_stack(update_options)
      else
        p e
        puts "Error: #{e.message}"
      end
    end
  end

  def self.curtimestr
    Time.now.strftime('%Y%m%d%H%M%S')
  end

  def self.wait_for_stack(name:, region:)
    cf = Aws::CloudFormation::Client.new(region: region)

    stack_id = name

    begin
      resp = cf.describe_stack_events(stack_name: stack_id)
      top_event = resp.stack_events[0]
      top_event_id = top_event.event_id
      puts "#{top_event.logical_resource_id} #{top_event.resource_status} #{top_event.resource_status_reason}"
    rescue StandardError => e
      puts "describe_stack_events: #{e.message}"
    end

    failure_count = 0
    loop do
      begin
        unless /^arn\:/.match(stack_id)
          stack_id = cf.describe_stacks(stack_name: stack_id).stacks[0].stack_id
          # puts "Unique Stack ID: #{stack_id}"
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
      rescue StandardError => e
        puts "describe_stack_events: #{e.message}"
        failure_count += 1
        break if failure_count > 5
      end

      sleep 1
      begin
        resp = cf.describe_stacks(stack_name: stack_id)

        break if /(COMPLETE$)|(FAILED$)/.match(resp.stacks[0].stack_status)
      rescue StandardError => e
        puts "describe_stacks: #{e.message}"
        break
      end
    end
  end

  class APITester
    attr_accessor :apis
    def initialize(&block)
      @apis = {}
      instance_eval(&block)
    end

    def make_api(_domain_name,
      name:, script: nil,
      dns: nil,
      mtls_truststore: nil,
      cert: nil,
      with_statements: [], &block)

      # we ignore mtls_truststore here
      @apis[name] = block
    end

    def method_missing(name, *args, &block); end
  end

  def self.test_api(apiname, pretty_print, &block)
    tester = APITester.new(&block)
    test_name = nil
    if tester.apis.length == 1
      test_name = tester.apis.keys.first
    elsif apiname
      if tester.apis.key? apiname
        test_name = apiname
      else
        puts "Unknown API name. Please choose from one of the APIs: #{tester.apis.keys.inspect}"
      end
    else
      puts "Please choose from one of the APIs: #{tester.apis.keys.inspect}"
    end

    if test_name
      puts "Testing API #{test_name}"
      apigen = Stack::APIGenerator.new(pretty_print: pretty_print, &tester.apis[test_name])

      script = File.read(File.join(Gem.loaded_specs['sumomo'].full_gem_path, 'data', 'sumomo', 'api_modules', 'test_script.js'))
      script.sub!('// {{ ROUTES }}', apigen.generate)
      script.gsub!('{{ SCRIPT }}', apigen.init_script)

      File.write('.test.js', script)
      Stack::APIGenerator.combine_modules('.test_modules')

      exec 'NODE_PATH=.test_modules node .test.js'
    end
  end

  def self.delete_stack(name:, region:, retain_bucket: false)
    cf = Aws::CloudFormation::Client.new(region: region)
    ec2 = Aws::EC2::Client.new(region: region)

    cf.delete_stack(stack_name: name)
    ec2.delete_key_pair(key_name: make_master_key_name(name: name))

    unless retain_bucket
      wait_for_stack(name: name, region: region)
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
end
