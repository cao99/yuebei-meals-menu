<script setup>
import { ref, computed } from 'vue'
import { weekDays, recipes } from '../data/recipes.js'
import DayCard from '../components/DayCard.vue'

const mealTypes = ['早餐', '午餐', '晚餐', '全部']
const allCards = computed(() => {
  const cards = []
  for (const day of weekDays) {
    const meals = recipes[day]?.meals
    if (meals) {
      if (meals.早餐) cards.push({ day, recipe: meals.早餐, mealType: '早餐' })
      if (meals.午餐) cards.push({ day, recipe: meals.午餐, mealType: '午餐' })
    }
  }
  return cards
})
const currentMeal = ref('早餐')

function setMeal(meal) {
  currentMeal.value = meal
}

function mealEmoji(meal) {
  if (meal === '早餐') return '🌅'
  if (meal === '午餐') return '🍱'
  if (meal === '晚餐') return '🌙'
  return '✨'
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-cyan-50 via-blue-50 to-indigo-50">
    <!-- 顶部 Hero - 星球食堂风格（不 sticky，下滑后隐藏） -->
    <header class="relative overflow-hidden shadow-2xl space-bg" style="background: linear-gradient(to right, #2563eb, #4f46e5, #7e22ce);">
      <!-- 深空背景星星 -->
      <div class="absolute top-3 left-8 w-1 h-1 bg-white rounded-full twinkle-star"></div>
      <div class="absolute top-6 right-12 w-1.5 h-1.5 bg-cyan-200 rounded-full twinkle-star" style="animation-delay:0.3s"></div>
      <div class="absolute bottom-6 left-1/3 w-1 h-1 bg-white rounded-full twinkle-star" style="animation-delay:0.6s"></div>
      <div class="absolute top-1/2 right-1/4 w-1 h-1 bg-pink-200 rounded-full twinkle-star" style="animation-delay:0.9s"></div>
      <div class="absolute top-10 left-1/2 w-1 h-1 bg-cyan-300 rounded-full twinkle-star" style="animation-delay:1.2s"></div>
      <div class="absolute bottom-3 right-1/3 w-1 h-1 bg-white rounded-full twinkle-star" style="animation-delay:1.5s"></div>
      <!-- 光晕 -->
      <div class="absolute -top-10 left-1/4 w-40 h-40 bg-cyan-400 opacity-20 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-10 right-1/4 w-40 h-40 bg-purple-500 opacity-20 rounded-full blur-3xl"></div>

      <div class="relative max-w-4xl mx-auto px-4 py-5 flex items-center gap-3">
        <!-- LOGO：圆润星球 -->
        <div class="relative float-bounce">
          <div class="w-16 h-16 bg-gradient-to-br from-cyan-300 via-blue-400 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-cyan-200 planet-glow">
            <span class="text-4xl drop-shadow-lg">🪐</span>
          </div>
          <div class="absolute -top-1 -right-1 text-yellow-300 text-sm twinkle-star">✨</div>
          <div class="absolute -bottom-1 -left-1 text-pink-300 text-xs twinkle-star" style="animation-delay:0.5s">⭐</div>
        </div>

        <div class="flex flex-col">
          <h1 class="hero-title text-3xl font-black tracking-wide leading-none">
            月北食堂
          </h1>
          <div class="flex items-center gap-1 mt-1.5">
            <span class="text-xs font-bold text-cyan-200 drop-shadow">🚀 星球探险</span>
            <span class="text-xs text-cyan-400 opacity-70">·</span>
            <span class="text-xs text-cyan-200 font-bold drop-shadow">收集美味</span>
          </div>
        </div>

        <!-- 右侧能量徽章 -->
        <div class="ml-auto">
          <div class="relative">
            <div class="absolute inset-0 bg-cyan-400 rounded-full blur-md opacity-60 animate-pulse"></div>
            <div class="relative px-3 py-1.5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 rounded-full shadow-lg border-2 border-cyan-200">
              <span class="text-xs font-black text-white tracking-wide drop-shadow">⭐ LV.7</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- 分类标签 - 星球食堂风格 -->
    <div class="bg-white/70 backdrop-blur-sm border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
        <button
          v-for="meal in mealTypes"
          :key="meal"
          @click="setMeal(meal)"
          type="button"
          class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full font-bold cursor-pointer transition-all duration-200 border-2 whitespace-nowrap"
          :class="currentMeal === meal
            ? 'text-white border-blue-300 shadow-md scale-105'
            : 'bg-white text-blue-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
          :style="currentMeal === meal ? 'background: linear-gradient(to right, #06b6d4, #2563eb);' : ''"
        >
          <span>{{ mealEmoji(meal) }}</span>
          <span class="ml-1">{{ meal }}</span>
        </button>
      </div>
    </div>

    <!-- 菜品网格 -->
    <main class="max-w-4xl mx-auto px-4 py-4">
      <div v-if="currentMeal === '全部'" class="grid grid-cols-2 gap-3">
        <DayCard
          v-for="card in allCards"
          :key="`${card.day}-${card.mealType}`"
          :day="card.day"
          :recipe="card.recipe"
          :mealType="card.mealType"
        />
      </div>

      <div v-else-if="currentMeal !== '晚餐'" class="grid grid-cols-2 gap-3">
        <DayCard
          v-for="day in weekDays"
          :key="day"
          :day="day"
          :recipe="recipes[day]?.meals?.[currentMeal]"
          :mealType="currentMeal"
        />
      </div>

      <div v-else class="text-center py-20 text-blue-400">
        <div class="text-6xl mb-4 animate-bounce">🛸</div>
        <p class="text-lg font-bold text-blue-700">{{ currentMeal }}飞船尚未抵达...</p>
        <p class="text-sm mt-2 text-blue-400/70">星际探索中，敬请期待！</p>
      </div>
    </main>

    <footer class="text-center py-6 text-blue-400/70 text-xs">
      <p>🪐 数据来源：小红书 · 仅供宝妈宝爸参考</p>
    </footer>
  </div>
</template>

<style scoped>
/* 深空背景 */
.space-bg {
  background: linear-gradient(to right, #2563eb, #4f46e5, #7e22ce);
}

/* 主标题：青色霓虹光晕 */
.hero-title {
  color: #cffafe;
  text-shadow: 
    0 0 8px rgba(34, 211, 238, 0.8),
    0 0 16px rgba(34, 211, 238, 0.5),
    0 0 24px rgba(59, 130, 246, 0.3),
    2px 2px 4px rgba(0, 0, 0, 0.4);
  font-family: 'Comic Sans MS', 'Marker Felt', cursive, sans-serif;
  letter-spacing: 0.05em;
}

/* 顶部 sticky 迷你标题 */
.mini-title {
  color: #1e3a8a;
  font-family: 'Comic Sans MS', 'Marker Felt', cursive, sans-serif;
}

/* 行星光晕呼吸 */
@keyframes planetGlow {
  0%, 100% { box-shadow: 0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(59, 130, 246, 0.3); }
  50% { box-shadow: 0 0 30px rgba(34, 211, 238, 0.7), 0 0 60px rgba(59, 130, 246, 0.5); }
}
.planet-glow {
  animation: planetGlow 3s ease-in-out infinite;
}

/* 漂浮 */
@keyframes floatBounce {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-6px); }
}
.float-bounce {
  animation: floatBounce 3s ease-in-out infinite;
}

/* 星星闪烁 */
@keyframes twinkle {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.3); }
}
.twinkle-star {
  animation: twinkle 1.8s infinite;
}

/* 隐藏滚动条 */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>