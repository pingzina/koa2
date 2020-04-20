const express = require('express');
const app = express();
const fs = require('fs');
const https = require('https');

function getUserInfo(id) {
    // +id?`/id=${id}`:''
    return new Promise((reslove, reject) => {
        https.get('https://jsonplaceholder.typicode.com/todos' + `?id=${id}`, (res) => {
            // console.log(res.statusCode);
            // console.log(res.headers);
            res.on('data', d => {
                reslove(d);
                // process.stdout.write(d.toString())
            })
        }).on('error', (e) => {
            reject(e)
        })
    })
}



// const path=require('path');
// express.static 提供静态文件，就是html, css, js 文件
app.use(express.static('public'));
// app.use('/static',express.static('public'));
// app.use(express.static('image'));

app.get('/', (req, res) => {
    readFile('./public/two.txt').then(result => {
        res.json({
            json: result.toString()
        })
    });
})

app.get('/user', (req, res) => {
    getUserInfo(req.query.id).then((result) => {
            res.json({
                // string: result.toString(),
                result: JSON.parse(result),
            });
        })
        .catch(error => {
            console.log(error);
            res.json({
                error: error
            });
        })
})

app.get('/test2', (req, res) => {
   res.json({
       name:'test2'
   })
})

app.get('/test1', (req, res) => {
    res.json({
        name:'test1'
    })
    // res.status(404).send('sorry,not find')
})

//es6语法读取文档目录---封装方法
const readFile = (fileName) => {
    return new Promise((reslove, reject) => {
        fs.readFile(fileName, (error, data) => {
            if (error) return reject(error)
            reslove(data)
        })
    })
}

//es6的generator函数---过渡期->异步编程思维
const gen = function* () {
    yield 1111;
    yield 2222;
    const f1 = yield readFile('./public/one.txt');
    const f2 = yield readFile('./public/two.txt');
    return {
        f1,
        f2
    }
    // console.log(f1.toString());
    // console.log(f2.toString());
}

//aswnc--->终级异步编程解决办法
const asyncReaderFile = async () => {
    const f1 = await readFile("./public/one.txt");
    const f2 = await readFile("./public/two.txt");
    // console.log(f1.toString());
    // console.log(f2.toString());
    return {
        f1: f1.toString(),
        f2: f2.toString()
    }
    // return new Error('this is error')
}

// //变量接受generator函数的返回数据
// console.log(gen().next());
// console.log(gen().next());
// console.log(gen().next());


asyncReaderFile().then(res => {
    console.log(res);
}).catch(error => {
    console.log(error);
})
app.listen(3000, () => {
    console.log('server start');
})