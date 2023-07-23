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
    conn.query('SELECT * FROM product where p_type="single"', (err, results) => {
        if (err) return console.log(err.message)
        p_single_info = results;
        res.render('product_single.ejs', { p_single_info: p_single_info });
    })
}).post('/product/single', auth_product, function (req, res) {
    // 抓會員的資料
    conn.query(`select * from user where uemail=?`, [req.session.user.email], (err, results) => {
        if (err) return console.log(err.message)
        var uid = results[0].uid
        var pid = parseInt(req.body.pid) + 2
        var quantity = req.body.quantity
        var p_name = req.body.p_name
        var p_price = req.body.p_price
        var single_order_total = req.body.order_total
        var p_type = req.body.p_type
        // 抓會員在資料庫的購物車的紀錄，看會員是否有加過商品到購物車
        conn.query(`select * from orderlist where uid='?' && order_status = "購物車"`, [uid], (err, results) => {
            if (err) return console.log(err.message)
            // 當會員之前沒有加過購物車
            if (!results[0]) {
                // 抓使用者要加入購物車的單品資訊
                conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, order_status) 
                        VALUES (null, ?, 150, ?, "", "", "", "", "", "", "貨到付款", "購物車")`,
                    [uid, single_order_total], (err, results) => {
                        if (err) return console.log(err.message)
                        const insert_oid = results.insertId
                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
                            [insert_oid, p_type, pid, p_name, quantity, single_order_total],
                            (err, results) => {
                                if (err) return console.log(err.message)
                                console.log("insert into oderdetails: ", results)
                            })
                    })
                return
            }
            // 當會員之前有加過購物車
            // 找會員的購物車資料
            var oid = results[0].oid
            order_total = results[0].order_total + single_order_total
            // 更新orderlist
            conn.query(`UPDATE orderlist SET order_total = ? WHERE oid = ?`, [order_total, oid], (err, results) => {
                if (err) return console.log(err.message)
                console.log('update orderlist:', results)
            })
            // 更新 orderdetails
            // 找 orderdetails 有沒有相同產品，沒有新增，有則更新
            conn.query(`select * from oderdetails where oid = ? && product_id = ?`, [oid, pid], (err, results) => {
                if (err) return console.log(err.message)
                // orderdetails 沒有相同的產品
                if (!results[0]) {
                    conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price, cdetailid) VALUES (NULL, ?, ?, ?, ?, ?, ?, NULL)`,
                        [oid, p_type, pid, p_name, quantity, single_order_total],
                        (err, results) => {
                            if (err) return console.log(err.message)
                            console.log('insert orderlists success:', results)
                        })
                    return
                }
                // orderdetails 有相同的產品
                let total_quantity = results[0].quantity + quantity
                let total_price = results[0].total_price + single_order_total
                conn.query(`UPDATE oderdetails SET quantity = ?, total_price= ? WHERE product_id = ?`, [total_quantity, total_price, pid], (err, results) => {
                    if (err) return console.log(err.message)
                    console.log('orderdetails update success: ', results)
                })
            })
        })
    })
})

app.get('/product/productInfo', function (req, res) {
    conn.query('SELECT * FROM product where p_type="set" && (pid=1 || pid=2)', (err, results) => {
        if (err) return console.log(err.message)
        var product_info = results;
        conn.query('SELECT * FROM product where p_type="set"', (err, results) => {
            if (err) return console.log(err.message)
            var product = results;
            res.render('productInfo.ejs', { product_info: product_info, product: product });
        })
    })
}).post('/product/productInfo', auth_product, function (req, res) {
    conn.query(`select * from user where uemail='${req.session.user.email}'`, (err, results) => {
        var uid = results[0].uid
        var order_total = req.body.order_total
        var product_Title = req.body.product_Title
        var productPrice = req.body.productPrice
        var quantity = req.body.quantity
        conn.query(`select * from orderlist where uid='?' && order_status="購物車"`, [uid], (err, results) => {
            if (err) return console.log(err.message)
            // 當會員之前沒有加過購物車
            if (!results[0]) {
                conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, order_status) VALUES (NULL, ?, 150, ?, "", "", "", "", "", "", "", "購物車")`,
                    [uid, order_total],
                    (err, results) => {
                        if (err) return console.log(err.message)
                        var oid = results.insertId
                        conn.query(`select * from product where pd_name = ?`, [product_Title], (err, results) => {
                            if (err) return console.log(err.message)
                            conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
                                [oid, results[0].p_type, results[0].pid, results[0].pd_name, quantity, order_total],
                                (err, results) => {
                                    if (err) return console.log(err.message)
                                    console.log("insert into oderdetails: ", results)
                                })
                        })
                    })
                res.send({
                    status: 0,
                    msg: 'insert success'
                })
                return
            }
            // 會員之前有加過購物車
            conn.query(`select * from orderlist where uid = '?' && order_status = '購物車'`, [uid], (err, results) => {
                if (err) return console.log(err.message)
                order_total = results[0].order_total + parseInt(order_total)
                let oid = results[0].oid
                conn.query(`UPDATE orderlist SET order_total = ? WHERE orderlist.uid = ?`, [order_total, uid], (err, results) => {
                    if (err) return console.log(err.message)
                    console.log('update orderlist: ', results)
                })
                conn.query(`select * from oderdetails where oid = ? && p_name = ?`, [oid, product_Title], (err, results) => {
                    if (err) return console.log(err.message)
                    if (!results[0]) {
                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, 'set', 1, ?, ?, ?)`, [oid, product_Title, quantity, productPrice * quantity], (err, results) => {
                            if (err) return console.log(err.message)
                        })
                        return
                    }
                    quantity = results[0].quantity + parseInt(quantity)
                    total_price = parseInt(quantity) * productPrice
                    conn.query(`UPDATE oderdetails SET quantity = ?, total_price = ? WHERE oid = ? && p_name = ?`, [quantity, total_price, oid, product_Title], (err, results) => {
                        if (err) return console.log(err.message)
                        console.log('update orderdetails: ', results)
                    })
                })
            })
        })
    })
})
app.use('/user', member);
app.get("/order",authUid, (req, res) => {
    var uid =  res.locals.uid;
    var sql = `SELECT DISTINCT a.*, b.* FROM orderlist AS a INNER JOIN oderdetails AS b ON a.oid = b.oid WHERE a.uid ='${uid}' GROUP BY a.oid ORDER BY a.order_date DESC;`;
    conn.query(sql, (err, data) => {
        if (err) return console.log(err.message)
        let uid = data[0].uid;
        let oid = data[0].oid;
        let order_total = data[0].order_total;
        let order_date = data[0].order_date;
        let order_status = data[0].order_status;
        let quantity = data[0].quantity;
        res.render('order.ejs', {
            member_info: data,
            uid: uid,
            oid: oid,
            order_date: order_date,
            order_total: order_total,
            order_status: order_status,
            quantity: quantity
        });
    });
})
// .post("/order", (req, res) => {
//     const { uid, oid, order_date, order_total, order_status, quantity } = req.body;
//     var sql = "SELECT a.*, b.* FROM orderlist as a NATURAL JOIN oderdetails as b WHERE uid= ? and oid = ? and DATE(order_date) = ? and order_total = ? and order_status = ? and quantity = ?; ";
//     // var sql = "select * from orderlist ";
//     // [oid,recipient,order_total]
//     conn.query(sql, [uid, oid, order_date, order_total, order_status, quantity], (err, data) => {
//         console.log(data)
//         if (err) { res.send("無法新增"); }
//         // let uid = data[0].uid;
//         // res.render('order.ejs', {
//         //     member_info: data,
//         //     uid:uid
//         // });
//     });
// });
// SELECT user.uid, orderlist.oid,orderlist.order_total,orderlist.order_date,orderlist.payment_type FROM user LEFT JOIN orderlist ON user.uid=orderlist.uid;
app.get('/order/historyOrder/:oid', (req, res) => {
    let oid = req.params.oid;
    console.log(oid +'訂單')
    // const sql = `SELECT a.*, b.* FROM orderlist as a NATURAL JOIN oderdetails as b  where uid = ?`;
    const sql = `select *
    FROM orderlist LEFT JOIN oderdetails ON orderlist.oid = oderdetails.oid LEFT JOIN c_detail2 ON c_detail2.cdetailid = oderdetails.cdetailid LEFT JOIN product ON product.pid = oderdetails.product_id  where oderdetails.oid = ?`
    conn.query(sql,[oid], (err, data) => {
        // console.log(history_sql);
        if (err) {res.send(`失敗，這是訂單編號'${oid}:'`);
        } else {
            if(data.length >0){
            let order_date = data[0].order_date;
            let order_total = data[0].order_total;
            let deliever_fee = data[0].deliever_fee;
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
            let cprice_total = parseInt(cprice) * parseInt(quantity);
            console.log(cprice_total+"111");
            let p_price = data[0].p_price;//價格
            let price_total = quantity * p_price;
            let pid = data[0].pid;
            let pd_name = data[0].pd_name;
            let pd_describe_specification = data[0].pd_describe_specification;
            let p_pic = data[0].p_pic;
            let pd_content = data[0].pd_content;
            let cp_total = price_total + cprice_total;
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
                pd_describe_specification: pd_describe_specification,
                p_pic: p_pic,
                pd_content: pd_content,
                price_total: price_total,
                cp_total: cp_total,
                order_total: order_total
            });
         } else{
            res.send(`找不到訂單編號 '${oid}' 的訂單資料`);
         }
        }
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

app.get('/cart', function (req, res) {
    // 取得頁面資料
    const sql = `
    SELECT oderdetails.*, c_detail2.*, product.*
    FROM oderdetails
    JOIN c_detail2 ON oderdetails.cdetailid = c_detail2.cdetailid
    JOIN product ON product.pid = oderdetails.product_id;
    `;

    conn.query(sql, function (err, results) {
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
  
    // 查詢關於客製化的資料 (c_detail2)
    const getCdetail = `
      SELECT *
      FROM c_detail2
      WHERE cdetailid = ?
    `;
    conn.query(getCdetail, [productId], function(err, cdetailResult) {
      if (err) {
        console.error('無法取得資料', err);
        return;
      }
  
      if (cdetailResult.length === 0) {
        console.error('無法尋找關聯');
        return;
      }
  
      var cdetail = cdetailResult[0];
  
      // 查詢產品的資料 (product)
      const getProduct = `
        SELECT *
        FROM product
        WHERE pid = ?
      `;
      conn.query(getProduct, [productId], function(err, productResult) {
        if (err) {
          console.error('無法取得產品資料', err);
          return;
        }
  
        if (productResult.length === 0) {
          console.error('找不到產品');
          return;
        }
  
        var product = productResult[0];
  
        // 將產品資料傳至 oderdetails
        var inOD = `
          INSERT INTO oderdetails (cdetailid, pid, quantity, cprice, product_name, product_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
  
        // 根據產品的價格及數量計算價格總額
        var totalPrice = price * quantity; 
        conn.query(inOD, [cdetail.cdetailid, productId, quantity, totalPrice, product.product_name, product.price], function(err, insertResult) {
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
  });


app.get('/cart/fillout', auth_cart2, function (req, res) {
    conn.query(`select * from user where uemail=?`, [req.session.user.email], (err, results) => {
        if (err) return console.log(err.message)
        let uid = results[0].uid
        conn.query('SELECT * FROM orderlist inner join oderdetails on orderlist.oid = oderdetails.oid where uid = ? and order_status = "購物車"', [uid], (err, results) => {
            if (err) return console.log(err.message)
            var deliever_fee = results[0].deliever_fee
            var orderdetail_length = JSON.parse(JSON.stringify(results)).length
            var sum = results[0].order_total // 商品總額
            var product_quantity = 0; // 計算商品數
            var order_total = sum + deliever_fee // 訂單總額
            for (let i = 0; i < orderdetail_length; i++) {
                product_quantity = results[i].quantity + product_quantity
            }
            res.render('cart2.ejs',
                {
                    product_quantity: product_quantity,
                    sum: sum,
                    deliever_fee: deliever_fee,
                    order_total: order_total
                }
            );
        })
    })
}).post('/cart/fillout', auth_cart2, function (req, res) {
    conn.query(`select * from user where uemail=?`, [req.session.user.email], (err, results) => {
        if (err) return console.log(err.message)
        var uid = results[0].uid
        var recipient = req.body.recipient
        // var recipient_address_code = req.body.address_code
        var address = req.body.address
        var tel = req.body.tel
        var email = req.body.email
        var bill_option = req.body.bill_option
        var bill_option_input = req.body.bill_option_input
        var arrive_date = req.body.arrive_date
        // 資料庫可能要加一欄 recipient_address_code
        var sql = `UPDATE orderlist SET recipient = ?, recipient_address = ?, recipient_phone = ?, recipient_email = ?, arrive_date = ?, payment_type = '到貨付款' WHERE uid = ?`
        conn.query(sql, [recipient, address, tel, email, arrive_date, uid], (err, results) => {
            if (err) return console.log(err.message)
            console.log(results)
            if (results.serverStatus === 2) {
                console.log('資料庫資料更新成功')
            }
        })
    })
})

app.get('/cart/check', function (req, res) {
    const sql = `
    SELECT oderdetails.*, c_detail2.*, product.*
    FROM oderdetails
    JOIN c_detail2 ON oderdetails.cdetailid = c_detail2.cdetailid
    JOIN product ON product.pid = oderdetails.product_id;
  `;

    conn.query(sql, function (err, results) {
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
    const userId = req.session.userId;
  
    // 查詢關於客製化的資料 (c_detail2)
    const getCdetail = `
      SELECT *
      FROM c_detail2
      WHERE cdetailid = ?
    `;
    conn.query(getCdetail, [productId], function(err, cdetailResult) {
      if (err) {
        console.error('無法取得資料', err);
        return;
      }
  
      if (cdetailResult.length === 0) {
        console.error('無法尋找關聯');
        return;
      }
  
      var cdetail = cdetailResult[0];
  
      // 查詢產品的資料 (product)
      const getProduct = `
        SELECT *
        FROM product
        WHERE pid = ?
      `;
      conn.query(getProduct, [productId], function(err, productResult) {
        if (err) {
          console.error('無法取得產品資料', err);
          return;
        }
  
        if (productResult.length === 0) {
          console.error('找不到產品');
          return;
        }
  
        var product = productResult[0];
  
        // 將產品資料傳至 oderdetails
        var inOD = `
          INSERT INTO oderdetails (cdetailid, pid, quantity, cprice, product_name, product_price)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
  
        // 根據產品的價格及數量計算價格總額
        var totalPrice = price * quantity; 
        conn.query(inOD, [cdetail.cdetailid, productId, quantity, totalPrice, product.product_name, product.price], function(err, insertResult) {
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
  });


app.get('/member', auth, function (req, res) {
    var userEmail = req.session.user.email;
    var sql = `SELECT uid, uname, umobile, uemail, ubirth FROM user where uemail=?`;
    conn.query(sql, [userEmail], (err, data) => {
        if (err) return console.log(err.message)
        let userData = data[0];
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
            uid: uid,
            uname: uname,
            umobile: umobile,
            uemail: uemail,
            ubirth: ubirth,
            userData: userData
        })
    })
}).post('/member', authUid, (req, res) => {
    const { uname, umobile, ubirth } = req.body;
    var uid = res.locals.uid;
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
function auth_product(req, res, next) {
    if (req.session.user) {
        console.log('已登入')
        next()
    } else {
        console.log('not authenticateda')
        res.send({
            status: 1,
            msg: '還沒登入'
        })
    }
}
function auth_cart2(req, res, next) {
    if (req.session.user) {
        console.log('已登入')
        next()
    } else {
        console.log('not authenticateda')
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
      next();
    });
}
function authOrder(req, res, next) {
    var uid =  res.locals.uid;
    var sql = ` SELECT DISTINCT a.*, b.* FROM orderlist AS a INNER JOIN oderdetails AS b ON a.oid = b.oid WHERE a.oid ='${oid}';`;
    conn.query(sql, (err, data) => {
        if (err) return console.log(err.message)
        let uid = data[0].uid;
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