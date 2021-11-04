var ec2 = new aws.EC2({region: request.ResourceProperties.Region});

if (request.RequestType == "Delete")
{
  Cloudformation.send(request, context, Cloudformation.SUCCESS, {}, "Success");
  return;
}

var prices = []

var exclude_string = request.ResourceProperties.ExcludeString || "" 
var look_back = request.ResourceProperties.LookBack;
var want_to_pay = request.ResourceProperties.TargetPrice;

var exclude = exclude_string.split(",")

var typeToCapability = {
     'a1.2xlarge': { cpu:   8192, memory:   16384, gen: 1, ecu:  20480, arch:      'arm64' },
     'a1.4xlarge': { cpu:  16384, memory:   32768, gen: 1, ecu:  40960, arch:      'arm64' },
       'a1.large': { cpu:   2048, memory:    4096, gen: 1, ecu:   5120, arch:      'arm64' },
      'a1.medium': { cpu:   1024, memory:    2048, gen: 1, ecu:   2560, arch:      'arm64' },
       'a1.metal': { cpu:  16384, memory:   32768, gen: 1, ecu:  40960, arch:      'arm64' },
      'a1.xlarge': { cpu:   4096, memory:    8192, gen: 1, ecu:  10240, arch:      'arm64' },
      'c1.medium': { cpu:   2048, memory:    1740, gen: 1, ecu:   6144, arch:     'x86_64' },
      'c1.xlarge': { cpu:   8192, memory:    7168, gen: 1, ecu:  24576, arch:     'x86_64' },
     'c3.2xlarge': { cpu:   8192, memory:   15360, gen: 3, ecu:  32768, arch:     'x86_64' },
     'c3.4xlarge': { cpu:  16384, memory:   30720, gen: 3, ecu:  65536, arch:     'x86_64' },
     'c3.8xlarge': { cpu:  32768, memory:   61440, gen: 3, ecu: 131072, arch:     'x86_64' },
       'c3.large': { cpu:   2048, memory:    3840, gen: 3, ecu:   8192, arch:     'x86_64' },
      'c3.xlarge': { cpu:   4096, memory:    7680, gen: 3, ecu:  16384, arch:     'x86_64' },
     'c4.2xlarge': { cpu:   8192, memory:   15360, gen: 4, ecu:  36864, arch:     'x86_64' },
     'c4.4xlarge': { cpu:  16384, memory:   30720, gen: 4, ecu:  73728, arch:     'x86_64' },
     'c4.8xlarge': { cpu:  36864, memory:   61440, gen: 4, ecu: 165888, arch:     'x86_64' },
       'c4.large': { cpu:   2048, memory:    3840, gen: 4, ecu:   9216, arch:     'x86_64' },
      'c4.xlarge': { cpu:   4096, memory:    7680, gen: 4, ecu:  18432, arch:     'x86_64' },
    'c5.12xlarge': { cpu:  49152, memory:   98304, gen: 5, ecu: 245760, arch:     'x86_64' },
    'c5.18xlarge': { cpu:  73728, memory:  147456, gen: 5, ecu: 368640, arch:     'x86_64' },
    'c5.24xlarge': { cpu:  98304, memory:  196608, gen: 5, ecu: 491520, arch:     'x86_64' },
     'c5.2xlarge': { cpu:   8192, memory:   16384, gen: 5, ecu:  40960, arch:     'x86_64' },
     'c5.4xlarge': { cpu:  16384, memory:   32768, gen: 5, ecu:  81920, arch:     'x86_64' },
     'c5.9xlarge': { cpu:  36864, memory:   73728, gen: 5, ecu: 184320, arch:     'x86_64' },
       'c5.large': { cpu:   2048, memory:    4096, gen: 5, ecu:  10240, arch:     'x86_64' },
       'c5.metal': { cpu:  98304, memory:  196608, gen: 5, ecu: 491520, arch:     'x86_64' },
      'c5.xlarge': { cpu:   4096, memory:    8192, gen: 5, ecu:  20480, arch:     'x86_64' },
   'c5a.12xlarge': { cpu:  49152, memory:   98304, gen: 5, ecu: 245760, arch:     'x86_64' },
   'c5a.16xlarge': { cpu:  65536, memory:  131072, gen: 5, ecu: 327680, arch:     'x86_64' },
   'c5a.24xlarge': { cpu:  98304, memory:  196608, gen: 5, ecu: 491520, arch:     'x86_64' },
    'c5a.2xlarge': { cpu:   8192, memory:   16384, gen: 5, ecu:  40960, arch:     'x86_64' },
    'c5a.4xlarge': { cpu:  16384, memory:   32768, gen: 5, ecu:  81920, arch:     'x86_64' },
    'c5a.8xlarge': { cpu:  32768, memory:   65536, gen: 5, ecu: 163840, arch:     'x86_64' },
      'c5a.large': { cpu:   2048, memory:    4096, gen: 5, ecu:  10240, arch:     'x86_64' },
     'c5a.xlarge': { cpu:   4096, memory:    8192, gen: 5, ecu:  20480, arch:     'x86_64' },
   'c5d.12xlarge': { cpu:  49152, memory:   98304, gen: 5, ecu: 245760, arch:     'x86_64' },
   'c5d.18xlarge': { cpu:  73728, memory:  147456, gen: 5, ecu: 368640, arch:     'x86_64' },
   'c5d.24xlarge': { cpu:  98304, memory:  196608, gen: 5, ecu: 491520, arch:     'x86_64' },
    'c5d.2xlarge': { cpu:   8192, memory:   16384, gen: 5, ecu:  40960, arch:     'x86_64' },
    'c5d.4xlarge': { cpu:  16384, memory:   32768, gen: 5, ecu:  81920, arch:     'x86_64' },
    'c5d.9xlarge': { cpu:  36864, memory:   73728, gen: 5, ecu: 184320, arch:     'x86_64' },
      'c5d.large': { cpu:   2048, memory:    4096, gen: 5, ecu:  10240, arch:     'x86_64' },
      'c5d.metal': { cpu:  98304, memory:  196608, gen: 5, ecu: 491520, arch:     'x86_64' },
     'c5d.xlarge': { cpu:   4096, memory:    8192, gen: 5, ecu:  20480, arch:     'x86_64' },
   'c5n.18xlarge': { cpu:  73728, memory:  196608, gen: 5, ecu: 368640, arch:     'x86_64' },
    'c5n.2xlarge': { cpu:   8192, memory:   21504, gen: 5, ecu:  40960, arch:     'x86_64' },
    'c5n.4xlarge': { cpu:  16384, memory:   43008, gen: 5, ecu:  81920, arch:     'x86_64' },
    'c5n.9xlarge': { cpu:  36864, memory:   98304, gen: 5, ecu: 184320, arch:     'x86_64' },
      'c5n.large': { cpu:   2048, memory:    5376, gen: 5, ecu:  10240, arch:     'x86_64' },
      'c5n.metal': { cpu:  73728, memory:  196608, gen: 5, ecu: 368640, arch:     'x86_64' },
     'c5n.xlarge': { cpu:   4096, memory:   10752, gen: 5, ecu:  20480, arch:     'x86_64' },
   'c6g.12xlarge': { cpu:  49152, memory:   98304, gen: 6, ecu: 270336, arch:      'arm64' },
   'c6g.16xlarge': { cpu:  65536, memory:  131072, gen: 6, ecu: 360448, arch:      'arm64' },
    'c6g.2xlarge': { cpu:   8192, memory:   16384, gen: 6, ecu:  45056, arch:      'arm64' },
    'c6g.4xlarge': { cpu:  16384, memory:   32768, gen: 6, ecu:  90112, arch:      'arm64' },
    'c6g.8xlarge': { cpu:  32768, memory:   65536, gen: 6, ecu: 180224, arch:      'arm64' },
      'c6g.large': { cpu:   2048, memory:    4096, gen: 6, ecu:  11264, arch:      'arm64' },
     'c6g.medium': { cpu:   1024, memory:    2048, gen: 6, ecu:   5632, arch:      'arm64' },
      'c6g.metal': { cpu:  65536, memory:  131072, gen: 6, ecu: 360448, arch:      'arm64' },
     'c6g.xlarge': { cpu:   4096, memory:    8192, gen: 6, ecu:  22528, arch:      'arm64' },
  'c6gd.12xlarge': { cpu:  49152, memory:   98304, gen: 6, ecu: 270336, arch:      'arm64' },
  'c6gd.16xlarge': { cpu:  65536, memory:  131072, gen: 6, ecu: 360448, arch:      'arm64' },
   'c6gd.2xlarge': { cpu:   8192, memory:   16384, gen: 6, ecu:  45056, arch:      'arm64' },
   'c6gd.4xlarge': { cpu:  16384, memory:   32768, gen: 6, ecu:  90112, arch:      'arm64' },
   'c6gd.8xlarge': { cpu:  32768, memory:   65536, gen: 6, ecu: 180224, arch:      'arm64' },
     'c6gd.large': { cpu:   2048, memory:    4096, gen: 6, ecu:  11264, arch:      'arm64' },
    'c6gd.medium': { cpu:   1024, memory:    2048, gen: 6, ecu:   5632, arch:      'arm64' },
     'c6gd.metal': { cpu:  65536, memory:  131072, gen: 6, ecu: 360448, arch:      'arm64' },
    'c6gd.xlarge': { cpu:   4096, memory:    8192, gen: 6, ecu:  22528, arch:      'arm64' },
  'c6gn.12xlarge': { cpu:  49152, memory:   98304, gen: 6, ecu: 270336, arch:      'arm64' },
  'c6gn.16xlarge': { cpu:  65536, memory:  131072, gen: 6, ecu: 360448, arch:      'arm64' },
   'c6gn.2xlarge': { cpu:   8192, memory:   16384, gen: 6, ecu:  45056, arch:      'arm64' },
   'c6gn.4xlarge': { cpu:  16384, memory:   32768, gen: 6, ecu:  90112, arch:      'arm64' },
   'c6gn.8xlarge': { cpu:  32768, memory:   65536, gen: 6, ecu: 180224, arch:      'arm64' },
     'c6gn.large': { cpu:   2048, memory:    4096, gen: 6, ecu:  11264, arch:      'arm64' },
    'c6gn.medium': { cpu:   1024, memory:    2048, gen: 6, ecu:   5632, arch:      'arm64' },
    'c6gn.xlarge': { cpu:   4096, memory:    8192, gen: 6, ecu:  22528, arch:      'arm64' },
    'cc2.8xlarge': { cpu:  32768, memory:   61952, gen: 2, ecu: 114688, arch:     'x86_64' },
     'd2.2xlarge': { cpu:   8192, memory:   62464, gen: 2, ecu:  24576, arch:     'x86_64' },
     'd2.4xlarge': { cpu:  16384, memory:  124928, gen: 2, ecu:  49152, arch:     'x86_64' },
     'd2.8xlarge': { cpu:  36864, memory:  249856, gen: 2, ecu: 110592, arch:     'x86_64' },
      'd2.xlarge': { cpu:   4096, memory:   31232, gen: 2, ecu:  12288, arch:     'x86_64' },
     'd3.2xlarge': { cpu:   8192, memory:   65536, gen: 3, ecu:  28672, arch:     'x86_64' },
     'd3.4xlarge': { cpu:  16384, memory:  131072, gen: 3, ecu:  57344, arch:     'x86_64' },
     'd3.8xlarge': { cpu:  32768, memory:  262144, gen: 3, ecu: 114688, arch:     'x86_64' },
      'd3.xlarge': { cpu:   4096, memory:   32768, gen: 3, ecu:  14336, arch:     'x86_64' },
     'g2.2xlarge': { cpu:   8192, memory:   15360, gen: 2, ecu:  24576, arch:     'x86_64' },
     'g2.8xlarge': { cpu:  32768, memory:   61440, gen: 2, ecu:  98304, arch:     'x86_64' },
    'g3.16xlarge': { cpu:  65536, memory:  499712, gen: 3, ecu: 229376, arch:     'x86_64' },
     'g3.4xlarge': { cpu:  16384, memory:  124928, gen: 3, ecu:  57344, arch:     'x86_64' },
     'g3.8xlarge': { cpu:  32768, memory:  249856, gen: 3, ecu: 114688, arch:     'x86_64' },
     'g3s.xlarge': { cpu:   4096, memory:   31232, gen: 3, ecu:  14336, arch:     'x86_64' },
  'g4ad.16xlarge': { cpu:  65536, memory:  262144, gen: 4, ecu: 262144, arch:     'x86_64' },
   'g4ad.2xlarge': { cpu:   8192, memory:   32768, gen: 4, ecu:  32768, arch:     'x86_64' },
   'g4ad.4xlarge': { cpu:  16384, memory:   65536, gen: 4, ecu:  65536, arch:     'x86_64' },
   'g4ad.8xlarge': { cpu:  32768, memory:  131072, gen: 4, ecu: 131072, arch:     'x86_64' },
    'g4ad.xlarge': { cpu:   4096, memory:   16384, gen: 4, ecu:  16384, arch:     'x86_64' },
  'g4dn.12xlarge': { cpu:  49152, memory:  196608, gen: 4, ecu: 196608, arch:     'x86_64' },
  'g4dn.16xlarge': { cpu:  65536, memory:  262144, gen: 4, ecu: 262144, arch:     'x86_64' },
   'g4dn.2xlarge': { cpu:   8192, memory:   32768, gen: 4, ecu:  32768, arch:     'x86_64' },
   'g4dn.4xlarge': { cpu:  16384, memory:   65536, gen: 4, ecu:  65536, arch:     'x86_64' },
   'g4dn.8xlarge': { cpu:  32768, memory:  131072, gen: 4, ecu: 131072, arch:     'x86_64' },
     'g4dn.metal': { cpu:  98304, memory:  393216, gen: 4, ecu: 393216, arch:     'x86_64' },
    'g4dn.xlarge': { cpu:   4096, memory:   16384, gen: 4, ecu:  16384, arch:     'x86_64' },
     'i2.2xlarge': { cpu:   8192, memory:   62464, gen: 2, ecu:  32768, arch:     'x86_64' },
     'i2.4xlarge': { cpu:  16384, memory:  124928, gen: 2, ecu:  65536, arch:     'x86_64' },
     'i2.8xlarge': { cpu:  32768, memory:  249856, gen: 2, ecu: 131072, arch:     'x86_64' },
      'i2.xlarge': { cpu:   4096, memory:   31232, gen: 2, ecu:  16384, arch:     'x86_64' },
    'i3.16xlarge': { cpu:  65536, memory:  499712, gen: 3, ecu: 294912, arch:     'x86_64' },
     'i3.2xlarge': { cpu:   8192, memory:   62464, gen: 3, ecu:  36864, arch:     'x86_64' },
     'i3.4xlarge': { cpu:  16384, memory:  124928, gen: 3, ecu:  73728, arch:     'x86_64' },
     'i3.8xlarge': { cpu:  32768, memory:  249856, gen: 3, ecu: 147456, arch:     'x86_64' },
       'i3.large': { cpu:   2048, memory:   15616, gen: 3, ecu:   9216, arch:     'x86_64' },
       'i3.metal': { cpu:  73728, memory:  524288, gen: 3, ecu: 331776, arch:     'x86_64' },
      'i3.xlarge': { cpu:   4096, memory:   31232, gen: 3, ecu:  18432, arch:     'x86_64' },
  'i3en.12xlarge': { cpu:  49152, memory:  393216, gen: 3, ecu: 221184, arch:     'x86_64' },
  'i3en.24xlarge': { cpu:  98304, memory:  786432, gen: 3, ecu: 442368, arch:     'x86_64' },
   'i3en.2xlarge': { cpu:   8192, memory:   65536, gen: 3, ecu:  36864, arch:     'x86_64' },
   'i3en.3xlarge': { cpu:  12288, memory:   98304, gen: 3, ecu:  55296, arch:     'x86_64' },
   'i3en.6xlarge': { cpu:  24576, memory:  196608, gen: 3, ecu: 110592, arch:     'x86_64' },
     'i3en.large': { cpu:   2048, memory:   16384, gen: 3, ecu:   9216, arch:     'x86_64' },
     'i3en.metal': { cpu:  98304, memory:  786432, gen: 3, ecu: 442368, arch:     'x86_64' },
    'i3en.xlarge': { cpu:   4096, memory:   32768, gen: 3, ecu:  18432, arch:     'x86_64' },
  'inf1.24xlarge': { cpu:  98304, memory:  196608, gen: 1, ecu: 344064, arch:     'x86_64' },
   'inf1.2xlarge': { cpu:   8192, memory:   16384, gen: 1, ecu:  28672, arch:     'x86_64' },
   'inf1.6xlarge': { cpu:  24576, memory:   49152, gen: 1, ecu:  86016, arch:     'x86_64' },
    'inf1.xlarge': { cpu:   4096, memory:    8192, gen: 1, ecu:  14336, arch:     'x86_64' },
       'm1.large': { cpu:   2048, memory:    7680, gen: 1, ecu:   5120, arch:     'x86_64' },
      'm1.medium': { cpu:   1024, memory:    3788, gen: 1, ecu:   2560, arch:     'x86_64' },
       'm1.small': { cpu:   1024, memory:    1740, gen: 1, ecu:   2560, arch:     'x86_64' },
      'm1.xlarge': { cpu:   4096, memory:   15360, gen: 1, ecu:  10240, arch:     'x86_64' },
     'm2.2xlarge': { cpu:   4096, memory:   35020, gen: 2, ecu:  12288, arch:     'x86_64' },
     'm2.4xlarge': { cpu:   8192, memory:   70041, gen: 2, ecu:  24576, arch:     'x86_64' },
      'm2.xlarge': { cpu:   2048, memory:   17510, gen: 2, ecu:   6144, arch:     'x86_64' },
     'm3.2xlarge': { cpu:   8192, memory:   30720, gen: 3, ecu:  28672, arch:     'x86_64' },
       'm3.large': { cpu:   2048, memory:    7680, gen: 3, ecu:   7168, arch:     'x86_64' },
      'm3.medium': { cpu:   1024, memory:    3840, gen: 3, ecu:   3584, arch:     'x86_64' },
      'm3.xlarge': { cpu:   4096, memory:   15360, gen: 3, ecu:  14336, arch:     'x86_64' },
    'm4.10xlarge': { cpu:  40960, memory:  163840, gen: 4, ecu: 163840, arch:     'x86_64' },
    'm4.16xlarge': { cpu:  65536, memory:  262144, gen: 4, ecu: 262144, arch:     'x86_64' },
     'm4.2xlarge': { cpu:   8192, memory:   32768, gen: 4, ecu:  32768, arch:     'x86_64' },
     'm4.4xlarge': { cpu:  16384, memory:   65536, gen: 4, ecu:  65536, arch:     'x86_64' },
       'm4.large': { cpu:   2048, memory:    8192, gen: 4, ecu:   8192, arch:     'x86_64' },
      'm4.xlarge': { cpu:   4096, memory:   16384, gen: 4, ecu:  16384, arch:     'x86_64' },
    'm5.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
    'm5.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
    'm5.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
     'm5.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
     'm5.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
     'm5.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
       'm5.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
       'm5.metal': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
      'm5.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
   'm5a.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
   'm5a.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
   'm5a.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
    'm5a.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
    'm5a.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
    'm5a.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
      'm5a.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
     'm5a.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
  'm5ad.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
  'm5ad.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
  'm5ad.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
   'm5ad.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
   'm5ad.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
   'm5ad.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
     'm5ad.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
    'm5ad.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
   'm5d.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
   'm5d.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
   'm5d.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
    'm5d.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
    'm5d.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
    'm5d.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
      'm5d.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
      'm5d.metal': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
     'm5d.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
  'm5dn.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
  'm5dn.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
  'm5dn.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
   'm5dn.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
   'm5dn.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
   'm5dn.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
     'm5dn.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
     'm5dn.metal': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
    'm5dn.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
   'm5n.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
   'm5n.16xlarge': { cpu:  65536, memory:  262144, gen: 5, ecu: 294912, arch:     'x86_64' },
   'm5n.24xlarge': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
    'm5n.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
    'm5n.4xlarge': { cpu:  16384, memory:   65536, gen: 5, ecu:  73728, arch:     'x86_64' },
    'm5n.8xlarge': { cpu:  32768, memory:  131072, gen: 5, ecu: 147456, arch:     'x86_64' },
      'm5n.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
      'm5n.metal': { cpu:  98304, memory:  393216, gen: 5, ecu: 442368, arch:     'x86_64' },
     'm5n.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
  'm5zn.12xlarge': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
   'm5zn.2xlarge': { cpu:   8192, memory:   32768, gen: 5, ecu:  36864, arch:     'x86_64' },
   'm5zn.3xlarge': { cpu:  12288, memory:   49152, gen: 5, ecu:  55296, arch:     'x86_64' },
   'm5zn.6xlarge': { cpu:  24576, memory:   98304, gen: 5, ecu: 110592, arch:     'x86_64' },
     'm5zn.large': { cpu:   2048, memory:    8192, gen: 5, ecu:   9216, arch:     'x86_64' },
     'm5zn.metal': { cpu:  49152, memory:  196608, gen: 5, ecu: 221184, arch:     'x86_64' },
    'm5zn.xlarge': { cpu:   4096, memory:   16384, gen: 5, ecu:  18432, arch:     'x86_64' },
   'm6g.12xlarge': { cpu:  49152, memory:  196608, gen: 6, ecu: 245760, arch:      'arm64' },
   'm6g.16xlarge': { cpu:  65536, memory:  262144, gen: 6, ecu: 327680, arch:      'arm64' },
    'm6g.2xlarge': { cpu:   8192, memory:   32768, gen: 6, ecu:  40960, arch:      'arm64' },
    'm6g.4xlarge': { cpu:  16384, memory:   65536, gen: 6, ecu:  81920, arch:      'arm64' },
    'm6g.8xlarge': { cpu:  32768, memory:  131072, gen: 6, ecu: 163840, arch:      'arm64' },
      'm6g.large': { cpu:   2048, memory:    8192, gen: 6, ecu:  10240, arch:      'arm64' },
     'm6g.medium': { cpu:   1024, memory:    4096, gen: 6, ecu:   5120, arch:      'arm64' },
      'm6g.metal': { cpu:  65536, memory:  262144, gen: 6, ecu: 327680, arch:      'arm64' },
     'm6g.xlarge': { cpu:   4096, memory:   16384, gen: 6, ecu:  20480, arch:      'arm64' },
  'm6gd.12xlarge': { cpu:  49152, memory:  196608, gen: 6, ecu: 245760, arch:      'arm64' },
  'm6gd.16xlarge': { cpu:  65536, memory:  262144, gen: 6, ecu: 327680, arch:      'arm64' },
   'm6gd.2xlarge': { cpu:   8192, memory:   32768, gen: 6, ecu:  40960, arch:      'arm64' },
   'm6gd.4xlarge': { cpu:  16384, memory:   65536, gen: 6, ecu:  81920, arch:      'arm64' },
   'm6gd.8xlarge': { cpu:  32768, memory:  131072, gen: 6, ecu: 163840, arch:      'arm64' },
     'm6gd.large': { cpu:   2048, memory:    8192, gen: 6, ecu:  10240, arch:      'arm64' },
    'm6gd.medium': { cpu:   1024, memory:    4096, gen: 6, ecu:   5120, arch:      'arm64' },
     'm6gd.metal': { cpu:  65536, memory:  262144, gen: 6, ecu: 327680, arch:      'arm64' },
    'm6gd.xlarge': { cpu:   4096, memory:   16384, gen: 6, ecu:  20480, arch:      'arm64' },
   'm6i.12xlarge': { cpu:  49152, memory:  196608, gen: 6, ecu: 245760, arch:     'x86_64' },
   'm6i.16xlarge': { cpu:  65536, memory:  262144, gen: 6, ecu: 327680, arch:     'x86_64' },
   'm6i.24xlarge': { cpu:  98304, memory:  393216, gen: 6, ecu: 491520, arch:     'x86_64' },
    'm6i.2xlarge': { cpu:   8192, memory:   32768, gen: 6, ecu:  40960, arch:     'x86_64' },
   'm6i.32xlarge': { cpu: 131072, memory:  524288, gen: 6, ecu: 655360, arch:     'x86_64' },
    'm6i.4xlarge': { cpu:  16384, memory:   65536, gen: 6, ecu:  81920, arch:     'x86_64' },
    'm6i.8xlarge': { cpu:  32768, memory:  131072, gen: 6, ecu: 163840, arch:     'x86_64' },
      'm6i.large': { cpu:   2048, memory:    8192, gen: 6, ecu:  10240, arch:     'x86_64' },
     'm6i.xlarge': { cpu:   4096, memory:   16384, gen: 6, ecu:  20480, arch:     'x86_64' },
     'mac1.metal': { cpu:  12288, memory:   32768, gen: 1, ecu:  30720, arch: 'x86_64_mac' },
    'p2.16xlarge': { cpu:  65536, memory:  749568, gen: 2, ecu: 196608, arch:     'x86_64' },
     'p2.8xlarge': { cpu:  32768, memory:  499712, gen: 2, ecu:  98304, arch:     'x86_64' },
      'p2.xlarge': { cpu:   4096, memory:   62464, gen: 2, ecu:  12288, arch:     'x86_64' },
    'p3.16xlarge': { cpu:  65536, memory:  499712, gen: 3, ecu: 229376, arch:     'x86_64' },
     'p3.2xlarge': { cpu:   8192, memory:   62464, gen: 3, ecu:  28672, arch:     'x86_64' },
     'p3.8xlarge': { cpu:  32768, memory:  249856, gen: 3, ecu: 114688, arch:     'x86_64' },
  'p3dn.24xlarge': { cpu:  98304, memory:  786432, gen: 3, ecu: 344064, arch:     'x86_64' },
   'p4d.24xlarge': { cpu:  98304, memory: 1179648, gen: 4, ecu: 393216, arch:     'x86_64' },
     'r3.2xlarge': { cpu:   8192, memory:   62464, gen: 3, ecu:  28672, arch:     'x86_64' },
     'r3.4xlarge': { cpu:  16384, memory:  124928, gen: 3, ecu:  57344, arch:     'x86_64' },
     'r3.8xlarge': { cpu:  32768, memory:  249856, gen: 3, ecu: 114688, arch:     'x86_64' },
       'r3.large': { cpu:   2048, memory:   15360, gen: 3, ecu:   7168, arch:     'x86_64' },
      'r3.xlarge': { cpu:   4096, memory:   31232, gen: 3, ecu:  14336, arch:     'x86_64' },
    'r4.16xlarge': { cpu:  65536, memory:  499712, gen: 4, ecu: 262144, arch:     'x86_64' },
     'r4.2xlarge': { cpu:   8192, memory:   62464, gen: 4, ecu:  32768, arch:     'x86_64' },
     'r4.4xlarge': { cpu:  16384, memory:  124928, gen: 4, ecu:  65536, arch:     'x86_64' },
     'r4.8xlarge': { cpu:  32768, memory:  249856, gen: 4, ecu: 131072, arch:     'x86_64' },
       'r4.large': { cpu:   2048, memory:   15616, gen: 4, ecu:   8192, arch:     'x86_64' },
      'r4.xlarge': { cpu:   4096, memory:   31232, gen: 4, ecu:  16384, arch:     'x86_64' },
    'r5.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
    'r5.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
    'r5.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
     'r5.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
     'r5.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
     'r5.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
       'r5.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
       'r5.metal': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
      'r5.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
   'r5a.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
   'r5a.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
   'r5a.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
    'r5a.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
    'r5a.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
    'r5a.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
      'r5a.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
     'r5a.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
  'r5ad.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
  'r5ad.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
  'r5ad.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
   'r5ad.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
   'r5ad.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
   'r5ad.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
     'r5ad.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
    'r5ad.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
   'r5b.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
   'r5b.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
   'r5b.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
    'r5b.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
    'r5b.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
    'r5b.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
      'r5b.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
      'r5b.metal': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
     'r5b.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
   'r5d.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
   'r5d.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
   'r5d.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
    'r5d.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
    'r5d.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
    'r5d.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
      'r5d.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
      'r5d.metal': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
     'r5d.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
  'r5dn.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
  'r5dn.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
  'r5dn.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
   'r5dn.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
   'r5dn.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
   'r5dn.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
     'r5dn.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
     'r5dn.metal': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
    'r5dn.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
   'r5n.12xlarge': { cpu:  49152, memory:  393216, gen: 5, ecu: 221184, arch:     'x86_64' },
   'r5n.16xlarge': { cpu:  65536, memory:  524288, gen: 5, ecu: 294912, arch:     'x86_64' },
   'r5n.24xlarge': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
    'r5n.2xlarge': { cpu:   8192, memory:   65536, gen: 5, ecu:  36864, arch:     'x86_64' },
    'r5n.4xlarge': { cpu:  16384, memory:  131072, gen: 5, ecu:  73728, arch:     'x86_64' },
    'r5n.8xlarge': { cpu:  32768, memory:  262144, gen: 5, ecu: 147456, arch:     'x86_64' },
      'r5n.large': { cpu:   2048, memory:   16384, gen: 5, ecu:   9216, arch:     'x86_64' },
      'r5n.metal': { cpu:  98304, memory:  786432, gen: 5, ecu: 442368, arch:     'x86_64' },
     'r5n.xlarge': { cpu:   4096, memory:   32768, gen: 5, ecu:  18432, arch:     'x86_64' },
   'r6g.12xlarge': { cpu:  49152, memory:  393216, gen: 6, ecu: 245760, arch:      'arm64' },
   'r6g.16xlarge': { cpu:  65536, memory:  524288, gen: 6, ecu: 327680, arch:      'arm64' },
    'r6g.2xlarge': { cpu:   8192, memory:   65536, gen: 6, ecu:  40960, arch:      'arm64' },
    'r6g.4xlarge': { cpu:  16384, memory:  131072, gen: 6, ecu:  81920, arch:      'arm64' },
    'r6g.8xlarge': { cpu:  32768, memory:  262144, gen: 6, ecu: 163840, arch:      'arm64' },
      'r6g.large': { cpu:   2048, memory:   16384, gen: 6, ecu:  10240, arch:      'arm64' },
     'r6g.medium': { cpu:   1024, memory:    8192, gen: 6, ecu:   5120, arch:      'arm64' },
      'r6g.metal': { cpu:  65536, memory:  524288, gen: 6, ecu: 327680, arch:      'arm64' },
     'r6g.xlarge': { cpu:   4096, memory:   32768, gen: 6, ecu:  20480, arch:      'arm64' },
  'r6gd.12xlarge': { cpu:  49152, memory:  393216, gen: 6, ecu: 245760, arch:      'arm64' },
  'r6gd.16xlarge': { cpu:  65536, memory:  524288, gen: 6, ecu: 327680, arch:      'arm64' },
   'r6gd.2xlarge': { cpu:   8192, memory:   65536, gen: 6, ecu:  40960, arch:      'arm64' },
   'r6gd.4xlarge': { cpu:  16384, memory:  131072, gen: 6, ecu:  81920, arch:      'arm64' },
   'r6gd.8xlarge': { cpu:  32768, memory:  262144, gen: 6, ecu: 163840, arch:      'arm64' },
     'r6gd.large': { cpu:   2048, memory:   16384, gen: 6, ecu:  10240, arch:      'arm64' },
    'r6gd.medium': { cpu:   1024, memory:    8192, gen: 6, ecu:   5120, arch:      'arm64' },
     'r6gd.metal': { cpu:  65536, memory:  524288, gen: 6, ecu: 327680, arch:      'arm64' },
    'r6gd.xlarge': { cpu:   4096, memory:   32768, gen: 6, ecu:  20480, arch:      'arm64' },
       't1.micro': { cpu:   1024, memory:     627, gen: 1, ecu:   1536, arch:     'x86_64' },
     't2.2xlarge': { cpu:   8192, memory:   32768, gen: 2, ecu:  16384, arch:     'x86_64' },
       't2.large': { cpu:   2048, memory:    8192, gen: 2, ecu:   4096, arch:     'x86_64' },
      't2.medium': { cpu:   2048, memory:    4096, gen: 2, ecu:   4096, arch:     'x86_64' },
       't2.micro': { cpu:   1024, memory:    1024, gen: 2, ecu:   2048, arch:     'x86_64' },
        't2.nano': { cpu:   1024, memory:     512, gen: 2, ecu:   2048, arch:     'x86_64' },
       't2.small': { cpu:   1024, memory:    2048, gen: 2, ecu:   2048, arch:     'x86_64' },
      't2.xlarge': { cpu:   4096, memory:   16384, gen: 2, ecu:   8192, arch:     'x86_64' },
     't3.2xlarge': { cpu:   8192, memory:   32768, gen: 3, ecu:  20480, arch:     'x86_64' },
       't3.large': { cpu:   2048, memory:    8192, gen: 3, ecu:   5120, arch:     'x86_64' },
      't3.medium': { cpu:   2048, memory:    4096, gen: 3, ecu:   5120, arch:     'x86_64' },
       't3.micro': { cpu:   2048, memory:    1024, gen: 3, ecu:   5120, arch:     'x86_64' },
        't3.nano': { cpu:   2048, memory:     512, gen: 3, ecu:   5120, arch:     'x86_64' },
       't3.small': { cpu:   2048, memory:    2048, gen: 3, ecu:   5120, arch:     'x86_64' },
      't3.xlarge': { cpu:   4096, memory:   16384, gen: 3, ecu:  10240, arch:     'x86_64' },
    't3a.2xlarge': { cpu:   8192, memory:   32768, gen: 3, ecu:  20480, arch:     'x86_64' },
      't3a.large': { cpu:   2048, memory:    8192, gen: 3, ecu:   5120, arch:     'x86_64' },
     't3a.medium': { cpu:   2048, memory:    4096, gen: 3, ecu:   5120, arch:     'x86_64' },
      't3a.micro': { cpu:   2048, memory:    1024, gen: 3, ecu:   5120, arch:     'x86_64' },
       't3a.nano': { cpu:   2048, memory:     512, gen: 3, ecu:   5120, arch:     'x86_64' },
      't3a.small': { cpu:   2048, memory:    2048, gen: 3, ecu:   5120, arch:     'x86_64' },
     't3a.xlarge': { cpu:   4096, memory:   16384, gen: 3, ecu:  10240, arch:     'x86_64' },
    't4g.2xlarge': { cpu:   8192, memory:   32768, gen: 4, ecu:  24576, arch:      'arm64' },
      't4g.large': { cpu:   2048, memory:    8192, gen: 4, ecu:   6144, arch:      'arm64' },
     't4g.medium': { cpu:   2048, memory:    4096, gen: 4, ecu:   6144, arch:      'arm64' },
      't4g.micro': { cpu:   2048, memory:    1024, gen: 4, ecu:   6144, arch:      'arm64' },
       't4g.nano': { cpu:   2048, memory:     512, gen: 4, ecu:   6144, arch:      'arm64' },
      't4g.small': { cpu:   2048, memory:    2048, gen: 4, ecu:   6144, arch:      'arm64' },
     't4g.xlarge': { cpu:   4096, memory:   16384, gen: 4, ecu:  12288, arch:      'arm64' },
   'vt1.24xlarge': { cpu:  98304, memory:  196608, gen: 1, ecu: 245760, arch:     'x86_64' },
    'vt1.3xlarge': { cpu:  12288, memory:   24576, gen: 1, ecu:  30720, arch:     'x86_64' },
    'vt1.6xlarge': { cpu:  24576, memory:   49152, gen: 1, ecu:  61440, arch:     'x86_64' },
    'x1.16xlarge': { cpu:  65536, memory:  999424, gen: 1, ecu: 163840, arch:     'x86_64' },
    'x1.32xlarge': { cpu: 131072, memory: 1998848, gen: 1, ecu: 327680, arch:     'x86_64' },
   'x1e.16xlarge': { cpu:  65536, memory: 1998848, gen: 1, ecu: 163840, arch:     'x86_64' },
    'x1e.2xlarge': { cpu:   8192, memory:  249856, gen: 1, ecu:  20480, arch:     'x86_64' },
   'x1e.32xlarge': { cpu: 131072, memory: 3997696, gen: 1, ecu: 327680, arch:     'x86_64' },
    'x1e.4xlarge': { cpu:  16384, memory:  499712, gen: 1, ecu:  40960, arch:     'x86_64' },
    'x1e.8xlarge': { cpu:  32768, memory:  999424, gen: 1, ecu:  81920, arch:     'x86_64' },
     'x1e.xlarge': { cpu:   4096, memory:  124928, gen: 1, ecu:  10240, arch:     'x86_64' },
   'z1d.12xlarge': { cpu:  49152, memory:  393216, gen: 1, ecu: 122880, arch:     'x86_64' },
    'z1d.2xlarge': { cpu:   8192, memory:   65536, gen: 1, ecu:  20480, arch:     'x86_64' },
    'z1d.3xlarge': { cpu:  12288, memory:   98304, gen: 1, ecu:  30720, arch:     'x86_64' },
    'z1d.6xlarge': { cpu:  24576, memory:  196608, gen: 1, ecu:  61440, arch:     'x86_64' },
      'z1d.large': { cpu:   2048, memory:   16384, gen: 1, ecu:   5120, arch:     'x86_64' },
      'z1d.metal': { cpu:  49152, memory:  393216, gen: 1, ecu: 122880, arch:     'x86_64' },
     'z1d.xlarge': { cpu:   4096, memory:   32768, gen: 1, ecu:  10240, arch:     'x86_64' }
}

function pick_lowest_prices(prices)
{
  var item_map = {};

  for(var i in prices)
  {
    var price = prices[i];
    if (!item_map[price.type] || item_map[price.type].price > price.price)
    {
      item_map[price.type] = price;
    }
  }

  var result = [];

  for(var i in item_map)
  {
    result.push(item_map[i]);
  }

  return result;
}

function score_type(type)
{
  return (typeToCapability[type].cpu + typeToCapability[type].memory) * (1 + typeToCapability[type].gen * 0.05);
}

function difference(v1, v2)
{
  return Math.abs(v1-v2);
}

function complete()
{
  prices = pick_lowest_prices(prices);

  prices.sort(function(a,b) {
    if (a.price < b.price) {
      return -1;
    }
    if (a.price > b.price) {
      return 1;
    }
    return 0;
  });

  var index = 0;
  for(var i in prices)
  {
    index = i;
    if(prices[i].price > want_to_pay)
    {
      break;
    }
  }


  shortlist = prices.splice(0, index)

  var result = prices[0];

  if (shortlist.length != 0)
  {
    shortlist.sort(function(a,b) {
      if (score_type(a.type) > score_type(b.type)) {
        return -1;
      }
      if (score_type(a.type) < score_type(b.type)) {
        return 1;
      }
      return 0;
    });

    //for(var i in shortlist)
    //{
    //  console.log(shortlist[i]);
    //}
    result = shortlist[0];
  }

  response = {
    Price:        String(result.price + 0.0001),
    Zone:         String(result.zone),
    AveragePrice: String(result.average_price),
    HighLine:     String(result.high_line),
    HighTime:     String(result.high_time),
    LowLine:      String(result.low_line),
    LowTime:      String(result.low_time),
    CpuUnits:     String(typeToCapability[result.type].cpu),
    CpuRating:    String(typeToCapability[result.type].ecu),
    MemRating:    String(typeToCapability[result.type].memory)
  }
  Cloudformation.send(request, context, Cloudformation.SUCCESS, response, "Success", result.type);

  console.log(JSON.stringify(prices));

}

function get_spot_prices(zones)
{
  var newest_price={};
  var xtotal={};
  var xcount={};
  var xhigh={};
  var xlow={};
  var xhightime={};
  var xlowtime={};

  function collect_data(zone, remaining, next_token)
  {
    if (remaining === 0 || next_token === null)
    {
      for(var type in newest_price)
      {
        var included = true;
        for(var i=0;i<exclude.length;i++)
        {
          if(type.indexOf(exclude[i]) != -1)
          {
            included = false;
            break;
          }
        }

        if (!included)
        {
          continue;
        }

        prices.push({
          type: type, 
          price: newest_price[type], 
          zone: zones[0], 
          average_price: xtotal[type]/xcount[type],
          high_line: xhigh[type],
          high_time: xhightime[type],
          low_line: xlow[type],
          low_time: xlowtime[type],
        });
      }

      zones.splice(0,1);
      get_spot_prices(zones);
    }
    else
    {
      ec2.describeSpotPriceHistory({
        AvailabilityZone: zone,
        MaxResults: 1000,
        NextToken: next_token
      }, function(err, data) {
        if (err)
        {
          console.log(err, err.stack); // an error occurred
          Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
        }
        else
        {

          //console.log(JSON.stringify(data.SpotPriceHistory))
          for(var i=0;i<data.SpotPriceHistory.length;i++)
          {
            var history = data.SpotPriceHistory[i];

            if (!newest_price[history.InstanceType])
            {
              newest_price[history.InstanceType] = Number(history.SpotPrice);
              xtotal[history.InstanceType] = Number(history.SpotPrice);
              xcount[history.InstanceType] = 1;
              xhigh[history.InstanceType] = Number(history.SpotPrice);
              xlow[history.InstanceType] = Number(history.SpotPrice);
              xhightime[history.InstanceType] = history.Timestamp;
              xlowtime[history.InstanceType] = history.Timestamp;
            }
            else
            {
              xtotal[history.InstanceType]+= Number(history.SpotPrice);
              xcount[history.InstanceType]+= 1;
              if (xhigh[history.InstanceType] < Number(history.SpotPrice))
              {
                xhigh[history.InstanceType] = Number(history.SpotPrice);
                xhightime[history.InstanceType] = history.Timestamp;
              }
              if (xlow[history.InstanceType] > Number(history.SpotPrice))
              {
                xlow[history.InstanceType] = Number(history.SpotPrice);
                xlowtime[history.InstanceType] = history.Timestamp;
              }
            }
          }

          collect_data(zone, remaining-1, data.NextToken);
        }
      });
    }
  }

  if (zones.length == 0)
  {
    complete();
  }
  else
  {
    collect_data(zones[0], look_back);
  }
}

ec2.describeAvailabilityZones({}, function(err, data) {
  if (err)
  {
    console.log(err, err.stack); // an error occurred
    Cloudformation.send(request, context, Cloudformation.FAILED, {}, JSON.stringify(err));
  }
  else
  {
    var zones = data.AvailabilityZones.map(function(x) {return x.ZoneName;});
    get_spot_prices(zones);
  }
});

