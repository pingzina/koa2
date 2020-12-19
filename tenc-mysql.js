const mysql = require('mysql');

// 连接池配置
const dbPoolConfig = {
    // host: 'cdb-fitp1d0o.bj.tencentcdb.com',
    // user: 'root',
    // password: 'zmx123@123',
    // database: 'student',
    // port: 10041
    host: 'localhost',
    user: 'root',
    password: 'xiaoming',
    database: 'student',
    port: 3306
    // acquireTimeout: 15000, // 连接超时时间
    // connectionLimit: 100, // 最大连接数
    // waitForConnections: true, // 超过最大连接时排队
    // queueLimit: 0, // 排队最大数量(0 代表不做限制)
};
// 创建连接池
const pool = mysql.createPool(dbPoolConfig);

const mysql_li = {
    // 执行
    query: (sql, params) => {
        return new Promise((resolve, reject) => {
            pool.getConnection((error, conn) => {
                if (error)  reject({
                    code: -1,
                    errorMsg: error
                });
                conn.query(sql, params, (err, rows) => {
                    conn.release();
                    if (err)  reject({
                        code: -1,
                        errorMsg: err
                    });
                     resolve({
                        code: 1,
                        errorMsg: '查询成功',
                        data: rows
                    });
                });
            });
        });
    }
};


module.exports = mysql_li;