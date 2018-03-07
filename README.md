# tgt-pkg
网站质量测试通用

##用法：

###检测




    tgtest.check({
        'config':{
            'host':'10.194.0.196',
            'isbnAPI':'http://10.213.140.86/isbn_api.php?url='
        },
        //文件检查.支持本地文件路径及线上文件
        //本地文件将会默认遍历文件夹及子文件夹内的图片，如果不检查，请设置 check_pic:false
        //如设置request选项，将会默认测试request中随机三张图片
        'file':{
            'name':'D:/xampp_php7.0/htdocs/tgtest/public/tool/data/201803/06/20180306091604353.html',
            // 'path':'http://qhyx.qq.com/cp/a20180109card/index.htm',
            // //自定义规则，times:检查次数，一般用来检测数量,content：需要检查的字符串
            // 'rule':[{'times':'all','content':'http://game.gtimg.cn/images/js/title.js'}]
        },
        //请求检查，真实的http请求,传入phantomjs生成的json文件地址
        //默认检查: 图片大小 picSize:true
        //todo:
        // 1、点击流 ping:true
        'request':{
            'name':'D:/xampp_php7.0/htdocs/tgtest/public/tool/data/201803/06/20180306091604353.html'
        }
    },
    function(cb){
        console.log('asd')
        console.log(cb)
        console.log(cb.checkResult)
    })


