const suspiciousChars = ['鍙', '鐧', '閭', '楠', '瀵', '鎿', '璇', '鏍', '澶', '鎴', '娉', '淇']

function looksLikeMojibake(text: string) {
  if (/\?{2,}|�/.test(text)) return true

  let count = 0
  for (const char of suspiciousChars) {
    if (text.includes(char)) {
      count += 1
      if (count >= 2) return true
    }
  }

  return false
}

export function resolveDisplayMessage(message: unknown, fallback: string) {
  const text = String(message || '').trim()
  if (!text) return fallback
  return looksLikeMojibake(text) ? fallback : text
}
