import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })

  const body = await request.json()
  const { package_id, passenger_name, custom_notes } = body

  // Load package data
  const { data: pkg } = await supabase
    .from('travel_packages')
    .select('*')
    .eq('id', package_id)
    .eq('user_id', user.id)
    .single()

  if (!pkg) return new Response('Package not found', { status: 404 })

  // Load agency settings from travel_profiles
  const { data: profile } = await supabase
    .from('travel_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const agency = {
    name: process.env.NEXT_PUBLIC_AGENCY_NAME || 'Mesquita Turismo',
    phone: process.env.NEXT_PUBLIC_AGENCY_PHONE || '(11) 95396-7095',
    email: process.env.NEXT_PUBLIC_AGENCY_EMAIL || 'contato@mesquitaturismo.com.br',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '5511953967095',
    logo: process.env.NEXT_PUBLIC_AGENCY_LOGO || '',
  }

  const flights = Array.isArray(pkg.flight_data) ? pkg.flight_data
    : pkg.flight_data?.flights || []
  const hotels = Array.isArray(pkg.hotel_data) ? pkg.hotel_data
    : pkg.hotel_data?.hotels || []
  const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data : []

  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  const totalFormatted = pkg.total_price
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: pkg.currency || 'BRL' }).format(pkg.total_price)
    : ''

  const html = `<!DOCTYPE html>
<html lang="pt-br">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Orçamento de Viagem — ${pkg.title}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet"/>
<style>
:root{--primary:#2563eb;--accent:#0ea5e9;--bg:#f1f5f9;--white:#fff;--text:#1e293b;--muted:#64748b;--border:#e2e8f0;}
*{margin:0;padding:0;box-sizing:border-box;font-family:'Inter',sans-serif;}
body{background:var(--bg);color:var(--text);line-height:1.6;padding:40px 20px;}
.container{max-width:900px;margin:0 auto;background:var(--white);border-radius:16px;box-shadow:0 10px 25px -5px rgba(0,0,0,.1);overflow:hidden;}
header{padding:36px 40px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);}
.logo-area img{max-height:64px;max-width:200px;object-fit:contain;}
.logo-area .logo-text{font-size:24px;font-weight:700;color:var(--primary);}
.agency-info{text-align:right;}
.agency-info h1{font-size:22px;color:var(--primary);margin-bottom:4px;}
.agency-info p{font-size:13px;color:var(--muted);}
.client-section{padding:28px 40px;background:#f8fafc;display:grid;grid-template-columns:repeat(2,1fr);gap:20px;border-bottom:1px solid var(--border);}
.info-group h3{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:4px;}
.info-group p{font-weight:600;font-size:15px;}
.section{padding:36px 40px;border-bottom:1px solid var(--border);}
.section-title{font-size:18px;font-weight:700;color:var(--primary);margin-bottom:20px;}
.card{border:1px solid var(--border);border-radius:12px;padding:18px;margin-bottom:12px;}
.flight-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
.time{font-size:20px;font-weight:700;}
.airport{font-size:13px;color:var(--muted);}
.flight-mid{text-align:center;flex:1;position:relative;padding:0 12px;}
.flight-mid::after{content:"";position:absolute;top:50%;left:10%;right:10%;height:1px;background:var(--border);}
.flight-mid span{background:white;padding:0 8px;position:relative;z-index:2;font-size:12px;color:var(--muted);}
.grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;}
.detail-label{font-size:12px;color:var(--muted);margin-bottom:3px;}
.detail-value{font-weight:600;font-size:14px;}
.itinerary-item{display:flex;margin-bottom:18px;}
.itinerary-day{min-width:55px;font-weight:700;color:var(--primary);font-size:14px;}
.itinerary-content{padding-left:16px;border-left:2px solid var(--accent);}
.itinerary-content h4{margin-bottom:4px;font-size:14px;}
.itinerary-content p{font-size:13px;color:var(--muted);}
.summary{padding:36px 40px;background:var(--text);color:white;display:flex;justify-content:space-between;align-items:center;}
.total-label{font-size:16px;opacity:.8;}
.total-note{font-size:12px;opacity:.6;margin-top:4px;}
.total-price{font-size:32px;font-weight:700;color:var(--accent);}
footer{padding:24px 40px;text-align:center;font-size:12px;color:var(--muted);}
.btn-print{display:block;width:fit-content;margin:20px auto;padding:10px 24px;background:var(--primary);color:white;text-decoration:none;border-radius:8px;font-weight:600;cursor:pointer;border:none;font-size:14px;}
.badge{display:inline-block;font-size:11px;padding:2px 8px;border-radius:20px;background:#dbeafe;color:#1e40af;font-weight:500;margin-left:8px;}
@media print{body{padding:0;background:white;}.container{box-shadow:none;}.btn-print{display:none;}}
</style>
</head>
<body>
<div class="container">
<header>
  <div class="logo-area">
    ${agency.logo
      ? `<img src="${agency.logo}" alt="${agency.name}"/>`
      : `<div class="logo-text">${agency.name}</div>`
    }
  </div>
  <div class="agency-info">
    <h1>${agency.name}</h1>
    <p>${agency.email}</p>
    <p>${agency.phone}</p>
  </div>
</header>

<div class="client-section">
  <div class="info-group"><h3>Passageiro</h3><p>${passenger_name || 'Cliente'}</p></div>
  <div class="info-group"><h3>Destino</h3><p>${pkg.destination}${pkg.destination_country ? `, ${pkg.destination_country}` : ''}</p></div>
  <div class="info-group"><h3>Data de Emissão</h3><p>${today}</p></div>
  <div class="info-group"><h3>Validade do Orçamento</h3><p>48 horas</p></div>
</div>

${flights.length > 0 ? `
<div class="section">
  <div class="section-title">✈️ Passagens Aéreas</div>
  ${flights.map((f: Record<string, unknown>, i: number) => `
  <div class="card">
    <div style="font-size:13px;font-weight:600;margin-bottom:10px;">${i === 0 ? 'IDA' : 'VOLTA'}: ${String(f.departure_time || '').split(' ')[0] || ''}</div>
    <div class="flight-row">
      <div><div class="time">${f.origin || '---'}</div><div class="airport">${String(f.departure_time || '').split(' ')[1]?.slice(0,5) || '--:--'}</div></div>
      <div class="flight-mid"><span>${f.duration || ''} · ${f.stops === 0 ? 'Direto' : f.stops + ' parada(s)'}</span></div>
      <div style="text-align:right"><div class="time">${f.destination || '---'}</div><div class="airport">${String(f.arrival_time || '').split(' ')[1]?.slice(0,5) || '--:--'}</div></div>
    </div>
    <div style="font-size:12px;color:var(--muted)">${f.airline || ''}${f.flight_number ? ' · ' + f.flight_number : ''}${f.cabin_class ? ' · ' + f.cabin_class : ''}</div>
  </div>`).join('')}
</div>` : ''}

${hotels.length > 0 ? `
<div class="section">
  <div class="section-title">🏨 Hospedagem</div>
  ${hotels.slice(0, 1).map((h: Record<string, unknown>) => `
  <div class="card">
    <h3 style="margin-bottom:14px;font-size:16px;">${h.name || ''}${h.stars ? ' ' + '★'.repeat(Number(h.stars)) : ''}</h3>
    <div class="grid-2">
      <div><div class="detail-label">Check-in</div><div class="detail-value">${pkg.check_in || '--'}</div></div>
      <div><div class="detail-label">Check-out</div><div class="detail-value">${pkg.check_out || '--'}</div></div>
      ${h.address ? `<div><div class="detail-label">Endereço</div><div class="detail-value">${h.address}</div></div>` : ''}
      ${h.rating ? `<div><div class="detail-label">Avaliação</div><div class="detail-value">⭐ ${Number(h.rating).toFixed(1)}</div></div>` : ''}
    </div>
  </div>`).join('')}
</div>` : ''}

${activities.length > 0 ? `
<div class="section">
  <div class="section-title">🗺️ Atividades Sugeridas</div>
  ${activities.slice(0, 6).map((a: Record<string, unknown>, i: number) => `
  <div class="itinerary-item">
    <div class="itinerary-day">Dia ${i + 1}</div>
    <div class="itinerary-content">
      <h4>${a.name || ''}</h4>
      ${a.address ? `<p>${a.address}</p>` : ''}
    </div>
  </div>`).join('')}
</div>` : ''}

${custom_notes ? `
<div class="section">
  <div class="section-title">📝 Observações</div>
  <div class="card"><p style="font-size:14px;color:var(--muted);line-height:1.7">${custom_notes}</p></div>
</div>` : ''}

${pkg.total_price ? `
<div class="summary">
  <div>
    <p class="total-label">Investimento Total</p>
    <p class="total-note">${pkg.adults || 1} adulto${(pkg.adults || 1) !== 1 ? 's' : ''}${pkg.children > 0 ? ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}` : ''} · Aéreo + Hotel + Serviços</p>
  </div>
  <div style="text-align:right">
    <p class="total-price">${totalFormatted}</p>
    <p style="font-size:13px;opacity:.7">Valores sujeitos à disponibilidade</p>
  </div>
</div>` : ''}

<footer>
  <p>Este orçamento está sujeito a disponibilidade e alteração de valores sem aviso prévio.</p>
  <p style="margin-top:8px">© ${new Date().getFullYear()} ${agency.name} · ${agency.email} · ${agency.phone}</p>
  <p style="margin-top:4px">WhatsApp: <a href="https://wa.me/${agency.whatsapp}" style="color:var(--primary)">${agency.phone}</a></p>
</footer>
</div>

<button class="btn-print" onclick="window.print()">🖨️ Imprimir / Salvar como PDF</button>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="orcamento-${pkg.destination.toLowerCase().replace(/\s+/g, '-')}.html"`,
    },
  })
}
