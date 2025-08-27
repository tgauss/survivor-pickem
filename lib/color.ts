export function sanitizeHex(hex?: string): string | undefined {
  if (!hex) return undefined
  
  // Remove leading # if present
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex
  
  // Validate hex format (3 or 6 chars)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex)) {
    return undefined
  }
  
  // Expand 3-char hex to 6-char
  const fullHex = cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('')
    : cleanHex
  
  return `#${fullHex.toUpperCase()}`
}

export function luminance(hex: string): number {
  const sanitized = sanitizeHex(hex)
  if (!sanitized) return 0
  
  const rgb = sanitized.slice(1).match(/.{2}/g)
  if (!rgb) return 0
  
  const [r, g, b] = rgb.map(component => {
    const value = parseInt(component, 16) / 255
    return value <= 0.03928 
      ? value / 12.92 
      : Math.pow((value + 0.055) / 1.055, 2.4)
  })
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastColor(hex: string): '#000000' | '#FFFFFF' {
  const lum = luminance(hex)
  return lum > 0.5 ? '#000000' : '#FFFFFF'
}

export function mix(hexA: string, hexB: string, t: number): string {
  const sanitizedA = sanitizeHex(hexA)
  const sanitizedB = sanitizeHex(hexB)
  
  if (!sanitizedA || !sanitizedB) {
    return sanitizedA || sanitizedB || '#000000'
  }
  
  const rgbA = sanitizedA.slice(1).match(/.{2}/g)!.map(c => parseInt(c, 16))
  const rgbB = sanitizedB.slice(1).match(/.{2}/g)!.map(c => parseInt(c, 16))
  
  const mixed = rgbA.map((a, i) => {
    const b = rgbB[i]
    return Math.round(a + (b - a) * t)
  })
  
  return `#${mixed.map(c => c.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

// Safe fallback colors
export const DEFAULT_PRIMARY = '#1F2937'
export const DEFAULT_SECONDARY = '#E6E8EA'
export const DEFAULT_TEXT = '#E6E8EA'