'use client'

import React, { useRef, useEffect } from 'react'

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>
  size?: number
  strokeWidth?: number
  className?: string
}

export function DonutChart({ 
  data, 
  size = 120, 
  strokeWidth = 12,
  className = '' 
}: DonutChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // High DPI support
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)
    
    const centerX = size / 2
    const centerY = size / 2
    const radius = (size - strokeWidth) / 2
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    const total = data.reduce((sum, item) => sum + item.value, 0)
    if (total === 0) return
    
    let currentAngle = -Math.PI / 2 // Start at top
    
    data.forEach(item => {
      const sliceAngle = (item.value / total) * 2 * Math.PI
      
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.strokeStyle = item.color
      ctx.lineWidth = strokeWidth
      ctx.lineCap = 'round'
      ctx.stroke()
      
      currentAngle += sliceAngle
    })
  }, [data, size, strokeWidth])
  
  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`block ${className}`}
      style={{ width: size, height: size }}
    />
  )
}