import { useEffect, useState } from 'react'

export const store = {
  get(k, def) { try { const v = localStorage.getItem(k); return v == null ? def : JSON.parse(v) } catch { return def } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true } catch { return false } },
  del(k) { try { localStorage.removeItem(k) } catch { /* ignore */ } },
}

export function usePersistentState(key, initial) {
  const [state, setState] = useState(() => {
    const saved = store.get(key, null)
    return typeof initial === 'object' && initial && !Array.isArray(initial) ? { ...initial, ...(saved || {}) } : (saved ?? initial)
  })
  useEffect(() => {
    // the photo can be too big for localStorage — then keep it in memory only
    if (!store.set(key, state) && state && state.photo) store.set(key, { ...state, photo: null })
  }, [key, state])
  return [state, setState]
}
