var typeToPattern = {
     'a1.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'a1.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
       'a1.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'a1.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
       'a1.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'a1.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'c1.medium': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'c1.xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'c3.2xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'c3.4xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'c3.8xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
       'c3.large': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'c3.xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'c4.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c4.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c4.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'c4.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c4.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5.18xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5.9xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'c5.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'c5.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5a.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5a.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5a.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5a.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5a.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5a.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5a.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5a.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5d.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5d.18xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5d.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5d.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5d.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5d.9xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5d.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5d.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5d.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c5n.18xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5n.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5n.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'c5n.9xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5n.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'c5n.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'c5n.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'c6g.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6g.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6g.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6g.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6g.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'c6g.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'c6g.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'c6g.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'c6g.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'c6gd.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'c6gd.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gd.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gd.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gd.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'c6gd.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6gd.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'c6gd.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6gd.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'c6gn.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'c6gn.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gn.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gn.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'c6gn.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'c6gn.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6gn.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'c6gn.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'cc2.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd2.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd2.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd2.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'd2.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd3.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd3.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'd3.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'd3.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'g2.2xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'g2.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
    'g3.16xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'g3.4xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'g3.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'g3s.xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
  'g4ad.16xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4ad.2xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4ad.4xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4ad.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
    'g4ad.xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
  'g4dn.12xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
  'g4dn.16xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4dn.2xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4dn.4xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'g4dn.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'g4dn.metal': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
    'g4dn.xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'i2.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i2.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i2.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'i2.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'i3.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i3.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i3.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i3.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'i3.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'i3.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'i3.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'i3en.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'i3en.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'i3en.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'i3en.3xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'i3en.6xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i3en.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'i3en.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'i3en.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'inf1.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'inf1.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'inf1.6xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'inf1.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'm1.large': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'm1.medium': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
       'm1.small': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'm1.xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'm2.2xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'm2.4xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'm2.xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     'm3.2xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
       'm3.large': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'm3.medium': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
      'm3.xlarge': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
    'm4.10xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm4.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm4.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm4.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'm4.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm4.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'm5.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'm5.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5a.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5a.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5a.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5a.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5a.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5a.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5a.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5a.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5ad.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5ad.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5ad.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5ad.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5ad.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5ad.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5ad.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5ad.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5d.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5d.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5d.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5d.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5d.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5d.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5d.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5d.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5d.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5dn.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5dn.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5dn.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5dn.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5dn.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5dn.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5dn.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5dn.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5dn.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5n.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5n.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5n.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5n.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5n.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5n.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5n.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm5n.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5n.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'm5zn.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5zn.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5zn.3xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm5zn.6xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5zn.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm5zn.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm5zn.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm6g.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'm6g.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'm6g.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'm6g.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'm6g.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'm6g.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'm6g.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'm6g.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'm6g.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'm6gd.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'm6gd.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'm6gd.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'm6gd.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'm6gd.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'm6gd.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'm6gd.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'm6gd.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'm6gd.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'm6i.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm6i.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm6i.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm6i.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'm6i.32xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm6i.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'm6i.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'm6i.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'm6i.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'mac1.metal': { pattern:                      'amzn-ec2-macos-*' },
    'p2.16xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'p2.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
      'p2.xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
    'p3.16xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'p3.2xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'p3.8xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
  'p3dn.24xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
   'p4d.24xlarge': { pattern: 'amzn2-ami-ecs-gpu-hvm-2.0.*x86_64-ebs' },
     'r3.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r3.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r3.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'r3.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r3.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r4.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r4.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r4.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r4.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'r4.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r4.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'r5.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       'r5.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5a.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5a.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5a.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5a.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5a.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5a.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5a.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5a.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5ad.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5ad.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5ad.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5ad.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5ad.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5ad.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5ad.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5ad.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5b.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5b.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5b.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5b.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5b.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5b.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5b.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5b.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5b.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5d.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5d.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5d.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5d.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5d.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5d.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5d.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5d.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5d.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5dn.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5dn.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
  'r5dn.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5dn.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5dn.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5dn.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5dn.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5dn.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5dn.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5n.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5n.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r5n.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5n.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5n.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'r5n.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5n.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'r5n.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'r5n.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'r6g.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'r6g.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'r6g.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'r6g.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'r6g.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'r6g.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'r6g.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      'r6g.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'r6g.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'r6gd.12xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
  'r6gd.16xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'r6gd.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'r6gd.4xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'r6gd.8xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'r6gd.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'r6gd.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     'r6gd.metal': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
    'r6gd.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
       't1.micro': { pattern:          'amzn2-ami-pv-2.0.*x86_64-ebs' },
     't2.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't2.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't2.medium': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't2.micro': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
        't2.nano': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't2.small': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't2.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     't3.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't3.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't3.medium': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't3.micro': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
        't3.nano': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't3.small': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't3.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    't3a.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't3a.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     't3a.medium': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't3a.micro': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
       't3a.nano': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      't3a.small': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     't3a.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    't4g.2xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      't4g.large': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     't4g.medium': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      't4g.micro': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
       't4g.nano': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
      't4g.small': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
     't4g.xlarge': { pattern:      'amzn2-ami-ecs-hvm-2.0.*arm64-ebs' },
   'vt1.24xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'vt1.3xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'vt1.6xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'x1.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'x1.32xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'x1e.16xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'x1e.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'x1e.32xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'x1e.4xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'x1e.8xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'x1e.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
   'z1d.12xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'z1d.2xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'z1d.3xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
    'z1d.6xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'z1d.large': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
      'z1d.metal': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' },
     'z1d.xlarge': { pattern:     'amzn2-ami-ecs-hvm-2.0.*x86_64-ebs' }
}

var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

var describeImagesParams = {
  Filters: [{ Name: "name", Values: [typeToPattern[request.ResourceProperties.InstanceType].pattern]}],
  Owners: [request.ResourceProperties.Architecture == "HVMG2" ? "679593333241" : "amazon"]
};

// Check if the image is a beta or rc image. The Lambda function won't return any of those images.
function isBeta(imageName) {
    return imageName.toLowerCase().indexOf("beta") > -1 || imageName.toLowerCase().indexOf(".rc") > -1;
}

// Get AMI IDs with the specified name pattern and owner
ec2.describeImages(describeImagesParams, function(err, describeImagesResult)
{
  if (err)
  {
    console.log(err, err.stack); // an error occurred
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
  }
  else
  {
    var response = {}
    var id = "NONE";
    var images = describeImagesResult.Images;
    // Sort images by name in descending order. The names contain the AMI version, formatted as YYYY.MM.Ver.
    images.sort(function(x, y) { return y.Name.localeCompare(x.Name); });
    for (var j = 0; j < images.length; j++)
    {
        if (isBeta(images[j].Name)) continue;
        id = images[j].ImageId;
        response["Name"] = images[j].Name;
        response["ImageType"] = images[j].ImageType;
        response["CreationDate"] = images[j].CreationDate;
        response["Description"] = images[j].Description;
        response["RootDeviceType"] = images[j].RootDeviceType;
        response["RootDeviceName"] = images[j].RootDeviceName;
        response["VirtualizationType"] = images[j].VirtualizationType;
        break;
    }
    Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", id);
  }
});
