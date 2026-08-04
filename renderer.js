import{
    evaluateExpression,
    ExpressionType,
    TokenType
} from './evaluator.js';

import{
    getDependable
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
    scaleX;
    scaleY;

    constructor(instructions,x,y,scaleX,scaleY){
        this.instructions=instructions;
        this.x=x;
        this.y=y;
        this.scaleX=scaleX;
        this.scaleY=scaleY;
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

function generateViewportInfo(minX, maxX, minY, maxY, scaleX, scaleY, xCount, yCount){
    return {minX, maxX, minY, maxY, scaleX, scaleY, xCount, yCount};
}

/**
 * Generate image based on instructions
 * @param {*} expression Expression to be evaluated
 * @param {*} viewport Viewport info including min/max X,Y, xScale and yScale, and row/column count
 * @param {*} f Other renderer.js function that generates an instruction list
 * @returns 
 */
export function generateImage(expression, viewport, f){
    //const minX = viewport.minX;
    //const maxX = viewport.maxX;
    //const minY = viewport.minY;
    //const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;

    if(!expression.tokens.some((t) => t.inputElementsSeparately === true)){
        return new ExpressionImage(
            f(expression, -1, viewport),
            (viewport.minX + viewport.maxX)*0.5,
            (viewport.minY + viewport.maxY)*0.5,
            scaleX,
            scaleY
        );
    }

    const elementsToBeAutoIndexed = expression.tokens.filter((t) => t.inputElementsSeparately === true);

    const n = Math.min(elementsToBeAutoIndexed.map((t) => {
        switch(t.type){
            case TokenType.VAR: return getDependable(t.code).value.length; //assume variable is array type
            case TokenType.FUNC: return t.argCount;
            default:
                console.error("Not indexable:",t);
                throw new Error('Could not automatically index token:');
        }
    }));

    let instructions = [];
    for(let k = 0; k<n; k++){
        let instructionsAtK = f(expression, k, viewport);
        instructions = instructions.concat(instructionsAtK);
    }

    //console.log(instructions);

    return new ExpressionImage(
        instructions,
        (viewport.minX + viewport.maxX)*0.5,
        (viewport.minY + viewport.maxY)*0.5,
        scaleX,
        scaleY
    );
}

/**
 * 
 * @param {*} expression 
 * @param {*} arrayIndex 
 * @param {*} viewport 
 * @returns 
 */
export function generateInstructionsForCartesianYofX(expression, arrayIndex, viewport){
    const minX = viewport.minX;
    const maxX = viewport.maxX;
    const xCount = viewport.xCount;
    const minY = viewport.minY;
    const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;

    let instructions = [];

    const dx = (maxX-minX)/xCount;

    if(dx === 0) return [];

    //TODO: use ctx.translate instead of this arithmetic

    let inputObj = { min: 0, max: 0};
    let xprev = minX-dx;

    const paramNum = expression.type === 8 ? 
        expression.parameters.findIndex((p) => p.type === TokenType.FUNCPARAM && p.code === 0) :
        expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 1);

    let result = evaluateExpression(expression, new Map([[paramNum, {min: xprev, max: minX}]]), arrayIndex);
    if(result.type == 1){
        return [
            [false,minX,result.value,0],
            [true,maxX,result.value,0]
        ];
    }

    console.assert(paramNum === 0, paramNum, expression.parameters); //Only throw error when evaluation involves substitution

    xprev = minX;
    for(let x = minX; x<=maxX; x+= dx){
        inputObj.min = xprev;
        inputObj.max = x;
        result = evaluateExpression(expression,new Map([[paramNum, inputObj]]), arrayIndex);

        console.assert(result.edge !== undefined,result,result.edge);

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
                    let leftHalf = evaluateExpression(expression,new Map([[paramNum,{min: currentInstruction[1], max: midpoint}]]),arrayIndex);
                    let rightHalf = evaluateExpression(expression,new Map([[paramNum, {min: midpoint, max: nextInstruction[1]}]]),arrayIndex);

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

/**
 * 
 * @param {*} expression 
 * @param {*} arrayIndex 
 * @param {*} viewport 
 * @returns 
 */
export function generateInstructionsForCartesianXofY(expression, arrayIndex, viewport){
    const minX = viewport.minX;
    const maxX = viewport.maxX;
    const yCount = viewport.yCount;
    const minY = viewport.minY;
    const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;

    let instructions = [];

    const dy = (maxY-minY)/yCount;

    if(dy <= 0) {
        console.error("Y step miscalculated. The axis may be reversed."); 
        return [];
    }

    let inputObj = { min: 0, max: 0};
    let yprev = minY-dy;

    const paramNum = expression.type === 8 ? 
        expression.parameters.findIndex((p) => p.type === TokenType.FUNCPARAM && p.code === 0) :
        expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 2);

    let result = evaluateExpression(expression, new Map([[paramNum, {min: yprev, max: minY}]]), arrayIndex);
    if(result.type == 1){
        return [
            [true,result.value,minY,0],
            [true,result.value,maxY,0]
        ];
    }

    console.assert(paramNum === 0, paramNum, expression.parameters); //Only throw error when evaluation involves substitution

    for(let y = minY; y<maxY; y+=dy){
        inputObj.min = yprev;
        inputObj.max = y;

        let result = evaluateExpression(expression,new Map([[paramNum, inputObj]]), arrayIndex);

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
                    let leftHalf = evaluateExpression(expression,new Map([[paramNum, {min: currentInstruction[2], max: midpoint}]]));
                    let rightHalf = evaluateExpression(expression,new Map([[paramNum, {min: midpoint, max: nextInstruction[2]}]]));

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

    return instructions;

    return new ExpressionImage(
        instructions,
        (minX+maxX)*0.5,
        (minY+maxY)*0.5,
        scaleX,
        scaleY
    );
}

export function generateInstructionsForCartesianImplicit(expression, arrayIndex, viewport){
    const minX = viewport.minX;
    const maxX = viewport.maxX;
    const columnCount = viewport.xCount;
    const rowCount = viewport.yCount;
    const minY = viewport.minY;
    const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;

    const stepX = (maxX-minX)/columnCount;
    const stepY = (maxY-minY)/rowCount;

    const paramNumX = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 1);
    const paramNumY = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 2);

    let instructions = [];
    for(let x = minX; x<maxX; x+=stepX){
        for(let y = minY; y<maxY; y+= stepY){
            const rect = {
                minX: x,
                maxX: x+stepX,
                minY: y,
                maxY: y+stepY
            }

            const input = new Map([
                [paramNumX, rect],
                [paramNumY, rect]
            ]);

            const quad = evaluateExpression(
                expression, 
                input,
                arrayIndex
            );

            const edge = quad.edge;

            const v00 = quad.value[0]; //tplf
            const v10 = quad.value[1]; //tprt
            const v01 = quad.value[2]; //btlf
            const v11 = quad.value[3]; //btrt

            instructions = instructions.concat(getInstructionFromQuadReturn(
                quad, 
                rect.minX, 
                rect.maxY, 
                rect.maxX-rect.minX, 
                rect.minY-rect.maxY
            ));
        }
    }

    return instructions;
}

export function generateInstructionsForCartesianImplicitSmart(expression, arrayIndex, viewport){
    const minX = viewport.minX;
    const maxX = viewport.maxX;
    const columnCount = viewport.xCount;
    const rowCount = viewport.yCount;
    const minY = viewport.minY;
    const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;
    
    const paramNumX = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 1);
    const paramNumY = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 2);

    //BASE
    //Rows {0 -> rowCount-1}
    //Columns {0 -> columnCount-1}
    const stepX = (maxX-minX)/columnCount;
    const stepY = (maxY-minY)/rowCount;

    let baseQuadFlags = Array.from({length: rows}, () => new Array(columns).fill(false)); //2D array: whether each quad has been visited or not
    
    const hasQuadBeenVisited = (row, column) => baseQuadFlags[row][column];
    const markAsVisited = (row, column) => baseQuadFlags[row][column] = true;

    const evaluateQuadAt = (row, column) => {
        const quadMinX = minX + stepX*row;
        const quadMaxX = minX + stepX*(row+1);
        const quadMinY = minY + stepY*column;
        const quadMaxY = minY + stepY*(column+1);

        const rect = {
            minX: quadMinX,
            maxX: quadMaxX,
            minY: quadMinY, 
            maxY: quadMaxY
        }

        const input = new Map([
            [paramNumX, rect],
            [paramNumY, rect]
        ]);

        const result = evaluateExpression(
            expression, 
            input,
            arrayIndex
        );

        markAsVisited(row, column); //potential errors could cause this to be skipped, creating a loop?

        return [result, rect];
    }

    let finished = false;

    //let minUnsearchedQuadIndex = [0,0]; //TODO: optimization
    const findNextQuad = () => {
        let i = 0;
        while(i < rowCount*columnCount){
            const row=Math.floor(i/columnCount),column=i%columnCount;
            if(hasQuadBeenVisited(row, column)){
                //markAsVisited(row,column);
                return [row,column];
            }
            i++;
        }
        finished = true;
        return [rowCount, columnCount];
    }

    const findOpenAdjacentQuads = (row, column) => {
        result = []; //priority: right, down, up, left

        if(column < columnCount-1 && !hasQuadBeenVisited(row, column+1)) result.push([row,column+1]); //right
        if(row < rowCount-1 && !hasQuadBeenVisited(row+1, column)) result.push([row+1,column]); //down
        if(column > 0 && !hasQuadBeenVisited(row, column-1)) result.push([row, column-1]); //up
        if(row > 0 && !hasQuadBeenVisited(row-1, column)) result.push([row-1,column]); //left

        return result;
    }

    let nextStems = []; //next potential branches to trace
    let currentBranch = [];
    while(!finished){
        const [currentRow, currentColumn] = findNextQuad();

        const currentInfo = evaluateQuadAt(currentRow, currentColumn);
        const quad = currentInfo[0];
        const value = quad.value;

        const v00 = quad.value[0]; //tplf
        const v10 = quad.value[1]; //tprt
        const v01 = quad.value[2]; //btlf
        const v11 = quad.value[3]; //btrt

        let adjacentQuads = findOpenAdjacentQuads(currentRow, currentColumn);

        if(adjacentQuads.length === 0){

        }
        nextStems.concat(adjacentQuads);
    }

}

/**
 * 
 * @param {*} expression 
 * @param {*} arrayIndex 
 * @param {*} viewport 
 * @returns 
 */
export function generateInstructionsForCartesianImplicitOld(expression, arrayIndex, viewport){
    const minX = viewport.minX;
    const maxX = viewport.maxX;
    const xCount = viewport.xCount;
    const yCount = viewport.yCount;
    const minY = viewport.minY;
    const maxY = viewport.maxY;
    const scaleX = viewport.scaleX;
    const scaleY = viewport.scaleY;

    //console.log(minX,maxX,minY,maxY);
    //first, subdivide 5 times (32x32 grid)
    const rowCount = 32;
    const columnCount = 32;
    const quadCount = rowCount*columnCount;

    //let sectors = Array.from({length: rows}, () => new Array(columns).fill(false));
    let sectors = new Array(quadCount).fill(false);

    //let sectors = new Uint32Array(32).fill(0);

    let rowOfIndex = (i) => Math.floor(i/columnCount);
    let columnOfIndex = (i) => i%columnCount;

    let flagSectorAtIndex = (i) => sectors[i] = true;
    let getSectorAtIndex = (i) => sectors[i];

    //let flagSectorAtIndex = (i) => {const row = rowOfIndex(i); const column = columnOfIndex(i); sectors[row] |= (1 << 31-column)};
    //let getSectorAtIndex = (i) => {const row = rowOfIndex(i); const column = columnOfIndex(i); return (sectors[row] & (1 << 31-column)) === 0 ? false : true};

    // flagSectorAtIndex(31);
    // console.log(sectors);
    // console.log(getSectorAtIndex(31));

    const width = maxX-minX;
    const height = maxY-minY;

    const paramNumX = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 1);
    const paramNumY = expression.parameters.findIndex((p) => p.type === TokenType.UNKN && p.code === 2);

    const evaluateQuadAtIndex = (i) => {
        //sectors[i] = true;
        flagSectorAtIndex(i);

        const row = rowOfIndex(i);
        const column = columnOfIndex(i);

        const quadMinX = minX + (width/rowCount)*row;
        const quadMaxX = quadMinX + width/rowCount;

        const quadMaxY = maxY - (height/columnCount)*column;
        const quadMinY = quadMaxY - (height/columnCount);

        const rect = {
            minX: quadMinX,
            maxX: quadMaxX,
            minY: quadMinY, //FOR SOME REASON: swapping quadMinY and quadMaxY here fixes the missing case issue, but causes another one
            maxY: quadMaxY, //This will be a monster pain to debug
        };

        const input = new Map([
            [paramNumX, rect],
            [paramNumY, rect]
        ]);

        const result = evaluateExpression(
            expression, 
            input,
            arrayIndex
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
        for(let i = 0; i<quadCount; i++){
            //if(!sectors[i]) return i;
            if(!getSectorAtIndex(i)) return i;
        }

        finished = true;
        return null;
    }

    const rightQuadAvailableFrom = (i) => {
        const column = columnOfIndex(i);
        if(column === columnCount-1) return false; //on right edge
        return !getSectorAtIndex(i+1);
    }

    const downQuadAvailableFrom = (i) => {
        //return false;
        const row = rowOfIndex(i);
        if(row === rowCount-1) return false; //on bottom edge
        return !getSectorAtIndex(i+columnCount);
    }

    const upQuadAvailableFrom = (i) => {
        //return false;
        const row = rowOfIndex(i);
        if(row === 0) return false; //on top edge
        return !getSectorAtIndex(i-columnCount);
    }

    const leftQuadAvailableFrom = (i) => {
        //return false;
        const column = columnOfIndex(i);
        if(column === 0) return false; //on left edge
        return !getSectorAtIndex(i-1);
    }

    let nextStems = [];
    let iterations = 0;
    while(!finished && iterations < quadCount-1){
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
                console.log("right!"); 
                nextStems.push(stem+1); 
                isLeaf = false; 
            } 
            if(((v01>0) !== (v11>0)) && downQuadAvailableFrom(stem) && edge.btm[1]==0) { 
                console.log("down!"); 
                nextStems.push(stem+32); 
                isLeaf = false; 
            } 
            if(((v00>0) !== (v10>0)) && upQuadAvailableFrom(stem) && edge.top[1]==0) {
                console.log("up!"); 
                nextStems.push(stem-32); 
                isLeaf = false; 
            } 
            if(((v00>0) !== (v01>0)) && leftQuadAvailableFrom(stem) && edge.lft[1]==0) { 
                console.log("left!"); 
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

    //Cannot seem to print vertical lines as expected.
    // for(let i = 0; i < columns; i++){
    //     const x = minX + (width/32)*rowOfIndex(i);
    //     //instructions.push(colorTo(0,0,0,0.1));
    //     instructions.push(moveTo(x,maxY));
    //     instructions.push(lineTo(x,minY));
    // }
    // console.log(instructions);

    // //Unbalanced horizontal lines ??
    // for(let i = 0; i < rows; i++){
    //     const y = maxY - (height/32)*columnOfIndex(i);
    //     //instructions.push(colorTo(0,0,0,0.1));
    //     instructions.push(moveTo(minX,y));
    //     instructions.push(lineTo(maxX,y));
    // }

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

            //console.log(instructions.length, quadResult,quadDrawInstructions)

            // quadDrawInstructions.reverse().forEach((i) => {
            //     instructions.push(i);
            // });

            instructions.push(...(quadDrawInstructions));
            //instructions.push(quadDrawInstructions[1]);
            //instructions.push(quadDrawInstructions[0]);
        }
    }

    // console.log(instructions);

    return new ExpressionImage(
        instructions,
        (minX+maxX)*0.5,
        (minY+maxY)*0.5,
        scaleX,
        scaleY
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
    //const index = (s00 << 3) | (s10 << 2) | (s11 << 1) | s01;
    const index = (s00*8) + (s10*4) + (s11*2) + (s01*1);
    //console.log(index, s00, s10, s11, s01);

    switch (index) {
        case 1: case 14:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(interp(x, x + w, v01, v11), y + h)
            ];
            break;
        case 2: case 13:
            return [
                moveTo(interp(x, x + w, v01, v11), y + h),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
            break;
        case 3: case 12:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
            break;
        case 4: case 11:
            return [
                moveTo(x + w, interp(y + h, y, v11, v10)),
                lineTo(interp(x, x + w, v00, v10), y)
            ];
            break;
        case 5: case 10:
            return [
                moveTo(x, interp(y + h, y, v01, v00)),
                lineTo(interp(x, x + w, v00, v10), y),
                moveTo(interp(x, x + w, v01, v11), y + h),
                lineTo(x + w, interp(y + h, y, v11, v10))
            ];
            break;
        case 6: case 9:
            return [
                moveTo(interp(x, x + w, v00, v10), y),
                lineTo(interp(x, x + w, v01, v11), y + h)
            ];
            break;
        case 7: case 8:
            //console.log("Error prone case.",v00,v01,v10,v11);
            //console.log(moveTo(interp(x, x + w, v00, v10), y));
            //console.log(lineTo(x, interp(y + h, y, v01, v00)));
            return [
                moveTo(interp(x, x + w, v00, v10), y),
                lineTo(x, interp(y + h, y, v01, v00))
            ];
            break;
        default:
            return [
            ];
            break;
    }
}

function interp(a, b, va, vb) {
    const t = va / (va - vb);
    return a + t * (b - a);
};

function moveTo(x,y){
    return [false, x,y];
}

function lineTo(x,y){
    return [true, x,y];
}

function colorTo(r,g,b,a){
    return [null, `rgba(${r},${g},${b},${a})`];
}