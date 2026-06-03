<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { getRecipe, weekDays } from '../data/recipes.js'
import { configWechatShare, isWechatBrowser } from '../utils/wechat.js'

const route = useRoute()
const router = useRouter()

const day = computed(() => decodeURIComponent(route.params.day))
const mealType = computed(() => route.query.meal || '午餐')
const recipe = computed(() => getRecipe(day.value))
const meal = computed(() => recipe.value?.meals?.[mealType.value])

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
  router.push({ path: `/day/${encodeURIComponent(targetDay)}`, query: { meal: mealType.value } })
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
  <div class="min-h-screen bg-white">
    <!-- 顶部导航 - 美团详情风格 -->
    <header class="sticky top-0 bg-white z-20 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
        <button
          @click="router.push('/')"
          class="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm">返回</span>
        </button>
        <h2 class="text-sm font-bold text-gray-800">{{ day }} · {{ mealType }}</h2>
        <div class="w-14"></div>
      </div>
    </header>

    <!-- 内容 -->
    <main class="max-w-2xl mx-auto pb-24">
      <!-- 图片 - 美团大图风格 -->
      <div
        v-if="meal?.imagePath"
        class="w-full aspect-[16/9] bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center overflow-hidden cursor-pointer"
        @click="openFullscreen"
      >
        <img
          v-show="imageLoaded"
          :src="meal.imagePath"
          :alt="meal.dishName"
          class="w-full h-full object-contain"
          @load="imageLoaded = true"
          @error="imageError = true"
        />
        <div v-if="!imageLoaded && !imageError" class="text-gray-300 text-3xl">
          加载中...
        </div>
        <div v-if="imageError" class="text-gray-200 text-6xl">
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
              <img
                :src="meal?.imagePath"
                :alt="meal?.dishName"
                class="max-w-full max-h-full object-contain"
                @click.stop
              />
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
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 mr-4">
            <h3 class="text-xl font-bold text-gray-800">{{ meal.dishName }}</h3>
          </div>
          <button
            @click="shareLink"
            class="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 active:bg-orange-200 text-orange-600 rounded-full transition-colors text-sm font-medium"
            :class="{ 'bg-green-50 text-green-600': shareSuccess }"
          >
            <svg v-if="!shareSuccess" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"/>
            </svg>
            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <span>{{ shareSuccess ? '已复制' : '分享' }}</span>
          </button>
        </div>

        <!-- 标签 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="tag in meal.tags"
            :key="tag"
            class="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 小贴士 - 美团公告栏风格 -->
        <div class="bg-amber-50 rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
          <span class="text-sm flex-shrink-0 mt-0.5">💡</span>
          <p class="text-sm text-amber-800 leading-relaxed">{{ meal.tips }}</p>
        </div>
      </div>

      <!-- 分割标题 - 美团分段风格 -->
      <div class="px-4 mb-3" v-if="meal">
        <div class="flex items-center gap-2">
          <span class="text-lg">🥕</span>
          <h4 class="text-base font-bold text-gray-800">食材清单</h4>
        </div>
      </div>

      <div class="px-4 mb-6" v-if="meal">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ingredient in meal.ingredients"
            :key="ingredient"
            class="bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-100"
          >
            {{ ingredient }}
          </span>
        </div>
      </div>

      <!-- 步骤 -->
      <div class="px-4 mb-5" v-if="meal">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">👩‍🍳</span>
          <h4 class="text-base font-bold text-gray-800">做法步骤</h4>
        </div>
        <div class="space-y-3">
          <div
            v-for="(step, index) in meal.steps"
            :key="index"
            class="flex gap-3 bg-gray-50 rounded-lg p-4"
          >
            <span
              class="flex-shrink-0 w-6 h-6 rounded-full bg-orange-400 text-white text-xs flex items-center justify-center font-bold mt-0.5"
            >
              {{ index + 1 }}
            </span>
            <p class="text-sm text-gray-700 leading-relaxed">{{ step }}</p>
          </div>
        </div>
      </div>

      <!-- 参考链接 - 美团底部按钮风格 -->
      <div v-if="meal?.referenceLink" class="px-4 mt-6">
        <a
          :href="meal.referenceLink"
          target="_blank"
          rel="noopener noreferrer"
          @click="handleReferenceClick"
          class="flex items-center justify-center gap-2 w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
        >
          <span>查看小红书原文</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
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

    <!-- 前一天 / 后一天 底部导航 - 美团底部操作栏风格 -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div class="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <button
          v-if="prevDay"
          @click="navigateTo(prevDay)"
          class="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors text-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span>{{ prevDay }}</span>
        </button>
        <div v-else></div>
        <span class="text-xs text-gray-300">{{ day }}</span>
        <button
          v-if="nextDay"
          @click="navigateTo(nextDay)"
          class="flex items-center gap-1 text-gray-500 hover:text-orange-500 transition-colors text-sm"
        >
          <span>{{ nextDay }}</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </button>
        <div v-else></div>
      </div>
    </nav>
  </div>
</template>

<style scoped>
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
