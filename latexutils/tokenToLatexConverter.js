import {
    TokenType
} from '../evaluator.js';

const decimalAccuracy = 8;

export function convertTokenToLatex(token){
    switch(token.type){
        case TokenType.NUM: 
            let r = token.value;

            if(isNaN(r)) return '\\operatorname{NaN}';
            if(r === Infinity) return '\\infty';
            if(r === -Infinity) return '-\\infty';
            if(r === undefined) return '\\operatorname{undefined}';

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

            let realString = '';
            if(!isTooSmallToDisplay(a)) realString = convertRealToString(a);

            let imagString = '';
            if(!isTooSmallToDisplay(b)) imagString = (b>0 ? '+' : '') + convertRealToString(b) + 'i';

            let str = realString+imagString;

            return str.length > 0 ? str : '0';
        case TokenType.ARRAY:
            let result = convertTokenToLatex({type: token.elementType, value: token.value[0]});
            for(let i = 1; i < token.value.length; i++){
                result = result+','+convertTokenToLatex({type: token.elementType, value: token.value[i]});
            }

            return '\\left['+result+'\\right]';
    }
}

function convertRealToString(r, canRecurse = true){
    console.assert(typeof r === 'number');

    if(r === 0) return '0';

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