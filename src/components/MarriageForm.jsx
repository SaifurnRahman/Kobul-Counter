import { AnimatePresence, motion } from 'framer-motion'
import { useApp } from '../AppContext'
import { Card, CardTitle, Field, inputCls } from './ui'
import DatePicker, { todayStr } from './DatePicker'

// Downscale the photo so it fits in localStorage and draws fast
function resizePhoto(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image()
    im.onload = () => {
      const k = Math.min(1, max / Math.max(im.width, im.height))
      const c = document.createElement('canvas')
      c.width = Math.round(im.width * k); c.height = Math.round(im.height * k)
      c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.86))
    }
    im.onerror = reject
    im.src = url
  })
}

export default function MarriageForm() {
  const { t, s, update } = useApp()
  const setKid = (i, patch) => update({ kids: s.kids.map((k, j) => (j === i ? { ...k, ...patch } : k)) })

  return (
    <Card>
      <CardTitle icon="📝">{t('formTitle')}</CardTitle>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('husband')} htmlFor="husband">
          <input id="husband" className={inputCls} maxLength={30} placeholder={t('husbandPh')} value={s.husband} onChange={(e) => update({ husband: e.target.value })} />
        </Field>
        <Field label={t('wife')} htmlFor="wife">
          <input id="wife" className={inputCls} maxLength={30} placeholder={t('wifePh')} value={s.wife} onChange={(e) => update({ wife: e.target.value })} />
        </Field>
        <Field label={t('wDate')} htmlFor="wDate">
          <DatePicker id="wDate" love value={s.wDate} max={todayStr()} ariaLabel={t('wDate')} onChange={(v) => update({ wDate: v })} />
        </Field>
        <Field label={t('wTime')} htmlFor="wTime">
          <input id="wTime" type="time" className={inputCls} value={s.wTime} onChange={(e) => update({ wTime: e.target.value })} />
        </Field>
        <Field label={t('feeling')} htmlFor="feeling" full>
          <div className="flex items-center overflow-hidden rounded-xl border border-line bg-surface-2 transition focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
            <span className="whitespace-nowrap pl-3 pr-1 font-bold text-accent">{t('feelPrefix')}</span>
            <input id="feeling" className="min-h-11 w-full bg-transparent px-2 py-2 outline-none placeholder:text-muted/70" maxLength={70} placeholder={t('feelPh')} value={s.feeling} onChange={(e) => update({ feeling: e.target.value })} />
          </div>
        </Field>

        <Field label={t('photo')} full>
          <div className="flex flex-wrap items-center gap-3">
            <motion.div
              key={s.photo ? 'p' : 'n'}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="grid h-16 w-16 place-items-center rounded-full border-2 border-accent/40 bg-surface-2 bg-cover bg-center text-2xl"
              style={s.photo ? { backgroundImage: `url(${s.photo})` } : undefined}
            >
              {!s.photo && '💑'}
            </motion.div>
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-xl border border-line bg-surface px-4 font-semibold hover:border-accent">
              {t('choosePhoto')}
              <input
                type="file" accept="image/*" hidden
                onChange={async (e) => { const f = e.target.files[0]; e.target.value = ''; if (f) update({ photo: await resizePhoto(f) }) }}
              />
            </label>
            {s.photo && (
              <button className="min-h-9 rounded-lg border border-line px-3 text-sm hover:border-accent" onClick={() => update({ photo: null })}>
                {t('remove')}
              </button>
            )}
          </div>
        </Field>

        <Field label={t('kids')} full>
          <AnimatePresence initial={false}>
            {s.kids.map((k, i) => (
              <motion.div
                key={k.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-[1.3fr_1fr_auto_auto] sm:items-center">
                  <input className={inputCls} maxLength={24} placeholder={t('kidName')} value={k.name} onChange={(e) => setKid(i, { name: e.target.value })} />
                  <DatePicker value={k.dob} ariaLabel={k.name || t('kidName')} onChange={(v) => setKid(i, { dob: v })} />
                  <div className="flex overflow-hidden rounded-xl border border-line">
                    {[['b', 'boy'], ['g', 'girl']].map(([g, label]) => (
                      <button key={g} type="button" onClick={() => setKid(i, { g })} className={`min-h-11 flex-1 px-3 text-sm whitespace-nowrap transition-colors ${k.g === g ? 'bg-accent text-on-accent' : 'bg-surface-2'}`}>
                        {t(label)}
                      </button>
                    ))}
                  </div>
                  <button type="button" aria-label="remove" onClick={() => update({ kids: s.kids.filter((_, j) => j !== i) })} className="min-h-11 rounded-xl border border-line px-3 hover:border-accent">
                    ✕
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div>
            <button
              type="button"
              disabled={s.kids.length >= 12}
              onClick={() => update({ kids: [...s.kids, { id: Date.now(), name: '', dob: '', g: 'b' }] })}
              className="min-h-9 rounded-lg border border-dashed border-accent/60 px-3 text-sm font-semibold text-accent hover:bg-accent/5"
            >
              + {t('addKid')}
            </button>
          </div>
        </Field>
      </div>
    </Card>
  )
}
