import { CONFIG } from '../config'

// GoatCounter: free, privacy-friendly analytics (https://www.goatcounter.com)
// Page views are counted automatically; track() sends custom events (downloads etc.).
// GoatCounter ignores localhost by default, so local testing is not counted.

let loaded = false
export function loadAnalytics() {
  if (loaded || !CONFIG.GOATCOUNTER_CODE) return
  loaded = true
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${CONFIG.GOATCOUNTER_CODE}.goatcounter.com/count`
  document.head.appendChild(s)
}

const queue = []
export function track(name, title = name) {
  if (!CONFIG.GOATCOUNTER_CODE) return
  const send = () => window.goatcounter?.count?.({ path: name, title, event: true })
  if (window.goatcounter?.count) send()
  else { queue.push(send); if (queue.length === 1) waitForScript() }
}
function waitForScript(tries = 0) {
  if (window.goatcounter?.count) { while (queue.length) queue.shift()(); return }
  if (tries < 40) setTimeout(() => waitForScript(tries + 1), 250)
  else queue.length = 0
}
