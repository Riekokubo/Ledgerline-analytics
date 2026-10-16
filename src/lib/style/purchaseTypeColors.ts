import type { PurchaseType } from '../../types/domain'

// 購入タイプごとの色（_tokens.scss の --color-type-* と対応）
export const PURCHASE_TYPE_COLORS: Record<PurchaseType, string> = {
  normal: '--color-type-normal',
  'subscription-first': '--color-type-sub-first',
  'subscription-recurring': '--color-type-sub-recurring',
}
