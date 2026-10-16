import { addMonths, todayInJapan } from '../lib/date/date'
import { generateDemoOrders } from './generateDemoOrders'

/** 今日の日付（日本時間） */
export const TODAY = todayInJapan()

/** デモ用の注文データ：3か月前の1日から今日まで（すべて架空） */
export const DEMO_ORDERS = generateDemoOrders({ start: addMonths(TODAY, -3), end: TODAY })
