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
        data.append("file", document.getElementById('file').files[0])

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





    $('.fileBox span').on('click', function(e) {
        $('.imgFile').click();
    })

    $('.imgFile').change(function(e) {
        let img = e.target.files[0];
        let type = img.type.toLowerCase();
        if(type.indexOf("image/") == -1) {
            layer.open({
                title: '提示',
                content: '请上传图片类型的文件'
            })
            return;
        }
        if(img.size > 1024 * 1024 * 10) {
            layer.open({
                title: '提示'
                ,content: '图片大小不能超过 10MB!'
            })
            return;
        }
        let imgUrl = URL.createObjectURL(img);
        $('.preview img').attr('src', imgUrl);
    })
    $('.generateBtn').on('click', function(e) {
        if(!$('.imgFile').val()) {
            layer.open({
                title: '提示'
                ,content: '请先选择图片'
            })
            return;
        }
        let data = new FormData();
        let pageInfo = {
            baseHeight: $.trim($('.baseHeight').val()),
            title: $.trim($('.pageTitle').val()),
            keywords: $.trim($('.pageKeywords').val()),
            type: $('.pageType :radio:checked').val(),
            descriptipn: $.trim($('.pageDescriptipn').val())
        }
        if(!pageInfo.baseHeight) {
            layer.open({
                title: '提示'
                ,content: '请输入切块基准高度'
            })
        }else if(!/^\d+$/.test(pageInfo.baseHeight)) {
            layer.open({
                title: '提示'
                ,content: '请输入纯数字'
            })
            return;
        }
        if(!pageInfo.title) {
            layer.open({
                title: '提示'
                ,content: '请输入页面title'
            })
            return;
        }
        data.append("file", document.querySelector('.imgFile').files[0]);
        data.append("pageInfo", pageInfo);
        $.ajax({
            url: "/upload1",
            type: "POST",
            processData: false,
            contentType: false,
            data: data,
            success : function(data){
                console.log(data)
            }
        })
    })
})