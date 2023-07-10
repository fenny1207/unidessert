
function selectTab(tabIndex) {
    //Hide All Tabs
    document.getElementById("tab1Content").style.display = "none";
    document.getElementById("tab2Content").style.display = "none";
    //Show the Selected Tab
    document.getElementById("tab" + tabIndex + "Content").style.display = "block";
}
function selectTabStyle(tabIndex) {
    document.getElementById("tab1").style.borderBottom = "none";
    document.getElementById("tab2").style.borderBottom = "none";
    document.getElementById("tab" + tabIndex).style.borderBottom = "5px solid #b44a60";
}
function changeImg(i) {
    var side_pic = document.getElementById('sidePic' + i);
    var attrSrc = side_pic.getAttribute('src');
    document.getElementById('mainPic').setAttribute('src', attrSrc);

}
$(document).ready(function () {
    let count = 1
    document.getElementById('productCount').innerHTML = count
    document.getElementById('productCount_input').value = count
});
function plus() {
    // var product_quantity = 1;
    let product_quantity = parseInt(document.getElementById('productCount').innerHTML);
    var sum = product_quantity + 1
    document.getElementById('productCount').innerHTML = sum;
    document.getElementById('productCount_input').value = sum
}
function minus() {
    let product_quantity = parseInt(document.getElementById('productCount').innerHTML);
    let sum;
    if (product_quantity === 1) {
        sum = 1;
    } else {
        sum = product_quantity - 1;
    }
    document.getElementById('productCount').innerHTML = sum;
    document.getElementById('productCount_input').value = sum
}
$(document).ready(function () {
    $("#submit_form").on('submit', function(e) {
        e.preventDefault();
        let amount = document.getElementById('productCount_input').value
        console.log(amount)
        let data = {
                "uid": "1",
                "deliever_fee": "100",
                "order_amout": amount,
                "status": "購物車"
            }
        $.ajax({
            url: "http://localhost:5678/product/productInfo",
            method: "post",
            contentType: "application/json",
            data: JSON.stringify(data),
            // success: function(res) {
            //     console.log("data")
            // }
        })
    })
})

// let data = {
//     "uid": "1",
//     "deliever_fee": "100",
//     "order_total": "390",
//     "order_date": "",
//     "recipient": "",
//     "recipient_address": "",
//     "recipient_phone": "",
//     "recipient_email": "",
//     "arrive_date": "",
//     "payment_type": "",
//     "status": "購物車"
// }
// const addproduct = () => {
//     axios({
//         url: 'http://localhost:5678/product/productInfo',
//         method: 'post',
//         data: data,
//         headers: {
//             "Content-Type": "application/json"
//         }
//     }).then(() => {
//         console.log("success");
//     }).catch(err => {
//         console.log(err.message)
//     })

// }
// $(document).ready(function () {
//     document.getElementById('submit_form').addEventListener('submit', addproduct())
// });

