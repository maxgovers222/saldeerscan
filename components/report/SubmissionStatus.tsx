import type { ReportEmailStatus } from '@/lib/report-model'

export function SubmissionStatus({
  status,
}: {
  status: ReportEmailStatus
}) {
  const message = status === 'sent'
    ? {
        title: 'Aanvraag ontvangen',
        text: 'Uw rapport is verzonden naar uw e-mail.',
        tone: 'success',
      }
    : status === 'failed'
      ? {
          title: 'Aanvraag ontvangen',
          text: 'De e-mail kon niet worden verstuurd. U kunt het volledige rapport hieronder downloaden.',
          tone: 'warning',
        }
      : status === 'not_configured'
        ? {
            title: 'Aanvraag ontvangen',
            text: 'E-mail is in deze omgeving niet beschikbaar. Download het rapport hieronder.',
            tone: 'warning',
          }
        : {
            title: 'Aanvraag ontvangen',
            text: 'De e-mailstatus wordt gecontroleerd. Uw rapport staat hieronder klaar.',
            tone: 'neutral',
          }
  const toneClass = message.tone === 'success'
    ? 'border-success/25 bg-success/10 text-ink'
    : message.tone === 'warning'
      ? 'border-action/45 bg-action/10 text-ink'
      : 'border-ink/10 bg-mist text-ink'

  return (
    <div
      role="status"
      aria-live="polite"
      data-tone={message.tone}
      className={`rounded-2xl border px-4 py-4 sm:px-5 ${toneClass}`}
    >
      <p className="font-semibold">{message.title}</p>
      <p className="mt-1 text-sm leading-6 text-ink-muted">{message.text}</p>
    </div>
  )
}
