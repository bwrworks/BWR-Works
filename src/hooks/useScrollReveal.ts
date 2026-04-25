import { useEffect, useRef } from 'react'

/**
 * Hook that observes elements with reveal classes
 * and adds 'visible' when they enter the viewport.
 * Uses MutationObserver to catch dynamically-rendered elements (Convex data).
 * Supports: .reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur
 */

const SELECTORS = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur'

export function useScrollReveal() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    // Intersection observer — triggers 'visible' class when element enters viewport
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            io.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    )
    observerRef.current = io

    // Observe all existing reveal elements
    const observe = () => {
      document.querySelectorAll(SELECTORS).forEach((el) => {
        if (!el.classList.contains('visible')) {
          io.observe(el)
        }
      })
    }

    // Initial pass
    observe()

    // MutationObserver — watches for new elements added by React/Convex after data loads
    const mo = new MutationObserver(() => {
      observe()
    })
    mo.observe(document.body, { childList: true, subtree: true })

    // Re-observe after a short delay to catch async-rendered content
    const t = setTimeout(observe, 500)

    return () => {
      io.disconnect()
      mo.disconnect()
      clearTimeout(t)
    }
  }, [])
}
