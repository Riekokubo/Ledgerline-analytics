import type { DateRange, Order } from '../../types/domain'

/** 注文がある期間（いちばん古い日〜いちばん新しい日）。注文がなければ null */
export function rangeOfOrders(orders: Order[]): DateRange | null {
  if (orders.length === 0) return null
  let start = orders[0].orderDate
  let end = start
  for (const order of orders) {
    if (order.orderDate < start) start = order.orderDate
    if (order.orderDate > end) end = order.orderDate
  }
  return { start, end }
}
