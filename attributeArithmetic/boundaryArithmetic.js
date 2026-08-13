//propagation of boundaries (undefined, asymptotes, etc.)
import { 
    FunctionCode
} from '../default/defaultFunctions.js';
import { 
    OperatorCode
} from '../default/defaultOperators.js';

class Boundary{
    crosses;
    holes;
    jumps;

    constructor(crosses, holes, jumps){
        this.crosses=crosses;
        this.holes=holes;
        this.jumps=jumps;
    }
}

/**
 * Boundary data is formatted as: int[3]:
 * [
 *      crosses
 *      holes
 *      jumps
 * ]
 */

export function evalBoundary(code, args){
    console.assert(args.every((token) => token.value.length == 2));

    switch(code){
        case OperatorCode.ADD:
        case OperatorCode.SUB:
        case OperatorCode.UNC:
        case OperatorCode.LT:
        case OperatorCode.LTE:
        case OperatorCode.GT:
        case OperatorCode.GTE:
        case OperatorCode.EQ:
        case OperatorCode.NEQ:
            return boundaryAdd(args[1].value, args[1].attributes.boundary, args[0].value, args[0].attributes.boundary);
        case OperatorCode.MUL:
        case OperatorCode.AND:
        case OperatorCode.OR:
        case OperatorCode.XOR:
            return boundaryAnd(args[1].value, args[1].attributes.boundary, args[0].value, args[0].attributes.boundary);
        case OperatorCode.DIV:
            return boundaryDiv(args[1].value, args[1].attributes.boundary, args[0].value, args[0].attributes.boundary);
        case OperatorCode.POW:
        case OperatorCode.POWN:
            return boundaryPow(args[1].value, args[1].attributes.boundary, args[0].value, args[0].attributes.boundary);
        //unary:
        case OperatorCode.NOT:
        case OperatorCode.NEG:
            return args[0].attributes.boundary;
        case OperatorCode.FACT:
            return boundaryFact(args[0].value, args[0].attributes.boundary);
    }
}

function boundaryAdd(l, lBoundary, r, rBoundary){
    const [l1, l2] = l;
    const [r1, r2] = r;

    return [0, lBoundary[1]+rBoundary[1], lBoundary[2]+rBoundary[2]];
}

function boundaryAnd(l, lBoundary, r, rBoundary){
    const [l1, l2] = l;
    const [r1, r2] = r;

    let crosses = ((l1>0) != (l2>0)) ? 1 : 0 + ((r1>0) != (r2>0)) ? 1 : 0;
    return [crosses+lBoundary[0]+lBoundary[1], lBoundary[1]+rBoundary[1], lBoundary[2]+rBoundary[2]];
}

function boundaryDiv(l, lBoundary, r, rBoundary){
    const [l1, l2] = l;
    const [r1, r2] = r;

    let crosses = 0;
    let holes = lBoundary[1]+rBoundary[1];
    let jumps = lBoundary[2]+rBoundary[2];

    if((l1 > 0) != (l2 > 0)) crosses++; 
    if((r1 > 0) != (r2 > 0)) crosses++; 
    return [crosses, holes, jumps];
}

function boundaryPow(l, lBoundary, r, rBoundary){
    const [l1, l2] = l;
    const [r1, r2] = r;

    let crosses = 0;
    let holes = lBoundary[1]+rBoundary[1];
    let jumps = lBoundary[2]+rBoundary[2];

    if(l1>0 && l2 > 0) return [crosses, holes, jumps];

    const o1 = l1**r1;
    const o2 = l2**r2;

    if(o1 == NaN || o2 == NaN) holes++;

    if((o1 >= 0) != (o2 >= 0)){
        crosses++, holes++, jumps++;
    }

    return [crosses, holes, jumps];
}

function boundaryFact(l, lBoundary){
    const [l1, l2] = l;
    let [crosses, holes, jumps] = lBoundary;

    const n = Math.abs(
        Math.floor(l1)-Math.floor(l2)
    )-(
        Math.floor(Math.max(-1,l1,l2)+1)
        -Math.floor(Math.max(-1,Math.min(l1,l2))+1)
    );
    crosses += n;
    holes += n;
    jumps += n;
    return [crosses, holes, jumps];
}

export function generateBoundaryMethodExpression(code){
    //ASSUMPTION: function and operator ids don't overlap

    //inputs:
    //for unary operator: a1, a2
    //for binary operator: l1, l2, (two edges of left operand), r1, r2 (two edges of right operand)
    //for functions: 

    switch(code){
        case OperatorCode.ADD:
        case OperatorCode.SUB:
        case OperatorCode.LT:
        case OperatorCode.LTE:
        case OperatorCode.GT:
        case OperatorCode.GTE:
        case OperatorCode.EQ:
        case OperatorCode.NEQ:
            return (l, r) => {
                const [l1, l2, lBoundary] = l;
                const [r1, r2, rBoundary] = r;

                return [0, lBoundary[1]+rBoundary[1], lBoundary[2]+rBoundary[2]];
            }
        case OperatorCode.MUL:
        case OperatorCode.AND:
        case OperatorCode.OR:
        case OperatorCode.XOR:
            return (l, r) => {
                const [l1, l2, lBoundary] = l;
                const [r1, r2, rBoundary] = r;

                let crosses = ((l1>0) != (l2>0)) ? 1 : 0 + ((r1>0) != (r2>0)) ? 1 : 0;
                return [crosses+lBoundary[0]+lBoundary[1], lBoundary[1]+rBoundary[1], lBoundary[2]+rBoundary[2]];
            }
        case OperatorCode.DIV:
            return (l, r) => {
                const [l1, l2, lBoundary] = l;
                const [r1, r2, rBoundary] = r;

                let crosses = 0;
                let holes = lBoundary[1]+rBoundary[1];
                let jumps = lBoundary[2]+rBoundary[2];

                if((l1 > 0) != (l2 > 0)) crosses++; 
                if((r1 > 0) != (r2 > 0)) crosses++; 
                return [crosses, holes, jumps];
            }
        case OperatorCode.POW:
        case OperatorCode.POWN:
            return (l, r) => {
                const [l1, l2, lBoundary] = l;
                const [r1, r2, rBoundary] = r;

                let crosses = 0;
                let holes = lBoundary[1]+rBoundary[1];
                let jumps = lBoundary[2]+rBoundary[2];

                if(l1>0 && l2 > 0) return [crosses, holes, jumps];

                const o1 = l1**r1;
                const o2 = l2**r2;

                if(o1 == NaN || o2 == NaN) holes++;

                if((o1 >= 0) != (o2 >= 0)){
                    crosses++, holes++, jumps++;
                }

                return [crosses, holes, jumps];
            }
        default: 
            console.error("Unknown operator in edge comparison.");
            return;
    }
}

/**
 * Calculate the result boundary across a unary operation
 * @param {int} opcode operator id
 * @param {*} a1 
 * @param {*} a2 
 * @returns 
 */
export function computeBoundaryForUnaryOp(opcode, a1, a2){
    console.assert(a1 !== undefined && a2 !== undefined, a1, a2);

    var crosses = 0;
    var holes = 0;
    var jumps = 0;
    var undefined = false;

    var n;

    switch(opcode){
        case OperatorCode.NOT:
        case OperatorCode.NEG:
            crosses += ((a1>0) != (a2>0)) ? 1 : 0;
            //holes += a1.holes + a2.holes;
            //jumps = a1.jumps + a2.jumps;
            break;
        case OperatorCode.FACT:

            n = Math.abs(
                Math.floor(a1)-Math.floor(a2)
            )-(
                Math.floor(Math.max(-1,a1,a2)+1)
                -Math.floor(Math.max(-1,Math.min(a1,a2))+1)
            );
            crosses += n;
            holes += n;
            jumps += n;
            break;
    }

    if(!undefined) undefined = (holes > 0);
    return [crosses, holes, jumps, undefined];
}

/**
 * Calculate the result boundary across a binary operation
 * @param {*} opcode 
 * @param {*} a1 
 * @param {*} b1 
 * @param {*} a2 
 * @param {*} b2 
 * @returns 
 */
export function computeBoundaryForBinaryOp(opcode, a1, b1, a2, b2){
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
        case OperatorCode.ADD:
        case OperatorCode.SUB:
        case OperatorCode.LT:
        case OperatorCode.LTE:
        case OperatorCode.GT:
        case OperatorCode.GTE:
        case OperatorCode.EQ:
        case OperatorCode.NEQ:
            //??
            break;
        case OperatorCode.MUL:
        case OperatorCode.AND:
        case OperatorCode.OR:
        case OperatorCode.XOR:
            if((a1 > 0) != (a2 > 0)) crosses++; 
            if((b1 > 0) != (b2 > 0)) crosses++; 
            break;
        case OperatorCode.DIV:
            //  a/b

            log(a1,a2,b1,b2);

            //TODO: FIX BELOW
            if((a1*b1 > 0) !== (a2*b2 > 0)) {
                crosses++; 
            }

            //check denominator sign change:
            if((b1 > 0) !== (b2 > 0)) {
                log('cross:',b1,b2);
                crosses++;
                jumps++;
                holes++;
            }
            //jumps += crosses of arg2 instead of this ^^
            break;
        case OperatorCode.POW: 
        case OperatorCode.POWN:
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

/**
 * Calculate result boundary data across a function call
 * @param {*} funccode function id (int)
 * @param {*} args1 list of vertex 1 of each arg
 * @param {*} args2 list of vertex 2 of each arg
 * @param {*} edgeinfo list of edges of each argument
 * @returns 
 */
export function computeBoundaryForFunction(funccode, args1, args2, edgeinfo){
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
        case FunctionCode.FRAC: 
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
        case FunctionCode.SIN:
            crosses = Math.abs(Math.floor(args1[0]/Math.PI)-Math.floor(args2[0]/Math.PI));
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            //log(args1[0], args2[0], "=>", crosses);
            break;
        case FunctionCode.COS:
            n = Math.abs(
                Math.round(args1[0]/Math.PI + 0)
                -Math.round(args2[0]/Math.PI + 0)
            );
            crosses = n;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2];
            break;
        case FunctionCode.TAN:
        case FunctionCode.SEC:
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
        case FunctionCode.CSC:
        case FunctionCode.COT: 
            crosses = 0;
            n = Math.abs(
                Math.floor(args1[0]/Math.PI + 0)
                -Math.floor(args2[0]/Math.PI + 0)
            );
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FunctionCode.ASIN:
        case FunctionCode.ACOS:
        case FunctionCode.ATANH:
            n = Math.abs(negativeSmallOrPositive(args1[0])-negativeSmallOrPositive(args2[0]));
            crosses = 0;
            holes = ((n > 0) ? 1 : 0) + edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FunctionCode.ASEC:
        case FunctionCode.ACSC:
            n = Math.abs( negativeSmallOrPositive(args1[0]) - negativeSmallOrPositive(args2[0]) );

            holes = edgeinfo[0][1] + (n>0)?1:0;
            jumps = edgeinfo[0][2] + n;

            // //if they are across the gap, or if either of them is within the gap
            // if(!isSameSign(args1[0],args2[0]) || (Math.abs(args1[0]) < 1) || (Math.abs(args2[0]) < 1)){
            //     holes += 1;
            //     jumps += 1;
            // }
            break;
        case FunctionCode.ACOT:
            n=isSameSign(args1[0],args2[0]) ? 0 : 1;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
            break;
        case FunctionCode.CSCH:
        case FunctionCode.COTH:
        case FunctionCode.ACSCH:
            crosses = 0;
            n = ((args1[0] > 0) !== (args2[0] > 0)) ? 1 : 0;
            holes = n+edgeinfo[0][1];
            jumps = n+edgeinfo[0][2];
            break;
        case FunctionCode.ACOSH:
            n = isSameSign(args1[0]-1,args2[0]-1) ? 0 : 1;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
            //log(crosses,holes,jumps)
            break;
        case FunctionCode.ASECH:
            n = (args1[0] < 0 || args1[0] > 1)||(args2[0] < 0 || args2[0] > 1) ? 1 : 0;
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2];
            break;
        case FunctionCode.ACOTH:
            n = Math.abs(negativeSmallOrPositive(args1[0])-negativeSmallOrPositive(args2[0]));
            holes = edgeinfo[0][1]+n;
            jumps = edgeinfo[0][2]+n;
        //case 
        case FunctionCode.SQRT:
            crosses = 0;
            holes = edgeinfo[0][1] + (args1[0] < 0 != args2[0] < 0);
            jumps = edgeinfo[0][2];
            undefined = (args1[0] < 0 || args2[0] < 0);
            break;
        case FunctionCode.GAMMA:
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
        case FunctionCode.FLOOR:
        case FunctionCode.CEIL:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0])-Math.floor(args2[0]));
            break;
        case FunctionCode.TRUNC:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0])-Math.floor(args2[0]));
            if((args1[0]>0) !== (args2[0]>0)) jumps -= 1;
            break;
        case FunctionCode.ROUND:
            crosses = 0;
            holes = edgeinfo[0][1];
            jumps = edgeinfo[0][2] + Math.abs(Math.floor(args1[0]-0.5)-Math.floor(args2[0]-0.5));
            break;
        case FunctionCode.LN:
        case FunctionCode.LOG:
        case FunctionCode.LOGN:
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

    return [crosses, holes, jumps];
}