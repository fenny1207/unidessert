var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');
var axios = require('axios')
var ejs=require('ejs');
var mysql= require('mysql');
var bcrypt = require('bcrypt');
var saltRounds = 10; // 設定 salt 的複雜度，數字越大越安全，但計算時間也越長
// var member = require('./routes/member.js');
// var users = require('./routes/user.js');


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
})
app.use(s);
app.set('view engine', 'ejs');

// 把media移到根目錄
app.use(express.static('media'));
//這是首頁(可以改)
app.use(express.static('media', { 'extensions': ['html', 'css'] }));
// 解析表單資料的中介軟體
app.use(bodyParser.urlencoded({ extended: true }));

// app.use('/',member);
// app.use('/user',users);
app.get('/',function(req,res){
    res.render('index.ejs');
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
app.post('/customize',function(req,res){
    // res.send('success');
    var insert = "INSERT INTO c_detail2 ( size , boxcolor) VALUES (?, ?);";
    var userInput = [req.body.size, req.body.showboxcolor];
    // console.log(insert);
    // console.log(userInput);
    conn.query(insert, userInput, function (err, data) {
        if (err) {
            res.send('無法新增')
        } 
    })
})
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
}).post('/product/single',function(req,res){
    // console.log(parseInt(req.body.uid) + 2)
    const pid = parseInt(req.body.uid) + 2
    const quantity = req.body.quantity
    
    conn.query(`select * from product where p_type="single" && pid=${pid}`, (err, results) => {
        if(err) return console.log(err.message)
        let pid = results[0].pid
        let pd_name = results[0].pd_name
        let p_price = results[0].p_price
        let total_price = p_price*quantity
        console.log(total_price)
        let p_type = results[0].p_type
        conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, status) 
                    VALUES (null, 1, 100, "", "", "", "", "", "", "", "", "購物車")`, (err, results) => {
            if(err) return console.log(err.message)
            console.log(results.insertId)
            const insert_oid = results.insertId
        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price)
                    VALUES (NULL, ?, ?, ?, ?, ?, ?)`, [insert_oid, p_type, pid, pd_name, quantity, total_price], (err, results) => {
            if(err) return console.log(err.message)
            console.log(results.insertId)
        
        })
        // 等session 寫好再改成 判斷是不是同一個使用者，輸入成一筆訂單多個產品
        // 點擊按鈕 -> 藉由點擊的按鈕位置，去資料庫抓到某個產品名字價格 -> 再依資料庫抓到的名字輸入進資料庫(orderlist 跟 orderdetails)
        // --> 先輸入進 orderlist 後取得 oid ，再依 oid 輸入進 orderdetails -> 但是是點擊一次跑一次搜尋及輸入orderlist、orderdetails指令
        // --> 所以會點擊一次就產生一筆訂單，無法輸入成一筆訂單多個產品
        })
    })
})

app.get('/product/productInfo', function (req, res) {
    // var product_info
    conn.query('SELECT pd_name, p_price, p_pic, p_pic2, p_pic3, p_pic4 FROM product where p_type="set" && (pid=1 || pid=2)', (err, results) => {
        if (err) return console.log(err.message)
        product_info = results;
        res.render('productInfo.ejs', { product_info: product_info });
    })
}).post('/product/productInfo',function(req,res){
    const productNumber = req.body.order_amout;
    // console.log((productNumber)*390)
    order_total = productNumber*390
    conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, status) VALUES (NULL, 1, 100, ?, "", "", "", "", "", "", "", "購物車")`, [order_total], (err, results) => {
        if(err) return console.log(err.message)
        // console.log(results.insertId)
    })
})

app.get('/user', (req, res) => {
    res.render('user.ejs');
  })
  
app.post('/register', (req, res) => {
    const { name, email, mobile, password } = req.body;
  
    // 檢查使用者電子信箱是否已存在於資料庫
    const checkQuery = 'SELECT * FROM user WHERE uemail = ? ';
    conn.query(checkQuery, [email], (err, results) => {
      if (err) throw err;
  
      if (results.length > 0) {
        // 使用者電子信箱已存在
        res.render('user', { error: true, showAlert: false,title:"註冊失敗", message: 'Email 已經被註冊過了' });
      } else {
        // 使用者電子信箱可用，將資料插入資料庫
        const insertQuery = 'INSERT INTO user (uemail, upwd, uname, umobile) VALUES (?, ?, ?, ?)';
        conn.query(insertQuery, [email, password, name, mobile], (err) => {
          if (err) throw err;
  
          // 註冊成功，重新導向到登入頁面
          res.render('user', { error: false, showAlert: true,title:"註冊成功", message: '請重新登入' });
        });
      }
    });
  
});
  
  
app.post('/login', (req, res) => {
    const { email, password } = req.body;
  
    const selectUserQuery = 'SELECT * FROM user WHERE uemail = ? AND upwd = ?';
  
    conn.query(selectUserQuery, [email, password], (err, results) => {
      if (err) {
        res.render('user', { error: true, showAlert: false,title:"登入失敗", message: 'Email 尚未註冊過了' });
        
      } else if (results.length === 0) {
        res.render('user', { error: true, showAlert: false,title:"登入失敗", message: '密碼輸入錯誤' });
        
      } else {
        res.render('user', { error: false, showAlert: true,title:"登入成功", message: '歡迎回來' });
      }
    });
});
  
// member.ejs
app.get("/order", (req, res) => {
    // const { oid, recipient, order_total } = req.body;
    // var sql = "SELECT * FROM orderlist WHERE oid = ? and recipient = ? and order_total =? ";
    var sql = "select * from orderlist ";
    // [oid,recipient,order_total]
    conn.query(sql, (err, data) => {
        // console.log(data)
        if (err) return console.log(err.message)
        member_info = data;
        console.log(member_info[0].oid);
        console.log(member_info[0]);
        res.render('member.ejs', {member_info: member_info})
    // if (!err) {
    //     // console.log(data)
    //     res.render('member.ejs', {
    //         dog:data,
    //         // oid:req.body.oid,
    //         // recipient:req.body.recipient,
    //         // order_total:req.body.order_total
    //     })
    //     // res.send(JSON.stringify(data))
    // } else {
    //     res.send('查不到訂單') 
    // }  
  });
});


app.get('/member',function(req,res){
    res.render('member2.ejs');
})
app.post('/memberUser',(req,res) => {
    const { name, email, mobile,birth} = req.body;
        var sql = 'UPDATE  user SET uname = ?, uemail =?,ubirth =?,umobile=? WHERE uid = ?';
        conn.query(sql, [ name, email, mobile,birth] ,(err) => {
                res.render('member', {
                    user:data,
                    uname: req.session.AABBCC.uname,
                    uemail:req.session.AABBCC.uemail,
                    // AM 11:24 把全部資料交給ejs處理 (二選一)
                    ubirth: req.session.AABBCC.ubirth
                });
        })
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