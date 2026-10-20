import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../AppContext'
import { useNow } from '../hooks/useNow'
import { diff, fmt, num, DAY } from '../lib/dates'

const UNITS = ['years', 'months', 'days', 'hours', 'minutes', 'seconds']

function Cell({ value, label, highlight }) {
  return (
    <div className="rounded-2xl bg-surface-2 px-1 py-3 text-center">
      <div className="relative h-12 overflow-hidden sm:h-14">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.b
            key={value}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '-100%', opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute inset-0 grid place-items-center text-4xl font-bold tabular-nums sm:text-5xl ${highlight ? 'text-accent' : ''}`}
          >
            {value}
          </motion.b>
        </AnimatePresence>
      </div>
      <span className="text-sm text-muted">{label}</span>
    </div>
  )
}

export default function LiveCounter({ start, showTotal }) {
  const { t, lang } = useApp()
  const now = useNow()
  const dd = diff(start, now)
  const vals = [dd.y, dd.m, dd.d, dd.h, dd.mi, dd.s]
  return (
    <>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {UNITS.map((u, i) => (
          <Cell key={u} label={t(u)} highlight={i === 5} value={num(lang, i > 2 ? String(vals[i]).padStart(2, '0') : vals[i])} />
        ))}
      </div>
      {showTotal && (
        <p className="mt-3 text-center text-muted">
          {t('totalLine', { d: fmt(lang, Math.floor(dd.totalMs / DAY)), h: fmt(lang, Math.floor(dd.totalMs / 36e5)) })}
        </p>
      )}
    </>
  )
}
