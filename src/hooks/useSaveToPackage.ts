'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import type { FlightResult, HotelResult, ActivityResult } from '@/types'

type FlightWithReturn = FlightResult & {
  return_flight?: { departure_time?: string }
}

export function useSaveToPackage() {
  const [saving, setSaving] = useState<string | null>(null)

  async function saveFlight(flight: FlightResult, adults = 1): Promise<string | null> {
    setSaving(flight.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Faça login para salvar'); return null }

      const f = flight as FlightWithReturn
      const checkIn  = (flight.departure_time || '').split(' ')[0] || new Date().toISOString().split('T')[0]
      const checkOut = f.return_flight?.departure_time
        ? (f.return_flight.departure_time).split(' ')[0]
        : checkIn

      const { data, error } = await supabase.from('travel_packages').insert({
        user_id: user.id,
        title: `Voo ${flight.origin} → ${flight.destination}`,
        destination: flight.destination,
        check_in: checkIn,
        check_out: checkOut,
        adults,
        children: 0,
        total_price: flight.price,
        currency: flight.currency || 'BRL',
        flight_data: { flights: [flight] },
        hotel_data: {},
        activities_data: [],
        status: 'saved',
      }).select('id').single()

      if (error) throw error
      toast.success('✈️ Voo salvo em Minhas Viagens!', { duration: 4000 })
      return data?.id ?? null
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
      return null
    } finally {
      setSaving(null)
    }
  }

  async function saveHotel(hotel: HotelResult, adults = 1, nights = 1): Promise<string | null> {
    setSaving(hotel.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Faça login para salvar'); return null }

      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date(Date.now() + nights * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data, error } = await supabase.from('travel_packages').insert({
        user_id: user.id,
        title: `Hotel: ${hotel.name}`,
        destination: hotel.address?.split(',').slice(-2).join(',').trim() || hotel.name,
        check_in: hotel.check_in || today,
        check_out: hotel.check_out || futureDate,
        adults,
        children: 0,
        total_price: hotel.price_per_night * nights,
        currency: hotel.currency || 'BRL',
        flight_data: {},
        hotel_data: { hotels: [hotel] },
        activities_data: [],
        status: 'saved',
      }).select('id').single()

      if (error) throw error
      toast.success('🏨 Hotel salvo em Minhas Viagens!', { duration: 4000 })
      return data?.id ?? null
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
      return null
    } finally {
      setSaving(null)
    }
  }

  async function saveActivity(activity: ActivityResult): Promise<string | null> {
    setSaving(activity.id)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { toast.error('Faça login para salvar'); return null }

      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase.from('travel_packages').insert({
        user_id: user.id,
        title: `Atividade: ${activity.name}`,
        destination: activity.address?.split(',').slice(-2).join(',').trim() || activity.name,
        check_in: today,
        check_out: today,
        adults: 1,
        children: 0,
        total_price: activity.price || 0,
        currency: activity.currency || 'BRL',
        flight_data: {},
        hotel_data: {},
        activities_data: [activity],
        status: 'saved',
      }).select('id').single()

      if (error) throw error
      toast.success('🗺️ Atividade salva em Minhas Viagens!', { duration: 4000 })
      return data?.id ?? null
    } catch {
      toast.error('Erro ao salvar. Tente novamente.')
      return null
    } finally {
      setSaving(null)
    }
  }

  return { saving, saveFlight, saveHotel, saveActivity }
}
