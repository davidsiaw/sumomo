# frozen_string_literal: true

module Sumomo
  class AzDetector
    def initialize(region)
      @region = region
    end

    def ec2
      @ec2 ||= Aws::EC2::Client.new(region: @region)
    end

    def resp
      @resp ||= ec2.describe_availability_zones
    end

    def zones
      @zones ||= resp.availability_zones.map(&:zone_name)
    end

    def zone_ids
      @zone_ids ||= resp.availability_zones.map(&:zone_id)
    end
  end
end
