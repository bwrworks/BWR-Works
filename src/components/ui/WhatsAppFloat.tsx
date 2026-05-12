import styles from './WhatsAppFloat.module.css'
import { useLocation } from 'react-router-dom'

const WA_NUMBER = '918431797007'
const WA_MESSAGE = 'Hi BWR Works! I have a question about your custom crafted products.'

// Official WhatsApp SVG icon
function WhatsAppIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 2C8.268 2 2 8.268 2 16c0 2.417.636 4.685 1.748 6.65L2 30l7.574-1.717A13.934 13.934 0 0016 30c7.732 0 14-6.268 14-14S23.732 2 16 2z"
        fill="#25D366"
      />
      <path
        d="M16 4C9.373 4 4 9.373 4 16c0 2.16.57 4.186 1.568 5.937L4.5 27.5l5.7-1.457A11.953 11.953 0 0016 28c6.627 0 12-5.373 12-12S22.627 4 16 4z"
        fill="white"
      />
      <path
        d="M21.8 18.8c-.3-.15-1.77-.87-2.044-.97-.273-.1-.47-.15-.668.15-.198.3-.768.97-.94 1.167-.173.198-.347.223-.645.074-.297-.148-1.255-.463-2.39-1.476-.883-.788-1.48-1.761-1.654-2.059-.173-.297-.018-.457.13-.605.134-.133.298-.347.447-.52.148-.174.197-.298.297-.497.099-.198.05-.372-.025-.52-.074-.149-.668-1.614-.917-2.209-.241-.579-.486-.5-.668-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.199 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.117.57-.084 1.757-.718 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"
        fill="#25D366"
      />
    </svg>
  )
}

export default function WhatsAppFloat() {
  const { pathname } = useLocation()
  
  // Hide on checkout to prevent overlapping the payment button (UX-9)
  if (pathname === '/checkout') return null

  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.float}
      aria-label="Chat with us on WhatsApp"
      id="whatsapp-float-btn"
    >
      <span className={styles.icon}>
        <WhatsAppIcon />
      </span>
      <span className={styles.label}>Chat with us</span>
    </a>
  )
}
