import Link from 'next/link'

export interface VisibleBreadcrumb {
  name: string
  href?: string
}

export function PseoBreadcrumbs({
  items,
}: {
  items: VisibleBreadcrumb[]
}) {
  return (
    <nav aria-label="Kruimelpad" className="text-sm text-white/55">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={`${item.name}-${index}`} className="flex items-center gap-2">
            {index > 0 && <span aria-hidden="true" className="text-white/25">/</span>}
            {item.href ? (
              <Link href={item.href} className="min-h-11 content-center transition hover:text-white">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page" className="text-white/80">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
