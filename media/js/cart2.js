function togglePaymentInfo(option) {
    var creditCardInfo = document.getElementById('credit-card-info');
    // var cashInfo = document.getElementById('cash-info');

    if (option === 'credit-card') {
        creditCardInfo.style.display = 'block';
        // cashInfo.style.display = 'none';
    } else if (option === 'cash') {
        creditCardInfo.style.display = 'none';
        // cashInfo.style.display = 'block';
    }
}

function toggleBillInfo(option) {
    // var companyBillInfo = document.getElementById('company-bill-info');
    var cloudInvoiceInfo = document.getElementById('cloud-invoice-info');
    var donateBillInfo = document.getElementById('donate-bill-info');
    var phoneInfo = document.getElementById("phoneInfo");
    var naturalInfo = document.getElementById("naturalInfo");

    if (option === 'companyBill') {
        // companyBillInfo.style.display = 'block';
        cloudInvoiceInfo.style.display = 'none';
        donateBillInfo.style.display = 'none';
        phoneInfo.style.display = 'none';
        naturalInfo.style.display = 'none';

    } else if (option === 'cloudInvoice') {
        // companyBillInfo.style.display = 'none';
        cloudInvoiceInfo.style.display = 'block';
        donateBillInfo.style.display = 'none';
        donateBillInfo.removeAttribute('required');
        phoneInfo.style.display = 'block';
        naturalInfo.style.display = 'none';

    } else if (option === 'donateBill') {
        // companyBillInfo.style.display = 'none';
        cloudInvoiceInfo.style.display = 'none';
        donateBillInfo.style.display = 'block';
        phoneInfo.style.display = 'none';
        naturalInfo.style.display = 'none';
    }
}
function toggleCloudInfo() {
    var selectElement = document.getElementById('invoiceTypeSelect');
    var selectedOption = selectElement.options[selectElement.selectedIndex].value;
    var phoneInfo = document.getElementById('phoneInfo');
    var naturalInfo = document.getElementById('naturalInfo');
    var cloudInvoice_input = document.getElementById('cloudInvoice_input');
    var naturalInfo_input = document.getElementById('naturalInfo_input');

    if (selectedOption === 'phoneInvoice') {
        phoneInfo.style.display = 'block';
        cloudInvoice_input.setAttribute('required', true);
        naturalInfo.style.display = 'none';
        naturalInfo_input.removeAttribute('required');
    } else if (selectedOption === 'naturalInvoice') {
        phoneInfo.style.display = 'none';
        cloudInvoice_input.removeAttribute('required');
        naturalInfo.style.display = 'block';
        naturalInfo_input.setAttribute('required', true);
    }
}

// function parentFunction() {
//     validateForm()
//     // console.log(validateForm())
//     // console.log(validatePaymentForm())
//     // console.log(submitForms())
//     submitForms()
// }
function validateForm() {
    var recipient = document.getElementById('recipient').value;
    var address_code = document.getElementById('address_code').value;
    var address = document.getElementById('address').value;
    var tel = document.getElementById('tel').value;
    var email = document.getElementById('email').value;
    var arrive_date = document.getElementById('arrive_date').value;

    // 檢查必填字段是否為空
    if (recipient === '' || address_code === '' || address === '' || tel === '' || email === '' || arrive_date === '') {
        alert('請填寫所有必填資料。');
        return false; // 阻止表單提交
    }
    // 其他自定義驗證邏輯

    return true; // 允許表單提交
}

// function validatePaymentForm() {
//     // 檢查選擇的付款方式
//     var paymentOption = document.querySelector('input[name="payment-option"]:checked');
//     if (!paymentOption) {
//         alert('請選擇付款方式。');
//         return false; // 阻止表單提交
//     }

//     // 檢查信用卡付款方式的字段
//     if (paymentOption.id === 'credit-card') {
//         var creditNumber = document.getElementById('credit-number').value;
//         var expiration_date = document.getElementById('expiration_date').value;
//         var cvn = document.getElementById('cvn').value;

//         if (creditNumber === '' || expiration_date === '' || cvn === '') {
//             alert('請填寫信用卡號碼、有效日期和 CVN。');
//             return false; // 阻止表單提交
//         }
//     }
//     // 其他自定義驗證邏輯...
//     return true; // 允許表單提交
// }

$(document).ready(function () {
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    document.getElementById('arrive_date').min = formattedToday;

    $("#cartform_button").on('click', function (e) {
        // e.preventDefault();
        var recipient = document.getElementById('recipient').value
        var address_code = document.getElementById('address_code').value
        var address = document.getElementById('address').value
        var tel = document.getElementById('tel').value
        var email = document.getElementById('email').value
        var bill_option_checked = document.getElementById('invoiceTypeSelect').value

        // console.log(document.getElementById('cloud-invoice-info').style.display)
        if(document.getElementById('cloud-invoice-info').style.display === 'block'){
            if( bill_option_checked === 'naturalInvoice' ) {
                var bill_option_input = document.getElementById('naturalInfo_input').value
                var bill_option = '自然人條碼'
                console.log(bill_option)
                console.log(bill_option_input)
            } else {
                bill_option_input = document.getElementById('cloudInvoice_input').value
                bill_option = '手機條碼'
                console.log(bill_option)
                console.log(bill_option_input)
            }
        } else {
            bill_option = '捐贈發票'
            bill_option_input = document.getElementById('donate_bill_option').value
            console.log(bill_option)
            console.log(bill_option_input)
        }
        let data = {
            recipient: recipient,
            recipient_address_code: address_code,
            address_code: address_code,
            address: address,
            tel: tel,
            email: email,
            bill_option: bill_option,
            bill_option_input: bill_option_input
        }
        $.ajax({
            url: "http://localhost:5678/cart/fillout",
            method: "post",
            contentType: "application/json",
            data: JSON.stringify(data),
            // success: function (res) {
            //     console.log('表單填寫完成')
            // },
            error: function(err){
                alert("發生錯誤 請重新操作");
            }
        })
        window.location.assign('/')
    })
})

// function submitForms() {

//     // 檢查每個表單的有效性
//     if (shippingForm.checkValidity() && paymentForm.checkValidity() && invoiceForm.checkValidity()) {
//         // 創建一個新的FormData對象來存儲所有表單數據
//         var formData = new FormData();
//         formData.append(shippingForm);
//         formData.append(paymentForm);
//         formData.append(invoiceForm);

//         console.log(formData)
//         console.log(shippingForm)

//         // 將每個表單的數據添加到總的FormData對象中
//         // for (var pair of shippingFormData.entries()) {
//         //     formData.append(pair[0], pair[1]);
//         // }

//         // for (var pair of paymentFormData.entries()) {
//         //     formData.append(pair[0], pair[1]);
//         // }

//         // for (var pair of invoiceFormData.entries()) {
//         //     formData.append(pair[0], pair[1]);
//         // }

//         // 使用XMLHttpRequest對象發送表單數據
//         // var xhr = new XMLHttpRequest();
//         // xhr.open('POST', 'your-server-url');
//         // xhr.onreadystatechange = function () {
//         //     if (xhr.readyState === XMLHttpRequest.DONE) {
//         //         if (xhr.status === 200) {
//         //             // 請求成功處理
//         //             console.log('表單提交成功！');
//         //         } else {
//         //             // 請求失敗處理
//         //             console.log('表單提交失敗。');
//         //         }
//         //     }
//         // };
//         // xhr.send(formData);
//         // } else {
//         // 表單數據無效，進行相應的錯誤處理
//         // console.log('表單數據無效，進行相應的錯誤處理。');
//     }
// }



