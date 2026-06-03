// 微信 JS-SDK 分享配置
// 注意：需要在微信公众平台配置 JS 接口安全域名

let wxReady = false

// 检测是否在微信浏览器中
export function isWechatBrowser() {
  const ua = navigator.userAgent.toLowerCase()
  return ua.includes('micromessenger')
}

// 动态加载微信 JS-SDK
function loadWechatSDK() {
  return new Promise((resolve, reject) => {
    if (window.wx) {
      resolve()
      return
    }
    
    const script = document.createElement('script')
    script.src = 'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// 配置微信分享
export async function configWechatShare(shareData) {
  if (!isWechatBrowser()) {
    return false
  }
  
  try {
    await loadWechatSDK()
    
    // 获取签名
    const url = window.location.href.split('#')[0] // 去掉 hash 部分
    const response = await fetch(`/.netlify/functions/wechat-signature?url=${encodeURIComponent(url)}`)
    const signature = await response.json()
    
    if (signature.message) {
      console.warn(signature.message)
      return false
    }
    
    return new Promise((resolve) => {
      window.wx.config({
        debug: false,
        appId: signature.appId,
        timestamp: signature.timestamp,
        nonceStr: signature.nonceStr,
        signature: signature.signature,
        jsApiList: [
          'updateAppMessageShareData',
          'updateTimelineShareData',
          'onMenuShareAppMessage',
          'onMenuShareTimeline'
        ]
      })
      
      window.wx.ready(() => {
        wxReady = true
        
        // 配置分享给朋友
        window.wx.updateAppMessageShareData({
          title: shareData.title,
          desc: shareData.desc,
          link: shareData.link,
          imgUrl: shareData.imgUrl,
          success: () => {
            console.log('分享给朋友配置成功')
          },
          fail: (err) => {
            console.error('分享给朋友配置失败:', err)
          }
        })
        
        // 配置分享到朋友圈
        window.wx.updateTimelineShareData({
          title: shareData.title,
          desc: shareData.desc,
          link: shareData.link,
          imgUrl: shareData.imgUrl,
          success: () => {
            console.log('分享到朋友圈配置成功')
          },
          fail: (err) => {
            console.error('分享到朋友圈配置失败:', err)
          }
        })
        
        resolve(true)
      })
      
      window.wx.error((err) => {
        console.error('微信 JS-SDK 配置失败:', err)
        resolve(false)
      })
    })
  } catch (error) {
    console.error('微信分享配置失败:', error)
    return false
  }
}