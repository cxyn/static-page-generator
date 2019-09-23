$(function () {
    localStorage.removeItem('area')
    var page = page || {};
    page.model = null;
    page.ratio = 0;
    page.vw_ratio = 0;
    page.linkInfor = [];

    // 计算切块尺寸
    page.calSize = (arr, ratio, vw_ratio) => {
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
        return newArr;
    }

    // 检测预览图片是否符合所选切图类型
    page.switchRadio = (type, boundary=1080) => {
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
        })
        page.switchRadio($('.radioBox :radio:checked').val());
        $('.preview img').selectAreas({
            minSize: [50, 50],
            onChanged: function(event, id, areas) {
                localStorage.setItem('area', JSON.stringify(areas[id]))
                page.model = $(this).selectAreas('relativeAreas');
                page.ratio = naturalWidth / 500;
                page.vw_ratio = naturalWidth / 100;
                if(areas.length === $('.link').length + 1) {
                    index ++;
                    let _link = '<div class="formItem linkItem' + id + '">'+
                    '                <label for="">第' + index + '块区域的链接：</label><input type="text" class="link" placeholder="请输入链接地址" value="">'+
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

    // 拷贝切块
    page.copyArea = (selector) => {
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
    $('.preview').on('click', e => {
        if (!$('.preview img').attr('src')) {
            $('.imgFile').click();
        }
    });

    // 预览区载入图片处理
    $('.imgFile').change(e => {
        let img = e.target.files[0];
        page.showImg(img);
    });

    // 阻止拖拽默认行为
    $(document).on({ 
        dragleave: e => {
            e.preventDefault(); 
        }, 
        drop: e => {
            e.preventDefault(); 
        }, 
        dragenter: e => {
            e.preventDefault(); 
        }, 
        dragover: e => {
            e.preventDefault(); 
        } 
    }); 
    // 拖拽预览图交互
    $('.preview').on({
        drop: e => {
            let img = e.originalEvent.dataTransfer.files[0];
            $('.previewTps').addClass('hide');
            page.showImg(img)
        },
        dragover: e => {
            $('.previewTps').css('color', '#f70');
        },
        dragleave: e => {
            $('.previewTps').css('color', '#aaa');
        }
    });

    // url输入框失去焦点交互
    $(document).on('blur', '.link', function(e) {
        $(this).removeClass('on');
    });

    // 点击填充数据
    $('.uploadExcel').on('click', e => {
        $('.excel').click();   
    });

    // 上传excel
    $('.excel').on('change', function(e) {
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
        if(!$('.preview img').attr('src')) {
            layer.open({
                title: '提示',
                content: '请先选择图片'
            })
            return;
        }
        let data = new FormData();
        let pageInfo = {
            baseHeight: $.trim($('.baseHeight').val()),
            title: $.trim($('.pageTitle').val()),
            keywords: $.trim($('.pageKeywords').val()),
            type: $('.pageType :radio:checked').val(),
            description: $.trim($('.pageDesc').val()),
            statistic: $('#statistic').is(':checked')? 1 : 0
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
        var layerIndex = layer.load();
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
        data.append("linkInfor", JSON.stringify(page.linkInfor));
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
})