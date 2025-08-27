import '@testing-library/jest-dom'

// Mock Next.js router
import { vi } from 'vitest'
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    pathname: '/',
    searchParams: new URLSearchParams(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))