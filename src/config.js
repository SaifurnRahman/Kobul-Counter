// ===== Deploy করার আগে এখানে বদলান =====
export const CONFIG = {
  // QR কোডে যে লিংক যাবে। খালি রাখলে সাইট যেখানে হোস্ট করা, সেই লিংকই নেবে।
  SITE_URL: '',
  FALLBACK_URL: 'https://kobul-counter.netlify.app',
  // ফ্রি ভিজিটর/ডাউনলোড কাউন্টার (abacus.jasoncameron.dev — সাইনআপ লাগে না)
  COUNTER_API: 'https://abacus.jasoncameron.dev',
  COUNTER_NS: 'kobul-counter-bd-2026', // নিজের মতো একটা ইউনিক নাম দিন
  // GoatCounter ড্যাশবোর্ড (ফ্রি): goatcounter.com-এ অ্যাকাউন্ট খুলে কোডটা এখানে দিন।
  // যেমন কোড 'kobul' হলে ড্যাশবোর্ড: https://kobul.goatcounter.com — খালি রাখলে বন্ধ থাকবে।
  GOATCOUNTER_CODE: '',
}

export const siteUrl = () =>
  CONFIG.SITE_URL || (/^https?:/.test(location.protocol) && !/localhost|127\.0\.0\.1/.test(location.hostname)
    ? location.origin + location.pathname
    : CONFIG.FALLBACK_URL)
