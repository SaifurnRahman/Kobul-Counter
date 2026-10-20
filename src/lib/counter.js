import { useCallback, useEffect, useState } from 'react'
import { CONFIG } from '../config'

// Free public counters via abacus.jasoncameron.dev — no signup needed.
// On localhost we only read, so testing doesn't inflate the real numbers.
const isLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)

async function hit(op, key) {
  if (isLocal) op = 'get'
  try {
    const r = await fetch(`${CONFIG.COUNTER_API}/${op}/${CONFIG.COUNTER_NS}/${key}`)
    if (!r.ok) throw new Error()
    const j = await r.json()
    return j.value ?? null
  } catch {
    return null
  }
}

let started = false
export function useSiteCounts() {
  const [counts, setCounts] = useState({ visits: null, downloads: null, dua: null })

  useEffect(() => {
    if (started) return // StrictMode runs effects twice in dev
    started = true
    let first = true
    try { first = !sessionStorage.getItem('kobul-v'); sessionStorage.setItem('kobul-v', '1') } catch { /* ignore */ }
    Promise.all([hit(first ? 'hit' : 'get', 'visits'), hit('get', 'downloads'), hit('get', 'dua')]).then(([visits, downloads, dua]) => {
      // a key that was never hit returns an error; treat as 0 when the service itself is up
      setCounts({ visits, downloads: visits == null ? downloads : downloads ?? 0, dua: visits == null ? dua : dua ?? 0 })
    })
  }, [])

  const bump = useCallback(async (key) => {
    const v = await hit('hit', key)
    if (v != null) setCounts((c) => ({ ...c, [key]: v }))
  }, [])

  return { counts, bump }
}
