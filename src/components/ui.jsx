import { useEffect, useRef, useState } from 'react'
import { animate, motion } from 'framer-motion'

export const inputCls =
  'w-full min-h-11 rounded-xl border border-line bg-surface-2 px-3 py-2 text-ink placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30'

export function Card({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={`rounded-2xl border border-line bg-surface p-5 shadow-[0_1px_2px_rgba(60,30,20,.05),0_10px_30px_rgba(60,30,20,.06)] dark:shadow-none ${className}`}
    >
      {children}
    </motion.div>
  )
}

export function CardTitle({ icon, children }) {
  return (
    <h3 className="mb-4 flex items-center gap-2 text-lg font-bold">
      <span aria-hidden>{icon}</span>
      {children}
    </h3>
  )
}

export function Field({ label, htmlFor, children, full }) {
  return (
    <div className={`grid gap-1 ${full ? 'sm:col-span-2' : ''}`}>
      <label htmlFor={htmlFor} className="text-sm font-semibold text-muted">{label}</label>
      {children}
    </div>
  )
}

export function Chip({ on, onClick, children }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
        on ? 'border-accent bg-accent text-on-accent' : 'border-line bg-surface-2 hover:border-accent'
      }`}
    >
      {children}
    </motion.button>
  )
}

export function Button({ primary, className = '', children, ...props }) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-4 py-2 font-semibold transition-colors disabled:opacity-60 ${
        primary ? 'border-accent bg-accent text-on-accent shadow-lg shadow-accent/25' : 'border-line bg-surface hover:border-accent'
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  )
}

// Animated number that counts up to `value`
export function CountUp({ value, format }) {
  const [v, setV] = useState(0)
  const prev = useRef(0)
  useEffect(() => {
    const c = animate(prev.current, value, { duration: 1.3, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) })
    prev.current = value
    return () => c.stop()
  }, [value])
  return format(v)
}

export function StatCard({ icon, title, value, unit, line, format, delay }) {
  return (
    <Card delay={delay}>
      <CardTitle icon={icon}>{title}</CardTitle>
      <div className="flex items-center gap-4">
        <div className="text-5xl font-bold leading-none text-accent tabular-nums">
          <CountUp value={value} format={format} />
        </div>
        <div>
          <strong>{unit}</strong>
          {line && <p className="mt-0.5 text-sm text-muted">{line}</p>}
        </div>
      </div>
    </Card>
  )
}
