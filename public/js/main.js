$(function () {
    let linkInfor = [];
/*     $("#uploadBtn").on("change",function () {
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

    }) */





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
        let index = 0;
        $('.preview img').attr('src', imgUrl);
        $('.preview img').selectAreas({
            minSize: [50, 50],
            onChanged: function(event, id, areas) {
                let arr = $(this).selectAreas('relativeAreas');
                let ratio = document.querySelector('#previewImg').naturalWidth / 500;
                let vw_ratio = document.querySelector('#previewImg').naturalWidth / 100
                if(areas.length === $('.link').length + 1) {
                    index ++;
                    let _link = '<div class="formItem">'+
                    '                <label for="">第' + index + '块区域的链接：</label><input type="text" class="link" placeholder="请输入链接地址" value="https://">'+
                    '            </div>';
                    $('.linkBox').append(_link)
                }
                
                let newArr = arr.map((item) => {
                    let model = {
                        id: item.id,
                        x: (item.x * ratio / vw_ratio) + 'vw' ,
                        y: (item.y * ratio / vw_ratio) + 'vw',
                        z: item.z,
                        width: (item.width * ratio /vw_ratio) + 'vw',
                        height: (item.height * ratio /vw_ratio) + 'vw',
                        pxHeight: item.height * ratio
                    }
                    return model
                });
                linkInfor = newArr;
                // let newArr = arr.map((item) => {
                //     let model = {
                //         id: item.id,
                //         x: item.x - 360,
                //         y: item.y,
                //         z: item.z,
                //         width: item.width,
                //         height: item.height
                //     }
                //     return model
                // })
            },
            width: 500,
            areas: []
        });
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
            description: $.trim($('.pageDesc').val())
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
        var layerIndex = layer.load();
        $('.link').each(function(linkIndex) {
            var value = $.trim($(this).val());
            linkInfor.forEach(function(linkPosition, positionIndex) {
                if(linkIndex === positionIndex) {
                    linkPosition.link = value;
                }
            })
        });
        data.append("file", document.querySelector('.imgFile').files[0]);
        data.append("baseHeight", pageInfo.baseHeight);
        data.append("title", pageInfo.title);
        data.append("keywords", pageInfo.keywords);
        data.append("description", pageInfo.description);
        data.append("type", pageInfo.type);
        data.append("linkInfor", JSON.stringify(linkInfor));
        data.append("naturalWidth", document.querySelector('#previewImg').naturalWidth);
        data.append("naturalHeight", document.querySelector('#previewImg').naturalHeight);
        $.ajax({
            url: "/upload1",
            type: "POST",
            processData: false,
            contentType: false,
            data: data,
            success : function(data){
                if(data.code) {
                    layer.alert('页面地址：' + data.data.url, {icon: 1});
                }
            },
            complete: function() {
                layer.close(layerIndex);
            }
        })
    })
})