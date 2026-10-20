import { useApp } from '../AppContext'
import { fmt } from '../lib/dates'
import { CountUp } from './ui'

export default function Footer() {
  const { t, lang, counts, reset } = useApp()
  const show = counts.visits != null || counts.downloads != null
  const f = (v) => fmt(lang, v)
  return (
    <footer className="border-t border-line py-6 text-center text-sm text-muted">
      <div className="mx-auto max-w-5xl px-4">
        {show && (
          <div className="mb-2 flex flex-wrap justify-center gap-5 font-semibold text-ink">
            <span>👀 {t('visits')}: {counts.visits == null ? '–' : <CountUp value={counts.visits} format={f} />}</span>
            <span>📥 {t('downloads')}: {counts.downloads == null ? '–' : <CountUp value={counts.downloads} format={f} />}</span>
          </div>
        )}
        <div>
          💍 {t('appName')} · {t('footer')} ·{' '}
          <button className="p-1 text-accent underline" onClick={reset}>{t('reset')}</button>
        </div>
      </div>
    </footer>
  )
}
