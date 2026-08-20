import { TokenType } from "./compiler.js";
import { getDependableData } from "./expressions.js";
import { Functions, FunctionCode } from "./default/defaultFunctions.js";
import { Operators, OperatorCode } from "./default/defaultOperators.js";

import { evalBoundary } from "./attributeArithmetic/boundaryArithmetic.js";
import { evalUncertainty } from "./attributeArithmetic/uncertaintyArithmetic.js";

//get evaluation token info --
    //pure numerical?
        //tokens are passed as only numbers, not as objects
    //boundary arithmetic needed?
        //real tokens have a boundary component
    //uncertainty?
        //real tokens have an uncertainty component

/**
 * Substitute all instances of `name` in `tokens` with `value`
 * @param {*} tokens Token list to substitute within
 * @param {*} name Name of substituted value
 * @param {*} value Value to substitute in
 */
function substitute(tokens, input, attributes){
    const propagateBoundary = attributes.has("boundary");
    const propagateInterval = attributes.has("interval");
    const propagateUncertainty = attributes.has("uncertainty");
    const propagatePeriodicity = attributes.has("periodicity");
    const doNonPrincipalBranch = attributes.has("multiplicity"); //?

    const evalAsObject = attributes.size > 0;

    //let outputs = [];
    for(let i = 0; i<tokens.length; i++) {
        let token = tokens[i];

        if(token.type !== TokenType.OPERAND) {
            continue;
        }

        if(token.metadata.value === undefined){
            if(input.has(token.string)){
                token.value = input.get(token.string).value;
            }else if(getDependableData(token.string) !== undefined){
                token.value = getDependableData(token.string).value.value;
            }else{
                throw new Error("I don't know what "+token.string+" means");
            }
        }else{
            token.value = token.metadata.value;
        }

        let attributes = {};
        if(propagateBoundary) attributes.boundary = [0,0,0]; 
        if(propagateInterval) attributes.interval = info.interval;
        if(propagateUncertainty) attributes.uncertainty = 0;
        if(propagatePeriodicity) attributes.periodicity = 0; 

        token.attributes = attributes;

        // console.log(token.string);
        // console.log(token.value);
        // console.log(token.attributes);
    };

    // console.log("After substitution:",tokens);

    return tokens;
}

/**
 * 
 * @param {*} expression 
 * @param {Map} input 
 * @param {*} attributes List of token attributes to include in calculations
 * @param {*} evaluateTruth
 */
export function evaluateExpressionWithOptions(expression, input, attributes, evaluateTruth){
    let tokens = substitute(expression.tokens, input, attributes);

    let solve = [];
    tokens.forEach((token) => {
        switch(token.type){
            case TokenType.OPERAND:
                solve.push(token);
                break;
            case TokenType.OPERATOR:
                const code = token.code;

                const arity = Operators.get(token.code).arity;
                const operands = arity === 1 
                    ? [solve.pop()]
                    : [solve.pop(), solve.pop()];

                solve.push(performOperation(code, operands, attributes));

                break;
            case TokenType.FUNCTION:
                const funcResult = performFunction(token.code, [solve.pop()]);


                solve.push(funcResult);

                break;
            default:
                //if(token.type || !options)
                //solve.push(token);
                throw new Error("Unknown token type identified");
                break;
            //case TokenType.ALPHANUMERIC:
                //break;
        }
    });

    if(solve.length !== 1) throw new Error("Error in stack evaluation. Length: "+solve.length);

    return solve[0];
}

function performOperation(code, operands, attributes){
    let result = { type: TokenType.OPERAND, value: evalValue(code, operands), attributes: {} };

    if(attributes.has("uncertainty")) result.attributes.uncertainty = evalUncertainty(code, operands);
    if(attributes.has("boundary")) result.attributes.boundary = evalBoundary(code, operands);

    return result;
}

function evalValue(code, args){
    switch(code){
        case OperatorCode.ADD:
            return args[1].value+args[0].value;
        case OperatorCode.SUB:
        case OperatorCode.EQ:
            return args[1].value-args[0].value;
        case OperatorCode.MUL:
            return args[1].value*args[0].value;
        case OperatorCode.DIV:
            return args[1].value/args[0].value;
        case OperatorCode.POW:
        case OperatorCode.POWN:
            return args[1].value**args[0].value;
        case OperatorCode.NEG:
            return -args[0].value;
        case OperatorCode.PCT:
            return 0.01*args[0].value;
        case OperatorCode.DEG: 
            return 0.017453292519943295*args[0].value;
        case OperatorCode.UNC:
            return args[1].value;
        case FunctionCode.SIN:
            return Math.sin(args[0].value);
        case FunctionCode.COS:
            return Math.cos(args[0].value);
        case FunctionCode.TAN:
            return Math.tan(args[0].value);
        case FunctionCode.SEC:
            return 1/Math.cos(args[0].value);
        case FunctionCode.CSC:
            return 1/Math.sin(args[0].value);
        case FunctionCode.COT:
            return 1/Math.tan(args[0].value);
        case FunctionCode.ASIN:
            return Math.asin(args[0].value);
        case FunctionCode.ACOS:
            return Math.acos(args[0].value);
        case FunctionCode.ATAN:
            return Math.atan(args[0].value);
        case FunctionCode.ASEC:
            return Math.acos(1/args[0].value);
        case FunctionCode.ACSC:
            return Math.asin(1/args[0].value);
        case FunctionCode.ACOT:
            return Math.atan(1/args[0].value);
        case FunctionCode.SINH:
            return Math.sinh(args[0].value);
        case FunctionCode.COSH:
            return Math.cosh(args[0].value);
        case FunctionCode.TANH:
            return Math.tanh(args[0].value);
        case FunctionCode.SECH:
            return 1/Math.cosh(args[0].value);
        case FunctionCode.CSCH:
            return 1/Math.sinh(args[0].value);
        case FunctionCode.COTH:
            return 1/Math.tanh(args[0].value);
        case FunctionCode.ASINH:
            return Math.asinh(args[0].value);
        case FunctionCode.ACOSH:
            return Math.acosh(args[0].value);
        case FunctionCode.ATANH:
            return Math.atanh(args[0].value);
        case FunctionCode.ASECH:
            return Math.acosh(1/args[0].value);
        case FunctionCode.ACSCH:
            return Math.asinh(1/args[0].value);
        case FunctionCode.ACOTH:
            return Math.atanh(1/args[0].value);
        //other trig
        case FunctionCode.EXP:
            return Math.exp(args[0].value);
        case FunctionCode.LN:
            return Math.log(args[0].value);
        case FunctionCode.LOG:
            return Math.log10(args[0].value);
    }
} 

function performFunction(code, operands, attributes){
    let result = { type: TokenType.OPERAND, value: evalValue(code, operands), attributes: {} };

    //attributes

    return result;
}

function func(code, args){
    switch(code){
        case 101: return Math.sin(args[0].value);
        case 102: return Math.cos(args[0].value);
        case 103: return Math.tan(args[0].value);
    }
}