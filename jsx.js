const SelfCloseTags = ['br','hr','input','col','URLbase','meta','link','area'];
const JSXSymbols = ['<','/','>','{','}','\n','\t'];

const isCustomTag = (tagName)=> {
    return tagName[0].toUpperCase() == tagName[0];
};

class Token{
    type;
    symbol;
    constructor(type,symbol){
        this.type = type;
        this.symbol = symbol;
    }
    getType(){
        return this.type;
    }
    getSymbol(){
        return this.symbol;
    }
}

/**
 * 
 * @param { string } text 
 */
function AST(text,removeLineBreak){
    let splits = text.split("");
    let i = 0,len = splits.length;
    let processed = [];
    while(i<len){
        let char_1 = splits[i];
        if(char_1 == '\\'){
            i++;
            processed.push(new Token('rawChar',splits[i]));
            continue;
        }else
        if(JSXSymbols.includes(char_1)){
            switch(char_1){
                case '<':
                    /** Token : 标签 **/
                    i++;
                    let tagName = '';
                    let hasAttributes = false, attributes = {};
                    // 判断是否是自闭合标签
                    if(splits[i] == '/'){
                        i++;
                        while(i<len){
                            if(splits[i] == '>'){
                                break;
                            }else{
                                tagName += splits[i];
                            }
                            i++;
                        }
                        processed.push(new Token('tagEnd',tagName));
                        continue;
                    };

                    // process
                    while(i<len){
                        /**
                         * <div    />
                         * 这坨空格叫 "50l" (50% legal)
                         */
                        // 空格可能为 attribute 或 50l
                        if(splits[i] == ' '){
                            i++;
                            // 如果是 50l 的话那么删掉
                            if(splits[i] == ' '){
                                while(i<len){
                                    if(splits[i] != ' ') break;
                                    i++;
                                }
                            }
                            // 去掉 50l 之后判断是不是闭合
                            if(splits[i] == '/' || splits[i] == '>'){
                                processed.push(new Token('tagName_selfClosed',tagName));
                                break;
                            }
                            // 不是闭合则开始解析属性，这个地方可以直接整个解析成 string，但是会有变量的 " 符号问题
                            let attr_key = '', attr_val = '' , is_val = false,
                            string_started = false, variable_started = false;
                            hasAttributes = true;
                            while(i<len){
                                if(splits[i] == '\\'){
                                    i++;
                                    if(!is_val){
                                        attr_key += splits[i];
                                    }else{
                                        attr_val += splits[i];
                                    }
                                }else{
                                    if(splits[i] == '"'){
                                        if(string_started == true)
                                            string_started = false;
                                        else string_started = true;
                                        i++;
                                        continue;
                                    }
                                    if(splits[i] == '{' && variable_started == false && string_started == false ){
                                            variable_started = true;
                                            splits[i]='${';
                                    }
                                    if(splits[i] == '}' && variable_started == true && string_started == false ){
                                            variable_started = false;
                                        }
                                    if(splits[i] == '/' || splits[i] == '>'){
                                        if(splits[i-1] != '\\' && string_started == false && variable_started == false){
                                            attributes[attr_key] = attr_val;
                                            attr_key = '';
                                            attr_val = '';
                                            break;
                                        }
                                    }
                                    // 遇到空格判断是属性值还是结束一个声明
                                    if(splits[i] == ' '){
                                        if(string_started == false && variable_started == false){
                                            is_val = false;
                                            i++;
                                            attributes[attr_key] = attr_val;
                                            attr_key = '';
                                            attr_val = '';
                                            continue;
                                        }
                                    }
                                    if(splits[i] == '=' && string_started == false && variable_started == false){
                                            is_val = true;
                                            i++;
                                            continue;
                                    }
                                    // 这个地方将字符添加到属性名或属性值
                                    {
                                        if(!is_val){
                                            attr_key += splits[i];
                                        }else{
                                            attr_val += splits[i];
                                        }
                                    }
                                }
                                i++;
                            }
                        }
                        if(splits[i] == '/'){
                            processed.push(new Token('tagName_selfClosed',tagName));
                            if(hasAttributes) processed.push(new Token('tagAttributes',attributes));
                            break;
                        }else
                        if(splits[i] == '>'){
                            processed.push(new Token('tagName_closedWithContent',tagName));
                            if(hasAttributes) processed.push(new Token('tagAttributes',attributes));
                            break;
                        }else
                        tagName += splits[i];
                        i++;
                    }
                    break;
                case '/': /** Token : 标签闭合  |  这个代码块在解析合法JSX时不会单独执行操作 */ break;
                case '>': /** Token : 标签结尾  |  这个代码块在解析合法JSX时不会单独执行操作 */ break;
                case '{':
                    /**
                     * Token: 替换量
                     */
                    let vari = '${';
                    i++;
                    while(i<len){
                        if(splits[i] == '}' && splits[i-1] != '\\'){
                            vari += '}';
                            processed.push(new Token('variableContent',vari));
                            break;
                        }else{
                            vari += splits[i];
                        }
                        i++;
                    }
                    break;
                case '}': /** Token: 结尾  |  这个代码块在解析合法JSX时不会单独执行操作 */ break;
                case '\n':
                case '\t':
                    if(!removeLineBreak){
                        processed.push(new Token('rawChar',splits[i]));
                    }
                    break;

            }
        }
        else{
            processed.push(new Token('rawChar',splits[i]));
        }
        i++;
    }
    return processed;
}

function parseToJS(tokenArray,config,debug = false){
    let i = 0,len = tokenArray.length;
    let processed = '', element_stack = [];
    // 当启用 parseCustomTagToCSSClass 时 元素栈是有用的，这意味着 Token:tagEnd 的 symbol 其实没用
    if(debug) console.log(tokenArray);
    let class_prefix = config.classPrefix != undefined ?config.classPrefix :'';
    while(i<len){
        let token_1 = tokenArray[i] ,str = '' ,symbol = '';
        switch(token_1.type){
            case 'tagName_closedWithContent':
                var attrs = {};
                if(tokenArray[i+1].type == 'tagAttributes'){
                    i++; attrs = tokenArray[i].symbol; 
                }
                if(config.elementReplace[token_1.symbol] != undefined)
                    symbol = config.elementReplace[token_1.symbol];
                else if(isCustomTag(token_1.symbol) && config.parseCustomTagToCSSClass == true){
                    symbol = 'div';
                    attrs['class'] = (attrs['class'] != undefined ?attrs['class']+' ' :'') + class_prefix+token_1.symbol;
                }else symbol = token_1.symbol;
                str = '<' + symbol;
                for(let attr in attrs){
                    str += ' ' + attr + '="' + attrs[attr] + '"';
                }
                str += '>';
                element_stack.push(symbol);
                break;
            case 'tagName_selfClosed':
                var attrs = {};
                if(tokenArray[i+1].type == 'tagAttributes'){
                    i++; attrs = tokenArray[i].symbol;
                }
                if(config.elementReplace[token_1.symbol]!=undefined)
                    symbol = config.elementReplace[token_1.symbol];
                else if(isCustomTag(token_1.symbol) && config.parseCustomTagToCSSClass == true){
                    symbol = 'div';
                    attrs['class'] = (attrs['class'] != undefined ?attrs['class']+' ' :'') + class_prefix+token_1.symbol;
                }else symbol = token_1.symbol;
                str = '<' + symbol;
                for(let attr in attrs){
                    str += ' ' + attr + '="' + attrs[attr] + '"';
                }
                if(! SelfCloseTags.includes(symbol)){
                    str += '></' + symbol + '>'; 
                }else
                str += '/>';
                break;
            case 'tagEnd':
                let tagName = element_stack.pop();
                str = '</' + tagName + '>';
                break;
            case 'variableContent':
            case 'rawChar':
                str = token_1.symbol;
                break;
        }
        processed += str;
        i++;
    }
    return processed;
}

exports.AST = AST;
exports.parseToJS = parseToJS;