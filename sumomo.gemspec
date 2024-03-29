# frozen_string_literal: true

lib = File.expand_path('lib', __dir__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'sumomo/version'

Gem::Specification.new do |spec|
  spec.name          = 'sumomo'
  spec.version       = Sumomo::VERSION
  spec.authors       = ['David Siaw']
  spec.email         = ['davidsiaw@gmail.com']

  spec.summary       = 'An advanced infrastructure description language for AWS'
  spec.description   = 'Sumomo'
  spec.homepage      = 'https://github.com/davidsiaw/sumomo'

  # Prevent pushing this gem to RubyGems.org by setting 'allowed_push_host', or
  # delete this section to allow pushing this gem to any host.
  if spec.respond_to?(:metadata)
    spec.metadata['allowed_push_host'] = 'https://rubygems.org'
  else
    raise 'RubyGems 2.0 or newer is required to protect against public gem pushes.'
  end

  spec.files         = `git ls-files -z`.split("\x0").reject { |f| f.match(%r{^(test|spec|features)/}) }
  spec.bindir        = 'exe'
  spec.executables   = spec.files.grep(%r{^exe/}) { |f| File.basename(f) }
  spec.require_paths = ['lib']

  spec.add_development_dependency 'bundler'
  spec.add_development_dependency 'rake'
  spec.add_development_dependency 'rspec'

  spec.add_dependency 'activesupport'
  spec.add_dependency 'aws-sdk', '~> 3'
  spec.add_dependency 'ox'
  spec.add_dependency 'hashie'
  spec.add_dependency 'momo', '0.4.1'
  spec.add_dependency 'rubyzip'
  spec.add_dependency 's3cabinet'
  spec.add_dependency 'optimist'
  spec.add_dependency 'webrick'
end
