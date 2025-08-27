'use client'

import React, { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  decay: number
}

interface ConfettiClientProps {
  trigger: boolean
  onComplete?: () => void
  colors?: string[]
  particleCount?: number
  duration?: number
}

export function ConfettiClient({ 
  trigger, 
  onComplete,
  colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
  particleCount = 100,
  duration = 3000
}: ConfettiClientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])
  const startTimeRef = useRef<number>()
  
  useEffect(() => {
    if (!trigger) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Create particles
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      life: 1,
      decay: Math.random() * 0.02 + 0.005,
    }))
    
    startTimeRef.current = Date.now()
    
    const animate = () => {
      const now = Date.now()
      const elapsed = now - (startTimeRef.current || now)
      
      if (elapsed > duration) {
        onComplete?.()
        return
      }
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particlesRef.current = particlesRef.current.filter(particle => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.2 // gravity
        particle.life -= particle.decay
        
        // Draw particle
        if (particle.life > 0) {
          ctx.save()
          ctx.globalAlpha = particle.life
          ctx.fillStyle = particle.color
          ctx.fillRect(particle.x, particle.y, particle.size, particle.size)
          ctx.restore()
          return true
        }
        
        return false
      })
      
      if (particlesRef.current.length > 0 || elapsed < duration) {
        animationRef.current = requestAnimationFrame(animate)
      } else {
        onComplete?.()
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [trigger, colors, particleCount, duration, onComplete])
  
  if (!trigger) return null
  
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ background: 'transparent' }}
    />
  )
}