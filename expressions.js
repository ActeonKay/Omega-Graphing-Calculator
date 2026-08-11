export const ExpressionEntryType = {
    INVALID: -1,
    RENDERED_EQUATION: 0,
    EVALUATED_RESULT: 1,
    VARIABLE_SLIDER: 2,
    FUNCTION_DEFINITION: 3,
    ACTION: 4
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

let expressionEntries = [];
let listEdits = []; //{type: int, ?index: int, ?expression: object}

let dependables = new Map(); //functions, vars, etc; things other expressions can depend on
let dependableData = new Map();

export function getNextId(){
    return ++nextId;
}

export function getNextColor(){
    return exprColors[(++nextColorId) % exprColors.length];
}

export function getAllExpressionEntries(){
    return expressionEntries;
}

export class ExpressionEntry {
    id; /**Id */
    type;
    tooltip;
    color;
    visible;
    latex;
    expression;
    definedSymbol;
    context;

    constructor(id, type, tooltip, color, visible, latex, expression, definedSymbol, context){
        this.id = id;
        this.type = type;
        this.tooltip = tooltip;
        this.color = color;
        this.visible = visible;
        this.latex = latex;
        this.expression = expression;
        this.definedSymbol = definedSymbol;
        this.context = context;

        return isValidExpressionEntry(this);
    } 

    static getType() {
        return this.type;
    }

    static getDependencies() {
        return this.expression.dependencies;
    }
}

/**
 * Checks if the input is a valid expression entry
 * @param {Object} expr input to check
 * @returns 
 */
export function isValidExpressionEntry(expr){
    if(typeof expr !== 'object') {console.error('expression entry not object'); return false;}
    if(!expr instanceof ExpressionEntry) {console.error('expression entry not ExpressionEntry'); return false;}

    if(typeof expr.id !== 'number') {console.error('id not number'); return false;}
    if(expr.id < 0 || expr.id > nextId) {console.error('id not in of range'); return false;}

    if(typeof expr.type !== 'number') {console.error('type not number'); return false;}
    if(expr.type < -1 || expr.type > 4) {console.error('type not in range:',expr.type,expr); return false;}

    if(typeof expr.expression !== 'object') {console.error('expression not object'); return false;}

    if(typeof expr.color !== 'string') {console.error('color not number'); return false;}

    if(typeof expr.visible !== 'boolean') {console.error('visibility not a boolean'); return false;}

    if(typeof expr.latex !== 'string') {console.error('latex not string'); return false;}

    if(typeof expr.context !== 'object') {console.error('context not boject'); return false;}

    return true;
}

export function appendExpressionEntry(expr){
    if(!isValidExpressionEntry(expr)) return false;

    expressionEntries.push(expr);
    //listEdits.push({type: editType.APPEND, expressionEntry: expr});

    return true;
}

function findExpressionEntryOfId(wanted){
    //use iterator instead?
    return expressionEntries.findIndex(
        (e) => e.id === wanted
    );
}

export function remove(wantedId){
    const index = findExpressionEntryOfId(wantedId);

    if(index === -1) return false;

    expressionEntries.splice(index,1);
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