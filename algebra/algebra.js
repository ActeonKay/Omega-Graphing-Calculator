// main concept: trees that represent an expression
// different classes of values, operators, etc. have their own methods:
    // structure.evaluate(context) for all values/operators outputs their value given a certain context
    // structure.asLatex() outputs the latex of an expression
    // getDependencies() outputs the softcoded parts of an expression, i.e. variables that may change at runtime or functions 
// but also procedural methods like:
    // sumWith(structure)      -> producing a new structure (that may be a simplified version, like with the sum of two radicals)
    // simplify(structure)     -> simplifies fractions, attempts to reduce radicals in the denominator, etc.
    // differentiate(variable) -> finds the symbolic derivative of an expression
    // integrate(variable)     -> finds the symbolic integral of an expression

class Structure {
    constructor(){

    }

    static evaluate(context){
        return 0;
    }

    static derivative(variable){

    }

    static getDependentDefinitions(){

    }

    static asLatex(){

    }

}

class Natural {
    // not necessary (?)
}

class Integer {
    // not necessary (?)
    // natural number and a sign: ±ℕ
}

class Rational {
    // rational number: ℤ/ℤ

    constructor(numerator, denominator){
        this.numerator = numerator;
        this.denominator = denominator;
    }

    static evaluate(context){
        return this.numerator/this.denominator;
    }

    static derivative(variable){
        return 0;
    }
}

class Real {
    // continuous quantity ℝ

    constructor(value){
        this.value = value;
    }

    static evaluate(context){
        return this.value;
    }

    static derivative(variable) {
        return 0;
    }
}

class Sum {
    //certain binary operations are organized as n-ary operations to make it easier for computers to recognize formulas down-the-line

    constructor(values){
        this.values = values;
    }

    static evaluate(context){
        let r = 0;
        for(let i = 0; i < this.values.length; i++){
            r+=this.values[i].evaluate(context);
        }
        return r;
    }

    static add(structure){
        this.values.push(structure);
    }

    static multiply(structure, doDistribute = false){
        //return new Mult
    }

    static derivative(variable){
        let r = 0;
        for(let i = 0; i < this.values.length; i++){
            r+=this.values[i].derivative(variable);
        }
        return r;
    }
}

//class UnaryNegative

class Product {
    constructor(values){
        this.values = values;
    }

    static isUniformType(){
        
    }

    static evaluate(context){
        let r = 1;
        for(let i = 0; i < this.values.length; i++){
            r*=this.values[i].evaluate(context);
        }
        return r;
    }

    static add(structure){
        return new Sum(this.values).add(structure);
    }

    static multiply(structure){
        this.values.push(structure);
    }

    static exponentiate(structure, doDistribute = false){

    }

    static derivative(variable){
        //TODO
    }
}

class Fraction {
    constructor(numerator, denominator){
        this.numerator = numerator;
        this.denominator = denominator;
    }

    static evaluate(context){
        return this.numerator.evaluate(context)/this.denominator.evaluate(context);
    }
}

class Exponent {
    constructor(base, exponent){
        this.base = base;
        this.exponent = exponent;
    }

    static evaluate(context){
        return this.base.evaluate(context)**this.exponent.evaluate(context);
    }
}

class Radical {
    constructor(radicand, degree){
        this.radicand = radicand;
        this.degree = degree;
    }

    static evaluate(context){
        //branching
        return this.radicand.evaluate(context)**(1/this.degree.evaluate(context));
    }

    static multiply(structure){
        if(structure instanceof Radical){
            //distribute radical
        }else{
            //return product?
        }
    }
}

class Polynomial {
    constructor(pIn,terms){

    }
}

//class UnaryInverse

class Defined extends Structure {

}

class Variable extends Defined {
    constructor(identifier){
        this.identifier = identifier;
    }

    static derivative(variable){
        return variable = identifier ? 1 : 0;
    }
}

class Piecewise extends Structure {
    constructor(subfunctions, subdomains){
        this.subfunctions = subfunctions;
        this.subdomains = subdomains;
    }

    static evaluate(context){

    }

    static derivative(variable){
        d_subfuncs = subfunctions.map((subfn) => subfn.derivative(variable));

        return new Piecewise(d_subfuncs,subdomains);
    }
}

class Function extends Structure {
    constructor(identifier, inputs, definition){
        this.identifier = identifier;
        this.inputs = inputs;
        this.definition = definition;
    }

    static evaluate(context){
        return this.definition.evaluate(context);
    }
    
    static derivative(variable){
        return this.definition.derivative(variable);
    }
}

//class ProceduralOperator
    //class Limit
    //class Summation
    //class Product
    //class Derivative
    //class Integral
//class Polynomial
//

// // // // // // DEFAULTS // // // // // //


/**
 * Procedure:
 * Differentiate an expression with respect to a variable
 * Input: structure
 * Output: structure
 * @param {*} structure expression to be differentiated
 * @param {*} variable variable with which to differentiate with
 */
function differentiate(structure, variable){
    return structure.derivative(variable);
}