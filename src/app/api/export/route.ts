import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const { searchParams } = new URL(request.url)
  const packageId = searchParams.get('id')

  if (!packageId) return new Response('Missing package id', { status: 400 })

  const { data: pkg } = await supabase
    .from('travel_packages')
    .select('*')
    .eq('id', packageId)
    .eq('user_id', user.id)
    .single()

  if (!pkg) return new Response('Package not found', { status: 404 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const flights = pkg.flight_data?.flights || (Array.isArray(pkg.flight_data) ? pkg.flight_data : [])
  const hotels = pkg.hotel_data?.hotels || (Array.isArray(pkg.hotel_data) ? pkg.hotel_data : [])
  const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data : []

  const checkIn = pkg.check_in ? formatDate(pkg.check_in, 'dd/MM/yyyy') : '—'
  const checkOut = pkg.check_out ? formatDate(pkg.check_out, 'dd/MM/yyyy') : '—'
  const totalFormatted = pkg.total_price
    ? formatCurrency(pkg.total_price, pkg.currency || 'BRL')
    : '—'

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${pkg.title}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;background:#fff;color:#1a1a1a;font-size:13px;line-height:1.6}
  .page{max-width:800px;margin:0 auto;padding:0}
  /* HEADER */
  .header{background:#0f9e64;padding:40px 48px 36px;color:#fff}
  .header-logo{display:flex;align-items:center;gap:8px;margin-bottom:28px;opacity:.85}
  .header-logo svg{width:20px;height:20px}
  .header-logo span{font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;letter-spacing:.5px}
  .header h1{font-family:'Playfair Display',serif;font-size:28px;font-weight:700;margin-bottom:6px;line-height:1.2}
  .header .destination{font-size:15px;opacity:.85;font-weight:300}
  .header-meta{display:flex;gap:24px;margin-top:20px}
  .header-meta-item{background:rgba(255,255,255,.15);border-radius:8px;padding:10px 16px}
  .header-meta-item .label{font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px}
  .header-meta-item .value{font-size:13px;font-weight:500}
  /* BODY */
  .body{padding:36px 48px}
  /* SECTION */
  .section{margin-bottom:32px}
  .section-title{font-family:'Playfair Display',serif;font-size:16px;font-weight:600;color:#0a7d4f;padding-bottom:8px;border-bottom:1.5px solid #e6faf4;margin-bottom:16px;display:flex;align-items:center;gap:8px}
  /* FLIGHT */
  .flight-card{background:#f8fffe;border:1px solid #c2f0e0;border-radius:10px;padding:14px 18px;margin-bottom:10px}
  .flight-route{display:flex;align-items:center;gap:12px;margin-bottom:8px}
  .flight-airport{font-size:20px;font-weight:700;color:#065c3a}
  .flight-arrow{flex:1;text-align:center;color:#9ca3af;font-size:11px}
  .flight-arrow-line{height:1px;background:#c2f0e0;margin:4px 0;position:relative}
  .flight-arrow-line::after{content:'▶';position:absolute;right:-4px;top:-7px;font-size:10px;color:#0f9e64}
  .flight-meta{display:flex;gap:16px;font-size:11px;color:#6b7280}
  .flight-meta span{background:#fff;border:1px solid #e5e7eb;border-radius:4px;padding:2px 8px}
  .flight-price{font-size:16px;font-weight:700;color:#0f9e64;text-align:right;margin-top:6px}
  /* HOTEL */
  .hotel-card{background:#f8fffe;border:1px solid #c2f0e0;border-radius:10px;padding:14px 18px;margin-bottom:10px}
  .hotel-name{font-size:14px;font-weight:600;color:#065c3a;margin-bottom:4px}
  .hotel-meta{display:flex;justify-content:space-between;align-items:flex-end}
  .hotel-info{font-size:11px;color:#6b7280}
  .hotel-price{font-size:16px;font-weight:700;color:#0f9e64}
  .hotel-price small{font-size:10px;font-weight:400;color:#9ca3af}
  .stars{color:#f59e0b;letter-spacing:1px}
  /* ACTIVITIES */
  .activities-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .activity-card{background:#fffdf7;border:1px solid #fde68a;border-radius:8px;padding:10px 14px}
  .activity-name{font-size:12px;font-weight:500;color:#78350f;margin-bottom:2px}
  .activity-addr{font-size:10px;color:#92400e;opacity:.7}
  .activity-rating{font-size:10px;color:#d97706;margin-top:3px}
  /* TOTAL */
  .total-box{background:#065c3a;color:#fff;border-radius:12px;padding:20px 24px;margin-top:24px;display:flex;justify-content:space-between;align-items:center}
  .total-box .label{font-size:12px;opacity:.75;margin-bottom:3px}
  .total-box .value{font-size:24px;font-weight:700;font-family:'Playfair Display',serif}
  .total-box .breakdown{font-size:11px;opacity:.7}
  /* NOTES */
  .notes-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:14px 18px;font-size:12px;color:#4b5563;line-height:1.7;margin-top:16px}
  /* FOOTER */
  .footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af}
  .footer .brand{color:#0f9e64;font-weight:500}
  /* PRINT */
  @media print{body{font-size:12px}.header{-webkit-print-color-adjust:exact;print-color-adjust:exact}.total-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style>
</head>
<body>
<div class="page">

  <div class="header">
    <div class="header-logo">
      <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
      <span>INTELIGÊNCIA VIAGENS</span>
    </div>
    <h1>${pkg.title}</h1>
    <div class="destination">${pkg.destination}${pkg.destination_country ? ', ' + pkg.destination_country : ''}</div>
    <div class="header-meta">
      <div class="header-meta-item">
        <div class="label">Check-in</div>
        <div class="value">${checkIn}</div>
      </div>
      <div class="header-meta-item">
        <div class="label">Check-out</div>
        <div class="value">${checkOut}</div>
      </div>
      <div class="header-meta-item">
        <div class="label">Viajantes</div>
        <div class="value">${pkg.adults} adulto${pkg.adults !== 1 ? 's' : ''}${pkg.children > 0 ? ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}` : ''}</div>
      </div>
      <div class="header-meta-item">
        <div class="label">Preparado por</div>
        <div class="value">${profile?.full_name || 'Viajante'}</div>
      </div>
    </div>
  </div>

  <div class="body">

    ${flights.length > 0 ? `
    <div class="section">
      <div class="section-title">✈️ Voos</div>
      ${flights.slice(0, 3).map((f: Record<string, unknown>) => `
      <div class="flight-card">
        <div class="flight-route">
          <div>
            <div class="flight-airport">${f.origin || '—'}</div>
            <div style="font-size:10px;color:#9ca3af">${String(f.departure_time || '').slice(11,16) || '—'}</div>
          </div>
          <div class="flight-arrow">
            <div style="font-size:10px;color:#6b7280;text-align:center">${f.duration || ''}</div>
            <div class="flight-arrow-line"></div>
            <div style="font-size:10px;color:#6b7280;text-align:center">${f.stops === 0 ? 'Direto' : f.stops + ' parada(s)'}</div>
          </div>
          <div style="text-align:right">
            <div class="flight-airport">${f.destination || '—'}</div>
            <div style="font-size:10px;color:#9ca3af">${String(f.arrival_time || '').slice(11,16) || '—'}</div>
          </div>
        </div>
        <div class="flight-meta">
          <span>${f.airline || '—'}</span>
          ${f.flight_number ? `<span>${f.flight_number}</span>` : ''}
          ${f.cabin_class ? `<span>${f.cabin_class}</span>` : ''}
        </div>
        ${f.price ? `<div class="flight-price">${formatCurrency(Number(f.price), String(f.currency || 'BRL'))}<small style="font-size:10px;font-weight:400;color:#9ca3af"> por pessoa</small></div>` : ''}
      </div>`).join('')}
    </div>` : ''}

    ${hotels.length > 0 ? `
    <div class="section">
      <div class="section-title">🏨 Hospedagem</div>
      ${hotels.slice(0, 2).map((h: Record<string, unknown>) => `
      <div class="hotel-card">
        <div class="hotel-name">${h.name || '—'}</div>
        ${h.stars ? `<div class="stars">${'★'.repeat(Number(h.stars))}${'☆'.repeat(Math.max(0, 5 - Number(h.stars)))}</div>` : ''}
        ${h.address ? `<div class="hotel-info" style="margin-top:4px">📍 ${h.address}</div>` : ''}
        <div class="hotel-meta" style="margin-top:8px">
          <div class="hotel-info">
            ${h.rating ? `⭐ ${Number(h.rating).toFixed(1)}${h.reviews_count ? ` (${Number(h.reviews_count).toLocaleString()} avaliações)` : ''}` : ''}
            ${h.amenities ? `<div style="margin-top:3px">${(h.amenities as string[]).slice(0,4).join(' · ')}</div>` : ''}
          </div>
          ${h.price_per_night ? `<div class="hotel-price">${formatCurrency(Number(h.price_per_night), String(h.currency || 'BRL'))}<small>/noite</small></div>` : ''}
        </div>
      </div>`).join('')}
    </div>` : ''}

    ${activities.length > 0 ? `
    <div class="section">
      <div class="section-title">🗺️ Atividades e atrações</div>
      <div class="activities-grid">
        ${activities.slice(0, 8).map((a: Record<string, unknown>) => `
        <div class="activity-card">
          <div class="activity-name">${a.name || '—'}</div>
          ${a.address ? `<div class="activity-addr">📍 ${a.address}</div>` : ''}
          ${a.rating ? `<div class="activity-rating">⭐ ${Number(a.rating).toFixed(1)}${a.reviews_count ? ` · ${Number(a.reviews_count).toLocaleString()} avaliações` : ''}</div>` : ''}
        </div>`).join('')}
      </div>
    </div>` : ''}

    ${pkg.total_price ? `
    <div class="total-box">
      <div>
        <div class="label">Investimento total estimado</div>
        <div class="value">${totalFormatted}</div>
        <div class="breakdown">Para ${pkg.adults} adulto${pkg.adults !== 1 ? 's' : ''}${pkg.children > 0 ? ` e ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}` : ''} · ${checkIn} → ${checkOut}</div>
      </div>
      <div style="opacity:.6;font-size:28px">✈</div>
    </div>` : ''}

    ${pkg.notes ? `
    <div class="notes-box" style="margin-top:16px">
      <div style="font-weight:500;color:#374151;margin-bottom:6px">📝 Observações</div>
      ${pkg.notes}
    </div>` : ''}

    <div class="footer">
      <div>Gerado em ${new Date().toLocaleDateString('pt-BR')} · ${profile?.email || ''}</div>
      <div class="brand">Inteligência Viagens — IA para turismo</div>
    </div>

  </div>
</div>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="viagem-${pkg.destination.toLowerCase().replace(/\s+/g, '-')}.html"`,
    },
  })
}
