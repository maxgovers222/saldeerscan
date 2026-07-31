'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { trackEvent } from '@/lib/analytics'
import {
  buildCheckHref,
  type ConversionContext,
} from '@/lib/conversion-context'
import { cn } from '@/lib/utils'

interface Suggestion {
  label: string
  id: string
}

interface Props {
  context?: ConversionContext
  extraParams?: Record<string, string>
  placeholder?: string
  buttonLabel?: string
  className?: string
}

export function AddressAutocomplete({
  context,
  extraParams,
  placeholder,
  buttonLabel,
  className,
}: Props = {}) {
  const router = useRouter()
  const id = useId()
  const inputId = `${id}-input`
  const listboxId = `${id}-listbox`
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selected, setSelected] = useState<Suggestion | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const startedRef = useRef(false)

  const fetchSuggestions = useCallback(async (q: string) => {
    requestRef.current?.abort()
    if (q.trim().length < 3) {
      setSuggestions([])
      setOpen(false)
      setLoading(false)
      return
    }
    const controller = new AbortController()
    requestRef.current = controller
    setLoading(true)
    try {
      const response = await fetch(
        `/api/bag/suggest?q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal },
      )
      if (!response.ok) throw new Error('suggest_failed')
      const data = await response.json() as Suggestion[]
      setSuggestions(data)
      setOpen(data.length > 0)
      setActiveIdx(-1)
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setSuggestions([])
        setOpen(false)
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false)
    }
  }, [])

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const value = event.target.value
    requestRef.current?.abort()
    setLoading(false)
    setQuery(value)
    setSelected(null)
    setSuggestions([])
    setOpen(false)
    setActiveIdx(-1)
    if (value.trim() && !startedRef.current) {
      startedRef.current = true
      trackEvent('address_entry_start', {
        landing_path: context?.landingPath ?? '/',
        pseo_level: context?.pseoLevel ?? 'home',
      })
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 280)
  }

  function handleSelect(suggestion: Suggestion) {
    setQuery(suggestion.label)
    setSelected(suggestion)
    setSuggestions([])
    setOpen(false)
    setActiveIdx(-1)
    trackEvent('address_suggestion_selected', {
      landing_path: context?.landingPath ?? '/',
      pseo_level: context?.pseoLevel ?? 'home',
    })
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!selected) return
    const href = buildCheckHref(context ?? {
      landingPath: '/',
      pseoLevel: 'home',
    }, {
      adres: selected.label,
      ...extraParams,
    })
    trackEvent('address_entry_submit', {
      landing_path: context?.landingPath ?? '/',
      pseo_level: context?.pseoLevel ?? 'home',
    })
    router.push(href)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIdx(index => Math.min(index + 1, suggestions.length - 1))
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIdx(index => Math.max(index - 1, 0))
    }
    if (event.key === 'Enter' && activeIdx >= 0) {
      event.preventDefault()
      handleSelect(suggestions[activeIdx])
    }
    if (event.key === 'Escape') {
      setOpen(false)
      setActiveIdx(-1)
    }
  }

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    requestRef.current?.abort()
  }, [])

  const status = loading
    ? 'Adressen laden'
    : suggestions.length > 0
      ? `${suggestions.length} adressen gevonden`
      : query.trim().length >= 3
        ? 'Geen adressen gevonden'
        : ''

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('mx-auto grid w-full max-w-lg gap-3 sm:grid-cols-[1fr_auto]', className)}
    >
      <div className="relative min-w-0" ref={containerRef}>
        <label htmlFor={inputId} className="sr-only">Uw adres</label>
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-label="Uw adres"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            activeIdx >= 0 ? `${listboxId}-option-${activeIdx}` : undefined
          }
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder ?? 'Uw adres, bijv. Keizersgracht 1, Amsterdam'}
          className="min-h-14 w-full rounded-xl border border-white/15 bg-white px-4 pr-11 text-base text-ink shadow-sm placeholder:text-ink-muted/70 focus:border-trust focus:outline-none focus-visible:ring-3 focus-visible:ring-trust/50"
          autoComplete="off"
        />
        {loading && (
          <span
            aria-hidden="true"
            className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-ink/20 border-t-ink/70"
          />
        )}

        {open && suggestions.length > 0 && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute inset-x-0 z-50 mt-2 max-h-72 overflow-y-auto rounded-xl border border-ink/10 bg-white py-1 shadow-2xl"
          >
            {suggestions.map((suggestion, index) => (
              <li
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={index === activeIdx}
                key={suggestion.id}
                onMouseDown={event => {
                  event.preventDefault()
                  handleSelect(suggestion)
                }}
                onClick={() => handleSelect(suggestion)}
                onMouseEnter={() => setActiveIdx(index)}
                className={cn(
                  'cursor-pointer px-4 py-3 text-sm text-ink transition-colors',
                  index === activeIdx ? 'bg-mist' : 'hover:bg-mist',
                )}
              >
                {suggestion.label}
              </li>
            ))}
          </ul>
        )}
        <span className="sr-only" aria-live="polite">{status}</span>
      </div>

      <button
        type="submit"
        disabled={!selected}
        className="inline-flex min-h-14 items-center justify-center whitespace-nowrap rounded-xl bg-action px-6 py-3 font-heading text-sm font-bold text-evergreen-950 shadow-[0_12px_32px_rgba(255,176,32,.22)] transition hover:bg-action-hover disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
      >
        {buttonLabel ?? 'Bekijk mijn inzicht'}
      </button>
    </form>
  )
}
