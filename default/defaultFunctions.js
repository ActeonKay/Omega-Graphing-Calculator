import { NumberType } from "../compiler.js";

export const FunctionCode = {
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

export const FunctionByLatex = {
    "\\sin": FunctionCode.SIN,
    "\\cos": FunctionCode.COS,
    "\\tan": FunctionCode.TAN,
    "\\csc": FunctionCode.CSC,
    "\\sec": FunctionCode.SEC,
    "\\cot": FunctionCode.COT,
    "\\arcsin": FunctionCode.ASIN,
    "\\arccos": FunctionCode.ACOS,
    "\\arctan": FunctionCode.ATAN,
    "\\arccsc": FunctionCode.ACSC,
    "\\arcsec": FunctionCode.ASEC,
    "\\arccot": FunctionCode.ACOT,
    "\\sinh": FunctionCode.SINH,
    "\\cosh": FunctionCode.COSH,
    "\\tanh": FunctionCode.TANH,
    "\\csch": FunctionCode.CSCH,
    "\\sech": FunctionCode.SECH,
    "\\coth": FunctionCode.COTH,
    "\\arcsinh": FunctionCode.ASINH,
    "\\arccosh": FunctionCode.ACOSH,
    "\\arctanh": FunctionCode.ATANH,
    "\\arccsch": FunctionCode.ACSCH,
    "\\arcsech": FunctionCode.ASECH,
    "\\arccoth": FunctionCode.ACOTH,
    "\\gd": FunctionCode.GD,
    "\\lam": FunctionCode.LAM,
    "\\abs": FunctionCode.ABS,
    "\\sign": FunctionCode.SIGN,
    "\\floor": FunctionCode.FLOOR,
    "\\ceil": FunctionCode.CEIL,
    "\\round": FunctionCode.ROUND,
    "\\trunc": FunctionCode.TRUNC,
    "\\mod": FunctionCode.MOD,
    "\\min": FunctionCode.MIN,
    "\\max": FunctionCode.MAX,
    "\\avg": FunctionCode.AVG,
    "\\med": FunctionCode.MED,
    "\\mode": FunctionCode.MODE,

    "\\exp": FunctionCode.EXP,
    "\\ln": FunctionCode.LN,
    "\\log": FunctionCode.LOG,
    "\\logn": FunctionCode.LOGN,
    "\\sqrt": FunctionCode.SQRT,
    "\\cbrt": FunctionCode.CBRT,
    "\\nthroot": FunctionCode.NTHRT,

    "\\Gamma": FunctionCode.GAMMA,
    //digamma
    //polygamma
    //zeta 
    //arctan2
    //Real
    //Image
    //Conjugate
    //complex abs()
    //complex argument = atan2(b,a)
    //amplitude or modulus of complex number
    //sinc
    //array
    //tuple
    // BINOM: 160,
    // IN: 161, //∈
    // NOTIN: 162, //∉
    // FACTOR: 163,
    // CIS: 164,

    // D_NORM: 170,
    // D_BINM: 171
}

export const FuncArgumentSchema = {
    1: { required: true, acceptedTypes: []}
}

const FuncArgumentInputType = {
    //BUNDLE; REAL
    //BUNDLE; COMPLEX
    //BUNDLE; TUPLE
    //ALL; REAL
    //ALL; COMPLEX
    //ALL; TUPLE
    //ALL; ARRAY
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


//{FunctionCode.SIN, 
export const Functions = new Map([
    [FunctionCode.FRAC, { code: FunctionCode.FRAC, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_NUMERIC}],
    [FunctionCode.SIN, { code: FunctionCode.SIN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.COS, { code: FunctionCode.COS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.TAN, { code: FunctionCode.TAN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.SEC, { code: FunctionCode.SEC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.CSC, { code: FunctionCode.CSC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.COT, { code: FunctionCode.COT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.ASIN, { code: FunctionCode.ASIN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACOS, { code: FunctionCode.ACOS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ATAN, { code: FunctionCode.ATAN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ASEC, { code: FunctionCode.ASEC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACSC, { code: FunctionCode.ACSC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACOT, { code: FunctionCode.ACOT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.SINH, { code: FunctionCode.SINH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.COSH, { code: FunctionCode.COSH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.TANH, { code: FunctionCode.TANH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.SECH, { code: FunctionCode.SECH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.CSCH, { code: FunctionCode.CSCH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.COTH, { code: FunctionCode.COTH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ASINH, { code: FunctionCode.ASINH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACOSH, { code: FunctionCode.ACOSH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ATANH, { code: FunctionCode.ATANH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ASECH, { code: FunctionCode.ASECH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACSCH, { code: FunctionCode.ACSCH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ACOTH, { code: FunctionCode.ACOTH, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.GD, { code: FunctionCode.GD, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.LAM, { code: FunctionCode.LAM, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL}],
    [FunctionCode.ABS, { code: FunctionCode.ABS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC}],
    [FunctionCode.SIGN, { code: FunctionCode.SIGN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL }],
    [FunctionCode.FLOOR, { code: FunctionCode.FLOOR, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL }],
    [FunctionCode.CEIL, { code: FunctionCode.CEIL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL }],
    [FunctionCode.ROUND, { code: FunctionCode.ROUND, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL }],
    [FunctionCode.TRUNC, { code: FunctionCode.TRUNC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.MOD, { code: FunctionCode.MOD, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL  }],
    [FunctionCode.MIN, { code: FunctionCode.MIN, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS  }],
    [FunctionCode.MAX, { code: FunctionCode.MAX, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS  }],
    [FunctionCode.AVG, { code: FunctionCode.AVG, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_NUMBERS  }],
    [FunctionCode.MED, { code: FunctionCode.MED, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ARRAY_SOFT_REALS  }],
    [FunctionCode.MODE, { code: FunctionCode.MODE, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.EXP, { code: FunctionCode.EXP, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC  }],
    [FunctionCode.LN, { code: FunctionCode.LN, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.LOG, { code: FunctionCode.LOG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.LOGN, { code: FunctionCode.LOGN, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL  }],
    [FunctionCode.SQRT, { code: FunctionCode.SQRT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.CBRT, { code: FunctionCode.CBRT, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_NUMERIC  }],
    [FunctionCode.NTHRT, { code: FunctionCode.NTHRT, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL  }],
    [FunctionCode.GAMMA, { code: FunctionCode.GAMMA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.DGAMA, { code: FunctionCode.DGAMA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.PGAMA, { code: FunctionCode.PGAMA, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.ZETA, { code: FunctionCode.ZETA, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    //"atan2": { code: FunctionCode.ATAN2, staticArgs: true, args: 2  },
    [FunctionCode.REAL, { code: FunctionCode.REAL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.IMAG, { code: FunctionCode.IMAG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.CONJ, { code: FunctionCode.CONJ, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.ABSCP, { code: FunctionCode.ABSCP, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.ARG, { code: FunctionCode.ARG, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.AMPL, { code: FunctionCode.AMPL, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_COMPLEX  }],
    [FunctionCode.SINC, { code: FunctionCode.SINC, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL }],
    [FunctionCode.ARRAY, { code: FunctionCode.ARRAY, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ALL_REAL, returnElementType: 0 }], //blank return type
    [FunctionCode.TUPLE, { code: FunctionCode.TUPLE, staticArgs: false, minArgs: 1, inputType: FuncArgumentInputType.ALL_REAL }],
    [FunctionCode.BINOM, { code: FunctionCode.BINOM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL }],
    [FunctionCode.FACTOR, { code: FunctionCode.FACTOR, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL, canAutoIndexResult: false }], //as result length may vary
    [FunctionCode.CIS, { code: FunctionCode.CIS, staticArgs: true, args: 1, inputType: FuncArgumentInputType.ONE_REAL  }],
    [FunctionCode.D_NORM, { code: FunctionCode.D_NORM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL}],
    [FunctionCode.D_BINM, { code: FunctionCode.D_BINM, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_REAL }]
]);

export const validFunctions = [
    "factor",
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
    //"not", "bool"
];

export function gamma(n) {
    if(n-Math.floor(n) === 0 && n<=0) return undefined; 
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

export function choose(n,k){
    const result = func_gamma(n+1)/(func_gamma(k+1)*func_gamma(n-k+1));

    //console.log('n,k,r:', n, k, result);

    if(n-Math.floor(n) === 0 && k-Math.floor(k) === 0) return Math.round(result);
    return result;
}

export function factor(n){    
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