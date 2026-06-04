<script setup>
import { computed } from 'vue'

const props = defineProps({
  day: String,
  recipe: Object,
  mealType: {
    type: String,
    default: '午餐'
  }
})

// 把 /images/xxx.jpg → /images/xxx-small.webp / xxx-small.jpg
function variantOf(path, suffix, ext) {
  if (!path) return ''
  const dot = path.lastIndexOf('.')
  const slash = path.lastIndexOf('/')
  const stem = path.substring(slash + 1, dot)
  return `${path.substring(0, slash + 1)}${stem}-${suffix}.${ext}`
}
const imgWebp = computed(() => variantOf(props.recipe?.imagePath, 'small', 'webp'))
const imgJpg = computed(() => variantOf(props.recipe?.imagePath, 'small', 'jpg'))
</script>

<template>
  <router-link
    :to="recipe ? `/day/${encodeURIComponent(day)}/${encodeURIComponent(mealType)}` : ''"
    class="block"
  >
    <div
      class="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl overflow-hidden transition-all duration-200 border border-gray-200"
      :class="{
        'opacity-50': !recipe,
        'hover:shadow-2xl hover:shadow-gray-300/40 hover:border-gray-300 active:scale-[0.97] hover:-translate-y-1': recipe
      }"
    >
      <!-- 星级角标 -->
      <div v-if="recipe" class="absolute top-2 left-2 z-10">
        <div class="relative">
          <div class="absolute inset-0 bg-cyan-400 rounded-md blur-sm opacity-60"></div>
          <div class="relative px-1.5 py-0.5 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-md shadow-md border border-cyan-200">
            <span class="text-[9px] font-black text-white tracking-wider drop-shadow">★★★</span>
          </div>
        </div>
      </div>

      <!-- 餐类徽章 -->
      <div v-if="recipe" class="absolute top-2 right-2 z-10">
        <div class="px-2 py-0.5 bg-white/90 backdrop-blur-sm rounded-full shadow border border-cyan-300">
          <span class="text-[10px] font-bold text-blue-700">
            {{ mealType === '早餐' ? '🌅' : mealType === '午餐' ? '🍱' : '🌙' }} {{ mealType }}
          </span>
        </div>
      </div>

      <!-- 图片区域 -->
      <div class="relative aspect-[4/3] bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-100 overflow-hidden">
        <!-- 装饰星星 -->
        <div v-if="recipe" class="absolute top-3 left-1/3 w-1 h-1 bg-cyan-400 rounded-full twinkle-mini"></div>
        <div v-if="recipe" class="absolute bottom-4 right-6 w-1 h-1 bg-blue-400 rounded-full twinkle-mini" style="animation-delay:0.5s"></div>
        <div v-if="recipe" class="absolute top-8 right-3 w-0.5 h-0.5 bg-purple-400 rounded-full twinkle-mini" style="animation-delay:1s"></div>
        
        <picture v-if="recipe?.imagePath">
          <source :srcset="imgWebp" type="image/webp" />
          <img
            :src="imgJpg"
            :alt="recipe.dishName"
            loading="lazy"
            decoding="async"
            class="relative w-full h-full object-contain transition-transform duration-300 hover:scale-105"
          />
        </picture>
        <div v-else class="flex items-center justify-center h-full text-cyan-300 text-5xl">
          🥣
        </div>
        <!-- 装饰小元素 -->
        <div v-if="recipe" class="absolute bottom-1 right-1 text-base opacity-80">✨</div>
      </div>

      <!-- 信息区域 -->
      <div class="p-3 bg-gradient-to-b from-blue-50 to-indigo-50">
        <div class="flex items-start justify-between mb-1.5">
          <h3 class="text-sm font-bold line-clamp-1 leading-tight flex-1 mr-2 dish-title">
            {{ recipe ? recipe.dishName : '暂无菜单' }}
          </h3>
          <span class="text-[10px] font-bold flex-shrink-0 px-2 py-0.5 bg-cyan-100 text-blue-700 rounded-full shadow-sm">{{ day }}</span>
        </div>

        <!-- 能量条 -->
        <div v-if="recipe" class="flex items-center gap-1 mb-1.5">
          <span class="text-[9px] font-bold text-blue-600">⚡ 能量</span>
          <div class="flex-1 h-1.5 bg-blue-100 rounded-full overflow-hidden">
            <div class="h-full w-[85%] bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 rounded-full"></div>
          </div>
          <span class="text-[9px] font-bold text-blue-600">+10</span>
        </div>

        <!-- 标签 -->
        <div v-if="recipe" class="flex flex-wrap gap-1">
          <span
            v-for="tag in recipe.tags"
            :key="tag"
            class="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-medium"
          >
            {{ tag }}
          </span>
        </div>
      </div>
    </div>
  </router-link>
</template>

<style scoped>
.dish-title {
  color: #1e3a8a;
}

@keyframes twinkleMini {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.twinkle-mini {
  animation: twinkleMini 2s infinite;
}
</style>