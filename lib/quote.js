export function loadQuote() {
  try { return JSON.parse(localStorage.getItem('arambhika_quote') || '[]') } catch { return [] }
}

export function saveQuote(q) {
  try { localStorage.setItem('arambhika_quote', JSON.stringify(q)) } catch {}
}
