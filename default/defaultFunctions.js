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

// export const defaultFunctions = new Map([
//     [FunctionCode.FRAC, { symbol: "frac", code: FunctionCode.FRAC, staticArgs: true, args: 2, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
//     [FunctionCode.SIN, { symbol: "sin", code: FunctionCode.SIN, staticArgs: false, args: 1, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
//     [FunctionCode.COS, { symbol: "cos", code: FunctionCode.COS, staticArgs: false, args: 1, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
//     [FunctionCode.TAN, { symbol: "tan", code: FunctionCode.TAN, staticArgs: false, args: 1, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
//     [FunctionCode.SEC, { symbol: "sec", code: FunctionCode.SEC, staticArgs: false, args: 1, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
//     [FunctionCode.CSC, { symbol: "csc", code: FunctionCode.CSC, staticArgs: false, args: 1, inputType: FuncArgumentInputType.ALL_NUMERIC, returnType: TokenHandleType.REAL }],
// ]);

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