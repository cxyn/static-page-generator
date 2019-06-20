var HOST = 'http://dev-docker-wscapp.htd.cn';
var wscappUrlPrefix= 'https://app.htd.cn';
var API = {
    sendMessage: wscappUrlPrefix + '/TrialProduct/verificationCode.htm',
    apply: wscappUrlPrefix + '/TrialProduct/addTrialProduct.htm',
    //获取图形验证码
    genImgVerificationCode: wscappUrlPrefix+'front/agentOrgTask/genImgVerificationCode.htm',
    //获取短信验证码
    sendSmsCodeCom: wscappUrlPrefix+'front/agentOrgTask/sendSmsCodeCom.htm',
    //提交表单
    applyBlueOceanPartner: wscappUrlPrefix+'front/blueOceanPartner/applyBlueOceanPartner.htm',
    // 汇聚星河提交表单
    insertXingHeService: 'http://199.168.3.214/weixin/wxMiniUserRequirement/addUserSave'
}