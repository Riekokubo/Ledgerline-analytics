import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailySales } from '../../lib/aggregate/aggregate'
import { formatYen } from '../../lib/format/format'
import { cssVar } from '../../lib/style/cssVar'

type Props = {
  data: DailySales[]
}

// グラフ用に「紹介売上」と「それ以外」に分けて積み上げる。
// 2本を積み上げると、棒全体の高さ＝全体売上になる（紹介売上を二重に足さない）
type ChartRow = DailySales & { other: number }

function shortDate(date: string): string {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function axisYen(value: number): string {
  return value >= 1000 ? `¥${Math.round(value / 1000)}k` : `¥${value}`
}

// マウスを乗せたときの吹き出し
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="c-chart-tooltip">
      <p className="c-chart-tooltip__date">{row.date.replaceAll('-', '/')}</p>
      <p>全体売上：{formatYen(row.total)}</p>
      <p>うちアフィリエイト経由：{formatYen(row.affiliate)}</p>
    </div>
  )
}

export function SalesTrendChart({ data }: Props) {
  const rows: ChartRow[] = data.map((d) => ({ ...d, other: d.total - d.affiliate }))

  const colors = {
    total: cssVar('--color-series-total', '#b9c8f0'),
    affiliate: cssVar('--color-affiliate', '#d9822b'),
    grid: cssVar('--color-border-subtle', '#eef0f3'),
    text: cssVar('--color-text-3', '#6b7380'),
  }

  return (
    <div
      className="c-chart"
      role="img"
      aria-label="日別の売上推移。全体売上とアフィリエイト経由売上の積み上げ棒グラフ"
    >
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={colors.grid} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 12, fill: colors.text }}
            tickLine={false}
            axisLine={{ stroke: colors.grid }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={axisYen}
            tick={{ fontSize: 12, fill: colors.text }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: colors.grid }} />
          {/* 下に紹介売上、その上に残り（stackId が同じ棒は積み上がる） */}
          <Bar
            dataKey="affiliate"
            stackId="sales"
            fill={colors.affiliate}
            isAnimationActive={false}
          />
          <Bar
            dataKey="other"
            stackId="sales"
            fill={colors.total}
            radius={[3, 3, 0, 0]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
