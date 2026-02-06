import{
    evaluateExpression
} from './evaluator.js';

const ExpressionImageTypes = {
    CARTESIAN_IMPLICIT: 1,
    CARTESIAN_Y_OF_X: 2,
    CARTESIAN_X_OF_Y: 3,
}

function translateToGraphCoords(x,y){

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
        let result = evaluateExpression(expression,input);

        console.assert(result.edge !== undefined,result,result.edge);

        instructions.push([(result.edge[1]) === 0,x,result.value[1]]);
    }

    return instructions;
}