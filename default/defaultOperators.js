export const OperatorCode = {
    ADD: 1, //binary +
    SUB: 2, //binary -
    MUL: 3, //binary *
    DIV: 4, //binary /
    POW: 5, //binary ^ (inline)
    LT: 6, //binary <
    LTE: 7, //binary <=
    GT: 8, //binary >
    GTE: 9, //binary >=
    EQ: 10, //binary == (equality--determination)
    NEQ: 11, //binary !=
    AND: 12, //binary and
    OR: 13, //binary or
    XOR: 14, //binary xor
    NOT: 15, //unary not (tilde symbol)
    FACT: 16, //unary factorial (bang symbol)
    NEG: 17, //unary negation
    DPR: 18, //dot product
    CRP: 19, //cross product
    ATT: 20, //attributive operator
    POWN: 21, //binary ^ (superscript)
    SUBS: 22, //binary subscript
    PM: 23, //binary plus-minus
    PCT: 24, //unary percentage modifier
    DEG: 25, //unary degree modifier
    ABS: 26, //unary absolute value
    UNC: 27, //binary uncertainty operator
    EQEQ: 28, //binary (equality--assertion)
}

export const OperatorByLatex = {
    "+": OperatorCode.ADD,
    "-": OperatorCode.SUB,
    "*": OperatorCode.MUL,
    "\\cdot": OperatorCode.MUL,
    "/": OperatorCode.DIV,
    "^": OperatorCode.POW,
    "<": OperatorCode.LT,
    "\\leq": OperatorCode.LTE,
    ">": OperatorCode.GT,
    "\\geq": OperatorCode.GTE,
    "=": OperatorCode.EQ,
    "==": OperatorCode.EQEQ,
    "\\neq": OperatorCode.NEQ,
    "\\wedge": OperatorCode.AND,
    "\\vee": OperatorCode.OR,
    "\\oplus": OperatorCode.XOR,
    "\\sim": OperatorCode.NOT,
    "!": OperatorCode.FACT,
    "u-": OperatorCode.NEG,
    //"\\cdot": OperatorCode.DPR,
    "\\times": OperatorCode.CRP,
    "\\backslash": OperatorCode.ATT,
    "^n": OperatorCode.POWN,
    "_": OperatorCode.SUBS,
    "\\pm": OperatorCode.PM,
    "\\%": OperatorCode.PCT,
    "\\degree": OperatorCode.DEG,
    "\\operatorname{abs}": OperatorCode.ABS,
    "\\pm": OperatorCode.UNC,
    "==": OperatorCode.EQEQ
}

export const OperatorAssociativity = {
    LEFT: 0,
    RIGHT: 1
};

//PEMDAS
const OperatorPrecedence = {
    LOGICAL: -2,
    EQUALITY: -1,
    COMPARISON: 0,
    ADDITIVE: 1,
    MULTIPLICATIVE: 2,

}

export const Operators = new Map([
    [OperatorCode.ADD, { symbol: "+", precedence: 1, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.SUB, { symbol: "-", precedence: 1, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.MUL, { symbol: "*", precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.DIV, { symbol: "/", precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.POW, { symbol: "^", precedence: 3, associativity: OperatorAssociativity.RIGHT, arity: 2 }],
    [OperatorCode.LT, { symbol: "<", precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.LTE, { symbol: "<=", precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.GT, { symbol: ">", precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.GTE, { symbol: ">=", precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.EQ, { symbol: "=", precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.EQEQ, { symbol: "==", precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.NEQ, { symbol: "!=", precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.AND, { symbol: "&&", precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.OR, { symbol: "||", precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.XOR, { symbol: "^^", precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.NOT, { symbol: "~", precedence: 5, associativity: OperatorAssociativity.RIGHT, arity: 1 }], //prefix unary (L)
    [OperatorCode.FACT, { symbol: "!", precedence: 5, associativity: OperatorAssociativity.LEFT, arity: 1 }], //suffix unary (R)
    [OperatorCode.NEG, { symbol: "u-", precedence: 3, associativity: OperatorAssociativity.RIGHT, arity: 1 }], //prefix unary (L)
    [OperatorCode.DPR, { symbol: "dot", precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.CRP, { symbol: "times", precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.ATT, { symbol: "\\", precedence: 101, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.POWN, { symbol: "^n", precedence: 6, associativity: OperatorAssociativity.RIGHT, arity: 2 }], //for things like x^2!, the x^2 should come first as it is not x^{2!}
    [OperatorCode.SUBS, { symbol: "_", precedence: 6, associativity: OperatorAssociativity.RIGHT, arity: 2 }],
    [OperatorCode.PM, { symbol: "±", precedence: 1.5, associativity: OperatorAssociativity.LEFT, arity: 2 }],
    [OperatorCode.PCT, { symbol: "%", precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1 }],
    [OperatorCode.DEG, { symbol: "degree", precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1}],
    [OperatorCode.ABS, { symbol: "abs", precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1}],
    [OperatorCode.UNC, { symbol: "±", precedence: 1.5, associativity: OperatorAssociativity.LEFT, arity: 2 }],
]);

const validOperators = ["+", "-", "\\cdot", "/", "^", "<", "\\leq", ">", "\\geq", "=", "\\neq", "\\wedge", "\\vee", "\\otimes", "\\neg", "\\%", "_"];

export const OperatorInfo = {
    "+": { code: OperatorCode.ADD, precedence: 1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "-": { code: OperatorCode.SUB, precedence: 1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "*": { code: OperatorCode.MUL, precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "cdot": { code: OperatorCode.MUL, precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "/": { code: OperatorCode.DIV, precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "^": { code: OperatorCode.POW, precedence: 3, associativity: OperatorAssociativity.RIGHT, arity: 2 },
    "<": { code: OperatorCode.LT, precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "<=": { code: OperatorCode.LTE, precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 },
    ">": { code: OperatorCode.GT, precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 },
    ">=": { code: OperatorCode.GTE, precedence: 0, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "=": { code: OperatorCode.EQ, precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "==": { code: OperatorCode.EQ, precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "!=": { code: OperatorCode.NEQ, precedence: -1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "&&": { code: OperatorCode.AND, precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "||": { code: OperatorCode.OR, precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "^^": { code: OperatorCode.XOR, precedence: -2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "~": { code: OperatorCode.NOT, precedence: 5, associativity: OperatorAssociativity.RIGHT, arity: 1 }, //prefix unary (L)
    "!": { code: OperatorCode.FACT, precedence: 5, associativity: OperatorAssociativity.LEFT, arity: 1 }, //suffix unary (R)
    "u-": { code: OperatorCode.NEG, precedence: 3, associativity: OperatorAssociativity.RIGHT, arity: 1 }, //prefix unary (L)
    "times": { code: OperatorCode.CRP, precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "\\": {code: OperatorCode.ATT, precedence: 101, associativity: OperatorAssociativity.LEFT, arity: 2},
    "^n": { code: OperatorCode.POWN, precedence: 6, associativity: OperatorAssociativity.RIGHT, arity: 2 }, //for things like x^2!, the x^2 should come first as it is not x^{2!}
    "_": { code: OperatorCode.SUBS, precedence: 6, associativity: OperatorAssociativity.RIGHT, arity: 2},
    "±": { code: OperatorCode.PM, precedence: 1.5, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "pm": { code: OperatorCode.PM, precedence: 1, associativity: OperatorAssociativity.LEFT, arity: 2 },
    "%": { code: OperatorCode.PCT, precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1 },
    "degree": { code: OperatorCode.DEG, precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1},
    "abs": { code: OperatorCode.ABS, precedence: 6, associativity: OperatorAssociativity.LEFT, arity: 1},
    "times": { code: OperatorCode.CRP, precedence: 2, associativity: OperatorAssociativity.LEFT, arity: 2 },
}

