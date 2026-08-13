import {
    TokenType
} from '../compiler.js';

const decimalAccuracy = 8;

export function convertTokenToLatex(token){
    if(isFinite(token)) return convertRealToString(token);

    let r = token.value;
    const str = convertRealToString(r);
    const uncertaintySuffix = token.attributes.uncertainty ? '\\pm'+convertRealToString(token.attributes.uncertainty) : '';

    return str+uncertaintySuffix;
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