
module Momo
	class Resource
		def exec_role
			res = Momo::Resource.new("AWS::IAM::Role", "LambdaFunctionExecutionRole")
			res.complete!
			res
		end
	end 
end