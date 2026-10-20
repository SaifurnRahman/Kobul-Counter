import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useApp } from '../AppContext'
import { canvasBlob } from '../lib/card'
import { siteUrl } from '../config'
import { track } from '../lib/analytics'
import { Button } from './ui'

const canShareFiles = (() => {
  try { return !!navigator.canShare?.({ files: [new File([''], 'x.png', { type: 'image/png' })] }) } catch { return false }
})()

function celebrate() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 }, colors: ['#B3123A', '#E8C268', '#F0527A', '#FFFFFF'] })
}

// Renders a canvas card preview + download/share buttons.
// `draw(canvas)` paints the card; `deps` re-trigger painting.
// `event` names the GoatCounter event, e.g. "card-trad-square".
export default function CardPreview({ draw, deps, story, filename, options, event }) {
  const { t, bump } = useApp()
  const ref = useRef(null)
  const [busy, setBusy] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const id = setTimeout(() => draw(ref.current).then(() => setVersion((v) => v + 1)), 120)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  async function getBlob() {
    await draw(ref.current)
    return canvasBlob(ref.current)
  }
  async function download() {
    setBusy(true)
    const blob = await getBlob(), a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = filename
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 4000)
    setBusy(false); celebrate(); bump('downloads'); track(`download/${event}`, 'Card download')
  }
  async function share() {
    const file = new File([await getBlob()], filename, { type: 'image/png' })
    try { await navigator.share({ files: [file], title: t('appName'), text: siteUrl() }); celebrate(); bump('downloads'); track(`share/${event}`, 'Card share') } catch { /* cancelled */ }
  }

  return (
    <div className="grid items-start gap-5 md:grid-cols-2">
      <div>
        {options}
        <div className="mt-2 flex flex-wrap gap-3">
          <Button primary onClick={download} disabled={busy}>⬇️ {busy ? t('rendering') : t('download')}</Button>
          {canShareFiles && <Button onClick={share}>📤 {t('share')}</Button>}
        </div>
      </div>
      <div className="grid place-items-center rounded-2xl bg-surface-2 p-3">
        <motion.canvas
          key={story ? 'story' : 'sq'}
          ref={ref}
          width={1080}
          height={story ? 1920 : 1080}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: version ? 1 : 0.3, scale: 1 }}
          transition={{ duration: 0.4 }}
          className={`h-auto w-full rounded-lg shadow-2xl ${story ? 'max-w-[270px]' : 'max-w-[420px]'}`}
        />
      </div>
    </div>
  )
}
