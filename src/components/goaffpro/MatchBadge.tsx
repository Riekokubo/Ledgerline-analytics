import type { MatchStatus } from '../../lib/reconcile/reconcile'
import { Badge, type BadgeTone } from '../ui/Badge'

const LABELS: Record<MatchStatus, { label: string; tone: BadgeTone }> = {
  match: { label: '一致', tone: 'success' },
  diff: { label: '差あり', tone: 'warning' },
  'not-covered': { label: '比較対象外', tone: 'neutral' },
  'shopify-only': { label: 'Shopifyのみ', tone: 'neutral' },
  'goaffpro-only': { label: 'GoAffProのみ', tone: 'neutral' },
}

export function MatchBadge({ status }: { status: MatchStatus }) {
  const { label, tone } = LABELS[status]
  return <Badge tone={tone}>{label}</Badge>
}
