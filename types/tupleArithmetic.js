

/**
 * Shifts each element in `a` by `b`
 * @param {Array} a 
 * @param {number} b 
 * @returns An array
 */
export function tupleShift(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]+b);
    }
    return r; 
}

/**
 * Returns an array r such that r[i] = a[i]+b[i]
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleAdd(a,b){ 
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]+b[i]);
    }
    return r;
}

/**
 * Shifts each element in `a` by -`b`
 * @param {Array} a 
 * @param {number} b 
 * @returns An array
 */
export function tupleUnshift(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]-b);
    }
    return r;
}

/**
 * Returns an array r such that r[i] = a[i]-b[i] 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleSubtract(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]-b[i]);
    }
    return r;
}

/**
 * Scales each element in `a` by `s`
 * @param {*} a 
 * @param {*} s 
 * @returns 
 */
export function tupleScale(a,s){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]*s);
    }
    return r;
}

/**
 * Returns an array r such that r[i] = a[i]*b[i] 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleMultiply(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]*b[i]);
    }
    return r;
}

/**
 * Returns an array r such that r[i] = a[i]/b[i] 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleDivide(a,b){
    let r = [];
    for(let i = 0; i < a.length; i++){
        r.push(a[i]/b[i]);
    }
    return r;
}

/**
 * Returns the sum of the products of corresponding elements
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleDotProduct(a,b){
    let r = 0;
    for(let i = 0; i < a.length; i++){
        r+=a[i]*b[i];
    }
    return r;
}

/**
 * Returns the determinant of the matrix of:
 * 
 *   ⎡  i    j    k   ...  ⎤
 *   ⎢                     ⎥
 *   ⎢ a.0  a.1  a.2  ...  ⎥
 *   ⎢                     ⎥
 *   ⎣ b.1  b.2  b.3  ...  ⎦
 * 
 * @param {*} a 
 * @param {*} b 
 * @returns 
 */
export function tupleCrossProduct(a,b){
    const l = a.length;
    let matrix = [
        //i, j, k, ...
        Array(2*l-1).fill(1),
        a.concat(a),
        b.concat(b),
    ];

    let r = [];
    for(let i = 0; i < l; i++){
        let diag1 = 0;
        for(let j = 0; j < l; j++){
            diag1*=matrix[i][i+j];
        }

        let diag2 = 0;
        for(let j = l-1; j>=0; j--){
            diag2*=matrix[i][i-j];
        }
        
        r.push(diag1-diag2);
    }
    return r;
}