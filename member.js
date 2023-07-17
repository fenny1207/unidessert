const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const bcrypt = require('bcrypt');
const saltRounds = 10; // 設定 salt 的複雜度，數字越大越安全，但計算時間也越長
const { sendEmail } = require('./routes/nodemailer');
const { generateVCode } = require('./routes/nodemailer');
const session = require('express-session');
const app = express();
const port = 5678;

// 設定 EJS 為視圖引擎
app.set('view engine', 'ejs');

// 把media移到根目錄
app.use(express.static('media', { 'extensions': ['html', 'css'] }));
// 解析表單資料的中介軟體
app.use(bodyParser.urlencoded({ extended: true }));

// 資料庫連線設定
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'unidessert'
});

// 建立資料庫連線
connection.connect((err) => {
  if (err) {
    console.error('無法連接到資料庫:', err);
  } else {
    console.log('已成功連接到資料庫');
  }
});

//設置session
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 5 * 60 * 1000 // 5 分鐘的過期時間
  }
}));


app.get('/', function (req, res) {
  res.render('index.ejs');
})

app.get('/user', (req, res) => {
  res.render('user.ejs');
})

const registerTime = () => {
  const date = new Date();
  const mm = date.getMonth() + 1;
  const dd = date.getDate();
  const hh = date.getHours();
  const mi = date.getMinutes();
  const ss = date.getSeconds();

  return [date.getFullYear(), "-" +
    (mm > 9 ? '' : '0') + mm, "-" +
    (dd > 9 ? '' : '0') + dd, " " +
    (hh > 9 ? '' : '0') + hh, ":" +
    (mi > 9 ? '' : '0') + mi, ":" +
    (ss > 9 ? '' : '0') + ss
  ].join('');
}


// 在註冊路由之前定義處理驗證碼的路由
app.post('/verify', (req, res) => {
  const email = req.body.email;

  // 將email存儲在session中
  req.session.email = email;
  
  // 生成驗證碼
  const verificationCode = generateVCode();

  // 將驗證碼存儲在 session 中
  req.session.verificationCode = verificationCode;

  // 寄送驗證郵件
  sendEmail(email, verificationCode)
    .then(() => {
      // 郵件發送成功，返回成功訊息給前端
      res.json({ message: '驗證郵件已成功發送' });
    })
    .catch(error => {
      // 郵件發送失敗，處理錯誤
      console.error('無法發送驗證郵件:', error);
      res.status(500).json({ message: '無法發送驗證郵件' });
    });
});

// 註冊路由
app.post('/register', (req, res) => {
  const { name, email, password, verificationCode } = req.body;

  // 檢查使用者電子信箱是否已存在於資料庫
  const checkQuery = 'SELECT * FROM user WHERE uemail = ?';

  connection.query(checkQuery, [email], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      // 使用者電子信箱已存在
      res.render('user', { error: true, title: "註冊失敗", message: 'Email 已經被註冊過了', showAlert: false });
    } else {
      // 驗證碼比對
      if (!req.session || !req.session.verificationCode || verificationCode !== req.session.verificationCode) {
        // 驗證碼不正確，返回錯誤提示給使用者
        res.render('user', { error: true, title: "驗證失敗", message: '驗證碼不正確', showAlert: false });
        return;
      }

      // 生成加密密碼
      bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) throw err;

        const hashedPassword = hash;
        const umembertime = registerTime();

        const insertQuery = 'INSERT INTO user (uemail, upwd, uname,  umembertime) VALUES (?, ?, ?, ?)';
        connection.query(insertQuery, [email, hashedPassword, name, umembertime], (err) => {
          if (err) throw err;

          // 清除 session 中的驗證碼資料
          req.session.verificationCode = null;

          // 寄送驗證郵件給使用者註冊的電子信箱
          sendEmail(email, '註冊成功')
            .then(() => {
              // 郵件發送成功，重新導向到登入頁面
              res.render('user', { error: false, title: "註冊成功", message: '請重新登入', showAlert: true });
            })
            .catch(error => {
              // 郵件發送失敗，處理錯誤
              console.error('無法發送註冊成功郵件:', error);
              res.status(500).render('user', { error: true, title: "註冊成功", message: '無法發送註冊成功郵件', showAlert: true });
            });
        });
      });
    }
  });
});

// // 在註冊路由之前定義處理驗證碼的路由
// app.post('/verify', (req, res) => {
//   const { email } = req.body;

//   // 生成驗證碼
//   const verificationCode = generateVCode();

//   // 將驗證碼存儲在 session 中
//   req.session.verificationCode = verificationCode;

//   // 寄送驗證郵件
//   sendEmail(email, verificationCode)
//     .then(() => {
//       // 郵件發送成功，返回成功訊息給前端
//       res.json({ message: '驗證郵件已成功發送' });
//     })
//     .catch(error => {
//       // 郵件發送失敗，處理錯誤
//       console.error('無法發送驗證郵件:', error);
//       res.status(500).json({ message: '無法發送驗證郵件' });
//     });
// });

// // 註冊路由
// app.post('/register', (req, res) => {
//   const { name, email, mobile, password, verificationCode } = req.body;

//   // 檢查使用者電子信箱是否已存在於資料庫
//   const checkQuery = 'SELECT * FROM user WHERE uemail = ?';

//   connection.query(checkQuery, [email], (err, results) => {
//     if (err) throw err;

//     if (results.length > 0) {
//       // 使用者電子信箱已存在
//       res.render('user', { error: true, title: "註冊失敗", message: 'Email 已經被註冊過了', showAlert: false });
//     } else {
//       // 驗證碼比對
//       if (!req.session || !req.session.verificationCode || verificationCode !== req.session.verificationCode) {
//         // 驗證碼不正確，返回錯誤提示給使用者
//         res.render('user', { error: true, title: "驗證失敗", message: '驗證碼不正確', showAlert: false });
//         return;
//       }

//       // 生成加密密碼
//       bcrypt.hash(password, saltRounds, (err, hash) => {
//         if (err) throw err;

//         const hashedPassword = hash;
//         const umembertime = registerTime();

//         const insertQuery = 'INSERT INTO user (uemail, upwd, uname,  umembertime) VALUES (?, ?, ?, ?, ?)';
//         connection.query(insertQuery, [email, hashedPassword, name,  umembertime], (err) => {
//           if (err) throw err;

//           // 清除 session 中的驗證碼資料
//           req.session.verificationCode = null;

//           // 註冊成功，重新導向到登入頁面
//           res.render('user', { error: false, title: "註冊成功", message: '請重新登入', showAlert: true });
//         });
//       });
//     }
//   });
// });




// app.post('/register', (req, res) => {
//   const { name, email, mobile, password } = req.body;

//   // 檢查使用者電子信箱是否已存在於資料庫
//   const checkQuery = 'SELECT * FROM user WHERE uemail = ?';
//   connection.query(checkQuery, [email], (err, results) => {
//     if (err) throw err;

//     if (results.length > 0) {
//       // 使用者電子信箱已存在
//       res.render('user', { error: true, title: "註冊失敗", message: 'Email 已經被註冊過了', showAlert: false });
//     } else {
//       const verificationCode = generateVCode();

//       // 寄送驗證郵件
//       sendEmail(email, verificationCode)
//         .then(() => {
//           // 郵件發送成功，進行註冊
//           bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
//             const umembertime = registerTime();

//             // 使用者電子信箱可用，將資料插入資料庫
//             const insertQuery = 'INSERT INTO user (uemail, upwd, uname, umobile, umembertime) VALUES (?, ?, ?, ?, ?)';
//             connection.query(insertQuery, [email, hashedPassword, name, mobile, umembertime], (err) => {
//               if (err) throw err;

//               // 清除 session 中的驗證碼資料
//               req.session.verificationCode = null;

//               // 註冊成功，重新導向到登入頁面
//               res.render('user', { error: false, title: "註冊成功", message: '請重新登入', showAlert: true });
//             });
//           });
//         })
//         .catch(error => {
//           // 郵件發送失敗，處理錯誤
//           console.error('無法發送驗證郵件:', error);
//           res.render('user', { error: true, title: "註冊失敗", message: '無法發送驗證郵件', showAlert: false });
//         });
//     }
//   });
// });


// app.post('/register', (req, res) => {
//   const { name, email, mobile, password } = req.body;
//   const verificationCode = generateVCode();
//   // 檢查使用者電子信箱是否已存在於資料庫
//   const checkQuery = 'SELECT * FROM user WHERE uemail = ?';
//   connection.query(checkQuery, [email], (err, results) => {
//     if (err) throw err;

//     if (results.length > 0) {
//       // 使用者電子信箱已存在
//       res.render('user', { error: true, title: "註冊失敗", message: 'Email 已經被註冊過了', showAlert: false });
//     } else {
//       // 寄送驗證郵件
//       sendEmail(email, verificationCode)
//         .then(() => {
//           // 郵件發送成功，進行註冊
//           bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
//             const umembertime = registerTime();

//             // 使用者電子信箱可用，將資料插入資料庫
//             const insertQuery = 'INSERT INTO user (uemail, upwd, uname, umobile, umembertime) VALUES (?, ?, ?, ?, ?)';
//             connection.query(insertQuery, [email, hashedPassword, name, mobile, umembertime], (err) => {
//               if (err) throw err;

//               // 清除 session 中的驗證碼資料
//               req.session.verificationCode = null;

//               // 註冊成功，重新導向到登入頁面
//               res.render('user', { error: false, title: "註冊成功", message: '請重新登入', showAlert: true });
//             });
//           });
//         })
//         .catch(error => {
//           // 郵件發送失敗，處理錯誤
//           console.error('無法發送驗證郵件:', error);
//           res.render('user', { error: true, title: "註冊失敗", message: '無法發送驗證郵件', showAlert: false });
//         });
//     }
//   });
// });







app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const selectUserQuery = 'SELECT * FROM user WHERE uemail = ?';

  connection.query(selectUserQuery, [email], (err, results) => {
    if (err) {
      res.render('user', { error: true, title: "登入失敗", message: 'Email 尚未被註冊', showAlert: false });

    } else {
      const hashedPassword = results[0].upwd;

      bcrypt.compare(password, hashedPassword, (err, isMatch) => {
        if (err) throw err;

        if (isMatch) {
          // 密碼正確，登入成功
          const user = {
            id: results[0].uid,
            email: results[0].uemail,
            name: results[0].uemail // 這裡將名字改為使用者的電子郵件地址，這樣即使使用者名字重複，也能確保每個使用者都有唯一的識別符。
          };

          req.session.user = user; // 將使用者資訊儲存到 session 中
          // 密碼正確，登入成功
          res.render('user', { error: false, title: "登入成功", message: '歡迎回來', showAlert: true });


        } else {
          // 密碼不正確
          res.render('user', { error: true, title: "登入失敗", message: '密碼輸入錯誤', showAlert: false });
        }
      });
    }
  });
});

app.get('/protected', (req, res) => {
  if (req.session && req.session.user) {
    // session 存在且使用者已登入
    res.render('protected', { user: req.session.user });
  } else {
    // session 不存在或使用者未登入，重新導向到登入頁面
    res.redirect('/user');
  }
});

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
        res.redirect('/login');
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

// 啟動伺服器
app.listen(port, () => {
  var d = new Date();
  console.log('胖丁: 伺服器啟動中' + d.toLocaleTimeString());
});

module.exports = app;