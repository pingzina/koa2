const jwt = require("jsonwebtoken");

//声明一个函数来处理token
function generateToken(data) {
    let token=jwt.sign({
        'iss': 'zhangsan', // 签发人
        'exp': Math.floor(Date.now() / 1000) + 60*60 * 24, // 过期时间(这里的有效期时间为1天)
        'sub': '主题内容', // 主题
        'aud': '受众内容', // 受众
        'nbf': $time, // 生效时间
        'iat': $time, // 签发时间
        'jti': 123, // 编号
        'data':data// 额外自定义的数据
    }, 'shhhhh');
    return token;
}




module.exports =generateToken;