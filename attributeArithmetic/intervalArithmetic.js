//actual interval arithmetic
import {
    OpCode,
    FuncCode
} from '../evaluator';

import {
    gamma
} from '../functions/defaultFunctions';

class Interval{
    min;
    max;
    constructor(min,max){
        if(max<min) throw new Error('Interval maximum cannot be less than than minimum.');
        this.min=min;
        this.max=max;
    }
}

class IntervalSet{
    intervals;
    constructor(intervals){
        if(intervals.some(
            (interval) => !interval instanceof Interval)
        ) throw new Error('Interval set must consist of intervals');

        this.intervals=intervals;
    }
}

export function computeIntervalForUnaryOp(opcode, inputInterval){
    const minIn = inputInterval.min;
    const maxIn = inputInterval.max;

    switch(opcode){
        case OpCode.NEG:
            return new IntervalSet([new Interval(-maxIn, -minIn)]);
        case OpCode.FACT:
            if(minIn>-1) new IntervalSet([new Interval(gamma(minIn), gamma(maxIn))]);

            return new Interval(-Infinity,Infinity);
            //TODO: finish this what the fuck how do i find the result intervals?
        case OpCode.NOT:
            return new Interval(-Infinity,Infinity);
            //throw new Error('Not operator cannot be used on an interval'); 
        default:
            //??
            return new Interval(-Infinity,Infinity); 
            //throw new Error('Invalid operator'); 
    }
}

export function computeIntervalForBinaryOp(opcode, aIn, bIn){
    switch(opcode){
        case OpCode.ADD: return new Interval(aIn.min+bIn.min, aIn.max+bIn.max);
        case OpCode.SUB: return new Interval(aIn.min-bIn.max, aIn.max-bIn.min);
        case OpCode.MUL: return new Interval(aIn.min*bIn.min, aIn.max*bIn.max);
        case OpCode.DIV: return new Interval(aIn.min+bIn.min, aIn.max+bIn.max);
        case OpCode.POW:
            if(bIn.min == bIn.max){
                if(bIn.min%1 !== 0) return new Interval(aIn.min**bIn.min, aIn.max**bIn.max);
            }

            return new Interval(aIn.min**bIn.min, aIn.max**bIn.max);
    }
}