import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../AppContext'

const ICONS = ['❤️', '💍', '💕', '🌸', '💐', '✨', '💖', '🕊️']

function FloatingHearts() {
  const items = useMemo(
    () => Array.from({ length: 18 }, (_, i) => ({
      icon: ICONS[i % ICONS.length], left: Math.random() * 100, size: 16 + Math.random() * 22,
      delay: Math.random() * 8, dur: 9 + Math.random() * 8, drift: (Math.random() - 0.5) * 80,
    })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {items.map((it, i) => (
        <motion.span
          key={i}
          className="absolute bottom-[-40px]"
          style={{ left: `${it.left}%`, fontSize: it.size }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-110vh', x: it.drift, opacity: [0, 0.7, 0.7, 0], rotate: it.drift / 2 }}
          transition={{ duration: it.dur, delay: it.delay, repeat: Infinity, ease: 'linear' }}
        >
          {it.icon}
        </motion.span>
      ))}
    </div>
  )
}

export default function AskScreen() {
  const { t, setMode } = useApp()
  return (
    <section className="relative grid min-h-[calc(100vh-9rem)] place-items-center py-10 text-center">
      <FloatingHearts />
      <div className="relative">
        <motion.h1
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mb-2 text-5xl font-bold leading-tight text-accent sm:text-7xl"
        >
          {t('appName')}
        </motion.h1>
        <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-10 text-lg text-muted">
          {t('tagline')}
        </motion.p>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-6 text-2xl font-bold sm:text-4xl">
          {t('askQ')}
        </motion.h2>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-wrap justify-center gap-4">
          <motion.button
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('married')}
            className="min-w-44 rounded-2xl bg-accent px-8 py-4 text-xl font-bold text-on-accent shadow-xl shadow-accent/30"
          >
            {t('askYes')}
          </motion.button>
          <motion.button
            whileHover={{ y: -4, rotate: [0, -3, 3, 0] }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setMode('single')}
            className="min-w-44 rounded-2xl border-2 border-line bg-surface px-8 py-4 text-xl font-bold"
          >
            {t('askNo')}
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
