const https=require('https');

function getUserInfo(id) {
    // +id?`/id=${id}`:''
    return new Promise((reslove, reject) => {
        https.get('https://jsonplaceholder.typicode.com/todos' + `?id=${id}`, (res) => {
            // console.log(res.statusCode);
            // console.log(res.headers);
            res.on('data', d => {
                reslove({data:d,header:res.headers});
                // process.stdout.write(d.toString())
            })
        }).on('error', (e) => {
            reject({data:d,header:res.headers})
        })
    })
}


// module.exports={
//     getUserInfo:getUserInfo
// }

module.exports=getUserInfo