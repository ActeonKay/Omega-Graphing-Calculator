import{
    evaluateExpression,
    TokenType
} from './evaluator.js';

import{
    getVariable
} from './expressions.js';

const ExpressionImageTypes = {
    CARTESIAN_IMPLICIT: 1,
    CARTESIAN_Y_OF_X: 2,
    CARTESIAN_X_OF_Y: 3,
}

const doSmartRendering = true;
const maxInstructions = 8000;
const maxDepth = 32;

class ExpressionImage{
    instructions;
    x;
    y;
    scale;

    constructor(instructions,x,y,scale){
        this.instructions=instructions;
        this.x=x;
        this.y=y;
        this.scale=scale;
    }
}

function translateToGraphCoords(x,y){

}

function shouldRenderAtHigherPrecision(edge,d){
    //edges: [crosses, holes, jumps]
    //if(edge[1] === 0 && edges[2] === 0) return false;
    
    return (edge[1] !== 0 || edges[2] !== 0);
}

function getInstructionFrom(hideLine,x,y,depth){
    return [hideLine,x,y,depth];
}

export function generateImageForCartesianYofX(expression, minX, maxX, xCount, viewMinY, viewMaxY, viewScale){
    if(!expression.tokens.some((t) => t.inputElementsSeparately === true)){
        return new ExpressionImage(
            generateInstructionsForCartesianYofX(expression, -1, minX, maxX, xCount, viewMinY, viewMaxY, viewScale),
            (minX + maxX)*0.5,
            (viewMinY + viewMaxY)*0.5,
            viewScale
        );
    }

    const elementsToBeAutoIndexed = expression.tokens.filter((t) => t.inputElementsSeparately === true);

    const n = Math.min(elementsToBeAutoIndexed.map((t) => {
        switch(t.type){
            case TokenType.VAR: return getVariable(t.code).value.length; //assume variable is array type
            case TokenType.FUNC: return t.argCount;
            default:
                throw new Error('Could not automatically index token.');
        }
    }));

    let instructions = [];
    for(let k = 0; k<n; k++){
        let instructionsAtK = generateInstructionsForCartesianYofX(expression, k, minX, maxX, xCount, viewMinY, viewMaxY, viewScale);
        instructions = instructions.concat(instructionsAtK);
    }

    //console.log(instructions);

    return new ExpressionImage(
        instructions,
        (minX + maxX)*0.5,
        (viewMinY + viewMaxY)*0.5,
        viewScale
    );
}

//instructions array of Action objects
// Action = {shouldDraw: bool, x: float, y: float}
export function generateInstructionsForCartesianYofX(expression, arrayIndex, minX, maxX, xCount, viewMinY, viewMaxY, viewScale){
    let instructions = [];

    const dx = (maxX-minX)/xCount;

    if(dx === 0) return [];

    // use ctx.translate instead of this arithmetic

    let input = { min: 0, max: 0};
    let xprev = minX-dx;

    let result = evaluateExpression(expression, {min: xprev, max: minX}, arrayIndex);
    //console.log('initial test result',result);
    if(result.type == 1){
        //console.log('real result: ',result);
        return [
            [false,minX,result.value,0],
            [true,maxX,result.value,0]
        ];
    }

    xprev = minX;
    for(let x = minX; x<=maxX; x+= dx){
        input.min = xprev;
        input.max = x;
        result = evaluateExpression(expression,input, arrayIndex);

        console.assert(result.edge !== undefined,result,result.edge);

        //if(result.edge[1] !== 0) console.log(result.edge);

        instructions.push(getInstructionFrom((result.edge[1]) === 0 && !(x === minX),x,result.value[1],0));
        xprev=x;
    }

    if(doSmartRendering){
        let j = 0;
        while(instructions.length < maxInstructions && j<maxDepth){
            let i = 0;
            let currentInstruction;
            let nextInstruction;
            let midpoint;

            while(i<instructions.length-1){
                if(instructions.length > maxInstructions) break;

                //get at index
                //get next index
                currentInstruction = instructions[i];
                nextInstruction = instructions[i+1];

                if(j > 0 && currentInstruction[3] == 0 && nextInstruction[3] == 0) {
                    i++;
                    continue;
                }

                midpoint = 0.5*(currentInstruction[1]+nextInstruction[1]);

                if(!nextInstruction[0] && currentInstruction[3] < maxDepth){
                    let leftHalf = evaluateExpression(expression,{min: currentInstruction[1], max: midpoint},arrayIndex);
                    let rightHalf = evaluateExpression(expression,{min: midpoint, max: nextInstruction[1]},arrayIndex);

                    instructions.splice(i+1,1,
                        getInstructionFrom(leftHalf.edge[1] === 0, midpoint, leftHalf.value[1], currentInstruction[3]+1),
                        getInstructionFrom(rightHalf.edge[1] === 0, nextInstruction[1], rightHalf.value[1],currentInstruction[3]+1),
                    );

                    i++;
                }

                i++;
            }

            j++;
        }


    }

    return instructions;
}

export function generateImageForCartesianXofY(expression, minY, maxY, yCount, viewMinX, viewMaxX, viewScale){
    let instructions = [];

    const dy = (maxY-minY)/yCount;

    // use ctx.translate instead of the following:

    let input = { min: 0, max: 0};
    let yprev = minY-dy;

    let result = evaluateExpression(expression, {min: yprev, max: minY});
    if(result.type == 1){
        return new ExpressionImage(
            [
                [true,result.value,minY,0],
                [true,result.value,maxY,0]
            ],
            (viewMinX+viewMaxX)*0.5,
            (minY+maxY)*0.5,
            viewScale
        );
    }

    for(let y = minY; y<maxY; y+=dy){
        input.min = yprev;
        input.max = y;

        let result = evaluateExpression(expression,input);

        console.assert(result.edge !== undefined, result, result.edge);

        instructions.push(getInstructionFrom((result.edge[1]) === 0, result.value[1],y,0));
        yprev = y;
    }

    if(doSmartRendering){
        let j = 0;
        while(instructions.length < maxInstructions && j<maxDepth){
            let i = 0;
            let currentInstruction;
            let nextInstruction;
            let midpoint;

            while(i<instructions.length-1){
                if(instructions.length > maxInstructions) break;

                //get at index
                //get next index
                currentInstruction = instructions[i];
                nextInstruction = instructions[i+1];
                midpoint = 0.5*(currentInstruction[2]+nextInstruction[2]);

                if(!nextInstruction[0] && currentInstruction[3] < maxDepth){
                    let leftHalf = evaluateExpression(expression,{min: currentInstruction[2], max: midpoint});
                    let rightHalf = evaluateExpression(expression,{min: midpoint, max: nextInstruction[2]});

                    instructions.splice(i+1,1,
                        getInstructionFrom(leftHalf.edge[1] === 0, leftHalf.value[1], midpoint, currentInstruction[3]+1),
                        getInstructionFrom(rightHalf.edge[1] === 0, rightHalf.value[1], nextInstruction[2], currentInstruction[3]+1),
                    );

                    i++;
                }

                i++;
            }

            j++;
        }


    }

    return new ExpressionImage(
        instructions,
        (viewMinX+viewMaxX)*0.5,
        (minY+maxY)*0.5,
        viewScale
    );
}

export function generateImageForCartesianImplicit(expression, minX, maxX, minY, maxY, viewScale){
    //console.log(minX,maxX,minY,maxY);
    //first, subdivide 5 times (32x32 grid)
    const rows = 32;
    const columns = 32;
    const quads = rows*columns;
    //let sectors = new Array(1024).fill(false); //1024 bits

    let sectors = new Uint32Array(32).fill(0);

    let rowOfIndex = (i) => Math.floor(i/32);
    let columnOfIndex = (i) => i%32;

    let flagSectorAtIndex = (i) => {const row = rowOfIndex(i); const column = columnOfIndex(i); sectors[row] |= (1 << 31-column)};
    let getSectorAtIndex = (i) => {const row = rowOfIndex(i); const column = columnOfIndex(i); return (sectors[row] & (1 << 31-column)) === 0 ? false : true};

    // flagSectorAtIndex(31);
    // console.log(sectors);
    // console.log(getSectorAtIndex(31));

    const width = maxX-minX;
    const height = maxY-minY;

    const evaluateQuadAtIndex = (i) => {
        //sectors[i] = true;
        flagSectorAtIndex(i);

        const row = rowOfIndex(i);
        const column = columnOfIndex(i);

        const quadMinX = minX + (width/32)*row;
        const quadMaxX = quadMinX + width/32;

        const quadMaxY = maxY - (height/32)*column;
        const quadMinY = quadMaxY - (height/32);

        const rect = {
            minX: quadMinX,
            maxX: quadMaxX,
            minY: quadMinY,
            maxY: quadMaxY,
        };

        const result = evaluateExpression(
            expression, 
            rect,
            {evaluateDiff: true}
        );

        //console.log('evaluate quad. tplf:'+quadMinX+','+quadMaxY+': '+result.value[0]);

        return [
            result,
            rect
        ];
    }

    let segments = [];
    let finished = false;

    const findNextOpenQuad = () => {
        for(let i = 0; i<1024; i++){
            //if(!sectors[i]) return i;
            if(!getSectorAtIndex(i)) return i;
        }

        finished = true;
        return null;
    }

    const rightQuadAvailableFrom = (i) => {
        const column = columnOfIndex(i);
        if(column === 31) return false; //on righthand edge
        return !getSectorAtIndex(i+1);
    }

    const downQuadAvailableFrom = (i) => {
        const row = rowOfIndex(i);
        if(row === 31) return false; //on bottom edge
        return !getSectorAtIndex(i+32);
    }

    const upQuadAvailableFrom = (i) => {
        const row = rowOfIndex(i);
        if(row === 0) return false; //on top edge
        return !getSectorAtIndex(i-32);
    }

    const leftQuadAvailableFrom = (i) => {
        const column = columnOfIndex(i);
        if(column === 0) return false; //on left edge
        return !getSectorAtIndex(i-1);
    }

    let nextStems = [];
    let iterations = 0;
    while(!finished && iterations < 1023){
        iterations++;
        let nextQuad = findNextOpenQuad();

        if(nextQuad === null) break;
        nextStems.push(nextQuad);

        let currentSegment = [];
        while(nextStems.length > 0){
            let stem = nextStems.pop();
            const result = evaluateQuadAtIndex(stem);
            const quad = result[0];
            const edge = quad.edge;

            let isLeaf = true;

            // const caseIndex = caseIndexFromQuadValue(quad.value);
            const v00 = quad.value[0]; //tplf
            const v10 = quad.value[1]; //tprt
            const v01 = quad.value[2]; //btlf
            const v11 = quad.value[3]; //btrt

            //console.log(v00,v10,v01,v11);

            // if(edge.rgt[0]>0 && rightQuadAvailableFrom(stem)) { 
            //     nextStems.push(stem+1); 
            //     isLeaf = false; 
            // }
            // if(edge.btm[0]>0 && downQuadAvailableFrom(stem)) { 
            //     nextStems.push(stem+32); 
            //     isLeaf = false; 
            // }
            // if(edge.top[0]>0 && upQuadAvailableFrom(stem)) { 
            //     nextStems.push(stem-32); 
            //     isLeaf = false; 
            // }
            // if(edge.lft[0]>0 && leftQuadAvailableFrom(stem)) { 
            //     nextStems.push(stem-1); 
            //     isLeaf = false; 
            // }
            if(((v10>0) !== (v11>0)) && rightQuadAvailableFrom(stem) && edge.rgt[1]==0) { 
                nextStems.push(stem+1); 
                isLeaf = false; 
            }
            if(((v01>0) !== (v11>0)) && downQuadAvailableFrom(stem) && edge.btm[1]==0) { 
                nextStems.push(stem+32); 
                isLeaf = false; 
            }
            if(((v00>0) !== (v10>0)) && upQuadAvailableFrom(stem) && edge.top[1]==0) { 
                nextStems.push(stem-32); 
                isLeaf = false; 
            }
            if(((v00>0) !== (v01>0)) && leftQuadAvailableFrom(stem) && edge.lft[1]==0) { 
                nextStems.push(stem-1); 
                isLeaf = false; 
            }

            if(isLeaf){
                if(currentSegment.length === 0) {
                    //console.log('blank',stem);
                    break;
                }
                segments.push(currentSegment);
                currentSegment = [];
            }else{
                currentSegment.push(result);
            }
        }
    }

    //start in top left.
    //evaluate quad
        //if no crosses, move to next non-found quad
        //if crosses:
            //find two adjacent sides
            //prioritize right-, then down-, then left-, then up-adjacent quad
            //evaluate this quad if it has not been evaluated yet, add result to currentSegment, and mark that it has been evaluated using the sectors array
            //evaluate next-quad if not yet evaluated, add result to other side of currentSegment, and mark that it has been evaluated in the sectors array
            //if no adjacent non-visited quads exist, add currentSegment to segments. 
            //if more than one adjacent non-visited quad exists, choose one to continue on with currentSegment and add others to 'nextSegmentStart' stack
    //

    //console.log(segments);

    let instructions = [];
    for(let i = 0; i < segments.length; i++){
        const segment = segments[i];
        for(let j = 0; j < segment.length; j++){
            const quadResult = segment[j];
            const quadDrawInstructions = getInstructionFromQuadReturn(
                quadResult[0], 
                quadResult[1].minX, 
                quadResult[1].maxY, 
                quadResult[1].maxX-quadResult[1].minX, 
                quadResult[1].minY-quadResult[1].maxY
            );

            if(quadDrawInstructions == null) continue;

            //console.log(quadResult,quadDrawInstructions)

            instructions.push(quadDrawInstructions[1]);
            instructions.push(quadDrawInstructions[0]);
        }
    }

    // console.log(instructions);

    return new ExpressionImage(
        instructions,
        (minX+maxX)*0.5,
        (minY+maxY)*0.5,
        viewScale
    );
}

function caseIndexFromQuadValue(v){
    const v00 = v[0]; //tplf
    const v10 = v[1]; //tprt
    const v01 = v[2]; //btlf
    const v11 = v[3]; //btrt

    const s00 = v00 > 0 ? 1 : 0; //tplf
    const s10 = v10 > 0 ? 1 : 0; //tprt
    const s01 = v01 > 0 ? 1 : 0; //btlf
    const s11 = v11 > 0 ? 1 : 0; //btrt

    // Build case index (top-left, top-right, bottom-right, bottom-left)
    return (s00 << 3) | (s10 << 2) | (s11 << 1) | s01;
}

function getInstructionFromQuadReturn(quad, x, y, w, h){
    console.assert(isFinite(x)&&isFinite(y)&&isFinite(w)&&isFinite(h),x,y,w,h);
    //console.assert(w>0&&h>0,w,h);

    const v = quad.value;

    const v00 = v[0]; //tplf
    const v10 = v[1]; //tprt
    const v01 = v[2]; //btlf
    const v11 = v[3]; //btrt

    const s00 = v00 > 0 ? 1 : 0; //tplf
    const s10 = v10 > 0 ? 1 : 0; //tprt
    const s01 = v01 > 0 ? 1 : 0; //btlf
    const s11 = v11 > 0 ? 1 : 0; //btrt

    // Build case index (top-left, top-right, bottom-right, bottom-left)
    const index = (s00 << 3) | (s10 << 2) | (s11 << 1) | s01;
    //console.log(index);

    switch (index) {
        case 1: case 14:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(interp(x, x + w, v01, v11), y + h)
            ];
        case 2: case 13:
            return [
                moveTo(interp(x, x + w, v01, v11), y + h),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
        case 3: case 12:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
        case 4: case 11:
            return [
                moveTo(x + w, interp(y + h, y, v11, v10)),
                lineTo(interp(x, x + w, v00, v10), y)
            ]
        case 5: case 10:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(interp(x, x + w, v00, v10), y),
                moveTo(interp(x, x + w, v01, v11), y + h),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
        case 6: case 9:
            return [
                moveTo(interp(x, x + w, v00, v10), y),
                lineTo(interp(x, x + w, v01, v11), y + h)
            ];
        case 7: case 8:
            return [
                moveTo(interp(x, x + w, v00, v10), y),
                lineTo(x, interp(y + h, y, v01, v00))
            ];
        default:
            return null;
            //console.log(index);
            break;
    }
}

function interp(a, b, va, vb) {
    const t = va / (va - vb);
    return a + t * (b - a);
};

function moveTo(x,y){
    return [true, x,y];
}

function lineTo(x,y){
    return [false, x,y];
}
