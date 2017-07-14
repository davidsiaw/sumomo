
module Sumomo
  module Stack
    def make_cdn_from_dir(domain:, dir:, low_ttl: [])

        bucket_name = @bucket_name

        puts "Uploading files..."
        `aws s3 sync #{dir} "s3://#{bucket_name}/uploads/#{domain}" --size-only --delete`
        puts "Done."

        oai = make "Custom::OriginAccessIdentity"

        make "AWS::S3::BucketPolicy" do
            Bucket "#{bucket_name}"
            PolicyDocument({
                Version: "2008-10-17",
                Id: "PolicyForCloudFrontPrivateContent",
                Statement: [
                    {
                        Effect: "Allow",
                        Principal: {
                            CanonicalUser: oai.S3CanonicalUserId
                        },
                        Action: "s3:GetObject",
                        Resource: "arn:aws:s3:::#{bucket_name}/uploads/#{domain}/*"
                    }
                ]
            })
        end

        make "AWS::CloudFront::Distribution" do
            DistributionConfig do
                Origins [{
                    Id: "originBucket",
                    DomainName: "#{bucket_name}.s3.amazonaws.com",
                    OriginPath: "/uploads/#{domain}",
                    S3OriginConfig: {
                        OriginAccessIdentity: oai
                    }
                }]

                CacheBehaviors low_ttl.map{ |pattern|
                    {
                        PathPattern: pattern,
                        ForwardedValues: {
                            QueryString: "false",
                            Cookies: { Forward: "none" }
                        },
                        TargetOriginId: "originBucket",
                        ViewerProtocolPolicy: "allow-all",
                        DefaultTTL: 60,
                        MaxTTL: 60,
                        MinTTL: 60
                    }
                }.to_a

                Enabled "true"
                DefaultRootObject "index.html"
                Aliases [ domain ]
                ViewerCertificate { CloudFrontDefaultCertificate "true" } 

                DefaultCacheBehavior do
                    AllowedMethods ["GET", "HEAD", "OPTIONS"]
                    TargetOriginId "originBucket"
                    ViewerProtocolPolicy "allow-all"
                    ForwardedValues {
                        QueryString "false"
                        Cookies { Forward "none" }
                    }
                end

                Logging do
                    IncludeCookies "false"
                    Bucket "#{bucket_name}.s3.amazonaws.com"
                    Prefix "logs/#{domain}/"
                end
            end
        end
    end
  end
end
