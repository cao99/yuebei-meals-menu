<script setup>
import { useRoute, useRouter } from 'vue-router'
import { ref, computed } from 'vue'
import { getRecipe, weekDays } from '../data/recipes.js'

const route = useRoute()
const router = useRouter()

const day = computed(() => decodeURIComponent(route.params.day))
const recipe = computed(() => getRecipe(day.value))
const lunch = computed(() => recipe.value?.meals?.午餐)

const currentIndex = computed(() => weekDays.indexOf(day.value))
const prevDay = computed(() => currentIndex.value > 0 ? weekDays[currentIndex.value - 1] : null)
const nextDay = computed(() => currentIndex.value < weekDays.length - 1 ? weekDays[currentIndex.value + 1] : null)

const imageLoaded = ref(false)
const imageError = ref(false)

function handleReferenceClick(e) {
  if (!confirm('需要登录小红书 App 或网页版后才可查看原文。是否继续前往？')) {
    e.preventDefault()
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
        <h2 class="text-sm font-bold text-gray-800">{{ day }} · 午餐</h2>
        <div class="w-14"></div>
      </div>
    </header>

    <!-- 内容 -->
    <main class="max-w-2xl mx-auto pb-24">
      <!-- 图片 - 美团大图风格 -->
      <div
        v-if="lunch?.imagePath"
        class="w-full aspect-[16/9] bg-gradient-to-br from-orange-50 to-yellow-50 flex items-center justify-center overflow-hidden"
      >
        <img
          v-show="imageLoaded"
          :src="lunch.imagePath"
          :alt="lunch.dishName"
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

      <!-- 菜品信息区 -->
      <div class="px-4 pt-4 pb-2" v-if="lunch">
        <div class="flex items-start justify-between mb-2">
          <div class="flex-1 mr-4">
            <h3 class="text-xl font-bold text-gray-800">{{ lunch.dishName }}</h3>
          </div>
          <div class="flex items-center gap-2 text-gray-300">
            <span class="text-xs">❤️</span>
            <span class="text-xs">📤</span>
          </div>
        </div>

        <!-- 标签 -->
        <div class="flex flex-wrap gap-2 mb-4">
          <span
            v-for="tag in lunch.tags"
            :key="tag"
            class="text-xs bg-orange-50 text-orange-600 px-2.5 py-1 rounded-full font-medium"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 小贴士 - 美团公告栏风格 -->
        <div class="bg-amber-50 rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
          <span class="text-sm flex-shrink-0 mt-0.5">💡</span>
          <p class="text-sm text-amber-800 leading-relaxed">{{ lunch.tips }}</p>
        </div>
      </div>

      <!-- 分割标题 - 美团分段风格 -->
      <div class="px-4 mb-3" v-if="lunch">
        <div class="flex items-center gap-2">
          <span class="text-lg">🥕</span>
          <h4 class="text-base font-bold text-gray-800">食材清单</h4>
        </div>
      </div>

      <div class="px-4 mb-6" v-if="lunch">
        <div class="flex flex-wrap gap-2">
          <span
            v-for="ingredient in lunch.ingredients"
            :key="ingredient"
            class="bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-100"
          >
            {{ ingredient }}
          </span>
        </div>
      </div>

      <!-- 步骤 -->
      <div class="px-4 mb-5" v-if="lunch">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-lg">👩‍🍳</span>
          <h4 class="text-base font-bold text-gray-800">做法步骤</h4>
        </div>
        <div class="space-y-3">
          <div
            v-for="(step, index) in lunch.steps"
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
      <div v-if="lunch?.referenceLink" class="px-4 mt-6">
        <a
          :href="lunch.referenceLink"
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
        <p class="text-lg">{{ day }}的菜单还在准备中...</p>
        <p class="text-sm mt-2 text-gray-300">早餐栏目即将上线</p>
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
          @click="router.push(`/day/${encodeURIComponent(prevDay)}`)"
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
          @click="router.push(`/day/${encodeURIComponent(nextDay)}`)"
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
