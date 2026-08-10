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

import { FunctionByLatex } from "./functions/defaultFunctions.js";
import { Operators, OperatorAssociativity, OperatorByLatex, OperatorCode, OperatorInfo } from "./functions/defaultOperators.js";
import { ConstantCode, ConstantByLatex } from "./functions/defaultConstants.js";

import { getDependable, getDependableData } from "./expressions.js";
import { OpCode } from "./evaluator.js";

/**
 * Determines if a token is a valid variable token (i.e., can be used as a variable, function parameter, or function name)
 * @param {Object} NSPToken Token to check
 * @returns {bool}
 */
function isValidVariableToken(NSPToken){
    //should disregard coordinates?

    if(NSPToken.type === "letter") return true;

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

    if(tokensNSP[0].type !== "letter") return false;
    if(tokensNSP[1].string !== "(") return false;

    let i = 2;
    while(i<tokensNSP.length-1){
        const paramToken = tokensNSP[i];
        if(!isValidVariableToken(paramToken)) return false;

        if(tokensNSP[i+1].string === ")"){
            if(i+1 !== tokensNSP.length-1) return false; //there are extra tokens after the closing parenthesis
            return true;
        }

        if(tokensNSP[i+1].string !== ",") return false; //throw new Error("Unexpected token in function definition: " + tokensNSP[i+1].string);

        i += 2;
    }

    throw new Error("Unexpected end of tokens in function definition: " + tokensNSP.map((t) => t.string).join(' '));
}

export function determineTokenDependencies(tokensNSP){
    tokensNSP.forEach((token) => {
        let dependencies = new Set();

        if(isValidVariableToken(token)){
            dependencies = dependencies.union(new Set([token.string]));
        }

        if(token.metadata.subscriptExpression){
            dependencies = dependencies.union(determineDependencies(token.metadata.subscriptExpression));
        }

        if(token.metadata.superscriptExpression){
            dependencies = dependencies.union(determineDependencies(token.metadata.superscriptExpression));
        }

        token.metadata.dependencies = dependencies;
    });
}

/**
 * Typesets an expression represented by a list of NSP-layer tokens
 * @param {*} tokensNSP 
 * @returns {Object} {type: TokenType, trimmedExpression: Object[]} The type of expression represented by the tokens
 */
export function typesetExpression(tokensNSP){
    if(tokensNSP.length === 0) return null;

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

        if(lhsToken.string in CoordinateByLatex){
            if(rhs.some((t) => t.metadata.dependencies.has(lhsToken.string))) return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP};

            return {type: varDict[lhsToken.string], trimmedExpression: rhs}; //format: ? = (anything but '?')
        }

        if(lhsToken.type === "letter" || lhsToken.type === "command"){
            if(!isValidVariableToken(lhsToken)){
                return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP}; //TODO: validate setting variables to latex commands with arguments like \vector{a} = (1,2,3) but not \frac{1}{2} = 3
            }

            if(rhs.length === 1 && rhs[0].type === "number") return {type: ExpressionType.ASSIGNMENT_DIRECT, trimmedExpression: rhs, assignment: {variable: lhsToken.string, value: rhs[0].string}}; //Ex: a=5

            if(rhs.some((t) => t.metadata.dependencies.has(lhsToken.string))) return {type: ExpressionType.INVALID, trimmedExpression: tokensNSP}; //you can't define a variable in terms of itself

            return {type: ExpressionType.ASSIGNMENT_INDIRECT, trimmedExpression: rhs, assignment: {variable: lhsToken.string}};
        }

        if(rhs.length === 1 && rhs[0].string in CoordinateByLatex){
            return {type: varDict[rhs[0].string], trimmedExpression: lhs}; //Ex: 0=x, 15=theta
        }

        return {type: ExpressionType.IMPLICIT, trimmedExpression: tokensNSP}; //Ex: 0=...xyz...
    }

    if(isFunctionDefinition(lhs)){
        if(rhs.some((t) => t.metadata.dependencies.has(lhs[0].string))) return {type: ExpressionType.INVALID, trimmedExpression: rhs}; //you can't define a function in terms of itself

        return {type: ExpressionType.DEFINITION, trimmedExpression: rhs, definition: {name: lhs[0].string, parameters: lhs.slice(2,lhs.length-1).filter((t) => t.string !== ",").map((t) => t.string)}};
    }

    if(rhs.length === 1){
        rhsToken = rhs[0];

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

    determineTokenDependencies(tokensNSP);

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
                if(command in FunctionByLatex){
                    type = TokenType.FUNCTION, code = FunctionByLatex[command];
                }else if(command in OperatorByLatex){
                    type = TokenType.OPERATOR, code = OperatorByLatex[command];
                }else if(command === "\\frac") {
                    const numerator = tokenNSP.metadata.requiredArguments[0];
                    const denominator = tokenNSP.metadata.requiredArguments[1];

                    tokens.push(...(typesetTokens(numerator).tokens)); //numerator
                    tokens.push(...(typesetTokens(denominator).tokens));

                    type = TokenType.OPERATOR, code = OperatorCode.DIV;
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
    const isOperandToken = (token.type === TokenType.OPERAND);
    const isRightBracket = (token.type === TokenType.BRACKET && token.code % 2 === 1);
    const isLeftAssociativeUnary = (token.type === TokenType.OPERATOR) && (Operators.get(token.code)?.arity === 1) && (Operators.get(token.code)?.associativity === OperatorAssociativity.LEFT);

    return isOperandToken || isRightBracket || isLeftAssociativeUnary;
}

function isValidRightOperand(token){
    const isOperandToken = (token.type === TokenType.OPERAND);
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

    tokens.forEach((token) => {
        //console.log("token: ", token);


        switch(token.type){
            case TokenType.OPERAND:
                outputs.push(token);
                break;
            case TokenType.OPERATOR:
                const op = Operators.get(token.code);
                const prec = op.precedence, assoc = op.associativity;

                while(operators.length > 0){
                    const nextOpToken = operators[operators.length-1];

                    if(nextOpToken.type !== TokenType.OPERATOR){
                        console.error("Top of operator stack is not an operator: ",nextOp);
                        break;
                    }

                    const LEFT = OperatorAssociativity.LEFT; //fed up with long name
                    const nextOp = Operators.get(nextOpToken.code);

                    if((assoc === LEFT) ? (nextOp.precedence >= prec) : (nextOp.precedence > prec)){
                        outputs.push(operators.pop());
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
                    console.log(operators[0],operators[1]);

                    while(operators.length > 0){
                        const nextOp = operators[operators.length-1];
                        console.log(nextOp);

                        if(nextOp.type === TokenType.BRACKET && nextOp.code % 2 === 0){
                            break;
                        }

                        outputs.push(operators.pop());
                    }

                    if(operators.length === 0) throw new Error("Mismatched brackets");

                    console.assert(operators.length > 0);

                    const leftBracket = operators[operators.length-1];
                    console.assert(leftBracket.type===TokenType.BRACKET && leftBracket.code % 2 === 0);

                    operators.pop();

                    if(operators[operators.length-1].type === TokenType.FUNCTION){
                        outputs.push(operators.pop());
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

                    //HACK CHECK
                    while(operators.length > 0){
                        const nextOp = operators.pop();

                        if(nextOp.type === TokenType.BRACKET && nextOp.code % 2 === 0){
                            operators.push(nextOp);
                        }

                        outputs.push(nextOp);
                    }
                }
                break;
            case TokenType.EXPRESSION:
                //??
                break;
            case TokenType.BIG_OPERATOR:
                //??
                break;
            
        }

        if(token.metadata.superscript){
            const superscriptExpression = compileExpression(token.metadata.superscript);
            outputs.push(...superscriptExpression.tokens);

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

        outputs.push(operators.pop());
    }

    const result = {
        type: expression.type,
        tokens: outputs,
        parameters: []
    };

    if(expression.assignment) result.assignment = expression.assignment;
    if(expression.definition) result.definition = expression.definition;

    return result;
}

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
function substitute(tokens, input, options = {}){
    const propagateBoundary = options.propagateBoundary ?? false;
    const propagateInterval = options.propagateInterval ?? false;
    const propagateUncertainty = options.propagateUncertainty ?? false;
    const doNonPrincipalBranch = options.doNonPrincipalBranch ?? false;

    const evalAsObject = propagateBoundary + propagateInterval + doNonPrincipalBranch + propagateUncertainty > 0;

    let outputs = [];
    for(let i = 0; i<tokens.length; i++) {
        const token = tokens[i];

        if(token.type !== TokenType.OPERAND) {
            outputs.push(token); 
            continue;
        }

        if(token.metadata.value && !evalAsObject){
            outputs.push(token.metadata.value);
            continue;
        }

        const info = input.get(token.string);
        const value = info.value;

        if(!evalAsObject){
            outputs.push(value);
            continue;
        }

        throw new Error("Not yet implemented");

        const result = {
            value: value
        }

        if(propagateBoundary) token.boundary = [0,0,0];
        if(propagateInterval) token.interval = info.interval;
        if(propagateUncertainty) token.uncertainty = 0;

        outputs.push(result);
    };

    return outputs;
}

/**
 * 
 * @param {*} expression 
 * @param {Map} input 
 * @param {*} options 
 */
export function evaluateExpressionWithOptions(expression, input, options){
    let tokens = substitute(expression.tokens, input, options);

    let solve = [];
    tokens.forEach((token) => {
        switch(token.type){
            case TokenType.OPERAND:
                solve.push(token);
                break;
            case TokenType.OPERATOR:
                const code = token.code;

                const arity = Operators.get(token.code).arity;
                const args = arity === 1 ? [solve.pop()] : [solve.pop(),solve.pop()];

                solve.push(op(code, args));

                break;
            case TokenType.FUNCTION:
                const funcResult = func(token.code, solve.pop());
                solve.push(funcResult);

                break;
            default:
                //if(token.type || !options)
                    solve.push(token);
                //throw new Error("Unknown token type identified");
                break;
            //case TokenType.ALPHANUMERIC:
                //break;
        }
    });

    if(solve.length !== 1) throw new Error("Error in stack evaluation. Length: "+solve.length);

    return solve[0];
}

function op(code, args){
    switch(code){
        case OpCode.ADD:
            return args[1]+args[0];
        case OpCode.SUB:
        case OpCode.EQ:
            return args[1]-args[0];
        case OpCode.MUL:
            return args[1]*args[0];
        case OpCode.DIV:
            return args[1]/args[0];
        case OpCode.POW:
        case OpCode.POWN:
            return args[1]**args[0];
        case OpCode.NEG:
            return -args[0];

    }
} 

function func(code, arg){
    switch(code){
        case 101:
            return Math.sin(arg);
        case 102:
            return Math.cos(arg);
        case 103:
            return Math.tan(arg);
    }
}