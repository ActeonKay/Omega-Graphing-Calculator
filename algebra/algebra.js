class Structure {
    constructor(){

    }

    static evaluate(){
        return 0;
    }

    static derivative(variable){

    }

    static getDependentDefinitions(){

    }

    static asLatex(){

    }

}

class Rational {
    constructor(numerator, denominator){
        this.numerator = numerator;
        this.denominator = denominator;
    }

    static evaluate(){
        return this.numerator/this.denominator;
    }

    static derivative(variable){
        return 0;
    }
}

class Real {
    constructor(value){
        this.value = value;
    }

    static evaluate(){
        return this.value;
    }

    static derivative(variable) {
        return 0;
    }
}

class Sum {
    constructor(values){
        this.values = values;
    }

    static evaluate(){
        let r = 0;
        for(let i = 0; i < this.values.length; i++){
            r+=this.values[i].evaluate();
        }
        return r;
    }

    static add(structure){
        this.values.push(structure);
    }

    static multiply(structure, doDistribute = false){
        return new Mult
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

    static evaluate(){
        let r = 1;
        for(let i = 0; i < this.values.length; i++){
            r*=this.values[i].evaluate();
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

class Function extends Structure {
    constructor(identifier, inputs, structure){
        this.identifier = identifier;
        this.inputs = inputs;
        this.structure = structure;
    }

    static evaluate(){
        return this.structure.evaluate();
    }
    
    static derivative(variable){
        return this.structure.derivative(variable);
    }
}

//class Exponent
//class Radical
//class Variable
//class Function
//class ProceduralOperator
    //class Limit
    //class Summation
    //class Product
    //class Derivative
    //class Integral
//class Polynomial
//

// // // // // // DEFAULTS // // // // // //
class SinFunction extends Function {
    constructor(inputStructure){
        this.inputStructure = inputStructure;
    }

    static evaluate(){
        return Math.sin(this.inputStructure.evaluate());
    }

    static derivative(variable){
        return Math.cos(this.inputStructure.evaluate())*this.inputStructure.derivative(variable);
    }
}


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