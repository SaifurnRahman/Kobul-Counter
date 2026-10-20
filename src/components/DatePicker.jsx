import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../AppContext'
import { GREG_BN, GREG_EN, dateLines, dayNum, hijri, num, parseYMD, todayNum, validYMD } from '../lib/dates'

const pad = (n) => String(n).padStart(2, '0')
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`
const todayStr = () => { const n = new Date(); return toStr(n.getFullYear(), n.getMonth(), n.getDate()) }
const MIN_YEAR = 1940
const POP_W = 340

function HeartShape({ className }) {
  return (
    <svg viewBox="0 0 32 29" className={className} aria-hidden>
      <path fill="currentColor" d="M16 28.5C7 21.6 1 16.3 1 9.6 1 4.8 4.8 1 9.5 1c2.8 0 5.2 1.4 6.5 3.5C17.3 2.4 19.7 1 22.5 1 27.2 1 31 4.8 31 9.6c0 6.7-6 12-15 18.9z" />
    </svg>
  )
}

// slide the month grid left/right depending on direction
const slide = {
  enter: (dir) => ({ x: dir * 48, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir * -48, opacity: 0 }),
}

function Calendar({ value, onPick, onClose, max, love, t, lang }) {
  const uid = useId()
  const sel = validYMD(value) ? parseYMD(value) : null
  const start = sel || parseYMD(max && max < todayStr() ? max : todayStr())
  const [cur, setCur] = useState({ y: start.y, m: start.m })
  const [view, setView] = useState('days') // days | months | years
  const [dir, setDir] = useState(1)
  const months = lang === 'bn' ? GREG_BN : GREG_EN
  const today = todayStr()

  const step = (n) => {
    setDir(n > 0 ? 1 : -1)
    setCur(({ y, m }) => {
      if (view === 'days') { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() } }
      if (view === 'months') return { y: y + n, m }
      return { y: y + n * 12, m }
    })
  }

  // ----- day grid (Saturday first, like Bangladeshi calendars) -----
  const first = new Date(cur.y, cur.m, 1)
  const offset = (first.getDay() + 1) % 7
  const cells = Array.from({ length: 42 }, (_, i) => {
    const date = new Date(cur.y, cur.m, i - offset + 1)
    const y = date.getFullYear(), m = date.getMonth(), d = date.getDate(), str = toStr(y, m, d)
    const h = hijri(dayNum(y, m, d))
    const eid = h.m === 9 && h.d === 1 ? 'fitr' : h.m === 11 && h.d === 10 ? 'adha' : null
    return { str, d, inMonth: m === cur.m, fri: date.getDay() === 5, eid, disabled: (max && str > max) || y < MIN_YEAR }
  })

  const yearStart = cur.y - ((cur.y - MIN_YEAR) % 12)
  const title = view === 'days' ? `${months[cur.m]} ${num(lang, cur.y)}`
    : view === 'months' ? num(lang, cur.y)
    : `${num(lang, yearStart)} – ${num(lang, yearStart + 11)}`

  const picked = sel && dateLines(lang, sel)
  const diffDays = sel && todayNum() - dayNum(sel.y, sel.m, sel.d)
  const weekday = sel && t('weekdaysFull')[new Date(sel.y, sel.m, sel.d).getDay()]

  return (
    <div className="select-none">
      {/* header */}
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-accent to-[#7a0a26] px-4 pb-4 pt-4 text-white dark:to-[#8a1238]">
        <span className="pointer-events-none absolute -right-4 -top-6 text-7xl opacity-15" aria-hidden>{love ? '💍' : '📅'}</span>
        <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{love ? t('wDate') : t('pickDate')}</div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={value || 'none'} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -10, opacity: 0 }} transition={{ duration: 0.2 }}>
            {picked ? (
              <>
                <div className="text-2xl font-bold leading-tight">{picked.greg}</div>
                <div className="text-sm opacity-90">{weekday}</div>
              </>
            ) : (
              <div className="text-2xl font-bold leading-tight opacity-80">— — —</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-3">
        {/* nav */}
        <div className="mb-2 flex items-center justify-between">
          <button type="button" aria-label="Previous" onClick={() => step(-1)} className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-surface-2">‹</button>
          <button
            type="button"
            onClick={() => setView(view === 'days' ? 'months' : view === 'months' ? 'years' : 'days')}
            className="rounded-full px-3 py-1 font-bold hover:bg-surface-2"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={title} className="inline-block" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.15 }}>
                {title} <span className="text-xs text-muted">▾</span>
              </motion.span>
            </AnimatePresence>
          </button>
          <button type="button" aria-label="Next" onClick={() => step(1)} className="grid h-9 w-9 place-items-center rounded-full text-lg hover:bg-surface-2">›</button>
        </div>

        <div className="relative h-[284px] overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            {view === 'days' && (
              <motion.div key={`d-${cur.y}-${cur.m}`} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22, ease: 'easeOut' }} className="absolute inset-0">
                <div className="mb-1 grid grid-cols-7 text-center text-xs font-bold">
                  {t('weekdays').map((w, i) => (
                    <div key={w} className={`py-1 ${i === 6 ? 'text-accent' : 'text-muted'}`}>{w}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-y-0.5">
                  {cells.map((c, i) => {
                    const isSel = c.str === value, isToday = c.str === today
                    return (
                      <motion.button
                        key={c.str}
                        type="button"
                        disabled={c.disabled}
                        onClick={() => onPick(c.str)}
                        whileHover={c.disabled ? undefined : { scale: 1.12 }}
                        whileTap={c.disabled ? undefined : { scale: 0.9 }}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(i * 0.006, 0.25) }}
                        title={c.eid ? t(c.eid) : undefined}
                        className={`relative grid h-10 place-items-center rounded-full text-sm font-semibold tabular-nums transition-colors
                          ${!c.inMonth ? 'opacity-35' : ''} ${c.disabled ? 'cursor-not-allowed opacity-20' : ''}
                          ${c.fri && !isSel ? 'bg-accent/[.06] text-accent' : ''}`}
                      >
                        {isSel && (
                          <motion.span layoutId={`sel-${uid}`} className="absolute inset-0 grid place-items-center text-accent" transition={{ type: 'spring', stiffness: 420, damping: 30 }}>
                            {love ? <HeartShape className="h-11 w-11 drop-shadow-[0_3px_6px_rgba(179,18,58,.4)]" /> : <span className="h-9 w-9 rounded-full bg-accent shadow-md shadow-accent/40" />}
                          </motion.span>
                        )}
                        {isToday && !isSel && <span className="absolute inset-1 rounded-full border-2 border-dashed border-gold" />}
                        <span className={`relative z-10 ${isSel ? 'text-on-accent' : ''} ${love && isSel ? '-mt-1' : ''}`}>{num(lang, c.d)}</span>
                        {c.eid && <span className="absolute -top-0.5 right-0.5 z-10 text-[10px] leading-none">🌙</span>}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {view === 'months' && (
              <motion.div key={`m-${cur.y}`} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="absolute inset-0 grid grid-cols-3 gap-2 pt-2">
                {months.map((name, m) => {
                  const on = sel && sel.y === cur.y && sel.m === m
                  const disabled = max && toStr(cur.y, m, 1) > max
                  return (
                    <motion.button
                      key={name} type="button" disabled={disabled}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: m * 0.02 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setCur({ y: cur.y, m }); setView('days') }}
                      className={`rounded-2xl border text-sm font-semibold disabled:opacity-25 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-2 hover:border-accent'}`}
                    >
                      {name}
                    </motion.button>
                  )
                })}
              </motion.div>
            )}

            {view === 'years' && (
              <motion.div key={`y-${yearStart}`} custom={dir} variants={slide} initial="enter" animate="center" exit="exit" transition={{ duration: 0.22 }} className="absolute inset-0 grid grid-cols-3 gap-2 pt-2">
                {Array.from({ length: 12 }, (_, i) => yearStart + i).map((y, i) => {
                  const on = sel && sel.y === y
                  const disabled = y < MIN_YEAR || (max && `${y}` > max.slice(0, 4))
                  return (
                    <motion.button
                      key={y} type="button" disabled={disabled}
                      initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.02 }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => { setCur({ y, m: cur.m }); setView('months') }}
                      className={`rounded-2xl border text-base font-bold disabled:opacity-25 ${on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-2 hover:border-accent'}`}
                    >
                      {num(lang, y)}
                    </motion.button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* legend */}
        <div className="mt-1 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-accent/30" />{t('legendFri')}</span>
          <span>🌙 {t('legendEid')}</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full border border-dashed border-gold" />{t('legendToday')}</span>
        </div>

        {/* selected date in three calendars */}
        <AnimatePresence initial={false}>
          {picked && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-3 grid gap-1 rounded-2xl bg-surface-2 p-3 text-xs">
                <div className="flex justify-between gap-2"><span className="text-muted">🌾 {t('bangla')}</span><b>{picked.bong}</b></div>
                <div className="flex justify-between gap-2"><span className="text-muted">🌙 {t('hijri')}</span><b>{picked.hij}</b></div>
                <div className="flex justify-between gap-2"><span className="text-muted">⏳</span><b>{diffDays === 0 ? t('today') : diffDays > 0 ? t('daysAgo', { n: num(lang, diffDays.toLocaleString('en-IN')) }) : t('daysLater', { n: num(lang, (-diffDays).toLocaleString('en-IN')) })}</b></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* actions */}
        <div className="mt-3 flex items-center gap-2">
          <button type="button" onClick={() => { if (!max || today <= max) { const p = parseYMD(today); setDir(1); setCur({ y: p.y, m: p.m }); setView('days'); onPick(today, true) } }} className="rounded-full px-3 py-1.5 text-sm font-semibold text-accent hover:bg-accent/10">
            {t('today')}
          </button>
          {value && (
            <button type="button" onClick={() => onPick('', true)} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-surface-2">
              {t('clear')}
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={onClose} className="rounded-full bg-accent px-4 py-1.5 text-sm font-bold text-on-accent">
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DatePicker({ id, value, onChange, max, love, ariaLabel, className = '' }) {
  const { t, lang } = useApp()
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const triggerRef = useRef(null)
  const popRef = useRef(null)
  const closeTimer = useRef(null)

  const place = useCallback(() => {
    const r = triggerRef.current?.getBoundingClientRect()
    if (!r) return
    const vw = window.innerWidth, vh = window.innerHeight
    if (vw < 640) { setPos({ sheet: true }); return }
    // never cover the trigger: open on the roomier side and scroll inside if needed
    const h = popRef.current?.scrollHeight || 620
    const left = Math.min(Math.max(8, r.left), vw - POP_W - 8)
    const spaceBelow = vh - r.bottom - 16, spaceAbove = r.top - 16
    const below = h <= spaceBelow || (h > spaceAbove && spaceBelow >= spaceAbove)
    const maxH = below ? spaceBelow : spaceAbove
    const top = below ? r.bottom + 8 : r.top - 8 - Math.min(h, maxH)
    setPos({ left, top, below, maxH })
  }, [])

  useLayoutEffect(() => { if (open) place() }, [open, place])
  // re-place once the popover has rendered and its real height is known
  useEffect(() => {
    if (!open) return
    const id = requestAnimationFrame(place)
    return () => cancelAnimationFrame(id)
  }, [open, place])
  useEffect(() => {
    if (!open) return
    const onDown = (e) => { if (!popRef.current?.contains(e.target) && !triggerRef.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, place])
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const pick = (str, stay) => {
    onChange(str)
    clearTimeout(closeTimer.current)
    if (!stay && str) closeTimer.current = setTimeout(() => setOpen(false), 450) // let the heart land first
  }

  const lines = validYMD(value) && dateLines(lang, parseYMD(value))
  const sheet = pos?.sheet

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-11 w-full items-center gap-2 rounded-xl border bg-surface-2 px-3 py-2 text-left transition ${open ? 'border-accent ring-2 ring-accent/30' : 'border-line hover:border-accent'} ${className}`}
      >
        <motion.span animate={open ? { rotate: [0, -15, 15, 0], scale: 1.15 } : { scale: 1 }} transition={{ duration: 0.4 }}>
          {love ? '💍' : '📅'}
        </motion.span>
        <span className={`flex-1 truncate ${lines ? 'font-semibold' : 'text-muted/70'}`}>{lines ? lines.greg : t('pickDate')}</span>
        <span className="text-xs text-muted">▾</span>
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <>
              {sheet && (
                <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
              )}
              <motion.div
                key="pop"
                ref={popRef}
                role="dialog"
                aria-label={ariaLabel || t('pickDate')}
                initial={sheet ? { y: '100%' } : { opacity: 0, scale: 0.92, y: pos.below ? -10 : 10 }}
                animate={sheet ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }}
                exit={sheet ? { y: '100%' } : { opacity: 0, scale: 0.95, y: pos.below ? -6 : 6 }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                style={sheet ? undefined : { left: pos.left, top: pos.top, width: POP_W, maxHeight: pos.maxH, overflowY: 'auto', transformOrigin: pos.below ? 'top left' : 'bottom left' }}
                className={`fixed z-50 border border-line bg-surface text-ink shadow-2xl shadow-black/25 ${
                  sheet ? 'inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)]' : 'rounded-3xl'
                }`}
              >
                {sheet && <div className="absolute left-1/2 top-2 z-10 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/50" />}
                <Calendar value={value} onPick={pick} onClose={() => setOpen(false)} max={max} love={love} t={t} lang={lang} />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}

export { todayStr }
