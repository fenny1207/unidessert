var express = require('express');
var app = express();
var ejs=require('ejs');
var mysql= require('mysql');
var conn = mysql.createConnection({
    host:'localhost',
    port:'3306',
    user:'root',
    password:'',
    database:'unidessert'
});
conn.connect(function(err){
    if(err){
        console.log('資料庫無法啟動',err,err.errno,err.sqlMessage)
    }else{
        console.log("資料庫正常啟動");
    } 
});

var expressSession = require('express-session');
var s = expressSession({
    secret: 'unidessert',
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 50 * 1000
    }
});
app.use(s);

// 把media移到根目錄
app.use(express.static('media'));
//這是首頁(可以改)
app.get('/',function(req,res){
    res.render('index.ejs');
})
app.get('/member',function(req,res){
    res.render('member.ejs');
})
// 給customize 路由
app.get('/customize',function(req,res){
    conn.query( `SELECT * FROM customize `,
    function(err,bee){
        console.log(bee);
        //回傳網頁給使用者
        res.render('customize.ejs',{
            cat:bee
        })
    })
});
app.get('/product',function(req,res){
    var p_info
    conn.query('SELECT pd_name, p_price, p_pic FROM product where p_type="set"', (err, results) => {
        if(err) return console.log(err.message)
        p_info = results;
        res.render('product.ejs', {p_info: p_info});
    })
})
app.get('/product/single',function(req,res){
    var p_single_info
    conn.query('SELECT pd_name, p_price, p_pic FROM product where p_type="single"', (err, results) => {
        if(err) return console.log(err.message)
        p_single_info = results;
        // console.log(p_single_info);
        res.render('product_single.ejs', {p_single_info: p_single_info});
    })
})
app.get('/product/productInfo',function(req,res){
    var product_info
    conn.query('SELECT pd_name, p_price, p_pic, p_pic2, p_pic3, p_pic4 FROM product where p_type="set" && (pid=1 || pid=2)', (err, results) => {
        if(err) return console.log(err.message)
        product_info = results;
        // console.log(product_info)
        res.render('productInfo.ejs', {product_info: product_info});
    })
})
app.get('/login', function (req, res) {
    res.render('login.ejs');
})
app.post('/login', express.urlencoded(), function (req, res) {
    //SELECT *FROM user m WHERE m.uemail = 'david.jones@hotmail.com' AND m.upwd = 'P@ssw0rd';
    var sql = "SELECT * FROM user u where u.uemail = ? and u.upwd = ? ";
    var userInput = [req.body.uemail, req.body.upwd];
    conn.query(sql, userInput, function (err, data) {
        console.log(data[0]);

        if (err == null && data.length == 1) {
            // req.session.AABBCC = data[0];
            res.redirect('/member');
        } else {
            res.send('登入失敗')
        }
    })
})

app.get('/member',function(req,res){
    res.render('member.ejs');
  
})
app.post('/member',function(req,res){
    if (req.session.AABBCC) {
        // AM 10:34 取得資料庫資料=>ejs網頁
        var sql = 'SELECT * FROM user ';
        conn.query(sql, function (err, data) {
                res.render('member.ejs', {
                    user:data,
                    uname: req.session.AABBCC.uname,
                    uemail:req.session.AABBCC.uemail,
                    // AM 11:24 把全部資料交給ejs處理 (二選一)
                    ubirth: req.session.AABBCC.ubirth
                });
        })
    } else {
        // AM 10:51 如果沒登入就導向登入*路由*
        res.redirect('/login');
    }

})

// app.post('/member',express.urlencoded(),function(req,res){

// })


app.get('/about',function(req,res){
    res.render('about.ejs');
})
app.get('/card',function(req,res){
    res.render('card.ejs');
})

// app.get('/',function(req,res){
//     res.send('收到了 表示server有啟動 這是gogopokemon');
// })
app.listen(5678, function () {
    console.log('胖丁說: 5678 啟動中gogopokemon ');
    });