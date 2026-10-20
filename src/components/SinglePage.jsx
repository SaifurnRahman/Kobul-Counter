import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../AppContext'
import { useToday } from '../hooks/useNow'
import { fmt, num, singleStats } from '../lib/dates'
import { drawRoastCard } from '../lib/card'
import { T } from '../lib/i18n'
import { store } from '../lib/storage'
import { track } from '../lib/analytics'
import LiveCounter from './LiveCounter'
import DatePicker, { todayStr } from './DatePicker'
import CardPreview from './CardPreview'
import { Card, CardTitle, Chip, Field, StatCard, inputCls } from './ui'

export default function SinglePage() {
  const { t, lang, s, update, setMode, counts, bump } = useApp()
  const today = useToday()
  const sg = useMemo(() => singleStats(s, today), [s.bDate, today]) // eslint-disable-line react-hooks/exhaustive-deps
  const roasts = T[lang].roasts
  const [idx, setIdx] = useState(0)
  const [prayed, setPrayed] = useState(() => !!store.get('kobul-dua', false))

  useEffect(() => {
    const id = setInterval(() => setIdx((i) => i + 1), 4500)
    return () => clearInterval(id)
  }, [])
  const roast = roasts[idx % roasts.length]

  async function pray() {
    if (prayed) return
    setPrayed(true); store.set('kobul-dua', true)
    track('dua', 'Dua requested')
    await bump('dua')
  }

  return (
    <div className="grid gap-4 py-7">
      <Card className="text-center">
        <motion.h2
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="mb-1 text-3xl font-bold sm:text-4xl"
        >
          🔥 <span className="fire-text">{t('roastTitle')}</span> 🔥
        </motion.h2>
        <p className="text-muted">{t('roastSub')}</p>
      </Card>

      <Card>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('yourName')} htmlFor="sName">
            <input id="sName" className={inputCls} maxLength={30} placeholder={t('yourNamePh')} value={s.sName} onChange={(e) => update({ sName: e.target.value })} />
          </Field>
          <Field label={t('birthDate')} htmlFor="bDate">
            <DatePicker id="bDate" value={s.bDate} max={todayStr()} ariaLabel={t('birthDate')} onChange={(v) => update({ bDate: v })} />
          </Field>
        </div>
      </Card>

      {!sg && <Card className="py-8 text-center text-muted">{t('enterBirth')}</Card>}

      {sg && (
        <>
          <Card>
            <CardTitle icon="🥲">{t('singleFor')}</CardTitle>
            <LiveCounter start={sg.born} />
          </Card>

          <Card className="grid min-h-24 place-items-center text-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={roast}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                transition={{ duration: 0.35 }}
                className="text-xl font-semibold"
              >
                {roast}
              </motion.p>
            </AnimatePresence>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard icon="🌙" title={lang === 'bn' ? 'ঈদ' : 'Eid'} value={sg.eids.fitr + sg.eids.adha} unit={t('sEid')} line={t('sEidSub')} format={(v) => num(lang, v)} />
            <StatCard icon="🕌" title={t('fridayTitle')} value={sg.fridays} unit={t('sFri')} line={t('sFriSub')} format={(v) => fmt(lang, v)} delay={0.05} />
            <StatCard icon="👩‍🦳" title={lang === 'bn' ? 'আম্মু' : 'Mom'} value={sg.ammu} unit={t('sAmmu')} line={t('sAmmuSub')} format={(v) => fmt(lang, v)} />
            <StatCard icon="🍛" title={lang === 'bn' ? 'দাওয়াত' : 'Invites'} value={sg.dawat} unit={t('sDawat')} line={t('sDawatSub')} format={(v) => fmt(lang, v)} delay={0.05} />
          </div>

          <Card className="text-center">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={pray}
              disabled={prayed}
              className="rounded-2xl bg-accent px-8 py-4 text-xl font-bold text-on-accent shadow-xl shadow-accent/30 disabled:opacity-80"
            >
              🤲 {prayed ? t('duaDone') : t('duaBtn')}
            </motion.button>
            {counts.dua != null && <p className="mt-3 text-sm text-muted">{t('duaCount', { n: fmt(lang, counts.dua) })}</p>}
          </Card>

          <Card>
            <CardTitle icon="🖼️">{t('roastCard')}</CardTitle>
            <CardPreview
              story={s.sSize === 'story'}
              filename="kobul-counter-single.png"
              event={`roast-${s.sSize}`}
              deps={[s.sSize, s.sName, sg, lang, roast]}
              draw={(canvas) => drawRoastCard(canvas, { s, sg, t, lang, roast })}
              options={
                <div className="mb-4">
                  <p className="mb-2 text-sm font-semibold text-muted">{t('size')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[['square', 'sizeSq'], ['story', 'sizeSt']].map(([v, l]) => (
                      <Chip key={v} on={s.sSize === v} onClick={() => update({ sSize: v })}>{t(l)}</Chip>
                    ))}
                  </div>
                </div>
              }
            />
          </Card>
        </>
      )}

      <p className="text-center">
        <button className="p-1 text-accent underline" onClick={() => setMode('married')}>{t('actuallyMarried')}</button>
      </p>
    </div>
  )
}
