import React from 'react'

export default function Logo({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <img 
      src="/BWR_Logo.svg" 
      alt="BWR Works Logo" 
      className={className} 
      style={{ ...style, objectFit: 'contain' }} 
    />
  )
}
