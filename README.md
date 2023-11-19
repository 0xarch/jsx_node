# JSX Node

简单的基于 Node.js 的 JSX 解析器.

* 需求：
    * Node.js

使用：

```sh
node main.js $input_file_path $output_file_path $config
```

注意：$config不是文件目录!

配置：

{
    "parseCustomTagToCSSClass":boolean 是否将自定义标签转为CSS类,
    "classPrefix":string 若转换，则CSS类前缀为(默认为空),
    "replaceVariables":boolean 是否替换变量,
    "writeToFile":boolean 是否写入output_file_path,
    "removeLineBreak":boolean 是否移除换行符和空格,
    "elementReplace":{
        "oldTagName":"newTagName" 解析时将oldTagName替换为newTagName
    },
    "variables":{
        若替换变量，则可使用的变量列表
    }
}