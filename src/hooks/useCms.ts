import { useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'

/**
 * Global CMS hook — fetches all CMS content once
 * and provides a helper to read values with fallbacks.
 * Returns { cms, isLoaded } where cms(section, key, fallback) => string
 */
export function useCms() {
  const allContent = useQuery(api.cms.getAll)

  const cms = (section: string, key: string, fallback: string): string => {
    if (!allContent) return fallback
    const entry = allContent.find((c) => c.section === section && c.key === key)
    const val = entry?.value
    if (val === null || val === undefined) return fallback
    if (typeof val !== 'string') return fallback
    return val || fallback
  }

  return { cms, isLoaded: allContent !== undefined }
}
