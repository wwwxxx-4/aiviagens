// ============================================
// TIPOS GLOBAIS — Inteligência Viagens
// ============================================

// --- Usuário ---
export interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  preferred_currency: string
  preferred_language: 'pt' | 'en' | 'both'
  home_airport?: string
  created_at: string
}

// --- Conversa / Chat ---
export interface Conversation {
  id: string
  user_id: string
  title: string
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata?: MessageMetadata
  created_at: string
}

export interface MessageMetadata {
  search_triggered?: boolean
  flights?: FlightResult[]
  hotels?: HotelResult[]
  activities?: ActivityResult[]
  weather?: WeatherData
  exchange_rate?: ExchangeRateData
  travel_intent?: TravelIntent
}

// --- Intenção de viagem (extraída pelo AI) ---
export interface TravelIntent {
  origin?: string
  destination?: string
  destination_code?: string
  check_in?: string
  check_out?: string
  adults?: number
  children?: number
  budget?: number
  currency?: string
  trip_type?: 'leisure' | 'business' | 'adventure' | 'romantic' | 'family'
  duration_days?: number
}

// --- Resultados de Voo ---
export interface FlightResult {
  id: string
  airline: string
  airline_logo?: string
  flight_number?: string
  origin: string
  destination: string
  departure_time: string
  arrival_time: string
  duration: string
  stops: number
  stop_details?: string[]
  price: number
  currency: string
  cabin_class?: string
  booking_url?: string
  raw?: Record<string, unknown>
}

// --- Resultados de Hotel ---
export interface HotelResult {
  id: string
  name: string
  address?: string
  rating?: number
  reviews_count?: number
  stars?: number
  price_per_night: number
  currency: string
  thumbnail?: string
  amenities?: string[]
  description?: string
  booking_url?: string
  raw?: Record<string, unknown>
}

// --- Atividades / Atrações ---
export interface ActivityResult {
  id: string
  name: string
  address?: string
  rating?: number
  reviews_count?: number
  type?: string
  price?: number
  currency?: string
  duration?: string
  thumbnail?: string
  description?: string
  booking_url?: string
}

// --- Clima ---
export interface WeatherData {
  city: string
  country: string
  temp_celsius: number
  feels_like: number
  description: string
  humidity: number
  icon: string
  forecast?: WeatherDay[]
}

export interface WeatherDay {
  date: string
  temp_min: number
  temp_max: number
  description: string
  icon: string
}

// --- Câmbio ---
export interface ExchangeRateData {
  from: string
  to: string
  rate: number
  updated_at: string
}

// --- Pacote de Viagem Montado ---
export interface TravelPackage {
  id: string
  user_id: string
  conversation_id?: string
  title: string
  destination: string
  destination_country?: string
  check_in: string
  check_out: string
  adults: number
  children: number
  flight?: FlightResult
  hotel?: HotelResult
  activities: ActivityResult[]
  weather?: WeatherData
  total_price: number
  currency: string
  status: 'draft' | 'saved' | 'booked'
  notes?: string
  created_at: string
  updated_at: string
}

// --- Resposta das APIs SerpApi ---
export interface SerpApiFlightsResponse {
  best_flights?: SerpApiFlight[]
  other_flights?: SerpApiFlight[]
  error?: string
}

export interface SerpApiFlight {
  flights: SerpApiFlightLeg[]
  total_duration: number
  carbon_emissions?: { this_flight: number }
  price: number
  type: string
  airline_logo?: string
  departure_token?: string
  booking_token?: string
}

export interface SerpApiFlightLeg {
  departure_airport: { name: string; id: string; time: string }
  arrival_airport: { name: string; id: string; time: string }
  duration: number
  airplane?: string
  airline: string
  airline_logo?: string
  flight_number: string
  travel_class?: string
  legroom?: string
  overnight?: boolean
}

export interface SerpApiHotelsResponse {
  properties?: SerpApiHotel[]
  error?: string
}

export interface SerpApiHotel {
  name: string
  description?: string
  link?: string
  thumbnail?: string
  gps_coordinates?: { latitude: number; longitude: number }
  check_in_time?: string
  check_out_time?: string
  rate_per_night?: { lowest: string; extracted_lowest: number; before_taxes_fees: string }
  total_rate?: { lowest: string; extracted_lowest: number }
  overall_rating?: number
  reviews?: number
  hotel_class?: string
  extracted_hotel_class?: number
  amenities?: string[]
  nearby_places?: { name: string; transportations: { type: string; duration: string }[] }[]
}

// --- API Route Payloads ---
export interface ChatRequestBody {
  message: string
  conversation_id?: string
  travel_intent?: TravelIntent
}

export interface SearchFlightsParams {
  origin: string
  destination: string
  outbound_date: string
  return_date?: string
  adults?: number
  children?: number
  currency?: string
}

export interface SearchHotelsParams {
  destination: string
  check_in: string
  check_out: string
  adults?: number
  children?: number
  currency?: string
}
