//LAYERS OF TOKENIZATION
//1. NSP => non-structured placeholders
//This layer involves nested tokens:
// - Latex command tokens have their arguments stored in the metadata.arguments and metadata.optionalArguments attributes
// - Latex super- and sub-scripts are treated as attributes to the base token
//Crucially, not all tokens have been converted into token types. 
// - Latex commands have not been converted into their token types (like \cdot => op or \sin => function)
//{type: String, string: String, ?metadata: Object}
//metadata = {?superscript: NSTtoken[], ?subscript: NST, ?fullString, ?optionalArguments, ?requiredArguments, ?value: float}

//TODO: make sure fullString vs. string makes sense and is consistent

//2. NST => non-structured types
//This layer converts all 'placeholder' latex tokens into actual token types
//This layer also looks up each type,code pair using the dicitonaries in other files (softcoded ayyy)

//Done separately because wow it is simpler and easier to debug/manage
//Actual structuring is left for compliation

const parseParenthesisTests = [
    ["(1)",1,"1"],
    ["a^{20}",3,"20"],
    ["()",1,""],
    ["list=[1,2,[3,4],5]+1",6,"1,2,[3,4],5"]
];

const parseNumberTests = [
    ["...12a",3,"12"],
    ["1+0.1+0.01+...",2,"0.1"],
    ["-1-127",3,"127"],
];

const parseCommandTests = [
    ["\\cdot",0,"\\cdot"],
    ["2\\sin x\\cos x",1,"\\sin"],
    ["1+\\cos^2x=\\sin^2x",2,"\\cos"],
    ["\\frac{1}{x^2+1}",0,"\\frac{1}{x^2+1}"]
];

const latexTests = [
    "10+11",
    "2x+1",
    "f\\left(x\\right)",
    "\\left(x+1\\right)\\left(x-1\\right)",
    "\\frac{1}{2}",
    "\\pi\\cdot r^2",
    "a^{20}-1",
    "\\sin^2x",
    "a_0tt3r",
    "f\\left(x\\right)=\\frac{1}{x^2+1}",
    "\\sqrt[4+6]{1024}=2",
    "d_{y=1}",
    "d^{y=1}",
    "\\lim_{n\\to\\infty}=\\left(1+\\frac{1}{n}\\right)^n",
    "10.0123456789+0",
    "\\left[1,2,3\\right]",
    "\\begin{cases} x+1 \\\\ x-1 \\end{cases}",
    "\\sum_{n=0}^{\\infty}\\frac{1}{n^2}",
    "a+bc-t! = \\left|x\\right| f^2\\cdot2"
];

export function testLatexParse(){
    console.log(" -- Parenthesis --");
    parseParenthesisTests.forEach(pTest => {
        console.log("Test/parse/parenthesis: ", pTest[0],pTest[1], "expected: ",pTest[2]);

        const result = parseParenthesis(pTest[0],pTest[1]);
        console.log(result);
        console.log("Passed: ", result == pTest[2]);
    });

    console.log(" -- Numbers --");
    parseNumberTests.forEach(nTest => {
        console.log("Test(ParseNum): ", nTest[0], nTest[1], "expected: ",nTest[2]);

        const result = parseNumber(nTest[0],nTest[1]);
        console.log(result.string);
        console.log("Passed: ", result.string == nTest[2]);
    });

    console.log(" -- Commands --");
    parseCommandTests.forEach(cTest => {
        console.log("Test(ParseNum): ", cTest[0], cTest[1], "expected: ",cTest[2]);

        const result = parseCommand(cTest[0],cTest[1]);
        console.log(result.string);
        console.log("Passed: ", result.string == cTest[2]);
    });

    console.log(" -- Full Test --");
    latexTests.forEach(test => {
        console.log("Test: ",test);
        console.log(tokenize(test));
    });
}

function isLetter(char){
    return char.toLowerCase() !== char.toUpperCase(); //Assume char.length = 1
}

/**
 * Determine if a string is alphanumeric
 * @param {String} string String to parse from
 * @returns NST-layer token representing the alphanumeric
 */
function isAlphanumeric(string){
    let i = 0;
    while(i<string.length-1){
        if(!(isFinite(string.charAt(i)) || isLetter(string.charAt(i)))) return false;
        i++;
    }

    return true;
}

//TODO: softcode these checks
function isLeftBracket(char){
    return (char == "(") || (char == "[") || (char == "{");
}

function isRightBracket(char){
    return (char == ")") || (char == "]") || (char == "}");
}

function parseParenthesis(string, start){
    let index = start;
    let depth = 1;
    let result = "";
    let char = "";

    while(index < string.length){
        char = string.charAt(index);

        if(isLeftBracket(char)) depth++;
        if(isRightBracket(char)) depth--;

        if(depth === 0) return result;
        
        result = result.concat(char);
        index++;
    }

    console.error("Parenthesis have no match in "+string);
    return result;
}

/**
 * Turn a latex string into a list of NST-layer tokens
 * @param {*} string Latex string (MathQuill format)
 * @param {*} context Context about the latex string such as inSubscript or inExponent
 * @returns Object[]
 */
export function tokenize(string, context = {}){
    const inSubscript = context?.inSubscript ?? false;

    let NSPtokens = [];
    let substring = "";
    let char = "";
    let metadata = {};
    let depth = 0;

    let previousToken = {};

    const pushToken = (token) => {
        if(token.metadata == undefined) throw new Error("No metadata object passed for token.");

        NSPtokens.push(token); 
        previousToken = token; //Assumption: changes to `previousToken` affect the value in the array

        substring = ""; 
        metadata = {};  
    };

    let i = 0;
    while(i < string.length){
        char = string.charAt(i);

        if(char == " "){
            i++;
            continue;
        }

        if(isFinite(char)){
            const number = parseNumber(string, i);
            pushToken(number);

            i+=number.charCount;
            continue;
        }

        if(char === "\\"){
            const command = parseCommand(string, i);
            pushToken(command);

            i += command.charCount; //command + "\"
            continue;
        }

        if(isLeftBracket(char) || isRightBracket(char)){
            const bracket = {
                type: "bracket",
                string: char,
                charCount: char.length,
                metadata: { fullString: char }
            };

            pushToken(bracket);
            i++;
            continue;
        }

        if(char === "^"){
            console.assert(previousToken.metadata?.superscript === undefined);

            const isSupEnclosed = (string.charAt(i+1) === "{"); //whether sup is enclosed in {}.
            const superscript = isSupEnclosed ? parseParenthesis(string,i+2) : string.charAt(i+1);

            previousToken.metadata.superscript = tokenize(superscript);
            i += superscript.length + 2*isSupEnclosed + 1;

            previousToken.metadata.fullString = previousToken.metadata.fullString.concat("^"+ (isSupEnclosed ? "{" + superscript + "}" : superscript));
            continue;
        }

        if(char === "_"){
            console.assert(previousToken.metadata?.subscript === undefined);

            const isSubEnclosed = (string.charAt(i+1) === "{"); //whether sub is enclosed in {}.
            const subscript = isSubEnclosed ? parseParenthesis(string,i+2) : string.charAt(i+1);

            previousToken.metadata.subscript = tokenize(subscript);
            i += subscript.length + 2*isSubEnclosed+1;
            
            previousToken.metadata.fullString = previousToken.metadata.fullString.concat("_"+ (isSubEnclosed ? "{" + subscript + "}" : subscript));
            continue;
        }

        if(["+","-","*","/","=","<",">","!","~"].includes(char)){
            const operator = {
                type: "operator", 
                string: char, 
                charCount: char.length,
                metadata: { fullString: char}
            };

            pushToken(operator);
            i++;
            continue;
        }

        if(isLetter(char)){            
            const letter = {
                type: "letter",
                string: char,
                charCount: char.length,
                metadata: { fullString: char }
            }

            pushToken(letter); 
            i++;
            continue;
        }

        if(char == ","){
            const letter = {
                type: "delimiter",
                string: char,
                charCount: char.length,
                metadata: { fullString: char }
            }

            pushToken(letter);
            i++;
            continue;
        }

        console.error("Invalid character: ",char," in: ", string);
        i++;
    }

    return NSPtokens;
}

/**
 * Parse a NST-layer token from a latex string
 * @param {String} string String to parse from
 * @param {int} start Index of the first character of the number in `string`
 * @returns NST-layer token representing the number
 */
function parseNumber(string, start){
    if(!isFinite(string.charAt(start))) throw new Error("Invalid number to be parsed");

    let hasDecimal = false;

    let substring = "";
    let i = start;
    while(isFinite(string.charAt(i)) || (string.charAt(i) === "." && hasDecimal === false )){
        if(i>=string.length) break;

        if(string.charAt(i) === ".") hasDecimal = true; //Note: this allows for things like "12." being numbers

        substring = substring.concat(string.charAt(i));
        i++;
    }

    return {
        type: "number", 
        string: substring, 
        charCount: substring.length, 
        metadata: {value: parseFloat(substring), fullString: substring}
    };
}

/**
 * Parse a NST-layer token from a latex string
 * @param {String} string String to parse from
 * @param {int} start Index of the first character of the command (after the `\`) in `string`
 * @returns {*} NST-layer token representing the command
 */
function parseCommand(string, start){
    console.assert(string.charAt(start) === "\\", "parseCommand called on non-command string: "+string);

    if(string.charAt(start+1) === "\\"){
        return {type: "delimiter", string: "\\\\", charCount: 2, metadata: {fullString: "\\\\"}};
    }

    let i = start+1;
    let substring = "\\";
    while(isLetter(string.charAt(i))){
        substring = substring.concat(string.charAt(i));
        i++;
    }

    if(substring === "\\left"){
        if(!isLeftBracket(string.charAt(i)) && string.charAt(i) != "|") console.error("Invalid latex string.");

        substring = substring.concat(string.charAt(i));

        return {type: "bracket", string: substring, charCount: substring.length, metadata: {fullString: "\\\\"}};
    }

    if(substring === "\\right"){
        if(!isRightBracket(string.charAt(i)) && string.charAt(i) != "|") console.error("Invalid latex string.");

        substring = substring.concat(string.charAt(i));

        return {type: "bracket", string: substring, charCount: substring.length, metadata: {fullString: "\\\\"}};
    }

    let optionalArguments = [];
    if(string.charAt(i) === "["){

        while(string.charAt(i) === "["){
            const optionalArgument = parseParenthesis(string,i+1);

            optionalArguments.push(tokenize(optionalArgument));

            i+=optionalArgument.length+1;

            console.assert(string.charAt(i) === "]");

            substring = substring.concat("["+optionalArgument+"]");
            i++;
        }
        
        //console.assert(string.charAt(i) === "{", ""); //do all commands with optional args have required args?
    }

    let requiredArguments = [];
    if(string.charAt(i) === "{"){

        while(string.charAt(i) === "{"){
            const requiredArgument = parseParenthesis(string,i+1);

            requiredArguments.push(tokenize(requiredArgument));
            i+=requiredArgument.length+1;

            console.assert(string.charAt(i) === "}");

            substring = substring.concat("{"+requiredArgument+"}");
            i++;
        }
    }

    return {
        type: "command", 
        string: substring, 
        charCount: i-start,
        metadata: {requiredArguments, optionalArguments, fullString: substring} //note: attribute naming shortcut
    };
}

