const Fs = require("fs");

exports.readFile = function(file_path){
    let content = Fs.readFileSync(file_path).toString();
    return content;
}

exports.writeFile = async function(file_path,file_content){
    Fs.writeFile(file_path,file_content,()=>{});
}