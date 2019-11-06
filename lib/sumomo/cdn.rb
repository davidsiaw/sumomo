# frozen_string_literal: true

module Sumomo
  module Stack
    def copy_to_uploads!(from_directory, to_directory)
      bucket_name = @bucket_name
      location = "s3://#{bucket_name}/uploads/#{to_directory}"

      puts 'Uploading files...'
      `aws --version`
      `aws s3 --region #{@region} sync #{from_directory} "#{location}" --size-only --delete`
      puts 'Done.'

      location
    end

    def make_cdn_from_dir(domain:, cert: nil, dns: nil, name: nil, dir:, low_ttl: [], lambda_assocs: {})
      bucket_name = @bucket_name

      name ||= make_default_resource_name('CDN')

      copy_to_uploads!(dir, domain)

      oai = make 'Custom::OriginAccessIdentity'

      make 'AWS::S3::BucketPolicy' do
        Bucket bucket_name.to_s
        PolicyDocument(
          Version: '2008-10-17',
          Id: 'PolicyForCloudFrontPrivateContent',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                CanonicalUser: oai.S3CanonicalUserId
              },
              Action: 's3:GetObject',
              Resource: "arn:aws:s3:::#{bucket_name}/uploads/#{domain}/*"
            }
          ]
        )
      end

      viewer_policy = 'allow-all'
      viewer_policy = 'redirect-to-https' if cert

      cdn = make 'AWS::CloudFront::Distribution', name: name do
        DistributionConfig do
          Origins [{
            Id: 'originBucket',
            DomainName: "#{bucket_name}.s3.amazonaws.com",
            OriginPath: "/uploads/#{domain}",
            S3OriginConfig: {
              OriginAccessIdentity: oai
            }
          }]

          CacheBehaviors low_ttl.map { |pattern|
            {
              PathPattern: pattern,
              ForwardedValues: {
                QueryString: 'false',
                Cookies: { Forward: 'none' }
              },
              TargetOriginId: 'originBucket',
              ViewerProtocolPolicy: viewer_policy,
              DefaultTTL: 60,
              MaxTTL: 60,
              MinTTL: 60
            }
          }.to_a

          Enabled 'true'
          DefaultRootObject 'index.html'
          Aliases [domain]

          if cert
            ViewerCertificate do
              AcmCertificateArn cert
              SslSupportMethod 'sni-only'
            end
          else
            ViewerCertificate { CloudFrontDefaultCertificate 'true' }
          end

          DefaultCacheBehavior do
            AllowedMethods %w[GET HEAD OPTIONS]
            TargetOriginId 'originBucket'
            ViewerProtocolPolicy viewer_policy
            ForwardedValues do
              QueryString 'false'
              Cookies { Forward 'none' }
            end

            LambdaFunctionAssociations lambda_assocs.map do |event_type, arns|
              arns.map do |arn|
                { EventType: event_type, LambdaFunctionARN: arn }
              end.to_a
            end.flatten
          end

          Logging do
            IncludeCookies 'false'
            Bucket "#{bucket_name}.s3.amazonaws.com"
            Prefix "logs/#{domain}/"
          end
        end
      end

      root_name = /(?<root_name>[^.]+\.[^.]+)$/.match(domain)[:root_name]

      if !dns

      elsif dns[:type] == :cloudflare
        make 'Custom::CloudflareDNSEntry', name: "#{name}CloudFlareEntry" do
          Key dns[:key]
          Email dns[:email]
          Domain root_name
          Entry domain.sub(/#{root_name}$/, '').chomp('.')
          CNAME cdn.DomainName
        end
      elsif dns[:type] == :route53
        make 'AWS::Route53::RecordSet', name: "#{name}Route53Entry" do
          HostedZoneId dns[:hosted_zone]
          Name domain
          Type 'CNAME'
          ResourceRecords [cdn.DomainName]
        end
      end

      cdn
    end
  end
end
