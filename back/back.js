var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');
var ejs = require('ejs');
var mysql = require('mysql');
app.set('view engine', 'ejs');
var conn = mysql.createConnection({
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'unidessert',
    timezone: '08:00'
});
conn.connect(function (err) {
    if (err) {
        console.log('資料庫無法啟動', err, err.errno, err.sqlMessage)
    } else {
        console.log("資料庫正常啟動");
    }
});
// 登入的 session
var Session = require('express-session');
var Session = Session({
    secret: 'unidessertback',
    resave: false,
    saveUninitialized: false,
    cookie: {
        // path: '/',
        // httpOnly: true,
        // secure: false,
        maxAge: 50 * 1000
    }
})
app.use(Session);
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
// 把media移到根目錄
app.use(express.static('media'));
app.get('/', function (req, res) {

    if (!req.session.islogin) {
        console.log('前端get沒session');
        // res.render('backindex.ejs');
        return res.render('backindex.ejs');
        // res.redirect('backindex.ejs');
    }
    console.log('前端get有session')
    res.render('backProduct.ejs');
    // res.redirect('backProduct.ejs');
    // res.render('backProduct.ejs');
})
app.post('/', (req, res) => {
    if (req.body.username !== 'admin' || req.body.password !== '6688') {
        console.log('後端post失敗')
        return res.send({
            status: 1,
            msg: '登入失敗'
        })
    }
    req.session.user = req.body;
    req.session.islogin = true;
    console.log('後端post成功')
    res.send({
        status: 0,
        msg: '登入成功',
    })
    // console.log('登入成功')
})

// app.get('/backOrder',function(req,res){
//     res.render('backOrder.ejs');
// })
app.get('/backOrder', function (req, res) {
    conn.query(`SELECT * FROM orderlist `,
        function (err, bee) {
            // console.log(bee);
            //回傳網頁給使用者
            res.render('backOrder.ejs', {
                cat: bee
            })
        })
});
app.get('/backMember', function (req, res) {
    conn.query(`SELECT * FROM user `,
    function (err, bee) {
        // console.log(bee);
        //回傳網頁給使用者
        res.render('backMember.ejs', {
            cat: bee
        })
    })
});
app.get('/backOrderEdit', function (req, res) {
    conn.query(`SELECT * FROM orderlist `,
        function (err, bee) {
            // console.log(bee);
            //回傳網頁給使用者
            res.render('backOrderEdit.ejs', {
                cat: bee
            })
        })
});
//navbar之後用ejs插入就好
app.get('/backnavbar', function (req, res) {
    res.render('backnavbar.ejs');
})
app.get('/backProduct', function (req, res) {
    res.render('backProduct.ejs');
})
app.get('/backProductAdd', function (req, res) {
    res.render('backProductAdd.ejs');
})
app.get('/backCustomize', function (req, res) {
    res.render('backCustomize.ejs');
})
app.get('/backCustomizeAdd', function (req, res) {
    res.render('backCustomizeAdd.ejs');
})

app.listen(5432, function () {
    console.log('5432這是後台！');
});