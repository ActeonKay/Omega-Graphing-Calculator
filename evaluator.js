import{
    Expression,
    getVariable, getAllVariables,
    getVariableData,
    isValidExpression
} from "./expressions.js";

import{
    generateComplexOperatorMethodExpression,
    generateComplexFunctionMethodExpression,
    convertValueToComplex
} from "./types/complexArithmetic.js"

const debug = true;
const log = (...msgs) => {if(debug) console.log(...msgs);}

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

//EVAL: num-based evaluation
//IMPLICIT: quad-based evaluation
//...F(...): dual-based evaluation
//PRMTRC: dual-based evaluation
//ASSGNMT: num-based evaluation
//FUNCDEF: quad-based evaluation

export const TokenType = {
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
    ARRAY: 17, //{type: 17, valuetype: int, value: [values], uncertainties: int[] ?? 0[] }
    TUPLE: 18, //same as array,
    DIST: 19
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

export const OpCode = {
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
    PCT: 24,
    DEG: 25,
    ABS: 26
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
    "!": { code: OpCode.FACT, precedence: 5, associativity: OpAssoc.LEFT, arity: 1 }, //suffix unary (R)
    "u-": { code: OpCode.NEG, precedence: 3, associativity: OpAssoc.RIGHT, arity: 1 }, //prefix unary (L)
    "times": { code: OpCode.CRP, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
    "\\": {code: OpCode.ATT, precedence: 101, associativity: OpAssoc.LEFT, arity: 2},
    "^n": { code: OpCode.POWN, precedence: 6, associativity: OpAssoc.RIGHT, arity: 2 }, //for things like x^2!, the x^2 should come first as it is not x^{2!}
    "_": { code: OpCode.SUBS, precedence: 6, associativity: OpAssoc.RIGHT, arity: 2},
    "±": { code: OpCode.PM, precedence: 1.5, associativity: OpAssoc.LEFT, arity: 2 },
    "pm": { code: OpCode.PM, precedence: 1, associativity: OpAssoc.LEFT, arity: 2 },
    "%": { code: OpCode.PCT, precedence: 6, associativity: OpAssoc.LEFT, arity: 1 },
    "degree": { code: OpCode.DEG, precedence: 6, associativity: OpAssoc.LEFT, arity: 1},
    "abs": { code: OpCode.ABS, precedence: 6, associativity: OpAssoc.LEFT, arity: 1},
    "times": { code: OpCode.CRP, precedence: 2, associativity: OpAssoc.LEFT, arity: 2 },
}

const OpInfoByCode = {};
for (const sym in OpInfo) {
    const info = OpInfo[sym];
    OpInfoByCode[info.code] = {
        ...info,
        symbol: sym
    };
}

const NumType = {
    NUM: 0,
    DUAL: 1,
    QUAD: 2,
    ARRAY: 3,
    TUPLE: 4,
    COMPLEX: 5
}

//value types: NUM, DUAL, QUAD, ARRAY, TUPLE, COMPLEX, MATRIX?

function toStrictOperatorCodeBinary(leftType, rightType, opcode){
    //left,right have 4 bits, opcode has 8
    const r = leftType << 12 | rightType << 8 | opcode;
    console.assert(r !== undefined, leftType, rightType, opcode);
    if(debug) (r,leftType,rightType);
    return r;
}

function toStrictOperatorCodeUnary(arg, opcode){
    //arg has 4 bits, opcode has 8
    return arg << 8 | opcode;
}

function newFuncInputInfoObject(argTypes, funccode, attributes){
    console.assert(argTypes.length > 0);

    const staticArgs = FuncInfoByCode[funccode].staticArgs;
    if(staticArgs){
        const expectedCount = FuncInfoByCode[funccode].args;
        console.assert(argTypes.length === expectedCount, argTypes, expectedCount);

        return {staticArgs: true, argTypes: argTypes, code: funccode, attributes};
    }

    //if staticArgs is false, all arguments should be of same type
    if(argTypes.length === 1) return {staticArgs: false, argTypes: argTypes, code: funccode, attributes};

    return {argTypes, code: funccode}; 
}

function toStrictOperatorCodeFunction(argTypes, opcode){
    //TODO: redo this
    console.assert(argTypes.length > 0);

    const functionInfo = FuncInfoByCode[opcode];

    if(
        functionInfo.staticArgs === false &&
        functionInfo.returnType !== TokenHandleType.REAL
    ){
        //Array/Tuple creators
    }

    if(FuncInfoByCode[opcode].staticArgs === false){
        //ASSUMPTION: array handler, either takes in many inputs or one input as an array
        if(argTypes.length === 1) {
            console.assert(argTypes[0] === TokenHandleType.ARRAY);
            return 1 << 4 | opcode;
        }

        return 2 << 4 | opcode;
    }

    if(FuncInfoByCode[opcode].args === 1){
        return argTypes[0] << 4 | opcode;
    }

    let max = 0;
    let min = 2**4-1; //ASSUMPTION: MAX OF TOKENHANDLETYPE values
    for(let i = 0; i < argTypes.length; i++){
        if(argTypes[i] > max) max = argTypes[i];
        if(argTypes[i] < min) min = argTypes[i];
    }

    return max << 8 | min << 4 | opcode;
}

export const TokenHandleType = {
    REAL: 1, //1-Dimensional values, just a number
    COMPLEX: 2, //2-dimensional number, NOT YET IMPLEMENTED
    TUPLE: 3, //any-dimensional values, operations are performed on each value and a tuple is returned
    INPUT_TUPLE: 4, //like a quad or dual; interact as tuples except for when operated with tuples; which returns a different tuple in each 'branch'
    DISTRIBUTION: 5,
    ARRAY: 6, //similar to array
    UNARY_OP: -1, //1 input (a)
    BINARY_OP: -2, //2 inputs (l,r)
    FUNCTION: -3, //n inputs (arg[0],args[1],...)
    DELIMITER: -4, //like a comma. Probably shouldn't exist
    //BOOL: 10,
}

const TokenHandleToType = {
    [TokenHandleType.REAL]: TokenType.NUM,
    [TokenHandleType.COMPLEX]: TokenType.CMPLX,
    [TokenHandleType.QUAD]: NumType.QUAD,
    [TokenType.ARRAY]: NumType.ARRAY,
    [TokenType.TUPLE]: NumType.TUPLE,
    [TokenType.CMPLX]: NumType.COMPLEX
}

export const FuncCode = {
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
    SINC: 157,
    ARRAY: 158,
    TUPLE: 159,
    BINOM: 160,
    IN: 161, //∈
    NOTIN: 162, //∉
    FACTOR: 163,
    CIS: 164,

    D_NORM: 170,
    D_BINM: 171
}

const FuncArgumentInputType = {
    ONE_REAL: 1,
    ONE_COMPLEX: 2,
    ONE_NUMERIC: 3,
    ALL_REAL: 4,
    ALL_COMPLEX: 5,
    ALL_NUMERIC: 6,
    ARRAY: 7,
    ARRAY_SOFT_REALS: 8, //accepts either an array type or a list of reals to be treated as an array
    ARRAY_SOFT_NUMBERS: 9,
    // DIST_CONTINUOUS: 10, //?? continuous distribution, like a function
    // DIST_SOFT: 11, //?? distribution types OR expressions to be treated as distributions
    // DIST_ANY: 12, //?? accepts any continuous, discrete, or expression distribution
    // SET: 13, //??
    // FIELD: 14 //like a slope/vector field
}

const FuncInfo = {
    "frac": { code: FuncCode.FRAC, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL },
    "sin": { code: FuncCode.SIN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "cos": { code: FuncCode.COS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "tan": { code: FuncCode.TAN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "sec": { code: FuncCode.SEC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "csc": { code: FuncCode.CSC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "cot": { code: FuncCode.COT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL },
    "arcsin": { code: FuncCode.ASIN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccos": { code: FuncCode.ACOS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arctan": { code: FuncCode.ATAN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arcsec": { code: FuncCode.ASEC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccsc": { code: FuncCode.ACSC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccot": { code: FuncCode.ACOT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "sinh": { code: FuncCode.SINH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "cosh": { code: FuncCode.COSH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "tanh": { code: FuncCode.TANH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "sech": { code: FuncCode.SECH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "csch": { code: FuncCode.CSCH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "coth": { code: FuncCode.COTH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arcsinh": { code: FuncCode.ASINH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccosh": { code: FuncCode.ACOSH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arctanh": { code: FuncCode.ATANH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arcsech": { code: FuncCode.ASECH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccsch": { code: FuncCode.ACSCH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "arccoth": { code: FuncCode.ACOTH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "gd": { code: FuncCode.GD, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "lam": { code: FuncCode.LAM, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "abs": { code: FuncCode.ABS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL  },
    "sign": { code: FuncCode.SIGN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "floor": { code: FuncCode.FLOOR, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "ceil": { code: FuncCode.CEIL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "round": { code: FuncCode.ROUND, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "trunc": { code: FuncCode.TRUNC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "mod": { code: FuncCode.MOD, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.REAL  },
    "min": { code: FuncCode.MIN, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS, returnType: TokenHandleType.REAL  },
    "max": { code: FuncCode.MAX, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS, returnType: TokenHandleType.REAL  },
    "avg": { code: FuncCode.AVG, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_NUMBERS, returnType: TokenHandleType.REAL  },
    "med": { code: FuncCode.MED, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS, returnType: TokenHandleType.REAL  },
    "mode": { code: FuncCode.MODE, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "exp": { code: FuncCode.EXP, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.REAL  },
    "ln": { code: FuncCode.LN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "log": { code: FuncCode.LOG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "logn": { code: FuncCode.LOGN, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.REAL  },
    "sqrt": { code: FuncCode.SQRT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.COMPLEX  },
    "cbrt": { code: FuncCode.CBRT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC, returnType: TokenHandleType.COMPLEX  },
    "nthrt": { code: FuncCode.NTHRT, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.COMPLEX  },
    "Gamma": { code: FuncCode.GAMMA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "dgama": { code: FuncCode.DGAMA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "pgama": { code: FuncCode.PGAMA, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    "zeta": { code: FuncCode.ZETA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL  },
    //"atan2": { code: FuncCode.ATAN2, staticArgs: true, args: 2, returnType: TokenHandleType.REAL  },
    "Re": { code: FuncCode.REAL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.REAL  },
    "Im": { code: FuncCode.IMAG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.REAL  },
    "conj": { code: FuncCode.CONJ, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.COMPLEX  },
    "abscp": { code: FuncCode.ABSCP, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.REAL  },
    "arg": { code: FuncCode.ARG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.REAL  },
    "ampl": { code: FuncCode.AMPL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX, returnType: TokenHandleType.REAL  },
    "sinc": { code: FuncCode.SINC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.REAL },
    "array": { code: FuncCode.ARRAY, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.ARRAY },
    "tuple": { code: FuncCode.TUPLE, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.TUPLE },
    "binom": { code: FuncCode.BINOM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.REAL },
    "factor": { code: FuncCode.FACTOR, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.ARRAY },
    "cis": { code: FuncCode.CIS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, returnType: TokenHandleType.COMPLEX  },
    "Norm": { code: FuncCode.D_NORM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.DISTRIBUTION },
    "Binm": { code: FuncCode.D_BINM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL, returnType: TokenHandleType.DISTRIBUTION }
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
    START: -1,
    END: 0,
    LRND: 1,
    RRND: 2,
    LSQR: 3,
    RSQR: 4,
    LCUR: 5,
    RCUR: 6,
    LFNC: 7,
    RFNC: 8,
    LSTM: 9, //'stem' brackets --> of unknown type but orientation
    RSTM: 10,
    LABS: 11,
    RABS: 12
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
    "right?": BracCode.RSTM,
    "left|": BracCode.LABS,
    "right|": BracCode.RABS
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
    PHI: 24,
    INFTY: 25
}

const ConstantInfo = {
    "i": { code: ConstantCode.I, value: [0,1], outputType: TokenHandleType.COMPLEX },
    "pi": { code: ConstantCode.PI, value: Math.PI, outputType: TokenHandleType.REAL },
    "e": { code: ConstantCode.EUL_NUM, value: 2.718281828459045, outputType: TokenHandleType.REAL },
    "eucon": { code: ConstantCode.EUL_CON, value: 0.577215664901532, outputType: TokenHandleType.REAL },
    "egrav": { code: ConstantCode.GRV_ERT, value: 9.80665, outputType: TokenHandleType.REAL },
    "sc": { code: ConstantCode.SOL_CON, value: 1360, outputType: TokenHandleType.REAL },
    "grav": { code: ConstantCode.GRV_CON, value: 6.67430e-11, outputType: TokenHandleType.REAL },
    "NA": { code: ConstantCode.AVO_NUM, value: 6.02214076e23, outputType: TokenHandleType.REAL },
    "gascon": { code: ConstantCode.GAS_CON, value: 8.314462618, outputType: TokenHandleType.REAL },
    "bmc": { code: ConstantCode.BZM_CON, value: 1.380649e-23, outputType: TokenHandleType.REAL },
    "sbc": { code: ConstantCode.SBM_CON, value: 5.670374419e-8, outputType: TokenHandleType.REAL },
    "culuk": { code: ConstantCode.CUL_CON, value: 8.99e9, outputType: TokenHandleType.REAL },
    "epzo": { code: ConstantCode.EPS_ZRO, value: 8.854187817e-12, outputType: TokenHandleType.REAL },
    "muzo": { code: ConstantCode.MU_ZRO, value: 1.25663706144e-6, outputType: TokenHandleType.REAL },
    "speli": { code: ConstantCode.SP_LGHT, value: 299792458, outputType: TokenHandleType.REAL },
    "plcon": { code: ConstantCode.PLK_CON, value: 6.63e-34, outputType: TokenHandleType.REAL },
    "q_e": { code: ConstantCode.Q_ELEM, value: 1.602176634e-19, outputType: TokenHandleType.REAL },
    "m_e": { code: ConstantCode.M_ELEC, value: 9.1093837015e-31, outputType: TokenHandleType.REAL },
    "m_p": { code: ConstantCode.M_PROT, value: 1.67262192369e-27, outputType: TokenHandleType.REAL },
    "m_n": { code: ConstantCode.M_NEUT, value: 1.67492749804e-27, outputType: TokenHandleType.REAL },
    "uam": { code: ConstantCode.UM_ATOM, value: 1.66053906660e-27, outputType: TokenHandleType.REAL },
    "radfer": { code: ConstantCode.RAD_FRM, value: 1.20e-15, outputType: TokenHandleType.REAL },
    "true": { code: ConstantCode.TRUE, value: true, outputType: TokenHandleType.REAL },
    "false": { code: ConstantCode.FALSE, value: false, outputType: TokenHandleType.REAL },
    "phi": { code: ConstantCode.PHI, value: 1.61803398875, outputType: TokenHandleType.REAL},
    "infty": { code: ConstantCode.INFTY, value: Infinity, outputType: TokenHandleType.REAL}
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
    AUTO_FUNC: 5
}

const FunctionAttributiveInfo = {
    "_": {code: AttributiveCode.BASE},
    "^": {code: AttributiveCode.POWER}
}

const DistributionCode = {
    NORMAL: 1,
    BINOMIAL: 2
}

const validOperators = ["+", "-", "*", "/", "^", "<", "<=", ">", ">=", "=", "!=", "&&", "||", "!", "u-", "#", "_"];

export const validFunctions = [
    "frac", "binom","factor",
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
    "Array", "Tuple", "min", "max", "avg", "median",
    "exp", "ln", "log", "logn",
    "sqrt", "cbrt", "nthrt",
    "sinc", "gamma", "zeta", "digamma", "polygamma",
    "Ei", "Ti", "Li", "erf",
    "fresnelS", "fresnelC", "Si", "Ci",
    "dawsonP", "dawsonM", "Ai",
    "conj","arg","cis",
    "Norm","Binm"
    //"sum", "integral",
    //"not", "or", "and", "xor", "bool"
];

const validConstants = [
    "true", "false",
    "pi", "eunum", "eucon", "phi",
    "egrav", "sc",
    "grav", "NA", "gascon",
    "bmc", "sbc", "culuk", "epzo", "muzo", "speli", "plcon",
    "elcharge", "elmas", "prmas", "numas", "uam",
    "radfer", "infty"
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
//{type: int, value: int, edge: [][], attributes: []}
//{type: 4bits, 64bitint / 64*4=256bit quad, edge: 4bits*3things*4edges=48bits, attributes: [pow: 64bitint, sub: 64bitint]}

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

    log("unknown string tested: ", string);
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

//         //log(lhs, ["="], rhs);

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

export function tokenizeLatexExpression(latex, oldExpression){
    console.assert(isValidExpression(oldExpression));
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
        //log("Char: ", char, "string: ", tryString, "tokens: ", tokens);

        if(char === ' '){
            //prevent tokens from including the ' ' character TODO: include other whitespace just in case
            log('whitespace');
            tryString = ' ';
            pushToken(LatexTokenType.WHITESPACE);
            continue; //go to next token
        }

        if(isCommand){
            while( !shouldCommandStop(tryString,latex.charAt(i)) && i<latex.length){
                tryString = tryString+latex.charAt(i);
                i++;
            }

            if(tryString === '\\operatorname'){
                //i++;
                console.assert(latex.charAt(i) === '{');
                //i++;

                tryString = '';
                i++;

                while(latex.charAt(i) !== '}' && i<latex.length){
                    tryString = tryString+latex.charAt(i);
                    i++;
                }

                pushToken(LatexTokenType.COMMAND);

                continue;
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
        return new Expression(
            oldExpression.id, 
            ExpressionType.BLANK, 
            new Set(), 
            oldExpression.color, 
            oldExpression.visible, 
            latex, 
            [],
            []
        );
        return {tokens: [], varDependencies: new Set(), type: ExpressionType.BLANK};
    }

    //TODO: redo this whole process. It is confusing.

    console.log('tokens: ', tokens);

    const compilerTokens = latexToTokenObjects(tokens);

    console.log('compset: ', compilerTokens);

    const typeset = getLatexExpressionType(compilerTokens);

    console.log('typset: ', typeset);

    const typesetType = typeset.type;
    const typsetTokens = typeset.tokens;
    const typesetVar = typeset.var ?? null;

    const metaData = addMetadataToExpression({type: typesetType, tokens: typsetTokens, var: typesetVar});
    console.log(metaData);

    return new Expression(
        oldExpression.id, 
        metaData.type, 
        metaData.varDependencies, 
        oldExpression.color, 
        oldExpression.visible, 
        latex, 
        metaData.tokens,
        [],
        typesetVar
    );
    //return tokens.map((tok) => tok.str);
}

/**
 * Test for if an expression is implicit, polar, explicit, etc.
 * @param {Object[]} tokens String[] of tokens
 * @returns 
 */
function getLatexExpressionType(tokens){
    const eqtoken = tokens.findIndex(
        (t) => 
            (t.type === TokenType.OP && t.code === OpCode.EQ)
    );

    //log(eqtoken, 'eqtoken');
    if(eqtoken < 0){
        //check if there aren't unknowns
        //TODO: ADD MORE ADVANCED VARIABLE CHECKING (is variable char && does variable exist)
        // if(!tokens.some((t) => t.type === TokenType.UNKN || t.type === TokenType.VAR)){
        //     log('no unknowns');
        //     return { type: ExpressionType.EVAL, tokens: tokens}; //no '=' tokens
        // }

        if(!tokens.some((t) => t.type === TokenType.UNKN)){
            console.log('no unknowns');

            const distFunc = tokens.find((t) => (t.type === TokenType.FUNC && t.attributes.get(AttributiveCode.AUTO_FUNC) !== undefined));

            if(distFunc !== undefined){
                const type = distFunc.attributes.get(AttributiveCode.AUTO_FUNC);

                console.assert(type > 1 && type < 6); //2,3,4,5 --> ?=f(?)

                return { type: distFunc.attributes.get(AttributiveCode.AUTO_FUNC), tokens: tokens};
            }

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

        //log('func of', type, tokens)
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

        //log(lhs, ["="], rhs);

        if(lhs.length === 1 && lhs[0].type === TokenType.VAR){
            const code = lhs[0].code;

            if(!rhs.some((t) => t.type === TokenType.VAR && t.code === code)){
                return {type: ExpressionType.ASGNMT, var: code, tokens: rhs}; // // // // // // // // // // // // // // // // // // VAR VAR VAR
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
                //log('function ?=rhs');
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
    if(/[0-9]|\.|[^a-zA-Z\(\)\[\]\{\}\|]/.test(next)) return true;
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
                let attributes = new Map();
                if(FuncInfo[str].returnType === TokenHandleType.DISTRIBUTION) {
                    attributes.set(AttributiveCode.AUTO_FUNC, ExpressionType.EXP_F_X);
                }

                compilerTokens.push({ type: TokenType.FUNC, code: FuncInfo[str].code, attributes: attributes }); 
                break;
            case ConstantInfo[str] !== undefined:
                const staticConstantInfo = ConstantInfo[str];

                const outputHandleType = staticConstantInfo.outputType;
                const outputType = convertToTokenType(outputHandleType, TokenType.NUM);

                console.log(staticConstantInfo.symbol, '| type:', outputType);

                compilerTokens.push({ type: outputType, value: ConstantInfo[str].value, outputType: outputHandleType }); 
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
            prev.type === TokenType.CMPLX ||
            prev.type === TokenType.UNKN ||
            prev.type === TokenType.VAR || 
            next.type === TokenType.CNST ||
            (prev.type === TokenType.BRKT && (prev.code % 2 === 0))
        ) && (
            next.type === TokenType.NUM || 
            prev.type === TokenType.CMPLX ||
            next.type === TokenType.UNKN ||
            next.type === TokenType.VAR ||
            next.type === TokenType.CNST ||
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

    const isRightBindUnaryOp = function (t){
        const info = OpInfo[t.str];
        return (info !== undefined && info.arity === 1 && info.associativity === OpAssoc.RIGHT);
    }

    const isLeftBindUnaryOp = function (t){
        const info = OpInfo[t.str];
        return (info !== undefined && info.arity === 1 && info.associativity === OpAssoc.LEFT);
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
                    prev.type === TokenType.CMPLX ||
                    prev.type === TokenType.UNKN ||
                    prev.type === TokenType.VAR ||
                    isRightBracket(latexTokens[i-1]) ||
                    (isLeftBindUnaryOp(latexTokens[i-1]) && isLeftBindUnaryOp(latexTokens[i]))
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

                    // if(op.code === OpCode.DEG){

                    // }

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

                    if(
                        !(prev.type === TokenType.OP 
                        && OpInfoByCode[prev.code].associativity === OpAssoc.LEFT
                        && OpInfoByCode[prev.code].arity === 1)
                    ){
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

                const staticConstantInfo = ConstantInfo[str];

                const outputHandleType = staticConstantInfo.outputType;
                const outputType = convertToTokenType(outputHandleType, TokenType.NUM);

                //log(staticConstantInfo.symbol, '| type:', outputType);

                const token = { type: outputType, value: ConstantInfo[str].value, outputType: outputHandleType }; 

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

                let attributes = new Map();
                if(FuncInfo[str].returnType === TokenHandleType.DISTRIBUTION) {
                    attributes.set(AttributiveCode.AUTO_FUNC, ExpressionType.EXP_F_X);
                }

                const token = { type: TokenType.FUNC, code: FuncInfo[current.str].code, attributes: attributes };

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
                    prev.type === TokenType.CMPLX ||
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
                
                const staticConstantInfo = ConstantInfo[str];

                const outputHandleType = staticConstantInfo.outputType;
                const outputType = convertToTokenType(outputHandleType, TokenType.NUM);

                //log(staticConstantInfo.symbol, '| type:', outputType);

                const token = { type: outputType, value: ConstantInfo[str].value, outputType: outputHandleType }; 

                if(!validWithPrev){
                    if(!tryInsertImplicitTimes(prev, token)){
                        throw new Error("Incorrect formatting before constant '"+str+"'.");
                    }

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

            if(code === undefined){
                throw new Error("Incorrect bracket configuration.");
            }

            console.assert(code !== undefined, current);

            if(isLeftBracket(current)){
                //left bracket: (
                const validWithPrev = (
                    prev.type === TokenType.OP || 
                    prev.type === TokenType.FUNC || 
                    isLeftBracket(latexTokens[i-1]) ||
                    prev.type === TokenType.DELIM
                );
                const token = { type: TokenType.BRKT, code: code };

                if(!validWithPrev){
                    if(!tryInsertImplicitTimes(prev, token)){
                        throw new Error("Incorrect formatting before '('.");
                    }

                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }else{
                //right bracket: )
                const validWithPrev = (
                    prev.type === TokenType.NUM ||
                    prev.type === TokenType.CMPLX ||
                    prev.type === TokenType.UNKN || 
                    prev.type === TokenType.VAR ||
                    isRightBracket(latexTokens[i-1]) || 
                    (prev.type === TokenType.OP && (OpInfoByCode[prev.code].arity===1 && OpInfoByCode[prev.code].associativity === OpAssoc.LEFT))
                );
                const token = { type: TokenType.BRKT, code: code };

                if(!validWithPrev){
                    if(!tryInsertImplicitTimes(prev, token)){
                        throw new Error("Incorrect formatting before ')'.");
                    }

                    compilerTokens.push({ type: TokenType.OP, code: OpCode.MUL });
                }

                compilerTokens.push(token);
                continue;
            }
        }
    }

    return compilerTokens;
}

function addMetadataToExpression(expression){
    let tokens = expression.tokens;
    let exprType = expression.type;

    let tokType = ExpressionInfoByType[exprType].tokType; //change system later
    let lastToken = {};

    let parenType = [];

    let final = [];

    let varDependencies = new Set();

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
                    [BracCode.LSTM]: BracCode.RSTM,
                    [BracCode.LABS]: BracCode.RABS
                }

                if (code % 2 === 1) {
                    // left bracket

                    if (lastToken.type === TokenType.FUNC) {
                        if (!(code === BracCode.LRND || code === BracCode.LFNC || code === BracCode.LABS)) {
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

                    // if(code === BracCode.RABS) {
                    //     final.push({ type: TokenType.BRKT, code: code});
                    //     break;
                    // }

                    if(code === BracCode.RSTM){
                        //log('yippee',token);
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
                    //const fn = generateMethodExprForOp(token.code, tokType, false); //%%EDGE %%FUNCEXPR

                    final.push({ type: TokenType.OP, code: token.code })
                }else{
                    final.push({ type: TokenType.OP, code: token.code });
                }
                
                break;

            case TokenType.FUNC:
                console.assert(token.code !== undefined, token);

                if(doEvalsAsFuncExpressions){
                    //TODO: implement attributes so that they affect the function
                    final.push({ type: TokenType.FUNC, code: token.code, attributes: token.attributes })
                }else{
                    final.push({ type: TokenType.FUNC, code: token.code, attributes: token.attributes })
                }
                break;
            
            case TokenType.DELIM:
                final.push(token);
                break;

            case TokenType.NUM:
            case TokenType.CMPLX:
            case TokenType.STRG:
            case TokenType.UNKN:
            case TokenType.CNST:
            case TokenType.VAR:
            default:
                if(token.type == TokenType.UNKN || token.type === TokenType.VAR){
                    if(token.type === TokenType.VAR){
                        varDependencies.add(token.code);
                    }
                    //unkowns don't get pushed with their values, because for duals & quads unknown values are set at runtime
                    final.push(token); //%%TOKEN
                    break;
                }

                final.push(token);
                break;

                // var value = 0;
                // switch(token.type) {
                //     case TokenType.NUM: value = token.value; break;
                //     case TokenType.STRG: value = token.value; break;
                //     case TokenType.UNKN: value = token.value; break;
                //     case TokenType.CNST: value = token.code; break;
                //     case TokenType.VAR: value = 0; break;
                //     default: value = null;
                // }

                // switch(tokType){
                //     case TokenType.NUM:
                //         final.push({ type: tokType, value: value}); //%%TOKEN
                //         break;
                //     case TokenType.QUAD:
                //         final.push({ type: TokenType.QUAD, value: Array(4).fill(value), edge: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]}}); //%%TOKEN
                //         break;
                //     case TokenType.DUAL:
                //         final.push({ type: TokenType.DUAL, value: Array(2).fill(value), edge: [0,0,0]}); //%%TOKEN
                //         break;
                // }

                // break;
        }

        lastToken = token;
    }

    // return new Expression(
    //     expression.id ?? 0, 
    //     exprType, 
    //     varDependencies, 
    //     expression.color ?? 'black', 
    //     expression.visible ?? true, 
    //     expression.latex, 
    //     final,
    //     [],
    //     exprType === ExpressionType.ASGNMT ? expression.var : null
    // );

    if(exprType === ExpressionType.ASGNMT){
        return {type: exprType, var: expression.var, tokens: final, varDependencies: varDependencies};
    }

    return {type: exprType, tokens: final, varDependencies: varDependencies};
}

function generateStrictMethodExprForOp(strictOpCode, evalType){
    //TODO: add interpretation for functions
    const opId = strictOpCode & 0b11111111; //rightmost 8 digits
    const right = strictOpCode >> 8 & 0b1111;
    const left = strictOpCode >> 12 & 0b1111;

    console.log(strictOpCode, '=>', opId, right, left);

    if(OpInfoByCode[opId].arity === 1){
        console.log('unary:'+right);

        if(opId === OpCode.PCT){
            return (a) => { 
                console.assert(a.type === TokenType.NUM);

                //log()

                return {type: TokenType.NUM, value: a.value*0.01, uncertainty: 0.01*(a.uncertainty??0), interpret: 'pct', outputType: TokenHandleType.REAL }; 
            }
        }

        if(opId === OpCode.DEG){
            return (a) => { 
                console.assert(a.type === TokenType.NUM);

                const k = a.value*0.01745329251;
                console.log(k);

                return {type: TokenType.NUM, value: k, uncertainty: 0.01745329251*(a.uncertainty??0), interpret: 'rad', outputType: TokenHandleType.REAL }; 
            }
        }

        // if(opId === OpCode.ABS){
        //     if(right === TokenHandleType.REAL) return (a) => {return {type: TokenType.NUM, value: Math.abs(a.value), edge: a.edge, outputType: TokenHandleType.REAL}; };

        //     const fnComplex = generateComplexOperatorMethodExpression(opId);

        //     return (a) => {
        //         return {type: TokenType.NUM, value: fnComplex(a.value), edge: a.edge, outputType: TokenHandleType.REAL};
        //     }
        // }

        switch(right){
            case TokenHandleType.REAL:
                const fn = generateRealOperatorMethodExpression(opId);
                return (a) => { return {type: TokenType.NUM, value: fn(a.value), uncertainty: evaluateUnaryOpUncertainty(opId, TokenType.NUM,a.value,a.uncertainty??0), outputType: TokenHandleType.REAL};}
                break;
            case TokenHandleType.COMPLEX:
                const fnComplex = generateComplexOperatorMethodExpression(opId);
                return (a) => {
                    return {type: TokenType.CMPLX, value: fnComplex(a.value), outputType: TokenHandleType.COMPLEX};
                }
                break;
            case TokenHandleType.INPUT_TUPLE:
                const fnTuple = generateRealOperatorMethodExpression(opId);
                const handleEdge = evalType === TokenType.DUAL 
                    ? (a) => handleEdgePairForUnaryOp(opId,a.value[0],a.value[1])
                    : (a) => handleEdgesForUnaryOp(opId,a.value,a.edge);
                
                return (a) => {
                    return {
                        type: a.type, 
                        value: a.value.map((val) => fnTuple(val)), 
                        edge: handleEdge(a),
                        outputType: TokenHandleType.TUPLE
                    };
                };
                break;
            default:
                console.error('Unary op could not be applied to token handle type: ' + right);
                return (a) => (a);
        }
    }

    console.log(OpInfoByCode[opId].arity);

    //same type:
        //case real/real
        //case complex/complex
        //case input+input         -|
        //case tuple/tuple          |- op on corresponding elements (list)
        //case realArray/realArray -| 
        //case bool/bool
    //different types:
        //case real/list
        //case complex/list
        //case input/list
        //case real/complex
        //case input/real
        //case input/complex

    if(left === right && left !== TokenHandleType.TUPLE){
        const fn = generateRealOperatorMethodExpression(opId);

        if(opId === OpCode.PM){
            const c = generateOperatorMethodExpressionBetweenSoloTypes(opId, left, right,evalType);
            console.log(c);
            return c;
        }

        switch(left){
            case TokenHandleType.REAL:
                return (tokenA,tokenB) => {
                    const unc = evaluateBinaryOpUncertainty(opId, TokenType.NUM, tokenA.value, tokenA.uncertainty??0, tokenB.value, tokenB.uncertainty??0);
                    return {type: TokenType.NUM, value: fn(tokenA.value, tokenB.value), outputType: TokenHandleType.REAL, uncertainty: unc};
                }
            case TokenHandleType.COMPLEX:
                const fnComplex = generateComplexOperatorMethodExpression(opId);
                return (tokenA,tokenB) => {
                    return {type: TokenType.CMPLX, value: fnComplex(tokenA.value, tokenB.value), outputType: TokenHandleType.COMPLEX};
                }
            case TokenHandleType.INPUT_TUPLE:
                return generateOperatorMethodExpressionBetweenSoloTypes(opId,left,right,evalType);

                const edgeHandler = evalType === TokenType.QUAD 
                    ? (a,b) => handleEdgesForBinaryOp(opId, a.value, b.value, a.edge, b.edge)
                    : (a,b) => handleEdgePairForBinaryOp(opId, a.value[0],b.value[0],a.value[1],b.value[1]);

                return (tokenA,tokenB) => {
                    const n = tokenA.value.length;
                    const results = [];
                    for(let i = 0; i < n; i++){
                        results.push(fn(tokenA.value[i],tokenB.value[i]));
                    }
                    return {type: tokenA.type, value: results, edge: edgeHandler(tokenA, tokenB) };
                }
            case TokenHandleType.TUPLE:
            case TokenHandleType.ARRAY:
                return (tokenA, tokenB) => {
                    const n = Math.min(tokenA.value.length, tokenB.value.length);
                    const results = [];
                    for(let i=0; i<n; i++){
                        results.push(fn(tokenA.value[i],tokenB.value[i]));
                    }
                    return {type: tokenA.type, value: results};
                }
            //case TokenHandleType.BOOL:
        }

    }

    if(left === TokenHandleType.ARRAY){
        console.log('left=list');

        switch(right){
            case TokenHandleType.REAL:
                console.log('right=real');
                const fn = generateRealOperatorMethodExpression(opId);

                return (tokenA,tokenB) => {
                    console.assert(tokenA.type === TokenType.ARRAY);

                    const real = tokenB.value;

                    //list a, real b
                    const n = tokenA.value.length;
                    let results = [];
                    for(let i = 0; i < n; i++){
                        results.push(fn(tokenA.value[i],real));
                    }
                    return {type: tokenA.type, value: results}; //TODO: finish later with outputType and other fields
                }
                break;
            case TokenHandleType.COMPLEX:
                const fnComplex = generateComplexOperatorMethodExpression(opId);

                return (tokenA,tokenB) => {
                    console.assert(tokenA.type === TokenType.ARRAY);

                    const complex = tokenB.value;

                    let results = [];

                    if(typeof tokenA.value[0] === 'number'){
                        //tokenA is of type Real[]
                        const n = tokenA.value.length;

                        for(let i = 0; i < n; i++){
                            results.push(fnComplex([tokenA.value[i], 0],complex));
                        }
                    }else{
                        //tokenA is of type Complex[]
                        const n = tokenA.value.length;

                        for(let i = 0; i < n; i++){
                            results.push(fnComplex(tokenA.value[i],complex));
                        }
                    }

                    return {type: tokenA.type, value: results}; //TODO: finish later with outputType and other fields
                }
                break;
            case TokenHandleType.INPUT_TUPLE:

                return (tokenA, tokenB) => {
                    if(tokenA.type !== TokenType.ARRAY){

                    }

                    //check for if list item is input type
                    const itemHandleType = typeof tokenA.value[0] === 'number' ? TokenHandleType.REAL : TokenHandleType.COMPLEX;

                    const fn = generateOperatorMethodExpressionBetweenSoloTypes(opId,itemHandleType,right,evalType);

                    const input = tokenB.values;

                    const edgeHandler = evalType === TokenType.QUAD 
                        ? (a,b) => handleEdgesForBinaryOp(opId, a.value, b.value, a.edge, b.edge)
                        : (a,b) => handleEdgePairForBinaryOp(opId, a.value[0],b.value[0],a.value[1],b.value[1]);

                    //list a, input b
                    const n = tokenA.value.length;
                    let results = [];
                    for(let i=0; i<n; i++){
                        //do op on each of the elements in the input

                        results.push(fn())

                    }
                }
                //should return list of input tuples
        }
    }  

    if(right === TokenHandleType.ARRAY){
        console.log('right=list');

        switch(left){
            case TokenHandleType.REAL:
                const fn = generateRealOperatorMethodExpression(opId);

                return (tokenB,tokenA) => {
                    //tokenB -> real
                    //tokenA -> list

                    console.assert(tokenA.type === TokenType.ARRAY);

                    const real = tokenB.value;

                    //list a, real b
                    const n = tokenA.value.length;
                    let results = [];
                    for(let i = 0; i < n; i++){
                        results.push(fn(tokenA.value[i],real));
                    }

                    return {type: TokenType.ARRAY, value: results, outputType: TokenHandleType.ARRAY, elementType: TokenType.NUM};
                }
                break;
            case TokenHandleType.COMPLEX:
                let fnComplex = generateComplexOperatorMethodExpression(opId);

                return (tokenB,tokenA) => {
                    console.assert(tokenA.type === TokenType.ARRAY);

                    const input = tokenA.value;

                    const complex = tokenB.value;

                    let results = [];

                    const elementType = typeof input[0] === 'number' ? TokenType.NUM : TokenType.CMPLX;

                    if(elementType === TokenType.NUM){
                        //tokenA is of type Real[]
                        console.log('real list');

                        const n = input.length;

                        for(let i = 0; i < n; i++){
                            const k = fnComplex(complex,[input[i], 0]);
                            log(k)
                            results.push(k);
                        }
                    }else{
                        console.log('complex list');
                        //tokenA is of type Complex[]
                        const n = input.length;

                        for(let i = 0; i < n; i++){
                            results.push(fnComplex(complex,input[i]));
                        }
                    }

                    return {type: TokenType.ARRAY, value: results, outputType: TokenHandleType.ARRAY, elementType: TokenType.CMPLX};
                }
                break;
            case TokenHandleType.INPUT_TUPLE:
                console.log('left=input');
                return (tokenB, tokenA) => {
                    console.assert(tokenA.type === TokenType.ARRAY);

                    //check for if list item is input type
                    const itemHandleType = typeof tokenA.value[0] === 'number' ? TokenHandleType.REAL : TokenHandleType.COMPLEX;

                    const fn = generateOperatorMethodExpressionBetweenSoloTypes(opId,itemHandleType,right,evalType);

                    const input = tokenB.values;

                    const edgeHandler = evalType === TokenType.QUAD 
                        ? (a,b) => handleEdgesForBinaryOp(opId, a.value, b.value, a.edge, b.edge)
                        : (a,b) => handleEdgePairForBinaryOp(opId, a.value[0],b.value[0],a.value[1],b.value[1]);

                    //list a, input b
                    const n = tokenA.value.length;
                    let results = [];
                    for(let i=0; i<n; i++){
                        //do op on each of the elements in the input

                        r//esults.push(fn())
                    }
                }
                //should return list of input tuples
        }
    }  

    if(left === TokenHandleType.TUPLE || right === TokenHandleType.TUPLE){
        const fn = generateOperatorMethodExpressionBetweenTuples(opId,left,right);
        const returnHandleType = ((opId === OpCode.MUL) && (left === right)) ? TokenHandleType.REAL : TokenHandleType.TUPLE;
        const returnType = returnHandleType === TokenHandleType.TUPLE ? TokenType.TUPLE : TokenType.NUM;

        return (a,b) => {
            return {
                type: returnType,
                value: fn(a.value,b.value),
                outputType: returnHandleType
            };
        }
    }
    
    console.log('between solo types',left,right);
    return generateOperatorMethodExpressionBetweenSoloTypes(opId,left,right,evalType);
}

function generateOperatorMethodExpressionBetweenTuples(opcode, left, right){
    log('tuple op');
    if(left === right){
        log('both tuples');

        switch(opcode){
            case OpCode.ADD: return tupleAdd;
            case OpCode.SUB: return tupleSubtract;
            case OpCode.MUL: return tupleDotProduct;
            case OpCode.CRP: return tupleCrossProduct;
            default: 
                console.error('Invalid Tuple operation: ', opcode);
                return (a,b) => [0,0];
        }
    }

    if(left === TokenHandleType.TUPLE){
        switch(opcode){
            case OpCode.MUL: return (t,s) => tupleScale(t,s);
            case OpCode.DIV: return (t,s) => tupleScale(t,1/s);
            default: 
                console.error('Invalid Tuple operation: ', opcode);
        }
    }

    if(right === TokenHandleType.TUPLE){
        switch(opcode){
            case OpCode.MUL: return (s,t) => tupleScale(t,s);
            default: 
                console.error('Invalid Tuple operation: ', opcode);
        }
    }

    console.error('Invalid type attempted to operate as Tuple.');
}

/**
 * 
 * @param {*} opcode 
 * @param {*} left 
 * @param {*} right 
 * @returns 
 */
function generateOperatorMethodExpressionBetweenSoloTypes(opcode,left,right,evalType){
    if(left === TokenHandleType.INPUT_TUPLE){
        console.log('left=tuple');
        switch(right){
            case TokenHandleType.INPUT_TUPLE:
                if(true){
                    //Assumption that elements of the tuple are real numbers
                    console.log('right=tuple',evalType);
                    const fn = generateRealOperatorMethodExpression(opcode);

                    const edgeHandler = evalType === TokenType.QUAD 
                        ? (a,b) => handleEdgesForBinaryOp(opcode, a.value, b.value, a.edge, b.edge)
                        : (a,b) => handleEdgePairForBinaryOp(opcode, a.value[0],b.value[0],a.value[1],b.value[1]);

                    return (tokenA,tokenB) => {
                        

                        let results = [];
                        const n = tokenA.value.length;
                        for(let i=0; i<n; i++){
                            results.push(fn(tokenA.value[i],tokenB.value[i]));
                        }
                        return {type: tokenA.type, value: results, edge: edgeHandler(tokenA,tokenB), outputType: TokenHandleType.INPUT_TUPLE};
                    }
                }

                const fnComplex = generateComplexOperatorMethodExpression(opcode);

                return (a,b) => {
                    const aComplex = typeof a.value[0] === 'number' ? [a.value.map((r) => [r,0])] : a;
                    const bComplex = typeof b.value[0] === 'number' ? [b.value.map((r) => [r,0])] : b;

                    const edgeData = tokenA.type === TokenType.QUAD 
                    ? {top: [0,0,0], lft: [0,0,0], btm: [0,0,0], rgt: [0,0,0]}
                    : [0,0,0]; //how to handle for complex values?

                    let results = [];
                    for(let i=0; i<n; i++){
                        results.push(fnComplex(aComplex[i],bComplex[i]));
                    }
                    return {type: a.type, value: results, edge: edgeData};
                }

                break;
            case TokenHandleType.REAL:
                const fn = generateRealOperatorMethodExpression(opcode);

                return (a,b) => {
                    const input = a.value;
                    const n = input.length;

                    const real = b.value;

                    let results = [];
                    for(let i=0; i<n; i++){
                        results.push(fn(input[i],real));
                    }
                    return {type: a.type, value: results, edge: a.edge};
                }
                break;
            case TokenHandleType.COMPLEX:
                return (a,b) => {
                    console.assert(a.type === TokenType.ARRAY);

                    const complex = b.value;
                    let results = [];

                    if(typeof a.value[0] === 'number'){
                        //a is of type Real[]
                        const n = a.value.length;
                        for(let i = 0; i < n; i++){
                            results.push(fnComplex([a.value[i], 0],complex));
                        }
                    }else{
                        //a is of type Complex[]
                        const n = a.value.length;
                        for(let i = 0; i < n; i++){
                            results.push(fnComplex(a.value[i],complex));
                        }
                    }
                    return {type: a.type, value: results, edge: a.edge};
                }
                break;
            default:
                console.error('Unknown solo type encountered when generating method expression. Problem token: ',tokenB);
                return (a,b) => a;
        }
    }

    if(right === TokenHandleType.INPUT_TUPLE){
        console.log('right=tuple');
        switch(left){
            case TokenHandleType.REAL:
                console.log('left=real');
                const fn = generateRealOperatorMethodExpression(opcode);

                console.log(fn);

                const k = (b,a) => {
                    const input = a.value;
                    const n = input.length;
                    const real = b.value;
                    let results = [];
                    for(let i=0; i<n; i++){
                        results.push(fn(real,input[i]));
                    }

                    //log(input,real,'=>',results);

                    return {
                        type: a.type, 
                        value: results, 
                        edge: a.edge,
                        outputType: TokenHandleType.INPUT_TUPLE 
                    };
                }

                console.log(k);
                return k;
                break;
            case TokenHandleType.COMPLEX:
                return (b,a) => {
                    console.assert(a.type === TokenType.ARRAY);

                    const complex = b.value;

                    if(typeof a.value[0] === 'number'){
                        //a is of type Real[]
                        const n = a.value.length;
                        let results = [];
                        for(let i = 0; i < n; i++){
                            results.push(fnComplex([a.value[i], 0],complex));
                        }
                        return results;
                    }else{
                        //a is of type Complex[]
                        const n = a.value.length;
                        let results = [];
                        for(let i = 0; i < n; i++){
                            results.push(fnComplex(a.value[i],complex));
                        }
                        return results;
                    }
                }
                break;
        }
    }

    if(left === TokenHandleType.COMPLEX || right === TokenHandleType.COMPLEX){
        const fnComplex = generateComplexOperatorMethodExpression(opcode);

        console.log(fnComplex);

        return (a,b) => {
            const aComplex = typeof a.value === 'number' ? [a.value, 0] : a.value;
            const bComplex = typeof b.value === 'number' ? [b.value, 0] : b.value;

            const r = {type: TokenType.CMPLX, value: fnComplex(aComplex,bComplex), outputType: TokenHandleType.COMPLEX};

            console.log(aComplex,bComplex,r);

            return r;
        }
    }

    const fn = generateRealOperatorMethodExpression(opcode);

    if(opcode === OpCode.PM){
        return (a,b) => {
            return {
                type: TokenType.NUM, 
                value: a.value, 
                outputType: TokenHandleType.REAL, 
                uncertainty: b.interpret === 'pct' 
                    ? (b.value + (b.uncertainty ?? 0)) * (a.value + (a.uncertainty ?? 0))
                    : b.value + (a.uncertainty ?? 0) + (b.uncertainty ?? 0)
            }; 
        }
    }

    console.assert(left === TokenHandleType.REAL && right === TokenHandleType.REAL, left, right);

    return (a,b) => {
        const unc = evaluateBinaryOpUncertainty(opcode, TokenType.NUM, a.value, a.uncertainty??0, b.value, b.uncertainty ?? 0);
        const r= {type: TokenType.NUM, value: fn(a,b), outputType: TokenHandleType.REAL, uncertainty: unc};
        console.log(r);
        return r;
    }

}

function generateRealOperatorMethodExpression(opcode,evaluateDiff=true){
    if(evaluateDiff){
        switch(opcode){
            case OpCode.LT: return (a, b) => b-a;
            case OpCode.LTE: return (a, b) => b-a;
            case OpCode.GT: return (a, b) => a-b;
            case OpCode.GTE: return (a, b) => a-b;
            case OpCode.EQ: return (a, b) => a-b;
            case OpCode.NEQ: return (a, b) => b-a;
            case OpCode.AND: return (a, b) => (a&&b) ? 1 : -1;
            case OpCode.OR: return (a, b) => (a||b) ? 1 : -1;
            case OpCode.XOR: return (a, b) => (a!=b) ? 1 : -1;
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
        // case OpCode.DPR: return (a,b) => tupleDotProduct(a,b);
        // case OpCode.CRP: return (a,b) => tupleCrossProduct(a,b);
        case OpCode.PM: return (a,b) => a;
        case OpCode.PCT: return (a) => 0.01*a;
        case OpCode.ABS: return (a) => Math.abs(a);
        default:
            console.error("Unknown operator attempted to convert to function expression: ", opcode);
            return (a,b) => 0;
    }
}

/**
 * 
 * @param {*} functionInfo {staticArgs: bool, argTypes: array, code: int};
 * @param {*} evalType 
 */
function generateStrictMethodExprForFunc(funcInputInfo, evalType){
    const funccode = funcInputInfo.code;
    const argTypes = funcInputInfo.argTypes;

    const staticFuncInfo = FuncInfoByCode[funccode];
    const inputType = staticFuncInfo.inputType;

    //console.log('inp type:',inputType);

    //if input is just one real/complex, then check for

    let fn;
    var returnHandleType = outputTypeOfFunction(funccode,argTypes);
    var returnType = convertToTokenType(returnHandleType, evalType); 

    switch(inputType){
        case FuncArgumentInputType.ONE_REAL:
        case FuncArgumentInputType.ONE_COMPLEX:
        case FuncArgumentInputType.ONE_NUMERIC:
            console.assert(argTypes.length === 1);
            console.log('one r/c/n',argTypes);

            fn = 
                (inputType === FuncArgumentInputType.ONE_REAL) 
                ? generateRealFunctionMethodExpression(funccode,funcInputInfo) 
                : generateComplexFunctionMethodExpression(funccode,funcInputInfo);

            console.log(fn,inputType);

            switch(argTypes[0]){
                case TokenHandleType.REAL:
                    console.log('real input');

                    console.assert(inputType === FuncArgumentInputType.ONE_REAL || inputType === FuncArgumentInputType.ONE_NUMERIC, inputType);

                    //ONE_NUMERIC have both real- and complex-defined functions (sin(x) vs. sin(z))
                    if(inputType === FuncArgumentInputType.ONE_NUMERIC){
                        fn = generateRealFunctionMethodExpression(funccode,funcInputInfo);
                        returnType = TokenType.NUM;
                        returnHandleType = TokenHandleType.REAL;
                    }

                    return (args) => {
                        const result = fn(args[0].value);
                        return {
                            type: returnType,
                            value: result,
                            outputType: returnHandleType,
                            uncertainty: evaluateFuncUncertainty(args[0],evalType,[args[0]],[args[0].uncertainty??0],result)
                        }
                    }
                case TokenHandleType.COMPLEX:
                    console.log('complex input');

                    return (args) => {
                        const result = fn(args[0].value);

                        return {
                            type: returnType,
                            value: result,
                            outputType: returnHandleType
                        }
                    }
                case TokenHandleType.INPUT_TUPLE:
                    console.log('tuple input');
                    if(inputType === FuncArgumentInputType.ONE_NUMERIC){
                        fn = generateRealFunctionMethodExpression(funccode,funcInputInfo);
                    }

                    return (args) => {
                        const arg = args[0];
                        const input = arg.value;
                        const n = input.length;

                        //console.log(input);

                        let results = []; //Can assume real values
                        for(let i=0; i<n; i++){
                            results.push(fn(input[i]));
                        }

                        console.assert(arg.edge !== undefined, arg);
                        console.assert(typeof input[0] === 'number' && !isNaN(input[0]), input[0]);
                        console.assert(typeof input[1] === 'number' && !isNaN(input[1]), input[1]);
                        //console.assert(typeof arg.edge === 'number' && !isNaN(arg.edge), arg.edge);

                        const edge = 
                            (args[0].type === TokenType.QUAD) 
                            ? handleEdgesForFunc(funccode, [[input[0]],[input[1]],[input[2]],[input[3]]], [arg.edge])
                            : handleEdgePairForFunc(funccode, [input[0]], [input[1]], [arg.edge]);

                        //log(edge,args[0].type === TokenType.NUM);

                        return {
                            type: arg.type,
                            value: results,
                            outputType: TokenHandleType.INPUT_TUPLE,
                            edge: edge
                        };
                    }
                case TokenHandleType.ARRAY:
                    return (args) => {
                        const input = args[0].value;
                        const n = input.length;

                        console.log(input);

                        let results = []; //TODO: add array/tuple element type checking
                        if(typeof input[0] === 'number'){
                            fn = generateRealFunctionMethodExpression(funccode,funcInputInfo);

                            //entire array is num type
                            console.log('numtype',n);
                            for(let i=0; i<n; i++){
                                console.log('i:',i);
                                const r = fn(input[i]);
                                console.log(r);
                                results.push(r);
                            }
                        }else{
                            console.log('comptype');
                            //entire array is complex type
                            console.assert(inputType !== FuncArgumentInputType.ONE_REAL);
                            for(let i=0; i<n; i++){
                                results.push(fn(input[n]));
                            }
                        }

                        return {
                            type: args[0].type,
                            value: results,
                            outputType: args[0].outputType
                        };
                    }
                    
                case TokenHandleType.TUPLE:
                    console.error('Invalid input type (Tuple) for function: ', FuncInfoByCode[funccode].symbol);
                    return (a) => 0;
            }
            break;

        case FuncArgumentInputType.ARRAY_SOFT_REALS:
        case FuncArgumentInputType.ALL_REAL:
        case FuncArgumentInputType.ARRAY_SOFT_NUMBERS:
        case FuncArgumentInputType.ALL_COMPLEX:
        case FuncArgumentInputType.ALL_NUMERIC:
            console.log('func: all numeric/complex',funcInputInfo);

            fn = 
                (inputType === FuncArgumentInputType.ARRAY_SOFT_REALS || inputType === FuncArgumentInputType.ALL_REAL) 
                ? generateRealFunctionMethodExpression(funccode,funcInputInfo) 
                : generateComplexFunctionMethodExpression(funccode,funcInputInfo);

            // if input and expected is real then input as real
            // otherwise convert to complex

            //returnHandleType = outputTypeOfFunction(funccode, argTypes);
            //returnType = convertToTokenType(returnHandleType, evalType); 


            const areAllReal = argTypes.every((arg) => arg === TokenHandleType.REAL);
            const hasInputTuple = argTypes.some((arg) => arg === TokenHandleType.INPUT_TUPLE);
            const hasComplex = argTypes.some((arg) => arg === TokenHandleType.COMPLEX);

            console.log(returnHandleType);

            if(FuncInfoByCode[funccode].returnType === TokenHandleType.DISTRIBUTION){
                console.assert(!hasInputTuple && !hasComplex);

                return (args) => {
                    //assumption: last arg is of INPUT_TUPLE type

                    let inputValues = [];
                    for(let i = 0; i < args.length-1; i++){
                        inputValues.push(args[i].value);
                    }

                    const x = args[args.length-1];
                    const n = x.value.length;

                    //log('evaluated for: ', x.value);

                    let results = [];
                    for(let i = 0; i<n; i++){
                        results.push(fn(...(inputValues.concat(x.value[i]))));
                    }

                    const k = {type: x.type, value: results, edge: [0,0,0], outputType: TokenHandleType.INPUT_TUPLE};
                    return k;
                }
            }

            if(!hasComplex) fn = generateRealFunctionMethodExpression(funccode,funcInputInfo);

            console.assert(!(hasInputTuple && hasComplex));

            let unpackArray = false;

            if(
                argTypes.length === 1 
                && (inputType === FuncArgumentInputType.ARRAY_SOFT_NUMBERS || inputType === FuncArgumentInputType.ARRAY_SOFT_REALS)
            ){
                console.assert(argTypes[0] === TokenHandleType.ARRAY);
                console.log('fn: array unpack input method');
                
                unpackArray = true;

                if(funcInputInfo.staticArgs === false){
                    //functions like min, max that allow arrays to be input as max(1,2,3) or max([1,2,3])
                    return (args) => {
                        const val = args[0].value;

                        console.log(val);

                        if(val === null || val === undefined) throw Error('I don\'t understand how to use this function.');
                        if(typeof val[Symbol.iterator] !== 'function') throw Error('This function requires a list of values.');

                        const value = fn(...val);

                        console.log('into value:',value, 'using', fn);
                        return {type: args[0].elementType, value: value, outputType: returnHandleType};
                    }
                }
            }

            if(areAllReal){
                console.log('func: all real');

                return (args) => {
                    const unpackedArgs = unpackArray ? args[0].value : args;

                    const inputValues = unpackedArgs.map((arg) => arg.value);

                    const value = fn(...inputValues);

                    //log(inputValues,'=>',fn,'=>', value);

                    const r = {type: returnType, value: value, outputType: returnHandleType};

                    if(r.outputType === TokenHandleType.ARRAY) r.elementType = TokenType.NUM;

                    if(staticFuncInfo.returnType === TokenHandleType.ARRAY) r.elementType = TokenType.NUM;

                    return r;
                }
            }


            if(hasInputTuple){
                const n = (evalType === TokenType.DUAL) ? 2 : 4;

                const edgeHandler = evalType === TokenType.QUAD 
                    ? (args) => handleEdgesForFunc(funccode, [
                            args.map((arg)=>arg.value[0]),
                            args.map((arg)=>arg.value[1]),
                            args.map((arg)=>arg.value[2]),
                            args.map((arg)=>arg.value[3]),
                        ],args.map((arg) => arg.edge))
                    : (args) => handleEdgePairForFunc(
                            funccode, 
                            args.map((arg)=>arg.value[0]),
                            args.map((arg)=>arg.value[1]),
                            args.map((arg) => arg.edge ?? [0,0,0])
                        );

                return (args) => {
                    let vertices = [];

                    for(let i=0; i<n; i++){
                        const verticeI = argTypes.map((type,j) => {
                            if(type === TokenHandleType.REAL) return args[j].value;
                            else if (type === TokenHandleType.INPUT_TUPLE) return args[j].value[i];
                            else return 0;
                        });

                        vertices.push(fn(...verticeI))
                    }

                    return {type: evalType, value: vertices, edge: edgeHandler(args), outputType: returnHandleType};
                }
            }

            if(hasComplex){
                fn = generateComplexFunctionMethodExpression(funccode,funcInputInfo);

                //console.assert(inputType === FuncArgumentInputType.ARRAY_SOFT_NUMBERS || inputType === FuncArgumentInputType.ALL_COMPLEX || inputType === FuncArgumentInputType.ALL_NUMERIC);

                return (args) => {
                    const unpackedArgs = unpackArray ? args[0].value : args;

                    const inputValues = args.map((arg) => convertValueToComplex(arg.value));

                    //console.log(argsComplex,fn);

                    const value = fn(...inputValues);

                    console.log(value);

                    const r = {type: returnType, value: value, outputType: returnHandleType};

                    console.log(r);

                    if(r.outputType === TokenHandleType.ARRAY) r.elementType = TokenType.CMPLX;

                    return r;
                }
            }

            break;

        case FuncArgumentInputType.ALL_REAL:
            console.assert(argTypes.every((arg) => arg === TokenHandleType.REAL));

            console.log('func: all real');

            return (args) => {
                const result = fn(args.map((arg) => arg.value));

                return {
                    type: TokenType.NUM,
                    value: result,
                    outputType: TokenHandleType.REAL,
                    //uncertainty: evaluateFuncUncertainty(args[0],evalType,args,args.map((arg) => arg.uncertainty),result)
                }
            }

            break;
        case FuncArgumentInputType.ALL_NUMERIC:
        case FuncArgumentInputType.ALL_COMPLEX:
            console.log('func: all numeric/complex');

            fn = generateComplexFunctionMethodExpression(funccode,funcInputInfo);

            return (args) => {
                const inputs = args.map((arg) => convertValueToComplex(arg.value));

                console.log(inputs);

                const result = fn(...inputs);

                return {
                    type: TokenType.NUM,
                    value: result,
                    outputType: TokenHandleType.REAL,
                }
            }
        case undefined:
            throw new Error('Function is missing argument input type.');
    }

    console.error('unable to return method expression for funcInputInfo:',funcInputInfo,' and evalType:',evalType);
    throw new Error('Invalid function.');
}

function generateRealFunctionMethodExpression(funccode,funcInputInfo = undefined){
    if(funcInputInfo !== undefined){
        const pow = funcInputInfo?.attributes?.get(AttributiveCode.POWER);
        if(pow !== undefined){
            const fn = generateRealFunctionMethodExpression(funccode);

            console.log(fn);

            return (...args) => { return fn(...args)**pow };
        }
    }
    

    switch (funccode) {
        case FuncCode.FRAC: return (a,b) => b/a;
        case FuncCode.BINOM: return (a,b) => func_choose(b,a);
        case FuncCode.SIN: 
            return (a) => {
                let e = a/Math.PI;
                if(e===0||isNaN(e)) return e;
                if(!isFinite(e))return NaN;
                if(e===Math.floor(e)) 
                    return e > 0 ? 0 : -0; //sign of e
                let t = Math.round(2 * e), //double the number, then round that
                    r = -0.5 * t + e, //num - (num rounded to nearest half)
                    n = t & 2 ? -1 : 1, //if t is even, -1, else 1
                    o = t & 1 ? Math.cos(Math.PI*r) : Math.sin(Math.PI*r); //if t is odd: cos, else sin
                return n*o;
            }
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
        case FuncCode.ASINH: return (a) => Math.log(a+Math.sqrt(a*a+1));
        case FuncCode.ACOSH: return (a) => Math.log(a+Math.sqrt(a*a-1));
        case FuncCode.ATANH: return (a) => 0.5*Math.log((1+a)/(1-a));
        case FuncCode.ASECH: return (a) => Math.log(1/a+Math.sqrt(1/(a*a)-1));
        case FuncCode.ACSCH: return (a) => Math.log(1/a+Math.sqrt(1/(a*a)+1));
        case FuncCode.ACOTH: return (a) => 0.5*Math.log((a+1)/(a-1));
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
        case FuncCode.ARRAY: //{type: TokenType.ARRAY, valueType: TokenType.NUM, values: [], uncertainties: []}
            return (...args) => {
                console.log('realargs:',args)
                const type = args[0].type; //can assume args.length > 0

                if(args[0].outputType > TokenHandleType.TUPLE) {
                    console.error('Array elements cannot be of this type');
                    return [];
                }

                if(args.some((arg) => arg.type !== type)) {
                    console.error('All array elements must be of same type. ');
                    return [];
                }

                if(args[0].outputType === TokenHandleType.TUPLE){
                    const expectedLength = args[0].value.length;
                    if(args.some((arg) => arg.value.length !== expectedLength)){
                        console.error('All array elements must be of same length. ');
                        return [];
                    }
                }
                return args.reverse();
            }
        case FuncCode.TUPLE: //{type: TokenType.TUPLE, valueType: TokenType.NUM, values: [], uncertainties: []}
            return (...args) => {

                return args.reverse();
            } //args are passed in backwards order
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
            if(funcInputInfo?.attributes?.get(AttributiveCode.BASE) === undefined) return (a) => Math.log(a) / Math.log(10); 
            else return (a) => Math.log(a) / Math.log(funcInputInfo.attributes.get(AttributiveCode.BASE));
        
        case FuncCode.LOGN: return (a,b) => Math.log(a) / Math.log(b); 
        case FuncCode.SQRT: return (a) => Math.sqrt(a); 
        case FuncCode.CBRT: return (a) => Math.cbrt(a); 
        case FuncCode.NTHRT: return (a,b) => Math.pow(a, 1 / b); 
        case FuncCode.GAMMA: return (a) => func_gamma(a); 
        case FuncCode.DGAMA: return (a)=>0; 
        case FuncCode.PGAMA: return (a)=>0; 
        case FuncCode.ZETA: return (a)=>0; 
        case FuncCode.SINC: return (a)=>a===0?1:Math.sin(a)/a;
        case FuncCode.FACTOR: return (a) => func_factor(Math.floor(a));
        case FuncCode.D_NORM: return (s,m,x) => dist_normal(m,s,x);
        default: 
            return generateComplexFunctionMethodExpression(funccode);

            console.error("Unknown function code", funccode);
            return ()=>0;
            break;
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
        return new Expression(
            expression.id, 
            ExpressionType.BLANK, 
            new Set(), 
            expression.color, 
            expression.visible, 
            expression.latex, 
            [],
            []
        );
    }

    const type = expression.type ?? ExpressionType.IMPLICIT;
    const evalType = ExpressionInfoByType[type].tokType;

    const tokenList = expression.tokens;
    if (tokenList == undefined || tokenList.length === 0) {
        throw new Error("Invalid expression given. Expression blank.");
        console.error("Invalid expression given. Expression blank",tokenList);

        return new Expression(
            expression.id, 
            ExpressionType.INVLD, 
            expression.varDependencies, 
            expression.color, 
            expression.visible, 
            expression.latex, 
            [],
            []
        );
    }

    let outputs = []; //Array<string>
    let operators = [];
    let meta = 0; //number

    let argCountStack = []; //managing function args
    let unBracketedFuncArg = false;

    let bracContext = []; //manage whether the current token is in (), [], {}, f(), ||, etc.
    let bracContextArgCount = [];
    let bracContextArgStart = [];

    /**
     * 
     * @param {*} value Expected: {type: int, code/value: any}
     * @param {*} index
     */
    tokenList.forEach((value, index) => {
        meta = value.type;
        //log(operators.length,operators);
        //popPrefixOperators(operators); // %%POPPREFIX
        switch (meta) {
            case TokenType.NUM:
            case TokenType.DUAL:
            case TokenType.QUAD:
            case TokenType.CMPLX:
                //popPrefixOperators(operators); // %%POPPREFIX

                // if(value.type !== evalType){
                //     console.error("Incompatible token types. Wanted: "+evalType+", got: "+ value.type);
                // }

                outputs.push(value);

                //functions without brackets surrounding their argument
                if(unBracketedFuncArg){
                    argCountStack.pop();
                    unBracketedFuncArg = false;
                }

                break;
            case TokenType.OP:
                //popPrefixOperators(operators); // %%POPPREFIX
                //log("value: ",value);

                //log("value.code = ", OpInfoByCode[value.code]);

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
                    if (topOp.type != TokenType.OP) {
                        console.log("broken. Value:", value, "operatorlist:", operators[0],operators[1],operators[2]);
                        //log()
                        break;
                    }

                    const topPrecedence = OpInfoByCode[topOp.code].precedence;
                    //log("id: ", topOp.code, "precedence: ", topPrecedence);

                    if (
                        (opAssociativity === OpAssoc.LEFT && topPrecedence >= opPrecedence) ||
                        (opAssociativity === OpAssoc.RIGHT && topPrecedence > opPrecedence) ||
                        (topOp.code === OpCode.POWN) //binding operation
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
                if(next === undefined){
                    throw new Error('Function \''+FuncInfoByCode[value.code].symbol+'\' missing necessary argument.');
                }

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
                    value.code == BracCode.LFNC ||
                    value.code == BracCode.LABS
                ) {
                    bracContext.push(value.code);
                    bracContextArgCount.push(1);
                    bracContextArgStart.push(index);

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
                        [BracCode.RFNC]: BracCode.LFNC,
                        [BracCode.RABS]: BracCode.LABS
                    }

                    const expectedLeft = matchingBrackets[value.code];
                    if (expectedLeft == undefined) {
                        console.error("Unknown bracket code: ", value.code, matchingBrackets[value.code]);
                        break;
                    }

                    const mostRecentLeft = bracContext.pop();
                    const mostRecentArgCount = bracContextArgCount.pop();
                    const mostRecentArgStart = bracContextArgStart.pop();

                    if(expectedLeft !== mostRecentLeft){
                        throw new Error('Mistmatched bracket types. Left: '+mostRecentLeft+' right: '+value.code);
                    }

                    //log('starting popping', operators, operators.length);

                    while (operators.length > 0) {
                        const topOp = operators.pop();

                        //log('next to pop:', topOp);

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

                        //log('pushing: ', topOp);
                        outputs.push(topOp);
                    }

                    //check for array formation, absolute value formation, etc. 
                    // |...| => abs
                    // [...] => array
                    // (...) => vector/tuple
                    switch(value.code){
                        case BracCode.RRND: // (1,2,...) a tuple: (point, vector, etc)
                            if(mostRecentArgCount === 1) break;

                            outputs.push({
                                type: TokenType.FUNC,
                                code: FuncCode.TUPLE,
                                //fnexp: generateMethodExprForFunc(FuncCode.TUPLE, evalType, false),
                                argCount: mostRecentArgCount,
                                attributes: new Map()
                            });
                            break;
                        case BracCode.RABS: // |...| absolute value
                            console.assert(mostRecentArgCount === 1);
                            
                            outputs.push({ 
                                type: TokenType.OP, 
                                code: OpCode.ABS, 
                                //fnexp: generateMethodExprForOp(OpCode.ABS, evalType, false) 
                            });
                            break;
                        case BracCode.RSQR: // '[1,-3,...]' an array or 'a[0]' array access
                            
                            outputs.push({
                                type: TokenType.FUNC,
                                code: FuncCode.ARRAY,
                                //fnexp: generateMethodExprForFunc(FuncCode.ARRAY, evalType, false),
                                argCount: mostRecentArgCount,
                                attributes: new Map()
                            });
                            break;
                    }

                }
                break;
            case TokenType.VAR:
                value.outputType = convertToHandleType(meta, value.code);

                //if(value.outputType === TokenHandleType.ARRAY) console.assert(value.elementType !== undefined, value);
                //if(value.outputType === TokenHandleType.ARRAY) console.assert(value.type === TokenType.ARRAY, value);

                outputs.push(value);
                break;
            case TokenType.UNKN:
             //unknowns and vars
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

                const staticConstantInfo = ConstInfoByCode[value.code];

                const outputValue = staticConstantInfo.value;
                const outputHandleType = staticConstantInfo.outputType;
                const outputType = convertToTokenType(outputHandleType, evalType);

                //log(staticConstantInfo.symbol, '| type:', outputType);

                outputs.push({
                    type: outputType,
                    value: outputValue,
                    outputType: outputHandleType
                });

                // if (value.code == ConstantCode.I) {
                //     //only complex constant
                //     outputs.push({ type: TokenType.CMPLX, a: 0, b: 1 }); //%%TOKEN
                // }else{
                //     outputs.push({ type: TokenType.NUM, value: value.value }); //%%TOKEN
                // }

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
                //log(operators.length);
                const contextIn = bracContext[bracContext.length-1];

                console.assert(
                    contextIn === BracCode.LFNC ||
                    contextIn === BracCode.LSQR ||
                    contextIn === BracCode.LRND
                );

                bracContextArgCount[bracContextArgCount.length - 1]++;
                argCountStack[argCountStack.length - 1]++; //potential error if is first token

                //Each comma behaves as a closing parenthesis except it does not pop the open parenthesis according to:
                //https://wcipeg.com/wiki/Shunting_yard_algorithm

                //pop operators to output until matching bracket found
                const matchingBrackets = {
                    [BracCode.RRND]: BracCode.LRND,
                    [BracCode.RSQR]: BracCode.LSQR,
                    [BracCode.RCUR]: BracCode.LCUR,
                    [BracCode.RFNC]: BracCode.LFNC,
                    [BracCode.RABS]: BracCode.LABS
                }

                //Assumption that all commas are in functions
                const expectedLeft = contextIn;
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
                //log(operators.length);
                break;
            case TokenType.ATT:
                break;
            default:
                console.error("Unimplemented token type in compiler: " + meta);
                break;

        }

        // log("------------");
        // log("outputs",outputs.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
        // log("operators",operators.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    });

    //pop remaining operators to output stack
    while (operators.length > 0) {
        outputs.push(operators.pop());
    }

    // log("------------");
    // log("outputs",outputs.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    // log("operators",operators.map((t) => "(type: " + t.type + ", value: " + (t.value ?? t.code) + ")").join(","));
    // log("------------")

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

    //console.log(expression.tokens, "->", outputs);

    const testResult = testEvaluation(outputs, ExpressionInfoByType[type].tokType, evalType);
    const tokenMetaInfo = testResult.expectedMeta;
    const outputType = testResult.outputType;

    for(let i = 0; i < outputs.length; i++){
        const metaInfo = tokenMetaInfo[i];
        outputs[i].outputType = metaInfo.outputType;

        console.assert(outputs[i].outputType !== undefined, metaInfo);

        if(outputs[i].type === TokenType.OP || outputs[i].type === TokenType.FUNC) {
            outputs[i].variantCode = metaInfo.variantCode;

            //log(metaInfo.variantCode);

            const methodExpr = 
                (outputs[i].type === TokenType.OP) 
                ? generateStrictMethodExprForOp(metaInfo.variantCode,evalType)
                : generateStrictMethodExprForFunc(metaInfo.variantCode,evalType);

            console.assert(typeof methodExpr === 'function',methodExpr,metaInfo.variantCode,evalType);

            outputs[i].fnexp = methodExpr;
        }

        if(metaInfo.inputElementsSeparately !== undefined) outputs[i].inputElementsSeparately = metaInfo.inputElementsSeparately;
    }

    console.log('after testing: ', outputs); 

    if(type === ExpressionType.ASGNMT){
        return new Expression(
            expression.id, 
            type, 
            expression.varDependencies, 
            expression.color, 
            expression.visible, 
            expression.latex, 
            outputs,
            toReplace,
            expression.definedVariable
        );
    }

    return new Expression(
        expression.id, 
        type, 
        expression.varDependencies, 
        expression.color, 
        expression.visible, 
        expression.latex, 
        outputs,
        toReplace
    );
}

// export class EvaluationResult{

// }

export function evaluate(expression, input){
    //replace variables

    //if no auto indexing is needed:
        //replace unknowns (x,y,etc)
        //evaluate numerically

    //if auto indexing is needed:
        //find n = number of indexes (min length of arrays)
        //replace unknowns
        //instantiate blank 'results' array
        //loop from k=0 to k=n
            //index all arrays at index k
            //evaluate
            //add eval result to 'results' array
        //end loop

        //construct array token out of 'results' array


    const tokenList = readExpressionWithReplacements(expression, input);

    if(!tokenList.some((t) => t.inputElementsSeparately === true)){
        return {
            didByIndexEvaluation: false,
            result: evaluateExpression(expression, input, -1)
        };
    }

    const elementsToBeAutoIndexed = tokenList.filter((t) => t.inputElementsSeparately === true);

    console.log('info on evaluation',expression,elementsToBeAutoIndexed);

    const lengths = elementsToBeAutoIndexed.map((t) => {
        switch(t.type){
            case TokenType.VAR: return getVariable(t.code).value.length; //assume variable is array type
            case TokenType.FUNC: return t.argCount;
            case TokenType.ARRAY: return t.value.length;
            default:
                console.log('error token:',t);
                throw new Error('Could not automatically index token.');
        }
    });

    const n = Math.min(...lengths);

    console.assert(n>0, 'Cannot evaluate array of 0 length.',lengths, elementsToBeAutoIndexed);

    let results = [];
    let values = [];
    for(let k = 0; k<n; k++){
        const e = evaluateExpression(expression, input, k);
        results.push(e);
        values.push(e.value);
    }

    return {
        didByIndexEvaluation: true,
        result: {type: TokenType.ARRAY, value: values, elementType: results[0].type, outputType: TokenHandleType.ARRAY}
    };
}

/**
 * Evaluates `compiledExpression` according to the `input` 
 * @param {*} compiledExpression the expression to be evaluated
 * @param {*} input the input representing where the expression is evaluated, relevant for handling tokens like "x" and "y".
 * @param {*} options other expression options (unused)
 * @returns the output (which may be vary type depending on `compiledExpression.type`) or NaN if there is an error
 */
// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
export function evaluateExpression(compiledExpression, input, arrayIndex) {
    //console.log('- Evaluating expression with index:',arrayIndex,' -');

    if(arrayIndex === undefined) throw new Error('invalid array index');
    //let expressionType = compiledExpression.type;
    // console.warn('evaluating: ',compiledExpression);

    //console.log('- replacing: ',compiledExpression.replace,' -');
    let tokenList = readExpressionWithReplacements(compiledExpression, input);

    //console.warn(tokenList);

    //console.log('post-replacement:',tokenList[0].type); //STILL value=[1,2]

    var solve = []; //Array<number>

    //true: solve for difference (f(x)=0)  false: solve exact
    const evaluateDiff = (compiledExpression.type == ExpressionType.IMPLICIT);
    const evalType = ExpressionInfoByType[compiledExpression.type].tokType;

    tokenList.forEach((value, index) => {
        switch (value.type) {
            case TokenType.NUM:
            //case TokenType.STRG:
            case TokenType.QUAD:
            case TokenType.DUAL:
            case TokenType.CMPLX:
            //case TokenType.CNST: //should already be converted to number
                // if(value.type !== evalType){
                //     console.warn("Incompatible token types. Wanted: "+evalType+", got: "+ value.type);
                // }
                solve.push(value);
                // if(value.outputType === TokenHandleType.INPUT_TUPLE) {
                //     log(value);
                // }
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

                //log("token of id: " + value);
                let opcode = value.code;
                let opArity = OpInfoByCode[value.code].arity;

                if (opArity == 1) {
                    //log(solve);
                    let arg = solve.pop();
                    //log(arg);

                    //TokenType.UNKN not supported, should be quad

                    if(!doEvalsAsFuncExpressions){
                        throw new Error('FuncExpressions turned off');
                    }

                    solve.push(evaluateMethodExprForUnaryOp(value, ExpressionInfoByType[compiledExpression.type].tokType, arg));
                    break;
                }

                //assuming opArity == 2:

                console.assert(solve.length >= 2,solve);
                //let a = null; //should cause error if used wrong
                var b = solve.pop();
                var a = solve.pop();

                //log("a:", a, "b:", b);
                var result = 0;

                if(!doEvalsAsFuncExpressions){
                    throw new Error('FuncExpressions turned off');
                }

                console.assert(a !== undefined, a); 
                console.assert(b !== undefined, b);
                result = evaluateMethodExprForBinaryOp(value, ExpressionInfoByType[compiledExpression.type].tokType, a, b);

                solve.push(result);
                break;
            case TokenType.FUNC:
                if (value.staticArgs) {
                    if (value.args !== value.argCount) {
                        console.error("Incorrect amount of arguments for function. Expected: " + value.args);
                    }
                }

                let args = [];
                let popCount = getPopCountOfFunction(value);

                //console.assert(solve.length >= popCount,solve,popCount,value.argCount);

                for (let i = 0; i < popCount; i++) {
                    const pop = solve.pop()
                    //console.assert(!isNaN(pop.value[0]),pop);
                    args.push(pop);
                }
                //log(args);


                //TODO: replace with equation type detection 
                //const evalType = ExpressionInfoByType[compiledExpression.type].tokType;

                var result = 0;

                if(!doEvalsAsFuncExpressions){
                    throw new Error('FuncExpressions turned off');
                }

                console.assert(args.length > 0,args);
                console.assert(value.attributes !== undefined, value);

                result = evaluateMethodExprForFunc(value, evalType, args, value.attributes, input, arrayIndex);
                if(result.type === TokenType.ARRAY && arrayIndex >= 0){
                    result.type = result.elementType ?? TokenType.NUM;
                    result.value = result.value[arrayIndex];
                }
                
                solve.push(result);
                break;
            case TokenType.BRKT: //shouldn't be here?
                console.error("bracket passed, not supported yet", value);
                //
                break;

            case TokenType.DELIM:
                console.error("delimeter passed, not supported yet");
                //should never 
                break;
            case TokenType.ARRAY:
            case TokenType.TUPLE:
                //console.warn('array passed:',value.value, arrayIndex); //STILL PROPER ARRAY
                let token = value;
                if(token.type === TokenType.ARRAY && arrayIndex >= 0){
                    //console.log('array being indexed');
                    //console.assert(token.elementType !== undefined, 'Token element type is undefined.');
                    token.type = token.elementType;
                    token.value = token.value[arrayIndex]; //INDEXED CORRECTLY
                }
                //console.log('indexed to:',token.value);
                solve.push(token);
                break;
            default:
                console.error("Unknown token type",value.type);
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

    //log("s->",solve.length,solve);

    if(solve.length !== 1){
        console.error("Error in evaluation, final stack length: " + solve.length);
        return NaN;
    }

    // let result = solve[0];
    // if(test)

    //console.log('- eval returned value:',solve[0].value+'-');

    return solve[0];


    if (solve.length == 1) {
        //log(solve[0]);
        
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
    //console.log(tokType);

    let action = 0;

    if(tokType == TokenType.NUM){
        for(let i = 0; i < toReplace.length; i++){
            action = toReplace[i];

            if(action.type == TokenType.VAR){
                //redo later to add greater variety of types that a var can assume
                const evalResult = getVariable(action.varId);
                if(evalResult === undefined) console.error('variable '+ action.varId+ ' not found');
                else console.log('retrieved variable: '+action.varId+', is:',evalResult);

                //console.log(tokenList);

                let token = tokenList[action.index];

                //log(token);
                console.assert(typeof evalResult.value === 'number' || (evalResult.value.length > 0) ,evalResult);

                token.type = evalResult.type;
                token.value = evalResult.value;
                token.uncertainty = evalResult.uncertainty ?? 0;
                token.interpret = evalResult.interpret ?? undefined;
                token.elementType = evalResult.elementType;

                token.outputType = (evalResult.outputType ?? convertToHandleType(evalResult.type, evalResult.value));

                console.log('var placeholder replaced with:',token);
                console.log('check4:',token.value);

                // evalResult.outputType = convertToHandleType(evalResult.type, evalResult.value);

                // console.assert(evalResult.type === TokenType.NUM || evalResult.type === TokenType.ARRAY || evalResult.type === TokenType.TUPLE);
                // console.assert(evalResult.value !== undefined);
                // console.assert(evalResult.outputType !== undefined);

                // log(evalResult);

                // const token = evalResult;
                // log('replacing ', token);

                tokenList.splice(action.index, 1, token);
                // log(tokenList);
            }
        }
        return tokenList;
    }

    if(tokType == TokenType.DUAL){
        //log(toReplace,toReplace.length);
        for(let i = 0; i < toReplace.length; i++){
            action = toReplace[i];

            if(action.type == TokenType.UNKN){
                //assumption: only one type of unknown, so we can just replace all instances with the same value
                let newtoken = {type: TokenType.DUAL, value: [input.min, input.max], edge: [0,0,0], outputType: tokenList[action.index].outputType}; /** @param {Number[]} input  */
                tokenList.splice(action.index, 1, newtoken);
            }
            if(action.type === TokenType.VAR){
                let newtoken = {type: getVariable(action.varId).type, value: getVariable(action.varId).value, outputType: tokenList[action.index].outputType};
                if(newtoken.type === TokenType.ARRAY) newtoken.elementType = getVariable(action.varId).elementType;
                tokenList.splice(action.index, 1, newtoken);
            }
            // if(action.type === TokenType.DIST){
            //     let token = tokenList[action.index];

            //     let newtoken = {type: TokenType.DUAL, value: [token.fnexp(input.min), token.fnexp(input.max)], edge: [0,0,0], outputType: TokenHandleType.INPUT_TUPLE};
            //     tokenList.splice(action.index, 1, newtoken);
            // }
        }
        return tokenList;
    }

    //QUAD
    for (let i = 0; i < toReplace.length; i++) {
        action = toReplace[i];

        const newQuad = (code, tplf, tprt, btlf, btrt) => {
            return {
                type: TokenType.QUAD,
                code: code,
                value: [
                    tplf, tprt,
                    btlf, btrt
                ],
                edge: {top: [0,0,0], lft: [0,0,0], rgt: [0,0,0], btm: [0,0,0]},
                outputType: TokenHandleType.INPUT_TUPLE
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
                case UnknownCode.PARAMETRIC_T:
                    newtoken = { type: TokenType.DUAL, value: [input.minT, input.maxT], edge: [0,0,0]};
                    break;
                default:
                    console.error("Unknown replacement action");
            }

            tokenList.splice(action.index, 1, newtoken);
        }else if(action.type === TokenType.VAR){
            const evalResult = getVariable(action.varId);
            if(evalResult === undefined) console.error('variable '+ action.varId+ ' not found');

            let token = tokenList[action.index];

            console.assert(typeof evalResult.value === 'number',evalResult);

            token.type = evalResult.type;
            token.value = evalResult.value;
            token.uncertainty = evalResult.uncertainty ?? 0;
            token.interpret = evalResult.interpret ?? undefined;
            token.outputType = evalResult.outputType ?? convertToHandleType(evalResult.type, evalResult.value);

            tokenList.splice(action.index, 1, token);
        }
        //TODO: replacement for VARs 
    }

    return tokenList;
}

function getPopCountOfFunction(token){
    let popCount;

    if((token.argCount ?? 0) === 0){
        //arguments not surrounded by parenthesis
        if(FuncInfoByCode[token.code].staticArgs === false){
            console.error("Varied-argument functions must have their arguments surrounded by parenthesis.");
            popCount = 1; //ASSUMPTION: default is 1
        }else{
            popCount = FuncInfoByCode[token.code].args ?? 0; 
        }
    }else{
        //arguments surrounded by parenthesis
        popCount = token.argCount;
    }

    return popCount;
}

/**
 * 
 * @param {*} token unary operator
 * @param {*} evalType the expected token type
 * @param {*} a the 'argument' token 
 * @returns 
 */
function evaluateMethodExprForUnaryOp(token, evalType, a){
    const k = token.fnexp(a);
    //console.log(a,'->',k);
    return k;
}

function evaluateUnaryOpUncertainty(opcode, evalType, a, aUnc){
    if(evalType !== TokenType.NUM) return 0;

    //if()

    switch(opcode){
        case OpCode.NOT:
        case OpCode.NEG:
        case OpCode.ABS:
            return Math.abs(aUnc);
        case OpCode.FACT:
            return aUnc;
        default:
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
    const k = token.fnexp(a,b);
    //console.log(a,b,'->',k);
    return k;
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
            if(a===0 || b===0) return 0;
            return (aUnc/a + bUnc/b)*(a*b);
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
function evaluateMethodExprForFunc(token, evalType, rawargs, attributes, input, arrayIndex = -1){
    //console.assert(typeof input.min === 'number' && !isNaN(input.min),input);
    //console.assert(typeof input.max === 'number' && !isNaN(input.max),input);

    const j = (attributes.get(AttributiveCode.AUTO_FUNC)); 

    if(j !== undefined && evalType === TokenType.DUAL) {
        //console.log(input);
        const x = {type: TokenType.DUAL, value: [input.min, input.max], edge: [0,0,0], outputType: TokenHandleType.INPUT_TUPLE}; 
        //console.log(x);
        rawargs.push(x);
        //log(rawargs);
    } //return token.fnexp(rawargs.concat([input.min, input.max]));

    //console.log(token.fnexp);
    //console.log('rawargs',rawargs);
    const k = token.fnexp(rawargs);

    return k;
}

function evaluateFuncUncertainty(functoken, evalType, args, argsUnc, result){
    const funccode = functoken.code;

    switch(funccode){
        case FuncCode.FRAC:
            if(args[0] === 0 || args[1] === 0) return 0;
            return (argsUnc[0]/args[0] + argsUnc[1]/args[1])*result; 
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

function convertConstantToToken(constCode){
    return { type: TokenType.NUM, value: ConstInfoByCode[constCode].value };
}

function convertVariableToToken(varName){
    const varData = getVariableData(varName);

    if(varData === undefined){
        throw new Error('Var data not found for variable: \''+varName+'\'.');
    }

    return varData.value; //A token, like {type: int, value: int, etc};
}

function convertToHandleType(tokenType, metadata) {
    switch(tokenType){
        case TokenType.NUM:
            return TokenHandleType.REAL;
        case TokenType.CMPLX:
            return TokenHandleType.COMPLEX;
        case TokenType.CNST:
            const constantAsToken = convertConstantToToken(metadata);
            return convertToHandleType(constantAsToken.type, constantAsToken.value);
        case TokenType.VAR:
            const varAsToken = convertVariableToToken(metadata);
            console.log(varAsToken);
            if(varAsToken === undefined) return 0;
            const r = convertToHandleType(varAsToken.type, varAsToken.value);
            //log(r);
            return r;
        case TokenType.OP:
            return OpInfoByCode[metadata].arity === 2 ? TokenHandleType.BINARY_OP : TokenHandleType.UNARY_OP;
        case TokenType.FUNC:
            return TokenHandleType.FUNCTION;
        case TokenType.UNKN:
        case TokenType.QUAD:
        case TokenType.DUAL:
            return TokenHandleType.INPUT_TUPLE;
        case TokenType.ARRAY:
            return TokenHandleType.ARRAY;
        case TokenType.TUPLE:
            return TokenHandleType.TUPLE;
        default:
            console.error('failed to convert to handle type',tokenType,metadata)
            return 0;
    }
}

function convertToTokenType(tokenHandleType, evalType){
    switch(tokenHandleType){
        case TokenHandleType.REAL: return TokenType.NUM;
        case TokenHandleType.COMPLEX: return TokenType.CMPLX;
        case TokenHandleType.TUPLE: return TokenType.TUPLE;
        case TokenHandleType.ARRAY: return TokenType.ARRAY;
        case TokenHandleType.INPUT_TUPLE: return evalType;
    }
}

// -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
/**
 * Tests evaluation to check which types of operations are performed. For example, '*' could be real*real, vector * vector, quad*real, etc which all have different behavior
 * @param {*} tokens 
 * @param {*} inputType 
 */
function testEvaluation(inputTokens, inputType, evalType){
    let tokens = inputTokens.slice();

    let solve = [];
    let expectedTokenMetadata = [];

    for(let i = 0; i < tokens.length; i++){
        let token = tokens[i];
        token.index = i;
        let tokenHandleType = convertToHandleType(token.type, token.code ?? token.value); //HACK
        
        if(tokenHandleType === 0){
            console.error(token);
            throw new Error('Unknown token found during evaluation of type: '+tokenHandleType);
        }

        const tryToFlagForAutoIndex = (testToken) => {
            if(testToken.outputType === TokenHandleType.ARRAY){
                if(testToken.instantiatorIndex !== undefined){
                    expectedTokenMetadata[testToken.instantiatorIndex].inputElementsSeparately = true;
                    console.log('array func set',testToken,testToken.instantiatorIndex,expectedTokenMetadata[testToken.instantiatorIndex]);
                }
                testToken.inputElementsSeparately = true;

                const runtimeToken = tokens[testToken.index];
                const elementType = runtimeToken.type === TokenType.VAR ? getVariable(runtimeToken.code).elementType : runtimeToken.elementType;

                console.log('rttoken:',runtimeToken,elementType);

                testToken.outputType = convertToHandleType(elementType,runtimeToken.code??runtimeToken.value); //?metadata
                console.log('arg=>',testToken.outputType);
            }
        }

        switch(tokenHandleType){
            case TokenHandleType.REAL: 
                token.outputType = TokenHandleType.REAL;

                solve.push(token);
                expectedTokenMetadata.push({ outputType: TokenHandleType.REAL });
                break;
            case TokenHandleType.COMPLEX:
                token.outputType = TokenHandleType.COMPLEX;

                solve.push(token);
                expectedTokenMetadata.push({ outputType: TokenHandleType.COMPLEX });
                break;
            case TokenHandleType.TUPLE:
                token.outputType = TokenHandleType.TUPLE;

                solve.push(token);
                expectedTokenMetadata.push({ outputType: TokenHandleType.TUPLE });
                break;
            case TokenHandleType.ARRAY:
                token.outputType = TokenHandleType.ARRAY;

                if(tokens.length === 1) {
                    token.inputElementsSeparately = true;
                    //token.outputType = token.elementType;
                }

                //token.elementType = 

                solve.push(token);
                expectedTokenMetadata.push({ outputType: TokenHandleType.ARRAY });
                break;
            case TokenHandleType.INPUT_TUPLE:
                token.outputType = TokenHandleType.INPUT_TUPLE;

                solve.push(token);
                expectedTokenMetadata.push({ outputType: TokenHandleType.INPUT_TUPLE, variantCode: inputType });
                break;
            case TokenHandleType.UNARY_OP:
                if(solve.length < 1) throw new Error("Missing operand for \'"+OpInfoByCode[token.code].symbol+"\' operator.");

                const arg = solve.pop();

                tryToFlagForAutoIndex(arg);

                console.assert(arg.outputType !== undefined, token);

                solve.push({outputType: arg.outputType});
                expectedTokenMetadata.push({ outputType: arg.outputType, variantCode: toStrictOperatorCodeUnary( arg.outputType & 0b1111, token.code & 0b11111111 ) });
                break;
            case TokenHandleType.BINARY_OP:
                if(solve.length < 2) throw new Error("Missing operand for \'"+OpInfoByCode[token.code].symbol+"\' operator.");

                const b = solve.pop();
                const a = solve.pop();

                tryToFlagForAutoIndex(a);
                tryToFlagForAutoIndex(b);

                if(a.outputType >= b.outputType){
                    token.outputType = a.outputType;
                }else{
                    token.outputType = b.outputType;
                }

                solve.push({outputType: token.outputType});
                expectedTokenMetadata.push({ outputType: token.outputType, variantCode: toStrictOperatorCodeBinary(a.outputType & 0b1111, b.outputType & 0b1111, token.code & 0b11111111) });
                break;
            case TokenHandleType.FUNCTION:
                const popCount = getPopCountOfFunction(token);

                let args = [];
                let argTypes = [];
                let argElemTypes = [];
                for(let i = 0; i < popCount; i++){
                    const popped = solve.pop();

                    tryToFlagForAutoIndex(popped);
                    
                    args.push(popped);
                    argTypes.push(popped.outputType)
                    argElemTypes.push(popped.elementType);
                }

                token.outputType = outputTypeOfFunction(token.code, argTypes);

                //if array function
                    //mark result as "creator: (array index in compiled token stack)""
                    //...result array gets binary operated on --> mark this array function as 'inputElementsSeparately=true'

                const instantiatorIndex = token.code === FuncCode.ARRAY ? token.index : undefined;

                let solvepush = {outputType: token.outputType, instantiatorIndex: instantiatorIndex, index: token.index};
                if(token.outputType === TokenHandleType.ARRAY || token.code === FuncCode.ARRAY) {
                    solvepush.elementType = outputTypeOfFunction(token.code,argElemTypes);
                    token.elementType = outputTypeOfFunction(token.code,argElemTypes);
                }

                console.log('pushin: ', solvepush);

                solve.push(solvepush);
                expectedTokenMetadata.push({ outputType: token.outputType, variantCode: newFuncInputInfoObject(argTypes, token.code, token.attributes) });

                //if last token and is Array() function, set input elements separately to true
                if(i===tokens.length-1 && instantiatorIndex !== undefined) expectedTokenMetadata[instantiatorIndex].inputElementsSeparately = true;
                break;
            default:
                console.error('unknown token handle type: ', tokenHandleType);
                break;
        }
    }

    if(solve.length !== 1) throw new Error('Invalid expression.');

    //if(solve[0].)

    let wantedResultType = TokenType.NUL; //default, whatever is returned
    if(evalType === ExpressionType.EXP_F_X || evalType === ExpressionType.EXP_F_Y){
        //return of evaluation should be of dual type
        wantedResultType = TokenType.DUAL;
    }

    //log('metadata: ', expectedTokenMetadata);

    return {expectedMeta: expectedTokenMetadata, wantedResultType: wantedResultType, };
}

/**
 * 
 * @param {*} a 
 * @param {*} b 
 * @param {*} op 
 * @returns {Array} [Expected return type, extra info]
 */
function outputInfoOfBinaryOp(a, b, op){
    if(a.outputType === b.outputType){
        if(op.code === OpCode.SUBS) return TokenHandleType.
        if(op.code === OpCode.PM) 
    }

    if(a.outputType === TokenHandleType.BRANCH || b.outputType === TokenHandleType.BRANCH) return TokenHandleType.BRANCH;

    if(a.outputType === TokenHandleType.TUPLE || b.outputType === TokenHandleType.TUPLE) return TokenHandleType.TUPLE;
}

function outputTypeOfFunction(funccode, argTypes){
    if(FuncInfoByCode[funccode].staticArgs === false){
        if(funccode === FuncCode.ARRAY) return TokenHandleType.ARRAY;
        if(funccode === FuncCode.TUPLE) return TokenHandleType.TUPLE;

        return TokenHandleType.REAL; //ASSUMPTION: array operations, collapse
    }

    if(FuncInfoByCode[funccode].returnType === TokenHandleType.DISTRIBUTION) return TokenHandleType.INPUT_TUPLE;

    //ASSUMPTION: these are the only higher-precedence-value functions
    if(funccode === FuncCode.TUPLE) return TokenHandleType.TUPLE;
    if(funccode === FuncCode.ARRAY) return TokenHandleType.ARRAY;
    if(funccode === FuncCode.CIS) return TokenHandleType.COMPLEX;
    if(funccode === FuncCode.ARG) return TokenHandleType.REAL;
    if(funccode === FuncCode.ABS) return TokenHandleType.REAL;
    if(funccode === FuncCode.SQRT) return TokenHandleType.COMPLEX;

    return Math.max(...argTypes);
}

function handleEdgesForUnaryOp(opcode, arg_quad, arg_edges){
    const top = handleEdgePairForUnaryOp(opcode, arg_quad[0], arg_quad[1]);
    const lft = handleEdgePairForUnaryOp(opcode, arg_quad[0], arg_quad[2]);
    const rgt = handleEdgePairForUnaryOp(opcode, arg_quad[1], arg_quad[3]);
    const btm = handleEdgePairForUnaryOp(opcode, arg_quad[2], arg_quad[3]);

    //log("top", top, "edges", arg_edges);

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
    if(arg1 == undefined || arg2 == undefined) console.error('Unknown argument passed to handleEdgePairForUnaryOp()');

    console.assert(arg1 !== undefined && arg2 !== undefined, arg1, arg2);

    var crosses = 0;
    var holes = 0;
    var jumps = 0;

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

    return [crosses, holes, jumps];
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
        console.log("undef_b:",edges_b);
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

            console.log(a1,a2,b1,b2);

            //TODO: FIX BELOW
            if((a1*b1 > 0) !== (a2*b2 > 0)) {
                crosses++; 
            }

            //check denominator sign change:
            if((b1 > 0) !== (b2 > 0)) {
                console.log('cross:',b1,b2);
                crosses++;
                jumps++;
                holes++;
            }
            //jumps += crosses of arg2 instead of this ^^
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

function handleEdgesForFunc(funccode, vertexes, edgeslist){
    //Edge{}[] edgeslist (edges, organized by argument)

    //vertexes = [0,1,2,3].map((index) => newArgs.map((arg) => arg[index]));

    const edge = {
        top: edgeslist.map((edgequad) => edgequad.top),
        lft: edgeslist.map((edgequad) => edgequad.lft),
        rgt: edgeslist.map((edgequad) => edgequad.rgt),
        btm: edgeslist.map((edgequad) => edgequad.btm),
    }

    //arg0 arg1
    //arg2 arg3
    //log(vertexes);

    const top = handleEdgePairForFunc(funccode, vertexes[0], vertexes[1], edge.top);
    const left = handleEdgePairForFunc(funccode, vertexes[0], vertexes[2], edge.lft);
    const right = handleEdgePairForFunc(funccode, vertexes[1], vertexes[3], edge.rgt);
    const bottom = handleEdgePairForFunc(funccode, vertexes[2], vertexes[3], edge.btm);

    //log("tlrb:", top, left, right, bottom);

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
 * @param {*} funccode function id (int)
 * @param {*} args1 list of vertex 1 of each arg
 * @param {*} args2 list of vertex 2 of each arg
 * @param {*} edgeinfo list of edges of each argument
 * @returns 
 */
function handleEdgePairForFunc(funccode, args1, args2, edgeinfo){
    //returns # of jumps (like in a mod b)
    //returns # of holes (like in 1/x)
    //returns # of intersections/crosses
    //returns if the function is undefined anywhere in the interval

    //NOTE: asymptotes for f(x) = crosses for 1/f(x) and vice versa

    var n;
    var crosses = 0;
    var holes = 0;
    var jumps = 0;

    var undefined = false;

    //log("before", crosses, holes, jumps);

    const isSameSign = (a,b) => (a>0) === (b>0);
    const negativeSmallOrPositive = (a) =>( Math.abs(a) < 1) ? 0 : Math.sign(a); //divides Reals into three sections: {n<=1, -1<n<1, n>=1}

    switch(funccode){
        case FuncCode.FRAC: 
            //argsn[k] kth argument of point n

            //1st argument --> numerator
            //2nd argument --> denominator
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];

            //log(args1[0],args2[0]);
            if(!isSameSign(args1[0],args2[0])){
                crosses++;
                holes++;
                jumps++;
            }

            if(!isSameSign(args1[1],args2[1])){
                crosses++;
                holes++;
                jumps++;
            }
            
            break;
        case FuncCode.SIN:
            crosses = Math.abs(Math.floor(args1[0]/Math.PI)-Math.floor(args2[0]/Math.PI));
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            //log(args1[0], args2[0], "=>", crosses);
            break;
        case FuncCode.COS:
            n = Math.abs(
                Math.round(args1[0]/Math.PI + 0)
                -Math.round(args2[0]/Math.PI + 0)
            );
            crosses = n;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            break;
        case FuncCode.TAN:
        case FuncCode.SEC:
            crosses = 0;
            n = Math.abs(
                Math.round(args1[0]/Math.PI + 0)
                -Math.round(args2[0]/Math.PI + 0)
            );
            //log(edgeinfo[0],args1[0],args2[0], n);

            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
            //return [n, n, n]; //jumps, holes, crosses
        case FuncCode.CSC:
        case FuncCode.COT: 
            crosses = 0;
            n = Math.abs(
                Math.floor(args1[0]/Math.PI + 0)
                -Math.floor(args2[0]/Math.PI + 0)
            );
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FuncCode.ASIN:
        case FuncCode.ACOS:
        case FuncCode.ATANH:
            n = Math.abs(negativeSmallOrPositive(args1[0])-negativeSmallOrPositive(args2[0]));
            crosses = 0;
            holes = ((n > 0) ? 1 : 0) + edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FuncCode.ASEC:
        case FuncCode.ACSC:
            n = Math.abs( negativeSmallOrPositive(args1[0]) - negativeSmallOrPositive(args2[0]) );

            holes = edgeinfo[0][1] + (n>0)?1:0;
            jumps = edgeinfo[0][2] + n;

            // //if they are across the gap, or if either of them is within the gap
            // if(!isSameSign(args1[0],args2[0]) || (Math.abs(args1[0]) < 1) || (Math.abs(args2[0]) < 1)){
            //     holes += 1;
            //     jumps += 1;
            // }
            break;
        case FuncCode.ACOT:
            n=isSameSign(args1[0],args2[0]) ? 0 : 1;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
            break;
        case FuncCode.CSCH:
        case FuncCode.COTH:
        case FuncCode.ACSCH:
            crosses = 0;
            n = ((args1[0] > 0) !== (args2[0] > 0)) ? 1 : 0;
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FuncCode.ACOSH:
            n = isSameSign(args1[0]-1,args2[0]-1) ? 0 : 1;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
            //log(crosses,holes,jumps)
            break;
        case FuncCode.ASECH:
            n = (args1[0] < 0 || args1[0] > 1)||(args2[0] < 0 || args2[0] > 1) ? 1 : 0;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2];
            break;
        case FuncCode.ACOTH:
            n = Math.abs(negativeSmallOrPositive(args1[0])-negativeSmallOrPositive(args2[0]));
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
        //case 
        case FuncCode.SQRT:
            crosses = 0;
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
            crosses = n;
            holes = edgeinfo[0][1] + n;
            jumps = edgeinfo[0][2] + n;
            break;
        case FuncCode.FLOOR:
        case FuncCode.CEIL:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0])-Math.floor(args2[0]));
            break;
        case FuncCode.TRUNC:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0])-Math.floor(args2[0]));
            if((args1[0]>0) !== (args2[0]>0)) jumps -= 1;
            break;
        case FuncCode.ROUND:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0]-0.5)-Math.floor(args2[0]-0.5));
            break;
        case FuncCode.LN:
        case FuncCode.LOG:
        case FuncCode.LOGN:
            holes = (args1[0]<=0)===(args2[0]<=0) ? 0 : 1;
            crosses = (args1[0]<1)===(args2[0]<1) ? 0 : holes;
            jumps = holes;
            break;

        default:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
    }

    crosses = crosses ?? edgeinfo[0][0]; //first argument

    if(!undefined) undefined = (holes > 0);

    //log("after", crosses, holes, jumps);
    if(isNaN(crosses) || isNaN(holes) || isNaN(jumps)){
        throw new Error('Error ha occurido:'+args1+','+args2+','+edgeinfo);
    }

    return [crosses, holes, jumps];
}

/**
 * Shifts each element in `a` by `b`
 * @param {Array} a 
 * @param {number} b 
 * @returns An array
 */
export function tupleShift(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]+b);
    }
    return r; 
}

/**
 * Returns an array r such that r[i] = a[i]+b[i]
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleAdd(a,b){ 
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]+b[i]);
    }
    return r;
}

/**
 * Shifts each element in `a` by -`b`
 * @param {Array} a 
 * @param {number} b 
 * @returns An array
 */
export function tupleUnshift(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]-b);
    }
    return r;
}

export function tupleSubtract(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]-b[i]);
    }
    return r;
}

export function tupleScale(a,s){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]*s);
    }
    return r;
}

export function tupleMultiply(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]*b[i]);
    }
    return r;
}

export function tupleDivide(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]/b[i]);
    }
    return r;
}

export function tupleDotProduct(a,b){
    let r = 0;
    for(let i = 0; i < a.length; i++){
        r+=a[i]*b[i];
    }
    return r;
}

export function tupleCrossProduct(a,b){
    if(a.length !== 3 || b.length !== 3){
        console.error('Cross product only works for 3-dimensional inputs');
        return Array(a.length).fill(0);
    }

    return [
        a[1]*b[2]-a[2]*b[1],
        -a[0]*b[2]+a[2]*b[0],
        a[0]*b[1]-a[1]*b[0]
    ];
}

function func_gamma(n) {
    if(n-Math.floor(n) === 0 && n<=0) return undefined; 
    //log("N",n);
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

function func_choose(n,k){
    const result = func_gamma(n+1)/(func_gamma(k+1)*func_gamma(n-k+1));

    //log('n,k,r:', n, k, result);

    if(n-Math.floor(n) === 0 && k-Math.floor(k) === 0) return Math.round(result);
    return result;
}

function func_factor(n){    
    if(n-Math.floor(n) !== 0) { 
        return [];
    }

    if(n <= 1) {
        return [n];
    }

    if(n > 10**11) { 
        //throw new Error('Number '+n+' is too large to factorize'); 
        //console.error('Number '+n+' is too large or too small to factorize');
        return [];
    }



    const sqrt = Math.sqrt(n);
    let a = [],
    f = 2;
    while (n > 1) {
        if (n % f === 0) {
            a.push(f);
            //a.push(n/f);
            n /= f;
        } else {
            f++;
        }
    }
    return a;
}

function dist_normal(mu,sg,x){
    const c = 1/(sg*Math.sqrt(2*Math.PI));
    const t = ((x-mu)/sg)**2;
    const k = c*Math.exp(-0.5*t);

    //log('Normal dist N('+mu+','+sg+') at x='+x+'='+c);
    
    return k;
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
    //log("imfo:");
    //log(Array.isArray(compiledExpressions));
    //log(Object.prototype.toString.call(compiledExpressions));
    //log(compiledExpressions);
    //log(compiledExpressions.constructor?.name);

    //log(compiledExpressions[0]);

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
