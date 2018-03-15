# tgt-pkg
网站质量测试通用

## 安装：
$ npm install --save tgt-pkg

## 用法：
### 检测:



    tgtest.check({

        'config':{
            'host':'x.x.x.x',//通用host
            'isbnAPI':{'host':'x.x.x.x','url':'http://x.x.x.x/isbn_api.php?url='}//host:api host,url:API地址
        },
        'file':{
            'name':filename//需要检查的html文件
        },
        'request':{
            'name':filename//需要检查的json文件
        }
    },
    function(cb){
        //cb.checkResult:
        //{
        //pageStandard:'ture/false'
        //list:[{
        // "error_id": 1002,
        // "error_info": "无法检测到页面编码",
        // "pass_info": "页面编码正常"
        // }]
        //}
    })




