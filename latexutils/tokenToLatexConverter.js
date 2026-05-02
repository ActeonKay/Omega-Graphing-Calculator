import {
    TokenType
} from '../evaluator.js';

const decimalAccuracy = 8;

export function convertTokenToLatex(token){
    switch(token.type){
        case TokenType.NUM: 
            let r = token.value;

            return convertRealToString(r);
        case TokenType.CMPLX:
            let a = token.value[0];
            let b = token.value[1];

            if(isNaN(a) || isNaN(b)) return '\\operatorname{NaN}';
            if(a === Infinity || a === -Infinity || b === Infinity || b === -Infinity) return '\\operatorname{NaN}'; //How should I handle this?
            if(a === undefined || b === undefined) return '\\operatorname{undefined}';

            if(isTooSmallToDisplay(a) && isTooSmallToDisplay(b)) return '0';

            let sign = b < 0 ? '-' : (a === 0 || b === 0 ? '' : '+');

            a = (a === 0) ? '' : a;
            b = Math.abs(b);
            b = b === 0 ? '' : (b === 1 ? 'i' : b+'i');

            return a+sign+b;
        case TokenType.ARRAY:
            const elementType = token.elementType;

            let result = convertTokenToLatex({type: elementType, value: token.value[0]});
            for(let i = 1; i < token.value.length; i++){
                result = result+','+convertTokenToLatex({type: token.elementType, value: token.value[i]});
            }

            return '\\left['+result+'\\right]';
        case TokenType.TUPLE:
            let nums = convertRealToString(token.value[0]);
            for(let i = 1; i < token.value.length; i++){
                nums = nums+','+convertRealToString(token.value[i]);
            }
            return '\\left('+nums+'\\right)';
    }
}

export function convertRealToString(r, canRecurse = true){
    if(isNaN(r)) return '\\operatorname{NaN}';
    if(r === Infinity) return '\\infty';
    if(r === -Infinity) return '-\\infty';
    if(r === undefined) return '\\operatorname{undefined}';
    if(r === 0) return '0';

    console.assert(typeof r === 'number');

    if((isTooLargeToDisplay(r) || isTooSmallToDisplay(r)) && canRecurse) {
        const pow = Math.floor(Math.log10(Math.abs(r)));
        const mantissa = r/(10**pow);

        console.log('pow,mant:',pow,mantissa);

        //safe to assume that no infinite recursion occurs 
        return convertRealToString(mantissa, false).substring(0,decimalAccuracy+2)+'\\cdot 10^{'+pow+'}';
    }
    return ''+r;
}

function isTooLargeToDisplay(r){
    return Math.abs(r)>10**decimalAccuracy;
}

function isTooSmallToDisplay(r){
    return Math.abs(r)<10**-decimalAccuracy || (''+r).includes('e');
}