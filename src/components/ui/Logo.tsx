import React from 'react'

export default function Logo({ className, style }: { className?: string, style?: React.CSSProperties }) {
  return (
    <svg 
      className={className} 
      style={style} 
      viewBox="0 0 380 140" 
      xmlns="http://www.w3.org/2000/svg"
      fillRule="evenodd"
      clipRule="evenodd"
    >
      {/* B */}
      <path 
        d="M 10,10 L 65,10 A 23,23 0 0 1 65,56 L 60,56 L 65,56 A 27,27 0 0 1 65,110 L 10,110 Z M 38,25 L 55,25 A 7.5,7.5 0 0 1 55,40 L 38,40 Z M 38,70 L 58,70 A 12.5,12.5 0 0 1 58,95 L 38,95 Z" 
        fill="currentColor" 
      />
      
      {/* W */}
      <polygon 
        points="95,10 120,110 145,110 162,45 179,110 204,110 229,10 202,10 188,65 174,10 150,10 136,65 122,10" 
        fill="currentColor" 
      />
      
      {/* R - Black Part */}
      <path 
        d="M 240,10 L 290,10 A 22.5,22.5 0 0 1 290,55 L 268,55 L 268,110 L 240,110 Z M 268,25 L 285,25 A 7.5,7.5 0 0 1 285,40 L 268,40 Z" 
        fill="currentColor" 
      />
      
      {/* R - Orange Accent (Parallelogram) */}
      <polygon 
        points="273,60 333,60 358,110 298,110" 
        fill="var(--orange, #FF6B00)" 
      />
      
      {/* WORKS */}
      <g transform="scale(1.3, 1)">
        <text 
          x="145" 
          y="135" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontWeight="900" 
          fontSize="22" 
          fill="var(--orange, #FF6B00)" 
          letterSpacing="0.25em"
          textAnchor="middle"
        >
          WORKS
        </text>
      </g>
    </svg>
  )
}
