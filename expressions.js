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

export const DependableType = {
    VARIABLE: 1,
    FUNCTION: 2
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

let dependables = new Map(); //functions, vars, etc; things other expressions can depend on
let dependableData = new Map();

export function getNextId(){
    return ++nextId;
}

export function getNextColor(){
    return exprColors[(++nextColorId) % exprColors.length];
}

export function getAllExpressions(){
    return expressions;
}

export class ExpressionEvaluationInfo {
    type; //int
    dependencies; //String[]
    internalConstants; //Map

    constructor(type, dependencies, inConsts){
        this.type = type;
        this.dependencies = dependencies;
        this.internalConstants = inConsts;
    }
}

export class Expression {
    id; /**Id */
    type;
    dependencies;
    color;
    visible;
    latex;
    tokens;
    replace;
    parameters;
    definedSymbol;
    evaluationInfo;

    constructor(id, type, dependencies, color, visible, latex, tokens, replace, parameters, definedSymbol = null){
        this.id = id;
        this.type = type;
        this.dependencies = dependencies;
        this.color = color;
        this.visible = visible;
        this.latex = latex;
        this.tokens = tokens;
        this.replace = replace;
        this.parameters = parameters;
        this.definedSymbol = definedSymbol;

        return isValidExpression(this);
    } 

    static getEvaluationInfo() {
        return this.evaluationInfo;
    }

    static getType() {
        return this.evaluationInfo.type;
    }

    static getDependencies() {
        return this.evaluationInfo.dependencies;
    }

    static getInternalConstants() {
        return this.evaluationInfo.internalConstants;
    }
}

/**
 * Checks if the input is a valid expression
 * @param {Object} expr input to check
 * @returns 
 */
export function isValidExpression(expr){
    if(typeof expr !== 'object') {console.error('expression not object'); return false;}
    if(!expr instanceof Expression) {console.error('expression not Expression type'); return false;}

    if(typeof expr.id !== 'number') {console.error('id not number'); return false;}
    if(expr.id < 0 || expr.id > nextId) {console.error('id not in of range'); return false;}

    if(typeof expr.type !== 'number') {console.error('type not number'); return false;}
    if(expr.type < -1 || expr.type > 9) {console.error('type not in range:',expr.type,expr); return false;}

    if(typeof expr.dependencies !== 'object') {console.error('dependencies not object'); return false;}
    if(!expr.dependencies instanceof Array) {console.error('dependencies not array'); return false;}

    if(typeof expr.color !== 'string') {console.error('color not number'); return false;}

    if(typeof expr.visible !== 'boolean') {console.error('visibility not a boolean'); return false;}

    if(typeof expr.latex !== 'string') {console.error('latex not string'); return false;}

    if(typeof expr.tokens !== 'object') {console.error('tokens not boject'); return false;}
    if(typeof expr.tokens.length !== 'number') {console.error('tokens not array'); return false;}

    if(typeof expr.replace !== 'object') {console.error('replace not object'); return false;}
    if(!expr.replace instanceof Array) {console.error('replace not array',expr.replace); return false;}

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

function getDependencies(name){
    if(dependableData.get(name) === undefined) return undefined;

    let found = new Set();
    dependableData.get(name).dependencies.forEach((d1) => {
        found.add(d1);
        const r = getDependencies(d1);

        if(r !== undefined) found.union(r);
    });

    return found;
}

/**
 * Register a dependable (variable/function) to be referenced by other expressions
 * @param {String} name A unique name; i.e. as it is referenced in expressions
 * @param {int} type The type of dependable to register. `1`: variable  `2`: function
 * @param {Object} info Associated data: (variable value object / function expression object)
 * @param {String[]} directDependencies Array of all dependency names that are directly referenced by the dependable's expression
 * @returns 
 */
export function registerDependable(name, type, info, directDependencies){
    if(dependableData.get(name) !== undefined) {
        console.error("Attempted to register " + name + " twice");
        return false;
    }

    if(type < 1 || type > 2) return false; //HARDCODE

    let dependencies = new Set();
    directDependencies.forEach((dd) => {
        dependencies.union(getDependencies(dd));
        dependencies.add(dd);
    });

    dependableData.set(name, {type: type, value: info, dependencies: dependencies});
    return true;
}

export function unregisterDependable(name){
    if(dependableData.get(name) === undefined) return false;

    dependableData.delete(name);
    return true;
}

/**
 * Get the value of a dependable (variable/function)
 * @param {*} name Name of the dependable
 * @returns Dependable value (variable value / function expression)
 */
export function getDependable(name){
    if(dependableData.get(name) === undefined) return undefined;

    return dependableData.get(name).value;
}

export function getDependableData(name){
    return dependableData.get(name);
}