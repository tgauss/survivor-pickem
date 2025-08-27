import { describe, it, expect } from 'vitest'
import { sanitizeHex, contrastColor, luminance, mix } from '../lib/color'

describe('Color Utilities', () => {
  describe('sanitizeHex', () => {
    it('should normalize lowercase hex colors', () => {
      expect(sanitizeHex('abcdef')).toBe('#ABCDEF')
      expect(sanitizeHex('#abcdef')).toBe('#ABCDEF')
    })
    
    it('should add missing # prefix', () => {
      expect(sanitizeHex('FF0000')).toBe('#FF0000')
      expect(sanitizeHex('f00')).toBe('#FF0000')
    })
    
    it('should expand 3-char hex to 6-char', () => {
      expect(sanitizeHex('f00')).toBe('#FF0000')
      expect(sanitizeHex('#abc')).toBe('#AABBCC')
    })
    
    it('should return undefined for invalid hex', () => {
      expect(sanitizeHex('invalid')).toBeUndefined()
      expect(sanitizeHex('gggggg')).toBeUndefined()
      expect(sanitizeHex('')).toBeUndefined()
      expect(sanitizeHex(undefined)).toBeUndefined()
    })
    
    it('should handle valid 6-char hex', () => {
      expect(sanitizeHex('123456')).toBe('#123456')
      expect(sanitizeHex('#789ABC')).toBe('#789ABC')
    })
  })

  describe('luminance', () => {
    it('should calculate correct luminance values', () => {
      expect(luminance('#000000')).toBeCloseTo(0, 3)
      expect(luminance('#FFFFFF')).toBeCloseTo(1, 3)
      expect(luminance('#FF0000')).toBeCloseTo(0.2126, 3)
    })
    
    it('should handle invalid hex gracefully', () => {
      expect(luminance('invalid')).toBe(0)
      expect(luminance('')).toBe(0)
    })
  })

  describe('contrastColor', () => {
    it('should choose black for light colors', () => {
      expect(contrastColor('#FFFFFF')).toBe('#000000')
      expect(contrastColor('#FFFF00')).toBe('#000000')
      expect(contrastColor('#00FFFF')).toBe('#000000')
    })
    
    it('should choose white for dark colors', () => {
      expect(contrastColor('#000000')).toBe('#FFFFFF')
      expect(contrastColor('#FF0000')).toBe('#FFFFFF')
      expect(contrastColor('#0000FF')).toBe('#FFFFFF')
    })
    
    it('should handle mid-range colors consistently', () => {
      expect(contrastColor('#808080')).toBe('#000000')
      expect(contrastColor('#404040')).toBe('#FFFFFF')
    })
  })

  describe('mix', () => {
    it('should return first color when t=0', () => {
      expect(mix('#FF0000', '#0000FF', 0)).toBe('#FF0000')
    })
    
    it('should return second color when t=1', () => {
      expect(mix('#FF0000', '#0000FF', 1)).toBe('#0000FF')
    })
    
    it('should mix colors at 50%', () => {
      expect(mix('#000000', '#FFFFFF', 0.5)).toBe('#808080')
      expect(mix('#FF0000', '#00FF00', 0.5)).toBe('#808000')
    })
    
    it('should handle invalid colors gracefully', () => {
      expect(mix('invalid', '#FF0000', 0.5)).toBe('#FF0000')
      expect(mix('#FF0000', 'invalid', 0.5)).toBe('#FF0000')
      expect(mix('invalid', 'invalid', 0.5)).toBe('#000000')
    })
    
    it('should return valid hex format', () => {
      const result = mix('#FF0000', '#00FF00', 0.3)
      expect(result).toMatch(/^#[0-9A-F]{6}$/)
    })
  })
})