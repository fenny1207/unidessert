var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');
var axios = require('axios')
var ejs=require('ejs');
var mysql= require('mysql');
var conn = mysql.createConnection({
    host:'localhost',
    port:'3306',
    user:'root',
    password:'',
    database:'unidessert',
    timezone:'08:00'
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
})
app.use(s);
app.set('view engine', 'ejs');
// 把media移到根目錄
app.use(express.static('media'));
app.get('/',function(req,res){
    res.render('backindex.ejs');
})
// app.get('/backOrder',function(req,res){
//     res.render('backOrder.ejs');
// })
app.get('/backOrder',function(req,res){
    conn.query( `SELECT * FROM orderlist `,
    function(err,bee){
        // console.log(bee);
        //回傳網頁給使用者
        res.render('backOrder.ejs',{
            cat:bee
        })
    })
});
//navbar之後用ejs插入就好
app.get('/backnavbar',function(req,res){
    res.render('backnavbar.ejs');
})
app.get('/backProduct',function(req,res){
    res.render('backProduct.ejs');
})
app.get('/backProductAdd',function(req,res){
    res.render('backProductAdd.ejs');
})
app.get('/backCustomize',function(req,res){
    res.render('backCustomize.ejs');
})
app.get('/backCustomizeAdd',function(req,res){
    res.render('backCustomizeAdd.ejs');
})

app.listen(5432, function () {
    console.log('5432這是後台！');
    });