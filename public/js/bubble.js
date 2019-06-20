$(function () {
    $("#uploadBtn").on("change",function () {
        let data = new FormData()
        console.log(this)
        data.append("file", document.getElementById('uploadBtn').files[0])
        $.ajax({
            url: '/upload',
            type: 'POST',
            contentType: 'application/x-www-form-urlencoded',
            processData:false,
            mimeType: "multipart/form-data",
            data: data,
        })
        .done(function() {
            console.log("success")
        })
        .fail(function() {
            console.log("error")
        })
        .always(function() {
            console.log("complete")
        })
        
    })

    $('.file').change(function(e) {
        $(this).addClass('change')
    })
    $('.submit').on('click', () => {
        if(!$('.file').val()) {
            alert('请先选择图片')
            return false
        }
        $('#form').submit()
    })
})