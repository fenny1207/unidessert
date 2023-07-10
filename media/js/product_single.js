$(document).ready(function () {
    $("#addtocart_single").on('click', function(e) {
        e.preventDefault();
        let amount = document.getElementById('productCount_input').value
        // console.log(amount)
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