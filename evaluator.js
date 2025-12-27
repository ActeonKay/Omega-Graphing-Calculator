const ExpressionType = {
    INVLD: -1,
    EVAL: 0, //for statements w/o vars, only need to be evaluated once
    IMPLICIT: 1, //f(x,y)=g(x,y) (should this include boolean expressions?)
    EXP_F_X: 2, //y=f(x)
    EXP_F_Y: 3, //x=f(y)
    EXP_F_T: 4, //r=f(theta) or polar
    EXP_F_R: 5, //theta=f(r)
    PRMTRC: 6,
    ASGNMT: 7,
}

const TokenType = {
    INVLD: -1, //invalid/error
    NUL: 0, //blank
    NUM: 1,
    OP: 2,
    FUNC: 3,
    STRG: 4,
    BRKT: 5,
    UNKN: 6, //unknowns like x,y,r,theta,etc
    CNST: 7, //constants that are evaluated during compilation step
    VAR: 8, //vars that may change and are evaluated during evaluation step
    DELIM: 9,
    QUAD: 10, //managing full quad at once
    CMPLX: 11,
    VEC2: 12,
    VEC3: 13,
    ALPHANUM: 14,
    ATT: 15,
    ARRAY: 16
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
    ATT: 20, //attributive operator
}

const OpAssoc = {
    LEFT: 0,
    RIGHT: 1
};

const OpInfo = {
    "+": { code: OpCode.ADD, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "-": { code: OpCode.SUB, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "*": { code: OpCode.MUL, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "/": { code: OpCode.DIV, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "^": { code: OpCode.POW, precedence: 3, associativity: OpAssoc.RIGHT, arity: 2 },
    "<": { code: OpCode.LT, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    "<=": { code: OpCode.LTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    ">": { code: OpCode.GT, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    ">=": { code: OpCode.GTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    "=": { code: OpCode.EQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2 },
    "==": { code: OpCode.EQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2 },
    "!=": { code: OpCode.NEQ, precedence: -1, associativity: OpAssoc.RIGHT, arity: 2 },
    "&&": { code: OpCode.AND, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "||": { code: OpCode.OR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "^^": { code: OpCode.XOR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "~": { code: OpCode.NOT, precedence: 5, associativity: OpAssoc.LEFT, arity: 1 },
    "!": { code: OpCode.FACT, precedence: 6, associativity: OpAssoc.RIGHT, arity: 1 },
    "u-": { code: OpCode.NEG, precedence: 5, associativity: OpAssoc.RIGHT, arity: 1 },
    "#": { code: OpCode.CRP, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "\\": {code: OpCode.ATT, precedence: 101, associativity: OpAssoc.LEFT, arity: 2}
}

const OpInfoByCode = {};
for (const sym in OpInfo) {
    const info = OpInfo[sym];
    OpInfoByCode[info.code] = {
        ...info,
        symbol: sym
    };
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
    MODE: 138,
    EXP: 139,
    LN: 140,
    LOG: 141,
    LOGN: 142,
    SQRT: 143,
    CBRT: 144,
    NTHRT: 145,
    GAMMA: 146,
    DGAMA: 147,
    PGAMA: 148,
    ZETA: 149,
    ATAN2: 150,
    REAL: 151,
    IMAG: 152,
    CONJ: 153,
    ABSCP: 154, //complex abs()
    ARG: 155, //complex argument = atan2(b,a)
    AMPL: 156, //amplitude or modulus of complex number
}

const FuncInfo = {
    "sin": { code: FuncCode.SIN, staticArgs: true, args: 1 },
    "cos": { code: FuncCode.COS, staticArgs: true, args: 1 },
    "tan": { code: FuncCode.TAN, staticArgs: true, args: 1 },
    "sec": { code: FuncCode.SEC, staticArgs: true, args: 1 },
    "csc": { code: FuncCode.CSC, staticArgs: true, args: 1 },
    "cot": { code: FuncCode.COT, staticArgs: true, args: 1 },
    "arcsin": { code: FuncCode.ASIN, staticArgs: true, args: 1 },
    "arccos": { code: FuncCode.ACOS, staticArgs: true, args: 1 },
    "arctan": { code: FuncCode.ATAN, staticArgs: true, args: 1 },
    "arcsec": { code: FuncCode.ASEC, staticArgs: true, args: 1 },
    "arccsc": { code: FuncCode.ACSC, staticArgs: true, args: 1 },
    "arccot": { code: FuncCode.ACOT, staticArgs: true, args: 1 },
    "sinh": { code: FuncCode.SINH, staticArgs: true, args: 1 },
    "cosh": { code: FuncCode.COSH, staticArgs: true, args: 1 },
    "tanh": { code: FuncCode.TANH, staticArgs: true, args: 1 },
    "sech": { code: FuncCode.SECH, staticArgs: true, args: 1 },
    "csch": { code: FuncCode.CSCH, staticArgs: true, args: 1 },
    "coth": { code: FuncCode.COTH, staticArgs: true, args: 1 },
    "arcsinh": { code: FuncCode.ASINH, staticArgs: true, args: 1 },
    "arccosh": { code: FuncCode.ACOSH, staticArgs: true, args: 1 },
    "arctanh": { code: FuncCode.ATANH, staticArgs: true, args: 1 },
    "arcsech": { code: FuncCode.ASECH, staticArgs: true, args: 1 },
    "arccsch": { code: FuncCode.ACSCH, staticArgs: true, args: 1 },
    "arccoth": { code: FuncCode.ACOTH, staticArgs: true, args: 1 },
    "gd": { code: FuncCode.GD, staticArgs: true, args: 1 },
    "lam": { code: FuncCode.LAM, staticArgs: true, args: 1 },
    "abs": { code: FuncCode.ABS, staticArgs: true, args: 1 },
    "sign": { code: FuncCode.SIGN, staticArgs: true, args: 1 },
    "floor": { code: FuncCode.FLOOR, staticArgs: true, args: 1 },
    "ceil": { code: FuncCode.CEIL, staticArgs: true, args: 1 },
    "round": { code: FuncCode.ROUND, staticArgs: true, args: 1 },
    "trunc": { code: FuncCode.TRUNC, staticArgs: true, args: 1 },
    "mod": { code: FuncCode.MOD, staticArgs: true, args: 2 },
    "min": { code: FuncCode.MIN, staticArgs: false, minArgs: 1 },
    "max": { code: FuncCode.MAX, staticArgs: false, minArgs: 1 },
    "avg": { code: FuncCode.AVG, staticArgs: false, minArgs: 1 },
    "med": { code: FuncCode.MED, staticArgs: false, minArgs: 1 },
    "mode": { code: FuncCode.MODE, staticArgs: false, minArgs: 1 },
    "exp": { code: FuncCode.EXP, staticArgs: true, args: 1 },
    "ln": { code: FuncCode.LN, staticArgs: true, args: 1 },
    "log": { code: FuncCode.LOG, staticArgs: true, args: 1 },
    "logn": { code: FuncCode.LOGN, staticArgs: true, args: 2 },
    "sqrt": { code: FuncCode.SQRT, staticArgs: true, args: 1 },
    "cbrt": { code: FuncCode.CBRT, staticArgs: true, args: 1 },
    "nthrt": { code: FuncCode.NTHRT, staticArgs: true, args: 2 },
    "gamma": { code: FuncCode.GAMMA, staticArgs: true, args: 1 },
    "dgama": { code: FuncCode.DGAMA, staticArgs: true, args: 1 },
    "pgama": { code: FuncCode.PGAMA, staticArgs: true, args: 1 },
    "zeta": { code: FuncCode.ZETA, staticArgs: true, args: 1 },
    "atan2": { code: FuncCode.ATAN2, staticArgs: true, args: 2 },
    "Re": { code: FuncCode.REAL, staticArgs: true, args: 1 },
    "Im": { code: FuncCode.IMAG, staticArgs: true, args: 1 },
    "Conj": { code: FuncCode.CONJ, staticArgs: true, args: 1 },
    "abscp": { code: FuncCode.ABSCP, staticArgs: true, args: 1 },
    "arg": { code: FuncCode.ARG, staticArgs: true, args: 1 },
    "ampl": { code: FuncCode.AMPL, staticArgs: true, args: 1 },
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
    I: 0,
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
    RAD_FRM: 21,
    TRUE: 22,
    FALSE: 23
}

const ConstantInfo = {
    "i": { code: ConstantCode.I, value: 1 },
    "pi": { code: ConstantCode.PI, value: 3.141592653589793 },
    "e": { code: ConstantCode.EUL_NUM, value: 2.718281828459045 },
    "eucon": { code: ConstantCode.EUL_CON, value: 0.577215664901532 },
    "egrav": { code: ConstantCode.GRV_ERT, value: 9.80665 },
    "sc": { code: ConstantCode.SOL_CON, value: 1360 },
    "grav": { code: ConstantCode.GRV_CON, value: 6.67430e-11 },
    "NA": { code: ConstantCode.AVO_NUM, value: 6.02214076e23 },
    "gascon": { code: ConstantCode.GAS_CON, value: 8.314462618 },
    "bmc": { code: ConstantCode.BZM_CON, value: 1.380649e-23 },
    "sbc": { code: ConstantCode.SBM_CON, value: 5.670374419e-8 },
    "culuk": { code: ConstantCode.CUL_CON, value: 8.99e9 },
    "epzo": { code: ConstantCode.EPS_ZRO, value: 8.854187817e-12 },
    "muzo": { code: ConstantCode.MU_ZRO, value: 1.25663706144e-6 },
    "speli": { code: ConstantCode.SP_LGHT, value: 299792458 },
    "plcon": { code: ConstantCode.PLK_CON, value: 6.63e-34 },
    "elcharge": { code: ConstantCode.Q_ELEM, value: 1.602176634e-19 },
    "elmas": { code: ConstantCode.M_ELEC, value: 9.1093837015e-31 },
    "prmas": { code: ConstantCode.M_PROT, value: 1.67262192369e-27 },
    "numas": { code: ConstantCode.M_NEUT, value: 1.67492749804e-27 },
    "uam": { code: ConstantCode.UM_ATOM, value: 1.66053906660e-27 },
    "radfer": { code: ConstantCode.RAD_FRM, value: 1.20e-15 },
    "true": { code: ConstantCode.TRUE, value: true },
    "false": { code: ConstantCode.FALSE, value: false },
}

const ConstInfoByCode = {};
for (const sym in ConstantInfo) {
    const info = ConstantInfo[sym];
    ConstInfoByCode[info.code] = {
        ...info,
        symbol: sym
    };
}

const AttributiveCode = {
    BASE: 1,
    POWER: 2,
    LOW_BOUND: 3,
    UPP_BOUND: 4,
}

const FunctionAttributiveInfo = {
    "_": {code: AttributiveCode.BASE},
    "^": {code: AttributiveCode.POWER}
}

const validOperators = ["+", "-", "*", "/", "^", "<", "<=", ">", ">=", "=", "!=", "&&", "||", "!", "u-", "#", "_"];

const validFunctions = [
    "sin", "cos", "tan",
    "arcsin", "arccos", "arctan",
    "csc", "sec", "cot",
    "arccsc", "arcsec", "arccot",
    "sinh", "cosh", "tanh",
    "arcsinh", "arccosh", "arctanh",
    "csch", "sech", "coth",
    "arccsch", "arcsech", "arccoth",
    "gd", "lam", "abs", "sign", "mod",
    "floor", "ceil", "round", "trunc",
    "min", "max", "avg", "median",
    "exp", "ln", "log", "logn",
    "sqrt", "cbrt", "nthrt",
    "sinc", "gamma", "zeta", "digamma", "polygamma",
    "Ei", "Ti", "Li", "erf",
    "fresnelS", "fresnelC", "Si", "Ci",
    "dawsonP", "dawsonM", "Ai",
    "sum", "integral",
    "not", "or", "and", "xor", "bool"
];

const validConstants = [
    "true", "false",
    "pi", "eunum", "eucon",
    "egrav", "sc",
    "grav", "NA", "gascon",
    "bmc", "sbc", "culuk", "epzo", "muzo", "speli", "plcon",
    "elcharge", "elmas", "prmas", "numas", "uam",
    "radfer"
];

const numRegex = /^[0-9]*\.?[0-9]+$/;
const alphanumRegex = /^[a-zA-Z0-9]+$/;
const operatorRegex = /^[+\-*\/^%!=<>&|#_]$/;
const bracketRegex = /^[\(\)\[\]]{1}$/;

//expression = {
// type: number, 
// replace: Array<{index: number, replacewith: id}>, 
// tokens: Array<{type: number, value/code: number}>
//}

var tokenizedExpressions = []; //Array<Array<string>>
var tokenizedExpressionMetas = []; //Array<Array<number>>

var compiledExpressions = []; //Array<Array<any>>

//var expression : [number, Array<string>]; //[type, tokens]

function isNumber(string) {
    return !isNaN(parseFloat(string));
}

function isOperator(string) {
    return operatorRegex.test(string);
}

function getPrecedenceOfOp(opcode) {
    //return operatorPrecedences[opcode-1]; //hack
}

function getAssociativityOf(opcode) {
    //return operatorAssociativities[opcode-1]; //hack
}

function getArityOfOp(opCode) {
    if (opCode == OpCode.FACT || opCode == OpCode.NEG) return 1;
    //if(op == "!" || op == "u-") return 1;
    return 2;
}

function isBracket(string) {
    return bracketRegex.test(string);
}

function isPrefixOfElementIn(s, elements) {
    return elements.some(fn => fn.startsWith(s) && fn.length > s.length);
}

function isPrefixOfStringToken(string) {
    if (string.length == 0) return true;

    //user-made constants
    //default functions
    if (isPrefixOfElementIn(string, validFunctions)) {
        return true;
    }
    if (isPrefixOfElementIn(string, validConstants)) {
        return true;
    }
    //user-made functions
    //default variables
    //user-made variables

    return false;
}

function typeOfStringToken(string) {
    if (FuncInfo[string] != undefined) return TokenType.FUNC;
    if (UnknownInfo[string] != undefined) return TokenType.UNKN;
    if (ConstantInfo[string] != undefined) return TokenType.CNST;
    //var

    console.log("unknown string tested: ", string);
    return -1; //unknown
}

function testPushToken(token, tokenState) {
    if (token.length <= 0) {
        return TokenType.INVLD; //failure
    }

    if (tokenState == 0) {
        return TokenType.INVLD; //null
    }

    if (tokenState == TokenType.ALPHANUM) {
        let type = typeOfStringToken(token);
        if (type >= 0) {
            return type; //success
        } else {
            return TokenType.INVLD; //failure
        }
    }

    return tokenState; //success
}

export function tokenizeExpression(string) {
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

        if (/^[0-9.]$/.test(char)) charState = TokenType.NUM;
        else if (isOperator(char)) charState = TokenType.OP;
        else if (alphanumRegex.test(char)) charState = TokenType.ALPHANUM;
        else if (char == "\"") charState = TokenType.STRG;
        else if (isBracket(char)) charState = TokenType.BRKT;
        else if (char == ",") charState = TokenType.DELIM
        else if (/\s/.test(char)) charState = TokenType.NUL;
        else charState = TokenType.INVLD;

        //string

        if (charState == TokenType.BRKT || charState == TokenType.DELIM) {
            //no building needed
            meta = testPushToken(token, tokenState);
            if (meta >= 0) {
                tokens.push(token);
                tokenMetas.push(meta);
            } else {
                //error, but doesn't create problems in result. ???
                //console.error("Unknown token: " + token + " before: " + char + ", " + index);
            }

            tokens.push(char);
            tokenMetas.push(charState);

            token = "";
            tokenState = 0;

            continue;
        }

        switch (tokenState) {
            case TokenType.NUL:
                if (token !== "\"") {
                    token = char;
                } else {
                    token = ""; //quotes aren't included in strings
                }

                tokenState = charState;
                break;
            case TokenType.NUM: //numbers
                if (charState != TokenType.NUM) {
                    if (token.includes(".")) {
                        //something like "2.7" + "."
                        console.error("Unknown number token: " + token);
                    }


                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = charState;
                    token = char;

                    continue;
                }

                //already number token:

                if (numRegex.test(token + char) || (token.indexOf(".") == -1 && char == ".")) {
                    token = token.concat(char);
                } else {
                    //something like "2.2.1", an invalid number
                    console.error("Unknown number token: " + token);
                }
                break;
            case TokenType.OP: //operators
                if (charState != TokenType.OP) {

                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = charState;
                    token = char;

                    continue;
                }

                //already operator token:

                if (isPrefixOfElementIn(token + char, validOperators)) {
                    token = token.concat(char);
                } else if (validOperators.includes(token + char)) {
                    meta = testPushToken(token + char, tokenState);
                    if (meta >= 0) {
                        tokens.push(token + char); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + (token + char));
                    }

                    tokenState = 0;
                    token = "";
                } else if (validOperators.includes(token)) {
                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = TokenType.OP;
                    token = char;
                } else {
                    //throw error
                    console.error("Unknown operator token: " + token);
                }
                break;
            case TokenType.ALPHANUM: //string tokens (not quotations, but functions/vars/constants/etc)
                if (charState != TokenType.ALPHANUM) {
                    //special marking for function ( tokens???

                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = charState;
                    token = char;

                    continue;
                }

                //already string token:

                if (isPrefixOfStringToken(token + char)) {
                    token = token.concat(char);
                } else if (typeOfStringToken(token + char) >= 0) {
                    meta = testPushToken(token + char, tokenState);
                    if (meta >= 0) {
                        tokens.push(token + char); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + (token + char));
                    }

                    tokenState = 0;
                    token = "";
                } else if (typeOfStringToken(token) >= 0) {
                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = 0;
                    token = char;
                } else {
                    //throw error
                    console.error("Unknown string token: " + token);
                }
                break;
            case TokenType.STRG:
                if (char == '"' /* a quotation mark like " */) {
                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }

                    tokenState = 0;
                } else {
                    token = token.concat(char);
                }

                break;
            case TokenType.BRKT:
                console.error("Code tokenized incorrectly. Token: " + token);
                meta = testPushToken(token, tokenState);
                if (meta >= 0) {
                    tokens.push(token); //TOKEN PUSH
                    tokenMetas.push(meta); //meta
                    //console.log("pushed token: " + token + " meta: " + meta);
                } else {
                    console.error("Unknown token type for: " + token);
                }

                if (charState !== 0) {
                    meta = testPushToken(char, charState);
                    if (meta >= 0) {
                        tokens.push(char); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + char + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + char);
                    }
                }

                tokenState = 0;
                token = "";

                break;
            case TokenType.DELIM:
                if (token.length > 0) {
                    meta = testPushToken(token, tokenState);
                    if (meta >= 0) {
                        tokens.push(token); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + token + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + token);
                    }
                }

                if (charState !== 0) {
                    meta = testPushToken(char, charState);
                    if (meta >= 0) {
                        tokens.push(char); //TOKEN PUSH
                        tokenMetas.push(meta); //meta
                        //console.log("pushed token: " + char + " meta: " + meta);
                    } else {
                        console.error("Unknown token type for: " + char);
                    }
                }
            default:
                console.error("Unknown token state: " + tokenState);
                break;
        }

    }

    if (token.length > 0) {
        // Determine meta for last token
        let lastMeta = TokenType.NUL; //used to be: let lastMeta = tokenState
        if (lastMeta === TokenType.NUL) {
            // Try to infer type if tokenState is 0
            if (isNumber(token)) lastMeta = TokenType.NUM;
            else if (isOperator(token)) lastMeta = TokenType.OP;
            else lastMeta = typeOfStringToken(token);
        }
        tokens.push(token);
        tokenMetas.push(lastMeta);
        //console.log("End token push: " + token + ", meta: " + lastMeta);
    }

    tokenState = 0;

    console.log("Raw tokens: ", tokens);
    console.log("Raw tokenmeta: ", tokenMetas);

    const fixed = insertImplicitOperations(tokens, tokenMetas);

    console.log("Fixed tokens: ", fixed);

    if (tokens[1].type == TokenType.OP && tokens[1].code == OpCode.EQ) {
        //check if equation is in form y=f(x), x=f(y), r=f(theta), or theta=f(r) 
        //used for equation typesetting
    }

    //evaluation of truth (direct evaluation) vs evaluation of closeness to intercept (f(x)=0)

    tokenizedExpressions.push({ type: ExpressionType.IMPLICIT, tokens: fixed[0] });
    tokenizedExpressionMetas.push(fixed[1]);

    return true;
}

function insertImplicitOperations(tokenList, metaList) {
    var lastToken = "";
    var lastTokenType = 0;

    var tok = "";
    var tokType = 0;

    var final = [];
    var finalMeta = [];

    //var argCountStack = [];
    var parenType = [];

    for (let i = 0; i < tokenList.length; i++) {
        tok = tokenList[i];
        tokType = metaList[i];

        //ab     -> a*b
        //-a     -> '-u' a
        //(a)(b) -> (a)*(b)
        //a(b)   -> a*(b)
        //(a)b   -> (a)*b

        switch (tokType) {
            case TokenType.BRKT:
                //if left:
                //lastToken is null or operator, push token as usual
                //if lastToken is function
                //if not round, error (invalid syntax)
                //push to parenType, set my type to LFNC
                //if lastToken is number, const, var, etc
                //insert implicit multiplication
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

                if (code == BracCode.LRND || code == BracCode.LSQR || code == BracCode.LCUR) {
                    if (lastTokenType === TokenType.FUNC) {
                        if (code !== BracCode.LRND) {
                            console.error("Functions can only be used with round brackets");
                        }

                        code = BracCode.LFNC;
                    } else if (
                        lastTokenType === TokenType.NUM ||
                        lastTokenType === TokenType.UNKN ||
                        lastTokenType === TokenType.CNST ||
                        lastTokenType === TokenType.VAR
                    ) {
                        final.push({ type: TokenType.OP, code: OpInfo["*"].code })
                    }

                    parenType.push(code);
                    final.push({ type: TokenType.BRKT, code: code });
                } else {
                    const leftType = parenType.pop();
                    const rightType = matchingRight[leftType];

                    if (rightType == BracCode.RFNC && code !== BracCode.RRND) {
                        console.error("Mismatched function parenthesis");
                    }

                    final.push({ type: TokenType.BRKT, code: rightType });
                }
                break;
            case TokenType.OP:
                if(lastTokenType == TokenType.FUNC){
                    //TODO: implement attributives as part of expression evaluation log_b(n) -> log(n,b)
                    if(FunctionAttributiveInfo[tok] != undefined){
                        final.push({ type: TokenType.ATT, code: FunctionAttributiveInfo[tok].code});
                        break;
                    }

                    //console.error
                }

                //TODO: attributives for large operators

                if (tok == "-") {
                    if (lastToken == "") {
                        tok = "u-";
                    } else if (lastTokenType == TokenType.BRKT) {
                        //or '[' or '{'
                        if (lastToken == "(") {
                            tok = "u-";
                        }
                    } else if (lastTokenType == TokenType.OP || lastTokenType == TokenType.FUNC) {
                        tok = "u-";
                    }
                }

                //console.log("Tok: " + tok + ", Code: " + OpInfo[tok]);

                final.push({ type: TokenType.OP, code: OpInfo[tok].code });
                break;
            case TokenType.FUNC:
                final.push({ type: TokenType.FUNC, code: FuncInfo[tok].code, attributes: {} })
                break;
            case TokenType.DELIM:
                final.push({ type: TokenType.DELIM })
                break;
            case TokenType.NUM:
            case TokenType.STRG:
            case TokenType.UNKN:
            case TokenType.CNST:
            case TokenType.VAR:
            default:
                //operands
                if (
                    lastTokenType == TokenType.NUM ||
                    lastTokenType == TokenType.STRG ||
                    lastTokenType == TokenType.UNKN ||
                    lastTokenType == TokenType.CNST ||
                    lastTokenType == TokenType.VAR ||
                    lastTokenType >= 10
                ) {
                    final.push({ type: TokenType.OP, code: OpInfo["*"].code });
                    finalMeta.push(TokenType.OP);
                }

                var value = 0;
                switch(tokType) {
                    case TokenType.NUM: value = parseFloat(tok); break;
                    case TokenType.STRG: value = tok; break;
                    case TokenType.UNKN: value = UnknownInfo[tok]; break;
                    case TokenType.CNST: value = ConstantInfo[tok].value; break;
                    case TokenType.VAR: value = 0; break;
                    //default??
                }

                if(finalMeta[finalMeta.length - 1] == TokenType.ATT){
                    //last token is attributive
                    //if the above is true, then the token before that is either a function or large operator

                    const attributive = final.pop(); //pop attributive


                    var old = final.pop();
                    old.attributes[attributive.code] = value;
                }

                final.push({ type: tokType, value: value});

                /*
                switch (tokType) {
                    case TokenType.NUM:
                        

                        
                        final.push({ type: TokenType.NUM, value: parseFloat(tok) });
                        break;
                    case TokenType.STRG:
                        final.push({ type: TokenType.STRG, value: tok });
                        break;
                    case TokenType.UNKN:
                        //confusing naming scheme
                        final.push({ type: TokenType.UNKN, code: UnknownInfo[tok] }); //like x, y, z, etc. 'Unknowns'
                        break;
                    case TokenType.CNST:
                        final.push({ type: TokenType.CNST, value: ConstantInfo[tok].value });
                        break;
                    case TokenType.VAR:
                        //
                        break;
                    default:
                        //console.error
                        break;
                }*/

                break;
        }

        //final.push(tok);
        finalMeta.push(tokType);

        lastToken = tok;
        lastTokenType = tokType;
        //could potentially cause issues since if an operation inserts then the next token's kn of its previous token will be wrong
    }

    return [final, finalMeta];
}

//console.log("test");

export function compileExpression(expression) {

    const type = expression.type ?? ExpressionType.IMPLICIT;

    const tokenList = expression.tokens;
    if (tokenList == undefined) {
        console.error("Invalid expression given. No tokens attribute");
    }

    let outputs = []; //Array<string>
    let operators = [];
    let meta = 0; //number

    let argCountStack = []; //managing function args

    tokenList.forEach((value, index) => {
        meta = value.type;
        switch (meta) {
            case TokenType.NUM:
            case TokenType.CMPLX:
                outputs.push(value);

                break;
            case TokenType.OP:
                //console.log("value: ",value);

                //console.log("value.code = ", OpInfoByCode[value.code]);

                const opPrecedence = OpInfoByCode[value.code].precedence;
                const opAssociativity = OpInfoByCode[value.code].associativity; // 'L' or 'R'

                //console.log("id: ", value.code, "precedence: ", opPrecedence, "assoc: ", opAssociativity);

                while (operators.length > 0) {
                    const topOp = operators[operators.length - 1];

                    // Stop if top of stack is not an operator (e.g., left paren)
                    if (topOp.type != TokenType.OP) {
                        console.log("broken. Value:", value, "topOp:", topOp);
                        break;
                    }

                    const topPrecedence = OpInfoByCode[topOp.code].precedence;
                    //console.log("id: ", topOp.code, "precedence: ", topPrecedence);


                    // Left-associative: pop if topPrecedence >= current
                    // Right-associative: pop if topPrecedence > current
                    if (
                        (opAssociativity === OpAssoc.LEFT && topPrecedence >= opPrecedence) ||
                        (opAssociativity === OpAssoc.RIGHT && topPrecedence > opPrecedence)
                    ) {
                        outputs.push(operators.pop());
                    } else {
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
                if (
                    value.code == BracCode.LRND ||
                    value.code == BracCode.LSQR ||
                    value.code == BracCode.LCUR ||
                    value.code == BracCode.LFNC
                ) {
                    operators.push(value);
                    break;
                } else {
                    //pop operators to output until matching bracket found
                    const matchingBrackets = {
                        [BracCode.RRND]: BracCode.LRND,
                        [BracCode.RSQR]: BracCode.LSQR,
                        [BracCode.RCUR]: BracCode.LCUR,
                        [BracCode.RFNC]: BracCode.LFNC
                    }

                    const expectedLeft = matchingBrackets[value.code];
                    if (expectedLeft == undefined) {
                        console.error("Unknown bracket code", value);
                        break;
                    }

                    while (operators.length > 0) {
                        const topOp = operators.pop();

                        if (topOp.type == TokenType.BRKT && topOp.code == expectedLeft) {
                            if (expectedLeft == BracCode.LFNC) {
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
                //append to list of unknowns that need to be replaced
                break;
            case TokenType.CNST: //constants
                //value: value.value --> value: token.value
                if (value.code == ConstantCode.I) {
                    //only complex constant
                    outputs.push({ type: TokenType.CMPLX, a: 0, b: 1 });
                }else{
                    outputs.push({ type: TokenType.NUM, value: value.value });
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
            case TokenType.ATT:
                break;
            default:
                console.error("Unimplemented token type in compiler: " + meta);
                break;

        }


        //console.log("outputs"+outputs);
        //console.log("operators"+operators);
    });

    //pop remaining operators to output stack
    while (operators.length > 0) {
        outputs.push(operators.pop());
    }

    let toReplace = [];

    //final check for unknowns
    for (let i = 0; i < outputs.length; i++) {
        let element = outputs[i];
        if (element.type == TokenType.UNKN) {
            toReplace.push({ index: i, type: TokenType.UNKN, unknownId: element.value });
        } else if (element.type == TokenType.VAR) {
            toReplace.push({ index: i, type: TokenType.VAR, varId: 0 });
        }
    }

    compiledExpressions.push({ type: type, replace: toReplace, tokens: outputs });

    //console.log(outputs);

    return true;
}

//for (x,y) cartesian coordinates
export function evaluateExpression(compiledExpression, pointQuad, options) {
    //let expressionType = compiledExpression.type;
    let tokenList = readExpressionWithReplacements(compiledExpression, pointQuad);

    //console.log("tokenlist", tokenList);

    var solve = []; //Array<number>

    //true: solve for difference (f(x)=0)  false: solve exact
    const evaluateDiff = options.evaluateDiff ?? true;

    tokenList.forEach((value, index) => {
        //console.log(solve);

        //console.log(solve.toString());

        switch (value.type) {
            case TokenType.NUM:
            //case TokenType.STRG:
            case TokenType.QUAD:
            //case TokenType.CNST: //should already be converted to number
                solve.push(value);
                break;
            case TokenType.VAR:
                console.error("var passed, not supported yet");
                //get value
                //push value as number
                break;
            case TokenType.OP:

                /*
                //if arity = 1
                //pop arg
                //unary ops on arg type
                //if arity = 2
                //pop arg 1, arg 2,
                //put real num as arg 1 if an arg is real
                //put complex num as arg 1 if an arg is complex
                //else error
                //perform ops based on type
                */

                //console.log("token of id: " + value);
                let opcode = value.code;
                let opArity = OpInfoByCode[value.code].arity;

                if (opArity == 1) {
                    let arg = solve.pop();

                    //TokenType.UNKN not supported, should be quad

                    if (arg.type == TokenType.NUM) {
                        solve.push({ type: TokenType.NUM, value: unaryOp(arg, opcode), edges: arg.edges})
                    } else if (arg.type == TokenType.QUAD) {
                        solve.push(executeUnaryOpOnQuad(opcode, arg, arg.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}));
                    } else if (arg.type == TokenType.CMPLX) {
                        if (opcode == OpCode.NOT || opcode == OpCode.NEG) solve.push({ type: TokenType.CMPLX, a: -arg.a, b: -arg.b });
                        else if (opcode == OpCode.FACT) solve.push({ type: TokenType.CMPLX, a: 1, b: 1 });
                        else solve.push({ type: TokenType.CMPLX, a: 1, b: 1 });
                    } else {
                        console.error("Unary op performed on invalid argument type. Arg:", arg);
                    }

                    break;
                }

                //assuming opArity == 2:

                //let a = null; //should cause error if used wrong
                var b = solve.pop();
                var a = solve.pop();

                //console.log("a:", a, "b:", b);
                var result = 0;

                if (a.type == TokenType.QUAD || b.type == TokenType.QUAD) {
                    const edges_a = a.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]};
                    const edges_b = b.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]};

                    result = executeBinaryOpOnQuad(opcode, a, b, edges_a, edges_b);
                }else{
                    result = binaryOp(opcode,a,b);
                }

                //console.log("result: ", result, "(opcode"+opcode+")");

                solve.push(result);
                
                break;
            case TokenType.FUNC:
                if (value.staticArgs) {
                    if (value.args != value.argCount) {
                        console.error("Incorrect amount of arguments for function. Expected: " + value.args);
                    }
                }

                let args = [];
                for (let i = 0; i < value.argCount; i++) {
                    args.push(solve.pop());
                }

                //TODO: replace with equation type detection 
                const needQuad = args.some((tok) => tok.type == TokenType.QUAD);

                //console.log(args);
                //console.log(needQuad);

                var result = 0;

                if (needQuad) {
                    //console.log("executeFuncOnQuad(",value.code, args, value.attributes);
                    result = executeFuncOnQuad(value.code, args, value.attributes, value.edges);

                    /*
                    //convert non-quad types into quad types
                    var newArgs = [];

                    args.forEach((arg) => {
                        newArgs.push( (arg.type == TokenType.QUAD) ? arg.value : Array(4).fill(arg.value) );
                    });

                    //return new token by doing func() on each arg quad  
                    result = { 
                        type: TokenType.QUAD, 
                        value: [0, 1, 2, 3].map((index) => func(
                            value.code, newArgs.map((arg) => arg[index]), value.attributes
                        )) 
                    };*/
                    //console.log("result1"+result, args);
                }else{
                    //result = func(value.code, args, value.attributes);
                    //console.log("result2"+result, args);
                }

                solve.push(result);

                //console.log("after func", solve.toString(), solve.length);

                break;
            case TokenType.BRKT: //shouldn't be here?
                console.error("bracket passed, not supported yet");
                //
                break;

            case TokenType.DELIM:
                console.error("delimeter passed, not supported yet");
                //should never 
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

    if (solve.length == 1) {
        //console.log(solve[0]);
        return solve[0];
    } else {
        console.error("Error in evaluation, final stack length: " + solve.length);
        return NaN;
    }
}

export function readExpressionWithReplacements(compiledExpression, pointQuad) {
    let toReplace = compiledExpression.replace;
    let tokenList = compiledExpression.tokens.slice(); //duplicate array
    let action = 0;

    for (let i = 0; i < toReplace.length; i++) {
        action = toReplace[i];

        if (action.type == TokenType.UNKN) {
            //FIX REPEATED CODE
            switch (action.unknownId) {
                case UnknownCode.CARTX:
                    //doesn't keep track of associated y values
                    //associated ys may be useful for multivariate functions

                    //how should i keep track of crosses? 
                    //crosses = ((pointQuad.minX > 0) == (pointQuad.maxX > 0)) ? 0 : 1;

                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTX,
                        value: [
                            pointQuad.minX, pointQuad.maxX,
                            pointQuad.minX, pointQuad.maxX
                        ],
                        edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
                    });
                    break;
                case UnknownCode.CARTY:
                    //same comment as for CARTX
                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTY,
                        value: [
                            pointQuad.maxY, pointQuad.maxY,
                            pointQuad.minY, pointQuad.minY
                        ],
                        edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
                    });
                    break;
                case UnknownCode.CARTZ:
                    //only for 3d
                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTZ,
                        value: Array(4).fill(0)
                    });
                    break;
                case UnknownCode.POLRR:
                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTY,
                        value: [
                            Math.atan2(pointQuad.maxY, pointQuad.minX), Math.atan2(pointQuad.maxY, pointQuad.maxX),
                            Math.atan2(pointQuad.minY, pointQuad.minX), Math.atan2(pointQuad.minY, pointQuad.maxX)
                        ],
                        edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
                    });
                    break;
                case UnknownCode.POLRT:
                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTY,
                        value: [
                            Math.hypot(pointQuad.maxY, pointQuad.minX), Math.hypot(pointQuad.maxY, pointQuad.maxX),
                            Math.hypot(pointQuad.minY, pointQuad.minX), Math.hypot(pointQuad.minY, pointQuad.maxX)
                        ],
                        edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
                    });
                    break;
                case UnknownCode.POLRP:
                    //only for 3d
                    tokenList.splice(action.index, 1, {
                        type: TokenType.QUAD, code: UnknownCode.CARTZ,
                        value: Array(4).fill(0),
                        edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
                    });
                    break;
                default:
                    console.error("Unknown replacement action");
            }
        }
        //TODO: replacement for VARs 
    }

    return tokenList;
}

function executeUnaryOpOnQuad(opcode, arg, arg_edges){
    //arg = TokenType.QUAD
    //console.log("arg_edge", arg_edges);

    var arg_quad = (arg.type == TokenType.QUAD) ? arg.value : Array(4).fill(arg.value);

    //console.log(arg_quad);

    //new values by doing unaryop() on each arg quad
    const value = [0,1,2,3].map((index) => unaryOp(
        arg_quad[index], opcode
    ));

    //console.log("value",value);

    //edge handling
    //shoulc update 'edges' object
    const edges = handleEdgesForUnaryOp(opcode, arg_quad, arg_edges);

    //console.log(edges);

    return { 
        type: TokenType.QUAD, 
        value: value,
        edges: edges
    };
}

function handleEdgesForUnaryOp(opcode, arg_quad, arg_edges){
    const top = handleEdgePairForUnaryOp(opcode, arg_quad[0], arg_quad[1]);
    const lft = handleEdgePairForUnaryOp(opcode, arg_quad[0], arg_quad[2]);
    const rgt = handleEdgePairForUnaryOp(opcode, arg_quad[1], arg_quad[3]);
    const btm = handleEdgePairForUnaryOp(opcode, arg_quad[2], arg_quad[3]);

    //console.log("top", top, "edges", arg_edges);

    const edges = {
        top: [
            top[0] + arg_edges.top[0],
            top[1] + arg_edges.top[1],
            top[2] + arg_edges.top[2]
        ],
        lft: [
            lft[0] + arg_edges.lft[0],
            lft[1] + arg_edges.lft[1],
            lft[2] + arg_edges.lft[2]
        ],
        rgt: [
            rgt[0] + arg_edges.top[0],
            rgt[1] + arg_edges.top[1],
            rgt[2] + arg_edges.top[2]
        ],
        btm: [
            btm[0] + arg_edges.btm[0],
            btm[1] + arg_edges.btm[1],
            btm[2] + arg_edges.btm[2]
        ]
    };

    return edges;
}

function handleEdgePairForUnaryOp(opcode, arg1, arg2){
    var crosses = 0;
    var holes = 0;
    var jumps = 0;
    var undefined = false;

    var n;

    switch(opcode){
        case OpCode.NOT:
        case OpCode.NEG:
            crosses += ((arg1>0) != (arg2>0)) ? 1 : 0;
            //holes += arg1.holes + arg2.holes;
            //jumps = arg1.jumps + arg2.jumps;
            break;
        case OpCode.FACT:

            n = Math.abs(
                Math.floor(arg1)-Math.floor(arg2)
            )-(
                Math.floor(Math.max(-1,arg1,arg2)+1)
                -Math.floor(Math.max(-1,Math.min(arg1,arg2))+1)
            );
            crosses += n;
            holes += n;
            jumps += n;
            break;
    }

    if(!undefined) undefined = (holes > 0);
    return [crosses, holes, jumps, undefined];
}

function unaryOp(arg, opcode) {
    //console.log(arg,opcode,"=>");
    if(typeof arg == "number"){
        switch (opcode) {
            case OpCode.NOT: return !arg;
            case OpCode.FACT: 
                const r = func_gamma(arg + 1);
                //console.log(r);
                return r;
            case OpCode.NEG: return -arg;
            default: 
                break;
        }

        console.error("Unknown operator passed: ", opcode);
        return 0;
    }

    console.error("Unknown argument passed: ", arg);
    return 0;
}

//evaluate binary operation: a ? b
function executeBinaryOpOnQuad(opcode, arg1, arg2, edges_a, edges_b){

    var a_quad = (arg1.type == TokenType.QUAD) ? arg1.value : Array(4).fill(arg1.value);
    var b_quad = (arg2.type == TokenType.QUAD) ? arg2.value : Array(4).fill(arg2.value);

    //new values by doing binaryop() on each arg quad
    const value = [0, 1, 2, 3].map((index) => binaryOp(
        opcode, 
        a_quad[index], 
        b_quad[index]
    ));

    //edge handling
    //shoulc update 'edges' object
    const edges = handleEdgesForBinaryOp(opcode, a_quad, b_quad, edges_a, edges_b);

    return { 
        type: TokenType.QUAD, 
        value: value,
        edges: edges
    };
}

function handleEdgesForBinaryOp(opcode, a_quad, b_quad, edges_a, edges_b){
    const top = handleEdgePairForBinaryOp(opcode, a_quad[0], b_quad[0], a_quad[1], b_quad[1]);
    const lft = handleEdgePairForBinaryOp(opcode, a_quad[0], b_quad[0], a_quad[2], b_quad[2]);
    const rgt = handleEdgePairForBinaryOp(opcode, a_quad[1], b_quad[1], a_quad[3], b_quad[3]);
    const btm = handleEdgePairForBinaryOp(opcode, a_quad[2], b_quad[2], a_quad[3], b_quad[3]);

    //console.log(edges_a);

    const edges = {
        top: [
            top[0] + edges_a.top[0] + edges_b.top[0],
            top[1] + edges_a.top[1] + edges_b.top[1],
            top[2] + edges_a.top[2] + edges_b.top[2]
        ],
        lft: [
            lft[0] + edges_a.lft[0] + edges_b.lft[0],
            lft[1] + edges_a.lft[1] + edges_b.lft[1],
            lft[2] + edges_a.lft[2] + edges_b.lft[2]
        ],
        rgt: [
            rgt[0] + edges_a.rgt[0] + edges_b.rgt[0],
            rgt[1] + edges_a.rgt[1] + edges_b.rgt[1],
            rgt[2] + edges_a.rgt[2] + edges_b.rgt[2],
        ],
        btm: [
            btm[0] + edges_a.btm[0] + edges_b.btm[0],
            btm[1] + edges_a.btm[1] + edges_b.btm[1],
            btm[2] + edges_a.btm[2] + edges_b.btm[2]
        ]
    }

    return edges;
}

//arg a (left operand)
//arg b (right operand)
function handleEdgePairForBinaryOp(opcode, a1, b1, a2, b2){
    //opcode -> operator #
    //a1 -> vertex 1 for a
    //b1 -> vertex 1 for b
    //a2 -> vertex 2 for a
    //b2 -> vertex 2 for b

    var crosses = 0;
    var holes = 0;
    var jumps = 0;
    var undefined = false;

    switch(opcode){
        case OpCode.ADD:
        case OpCode.SUB:
        case OpCode.LT:
        case OpCode.LTE:
        case OpCode.GT:
        case OpCode.GTE:
        case OpCode.EQ:
        case OpCode.NEQ:
            //??
            break;
        case OpCode.MUL:
        case OpCode.AND:
        case OpCode.OR:
        case OpCode.XOR:
            if((a1 > 0) != (a2 > 0)) crosses++; 
            if((b1 > 0) != (b2 > 0)) crosses++; 
            break;
        case OpCode.DIV:
            //  a/b
            //TODO: FIX BELOW
            if((a1 > 0) != (a2 > 0)) crosses++; 
            if((b1 > 0) != (b2 > 0)) crosses++; jumps++; undefined = true;//holes++; 
            break;
        case OpCode.POW: 
            //  a^b
            if(a1>0 && a2 > 0){
                break;
            }
            const r1 = Math.pow(a1, b1);
            const r2 = Math.pow(a2, b2);

            if(r1 == NaN || r2 == NaN){
                holes = 1;
                undefined = true;
            }

            if((r1 >= 0) != (r2 >= 0)){
                crosses = 1;
                holes = 1;
                jumps = 1;
                undefined = true;
            }
            break;
        default:
            console.error("Unknown operator in edge comparison.");
            break;
    }

    if(!undefined) undefined = (holes > 0);

    return [crosses, holes, jumps, undefined];
}

function binaryOp(opcode, a, b, evaluateDiff = true) {
    if((typeof a == "number") && (typeof b == "number")){
        const magnitude = Math.abs(a * b);
        const diff = Math.abs(a-b);
        switch (opcode) {
            case OpCode.ADD: return a + b;
            case OpCode.SUB: return a - b;
            case OpCode.MUL: return a * b;
            case OpCode.DIV: return a / b;
            case OpCode.POW: return Math.pow(a, b);
            case OpCode.LT: return evaluateDiff ? a-b : (a < b);
            case OpCode.LTE: return evaluateDiff ? a-b : (a <= b);
            case OpCode.GT: return evaluateDiff ? b-a: (a > b);
            case OpCode.GTE: return evaluateDiff ? b-a : (a >= b);
            case OpCode.EQ: return evaluateDiff ? (a - b) : (a == b);
            case OpCode.NEQ: return evaluateDiff ? (b - a) : (a != b);
            case OpCode.AND: return evaluateDiff ? (a && b) * magnitude : (a && b);
            case OpCode.OR: return evaluateDiff ? (a || b) * magnitude : (a || b);
            case OpCode.XOR: 
                const r = ((a || b) && !(a && b));
                return evaluateDiff ? (r) * magnitude : r;
            case OpCode.NOT: return evaluateDiff ? -b : !b;
            case OpCode.FACT: return func_gamma(b + 1);
            case OpCode.NEG: return -b;
            case OpCode.DPR: return 0; //dot product from references
            case OpCode.CRP: return 0; //cross product from references
        }

        console.error("Unknown operator passed", opcode);
        return 0;
    }

    console.error("Unknown arguments passed", a, b);
    return 0;

    /*if (a.type == TokenType.QUAD || b.type == TokenType.QUAD) {
        //convert non-quad types into quad types
        const newA = (a.type == TokenType.QUAD) ? a.value : Array(4).fill(a.value);
        const newB = (b.type == TokenType.QUAD) ? b.value : Array(4).fill(b.value);

        //return new token by doing binaryOp on each element pair  
        return { type: TokenType.QUAD, value: [0, 1, 2, 3].map((index) => binaryOp(newA[index], newB[index], opcode)) };
    }*/
}

function executeFuncOnQuad(funccode, args, attributes){
    //assume args = Quad[]
    //convert non-quad types into quad types
    var newArgs = [];

    args.forEach((arg) => {
        newArgs.push( (arg.type == TokenType.QUAD) ? arg.value : Array(4).fill(arg.value) );
    });

    //flips 2d array to be organized by 1)vertex 2)arg
    const vertexes = [0,1,2,3].map((index) => newArgs.map((arg) => arg[index]));

    //the edges of each vertex passed into executeFunc as a parallel array
    const edgeslist = args.map((arg) => arg.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]});

    //new values by doing func() on each arg quad
    const value = [0, 1, 2, 3].map((index) => executeFunc(
        funccode, newArgs.map((arg) => arg[index]), attributes
    ));

    //console.log("value",value);

    //edge handling
    //shoulc update 'edges' object
    const edges = handleEdgesForFunc(funccode, vertexes, edgeslist);

    return { 
        type: TokenType.QUAD, 
        value: value,
        edges: edges
    };
    
}

function handleEdgesForFunc(funccode, vertexes, edgeslist){
    //Edge{}[] edgeslist (edges, organized by argument)

   //const vertexes = [0,1,2,3].map((index) => newArgs.map((arg) => arg[index]));

    const edge = {
        top: edgeslist.map((edgequad) => edgequad.top),
        lft: edgeslist.map((edgequad) => edgequad.lft),
        rgt: edgeslist.map((edgequad) => edgequad.rgt),
        btm: edgeslist.map((edgequad) => edgequad.btm),
    }
    //console.log(edge);

    //arg0 arg1
    //arg2 arg3

    const top = handleEdgePairForFunc(funccode, vertexes[0], vertexes[1], edge.top);
    const left = handleEdgePairForFunc(funccode, vertexes[0], vertexes[2], edge.lft);
    const right = handleEdgePairForFunc(funccode, vertexes[1], vertexes[3], edge.rgt);
    const bottom = handleEdgePairForFunc(funccode, vertexes[2], vertexes[3], edge.btm);

    //console.log("tlrb:", top, left, right, bottom);

    //TODO: figure out if it should just be simple aggregation

    return {
        top: top,
        lft: left,
        rgt: right,
        btm: bottom
    };

    //return [top, left, right, bottom];
}

function handleEdgePairForFunc(funccode, args1, args2, edgeinfo){
    //returns # of jumps (like in a mod b)
    //returns # of holes (like in 1/x)
    //returns # of intersections/crosses
    //returns if the function is undefined anywhere in the interval

    //NOTE: asymptotes for f(x) = crosses for 1/f(x) and vice versa

    var n;
    var crosses;
    var holes;
    var jumps;

    var undefined = false;

    //console.log("before", crosses, holes, jumps);

    switch(funccode){
        case FuncCode.SIN:
            crosses = edgeinfo[0][0] + Math.abs(Math.floor(args1[0]/Math.PI)-Math.floor(args2[0]/Math.PI));
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            //console.log(args1[0], args2[0], "=>", crosses);
            break;
        case FuncCode.COS:
            crosses = edgeinfo[0][0] + Math.abs(Math.floor(args1[0]/Math.PI+0.5)-Math.floor(args2[0]/Math.PI+0.5));
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            break;
        case FuncCode.TAN:
        case FuncCode.SEC:
            crosses = edgeinfo[0][0];
            n = Math.abs(
                Math.floor(args1[0]/Math.PI + 0.5)
                -Math.floor(args2[0]/Math.PI + 0.5)
            );
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
            //return [n, n, n]; //jumps, holes, crosses
        case FuncCode.CSC:
        case FuncCode.COT: 
            crosses = edgeinfo[0][0];
            n = Math.abs(
                Math.floor(args1[0]/Math.PI + 0)
                -Math.floor(args2[0]/Math.PI + 0)
            );
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FuncCode.ASEC:
        case FuncCode.ACSC:
            crosses = edgeinfo[0][0];
            //if they are across the gap, or if either of them is within the gap
            if((Math.sign(args1[0]) != Math.sign(args2[0])) || (Math.abs(args1[0]) < 1) || (Math.abs(args2[0]) < 1)){
                holes = 1+edgeinfo[0][1];
                jumps = 1+edgeinfo[0][2];
            }
            break;
        case FuncCode.CSCH:
        case FuncCode.COTH:
            crosses = edgeinfo[0][0];
            n = ((args1[0] > 0) !== (args2[0] > 0)) ? 1 : 0;
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        //case 
        case FuncCode.SQRT:
            crosses = edgeinfo[0][0];
            holes = edgeinfo[0][1] (args1[0] < 0 != args2[0] < 0);
            jumps = edgeinfo[0][2];
            undefined = (args1[0] < 0 || args2[0] < 0);
            break;

    }

    crosses = crosses ?? edgeinfo[0][0]; //first argument

    if(!undefined) undefined = (holes > 0);

    //console.log("after", crosses, holes, jumps);

    return [crosses, holes, jumps, undefined];
}

function executeFunc(funccode, args, attributes) {
    if(attributes.length > 0){
        if(attributes[AttributiveCode.POWER] != undefined){
            return Math.pow(func(funccode, args, attributes),attributes[AttributiveCode.POWER]);
        }
    }

    switch (funccode) {
        case FuncCode.SIN: return Math.sin(args[0]); 
        case FuncCode.COS: return Math.cos(args[0]); 
        case FuncCode.TAN: return Math.tan(args[0]); 
        case FuncCode.SEC: return 1 / Math.cos(args[0]); 
        case FuncCode.CSC: return 1 / Math.sin(args[0]); 
        case FuncCode.COT: return 1 / Math.tan(args[0]); 
        case FuncCode.ASIN: return Math.asin(args[0]); 
        case FuncCode.ACOS: return Math.acos(args[0]); 
        case FuncCode.ATAN: return Math.atan(args[0]); 
        case FuncCode.ASEC: return Math.acos(1 / args[0]); 
        case FuncCode.ACSC: return Math.asin(1 / args[0]); 
        case FuncCode.ACOT: return Math.atan(1 / args[0]); 
        case FuncCode.SINH: return Math.sin(args[0]); 
        case FuncCode.COSH: return Math.cos(args[0]); 
        case FuncCode.TANH: return Math.tan(args[0]); 
        case FuncCode.SECH: return 1 / Math.cosh(args[0]); 
        case FuncCode.CSCH: return 1 / Math.sinh(args[0]); 
        case FuncCode.COTH: return 1 / Math.tanh(args[0]); 
        case FuncCode.ASINH: return Math.asinh(args[0]); 
        case FuncCode.ACOSH: return Math.acosh(args[0]); 
        case FuncCode.ATANH: return Math.atanh(args[0]); 
        case FuncCode.ASECH: return Math.acosh(1 / args[0]); 
        case FuncCode.ACSCH: return Math.asinh(1 / args[0]); 
        case FuncCode.ACOTH: return Math.atanh(1 / args[0]); 
        case FuncCode.GD: return Math.atan(Math.sinh(args[0])); 
        case FuncCode.LAM: return 0; 
        case FuncCode.ABS: return Math.abs(args[0]); 
        case FuncCode.SIGN: return Math.sign(args[0]); 
        case FuncCode.FLOOR: return Math.floor(args[0]); 
        case FuncCode.CEIL: return Math.ceil(args[0]); 
        case FuncCode.ROUND: return Math.round(args[0]); 
        case FuncCode.TRUNC: return Math.trunc(args[0]); 
        case FuncCode.MOD: return args[1] % args[0]; 
        case FuncCode.MIN: return Math.min(...args); 
        case FuncCode.MAX: return Math.max(...args); 
        //sum()
        //
        /* Todo: add handling for variables that are arrays */
        case FuncCode.AVG:
            var sum = 0;
            for (var i = 0; i < array.length; i++) {
                sum = sum + array[i];
            }
            return sum / args.length;
            
        case FuncCode.MED:
            if (args.length % 2 == 1) return args[(args.length - 1) / 2];
            else {
                var mid = args.length / 2;
                return args[mid - 1] + args[mid]
            }
            
        case FuncCode.MODE: return args[0]; 
        case FuncCode.EXP: return Math.exp(args[0]); 
        case FuncCode.LN: return Math.log(args[0]); 
        case FuncCode.LOG: return Math.log(args[0]) / (attributes[AttributiveCode.BASE] ?? Math.log(10)); 
        case FuncCode.LOGN: return Math.log(args[1]) / Math.log(args[0]); 
        case FuncCode.SQRT: return Math.sqrt(args[0]); 
        case FuncCode.CBRT: return Math.cbrt(args[0]); 
        case FuncCode.NTHRT: return Math.pow(args[1], 1 / args[0]); 
        case FuncCode.GAMMA: return func_gamma(args[0]); 
        case FuncCode.DGAMA: return 0; 
        case FuncCode.PGAMA: return 0; 
        case FuncCode.ZETA: return 0; 
    }

    return 0;
}

function blankEdgeObject(){
    return {
        top: [0,0,0],
        lft: [0,0,0],
        btm: [0,0,0],
        rgt: [0,0,0]
    };
}

function func_gamma(n) {
    //console.log("N",n);
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

    if (n < 0.5) {
        return Math.PI / (Math.sin(Math.PI * n) * func_gamma(1 - n));
    } else {
        n -= 1;
        let x = 0.9999999999998099;

        for (let i = 0; i < lancoszCoefficients.length; i++) {
            x += lancoszCoefficients[i] / (n + i + 1);
        }

        let t = n + lancoszCoefficients.length - 0.5;
        return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;    
    }

}

export function evaluateExpressionSimple(string) {
    console.log("Evaluating: ", string);

    tokenizeExpression(string);
    console.log("Tokens: ", tokenizedExpressions[tokenizedExpressions.length - 1]);


    compileExpression(
        tokenizedExpressions.pop(),
    );
    console.log("Compiled Expression: ", compiledExpressions[compiledExpressions.length - 1]);

    return evaluateExpression(
        compiledExpressions.pop(),
        {},
        { evaluateType: true }
    );
}

export function getTokenizedExpressions() {
    return tokenizedExpressions;
}

export function getTokenizedExpressionMetas() {
    return tokenizedExpressionMetas;
}

export function getCompiledExpressions() {
    //console.log("imfo:");
    //console.log(Array.isArray(compiledExpressions));
    //console.log(Object.prototype.toString.call(compiledExpressions));
    //console.log(compiledExpressions);
    //console.log(compiledExpressions.constructor?.name);

    //console.log(compiledExpressions[0]);

    return compiledExpressions;
}

export function getExpression(index) {
    return compiledExpressions[index];
}

export function getCompiledExpressionMetas() {
    return compiledExpressionMetas;
}

export function popExpression() {
    return tokenizedExpressions.pop();
}
