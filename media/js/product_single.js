$(document).ready(function () {
    $(document).on('click', function (e) {
        target_id = e.target.id.substr(18)
        // 抓取第幾個產品傳入後端，依第幾個產品去SELECT後取值[i]再INSERT INTO進資料庫
        // e.preventDefault();
        let quantity = 1
        let data = {
            "pid": target_id,
            "quantity": quantity
        }
        $.post({
            url: "http://localhost:5678/product/single",
            method: "post",
            contentType: "application/json",
            data: JSON.stringify(data),
            success: function (res) {
                if(res) {
                    console.log('表示未登入');
                    return alert('請先登入再進行此操作');
                }
                alert('成功加入購物車')
            },
            error: function (err) {
                alert("發生錯誤");
            }
        })
    })
})