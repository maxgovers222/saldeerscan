export function isMobilePdfClient(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)
}

export async function sharePdfBlob(blob: Blob, filename: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof navigator.share !== 'function') return false
  const file = new File([blob], filename, { type: 'application/pdf' })
  if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
    return false
  }
  await navigator.share({
    files: [file],
    title: 'SaldeerScan rapport',
    text: 'Uw persoonlijke 2027-rapport',
  })
  return true
}

export function openPdfBlobInNewTab(url: string, preOpenedTab: Window | null): boolean {
  if (preOpenedTab && !preOpenedTab.closed) {
    preOpenedTab.location.href = url
    return true
  }
  const opened = window.open(url, '_blank', 'noopener,noreferrer')
  return opened !== null
}

export function openPdfBlobWithAnchor(url: string, filename: string, mobile: boolean): void {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.rel = 'noopener noreferrer'
  if (mobile) {
    anchor.target = '_blank'
  } else {
    anchor.download = filename
  }
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

export function writePdfLoadingTab(tab: Window | null): void {
  if (!tab || tab.closed) return
  try {
    tab.document.open()
    tab.document.write(
      '<!doctype html><html lang="nl"><head><meta charset="utf-8">'
      + '<meta name="viewport" content="width=device-width,initial-scale=1">'
      + '<title>SaldeerScan rapport</title>'
      + '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#f3f7f5;color:#10231d}</style>'
      + '</head><body><p>PDF wordt opgebouwd…</p></body></html>',
    )
    tab.document.close()
  } catch {
    // Cross-origin or blocked — ignore.
  }
}
