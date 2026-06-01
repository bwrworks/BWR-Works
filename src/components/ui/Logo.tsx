import React from 'react'
import brandLogo from '../../assets/bwr-brand.svg'

export default function Logo({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <img 
      src={brandLogo} 
      alt="BWR Works Logo" 
      className={className} 
      style={{ ...style, objectFit: 'contain' }} 
    />
  )
}
