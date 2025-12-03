const TokenType = {
    INV: -1,
    NUL: 0,
    NUM: 1,
    OP: 2,
    FUNC: 3,
    STRG: 4,
    BRKT: 5,
    UNKN: 6,
    CNST: 7,
    VAR: 8,
    DELIM: 9,
    VEC: 10
}

// 0/null  1/number  2/operator  3/function  4/string
// 5/bracket  6/unknowns  7/constants  8/variables  9/delimeter
// 10+/ reference-types  -1/invalid

const OpCode = {
    ADD: 1,
    SUB: 2,
    MUL: 3,
    DIV: 4,
    POW: 5,
    LT: 6, 
    LTE: 7,
    GT: 8,
    GTE: 9,
    EQ: 10,
    NEQ: 11,
    AND: 12,
    OR: 13,
    XOR: 14,
    NOT: 15,
    FACT: 16,
    NEG: 17, //unary neg
    DPR: 18, //dot prod
    CRP: 19, //cross prod
}

const OpAssoc = {
    LEFT: 0,
    RIGHT: 1
};

const OpInfo = {
    "+": {code: OpCode.ADD, precedence: 1, associativity: OpAssoc.LEFT, arity: 2},
    "-": {code: OpCode.SUB, precedence: 1, associativity: OpAssoc.LEFT, arity: 2},
    "*": {code: OpCode.MUL, precedence: 2, associativity: OpAssoc.LEFT, arity: 2},
    "/": {code: OpCode.DIV, precedence: 2, associativity: OpAssoc.LEFT, arity: 2},
    "^": {code: OpCode.POW, precedence: 3, associativity: OpAssoc.RIGHT, arity: 2},
    "<": {code: OpCode.LT,  precedence: 0, associativity: OpAssoc.LEFT, arity: 2},
    "<=": {code: OpCode.LTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2},
    ">": {code: OpCode.GT, precedence: 0, associativity: OpAssoc.LEFT, arity: 2},
    ">=": {code: OpCode.GTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2},
    "=": {code: OpCode.EQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2},
    "==": {code: OpCode.EQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2},
    "!=": {code: OpCode.NEQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2},
    "&&": {code: OpCode.AND, precedence: -2, associativity: OpAssoc.LEFT, arity: 2},
    "||": {code: OpCode.OR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2},
    "^^": {code: OpCode.XOR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2},
    "~": {code: OpCode.NOT, precedence: 1, associativity: OpAssoc.LEFT, arity: 1},
    "!": {code: OpCode.FACT, precedence: 4, associativity: OpAssoc.RIGHT}, arity: 1,
    "u-": {code: OpCode.NEG, precedence: 1, associativity: OpAssoc.RIGHT, arity: 1},
    "#": {code: OpCode.CRP, precedence: 2, associativity: OpAssoc.LEFT, arity: 2}
}

const FuncCode = {
    SIN: 101,
    COS: 102,
    TAN: 103,
    SEC: 104,
    CSC: 105,
    COT: 106,
    ASIN: 107,
    ACOS: 108,
    ATAN: 109,
    ASEC: 110,
    ACSC: 111,
    ACOT: 112,
    SINH: 113,
    COSH: 114,
    TANH: 115,
    SECH: 116,
    CSCH: 117,
    COTH: 118,
    ASINH: 119,
    ACOSH: 120,
    ATANH: 121,
    ASECH: 122,
    ACSCH: 123,
    ACOTH: 124,
    GD: 125,
    LAM: 126,
    ABS: 127,
    SIGN: 128,
    FLOOR: 129,
    CEIL: 130,
    ROUND: 131,
    TRUNC: 132,
    MOD: 133,
    MIN: 134,
    MAX: 135,
    AVG: 136,
    MED: 137,
    MDE: 138,
    EXP: 139,
    LN: 140,
    LOG: 141,
    LOGN: 142, 
    SQRT: 143,
    CBRT: 144,
    NTHRT: 145,
    GAMMA: 146,
    ZETA: 147,
    DGAMA: 148,
    PGAMA: 149
}

const FuncInfo = {
    "sin": {code: FuncCode.SIN, staticArgs: true, args: 1},
    "cos": {code: FuncCode.COS, staticArgs: true, args: 1},
    "tan": {code: FuncCode.TAN, staticArgs: true, args: 1},
    "sec": {code: FuncCode.SEC, staticArgs: true, args: 1},
    "csc": {code: FuncCode.CSC, staticArgs: true, args: 1},
    "cot": {code: FuncCode.COT, staticArgs: true, args: 1},
    "asin": {code: FuncCode.ASIN, staticArgs: true, args: 1},
    "acos": {code: FuncCode.ACOS, staticArgs: true, args: 1},
    "atan": {code: FuncCode.ATAN, staticArgs: true, args: 1},
    "asec": {code: FuncCode.ASEC, staticArgs: true, args: 1},
    "acsc": {code: FuncCode.ACSC, staticArgs: true, args: 1},
    "acot": {code: FuncCode.ACOT, staticArgs: true, args: 1},
    "sinh": {code: FuncCode.SINH, staticArgs: true, args: 1},
    "cosh": {code: FuncCode.COSH, staticArgs: true, args: 1},
    "tanh": {code: FuncCode.TANH, staticArgs: true, args: 1},
    "sech": {code: FuncCode.SECH, staticArgs: true, args: 1},
    "csch": {code: FuncCode.CSCH, staticArgs: true, args: 1},
    "coth": {code: FuncCode.COTH, staticArgs: true, args: 1},
    "asinh": {code: FuncCode.ASINH, staticArgs: true, args: 1},
    "acosh": {code: FuncCode.ACOSH, staticArgs: true, args: 1},
    "atanh": {code: FuncCode.ATANH, staticArgs: true, args: 1},
    "asech": {code: FuncCode.ASECH, staticArgs: true, args: 1},
    "acsch": {code: FuncCode.ACSCH, staticArgs: true, args: 1},
    "acoth": {code: FuncCode.ACOTH, staticArgs: true, args: 1}
}

const BracCode = {
    LRND: 1,
    RRND: 2,
    LSQR: 3,
    RSQR: 4,
    LCUR: 5,
    RCUR: 6,
    LFNC: 7,
    RFNC: 8
}

const BracInfo = {
    "(": BracCode.LRND,
    ")": BracCode.RRND,
    "[": BracCode.LSQR,
    "]": BracCode.RSQR,
    "{": BracCode.LCUR,
    "}": BracCode.RCUR,
    "(.": BracCode.LFNC,
    ").": BracCode.RFNC
}

const UnknownCode = {
    CARTX: 1,
    CARTY: 2,
    CARTZ: 3,
    POLRT: 4, //theta
    POLRR: 5, //radius
    POLRP: 6, //phi
}

const UnknownInfo = {
    "x": UnknownCode.CARTX,
    "y": UnknownCode.CARTY,
    "z": UnknownCode.CARTZ,
    "θ": UnknownCode.POLRT,
    "r": UnknownCode.POLRR,
    "φ": UnknownCode.POLRP
}

const ConstantCode = {
    PI: 1,
    EUL_NUM: 2,
    EUL_CON: 3,
    GRV_ERT: 4,
    SOL_CON: 5,
    GRV_CON: 6,
    AVO_NUM: 7,
    GAS_CON: 8,
    BZM_CON: 9,
    SBM_CON: 10,
    CUL_CON: 11,
    EPS_ZRO: 12,
    MU_ZRO: 13,
    SP_LGHT: 14,
    PLK_CON: 15,
    Q_ELEM: 16,
    M_ELEC: 17,
    M_PROT: 18,
    M_NEUT: 19,
    UM_ATOM: 20,
    RAD_FRM: 21
}

const ConstantInfo = {
    "pi": {code: ConstantCode.PI, value: 3.141592653589793},
    "eunum": {code: ConstantCode.EUL_NUM, value: 2.718281828459045},
    "eucon": {code: ConstantCode.EUL_CON, value: 0.577215664901532},
    "egrav": {code: ConstantCode.GRV_ERT, value: 9.80665},
    "sc": {code: ConstantCode.SOL_CON, value: 1360},
    "grav": {code: ConstantCode.GRV_CON, value: 6.67430e-11},
    "NA": {code: ConstantCode.AVO_NUM, value: 6.02214076e23},
    "gascon": {code: ConstantCode.GAS_CON, value: 8.314462618},
    "bmc": {code: ConstantCode.BZM_CON, value: 1.380649e-23},
    "sbc": {code: ConstantCode.SBM_CON, value: 5.670374419e-8},
    "culuk": {code: ConstantCode.CUL_CON, value: 8.99e9},
    "epzo": {code: ConstantCode.EPS_ZRO, value: 8.854187817e-12},
    "muzo": {code: ConstantCode.MU_ZRO, value: 1.25663706144e-6},
    "speli": {code: ConstantCode.SP_LGHT, value: 299792458},
    "plcon": {code: ConstantCode.PLK_CON, value: 6.63e-34},
    "elcharge": {code: ConstantCode.Q_ELEM, value: 1.602176634e-19},
    "elmas": {code: ConstantCode.M_ELEC, value: 9.1093837015e-31},
    "prmas": {code: ConstantCode.M_PROT, value: 1.67262192369e-27},
    "numas": {code: ConstantCode.M_NEUT, value: 1.67492749804e-27},
    "uam": {code: ConstantCode.UM_ATOM, value: 1.66053906660e-27},
    "radfer": {code: ConstantCode.RAD_FRM, value: 1.20e-15}
}

const validOperators = ["+", "-", "*", "/", "^", "<", "<=", ">", ">=", "=", "!=", "&&", "||", "!", "u-", "#", "_"];
const operatorPrecedences = [1, 1, 2, 2, 3, 0, 0, 0, 0, -1, -1, 4, 4]; //corresponding to validOperators
const operatorAssociativities = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

//const operatorAssociativities = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0];

const validFunctions = [
    "sin", "cos", "tan", 
    "arcsin","arccos","arctan",
    "csc","sec","cot",
    "arccsc","arcsec","arccot",
    "sinh","cosh","tanh",
    "arcsinh","arccosh","arctanh",
    "csch","sech","coth",
    "arccsch","arcsech","arccoth",
    "gd","lam","abs","sign","mod",
    "floor","ceil","round","trunc",
    "min","max","avg","median",
    "exp","ln","log","logn",
    "sqrt","cbrt","nthroot",
    "sinc","gamma","zeta","digamma","polygamma",
    "Ei","Ti","Li","erf",
    "fresnelS","fresnelC","Si","Ci",
    "dawsonP","dawsonM","Ai",
    "sum","integral",
    "not","or","and","xor","bool"
];

const constantValues = [
    3.141592653589793,
    2.718281828459045,
    0.577215664901532,
    9.80665,
    299792458,
    6.67430e-11,
    6.02214076e23,
    8.314462618,
    5.670374419e-8,
    3.828e26,
    1.380649e-23,
    8.854187817e-12,
    4.135667696e-15,
    299792458,
    1.616255e-35,
    1.602176634e-19,
    9.1093837015e-31,
    1.67262192369e-27,
    1.67492749804e-27,
    1.66053906660e-27,
    1.0973731568508e7
];

const validConstants = [
    "pi","eunum","eucon",
    "egrav","sc",
    "grav", "NA", "gascon",
    "bmc","sbc","culuk","epzo","muzo","speli","plcon",
    "elcharge","elmas","prmas","numas","uam",
    "radfer"
];

const numRegex = /^[0-9]*\.?[0-9]+$/;
const alphanumRegex = /^[a-zA-Z0-9]+$/;
const operatorRegex = /^[+\-*\/^%!=<>&|#_]$/;
const bracketRegex = /^[\(\)\[\]]{1}$/;

var tokenizedExpressions = []; //Array<Array<string>>
var tokenizedExpressionMetas = []; //Array<Array<number>>

var compiledExpressions = []; //Array<Array<any>>

//var expression : [number, Array<string>]; //[type, tokens]

    function isNumber(string){
        return !isNaN(parseFloat(string));
    }

    function isOperator(string){
        return operatorRegex.test(string);
    }

    function getPrecedenceOfOp(op){
        index = validOperators.indexOf(op);

        if(index < 0){
            return -1;
        }

        return operatorPrecedences[index];
    }

    function getAssociativityOf(op){
        index = validOperators.indexOf(op);

        if(index < 0){
            return -1;
        }

        return operatorAssociativities(index);
    }

    function getArityOfOp(opCode){
        if(opCode == OpCode.FACT || opCode == OpCode.NEG) return 1;
        //if(op == "!" || op == "u-") return 1;
        return 2;
    }

    function isBracket(string){
        return bracketRegex.test(string);
    }

    function isPrefixOfElementIn(s, elements) {
        return elements.some(fn => fn.startsWith(s) && fn.length > s.length);
    }

    function isPrefixOfStringToken(string){
        if (string.length == 0) return true;

        //user-made constants
        //default functions
        if(isPrefixOfElementIn(string, validFunctions)){
            return true;
        }
        if(isPrefixOfElementIn(string, validConstants)){
            return true;
        }
        //user-made functions
        //default variables
        //user-made variables

        return false;
    }

    function typeOfStringToken(string){
        if(validFunctions.includes(string)){
            return 3; //functions
        }

        if(validConstants.includes(string)){
            return 7; //constants
        }

        switch(string){
            case "x":
            case "y":
            case "r":
            case "θ":
                return 6; //unknowns
            default:
                break;
        }

        return -1; //unknown
    }

    function testPushToken(token, tokenState){
        if(token.length < 0){
            return -1; //failure
        }

        if(tokenState == 0){
            return -1; //null
        }

        if(tokenState == 3){
            let type = typeOfStringToken(token);
            if(type >= 0){
                return type; //success
            }else{
                return -1; //failure
            }
        }

        return tokenState; //success
    }

    export function tokenizeExpression2(string){
        var tokens = []; //Array<string>
        var tokenMetas = []; //Array<number>

        let charState = 0; //number
        let tokenState = 0; //number

        // 0/null  1/number  2/operator  3/function  4/string
        // 5/bracket  6/unknowns  7/constants  8/variables  9/delimiters
        // 10+/ reference-types  -1/invalid

        let token = ""; //string
        let char = ""; //string
        let meta = 0; //number

        for (let index = 0; index < string.length; index++) {
            char = string.charAt(index);

            //if token+char makes sense as a token, continue building token
            //else push token to tokens, start new token with char

            //console.log(char + ", " + tokenState + " -> " + token);

            //char is number or decimal point: 1
            //char is operator char: 2
            //char is letter: 3
            //char is quotation mark: 4
            //char is bracket or comma: 5
            //char is whitespace: 0
            //else: -1

            if(/^[0-9.]$/.test(char)) charState = 1;
            else if(isOperator(char)) charState = 2;
            else if(isBracket(char) || char == ",") charState = 5;
            else if(alphanumRegex.test(char)) charState = 3;
            else if(char == '"' /* a quotation mark like " */) charState = 4;
            else if(/\s/.test(char)) charState = 0;
            else charState = -1;

            switch(tokenState){
                case TokenType.NUL:
                    if(token !== '"'){
                        token = char;
                    }else{
                        token = ""; //quotes aren't included in strings
                    }

                    tokenState = charState;
                    break;
                case TokenType.NUM: //numbers
                    if(charState != 1){
                        if(token.charAt(token.length - 1) == "."){
                            //something like "2."
                            console.error("Unknown number token: " + token);
                        }

                        if(token.length > 0){
                            meta = testPushToken(token, tokenState);
                            if(meta >= 0){
                                tokens.push(token); //TOKEN PUSH
                                tokenMetas.push(meta); //meta
                                //console.log("pushed token: " + token + " meta: " + meta);
                            }else{
                                console.error("Unknown token type for: " + token);
                            }
                        }

                        tokenState = charState;
                        token = char;

                        continue;
                    }

                    //already number token:

                    if(numRegex.test(token+char) || (token.indexOf(".") == -1 && char == ".")){
                        token = token.concat(char);
                    }else{
                        //something like "2.2.1", an invalid number
                        console.error("Unknown number token: " + token);
                    }
                    break;
                case TokenType.OP: //operators
                    if(charState != 2){
                        if(token.length > 0){
                            meta = testPushToken(token, tokenState);
                            if(meta >= 0){
                                tokens.push(token); //TOKEN PUSH
                                tokenMetas.push(meta); //meta
                                //console.log("pushed token: " + token + " meta: " + meta);
                            }else{
                                console.error("Unknown token type for: " + token);
                            }
                        }

                        tokenState = charState;
                        token = char;

                        continue;
                    }

                    //already operator token:

                    if(isPrefixOfElementIn(token+char,validOperators)){
                        token = token.concat(char);
                    }else if(validOperators.includes(token + char)){
                        meta = testPushToken(token+char, tokenState);
                        if(meta >= 0){
                            tokens.push(token+char); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + (token+char));
                        }
                        
                        tokenState = 0;
                        token = "";
                    }else if(validOperators.includes(token)){
                        meta = testPushToken(token, tokenState);
                        if(meta >= 0){
                            tokens.push(token); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + token);
                        }

                        tokenState = 2;
                        token = char;
                    }else{
                        //throw error
                        console.error("Unknown operator token: " + token);
                    }
                    break;
                case TokenType.FUNC: //string tokens (not quotations, but functions/vars/constants/etc)
                    if(charState != 3){
                        if(token.length > 0) {
                            //special marking for function ( tokens???

                            meta = testPushToken(token, tokenState);
                            if(meta >= 0){
                                tokens.push(token); //TOKEN PUSH
                                tokenMetas.push(meta); //meta
                                //console.log("pushed token: " + token + " meta: " + meta);
                            }else{
                                console.error("Unknown token type for: " + token);
                            }
                        }

                        tokenState = charState;
                        token = char;

                        continue;
                    }

                    //already string token:

                    if(isPrefixOfStringToken(token+char)){
                        token = token.concat(char);
                    }else if(typeOfStringToken(token+char) >= 0){
                        meta = testPushToken(token+char, 4);
                        if(meta >= 0){
                            tokens.push(token+char); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + (token+char));
                        }
                        
                        tokenState = 0;
                        token = "";
                    }else if(typeOfStringToken(token) >= 0){
                        meta = testPushToken(token, tokenState);
                        if(meta >= 0){
                            tokens.push(token); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + token);
                        }

                        tokenState = 0;
                        token = char;
                    }else{
                        //throw error
                        console.error("Unknown string token: " + token);
                    }
                    break;
                case TokenType.STRG:
                    //string
                    if(char == '"' /* a quotation mark like " */){
                        meta = testPushToken(token, 4);
                        if(meta >= 0){
                            tokens.push(token); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + token);
                        }
                        
                        tokenState = 0;
                    }else{
                        token = token.concat(char);
                    }

                    break;
                case TokenType.BRKT:
                    if(token.length > 0){
                        meta = testPushToken(token, tokenState);
                        if(meta >= 0){
                            tokens.push(token); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + token);
                        }
                    }

                    if(charState !== 0){
                        meta = testPushToken(char, charState);
                        if(meta >= 0){
                            tokens.push(char); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + char + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + char);
                        }
                    }

                    tokenState = 0;
                    token = "";

                    break;
                case TokenType.DELIM:
                    if(token.length > 0){
                        meta = testPushToken(token, tokenState);
                        if(meta >= 0){
                            tokens.push(token); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + token + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + token);
                        }
                    }

                    if(charState !== 0){
                        meta = testPushToken(char, charState);
                        if(meta >= 0){
                            tokens.push(char); //TOKEN PUSH
                            tokenMetas.push(meta); //meta
                            //console.log("pushed token: " + char + " meta: " + meta);
                        }else{
                            console.error("Unknown token type for: " + char);
                        }
                    }
                default: 
                    console.error("Unknown token state: " + tokenState);
                    break;
            }

        }

        if(token.length > 0){
            // Determine meta for last token
            let lastMeta = tokenState;
            if(lastMeta === 0) {
                // Try to infer type if tokenState is 0
                if(isNumber(token)) lastMeta = 1;
                else if(isOperator(token)) lastMeta = 2;
                else if(typeOfStringToken(token) >= 0) lastMeta = typeOfStringToken(token);
                else lastMeta = -1;
            }
            tokens.push(token);
            tokenMetas.push(lastMeta);
            //console.log("End token push: " + token + ", meta: " + lastMeta);
        }

        tokenState = 0;

        console.log(tokens);

        const fixed = insertImplicitOperations(tokens, tokenMetas);

        console.log(fixed[0]);
        console.log(fixed[1]);

        //specific token typesetting
        //expressions like y={x} or x={y}
        //evaluation of truth (direct evaluation) vs evaluation of closeness to intercept (f(x)=0)

        //implicit operations

        tokenizedExpressions.push(fixed[0]);
        tokenizedExpressionMetas.push(fixed[1]);

        return true;
    }

    function insertImplicitOperations(tokenList, metaList){
        var lastToken = "";
        var lastTokenType = 0;

        var tok = "";
        var tokType = 0;

        var final = [];
        var finalMeta = [];

        var argCountStack = [];
        var parenType = [];

        for(let i = 0; i < tokenList.length; i++){
            tok = tokenList[i];
            tokType = metaList[i];

            //ab     -> a*b
            //-a     -> '-u' a
            //(a)(b) -> (a)*(b)
            //a(b)   -> a*(b)
            //(a)b   -> (a)*b

            switch(tokType){
                case TokenType.BRKT:
                    //if left:
                        //lastToken is null or operator, push token as usual
                        //if lastToken is function
                            //if not round, error (invalid syntax)
                            //push to parenType, set my type to LFNC
                        //push token as usual with updates
                    //else if right:
                        //check if matching parenthesis is LFNC
                        //if not round, error (invalid syntax)
                        //pop from parenType, update function with argCount
                    

                    //left
                    let code = BracInfo[tok];
                    const matchingRight = {
                        [BracCode.LRND]: BracCode.RRND,
                        [BracCode.LSQR]: BracCode.RSQR,
                        [BracCode.LCUR]: BracCode.RSQR,
                        [BracCode.LFNC]: BracCode.RFNC
                    }

                    if(code == BracCode.LRND || code == BracCode.LSQR || code == BracCode.LCUR){
                        if(lastTokenType === TokenType.FUNC){
                            if(code !== BracCode.LRND){
                                console.error("Functions can only be used with round brackets");
                            }

                            code = BracCode.LFNC;
                        }

                        parenType.push(code);
                        final.push({type: TokenType.BRKT, value: code});
                    }else{
                        const leftType = parenType.pop();
                        const rightType = matchingRight[leftType];

                        if(rightType == BracCode.RFNC && code !== BracCode.RRND){
                            console.error("Mismatched function parenthesis");
                        }

                        final.push({type: TokenType.BRKT, value: rightType});
                    }
                    break;
                case TokenType.OP:
                    //operator
                    if(tok == "^"){
                        //functions like sin^2, cos^2, etc.
                        //insert special character (idk what to call them, diacritics?) to alter func behavior
                    }

                    if(tok == "-"){
                        if(lastToken == ""){
                            tok = "u-";
                        }else if(lastTokenType == TokenType.BRKT){
                            //or '[' or '{'
                            if(lastToken == "("){
                                tok = "u-";
                            }
                        }else if(lastTokenType == 2 || lastTokenType == 3){
                            tok = "u-";
                        }
                    }

                    console.log("Tok: " + tok + ", Code: " + OpInfo[tok]);

                    final.push({type: TokenType.OP, code: OpInfo[tok].code});
                    break;
                case TokenType.NUM:
                case TokenType.STRG:
                case TokenType.UNKN:
                case TokenType.CNST:
                case TokenType.VAR:
                default: 
                    //operands
                    if(
                        lastTokenType == 1 || 
                        lastTokenType == 4 || 
                        lastTokenType == 6 || 
                        lastTokenType == 7 || 
                        lastTokenType == 8 ||
                        lastTokenType >= 10
                    ){
                        final.push({type: TokenType.OP, code: OpInfo["*"].code});
                        finalMeta.push(2);
                    }

                    switch(tokType){
                        case TokenType.NUM:
                            final.push({type: TokenType.NUM, value: parseFloat(tok)});
                            break;
                        case TokenType.STRG:
                            final.push({type: TokenType.STRG, value: tok});
                            break;
                        case TokenType.UNKN:
                            //confusing naming scheme
                            final.push({type: TokenType.UNKN, code: UnknownInfo[tok]}); //like x, y, z, etc. 'Unknowns'
                            break;
                        case TokenType.CNST:
                            //
                            break;
                        case TokenType.VAR:

                        default:
                            //console.error
                            break;
                    }

                    break;
            }

            /*
            switch(tokType){
                
                case TokenType.OP:
                    final.push({type: TokenType.OP, code: OpInfo[tok].code});
                    break;
                case TokenType.FUNC:
                    //should include other properties like arity, associativity, and precedence :
                    final.push({type: TokenType.OP, code: FuncToken[tok]});
                    break;
                case TokenType.STRG:
                    final.push({type: TokenType.STRG, value: tok});
                    break;
                case TokenType.BRKT:
                    let brac = tok;

                    if(i > 0){
                        let prev = tokenList[i-1];

                        if(prev.type == TokenType.FUNC){
                            brac = tok + ".";
                        }
                    }

                    if(BracInfo[brac] == BracCode.LRND){
                        parenType.push(BracCode[brac]); 

                        final.push({type: TokenType.BRKT, value: BracInfo[brac]});
                    }else{
                        const leftParenType = parenType.pop();

                        final.push({type: TokenType.BRKT, value: leftParenType});
                    }
                    
                    break;
                case TokenType.UNKN:
                    //confusing naming scheme
                    final.push({type: TokenType.UNKN, code: UnknownInfo[tok]}); //like x, y, z, etc. 'Unknowns'
                    break;
                case 7:
                    //constants
                    break;
                case 8:
                    //variables
                    break;
                case 9:
                    //delimiters
                    break;
                case 10:
                    //reference types
                    break;
                default:
                    //??
                    break;
            }*/

            //final.push(tok);
            finalMeta.push(tokType);

            lastToken = tok;
            lastTokenType = tokType;
            //could potentially cause issues since if an operation inserts then the next token's kn of its previous token will be wrong
        }

        return [final, finalMeta];
    }

    export function tokenizeExpression(string){
        var tokens = []; //Array<string>
        var tokenMetas = []; //Array<number>

        let tokenState = 0; //number

        // 0/null  1/number  2/operator  3/function  4/string
        // 5/bracket  6/unknowns  7/constants  8/variables  9/delimiters
        // 10+/ reference-types  -1/invalid

        let token = ""; //string
        let char = ""; //string

        for (let index = 0; index < string.length; index++) {
            char = string.charAt(index);

            if(/\s/.test(char)){
                if(token.length > 0){
                    tokens.push(token);
                    tokenMetas.push(tokenState);

                    tokenState = 0;
                    token = "";
                }

                char = "";
                continue;
            }

            console.log(char + ", " + tokenState + " -> " + token);

            if(char == '"' /* a quotation mark like " */){
                if(tokenState == 4){
                    tokens.push(token);
                    tokenMetas.push(4); //meta
                    
                    tokenState = 0;
                    token = "";
                }else{
                    if(token.length > 0){
                        tokens.push(token);
                        tokenMetas.push(tokenState); //meta
                    }
                    tokenState = 4;
                    token = "";
                }

                continue;
            }

            if(tokenState == 4){
                token = token.concat(char);

                continue;
            }

            //if char is number or decimal point

            if(/[0-9.]/.test(char)){
                if(tokenState == 1 || tokenState == 0){
                    if(numRegex.test(token+char)){
                        token = token.concat(char);
                        tokenState = 1;
                    }else if(numRegex.test(token)){
                        tokens.push(token);
                        tokenMetas.push(1); //meta

                        tokenState = 1;
                        token = char;
                    }else{
                        //error
                        console.error("Unknown number token: " + token);
                    }

                    continue;
                }else{
                    tokens.push(token);
                    tokenMetas.push(tokenState); //meta

                    tokenState = 1;
                    token = char;
                }

                continue;
            }

            if(isOperator(char)){
                //console.log("Operator char detected: " + char);
                if(tokenState == 2 || tokenState == 0){
                    if(isPrefixOfElementIn(token+char,validOperators)){
                        token = token.concat(char);
                        tokenState = 2;
                    }else if(validOperators.includes(token + char)){
                        tokens.push(token+char);
                        tokenMetas.push(2); //meta
                        tokenState = 0;
                        token = "";
                    }else if(validOperators.includes(token)){
                        tokens.push(token);
                        tokenMetas.push(2); //meta

                        tokenState = 2;
                        token = char;
                    }else{
                        //error
                        console.error("Unknown operator token: " + token);
                    }
                }else{
                    tokens.push(token);
                    tokenMetas.push(tokenState); //meta

                    tokenState = 2;
                    token = char;
                }

                continue;
            }

            if(isBracket(char)){
                if(token.length > 0){
                    tokens.push(token);
                    tokenMetas.push(tokenState);

                    token = "";
                }
                
                tokens.push(char);
                tokenMetas.push(TokenType.BRKT); //meta

                tokenState = 0;
                continue;
            }

            if(char == ","){
                if(token.length > 0){
                    tokens.push(token);
                    tokenMetas.push(tokenState);

                    token = "";
                }

                tokens.push(",");
                tokenMetas.push(TokenType.DELIM);

                tokenState = 0;
                continue;
            }
            
            if(alphanumRegex.test(char)){
                if(tokenState == 3 || tokenState == 0){
                    if(isPrefixOfStringToken(token+char)){
                        token = token.concat(char);
                        tokenState = 0; //unknown yet which token type it is
                    }else if(typeOfStringToken(token+char) >= 0){
                        tokens.push(token+char);
                        //shouldn't have to do typeOfStringToken again
                        tokenMetas.push(typeOfStringToken(token+char)); //meta

                        tokenState = 0;
                        token = "";
                    }else if(typeOfStringToken(token) >= 0){
                        tokens.push(token);
                        tokenMetas.push(typeOfStringToken(token)); //meta

                        tokenState = 0;
                        token = char;
                    }else{
                        //error
                        console.error("Unknown string token: " + token);
                    }

                    continue;
                }else{
                    tokens.push(token);
                    tokenMetas.push(tokenState); //meta

                    tokenState = 0;
                    token = char;
                }

                continue;
            }

            //error
            console.error(char + " is not a valid character");
            return false;
        }

        if(token.length > 0){
            // Determine meta for last token
            let lastMeta = tokenState;
            if(lastMeta === 0) {
                // Try to infer type if tokenState is 0
                if(isNumber(token)) lastMeta = 1;
                else if(isOperator(token)) lastMeta = 2;
                else if(typeOfStringToken(token) >= 0) lastMeta = typeOfStringToken(token);
                else lastMeta = -1;
            }
            tokens.push(token);
            tokenMetas.push(lastMeta);
            console.log("End token push: " + token + ", meta: " + lastMeta);
        }

        tokenState = 0;

        //specific token typesetting
        //implicit operations
        //typecast data

        tokenizedExpressions.push(tokens);
        tokenizedExpressionMetas.push(tokenMetas);

        console.log(tokens);

        return true;
    } 

    //console.log("test");

    export function compileExpression(tokenList, metaList){

        let outputs = []; //Array<string>
        let operators = [];
        let meta = 0; //number

        let argCountStack = []; //managing function args

        //var index : number = 0;

        // 0/null  1/number  2/operator  3/function  4/string
        // 5/bracket  6/unknowns  7/constants  8/variables  9+/reference-Types
        // -1/invalid

        tokenList.forEach((value, index) => {
            meta = value.type;
            switch(meta){
                case TokenType.NUM:
                    outputs.push(value);

                    break;
                case TokenType.OP:
                    //get operator precedence
                    //pop operators off stack to output if higher/equal precedence

                    let opPrecedence = value.precedence;
                    //let opPrecedence = operatorPrecedences[validOperators.indexOf(value)];

                    while(operators.length > 0){
                        let topOp = operators[operators.length - 1];
                        //let topPrecedence = operatorPrecedences[validOperators.indexOf(topOp)];
                        let topPrecedence = OpInfo[topOp].precedence;

                        if(topPrecedence >= opPrecedence){
                            outputs.push(operators.pop());
                        }else{
                            break;
                        }
                    }

                    operators.push(value);

                    break;

                case TokenType.FUNC: //function
                    operators.push(value);
                    argCountStack.push(1);
                    break;
                case TokenType.STRG: //string
                    outputs.push(value);
                    break;
                case TokenType.BRKT: //bracket
                    if(
                        value.code == BracCode.LRND || 
                        value.code == BracCode.LSQR || 
                        value.code == BracCode.LCUR ||
                        value.code == BracCode.LFNC
                    ){
                        operators.push(value);
                    }else{
                        //pop operators to output until matching bracket found
                        const matchingBrackets = {
                            [BracCode.RRND]: BracCode.LRND,
                            [BracCode.RSQR]: BracCode.LSQR,
                            [BracCode.RCUR]: BracCode.LSQR,
                            [BracCode.RFNC]: BracCode.LFNC
                        }

                        const leftMatch = matchingBrackets[value.code];

                        while(operators.length > 0){
                            const topOp = operators.pop();

                            if(top.type == TokenType.BRKT && top.code == leftMatch){
                                if(leftMatch == BracCode.LFNC){
                                    let funcTok = operators.pop();
                                    funcTok.argCount = argCountStack.pop();
                                    outputs.push(funcTok);
                                }
                                break;
                            }

                            outputs.push(topOp);
                        }

                    }
                    break;
                case TokenType.UNKN: //unknowns
                    outputs.push(value); //value is replaced later with the unknowns
                    break;
                case TokenType.CNST: //constants
                    //find index of constant in validConstants, then get value from constantValues
                    let constIndex = validConstants.indexOf(value);
                    if(constIndex >= 0){
                        outputs.push(constantValues[constIndex].toString());
                    }else{
                        console.error("Constant not found in compiler: " + value);
                    }
                    break;
                case TokenType.VAR: //variables 
                    //NOT YET IMPLEMENTED
                    outputs.push(value); //value is replaced in real time
                    break;
                case TokenType.DELIM:
                    argCountStack[argCountStack.length - 1]++; //potential error if is first token
                case 9: //reference-Types
                    //NOT YET IMPLEMENTED
                    break;
                default:
                    console.error("Unimplemented token type in compiler: " + meta);
                    break;

            }

        });

        //pop remaining operators to output stack
        while(operators.length > 0){
            outputs.push(operators.pop());
        }

        compiledExpressions.push(outputs);

        console.log(outputs);

        return true;
    }

    //for (x,y) cartesian coordinates
    export function evaluateExpression(compiledExpression, pointQuad){
        var solve = []; //Array<number>

       

        compiledExpression.forEach((value, index) => {
            console.log(solve);

            switch(value.type){
                case TokenType.NUM:
                    solve.push(parseFloat(value.value));
                    break;
                case TokenType.OP:
                    //console.log(value);
                    let opcode = value.code;
                    let opArity = getArityOfOp(value.code);

                    let b = solve.pop();

                    if(opArity == 2){
                        let a = solve.pop();
                    }

                    let result = 0;

                    switch(opcode){
                        case OpCode.ADD: 
                            result = a+b; 
                            break;
                        case OpCode.SUB: 
                            result = a-b; 
                            break;
                        case OpCode.MUL: 
                            result = a*b; 
                            break;
                        case OpCode.DIV: 
                            result = a/b; 
                            break;
                        case OpCode.POW: 
                            result = Math.pow(a,b); 
                            break;
                        case OpCode.LT: 
                            result = (a<b); 
                            break;
                        case OpCode.LTE: 
                            result = (a<=b); 
                            break;
                        case OpCode.GT: 
                            result = (a>b); 
                            break;
                        case OpCode.GTE: 
                            result = (a>=b); 
                            break;
                        case OpCode.EQ: 
                            result = (a==b); 
                            break;
                        case OpCode.NEQ: 
                            result = (a!=b); 
                            break;
                        case OpCode.AND: 
                            result = (a&&b); 
                            break;
                        case OpCode.OR: 
                            result = (a||b); 
                            break;
                        case OpCode.XOR: 
                            result = (a||b) && !(a&&b); 
                            break;
                        case OpCode.NOT: 
                            result = !b; 
                            break;
                        case OpCode.FACT: 
                            result = gamma(b+1); 
                            break;
                        case OpCode.NEG: 
                            result = -b; 
                            break;
                        case OpCode.DPR: 
                            result = 0; 
                            break;//dot product from references
                        case OpCode.CRP: 
                            result = 0; 
                            break;//cross product from references
                        default: 
                            console.error("Unimplemented operator in evaluator: " + opcode);
                            break;
                    }

                    solve.push(result);
                    break;
                case TokenType.FUNC: 
                    if(value.staticArgs){
                        if(value.args != value.argCount){
                            console.error("Incorrect amount of arguments for function. Expected: " + value.args);
                        }
                    }

                    let args = [];

                    for(i = 0; i<value.argCount; i++){
                        args.push(solve.pop()); 
                    }

                    switch(value.code){
                        case FuncCode.SIN: result = Math.sin(args[0]);
                        case FuncCode.COS: result = Math.cos(args[0]);
                        case FuncCode.TAN: result = Math.tan(args[0]);
                        case FuncCode.SEC: result = Math.sec(args[0]);
                        case FuncCode.CSC: result = Math.csc(args[0]);
                        case FuncCode.COT: result = Math.cot(args[0]);
                        case FuncCode.ASIN: result = Math.asin(args[0]);
                        case FuncCode.ACOS: result = Math.acos(args[0]);
                        case FuncCode.ATAN: result = Math.atan(args[0]);
                        case FuncCode.ASEC: result = Math.asec(args[0]);
                        case FuncCode.ACSC: result = Math.acsc(args[0]);
                        case FuncCode.ACOT: result = Math.acot(args[0]);
                        case FuncCode.SINH: result = Math.sinh(args[0]);
                        case FuncCode.COSH: result = Math.cosh(args[0]);
                        case FuncCode.TANH: result = Math.tanh(args[0]);
                        case FuncCode.SECH: result = Math.sech(args[0]);
                        case FuncCode.CSCH: result = Math.csch(args[0]);
                        case FuncCode.COTH: result = Math.coth(args[0]);
                        case FuncCode.ASINH: result = Math.asinh(args[0]);
                        case FuncCode.ACOTH: result = Math.acosh(args[0]);
                        case FuncCode.ATANH: result = Math.atanh(args[0]);
                        case FuncCode.ASECH: result = Math.asech(args[0]);
                        case FuncCode.ACSCH: result = Math.acsch(args[0]);
                        case FuncCode.ACOTH: result = Math.acoth(args[0]);
                        //...
                    }
                    
                    solve.push(result);

                    break;
                case TokenType.STRG:
                    //
                    break;
                case TokenType.BRKT:
                    //
                    break;
                case TokenType.UNKN:
                    //
                    break;
                case TokenType.CNST:
                    //
                    break;
                case TokenType.VAR:
                    //
                    break;
                case TokenType.DELIM:
                    //
                    break;
                case TokenType.VEC:


            }

            
                //TODO
                //complex number operations
                //desire for exact values (expressions resulting in truths) vs differential values representing distance from f(x) = 0
                //vector/matrix operations
                //modular arithmetic
                //angle modes (degrees/radians)
                //statistical operations (population/sample)
                //numerical methods (integration/summation)
                //unit systems
                //variable types (integers/floats/bigints)
                //error handling (division by zero, invalid operations, etc)
                //...etc

                //these may require additional parameters to be passed into the evaluator function

        });

        if(solve.length == 1){
            console.log(solve[0]);
            return solve[0];
        }else{
            console.error("Error in evaluation, final stack length: " + solve.length);
            return NaN;
        }   
    }

    function gamma(n){
        //recursive gamma function implementation using Lanczos approximation and reflection formula
        const lancoszCoefficients = [
            676.5203681218851,
            -1259.1392167224028,
            771.3234287776536,
            -176.6150291498386,
            12.507343278686905,
            -0.1385710952657201,
            9.984369578019571e-6,
            1.505632735149311e-7
        ];

        if(n < 0.5){
            return Math.PI / (Math.sin(Math.PI * n) * gamma(1 - n));
        }else{
            n -= 1;
            let x = 0.9999999999998099;

            for(let i = 0; i < lancoszCoefficients.length; i++){
                x += lancoszCoefficients[i] / (n + i + 1);
            }

            let t = n + lancoszCoefficients.length - 0.5;
            return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;
        }

    }

    export function evaluateExpressionSimple(string){
        tokenizeExpression2(string);

        compileExpression(
            tokenizedExpressions.pop(),
            tokenizedExpressionMetas.pop()
        );

        return evaluateExpression(
            compiledExpressions.pop()
        );
    }

    export function getTokenizedExpressions(){
        return tokenizedExpressions;
    }

    export function getTokenizedExpressionMetas(){
        return tokenizedExpressionMetas;
    }   

    export function getCompiledExpressions(){
        return compiledExpressions;
    }

    export function getCompiledExpressionMetas(){
        return compiledExpressionMetas;
    }

    export function popExpression(){
        return tokenizedExpressions.pop();
    }
