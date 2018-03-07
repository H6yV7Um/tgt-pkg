# tgt-pkg
网站质量测试通用

## 用法：

### 检测






    tgtest.check({

        'config':{
            'host':'x.x.x.x',//通用host
            'isbnAPI':{'host':'x.x.x.x','url':'http://x.x.x.x/isbn_api.php?url='}//host:api host,url:API地址
        },
        'file':{
            'name':filename + '.html',//需要检查的html文件
        },
        //请求检查，真实的http请求,传入phantomjs生成的json文件地址
        //默认检查: 图片大小 picSize:true
        //todo:
        // 1、点击流 ping:true
        'request':{
            'name':filename + '.json'//需要检查的json文件
        }
    },
    function(cb){
        console.log(cb)
        dbQuery(cb.checkResult)
    })




