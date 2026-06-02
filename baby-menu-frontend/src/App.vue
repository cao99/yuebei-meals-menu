<script setup>
</script>

<template>
  <router-view />
</template>

<style>
/* 全局基础样式 */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 平滑滚动 */
html {
  scroll-behavior: smooth;
}

/* 图片过渡 */
img {
  transition: opacity 0.3s ease;
}
</style>
