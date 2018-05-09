'use strict';
const fs = require('fs');
const fse = require('fs-extra')
const path = require('path');
const makeDir = require('make-dir');
const iconv = require('iconv-lite');
const http = require("http");
const cheerio = require('cheerio');
const request = require('request');

// const imagemin = require('imagemin');
// const imageminJpegtran = require('imagemin-jpegtran');
// const imageminMozjpeg = require('imagemin-mozjpeg');
// const imageminPngquant = require('imagemin-pngquant');
// const imageminGifsicle = require('imagemin-gifsicle');
// const imageminSvgo = require('imagemin-svgo');
// const imageminWebp = require('imagemin-webp');


/*参数*/
let localPicPath = '';
let requestArg = false;
let requestInfo = null;
let moduleConfig = null;
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
    for (let obj in source) {
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
    let pattern = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？%+_]");
    let specialStr = "";
    for(let i=0;i<str.length;i++)
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
   },
   {
      'name':'通用页脚',//检查项的名称
      'enname':'foot',//英文别名
      'rule':{'function':'checkFoot'},//检查函数
      'run':true,  //是否默认运行
      'error_id':1003//错误编码 http://tapd.oa.com/TGtest/markdown_wikis/#1020355671006485867
   }
]




//自定义
global.userCustom = function (page,type,config,checkResult,v) {
    let keyB = 'custom_file_';
    let temp = {};
    config  = config.custom;
    //文件中的自定义检查项
    if(type == 'file'){
        for(let i = 0;i< config.file.length;i++){
            temp = {};
            let f = config.file[i];
            let name = f.name == ''  ?keyB+i : f.name;
            if(f.type == 'tag'){
                temp['error_id'] = keyB+i;
                if($(f.rule).length == 0){
                    temp['error_info'] = name +'不存在';
                }else{
                    temp['pass_info'] = 'length：'+$(f.rule).length;
                }
            }else if(f.type=='char'){
                temp = charCheck(f,name);
            }
            temp['name'] = name;
            checkResult.list.push(JSON.parse(JSON.stringify(temp)));
        }
        function charCheck(c,name) {
            let m = !c.mode ? 'ig':c.mode;
            let reg = new RegExp(c.rule,m);
            let re = page.match(reg);
            if(!reg.test(page)){
                temp['error_info'] = name +'不存在';
            }else{
                temp['pass_info'] = re.toString()
            }
            temp['error_id'] = name;
            return temp;
        }
    //请求中的自定义检查项
    }else if(type == 'request'){

        for(let i = 0;i< config.request.length;i++){
            temp = {};
            let f = config.request[i];
            let has = false;
            temp.name = f.name;
            temp['error_id'] = 'custom_request_'+i;
            if(f.type == 'source'){
                /**高版本检查*****************/
                if(v == 'high'){
                    for(let r in page){
                        if(r.indexOf(f.rule) >= 0 ){
                            temp['pass_info'] = f.rule+'已添加';
                            checkResult.list.push(JSON.parse(JSON.stringify(temp)));
                            has = true
                        }
                    }
                }else{
                    page.log.entries.forEach(function (e) {
                        if(e.request.url.indexOf(f.rule) >= 0 ){
                            temp['pass_info'] = f.rule+'已添加';
                            checkResult.list.push(JSON.parse(JSON.stringify(temp)));
                            has = true
                        }
                    });
                }

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
    let title = $('title');
    let titleText = $('title').text();
    let rt = {};
    let checkRe = /\-\s?腾讯(?:游戏)/;
    let viewport = $('meta[name=viewport]');
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
            rt['error_info'] = 'title标签不存在';
        };
    }else{
        rt['pass_info'] = '';
    }
    return rt;
};

//检测关键词
global.checkKeywords  = function (page) {
    if(checkIgnore().indexOf('keywords') >= 0) return 0;
    let metaKeywords = $("meta[name$='eywords']");
    let con = metaKeywords.attr("content");
    let rt = {};
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
    let metaDescription = $("meta[name$='escription']");
    let con = metaDescription.attr("content");
    let rt = {};
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
global.checkIgnore  = function () {
    let metaIgnore = $("meta[name$='ignore']");
    let con = metaIgnore.attr("content");
    let rt = '';
    if (metaIgnore.length > 0 && con.length >0) {
        //checkResult.push({'ignore':'all'})
        rt = con.split(',');
    };
    return rt;
};
//检测编码
global.checkCharset  = function (page) {
    if(checkIgnore().indexOf('charset') >= 0) return 0;
    let metaCharset = /<meta[^>]*?charset=(["'/>]?)([^"'\s/>]+)\1[^>]*?>/gim;
    let charset = null;
    let rt = {};

    if (page.match(metaCharset) != null) {
        let regC =  new RegExp("gbk|gb2312|utf-8","ig");
    } else {
        rt['error_info'] =  '编码没有声明，可能会引起页面错乱';
    };
    return rt;
};
//点击流检测
let __htmlPing = false;
let __requestPing = false;
global.checkPing = function(con,source) {
    if(checkIgnore().indexOf('ping') >= 0) return 0;
    let rt = {};
    let flag = false;
    if(typeof  con === 'string'){
        f(con);
    }else{
        for (let i = 0; i <  con.length; i++) {
            let di  = con[i];
            if(!flag){
                f(di,di,source);
            }
        }
    }
    function f(data,url,source) {
        let u = !url ? '' : url  ;
        //检查html中的ping.js
        if(source != 'request'){
            if(data.indexOf('ping_tcss') != -1||data.indexOf('ping') != -1){

                rt['pass_info'] = "页面统计代码已添加，上报URL为："+ u;
                __htmlPing = true;
                rt['error_info'] = "";
                flag = true;
            }else{
                rt['error_info'] = "未添加统计代码";
            }
        }else{
           //检查request中的真实上报
            if(data.indexOf('com&url') != -1){
                rt['pass_info'] = "页面统计已正常上报，上报URL为："+ u;
                __requestPing = true;
                rt['error_info'] = "";
                flag = true;
            }else{
                if(__htmlPing){
                    rt['pass_info'] = "";
                    rt['error_info'] = "已正确添加统计代码。但未检测到正确的上报请求，请检查函数实例化是否正常";
                }else{
                    rt['error_info'] = "未添加统代码";
                }
            }
        }

    };
    return rt;
}
//检测底部
let __hasCheckENV = false;
global.checkFoot = function (content,type) {
    if(checkIgnore().indexOf('foot') >= 0) return;
    const regex = /\/\/(game.gtimg.cn|ossweb-img.qq.com)\/images\/js(\/2018foot\/|\/)foot\.js/ig;
    const docUrl = 'http://tgideas.qq.com/webplat/info/news_version3/804/25810/25811/25812/25814/m16274/201803/700317.shtml';
    let rt = {};
    let flag = false;
    let matchR = null;
    let viewport = $('meta[name=viewport]');
    let copyrightReg = /TENCENT.*\RESERVED/ig;
    let r = !!copyrightReg.test(content);
    //无viewport及copyright不为空检查页脚
    if(type != 'request' && viewport.length == 0 && r) {__hasCheckENV = true}
    if(__hasCheckENV){
        //检查请求
        if (type == 'request') {
            for (let i = 0; i < content.length; i++) {
                let m = content[i].match(regex);
                if (!flag) {
                    matchR = content[i].match(regex);
                    if (matchR && matchR[0]) {
                        flag = true;
                    }
                }
            }
            if (flag) {
                i();
            }
        //检查页面
        } else {
            flag = true;
            matchR = content.match(regex);
            i();
        };

        function i() {
            rt['error_info'] = '';
            if (matchR && matchR[0] && flag) {
                if (matchR[0].indexOf('2018foot') <= 0) {
                    rt['pass_info'] = '建议使用按照最新规范插入页脚，规范地址：' + docUrl;
                } else {
                    rt['pass_info'] = '通用页脚已添加'
                }
            } else {
                rt['error_info'] = "未添加IEG页面通用页脚。规范地址：" + docUrl;
            }
            ;
        }
    }else{
        rt = {};
        if(viewport.length > 0){
            rt['pass_info'] = '当前页面可能是移动端页面,已跳过检查通用页脚'
        }else if(!r){
            rt['pass_info'] = '当前页面未包含底部基本元素“TENCENT. ALL RIGHTS RESERVED”,已跳过检查通用页脚'
        }


    }
    return rt;
};
//检测PTT上报请求是否配置错误，只在proCheck方法中生效
function checkPTTconfig(url,data) {
    let checkAct = /\/(cp|act)\/a/ig;
    let getActName = /\/(cp|act)\/a(\S*)\//;
    let flag = false;
    let ca = url.match(checkAct);
    let rt = {};
    let hasPTT = false;
    const docUrl = 'http://tgideas.qq.com/ptt/'
    rt['error_id'] = 2005;

    //网址符合
    if(ca && ca[0]){
        let name = url.match(getActName)[2];
        //轮询请求
        for(let i=0;i<data.length;i++){
            //请求中是否有PPT脚本
            if(data[i].indexOf('ping_tcss_tgideas_https') > 0 ){
                hasPTT = true;
            }
            //请求是否有PTT上报
            let index = data[i].indexOf('pttsitetype');
            if(index > 0 && !flag){
                if(data[i].slice(index).indexOf(name) <= 0){
                    rt['error_info'] = "页面统计参数配置错误，请检查PTT的setSite配置，文档："+docUrl;
                }else{
                    rt['pass_info'] = "页面统计参数配置信息正确"
                }
                flag = true;
            }
        }

        if(!flag){
            if(hasPTT){
                rt['error_info'] = "未发现PTT统计上报请求，请检查PTT的setSite配置，文档："+docUrl;
            }else{
                //页面不包含PTT统计或不符合专题网址规则，则忽略此项检查
                rt = false;
            }
        }

    }else{
        rt['pass_info'] = "当前页面不符合专题页面网址规则，已跳过检查PTT配置信息。"
    }
    return rt ;
};
//检测ISBN
global.checkISBN = function(url,page) {
    let rt = {};
    let host = moduleConfig.isbnAPI.host
    rt['error_id'] = 1002;
    rt['name'] = '版号';
    rt['pass_info'] = '';

    return new Promise((resolve,reject) => {
        if(checkIgnore().indexOf('isbn') >= 0) resolve(0);
        request(url,function (err,response,body) {
            if(err) reject(err);
            let getApi = JSON.parse(body)[0];
            if(typeof  getApi != 'undefined' ){
                let pointISBN = page.indexOf('ISBN');
                let ISBN = pointISBN <= 0 ? '' :fomatString(page.substring(pointISBN,pointISBN+22));
                let m = page.match(/新广出审(\S*)号/);
                let Approvalno = !m ? '': fomatString(page.match(/新广出审(\S*)号/)[0]);
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

    }).catch((e)=>{
        console.error(e);
    });
};
//本地图片ossweb-img目录检查
function  checkImage() {
    return new Promise((resolve,reject) => {
    let fileList = [];
    let normalSize = 0;
    let l = false;
    let optimizeSize = 0;
    let canOptimizeSize  = 0;
    //路径斜杠转化
    function fp(path){
        path=path.replace(/\\+/g,'/');
        return path.replace(/\/+/g,'/');
    }
    //图片文件遍历
    function walk(path){
        let dirList = fs.readdirSync(path);
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
                for(let i= 0;i<files.length;i++){
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
            let  option = {
                host : '10.194.0.196',
                port: 80,
                path: url
            }
            const req =  http.get(option,(res) => {
                let chunks = [];
            let size = 0;
            res.on('data', function (chunk) {
                chunks.push(chunk);
                size += chunk.length;
            });
            res.on('end', function () {
                let data = null;
                switch(chunks.length) {
                    case 0: data = new Buffer(0);
                        break;
                    case 1: data = chunks[0];
                        break;
                    default:
                        data = new Buffer(size);
                        for (let i = 0, pos = 0, l = chunks.length; i < l; i++) {
                            let chunk = chunks[i];
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
    let tOP = 0;
   //随机检查线上3张图片，如果可优化体积大于0，则返回0
    let picArray = shuffle(pic);
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
    let temp = {};
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

function readPage(arg) {
    return new Promise((resolve,reject) => {
            if(typeof arg.file.name != 'undefined' && typeof arg.file.name !== ''){
                let c = typeof  arg.file.charset != 'undefined' ? arg.file.charset : 'utf-8'


                fs.readFile(arg.file.name,function (err, buffer) {
                    let p =  iconv.decode(buffer,c);
                    global.$ = cheerio.load(p,{useHtmlParser2:false});
                    resolve(p);
                });
                // let p =  iconv.decode(fs.readFileSync(arg.file.name),c);
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
    if($('head meta').length === 0 || $('body').text() == ''){
        checkResult['pageStandard'] ='false';
    }else{
        checkResult['pageStandard'] ='true';
    }
}

//check方法
function check(arg,callback){
   localPicPath = path.resolve(arg.basePath+'ossweb-img/');
    //检查结果
    let checkResult = {
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

            for(let i=0;i< initCheck.length;i++){

                const data = initCheck[i];
               //配置为函数
                if(typeof data.function !== undefined && typeof data.function !== '' &&  data.run){
                    let temp = {};
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
                                let num = 3 - requestInfo.log.images;
                                for(let i = 0;i<num;i++){
                                    requestInfo.log.images.push('http://ossweb-img.qq.com/images/game/brand/game-logo.png')
                                }
                            }
                            //从真实请求中检测点击流
                            for(let i =0;i<checkResult.list.length;i++){
                                let __li = checkResult.list[i];
                                //从请求中检测点击流
                                if(__li.error_id == 1001){
                                    __li = extend(__li, checkPing(requestInfo.log.ping,'request'))
                                }
                                //从请求中检测页脚
                                if(__li.error_id == 1003){
                                    __li = extend(__li, checkFoot(requestInfo.log.ping,'request'))
                                }
                            }

                            let apiUrl = moduleConfig.isbnAPI.url + requestInfo.log.pages[0].isbnlink;
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
                                //      let apiUrl = 'http://x.x.x.x/isbn_api.php?url='+requestInfo.log.pages[0].id;
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
          checkResult['ignore'] = 'none';
          if(checkIgnore()[0] == 'all'){
                //回调
                checkResult.list = {};
          }else{
               let d =checkIgnore().toString() ;
                checkResult['ignore'] = d == '' ? 'none' : d;
          }
          callback({'checkResult':checkResult});
       }).catch(e=>{
           console.log(e.message)
       })
}
//procheck
function proCheck(arg,callback) {
    //检查结果
    let checkResult = {
        'list':[
            // {
            // "error_id": 1002,
            // "error_info": "无法检测到页面编码",
            // "pass_info": "页面编码正常"
            // }
        ]
    };

    const __d = arg.json;
    const __html  = __d.html;
    const pageUrl = __d.url;

    global.$ = cheerio.load(__html,{useHtmlParser2:false});
    const __requests  = __d.requests;

    //用户自定义
    if(typeof arg.custom == 'object' ){
        if(arg.custom.file .length>0){
            userCustom(__html,'file',arg,checkResult);
        }
        if(arg.custom.request.length>0){
            userCustom(__d.requests,'request',arg,checkResult,'high');
        }
    }
    //标准页面检测
    standardPage(__html,checkResult);

    for(let i=0;i< initCheck.length;i++){

        const data = initCheck[i];
        //配置为函数
        if(typeof data.function !== undefined && typeof data.function !== '' &&  data.run){
            let temp = {};
            temp = global[data.rule.function](__html);
            if(temp){
                temp['error_id'] = data.error_id;
                temp['name'] = data.name;
                checkResult.list.push(temp);
            }

        }
    };
    checkResult['url'] = pageUrl;
    //从HTML文件检测点击流
    checkPing(__html,'html')

    //构建请求数组
    let tr = [];
    for(let r in __d.requests){
        tr.push(r);
    };

    for(let i =0;i<checkResult.list.length;i++){
        let __li = checkResult.list[i];
        //从请求中检测点击流
        if(__li.error_id == 1001){
            __li = extend(__li, checkPing(tr,'request'))
        }
        //从请求中检测页脚
        if(__li.error_id == 1003){
            __li = extend(__li, checkFoot(tr,'request'))
        }
    }
    //检查PTT配置


    var __cpc = checkPTTconfig(pageUrl,tr);
    if(__cpc){
        checkResult.list.push(__cpc)
    }
    //处理例外
    let d =checkIgnore().toString() ;
    checkResult['ignore'] = d == '' ? 'none' : d;

    if(!callback){
        return new Promise((resolve,reject) => {
            //检查版号
            if(arg.config){
            moduleConfig = arg.config;
            let apiUrl = arg.config.isbnAPI.url + pageUrl;
            checkISBN(apiUrl,__html).then((l)=>{
                if(l){
                    checkResult.list.push(l);
                }
                resolve({'checkResult':checkResult})
                });
            }else{
                resolve({'checkResult':checkResult})
            };
        })
    }else{
        callback({'checkResult':checkResult})
    }

}
exports.check=check;
exports.proCheck=proCheck;