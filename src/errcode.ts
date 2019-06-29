
export const YOUDAO_ERROR_CODE = {
  '101': '缺少必填的参数(Expected arguments were not filled)',
  '102': '不支持的语言类型(Not supported language)',
  '103': '翻译文本过长(Text is too long to translate)',
  '104': '不支持的API类型(Not supported API)',
  '105': '不支持的签名类型(Not supported signature)',
  '106': '不支持的响应类型(Not supported response)',
  '107': '不支持的传输加密类型(Not supported transport encryption)',
  '108': 'appKey无效(Invalid appKey)',
  '109': 'batchLog格式不正确(Wrong format batchLog)',
  '110': '无相关服务的有效实例(No instance for relative service)',
  '111': '开发者账号无效(Invalid developer account)',
  '113': 'q不能为空(q can\' be empty)',
  '201': '解密失败(Failed to decode)',
  '202': '签名检验失败(Signature checking failed)',
  '203': '访问IP地址不在可访问IP列表(Not permitted IP address)',
  '205': '请求的接口与应用的平台类型不一致(The API you request isn\'t consistent with the platform of application)',
  '206': '因为时间戳无效导致签名校验失败(Signature checking failed due to invalid time stamp)',
  '207': '重放请求(Replay request)',
  '301': '辞典查询失败(Dictionary looking up failed)',
  '302': '翻译查询失败(Translation looking up failed)',
  '303': '服务端的其它异常(Other exception of server)',
  '401': '账户已经欠费停(Your account is out of credit)',
  '411': '访问频率受限,请稍后访问(Limited access frequency)',
  '412': '长请求过于频繁，请稍后访问(Long request is too frequent)'
}

export const BAIDU_ERROR_CODE = {
  '52000': '成功(Success)',
  '52001': '请求超时，请重试(HTTP request timed out, retry)',
  '52002': '系统错误，请重试(System error)',
  '52003': '未授权用户，请检查您的 appid 是否正确，或者服务是否开通(Unauthorized user, please check your appid or service)',
  '54000': '必填参数为空，请检查是否少传参数(Expected argument)',
  '54001': '签名错误，请检查您的签名生成方法(Sign error, please check your sign generation function)',
  '54003': '访问频率受限，请降低您的调用频率(Limited access frequency)',
  '54004': '账户余额不足，请前往管理控制台为账户充值(Insufficient balance for your account)',
  '54005': '长query请求频繁，请降低长query的发送频率，3s后再试(Too long and frequent requests)',
  '58000': '客户端IP非法(Invalid client IP address)',
  '58001': '译文语言方向不支持，检查译文语言是否在语言列表里(Not supported translation)',
  '58002': '服务当前已关闭，请前往管理控制台开启服务(Service has been closed, please start your service in the console)'
}
