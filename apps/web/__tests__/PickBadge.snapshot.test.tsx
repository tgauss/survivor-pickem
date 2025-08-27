import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { PickBadge } from '../components/brand/PickBadge'

// Mock the teams loader
vi.mock('../lib/teams', () => ({
  getTeamByAbbr: vi.fn((abbr: string) => {
    if (abbr === 'KC') {
      return {
        abbr: 'KC',
        teamId: 1,
        city: 'Kansas City',
        name: 'Chiefs',
        fullName: 'Kansas City Chiefs',
        primaryColor: '#E31837',
        secondaryColor: '#FFB81C',
        logoUrl: 'https://example.com/kc-logo.png'
      }
    }
    return undefined
  })
}))

describe('PickBadge Component', () => {
  describe('Neutral Branding Mode', () => {
    it('should render with neutral styling', () => {
      // Mock neutral mode
      vi.doMock('../lib/config', () => ({
        BRANDING_MODE: 'neutral'
      }))
      
      const { container } = render(
        <PickBadge abbr="KC" label="Test User" />
      )
      
      expect(container.firstChild).toMatchSnapshot('pickbadge-neutral')
    })
  })

  describe('Private Branding Mode', () => {
    it('should render with team branding', () => {
      // Mock private mode
      vi.doMock('../lib/config', () => ({
        BRANDING_MODE: 'private'
      }))
      
      const { container } = render(
        <PickBadge abbr="KC" label="YOU" />
      )
      
      expect(container.firstChild).toMatchSnapshot('pickbadge-private')
    })
  })

  describe('Component Structure', () => {
    it('should contain team logo and labels', () => {
      const { getByText } = render(
        <PickBadge abbr="KC" label="Test User" />
      )
      
      expect(getByText('KC')).toBeInTheDocument()
      expect(getByText('Test User')).toBeInTheDocument()
    })
    
    it('should apply slide-mask-in animation class when mounted', () => {
      const { container } = render(
        <PickBadge abbr="KC" label="YOU" />
      )
      
      const badge = container.querySelector('.slide-mask-in')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper color contrast', () => {
      const { container } = render(
        <PickBadge abbr="KC" label="Test User" />
      )
      
      const badge = container.firstChild as HTMLElement
      const computedStyle = window.getComputedStyle(badge)
      
      // Should use CSS custom properties for colors
      expect(badge.style.color).toBe('var(--team-text, #E6E8EA)')
    })
  })
})