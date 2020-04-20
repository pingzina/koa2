const Koa = require('koa'); //引入koa
const app = new Koa(); //实例化
const router = require("koa-router")(); //引入koa的路由
const static = require("koa-static"); //静态资源模板
const path = require('path'); //文件路劲路径
const bodyParser = require('koa-bodyparser'); //post请求解析
const fs = require('fs'); //文件系统
const jwt = require('jsonwebtoken'); //令牌

//引入连接数据库的方法
const mysql_li = require('./tenc-mysql');


//生成token的方法
function generateToken(data) {
    let created = Math.floor(Date.now() / 1000);
    let cert = fs.readFileSync(path.join(__dirname, './config/rsa_private_key.pem')); //私钥
    let token = jwt.sign({
        data,
        // exp: created + 3600 * 24 //过期时间,
        exp: created + 60 * 3 //过期时间
    }, cert, {
        algorithm: 'RS256'
    }); //验证方法
    return token;
}

//登录接口
router.post('/login', async (ctx, next) => {
    let data = ctx.request.body;
    let {
        username,
        password,
    } = data;
    // console.log(data);
    //执行查询语句
    await mysql_li.query(`SELECT * FROM USER_INFO WHERE username='${username}'`).then(res => {
        console.log(res);
        if (res.code == 1 && res.data.length > 0) {
            // console.log(res.data[0].username)
            if (username == res.data[0].username && password == res.data[0].password) {
                let token = generateToken({
                    uid: res.data[0].uid
                });
                return ctx.response.body = {
                    code: 1,
                    errorMsg: '登录成功！',
                    token: token
                }
            } else {
                return ctx.response.body = {
                    code: -1,
                    errorMsg: '账号密码错误,请重新输入',
                    token: ''
                }
            }
        }
    })
});

//检验token
function verifyToken(token) {
    let cert = fs.readFileSync(path.join(__dirname, './config/rsa_public_key.pem')); //公钥
    let res = null;
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

router.get('/req', async (ctx) => {
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
router.get('/show-tables', async (ctx) => {
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
router.get('/one', async (ctx, next) => {
    // console.log(ctx.request.headers['cookie']);
    ctx.response.body = {
        name: 'one'
    }
})
router.get('/two', async (ctx, next) => {
    // ctx.response.status=200;
    ctx.response.body = {
        name: 'two'
    }
})
router.get('/there', async (ctx, next) => {
    ctx.response.body = {
        name: 'there'
    }
})


//其他接口的检测（拦截除了登录以外的接口）
app.use(async (ctx, next) => {
    let {
        url = ''
    } = ctx;
    if (url.indexOf('/login') > -1) { //需要校验登录态
        //向下路由
        await next();
    } else {
        let header = ctx.request.header;
        let {
            Authorization
        } = header;
        //如果token存在的话
        if (Authorization) {
            let result = verifyToken(Authorization.split('=')[1]);
            // 检验token信息是否存在或者过期
            if (result && result.uid) {
                // ctx.state = {
                //     uid
                // };
                await next();
            } else {
                return ctx.body = {
                    code: -1,
                    errorMsg: 'token已经过期！'
                };
            }
        } else {
            return ctx.body = {
                code: -1,
                errorMsg: 'token不存在！暂未登录，你没有权限，请先登录！'
            }
        }
    }
});
//设置文件主入口
router.get('/', main);
//启动路由
app.use(router.routes());

app.use(router.allowedMethods());

//启动并且监听端口
app.listen(5000);