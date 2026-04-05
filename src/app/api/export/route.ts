import { createClient } from '@/lib/supabase/server'
import { formatDate, formatCurrency, tripDuration } from '@/lib/utils'
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
    .from('travel_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const flights    = pkg.flight_data?.flights      || (Array.isArray(pkg.flight_data)      ? pkg.flight_data      : [])
  const hotels     = pkg.hotel_data?.hotels        || (Array.isArray(pkg.hotel_data)        ? pkg.hotel_data        : [])
  const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data : []

  const checkIn       = pkg.check_in  ? formatDate(pkg.check_in,  'dd/MM/yyyy') : '—'
  const checkOut      = pkg.check_out ? formatDate(pkg.check_out, 'dd/MM/yyyy') : '—'
  const nights        = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in, pkg.check_out) : null
  const totalFormatted = pkg.total_price ? formatCurrency(pkg.total_price, pkg.currency || 'BRL') : '—'
  const generated     = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // ─── Hotel thumbnail for header ─────────────────────────────
  const hotelThumb = hotels[0]?.thumbnail || ''

  // ─── Version label ──────────────────────────────────────────
  const versionMatch = pkg.title.match(/\(v(\d+)\)$/)
  const versionLabel = versionMatch ? `Versão ${versionMatch[1]}` : 'Orçamento'

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${pkg.title} — ${versionLabel}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'DM Sans',sans-serif;background:#f9fafb;color:#1a1a1a;font-size:13px;line-height:1.6}
  .page{max-width:820px;margin:0 auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.08)}

  /* ── HEADER ── */
  .header{position:relative;overflow:hidden;min-height:220px}
  .header-bg{position:absolute;inset:0;background:linear-gradient(135deg,#065c3a 0%,#0f9e64 100%)}
  .header-img{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;mix-blend-mode:overlay;opacity:.4}
  .header-content{position:relative;z-index:2;padding:36px 48px 32px}
  .header-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 12px;font-size:10px;color:#fff;letter-spacing:.5px;text-transform:uppercase;margin-bottom:16px}
  .agency-name{font-size:11px;font-weight:600;color:rgba(255,255,255,.8);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
  .header h1{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#fff;margin-bottom:4px;line-height:1.2}
  .header .destination{font-size:15px;color:rgba(255,255,255,.8);font-weight:300}
  .header-meta{display:flex;gap:16px;margin-top:24px;flex-wrap:wrap}
  .header-meta-item{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 16px;min-width:110px}
  .header-meta-item .label{font-size:10px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .header-meta-item .value{font-size:13px;font-weight:600;color:#fff}

  /* ── BODY ── */
  .body{padding:40px 48px}

  /* ── SECTION ── */
  .section{margin-bottom:36px}
  .section-title{font-family:'Playfair Display',serif;font-size:17px;font-weight:600;color:#065c3a;padding-bottom:10px;border-bottom:2px solid #d1fae5;margin-bottom:18px;display:flex;align-items:center;gap:8px}

  /* ── FLIGHT ── */
  .flight-card{background:#f0fdf9;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;margin-bottom:12px}
  .flight-route{display:flex;align-items:center;gap:16px;margin-bottom:10px}
  .flight-airport{font-size:22px;font-weight:800;color:#065c3a;letter-spacing:-0.5px}
  .flight-time{font-size:11px;color:#6b7280;margin-top:2px}
  .flight-middle{flex:1;text-align:center}
  .flight-duration{font-size:11px;color:#6b7280;margin-bottom:4px}
  .flight-line{height:2px;background:linear-gradient(90deg,#a7f3d0,#0f9e64,#a7f3d0);border-radius:2px;position:relative}
  .flight-line::after{content:'✈';position:absolute;right:-4px;top:-9px;font-size:13px;color:#0f9e64}
  .flight-stops{font-size:10px;color:#0f9e64;font-weight:600;margin-top:4px}
  .flight-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
  .flight-tag{background:#fff;border:1px solid #d1fae5;border-radius:6px;padding:2px 8px;font-size:11px;color:#374151}
  .flight-price{font-size:18px;font-weight:700;color:#0f9e64;text-align:right;margin-top:8px}
  .flight-price small{font-size:11px;font-weight:400;color:#9ca3af}

  /* ── HOTEL ── */
  .hotel-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:12px}
  .hotel-img{width:100%;height:140px;object-fit:cover;display:block}
  .hotel-body{padding:14px 18px}
  .hotel-name{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
  .stars{color:#f59e0b;font-size:13px;letter-spacing:2px}
  .hotel-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;flex-wrap:wrap;gap:8px}
  .hotel-info{font-size:11px;color:#6b7280;line-height:1.8}
  .hotel-price-block{text-align:right}
  .hotel-price{font-size:18px;font-weight:700;color:#0f9e64}
  .hotel-price-detail{font-size:10px;color:#9ca3af;margin-top:1px}
  .hotel-disclaimer{font-size:10px;color:#f59e0b;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:4px 10px;margin-top:8px}

  /* ── ACTIVITIES ── */
  .activities-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .activity-card{background:#fffdf7;border:1px solid #fde68a;border-radius:10px;overflow:hidden}
  .activity-img{width:100%;height:70px;object-fit:cover}
  .activity-body{padding:8px 12px}
  .activity-name{font-size:12px;font-weight:600;color:#78350f;margin-bottom:2px}
  .activity-addr{font-size:10px;color:#92400e;opacity:.75}
  .activity-rating{font-size:10px;color:#d97706;margin-top:3px}

  /* ── TOTAL ── */
  .total-box{background:linear-gradient(135deg,#065c3a,#0f9e64);color:#fff;border-radius:16px;padding:24px 32px;margin-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
  .total-label{font-size:12px;opacity:.75;margin-bottom:4px}
  .total-value{font-family:'Playfair Display',serif;font-size:30px;font-weight:700}
  .total-sub{font-size:11px;opacity:.65;margin-top:4px}

  /* ── NOTES ── */
  .notes-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;font-size:12px;color:#4b5563;line-height:1.8;margin-top:20px}
  .notes-title{font-weight:600;color:#374151;margin-bottom:8px;font-size:13px}

  /* ── FOOTER ── */
  .footer{margin-top:40px;padding:20px 48px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af;background:#fafafa}
  .footer-brand{color:#0f9e64;font-weight:600;font-size:11px}

  /* ── PRINT ── */
  @media print{
    body{background:#fff}
    .page{box-shadow:none;max-width:100%}
    .header-bg{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .total-box{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .flight-card,.hotel-card,.activity-card{break-inside:avoid}
    .section{break-inside:avoid}
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-bg"></div>
    ${hotelThumb ? `<img class="header-img" src="${hotelThumb}" alt="destino" />` : ''}
    <div class="header-content">
      <div class="header-badge">✈ ${versionLabel} · Mesquita Turismo</div>
      <div class="agency-name">Mesquita Turismo · mesquitaturismo.com.br</div>
      <h1>${pkg.title}</h1>
      <div class="destination">${pkg.destination}${pkg.destination_country ? ', ' + pkg.destination_country : ''}</div>
      <div class="header-meta">
        <div class="header-meta-item">
          <div class="label">Ida</div>
          <div class="value">${checkIn}</div>
        </div>
        <div class="header-meta-item">
          <div class="label">Volta</div>
          <div class="value">${checkOut}</div>
        </div>
        ${nights ? `<div class="header-meta-item"><div class="label">Noites</div><div class="value">${nights}</div></div>` : ''}
        <div class="header-meta-item">
          <div class="label">Viajantes</div>
          <div class="value">${pkg.adults} adulto${pkg.adults !== 1 ? 's' : ''}${pkg.children > 0 ? ` + ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}` : ''}</div>
        </div>
        <div class="header-meta-item">
          <div class="label">Emitido para</div>
          <div class="value">${profile?.full_name || 'Cliente'}</div>
        </div>
      </div>
    </div>
  </div>

  <div class="body">

    <!-- VOOS -->
    ${flights.length > 0 ? `
    <div class="section">
      <div class="section-title">✈️ Voos</div>
      ${flights.slice(0, 3).map((f: Record<string, unknown>) => `
      <div class="flight-card">
        <div class="flight-route">
          <div>
            <div class="flight-airport">${f.origin || '—'}</div>
            <div class="flight-time">${String(f.departure_time || '').slice(0, 16)}</div>
          </div>
          <div class="flight-middle">
            <div class="flight-duration">${f.duration || ''}</div>
            <div class="flight-line"></div>
            <div class="flight-stops">${f.stops === 0 ? 'Direto' : (f.stops || 0) + ' parada(s)'}</div>
          </div>
          <div style="text-align:right">
            <div class="flight-airport">${f.destination || '—'}</div>
            <div class="flight-time">${String(f.arrival_time || '').slice(0, 16)}</div>
          </div>
        </div>
        <div class="flight-tags">
          ${f.airline ? `<span class="flight-tag">🏷 ${f.airline}</span>` : ''}
          ${f.flight_number ? `<span class="flight-tag">${f.flight_number}</span>` : ''}
          ${f.cabin_class ? `<span class="flight-tag">${f.cabin_class}</span>` : ''}
        </div>
        ${f.price ? `<div class="flight-price">${formatCurrency(Number(f.price), String(f.currency || 'BRL'))}<small> / pessoa</small></div>` : ''}
      </div>`).join('')}
    </div>` : ''}

    <!-- HOTÉIS -->
    ${hotels.length > 0 ? `
    <div class="section">
      <div class="section-title">🏨 Hospedagem</div>
      ${hotels.slice(0, 2).map((h: Record<string, unknown>) => {
        const hn = nights ?? 1
        const ppn = Number(h.price_per_night || 0)
        const total = ppn * hn
        const cur = String(h.currency || 'BRL')
        return `
      <div class="hotel-card">
        ${h.thumbnail ? `<img class="hotel-img" src="${h.thumbnail}" alt="${h.name}" />` : ''}
        <div class="hotel-body">
          <div class="hotel-name">${h.name || '—'}</div>
          ${h.stars ? `<div class="stars">${'★'.repeat(Number(h.stars))}${'☆'.repeat(Math.max(0, 5 - Number(h.stars)))}</div>` : ''}
          <div class="hotel-row">
            <div class="hotel-info">
              ${h.address ? `📍 ${h.address}<br>` : ''}
              ${h.rating ? `⭐ ${Number(h.rating).toFixed(1)}${h.reviews_count ? ` · ${Number(h.reviews_count).toLocaleString()} avaliações` : ''}` : ''}
              ${h.amenities ? `<br>${(h.amenities as string[]).slice(0, 4).join(' · ')}` : ''}
            </div>
            <div class="hotel-price-block">
              <div class="hotel-price">${formatCurrency(total, cur)}</div>
              <div class="hotel-price-detail">${formatCurrency(ppn, cur)}/noite × ${hn} noite${hn !== 1 ? 's' : ''}</div>
            </div>
          </div>
          <div class="hotel-disclaimer">⚠️ Podem haver taxas adicionais. Valores sujeitos a alteração.</div>
        </div>
      </div>`}).join('')}
    </div>` : ''}

    <!-- ATIVIDADES -->
    ${activities.length > 0 ? `
    <div class="section">
      <div class="section-title">🗺️ Atividades e atrações</div>
      <div class="activities-grid">
        ${activities.slice(0, 8).map((a: Record<string, unknown>) => `
        <div class="activity-card">
          ${a.thumbnail ? `<img class="activity-img" src="${a.thumbnail}" alt="${a.name}" />` : ''}
          <div class="activity-body">
            <div class="activity-name">${a.name || '—'}</div>
            ${a.address ? `<div class="activity-addr">📍 ${a.address}</div>` : ''}
            ${a.rating ? `<div class="activity-rating">⭐ ${Number(a.rating).toFixed(1)}${a.reviews_count ? ` · ${Number(a.reviews_count).toLocaleString()} avaliações` : ''}</div>` : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- TOTAL -->
    ${pkg.total_price ? `
    <div class="total-box">
      <div>
        <div class="total-label">Investimento total estimado</div>
        <div class="total-value">${totalFormatted}</div>
        <div class="total-sub">Para ${pkg.adults} adulto${pkg.adults !== 1 ? 's' : ''}${pkg.children > 0 ? ` e ${pkg.children} criança${pkg.children !== 1 ? 's' : ''}` : ''} · ${checkIn} → ${checkOut}</div>
      </div>
      <div style="font-size:48px;opacity:.4">✈</div>
    </div>` : ''}

    <!-- OBSERVAÇÕES -->
    ${pkg.notes ? `
    <div class="notes-box">
      <div class="notes-title">📝 Observações</div>
      ${pkg.notes}
    </div>` : ''}

  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>Emitido em ${generated} · ${profile?.email || ''}</div>
    <div>
      <div class="footer-brand">Mesquita Turismo</div>
      <div style="margin-top:1px">mesquitaturismo.com.br · comprarviagem.com.br/mesquitaturismo</div>
    </div>
  </div>

</div>
<script>
  // Auto-suggest print on load
  window.onload = function() {
    const btn = document.createElement('button');
    btn.textContent = '🖨️ Imprimir / Salvar como PDF';
    btn.style = 'position:fixed;bottom:20px;right:20px;background:#0f9e64;color:#fff;border:none;border-radius:12px;padding:12px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(15,158,100,.4);z-index:999;font-family:DM Sans,sans-serif';
    btn.onclick = () => window.print();
    document.body.appendChild(btn);
  }
</script>
</body>
</html>`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="orcamento-${pkg.destination.toLowerCase().replace(/\s+/g, '-')}.html"`,
    },
  })
}
