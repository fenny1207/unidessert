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
        maxAge: 60 * 60 * 1000
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

app.post('/customize', auth_product, function (req, res) {
    // res.send('success');
    conn.query(`select * from user where uemail='${req.session.user.email}'`, (err, results) => {
        console.log(results)
        var uid = results[0].uid
        var number = req.body.number

        //更改的：當會員之前沒有加過購物車(完成)
        conn.query(`select * from orderlist where uid='?' && order_status="購物車"`, [uid], (err, results) => {
            if (err) return console.log(err.message)
            // 當會員之前沒有加過購物車
            if (!results[0]) {
                let insertc = "INSERT INTO c_detail2 ( size ,cookie1,cookie2,cookie3,cookie4, boxcolor ,bagcolor,cardcontent,quantity2,cprice) VALUES (?,?,?,?,?,?,?,?,?,?);";
                let quantity = req.body.quantity
                let userInput = [
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
                conn.query(insertc, userInput, function (err, data) {
                    if (err) {
                        res.send('無法新增')
                    }
                    // console.log(data)
                    const insert_cdetailid = data.insertId  // insert 完的 cdetailid
                    // console.log('這是cdetailid' + insert_cdetailid);
                    const currentDate = new Date();

                    // 使用 Date 物件的方法獲取年、月、日等資訊
                    const year = currentDate.getFullYear(); // 取得年份，例如 2023
                    const month = currentDate.getMonth() + 1; // 月份是從 0 開始的，因此需要加 1，例如 7 (代表 8 月)
                    const day = currentDate.getDate(); // 取得當月的幾號，例如 20


                    // 將取得的年、月、日組合成字串表示現在的日期
                    const formattedDate = `${year}-${month}-${day}`;
                    // console.log(formattedDate); // 輸出範例：2023-7-20


                    conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, order_status) 
                    VALUES (null, ?, 150, 600, '${formattedDate}', "", "", "", "", '${formattedDate}', "貨到付款", "購物車")`, [uid], (err, results) => {
                        if (err) return console.log(err.message)
                        let insert_orderlist = results.insertId
                        // console.log("insert_orderlist" + insert_orderlist)
                        // console.log("insert_cdetailid" + insert_cdetailid)
                        // console.log(results)


                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price, cdetailid)
                                    VALUES (NULL, ?, ?, ?, ?, ?, ?,?)`, [insert_orderlist, "Customize", 0, "客製化禮盒", quantity, 600, insert_cdetailid], (err, results) => {
                            if (err) return console.log(err.message)
                            // console.log(results)
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
            conn.query(`select * FROM orderlist LEFT JOIN oderdetails ON orderlist.oid = oderdetails.oid LEFT JOIN c_detail2 ON
            c_detail2.cdetailid = oderdetails.cdetailid  where orderlist.uid =? AND orderlist.order_status = '購物車'`, [uid], (err, results) => {
                if (err) return console.log(err.message)
                // console.log("results" + results);
                console.log("這次要看results" + JSON.stringify(results));
                console.log("這次要看results[0]" + JSON.stringify(results[0]));
                let orderTotal = results[0].order_total;
                orderTotal += (number * 600)
                console.log("訂單總金額:", orderTotal);
                let insertc = "INSERT INTO c_detail2 ( size ,cookie1,cookie2,cookie3,cookie4, boxcolor ,bagcolor,cardcontent,quantity2,cprice) VALUES (?,?,?,?,?,?,?,?,?,?);";
                let quantity = req.body.quantity
                let userInput = [
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
                conn.query(insertc, userInput, function (err, data) {
                    if (err) {
                        res.send('無法新增')
                    }
                    console.log("c_detail2 dddd", data)
                    console.log("results[0].oid", results[0].oid)
                    let oid = results[0].oid
                    let cdetailid = data.insertId

                    conn.query(`UPDATE orderlist Customize order_total = ? WHERE orderlist.uid = ?`, [orderTotal, uid], (err, results) => {
                        if (err) return console.log(err.message)

                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price, cdetailid)
                        VALUES (NULL, ?, ?, ?, ?, ?, ?,?)`, [oid, "Customize", 0, "客製化禮盒", quantity, 600, cdetailid], (err, results) => {
                            if (err) return console.log(err.message)
                            console.log(results)
                        })
                    })
                })

            })

        })
        // 這段的最後標籤
    })



})
// })

app.get('/product', function (req, res) {
    var p_info
    conn.query('SELECT pd_name, p_price, p_pic FROM product where p_type="Customize"', (err, results) => {
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
                const currentDate = new Date();

                // 使用 Date 物件的方法獲取年、月、日等資訊
                const year = currentDate.getFullYear(); // 取得年份，例如 2023
                const month = currentDate.getMonth() + 1; // 月份是從 0 開始的，因此需要加 1，例如 7 (代表 8 月)
                const day = currentDate.getDate(); // 取得當月的幾號，例如 20


                // 將取得的年、月、日組合成字串表示現在的日期
                const formattedDate = `${year}-${month}-${day}`;
                conn.query(`INSERT INTO orderlist (oid, uid, deliever_fee, order_total, order_date, recipient, recipient_address, recipient_phone, recipient_email, arrive_date, payment_type, order_status) 
                        VALUES (null, ?, 150, ?, "", '${formattedDate}', "", "", "", '${formattedDate}', "貨到付款", "購物車")`,
                    [uid, single_order_total], (err, results) => {
                        if (err) return console.log(err.message)
                        const insert_oid = results.insertId
                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, ?, ?, ?, ?, ?)`,
                            [insert_oid, p_type, pid, p_name, quantity, single_order_total],
                            (err, results) => {
                                if (err) return console.log(err.message)
                            })
                    })
                return
            }
            // 當會員之前有加過購物車
            // 找會員的購物車資料
            var oid = results[0].oid
            order_total = results[0].order_total + single_order_total
            // 更新orderlist
            conn.query(`UPDATE orderlist Customize order_total = ? WHERE oid = ?`, [order_total, oid], (err, results) => {
                if (err) return console.log(err.message)
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
                        })
                    return
                }
                // orderdetails 有相同的產品
                let total_quantity = results[0].quantity + quantity
                let total_price = results[0].total_price + single_order_total
                conn.query(`UPDATE oderdetails Customize quantity = ?, total_price= ? WHERE product_id = ?`, [total_quantity, total_price, pid], (err, results) => {
                    if (err) return console.log(err.message)
                })
            })
        })
    })
})

app.get('/product/productInfo', function (req, res) {
    conn.query('SELECT * FROM product where p_type="Customize" && (pid=1 || pid=2)', (err, results) => {
        if (err) return console.log(err.message)
        var product_info = results;
        conn.query('SELECT * FROM product where p_type="Customize"', (err, results) => {
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
                conn.query(`UPDATE orderlist Customize order_total = ? WHERE orderlist.uid = ?`, [order_total, uid], (err, results) => {
                    if (err) return console.log(err.message)
                })
                conn.query(`select * from oderdetails where oid = ? && p_name = ?`, [oid, product_Title], (err, results) => {
                    if (err) return console.log(err.message)
                    if (!results[0]) {
                        conn.query(`INSERT INTO oderdetails (orderdetails_id, oid, product_type, product_id, p_name, quantity, total_price) VALUES (NULL, ?, 'Customize', 1, ?, ?, ?)`, [oid, product_Title, quantity, productPrice * quantity], (err, results) => {
                            if (err) return console.log(err.message)
                        })
                        return
                    }
                    quantity = results[0].quantity + parseInt(quantity)
                    total_price = parseInt(quantity) * productPrice
                    conn.query(`UPDATE oderdetails Customize quantity = ?, total_price = ? WHERE oid = ? && p_name = ?`, [quantity, total_price, oid, product_Title], (err, results) => {
                        if (err) return console.log(err.message)
                    })
                })
            })
        })
    })
})
app.use('/user', member);
app.get("/order", authUid, (req, res) => {
    var uid = res.locals.uid;
    var sql = `SELECT DISTINCT a.*, b.* FROM orderlist AS a INNER JOIN oderdetails AS b ON a.oid = b.oid WHERE a.uid ='${uid}'  and a.order_status <> "購物車" GROUP BY a.oid ORDER BY a.order_date DESC;`;
    conn.query(sql, (err, data) => {
        if (err) return console.log(err.message)
        if (data.length ===0) {
            res.render('order.ejs', {
                 noOrder: true 
            })
        } else {
            let uid = data[0].uid;
            let oid = data[0].oid;
            let order_total = data[0].order_total;
            let deliever_fee = data[0].deliever_fee;
            // let order_all = parseInt(order_total)+parseInt(deliever_fee);
            // console.log(order_all);
            let order_date = data[0].order_date;
            let order_status = data[0].order_status;
            let quantity = data[0].quantity;
            let arrive_date = data[0].arrive_date;
            let order_all = 0;
            for (let i = 0; i < data.length; i++) {
                let order_total = data[i].order_total;
                let deliever_fee = data[i].deliever_fee;
                let order_all = parseInt(order_total) + parseInt(deliever_fee);
              }

            res.render('order.ejs', {
                member_info: data,
                uid: uid,
                oid: oid,
                order_date: order_date,
                order_total: order_total,
                order_status: order_status,
                quantity: quantity,
                order_all:order_all,
                arrive_date:arrive_date    
            });
        }
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
    // const sql = `SELECT a.*, b.* FROM orderlist as a NATURAL JOIN oderdetails as b  where uid = ?`;
    const sql = `select * FROM orderlist LEFT JOIN oderdetails ON orderlist.oid = oderdetails.oid LEFT JOIN c_detail2 ON
     c_detail2.cdetailid = oderdetails.cdetailid LEFT JOIN product ON product.pid = oderdetails.product_id  LEFT JOIN customize on c_detail2.boxcolor=customize.cname where oderdetails.oid =?`
    conn.query(sql, [oid], (err, data) => {
        // console.log(history_sql);
        if (err) {
            res.send(`失敗，這是訂單編號'${oid}:'`);
        } else {
            if (data.length > 0) {
                let order_date = data[0].order_date;
                let deliever_fee = data[0].deliever_fee;
                let cdetailid = data[0].cdetailid;
                let size = data[0].size;
                let cookie1 = data[0].cookie1;
                let cookie2 = data[0].cookie2;
                let cookie3 = data[0].cookie3;
                let cookie4 = data[0].cookie4;
                let boxcolor = data[0].boxcolor;
                let cpic = data[0].cpic;
                let bagcolor = data[0].bagcolor;
                let cardcontent = data[0].cardcontent;
                let quantity = data[0].quantity;
                let quantity2 = data[0].quantity2;//客製數量
                let cprice = parseInt(data[0].cprice);
                let cprice_total = cprice * parseInt(quantity);
                let p_price = parseInt(data[0].p_price);//價格
                let price_total = p_price * parseInt(quantity);
                let pid = data[0].pid;
                let pd_name = data[0].pd_name;
                let pd_describe_specification = data[0].pd_describe_specification;
                let p_pic = data[0].p_pic;
                let pd_content = data[0].pd_content;
                let recipient = data[0].recipient;
                let recipient_address = data[0].recipient_address;
                let recipient_phone = data[0].recipient_phone;
                // let cp_total = price_total + cprice_total;
                let cp_total = 0;
                let order_total = cp_total + deliever_fee;
                let quantity_total = 0;
                for (let i = 0; i < data.length; i++) {
                    let quantity = parseInt(data[i].quantity) || 0;
                    let quantity2 = parseInt(data[i].quantity2) || 0;
                    quantity_total += (quantity + quantity2);
                }
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
                    cprice: cprice,
                    cprice_total: cprice_total,
                    pid: pid,
                    pd_name: pd_name,
                    quantity: quantity,
                    p_price: p_price,
                    pd_describe_specification: pd_describe_specification,
                    p_pic: p_pic,
                    pd_content: pd_content,
                    quantity2:quantity2,
                    price_total: price_total,
                    cp_total: cp_total,
                    order_total: order_total,
                    quantity_total: quantity_total,
                    cpic: cpic,
                    recipient_address:recipient_address,
                    recipient:recipient,
                    recipient_phone:recipient_phone,
                });
            } else {
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

app.get('/cart', (req, res) => {
    let oid = req.params.oid; // 注意這裡使用的是 req.params.oid，確保您的路由中能夠取得 oid 參數

    const sql = `
    SELECT DISTINCT a.*, b.*, 
    product.*, 
    c_detail2.*
    FROM orderlist AS a
    INNER JOIN oderdetails AS b ON a.oid = b.oid
    LEFT JOIN product ON b.product_id = product.pid
    LEFT JOIN c_detail2 ON b.cdetailid = c_detail2.cdetailid
    WHERE a.order_status = "購物車"
    ORDER BY a.order_date DESC;
        
    `;
    
    
    conn.query(sql, function (err, cartdata) {
        if (err) {
            console.error('無法傳遞', err);
            return;
        }

        let  product_type, product_id, p_name, quantity, total_price, cdetailid;

        // 取得第一筆orderdetails資料的其他相關資訊
        if (cartdata.length > 0) {
            
            product_type = cartdata[0].product_type;
            product_id = cartdata[0].product_id;
            p_name = cartdata[0].p_name;
            quantity = cartdata[0].quantity;
            total_price = cartdata[0].total_price;
            cdetailid = cartdata[0].cdetailid;
                
        }

        res.render('cart1.ejs', {
            cartdata: cartdata, 
            oid: oid, 
            quantity: quantity,
            
            product_type: product_type,
            product_id: product_id,
            p_name: p_name,
            c_quantity:quantity, 
            total_price: total_price,
            cdetailid: cdetailid
            
        });
    });
});


  app.get('/cart1/:oid', (req, res) => {
    const oid = req.params.oid;
    const sql = `
    SELECT oderdetails.*,
    CASE
        WHEN c_detail2.cdetailid IS NOT NULL THEN 'Customize'
        WHEN product.pid IS NOT NULL THEN 'single'
        ELSE NULL
    END AS product_type,
    c_detail2.*,
    product.*
    FROM oderdetails
    LEFT JOIN (SELECT *, 'Customize' AS product_type FROM c_detail2) AS c_detail2
    ON oderdetails.cdetailid = c_detail2.cdetailid
    LEFT JOIN (SELECT *, 'single' AS product_type FROM product) AS product
    ON product.pid = oderdetails.product_id
    LEFT JOIN customize on c_detail2.boxcolor=customize.cname
    WHERE oderdetails.oid = ? AND a.order_status = "購物車";  
    `;
  
    conn.query(sql, [oid], function (err, orderDetailsForOid) {
        if (err) {
            console.error('无法取得orderdetails数据', err);
            return;
        }

        //  c_detail2 資料，將它合併到 cartdata 中
        if (orderDetailsForOid.length > 0 && orderDetailsForOid[0].product_type === 'Customize') {
            const c_detail2Data = {
                size: orderDetailsForOid[0].size,
                cpic1:orderDetailsForOid[0].boxcolor,
                cookie1: orderDetailsForOid[0].cookie1,
                cookie2: orderDetailsForOid[0].cookie2,
                cookie3: orderDetailsForOid[0].cookie3,
                cookie4: orderDetailsForOid[0].cookie4,
                boxcolor: orderDetailsForOid[0].boxcolor,
                bagcolor: orderDetailsForOid[0].bagcolor,
                cardcontent: orderDetailsForOid[0].cardcontent,
                cprice: orderDetailsForOid[0].cprice,
            };

            // 合併 c_detail2 資料到 cartdata 中
            const cartdataWithCDetail2 = {
                ...orderDetailsForOid[0],
                ...c_detail2Data,
            };

            // 將合併後的資料傳遞給 EJS 模板進行渲染
            res.render('cart1.ejs', { cartdata: cartdataWithCDetail2 });
        } else {
            // 如果沒有 c_detail2 資料，直接將 orderDetailsForOid 傳遞給 EJS 模板進行渲染
            res.render('cart1.ejs', { cartdata: orderDetailsForOid });
        }
    });
});


app.get('/cart/fillout', auth_cart2, function (req, res) {
    conn.query(`select * from user where uemail=?`, [req.session.user.email], (err, results) => {
        if (err) return console.log(err.message)
        let uid = results[0].uid
        conn.query('SELECT * FROM orderlist inner join oderdetails on orderlist.oid = oderdetails.oid where uid = ? and order_status = "購物車"', [uid], (err, results) => {
            if (err) return console.log(err.message)
            var deliever_fee = 150;
            var orderdetail_length = JSON.parse(JSON.stringify(results)).length
            var sum = parseInt(results[0].order_total)// 商品總額
            var product_quantity = 0; // 計算商品數
            var order_total = sum + deliever_fee // 訂單總額
            for (let i = 0; i < orderdetail_length; i++) {
                product_quantity = parseInt(results[i].quantity) + product_quantity
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
        var order_date = new Date()
        // 資料庫可能要加一欄 recipient_address_code
        var sql = `UPDATE orderlist Customize order_date = ?, recipient = ?, recipient_address = ?, recipient_phone = ?, recipient_email = ?, arrive_date = ?, payment_type = '到貨付款', order_status ='待出貨' WHERE uid = ?`
        conn.query(sql, [order_date, recipient, address, tel, email, arrive_date, uid], (err, results) => {
            if (err) return console.log(err.message)
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
app.post('/addToCart', function (req, res) {
    const { productId, price, quantity } = req.body;
    const userId = req.session.userId;

    // 查詢關於客製化的資料 (c_detail2)
    const getCdetail = `
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

        // 查詢產品的資料 (product)
        const getProduct = `
        SELECT *
        FROM product
        WHERE pid = ?
      `;
        conn.query(getProduct, [productId], function (err, productResult) {
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
            conn.query(inOD, [cdetail.cdetailid, productId, quantity, totalPrice, product.product_name, product.price], function (err, insertResult) {
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
    var sql = `UPDATE  user Customize uname =?,umobile=?,ubirth =? WHERE uid = ?`;
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

app.get('/cart/count', (req, res) => {
    if (!req.session.user) {
        let cartCount = 0
        res.json({ cartCount });
    } else {
        const uemail = req.session.user.email;
        // 從 MySQL 資料庫中查詢使用者的購物車商品數量
        conn.query(`select * from user where uemail = ?`, [uemail], (err, results) => {
            if (err) {
                console.error('Error fetching cart count:', err);
                res.status(500).json({ error: 'Error fetching cart count' });
            } else {
                let uid = results[0].uid
                conn.query('SELECT * FROM orderlist inner join oderdetails on orderlist.oid = oderdetails.oid where uid = ? and order_status = "購物車"', [uid], (err, results) => {
                    if (err) return console.log(err.message)
                    var orderdetail_length = JSON.parse(JSON.stringify(results)).length
                    var cartCount = 0; // 計算商品數
                    for (let i = 0; i < orderdetail_length; i++) {
                        cartCount = results[i].quantity + cartCount
                    }
                    res.json({
                        cartCount
                    });
                })
            }
        });
    }
});
app.post('/cart/add', (req, res) => {
    if (!req.session.user) {
        let cartCount = 0
        res.json({ cartCount });
    } else {
        const uemail = req.session.user.email;
        let total_count = req.body.total_count
        // 從 MySQL 資料庫中查詢使用者的購物車商品數量
        conn.query(`select * from user where uemail = ?`, [uemail], (err, results) => {
            if (err) {
                console.error('Error fetching cart count:', err);
                res.status(500).json({ error: 'Error fetching cart count' });
            } else {
                let uid = results[0].uid
                conn.query('SELECT * FROM orderlist inner join oderdetails on orderlist.oid = oderdetails.oid  inner join c_detail2 on oderdetails.cdetailid = c_detail2.cdetailid where uid = ? and order_status = "購物車"', [uid], (err, results) => {
                    if (err) return console.log(err.message)
                    var orderdetail_length = JSON.parse(JSON.stringify(results)).length
                    var cartCount = 0; // 計算商品數
                    for (let i = 0; i < orderdetail_length; i++) {
                        cartCount = results[i].quantity + cartCount
                    }
                    res.json({
                        cartCount
                    });
                })
            }
        });
    }
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
        // console.log('已登入')
        next()
    } else {
        console.log('not authenticated')
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
    var uid = res.locals.uid;
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