const Koa = require('koa'); //引入koa
const app = new Koa(); //实例化
const router = require("koa-router")(); //引入koa的路由
const views = require("koa-views"); //引入视图模板
const static = require("koa-static"); //静态资源模板
const render = require('koa-art-template'); //模板渲染
const path = require('path'); //文件路劲路径
const bodyParser = require('koa-bodyparser'); //post请求解析
const fs = require('fs'); //文件系统
const koaJwt = require('koa-jwt');

//引入验证信息


//引入查询placehodle中user的方法
const getUserInfo = require("./static/base/getUserInfo");

//引入jsonwebtoken
const jsonToken = require("./jsonwebtoken");

//配置视图的位置
render(app, {
    root: path.join(__dirname, 'views'), //规定视图的位置
    extname: '.html', //后缀名
    debug: process.env.NODE_ENV !== 'production' //是否开启调试模式
});

//调用视图中间件
app.use(views('views', {
    extension: 'html'
}))

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

router.get('/user', async (ctx) => {
    let id = ctx.query.id || '';
    let result = await getUserInfo(id);
    // console.log(JSON.parse(result.data));
    ctx.body = {
        data: JSON.parse(result.data),
        header: result.header
    }
})

router.get('/html', async (ctx) => {
    let app = {
        name: '张三',
        h: '<h2>我是一个标签h2</h2>',
        num: 20,
        data: ['1111', '3333', '2222']
    }
    await ctx.render('new', {
        list: app
    })
})

//添加post请求
router.post('/saveUserInfo', async (ctx, next) => {
    // console.log(ctx.request.body)
    ctx.response.body = {
        data: {
            ...ctx.request.body,
            code: 1
        }
    }
})

//测试表单提交时候的请求
router.post('/tableUserInfo', async (ctx, next) => {
    // console.log(ctx.request.body)
    ctx.response.body = {
        data: {
            ...ctx.request.body,
            code: 1
        }
    }
})

//写三个测试请求
router.get('/one', async (ctx, next) => {
    console.log(ctx.request.headers['cookie']);
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
router.get('/three', async (ctx, next) => {
    ctx.response.body = {
        name: 'three'
    }
})

//用户登录接口
router.post('/login', async (ctx) => {
    console.log(ctx.request.body);
    let {
        username,
        password
    } = ctx.request.body;
    if (username == 'pingzia' && password == 123456) {
        ctx.response.body = {
            code: 1,
            user: ctx.request.body,
            token: jsonToken({
                username,
                password
            })
        }
    } else {
        ctx.response.body = {
            code: -1,
            token: ''
        }
    }
})


//设置文件主入口
router.get('/', main)
//启动路由
app.use(router.routes());
app.use(router.allowedMethods());

//启动并且监听端口
app.listen(5000);