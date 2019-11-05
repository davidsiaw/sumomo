# frozen_string_literal: true

module Sumomo
  module Stack
    def cloudflare_hosted_zone(domain_name:, key:, email:)
      root_name = /(?<root_name>[^.]+\.[^.]+)$/.match(domain_name)[:root_name]

      hz = make 'AWS::Route53::HostedZone' do
        Name domain_name
      end

      (0..3).each do |i|
        make 'Custom::CloudflareDNSEntry' do
          Key key
          Email email
          Domain root_name
          Entry domain_name.sub(/#{root_name}$/, '').chomp('.')
          NS hz.NameServers[i]
        end
      end

      hz
    end
  end
end
