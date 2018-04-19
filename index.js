'use strict';
const fs = require('fs');
const fse = require('fs-extra')
const path = require('path');
const makeDir = require('make-dir');
const iconv = require('iconv-lite');
const http = require("http");
const cheerio = require('cheerio');
// const imagemin = require('imagemin');
// const imageminJpegtran = require('imagemin-jpegtran');
// const imageminMozjpeg = require('imagemin-mozjpeg');
// const imageminPngquant = require('imagemin-pngquant');
// const imageminGifsicle = require('imagemin-gifsicle');
// const imageminSvgo = require('imagemin-svgo');
// const imageminWebp = require('imagemin-webp');


/*参数*/
var localPicPath = '';
var requestArg = false;
var requestInfo = null;
var moduleConfig = null;
//随机算法
function shuffle(arr){
    let n = arr.length, random;
    while(0!=n){
        random =  (Math.random() * n--) >>> 0; // 无符号右移位运算符向下取整
        [arr[n], arr[random]] = [arr[random], arr[n]] // ES6的结构赋值实现变量互换
    }
    return arr;
}
//检查文件是否存在
function checkFileExists(filepath){
    return new Promise((resolve, reject) => {
        fs.access(filepath, fs.F_OK, error => {
        resolve(!error);
});
});
}

// 合并对象
function extend(target, source) {
    for (var obj in source) {
        target[obj] = source[obj];
    }
    return target;
}
//字符大写、去除空格、去除特殊字符
function fomatString(str) {
    return filterStr(str.replace(/\s+/g,"").toUpperCase());
}

//去除特殊字符
function filterStr(str) {
    var pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]");
    var specialStr = "";
    for(var i=0;i<str.length;i++)
    {
        specialStr += str.substr(i, 1).replace(pattern, '');
    }
    return specialStr;
}
//检查项配置
const initCheck = [
    {
      'name':'页面标题',//检查项的名称
      'enname':'title',//英文别名
      'rule':{'function':'checkTitle'},//检查函数
      'run':true,  //是否默认运行
      'error_id':2001//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   },
    {
      'name':'关键字',//检查项的名称
      'enname':'keywords',//英文别名
      'rule':{'function':'checkKeywords'},//检查函数
      'run':true,  //是否默认运行
      'error_id':2002//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   },
    {
      'name':'描述',//检查项的名称
      'enname':'description',//英文别名
      'rule':{'function':'checkDescription'},//检查函数
      'run':true,  //是否默认运行
      'error_id':2003//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   },
    {
      'name':'编码',//检查项的名称
      'enname':'charset',//英文别名
      'rule':{'function':'checkCharset'},//检查函数
      'run':true,  //是否默认运行
      'error_id':2004//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   },
    {
      'name':'点击流',//检查项的名称
      'enname':'ping',//英文别名
      'rule':{'function':'checkPing'},//检查函数
      'run':true,  //是否默认运行
      'error_id':1001//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   }
]




//自定义
global.userCustom = function (page,type,config,checkResult) {
    var keyB = 'custom_file_';
    var temp = {};
    config  = config.custom;
    //文件中的自定义检查项
    if(type == 'file'){
        for(var i = 0;i< config.file.length;i++){
            temp = {};
            var f = config.file[i];
            var name = f.name == ''  ?keyB+i : f.name;
            if(f.type == 'tag'){
                temp['error_id'] = keyB+i;
                if($(f.rule).length == 0){
                    temp['error_info'] = name +'不存在';
                }else{
                    temp['pass_info'] = '个度：'+$(f.rule).length;
                }
            }else if(f.type=='char'){
                temp = charCheck(f.rule,name);
            }
            temp['name'] = name;
            checkResult.list.push(JSON.parse(JSON.stringify(temp)));
        }
        function charCheck(c,name) {
            var reg = new RegExp(c,'ig');
            if(!reg.test(page)){
                temp['error_info'] = name +'不存在';
            }
            temp['error_id'] = name;
            return temp;
        }
    //请求中的自定义检查项
    }else if(type == 'request'){

        for(var i = 0;i< config.request.length;i++){
            temp = {};
            var f = config.request[i];
            var has = false;
            temp.name = f.name;
            temp['error_id'] = 'custom_request_'+i;
            if(f.type == 'source'){
                page.log.entries.forEach(function (e) {
                    if(e.request.url.indexOf(f.rule) >= 0 ){
                        temp['pass_info'] = f.rule+'已添加';
                        checkResult.list.push(JSON.parse(JSON.stringify(temp)));
                        has = true
                    }
                });
                if(!has){
                    temp['error_info'] = f.rule+'未添加';
                    checkResult.list.push(JSON.parse(JSON.stringify(temp)));
                }

            }

        }
    }
};
//检测标题
global.checkTitle = function (page) {
    if(checkIgnore().indexOf('title') >= 0) return 0;
    var title = $('title');
    var titleText = $('title').text();
    var rt = {};
    var checkRe = /\-\s?腾讯(?:游戏)/;
    var viewport = $('meta[name=viewport]');
    //有viewport的移动端页面不检测标题规范
    if(viewport.length == 0){
        if (title.length > 0) {
            if (checkRe.test(titleText)) {
                if(titleText.length > 80){
                    rt['error_info'] = '页面标题字符大于'+intTitleLength+'个，请减少标题长度，目前标题内容：'+titleText;
                }else{
                    rt['pass_info'] = '';
                }
            } else {
                    rt['error_info'] = '标题上必须含有“-腾讯游戏”目前标题内容：“'+titleText+'”';
            }
        } else {
            rt['error_info'] = '页面title标签不存在';
        };
    }else{
        rt['pass_info'] = '';
    }
    return rt;
};

//检测关键词
global.checkKeywords  = function (page) {
    if(checkIgnore().indexOf('keywords') >= 0) return 0;
    var metaKeywords = $("meta[name$='eywords']");
    var con = metaKeywords.attr("content");
    var rt = {};
    if (metaKeywords.length > 0 && con.length > 0) {
            rt['pass_info'] = "";
    } else if(metaKeywords.length == 0) {
            rt['error_info'] =  'keywords标签不存在';
    }else{
        rt['error_info'] =  'keywords没有填写';
    };
    return rt;
};
//检测描述
global.checkDescription  = function (page) {
    if(checkIgnore().indexOf('description') >= 0) return 0;
    var metaDescription = $("meta[name$='escription']");
    var con = metaDescription.attr("content");
    var rt = {};
    if (metaDescription.length > 0 && con.length >0) {
            rt['pass_info'] = "";
    } else {

        if(metaDescription.length == 0 ){
            rt['error_info'] =  'description标签不存在';
        }
        if(typeof con != 'undefined'){
            if(con.length <= 20){
                rt['error_info'] =  '页面描述请至少添加20字符';
            }
        }

    };
    return rt;
}
//检测排除项
global.checkIgnore  = function (page) {

    var metaIgnore = $("meta[name$='ignore']");
    var con = metaIgnore.attr("content");
    var rt = '';
    if (metaIgnore.length > 0 && con.length >0) {
        //checkResult.push({'ignore':'all'})
        rt = con.split(',');
    };
    return rt;
};
//检测编码
global.checkCharset  = function (page) {
    if(checkIgnore().indexOf('charset') >= 0) return 0;
    var metaCharset = /<meta[^>]*?charset=(["'/>]?)([^"'\s/>]+)\1[^>]*?>/gim;
    var charset = null;
    var rt = {};

    if (page.match(metaCharset) != null) {
        //
        //    charset = metaCharset.exec(page)[0].replace(/<|>|meta|=|name|keywords|charset|"|'|\s/gim, '');
        //    console.log(charset)
        var regC =  new RegExp("gbk|gb2312|utf-8","ig");
        //console.log(regC.test(charset))
        //     if(regC.test(charset) ){
        //         rt['pass_info'] = "";
        //     }else{
        //         rt['error_info'] = "页面编码最好为 gbk 或 gb2312 ";
        //     }
        //     rt['content'] = charset;
        //
        //
        // rt['pass_info'] = "页面编码为"+charset;
    } else {
        rt['error_info'] =  '页面编码没有声明，可能会引起页面错乱';
    };
    return rt;
};
//点击流检测
global.checkPing = function(con) {
    if(checkIgnore().indexOf('ping') >= 0) return 0;
    var rt = {};
    var flag = false;
    if(typeof  con === 'string'){
        f(con);
    }else{
        for (var i = 0; i <  con.length; i++) {
            var di  = con[i];
            if(!flag){
                f(di,di);
            }
        }
    }
    function f(data,url) {
            if(data.indexOf('ping_tcss') != -1||data.indexOf('ping') != -1){
                var u = !url ? '' : ',URL为：'+url  ;
                rt['pass_info'] = "页面统计代码已添加"+ u;
                rt['error_info'] = "";
                flag = true;
            }
    }
    if(!flag){
        rt['pass_info'] = '';
        rt['error_info'] = "未检测到上报统计请求，请查看是否已添加上报统计代码或实例化函数是否书写正常";
    }

    return rt;
}
//点击流检测
global.checkISBN = function(url,page) {
    // if(page.indexOf('ISBN'))

    var rt = {};
    rt['error_id'] = 1002;
    rt['name'] = '版号';
    rt['pass_info'] = '';

    return new Promise((resolve,reject) => {
        if(checkIgnore().indexOf('isbn') >= 0) resolve(0);
        const option = {
            host : moduleConfig.isbnAPI.host,
            port: 80,
            path: url
        }
        const req =  http.get(option,(response) => {
            var body = '';
            response.on('data', function (d) {
                body += d;
            });
            response.on('end', function () {
                var getApi = JSON.parse(body)[0];
                if(typeof  getApi != 'undefined' ){
                    var pointISBN = page.indexOf('ISBN');
                    var ISBN = pointISBN <= 0 ? '' :fomatString(page.substring(pointISBN,pointISBN+22));
                    var m = page.match(/新广出审(\S*)号/);
                    var Approvalno = !m ? '': fomatString(page.match(/新广出审(\S*)号/)[0]);
                    //比对ISBN
                    if(ISBN != '' ){
                        if(ISBN == fomatString(getApi.isbnno)){
                            rt['pass_info'] = "";
                        }else{
                            rt['error_info'] = "互联网游戏出版物ISBN号不正确"
                        }
                    }
                    if(Approvalno != '' ){
                        if(Approvalno == fomatString(getApi.approvalno)){
                            rt['pass_info'] = "";
                        }else{
                            rt['error_info'] = "新广出审批号出错"
                        }
                    }
                    resolve(rt);
                }else{
                    resolve(rt);
                }
            });
            response.on('error', function(e) {
                reject(err);
            });
        })

    });
};
//本地图片ossweb-img目录检查
function  checkImage() {
    return new Promise((resolve,reject) => {
    var fileList = [];
    var normalSize = 0;
    var l = false;
    var optimizeSize = 0;
    var canOptimizeSize  = 0;
    //路径斜杠转化
    function fp(path){
        path=path.replace(/\\+/g,'/');
        return path.replace(/\/+/g,'/');
    }
    //图片文件遍历
    function walk(path){
        var dirList = fs.readdirSync(path);
        dirList.forEach(function(item){
            if(l){return false;}
            if(fs.statSync(path + '/' + item).isDirectory()){
                walk(path + '/' + item);
            }else{
                if(fileList.length < 500){
                    fileList.push(item);
                    if (/\.(gif|jpg|jpeg|png|GIF|JPG|PNG)$/.test(item)){
                        normalSize += fs.statSync(path + '/' +item)["size"];
                    }
                }else{
                    l = true;
                }
            }
        });
    }

    fs.access(localPicPath, (err) => {
        if (!err) {
            walk(localPicPath);
            imagemin(['ossweb-img/*.{jpg,png,gif,webp,svg}'], '', {
                plugins: [
                    imageminMozjpeg(),
                    imageminPngquant(),
                    imageminGifsicle()
                ]
            }).then(files => {
                for(var i= 0;i<files.length;i++){
                optimizeSize += files[i].data.byteLength;
            }

            resolve(normalSize - optimizeSize);

        });
        }else{
            resolve(0)
        }
    })
})
};
//检查线上图片
function  checkOnlineImage(pic) {


    return new Promise((CLIR,CLIJ) => {

    function getPic(url) {
        return new Promise((resolve,reject) => {
            var  option = {
                host : '10.194.0.196',
                port: 80,
                path: url
            }
            const req =  http.get(option,(res) => {
                var chunks = [];
            var size = 0;
            res.on('data', function (chunk) {
                chunks.push(chunk);
                size += chunk.length;
            });
            res.on('end', function () {
                var data = null;
                switch(chunks.length) {
                    case 0: data = new Buffer(0);
                        break;
                    case 1: data = chunks[0];
                        break;
                    default:
                        data = new Buffer(size);
                        for (var i = 0, pos = 0, l = chunks.length; i < l; i++) {
                            var chunk = chunks[i];
                            chunk.copy(data, pos);
                            pos += chunk.length;
                        }
                        break;
                }

                imagemin.buffer(data,{
                    plugins: [
                        imageminMozjpeg(),
                        imageminPngquant()
                    ]
                }).then(outBuffer  => {
                resolve(data.length - outBuffer.length );
            });

            });
        }).on('error', (e) => {
                reject(err);
        });
    });
    }
    var tOP = 0;
   //随机检查线上3张图片，如果可优化体积大于0，则返回0
    var picArray = shuffle(pic);
    Promise.all([getPic(picArray[0]), getPic(picArray[1]), getPic(picArray[2])]).then(function(results){
        results.forEach(function(size){
            tOP = tOP + size;
        });
        if(tOP > 0){
            CLIR(tOP)
        }else{
            CLIJ(0)
        }
    }).catch(function(err){
        console.log(err);
    });
 });
}
//图片检查错误详情
function  imageResult(size,online) {
    var temp = {};
    temp['error_id'] = 3001;
    temp['name'] = '图片';
    if(size > 0){
        if(!online){
            temp['error_info'] = '图片没有经过优化，压缩后可节省约' + parseInt(size/1024) +'KB的体积';
        }else{
            temp['error_info'] = '图片没有经过优化';
        }

    }else{
        temp['pass_info'] = '图片已压缩';
    }
    return temp;
}

global.$ = null;

//读取页面内容
// function readPage(arg) {
//     return new Promise((resolve,reject) => {
//             if(typeof arg.file.name != 'undefined' && typeof arg.file.name !== ''){
//                 var c = typeof  arg.file.charset != 'undefined' ? arg.file.charset : 'utf-8'
//                 var p =  iconv.decode(fs.readFileSync(arg.file.name),c);
//                 console.log(arg.file.name)
//                 global.$ = cheerio.load(p,{useHtmlParser2:false});
//                 resolve(p);
//             }else{
//                 reject({
//                     code:404,
//                     message: '没有找到页面，请确认配置',
//                 })
//             }
//     })
// }
function readPage(arg) {
    return new Promise((resolve,reject) => {
            if(typeof arg.file.name != 'undefined' && typeof arg.file.name !== ''){
                var c = typeof  arg.file.charset != 'undefined' ? arg.file.charset : 'utf-8'


                fs.readFile(arg.file.name,function (err, buffer) {
                    var p =  iconv.decode(buffer,c);
                    global.$ = cheerio.load(p,{useHtmlParser2:false});
                    resolve(p);
                });
                // var p =  iconv.decode(fs.readFileSync(arg.file.name),c);
                // console.log(arg.file.name)
                // console.log(p.slice(100,200))
                // global.$ = cheerio.load(p,{useHtmlParser2:false});
                // resolve(p);
            }else{
                reject({
                    code:404,
                    message: '没有找到页面，请确认配置',
                })
            }
    })
}
//排除测试页面及include页面
function standardPage(page,checkResult) {
    if($('head meta').length === 0){
        checkResult['pageStandard'] ='false';
    }else{
        checkResult['pageStandard'] ='true';
    }
}

//check方法
function check(arg,callback){
   localPicPath = path.resolve(arg.basePath+'ossweb-img/');
    //检查结果
    var checkResult = {
        'list':[
            // {
            // "error_id": 1002,
            // "error_info": "无法检测到页面编码",
            // "pass_info": "页面编码正常"
            // }
        ]
    };
   readPage(arg)
       .then((page)=>{

            //用户自定义
            if(typeof arg.custom == 'object' ){
                if(arg.custom.file .length>0){
                    userCustom(page,'file',arg,checkResult);
                }
            }
            //标准页面检测
            standardPage(page,checkResult);

            for(var i=0;i< initCheck.length;i++){

                const data = initCheck[i];
               //配置为函数
                if(typeof data.function !== undefined && typeof data.function !== '' &&  data.run){
                    var temp = {};
                    temp = global[data.rule.function](page);
                    if(temp){
                        temp['error_id'] = data.error_id;
                        temp['name'] = data.name;
                        checkResult.list.push(temp);
                    }

                }
            };
            checkResult['url'] = arg.file.name;
            return page;
       }).then((page)=>{

                return new Promise((resolve,reject) => {
                    // 判断是否配置json
                    if(!arg.request){arg.request = {};arg.request.name = ''};
                    //配置代理和host
                    if(arg.config){moduleConfig = arg.config};
                    fs.access(arg.request.name,(err) => {

                        //是否配置name
                        if(!err && fs.readFileSync(arg.request.name).toString() != '' ){
                            requestArg = true;
                            requestInfo = JSON.parse(fs.readFileSync(arg.request.name).toString());
                            //用户自定义
                            if(typeof arg.custom == 'object' ){

                                if(arg.custom.request.length>0){
                                    userCustom(requestInfo,'request',arg,checkResult);
                                }
                            }
                            checkResult['url'] =requestInfo.log.pages[0].id;
                            checkResult['admin'] =requestInfo.log.nameList;
                            if(requestInfo.log.images.length < 3){
                                var num = 3 - requestInfo.log.images;
                                for(var i = 0;i<num;i++){
                                    requestInfo.log.images.push('http://ossweb-img.qq.com/images/game/brand/game-logo.png')
                                }
                            }
                            //从真实请求中检测点击流
                            for(var i =0;i<checkResult.list.length;i++){
                                if(checkResult.list[i].error_id == 1001){
                                    checkResult.list[i] = extend(checkResult.list[i], checkPing(requestInfo.log.ping,'json'))
                                }
                            }

                            var apiUrl = moduleConfig.isbnAPI.url + requestInfo.log.pages[0].isbnlink;
                            checkISBN(apiUrl,page).then((l)=>{
                                if(l){
                                    checkResult.list.push(l)
                                }
                                resolve(page);
                            });
                                //检查线上图片体积
                                // if(!!arg.file.checkPic){
                                // checkOnlineImage(requestInfo.log.images).then(size => {
                                //      checkResult.list.push(imageResult(size,true));
                                //      var apiUrl = 'http://x.x.x.x/isbn_api.php?url='+requestInfo.log.pages[0].id;
                                //     //检查isbn号
                                //     checkISBN(apiUrl,page).then((l)=>{
                                //         checkResult.list.push(l)
                                //         resolve(page);
                                //     })
                                //     //return callback({'checkResult':checkResult});
                                // })
                                //}
                        }else{
                            if(!!arg.file.checkPic){
                                checkImage().then((size)=>{
                                    checkResult.list.push(imageResult(size));
                                    resolve(page);
                                })
                           }else{
                                resolve(page);
                            }
                        }
                    });
                }).catch(e=>{
                console.log(e.message)
                })
       }).then((page)=>{
           // console.log('000000000')
           // console.log(checkResult)
          checkResult['ignore'] = 'none';
          if(checkIgnore()[0] == 'all'){
                //回调
                checkResult.list = {};
                callback({'checkResult':checkResult})
          }else{
               var d =checkIgnore().toString() ;
                checkResult['ignore'] = d == '' ? 'none' : d;
                //回调
                callback({'checkResult':checkResult});
          }

       }).catch(e=>{
           console.log(e.message)
       })
}
exports.check=check;
