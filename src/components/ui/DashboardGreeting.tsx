'use client'

import { useEffect, useState } from 'react'

interface DashboardGreetingProps {
  firstName: string
}

export function DashboardGreeting({ firstName }: DashboardGreetingProps) {
  const [greeting, setGreeting] = useState<string>('')

  useEffect(() => {
    const hour = new Date().getHours()
    setGreeting(hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite')
  }, [])

  if (!greeting) return null

  return (
    <h1 className="font-display text-3xl font-bold text-gray-900 mb-1">
      {greeting}, {firstName}!
    </h1>
  )
}
