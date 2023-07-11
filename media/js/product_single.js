$(document).ready(function () {
    $(document).on('click', function (e) {
        target_id = e.target.id.substr(18)
        // 抓取第幾個產品傳入後端，依第幾個產品去SELECT後取值[i]再INSERT INTO進資料庫
        // e.preventDefault();
        let amount = 1
        // console.log(p_name)
        // console.log(p_price)
        let data = {
                "uid": target_id,
                "amount": amount
            }
        $.post({
            url: "http://localhost:5678/product/single",
            method: "post",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function(res) {
                console.log("data")
            }
        })
    })
})