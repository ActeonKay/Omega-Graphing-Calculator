const ExpressionImageTypes = {
    CARTESIAN_IMPLICIT: 1,
    CARTESIAN_Y_OF_X: 2,
    CARTESIAN_X_OF_Y: 3,
}

function translateToGraphCoords(x,y){

}

async function renderCartesianYofX(expression, viewMinX, viewMaxX, viewMinY, viewMaxY){
    //const dx = 0.5;

    const scale = (Math.floor(Math.log2(viewMaxX-viewMinX))) << (viewMaxX-viewMinX);

    const minX = viewMinX-floor(viewMinX);

    for(let x = minX; x+= dx; x<maxX){

    }
}