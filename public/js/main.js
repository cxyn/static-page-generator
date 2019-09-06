$(function () {
    var page = page || {};
    let linkInfor = [];
    page.showImg = function(img) {
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
        $('.previewTps').addClass('hide');
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
                    let _link = '<div class="formItem linkItem' + id + '">'+
                    '                <label for="">第' + index + '块区域的链接：</label><input type="text" class="link" placeholder="请输入链接地址" value="">'+
                    '            </div>';
                    $('.linkBox').append(_link)
                }
                
                let newArr = arr.map((item) => {
                    let model = null;
                    let radioValue = $('.pageType :radio:checked').val();
                    if (radioValue == 'mobile') {
                        model = {
                            id: item.id,
                            x: (item.x * ratio / vw_ratio) + 'vw' ,
                            y: (item.y * ratio / vw_ratio) + 'vw',
                            z: item.z,
                            width: (item.width * ratio / vw_ratio) + 'vw',
                            height: (item.height * ratio / vw_ratio) + 'vw',
                            pxHeight: item.height * ratio
                        }
                    } else if (radioValue == 'pc') {
                        model = {
                            id: item.id,
                            x: (item.x * ratio - 360) + 'px',
                            y: (item.y * ratio) + 'px',
                            z: item.z,
                            width: (item.width * ratio) + 'px',
                            height: (item.height * ratio) + 'px',
                            pxHeight: item.height * ratio
                        }
                    }
                    return model
                });
                linkInfor = newArr;
                $('.linkBox :text').removeClass('on').blur();
                $('.linkItem' + id).find(':text').addClass('on').focus();
            },
            onDelete: function(event, id, areas) {
                $('.linkItem' + id).remove();
            },
            width: 500,
            areas: []
        });
    }
    $('.preview').on('click', function(e) {
        if (!$('.imgFile').val()) {
            $('.imgFile').click();
        }
    });

    $('.imgFile').change(function(e) {
        let img = e.target.files[0];
        page.showImg(img)
    });

    $(document).on({ 
        dragleave: function(e) {
            e.preventDefault(); 
        }, 
        drop: function(e) {
            e.preventDefault(); 
        }, 
        dragenter: function(e) {
            e.preventDefault(); 
        }, 
        dragover: function(e) {
            e.preventDefault(); 
        } 
    }); 
    $('.preview').on({
        drop: function(e) {
            let img = e.originalEvent.dataTransfer.files[0];
            $('.previewTps').addClass('hide');
            page.showImg(img)
        },
        dragover: function(e) {
            $('.previewTps').css('color', '#f70');
        },
        dragleave: function(e) {
            $('.previewTps').css('color', '#aaa');
        }
    });

    $(document).on('blur', '.link', function(e) {
        $(this).removeClass('on');
    });

    // 点击填充数据
    $('.uploadExcel').on('click', function() {
        $('.excel').click();   
    });

    // 上传excel
    $('.excel').on('change', function(e) {
        let type = this.files[0].type;
        console.log(type.includes('sheet'));
        if (!type.includes('excel') && !type.includes('sheet')) {
            layer.alert('请上传 .xls 或者 .xlsx 文件', {
                icon: 0
              });
            return;
        }
        let data = new FormData();
        data.append('file', this.files[0]);
        $.ajax({
            url: "/uploadLocal",
            type: "POST",
            processData: false,
            contentType: false,
            data: data,
            cache: false,
            success : function(data){
                console.log(data)
                if (data.code) {
                    $('.uploadExcel').addClass('hide');
                    $('.fillUrl').removeClass('hide');
                    page.excelPath = data.data.url;
                } else {
                    layer.alert(data.message, {
                        icon: 0
                    });
                }
            }
        })
    });
    
    // 点击填充数据
    $('.fillUrl').on('click', function() {
        $.ajax({
            url: "/readXlsx",
            type: "GET",
            data: page.excelPath,
            success : function(data){
                if (data.code) {
                    console.log(data)
                    if ($('.select-areas-background-area').length) {
                        if ($('.select-areas-background-area').length > data.data.length) {
                            layer.alert('选区数量多于excel表里的url数量', {
                                icon: 1
                            });
                       } else if ($('.select-areas-background-area').length < data.data.length){
                            layer.alert('选区数量少于excel表里的url数量', {
                                icon: 1
                            });
                       } else {
                           $('.link').each(function(index, item) {
                               $(item).val(data.data[index]);
                           })
                       }
                    } else {
                        layer.alert('请上传预览图片，如若已上传请框选相应数量的链接区块', {
                            icon: 0
                        });
                    }
                   
                }
            }
        })    
    });

    // 点击生成页面
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
            url: "/generatorPage",
            type: "POST",
            processData: false,
            contentType: false,
            data: data,
            cache: false,
            success : function(data){
                if(data.code) {
                    layer.alert('页面生成成功，点击【确定】跳转到活动页面', {
                        icon: 1,
                        yes: function(index) {
                            layer.close(index);
                            window.open(data.data.url, '_blank');
                        }
                    });
                }
            },
            complete: function() {
                layer.close(layerIndex);
            }
        })
    });
})