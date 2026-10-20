import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../AppContext'

export default function Header() {
  const { t, lang, setLang, dark, toggleTheme, goHome } = useApp()
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center gap-3 px-4">
        <a href="#" onClick={(e) => { e.preventDefault(); goHome() }} className="flex items-center gap-2 text-xl font-bold text-accent">
          <motion.span animate={{ rotate: [0, -12, 12, 0] }} transition={{ repeat: Infinity, repeatDelay: 4, duration: 0.8 }}>💍</motion.span>
          {t('appName')}
        </a>
        <div className="flex-1" />
        <button
          onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
          className="min-h-9 rounded-full border border-line bg-surface px-3 text-sm font-semibold hover:border-accent"
        >
          {lang === 'bn' ? 'English' : 'বাংলা'}
        </button>
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-line bg-surface hover:border-accent"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={dark ? 'sun' : 'moon'} initial={{ y: 18, rotate: -90, opacity: 0 }} animate={{ y: 0, rotate: 0, opacity: 1 }} exit={{ y: -18, rotate: 90, opacity: 0 }} transition={{ duration: 0.25 }}>
              {dark ? '☀️' : '🌙'}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  )
}
