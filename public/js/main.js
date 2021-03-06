$(function () {
    localStorage.removeItem('area')
    var page = page || {};
    page.model = null;
    page.ratio = 0;
    page.vw_ratio = 0;
    page.linkInfor = [];
    page.areaInfo = [];

    // 计算切块尺寸
    page.calSize = function(arr, ratio, vw_ratio) {
        let newArr = arr.map(function(item) {
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
        return newArr;
    }

    // 检测预览图片是否符合所选切图类型
    page.switchRadio = function(type, boundary) {
        boundary = boundary || 1200;
        let width = $('#previewImg').get(0).naturalWidth;
        if(width <= boundary && type === 'pc') {
            layer.open({
                title: '警告',
                icon: 0,
                content: '系统检测到预览图片为移动端页面，<br>系统将会为您自动切换到移动端页面选项',
                closeBtn: 0,
                yes: function(index, layero) {
                    $('#mobile').trigger('click');
                    layer.close(index);
                }
            })
        }
        if(width > boundary && type === 'mobile') {
            layer.open({
                title: '警告',
                icon: 0,
                content: '系统检测到预览图片为PC端页面，<br>系统将会为您自动切换到PC端页面选项',
                closeBtn: 0,
                yes: function(index, layero) {
                    $('#pc').trigger('click');
                    layer.close(index);
                }
            })
        }
    }

    // 预览图片并初始化切图
    page.showImg = function(img) {
        let type = img.type.toLowerCase();
        if(type.indexOf("image/") == -1) {
            layer.open({
                title: '提示',
                content: '请上传图片类型的文件'
            })
            return;
        }
        if(type.indexOf("png") == -1 && type.indexOf("jpg") == -1 && type.indexOf("jpeg") == -1) {
            layer.open({
                title: '提示',
                content: '仅支持jpg和png格式的图片'
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
        let naturalWidth = 0;
        $('.preview img').on('load', function() {
            naturalWidth = $('#previewImg').get(0).naturalWidth;
            page.switchRadio($('.radioBox :radio:checked').val());
        });
        $('.preview img').selectAreas({
            minSize: [50, 50],
            onChanged: function(event, id, areas) {
                page.areaInfo = areas;
                localStorage.setItem('area', JSON.stringify(areas[id]));
                page.model = $(this).selectAreas('relativeAreas');
                page.ratio = naturalWidth / 500;
                page.vw_ratio = naturalWidth / 100;
                if(areas.length === $('.link').length + 1) {
                    index ++;
                    let _link = '<div class="formItem linkItem' + id + '">'+
                    '                <label for="">第' + index + '块区域的链接：</label><input type="text" class="link fillItem" placeholder="请输入链接地址" value="">'+
                    '            </div>';
                    $('.linkBox').append(_link);
                }
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

    // 上传分享缩略图
    page.uploadShareThumbnail = function(img) {
        let type = img.type.toLowerCase();
        if(type.indexOf("image/") == -1) {
            layer.alert('请上传图片类型的文件', {
                icon: 0
            });
            return;
        }
        if(type.indexOf("png") == -1 && type.indexOf("jpg") == -1 && type.indexOf("jpeg") == -1) {
            layer.alert('仅支持jpg和png格式的图片', {
                icon: 0
            });
            return;
        }
        var index = layer.load(3, {
            shade: [0.1, '#000']
        });
        let data = new FormData();
        data.append("file", img);
        $.ajax({
            url: "/uploadShareThumbnail",
            type: "POST",
            processData: false,
            contentType: false,
            data: data,
            cache: false,
            success : function(data){
                layer.close(index);
                if (data.code == 1) {
                    $('.thumbList li').eq($('.thumbList li').length - 2).after('<li><img src="' + data.data + '" alt=""></li>');
                    $('.thumbList li').eq($('.thumbList li').length - 2).click();
                } else {
                    layer.alert(data.msg, {
                        icon: 0
                    });
                    return;
                }
            }
        })
    }

    // 拷贝切块
    page.copyArea = function(selector) {
        let areaOptions = JSON.parse(localStorage.getItem('area'));
        if (areaOptions.width < $('.preview').width() / 2) {
            areaOptions.x += 40;
        } else {
            areaOptions.y += 40;
        }
        
        $(selector).selectAreas('add', areaOptions);
        /* $('<div>').appendTo('.preview').css({
            width: '100%',
            height: '1px',
            backgroundColor: '#f70',
            position: 'absolute',
            left: 0,
            top: '555px'
        }) */
    }

    // 点击预览区域弹出选择文件框
    $('.preview').on('click', function(e) {
        if (!$('.preview img').attr('src')) {
            $('.imgFile').click();
        }
    });

    // 预览区载入图片处理
    $('.imgFile').change(function(e) {
        let img = e.target.files[0];
        img && page.showImg(img);
    });

    // 阻止拖拽默认行为
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
    // 拖拽预览图交互
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

    // url输入框失去焦点交互
    $(document).on('blur', '.link', function(e) {
        $(this).removeClass('on');
    });

    // 点击填充数据
    $('.uploadExcel').on('click', function(e) {
        $('.excel').click();   
    });

    // 上传excel
    $('.excel').on('change', function(e) {
        if (this.files[0]) {
            let type = this.files[0].type;
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
                    if (data.code) {
                        $('.uploadExcel').text('重新上传');
                        $('.fillUrl').removeClass('hide');
                        page.excelPath = data.data.url;
                    } else {
                        layer.alert(data.message, {
                            icon: 0
                        });
                    }
                }
            });
        }
        
    });
    
    // 点击填充数据
    $(document).on('click', '.fillUrl', function() {
        $.ajax({
            url: "/readXlsx",
            type: "GET",
            data: page.excelPath,
            success : function(data){
                if (data.code) {
                    if ($('.select-areas-background-area').length) {
                        if ($('.select-areas-background-area').length > data.data.length - 2) {
                            layer.alert('选区数量多于excel表里的url数量', {
                                icon: 0
                            });
                       } else if ($('.select-areas-background-area').length < data.data.length - 2){
                            layer.alert('选区数量少于excel表里的url数量', {
                                icon: 0
                            });
                       } else {
                           $('.fillItem').each(function(index, item) {
                               $(item).val(data.data[index]);
                           });
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
        if(!$('.preview img').attr('src')) {
            layer.alert('请先选择图片', {
                icon: 0
            });
            return;
        }
        let data = new FormData();
        let pageInfo = {
            baseHeight: $.trim($('.baseHeight').val()),                     // 基准高度
            title: $.trim($('.pageTitle').val()),                           // 标题
            keywords: $.trim($('.pageKeywords').val()),                     // 关键词
            type: $('.pageType :radio:checked').val(),                      // 页面类型 mobile 或者 pc
            description: $.trim($('.pageDesc').val()),                      // 描述
            statistic: $('#statistic').is(':checked')? 1 : 0,               // 是否开启统计             
            share: $('#share').is(':checked')? 1 : 0,                       // 是否开启微信分享
            shareThumbnail: $('.thumbList li.on img').attr('src'),          // 微信分享缩略图
            callAPP: $('#callApp').is(':checked')? 1 : 0,                   // 是否开启唤醒APP
        }
        if(!pageInfo.baseHeight) {
            layer.open({
                title: '提示',
                content: '请输入切块基准高度'
            })
        }else if(!/^\d+$/.test(pageInfo.baseHeight)) {
            layer.open({
                title: '提示',
                content: '请输入纯数字'
            })
            return;
        }
        if(!pageInfo.title) {
            layer.open({
                title: '提示',
                content: '请输入页面title'
            })
            return;
        }
        if ($('#share').is(':checked')) {
            if ($('.thumbList li.on').length == 0) {
                layer.alert('请选择或上传微信分享缩略图', {
                    icon: 0
                });
                return;
            }
        }
        var layerIndex = layer.load(3, {
            shade: [0.1, '#000']
        });
        if(page.model) {
            page.linkInfor = page.calSize(page.model, page.ratio, page.vw_ratio);
            $('.link').each(function(linkIndex) {
                var value = $.trim($(this).val());
                page.linkInfor.forEach(function(linkPosition, positionIndex) {
                    if(linkIndex === positionIndex) {
                        linkPosition.link = value;
                    }
                })
            });
        }
        data.append("file", document.querySelector('.imgFile').files[0]);
        data.append("baseHeight", pageInfo.baseHeight);
        data.append("title", pageInfo.title);
        data.append("keywords", pageInfo.keywords);
        data.append("description", pageInfo.description);
        data.append("type", pageInfo.type);
        data.append("statistic", pageInfo.statistic);
        data.append("share", pageInfo.share);
        data.append("shareThumbnail", pageInfo.shareThumbnail);
        data.append("callAPP", pageInfo.callAPP);
        data.append("linkInfor", JSON.stringify(page.linkInfor));
        data.append("naturalWidth", document.querySelector('#previewImg').naturalWidth);
        data.append("naturalHeight", document.querySelector('#previewImg').naturalHeight);


        localStorage.setItem('areaInfo', JSON.stringify(page.areaInfo));

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

    // 切换切图类型时判断
    $('.radioBox :radio').on('change', function(e) {
        let type = $(this).val()
        if($('#previewImg').attr('src')) {
            page.switchRadio(type)
        }
    })

    // 拷贝粘贴选框
    $(document).on('copy', '.link', function(e) {
        page.copyArea('.preview img');
    });

    // 显示/隐藏 缩略图开关
    $('#share').on('change', function(e) {
        if (this.checked) {
            $('.thumbList').slideDown(300);
        } else {
            $('.thumbList').slideUp(300);
        }
    });

    // 选择分享缩略图
    $(document).on('click', '.thumbList li:not(".addImg")', function(e) {
        $(this).addClass('on').append('<i class="iconfont icon-selected"></i>');
        $(this).siblings().removeClass('on').find('.icon-selected').remove();
    });
    // 点击上传分享图标按钮弹出选择文件框
    $(document).on('click', '.addImg', function(e) {
        $('.thumbFile').click();
    });
    // 点击上传分享图标按钮弹出选择文件框
    $(document).on('change', '.thumbFile', function(e) {
        let img = e.target.files[0];
        img && page.uploadShareThumbnail(img);
    });

    // 使用上次切图数据
    $('.fillLastData').on('click', function() {
        if(!$('.preview img').attr('src')) {
            layer.alert('请先选择图片', {
                icon: 0
            });
            return;
        }
        if (!localStorage.getItem('areaInfo')) {
            layer.alert('查询不到上一次的切图数据，请手动切图', {
                icon: 0
            });
        } else {
            var areaOptions = JSON.parse(localStorage.getItem('areaInfo'));
            $('.preview img').selectAreas('add', areaOptions);
        }
        
    });

})