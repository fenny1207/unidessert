var express = require('express');
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.json());
var path = require('path');
var axios = require('axios')
var ejs = require('ejs');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var saltRounds = 10; // 設定 salt 的複雜度，數字越大越安全，但計算時間也越長
var member = require('./router/member');
// var users = require('./routes/user.js');


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

var expressSession = require('express-session');
var s = expressSession({
    secret: 'unidessert',
    resave: true,
    saveUninitialized: true,
    cookie: {
        path: '/',
        httpOnly: true,
        secure: false,
        maxAge: 500 * 1000
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

app.get('/', function (req, res) {
    res.render('index.ejs');
})
//about路由
app.get('/aboutus', function (req, res) {
    res.render('aboutUs.ejs');
})
//news路由
app.get('/news', function (req, res) {
    res.render('news.ejs');
})
//important路由
app.get('/important', function (req, res) {
    res.render('important.ejs');
})
//QA路由
app.get('/qaindex', function (req, res) {
    res.render('qaindex.ejs');
})
app.get('/orderqa', function (req, res) {
    res.render('orderqa.ejs');
})
app.get('/payqa', function (req, res) {
    res.render('payqa.ejs');
})
app.get('/shippingqa', function (req, res) {
    res.render('shippingqa.ejs');
})
// 給customize 路由
app.get('/customize', function (req, res) {
    conn.query(`SELECT * FROM customize `,
        function (err, bee) {
            // console.log(bee);
            //回傳網頁給使用者
            res.render('customize.ejs', {
                cat: bee
            })
        })
});
app.post('/customize', function (req, res) {
    // res.send('success');
    var insertc = "INSERT INTO c_detail2 ( size ,cookie1,cookie2,cookie3,cookie4, boxcolor ,bagcolor,cardcontent,quantity,cprice) VALUES (?,?,?,?,?,?,?,?,?,?);";
    var userInput = [
        req.body.size,
        req.body.showcookie1,
        req.body.showcookie2,
        req.body.showcookie3,
        req.body.showcookie4,
        req.body.showboxcolor,
        req.body.showbagcolor,
        req.body.showcard,
        req.body.quantity,
        req.body.order_amout];
    // console.log(insertc);
    // console.log(userInput);
    conn.query(insertc, userInput, function (err, data) {
        if (err) {
            res.send('無法新增')
        }
    })
})

app.get('/product', function (req, res) {
    var p_info
    conn.query('SELECT pd_name, p_price, p_pic FROM product where p_type="set"', (err, results) => {
        if (err) return console.log(err.message)
        p_info = results;
        res.render('product.ejs', { p_info: p_info });
    })
})
app.get('/product/single', function (req, res) {
    var p_single_info
    conn.query('SELECT pd_name, p_price, p_pic FROM product where p_type="single"', (err, results) => {
        if (err) return console.log(err.message)
        p_single_info = results;
        res.render('product_single.ejs', { p_single_info: p_single_info });
    })
}).post('/product/single', function (req, res) {
    const pid = parseInt(req.body.pid) + 2
    const quantity = req.body.quantity
    // req.session.islogin = true;
    // const login_alert = !req.session.islogin;
    // let cart_pause = req.body.cart_pause;
    // 確認是否已經登入(先寫死的)
    // if(!req.session.islogin) {
    //     res.send(login_alert);
    //     return
    // }
    // if(!cart_pause) {
    //     res.send(login_alert);
    //     return
    // }
    // res.send(login_alert)
    // console.log('後端傳送資料')
    conn.query(`select * from product where p_type="single" && pid=${pid}`, (err, results) => {
        if (err) return console.log(err.message)
        let pid = results[0].pid
        let pd_name = results[0].pd_name
        let p_price = results[0].p_price
        let total_price = p_price * quantity
        let p_type = results[0].p_type
        conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, status) 
                    VALUES (null, 1, 150, "", "", "", "", "", "", "", "", "購物車")`, (err, results) => {
            if (err) return console.log(err.message)
            console.log(results.insertId)
            const insert_oid = results.insertId
            conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price)
                    VALUES (NULL, ?, ?, ?, ?, ?, ?)`, [insert_oid, p_type, pid, pd_name, quantity, total_price], (err, results) => {
                if (err) return console.log(err.message)
                console.log(results.insertId)

            })
            // 等session 寫好再改成 判斷是不是同一個使用者，輸入成一筆訂單多個產品
            // 點擊按鈕 -> 藉由點擊的按鈕位置，去資料庫抓到某個產品名字價格 -> 再依資料庫抓到的名字輸入進資料庫(orderlist 跟 orderdetails)
            // --> 先輸入進 orderlist 後取得 oid ，再依 oid 輸入進 orderdetails -> 但是是點擊一次跑一次搜尋及輸入orderlist、orderdetails指令
            // --> 所以會點擊一次就產生一筆訂單，無法輸入成一筆訂單多個產品
        })
    })
    // console.log('後端傳送資料完成')
})

app.get('/product/productInfo', function (req, res) {
    // var product_info
    conn.query('SELECT pd_name, p_price, p_pic, p_pic2, p_pic3, p_pic4 FROM product where p_type="set" && (pid=1 || pid=2)', (err, results) => {
        if (err) return console.log(err.message)
        product_info = results;
        res.render('productInfo.ejs', { product_info: product_info });
    })
}).post('/product/productInfo', auth_product, function (req, res) {
    conn.query(`select * from user where uemail='${req.session.user.email}'`, (err, results) => {
        console.log(results)
        let uid = results[0].uid
        let order_total = req.body.total_price
        let product_Title = req.body.product_Title
        let productPrice = req.body.productPrice
        let quantity = req.body.quantity
        conn.query(`select * from orderlist where uid='?'`, [uid], (err, results) => {
            // console.log(typeof results)
            if (err) return console.log(err.message)
            // 當會員之前沒有加過購物車
            if (!results[0]) {
                // // let uid = results[0].uid
                conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, status) VALUES (NULL, ?, 150, ?, "", "", "", "", "", "", "", "購物車")`,
                    [uid, total_price],
                    (err, results) => {
                        // 要再加orderdetail
                        if (err) return console.log(err.message)
                        var oid = results[0].oid
                        // conn.query(`select * from product where uid='${uid}'`,[oid], (err, results) => {
                        //     if (err) return console.log(err.message)
                        // })
                        // conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, "set", '3', '蘋果樹磅蛋糕', '1', '50')`,
                        //  [oid], 
                        //  (err, results) => {
                        //     if (err) return console.log(err.message)
                        // })
                    })
                res.send({
                    status: 0,
                    msg: 'insert success'
                })
                return
            }
            // 會員之前有加過購物車
            console.log('之前有加過購物車')
            conn.query(`select order_total from orderlist where uid='?'`, [uid], (err, results) => {
                if (err) return console.log(err.message)
                order_total = results[0].order_total + parseInt(order_total)
                conn.query(`UPDATE orderlist SET order_total = ? WHERE orderlist.uid = ?`, [order_total, uid], (err, results) => {
                    if (err) return console.log(err.message)
                    console.log(results)
                })
            })
        })
    })
})
app.use('/user', member);
app.get("/order",authUid, (req, res) => {
    var uid =  res.locals.uid;
    console.log(uid +"這是卡比受");
    var sql = `SELECT DISTINCT a.*, b.* FROM orderlist AS a INNER JOIN oderdetails AS b ON a.oid = b.oid WHERE a.uid ='${uid}' ORDER BY a.order_date DESC;`;
    conn.query(sql, (err, data) => {
        if (err) return console.log(err.message)
        let uid = data[0].uid;
        console.log(uid+'訂單');
        res.render('order.ejs', {
            member_info: data,
            uid: uid
        });
    });
}).post("/order", (req, res) => {
    const { uid, oid, order_date, order_total, order_status, quantity } = req.body;
    var sql = "SELECT a.*, b.* FROM orderlist as a NATURAL JOIN oderdetails as b WHERE uid= ? and oid = ? and DATE(order_date) = ? and order_total = ? and order_status = ? and quantity = ?; ";
    // var sql = "select * from orderlist ";
    // [oid,recipient,order_total]
    conn.query(sql, [uid, oid, order_date, order_total, order_status, quantity], (err, data) => {
        console.log(data)
        if (err) { res.send("無法新增"); }
        // let uid = data[0].uid;
        // res.render('order.ejs', {
        //     member_info: data,
        //     uid:uid
        // });
    });
});
// SELECT user.uid, orderlist.oid,orderlist.order_total,orderlist.order_date,orderlist.payment_type FROM user LEFT JOIN orderlist ON user.uid=orderlist.uid;
app.get('/order/historyOrder', (req, res) => {
    // const history_sql = [
    //     'SELECT a.*, b.* FROM `orderlist` as a NATURAL JOIN `oderdetails` as b  WHERE oid = ? ',
    //     'SELECT c.*, d.* FROM `c_detail2` as c NATURAL JOIN `product` as d  ',        
    // ];
    let uid = res.locals.uid;
    const sql = `SELECT a.*, b.* FROM orderlist as a NATURAL JOIN oderdetails as b  where uid = ${uid}`;
    // conn.query(history_sql.join(';'),[1], (err, data) => {
    conn.query(sql, (err, data) => {
        // console.log(history_sql);
        if (err) res.send("訂單資料失敗");
        let oid = data[0].oid;
        let order_date = data[0].order_date;
        let order_total = data[0].order_total;
        let deliever_fee = data[0].deliever_fee;
        const sql2 = "SELECT a.*, b.* FROM `c_detail2` as a NATURAL JOIN `product` as b ";
        conn.query(sql2, (err, data) => {
            let cdetailid = data[0].cdetailid;
            let size = data[0].size;
            let cookie1 = data[0].cookie1;
            let cookie2 = data[0].cookie2;
            let cookie3 = data[0].cookie3;
            let cookie4 = data[0].cookie4;
            let boxcolor = data[0].boxcolor;
            let bagcolor = data[0].bagcolor;
            let cardcontent = data[0].cardcontent;
            let quantity = data[0].quantity;
            let cprice = data[0].cprice;
            let cprice_total = cprice * quantity;
            let p_price = data[0].p_price;//價格
            let quantit1 = 1;
            let price_total = quantit1 * p_price;
            let pid = data[0].pid;
            let pd_name = data[0].pd_name;
            let pd_describe_specification = data[0].pd_describe_specification;
            let p_pic = data[0].p_pic;
            let pd_content = data[0].pd_content;
            let cp_total = price_total + cprice_total;
            let order_total = deliever_fee + cp_total;
            // var 
            if (err) res.send("訂單資料失敗");
            res.render('historyOrder.ejs', {
                history_Order: data,
                oid: oid,
                order_date: order_date,
                order_total: order_total,
                deliever_fee: deliever_fee,
                cdetailid: cdetailid,
                size: size,
                cookie1: cookie1,
                cookie2: cookie2,
                cookie3: cookie3,
                cookie4: cookie4,
                boxcolor: boxcolor,
                bagcolor: bagcolor,
                cardcontent: cardcontent,
                quantity: quantity,
                cprice: cprice,
                cprice_total: cprice_total,
                pid: pid,
                pd_name: pd_name,
                p_price: p_price,
                quantit1: quantit1,
                pd_describe_specification: pd_describe_specification,
                p_pic: p_pic,
                pd_content: pd_content,
                price_total: price_total,
                cp_total: cp_total,
                order_total: order_total
            });
        });
    });
})
// app.post('/order/historyOrder', (req, res) => {
//     const { oid, order_date, order_total, order_status, quantity } = req.body;
//     const sql = [
//         'SELECT a.*, b.* FROM `orderlist` as a NATURAL JOIN `oderdetails` as b WHERE oid = ? and DATE(order_date) = ? and order_total = ? and order_status = ? and quantity = ?',
//         'SELECT c.*, d.* FROM `c_detail2` as c NATURAL JOIN `product` as d WHERE pid = ? and pd_name = ? and pd_content = ? and pd_describe_contents = ? and pd_describe_specification= ? and p_pic =? and cdetailid =? and size =? and cookie1=? and cookie2=? and cookie3=? and cookie4=? and boxcolor=? and bagcolor=? and cardcontent=? and quantity=? and cprice=? '
//     ];

//     conn.query(sql.join(';'), [oid, order_date, order_total, order_status, quantity], (err, data) => {
//         console.log(data)
//         if (err) {
//             res.send("無法新增");
//         };
//         // const { size, cookie1, cookie2,cookie3,cookie4,boxcolor,bagcolor, cardcontent,quantity,cprice} = req.body;
//         // const sql ='SELECT a.*, b.* FROM `c_detail2` as a NATURAL JOIN `product` as b WHERE oid = ? and DATE(order_date) = ? and order_total = ? and order_status = ? and quantity = ?;';

//     });
// })

app.get('/cart', auth, function (req, res) {
    // 取得頁面資料
    const sql = `
      SELECT od.*, c.*, p.*
      FROM orderdetails od
      JOIN c_detail2 c ON od.cdetailid = c.cdetailid
      JOIN product p ON p.pid = od.pid
    `;

    conn.query(sql, function(err, results) {
      if (err) {
        console.error('無法取得資料', err);
        return;
      }
      res.render('cart1.ejs', { c_detail2: results, product: results });
    });
  });
  
  // 建立訂單信息
app.post('/addToCart', function(req, res) {
    const { productId, price, quantity } = req.body;
    const userId = req.session.userId;

    // 查詢關於客製化的資料
    const getCdetailQuery = `
      SELECT *
      FROM c_detail2
      WHERE cdetailid = ?
    `;
    conn.query(getCdetail, [productId], function (err, cdetailResult) {
        if (err) {
            console.error('無法取得資料', err);
            return;
        }

        if (cdetailResult.length === 0) {
            console.error('無法尋找關聯');
            return;
        }

        var cdetail = cdetailResult[0];

        // 將產品資料傳至orderdetails inOD=insertOrderDetails
        var inOD = `
        INSERT INTO orderdetails (cdetailid, pid, quantity, cprice)
        VALUES (?, ?, ?, ?)
      `;

        // 根據產品的價格及數量計算價格總額
        var totalPrice = price * quantity;
        conn.query(inOD, [cdetail.cdetailid, productId, quantity, totalPrice], function (err, insertResult) {
            if (err) {
                console.error('傳入資料錯誤', err);
                return;
            }

            console.log('已成功加入資料');

            // 取得回應
            res.json({ message: '已成功加入購物車' });
        });
    });
  });

app.get('/cart/fillout', function (req, res) {
    conn.query('SELECT * FROM orderlist inner join oderdetails on orderlist.oid =  oderdetails.oid', (err, results) => {
        if (err) return console.log(err.message)
        var order_id = results[0].oid;
        var deliever_fee = results[0].deliever_fee
        var sum = 0; // 算出數個商品總額
        var product_quantity;
        conn.query(`SELECT * FROM oderdetails where oid = ${order_id}`, (err, results) => {
            var order_info = results // 取得某個訂單訂購的全部商品資訊
            product_quantity = JSON.parse(JSON.stringify(order_info)).length // 取總計商品數
            for (let i = 0; i < product_quantity; i++) {
                sum = sum + order_info[i].total_price;
            }
            var order_total = sum + deliever_fee // 計算訂單總額
            // console.log(order_total);
            res.render('cart2.ejs',
                {
                    order_info: order_info,
                    sum: sum,
                    deliever_fee: deliever_fee,
                    order_total: order_total
                }
            );
        })
    })
}).post('/cart/fillout', function (req, res) {
    var recipient = req.body.recipient
    var recipient_address_code = req.body.address_code
    var address = req.body.address
    var tel = req.body.tel
    var email = req.body.email
    var bill_option = req.body.bill_option
    var bill_option_input = req.body.bill_option_input
    var sql = `UPDATE orderlist SET recipient = ?, recipient_address_code = ?, recipient_address = ?, recipient_phone = ?, recipient_email = ?, arrive_date = '2023-07-16', payment_type = '到貨付款', bill_option_type = ?, cloud_invoice = ? WHERE orderlist.oid = 12`
    conn.query(sql, [recipient, recipient_address_code, address, tel, email, bill_option, bill_option_input], (err, results) => {
        if (err) return console.log(err.message)
        console.log(results)
        if (results.serverStatus === 2) {
            console.log('資料庫資料更新成功')
        }
    })
})

app.get('/cart/check', function (req, res) {
    const sql = `
    SELECT od.*, c.*, p.*
      FROM orderdetails od
      JOIN c_detail2 c ON od.cdetailid = c.cdetailid
      JOIN product p ON p.pid = od.pid
  `;

  conn.query(sql, function(err, results) {
    if (err) {
      console.error('無法取得資料：', err);
      return;
    }
    res.render('cart3.ejs', { c_detail2: results, product: results });
  });
});

// 添加到購物車
app.post('/addToCart', function(req, res) {
  const { productId, price, quantity } = req.body;

  // 查詢信息
  const getCdetailQuery = `
    SELECT *
    FROM c_detail2
    INNER JOIN orderdetails ON c_detail2.c_detail2_id = orderdetails.c_detail2_id
    WHERE orderdetails.product_id = ?
  `;
  conn.query(getCdetailQuery, [productId], function(err, cdetailResult) {
    if (err) {
      console.error('檢索失敗', err);
      return;
    }

    if (cdetailResult.length === 0) {
      console.error('找不到關聯');
      return;
    }

    const cdetail = cdetailResult[0];

    // 將產品資料插入orderdetails 
    const insertOrderDetailQuery = `
      INSERT INTO orderdetails (c_detail2_id, product_id, quantity, price)
      VALUES (?, ?, ?, ?)
    `;
    const totalPrice = price * quantity; 
    conn.query(insertOrderDetailQuery, [cdetail.c_detail2_id, productId, quantity, totalPrice], function(err, insertResult) {
      if (err) {
        console.error('將產品數據更新在資料庫', err);
        return;
      }

      console.log('已成功添加到 orderdetails ');

      res.json({ message: '已成功更新到購物車' });
    });
  });
});


app.get('/member', auth,function (req, res) {
    var userEmail = req.session.user.email; 
    // console.log(userEmail+'這是皮卡丘');
    var sql = `SELECT uid, uname, umobile, uemail, ubirth FROM user where uemail='${userEmail}'`;
    conn.query(sql,(err, data) => {
        if (err) return console.log(err.message)
        let userData = data[0];
        // console.log(userData+'這是皮卡丘userData');
        let uid = userData.uid;
        console.log(data[0].uemail);
        let uemail = userData.uemail;
        let umobile = userData.umobile;
        let ubirth = userData.ubirth;
        let uname = userData.uname;
        // console.log(uemail);
        // console.log(umobile);
        // console.log(ubirth);
        res.render('member.ejs', {
            member_user: data,
            uid:uid,
            uname:uname,
            umobile:umobile,
            uemail:uemail,
            ubirth:ubirth,
            userData:userData
        })
    })
}).post('/member', authUid,(req, res) => {
    const { uname, umobile, ubirth} = req.body;
    var uid =  res.locals.uid;
    // var sql = 'SELECT * FROM user WHERE uemail =?'
    var sql = `UPDATE  user SET uname =?,umobile=?,ubirth =? WHERE uid = ?`;
    conn.query(sql, [uname, umobile, ubirth, uid], (err, data) => {
        console.log(uid + '0720');
        console.log(data)
        if (err) {
            res.send("無法更新");
        } else {
            res.send({ success: true });
        }
    })
})



app.get('/about', function (req, res) {
    res.render('about.ejs');
})

app.get('/card', function (req, res) {
    res.render('card.ejs');
})

//登出
app.get('/logout', (req, res) => {
    // 破壞session
    req.session.destroy((err) => {
      if (err) {
        console.error('session不能破壞:', err);
      }
      // 轉址到首頁
      res.redirect('/');
    });
  });
  

function auth(req, res, next) {
    if (req.session.user) {
        console.log('authenticated')
        next()
    } else {
        console.log('not authenticated')
        return res.redirect('/user')
    }
}
//抓登入帳號的uid
function authUid(req, res, next) {
    var userEmail = req.session.user.email;
    var sql = `SELECT * FROM user WHERE uemail = ?`;
    conn.query(sql, [userEmail], (err, data) => {
      if (err) return console.log(err.message);
      let userData = data[0];
      let uid = userData.uid;
      res.locals.uid = uid;
      console.log(uid+'皮卡丘')
      next();
    });
  }
function authOrder(req, res, next) {
    var uid =  res.locals.uid;
    console.log(uid +"這是卡比受訂單");
    var sql = ` SELECT DISTINCT a.*, b.* FROM orderlist AS a INNER JOIN oderdetails AS b ON a.oid = b.oid WHERE a.oid ='${oid}';`;
    conn.query(sql, (err, data) => {
        if (err) return console.log(err.message)
        let uid = data[0].uid;
        console.log(uid+'訂單');
        res.render('order.ejs', {
            member_info: data,
            uid: uid
        });
    });
}



// 設定 session 過期時的處理
app.use((req, res, next) => {
    if (req.session && req.session.user) {
        // session 存在且使用者已登入，檢查 session 是否過期
        const currentTime = new Date().getTime();
        const maxAge = req.session.cookie.maxAge;

        if (currentTime - req.session.cookie.lastAccess > maxAge) {
            // session 已過期，銷毀 session
            req.session.destroy((err) => {
                if (err) {
                    console.error('無法銷毀 session:', err);
                }
                // 導向登入頁面
                res.redirect('/user');
            });
        } else {
            // 更新 session 的 lastAccess 時間
            req.session.cookie.lastAccess = currentTime;
            next();
        }
    } else {
        next();
    }
});

app.listen(5678, function () {
    console.log('胖丁說: 5678 啟動中gogopokemon ');
});