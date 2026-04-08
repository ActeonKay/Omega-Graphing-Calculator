export function gamma(n) {
    if(n-Math.floor(n) === 0 && n<=0) return undefined; 
    //console.log("N",n);
    //recursive gamma function implementation using Lanczos approximation and reflection formula
    const lancoszCoefficients = [
        676.5203681218851,
        -1259.1392167224028,
        771.3234287776536,
        -176.6150291498386,
        12.507343278686905,
        -0.1385710952657201,
        9.984369578019571e-6,
        1.505632735149311e-7
    ];

    if (n < 0.5) {
        if(n-Math.floor(n) === 0) return Math.round(Math.PI / (Math.sin(Math.PI * n) * func_gamma(1 - n)));
        return Math.PI / (Math.sin(Math.PI * n) * func_gamma(1 - n));
    } else {
        n -= 1;
        let x = 0.9999999999998099;

        for (let i = 0; i < lancoszCoefficients.length; i++) {
            x += lancoszCoefficients[i] / (n + i + 1);
        }

        let t = n + lancoszCoefficients.length - 0.5;
        if(n-Math.floor(n) === 0) return Math.round(Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x);
        return Math.sqrt(2 * Math.PI) * Math.pow(t, n + 0.5) * Math.exp(-t) * x;    
    }

}

export function choose(n,k){
    const result = func_gamma(n+1)/(func_gamma(k+1)*func_gamma(n-k+1));

    //console.log('n,k,r:', n, k, result);

    if(n-Math.floor(n) === 0 && k-Math.floor(k) === 0) return Math.round(result);
    return result;
}

export function factor(n){    
    if(n-Math.floor(n) !== 0) { 
        return [];
    }

    if(n <= 1) {
        return [n];
    }

    if(n > 10**11) { 
        //throw new Error('Number '+n+' is too large to factorize'); 
        //console.error('Number '+n+' is too large or too small to factorize');
        return [];
    }



    const sqrt = Math.sqrt(n);
    let a = [],
    f = 2;
    while (n > 1) {
        if (n % f === 0) {
            a.push(f);
            //a.push(n/f);
            n /= f;
        } else {
            f++;
        }
    }
    return a;
}