import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByText('AliCooks')).toBeInTheDocument()
  })

  it('renders the greeting', () => {
    render(<App />)
    // The redesigned HomePage shows a greeting instead of tagline
    expect(screen.getByText(/Good evening/)).toBeInTheDocument()
  })
})

