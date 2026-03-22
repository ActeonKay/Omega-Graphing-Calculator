//propagation of boundaries (undefined, asymptotes, etc.)
import {
    OpCode
} from '../evaluator';

/**
 * Boundary data is formatted as: int[3]:
 * [
 *      crosses
 *      holes
 *      jumps
 * ]
 */

/**
 * 
 * @param {*} a Numeric value of the left operand
 * @param {*} boundaryDataA Boundary data of the left operand
 * @param {*} b Numeric value of the right operand
 * @param {*} boundaryDataB Boundary data of the right operand
 * @param {*} operatorCode Operator identifier code
 * @returns {*} Boundary data of result
 */
export function binaryOpAcrossBoundary(a,boundaryDataA,b,boundaryDataB,operatorCode){
    let crosses = 0;
    let jumps = 0;
    let holes = 0;
    switch(operatorCode){
        case OpCode.MUL:
        case OpCode.AND:
        case OpCode.OR:
        case OpCode.XOR:
            if((a > 0) != (a2 > 0)) crosses++; 
            if((b1 > 0) != (b2 > 0)) crosses++; 
            break;
        default:
            
    }

    return [crosses, jumps, holes];
}