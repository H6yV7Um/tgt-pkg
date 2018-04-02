# tgt-pkg
网站质量测试通用

## 安装：
$ npm install --save tgt-pkg

## 用法：
### 检测:



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
        //cb.checkResult:
        //{
        //pageStandard:'ture/false'
        //ignore:'none' 
        //list:[{
        // "error_id": 1002,
        // "error_info": "无法检测到页面编码",
        // "pass_info": "页面编码正常"
        // }]
        //}
    })




