# tgt-pkg
网站质量测试通用

## 安装：
$ npm install --save tgt-pkg

## 用法：
### 检测:

``` javascript
    tgtest.check({

        'config':{
            /**
             * 通用host
             * @type    {String}
             */
            'host':'x.x.x.x',
            'isbnAPI':{
                /**
                 * ISBN host地址
                 * @type    {String}
                 */
                'host':'x.x.x.x',
                /**
                 * ISBN 地址
                 * @type    {String}
                 */
                'url':'http://x.x.x.x/isbn_api.php?url='
            }//host:api host,url:API地址
        },
        /**
         * 用户自定义检查配置
         */
        'custom':{
            /**
             * 检查文件中的文本信息
             * @typedef {object}
             * @property {string} name 检查项的名称
             * @property {string} rule 需要检查的字符
             * @property {string} type 检查的类型  （char 字符，tag 标签/只需填写标签名）
             */
            'file':[
            {'name':'图片','rule':'123.jpg','type':'char'},
            {'name':'div标签','rule':'div','type':'tag'}
            ],
            /**
             * 检查请求中的文本信息
             * @typedef {object}
             * @property {string} name 检查项的名称
             * @property {string} rule 需要检查的字符
             * @property {string} type 检查的类型  （source 请求）
            */
            'request':[
            {'name':'王者统计代码','rule':'ossweb-img.qq.com/images/js/milo/milo-mi1n.js','type':'source'},
            ]
        },
        'file':{
            /**
             * 需要检查的html文件
             * @type    {String}
             */
            'name':filename//需要检查的html文件
        },
        'request':{
            /**
             * 需要检查的json文件
             * @type    {String}
             */
            'name':filename
        }
    },
    function(cb){
        //cb.checkResult
    })
```

### 回调:
``` javascript
        //cb.checkResult:
        {
        /**
         * 页面是否是标准页面 @type {Boolean}
         */
        pageStandard:'ture',
        /**
         * 页面是否是标准页面
         */
        ignore:'none',         
        /**
         * 页面地址
         */
        url:'http://game.qq.com',        
        /**
         * 是否为开发接口拉取的数据   @type {Boolean}
         */
        openapi:'true',
        /**
         * 错误列表
         * @typedef {object}
         * @property {nubmer} error_id 检查项ID
         * @property {string} error_info 出错的具体信息，（为空或者不存在则检查项为正确）
         * @property {string} pass_info 通过的具体信息，可能为空
         * @property {string} name 检查项的具体名称
        */
        list:[
         {
             "error_id": 1002,
             "error_info": "无法检测到页面编码",
             "pass_info": "页面编码正常",
             "name":"编码"
         },         
         {
             "error_id": 'custom_file_1',
             "error_info": "个度：122",
             "pass_info": "页面编码正常"
             "name": "div标签"
         }
         ]
        }
```
