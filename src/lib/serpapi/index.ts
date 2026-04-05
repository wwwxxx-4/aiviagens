import type {
  FlightResult, HotelResult, ActivityResult,
  SerpApiFlightsResponse, SerpApiHotelsResponse,
  SearchFlightsParams, SearchHotelsParams,
} from '@/types'
import { generateCacheKey, formatDuration } from '@/lib/utils'
import { createClient } from '@supabase/supabase-js'

const SERP_BASE = 'https://serpapi.com/search.json'
const SERP_KEY = process.env.SERPAPI_KEY!

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function getCached<T>(key: string): Promise<T | null> {
  try {
    const { data } = await supabaseAdmin
      .from('search_cache').select('data, expires_at').eq('cache_key', key).single()
    if (!data) return null
    if (new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from('search_cache').delete().eq('cache_key', key)
      return null
    }
    return data.data as T
  } catch { return null }
}

async function setCache(key: string, data: unknown, type: string, ttlMinutes = 60) {
  try {
    await supabaseAdmin.from('search_cache').upsert({
      cache_key: key, data, search_type: type,
      expires_at: new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString(),
    })
  } catch { /* non-critical */ }
}

// ─── Flights ─────────────────────────────────────────────────────────────────

export async function searchFlights(params: SearchFlightsParams): Promise<FlightResult[]> {
  const cacheKey = generateCacheKey('flights', params as unknown as Record<string, string | number | undefined>)
  const cached = await getCached<FlightResult[]>(cacheKey)
  if (cached) return cached

  const isRoundTrip = !!params.return_date

  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: SERP_KEY,
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.outbound_date,
    type: isRoundTrip ? '1' : '2',
    currency: params.currency || 'BRL',
    hl: 'pt', gl: 'br',
    adults: String(params.adults || 1),
  })
  if (isRoundTrip) query.set('return_date', params.return_date!)

  const res = await fetch(`${SERP_BASE}?${query}`)
  const json: SerpApiFlightsResponse = await res.json()
  if (json.error) throw new Error(`SerpApi flights error: ${json.error}`)

  const rawFlights = [...(json.best_flights || []), ...(json.other_flights || [])]

  const results: FlightResult[] = rawFlights.slice(0, 5).map((f, i) => {
    const firstLeg = f.flights[0]
    const lastLeg = f.flights[f.flights.length - 1]
    const raw = f as unknown as Record<string, unknown>

    const result: FlightResult & { return_flight?: unknown } = {
      id: `flight_${i}_${Date.now()}`,
      airline: firstLeg.airline,
      airline_logo: firstLeg.airline_logo || f.airline_logo,
      flight_number: firstLeg.flight_number,
      origin: firstLeg.departure_airport.id,
      destination: lastLeg.arrival_airport.id,
      departure_time: firstLeg.departure_airport.time,
      arrival_time: lastLeg.arrival_airport.time,
      duration: formatDuration(f.total_duration),
      stops: f.flights.length - 1,
      stop_details: f.flights.length > 1 ? f.flights.slice(0, -1).map(fl => fl.arrival_airport.name) : [],
      price: f.price,
      currency: params.currency || 'BRL',
      cabin_class: firstLeg.travel_class,
      raw,
    }

    // Extract return flight legs if available in the same result
    if (isRoundTrip) {
      const retFlights = raw.return_flights as unknown[]
      if (retFlights && retFlights.length > 0) {
        const retF = retFlights[0] as Record<string, unknown>
        const retLegs = retF.flights as typeof f.flights
        if (retLegs?.length > 0) {
          const retFirst = retLegs[0]
          const retLast = retLegs[retLegs.length - 1]
          result.return_flight = {
            airline: retFirst.airline,
            airline_logo: retFirst.airline_logo,
            flight_number: retFirst.flight_number,
            origin: retFirst.departure_airport.id,
            destination: retLast.arrival_airport.id,
            departure_time: retFirst.departure_airport.time,
            arrival_time: retLast.arrival_airport.time,
            duration: formatDuration(retF.total_duration as number),
            stops: retLegs.length - 1,
          }
        }
      }
    }

    return result
  })

  // If round trip and no return flight info yet, fetch return separately
  if (isRoundTrip && params.return_date) {
    try {
      const retQuery = new URLSearchParams({
        engine: 'google_flights', api_key: SERP_KEY,
        departure_id: params.destination, arrival_id: params.origin,
        outbound_date: params.return_date, type: '2',
        currency: params.currency || 'BRL', hl: 'pt', gl: 'br',
        adults: String(params.adults || 1),
      })
      const retRes = await fetch(`${SERP_BASE}?${retQuery}`)
      const retJson: SerpApiFlightsResponse = await retRes.json()
      if (!retJson.error) {
        const retFlights = [...(retJson.best_flights || []), ...(retJson.other_flights || [])]
        retFlights.slice(0, 5).forEach((rf, i) => {
          const r = results[i] as FlightResult & { return_flight?: unknown }
          if (r && !r.return_flight) {
            const retFirst = rf.flights[0]
            const retLast = rf.flights[rf.flights.length - 1]
            r.return_flight = {
              airline: retFirst.airline,
              airline_logo: retFirst.airline_logo || rf.airline_logo,
              flight_number: retFirst.flight_number,
              origin: retFirst.departure_airport.id,
              destination: retLast.arrival_airport.id,
              departure_time: retFirst.departure_airport.time,
              arrival_time: retLast.arrival_airport.time,
              duration: formatDuration(rf.total_duration),
              stops: rf.flights.length - 1,
              price: rf.price,
            }
          }
        })
      }
    } catch { /* non-critical */ }
  }

  await setCache(cacheKey, results, 'flights', 60)
  return results
}

// ─── Hotels ──────────────────────────────────────────────────────────────────

export async function searchHotels(params: SearchHotelsParams): Promise<HotelResult[]> {
  const cacheKey = generateCacheKey('hotels', params as unknown as Record<string, string | number | undefined>)
  const cached = await getCached<HotelResult[]>(cacheKey)
  if (cached) return cached

  const query = new URLSearchParams({
    engine: 'google_hotels', api_key: SERP_KEY,
    q: `hotels in ${params.destination}`,
    check_in_date: params.check_in, check_out_date: params.check_out,
    currency: params.currency || 'BRL', hl: 'pt', gl: 'br',
    adults: String(params.adults || 1),
  })
  if (params.children) query.set('children', String(params.children))

  const res = await fetch(`${SERP_BASE}?${query}`)
  const json: SerpApiHotelsResponse = await res.json()
  if (json.error) throw new Error(`SerpApi hotels error: ${json.error}`)

  const results: HotelResult[] = (json.properties || []).slice(0, 6).map((h, i) => {
    const raw = h as unknown as Record<string, unknown>
    // Try to get best image: images array > thumbnail
    const images = raw.images as Array<{ thumbnail?: string; original_image?: string }> | undefined
    const thumbnail = images?.[0]?.original_image || images?.[0]?.thumbnail || h.thumbnail || undefined

    return {
      id: `hotel_${i}_${Date.now()}`,
      name: h.name,
      address: h.nearby_places?.[0]?.name,
      rating: h.overall_rating,
      reviews_count: h.reviews,
      stars: h.extracted_hotel_class,
      price_per_night: h.rate_per_night?.extracted_lowest || 0,
      currency: params.currency || 'BRL',
      thumbnail,
      amenities: h.amenities?.slice(0, 6),
      description: h.description,
      booking_url: h.link,
      check_in: params.check_in,
      check_out: params.check_out,
      raw: raw,
    }
  })

  await setCache(cacheKey, results, 'hotels', 60)
  return results
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function searchActivities(destination: string, category = 'attractions'): Promise<ActivityResult[]> {
  const cacheKey = generateCacheKey('activities', { destination, category })
  const cached = await getCached<ActivityResult[]>(cacheKey)
  if (cached) return cached

  const queryMap: Record<string, string> = {
    attractions: `tourist attractions in ${destination}`,
    restaurants: `best restaurants in ${destination}`,
    tours: `guided tours ${destination}`,
    nightlife: `nightlife ${destination}`,
    shopping: `shopping in ${destination}`,
    nature: `nature parks ${destination}`,
  }

  const query = new URLSearchParams({
    engine: 'google_local', api_key: SERP_KEY,
    q: queryMap[category] || `things to do in ${destination}`,
    hl: 'pt', gl: 'br',
  })

  const res = await fetch(`${SERP_BASE}?${query}`)
  const json = await res.json()

  const results: ActivityResult[] = (json.local_results || []).slice(0, 8).map((a: Record<string, unknown>, i: number) => ({
    id: `activity_${i}_${Date.now()}`,
    name: a.title as string,
    address: a.address as string,
    rating: a.rating as number,
    reviews_count: a.reviews as number,
    type: category,
    thumbnail: (a.thumbnail as string) || undefined,
    description: (a.description as string) || undefined,
  }))

  await setCache(cacheKey, results, 'activities', 180)
  return results
}

// ─── Weather ─────────────────────────────────────────────────────────────────

export async function getWeather(destination: string) {
  const apiKey = process.env.OPENWEATHER_API_KEY
  if (!apiKey) return null
  try {
    const geoRes = await fetch(`https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(destination)}&limit=1&appid=${apiKey}`)
    const geoData = await geoRes.json()
    if (!geoData[0]) return null
    const { lat, lon, name, country } = geoData[0]
    const wRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric&lang=pt_br&cnt=16`)
    const wData = await wRes.json()
    return {
      city: name, country,
      temp_celsius: Math.round(wData.list[0].main.temp),
      feels_like: Math.round(wData.list[0].main.feels_like),
      description: wData.list[0].weather[0].description,
      humidity: wData.list[0].main.humidity,
      icon: wData.list[0].weather[0].icon,
      forecast: wData.list.filter((_: unknown, i: number) => i % 8 === 0).slice(0, 5)
        .map((d: Record<string, unknown>) => {
          const main = d.main as Record<string, number>
          const weather = (d.weather as Record<string, string>[])[0]
          return { date: d.dt_txt as string, temp_min: Math.round(main.temp_min), temp_max: Math.round(main.temp_max), description: weather.description, icon: weather.icon }
        }),
    }
  } catch { return null }
}
