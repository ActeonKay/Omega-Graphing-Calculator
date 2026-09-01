/**
 * COMPILATION STEPS
 * 
 * 1. Tokenization (NSP)
 * Take raw latex code and convert it into a list of tokens
 * Token format: {type, string, metadata};
 * 
 * 2. Typesetting & Implicit Information (NST)
 * Determine the type of each token and add additional
 * Also, 
 * 
 * 3. Substitution
 * Substitute any constant values into the expression
 * 
 * 4. Tree Construction
 * Construct a tree contianing all of the operations
 */

export const ExpressionType = {
    INVALID: 0,
    EVALUATION: 1,
    EXPLICIT_X: 2, //x = ...yz...
    EXPLICIT_Y: 3, //y = ...xz...
    EXPLICIT_Z: 4, //z = ...xy...
    EXPLICIT_R: 5, //r = ...theta...
    EXPLICIT_THETA: 6, //theta = ...r...
    IMPLICIT: 7,
    PARAMETRIC: 8, //(f(t), g(t), ...)
    ASSIGNMENT_DIRECT: 9, //a = number
    ASSIGNMENT_INDIRECT: 10, //a = ...expresion...
    DEFINITION: 11, //f(a,b,...) = ...expression...
    SUBSCRIPT_IDENTIFIER: 12
}

export const TokenType = {
    OPERAND: 1,
    OPERATOR: 2,
    BRACKET: 3,
    FUNCTION: 4,
    ALPHANUMERIC: 5,
    DELIMITER: 6,
    EXPRESSION: 7,
    BIG_OPERATOR: 8 //special operator?
};

export const NumberType = {
    REAL: 1,
    COMPLEX: 2,
    // VECTOR2: 3,
    // VECTOR3: 4,
    VECTOR: 5,
    ARRAY: 6,
    DISTRIBUTION: 7
}

export const CoordinateCode = {
    CARTESIAN_X: 1,
    CARTESIAN_Y: 2,
    CARTESIAN_Z: 3,
    POLAR_R: 4,
    POLAR_THETA: 5
}

export const CoordinateByLatex = {
    "x": CoordinateCode.CARTESIAN_X,
    "y": CoordinateCode.CARTESIAN_Y,
    "z": CoordinateCode.CARTESIAN_Z,
    "r": CoordinateCode.POLAR_R,
    "\\theta": CoordinateCode.POLAR_THETA,
}

export const BracketCode = {
    ROUND_LEFT: 0,
    ROUND_RIGHT: 1,
    SQUARE_LEFT: 2,
    SQUARE_RIGHT: 3,
    CURLY_LEFT: 4,
    CURLY_RIGHT: 5,
    BAR_LEFT: 6,
    BAR_RIGHT: 7,
    FLOOR_LEFT: 8,
    FLOOR_RIGHT: 9,
    CEIL_LEFT: 10,
    CEIL_RIGHT: 11
}


//it is valid latex to pass a "(" instead of a "\left(" as a parenthesis
//we must account for this in the bracket code determination
export const BracketByLatex = {
    "\\left(": BracketCode.ROUND_LEFT,
    "\\right)": BracketCode.ROUND_RIGHT,
    "\\left[": BracketCode.SQUARE_LEFT,
    "\\right]": BracketCode.SQUARE_RIGHT,
    "\\left\\{": BracketCode.CURLY_LEFT, //should have \ in front of { or } ?
    "\\right\\}": BracketCode.CURLY_RIGHT,
    "\\left|": BracketCode.BAR_LEFT,
    "\\right|": BracketCode.BAR_RIGHT,
    "\\left\\lfloor": BracketCode.FLOOR_LEFT,
    "\\right\\rfloor": BracketCode.FLOOR_RIGHT,
    "\\left\\lceil": BracketCode.CEIL_LEFT,
    "\\right\\rceil": BracketCode.CEIL_RIGHT,
    "(": BracketCode.ROUND_LEFT,
    ")": BracketCode.ROUND_RIGHT,
    "[": BracketCode.SQUARE_LEFT,
    "]": BracketCode.SQUARE_RIGHT,
    "\\{": BracketCode.CURLY_LEFT, //should have \ in front of { or } ?
    "\\}": BracketCode.CURLY_RIGHT,
    "|": BracketCode.BAR_LEFT,
    "|": BracketCode.BAR_RIGHT,
    "\\lfloor": BracketCode.FLOOR_LEFT,
    "\\rfloor": BracketCode.FLOOR_RIGHT,
    "\\lceil": BracketCode.CEIL_LEFT,
    "\\rceil": BracketCode.CEIL_RIGHT
}

export const DelimiterCode = {
    COMMA: 0,
    AMPERSAND: 1,
    DOUBLE_BACKSLASH: 2,
    VERTICAL_BAR: 3
}

const DelimiterByLatex = {
    ",": DelimiterCode.COMMA,
    "&": DelimiterCode.AMPERSAND,
    "\\\\": DelimiterCode.DOUBLE_BACKSLASH,
    "\|": DelimiterCode.VERTICAL_BAR
}

import { FunctionByLatex, FunctionCode } from "./default/defaultFunctions.js";
import { Operators, OperatorAssociativity, OperatorByLatex, OperatorCode, OperatorInfo } from "./default/defaultOperators.js";
import { ConstantCode, ConstantByLatex } from "./default/defaultConstants.js";
import { BigOperatorByLatex, compileFractionFromToken, compileRadicalFromToken } from "./default/defaultBigOperators.js";

import { getDependable, getDependableData } from "./expressions.js";
import { evalUncertainty } from "./attributeArithmetic/uncertaintyArithmetic.js"
import { evalBoundary } from "./attributeArithmetic/boundaryArithmetic.js";

/**
 * Determines if a token is a valid variable token (i.e., can be used as a variable, function parameter, or function name)
 * @param {Object} NSPToken Token to check
 * @returns {bool}
 */
function isValidVariableToken(NSPToken){
    //should disregard coordinates?

    if(NSPToken.type == "letter") return true;

    if(NSPToken.type === "command"){
        if(NSPToken.metadata.optionalArguments.length > 0 || NSPToken.metadata.requiredArguments.length > 0) return false;

        if(NSPToken.string in FunctionByLatex) return false;
        if(NSPToken.string in OperatorByLatex) return false;

        return true;
    }

    return false;
}

/**
 * Determines if a list of tokens represents the LHS of a function definition.
 * Valid function definition: f(a,b,c) = ...
 * @param {Object[]} tokensNSP The lefthand side of the expression, not including the equals sign
 * @returns {bool}
 */ 
function isFunctionDefinition(tokensNSP){
    if(tokensNSP.length < 3) return false;

    if(!isValidVariableToken(tokensNSP[0])) return false;

    const isLeftBracket = (t) => t.string in BracketByLatex && BracketByLatex[t.string].code % 2 === 0;
    const isRightBracket = (t) => t.string in BracketByLatex && BracketByLatex[t.string].code % 2 === 1;

    if(!isLeftBracket(tokensNSP[1])) return false;

    let i = 2;
    while(i<tokensNSP.length-1){
        const paramToken = tokensNSP[i];
        if(!isValidVariableToken(paramToken)) return false;

        if(isRightBracket(tokensNSP[i+1])){
            if(i+1 !== tokensNSP.length-1) return false; //there are extra tokens after the closing parenthesis
            return true;
        }

        if(tokensNSP[i+1].string !== ",") return false;

        i += 2;
    }

    throw new Error("Unexpected end of tokens in function definition: " + tokensNSP.map((t) => t.string).join(' '));
}

/**
 * 
 * @param {*} tokensNSP Token list of LHS of expression 
 * @returns {boolean} if it is a valid variable definition
 */
function isVariableDefinition(tokensNSP){
    if(tokensNSP.length !== 1) return false;

    const varToken = tokensNSP[0];

    if(varToken.string in CoordinateByLatex) return false;

    if(!isValidVariableToken(varToken)) return false;

    console.log("::");

    if(getDependableData(varToken.string) == undefined) return true;

    return false;
}

export function determineDependencies(tokensNSP){
    let expressionDependencies = new Set();

    tokensNSP.forEach((token) => {
        let tokenDependencies = new Set();

        if(isValidVariableToken(token)){
            tokenDependencies = tokenDependencies.union(new Set([token.string]));
        }

        if(token.metadata.subscript){
            tokenDependencies = tokenDependencies.union(determineDependencies(token.metadata.subscript));
        }

        if(token.metadata.superscript){
            tokenDependencies = tokenDependencies.union(determineDependencies(token.metadata.superscript));
        }

        if(token.metadata.requiredArguments){
            token.metadata.requiredArguments.forEach((arg) => {
                tokenDependencies = tokenDependencies.union(determineDependencies(arg));
            });
        }

        if(token.metadata.optionalArguments){
            token.metadata.optionalArguments.forEach((arg) => {
                tokenDependencies = tokenDependencies.union(determineDependencies(arg));
            });
        }

        token.metadata.dependencies = tokenDependencies;
        expressionDependencies = expressionDependencies.union(tokenDependencies);
    });

    return expressionDependencies;
}

/**
 * Typesets an expression represented by a list of NSP-layer tokens
 * @param {*} tokensNSP 
 * @returns {Object} {type: TokenType, trimmedExpression: Object[]} The type of expression represented by the tokens
 */
export function typesetExpression(tokensNSP){
    if(tokensNSP.length === 0) throw new Error("No tokens submitted into expression typeset.");

    if(!tokensNSP.some((t) => t.string === "=")){
        const hasCartesianCoords = tokensNSP.some((t) => t.metadata.dependencies.has("x") || t.metadata.dependencies.has("y")); //Todo: add z
        const hasPolarCoords = tokensNSP.some((t) => t.metadata.dependencies.has("r") || t.metadata.dependencies.has("\\theta"));

        if(hasCartesianCoords && hasPolarCoords) return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};
        if(!hasCartesianCoords && !hasPolarCoords) return {type: ExpressionType.EVALUATION, trimmedExpression: tokensNSP};

        if(hasCartesianCoords){
            const hasX = tokensNSP.some((t) => t.metadata.dependencies.has("x")), hasY = tokensNSP.some((t) => t.metadata.dependencies.has("y")); //hasZ = tokensNSP.some((t) => t.string === "z");
            if(hasX && hasY) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP}; //TODO: add z
            if(hasX) return {type: ExpressionType.EXPLICIT_Y, trimmedExpression: tokensNSP}; //y=...x...
            if(hasY) return {type: ExpressionType.EXPLICIT_X, trimmedExpression: tokensNSP}; //x=...y...
        }

        if(hasPolarCoords){
            const hasR = tokensNSP.some((t) => t.metadata.dependencies.has("r")), hasTheta = tokensNSP.some((t) => t.metadata.dependencies.has("\\theta"));
            if(hasR && hasTheta) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP};
            if(hasR) return {type: ExpressionType.EXPLICIT_THETA, trimmedExpression: tokensNSP};
            if(hasTheta) return {type: ExpressionType.EXPLICIT_R, trimmedExpression: tokensNSP};
        }
    }

    if(tokensNSP.filter((t) => t.string === "=").length > 1) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP};

    const lhs = tokensNSP.slice(0, tokensNSP.findIndex((t) => t.string === "="));
    const rhs = tokensNSP.slice(tokensNSP.findIndex((t) => t.string === "=") + 1);

    if(lhs.length === 0 || rhs.length === 0) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP};

    const f = isFunctionDefinition(lhs);
    console.log("is valid fnc def:",lhs,"="+f);

    if(f){
        if(rhs.some((t) => t.metadata.dependencies.has(lhs[0].string))) {
            return {type: ExpressionType.INVALID, trimmedExpression: rhs, problem: "You can't define a function in terms of itself"};
        }

        return {type: ExpressionType.DEFINITION, trimmedExpression: rhs, definition: {name: lhs[0].string, parameters: lhs.slice(2,lhs.length-1).filter((t) => t.string !== ",").map((t) => t.string)}};
    }

    const v = isVariableDefinition(lhs);
    console.log("is valid vd:",lhs,"="+v);

    if(v){
        if(rhs.some((t) => t.metadata.dependencies.has(lhs[0].string))) {
            return {type: ExpressionType.INVALID, trimmedExpression: rhs, problem: "You can't define a variable in terms of itself"};
        } 

        if(rhs.some((t) => isValidVariableToken(t) && !(t in CoordinateByLatex)  && getDependableData(t.string) === undefined)){
            return {type: ExpressionType.INVALID, trimmedExpression: rhs, problem: "You can't define a variable in terms of unknown variables"};
        }

        const isDirectAssignment = rhs.length === 1 && (rhs[0].metadata.value !== undefined);
        let assignmentInfo = {name: lhs[0].string};

        if(isDirectAssignment){
            assignmentInfo.value = rhs[0].metadata.value;
            return {type: ExpressionType.ASSIGNMENT_DIRECT, trimmedExpression: rhs, assignment: assignmentInfo};
        }

        return {type: ExpressionType.ASSIGNMENT_INDIRECT, trimmedExpression: rhs, assignment: assignmentInfo};
    }

    //TODO: make this easier to update
    const varDict = {
        "x": ExpressionType.EXPLICIT_X,
        "y": ExpressionType.EXPLICIT_Y,
        "z": ExpressionType.EXPLICIT_Z,
        "r": ExpressionType.EXPLICIT_R,
        "\\theta": ExpressionType.EXPLICIT_THETA
    }

    if(lhs.length === 1){
        const lhsToken = lhs[0];

        
        console.log("susp = correct");

        if(lhsToken.string in CoordinateByLatex){
            if(rhs.some((t) => t.metadata.dependencies.has(lhsToken.string))) {
                return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};
            }

            if(lhsToken.metadata.superscript === undefined) {
                return {type: varDict[lhsToken.string], trimmedExpression: rhs}; //format: ? = (anything but '?')
            }
        }

        // if(isValidVariableToken(lhsToken) && !lhsToken in CoordinateByLatex){
        //     if(rhs.length === 1 && rhs[0].type === "number") return {type: ExpressionType.ASSIGNMENT_DIRECT, trimmedExpression: rhs, assignment: {variable: lhsToken.string, value: rhs[0].string}}; //Ex: a=5

        //     if(rhs.some((t) => t.metadata.dependencies.has(lhsToken.string))) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP}; //you can't define a variable in terms of itself

        //     return {type: ExpressionType.ASSIGNMENT_INDIRECT, trimmedExpression: rhs, assignment: {variable: lhsToken.string}};
        // }

        // if(rhs.length === 1 && rhs[0].string in CoordinateByLatex){
        //     return {type: varDict[rhs[0].string], trimmedExpression: lhs}; //Ex: 0=x, 15=theta
        // }

        // return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP}; //Ex: 0=...xyz...
    }

    if(rhs.length === 1){
        const rhsToken = rhs[0];

        if(rhsToken.string in CoordinateByLatex){
            if(lhs.some((t) => t.metadata.dependencies.has(rhsToken.string))) return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};

            return {type: varDict[rhsToken.string], trimmedExpression: lhs}; 
        } 

        return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};
    }

    return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};
}

/**
 * Typesets a list of NSP-layer tokens into NST-layer tokens
 * @param {Object[]} tokensNSP List of NSP-layer tokens
 * @returns {Object[]} A list of NST-layer tokens representing the expression
 */
export function typesetTokens(tokensNSP, isSubscript = false, isSuperscript = false){
    if(isSubscript){
        //check if tokens are like a_someTextHere --> push as a alphanumeric token

        if(tokensNSP.some((t) => t.metadata.subscript || t.metadata.superscript)) {
            throw new Error("Subscript tokens contain subscript or superscript metadata:", tokensNSP);
        }

        if(tokensNSP.every((t) => t.type === "letter" || t.type === "number" || t.type === "command" || t.type === "delimiter")){
            //push as alphanumeric token

            //push command tokens as \commandName (with a space after?) but no space at the end of the string

            const returnTokens = [{
                type: TokenType.ALPHANUMERIC,
                string: tokensNSP.map((t) => t.type === "command" ? "\\" + t.string + " " : t.string).join('').trimEnd(),
                metadata: {}
            }];

            return {type: ExpressionType.SUBSCRIPT_IDENTIFIER, tokens: returnTokens};
        }

        throw new Error("Subscript tokens are not all letters, numbers, commands, or delimiters:", tokensNSP);
        //TODO: handle subscripts that are not alphanumeric (e.g., a_{b+c})
    }

    determineDependencies(tokensNSP);

    const expressionInfo = typesetExpression(tokensNSP);
    const type = expressionInfo.type;
    const trimmedTokens = expressionInfo.trimmedExpression;

    let tokens = []; //NST

    for(let i = 0; i<trimmedTokens.length; i++){
        const tokenNSP = trimmedTokens[i];

        if(tokenNSP.metadata.subscript || tokenNSP.metadata.superscript){
            //recursively typeset subscript and superscript tokens
            const subscriptExpression = tokenNSP.metadata.subscript ? typesetTokens(tokenNSP.metadata.subscript, true, false) : null;
            const superscriptExpression = tokenNSP.metadata.superscript ? typesetTokens(tokenNSP.metadata.superscript, false, true) : null;

            //replace sub- / super-scripts
            tokenNSP.metadata.subscript = subscriptExpression;
            tokenNSP.metadata.superscript = superscriptExpression;
        }
        
        switch(tokenNSP.type){
            case "bracket":
                tokens.push({
                    type: TokenType.BRACKET, 
                    code: BracketByLatex[tokenNSP.string], 
                    string: tokenNSP.string, 
                    metadata: tokenNSP.metadata
                });
                break;
            case "command":
                const command = tokenNSP.string;
                let metadata = structuredClone(tokenNSP.metadata); //copy metadata so we can modify it without affecting the original token
                let type = null;
                let code = null;

                //WHAT TO DO FOR BIG OPERATORS: \sum, \int, \lim, etc??

                //Attempt to determine token type based on command name
                //If unnsuccessful, default to TokenType.OPERAND with metadata.parameter = command and let compilation handle it
                if(command in BigOperatorByLatex){
                    type = TokenType.BIG_OPERATOR, code = BigOperatorByLatex[command];
                }else if(command in OperatorByLatex){
                    type = TokenType.OPERATOR, code = OperatorByLatex[command];
                }else if(command in FunctionByLatex) {
                    type = TokenType.FUNCTION, code = FunctionByLatex[command];
                }else {
                    if(tokenNSP.metadata.subscript && tokenNSP.metadata.subscript.length === 1 && tokenNSP.metadata.subscript[0].type === "alphanumeric"){
                        //replace token.string with base_subscript 

                        //has already been done:
                        //token.string = tokenNSP.string + "_" + tokenNSP.metadata.subscript[0].string;
                    }

                    console.assert(isValidVariableToken(tokenNSP));

                    type = TokenType.OPERAND;
                    //metadata.parameter = token.string; //.parameter not added yet

                    if(tokenNSP.string in ConstantByLatex) code = ConstantByLatex[tokenNSP.string];
                }

                tokens.push({
                    type: type,
                    code: code,
                    string: command,
                    metadata: metadata
                });
                break;
            case "delimiter":
                if(!(tokenNSP.string in DelimiterByLatex)) throw new Error("Delimiter not recognized: " + tokenNSP.string);

                tokens.push ({
                    type: TokenType.DELIMITER,
                    code: DelimiterByLatex[tokenNSP.string],
                    string: tokenNSP.string,
                    metadata: tokenNSP.metadata
                });
                break;
            case "letter":
                if(tokenNSP.metadata.subscript && tokenNSP.metadata.subscript.length === 1 && tokenNSP.metadata.subscript[0].type === "alphanumeric"){
                    //replace token.string with base_subscript 

                    //already done:
                    //token.string = tokenNSP.string + "_" + tokenNSP.metadata.subscript[0].string;
                }

                let letterToken = {
                    type: TokenType.OPERAND,
                    code: null,
                    string: tokenNSP.string,
                    metadata: tokenNSP.metadata
                };

                if(!(tokenNSP.string in CoordinateCode || tokenNSP.string in ConstantCode)){
                    const dependableData = getDependableData(tokenNSP.string);

                    if(dependableData){
                        if(dependableData.type === 2){
                            type = TokenType.FUNCTION;
                            code = FunctionByLatex[tokenNSP.string];
                        }
                    }
                } 

                //if(type === TokenType.OPERAND) tokenNSP.metadata.parameter = tokenNSP.string;

                tokens.push(letterToken);
                break;
            case "number":
                tokens.push({
                    type: TokenType.OPERAND,
                    code: null,
                    string: tokenNSP.string,
                    metadata: tokenNSP.metadata
                });
                break;
            case "operator":
                if(!(tokenNSP.string in OperatorByLatex)) throw new Error("Operator not recognized: " + tokenNSP.string);

                tokens.push({
                    type: TokenType.OPERATOR,
                    code: OperatorByLatex[tokenNSP.string],
                    string: tokenNSP.string,
                    metadata: tokenNSP.metadata
                });
                break;
            default:
                throw new Error("Token type not recognized: " + tokenNSP.type);
                break;
        }
    }

    let expressionDependencies = new Set();
    trimmedTokens.forEach((token) => expressionDependencies = expressionDependencies.union(token.metadata.dependencies));

    const compileReadyTokenList = insertImplicitOperations(tokens);

    let result = {type: type, tokens: compileReadyTokenList, dependencies: expressionDependencies};
    if(expressionInfo.definition) result.definition = expressionInfo.definition;
    if(expressionInfo.assignment) result.assignment = expressionInfo.assignment;

    return result;
}

/**
 * Insert implicit * and also clarify binary/unary minus 
 * @param {*} tokensNSP 
 */
export function insertImplicitOperations(tokensNSP){
    let outputs = [];

    let previous = {};

    tokensNSP.forEach((token, index) => {
        if(isUnarySubtraction(tokensNSP[index-1],token)){
            token.code = OperatorCode.NEG; //negation
        }

        if(isImplicitMultiplication(tokensNSP[index-1],token)){
            outputs.push({type: TokenType.OPERATOR, code: OperatorCode.MUL, string: "*", metadata: {fullString: "*"}});
        }

        outputs.push(token); //Assumption: unary - and implicit * cannot both be inserted
    });

    return outputs;
}

function isValidLeftOperand(token){
    const isOperandToken = (token.type === TokenType.OPERAND || token.type === TokenType.BIG_OPERATOR);
    const isRightBracket = (token.type === TokenType.BRACKET && token.code % 2 === 1);
    const isLeftAssociativeUnary = (token.type === TokenType.OPERATOR) && (Operators.get(token.code)?.arity === 1) && (Operators.get(token.code)?.associativity === OperatorAssociativity.LEFT);

    return isOperandToken || isRightBracket || isLeftAssociativeUnary;
}

function isValidRightOperand(token){
    const isOperandToken = (token.type === TokenType.OPERAND || token.type === TokenType.BIG_OPERATOR || token.type === TokenType.FUNCTION);
    const isLeftBracket = (token.type === TokenType.BRACKET && token.code % 2 === 0);
    const isRightAssociativeUnary = (token.type === TokenType.OPERATOR) && (Operators.get(token.code)?.arity === 1) && (Operators.get(token.code)?.associativity === OperatorAssociativity.RIGHT);

    return isOperandToken || isLeftBracket || isRightAssociativeUnary;
}

function isUnarySubtraction(leftToken, token){
    if(token.type !== TokenType.OPERATOR) return false;
    if(token.code !== OperatorCode.SUB) return false;

    //if is at the beginning of the expression
    if(!leftToken) return true;

    return !isValidLeftOperand(leftToken);
}

function isImplicitMultiplication(leftToken, rightToken){
    if(!leftToken) return false;

    return isValidLeftOperand(leftToken) && isValidRightOperand(rightToken);
}

export function testExpressionTypeset(tests){
    console.log("Testing typeset expression");

    tests.forEach((test) => {
        console.log("Test: "+test.map((t) => t.string).join(""));

        const result = typesetTokens(test);
        console.log(result);

        const compiled = compileExpression(result);
        console.log(compiled);
    });
}

export function compileExpression(expression){
    let tokens = expression.tokens;

    console.log(expression);
    console.log(tokens.length);

    let outputs = [];
    let operators = [];

    let argCountStack = []; //determining how many arguments are passed to each function

    const pushTokenToOutput = (token) => {
        outputs.push(token);
        if(token.type === TokenType.FUNCTION){
            if(token.metadata.superscript){
                const superscriptExpression = compileExpression(token.metadata.superscript);
                outputs.push(...superscriptExpression.tokens); //not using pushTokenToOutput? Why does this work?

                const exponentiatorToken = {type: TokenType.OPERATOR, code: OperatorCode.POWN, string: "^", metadata: {}};
                outputs.push(exponentiatorToken);
            }
        }
    }

    const isLeftBracket = (t) => t.type === TokenType.BRACKET && t.code % 2 === 0;

    //TODO: replace letters that are parameters with parameter placeholders

    tokens.forEach((token) => {
        // console.log("token: ", token);
        // console.log("outputs:",outputs);
        // console.log("operators:",operators);

        switch(token.type){
            case TokenType.OPERAND:
                pushTokenToOutput(token);
                break;
            case TokenType.OPERATOR:
                const op = Operators.get(token.code);
                const prec = op.precedence, assoc = op.associativity;

                while(operators.length > 0){
                    const nextOpToken = operators[operators.length-1];

                    if(nextOpToken.type !== TokenType.OPERATOR){
                        console.assert(isLeftBracket(nextOpToken), "Top of operator stack is not an operator: ",nextOpToken);
                        break;
                    }

                    const LEFT = OperatorAssociativity.LEFT; //fed up with long name
                    const nextOp = Operators.get(nextOpToken.code);

                    if((assoc === LEFT) ? (nextOp.precedence >= prec) : (nextOp.precedence > prec)){
                        const pop = operators.pop();
                        console.assert(pop !== undefined, "Undefined operator being pushed.");

                        outputs.push(pop);
                    } else break;
                }

                operators.push(token);
                break;
            case TokenType.BRACKET:
                if(token.code % 2 === 0){
                    //left bracket
                    //push bracket context
                    //push bracket context arg count
                    //push bracket context arg start
                    operators.push(token);
                }else{
                    console.log("Clearing operators until (. Length: "+operators.length);

                    while(operators.length > 0 && !isLeftBracket(operators[operators.length-1])){
                        outputs.push(operators.pop());
                    }

                    if(operators.length === 0) throw new Error("Mismatched brackets");

                    const leftBracket = operators[operators.length-1];
                    console.assert(isLeftBracket(leftBracket));

                    operators.pop();

                    if(operators.length > 0){
                        if(operators[operators.length-1].type === TokenType.FUNCTION){
                            //output push function
                            pushTokenToOutput(operators.pop());
                        }
                    }
                }
                break;
            case TokenType.FUNCTION:
                operators.push(token);
                //argCountStack.push(1);
                break;
            case TokenType.ALPHANUMERIC:
                //err
                break;
            case TokenType.DELIMITER:
                //get context in
                //bracket function args and stuff

                if(token.code === DelimiterCode.COMMA){
                    //while the operator at the top of the operator stack is not a left parenthesis:
                    //pop the operator from the operator stack into the output queue

                    while(operators.length > 0 && !isLeftBracket(operators[operators.length-1])){
                        outputs.push(operators.pop());
                    }

                    console.assert(operators.length > 0);

                    // const leftBracket = operators[operators.length-1];
                    // console.assert(isLeftBracket(leftBracket));

                    // operators.pop();
                }
                break;
            case TokenType.EXPRESSION:
                //insert tokens of expression
                break;
            case TokenType.BIG_OPERATOR:
                switch(token.string){
                    case "\\frac":
                        outputs.push(...compileFractionFromToken(token));
                        break;
                    case "\\sqrt":
                        outputs.push(...compileRadicalFromToken(token));
                        break;
                }
                break;
            
        }

        if(token.metadata.superscript && token.type !== TokenType.FUNCTION){
            const superscriptExpression = compileExpression(token.metadata.superscript);
            outputs.push(...superscriptExpression.tokens); //TODO: not using pushTokenToOutput

            const exponentiatorToken = {type: TokenType.OPERATOR, code: OperatorCode.POWN, string: "^", metadata: {}};
            outputs.push(exponentiatorToken);
        }

        //if subscripts denote indexing:

        /*
        if(token.metadata.subscript){
            const subscriptExpression = compileExpression(token.metadata.superscript);

            outputs.push(...superscriptExpression.tokens);

            const indexerToken = {type: TokenType.OPERATOR, code: OperatorCode.INDEX, string: "_", metadata: {}};
            outputs.push(indexerToken);
        }*/
    });

    while(operators.length > 0){
        console.assert(operators[operators.length-1].type !== TokenType.BRACKET);

        pushTokenToOutput(operators.pop());
    }

    const requiredAttributes = new Set();
    if(tokens.some((token) => token.string == "\\pm")) requiredAttributes.add("uncertainty");

    const result = {
        type: expression.type,
        tokens: outputs,
        dependencies: expression.dependencies,
        requiredAttributes: requiredAttributes
    };

    if(expression.assignment !== undefined) result.assignment = expression.assignment;
    if(expression.definition !== undefined) result.definition = expression.definition;

    return result;
}