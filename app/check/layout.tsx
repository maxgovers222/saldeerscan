import { buildWebApplicationSchema } from '@/lib/json-ld'

export default function CheckLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = buildWebApplicationSchema()
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  )
}
