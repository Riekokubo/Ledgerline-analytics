import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { sampleAnnualReport, sampleLeaderboard } from '../../demo/sampleGoAffPro'
import { addMonths, endOfMonth } from '../../lib/date/date'
import { parseAnnualReport, parseLeaderboard } from '../../lib/goaffpro/parsePaste'
import { formatCount, formatYen } from '../../lib/format/format'
import { formatMonth } from '../../lib/format/formatSigned'
import { useData } from '../../store/dataContext'
import type { DateRange } from '../../types/domain'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { SegmentedControl } from '../ui/SegmentedControl'

type Tab = 'monthly' | 'leaderboard'

const TABS: { value: Tab; label: string }[] = [
  { value: 'monthly', label: '月別（Annual Report）' },
  { value: 'leaderboard', label: '紹介者別（Leaderboard）' },
]

/** 初期の期間：注文データの最後の月をまるごと（デモでは先月） */
function defaultRange(coverage: DateRange | null): DateRange {
  if (!coverage) return { start: '', end: '' }
  const lastFullMonthStart =
    coverage.end === endOfMonth(coverage.end)
      ? `${coverage.end.slice(0, 7)}-01`
      : addMonths(coverage.end, -1)
  return { start: lastFullMonthStart, end: endOfMonth(lastFullMonthStart) }
}

export function GoAffProImportCard() {
  const { source, orders, coverage, goaffpro, setGoAffProMonthly, setGoAffProLeaderboard } =
    useData()
  const [tab, setTab] = useState<Tab>('monthly')
  const [text, setText] = useState('')
  const [year, setYear] = useState(() => Number((coverage?.end ?? '2026').slice(0, 4)))
  const [range, setRange] = useState<DateRange>(() => defaultRange(coverage))
  const [message, setMessage] = useState<string | null>(null)

  // 入力のたびに読み取り結果をプレビューする
  const preview = useMemo(() => {
    if (text.trim() === '') return null
    return tab === 'monthly' ? parseAnnualReport(text, year) : parseLeaderboard(text)
  }, [text, tab, year])

  const isRangeValid = tab === 'monthly' || (range.start !== '' && range.start <= range.end)
  const canImport = preview?.ok === true && isRangeValid

  function handleImport() {
    if (tab === 'monthly') {
      const result = parseAnnualReport(text, year)
      if (!result.ok) return
      setGoAffProMonthly(year, result.rows)
      const months = result.rows.map((r) => r.month)
      setMessage(
        `${formatMonth(months[0])}〜${formatMonth(months[months.length - 1])} の ${months.length}か月分を取り込みました`,
      )
    } else {
      const result = parseLeaderboard(text)
      if (!result.ok) return
      setGoAffProLeaderboard(range, result.rows)
      setMessage(`紹介者 ${result.rows.length}人分を取り込みました`)
    }
    setText('')
  }

  function handleSample() {
    if (!coverage) return
    setText(
      tab === 'monthly' ? sampleAnnualReport(orders, coverage) : sampleLeaderboard(orders, range),
    )
    setMessage(null)
  }

  const loaded = goaffpro.monthly !== null || goaffpro.leaderboard !== null

  return (
    <Card
      title="② GoAffPro 照合用データ（任意）"
      description="集計には使わず、Shopify 側の紹介売上との答え合わせだけに使います"
      aside={
        loaded ? (
          <Badge tone="success">読み込み完了</Badge>
        ) : (
          <Badge tone="neutral">未読み込み</Badge>
        )
      }
    >
      <SegmentedControl
        label="照合データの種類"
        options={TABS}
        value={tab}
        onChange={(next) => {
          setTab(next)
          setText('')
          setMessage(null)
        }}
      />

      <ol className="p-goaffpro__steps">
        {tab === 'monthly' ? (
          <>
            <li>GoAffPro › Analytics › Annual Report を開く</li>
            <li>表を見出しの行（Month）からコピーして、下に貼り付け</li>
          </>
        ) : (
          <>
            <li>GoAffPro › Analytics › Leaderboard を開き、期間を下と同じにする</li>
            <li>表を見出しの行からコピーして、下に貼り付け</li>
          </>
        )}
      </ol>

      <div className="p-goaffpro__fields">
        {tab === 'monthly' ? (
          <label className="c-field">
            年
            <input
              type="number"
              min={2020}
              max={2100}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
          </label>
        ) : (
          <>
            <label className="c-field">
              開始日
              <input
                type="date"
                value={range.start}
                onChange={(e) => setRange({ ...range, start: e.target.value })}
              />
            </label>
            <label className="c-field">
              終了日
              <input
                type="date"
                value={range.end}
                onChange={(e) => setRange({ ...range, end: e.target.value })}
              />
            </label>
          </>
        )}
      </div>

      <label className="c-field">
        貼り付けたデータ
        <textarea
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setMessage(null)
          }}
          placeholder={
            tab === 'monthly'
              ? 'Month  Sales  Revenue  Commission …'
              : 'Affiliate  Sales  Revenue …'
          }
        />
      </label>

      {preview && !preview.ok && (
        <div className="c-alert c-alert--error" role="alert">
          <p className="c-alert__title">読み取れませんでした</p>
          <p>{preview.error}</p>
        </div>
      )}

      {preview?.ok && (
        <div className="p-goaffpro__preview">
          <p className="p-goaffpro__preview-title">読み取り結果</p>
          <div className="c-table-wrap">
            <table className="c-table">
              <thead>
                <tr>
                  <th scope="col">{tab === 'monthly' ? '月' : '紹介者'}</th>
                  <th scope="col" className="c-table__num">
                    件数
                  </th>
                  <th scope="col" className="c-table__num">
                    紹介売上
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row) => {
                  const label = 'month' in row ? formatMonth(row.month) : row.name
                  return (
                    <tr key={label}>
                      <td>{label}</td>
                      <td className="c-table__num">{formatCount(row.sales)}</td>
                      <td className="c-table__num">{formatYen(row.revenue)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {preview.notes.length > 0 && (
            <ul className="p-goaffpro__notes">
              {preview.notes.map((note) => (
                <li key={note.line}>
                  {note.line}行目：{note.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {message && (
        <p className="p-goaffpro__message" role="status">
          {message}　<Link to="/data">照合結果を見る</Link>
        </p>
      )}

      <div className="p-actions">
        {source === 'demo' && (
          <Button onClick={handleSample} className="p-goaffpro__sample">
            サンプルを貼り付け
          </Button>
        )}
        <Button onClick={() => setText('')} disabled={text === ''}>
          クリア
        </Button>
        <Button variant="primary" onClick={handleImport} disabled={!canImport}>
          照合データとして取り込む
        </Button>
      </div>
    </Card>
  )
}
