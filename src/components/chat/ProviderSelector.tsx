'use client'

import { useEffect, useState } from 'react'
import { ChevronDown, Cpu, Check } from 'lucide-react'
import type { ProviderID, LLMModel } from '@/lib/llm/types'
import { PROVIDER_INFO } from '@/lib/llm/types'
import { cn } from '@/lib/utils'

interface ProviderInfo {
  id: ProviderID
  name: string
  description: string
  logo: string
  models: LLMModel[]
  available: boolean
}

interface ProviderSelectorProps {
  selectedProvider: ProviderID | null
  selectedModel: string | null
  onSelect: (provider: ProviderID, model: string) => void
}

export function ProviderSelector({ selectedProvider, selectedModel, onSelect }: ProviderSelectorProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/providers')
      .then(r => r.json())
      .then(data => { setProviders(data.providers || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const currentProvider = providers.find(p => p.id === selectedProvider)
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel)
    || currentProvider?.models.find(m => m.recommended)
    || currentProvider?.models[0]

  if (loading || providers.length === 0) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-black/8 bg-white hover:bg-gray-50 text-xs text-gray-600 transition-colors"
      >
        <Cpu size={11} className="text-brand-400" />
        <span className="font-medium">
          {currentProvider ? `${currentProvider.logo} ${currentModel?.name || currentProvider.name}` : 'Selecionar IA'}
        </span>
        <ChevronDown size={11} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-2 left-0 z-20 w-80 bg-white rounded-2xl border border-black/8 shadow-lg overflow-hidden">
            <div className="p-3 border-b border-black/5">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Escolher modelo de IA</p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {providers.map(provider => (
                <div key={provider.id}>
                  <div className="px-3 py-2 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-700">
                      {provider.logo} {provider.name}
                    </p>
                    <p className="text-xs text-gray-400">{provider.description}</p>
                  </div>
                  {provider.models.map(model => {
                    const isSelected = selectedProvider === provider.id && (selectedModel === model.id || (!selectedModel && model.recommended))
                    return (
                      <button
                        key={model.id}
                        onClick={() => { onSelect(provider.id, model.id); setOpen(false) }}
                        className={cn(
                          'w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-brand-50 transition-colors',
                          isSelected && 'bg-brand-50'
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-800">{model.name}</span>
                            {model.recommended && (
                              <span className="text-xs bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded font-medium">
                                Recomendado
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {(model.costPer1kInput * 1000).toFixed(3)} / {(model.costPer1kOutput * 1000).toFixed(3)} USD por 1M tokens
                          </p>
                        </div>
                        {isSelected && <Check size={14} className="text-brand-500 shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-black/5 bg-gray-50">
              <p className="text-xs text-gray-400">
                Configure as chaves no <code className="bg-gray-200 px-1 rounded">.env.local</code>
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
