/**
 * Smart sin(pi*x)
 * @param {*} e 
 * @returns 
 */
function PZ(e){
    if(e===0||isNaN(e)) return e;
    if(!isFinite(e))return NaN;
    if(e===Math.floor(e)) 
        return e > 0 ? 0 : -0; //sign of e
    let t = Math.round(2 * e), //double the number, then round that
        r = -0.5 * t + e, //num - (num rounded to nearest half)
        n = t & 2 ? -1 : 1, //if t is even, -1, else 1
        o = t & 1 ? Math.cos(Math.PI*r) : Math.sin(Math.PI*r); //if t is odd: cos, else sin
    return n*o
}

function Xa(e){
    return e===1/0 || e===-1/0
        ? 0
        : e===0 ? 1 : PZ(e) / (Math.PI*e)
}

/**
 * Average of number[]
 * @param {*} e Array
 * @returns 
 */
function jp(e){
    let t=0;
    for(let r=0; r<e.length; r++) t+=e[r];
    return t/e.length
}

/**
 * Sum of number[]
 * @param {*} e 
 * @returns 
 */
function Eb(e){
    let t=0;
    for(let r=0; r<e.length; r++) t+=e[r];
    return t
}


function qI(e){
    if(e===1/0) return 1/Math.sqrt(2*Math.PI);
    let t = Fs(0.5*(e+1))-Fs(0.5*e)+0.5*(e*(Math.log1p(1/e)-1/e));
    return Math.exp(t) / Math.sqrt(2*Math.PI*(1+1/(e*(3*e+4))))
}

function uy(e,t,r=e-t){
    if(Math.abs(r)<0.1*(e+t)) {
        let n = r/(e+t), o=r*r/(e+t), i=2*e*n;
        for(let s=1; s<10; s++){
            i *= n*n;
            let a = o + i/(2*s+1);
            if(a == o) return a;
            o=a
        }
    }
    return e*Math.log(e/t)+t-e
}

function Fs(e){
    if(e<0) return NaN;
    if(e>=3) return SZ(e)-.5*Math.log1p(1/(6*e));
    if(e>=1)return iV(e);
    let t=.5772156649015329,r=-.1952810437829498,n=e*(1+6*e),o=Math.log1p(6*e/(1+n));
    return(e-t)*o+.5*Math.log1p(2/5*(1+4*e*(1-3*e))/(1+n))+(t-.5)*o+(e===0?0:e*Math.log1p(1/n))+r+iV(e+1)
}

function SZ(e){
    let t=1/(e*e), 
        r=.03333333333333229, 
        n=.3816877588482201,
        o=1.1226896867003733,
        i=.8424153799350397,
        s=.06216815175439515,
        a=11.73634705109923,
        u=36.819646921154714,
        c=33.58045682700508,
        l=6.435857736505945,
        p=r+t*(n+t*(o+t*(i+t*s))),
        m=1+t*(a+t*(u+t*(c+t*l)));
    return(1-t*(p/m))/(12*e)
}

function iP(e,t){
    if(t<=0)return NaN;
    if(t===1/0)return sP(e,0,1);
    let r=e*e/t;
    return r===0 
    ? qI(t)*Math.exp(-.5*e*e) 
    : r < 1 
        ? qI(t)*(1+r)**-.5*Math.exp(-.5*t*my(r)) 
        : qI(t)*(1+r)**-.5*Math.pow(1+r,-t/2)
}