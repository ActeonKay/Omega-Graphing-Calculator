import { OperatorCode }  from "../default/defaultOperators.js";
/**
 * Evaluate uncertainty according to IB rules 
 * @param {*} code 
 * @param {*} args 
 * @returns 
 */
export function evalUncertainty(code, args){
    switch(code){
        case OperatorCode.ADD:
        case OperatorCode.SUB:
        case OperatorCode.LT:
        case OperatorCode.LTE:
        case OperatorCode.GT:
        case OperatorCode.GTE:
        case OperatorCode.EQ:
        case OperatorCode.NEQ:
            return args[1].attributes.uncertainty+args[0].attributes.uncertainty;
        case OperatorCode.MUL:
        case OperatorCode.DIV:
        case OperatorCode.AND:
        case OperatorCode.OR:
        case OperatorCode.XOR:
        //da/a = (dx/x+dy/y)
            return args[1]*args[0]*(args[1].attributes.uncertainty/args[1].value+args[0].attributes.uncertainty/args[0].value);
        case OperatorCode.POW:
        case OperatorCode.POWN:
        //da/a = e(db/b)
            return args[1].value*args[0].attributes.uncertainty/args[0].value;
        case OperatorCode.NEG:
        case OperatorCode.NOT:
        case OperatorCode.FACT: //what even happens here?
            return args[0].attributes.uncertainty;
        case OperatorCode.UNC:
            return args[0].value;
    }
}