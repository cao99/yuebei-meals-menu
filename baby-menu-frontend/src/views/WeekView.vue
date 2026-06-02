<script setup>
import { ref, computed } from 'vue'
import { weekDays, recipes } from '../data/recipes.js'
import DayCard from '../components/DayCard.vue'

const mealTypes = ['全部', '早餐', '午餐', '晚餐']
const currentMeal = ref('全部')

function setMeal(meal) {
  currentMeal.value = meal
}

const hasMealData = computed(() => {
  return weekDays.some(day => {
    const meal = currentMeal.value
    return meal === '全部' || (recipes[day]?.meals?.[meal] != null)
  })
})
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- 顶部导航栏 - 美团风格 -->
    <header class="sticky top-0 bg-white z-20 border-b border-gray-100">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🍼</span>
          <div>
            <h1 class="text-lg font-bold text-gray-800 leading-tight">宝宝一周食谱</h1>
            <p class="text-xs text-gray-400">适合 1-2 岁宝宝 · 每天不重样</p>
          </div>
        </div>
        <div class="flex items-center gap-3 text-gray-400">
          <span class="text-sm">📅 本周</span>
        </div>
      </div>
    </header>

    <!-- 分类标签 - 可点击切换 -->
    <div class="bg-white border-b border-gray-50">
      <div class="max-w-4xl mx-auto px-4 py-3 flex gap-3 overflow-x-auto scrollbar-hide">
        <span
          v-for="meal in mealTypes"
          :key="meal"
          @click="setMeal(meal)"
          class="flex-shrink-0 px-4 py-1.5 text-sm rounded-full font-medium cursor-pointer transition-colors"
          :class="currentMeal === meal
            ? 'bg-orange-500 text-white'
            : 'bg-gray-50 text-gray-600 hover:bg-orange-100 hover:text-orange-600'"
        >
          {{ meal }}
        </span>
      </div>
    </div>

    <!-- 菜品网格 -->
    <main class="max-w-4xl mx-auto px-4 py-4">
      <!-- 午餐/全部：显示已有数据的卡片 -->
      <div v-if="currentMeal !== '早餐' && currentMeal !== '晚餐'" class="grid grid-cols-2 gap-3">
        <DayCard
          v-for="day in weekDays"
          :key="day"
          :day="day"
          :recipe="recipes[day]?.meals?.午餐"
          mealType="午餐"
        />
      </div>

      <!-- 早餐 / 晚餐：待上线占位 -->
      <div v-else class="text-center py-20 text-gray-300">
        <div class="text-6xl mb-4">🚧</div>
        <p class="text-lg text-gray-400">{{ currentMeal }}菜品八百里加急上线中...</p>
      </div>
    </main>

    <!-- 底部 -->
    <footer class="text-center py-6 text-gray-300 text-xs border-t border-gray-50">
      数据来源：小红书 · 仅供宝妈宝爸参考
    </footer>
  </div>
</template>
