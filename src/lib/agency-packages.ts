// ============================================================
// AGENCY PACKAGES — busca pacotes publicados na tabela posts
// Mesmo Supabase do projeto "A Viagem te Encontra"
// ============================================================

const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SB_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export interface AgencyPackage {
  id: string
  destino: string       // ex: "Fortaleza, Meireles"
  hotel: string
  preco: number
  ida: string           // DD/MM/YYYY
  volta: string
  origem: string
  regiao: string
  tipo: string          // praia | montanha | natureza | cidade
  all_inclusive: boolean
  cafe_manha: boolean
  luxo: boolean
  imagem: string
  voo_ida: string
  voo_volta: string
  wa_url: string        // link direto para fechar com WhatsApp
}

// Normaliza preço como o site original faz
function parsePrice(raw: unknown): number {
  if (!raw) return 0
  const s = String(raw).replace(/[^\d,.]/g, '').replace(',', '.')
  return parseFloat(s) || 0
}

// Infere tipo por destino/região (mesma lógica do site)
function parseTipo(destino: string, regiao: string): string {
  const d = destino.toLowerCase()
  const r = regiao.toLowerCase()
  if (['praia', 'beach', 'litoral', 'mar'].some(x => r.includes(x))) return 'praia'
  if (['montanha', 'serra', 'campo'].some(x => r.includes(x))) return 'montanha'
  if (['natureza', 'eco', 'floresta'].some(x => r.includes(x))) return 'natureza'
  if (['gramado', 'canela', 'campos do jordão', 'teresópolis'].some(x => d.includes(x))) return 'montanha'
  if (['bonito', 'pantanal', 'chapada', 'foz do iguaçu'].some(x => d.includes(x))) return 'natureza'
  if (['orlando', 'lisboa', 'lauderdale', 'madri', 'sintra', 'miami'].some(x => d.includes(x))) return 'cidade'
  if (['fortaleza', 'natal', 'maceió', 'recife', 'salvador', 'florianópolis', 'búzios', 'porto seguro', 'jericoacoara', 'noronha', 'maragogi', 'pipa', 'trancoso', 'morro', 'arraial', 'cancún', 'curaçao'].some(x => d.includes(x))) return 'praia'
  return 'cidade'
}

// Gera link WhatsApp para o pacote
function makeWaUrl(p: {
  destino: string; hotel: string; preco: number; ida: string; volta: string; origem: string
}): string {
  const agencyPhone = process.env.NEXT_PUBLIC_WHATSAPP || '5511953967095'
  const agencyName = process.env.NEXT_PUBLIC_AGENCY_NAME || 'Mesquita Turismo'
  const markup = Number(process.env.NEXT_PUBLIC_MARKUP_FLIGHTS || '0')
  const finalPrice = markup > 0 ? Math.ceil(p.preco * (1 + markup / 100)) : p.preco
  const msg = `Olá ${agencyName}! Tenho interesse no pacote:\n✈️ ${p.destino}\n🏨 ${p.hotel}\n📅 ${p.ida} → ${p.volta}\n💰 R$ ${finalPrice.toLocaleString('pt-BR')}\n\nPode me enviar mais informações?`
  return `https://wa.me/${agencyPhone}?text=${encodeURIComponent(msg)}`
}

// Busca todos os pacotes publicados
export async function fetchAgencyPackages(): Promise<AgencyPackage[]> {
  const url = `${SB_URL}/rest/v1/posts?select=id,destino,hotel,preco,ida,volta,origem,regiao,imagem_destino,cover_image_url,voo_ida,voo_volta,status&status=eq.published&order=id.asc&limit=500`

  const res = await fetch(url, {
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
    },
    next: { revalidate: 300 }, // cache 5 min
  })

  if (!res.ok) throw new Error(`Supabase posts error: ${res.status}`)
  const raw: Record<string, unknown>[] = await res.json()

  return raw
    .map(p => {
      const destino = (String(p.destino || p.title || '')).split(',')[0].trim()
      const preco = parsePrice(p.preco)
      const hotel = String(p.hotel || '')
      const hotelLower = hotel.toLowerCase()
      const imagem = String(p.imagem_destino || p.cover_image_url || '')

      return {
        id: String(p.id),
        destino,
        hotel,
        preco,
        ida: String(p.ida || ''),
        volta: String(p.volta || ''),
        origem: String(p.origem || ''),
        regiao: String(p.regiao || ''),
        tipo: parseTipo(destino, String(p.regiao || '')),
        all_inclusive: hotelLower.includes('all inclusive') || hotelLower.includes('all-inclusive'),
        cafe_manha: hotelLower.includes('café da manhã') || hotelLower.includes('cafe da manha') || hotelLower.includes('breakfast'),
        luxo: preco > 12000,
        imagem,
        voo_ida: String(p.voo_ida || ''),
        voo_volta: String(p.voo_volta || ''),
        wa_url: makeWaUrl({ destino, hotel, preco, ida: String(p.ida || ''), volta: String(p.volta || ''), origem: String(p.origem || '') }),
      }
    })
    .filter(p => p.preco > 0 && p.destino)
}

// Filtra pacotes relevantes para a intenção do usuário
export function filterPackages(
  packages: AgencyPackage[],
  filters: {
    destination?: string
    tipo?: string
    month?: string       // MM ex: "07"
    max_price?: number
    origin?: string
    all_inclusive?: boolean
    luxo?: boolean
  }
): AgencyPackage[] {
  return packages.filter(p => {
    // Filtra por destino (busca parcial)
    if (filters.destination) {
      const dest = filters.destination.toLowerCase()
      const match = p.destino.toLowerCase().includes(dest)
        || p.regiao.toLowerCase().includes(dest)
        || dest.includes(p.destino.toLowerCase().split(' ')[0])
      if (!match) return false
    }

    // Filtra por tipo
    if (filters.tipo && p.tipo !== filters.tipo) return false

    // Filtra por mês da viagem
    if (filters.month) {
      const mesIda = (p.ida || '').split('/')[1] || ''
      const mesVolta = (p.volta || '').split('/')[1] || ''
      if (mesIda !== filters.month && mesVolta !== filters.month) return false
    }

    // Filtra por preço máximo
    if (filters.max_price && p.preco > filters.max_price) return false

    // Filtra por origem
    if (filters.origin) {
      const orig = filters.origin.toLowerCase()
      if (p.origem && !p.origem.toLowerCase().includes(orig)) return false
    }

    // Filtra all inclusive
    if (filters.all_inclusive && !p.all_inclusive) return false

    // Filtra luxo
    if (filters.luxo && !p.luxo) return false

    return true
  })
}

// Formata pacotes para o agente apresentar
export function formatPackagesForAgent(packages: AgencyPackage[]): string {
  if (packages.length === 0) return 'Nenhum pacote encontrado com esses critérios.'

  const markup = Number(process.env.NEXT_PUBLIC_MARKUP_FLIGHTS || '0')

  return packages.slice(0, 6).map((p, i) => {
    const displayPrice = markup > 0 ? Math.ceil(p.preco * (1 + markup / 100)) : p.preco
    const badges = [
      p.all_inclusive ? '🍹 All Inclusive' : '',
      p.cafe_manha ? '☕ Café da manhã' : '',
      p.luxo ? '⭐ Luxo' : '',
    ].filter(Boolean).join(' · ')

    return `**${i + 1}. ${p.destino}** — ${p.hotel}
✈️ ${p.origem} · 📅 ${p.ida} → ${p.volta}
💰 R$ ${displayPrice.toLocaleString('pt-BR')} p/ 2 pessoas${badges ? `\n${badges}` : ''}
${p.voo_ida ? `🛫 ${p.voo_ida}` : ''}${p.voo_volta ? ` | 🛬 ${p.voo_volta}` : ''}
[💬 Quero este pacote](${p.wa_url})`
  }).join('\n\n---\n\n')
}
