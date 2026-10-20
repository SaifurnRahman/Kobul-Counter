// ===== Numbers =====
const BN_DIG = '০১২৩৪৫৬৭৮৯'
export const toBn = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIG[d])
export const num = (lang, n) => (lang === 'bn' ? toBn(n) : String(n))
export const fmt = (lang, n) => (lang === 'bn' ? toBn(Number(n).toLocaleString('en-IN')) : Number(n).toLocaleString('en-US'))

// ===== Month names =====
export const GREG_BN = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর']
export const GREG_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const BONG_BN = ['বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন', 'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র']
const BONG_EN = ['Boishakh', 'Joishtho', 'Asharh', 'Srabon', 'Bhadro', 'Ashwin', 'Kartik', 'Ogrohayon', 'Poush', 'Magh', 'Falgun', 'Choitro']
const HIJ_BN = ['মুহাররম', 'সফর', 'রবিউল আউয়াল', 'রবিউস সানি', 'জমাদিউল আউয়াল', 'জমাদিউস সানি', 'রজব', 'শাবান', 'রমজান', 'শাওয়াল', 'জিলকদ', 'জিলহজ']
const HIJ_EN = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah']

// ===== Day numbers (days since 1970-01-01, timezone-free) =====
export const DAY = 864e5
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0
export const dayNum = (y, m, d) => Math.floor(Date.UTC(y, m, d) / DAY)
export const todayNum = () => { const n = new Date(); return dayNum(n.getFullYear(), n.getMonth(), n.getDate()) }
export const parseYMD = (s) => { const [y, m, d] = s.split('-').map(Number); return { y, m: m - 1, d } }
export const validYMD = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && +s.slice(0, 4) > 1900

// Bangladesh revised Bangla calendar (2019): 1 Boishakh = 14 April
export function bongabdo(y, m, d) {
  const startY = m > 3 || (m === 3 && d >= 14) ? y : y - 1
  let off = dayNum(y, m, d) - dayNum(startY, 3, 14)
  const lens = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, isLeap(startY + 1) ? 30 : 29, 30]
  let i = 0
  while (off >= lens[i]) { off -= lens[i]; i++ }
  return { d: off + 1, m: i, y: startY - 593 }
}

// Hijri via the browser's built-in Umm al-Qura calendar
let hijriFmt
try {
  hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' })
  if (!/islamic/.test(hijriFmt.resolvedOptions().calendar)) throw new Error()
} catch {
  hijriFmt = new Intl.DateTimeFormat('en-u-ca-islamic', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' })
}
export function hijri(dn) {
  const p = {}
  for (const x of hijriFmt.formatToParts(new Date(dn * DAY + DAY / 2))) p[x.type] = parseInt(x.value, 10)
  return { d: p.day, m: p.month - 1, y: p.year }
}

export function dateLines(lang, { y, m, d }) {
  const b = bongabdo(y, m, d), h = hijri(dayNum(y, m, d))
  if (lang === 'bn') return {
    greg: `${toBn(d)} ${GREG_BN[m]} ${toBn(y)}`,
    bong: `${toBn(b.d)} ${BONG_BN[b.m]} ${toBn(b.y)} বঙ্গাব্দ`,
    hij: `${toBn(h.d)} ${HIJ_BN[h.m]} ${toBn(h.y)} হিজরি`,
  }
  return { greg: `${d} ${GREG_EN[m]} ${y}`, bong: `${b.d} ${BONG_EN[b.m]} ${b.y} BS`, hij: `${h.d} ${HIJ_EN[h.m]} ${h.y} AH` }
}

// ===== Calendar-accurate difference =====
function addMonths(base, n) {
  const y = base.getFullYear(), m = base.getMonth() + n
  const dim = new Date(y, m + 1, 0).getDate()
  return new Date(y, m, Math.min(base.getDate(), dim), base.getHours(), base.getMinutes(), base.getSeconds())
}
export function diff(start, now) {
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()) + 1
  while (months > 0 && addMonths(start, months) > now) months--
  let rem = Math.floor((now - addMonths(start, months)) / 1000)
  const d = Math.floor(rem / 86400); rem -= d * 86400
  const h = Math.floor(rem / 3600); rem -= h * 3600
  const mi = Math.floor(rem / 60)
  return { y: Math.floor(months / 12), m: months % 12, d, h, mi, s: rem - mi * 60, totalMs: now - start }
}
export function ageText(t, lang, dd) {
  const parts = []
  if (dd.y) parts.push(`${num(lang, dd.y)} ${t('years')}`)
  if (dd.y || dd.m) parts.push(`${num(lang, dd.m)} ${t('months')}`)
  parts.push(`${num(lang, dd.d)} ${t('days')}`)
  return lang === 'en' ? parts.join(' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()) : parts.join(' ')
}

// Fridays in [a, b]. 1970-01-01 was a Thursday, so Friday ⇔ n % 7 == 1
export const countFridays = (a, b) => (b < a ? 0 : Math.floor((b - 1) / 7) - Math.floor((a - 2) / 7))

// Eid al-Fitr = 1 Shawwal, Eid al-Adha = 10 Dhul Hijjah
const eidCache = new Map()
export function countEids(a, b) {
  const key = a + '-' + b
  if (eidCache.has(key)) return eidCache.get(key)
  let fitr = 0, adha = 0
  for (let n = a; n <= b; n++) {
    const h = hijri(n)
    if (h.m === 9 && h.d === 1) fitr++
    else if (h.m === 11 && h.d === 10) adha++
  }
  const r = { fitr, adha }
  eidCache.set(key, r)
  return r
}

// ===== Derived stats =====
export function weddingStart(s) {
  if (!validYMD(s.wDate)) return null
  const { y, m, d } = parseYMD(s.wDate)
  const [hh, mm] = (s.wTime || '00:00').split(':').map(Number)
  return new Date(y, m, d, hh || 0, mm || 0, 0)
}
export function marriedStats(s, today) {
  const start = weddingStart(s)
  if (!start) return null
  if (start > new Date()) return { future: true }
  const ymd = parseYMD(s.wDate), a = dayNum(ymd.y, ymd.m, ymd.d)
  const kids = s.kids.filter((k) => k.name || k.dob)
  const isAnniv = (() => { const n = new Date(); return n.getMonth() === ymd.m && n.getDate() === ymd.d && n.getFullYear() > ymd.y })()
  return {
    start, ymd, totalDays: today - a, fridays: countFridays(a, today), eids: countEids(a, today),
    kids, before: 2, now: 2 + kids.length, isAnniv, years: new Date().getFullYear() - ymd.y,
  }
}
export function singleStats(s, today) {
  if (!validYMD(s.bDate)) return null
  const { y, m, d } = parseYMD(s.bDate), born = new Date(y, m, d)
  if (born >= new Date()) return null
  const a = dayNum(y, m, d), dd = diff(born, new Date())
  const weeksSince20 = Math.max(0, (today - dayNum(y + 20, m, d)) / 7)
  return {
    born, eids: countEids(a, today), fridays: countFridays(a, today),
    ammu: Math.round(weeksSince20 * 2), dawat: Math.max(0, Math.round((dd.y - 12) * 5)),
  }
}
