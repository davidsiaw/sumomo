# Sumomo

Making cloudformation suck less.

Because plums are also peaches

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'sumomo'
```

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install sumomo

## Commandline Tool Usage

This gem lets you use all of the syntax in the [momo](https://github.com/davidsiaw/momo) and more!

You need to setup your AWS credentials using `aws configure`.

This is the simplest way to use sumomo:

First, create a file called Sumomofile in your directory

```ruby
# Sumomofile
x = hidden_value "meow"
eip = make "AWS::EC2::EIP"
output "IPAddress", eip
output "Haha", x
```

To create a stack that acquires an IP Address and outputs it

	$ sumomo create mystack

To view a stack's outputs

	$ sumomo outputs mystack

To update a stack

	$ sumomo update mystack

To delete a stack

	$ sumomo delete mystack

## Library Usage

The commandline tool actions can also be performed programmatically

```ruby
require "sumomo"

Sumomo::update_stack(name: "mystack", region: "ap-northeast-1") do
	x = hidden_value "meow"
	eip = make "AWS::EC2::EIP"
	output "IPAddress", eip
	output "Haha", x
end

Sumomo::wait_for_stack(name: "mystack", region: "ap-northeast-1")
```

## Development

After checking out the repo, run `bin/setup` to install dependencies. Then, run `rake spec` to run the tests. You can also run `bin/console` for an interactive prompt that will allow you to experiment.

To install this gem onto your local machine, run `bundle exec rake install`. To release a new version, update the version number in `version.rb`, and then run `bundle exec rake release`, which will create a git tag for the version, push git commits and tags, and push the `.gem` file to [rubygems.org](https://rubygems.org).

## Contributing

Bug reports and pull requests are welcome on GitHub at https://github.com/davidsiaw/sumomo.

