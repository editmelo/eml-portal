import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { QUOTE_POOL, LS_KEYS } from '../lib/constants'
import { quoteDayStr, seededRandom } from '../lib/utils'

/**
 * Quote Store — serves one random motivational quote per 24 hours.
 * Persists to localStorage so the quote doesn't change on refresh.
 *
 * The seeded random ensures the same quote for the same calendar day
 * even across devices/sessions (no server needed).
 */
const useQuoteStore = create(
  persist(
    (set, get) => ({
      quote: null,
      cachedDate: null,

      /** Returns today's quote, generating it fresh if the day has changed */
      getDailyQuote: () => {
        const today = quoteDayStr()
        const { quote, cachedDate } = get()

        if (cachedDate === today && quote) return quote

        const idx = Math.floor(seededRandom(today) * QUOTE_POOL.length)
        const newQuote = QUOTE_POOL[idx]
        set({ quote: newQuote, cachedDate: today })
        return newQuote
      },
    }),
    {
      name: LS_KEYS.QUOTE_CACHE,
      partialize: (state) => ({ quote: state.quote, cachedDate: state.cachedDate }),
    }
  )
)

export default useQuoteStore
