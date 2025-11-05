import { describe, it, expect } from '@jest/globals'
import { formatCurrency, cn } from '@/lib/utils'

describe('Utils', () => {
  describe('formatCurrency', () => {
    it('should format number as Turkish Lira', () => {
      expect(formatCurrency(100)).toBe('₺100,00')
      expect(formatCurrency(1234.56)).toBe('₺1.234,56')
      expect(formatCurrency(0)).toBe('₺0,00')
    })

    it('should handle negative numbers', () => {
      expect(formatCurrency(-100)).toBe('-₺100,00')
    })

    it('should handle decimal numbers', () => {
      expect(formatCurrency(99.99)).toBe('₺99,99')
      expect(formatCurrency(0.5)).toBe('₺0,50')
    })
  })

  describe('cn (className merger)', () => {
    it('should merge class names', () => {
      const result = cn('class1', 'class2')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', false && 'conditional', 'other')
      expect(result).toContain('base')
      expect(result).toContain('other')
      expect(result).not.toContain('conditional')
    })

    it('should handle undefined and null', () => {
      const result = cn('base', undefined, null, 'other')
      expect(result).toContain('base')
      expect(result).toContain('other')
    })
  })
})
