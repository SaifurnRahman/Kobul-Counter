import qrcode from 'qrcode-generator'
import { siteUrl } from '../config'
import { ageText, dateLines, diff, fmt, num } from './dates'

const EMOJI = '"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji"'
const HIND = '"Hind Siliguri"'
const ARABIC = '"Traditional Arabic","Amiri","Times New Roman",serif'
const font = (size, weight = 600, fam = HIND) => `${weight} ${Math.round(size)}px ${fam}, ${EMOJI}, sans-serif`

let fontsReady = null
export function ensureFonts() {
  if (!fontsReady) {
    const sample = 'বিয়ের বয়স ০১২৩ abc'
    fontsReady = Promise.all([400, 500, 600, 700].map((w) => document.fonts.load(font(40, w), sample))).catch(() => {})
  }
  return fontsReady
}

// ===== drawing helpers =====
function text(ctx, str, x, y, o = {}) {
  let size = o.size || 40
  const fam = o.fam || HIND, weight = o.weight ?? 600
  ctx.font = font(size, weight, fam)
  if (o.maxW) while (ctx.measureText(str).width > o.maxW && size > 12) { size -= 1; ctx.font = font(size, weight, fam) }
  ctx.textAlign = o.align || 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = o.direction || 'ltr'
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.strokeW || size * 0.16; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y) }
  ctx.fillStyle = o.color || '#000'
  ctx.fillText(str, x, y)
  ctx.direction = 'ltr'
  return size
}
function wrap(ctx, str, maxW, size, weight = 500) {
  ctx.font = font(size, weight)
  const lines = []
  let cur = ''
  for (const w of str.split(/\s+/)) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w } else cur = test
  }
  if (cur) lines.push(cur)
  return lines
}
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}
function heartPath(ctx, cx, cy, size) {
  const k = size / 32
  ctx.beginPath()
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2
    const x = 16 * Math.sin(a) ** 3
    const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)
    const px = cx + x * k, py = cy - (y + 2.5) * k
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  }
  ctx.closePath()
}
function shapePath(ctx, shape, cx, cy, size) {
  if (shape === 'heart') heartPath(ctx, cx, cy, size * 1.12)
  else { ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2) }
}
function drawPhoto(ctx, cx, cy, size, shape, th, img) {
  ctx.save()
  shapePath(ctx, shape, cx, cy, size + th.ringW * 2 + 8)
  if (th.ringShadow) { ctx.save(); ctx.translate(10, 10); ctx.fillStyle = th.ringShadow; ctx.fill(); ctx.restore() }
  ctx.fillStyle = th.ring; ctx.fill()
  ctx.restore()
  ctx.save()
  shapePath(ctx, shape, cx, cy, size); ctx.clip()
  if (img) {
    const s = Math.max(size / img.width, size / img.height), w = img.width * s, h = img.height * s
    ctx.drawImage(img, cx - w / 2, cy - h / 2 - (shape === 'heart' ? size * 0.04 : 0), w, h)
  } else {
    ctx.fillStyle = th.placeholder; ctx.fillRect(cx - size, cy - size, size * 2, size * 2)
    text(ctx, '💑', cx, cy, { size: size * 0.42 })
  }
  ctx.restore()
}
function mandala(ctx, cx, cy, r, color) {
  ctx.save(); ctx.translate(cx, cy)
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2
  for (let ring = 0; ring < 4; ring++) {
    const rr = r * (0.28 + ring * 0.22), n = 8 + ring * 6, pl = r * 0.12
    for (let i = 0; i < n; i++) {
      ctx.save(); ctx.rotate((i / n) * Math.PI * 2 + ring * 0.2)
      ctx.beginPath(); ctx.ellipse(0, -rr, pl * 0.38, pl, 0, 0, Math.PI * 2); ctx.stroke()
      ctx.beginPath(); ctx.arc(0, -rr - pl * 1.4, 3, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    }
    ctx.save(); ctx.globalAlpha *= 0.6; ctx.beginPath(); ctx.arc(0, 0, rr + pl * 1.9, 0, Math.PI * 2); ctx.stroke(); ctx.restore()
  }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2); ctx.stroke()
  ctx.restore()
}
function star8(ctx, x, y, r) {
  ctx.beginPath()
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.55 : r
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  ctx.closePath()
}

// ===== templates =====
const THEMES = {
  trad: {
    bg(ctx, W, H) {
      const g = ctx.createRadialGradient(W / 2, H * 0.38, 50, W / 2, H / 2, H * 0.8)
      g.addColorStop(0, '#A3122A'); g.addColorStop(1, '#4E0410')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      ctx.globalAlpha = 0.55
      for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) mandala(ctx, x, y, 230, '#E8C268')
      ctx.globalAlpha = 1
      ctx.strokeStyle = '#E8C268'; ctx.lineWidth = 4; ctx.strokeRect(28, 28, W - 56, H - 56)
      ctx.lineWidth = 1.5; ctx.strokeRect(42, 42, W - 84, H - 84)
    },
    ink: '#FFF3DA', accent: '#F2CB6E', muted: '#F0D9B5', ring: '#E8C268', ringW: 8, placeholder: '#6E0A1C',
    box: 'rgba(255,230,180,.10)', boxLine: 'rgba(242,203,110,.55)',
  },
  min: {
    bg(ctx, W, H) {
      ctx.fillStyle = '#FAF6F0'; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = '#D9CBBE'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, W - 80, H - 80)
    },
    ink: '#2B2523', accent: '#C0405F', muted: '#8C7E76', ring: '#C0405F', ringW: 3, placeholder: '#EFE6DC', box: '#F2EBE2', boxLine: null,
  },
  meme: {
    bg(ctx, W, H) {
      ctx.fillStyle = '#FFD43B'; ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = 'rgba(0,0,0,.07)'
      for (let y = 0; y < H; y += 28) for (let x = ((y / 28) % 2) * 14; x < W; x += 28) { ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill() }
      ctx.strokeStyle = '#111'; ctx.lineWidth = 10; ctx.strokeRect(20, 20, W - 40, H - 40)
    },
    ink: '#111', accent: '#E0115F', muted: '#3A3000', ring: '#111', ringW: 10, ringShadow: '#E0115F', placeholder: '#FFF3B0',
    box: '#FFFFFF', boxLine: '#111', boxLineW: 4, stroke: '#FFFFFF',
  },
  isl: {
    bg(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#0F5A44'); g.addColorStop(1, '#062E23')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      ctx.strokeStyle = 'rgba(212,175,55,.13)'; ctx.lineWidth = 2
      for (let y = 0; y < H + 90; y += 90) for (let x = ((y / 90) % 2) * 45; x < W + 90; x += 90) { star8(ctx, x, y, 30); ctx.stroke() }
      ctx.strokeStyle = '#D4AF37'; ctx.lineWidth = 4; ctx.strokeRect(28, 28, W - 56, H - 56)
      ctx.lineWidth = 1.5; ctx.strokeRect(42, 42, W - 84, H - 84)
      ctx.fillStyle = '#D4AF37'
      for (const [x, y] of [[35, 35], [W - 35, 35], [35, H - 35], [W - 35, H - 35]]) { star8(ctx, x, y, 22); ctx.fill() }
    },
    ink: '#F5EFD8', accent: '#E5C158', muted: '#CFE3D7', ring: '#D4AF37', ringW: 8, placeholder: '#0B4535',
    box: 'rgba(212,175,55,.10)', boxLine: 'rgba(212,175,55,.5)',
  },
  roast: {
    bg(ctx, W, H) {
      const g = ctx.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#1B1030'); g.addColorStop(1, '#09060F')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
      const f = ctx.createLinearGradient(0, H * 0.7, 0, H)
      f.addColorStop(0, 'rgba(255,90,0,0)'); f.addColorStop(1, 'rgba(255,60,0,.35)')
      ctx.fillStyle = f; ctx.fillRect(0, H * 0.7, W, H * 0.3)
    },
    ink: '#FFFFFF', accent: '#FF8A1F', muted: '#C9B8E8', box: 'rgba(255,255,255,.06)', boxLine: 'rgba(255,138,31,.5)',
  },
}

function drawQR(ctx, x, y, size) {
  const qr = qrcode(0, 'M')
  qr.addData(siteUrl()); qr.make()
  const n = qr.getModuleCount(), pad = 2, cell = size / (n + pad * 2)
  ctx.fillStyle = '#FFFFFF'; roundRect(ctx, x, y, size, size, 10); ctx.fill()
  ctx.fillStyle = '#141414'
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++)
    if (qr.isDark(r, c)) ctx.fillRect(x + (c + pad) * cell, y + (r + pad) * cell, Math.ceil(cell), Math.ceil(cell))
}

function statBoxes(ctx, items, y, h, W, th, k, story) {
  const pad = 80, gap = 16, w = (W - pad * 2 - gap * (items.length - 1)) / items.length
  items.forEach(([value, label], i) => {
    const x = pad + i * (w + gap)
    roundRect(ctx, x, y, w, h, 18); ctx.fillStyle = th.box; ctx.fill()
    if (th.boxLine) { ctx.lineWidth = th.boxLineW || 2; ctx.strokeStyle = th.boxLine; ctx.stroke() }
    text(ctx, value, x + w / 2, y + h * 0.42, { size: (story ? 64 : 54) * k, weight: 700, color: th.accent, maxW: w - 16 })
    text(ctx, label, x + w / 2, y + h * 0.78, { size: (story ? 27 : 24) * k, color: th.muted, weight: 600, maxW: w - 12 })
  })
}

function footerBlock(ctx, y, h, W, th, showQR, label, t) {
  const url = siteUrl().replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (showQR) {
    drawQR(ctx, W - 80 - h, y, h)
    text(ctx, '💍 ' + t('appName'), 80, y + h * 0.34, { size: 40, weight: 700, color: th.accent, align: 'left', maxW: W - 200 - h })
    text(ctx, label + ' ' + url, 80, y + h * 0.72, { size: 24, color: th.muted, align: 'left', weight: 500, maxW: W - 200 - h })
  } else {
    text(ctx, '💍 ' + t('appName') + ' · ' + url, W / 2, y + h / 2, { size: 28, color: th.muted, weight: 600, maxW: W - 160 })
  }
}

// Stack blocks vertically, shrinking everything until it fits the canvas
function layout(H, top, bottom, maxGap, build) {
  let blocks
  for (let k = 1; k > 0.6; k -= 0.04) {
    blocks = build(k)
    const tot = blocks.reduce((s, b) => s + b.h, 0)
    if (tot + (blocks.length - 1) * 12 <= H - top - bottom) break
  }
  const tot = blocks.reduce((s, b) => s + b.h, 0)
  const gap = Math.min(maxGap, (H - top - bottom - tot) / Math.max(1, blocks.length - 1))
  let y = top + (H - top - bottom - tot - gap * (blocks.length - 1)) / 2
  for (const b of blocks) { b.draw(y); y += b.h + gap }
}

const kidEmoji = (k) => (k.g === 'g' ? '👧' : '👦')

// ===== married card =====
export async function drawMarriedCard(canvas, { s, st, t, lang, photoImg }) {
  await ensureFonts()
  if (!st || st.future || !canvas) return
  const story = s.size === 'story', W = 1080, H = story ? 1920 : 1080
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'), th = THEMES[s.tpl] || THEMES.trad
  const dd = diff(st.start, new Date()), dl = dateLines(lang, st.ymd)
  const meme = s.tpl === 'meme', isl = s.tpl === 'isl', so = th.stroke ? { stroke: th.stroke } : {}
  th.bg(ctx, W, H)

  layout(H, story ? 110 : 76, story ? 110 : 70, story ? 64 : 26, (k) => {
    const B = []
    // header
    if (isl) B.push({ h: (story ? 150 : 108) * k, draw: (y) => {
      text(ctx, 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ', W / 2, y + (story ? 50 : 36) * k,
        { size: (story ? 50 : 42) * k, fam: ARABIC, weight: 700, color: th.accent, direction: 'rtl', maxW: W - 180 })
      text(ctx, t('cDuaMeaning'), W / 2, y + (story ? 118 : 86) * k, { size: (story ? 27 : 23) * k, color: th.muted, weight: 500, maxW: W - 180 })
    } })
    else if (meme) B.push({ h: 70 * k, draw: (y) => {
      ctx.save(); ctx.translate(W / 2, y + 35 * k); ctx.rotate(-0.04)
      ctx.font = font(44 * k, 700)
      const w = ctx.measureText(t('cMemeBadge')).width + 50
      roundRect(ctx, -w / 2, -34 * k, w, 68 * k, 14); ctx.fillStyle = '#E0115F'; ctx.fill()
      ctx.lineWidth = 5; ctx.strokeStyle = '#111'; ctx.stroke()
      text(ctx, t('cMemeBadge'), 0, 2, { size: 44 * k, weight: 700, color: '#FFF' })
      ctx.restore()
    } })
    else B.push({ h: 40 * k, draw: (y) => text(ctx, s.tpl === 'trad' ? t('cTop') : t('cTopMin'), W / 2, y + 20 * k, { size: 32 * k, color: th.accent, weight: 600 }) })

    // photo
    const P = (story ? 470 : 260) * k, ph = P + th.ringW * 2 + 12
    B.push({ h: ph, draw: (y) => drawPhoto(ctx, W / 2, y + ph / 2, P, s.shape, th, photoImg) })

    // names with a heart between
    if (s.husband || s.wife) B.push({ h: (story ? 96 : 80) * k, draw: (y) => {
      const a = s.husband || '…', b = s.wife || '…', cy = y + (story ? 48 : 40) * k
      let sz = (story ? 76 : 64) * k
      ctx.font = font(sz, 700)
      const raw = ctx.measureText(a).width + ctx.measureText(b).width + sz * 1.5
      sz *= Math.min(1, (W - 180) / raw)
      ctx.font = font(sz, 700)
      const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width, hw = sz * 0.9, g = sz * 0.3
      let x = W / 2 - (wa + wb + hw + g * 2) / 2
      text(ctx, a, x, cy, { size: sz, weight: 700, color: th.ink, align: 'left', ...so }); x += wa + g
      heartPath(ctx, x + hw / 2, cy + 2, hw * 0.9); ctx.fillStyle = th.accent; ctx.fill(); x += hw + g
      text(ctx, b, x, cy, { size: sz, weight: 700, color: th.ink, align: 'left', ...so })
    } })

    // age
    B.push({ h: (story ? 150 : 118) * k, draw: (y) => {
      text(ctx, t('cAge'), W / 2, y + 18 * k, { size: (story ? 32 : 27) * k, color: th.muted, weight: 600 })
      text(ctx, ageText(t, lang, dd), W / 2, y + (story ? 92 : 74) * k, { size: (story ? 84 : 70) * k, weight: 700, color: th.ink, maxW: W - 160, ...so })
    } })

    // stat boxes
    const sh = (story ? 170 : 124) * k
    B.push({ h: sh, draw: (y) => statBoxes(ctx, [
      [fmt(lang, st.totalDays), t('cTotal')], [fmt(lang, st.fridays), t('cFri')],
      [num(lang, st.eids.fitr), t('cFitr')], [num(lang, st.eids.adha), t('cAdha')],
    ], y, sh, W, th, k, story) })

    // funny lines (meme template)
    if (meme) B.push({ h: (story ? 150 : 96) * k, draw: (y) => {
      const lines = [t('cMeme1', { n: fmt(lang, st.totalDays * 3) }), t('cMeme2', { n: fmt(lang, Math.round(st.totalDays * 0.7)) }), t('cMeme3')]
      const show = story ? lines : [lines[0] + '   ' + lines[2], lines[1]]
      show.forEach((l, i) => text(ctx, l, W / 2, y + (i + 0.5) * (story ? 50 : 48) * k, { size: (story ? 36 : 32) * k, weight: 700, color: '#111', maxW: W - 160 }))
    } })

    // family
    if (s.showFamily && st.kids.length) B.push({ h: (story ? 140 : 76) * k, draw: (y) => {
      const icons = '👨👩' + st.kids.map(kidEmoji).join(''), label = t('cFamily', { a: num(lang, st.before), b: num(lang, st.now) })
      if (story) {
        text(ctx, icons, W / 2, y + 38 * k, { size: 62 * k, maxW: W - 200 })
        text(ctx, label, W / 2, y + 108 * k, { size: 38 * k, color: th.ink, weight: 700, maxW: W - 160, ...so })
      } else {
        ctx.font = font(44 * k); const iw = Math.min(ctx.measureText(icons).width, 360)
        ctx.font = font(32 * k, 700); const lw = ctx.measureText(label).width
        const x0 = Math.max(80, W / 2 - (iw + 24 + lw) / 2)
        text(ctx, icons, x0, y + 38 * k, { size: 44 * k, align: 'left', maxW: 360 })
        text(ctx, label, x0 + iw + 24, y + 38 * k, { size: 32 * k, color: th.ink, weight: 700, align: 'left', maxW: W - 160 - iw - 24, ...so })
      }
    } })

    // feeling
    if (s.showFeeling && s.feeling) {
      const sz = (story ? 40 : 31) * k, lh = sz * 1.4
      const lines = wrap(ctx, `“${t('feelPrefix')} ${s.feeling}”`, W - 200, sz).slice(0, story ? 3 : 2)
      B.push({ h: lines.length * lh, draw: (y) => lines.forEach((l, i) => text(ctx, l, W / 2, y + lh * (i + 0.5), { size: sz, color: th.ink, weight: 500, ...so })) })
    }

    // dates in three calendars
    if (s.showDates) {
      if (story) B.push({ h: 150 * k, draw: (y) => [dl.greg, dl.bong, dl.hij].forEach((l, i) => text(ctx, l, W / 2, y + (i + 0.5) * 50 * k, { size: 32 * k, color: th.muted, weight: 600 })) })
      else B.push({ h: 36 * k, draw: (y) => text(ctx, `${dl.greg}  •  ${dl.bong}  •  ${dl.hij}`, W / 2, y + 18 * k, { size: 24 * k, color: th.muted, weight: 600, maxW: W - 150 }) })
    }

    // footer with QR
    const fh = (story ? 170 : 118) * k
    B.push({ h: fh, draw: (y) => footerBlock(ctx, y, fh, W, th, s.showQR, t('cMake'), t) })
    return B
  })
}

// ===== single (roast) card =====
export async function drawRoastCard(canvas, { s, sg, t, lang, roast }) {
  await ensureFonts()
  if (!sg || !canvas) return
  const story = s.sSize === 'story', W = 1080, H = story ? 1920 : 1080
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d'), th = THEMES.roast, dd = diff(sg.born, new Date())
  th.bg(ctx, W, H)

  layout(H, story ? 120 : 80, story ? 110 : 70, story ? 70 : 28, (k) => {
    const B = []
    B.push({ h: (story ? 120 : 96) * k, draw: (y) => {
      const g = ctx.createLinearGradient(200, 0, W - 200, 0)
      g.addColorStop(0, '#FFB21F'); g.addColorStop(1, '#FF2D55')
      text(ctx, t('cSingle'), W / 2, y + (story ? 60 : 48) * k, { size: (story ? 104 : 86) * k, weight: 700, color: g, maxW: W - 160 })
    } })
    if (s.sName) B.push({ h: 56 * k, draw: (y) => text(ctx, s.sName, W / 2, y + 28 * k, { size: 46 * k, weight: 600, color: th.muted, maxW: W - 200 }) })
    B.push({ h: (story ? 150 : 124) * k, draw: (y) => {
      text(ctx, t('cSingleFor'), W / 2, y + 18 * k, { size: 30 * k, color: th.muted, weight: 600 })
      text(ctx, ageText(t, lang, dd), W / 2, y + (story ? 92 : 78) * k, { size: (story ? 84 : 72) * k, weight: 700, color: th.ink, maxW: W - 160 })
    } })
    const items = [
      [num(lang, sg.eids.fitr + sg.eids.adha), t('sEid')], [fmt(lang, sg.fridays), t('sFri')],
      [fmt(lang, sg.ammu), t('cAmmu')], [fmt(lang, sg.dawat), t('cDawat')],
    ]
    if (story) {
      B.push({ h: 180 * k, draw: (y) => statBoxes(ctx, items.slice(0, 2), y, 180 * k, W, th, k, true) })
      B.push({ h: 180 * k, draw: (y) => statBoxes(ctx, items.slice(2), y, 180 * k, W, th, k, true) })
    } else B.push({ h: 124 * k, draw: (y) => statBoxes(ctx, items, y, 124 * k, W, th, k, false) })
    const sz = (story ? 42 : 34) * k, lh = sz * 1.4, lines = wrap(ctx, roast, W - 200, sz, 600).slice(0, 3)
    B.push({ h: lines.length * lh, draw: (y) => lines.forEach((l, i) => text(ctx, l, W / 2, y + lh * (i + 0.5), { size: sz, color: '#FFE2C2', weight: 600 })) })
    B.push({ h: (story ? 90 : 70) * k, draw: (y) => text(ctx, '🔥🔥🔥', W / 2, y + (story ? 45 : 35) * k, { size: (story ? 72 : 56) * k }) })
    const fh = (story ? 170 : 118) * k
    B.push({ h: fh, draw: (y) => footerBlock(ctx, y, fh, W, th, true, t('cRoastMake'), t) })
    return B
  })
}

export const canvasBlob = (c) => new Promise((r) => c.toBlob(r, 'image/png'))
