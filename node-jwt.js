const Koa = require('koa'); //引入koa
const app = new Koa(); //实例化
const router = require("koa-router"); //引入koa的路由
const static = require("koa-static"); //静态资源模板
const path = require('path'); //文件路劲路径
const bodyParser = require('koa-bodyparser'); //post请求解析
const fs = require('fs'); //文件系统
const jwt = require('jsonwebtoken'); //令牌
const router1=new router()
router1.prefix('/api')

//引入连接数据库的方法
const mysql_li = require('./tenc-mysql');


//生成token的方法
function generateToken(data) {
    let created = Math.floor(Date.now() / 1000); // 时间/s
    let cert = fs.readFileSync(path.join(__dirname, './config/rsa_private_key.pem')); //私钥
    let token = jwt.sign({
        data,
        // exp: created + 3600 * 24 //过期时间,
        exp: created + 60*5 //过期时间
    }, cert, {
        algorithm: 'RS256'
    }); //验证方法
    console.log(token)
    return token;
}


// 验证当前路由是否存在
function veryifyRouter(router,path){
    return router.stack.find(item=>item.path===path)
}


//检验token
function verifyToken(token) {
    console.log(token)
    console.log(111111)
    let cert = fs.readFileSync(path.join(__dirname, './config/rsa_public_key.pem')); //公钥
    let res = jwt.verify(token);
    try {
        let result = jwt.verify(token, cert, {
            algorithms: ['RS256']
        }) || {};
        let {
            exp = 0
        } = result, current = Math.floor(Date.now() / 1000);
        if (current <= exp) {
            res = result.data || {};
        }
    } catch (e) {
        new Error(e)
    }
    return res;
}


//登录接口
router1.post('/login', async (ctx, next) => {
    console.log(ctx.request.body)
    const  {
        username,
        password,
    } = ctx.request.body;
    //执行查询语句
    const res=await mysql_li.query(`SELECT * FROM USER_INFO WHERE username='${username}'`)
    console.log(res)
    if (res.data.length&&res.code == 1) {
        if (username == res.data[0].username && password == res.data[0].password) {
            const token = generateToken({
                uid: res.data[0].id
            });
             ctx.response.body = {
                code: 0,
                errorMsg: '登录成功！',
                token: token
            }
        } else {
             ctx.response.body = {
                code: -1,
                errorMsg: '账号密码错误,请重新输入',
                token: ''
            }
        }
    }else{
        ctx.response.body = {
            code: -1,
            errorMsg: '还没注册哦，请先注册！',
        }
    }
});


//静态资源配置(托管)----可配置多个
app.use(static(path.join(__dirname, '/public')));
app.use(static(path.join(__dirname, '/views')));

//配置post bodyparser的中间件
app.use(bodyParser());

//开始书写接口信息
const main = ctx => {
    ctx.response.type = 'text/html';
    ctx.body = fs.createReadStream(path.join(__dirname, '/views/index.html'));
}

router1.get('/req', async (ctx) => {
    ctx.body = {
        request: ctx.request,
        query: ctx.request.query,
        queryString: ctx.request.querystring,
        name: ctx.request.name,
        text: ctx.request.text,
        response: ctx.response
    }
})

//获取所有的用户信息并且查询
router1.get('/show-tables', async (ctx) => {
    await mysql_li.query(`SELECT * FROM USER_INFO`).then(res => {
        if (res.code == 1 && res.data.length > 0) {
            return ctx.response.body = {
                code: 1,
                errorMsg: '操作成功！',
                result: res.data
            }
        } else {
            return ctx.response.body = {
                code: -1,
                errorMsg: '操作失败，请稍后重试！',
                result: []
            }
        }
    })
})

//写三个测试请求
router1.get('/one', async (ctx, next) => {
    console.log(ctx)
    ctx.response.body = {
        name: 'one'
    }
})
router1.get('/two', async (ctx, next) => {
    ctx.response.body = {
        name: 'two'
    }
})
router1.get('/there', async (ctx, next) => {
    ctx.response.body = {
        name: 'there'
    }
})


//其他接口的检测（拦截除了登录以外的接口）
app.use(async (ctx, next) => {
    const {url,header,method}=ctx.request
    console.log(url)
    if(!veryifyRouter(router1,url)){
        return ctx.body = {
            code: -1,
            errorMsg: '请求资源路径不存在！'
        }
    }
    if (url==='/api/login') { //需要校验登录态
        //向下路由
        await next();
    } else {
        const {authorization}=header
        //如果token存在的话
        if (authorization) {
            let result = verifyToken(authorization);
            // 检验token信息是否存在或者过期
            if (result && result.uid) {
                console.log(result)
                await next();
            } else {
                return ctx.body = {
                    code: -2,
                    errorMsg: 'token已经过期！'
                };
            }
        } else {
            return ctx.body = {
                code: -1,
                errorMsg: '请先登录！'
            }
        }
    }
});
//设置文件主入口
router1.get('/', main);

//启动路由
app.use(router1.routes(),router1.allowedMethods());
// console.log(router1.stack)






//启动并且监听端口
app.listen(5000,(err)=>{
    if(err){
        console.log(err)
        return
    }
    console.log('服务器已经打开：'+'http://localhost:5000/login.html')
});