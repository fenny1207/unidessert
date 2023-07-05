"use strict";

var offsetTop;
var pagetopposition = $('.page-top-position').offset().top;
$(window).scroll(function () {
  offsetTop = $(window).scrollTop(); // 捲軸高度>=900，會出現page-top的按鈕

  if (offsetTop >= 900) {
    $('.page-top').addClass('active');
  } else {
    $('.page-top').removeClass('active');
  }
}); //scroll end
// 點按page-top回到最上方

// var offsetService;
// var pagetopposition = $('.page-service-position').offset().top;
// $(window).scroll(function () {
//     offsetService = $(window).scrollTop(); // 捲軸高度>=900，會出現page-top的按鈕

//   if (offsetService >= 900) {
//     $('.page-service').addClass('active');
//   } else {
//     $('.page-service').removeClass('active');
//   }
// }); //scroll end
// // 點按page-top回到最上方

//客服
// var modal = document.getElementById('id01');

// When the user clicks anywhere outside of the modal, close it
// window.onclick = function(event) {
//     if (event.target == modal) {
//         modal.style.display = "none";
//     }
// }

$('.member_link>a').on('click', function(e){
  e.preventDefault()
  $(this).addClass('active')
  $(this).siblings().removeClass('active')
  console.log($(this).attr('href'))
  $( $(this).attr('href') ).addClass('active')
  $( $(this).attr('href') ).siblings().removeClass('active')
});//.tab-link>a end

$('.member_linkleft>a').on('click', function(e){
  e.preventDefault()
  $(this).addClass('active')
  $(this).siblings().removeClass('active')
  console.log($(this).attr('href'))
  $( $(this).attr('href') ).addClass('active')
  $( $(this).attr('href') ).siblings().removeClass('active')
});//.tab-link>a end

//購物車
$(document).ready(function () {
  $("#addtocart").on("click", function () {
    alert('gg')
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
    }, 1000);
  });
});


// new WOW().init();