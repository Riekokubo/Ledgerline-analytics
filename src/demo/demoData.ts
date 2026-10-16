import { addMonths, todayInJapan } from '../lib/date/date'
import type { DateRange } from '../types/domain'
import { generateDemoOrders } from './generateDemoOrders'

/** 今日の日付（日本時間） */
export const TODAY = todayInJapan()

/** デモデータの期間：3か月前の1日から今日まで */
export const DEMO_RANGE: DateRange = { start: addMonths(TODAY, -3), end: TODAY }

/** デモ用の注文データ（すべて架空） */
export const DEMO_ORDERS = generateDemoOrders(DEMO_RANGE)
