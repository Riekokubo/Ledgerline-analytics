import { useId, useState, type DragEvent } from 'react'
import { IS_GAS } from '../../config/app'

const HINT = IS_GAS
  ? '個人情報を除いた集計用の項目だけを保存します'
  : 'ファイルはこのブラウザ内だけで処理されます'

// Figma の Dropzone（State=Idle / DragOver / Error）に対応。読み込み中の表示も持つ
type DropzoneProps = {
  onFile: (file: File) => void
  isLoading?: boolean
  error?: string | null
  accept?: string
}

export function Dropzone({
  onFile,
  isLoading = false,
  error = null,
  accept = '.csv',
}: DropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const inputId = useId()

  const state = isLoading ? 'loading' : isDragOver ? 'dragover' : error ? 'error' : 'idle'

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault() // ブラウザがファイルを開いてしまうのを止める
    setIsDragOver(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <label
      htmlFor={inputId}
      className={`c-dropzone c-dropzone--${state}`}
      onDragOver={(event) => {
        event.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <span className="c-dropzone__title">
        {state === 'loading' && '読み込み中…'}
        {state === 'dragover' && 'ここで離すと読み込みます'}
        {state === 'error' && '読み込みエラー'}
        {state === 'idle' && 'CSVファイルをドロップ、またはクリックして選択'}
      </span>
      <span className="c-dropzone__hint" role={error ? 'alert' : undefined}>
        {state === 'error' ? error : HINT}
      </span>
      <input
        id={inputId}
        type="file"
        accept={accept}
        className="c-dropzone__input"
        disabled={isLoading}
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = '' // 同じファイルをもう一度選べるようにする
        }}
      />
    </label>
  )
}
