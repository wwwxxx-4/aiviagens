'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { MapPin } from 'lucide-react'
import { searchAirports, type Airport } from '@/data/airports'
import { cn } from '@/lib/utils'

interface AirportInputProps {
  value: string
  onChange: (iata: string, label: string) => void
  placeholder?: string
  id?: string
}

export function AirportInput({ value, onChange, placeholder, id }: AirportInputProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<Airport[]>([])
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync external value → display label
  useEffect(() => {
    if (value && !query) setQuery(value)
  }, [value])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    setQuery(v)
    if (v.length >= 2) {
      const found = searchAirports(v)
      setResults(found)
      setOpen(found.length > 0)
      setHighlighted(0)
    } else {
      setResults([])
      setOpen(false)
    }
    // If user clears input, clear selection
    if (!v) onChange('', '')
  }, [onChange])

  function select(airport: Airport) {
    const label = `${airport.city} (${airport.iata})`
    setQuery(label)
    setOpen(false)
    onChange(airport.iata, label)
    inputRef.current?.blur()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter')     { e.preventDefault(); if (results[highlighted]) select(results[highlighted]) }
    if (e.key === 'Escape')    { setOpen(false) }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          autoComplete="off"
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setOpen(true)
            else if (query.length >= 2) {
              const found = searchAirports(query)
              setResults(found)
              setOpen(found.length > 0)
            }
          }}
          placeholder={placeholder}
          className={cn(
            'w-full pl-8 pr-3 py-2 text-sm text-gray-800 bg-white border border-gray-200 rounded-xl',
            'placeholder:text-gray-300 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100',
            'transition-all'
          )}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-2xl border border-gray-100 shadow-xl shadow-black/10 overflow-hidden">
          {results.map((airport, i) => (
            <button
              key={`${airport.iata}-${airport.city}`}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(airport) }}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                i === highlighted ? 'bg-brand-50' : 'hover:bg-gray-50',
                i > 0 && 'border-t border-gray-50'
              )}
            >
              {/* Flag */}
              <span className="text-base w-6 text-center flex-shrink-0">{airport.flag}</span>
              {/* IATA badge */}
              <span className={cn(
                'font-bold text-xs px-2 py-0.5 rounded-lg flex-shrink-0 w-12 text-center',
                i === highlighted ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'
              )}>{airport.iata}</span>
              {/* City + name */}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {airport.city}{airport.state ? `, ${airport.state}` : ''}
                </p>
                <p className="text-xs text-gray-400 truncate">{airport.name} · {airport.country}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
