export const OpCode = {
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

const OpAssociativity = {
    LEFT: 0,
    RIGHT: 1
};

//PEMDAS
const OpPrecedence = {
    LOGICAL: -2,
    EQUALITY: -1,
    COMPARISON: 0,
    ADDITIVE: 1,
    MULTIPLICATIVE: 2,

}

export const Operators = new Map([
    [OpCode.ADD, { symbol: "+", precedence: 1, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.SUB, { symbol: "-", precedence: 1, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.MUL, { symbol: "*", precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.DIV, { symbol: "/", precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.POW, { symbol: "^", precedence: 3, associativity: OpAssociativity.RIGHT, arity: 2 }],
    [OpCode.LT, { symbol: "<", precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.LTE, { symbol: "<=", precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.GT, { symbol: ">", precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.GTE, { symbol: ">=", precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.EQ, { symbol: "=", precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.EQEQ, { symbol: "==", precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.NEQ, { symbol: "!=", precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.AND, { symbol: "&&", precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.OR, { symbol: "||", precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.XOR, { symbol: "^^", precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.NOT, { symbol: "~", precedence: 5, associativity: OpAssociativity.RIGHT, arity: 1 }], //prefix unary (L)
    [OpCode.FACT, { symbol: "!", precedence: 5, associativity: OpAssociativity.LEFT, arity: 1 }], //suffix unary (R)
    [OpCode.NEG, { symbol: "u-", precedence: 3, associativity: OpAssociativity.RIGHT, arity: 1 }], //prefix unary (L)
    [OpCode.DPR, { symbol: "dot", precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.CRP, { symbol: "times", precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.ATT, { symbol: "\\", precedence: 101, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.POWN, { symbol: "^n", precedence: 6, associativity: OpAssociativity.RIGHT, arity: 2 }], //for things like x^2!, the x^2 should come first as it is not x^{2!}
    [OpCode.SUBS, { symbol: "_", precedence: 6, associativity: OpAssociativity.RIGHT, arity: 2 }],
    [OpCode.PM, { symbol: "±", precedence: 1.5, associativity: OpAssociativity.LEFT, arity: 2 }],
    [OpCode.PCT, { symbol: "%", precedence: 6, associativity: OpAssociativity.LEFT, arity: 1 }],
    [OpCode.DEG, { symbol: "degree", precedence: 6, associativity: OpAssociativity.LEFT, arity: 1}],
    [OpCode.ABS, { symbol: "abs", precedence: 6, associativity: OpAssociativity.LEFT, arity: 1}],
    [OpCode.UNC, { symbol: "±", precedence: 1.5, associativity: OpAssociativity.LEFT, arity: 2 }],
]);

const OpInfo = {
    "+": { code: OpCode.ADD, precedence: 1, associativity: OpAssociativity.LEFT, arity: 2 },
    "-": { code: OpCode.SUB, precedence: 1, associativity: OpAssociativity.LEFT, arity: 2 },
    "*": { code: OpCode.MUL, precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 },
    "cdot": { code: OpCode.MUL, precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 },
    "/": { code: OpCode.DIV, precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 },
    "^": { code: OpCode.POW, precedence: 3, associativity: OpAssociativity.RIGHT, arity: 2 },
    "<": { code: OpCode.LT, precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 },
    "<=": { code: OpCode.LTE, precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 },
    ">": { code: OpCode.GT, precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 },
    ">=": { code: OpCode.GTE, precedence: 0, associativity: OpAssociativity.LEFT, arity: 2 },
    "=": { code: OpCode.EQ, precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 },
    "==": { code: OpCode.EQ, precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 },
    "!=": { code: OpCode.NEQ, precedence: -1, associativity: OpAssociativity.LEFT, arity: 2 },
    "&&": { code: OpCode.AND, precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 },
    "||": { code: OpCode.OR, precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 },
    "^^": { code: OpCode.XOR, precedence: -2, associativity: OpAssociativity.LEFT, arity: 2 },
    "~": { code: OpCode.NOT, precedence: 5, associativity: OpAssociativity.RIGHT, arity: 1 }, //prefix unary (L)
    "!": { code: OpCode.FACT, precedence: 5, associativity: OpAssociativity.LEFT, arity: 1 }, //suffix unary (R)
    "u-": { code: OpCode.NEG, precedence: 3, associativity: OpAssociativity.RIGHT, arity: 1 }, //prefix unary (L)
    "times": { code: OpCode.CRP, precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 },
    "\\": {code: OpCode.ATT, precedence: 101, associativity: OpAssociativity.LEFT, arity: 2},
    "^n": { code: OpCode.POWN, precedence: 6, associativity: OpAssociativity.RIGHT, arity: 2 }, //for things like x^2!, the x^2 should come first as it is not x^{2!}
    "_": { code: OpCode.SUBS, precedence: 6, associativity: OpAssociativity.RIGHT, arity: 2},
    "±": { code: OpCode.PM, precedence: 1.5, associativity: OpAssociativity.LEFT, arity: 2 },
    "pm": { code: OpCode.PM, precedence: 1, associativity: OpAssociativity.LEFT, arity: 2 },
    "%": { code: OpCode.PCT, precedence: 6, associativity: OpAssociativity.LEFT, arity: 1 },
    "degree": { code: OpCode.DEG, precedence: 6, associativity: OpAssociativity.LEFT, arity: 1},
    "abs": { code: OpCode.ABS, precedence: 6, associativity: OpAssociativity.LEFT, arity: 1},
    "times": { code: OpCode.CRP, precedence: 2, associativity: OpAssociativity.LEFT, arity: 2 },
}

