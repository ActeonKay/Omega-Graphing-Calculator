import{
    evaluateExpression
} from './evaluator.js';

const ExpressionImageTypes = {
    CARTESIAN_IMPLICIT: 1,
    CARTESIAN_Y_OF_X: 2,
    CARTESIAN_X_OF_Y: 3,
}

const doSmartRendering = true;
const maxInstructions = 10000;
const maxDepth = 15;

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

//instructions array of Action objects
// Action = {shouldDraw: bool, x: float, y: float}
export function generateDrawInstructionsForCartesianYofX(expression, minX, maxX, xCount, viewMinY, viewMaxY){
    let instructions = [];

    const dx = (maxX-minX)/xCount;

    // use ctx.translate instead of this arithmetic

    let input = { min: 0, max: 0};
    let xprev = minX-dx;

    for(let x = minX; x<maxX; x+= dx){
        //console.log('x', x);
        input.min = xprev;
        input.max = x;
        //console.log('eval from x='+input.min+' to x='+input.max);
        let result = evaluateExpression(expression,input);

        console.assert(result.edge !== undefined,result,result.edge);

        //if(result.edge[1] !== 0) console.log(result.edge);

        instructions.push(getInstructionFrom((result.edge[1]) === 0,x,result.value[1],0));
        xprev=x;
    }

    if(doSmartRendering){
        console.log('doing smart rendering');

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
                midpoint = 0.5*(currentInstruction[1]+nextInstruction[1]);

                if(!nextInstruction[0] && currentInstruction[3] < maxDepth){
                    let leftHalf = evaluateExpression(expression,{min: currentInstruction[1], max: midpoint});
                    let rightHalf = evaluateExpression(expression,{min: midpoint, max: nextInstruction[1]});

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

export function generateDrawInstructionsForCartesianXofY(expression, minY, maxY, yCount, viewMinX, viewMaxX){
    let instructions = [];

    const dy = (maxY-minY)/yCount;

    // use ctx.translate instead of the following:

    let input = { min: 0, max: 0};
    let yprev = minY-dy;

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

    return instructions;
}