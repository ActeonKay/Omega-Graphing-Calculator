import {
    TokenType, typesetTokens, compileExpression
} from "../compiler.js";

import {
    Operators, OperatorCode
} from "./defaultOperators.js";

export const BigOperators = {
    FRACTION: 1,
    RADICAL: 2,
    SUMMATION: 3,
    MULTIPLICATION: 4,
    INTEGRATION: 5,
    ///: 6,
    POLYGAMMA: 7,
}

export const BigOperatorByLatex = {
    "\\frac": BigOperators.FRACTION,
    "\\sqrt": BigOperators.RADICAL,
    "\\nthroot": BigOperators.RADICAL
}

/**
 * 
 * @param {*} token 
 * @returns 
 */
export function compileFractionFromToken(token){
    console.assert(token.metadata.requiredArguments.length === 2);

    const numeratorNSP = token.metadata.requiredArguments[0];
    const denominatorNSP = token.metadata.requiredArguments[1];

    const numeratorTypeset = typesetTokens(numeratorNSP);
    const denominatorTypeset = typesetTokens(denominatorNSP);

    const numerator = compileExpression(numeratorTypeset);
    const denominator = compileExpression(denominatorTypeset); 
    const divider = {type: TokenType.OPERATOR, code: OperatorCode.DIV, string: "/", metadata: {fullString: "/"}}; 

    return numerator.tokens.concat(denominator.tokens).concat([divider]); //numerator, denominator, /
}

/**
 * 
 * @param {*} token 
 */
export function compileRadicalFromToken(token){
    console.log("compiling radical");
    console.assert(token.metadata.requiredArguments.length === 1);

    const radicandNSP = token.metadata.requiredArguments[0];
    const radicandTypeset = typesetTokens(radicandNSP);
    const radicand = compileExpression(radicandTypeset);

    let degree = [{type: TokenType.OPERAND, code: null, string: "2", metadata: {fullString: "2", value: 2}}];
    if(token.metadata.optionalArguments.length > 0){
        const degreeNSP = token.metadata.optionalArguments[0];
        const degreeTypeset = typesetTokens(degreeNSP);
        degree = compileExpression(degreeTypeset).tokens;
    }

    const one = {type: TokenType.OPERAND, code: null, string: "1", metadata: {fullString: "1", value: 1}};
    const div = {type: TokenType.OPERATOR, code: OperatorCode.DIV, string: "/", metadata: {fullString: "/"}};
    const pow = {type: TokenType.OPERATOR, code: OperatorCode.POW, string: "^", metadata: {fullString: "^"}};

    //radicand, 1, degree, /, ^
    return radicand.tokens.concat([one]).concat(degree).concat([div]).concat([pow]);
}