function renderInline(text: string) {
  return text.split('**').map((part, index) =>
    index % 2 === 1
      ? <strong key={index} className="font-semibold text-ink">{part}</strong>
      : part,
  )
}

export function ArticleBody({ text }: { text: string }) {
  return (
    <div className="space-y-4 text-base leading-8 text-ink-muted">
      {text.split('\n').map((line, index) => {
        if (line.startsWith('## ')) {
          return <h2 key={index} className="pt-6 text-2xl font-bold text-ink">{renderInline(line.slice(3))}</h2>
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="pt-4 text-xl font-bold text-ink">{renderInline(line.slice(4))}</h3>
        }
        if (!line.trim()) return null
        return <p key={index}>{renderInline(line)}</p>
      })}
    </div>
  )
}
