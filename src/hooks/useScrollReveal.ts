import { useEffect } from 'react'

/**
 * Hook that observes elements with reveal classes
 * and adds 'visible' when they enter the viewport.
 * Supports: .reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target) // Only animate once
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -30px 0px' }
    )

    // Observe all reveal variant classes
    const selectors = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-blur'
    const elements = document.querySelectorAll(selectors)
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])
}
