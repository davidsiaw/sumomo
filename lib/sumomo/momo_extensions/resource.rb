# frozen_string_literal: true

module Momo
  class Resource
    def exec_role
      res = Momo::Resource.new('AWS::IAM::Role', 'LambdaFunctionExecutionRole', @stack)
      res.complete!
      res
    end
  end
end
