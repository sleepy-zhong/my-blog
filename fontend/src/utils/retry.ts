export function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export interface RetryOptions {
  retries?: number
  baseDelayMs?: number
  onRetry?: (attempt: number, error: unknown) => void
}

export async function withRetry<T>(
  task: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 2,
    baseDelayMs = 400,
    onRetry,
  } = options

  let attempt = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await task()
    } catch (error) {
      if (attempt >= retries) throw error
      attempt += 1
      try {
        if (typeof onRetry === 'function') onRetry(attempt, error)
      } catch {
        // ignore errors thrown by onRetry
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }
}

