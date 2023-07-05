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
// 把media移到根目錄
app.use(express.static('media'));
//這是首頁(可以改)
app.get('/',function(req,res){
    res.render('home.ejs');
})
// 給路由:news 網址列：localhost:5000/news
app.get('/customize',function(req,res){
    res.render('customize.ejs')
})
app.get('/product',function(req,res){
    conn.query('select * from product',
    function(err,bee){
        // console.log(bee);
        //回傳網頁給使用者
        res.render('product.ejs',{
            cat:bee
        })
    })
})
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