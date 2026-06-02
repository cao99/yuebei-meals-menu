// 微信浏览器兼容处理脚本
// 移除 Tailwind CSS v4 生成的不兼容现代 CSS 特性

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const assetsDir = resolve(__dirname, 'dist/assets')

for (const file of readdirSync(assetsDir)) {
  if (!file.endsWith('.css')) continue
  const fp = resolve(assetsDir, file)
  let css = readFileSync(fp, 'utf8')
  
  // 1. 移除 @property 规则（微信不支持）
  css = css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}\s*/g, '')
  
  // 2. 将 oklch() 颜色替换为 hex（微信不支持）
  css = css.replace(/oklch\([^)]+\)/g, (match) => {
    const map = {
      'oklch(98.5% .002 247.839)': '#f9fafb', 'oklch(96.7% .003 264.542)': '#f3f4f6',
      'oklch(92.8% .006 264.531)': '#e5e7eb', 'oklch(87.2% .01 258.338)': '#d1d5dc',
      'oklch(70.7% .022 261.325)': '#99a1af', 'oklch(55.1% .027 264.364)': '#6a7282',
      'oklch(44.6% .03 256.802)': '#4a5565', 'oklch(37.3% .034 259.733)': '#364153',
      'oklch(27.8% .033 256.848)': '#1e2939', 'oklch(98% .016 73.684)': '#fff7ed',
      'oklch(95.4% .038 75.164)': '#ffedd5', 'oklch(90.1% .076 70.697)': '#ffd7a8',
      'oklch(75% .183 55.934)': '#ff8b1a', 'oklch(70.5% .213 47.604)': '#fe6e00',
      'oklch(64.6% .222 41.116)': '#f05100', 'oklch(55.3% .195 38.402)': '#c53c00',
      'oklch(98.7% .022 95.277)': '#fffbeb', 'oklch(47.3% .137 46.201)': '#953d00',
      'oklch(98.7% .026 102.212)': '#fefce8',
    }
    return map[match] || match
  })
  
  // 3. 提取 :root 变量（在移除 @layer 之前）
  const rootVars = {}
  const rootMatch = css.match(/:root\s*(?:,\s*(?::host)?)?\s*\{([\s\S]*?)\}/)
  if (rootMatch) {
    const declRe = /--([\w-]+)\s*:\s*([\s\S]*?);\s*(?=\n|$)/g
    let dm
    while ((dm = declRe.exec(rootMatch[1])) !== null) {
      rootVars[dm[1]] = dm[2].trim()
    }
  }
  
  // 4. 移除 @layer 块，保留内容
  const rmBlock = (s, prefix) => {
    let r = '', i = 0
    while (i < s.length) {
      if (s.slice(i).startsWith(prefix)) {
        i += prefix.length
        let d = 1, inn = ''
        while (d > 0 && i < s.length) {
          const c = s[i]; if (c === '{') d++; else if (c === '}') d--
          if (d > 0) inn += c; i++
        }
        i++; r += inn; continue
      }
      r += s[i]; i++
    }
    return r
  }
  
  css = rmBlock(css, '@layer properties{')
  css = rmBlock(css, '@layer theme{')
  css = rmBlock(css, '@layer base{')
  css = rmBlock(css, '@layer utilities{')
  css = css.replace(/@layer\s+[\w-]+\s*;\s*/g, '')
  
  // 5. 递归替换 var() 为实际值（某些 var 值本身包含 var()）
  let prev = ''
  while (prev !== css) {
    prev = css
    css = css.replace(/var\(--([\w-]+)(?:\s*,\s*([^)]+))?\)/g, (_, n, f) => {
      return rootVars[n] || (f ? f.trim() : 'inherit')
    })
  }
  
  // 6. 移除 :host 选择器
  css = css.replace(/:host\s*(?=[,{\s])/g, '')
  
  const varCount = (css.match(/var\(--/g) || []).length
  console.log(`[微信兼容] ${file}: ${css.length} bytes, var(--): ${varCount}`)
  
  writeFileSync(fp, css)
}
console.log('[微信兼容] CSS 后处理完成')
