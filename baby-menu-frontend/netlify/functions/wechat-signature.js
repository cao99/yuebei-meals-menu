// 微信 JS-SDK 签名生成函数
// 需要在 Netlify 环境变量中配置：
// WECHAT_APP_ID - 微信公众号 AppID
// WECHAT_APP_SECRET - 微信公众号 AppSecret

const WECHAT_APP_ID = process.env.WECHAT_APP_ID
const WECHAT_APP_SECRET = process.env.WECHAT_APP_SECRET

// 缓存 access_token
let accessTokenCache = {
  token: null,
  expiresAt: 0
}

// 缓存 jsapi_ticket
let ticketCache = {
  ticket: null,
  expiresAt: 0
}

// 获取 access_token
async function getAccessToken() {
  // 使用缓存
  if (accessTokenCache.token && Date.now() < accessTokenCache.expiresAt) {
    return accessTokenCache.token
  }

  const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WECHAT_APP_ID}&secret=${WECHAT_APP_SECRET}`
  const response = await fetch(url)
  const data = await response.json()

  if (data.errcode) {
    throw new Error(`获取 access_token 失败: ${data.errmsg}`)
  }

  // 缓存 7200 秒，提前 5 分钟过期
  accessTokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  }

  return data.access_token
}

// 获取 jsapi_ticket
async function getJsApiTicket() {
  // 使用缓存
  if (ticketCache.ticket && Date.now() < ticketCache.expiresAt) {
    return ticketCache.ticket
  }

  const accessToken = await getAccessToken()
  const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?access_token=${accessToken}&type=jsapi`
  const response = await fetch(url)
  const data = await response.json()

  if (data.errcode !== 0) {
    throw new Error(`获取 jsapi_ticket 失败: ${data.errmsg}`)
  }

  // 缓存 7200 秒，提前 5 分钟过期
  ticketCache = {
    ticket: data.ticket,
    expiresAt: Date.now() + (data.expires_in - 300) * 1000
  }

  return data.ticket
}

// 生成随机字符串
function createNonceStr() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// 生成时间戳
function createTimestamp() {
  return parseInt(new Date().getTime() / 1000) + ''
}

// 生成签名
function createSignature(ticket, nonceStr, timestamp, url) {
  const string1 = `jsapi_ticket=${ticket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`
  
  // 使用 SubtleCrypto API 生成 SHA1
  const encoder = new TextEncoder()
  const data = encoder.encode(string1)
  
  return crypto.subtle.digest('SHA-1', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  })
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }

  // 处理 OPTIONS 请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    // 检查配置
    if (!WECHAT_APP_ID || !WECHAT_APP_SECRET) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          appId: 'your_app_id',
          timestamp: createTimestamp(),
          nonceStr: createNonceStr(),
          signature: 'mock_signature_for_demo',
          message: '请在 Netlify 配置微信公众号的 AppID 和 AppSecret'
        })
      }
    }

    // 获取 URL 参数
    const url = event.queryStringParameters.url
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少 url 参数' })
      }
    }

    // 获取 ticket
    const ticket = await getJsApiTicket()
    
    // 生成签名
    const nonceStr = createNonceStr()
    const timestamp = createTimestamp()
    const signature = await createSignature(ticket, nonceStr, timestamp, url)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        appId: WECHAT_APP_ID,
        timestamp,
        nonceStr,
        signature
      })
    }
  } catch (error) {
    console.error('签名生成失败:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}