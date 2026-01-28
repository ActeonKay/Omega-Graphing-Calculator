import{
    getVariable, getAllVariables
} from "./expressions.js";

export const ExpressionType = {
    INVLD: -1,
    EVAL: 0, //for statements w/o vars, only need to be evaluated once
    IMPLICIT: 1, //f(x,y)=g(x,y) (should this include boolean expressions?)
    EXP_F_X: 2, //y=f(x)
    EXP_F_Y: 3, //x=f(y)
    EXP_F_T: 4, //r=f(theta) or polar
    EXP_F_R: 5, //theta=f(r)
    PRMTRC: 6, //same as eval?
    ASGNMT: 7,
    FUNCDEF: 8,
    BLANK: 9
}

const EvalType = {
    INVALID: -1,
    NUM: 0,
    QUAD: 1,
    DUAL: 2,
    ARRAY: 3
}

//EVAL: num-based evaluation
//IMPLICIT: quad-based evaluation
//...F(...): dual-based evaluation
//PRMTRC: dual-based evaluation
//ASSGNMT: num-based evaluation
//FUNCDEF: quad-based evaluation

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
    DUAL: 12,
    VEC2: 13,
    VEC3: 14,
    ALPHANUM: 15,
    ATT: 16,
    ARRAY: 17
}

const LatexTokenType = {
    WHITESPACE: 0,
    CHAR: 1,
    COMMAND: 2,
    NUMBER: 3,
    BRACKET: 4,
    DELIMITER: 5
}

const ExpressionInfo = {
    "invalid": { exprType: ExpressionType.INVLD, tokType: TokenType.INVLD},
    "evaluate": { exprType: ExpressionType.EVAL, tokType: TokenType.NUM},
    "implicit": { exprType: ExpressionType.IMPLICIT, tokType: TokenType.QUAD},
    "y of x": { exprType: ExpressionType.EXP_F_X, tokType: TokenType.DUAL},
    "x of y": { exprType: ExpressionType.EXP_F_Y, tokType: TokenType.DUAL},
    "r of θ": { exprType: ExpressionType.EXP_F_T, tokType: TokenType.DUAL},
    "θ of r": { exprType: ExpressionType.EXP_F_R, tokType: TokenType.DUAL},
    "parametric": { exprType: ExpressionType.PRMTRC, tokType: TokenType.DUAL},
    "assignment": { exprType: ExpressionType.ASGNMT, tokType: TokenType.NUM},
    "function definition": { exprType: ExpressionType.FUNCDEF, tokType: TokenType.QUAD},
}

const ExpressionInfoByType = {};
for (const sym in ExpressionInfo) {
    const info = ExpressionInfo[sym];
    ExpressionInfoByType[info.exprType] = {
        ...info,
        symbol: sym
    };
}

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
    POWN: 21,
    SUBS: 22,
    PM: 23,
    PCT: 24
}

const OpAssoc = {
    LEFT: 0,
    RIGHT: 1
};

const OpInfo = {
    "+": { code: OpCode.ADD, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "-": { code: OpCode.SUB, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "*": { code: OpCode.MUL, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "cdot": { code: OpCode.MUL, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "/": { code: OpCode.DIV, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "^": { code: OpCode.POW, precedence: 3, associativity: OpAssoc.RIGHT, arity: 2 },
    "<": { code: OpCode.LT, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    "<=": { code: OpCode.LTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    ">": { code: OpCode.GT, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    ">=": { code: OpCode.GTE, precedence: 0, associativity: OpAssoc.LEFT, arity: 2 },
    "=": { code: OpCode.EQ, precedence: -1, associativity: OpAssoc.LEFT, arity: 2 },
    "==": { code: OpCode.EQ, precedence: -1, associativity: OpAssoc.LEFT, arity: 2 },
    "!=": { code: OpCode.NEQ, precedence: -1, associativity: OpAssoc.LEFT, arity: 2 },
    "&&": { code: OpCode.AND, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "||": { code: OpCode.OR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "^^": { code: OpCode.XOR, precedence: -2, associativity: OpAssoc.LEFT, arity: 2 },
    "~": { code: OpCode.NOT, precedence: 5, associativity: OpAssoc.RIGHT, arity: 1 }, //prefix unary (L)
    "!": { code: OpCode.FACT, precedence: 6, associativity: OpAssoc.LEFT, arity: 1 }, //suffix unary (R)
    "u-": { code: OpCode.NEG, precedence: 3, associativity: OpAssoc.RIGHT, arity: 1 }, //prefix unary (L)
    "#": { code: OpCode.CRP, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "\\": {code: OpCode.ATT, precedence: 101, associativity: OpAssoc.LEFT, arity: 2},
    "^n": { code: OpCode.POWN, precedence: 6, associativity: OpAssoc.RIGHT, arity: 2 }, //for things like x^2!, the x^2 should come first as it is not x^{2!}
    "_": { code: OpCode.SUBS, precedence: 6, associativity: OpAssoc.RIGHT, arity: 2},
    "±": { code: OpCode.PM, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "pm": { code: OpCode.PM, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "%": { code: OpCode.PCT, precedence: 6, associativity: OpAssoc.LEFT, arity: 1 }
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
    FRAC: 100, //maybe temporary
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
    "frac": { code: FuncCode.FRAC, staticArgs: true, args: 2},
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
    "Gamma": { code: FuncCode.GAMMA, staticArgs: true, args: 1 },
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

const FuncInfoByCode = {};
for (const sym in FuncInfo) {
    const info = FuncInfo[sym];
    FuncInfoByCode[info.code] = {
        ...info,
        symbol: sym
    };
}

const BracCode = {
    LRND: 1,
    RRND: 2,
    LSQR: 3,
    RSQR: 4,
    LCUR: 5,
    RCUR: 6,
    LFNC: 7,
    RFNC: 8,
    LSTM: 9, //'stem' brackets --> of unknown type but orientation
    RSTM: 10
}

const BracInfo = {
    "(": BracCode.LRND,
    "left(": BracCode.LRND,
    ")": BracCode.RRND,
    "right)": BracCode.RRND,
    "[": BracCode.LSQR,
    "left[": BracCode.LSQR,
    "]": BracCode.RSQR,
    "right]": BracCode.RSQR,
    "{": BracCode.LCUR,
    "left{": BracCode.LCUR,
    "}": BracCode.RCUR,
    "right}": BracCode.RCUR,
    "(.": BracCode.LFNC,
    ").": BracCode.RFNC,
    "left?": BracCode.LSTM,
    "right?": BracCode.RSTM
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
    "theta": UnknownCode.POLRT,
    "r": UnknownCode.POLRR,
    "φ": UnknownCode.POLRP,
    //"phi": UnknownCode.POLRP
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
    FALSE: 23,
    PHI: 24
}

const ConstantInfo = {
    "i": { code: ConstantCode.I, value: 1 },
    "pi": { code: ConstantCode.PI, value: Math.PI },
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
    "phi": { code: ConstantCode.PHI, value: 1.61803398875}
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
    "frac", "sin", "cos", "tan",
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
    "sinc", "gamma", "zeta", "atan2", "digamma", "polygamma",
    "Ei", "Ti", "Li", "erf",
    "fresnelS", "fresnelC", "Si", "Ci",
    "dawsonP", "dawsonM", "Ai",
    "sum", "integral",
    "not", "or", "and", "xor", "bool"
];

const validConstants = [
    "true", "false",
    "pi", "eunum", "eucon", "phi",
    "egrav", "sc",
    "grav", "NA", "gascon",
    "bmc", "sbc", "culuk", "epzo", "muzo", "speli", "plcon",
    "elcharge", "elmas", "prmas", "numas", "uam",
    "radfer"
];

//in operators, functions, etc, store a func expression that does what the operator does
const doEvalsAsFuncExpressions = true;

const numRegex = /^[0-9]*\.?[0-9]+$/;
const alphanumRegex = /^[a-zA-Z0-9θ]+$/;
const operatorRegex = /^[+\-*\/^%!=<>&|#_]$/;
const bracketRegex = /^[\(\)\[\]]{1}$/;

const latexOperators = ['cdot'];
const latexCharacters = ['pi','theta'];
const latexFunctions = ['sin', 'cos', 'tan'];
const latexBrackets = ['left(','left[','left{','left|','left?','right)','right]','right}','right|','right?'];
const latexStructs = ['frac','sqrt']
const brackets = ['(',')','[',']','{','}','|'];
const operators = ['+','-','_','^'];

// types of tokens: 
    //   operators
    //     + - * (binary)
    //   scripts
    //     ^ _
    //   variables
    //     a b
    //   constants (built-in)
    //     \pi \theta
    //   functions:
    //     \sin \cos \tan
    //   parenthesis
    //     \left( \right) 
    //     \left[ \right] 
    //     \left{ \right}
    //   commands
    //     \frac{}{}
    //     \sqrt{}
    //   commands with modifier
    //     \sqrt[]{}


//token:
//{type: int, value: int, edges: [][], attributes: []}
//{type: 4bits, 64bitint / 64*4=256bit quad, edges: 4bits*3things*4edges=48bits, attributes: [pow: 64bitint, sub: 64bitint]}

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

function isBracket(string) {
    return bracketRegex.test(string);
}

function isPrefixOfElementIn(s, elements) {
    return elements.some(fn => fn.startsWith(s) && fn.length > s.length);
}

/**
 * Determines if a string token could have 1+ characters added and still be a valid string token
 * @param {*} string 
 * @returns `boolean`
 */
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

/**
 * Determine token type of string, one of:
 * - Function
 * - Unknown
 * - Constant
 * @param {*} string 
 * @returns `integer`
 */
function typeOfStringToken(string) {
    if (FuncInfo[string] != undefined) return TokenType.FUNC;
    if (UnknownInfo[string] != undefined) return TokenType.UNKN;
    if (ConstantInfo[string] != undefined) return TokenType.CNST;
    //var

    console.log("unknown string tested: ", string);
    return TokenType.INVLD; //unknown
}

/**
 * Test if you can insert a token into the stack 
 * @param {*} token 
 * @param {*} tokenState 
 * @returns {*} `integer` insertion type
 */
function testPushToken(token, tokenState) {
    if (token.length == 0) {
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

/**
 * Turn `string` into an array of token data
 * @param {*} string input string
 * @param {*} tryIsolateUnknown try to fit expression into `u=f(v)`
 * @returns `{type, tokens}` tokenized expression
 */
// export function tokenizeExpression(string, tryIsolateUnknown = true) {
//     var tokens = []; //Array<string>
//     var tokenMetas = []; //Array<number>

//     let charState = 0; //number
//     let tokenState = 0; //number

//     let token = ""; //string
//     let char = ""; //string
//     let meta = 0; //number

//     for (let index = 0; index < string.length; index++) {
//         char = string.charAt(index);

//         //if token+char makes sense as a token, continue building token
//         //else push token to tokens, start new token with char

//         //console.log(char + ", " + tokenState + " -> " + token);

//         if (/^[0-9.]$/.test(char)) charState = TokenType.NUM;
//         else if (isOperator(char)) charState = TokenType.OP;
//         else if (alphanumRegex.test(char)) charState = TokenType.ALPHANUM;
//         else if (char == "\"") charState = TokenType.STRG;
//         else if (isBracket(char)) charState = TokenType.BRKT;
//         else if (char == ",") charState = TokenType.DELIM
//         else if (/\s/.test(char)) charState = TokenType.NUL;
//         else charState = TokenType.INVLD;

//         //string

//         if (charState == TokenType.BRKT || charState == TokenType.DELIM) {
//             //no building needed
//             meta = testPushToken(token, tokenState);
//             if (meta >= 0) {
//                 tokens.push(token);
//                 tokenMetas.push(meta);
//             } else {
//                 //error, but doesn't create problems in result. ???
//                 //console.error("Unknown token: " + token + " before: " + char + ", " + index);
//             }

//             tokens.push(char);
//             tokenMetas.push(charState);

//             token = "";
//             tokenState = 0;

//             continue;
//         }

//         switch (tokenState) {
//             case TokenType.NUL:
//                 if (token !== "\"") {
//                     token = char;
//                 } else {
//                     token = ""; //quotes aren't included in strings
//                 }

//                 tokenState = charState;
//                 break;
//             case TokenType.NUM: //numbers
//                 if (charState != TokenType.NUM) {
//                     if (token.includes(".")) {
//                         //something like "2.7" + "."
//                         console.error("Unknown number token: " + token);
//                     }

//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = charState;
//                     token = char;

//                     continue;
//                 }

//                 //already number token:

//                 if (numRegex.test(token + char) || (token.indexOf(".") == -1 && char == ".")) {
//                     token = token.concat(char);
//                 } else {
//                     //something like "2.2.1", an invalid number
//                     console.error("Unknown number token: " + token);
//                 }
//                 break;
//             case TokenType.OP: //operators
//                 if (charState != TokenType.OP) {

//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = charState;
//                     token = char;

//                     continue;
//                 }

//                 //already operator token:

//                 if (isPrefixOfElementIn(token + char, validOperators)) {
//                     token = token.concat(char);
//                 } else if (validOperators.includes(token + char)) {
//                     meta = testPushToken(token + char, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token + char); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + (token + char));
//                     }

//                     tokenState = 0;
//                     token = "";
//                 } else if (validOperators.includes(token)) {
//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = TokenType.OP;
//                     token = char;
//                 } else {
//                     //throw error
//                     console.error("Unknown operator token: " + token);
//                 }
//                 break;
//             case TokenType.ALPHANUM: //string tokens (not quotations, but functions/vars/constants/etc)
//                 if (charState != TokenType.ALPHANUM) {
//                     //special marking for function ( tokens???

//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = charState;
//                     token = char;

//                     continue;
//                 }

//                 //already string token:

//                 if (isPrefixOfStringToken(token + char)) {
//                     token = token.concat(char);
//                 } else if (typeOfStringToken(token + char) >= 0) {
//                     meta = testPushToken(token + char, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token + char); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + (token + char));
//                     }

//                     tokenState = 0;
//                     token = "";
//                 } else if (typeOfStringToken(token) >= 0) {
//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = 0;
//                     token = char;
//                 } else {
//                     //throw error
//                     console.error("Unknown string token: " + token);
//                 }
//                 break;
//             case TokenType.STRG:
//                 if (char == '"' /* a quotation mark like " */) {
//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }

//                     tokenState = 0;
//                 } else {
//                     token = token.concat(char);
//                 }

//                 break;
//             case TokenType.BRKT:
//                 console.error("Code tokenized incorrectly. Token: " + token);
//                 meta = testPushToken(token, tokenState);
//                 if (meta >= 0) {
//                     tokens.push(token); //TOKEN PUSH
//                     tokenMetas.push(meta); //meta
//                     //console.log("pushed token: " + token + " meta: " + meta);
//                 } else {
//                     console.error("Unknown token type for: " + token);
//                 }

//                 if (charState !== 0) {
//                     meta = testPushToken(char, charState);
//                     if (meta >= 0) {
//                         tokens.push(char); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + char + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + char);
//                     }
//                 }

//                 tokenState = 0;
//                 token = "";

//                 break;
//             case TokenType.DELIM:
//                 if (token.length > 0) {
//                     meta = testPushToken(token, tokenState);
//                     if (meta >= 0) {
//                         tokens.push(token); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + token + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + token);
//                     }
//                 }

//                 if (charState !== 0) {
//                     meta = testPushToken(char, charState);
//                     if (meta >= 0) {
//                         tokens.push(char); //TOKEN PUSH
//                         tokenMetas.push(meta); //meta
//                         //console.log("pushed token: " + char + " meta: " + meta);
//                     } else {
//                         console.error("Unknown token type for: " + char);
//                     }
//                 }
//             default:
//                 console.error("Unknown token state: " + tokenState);
//                 break;
//         }

//     }

//     if (token.length > 0) {
//         // Determine meta for last token
//         let lastMeta = TokenType.NUL; //used to be: let lastMeta = tokenState
//         if (lastMeta === TokenType.NUL) {
//             // Try to infer type if tokenState is 0
//             if (isNumber(token)) lastMeta = TokenType.NUM;
//             else if (isOperator(token)) lastMeta = TokenType.OP;
//             else lastMeta = typeOfStringToken(token);
//         }
//         tokens.push(token);
//         tokenMetas.push(lastMeta);
//         //console.log("End token push: " + token + ", meta: " + lastMeta);
//     }

//     tokenState = 0;

//     //console.log("Raw tokens: ", tokens);
//     //console.log("Raw tokenmeta: ", tokenMetas);

//     //TODO: rename tryIsolateUnknown
//     const eqInfo = tryIsolateUnknown ? getExpressionType(tokens, tokenMetas) : ExpressionType.IMPLICIT;

//     console.log(eqInfo.type);

//     const fixed = insertImplicitOperations(eqInfo.tokens, eqInfo.tokenMetas, eqInfo.type);

//     console.log("Fixed tokens: ", fixed);

//     //evaluation of truth (direct evaluation) vs evaluation of closeness to intercept (f(x)=0)

//     // tokenizedExpressions.push({ type: eqInfo.type, tokens: fixed[0] });
//     // tokenizedExpressionMetas.push(fixed[1]);

//     return { type: eqInfo.type, tokens: fixed[0], tokenTypes: fixed[1] };
// }

/**
 * Test for if an expression is implicit, polar, explicit, etc.
 * @param {*} tokens String[] of tokens
 * @param {*} tokenMetas Int[] of token types
 * @returns 
 */
// function getExpressionType(tokens, tokenMetas){
//     const eqtoken = tokens.indexOf("=");

//     if(eqtoken < 0){
//         //check if there aren't unknowns
//         if(!tokenMetas.some((m) => m==TokenType.UNKN)){
//             return {tokens: tokens, tokenMetas: tokenMetas, type: ExpressionType.EVAL}; //no '=' tokens
//         }

//         // -> there is at least 1 unknown:

//         const nextUnkn = (n) => tokenMetas.indexOf(TokenType.UNKN,n+1);

//         // first unknown (we know there's at least this one)
//         let i1 = nextUnkn(-1);
//         const c1 = tokens[i1];

//         var i = nextUnkn(i1);
//         while(i >= 0){
//             //if this unknown is not equal to first, then it cannot be converted to a ...=f(...) expression type
//             if(tokens[i] != c1){
//                 return {tokens: tokens, tokenMetas: tokenMetas, type: ExpressionType.INVLD};
//             }
//             i = nextUnkn(i);
//         }

//         //type dictionary
//         const type = {
//             "x": ExpressionType.EXP_F_X,
//             "y": ExpressionType.EXP_F_Y,
//             "θ": ExpressionType.EXP_F_T,
//             "r": ExpressionType.EXP_F_R
//         }[c1];

//         return {tokens: tokens, tokenMetas: tokenMetas, type: type};
        
//     }else if(tokens.includes("=", eqtoken+1) || tokens.includes("!=")){
//         return {tokens: tokens, tokenMetas: tokenMetas, type: ExpressionType.EVAL}; //multiple '=' or '!=' tokens
//     }else if((tokens.includes("&&") || tokens.includes("||")) || tokens.includes("^^")){
//         return {tokens: tokens, tokenMetas: tokenMetas, type: ExpressionType.IMPLICIT}; //logical implicit
//     }else{
//         //splice tokens at =, determine if fits pattern y=f(x), x=f(y), etc...
//         const lhs = tokens.slice(0, eqtoken);
//         const rhs = tokens.slice(eqtoken+1);

//         if(lhs.length === 1){
//             tokenMetas[0] === TokenType.VAR; 
//         };

//         //console.log(lhs, ["="], rhs);

//         const exclusive = {
//             "x": ["x","θ","r"],
//             "y": ["y","θ","r"],
//             "r": ["x","y","θ"],
//             "θ": ["x","y","r"]
//         };

//         const ids = {
//             "y": ExpressionType.EXP_F_X,
//             "x": ExpressionType.EXP_F_Y,
//             "r": ExpressionType.EXP_F_T,
//             "θ": ExpressionType.EXP_F_R
//         };

//         if(lhs.length == 1){
//             const tk = lhs[0];
//             if(ids[tk] != undefined && rhs.every((item) => {return !exclusive[tk].includes(item)})){
//                 return {tokens: rhs, tokenMetas: tokenMetas.slice(eqtoken+1), type: ids[tk]};
//             }
//         }

//         if(rhs.length == 1){
//             const tk = rhs[0];
//             if(ids[tk] != undefined && lhs.every((item) => {return !exclusive[tk].includes(item)})){
//                 return {tokens: lhs, tokenMetas: tokenMetas.slice(0,eqtoken), type: ids[tk]};
//             }
//         }

//         return {tokens: tokens, tokenMetas: tokenMetas, type: ExpressionType.IMPLICIT};
//     }
// }

export function tokenizeLatexExpression(latex, tryIsolateUnknown){

    // types of tokens: 
    //   operators
    //     + - * (binary)
    //   scripts
    //     ^ _
    //   variables
    //     a b
    //   constants (built-in)
    //     \pi \theta
    //   functions:
    //     \sin \cos \tan
    //   parenthesis
    //     \left( \right) 
    //     \left[ \right] 
    //     \left{ \right}
    //   commands
    //     \frac{}{}
    //     \sqrt{}
    //   commands with modifier
    //     \sqrt[]{}

    //loop characters
    //  if tokensincelast 

    // const funcs = '^\\(sin|cos|tan|arcsin|arccos|arctan)$'
    // const ops = "^(+|-|^)$";
    // const leftBracks = "( [ {";
    // const rightBracks = ") ] }";

    // const oneCharTokens = ["{","}","[","]","+","-","^","_"];

    let tokens = [];
    let prevToken = undefined;
    let strStart = 0;
    let tryString = "";
    let char = "";
    let isCommand = false;
    let isNumber = false;

    const pushToken = function (type){
        if(type !== LatexTokenType.WHITESPACE) tokens.push({ type, str: tryString});
        prevToken = tryString;
        strStart += tryString.length;
        tryString = "";
        isCommand = false;
        isNumber = false;
    };

    for(let i = 0; i < latex.length; i++){
        char = latex.charAt(i);
        //console.log("Char: ", char, "string: ", tryString, "tokens: ", tokens);

        if(char === ' '){
            //prevent tokens from including the ' ' character TODO: include other whitespace just in case
            console.log('whitespace');
            tryString = ' ';
            pushToken(LatexTokenType.WHITESPACE);
            continue; //go to next token
        }

        if(isCommand){
            while( !shouldCommandStop(tryString,latex.charAt(i)) && i<latex.length){
                tryString = tryString+latex.charAt(i);
                i++;
            }
            i--;

            tryString = tryString.substring(1);

            let type = (tryString.startsWith('left') || tryString.startsWith('right')) ? LatexTokenType.BRACKET : LatexTokenType.COMMAND;
            pushToken(type);
            continue;
        }

        if(isNumber){
            if(prevToken === '^' || prevToken === '_'){
                //edge-case where latex: 'a^21' means 'a^2 * 1'
                pushToken(LatexTokenType.NUMBER);
                i--;
                continue;
            }

            while(
                ('0123456789.'.includes(latex.charAt(i))) && 
                ( (tryString+latex.charAt(i)).match(/\./) || [] ).length < 2 && 
                i<latex.length
            ){
                tryString = tryString+latex.charAt(i);
                i++;
            }
            i--;

            pushToken(LatexTokenType.NUMBER);
            continue;
        }

        if(tryString.length === 0){
            if(char === '\\') {isCommand = true; }
            if('0123456789.'.includes(char)) {isNumber = true; }
        }

        tryString = tryString+char;

        console.assert(tryString.length > 0,tryString,tokens);

        // HACK: helpful for converting commands like \frac{n}{d} to functions frac(n,d): we replace '}{' with ','
        if(tryString === '}'){
            if(latex.charAt(i+1) === '{'){
                tryString = ','; // '}{' --> ','
                pushToken(LatexTokenType.DELIMITER);
                i++;
                continue;
            }

            tryString = 'right?';
            pushToken(LatexTokenType.BRACKET);
            continue;
        }

        if(tryString === '{'){
            tryString = 'left?';
            pushToken(LatexTokenType.BRACKET);
            continue;
        }

        if(tryString === ','){
            pushToken(LatexTokenType.DELIMITER);
            continue;
        }

        // if not a command, we assume all tokens are single-character
        if(!isCommand && !isNumber) {
            pushToken(LatexTokenType.CHAR);
        }
    }

    if(tryString.length > 0){
        if(isNumber){
            pushToken(LatexTokenType.NUMBER);
        }else{
            pushToken(LatexTokenType.CHAR);
        }
    }

    if(tokens.length === 0){
        return {tokens: [], varDependencies: [], type: ExpressionType.BLANK};
    }

    console.log('tokens: ', tokens);

    const compilerSet = latexToTokenObjects(tokens);

    console.log('compset: ', compilerSet);

    const typeset = getLatexExpressionType(compilerSet);

    console.log('typset: ', typeset);

    const final = addMetadataToExpression(typeset);
    console.log(final);

    return final;
    //return tokens.map((tok) => tok.str);
}

/**
 * Test for if an expression is implicit, polar, explicit, etc.
 * @param {Object[]} tokens String[] of tokens
 * @returns 
 */
function getLatexExpressionType(tokens){
    const eqtoken = tokens.findIndex((t) => t.type === TokenType.OP && t.code === OpCode.EQ);

    //console.log(eqtoken, 'eqtoken');
    if(eqtoken < 0){
        //check if there aren't unknowns
        //TODO: ADD MORE ADVANCED VARIABLE CHECKING (is variable char && does variable exist)
        // if(!tokens.some((t) => t.type === TokenType.UNKN || t.type === TokenType.VAR)){
        //     console.log('no unknowns');
        //     return { type: ExpressionType.EVAL, tokens: tokens}; //no '=' tokens
        // }

        if(!tokens.some((t) => t.type === TokenType.UNKN)){
            console.log('no unknowns');
            return { type: ExpressionType.EVAL, tokens: tokens}; //no '=' tokens
        }

        //find index of next unknown after index n
        const nextUnkn = (n) => tokens.findIndex(
            (t,j) => t.type === TokenType.UNKN && j>n
        );

        // first unknown (we know there's at least this one)
        let i1 = nextUnkn(-1);
        const c1 = tokens[i1].code;

        var i = nextUnkn(i1);
        while(i >= 0){
            //if this unknown is not equal to first, then it cannot be converted to a ...=f(...) expression type
            if(tokens[i].code != c1){
                console.log('invalid, both tokens')
                return { type: ExpressionType.INVLD, tokens: tokens };
            }
            i = nextUnkn(i);
        }

        //type dictionary
        const type = {
            1: ExpressionType.EXP_F_X,
            2: ExpressionType.EXP_F_Y,
            4: ExpressionType.EXP_F_T,
            5: ExpressionType.EXP_F_R, 
        }[c1];

        //console.log('func of', type, tokens)
        return {type: type, tokens: tokens };
        
    }else if(tokens.findIndex(
        (t,j) => {
            j > eqtoken
            && t.type === TokenType.OP 
            && t.code === OpCode.EQ
        }) > 0
    ){
        console.log('multiple = or != tokens',tokens);
        return { type: ExpressionType.EVAL, tokens: tokens }; //multiple '=' or '!=' tokens
    }else if( tokens.some((t) => t.type === TokenType.OP && (t.code === OpCode.AND || t.code === OpCode.OR || t.code === OpCode.XOR)) ){
        console.log('logical implicit', tokens);
        return { type: ExpressionType.IMPLICIT, tokens: tokens }; //logical implicit
    }else{
        if(tokens.some((t) => {
            t.type === TokenType.UNKN 
            && (t.code === UnknownCode.POLRR || t.code === UnknownCode.POLRT)
        })
        ){
            return {type: ExpressionType.IMPLICIT, tokens: tokens};
        }

        //splice tokens at =, determine if fits pattern y=f(x), x=f(y), etc...
        const lhs = tokens.slice(0, eqtoken);
        const rhs = tokens.slice(eqtoken+1);

        //console.log(lhs, ["="], rhs);

        if(lhs.length === 1 && lhs[0].type === TokenType.VAR){
            const code = lhs[0].code;

            if(!rhs.some((t) => t.type === TokenType.VAR && t.code === code)){
                return {type: ExpressionType.ASGNMT, var: code, tokens: rhs};
            }

            // TODO: resursive definition like a=a^2-1 (phi)
            return {type: ExpressionType.EVAL, tokens: tokens};
        }

        const exclusive = {
            1: [1,5,4],
            2: [2,5,4],
            4: [1,2,5],
            5: [1,2,4]
        };

        const ids = {
            2: ExpressionType.EXP_F_X,
            1: ExpressionType.EXP_F_Y,
            5: ExpressionType.EXP_F_T, 
            4: ExpressionType.EXP_F_R
        };

        if(lhs.length === 1){
            const tk = lhs[0];
            if(
                tk.type === TokenType.UNKN && 
                ids[tk.code] !== undefined && 
                rhs.every((t) => !(t.type === TokenType.UNKN && exclusive[tk.code].includes(t.code)))
            ){
                //console.log('function ?=rhs');
                return {type: ids[tk.code], tokens: rhs};
            }

        }

        if(rhs.length === 1){
            const tk = rhs[0];

            if(
                tk.type === TokenType.UNKN && 
                ids[tk.code] !== undefined && 
                lhs.every((t) => !(t.type === TokenType.UNKN && exclusive[tk.code].includes(t.code)))
            ){
                console.log('function lhs=?');
                return {type: ids[tk.code], tokens: lhs};
            }
        }

        return { type: ExpressionType.IMPLICIT, tokens: tokens };
    }
}

function shouldCommandStop(cmdString, next){
    if(/[0-9]|\.|[^a-zA-Z\(\)\[\]\{\}]/.test(next)) return true;
    if('0123456789.'.includes(next)) return true;

    if(cmdString.length > 5){
        if(cmdString.startsWith('\\left')) return true; 
        if(cmdString.startsWith('\\right') && cmdString.length > 6) return true;
    } 

    if(cmdString === '\\left' || cmdString === '\\right'){
        return next === ' ' || next === '\\' || operators.includes(next);
    }
    else return next === ' ' || next === '\\' || brackets.includes(next) || operators.includes(next);

    //simplistic, but should be sufficient
}

/**
 * Turns the latex tokenization into a format readable by the compiler by:
 * - Typesetting each token properly
 * - Inserting implicit operators
 * @param {*} latexTokens `Object[]` latex tokens
 * @returns {*} `Object[]` compiler tokens
 */
export function latexToTokenObjects(latexTokens){
    if(latexTokens.length === 0){
        return [];
    }

    let compilerTokens = [];

    if(latexTokens[0].str === '-'){
        compilerTokens.push({ type: TokenType.OP, code: OpCode.NEG });
    }else if(latexTokens[0].type !== LatexTokenType.WHITESPACE){
        let cur = latexTokens[0]
        let str = cur.str;
        switch(true){
            case cur.type === LatexTokenType.NUMBER: 
                compilerTokens.push({ type: TokenType.NUM, value: parseFloat(str) });
                break;
            case cur.type === LatexTokenType.BRACKET:
                compilerTokens.push({ type: TokenType.BRKT, code: BracInfo[str] });
                break;
            case OpInfo[str] !== undefined: 
                compilerTokens.push({ type: TokenType.OP, code: OpInfo[str].code }); 
                break;
            case UnknownInfo[str] !== undefined:
                compilerTokens.push({ type: TokenType.UNKN, code: UnknownInfo[str] }); 
                break;
            case FuncInfo[str] !== undefined:
                compilerTokens.push({ type: TokenType.FUNC, code: FuncInfo[str].code, attributes: new Map() }); 
                break;
            case ConstantInfo[str] !== undefined:
                compilerTokens.push({ type: TokenType.NUM, value: ConstantInfo[str].value }); 
                break;
            default:
                compilerTokens.push({ type: TokenType.VAR, code: str });
                break;
        }
        
    }

    const tryInsertImplicitTimes = function (prev, next) {
        //if(prev.code === undefined || next.code === undefined) return false;
        
        return (
            prev.type === TokenType.NUM || 
            prev.type === TokenType.UNKN ||
            prev.type === TokenType.VAR || 
            (prev.type === TokenType.BRKT && (prev.code % 2 === 0))
        ) && (
            next.type === TokenType.NUM || 
            next.type === TokenType.UNKN ||
            next.type === TokenType.VAR ||
            next.type === TokenType.FUNC ||
            (next.type === TokenType.BRKT && (next.code % 2 === 1)) ||
            (
                next.type === TokenType.OP && 
                OpInfoByCode[next.code].arity === 1 && 
                OpInfoByCode[next.code].associativity === OpAssoc.RIGHT
            )
        );
    }

    const isLeftBracket = function (t){
        return latexBrackets.indexOf(t.str) < 5 && t.type === LatexTokenType.BRACKET;
    }

    const isRightBracket = function (t){
        return latexBrackets.indexOf(t.str) > 4 && t.type === LatexTokenType.BRACKET;
    }

    for(let i = 1; i < latexTokens.length; i++){
        const prev = compilerTokens[compilerTokens.length-1];
        const current = latexTokens[i];
        const str = current.str;

        //invalid: 
        // +- must have on left one of: number, ) and on right: number, (
        // u- must have on right one of: number, (
        // )  must have on left one of: number, ) and on right one of: op, )
        // ( must have on left one of: op, function, ( and on right one of: number, 
        // n must have on left one of: op, ( and on right one of: op, )
        // f must have on left one of: op, ( and on right one of: (, number
        // * must have on left one of: number, ) and on right one of: number, function, (, u-, 

        if(current.type === LatexTokenType.WHITESPACE){
            continue;
        }

        if(current.type === LatexTokenType.DELIMITER){
            compilerTokens.push({ type: TokenType.DELIM });
            continue;
        }

        if(current.type === LatexTokenType.NUMBER){
            const validWithPrev = (
                prev.type === TokenType.OP || 
                isLeftBracket(latexTokens[i-1]) || 
                prev.type === TokenType.FUNC || 
                prev.type === TokenType.DELIM
            );
            const token = { type: TokenType.NUM, value: parseFloat(current.str) };

            if(!validWithPrev){
                console.assert(tryInsertImplicitTimes(prev, token),prev,token);
                //might not be appropriate in some conditions
                compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
            }

            compilerTokens.push(token);
            continue;
        }

        if(current.type === LatexTokenType.CHAR){
            //determine type of character (operator, variable, etc.)

            let op = OpInfo[str];
            if(op !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.NUM || 
                    prev.type === TokenType.UNKN ||
                    prev.type === TokenType.VAR ||
                    isRightBracket(latexTokens[i-1])
                );

                if(!validWithPrev){
                    if(op.code === OpCode.SUB){
                        const token = { type: TokenType.OP, code: OpCode.NEG };
                        if(tryInsertImplicitTimes(prev,token)) compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                        compilerTokens.push(token);
                        continue;
                    }

                    if(op.code === OpCode.POW && prev.type === TokenType.FUNC){
                        console.assert(latexTokens[i+1].type === LatexTokenType.NUMBER);

                        prev.attributes.set(AttributiveCode.POWER, parseFloat(latexTokens[i+1].str));

                        i++;
                        continue;
                    }

                    if(op.code === OpCode.SUBS && prev.type === TokenType.FUNC){
                        //console.assert(latexTokens[i+1].type === LatexTokenType.NUMBER);
                        console.assert(latexTokens[i-1].str === 'log');

                        const next = latexTokens[i+1];

                        const base = parseFloat(next.type === LatexTokenType.NUMBER ? next.str : ConstantInfo[next.str]?.value);

                        prev.attributes.set(AttributiveCode.BASE, base ?? 1);

                        i++;
                        continue;
                    }

                    //console.assert(tryInsertImplicitTimes(prev, token));
                }

                // if(!validWithPrev && op.code === OpCode.SUB){
                //     const token = { type: TokenType.OP, code: OpCode.NEG };
                    

                //     //?? not sure if works, but u- should be okay for any previous token
                //     compilerTokens.push(token);
                //     continue;
                // }

                console.assert(validWithPrev, latexTokens, op, i);

                if(op.code === OpCode.POW){
                    console.assert(latexTokens[i+1] !== undefined);

                    if(latexTokens[i+1].type === LatexTokenType.NUMBER && prev.type !== TokenType.OP){
                        //binds if prev is bindable, i.e. is not another operator, a (, or a delimiter
                        compilerTokens.push({ type: TokenType.OP, code: OpCode.POWN });
                        continue;
                    }
                }

                compilerTokens.push({ type: TokenType.OP, code: op.code });
                continue;
            }

            if(UnknownInfo[current.str] !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.FUNC || 
                    prev.type === TokenType.DELIM
                );
                const token = { type: TokenType.UNKN, code: UnknownInfo[current.str] };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    //might not be appropriate in some conditions
                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

            if(ConstantInfo[str] !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.FUNC || 
                    prev.type === TokenType.DELIM
                );
                const token = { type: TokenType.NUM, value: ConstantInfo[str].value };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    //might not be appropriate in some conditions
                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

            if(current.str === '{' || current.str === '}'){

                const token = { type: TokenType.BRKT, code: current.str === '{' ? TokenType.LFNC : TokenType.RFNC};
                //console.assert(tryInsertImplicitTimes(prev, token));

                compilerTokens.push(token);
                continue;
            }

            console.log('token anyways: ', str);
            if(true){
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.FUNC || 
                    prev.type === TokenType.DELIM
                );
                const token = { type: TokenType.VAR, code: str };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    //might not be appropriate in some conditions
                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

            //console.error('Unknown char token: ',current);
        }

        if(current.type === LatexTokenType.COMMAND){
            if(FuncInfo[current.str] !== undefined){
                const validWithPrev = (prev.type === TokenType.OP || prev.type === TokenType.DELIM || isLeftBracket(latexTokens[i-1]));

                const token = { type: TokenType.FUNC, code: FuncInfo[current.str].code, attributes: new Map() };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

            if(UnknownInfo[current.str] !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.FUNC
                );
                const token = { type: TokenType.UNKN, code: UnknownInfo[current.str] };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token));

                    //might not be appropriate in some conditions
                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

            if(OpInfo[str] !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.NUM || 
                    prev.type === TokenType.UNKN ||
                    prev.type === TokenType.VAR ||
                    isRightBracket(latexTokens[i-1])
                );

                //dont include unary- case, should never come up
                console.assert(OpInfo[str].code !== OpCode.SUB);

                console.assert(validWithPrev, latexTokens);

                compilerTokens.push({ type: TokenType.OP, code: OpInfo[str].code });
                continue;
            }

            if(ConstantInfo[str] !== undefined){
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.FUNC || 
                    prev.type === TokenType.DELIM
                );
                const token = { type: TokenType.NUM, value: ConstantInfo[str].value };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    //might not be appropriate in some conditions
                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }

        }

        const bracId = latexBrackets.indexOf(current.str);
        if(bracId > -1){
            let code = undefined;
            if(current.str === 'left?'){
                if(prev.type === TokenType.FUNC){
                    code = BracCode.LFNC;
                }else{
                    code = BracCode.LRND;
                }
            }else if(current.str === 'right?'){
                code = BracCode.RSTM; //unsure yet
            }else{
                code = BracInfo[current.str];
            }

            console.assert(code !== undefined, current);

            if(isLeftBracket(current)){
                //left bracket: (
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    prev.type === TokenType.FUNC || 
                    isLeftBracket(latexTokens[i-1])
                );
                const token = { type: TokenType.BRKT, code: code };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token), prev, token);

                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }else{
                //right bracket: )
                const validWithPrev = (
                    prev.type === TokenType.NUM ||
                    prev.type === TokenType.UNKN || 
                    prev.type === TokenType.VAR ||
                    isRightBracket(latexTokens[i-1]) || 
                    (prev.type === TokenType.OP && (OpInfoByCode[prev.code].arity===1 && OpInfoByCode[prev.code].associativity === OpAssoc.LEFT))
                );
                const token = { type: TokenType.BRKT, code: code };

                if(!validWithPrev){
                    console.assert(tryInsertImplicitTimes(prev, token),prev,token);

                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }
        }
    }

    return  compilerTokens;
}

function addMetadataToExpression(expression){
    let tokens = expression.tokens;
    let exprType = expression.type;

    let tokType = ExpressionInfoByType[exprType].tokType; //change system later
    let lastToken = {};

    let parenType = [];

    let final = [];

    let varDependencies = [];

    for(let i = 0; i < tokens.length; i++){
        const token = tokens[i];
        switch(token.type){
            case TokenType.BRKT:
                let code = token.code;
                const matchingRight = {
                    [BracCode.LRND]: BracCode.RRND,
                    [BracCode.LSQR]: BracCode.RSQR,
                    [BracCode.LCUR]: BracCode.RSQR,
                    [BracCode.LFNC]: BracCode.RFNC,
                    [BracCode.LSTM]: BracCode.RSTM
                }

                if (code % 2 === 1) {
                    // left bracket

                    if (lastToken.type === TokenType.FUNC) {
                        if (!(code === BracCode.LRND || code === BracCode.LFNC)) {
                            console.error("Functions can only be used with round brackets");
                        }

                        code = BracCode.LFNC;
                    } else if (
                        lastToken.type === TokenType.NUM ||
                        lastToken.type === TokenType.UNKN ||
                        lastToken.type === TokenType.CNST ||
                        lastToken.type === TokenType.VAR ||
                        (lastToken.type === TokenType.BRKT && lastToken.code == BracCode.RRND)
                    ) {
                        console.error("Invalid expression.");
                    }

                    parenType.push(code);
                    final.push({ type: TokenType.BRKT, code: code });
                } else {
                    // right bracket
                    
                    const leftType = parenType.pop();
                    const rightType = matchingRight[leftType];

                    if(code === BracCode.RSTM){
                        console.log('yippee',token);
                        final.push({ type: TokenType.BRKT, code: rightType});
                    }else{
                        if (rightType === BracCode.RFNC && !(code === BracCode.RRND || code === BracCode.RFNC)) {
                            console.error("Mismatched function parenthesis");
                        }

                        final.push({ type: TokenType.BRKT, code: rightType });
                    }
                    
                }
                break;

            case TokenType.OP:
                // if(lastTokenType == TokenType.FUNC){
                //     //TODO: implement attributives as part of expression evaluation log_b(n) -> log(n,b)
                //     if(FunctionAttributiveInfo[tok] != undefined){
                //         final.push({ type: TokenType.ATT, code: FunctionAttributiveInfo[tok].code});
                //         break;
                //     }

                //     //console.error
                // }

                //TODO: attributives for large operators

                //unary- should already be inserted

                if(doEvalsAsFuncExpressions){
                    const fn = generateMethodExprForOp(token.code, tokType, false); //%%EDGE %%FUNCEXPR

                    final.push({ type: TokenType.OP, code: token.code, fnexp: fn })
                }else{
                    final.push({ type: TokenType.OP, code: token.code });
                }
                
                break;

            case TokenType.FUNC:
                console.assert(token.code !== undefined, token);

                if(doEvalsAsFuncExpressions){
                    const fn = generateMethodExprForFunc(token.code, ExpressionInfoByType[exprType].tokType, token.attributes); //%%FUNCEXPR

                    //TODO: implement attributes so that they affect the function
                    final.push({ type: TokenType.FUNC, code: token.code, fnexp: fn, attributes: token.attributes })
                }else{
                    final.push({ type: TokenType.FUNC, code: token.code, attributes: token.attributes })
                }
                break;
            
            case TokenType.DELIM:
                final.push(token);
                break;

            case TokenType.NUM:
            case TokenType.STRG:
            case TokenType.UNKN:
            case TokenType.CNST:
            case TokenType.VAR:
            default:
                if(token.type == TokenType.UNKN || token.type === TokenType.VAR){
                    if(token.type === TokenType.VAR){
                        varDependencies.push(token.code);
                    }
                    //unkowns don't get pushed with their values, because for duals & quads unknown values are set at runtime
                    final.push(token); //%%TOKEN
                    break;
                }

                var value = 0;
                switch(token.type) {
                    case TokenType.NUM: value = token.value; break;
                    case TokenType.STRG: value = token.value; break;
                    case TokenType.UNKN: value = token.value; break;
                    case TokenType.CNST: value = token.code; break;
                    case TokenType.VAR: value = 0; break;
                    default: value = null;
                }

                switch(tokType){
                    case TokenType.NUM:
                        final.push({ type: tokType, value: value}); //%%TOKEN
                        break;
                    case TokenType.QUAD:
                        final.push({ type: TokenType.QUAD, value: Array(4).fill(value), edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}}); //%%TOKEN
                        break;
                    case TokenType.DUAL:
                        final.push({ type: TokenType.DUAL, value: Array(2).fill(value), edge: [0,0,0]}); //%%TOKEN
                        break;
                }

                break;
        }

        lastToken = token;
    }

    if(exprType === ExpressionType.ASGNMT){
        return {type: exprType, var: expression.var, tokens: final, varDependencies: varDependencies};
    }

    return {type: exprType, tokens: final, varDependencies: varDependencies};
}

/**
 * Inserts implicit "*" and "u-"
 * @param {*} tokenList `String[]` input token list
 * @param {*} metaList `Int[]` input token metas
 * @param {*} type `int` Expression type
 * @returns `[String[], int[]]`
 */
// function insertImplicitOperations(tokenList, metaList, type) {
//     var lastToken = "";
//     var lastTokenType = 0;

//     var tok = "";
//     var tokType = 0;

//     var final = [];
//     var finalMeta = [];

//     //var argCountStack = [];
//     var parenType = [];

//     for (let i = 0; i < tokenList.length; i++) {
//         tok = tokenList[i];
//         tokType = metaList[i];

//         //ab     -> a*b
//         //-a     -> '-u' a
//         //(a)(b) -> (a)*(b)
//         //a(b)   -> a*(b)
//         //(a)b   -> (a)*b

//         switch (tokType) {
//             case TokenType.BRKT:
//                 //if left:
//                 //lastToken is null or operator, push token as usual
//                 //if lastToken is function
//                 //if not round, error (invalid syntax)
//                 //push to parenType, set my type to LFNC
//                 //if lastToken is number, const, var, etc
//                 //insert implicit multiplication
//                 //push token as usual with updates
//                 //else if right:
//                 //check if matching parenthesis is LFNC
//                 //if not round, error (invalid syntax)
//                 //pop from parenType, update function with argCount


//                 //left
//                 let code = BracInfo[tok];
//                 const matchingRight = {
//                     [BracCode.LRND]: BracCode.RRND,
//                     [BracCode.LSQR]: BracCode.RSQR,
//                     [BracCode.LCUR]: BracCode.RSQR,
//                     [BracCode.LFNC]: BracCode.RFNC
//                 }

//                 if (code == BracCode.LRND || code == BracCode.LSQR || code == BracCode.LCUR) {
//                     if (lastTokenType === TokenType.FUNC) {
//                         if (code !== BracCode.LRND) {
//                             console.error("Functions can only be used with round brackets");
//                         }

//                         code = BracCode.LFNC;
//                     } else if (
//                         lastTokenType === TokenType.NUM ||
//                         lastTokenType === TokenType.UNKN ||
//                         lastTokenType === TokenType.CNST ||
//                         lastTokenType === TokenType.VAR ||
//                         (lastTokenType === TokenType.BRKT && lastToken == ")")
//                     ) {
//                         final.push({ type: TokenType.OP, code: OpInfo["*"].code })
//                     }

//                     parenType.push(code);
//                     final.push({ type: TokenType.BRKT, code: code });
//                 } else {
//                     const leftType = parenType.pop();
//                     const rightType = matchingRight[leftType];

//                     if (rightType == BracCode.RFNC && code !== BracCode.RRND) {
//                         console.error("Mismatched function parenthesis");
//                     }

//                     final.push({ type: TokenType.BRKT, code: rightType });
//                 }
//                 break;
            
//             case TokenType.OP:
//                 // if(lastTokenType == TokenType.FUNC){
//                 //     //TODO: implement attributives as part of expression evaluation log_b(n) -> log(n,b)
//                 //     if(FunctionAttributiveInfo[tok] != undefined){
//                 //         final.push({ type: TokenType.ATT, code: FunctionAttributiveInfo[tok].code});
//                 //         break;
//                 //     }

//                 //     //console.error
//                 // }

//                 //TODO: attributives for large operators

//                 if (tok == "-") {
//                     if (lastToken == "") {
//                         tok = "u-";
//                     } else if (lastTokenType == TokenType.BRKT) {
//                         //or '[' or '{'
//                         if (lastToken == "(") {
//                             tok = "u-";
//                         }
//                     } else if (
//                         lastTokenType == TokenType.OP || 
//                         lastTokenType == TokenType.FUNC || 
//                         lastTokenType == TokenType.DELIM
//                     ) {
//                         tok = "u-";
//                     }
//                 }

//                 //console.log("Tok: " + tok + ", Code: " + OpInfo[tok]);

//                 if(doEvalsAsFuncExpressions){
//                     const fn = generateMethodExprForOp(OpInfo[tok].code, ExpressionInfoByType[type].tokType, false); //%%EDGE %%FUNCEXPR

//                     final.push({ type: TokenType.OP, code: OpInfo[tok].code, fnexp: fn })
//                 }else{
//                     final.push({ type: TokenType.OP, code: OpInfo[tok].code });
//                 }
                
//                 break;
            
//             case TokenType.FUNC:
//                 if(doEvalsAsFuncExpressions){
//                     const fn = generateMethodExprForFunc(FuncInfo[tok].code, ExpressionInfoByType[type].tokType, tok); //%%FUNCEXPR

//                     //TODO: implement attributes so that they affect the function
//                     final.push({ type: TokenType.FUNC, code: FuncInfo[tok].code, fnexp: fn, attributes: {} })
//                 }else{
//                     final.push({ type: TokenType.FUNC, code: FuncInfo[tok].code, attributes: {} })
//                 }
//                 break;
            
//             case TokenType.DELIM:
//                 final.push({ type: TokenType.DELIM })
//                 break;
//             case TokenType.NUM:
//             case TokenType.STRG:
//             case TokenType.UNKN:
//             case TokenType.CNST:
//             case TokenType.VAR:
//             default:
//                 //operands
//                 if (
//                     lastTokenType == TokenType.NUM ||
//                     lastTokenType == TokenType.STRG ||
//                     lastTokenType == TokenType.UNKN ||
//                     lastTokenType == TokenType.CNST ||
//                     lastTokenType == TokenType.VAR ||
//                     lastTokenType == TokenType.QUAD ||
//                     lastTokenType == TokenType.DUAL || 
//                     (lastTokenType == TokenType.BRKT && lastToken == ")") ||
//                     lastTokenType >= 10
//                 ) {
//                     final.push({ type: TokenType.OP, code: OpInfo["*"].code }); //%%TOKEN
//                     finalMeta.push(TokenType.OP);
//                 }

//                 var value = 0;
//                 switch(tokType) {
//                     case TokenType.NUM: value = parseFloat(tok); break;
//                     case TokenType.STRG: value = tok; break;
//                     case TokenType.UNKN: value = UnknownInfo[tok]; break;
//                     case TokenType.CNST: value = ConstantInfo[tok].value; break;
//                     case TokenType.VAR: value = 0; break;
//                     //default??
//                 }

//                 // if(finalMeta[finalMeta.length - 1] == TokenType.ATT){
//                 //     //last token is attributive
//                 //     //if the above is true, then the token before that is either a function or large operator

//                 //     const attributive = final.pop(); //pop attributive


//                 //     var old = final.pop();
//                 //     old.attributes[attributive.code] = value;
//                 // }

//                 if(tokType == TokenType.UNKN){
//                     //unkowns don't get pushed with their values, because for duals & quads unknown values are set at runtime
//                     final.push({ type: tokType, value: value}); //%%TOKEN
//                     break;
//                 }

//                 const evalType = ExpressionInfoByType[type].tokType;
//                 switch(evalType){
//                     case TokenType.NUM:
//                         final.push({ type: tokType, value: value}); //%%TOKEN
//                         break;
//                     case TokenType.QUAD:
//                         final.push({ type: TokenType.QUAD, value: Array(4).fill(value)}); //%%TOKEN
//                         break;
//                     case TokenType.DUAL:
//                         final.push({ type: TokenType.DUAL, value: Array(2).fill(value), edge: [0,0,0]}); //%%TOKEN
//                         break;
//                 }

//                 break;
//         }

//         //final.push(tok);
//         finalMeta.push(tokType);

//         lastToken = tok;
//         lastTokenType = tokType;
//         //could potentially cause issues since if an operation inserts then the next token's kn of its previous token will be wrong
//     }

//     return [final, finalMeta];
// }

// %%FUNCEXPR

/**
 * Generate a function expression for an operator
 * @param {*} opcode `int` operator id number
 * @param {*} tokType `int` Expression evaluation token type
 * @param {*} evalTrue `boolean` Whether to evaluate the operation exactly, or, as in the case of '=', evaluate it such that one side of the solutions are >0 and the other are <0 
 * @returns `callBack` function expression for an operator
 */
function generateMethodExprForOp(opcode, tokType, evalTrue = true){
    if(tokType == TokenType.NUM){
        if(!evalTrue){
            switch(opcode){
                case OpCode.ADD: return (a, b) => a+b; 
                case OpCode.SUB: 
                case OpCode.LT:
                case OpCode.LTE:
                case OpCode.EQ:
                    return (a, b) => a-b; 
                case OpCode.MUL: return (a, b) => a*b;
                case OpCode.DIV: return (a, b) => a/b;
                case OpCode.POW:
                case OpCode.POWN: return (a, b) => a**b;
                case OpCode.GT: 
                case OpCode.GTE: 
                case OpCode.NEQ: 
                    return (a, b) => b-a; 
                case OpCode.AND: return (a, b) => (a&&b); //todo
                case OpCode.OR: return (a, b) => (a||b); //todo
                case OpCode.XOR: return (a, b) => -a*b;
                case OpCode.NOT: return (a) => -a;
                case OpCode.FACT: return (a) => (func_gamma(a+1));
                case OpCode.NEG: return (a) => (-a);
                case OpCode.PM: return (a,b) => a;
                case OpCode.PCT: return (a) => a;
                default:
                    console.error("Unknown operator attempted to convert to function expression: ", opcode);
                    return (a,b) => 0;
            }
        }
        switch(opcode){
            case OpCode.ADD: return (a, b) => a+b;
            case OpCode.SUB: return (a, b) => (a-b);
            case OpCode.MUL: return (a, b) => (a*b);
            case OpCode.DIV: return (a, b) => (a/b);
            case OpCode.POW: 
            case OpCode.POWN: return (a, b) => a**b;
            case OpCode.LT: return (a, b) => (a<b);
            case OpCode.LTE: return (a, b) => (a<=b);
            case OpCode.GT: return (a, b) => (a>b);
            case OpCode.GTE: return (a, b) => (a>=b);
            case OpCode.EQ: return (a, b) => (a==b);
            case OpCode.NEQ: return (a, b) => (a!=b);
            case OpCode.AND: return (a, b) => (a&&b);
            case OpCode.OR: return (a, b) => (a||b);
            case OpCode.XOR: return (a, b) => (a!=b); //not logical
            case OpCode.NOT: return (a) => (!a);
            case OpCode.FACT: return (a) => (func_gamma(a+1));
            case OpCode.NEG: return (a) => (-a);
            case OpCode.PM: return (a,b) => a;
            case OpCode.PCT: return (a) => a;
            default:
                console.error("Unknown operator attempted to convert to function expression: ", opcode);
                return (a,b) => 0;
        }
    }

    const arity = OpInfoByCode[opcode].arity;
    const f = generateMethodExprForOp(opcode, TokenType.NUM, false);

    switch(tokType){
        case TokenType.DUAL:
            //console.log(arity, f)
            if(arity == 1){
                return (a) => [
                    f(a[0]), f(a[1])
                ];
            }
            return (a,b) => {
                return [
                    f(a[0], b[0]), 
                    f(a[1], b[1])
                ]};
        case TokenType.QUAD:
            if(arity == 1){
                return (a) => [
                    f(a[0]), f(a[1]), f(a[2]), f(a[3])
                ];
            }
            return (a,b) => [
                f(a[0], b[0]), 
                f(a[1], b[1]),
                f(a[2], b[2]), 
                f(a[3], b[3])
            ];
        case TokenType.ARRAY:
            if(arity == 1){
                return (a) => {
                    const n = a.length;
                    let out = [];
                    for(let i = 0; i<n; i++){
                        out.push(f(a[n]));
                    }
                    return out;
                }
            }
            return (a,b) => {
                const n = Math.max(a.length, b.length);
                let out = [];
                for(let i = 0; i<n; i++){
                    out.push(f(a[n]??0, b[n]??0));
                }
                return out;
            }
        default:
            console.log("Unknown expression evaluation token type: " + tokType);
            return {};
    }

    const fromValues = (tl, tr, bl, br) => {
        return {
            type: TokenType.QUAD, 
            value: [
                tl, tr,
                bl, br
            ],
            edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]} //%%EDGE
        }
    }

    switch(opcode){
        case OpCode.ADD:
            return (a, b) => {
                return fromValues(
                    a[0]+b[0], a[1]+b[1],
                    a[2]+b[2], a[3]+b[3]
                );
            };
        case OpCode.SUB:
            return (a, b) => {
                return fromValues(
                    a[0]-b[0], a[1]-b[1],
                    a[2]-b[2], a[3]-b[3]
                );
            };
        case OpCode.MUL:
            return (a, b) => {
                return fromValues(
                    a[0]*b[0], a[1]*b[1],
                    a[2]*b[2], a[3]*b[3]
                );
            };
        case OpCode.DIV:
            return (a, b) => {
                return fromValues(
                    a[0]/b[0], a[1]/b[1],
                    a[2]/b[2], a[3]/b[3]
                );
            };
        case OpCode.POW:
            return (a, b) => {
                return fromValues(
                    a[0]**b[0], a[1]**b[1],
                    a[2]**b[2], a[3]**b[3]
                );
            };
        case OpCode.LT:
        case OpCode.LTE: //change later
        case OpCode.EQ: //change later
            return (a, b) => {
                return fromValues(
                    a[0]-b[0], a[1]-b[1],
                    a[2]-b[2], a[3]-b[3]
                );
            };
        case OpCode.GT:
        case OpCode.GTE: //change later
        case OpCode.NEQ:
            return (a, b) => {
                return fromValues(
                    b[0]-a[0], b[1]-a[1],
                    b[2]-a[2], b[3]-a[3]
                );
            };
        case OpCode.AND:
        case OpCode.OR:
            return (a, b) => {
                return fromValues(
                    a[0]*b[0], a[1]*b[1],
                    a[2]*b[2], a[3]*b[3]
                );
            };
        case OpCode.XOR: //sign of xor(n,m) = sign of -nm (assuming 1 is true, -1 is false)
            return (a, b) => {
                return fromValues(
                    -a[0]*b[0], -a[1]*b[1],
                    -a[2]*b[2], -a[3]*b[3]
                );
            };
        case OpCode.NOT:
        case OpCode.NEG:
            return (a) => {
                return fromValues(
                    -a[0], -a[1]
                    -a[2], -a[3]
                );
            };
        case OpCode.FACT:
            return (a) => {
                return fromValues(
                    func_gamma(a[0]+1), func_gamma(a[1]+1),
                    func_gamma(a[2]+1), func_gamma(a[3]+1)
                );
            }
    }
}

// %%FUNCEXPR
/**
 * Generate a function expression for an function
 * @param {*} funccode `int` function id number
 * @param {*} tokType `int` Expression evaluation token type
 * @returns `callBack` function expression for a function
 */
function generateMethodExprForFunc(funccode, tokType, attributes){
    if(funccode === undefined){
        console.error(funccode,tokType);
        return null;
    }

    if(tokType == TokenType.NUM){
        switch (funccode) {
            case FuncCode.FRAC: return (a,b) => b/a;
            case FuncCode.SIN: return (a) => Math.sin(a);
                // return (a) => {
                //     if(a===0||isNaN(a)) return a;
                //     if(!isFinite(a))return NaN;
                //     if(a===Math.floor(a)) 
                //         return a > 0 ? 0 : -0; //sign of e
                //     let t = Math.round(2 * a), //double the number, then round that
                //         r = -0.5 * t + a, //num - (num rounded to nearest half)
                //         n = t & 2 ? -1 : 1, //if t is even, -1, else 1
                //         o = t & 1 ? Math.cos(Math.PI*r) : Math.sin(Math.PI*r); //if t is odd: cos, else sin
                //     return n*o
                // }
            case FuncCode.COS: return (a) => Math.cos(a); 
            case FuncCode.TAN: return (a) => Math.tan(a); 
            case FuncCode.SEC: return (a) => 1 / Math.cos(a); 
            case FuncCode.CSC: return (a) => 1 / Math.sin(a); 
            case FuncCode.COT: return (a) => 1 / Math.tan(a); 
            case FuncCode.ASIN: return (a) => Math.asin(a); 
            case FuncCode.ACOS: return (a) => Math.acos(a); 
            case FuncCode.ATAN: return (a) => Math.atan(a); 
            case FuncCode.ASEC: return (a) => Math.acos(1 / a); 
            case FuncCode.ACSC: return (a) => Math.asin(1 / a); 
            case FuncCode.ACOT: return (a) => Math.atan(1 / a); 
            case FuncCode.SINH: return (a) => 0.5*(Math.exp(a)-Math.exp(-a)); 
            case FuncCode.COSH: return (a) => 0.5*(Math.exp(a)+Math.exp(-a)); 
            case FuncCode.TANH: return (a) => (Math.exp(a)-Math.exp(-a))/(Math.exp(a)+Math.exp(-a));
            case FuncCode.SECH: return (a) => 2/(Math.exp(a)+Math.exp(-a)); 
            case FuncCode.CSCH: return (a) => 2/(Math.exp(a)-Math.exp(-a)); 
            case FuncCode.COTH: return (a) => (Math.exp(a)+Math.exp(-a))/(Math.exp(a)-Math.exp(-a));
            case FuncCode.ASINH: return (a) => Math.ln(a+Math.sqrt(a*a+1));
            case FuncCode.ACOSH: return (a) => Math.ln(a+Math.sqrt(a*a-1));
            case FuncCode.ATANH: return (a) => 0.5*Math.ln((1+a)/(1-a));
            case FuncCode.ASECH: return (a) => Math.ln(1/a+Math.sqrt(1/(a*a)-1));
            case FuncCode.ACSCH: return (a) => Math.ln(1/a+Math.sqrt(1/(a*a)+1));
            case FuncCode.ACOTH: return (a) => 0.5*Math.ln((a+1)/(a-1));
            case FuncCode.GD: return (a) => Math.atan(Math.sinh(a)); 
            case FuncCode.LAM: return (a) => a; 
            case FuncCode.ABS: return (a) => Math.abs(a); 
            case FuncCode.SIGN: return (a) => Math.sign(a); 
            case FuncCode.FLOOR: return (a) => Math.floor(a); 
            case FuncCode.CEIL: return (a) => Math.ceil(a); 
            case FuncCode.ROUND: return (a) => Math.round(a); 
            case FuncCode.TRUNC: return (a) => Math.trunc(a); 
            case FuncCode.MOD: return (a,b) => a % b; 
            case FuncCode.MIN: return (...a) => Math.min(...a); 
            case FuncCode.MAX: return (...a) => Math.max(...a); 
            //sum()
            //
            /* Todo: add handling for variables that are arrays */
            case FuncCode.AVG: 
                return (...args) => {
                    var sum = 0;
                    for (var i = 0; i < args.length; i++) {
                        sum += args[i];
                    }
                    return sum / args.length;
                }
                
            case FuncCode.MED:
                return (...args) => {
                    if (args.length % 2 == 1) return args[(args.length - 1) / 2];
                    else {
                        var mid = args.length / 2;
                        return args[mid - 1] + args[mid]
                    }
                }
            case FuncCode.MODE: return (a) => a; 
            case FuncCode.EXP: return (a) => Math.exp(a); 
            case FuncCode.LN: return (a) => Math.log(a); 
            case FuncCode.LOG: 
                if(attributes.get(AttributiveCode.BASE) === undefined) return (a) => Math.log(a) / Math.log(10); 
                else return (a) => Math.log(a) / Math.log(attributes.get(AttributiveCode.BASE));
            
            case FuncCode.LOGN: return (a,b) => Math.log(a) / Math.log(b); 
            case FuncCode.SQRT: return (a) => Math.sqrt(a); 
            case FuncCode.CBRT: return (a) => Math.cbrt(a); 
            case FuncCode.NTHRT: return (a,b) => Math.pow(a, 1 / b); 
            case FuncCode.GAMMA: return (a) => func_gamma(a); 
            case FuncCode.DGAMA: return (a)=>0; 
            case FuncCode.PGAMA: return (a)=>0; 
            case FuncCode.ZETA: return (a)=>0; 
            default: 
                console.error("Unknown function code", funccode);
                return ()=>0;
                break;
        }

        console.error("Program error. Should shut down");
    }

    const f = generateMethodExprForFunc(funccode, TokenType.NUM, attributes);

    //similar to in generateMethodExprForOp()
    switch(tokType){
        case TokenType.DUAL:
            return (args) => {
                const byVertex = [
                    args.map((arg) => arg[0]), 
                    args.map((arg) => arg[1])
                ];
                return [
                    f(...byVertex[0]), 
                    f(...byVertex[1])
                ]};
        case TokenType.QUAD:
            return (args) => {
                const byVertex = [0,1,2,3].map((i) => args.map((arg) => arg[i]));
                return [
                    f(...byVertex[0]), 
                    f(...byVertex[1]),
                    f(...byVertex[2]), 
                    f(...byVertex[3])
                ]};
        case TokenType.ARRAY:
            return (args) => {
                const n = Math.max(args.map((arg) => arg.length));
                let byVertex;
                let out = [];
                for(let i = 0; i<n; i++){
                    byVertex = args.map((arg) => arg[i]);
                    out.push(f(...byVertex));
                }
                return out;
            }
        default:
            console.log("Unknown expression evaluation token type: " + tokType);
            return {};
    }
}

/**
 * Translates an array of tokens from infix to postfix notation (Reverse Polish Notation)
 * @param {*} expression the expression to be evaluated in the form of `{type: int, tokens: Object[]}`
 * @returns `{type, replace, tokens}` compiled expression 
 */
export function compileExpression(expression) {
    console.assert(expression != undefined); //undefined or null

    if(expression.type === ExpressionType.BLANK){
        return {type: ExpressionType.BLANK, replace: [], tokens: []};
    }

    const type = expression.type ?? ExpressionType.IMPLICIT;
    const evalType = ExpressionInfoByType[type].tokType;

    const tokenList = expression.tokens;
    if (tokenList == undefined || tokenList.length === 0) {
        console.error("Invalid expression given. Expression blank",tokenList);
        return {type: TokenType.INVLD, varDependencies: expression.varDependencies, replace: [], tokens: []};
    }

    let outputs = []; //Array<string>
    let operators = [];
    let meta = 0; //number

    let argCountStack = []; //managing function args
    let unBracketedFuncArg = false;

    /**
     * 
     * @param {*} value Expected: {type: int, code/value: any}
     * @param {*} index
     */
    tokenList.forEach((value, index) => {
        meta = value.type;
        //popPrefixOperators(operators); // %%POPPREFIX
        switch (meta) {
            case TokenType.NUM:
            case TokenType.DUAL:
            //case TokenType.CMPLX:
            case TokenType.QUAD:
                //popPrefixOperators(operators); // %%POPPREFIX

                if(value.type !== evalType){
                    console.error("Incompatible token types. Wanted: "+evalType+", got: "+ value.type);
                }

                outputs.push(value);

                //functions without brackets surrounding their argument
                if(unBracketedFuncArg){
                    argCountStack.pop();
                    unBracketedFuncArg = false;
                }

                break;
            case TokenType.OP:
                //popPrefixOperators(operators); // %%POPPREFIX
                //console.log("value: ",value);

                //console.log("value.code = ", OpInfoByCode[value.code]);

                if(unBracketedFuncArg){
                    console.assert(operators.length > 0);
                    outputs.push(operators.pop);

                    argCountStack.pop();
                    unBracketedFuncArg = false;
                }

                const op = OpInfoByCode[value.code]
                const opPrecedence = op.precedence;
                const opAssociativity = op.associativity; // 'L' or 'R'

                while (operators.length > 0) {
                    const topOp = operators[operators.length - 1];

                    // Stop if top of stack is not an operator (e.g. left paren)
                    // TODO doesn't work on delimeters (like y=max(-x,1)) as the u- acts on the 1, interpreting as y=max(x,-1)
                    if (topOp.type != TokenType.OP) {
                        console.log("broken. Value:", value, "operatorlist:", operators[0],operators[1],operators[2]);
                        //console.log()
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
                //popPrefixOperators(operators); // %%POPPREFIX

                //check for cases like "sin x" -- functions without brackets surrounding their argument
                //does not ensure correct bracket type as in only allowing f() or f{}
                const next = tokenList[index+1];
                if(!(next.type === TokenType.BRKT && next.code % 2 === 1)){
                    if(value.argCount > 1) console.error("Multiple arguments passed to function without parenthesis");

                    unBracketedFuncArg = true;
                }

                operators.push(value);
                argCountStack.push(1); //%%FUNC
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
                    //TODO: fix for function args not in parenthesis like \frac{\sin x}{\cos x} 
                    // ...which doesn't work unless the argument in the denominator is surrounded by ()
                    // but does work for things like \sqrt{\cos x} ???

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

                    //

                    while (operators.length > 0) {
                        const topOp = operators.pop();

                        if (topOp.type == TokenType.BRKT && topOp.code == expectedLeft) {
                            if (expectedLeft == BracCode.LFNC) {
                                let funcTok = operators.pop();
                                funcTok.argCount = argCountStack.pop();

                                const funcinfo = FuncInfoByCode[funcTok.code];
                                if(funcinfo.staticArgs){
                                    console.assert(funcinfo.args === funcTok.argCount, funcinfo.args, funcTok.argCount);
                                }

                                outputs.push(funcTok);
                            }
                            break;
                        }

                        outputs.push(topOp);
                    }

                }
                break;
            case TokenType.UNKN:
            case TokenType.VAR: //unknowns and vars
                outputs.push(value); //value is replaced later with the unknowns
                //append to list of unknowns that need to be replaced

                //functions without brackets surrounding their argument
                if(unBracketedFuncArg){
                    argCountStack.pop();
                    unBracketedFuncArg = false;
                }

                break;
            case TokenType.CNST: //constants
                //value: value.value --> value: token.value
                if (value.code == ConstantCode.I) {
                    //only complex constant
                    outputs.push({ type: TokenType.CMPLX, a: 0, b: 1 }); //%%TOKEN
                }else{
                    outputs.push({ type: TokenType.NUM, value: value.value }); //%%TOKEN
                }

                //functions without brackets surrounding their argument
                if(unBracketedFuncArg){
                    argCountStack.pop();
                    unBracketedFuncArg = false;
                }
                
                break;
            // case TokenType.VAR: //variables 
            //     //NOT YET IMPLEMENTED
            //     outputs.push(value); //value is replaced in real time

            //     //functions without brackets surrounding their argument
            //     if(unBracketedFuncArg){
            //         argCountStack.pop();
            //         unBracketedFuncArg = false;
            //     }

            //     break;
            case TokenType.DELIM:
                argCountStack[argCountStack.length - 1]++; //potential error if is first token

                //Each comma behaves as a closing parenthesis except it does not pop the open parenthesis according to:
                //https://wcipeg.com/wiki/Shunting_yard_algorithm

                //pop operators to output until matching bracket found
                const matchingBrackets = {
                    [BracCode.RRND]: BracCode.LRND,
                    [BracCode.RSQR]: BracCode.LSQR,
                    [BracCode.RCUR]: BracCode.LCUR,
                    [BracCode.RFNC]: BracCode.LFNC
                }

                //Assumption that all commas are in functions
                const expectedLeft = BracCode.LFNC;
                if (expectedLeft == undefined) {
                    console.error("Unknown bracket code", value);
                    break;
                }

                while (operators.length > 0) {
                    const topOp = operators.pop();

                    if (topOp.type == TokenType.BRKT && topOp.code == expectedLeft) {
                        operators.push(topOp); //undo pop
                        break;
                    }

                    outputs.push(topOp);
                }
                break;
            case TokenType.ATT:
                break;
            default:
                console.error("Unimplemented token type in compiler: " + meta);
                break;

        }

        // console.log("------------");
        // console.log("outputs",outputs.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
        // console.log("operators",operators.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    });

    //pop remaining operators to output stack
    while (operators.length > 0) {
        outputs.push(operators.pop());
    }

    // console.log("------------");
    // console.log("outputs",outputs.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    // console.log("operators",operators.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    // console.log("------------")

    let toReplace = [];

    //final check for unknowns
    for (let i = 0; i < outputs.length; i++) {
        let element = outputs[i];
        if (element.type == TokenType.UNKN) {
            //element.code or element.value ??????
            toReplace.push({ index: i, type: TokenType.UNKN, unknownId: element.code??element.value }); //%%TOKEN
        } else if (element.type == TokenType.VAR) {
            toReplace.push({ index: i, type: TokenType.VAR, varId: element.code }); //%%TOKEN
        }
    }

    console.log(expression.tokens, "->", outputs);

    if(type === ExpressionType.ASGNMT){
        return { type: type, var: expression.var, varDependencies: expression.varDependencies, replace: toReplace, tokens: outputs };
    }

    return { type: type, varDependencies: expression.varDependencies, replace: toReplace, tokens: outputs };
}

/**
 * Evaluates `compiledExpression` according to the `input` 
 * @param {*} compiledExpression the expression to be evaluated
 * @param {*} input the input representing where the expression is evaluated, relevant for handling tokens like "x" and "y".
 * @param {*} options other expression options (unused)
 * @returns the output (which may be vary type depending on `compiledExpression.type`) or NaN if there is an error
 */
export function evaluateExpression(compiledExpression, input, options) {
    //let expressionType = compiledExpression.type;
    // console.warn('evaluating: ',compiledExpression);

    let tokenList = readExpressionWithReplacements(compiledExpression, input);
    //console.warn(tokenList);

    //console.log(tokenList);

    var solve = []; //Array<number>

    //true: solve for difference (f(x)=0)  false: solve exact
    const evaluateDiff = (compiledExpression.type == ExpressionType.IMPLICIT);
    const evalType = ExpressionInfoByType[compiledExpression.type].tokType;

    tokenList.forEach((value, index) => {
        //console.log("s->",solve.length,solve.map((s) => s.value));

        switch (value.type) {
            case TokenType.NUM:
            //case TokenType.STRG:
            case TokenType.QUAD:
            case TokenType.DUAL:
            //case TokenType.CNST: //should already be converted to number

                if(value.type !== evalType){
                    console.warn("Incompatible token types. Wanted: "+evalType+", got: "+ value.type);
                }
                //console.log('pushing: ', value);
                solve.push(value);
                break;
            case TokenType.VAR:
            case TokenType.UNKN:
                console.error(value);
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
                    //console.log(solve);
                    let arg = solve.pop();

                    //TokenType.UNKN not supported, should be quad

                    if(doEvalsAsFuncExpressions){
                        solve.push(evaluateMethodExprForUnaryOp(value, ExpressionInfoByType[compiledExpression.type].tokType, arg));
                        break;
                    }

                    if (arg.type == TokenType.NUM) {
                        solve.push({ type: TokenType.NUM, value: unaryOp(arg.value, opcode), edges: arg.edges}) //%%TOKEN
                    } else if (arg.type == TokenType.QUAD) {
                        solve.push(executeUnaryOpOnQuad(opcode, arg, arg.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]})); //%%TOKEN
                    } else if (arg.type == TokenType.CMPLX) {
                        if (opcode == OpCode.NOT || opcode == OpCode.NEG) solve.push({ type: TokenType.CMPLX, a: -arg.a, b: -arg.b }); //%%TOKEN
                        else if (opcode == OpCode.FACT) solve.push({ type: TokenType.CMPLX, a: 1, b: 1 }); //%%TOKEN
                        else solve.push({ type: TokenType.CMPLX, a: 1, b: 1 }); //%%TOKEN
                    } else {
                        console.error("Unary op performed on invalid argument type. Arg:", arg);
                    }

                    break;
                }

                //assuming opArity == 2:

                console.assert(solve.length >= 2,solve);
                //let a = null; //should cause error if used wrong
                var b = solve.pop();
                var a = solve.pop();

                //console.log("a:", a, "b:", b);
                var result = 0;

                if(doEvalsAsFuncExpressions){
                    console.assert(a !== undefined, a); 
                    console.assert(b !== undefined, b);
                    result = evaluateMethodExprForBinaryOp(value, ExpressionInfoByType[compiledExpression.type].tokType, a, b);
                    //console.log(result);
                    solve.push(result);
                    break;
                }

                if (a.type == TokenType.QUAD || b.type == TokenType.QUAD) {
                    const edges_a = a.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}; //%%TOKEN
                    const edges_b = b.edges ?? {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}; //%%TOKEN

                    result = executeBinaryOpOnQuad(opcode, a, b, edges_a, edges_b);
                }else{
                    if(a.value == undefined || b.value == undefined){
                        console.log("lack of definition",a,b);
                    }
                    result = {type: TokenType.NUM, value: binaryOp(opcode,a.value,b.value)}; //%%TOKEN
                }

                //console.log("result: ", result, "(opcode"+opcode+")");

                solve.push(result);
                
                break;
            case TokenType.FUNC:
                if (value.staticArgs) {
                    if (value.args !== value.argCount) {
                        console.error("Incorrect amount of arguments for function. Expected: " + value.args);
                    }
                }

                let args = [];
                let popCount;
                if((value.argCount ?? 0) === 0){
                    //arguments not surrounded by parenthesis
                    if(FuncInfoByCode[value.code].staticArgs === false){
                        console.error("Varied-argument functions must have their arguments surrounded by parenthesis.");
                    }

                    popCount = FuncInfoByCode[value.code].args ?? 0;
                    
                }else{
                    //arguments surrounded by parenthesis
                    popCount = value.argCount;
                }

                //console.assert(solve.length >= popCount,solve,popCount,value.argCount);

                for (let i = 0; i < popCount; i++) {
                    args.push(solve.pop());
                }
                //console.log(args);


                //TODO: replace with equation type detection 
                //const evalType = ExpressionInfoByType[compiledExpression.type].tokType;

                var result = 0;

                if(doEvalsAsFuncExpressions){
                    //console.log(value);
                    console.assert(args.length > 0,args);
                    //console.assert(args[0] !== undefined);

                    result = evaluateMethodExprForFunc(value, evalType, args, value.attributes);
                    //console.log(result);
                    // if(needQuad){
                    //     let quadargs = args.map((arg) => {
                    //         return arg.type == TokenType.QUAD ? arg.value : Array(4).fill(arg.value);
                    //     })

                    //     result = value.fnexp(...quadargs); //%%FUNCEXPR
                    // }else{
                    //     console.log("a");
                    //     result = value.fnexp(...args); //%%FUNCEXPR
                    // }

                    
                    //console.log(result);
                    solve.push(result);
                    //console.log(result);
                    break;
                }

                //console.log(args);
                //console.log(needQuad);

                //%%FIX
                if (evalType == TokenType.QUAD) {
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
                    result = executeFuncOnQuad(value.code, args, value.attributes, value.edges);
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
            default:
                console.error("Unknown token type");
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

    //console.log("s->",solve.length,solve);


    if (solve.length == 1) {
        //console.log(solve[0]);
        return solve[0];
    } else {
        console.error("Error in evaluation, final stack length: " + solve.length);
        return NaN;
    }
}

/**
 * Replaces unknowns in the expression with input values. 
 * For example, it would replace the 'y' and 'x' tokens in y=x+1 with their appropriate values based on the input 
 * @param {*} compiledExpression 
 * @param {*} input 
 * @returns 
 */
export function readExpressionWithReplacements(compiledExpression, input) {
    let toReplace = compiledExpression.replace;
    let tokenList = compiledExpression.tokens.slice(); //duplicate array

    const tokType = ExpressionInfoByType[compiledExpression.type].tokType;
    //console.log(tokType)

    let action = 0;

    if(tokType == TokenType.NUM){
        for(let i = 0; i < toReplace.length; i++){
            action = toReplace[i];

            if(action.type == TokenType.VAR){
                //redo later to add greater variety of types that a var can assume
                const evalResult = getVariable(action.varId);
                if(evalResult === undefined) console.error('variable '+ action.varId+ ' not found');

                console.assert(evalResult.type === TokenType.NUM);
                console.assert(evalResult.value !== undefined);

                console.log(evalResult);

                const token = evalResult;
                //console.log('replacing ', token);
                tokenList.splice(action.index, 1, token);
                //console.log(tokenList);
            }
        }
        return tokenList;
    }

    if(tokType == TokenType.DUAL){
        for(let i = 0; i < toReplace.length; i++){
            action = toReplace[i];

            if(action.type == TokenType.UNKN){
                //assumption: only one type of unknown, so we can just replace all instances with the same value
                let newtoken = {type: TokenType.DUAL, value: [input.min, input.max], edge: [0,0,0]}; /** @param {Number[]} input  */
                tokenList.splice(action.index, 1, newtoken);
            }
            if(action.type === TokenType.VAR){
                let newtoken = {type: TokenType.DUAL, value: [getVariable(action.varId).value, getVariable(action.varId).value], edge: [0,0,0]};
                tokenList.splice(action.index, 1, newtoken);
            }
        }
        return tokenList;
    }

    for (let i = 0; i < toReplace.length; i++) {
        action = toReplace[i];

        const newQuad = (code, tplf, tprt, btlf, btrt) => {
            return {
                type: TokenType.QUAD,
                code, code,
                value: [
                    tplf, tprt,
                    btlf, btrt
                ],
                edges: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}
            }
        }

        if (action.type == TokenType.UNKN) {

            //FIX REPEATED CODE
            var newtoken; 
            switch (action.unknownId) {
                case UnknownCode.CARTX:
                    //doesn't keep track of associated y values
                    //associated ys may be useful for multivariate functions

                    //how should i keep track of crosses? 
                    //crosses = ((input.minX > 0) == (input.maxX > 0)) ? 0 : 1;

                    newtoken = newQuad(
                        UnknownCode.CARTX,
                        input.minX, input.maxX,
                        input.minX, input.maxX
                    );

                    tokenList.splice(action.index, 1, newtoken);
                    break;
                case UnknownCode.CARTY:
                    //same comment as for CARTX

                    newtoken = newQuad(
                        UnknownCode.CARTY,
                        input.maxY, input.maxY,
                        input.minY, input.minY
                    );

                    break;
                case UnknownCode.CARTZ:
                    //only for 3d
                    newtoken = newQuad(
                        UnknownCode.CARTZ,
                        0, 0,
                        0, 0
                    );
                    break;
                case UnknownCode.POLRR:
                    newtoken = newQuad(
                        UnknownCode.POLRT,
                        Math.hypot(input.maxY, input.minX), Math.hypot(input.maxY, input.maxX),
                        Math.hypot(input.minY, input.minX), Math.hypot(input.minY, input.maxX)
                    ); 

                    break;
                case UnknownCode.POLRT:

                    newtoken = newQuad(
                        UnknownCode.POLRP,
                        Math.atan2(input.maxY, input.minX), Math.atan2(input.maxY, input.maxX),
                        Math.atan2(input.minY, input.minX), Math.atan2(input.minY, input.maxX)
                    ); 

                    
                    break;
                case UnknownCode.POLRP:
                    //only for 3d
                    
                    newtoken = newQuad(
                        UnknownCode.POLRP,
                        0, 0,
                        0, 0
                    );

                    break;
                default:
                    console.error("Unknown replacement action");
            }

            tokenList.splice(action.index, 1, newtoken);
        }else if(action.type === TokenType.VAR){
            const newtoken = newQuad(action.varId, 
                getVariable(action.varId).value,
                getVariable(action.varId).value,
                getVariable(action.varId).value,
                getVariable(action.varId).value
            );

            tokenList.splice(action.index, 1, newtoken);
        }
        //TODO: replacement for VARs 
    }

    return tokenList;
}

/**
 * 
 * @param {*} token unary operator
 * @param {*} evalType the expected token type
 * @param {*} a the 'argument' token 
 * @returns 
 */
function evaluateMethodExprForUnaryOp(token, evalType, a){
    const arg = a.value;

    const unca = a.uncertainty ?? 0;

    const unc = evaluateUnaryOpUncertainty(token.code,evalType,a,unca);

    if(token.code === OpCode.PCT){
        return {type: TokenType.NUM, value: arg/100, interpret: 'pct'};
    }

    // if(token.type != evalType){
    //     if(
    //         (evalType == TokenType.QUAD || evalType == TokenType.DUAL) &&
    //         token.type == TokenType.NUM
    //     ){
    //         arg = Array(evalType==TokenType.DUAL ? 2 : 4).fill(a.value);
    //     }
    // }

    const v = token.fnexp(arg);

    switch(evalType){
        case TokenType.NUM:
            return {type: TokenType.NUM, value: v, uncertainty: unc};
        case TokenType.QUAD:
            return {
                type: TokenType.QUAD, 
                value: v, 
                edges: handleEdgesForUnaryOp(token.code, a, a.edges)
            };
        case TokenType.DUAL:
            const e = aggregateEdges([a.edge, handleEdgePairForUnaryOp(token.code, arg[0], arg[1])]);
            return {
                type: TokenType.DUAL, 
                value: v, 
                edge: e
            };
        default:
            console.error("Unknown eval type");
            return null;
    }
}

function evaluateUnaryOpUncertainty(opcode, evalType, a, aUnc){
    if(evalType !== TokenType.NUM) return 0;

    switch(opcode){
        case OpCode.NOT:
        case OpCode.NEG:
            return aUnc;
        case OpCode.FACT:
            return aUnc;
    }
}

/**
 * 
 * @param {*} token the binary operator
 * @param {*} evalType the expected token type
 * @param {*} a left operand
 * @param {*} b right operand
 * @returns 
 */
function evaluateMethodExprForBinaryOp(token, evalType, a,b){
    const arga = a.value;
    const argb = b.value;

    const unca = a.uncertainty ?? 0;
    const uncb = b.uncertainty ?? 0;

    if(token.code === OpCode.PM){
        //console.log(a,'±',b);
        const unc = (b.interpret === 'pct') ? arga*argb : (argb+uncb);
        //console.log(unc);

        //const out = {type: TokenType.NUM, value: arga, uncertainty: unc, interpret: a.interpret ?? undefined};

        return {type: TokenType.NUM, value: arga, uncertainty: unc, interpret: a.interpret ?? undefined};
    }

    const unc = evaluateBinaryOpUncertainty(token.code,evalType,arga,unca,argb,uncb);
    //console.log(unc);

    console.assert(token.fnexp !== undefined, token);

    const v = token.fnexp(arga,argb);

    switch(evalType){
        case TokenType.NUM:
            return {
                type: TokenType.NUM, value: v, uncertainty: unc, interpret: a.interpret ?? b.interpret ?? undefined
            };
        case TokenType.QUAD:
            if(a.edges == undefined || b.edges == undefined){
                console.log("a,b:",a,b);
            }
            return {
                type: TokenType.QUAD, 
                value: v, 
                edges: handleEdgesForBinaryOp(token.code,arga,argb,a.edges,b.edges)
            };
        case TokenType.DUAL:
            //fix %%EDGES
            if(typeof a.edge != "object" || typeof b.edge != "object"){
                console.log(a,b,token.code);
            }
            return {
                type: TokenType.DUAL, 
                value: v, 
                edge: aggregateEdges([a.edge, b.edge, handleEdgePairForBinaryOp(token.code,arga[0],argb[0],arga[1],argb[1])])
            };
    }
}

function evaluateBinaryOpUncertainty(opcode, evalType, a, aUnc, b, bUnc){
    if(evalType !== TokenType.NUM) return 0;

    switch(opcode){
        case OpCode.ADD: 
        case OpCode.SUB:
        case OpCode.LT:
        case OpCode.LTE:
        case OpCode.GT:
        case OpCode.GTE:
        case OpCode.EQ:
        case OpCode.NEQ:
            return aUnc+bUnc;
        case OpCode.MUL:
        case OpCode.AND:
        case OpCode.OR:
        case OpCode.XOR:
            const v = (aUnc/a + bUnc/b);
            //console.log(v,aUnc,bUnc,a,b);
            return v*(a*b);
        case OpCode.DIV:
            return (aUnc/a + bUnc/b)*(b/a);
        case OpCode.POW:
        case OpCode.POWN:
            return Math.abs(b*aUnc/a)*(a**b);
        default:
            return 0;
    }
}

/**
 * 
 * @param {*} token the function token
 * @param {*} evalType the expected token type
 * @param {*} rawargs function arguments in the form `token[]`
 * @returns the output token
 */
function evaluateMethodExprForFunc(token, evalType, rawargs, attributes){
    console.assert(rawargs.length !== undefined, rawargs);
    const args = rawargs.map((tok) => tok.value);

    const argsUnc = rawargs.map((arg) => arg.uncertainty ?? 0);

    const unc = evaluateFuncUncertainty(token,evalType,args,argsUnc); //unneccesary evaluation of a/b for FRAC;

    const pow = attributes.get(AttributiveCode.POWER);
    //const base = token.code === FuncCode.LOG ? attributes.get(AttributiveCode.BASE) : undefined;

    let v;
    if(evalType === TokenType.NUM){
        v = token.fnexp(...args);
        if(pow !== undefined) v = v**pow;
    }else{
        v = token.fnexp(args);
        if(pow !== undefined) v=v.map((n) => n**pow);
    }

    switch(evalType){
        case TokenType.NUM:
            return {
                type: TokenType.NUM, 
                value: v,
                uncertainty: unc
            };
        case TokenType.QUAD:
            const vertex4 = [
                args.map((arg) => arg[0]),
                args.map((arg) => arg[1]),
                args.map((arg) => arg[2]),
                args.map((arg) => arg[3])
            ];
            return {
                type: TokenType.QUAD, 
                value: v, 
                edges: handleEdgesForFunc(token.code, vertex4, rawargs.map((arg) => arg.edges))
            };
        case TokenType.DUAL:
            //fix %%EDGES
            const vertex2 = [
                args.map((arg) => arg[0]),
                args.map((arg) => arg[1])
            ];
            const edgeinfo = rawargs.map((arg) => arg.edge ?? [0,0,0]);
            //console.log(edgeinfo)
            return {
                type: TokenType.DUAL, 
                value: v, 
                edge: handleEdgePairForFunc(token.code, vertex2[0], vertex2[1], edgeinfo, attributes)
            };
        default:
            console.error('Invalid eval type passed to method expr',evalType);
            break;
    }
}

function evaluateFuncUncertainty(functoken, evalType, args, argsUnc){
    const funccode = functoken.code;

    switch(funccode){
        case FuncCode.FRAC:
            return (argsUnc[0]/args[0] + argsUnc[1]/args[1])*(args[1]/args[0]); 
        case FuncCode.LN:
            return argsUnc[0]/args[0];
        case FuncCode.LOG:
            const base = functoken.attributes.get(AttributiveCode.BASE);
            if(base !== undefined){
                return argsUnc[0]/(args[0]*Math.log(base));
            }
            return argsUnc[0]/(args[0]*Math.log(10));
        default: 
            return 0;
    }
    return 0;
}

function aggregateEdges(edges){
    let crosses = 0;
    let holes = 0;
    let jumps = 0;
    for(let i = 0; i < edges.length; i++){
        //if(edges[i] == undefined) console.log(edges);
        crosses += edges[i][0];
        holes += edges[i][1];
        jumps += edges[i][2];
    }
    return [crosses,holes,jumps];
}

function aggregateQuadEdges(...quadEdges){
    //faster way to do this with bit manipulation
    let top = aggregateEdges(...(quadEdges.map((qe) => qe.top)));
    let lft = aggregateEdges(...(quadEdges.map((qe) => qe.lft)));
    let rgt = aggregateEdges(...(quadEdges.map((qe) => qe.rgt)));
    let btm = aggregateEdges(...(quadEdges.map((qe) => qe.btm)));

    return {top, lft, btm, rgt}; //shorthand
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

    if(edges_a === undefined){
        console.log("undef_a:",edges_a);
    }

    if(edges_b === undefined){
        console.log("undef_b:",b_quad);
    }

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
            if((a1 > 0) != (a2 > 0)) {crosses++; }
            if((b1 > 0) != (b2 > 0)) crosses++, jumps++, undefined = true; //holes++; 
            break;
        case OpCode.POW: 
        case OpCode.POWN:
            //  a^b
            if(a1>0 && a2 > 0){
                break;
            }
            const r1 = a1**b1;
            const r2 = a2**b2;

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
        //const diff = Math.abs(a-b);
        switch (opcode) {
            case OpCode.ADD: return a + b;
            case OpCode.SUB: return a - b;
            case OpCode.MUL: return a * b;
            case OpCode.DIV: return a / b;
            case OpCode.POW:
            case OpCode.POWN: return a**b;
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

/**
 * 
 * @param {*} funccode 
 * @param {*} args1 
 * @param {*} args2 
 * @param {*} edgeinfo 
 * @returns 
 */
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
        case FuncCode.FRAC: 
            //argsn[k] kth argument of point n

            //1st argument --> numerator
            //2nd argument --> denominator
            crosses = edgeinfo[0][0];
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];

            if((args1[0] > 0) !== (args2[0] > 0)){
                crosses++;
                holes++;
                jumps++;
            }

            if((args1[1] > 0) !== (args2[1] > 0)){
                crosses++;
                holes++;
                jumps++;
            }
            
            
            break;
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
            holes = edgeinfo[0][1] + (args1[0] < 0 != args2[0] < 0);
            jumps = edgeinfo[0][2];
            undefined = (args1[0] < 0 || args2[0] < 0);
            break;
        case FuncCode.GAMMA:
            n = Math.abs(
                Math.floor(args1[0])-Math.floor(args2[0])
            )-(
                Math.floor(Math.max(0,args1[0],args2[0])+1)
                -Math.floor(Math.max(0,Math.min(args1[0],args2[0]))+1)
            );
            crosses = edgeinfo[0][0] + n;
            holes = edgeinfo[0][1] + n;
            jumps = edgeinfo[0][2] + n;

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
        case FuncCode.FRAC: return args[0]/args[1];
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
            for (var i = 0; i < args.length; i++) {
                sum = sum + args[i];
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
        if(n-Math.floor(n) === 0) return Math.round(Math.PI / (Math.sin(Math.PI * n) * func_gamma(1 - n)));
        return Math.PI / (Math.sin(Math.PI * n) * func_gamma(1 - n));
    } else {
        n -= 1;
        let x = 0.9999999999998099;

        for (let i = 0; i < lancoszCoefficients.length; i++) {
            x += lancoszCoefficients[i] / (n + i + 1);
        }

        let t = n + lancoszCoefficients.length - 0.5;
        if(n-Math.floor(n) === 0) return Math.round(Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x);
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
