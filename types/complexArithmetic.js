//complex numbers a+bi represented as [a, b]
import{
    OpCode
} from '../evaluator.js';

/**
 * 
 * @param opcode 
 * @returns 
 */
export function generateComplexOperatorMethodExpression(opcode){
    switch(opcode){
        case OpCode.ADD: return (a,b)=>complexAdd(a,b);
        case OpCode.SUB: return (a,b)=>complexSubtract(a,b);
        case OpCode.MUL: return (a,b)=>complexMultiply(a,b);
        case OpCode.DIV: return (a,b)=>complexDivide(a,b);
        case OpCode.POW: 
        case OpCode.POWN: return (a,n)=>complexPow(a,n);
        case OpCode.LT: return (a,b)=>a[0]<b[0];
        case OpCode.LTE: return (a,b)=>a[0]<=b[0];
        case OpCode.GT: return (a,b)=>a[0]>b[0];
        case OpCode.GTE: return (a,b)=>a[0]>=b[0];
        case OpCode.EQ: return (a,b)=>a[0]==b[0];
        case OpCode.NEQ: return (a,b)=>a[0]==b[0];
        case OpCode.AND: return (a,b)=>0;
        case OpCode.OR: return (a,b)=>0;
        case OpCode.XOR: return (a,b)=>0;
        case OpCode.NOT: return (a,b)=>0;
        case OpCode.FACT: return (a)=>0; //complex gamma?
        case OpCode.NEG: return (a)=>[-a[0],-a[1]];
        case OpCode.DPR: return (a,b)=>0;
        case OpCode.CRP: return (a,b)=>0;
        case OpCode.ATT: return (a,b)=>0;
        case OpCode.SUBS: return (a,b)=>0;
        case OpCode.PM: return (a,b)=>[a[0],a[1]];
        case OpCode.PCT: return (a)=>[0.01*a[0],0.01*a[1]];
        case OpCode.DEG: return (a)=>[57.2957795131*a[0],57.2957795131*a[1]];
        case OpCode.ABS: return (a)=>complexModulus(a);
        default:
            console.error('Unknown op code passed to complex methodExpr generator: ', opcode);
            return (a,b)=>[0,0]; 
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

export function complexDivide(a,b){
    const d = complexModulus(b);
    return [
        (a[0]*b[0]+a[1]*b[1])/d,
        (a[1]*b[0]-a[0]*b[1])/d,
    ];
}

export function complexPow(a,n){
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

export function complexModulus(a){
    return Math.hypot(a[0],a[1]);
}

export function complexArgument(a){
    Math.atan2(a[1],a[0]);
}

export function complexCis(theta){
    return [Math.cos(theta),Math.sin(theta)];
}

export function complexRCis(theta,r){
    return [r*Math.cos(theta),r*Math.sin(theta)];
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
        Math.sin(z[0])*Math.cosh(z[1]),
        Math.cos(z[0])*Math.sinh(z[1])
    ];
}