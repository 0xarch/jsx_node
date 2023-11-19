const JSX = require('./jsx');
const IO = require('./io');

let argv = process.argv;

let i_path = argv[2];
let o_path = argv[3];
let config = JSON.parse(argv[4]);

let q =JSX.parseToJS(JSX.AST(IO.readFile(i_path),config.removeLineBreak),config,false) , p = '';

if(config.replaceVariables){
    with(config.variables){
        p = eval('`' + q + '`');
    }
}else p = q;

if(config.writeToFile){
    IO.writeFile(o_path,p);
}