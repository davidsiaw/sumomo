
module Sumomo
	module Stack

		def cloudflare_hosted_zone(domain_name:,key:,email:)
			root_name = /(?<root_name>[^.]+\.[^.]+)$/.match(domain_name)[:root_name]

			hz = make "AWS::Route53::HostedZone" do
				Name domain_name
			end

			for i in 0..3
				make "Custom::CloudflareDNSEntry" do
					Key key
					Email email
					Domain root_name
					Entry domain_name.sub(/#{root_name}$/, "").chomp(".")
					NS hz.NameServers[i]
				end
			end

			return hz
		end
	end
end