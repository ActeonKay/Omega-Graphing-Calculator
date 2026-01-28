export const expressionType = {
    INVALID: -1,
    EVALUATE: 0,
    IMPLICIT: 1,
    Y_OF_X: 2,
    X_OF_Y: 3,
    R_OF_THETA: 4,
    THETA_OF_R: 5,
    PARAMETRIC: 6,
    VAR_DEFINITION: 7,
    FUNC_DEFINITION: 8
}

const editType = {
    REMOVE: -1,
    INSERT: 0,
    APPEND: 1
}

const exprListId = "equationList";
const exprRowClass = "equationRow";
const exprEditClass = "equationEdit";
const exprWrapperClass = "equationWrapper";
const exprMathQuillClass = "equation";
const exprRowIdPrefix = "eq-row-";

const colors = [
    0xff0000,
    0x00ff00,
    0x0000ff,
    0x808000,
    0x008080,
    0x800080
];

const exprColors = [
    "seagreen",
    "coral",
    "cornflowerblue",
    "lightcoral",
    "mediumaquamarine"
];

let nextId = 0;
let nextColorId = 0;

let expressions = [];
let listEdits = []; //{type: int, ?index: int, ?expression: object}

let variables = new Map();
let variableData = new Map();
//let variables = [];
let nextVariableId = 0;

let functions = [];

export function getNextId(){
    return ++nextId;
}

export function getNextColor(){
    return exprColors[(++nextColorId) % exprColors.length];
}

export function getAllExpressions(){
    return expressions;
}

/**
 * Checks if the input is a valid expression
 * @param {Object} expr input to check
 * @returns 
 */
export function isValidExpression(expr){
    if(typeof expr !== 'object') {console.log('expression not object'); return false;}

    if(typeof expr.id !== 'number') {console.log('id not number'); return false;}
    if(expr.id < 0 || expr.id > nextId) {console.log('id not in of range'); return false;}

    if(typeof expr.type !== 'number') {console.log('type not number'); return false;}
    if(expr.type < -1 || expr.type > 8) {console.log('type not in range'); return false;}

    if(typeof expr.varDependencies !== 'object') return false;
    if(typeof expr.varDependencies.length !== 'number') {console.log('vardependencies not array'); return false;}

    if(typeof expr.color !== 'string') {console.log('color not number'); return false;}

    if(typeof expr.latex !== 'string') {console.log('latex not string'); return false;}

    if(typeof expr.tokens !== 'object') {console.log('tokens not boject'); return false;}
    if(typeof expr.tokens.length !== 'number') {console.log('tokens not array'); return false;}

    return true;
}

export function appendExpression(expr){
    if(!isValidExpression(expr)) return false;

    expressions.push(expr);
    //listEdits.push({type: editType.APPEND, expression: expr});

    return true;
}

function findExpressionOfId(wanted){
    //use iterator instead?
    return expressions.findIndex(
        (e) => e.id === wanted
    );
}

export function remove(wantedId){
    const index = findExpressionOfId(wantedId);

    if(index === -1) return false;

    expressions.splice(index,1);
    //listEdits.push({type: editType.REMOVE, index: index});

    return true;
}

export function getVariableData(name){
    if(variableData.get(name) === undefined) return undefined;

    return variableData.get(name);
}

function getDependencies(name){
    if(variableData.get(name) === undefined) return undefined;

    let found = new Set();
    variableData.get(name).dependencies.forEach((d1) => {
        found.add(d1);
        const r = getDependencies(d1);

        if(r !== undefined) r.forEach((d2) => found.add(d2));
    });

    return found;
}

export function registerVariable(name, varinfo, varDependencies = []){
    if(variableData.get(name) !== undefined) { console.log(name + ' already defined'); return false;}

    let dependencies = new Set();
    varDependencies.forEach((d) => {
        dependencies.add(getDependencies(d));
        dependencies.add(d);
    });

    if(typeof varinfo === 'object'){
        variableData.set(name, {value: varinfo, dependencies: dependencies});
        return true;
    }

    if(typeof varinfo === 'string'){
        variableData.set(name, {value: varinfo, dependencies: dependencies});
        return true;
    }

    console.log(typeof + ' already defined');
    return false;
}

export function unregisterVariable(name){
    if(variableData.get(name) === undefined) return false;

    variableData.delete(name);
    return true;
}

export function getVariable(name){
    if(variableData.get(name) === undefined) return undefined;

    return variableData.get(name).value;
}

export function getAllVariables(){
    return variables;
}