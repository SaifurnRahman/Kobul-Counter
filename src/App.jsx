import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AppContext } from './AppContext'
import { makeT } from './lib/i18n'
import { store, usePersistentState } from './lib/storage'
import { useSiteCounts } from './lib/counter'
import { loadAnalytics, track } from './lib/analytics'
import Header from './components/Header'
import AskScreen from './components/AskScreen'
import MarriedPage from './components/MarriedPage'
import SinglePage from './components/SinglePage'
import Footer from './components/Footer'

const DEFAULTS = {
  mode: null, husband: '', wife: '', wDate: '', wTime: '', feeling: '', photo: null, kids: [],
  tpl: 'trad', size: 'square', shape: 'circle', showFamily: true, showFeeling: true, showDates: true, showQR: true,
  sName: '', bDate: '', sSize: 'square',
}

export default function App() {
  const [s, setS] = usePersistentState('kobul', DEFAULTS)
  const [lang, setLang] = usePersistentState('kobul-lang', 'bn')
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { counts, bump } = useSiteCounts()
  const t = useMemo(() => makeT(lang), [lang])

  useEffect(() => { document.documentElement.lang = lang; document.title = t('appName') }, [lang, t])
  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(loadAnalytics, [])

  const update = useCallback((patch) => setS((p) => ({ ...p, ...patch })), [setS])
  const setMode = useCallback((mode) => { update({ mode }); if (mode) track(`mode/${mode}`, mode === 'married' ? 'Chose: married' : 'Chose: single'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [update])

  const ctx = {
    s, update, lang, setLang, t, counts, bump, dark, setMode,
    goHome: () => setMode(null),
    toggleTheme: () => setDark((d) => { store.set('kobul-theme', d ? 'light' : 'dark'); return !d }),
    reset: () => { if (confirm(t('resetConfirm'))) { store.del('kobul'); setS(DEFAULTS) } },
  }

  const Page = s.mode === 'married' ? MarriedPage : s.mode === 'single' ? SinglePage : AskScreen

  return (
    <AppContext.Provider value={ctx}>
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={s.mode || 'ask'}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </main>
        <Footer />
      </div>
    </AppContext.Provider>
  )
}
