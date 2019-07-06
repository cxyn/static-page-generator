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
    $('.submit1').on('click', () => {
        if(!$('.file').val()) {
            layer.open({
                title: '提示'
                ,content: '请先选择图片'
            })
            return false
        }
        layer.load(1, {
            shade: [0.5,'#999']
        })
        $('#form').submit()
    })
    $('.submit2').on('click', (e) => {
        e.preventDefault()
        if(!$('.file').val()) {
            layer.open({
                title: '提示'
                ,content: '请先选择图片'
            })
            return false
        }

        let data = new FormData()
        data.append("file",document.getElementById('file').files[0])

        $.ajax({
            url : "/upload1",
            type : "POST",
            processData: false,
            contentType: false,
            data : data,
            success : function(data){
                console.log(data)
                $('.imgBox img').attr('src', data.result)
            }
        })

    })
})