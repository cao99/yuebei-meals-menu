// 微信浏览器兼容处理脚本
// 移除 Tailwind CSS v4 生成的不兼容现代 CSS 特性
// 同时为每道菜预渲染独立 HTML（带正确 title/og meta），用于微信分享卡片

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, unlinkSync } from 'fs'
import { resolve, dirname, basename, extname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { weekDays, recipes } from './src/data/recipes.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, 'dist')
const assetsDir = resolve(distDir, 'assets')
const imagesDir = resolve(distDir, 'images')

// 站点根 URL（用于生成 og:image / og:url 绝对地址）
const SITE_BASE = process.env.SITE_BASE || 'https://baby-menu.pages.dev'

// 通用 oklch -> rgb hex 转换（基于 CSS Color 4 规范）
// L: 0~1（百分号会去掉），C: chroma，H: hue（角度）
function oklchToHex(L, C, H) {
  // OKLCH -> OKLab
  const hRad = (H * Math.PI) / 180
  const a = C * Math.cos(hRad)
  const b = C * Math.sin(hRad)

  // OKLab -> linear sRGB（Björn Ottosson 公式）
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b
  const s_ = L - 0.0894841775 * a - 1.291485548 * b

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s

  // linear -> sRGB gamma
  const gamma = (v) =>
    v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055

  r = gamma(r)
  g = gamma(g)
  bl = gamma(bl)

  // clamp 0~1 -> 0~255
  const toByte = (v) => {
    const n = Math.round(Math.max(0, Math.min(1, v)) * 255)
    return n.toString(16).padStart(2, '0')
  }
  return `#${toByte(r)}${toByte(g)}${toByte(bl)}`
}

for (const file of readdirSync(assetsDir)) {
  if (!file.endsWith('.css')) continue
  const fp = resolve(assetsDir, file)
  let css = readFileSync(fp, 'utf8')

  // 1. 移除 @property 规则（微信不支持）
  css = css.replace(/@property\s+--[\w-]+\s*\{[^}]*\}\s*/g, '')

  // 2. 通用 oklch() 颜色转换为 hex（微信 X5 不支持 oklch）
  // 支持：oklch(L% C H) / oklch(L% C H / alpha)
  let oklchCount = 0
  css = css.replace(
    /oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/gi,
    (_match, lStr, cStr, hStr, alpha) => {
      oklchCount++
      const L = parseFloat(lStr) / 100
      const C = parseFloat(cStr)
      const H = parseFloat(hStr)
      const hex = oklchToHex(L, C, H)
      if (alpha != null) {
        // 把 alpha 转为 0~255 hex 后缀
        const a =
          alpha.endsWith('%')
            ? parseFloat(alpha) / 100
            : parseFloat(alpha)
        const ah = Math.round(Math.max(0, Math.min(1, a)) * 255)
          .toString(16)
          .padStart(2, '0')
        return `${hex}${ah}`
      }
      return hex
    }
  )

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
    let r = '',
      i = 0
    while (i < s.length) {
      if (s.slice(i).startsWith(prefix)) {
        i += prefix.length
        let d = 1,
          inn = ''
      while (d > 0 && i < s.length) {
          const c = s[i]
          if (c === '{') d++
          else if (c === '}') d--
          if (d > 0) inn += c
          i++
        }
        i++
        r += inn
        continue
      }
      r += s[i]
      i++
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
  const oklchLeft = (css.match(/oklch\(/g) || []).length
  console.log(
    `[微信兼容] ${file}: ${css.length} bytes, oklch 转换: ${oklchCount}, 残留: ${oklchLeft}, var(--): ${varCount}`
  )

  writeFileSync(fp, css)
}
console.log('[微信兼容] CSS 后处理完成')

// ---------- 图片优化：生成响应式 WebP + JPG（缩略图 / 大图两个尺寸） ----------

const SMALL_WIDTH = 480 // 卡片缩略图
const LARGE_WIDTH = 1200 // 详情大图 + og:image
const JPG_QUALITY = 78
const WEBP_QUALITY = 72

let optCount = 0
let totalBefore = 0
let totalAfter = 0

if (existsSync(imagesDir)) {
  const files = readdirSync(imagesDir).filter((f) =>
    /\.(jpe?g|png)$/i.test(f)
  )

  for (const file of files) {
    const fp = resolve(imagesDir, file)
    const stem = basename(file, extname(file)) // 如 "�一早餐"
    const buf = readFileSync(fp)
    totalBefore += buf.length

    // 跳过已经生成的副本
    if (/-(small|large)\.(webp|jpg)$/.test(file)) continue

    const img = sharp(buf, { failOn: 'none' })
    const meta = await img.metadata().catch(() => ({}))
    if (!meta.width) continue

    // 生成 small/large × webp/jpg
    const tasks = [
      { suffix: 'small', width: Math.min(SMALL_WIDTH, meta.width), fmt: 'webp' },
      { suffix: 'small', width: Math.min(SMALL_WIDTH, meta.width), fmt: 'jpg' },
      { suffix: 'large', width: Math.min(LARGE_WIDTH, meta.width), fmt: 'webp' },
      { suffix: 'large', width: Math.min(LARGE_WIDTH, meta.width), fmt: 'jpg' }
    ]

    for (const t of tasks) {
      const out = resolve(imagesDir, `${stem}-${t.suffix}.${t.fmt}`)
      const pipeline = sharp(buf).resize({
        width: t.width,
        withoutEnlargement: true
      })
      const data =
        t.fmt === 'webp'
          ? await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer()
          : await pipeline
              .jpeg({ quality: JPG_QUALITY, mozjpeg: true })
              .toBuffer()
      writeFileSync(out, data)
      totalAfter += data.length
    }
    optCount++

    // 删除原图，避免被 Vue 的 :src 默认引用（也节省 Pages 文件数）
    try {
      unlinkSync(fp)
    } catch {}
  }
  console.log(
    `[图片优化] ${optCount} 张图片处理完成，原始: ${(totalBefore / 1024).toFixed(0)}KB → 总变体: ${(totalAfter / 1024).toFixed(0)}KB（含 4 个变体/张）`
  )
} else {
  console.log('[图片优化] images 目录不存在，跳过')
}

// ---------- 预渲染每道菜的独立 HTML（用于微信卡片） ----------

const baseHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8')

function htmlEscape(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function injectMeta(html, { title, description, imageUrl, pageUrl }) {
  const t = htmlEscape(title)
  const d = htmlEscape(description)
  const img = htmlEscape(imageUrl || '')
  const u = htmlEscape(pageUrl || '')

  // 替换 <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)

  // 替换或新增 meta 标签的工具
  const setMeta = (regex, replacement) => {
    if (regex.test(html)) {
      html = html.replace(regex, replacement)
    } else {
      // 在 </head> 前插入
      html = html.replace(/<\/head>/, `    ${replacement}\n  </head>`)
    }
  }

  setMeta(
    /<meta\s+name="description"[^>]*>/,
    `<meta name="description" content="${d}" />`
  )
  setMeta(
    /<meta\s+property="og:title"[^>]*>/,
    `<meta property="og:title" content="${t}" />`
  )
  setMeta(
    /<meta\s+property="og:description"[^>]*>/,
    `<meta property="og:description" content="${d}" />`
  )
  setMeta(
    /<meta\s+property="og:image"[^>]*>/,
    `<meta property="og:image" content="${img}" />`
  )
  setMeta(
    /<meta\s+property="og:url"[^>]*>/,
    `<meta property="og:url" content="${u}" />`
  )
  setMeta(
    /<meta\s+itemprop="name"[^>]*>/,
    `<meta itemprop="name" content="${t}" />`
  )
  setMeta(
    /<meta\s+itemprop="description"[^>]*>/,
    `<meta itemprop="description" content="${d}" />`
  )
  setMeta(
    /<meta\s+itemprop="image"[^>]*>/,
    `<meta itemprop="image" content="${img}" />`
  )

  return html
}

let prerenderCount = 0
for (const day of weekDays) {
  const meals = recipes[day]?.meals || {}
  for (const mealType of Object.keys(meals)) {
    const meal = meals[mealType]
    if (!meal) continue

    const title = `${day} · ${mealType} - ${meal.dishName}`
    const description = `快来看看这道美味的宝宝辅食：${meal.dishName}，${meal.tips || '营养美味，宝宝爱吃'}`
    // imagePath 如 "/images/周一早餐.jpg" → 对中文部分 percent-encode
    // og:image 优先用优化后的 -large.jpg（更小更快）
    const buildOgImage = () => {
      if (!meal.imagePath) return `${SITE_BASE}/favicon.svg`
      const dir = meal.imagePath.substring(0, meal.imagePath.lastIndexOf('/'))
      const stem = meal.imagePath
        .substring(meal.imagePath.lastIndexOf('/') + 1)
        .replace(/\.(jpe?g|png)$/i, '')
      const largePath = `${dir}/${stem}-large.jpg`
      return `${SITE_BASE}/${largePath
        .replace(/^\//, '')
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`
    }
    const imageUrl = buildOgImage()
    const pageUrl = `${SITE_BASE}/day/${encodeURIComponent(day)}/${encodeURIComponent(mealType)}`

    const html = injectMeta(baseHtml, { title, description, imageUrl, pageUrl })

    // 生成 dist/day/{day}/{meal}.html（不带尾斜杠访问可直接 200 命中，避免 308 重定向）
    const dayDir = resolve(distDir, 'day', day)
    mkdirSync(dayDir, { recursive: true })
    writeFileSync(resolve(dayDir, `${mealType}.html`), html)
    prerenderCount++
  }
}
console.log(`[预渲染] 已为 ${prerenderCount} 个菜品生成独立 HTML`)

// ---------- 生成 Cloudflare Pages _redirects ----------
// 让确切路径优先（预渲染页存在则直接返回），其余 SPA 路由 fallback 到根 index.html
// _redirects 顺序：先匹配的优先；rewrite 用 200 状态
const redirectsContent = `# SPA fallback：未命中静态文件的所有路径都回到根 index.html
/*    /index.html   200
`
writeFileSync(resolve(distDir, '_redirects'), redirectsContent)
console.log('[Cloudflare] _redirects 已生成')

