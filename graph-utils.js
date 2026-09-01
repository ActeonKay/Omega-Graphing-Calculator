export function toGraphCoordsX(x, viewport){
    return (x/viewport.width-0.5)*viewport.scaleX+viewport.offsetX;
}

export function toGraphCoordsY(y, viewport){
    return (0.5-y/viewport.height)*viewport.scaleY+viewport.offsetY;
}

export function toScreenCoordsX(x, viewport){
    return ((x-viewport.offsetX)/(viewport.scaleX)+0.5)*viewport.width;
}

export function toScreenCoordsY(y, viewport){
    return (-(y-viewport.offsetY)/(viewport.scaleY)+0.5)*viewport.height;
}