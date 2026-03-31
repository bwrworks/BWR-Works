import { useEffect, useState } from 'react'
import styles from './CustomCursor.module.css'

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Only mount on devices with a fine pointer (mouse)
    if (!window.matchMedia('(pointer: fine)').matches) return

    setIsVisible(true)

    const addEventListeners = () => {
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseenter', onMouseEnter)
      document.addEventListener('mouseleave', onMouseLeave)
      
      // Add hover detection for links and buttons
      const interactables = document.querySelectorAll('a, button, input, textarea, select, [role="button"]')
      interactables.forEach(el => {
        el.addEventListener('mouseenter', () => setIsHovering(true))
        el.addEventListener('mouseleave', () => setIsHovering(false))
      })
    }

    const removeEventListeners = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseenter', onMouseEnter)
      document.removeEventListener('mouseleave', onMouseLeave)
      
      const interactables = document.querySelectorAll('a, button, input, textarea, select, [role="button"]')
      interactables.forEach(el => {
        el.removeEventListener('mouseenter', () => setIsHovering(true))
        el.removeEventListener('mouseleave', () => setIsHovering(false))
      })
    }

    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }

    const onMouseEnter = () => setIsVisible(true)
    const onMouseLeave = () => setIsVisible(false)

    // MutationObserver to attach to dynamically rendered links/buttons
    const observer = new MutationObserver(() => {
      removeEventListeners()
      addEventListeners()
    })
    
    observer.observe(document.body, { childList: true, subtree: true })

    addEventListeners()

    return () => {
      removeEventListeners()
      observer.disconnect()
    }
  }, [])

  if (!isVisible) return null

  return (
    <div 
      className={`${styles.cursor} ${isHovering ? styles.hovering : ''}`} 
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`
      }}
    />
  )
}
