//complex numbers a+bi represented as [a, b]
import { OperatorCode } from '../default/defaultOperators.js';
import { FunctionCode } from '../default/defaultFunctions.js';

export function convertValueToComplex(value){
    return value.length === undefined ? [value,0] : value;
}

/**
 * 
 * @param opcode 
 * @returns 
 */
export function generateComplexOperatorMethodExpression(opcode){
    switch(opcode){
        case OperatorCode.ADD: return (a,b)=>complexRound(complexAdd(a,b));
        case OperatorCode.SUB: return (a,b)=>complexRound(complexSubtract(a,b));
        case OperatorCode.MUL: return (a,b)=>complexRound(complexMultiply(a,b));
        case OperatorCode.DIV: return (a,b)=>complexRound(complexDivide(a,b));
        case OperatorCode.POW: 
        case OperatorCode.POWN: return (a,b)=>complexRound(complexPow(a,b));
        case OperatorCode.LT: return (a,b)=>a[0]<b[0];
        case OperatorCode.LTE: return (a,b)=>a[0]<=b[0];
        case OperatorCode.GT: return (a,b)=>a[0]>b[0];
        case OperatorCode.GTE: return (a,b)=>a[0]>=b[0];
        case OperatorCode.EQ: return (a,b)=>a[0]==b[0];
        case OperatorCode.NEQ: return (a,b)=>a[0]==b[0];
        case OperatorCode.AND: return (a,b)=>0;
        case OperatorCode.OR: return (a,b)=>0;
        case OperatorCode.XOR: return (a,b)=>0;
        case OperatorCode.NOT: return (a,b)=>0;
        case OperatorCode.FACT: return (a)=>0; //complex gamma?
        case OperatorCode.NEG: return (a)=>[0-a[0],0-a[1]];
        case OperatorCode.DPR: return (a,b)=>0;
        case OperatorCode.CRP: return (a,b)=>0;
        case OperatorCode.ATT: return (a,b)=>0;
        case OperatorCode.SUBS: return (a,b)=>0;
        case OperatorCode.PM: return (a,b)=>[a[0],a[1]];
        case OperatorCode.PCT: return (a)=>[0.01*a[0],0.01*a[1]];
        case OperatorCode.DEG: return (a)=>[57.2957795131*a[0],57.2957795131*a[1]];
        case OperatorCode.ABS: return complexModulus;
        default:
            console.error('Unknown op code passed to complex methodExpr generator: ', opcode);
            return (a,b)=>[0,0]; 
    }
}

export function generateComplexFunctionMethodExpression(funccode){
    switch (funccode) {
        case FunctionCode.FRAC: return (a,b) => complexRound(complexDivide(a,b));
        // case FunctionCode.BINOM: return (a,b) => func_choose(b,a);
        case FunctionCode.SIN: 
            return complexSin;
            // return (a) => {
            //     let e = a/Math.PI;
            //     if(e===0||isNaN(e)) return e;
            //     if(!isFinite(e))return NaN;
            //     if(e===Math.floor(e)) 
            //         return e > 0 ? 0 : -0; //sign of e
            //     let t = Math.round(2 * e), //double the number, then round that
            //         r = -0.5 * t + e, //num - (num rounded to nearest half)
            //         n = t & 2 ? -1 : 1, //if t is even, -1, else 1
            //         o = t & 1 ? Math.cos(Math.PI*r) : Math.sin(Math.PI*r); //if t is odd: cos, else sin
            //     return n*o;
            // }
        case FunctionCode.COS: return complexCos;
        case FunctionCode.TAN: return complexTan;
        case FunctionCode.SEC: return complexSec;
        case FunctionCode.CSC: return complexCsc;
        case FunctionCode.COT: return complexCot;
        case FunctionCode.ASIN: return (a) => Math.asin(a); 
        case FunctionCode.ACOS: return (a) => Math.acos(a); 
        case FunctionCode.ATAN: return (a) => Math.atan(a); 
        case FunctionCode.ASEC: return (a) => Math.acos(1 / a); 
        case FunctionCode.ACSC: return (a) => Math.asin(1 / a); 
        case FunctionCode.ACOT: return (a) => Math.atan(1 / a); 
        case FunctionCode.SINH: return (a) => 0.5*(Math.exp(a)-Math.exp(-a)); 
        case FunctionCode.COSH: return (a) => 0.5*(Math.exp(a)+Math.exp(-a)); 
        case FunctionCode.TANH: return (a) => (Math.exp(a)-Math.exp(-a))/(Math.exp(a)+Math.exp(-a));
        case FunctionCode.SECH: return (a) => 2/(Math.exp(a)+Math.exp(-a)); 
        case FunctionCode.CSCH: return (a) => 2/(Math.exp(a)-Math.exp(-a)); 
        case FunctionCode.COTH: return (a) => (Math.exp(a)+Math.exp(-a))/(Math.exp(a)-Math.exp(-a));
        case FunctionCode.ASINH: return (a) => Math.log(a+Math.sqrt(a*a+1));
        case FunctionCode.ACOSH: return (a) => Math.log(a+Math.sqrt(a*a-1));
        case FunctionCode.ATANH: return (a) => 0.5*Math.log((1+a)/(1-a));
        case FunctionCode.ASECH: return (a) => Math.log(1/a+Math.sqrt(1/(a*a)-1));
        case FunctionCode.ACSCH: return (a) => Math.log(1/a+Math.sqrt(1/(a*a)+1));
        case FunctionCode.ACOTH: return (a) => 0.5*Math.log((a+1)/(a-1));
        case FunctionCode.GD: return (a) => Math.atan(Math.sinh(a)); 
        case FunctionCode.LAM: return (a) => a; 
        case FunctionCode.ABS: return (a) => Math.abs(a); 
        case FunctionCode.SIGN: return (a) => Math.sign(a); 
        case FunctionCode.FLOOR: return (a) => Math.floor(a); 
        case FunctionCode.CEIL: return (a) => Math.ceil(a); 
        case FunctionCode.ROUND: return (a) => Math.round(a); 
        case FunctionCode.TRUNC: return (a) => Math.trunc(a); 
        case FunctionCode.MOD: return (a,b) => a % b; 
        case FunctionCode.MIN: return (...a) => Math.min(...a); 
        case FunctionCode.MAX: return (...a) => Math.max(...a); 
        //sum()
        //
        /* Todo: add handling for variables that are arrays */
        case FunctionCode.ARRAY: //{type: TokenType.ARRAY, valueType: TokenType.NUM, values: [], uncertainties: []}
            return (...args) => {
                console.log('compargs',args);

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
        case FunctionCode.TUPLE: //{type: TokenType.TUPLE, valueType: TokenType.NUM, values: [], uncertainties: []}
            return (...args) => {
                if(arg.outputType !== TokenHandleType.REAL || arg.outputType !== TokenHandleType.COMPLEX){
                    console.error('All tuple elements must be of real or complex type. ');
                    return [];
                }

                return args.reverse();
            } //args are passed in backwards order
        case FunctionCode.AVG: 
            return (...args) => {
                var sum = 0;
                for (var i = 0; i < args.length; i++) {
                    sum += args[i];
                }
                return sum / args.length;
            }   
        case FunctionCode.MED:
            return (...args) => {
                if (args.length % 2 == 1) return args[(args.length - 1) / 2];
                else {
                    var mid = args.length / 2;
                    return args[mid - 1] + args[mid]
                }
            }
        case FunctionCode.MODE: return (a) => a; 
        case FunctionCode.EXP: return complexExp;
        case FunctionCode.LN: return (a) => Math.log(a); 
        case FunctionCode.LOG: 
            if(attributes.get(AttributiveCode.BASE) === undefined) return (a) => Math.log(a) / Math.log(10); 
            else return (a) => Math.log(a) / Math.log(attributes.get(AttributiveCode.BASE));
        
        case FunctionCode.LOGN: return (a,b) => Math.log(a) / Math.log(b); 
        case FunctionCode.SQRT: return (a) => complexPowReal(a,0.5); 
        case FunctionCode.CBRT: return (a) => complexPowReal(a,1/3); 
        case FunctionCode.NTHRT: return (a,b) => Math.pow(a, 1 / b); 
        case FunctionCode.GAMMA: return (a) => func_gamma(a); 
        case FunctionCode.DGAMA: return (a)=>0; 
        case FunctionCode.PGAMA: return (a)=>0; 
        case FunctionCode.ZETA: return (a)=>0; 
        case FunctionCode.SINC: return (a)=>a===0?1:Math.sin(a)/a;
        case FunctionCode.FACTOR: return (a) => func_factor(Math.floor(a));
        case FunctionCode.CONJ: return (a) => complexConjugate(a);
        case FunctionCode.REAL: return (a) => Real(a);
        case FunctionCode.IMAG: return (a) => Imag(a);
        case FunctionCode.ABS:
        case FunctionCode.ABSCP: return (a) => complexModulus(a);
        case FunctionCode.ARG: return (a) => complexArgument(a);
        case FunctionCode.CIS: return (a) => complexRound(complexCis(a));
        default: 
            console.error("Unknown function code", funccode);
            return ()=>0;
            break;
    }
}

export function complexAdd(a,b){
    return [a[0]+b[0],a[1]+b[1]];
}

export function complexSubtract(a,b){
    return [a[0]-b[0],a[1]-b[1]];
}

export function complexMultiply(a,b){
    return [
        a[0]*b[0]-a[1]*b[1],
        a[0]*b[1]+a[1]*b[0]
    ];
}

export function complexDivide(b,a){
    return complexMultiply(complexPowReal(b,-1),a);

    const d = 1/complexModulus(b);
    return [
        (a[0]*b[0]+a[1]*b[1])*d,
        (a[1]*b[0]-a[0]*b[1])*d,
    ];
}

export function complexPow(a,b){
    if(b[1] === 0) return complexPowReal(a,b[0]);

    const r = complexModulus(a);
    const theta = complexArgument(a);

    const phi = b[0]*theta+b[1]*Math.log(r);

    const k = r**b[0]*Math.exp(-b[1]*theta);

    console.log(r,theta,phi,k);

    return complexRCis(phi,k);
}

export function complexPowReal(a,n){
    const phi = complexArgument(a);
    const r = complexModulus(a);

    return complexRCis(n*phi,r**n);
}

export function complexRoots(a,n){
    if(n-Math.floor(n) !== 0) return [];

    const phi = complexArgument(a);
    const rIn = complexModulus(a);
    const rOut = rIn**(1/n);

    const dTheta = Math.PI*2/n;

    let roots = [];
    for(let theta = phi/n; theta<Math.PI*2; theta+=dTheta){
        roots.push(complexRCis(theta,rOut));
    }
    return roots;
}

export function complexConjugate(a){
    return [a[0],-a[1]];
}

export function Real(a){
    return a[0];
}

export function Imag(a){
    return a[1];
}

export function complexModulus(a){
    return Math.hypot(a[0],a[1]);
}

export function complexArgument(a){
    return Math.atan2(a[1],a[0]);
}

export function complexCis(theta){
    return [Math.cos(theta),Math.sin(theta)];
}

export function complexRCis(theta,r){
    return [r*Math.cos(theta),r*Math.sin(theta)];
}

//helper functions

function complexRound(a,digits){
    const factor = Math.pow(10, 12);

    return [
        Math.round((a[0] + Number.EPSILON) * factor) / factor,
        Math.round((a[1] + Number.EPSILON) * factor) / factor
    ];
}

function complexInverse(z){
    const d = 1/Math.hypot(z[0],z[1]);

    return [
        z[0]*d,
        -z[1]*d
    ];
}

//analytic continuations

function complexExp(z){
    return [
        Math.exp(z[0])*Math.cos(z[1]),
        Math.exp(z[0])*Math.sin(z[1])
    ];
}

function complexSin(z){
    return [
        Math.sin(z[0])*Math.cosh(z[1]),
        Math.cos(z[0])*Math.sinh(z[1])
    ];
}

function complexCos(z){
    return [
        Math.cosh(z[0])*Math.cosh(z[1]),
        Math.sin(z[0])*Math.sinh(z[1])
    ];
}

function complexTan(z){
    const k = 1/(Math.cos(2*z[0])+Math.cosh(2*z[1]));

    return [
        k*Math.sin(2*z[0]),
        k*Math.sinh(2*z[1])
    ];
}

function complexSec(z){
    const cx = Math.cos(z[0]);
    const chy = Math.cosh(z[1]);

    const sx = Math.sin(z[0]);
    const shy = Math.sinh(z[1]);

    const k = 1/(cx*cx+shy*shy);

    return [
        cx*chy*k,
        sx*shy*k
    ];
}

function complexCsc(z){
    const sx = Math.sin(z[0]);
    const cx = Math.cos(z[0]);

    const shy = Math.sinh(z[1]);
    const chy = Math.cosh(z[1]);

    const k = 1/(sx*sx+shy*shy);

    return [
        sx*chy*k,
        -cx*shy*k
    ];
}

function complexCot(z){
    const k = 1/(Math.cosh(2*z[1])-Math.cos(2*z[0]));

    return [
        Math.sin(2*z[0])*k,
        -Math.sinh(2*z[1])*k
    ];
}