# Omega Graphing Calculator

Omega is a graphing software that supports:
- Implicit and Explicit relationships between y and x, or between r and theta
- Multiple expressions supported
- Large library of functions
- Numeric evaluation and result display
- Variable definition
- Uncertainty propagation with both absolute and percentage uncertainty

Try it out [here](https://acteonkay.github.io/Omega-Graphing-Calculator/).

## How to Use

Using the calculator is simple. But here are a few tips: 

- Functions are input like `sin(x)` or `max(1,2)`. 
- Functions can be defined without parentheses: `cos x`, but this is buggy.
- Functions can also have exponents, like `sec^2 x` or `sin^3 y`, which exponentiates the output of the function. Inverse functions are not supported using this notation.
- Variables are defined by using `=`, like `a=3!` or `b=2a`. They can be defined either directly or in terms of other variables. When a variable is updated, all of its dependent expressions are also updated.
- Values can be given uncertainties, as in `24±3` or `2±q`. Resultant operations with these values will propagate the uncertainty. 
- Values can also be treated as percentages with the `%` operator, like `25%` or `12±10%`. Resulting operations with percentages will propagate the percentage value. 

## List of Operators
### Normal Operators
`+` `-` `*` `/`  Arithmetic Operators

`^`        Exponentiation

`=`        Equality

`!`        Factorial

### Modifier / Special Operators
`^`        Function Exponentiation, like `sin^2(x)`

`_`        Logarithm Base, like `log_2(x)`

`±`        Plus or Minus (uncertainty), like `2±1`

`%`        Treat value to the left as a percentage, like `20%`

## List of Functions
`ln` `log`   Logarithmic Functions

`sqrt`       Square Root Function

`sin` `cos` `tan` Trigonometric Functions

`sec` `csc` `cot` Reciprocal Trig Functions

`arcsin` `arccos`... Inverse Trig Functions

`sinh` `cosh`... Hyperbolic Trig Functions

`gd`          Gudermannian function

`lam`         Lamber W Function

`Gamma`       Gamma Function

`abs`         Absolute Value Function

`sign`        Sign Function

`floor` `ceil`

`round` `trunc` Rounding functions

`mod`         Modulus Function

`min` `max`   Array Extremity Functions

`avg` `med`   Array Central Tendency Functions

## List of Shortcuts
`*` Form Dot Operator (multiplication)

`/` Form Fraction

`sqrt` Form Radical

`pi`  π Constant (Pi)

`phi` φ Constant (golden ratio)

`theta` θ Polar Coordinate

`Gamma` Γ Function

`plusmn` ± Operator

# Roadmap
These are the list of planned features.

1. Finish basic feature list
- Define variables to use in other expressions
- Define functions to use in other expressions
- Inequalities
- Subscripts to denote a variable or function name
- Expression evaluation over a boundary
  - Symbolic detection of discontinuities

2. Improve UI and Documentation
Currently, the UI is limited. This step includes:
- Moving expressions around
- Coordinate edit panel
- Graph appearance settings
- Equation edit panel
  - Color and transparency settings
  - Bounding the X and Y axis 
- Mouse-graph interactions
  - Intercepts
  - Coordinates at mouse
  - Copy to table: Selected point or Tangent line
- Add graph labels
  - Axis labels
  - Equation/point labels
- Graph export functionality
- For contributors:
  - Clear documentation of each function/algorithm
  - Plans for future algorithms
  - Diagrams for explaining processes
  
