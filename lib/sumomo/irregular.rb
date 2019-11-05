# frozen_string_literal: true

# For functions that do not conform to Ruby's naming convention
# of funcs must be snake_case
module HasIrregularlyNamedFunctions
  def defi(name, &block)
    define_method(name, &block)
  end
end
