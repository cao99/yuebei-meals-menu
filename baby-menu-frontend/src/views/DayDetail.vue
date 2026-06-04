<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { getRecipe, weekDays } from '../data/recipes.js'
import { configWechatShare, isWechatBrowser } from '../utils/wechat.js'

const route = useRoute()
const router = useRouter()

const day = computed(() => decodeURIComponent(route.params.day))
const mealType = computed(() => decodeURIComponent(route.params.meal || '午餐'))
const recipe = computed(() => getRecipe(day.value))
const meal = computed(() => recipe.value?.meals?.[mealType.value])

// 响应式图片：根据 imagePath 生成 small/large × webp/jpg 变体路径
function variantOf(path, suffix, ext) {
  if (!path) return ''
  const dot = path.lastIndexOf('.')
  const slash = path.lastIndexOf('/')
  const stem = path.substring(slash + 1, dot)
  return `${path.substring(0, slash + 1)}${stem}-${suffix}.${ext}`
}
const imgLargeWebp = computed(() => variantOf(meal.value?.imagePath, 'large', 'webp'))
const imgLargeJpg = computed(() => variantOf(meal.value?.imagePath, 'large', 'jpg'))

const currentIndex = computed(() => weekDays.indexOf(day.value))
const prevDay = computed(() => currentIndex.value > 0 ? weekDays[currentIndex.value - 1] : null)
const nextDay = computed(() => currentIndex.value < weekDays.length - 1 ? weekDays[currentIndex.value + 1] : null)

const imageLoaded = ref(false)
const imageError = ref(false)
const showFullscreen = ref(false)
const shareSuccess = ref(false)
const showWechatGuide = ref(false)

function handleReferenceClick(e) {
  if (!confirm('需要登录小红书 App 或网页版后才可查看原文。是否继续前往？')) {
    e.preventDefault()
  }
}

function navigateTo(targetDay) {
  router.push(`/day/${encodeURIComponent(targetDay)}/${encodeURIComponent(mealType.value)}`)
}

function openFullscreen() {
  if (imageLoaded.value && !imageError.value) {
    showFullscreen.value = true
  }
}

function closeFullscreen() {
  showFullscreen.value = false
}

// 更新页面标题和 meta 信息（用于分享预览）
function updatePageMeta() {
  if (!meal.value) return
  
  const title = `${day.value} · ${mealType.value} - ${meal.value.dishName}`
  const description = `快来看看这道美味的宝宝辅食：${meal.value.dishName}，${meal.value.tips || '营养美味，宝宝爱吃'}`
  
  // 更新页面标题
  document.title = title
  
  // 更新或创建 meta description
  let metaDesc = document.querySelector('meta[name="description"]')
  if (metaDesc) {
    metaDesc.setAttribute('content', description)
  } else {
    metaDesc = document.createElement('meta')
    metaDesc.setAttribute('name', 'description')
    metaDesc.setAttribute('content', description)
    document.head.appendChild(metaDesc)
  }
  
  // 更新或创建 og:title（Open Graph 协议，用于社交分享）
  let ogTitle = document.querySelector('meta[property="og:title"]')
  if (!ogTitle) {
    ogTitle = document.createElement('meta')
    ogTitle.setAttribute('property', 'og:title')
    document.head.appendChild(ogTitle)
  }
  ogTitle.setAttribute('content', title)
  
  // 更新或创建 og:description
  let ogDesc = document.querySelector('meta[property="og:description"]')
  if (!ogDesc) {
    ogDesc = document.createElement('meta')
    ogDesc.setAttribute('property', 'og:description')
    document.head.appendChild(ogDesc)
  }
  ogDesc.setAttribute('content', description)
  
  // 更新或创建 og:image
  if (meal.value.imagePath) {
    let ogImage = document.querySelector('meta[property="og:image"]')
    if (!ogImage) {
      ogImage = document.createElement('meta')
      ogImage.setAttribute('property', 'og:image')
      document.head.appendChild(ogImage)
    }
    const imageUrl = meal.value.imagePath.startsWith('http')
      ? meal.value.imagePath
      : new URL(meal.value.imagePath, window.location.origin).href
    ogImage.setAttribute('content', imageUrl)
    
    // 微信分享图片
    let wxImage = document.querySelector('meta[itemprop="image"]')
    if (wxImage) {
      wxImage.setAttribute('content', imageUrl)
    }
  }
  
  // 更新或创建 og:url
  let ogUrl = document.querySelector('meta[property="og:url"]')
  if (!ogUrl) {
    ogUrl = document.createElement('meta')
    ogUrl.setAttribute('property', 'og:url')
    document.head.appendChild(ogUrl)
  }
  ogUrl.setAttribute('content', window.location.href)
  
  // 更新微信分享专用 meta
  let wxTitle = document.querySelector('meta[itemprop="name"]')
  if (wxTitle) {
    wxTitle.setAttribute('content', title)
  }
  
  let wxDesc = document.querySelector('meta[itemprop="description"]')
  if (wxDesc) {
    wxDesc.setAttribute('content', description)
  }
}

// 配置微信分享
onMounted(async () => {
  // 更新页面 meta 信息
  updatePageMeta()
  
  // 配置微信 JS-SDK 分享
  if (isWechatBrowser() && meal.value) {
    const shareUrl = window.location.href
    const imageUrl = meal.value.imagePath 
      ? (meal.value.imagePath.startsWith('http') 
          ? meal.value.imagePath 
          : new URL(meal.value.imagePath, window.location.origin).href)
      : `${window.location.origin}/logo.png`
    
    await configWechatShare({
      title: `${day.value} · ${mealType.value} - ${meal.value.dishName}`,
      desc: `快来看看这道美味的宝宝辅食：${meal.value.dishName}`,
      link: shareUrl,
      imgUrl: imageUrl
    })
  }
})

async function shareLink() {
  const shareUrl = window.location.href
  
  // 微信浏览器中显示分享引导
  if (isWechatBrowser()) {
    // 微信分享配置已在 onMounted 中完成
    // 显示引导蒙层
    showWechatGuide.value = true
    return
  }
  
  // 尝试使用 Web Share API（移动端支持）
  if (navigator.share) {
    try {
      await navigator.share({
        title: `${day.value} · ${mealType.value} - ${meal.value?.dishName}`,
        text: `快来看看这道美味的宝宝辅食：${meal.value?.dishName}`,
        url: shareUrl
      })
    } catch (err) {
      // 用户取消分享或其他错误，使用备用方案
      if (err.name !== 'AbortError') {
        copyToClipboard(shareUrl)
      }
    }
  } else {
    // 不支持 Web Share API，使用复制链接
    copyToClipboard(shareUrl)
  }
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    shareSuccess.value = true
    setTimeout(() => {
      shareSuccess.value = false
    }, 2000)
  } catch (err) {
    // 降级方案：使用传统复制方法
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-999999px'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
      shareSuccess.value = true
      setTimeout(() => {
        shareSuccess.value = false
      }, 2000)
    } catch (e) {
      console.error('复制失败', e)
    }
    document.body.removeChild(textarea)
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-50 via-blue-50 to-indigo-50">
    <!-- 顶部导航 - 不 sticky，下滑后不遮挡内容 -->
    <header class="relative overflow-hidden shadow-md shadow-cyan-200/40">
      <div class="absolute inset-0" style="background: linear-gradient(to right, #2563eb, #4f46e5, #7e22ce);"></div>
      <div class="absolute top-2 right-8 w-1 h-1 bg-white rounded-full twinkle-mini"></div>
      <div class="absolute bottom-2 left-1/3 w-1 h-1 bg-cyan-200 rounded-full twinkle-mini" style="animation-delay:0.5s"></div>
      <div class="absolute top-3 left-1/4 w-0.5 h-0.5 bg-white rounded-full twinkle-mini" style="animation-delay:1s"></div>
      <div class="relative max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1 px-3 py-1.5 hover:bg-white/30 text-white rounded-full transition-colors border border-white/50"
          style="background-color: rgba(255,255,255,0.18);"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-xs font-bold">返回</span>
        </button>
        <h2 class="hero-mini-title text-base font-bold tracking-wide" style="color:#ffffff;">{{ day }} · {{ mealType }}</h2>
        <div class="px-2 py-1 bg-white rounded-full shadow-md border border-cyan-200">
          <span class="text-[10px] font-bold text-blue-700">★★★</span>
        </div>
      </div>
    </header>

    <!-- 内容 -->
    <main class="max-w-2xl mx-auto pb-24">
      <!-- 图片 - 星球食堂浅色风格 -->
      <div
        v-if="meal?.imagePath"
        class="relative w-full aspect-[16/9] bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden cursor-pointer mt-3 mx-3 rounded-2xl border border-gray-200 shadow-sm"
        @click="openFullscreen"
      >
        <picture class="w-full h-full flex items-center justify-center absolute inset-0 transition-opacity duration-300" :style="{ opacity: imageLoaded && !imageError ? 1 : 0 }">
          <source :srcset="imgLargeWebp" type="image/webp" />
          <img
            :src="imgLargeJpg"
            :alt="meal.dishName"
            decoding="async"
            class="w-full h-full object-contain"
            @load="imageLoaded = true"
            @error="imageError = true"
          />
        </picture>
        <div v-if="!imageLoaded && !imageError" class="text-gray-400 text-base z-10">
          加载中...
        </div>
        <div v-if="imageError" class="text-gray-300 text-6xl z-10">
          🍽️
        </div>
      </div>

      <!-- 全屏图片预览 -->
      <Teleport to="body">
        <Transition name="fullscreen">
          <div
            v-if="showFullscreen"
            class="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
            @click="closeFullscreen"
          >
            <!-- 关闭按钮 -->
            <button
              class="absolute top-4 right-4 w-10 h-10 flex items-center justify-center text-white text-opacity-80 hover:text-opacity-100 transition-opacity z-10"
              @click="closeFullscreen"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            
            <!-- 图片容器 -->
            <div class="w-full h-full flex items-center justify-center p-4">
              <picture @click.stop class="max-w-full max-h-full flex items-center justify-center">
                <source :srcset="imgLargeWebp" type="image/webp" />
                <img
                  :src="imgLargeJpg"
                  :alt="meal?.dishName"
                  decoding="async"
                  class="max-w-full max-h-full object-contain"
                />
              </picture>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 微信分享引导蒙层 -->
      <Teleport to="body">
        <Transition name="guide">
          <div
            v-if="showWechatGuide"
            class="fixed inset-0 z-50 bg-black bg-opacity-70 flex flex-col items-end"
            @click="showWechatGuide = false"
          >
            <!-- 引导箭头和提示 -->
            <div class="w-full px-6 pt-8 pb-4 text-right">
              <div class="inline-block">
                <svg class="w-32 h-32 text-white opacity-90" viewBox="0 0 100 100">
                  <path
                    d="M 80 10 L 95 10 L 95 25"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                  <path
                    d="M 85 15 Q 50 40 50 70"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-dasharray="4 2"
                  />
                  <circle cx="50" cy="70" r="3" fill="currentColor" />
                </svg>
              </div>
            </div>
            
            <!-- 提示文字 -->
            <div class="w-full px-6 text-white text-center mt-20">
              <p class="text-lg font-medium mb-2">点击右上角菜单按钮</p>
              <p class="text-sm opacity-80 mb-6">选择"发送给朋友"或"分享到朋友圈"</p>
              
              <button
                @click="showWechatGuide = false"
                class="px-6 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-sm transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </Transition>
      </Teleport>

      <!-- 菜品信息区 -->
      <div class="px-4 pt-4 pb-2" v-if="meal">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1 mr-4">
            <div class="flex items-center gap-2 mb-1.5">
              <span class="text-[10px] font-bold text-blue-700 px-2 py-0.5 bg-cyan-100 rounded-full">⚡ 能量+10</span>
              <span class="text-[10px] font-bold text-blue-600">星际营养</span>
            </div>
            <h3 class="text-2xl font-bold dish-hero-title">{{ meal.dishName }}</h3>
          </div>
          <button
            @click="shareLink"
            class="flex-shrink-0 flex items-center gap-1 px-4 py-2 active:scale-95 text-white rounded-full transition-all text-sm font-bold shadow-md border border-white"
            :class="shareSuccess ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700'"
          >
            <svg v-if="!shareSuccess" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ shareSuccess ? '已复制' : '分享' }}</span>
          </button>
        </div>

        <!-- 标签 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="tag in meal.tags"
            :key="tag"
            class="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 小贴士 -->
        <div class="relative bg-gradient-to-r from-cyan-50 to-blue-50 rounded-2xl px-4 py-3 mb-5 flex items-start gap-2 border border-gray-200 shadow-sm">
          <span class="text-lg flex-shrink-0">💡</span>
          <p class="text-sm text-blue-800 leading-relaxed font-medium">{{ meal.tips }}</p>
        </div>
      </div>

      <!-- 食材清单 -->
      <div class="px-4 mb-3" v-if="meal">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md shadow-cyan-200 border border-white">
            <span class="text-base">🥕</span>
          </div>
          <h4 class="text-base font-bold text-blue-900">食材清单</h4>
          <div class="flex-1 h-px bg-gradient-to-r from-cyan-300 to-transparent"></div>
        </div>
      </div>

      <div class="px-4 mb-6" v-if="meal">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ingredient in meal.ingredients"
            :key="ingredient"
            class="bg-white text-blue-700 text-sm px-3 py-1.5 rounded-xl border border-gray-200 font-medium shadow-sm hover:shadow-md hover:border-gray-300 hover:-translate-y-0.5 transition-all"
          >
            {{ ingredient }}
          </span>
        </div>
      </div>

      <!-- 步骤 -->
      <div class="px-4 mb-5" v-if="meal">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-7 h-7 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center shadow-md shadow-blue-200 border border-white">
            <span class="text-base">👩‍🍳</span>
          </div>
          <h4 class="text-base font-bold text-blue-900">做法步骤</h4>
          <div class="flex-1 h-px bg-gradient-to-r from-blue-300 to-transparent"></div>
        </div>
        <div class="space-y-3">
          <div
            v-for="(step, index) in meal.steps"
            :key="index"
            class="flex gap-3 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
          >
            <span
              class="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-sm flex items-center justify-center font-bold mt-0.5 shadow-md shadow-cyan-200 border border-white"
            >
              {{ index + 1 }}
            </span>
            <p class="text-sm text-blue-900 leading-relaxed pt-1">{{ step }}</p>
          </div>
        </div>
      </div>

      <!-- 参考链接 -->
      <div v-if="meal?.referenceLink" class="px-4 mt-6">
        <a
          :href="meal.referenceLink"
          target="_blank"
          rel="noopener noreferrer"
          @click="handleReferenceClick"
          class="flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 text-white text-sm font-bold rounded-2xl transition-all shadow-md border border-white"
        >
          <span>🔗 查看小红书原文</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </a>
      </div>

      <!-- 无食谱占位 -->
      <div v-else-if="recipe" class="text-center py-20 text-gray-300 px-4">
        <div class="text-6xl mb-4">📝</div>
        <p class="text-lg">{{ day }}的{{ mealType }}菜单还在准备中...</p>
        <p class="text-sm mt-2 text-gray-300">敬请期待</p>
      </div>

      <div v-else class="text-center py-20 text-gray-300 px-4">
        <div class="text-6xl mb-4">🤷</div>
        <p class="text-lg">未找到该日期的食谱</p>
      </div>
    </main>

    <!-- 悬浮返回主页按钮（FAB） -->
    <button
      @click="router.push('/')"
      class="fixed right-4 bottom-20 z-30 w-12 h-12 rounded-full text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-lg border-2 border-white"
      style="background: linear-gradient(135deg, #06b6d4, #2563eb);"
      title="回到主页"
    >
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    </button>

    <!-- 前一天 / 后一天 底部导航 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-[0_-2px_15px_rgba(0,0,0,0.05)]">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          v-if="prevDay"
          @click="navigateTo(prevDay)"
          class="flex items-center gap-1 px-3 py-1.5 text-blue-700 hover:bg-gray-50 active:scale-95 rounded-full transition-all text-sm font-bold border border-gray-200"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"/>
          </svg>
          <span>{{ prevDay }}</span>
        </button>
        <div v-else></div>
        <span class="text-xs font-bold text-blue-600">⚡ {{ day }}</span>
        <button
          v-if="nextDay"
          @click="navigateTo(nextDay)"
          class="flex items-center gap-1 px-4 py-1.5 text-white bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95 rounded-full transition-all text-sm font-bold shadow-md border border-white"
        >
          <span>{{ nextDay }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div v-else></div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
/* 顶部小标题 */
.hero-mini-title {
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  font-family: 'Comic Sans MS', 'Marker Felt', cursive, sans-serif;
}

/* 菜品大标题 */
.dish-hero-title {
  color: #1e3a8a;
  letter-spacing: 0.02em;
}

/* 星星闪烁 */
@keyframes twinkleMini {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.twinkle-mini {
  animation: twinkleMini 2s infinite;
}

.fullscreen-enter-active,
.fullscreen-leave-active {
  transition: opacity 0.3s ease;
}

.fullscreen-enter-from,
.fullscreen-leave-to {
  opacity: 0;
}

.fullscreen-enter-active img {
  transition: transform 0.3s ease;
}

.fullscreen-leave-active img {
  transition: transform 0.3s ease;
}

.fullscreen-enter-from img {
  transform: scale(0.9);
}

.fullscreen-leave-to img {
  transform: scale(0.9);
}

.guide-enter-active,
.guide-leave-active {
  transition: opacity 0.3s ease;
}

.guide-enter-from,
.guide-leave-to {
  opacity: 0;
}
</style>
