<script setup>
defineProps({
  day: String,
  recipe: Object,
  mealType: {
    type: String,
    default: '午餐'
  }
})
</script>

<template>
  <router-link
    :to="recipe ? { path: `/day/${encodeURIComponent(day)}`, query: { meal: mealType } } : ''"
    class="block"
  >
    <div
      class="bg-white rounded-xl overflow-hidden transition-all duration-200 border border-gray-100"
      :class="{
        'opacity-50': !recipe,
        'hover:shadow-lg hover:border-orange-200 active:scale-[0.98]': recipe
      }"
    >
      <!-- 图片区域 - 美团风格 16:9 -->
      <div class="relative aspect-[4/3] bg-gradient-to-br from-orange-50 to-yellow-50 overflow-hidden">
        <img
          v-if="recipe?.imagePath"
          :src="recipe.imagePath"
          :alt="recipe.dishName"
          class="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
        />
        <div v-else class="flex items-center justify-center h-full text-gray-200 text-5xl">
          🥣
        </div>
      </div>

      <!-- 信息区域 -->
      <div class="p-3">
        <div class="flex items-start justify-between mb-1">
          <h3 class="text-sm font-bold text-gray-800 line-clamp-1 leading-tight flex-1 mr-2">
            {{ recipe ? recipe.dishName : '暂无菜单' }}
          </h3>
          <span class="text-xs text-orange-400 font-medium flex-shrink-0">{{ day }}</span>
        </div>

        <!-- 标签 -->
        <div v-if="recipe" class="flex flex-wrap gap-1 mt-1.5">
          <span
            v-for="tag in recipe.tags"
            :key="tag"
            class="text-[10px] bg-gray-50 text-gray-500 px-1.5 py-0.5 rounded"
          >
            {{ tag }}
          </span>
        </div>

        <!-- 月销量占位 - 美团风格 -->
        <div v-if="recipe" class="mt-2 text-[10px] text-gray-300">
          ❤️ 收藏食谱
        </div>
      </div>
    </div>
  </router-link>
</template>
