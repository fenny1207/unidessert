// "use strict";

var offsetTop;
var pagetopposition = $('.page-top-position').offset();
$(window).scroll(function () {
  offsetTop = $(window).scrollTop(); // 捲軸高度>=900，會出現page-top的按鈕

  if (offsetTop >= 200) {
    $('.page-top').addClass('active');
  } else {
    $('.page-top').removeClass('active');
  }
}); //scroll end
// 點按page-top回到最上方

// $('.member_link>a').on('click', function(e){
//   e.preventDefault()
//   $(this).addClass('active')
//   $(this).siblings().removeClass('active')
//   console.log($(this).attr('href'))
//   $( $(this).attr('href') ).addClass('active')
//   $( $(this).attr('href') ).siblings().removeClass('active')
// });//.tab-link>a end

// $('.member_linkleft>a').on('click', function(e){
//   e.preventDefault()
//   $(this).addClass('active')
//   $(this).siblings().removeClass('active')
//   console.log($(this).attr('href'))
//   $( $(this).attr('href') ).addClass('active')
//   $( $(this).attr('href') ).siblings().removeClass('active')
// });//.tab-link>a end

//購物車
$(document).ready(function () {
  let addtocart = document.querySelectorAll('.addtocart');

  for (var i = 0; i < addtocart.length; i++) {
      addtocart[i].addEventListener('click', function (e) {

          var button = $(this);
          var cart = $("#cart");
          var cartTotal = cart.attr("data-totalitems");
          var newCartTotal = parseInt(cartTotal) + 1;

          button.addClass("sendtocart");
          setTimeout(function () {
              button.removeClass("sendtocart");
              cart.addClass("shake").attr("data-totalitems", newCartTotal);
              setTimeout(function () {
                  cart.removeClass("shake");
              }, 500);
          }, 300);
      }, false);
  }
});

// 改寫上面的購物車
// 確認使用者登入後才可以加商品到購物車，購物車上的數字才可以加 1
// 如果沒有登入，購物車上的數字會保持為 0
// $(document).ready(function () {
//   let addtocart = document.querySelectorAll('.addtocart');
//   $.post({
//     url: "http://localhost:5678/product/single",
//     method: "post",
//     contentType: "application/json",
//     // data: JSON.stringify(data),
//     success: function (res) {
//       // console.log(res)
//       if (res) {
//         return
//       }
//       for (var i = 0; i < addtocart.length; i++) {
//         addtocart[i].addEventListener('click', function (e) {
//           // console.log(e)
//           var button = $(this);
//           var cart = $("#cart");
//           var cartTotal = cart.attr("data-totalitems");
//           var newCartTotal = parseInt(cartTotal) + 1;
    
//           button.addClass("sendtocart");
//           setTimeout(function () {
//             button.removeClass("sendtocart");
//             cart.addClass("shake").attr("data-totalitems", newCartTotal);
//             setTimeout(function () {
//               cart.removeClass("shake");
//             }, 500);
//           }, 300);
//         }, false);
//       }
//     },
//     error: function (err) {
//       alert("發生錯誤");
//     }
//   })
// });


// new WOW().init();