import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useApp } from '../AppContext'
import { useToday } from '../hooks/useNow'
import { ageText, dateLines, diff, fmt, marriedStats, num, parseYMD, validYMD } from '../lib/dates'
import { drawMarriedCard } from '../lib/card'
import MarriageForm from './MarriageForm'
import LiveCounter from './LiveCounter'
import CardPreview from './CardPreview'
import { Card, CardTitle, Chip, StatCard } from './ui'

const kidEmoji = (k) => (k.g === 'g' ? '👧' : '👦')

function usePhotoImage(src) {
  const [img, setImg] = useState(null)
  useEffect(() => {
    if (!src) { setImg(null); return }
    const im = new Image()
    im.onload = () => setImg(im)
    im.src = src
  }, [src])
  return img
}

function Celebration({ st }) {
  const { t, lang } = useApp()
  const msg = st.isAnniv ? t('anniversary', { n: num(lang, st.years) })
    : st.totalDays > 0 && st.totalDays % 100 === 0 ? t('milestone', { n: fmt(lang, st.totalDays) }) : null
  const fired = useRef(false)
  useEffect(() => {
    if (msg && !fired.current) { fired.current = true; confetti({ particleCount: 160, spread: 100, origin: { y: 0.3 } }) }
  }, [msg])
  if (!msg) return null
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl bg-gradient-to-r from-accent to-gold p-4 text-center text-lg font-bold text-white shadow-lg"
    >
      {msg}
    </motion.div>
  )
}

function FamilyCard({ st }) {
  const { t, lang } = useApp()
  const icons = ['👨', '👩', ...st.kids.map(kidEmoji)]
  return (
    <Card>
      <CardTitle icon="👨‍👩‍👧‍👦">{t('familyTitle')}</CardTitle>
      <div className="flex flex-wrap gap-1 text-4xl">
        {icons.map((e, i) => (
          <motion.span key={i + e} initial={{ scale: 0, rotate: -30 }} whileInView={{ scale: 1, rotate: 0 }} viewport={{ once: true }} transition={{ type: 'spring', delay: i * 0.08 }}>
            {e}
          </motion.span>
        ))}
      </div>
      <p className="my-2 text-xl font-bold">
        {st.kids.length ? t('familyLine', { a: num(lang, st.before), b: num(lang, st.now) }) : t('noKids')}
      </p>
      {st.kids.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {st.kids.map((k) => {
            let age = ''
            if (validYMD(k.dob)) {
              const { y, m, d } = parseYMD(k.dob), born = new Date(y, m, d)
              age = born <= new Date() ? ageText(t, lang, diff(born, new Date())) : '🤰'
            }
            return (
              <li key={k.id} className="flex flex-wrap justify-between gap-2 rounded-xl bg-surface-2 px-3 py-2">
                <span>{kidEmoji(k)} <strong>{k.name || '—'}</strong></span>
                <span className="text-muted">{age}</span>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function DatesCard({ ymd }) {
  const { t, lang } = useApp()
  const dl = dateLines(lang, ymd)
  return (
    <Card delay={0.1}>
      <CardTitle icon="📅">{t('datesTitle')}</CardTitle>
      <div className="grid gap-2">
        {[['english', dl.greg], ['bangla', dl.bong], ['hijri', dl.hij]].map(([k, v]) => (
          <div key={k} className="flex flex-wrap justify-between gap-2 border-b border-dashed border-line pb-2 last:border-0">
            <span className="text-muted">{t(k)}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
    </Card>
  )
}

function CardOptions() {
  const { t, s, update } = useApp()
  const group = (key, items) => (
    <div className="flex flex-wrap gap-2">
      {items.map(([v, label]) => <Chip key={v} on={s[key] === v} onClick={() => update({ [key]: v })}>{t(label)}</Chip>)}
    </div>
  )
  return (
    <div className="grid gap-4">
      <div><p className="mb-2 text-sm font-semibold text-muted">{t('template')}</p>{group('tpl', [['trad', 'tplTrad'], ['min', 'tplMin'], ['meme', 'tplMeme'], ['isl', 'tplIsl']])}</div>
      <div><p className="mb-2 text-sm font-semibold text-muted">{t('size')}</p>{group('size', [['square', 'sizeSq'], ['story', 'sizeSt']])}</div>
      <div><p className="mb-2 text-sm font-semibold text-muted">{t('shape')}</p>{group('shape', [['circle', 'circle'], ['heart', 'heart']])}</div>
      <div>
        <p className="mb-1 text-sm font-semibold text-muted">{t('show')}</p>
        {['showFamily', 'showFeeling', 'showDates', 'showQR'].map((k) => (
          <label key={k} className="my-1.5 flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-[18px] w-[18px] accent-accent" checked={s[k]} onChange={(e) => update({ [k]: e.target.checked })} />
            {t(k)}
          </label>
        ))}
      </div>
    </div>
  )
}

export default function MarriedPage() {
  const { t, lang, s, setMode } = useApp()
  const today = useToday()
  const st = useMemo(() => marriedStats(s, today), [s.wDate, s.wTime, s.kids, today]) // eslint-disable-line react-hooks/exhaustive-deps
  const photoImg = usePhotoImage(s.photo)
  const ok = st && !st.future

  return (
    <div className="grid gap-4 py-7">
      <MarriageForm />

      {!ok && (
        <Card className="py-8 text-center text-muted">{st?.future ? t('futureDate') : t('enterDate')}</Card>
      )}

      {ok && (
        <>
          <Celebration st={st} />
          <Card>
            <CardTitle icon="⏳">{t('liveTitle')}</CardTitle>
            <LiveCounter start={st.start} showTotal />
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard icon="🕌" title={t('fridayTitle')} value={st.fridays} unit={t('fridayUnit')} line={t('fridayLine')} format={(v) => fmt(lang, v)} />
            <Card delay={0.1}>
              <CardTitle icon="🌙">{t('eidTitle')}</CardTitle>
              <div className="grid grid-cols-2 gap-3">
                {[['fitr', st.eids.fitr], ['adha', st.eids.adha]].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-surface-2 p-3 text-center">
                    <div className="text-4xl font-bold text-accent">{num(lang, v)}</div>
                    <div className="font-semibold">{t(k)}</div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">{t('eidNote')}</p>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FamilyCard st={st} />
            <DatesCard ymd={st.ymd} />
          </div>

          <Card>
            <CardTitle icon="🖼️">{t('cardTitle')}</CardTitle>
            <CardPreview
              story={s.size === 'story'}
              filename="kobul-counter-card.png"
              event={`card-${s.tpl}-${s.size}`}
              options={<CardOptions />}
              deps={[s, st, lang, photoImg]}
              draw={(canvas) => drawMarriedCard(canvas, { s, st, t, lang, photoImg })}
            />
          </Card>
        </>
      )}

      <p className="text-center">
        <button className="p-1 text-accent underline" onClick={() => setMode('single')}>{t('actuallySingle')}</button>
      </p>
    </div>
  )
}
