import { describe, it, expect } from '@jest/globals'
import {
  calculateOrderPriority,
  getEstimatedPreparationTime,
  OrderType,
  OrderPriority
} from '@/lib/order-workflow'
import type { Order } from '@/lib/types'

describe('Order Workflow', () => {
  describe('calculateOrderPriority', () => {
    it('should return URGENT for large orders', () => {
      const order: Partial<Order> = {
        items: new Array(10).fill({ quantity: 2 }),
        total: 1000,
        orderType: OrderType.DINE_IN
      }

      const priority = calculateOrderPriority(order as Order)
      expect(priority).toBe(OrderPriority.URGENT)
    })

    it('should return HIGH for delivery orders with high value', () => {
      const order: Partial<Order> = {
        items: [{ quantity: 2 }],
        total: 500,
        orderType: OrderType.DELIVERY
      }

      const priority = calculateOrderPriority(order as Order)
      expect(priority).toBe(OrderPriority.HIGH)
    })

    it('should return NORMAL for standard orders', () => {
      const order: Partial<Order> = {
        items: [{ quantity: 1 }],
        total: 50,
        orderType: OrderType.DINE_IN
      }

      const priority = calculateOrderPriority(order as Order)
      expect(priority).toBe(OrderPriority.NORMAL)
    })
  })

  describe('getEstimatedPreparationTime', () => {
    it('should calculate preparation time based on items', () => {
      const order: Partial<Order> = {
        items: [
          { quantity: 2, foodItem: { title: 'Pizza' } },
          { quantity: 1, foodItem: { title: 'Salad' } }
        ],
        orderType: OrderType.DINE_IN
      }

      const time = getEstimatedPreparationTime(order as Order)
      expect(time).toBeGreaterThan(0)
    })

    it('should add extra time for takeaway orders', () => {
      const dineInOrder: Partial<Order> = {
        items: [{ quantity: 1 }],
        orderType: OrderType.DINE_IN
      }

      const takeawayOrder: Partial<Order> = {
        items: [{ quantity: 1 }],
        orderType: OrderType.TAKEAWAY
      }

      const dineInTime = getEstimatedPreparationTime(dineInOrder as Order)
      const takeawayTime = getEstimatedPreparationTime(takeawayOrder as Order)

      expect(takeawayTime).toBeGreaterThanOrEqual(dineInTime)
    })
  })
})
