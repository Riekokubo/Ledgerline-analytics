// =====================================================================
// CSV の文字コードを判定して、文字列に変換する
// Shopify のエクスポートは UTF-8。ただし Excel で開いて保存し直すと
// Shift_JIS になることがあるので、両方に対応する。
// =====================================================================

export type Encoding = 'UTF-8' | 'Shift_JIS'

export type DecodedText = {
  text: string
  encoding: Encoding
}

export function decodeCsv(buffer: ArrayBuffer): DecodedText {
  // fatal: true … UTF-8 として正しくない文字があればエラーにする
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    // 先頭の BOM（目に見えない印）があれば取り除く
    return { text: text.replace(/^﻿/, ''), encoding: 'UTF-8' }
  } catch {
    // UTF-8 で読めなければ Shift_JIS として読む
    const text = new TextDecoder('shift_jis').decode(buffer)
    return { text, encoding: 'Shift_JIS' }
  }
}
