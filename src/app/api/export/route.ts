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
  const idsParam  = searchParams.get('ids')           // comma-separated for combined export
  const showPrices = searchParams.get('prices') !== 'false'

  // ─── Resolve which packages to export ──────────────────────────
  let pkgs: Record<string, unknown>[] = []
  if (idsParam) {
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    const { data } = await supabase
      .from('travel_packages')
      .select('*')
      .in('id', ids)
      .eq('user_id', user.id)
    pkgs = data || []
  } else if (packageId) {
    const { data } = await supabase
      .from('travel_packages')
      .select('*')
      .eq('id', packageId)
      .eq('user_id', user.id)
      .single()
    if (data) pkgs = [data]
  }

  if (pkgs.length === 0) return new Response('Package not found', { status: 404 })

  const { data: profile } = await supabase
    .from('travel_profiles')
    .select('full_name, email')
    .eq('id', user.id)
    .single()

  const generated = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const isCombined = pkgs.length > 1

  // ─── Agency settings from env ───────────────────────────────────
  const agencyName  = process.env.NEXT_PUBLIC_AGENCY_NAME  || 'Mesquita Turismo'
  const agencyPhone = process.env.NEXT_PUBLIC_AGENCY_PHONE || '(11) 95396-7095'
  const agencyEmail = process.env.NEXT_PUBLIC_AGENCY_EMAIL || 'contato@mesquitaturismo.com.br'
  const agencyWa    = process.env.NEXT_PUBLIC_WHATSAPP     || '5511953967095'

  // ─── Build combined totals ───────────────────────────────────────
  const combinedTotal = pkgs.reduce((sum, p) => sum + (Number(p.total_price) || 0), 0)

  // ─── Smart combined title ────────────────────────────────────────
  // Detect what content is in the selected packages
  const allFlights    = pkgs.some(p => { const fd = (p.flight_data as Record<string,unknown>); return (fd?.flights as unknown[])?.length > 0 || Array.isArray(p.flight_data) && (p.flight_data as unknown[]).length > 0 })
  const allHotels     = pkgs.some(p => { const hd = (p.hotel_data as Record<string,unknown>); return (hd?.hotels as unknown[])?.length > 0 || Array.isArray(p.hotel_data) && (p.hotel_data as unknown[]).length > 0 })
  const allActivities = pkgs.some(p => Array.isArray(p.activities_data) && (p.activities_data as unknown[]).length > 0)
  const contentParts  = [allFlights && 'Voos', allHotels && 'Hotel', allActivities && 'Atividades'].filter(Boolean).join(' + ')

  const uniqueDests = Array.from(new Set(pkgs.map(p => p.destination as string))).join(', ')
  const combinedTitle = isCombined
    ? `Orçamento: ${uniqueDests}${contentParts ? ` — ${contentParts}` : ''}`
    : String(pkgs[0].title || '')

  // ─── First package data for header ─────────────────────────────
  const firstPkg = pkgs[0]
  const firstFlights  = (firstPkg.flight_data as Record<string,unknown>)?.flights as unknown[] || (Array.isArray(firstPkg.flight_data) ? firstPkg.flight_data : [])
  const firstHotels   = (firstPkg.hotel_data as Record<string,unknown>)?.hotels as unknown[] || (Array.isArray(firstPkg.hotel_data) ? firstPkg.hotel_data : [])
  const hotelThumb = (firstHotels[0] as Record<string,unknown>)?.thumbnail as string || ''

  const versionMatch = String(firstPkg.title || '').match(/\(v(\d+)\)$/)
  const versionLabel = isCombined
    ? (contentParts ? `Orçamento: ${contentParts}` : 'Orçamento Combinado')
    : (versionMatch ? `Versão ${versionMatch[1]}` : 'Orçamento')

  // ─── Package sections HTML ──────────────────────────────────────
  function renderPkg(pkg: Record<string, unknown>): string {
    const flights    = (pkg.flight_data as Record<string,unknown>)?.flights as Record<string,unknown>[] || (Array.isArray(pkg.flight_data) ? pkg.flight_data as Record<string,unknown>[] : [])
    const hotels     = (pkg.hotel_data as Record<string,unknown>)?.hotels as Record<string,unknown>[] || (Array.isArray(pkg.hotel_data) ? pkg.hotel_data as Record<string,unknown>[] : [])
    const activities = Array.isArray(pkg.activities_data) ? pkg.activities_data as Record<string,unknown>[] : []

    const checkIn  = pkg.check_in  ? formatDate(pkg.check_in as string, 'dd/MM/yyyy') : '—'
    const checkOut = pkg.check_out ? formatDate(pkg.check_out as string, 'dd/MM/yyyy') : '—'
    const nights   = pkg.check_in && pkg.check_out ? tripDuration(pkg.check_in as string, pkg.check_out as string) : null
    const totalFormatted = pkg.total_price ? formatCurrency(Number(pkg.total_price), String(pkg.currency || 'BRL')) : '—'

    // ── helper to render a single flight leg ──────────────────────
    const renderLeg = (f: Record<string,unknown>, label?: string) => `
      <div class="flight-leg${label ? ' flight-leg-labeled' : ''}">
        ${label ? `<div class="flight-leg-label">${label}</div>` : ''}
        <div class="flight-route">
          <div>
            <div class="flight-airport">${f.origin || '—'}</div>
            <div class="flight-time">${String(f.departure_time || '').slice(0, 16)}</div>
          </div>
          <div class="flight-middle">
            <div class="flight-duration">${f.duration || ''}</div>
            <div class="flight-line"></div>
            <div class="flight-stops">${f.stops === 0 ? 'Direto' : (Number(f.stops) || 0) + ' parada(s)'}</div>
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
      </div>`

    const adults = Number(pkg.adults || 1)
    const children = Number(pkg.children || 0)
    const paxLabel = `${adults} adulto${adults !== 1 ? 's' : ''}${children > 0 ? ` + ${children} criança${children !== 1 ? 's' : ''}` : ''}`

    return `
    ${isCombined ? `<div class="pkg-separator"><span>${pkg.destination as string}${pkg.destination_country ? ', ' + pkg.destination_country : ''}</span></div>` : ''}

    <!-- VIAJANTES + DATAS -->
    <div class="trip-info-bar">
      <div class="trip-info-item">👥 <strong>${paxLabel}</strong></div>
      ${pkg.check_in ? `<div class="trip-info-item">📅 <strong>${checkIn} → ${checkOut}</strong>${nights ? ` &nbsp;·&nbsp; ${nights} noite${Number(nights) !== 1 ? 's' : ''}` : ''}</div>` : ''}
      ${pkg.destination ? `<div class="trip-info-item">📍 <strong>${pkg.destination as string}${pkg.destination_country ? ', ' + pkg.destination_country : ''}</strong></div>` : ''}
    </div>

    <!-- VOOS -->
    ${flights.length > 0 ? `
    <div class="section">
      <div class="section-title">✈️ Voos</div>
      ${flights.slice(0, 3).map(f => {
        const ret = f.return_flight as Record<string,unknown> | undefined
        const hasReturn = !!ret
        return `
      <div class="flight-card">
        ${hasReturn ? renderLeg(f, '🛫 IDA') : renderLeg(f)}
        ${hasReturn && ret ? `
        <div class="flight-divider"></div>
        ${renderLeg(ret, '🛬 VOLTA')}` : ''}
        ${showPrices && f.price ? `
        <div class="flight-price-row">
          <div class="flight-price">
            ${adults > 1
              ? `${formatCurrency(Number(f.price) * adults, String(f.currency || 'BRL'))} <small>total · ${formatCurrency(Number(f.price), String(f.currency || 'BRL'))}/pessoa × ${adults}</small>`
              : `${formatCurrency(Number(f.price), String(f.currency || 'BRL'))} <small>/ pessoa</small>`
            }
          </div>
          <div class="flight-price-disc">* Sujeito a taxas e disponibilidade</div>
        </div>` : ''}
      </div>`}).join('')}
    </div>` : ''}

    <!-- HOTÉIS -->
    ${hotels.length > 0 ? `
    <div class="section">
      <div class="section-title">🏨 Hospedagem</div>
      ${hotels.slice(0, 2).map(h => {
        const hn = nights ?? 1
        const ppn = Number(h.price_per_night || 0)
        const total = ppn * hn
        const cur = String(h.currency || 'BRL')
        return `
      <div class="hotel-card">
        ${h.thumbnail ? `<img class="hotel-img" src="${h.thumbnail}" alt="${h.name}" onerror="this.style.display='none'" />` : ''}
        <div class="hotel-body">
          <div class="hotel-name">${h.name || '—'}</div>
          ${h.stars ? `<div class="stars">${'★'.repeat(Number(h.stars))}${'☆'.repeat(Math.max(0, 5 - Number(h.stars)))}</div>` : ''}
          <div class="hotel-row">
            <div class="hotel-info">
              ${h.address ? `📍 ${h.address}<br>` : ''}
              ${h.rating ? `⭐ ${Number(h.rating).toFixed(1)}${h.reviews_count ? ` · ${Number(h.reviews_count).toLocaleString()} avaliações` : ''}` : ''}
              ${h.amenities ? `<br>${(h.amenities as string[]).slice(0, 4).join(' · ')}` : ''}
            </div>
            ${showPrices ? `
            <div class="hotel-price-block">
              <div class="hotel-price">${formatCurrency(total, cur)}</div>
              <div class="hotel-price-detail">${formatCurrency(ppn, cur)}/noite × ${hn} noite${hn !== 1 ? 's' : ''}</div>
            </div>` : ''}
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
        ${activities.slice(0, 8).map(a => `
        <div class="activity-card">
          ${a.thumbnail ? `<img class="activity-img" src="${a.thumbnail}" alt="${a.name}" onerror="this.style.display='none'" />` : ''}
          <div class="activity-body">
            <div class="activity-name">${a.name || '—'}</div>
            ${a.address ? `<div class="activity-addr">📍 ${a.address}</div>` : ''}
            ${a.rating ? `<div class="activity-rating">⭐ ${Number(a.rating).toFixed(1)}${a.reviews_count ? ` · ${Number(a.reviews_count).toLocaleString()} avaliações` : ''}</div>` : ''}
          </div>
        </div>`).join('')}
      </div>
    </div>` : ''}

    <!-- TOTAL POR ITEM -->
    ${showPrices && pkg.total_price && !isCombined ? `
    <div class="total-box">
      <div>
        <div class="total-label">Investimento total estimado</div>
        <div class="total-value">${totalFormatted}</div>
        <div class="total-sub">Para ${pkg.adults} adulto${Number(pkg.adults) !== 1 ? 's' : ''}${Number(pkg.children) > 0 ? ` e ${pkg.children} criança${Number(pkg.children) !== 1 ? 's' : ''}` : ''} · ${checkIn} → ${checkOut}</div>
      </div>
      <div style="font-size:48px;opacity:.4">✈</div>
    </div>` : ''}

    <!-- OBSERVAÇÕES -->
    ${pkg.notes ? `
    <div class="notes-box">
      <div class="notes-title">📝 Observações</div>
      ${pkg.notes}
    </div>` : ''}
    `
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${combinedTitle}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Plus Jakarta Sans',sans-serif;background:#f0f4ff;color:#1a1a1a;font-size:13px;line-height:1.6}
  .page{max-width:820px;margin:0 auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.08)}

  /* ── HEADER ── */
  .header{position:relative;overflow:hidden;min-height:220px}
  .header-bg{position:absolute;inset:0;background:linear-gradient(135deg,#031F30 0%,#177CBC 100%)}
  .header-img{position:absolute;inset:0;object-fit:cover;width:100%;height:100%;mix-blend-mode:overlay;opacity:.35}
  .header-content{position:relative;z-index:2;padding:36px 48px 32px}
  .header-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.3);border-radius:20px;padding:4px 12px;font-size:10px;color:#fff;letter-spacing:.5px;text-transform:uppercase;margin-bottom:16px}
  .agency-name{font-size:11px;font-weight:600;color:rgba(255,255,255,.8);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
  .header h1{font-family:'Plus Jakarta Sans',sans-serif;font-size:28px;font-weight:800;color:#fff;margin-bottom:4px;line-height:1.2}
  .header .destination{font-size:15px;color:rgba(255,255,255,.8);font-weight:300}
  .header-meta{display:flex;gap:16px;margin-top:24px;flex-wrap:wrap}
  .header-meta-item{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:10px 16px;min-width:110px}
  .header-meta-item .label{font-size:10px;color:rgba(255,255,255,.7);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
  .header-meta-item .value{font-size:13px;font-weight:600;color:#fff}

  /* ── BODY ── */
  .body{padding:40px 48px}
  .pkg-separator{text-align:center;margin:32px 0 20px;position:relative}
  .pkg-separator::before{content:'';position:absolute;left:0;right:0;top:50%;height:1px;background:#e5e7eb}
  .pkg-separator span{position:relative;background:#fff;padding:0 16px;font-weight:700;color:#177CBC;font-size:13px}

  /* ── SECTION ── */
  .section{margin-bottom:36px}
  .section-title{font-size:15px;font-weight:700;color:#031F30;padding-bottom:10px;border-bottom:2px solid #C7EEFA;margin-bottom:18px;display:flex;align-items:center;gap:8px}

  /* ── TRIP INFO BAR ── */
  .trip-info-bar{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:24px;background:#EBF8FD;border:1px solid #C7EEFA;border-radius:12px;padding:12px 18px}
  .trip-info-item{font-size:12px;color:#031F30;display:flex;align-items:center;gap:4px}

  /* ── FLIGHT ── */
  .flight-card{background:#EBF8FD;border:1px solid #93DCF5;border-radius:12px;padding:16px 20px;margin-bottom:12px;overflow:hidden}
  .flight-leg{padding:4px 0}
  .flight-leg-labeled{padding:6px 0}
  .flight-leg-label{font-size:10px;font-weight:700;color:#177CBC;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px}
  .flight-divider{height:1px;background:#C7EEFA;margin:10px 0;border:none}
  .flight-route{display:flex;align-items:center;gap:16px;margin-bottom:8px}
  .flight-airport{font-size:22px;font-weight:800;color:#031F30;letter-spacing:-0.5px}
  .flight-time{font-size:11px;color:#6b7280;margin-top:2px}
  .flight-middle{flex:1;text-align:center}
  .flight-duration{font-size:11px;color:#6b7280;margin-bottom:4px}
  .flight-line{height:2px;background:linear-gradient(90deg,#93DCF5,#177CBC,#93DCF5);border-radius:2px;position:relative}
  .flight-line::after{content:'✈';position:absolute;right:-4px;top:-9px;font-size:13px;color:#177CBC}
  .flight-stops{font-size:10px;color:#177CBC;font-weight:600;margin-top:4px}
  .flight-tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
  .flight-tag{background:#fff;border:1px solid #C7EEFA;border-radius:6px;padding:2px 8px;font-size:11px;color:#374151}
  .flight-price-row{margin-top:10px;padding-top:10px;border-top:1px solid #C7EEFA}
  .flight-price{font-size:17px;font-weight:700;color:#177CBC}
  .flight-price small{font-size:11px;font-weight:400;color:#9ca3af;margin-left:4px}
  .flight-price-disc{font-size:10px;color:#9ca3af;margin-top:2px;font-style:italic}

  /* ── HOTEL ── */
  .hotel-card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:12px}
  .hotel-img{width:100%;height:140px;object-fit:cover;display:block}
  .hotel-body{padding:14px 18px}
  .hotel-name{font-size:15px;font-weight:700;color:#111;margin-bottom:4px}
  .stars{color:#f59e0b;font-size:13px;letter-spacing:2px}
  .hotel-row{display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;flex-wrap:wrap;gap:8px}
  .hotel-info{font-size:11px;color:#6b7280;line-height:1.8}
  .hotel-price-block{text-align:right}
  .hotel-price{font-size:18px;font-weight:700;color:#177CBC}
  .hotel-price-detail{font-size:10px;color:#9ca3af;margin-top:1px}
  .hotel-disclaimer{font-size:10px;color:#d97706;background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:4px 10px;margin-top:8px}

  /* ── ACTIVITIES ── */
  .activities-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .activity-card{background:#f8faff;border:1px solid #C7EEFA;border-radius:10px;overflow:hidden}
  .activity-img{width:100%;height:70px;object-fit:cover}
  .activity-body{padding:8px 12px}
  .activity-name{font-size:12px;font-weight:600;color:#031F30;margin-bottom:2px}
  .activity-addr{font-size:10px;color:#6b7280}
  .activity-rating{font-size:10px;color:#d97706;margin-top:3px}

  /* ── TOTAL ── */
  .total-box{background:linear-gradient(135deg,#031F30,#177CBC);color:#fff;border-radius:16px;padding:24px 32px;margin-top:24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
  .total-label{font-size:12px;opacity:.75;margin-bottom:4px}
  .total-value{font-size:30px;font-weight:800;letter-spacing:-1px}
  .total-sub{font-size:11px;opacity:.65;margin-top:4px}

  /* ── NOTES ── */
  .notes-box{background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:16px 20px;font-size:12px;color:#4b5563;line-height:1.8;margin-top:20px}
  .notes-title{font-weight:600;color:#374151;margin-bottom:8px;font-size:13px}

  /* ── COMBINED TOTAL ── */
  .combined-total{background:linear-gradient(135deg,#031F30,#177CBC);color:#fff;border-radius:16px;padding:28px 40px;margin-top:36px;text-align:center}
  .combined-total-label{font-size:12px;opacity:.75;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px}
  .combined-total-value{font-size:36px;font-weight:800;letter-spacing:-1px;margin-bottom:4px}
  .combined-total-items{font-size:11px;opacity:.7}

  /* ── FOOTER ── */
  .footer{margin-top:40px;padding:20px 48px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;font-size:10px;color:#9ca3af;background:#fafafa}
  .footer-brand{color:#177CBC;font-weight:700;font-size:11px}

  /* ── AGENCY LOGO ── */
  #agency-logo{display:none;height:44px;width:auto;object-fit:contain;max-width:180px;border-radius:6px;filter:brightness(0) invert(1);margin-bottom:10px}

  /* ── PRINT ── */
  @media print{
    body{background:#fff}
    .page{box-shadow:none;max-width:100%}
    .header-bg{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    .total-box,.combined-total{-webkit-print-color-adjust:exact;print-color-adjust:exact}
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
    ${hotelThumb ? `<img class="header-img" src="${hotelThumb}" alt="destino" onerror="this.style.display='none'" />` : ''}
    <div class="header-content">
      <img id="agency-logo" src="" alt="${agencyName}" />
      <div class="header-badge">✈ ${versionLabel} · ${agencyName}</div>
      <div class="agency-name">${agencyName} · mesquitaturismo.com.br</div>
      <h1>${combinedTitle}</h1>
      <div class="destination">${pkgs.map(p => `${p.destination as string}${p.destination_country ? ', ' + p.destination_country : ''}`).join(' + ')}</div>
      <div class="header-meta">
        ${!isCombined && firstPkg.check_in ? `
        <div class="header-meta-item">
          <div class="label">Ida</div>
          <div class="value">${formatDate(firstPkg.check_in as string, 'dd/MM/yyyy')}</div>
        </div>
        <div class="header-meta-item">
          <div class="label">Volta</div>
          <div class="value">${firstPkg.check_out ? formatDate(firstPkg.check_out as string, 'dd/MM/yyyy') : '—'}</div>
        </div>
        ${firstPkg.check_in && firstPkg.check_out ? `<div class="header-meta-item"><div class="label">Noites</div><div class="value">${tripDuration(firstPkg.check_in as string, firstPkg.check_out as string)}</div></div>` : ''}
        ` : ''}
        <div class="header-meta-item">
          <div class="label">Emitido para</div>
          <div class="value">${profile?.full_name || 'Cliente'}</div>
        </div>
        ${showPrices && combinedTotal > 0 ? `
        <div class="header-meta-item">
          <div class="label">Total</div>
          <div class="value">${formatCurrency(combinedTotal, 'BRL')}</div>
        </div>` : ''}
      </div>
    </div>
  </div>

  <div class="body">
    ${pkgs.map(p => renderPkg(p)).join('')}

    ${isCombined && showPrices && combinedTotal > 0 ? `
    <div class="combined-total">
      <div class="combined-total-label">Investimento Total Combinado</div>
      <div class="combined-total-value">${formatCurrency(combinedTotal, 'BRL')}</div>
      <div class="combined-total-items">${pkgs.length} itens selecionados · ${pkgs.map(p => p.destination as string).join(', ')}</div>
    </div>` : ''}
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <div>Emitido em ${generated} · Para: ${profile?.full_name || 'Cliente'}${profile?.email ? ` (${profile.email})` : ''}</div>
    <div style="text-align:right">
      <div class="footer-brand">${agencyName}</div>
      ${agencyPhone ? `<div style="margin-top:2px">${agencyPhone}${agencyEmail ? ` · ${agencyEmail}` : ''}</div>` : ''}
      <div style="margin-top:1px">mesquitaturismo.com.br</div>
    </div>
  </div>

</div>
<script>
  window.onload = function() {
    // ── Inject agency logo from localStorage ──
    try {
      var s = JSON.parse(localStorage.getItem('iv_agency_settings') || '{}');
      if (s.logoUrl) {
        var el = document.getElementById('agency-logo');
        if (el) {
          el.src = s.logoUrl;
          el.style.display = 'block';
          el.style.filter = 'brightness(0) invert(1)';
        }
      }
      if (s.agencyName) {
        document.querySelectorAll('.footer-brand').forEach(function(el){ el.textContent = s.agencyName; });
      }
    } catch(e) {}

    // ── Print button ──
    var btn = document.createElement('button');
    btn.textContent = '🖨️ Salvar como PDF';
    btn.style = 'position:fixed;bottom:20px;right:20px;background:#177CBC;color:#fff;border:none;border-radius:12px;padding:14px 24px;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 4px 20px rgba(23,124,188,.45);z-index:999;font-family:Plus Jakarta Sans,sans-serif;letter-spacing:.3px';
    btn.onclick = function(){ window.print(); };
    document.body.appendChild(btn);

    // ── Auto-open print dialog after a short delay ──
    setTimeout(function(){ window.print(); }, 800);
  }
</script>
</body>
</html>`

  const filename = isCombined
    ? `orcamento-combinado.html`
    : `orcamento-${String(firstPkg.destination || 'viagem').toLowerCase().replace(/\s+/g, '-')}.html`

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
