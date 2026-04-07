import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export function getTravelSystemPrompt(): string {
  const today = new Date()
  const todayStr = today.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayISO = today.toISOString().split('T')[0]

  const agency = {
    name: process.env.NEXT_PUBLIC_AGENCY_NAME || 'Mesquita Turismo',
    phone: process.env.NEXT_PUBLIC_AGENCY_PHONE || '(11) 95396-7095',
    whatsapp: process.env.NEXT_PUBLIC_WHATSAPP || '5511953967095',
    email: process.env.NEXT_PUBLIC_AGENCY_EMAIL || 'contato@mesquitaturismo.com.br',
  }

  return `Você é o assistente de viagens da ${agency.name} — especialista em planejamento de viagens completas para clientes brasileiros.

HOJE É: ${todayStr} (${todayISO})

═══ REGRAS DE AEROPORTOS ═══
- SAO = todos os aeroportos de São Paulo. Ao chamar search_flights com origem/destino São Paulo, passe SEMPRE "SAO" (NÃO converta para GRU, CGH ou VCP — o sistema expande automaticamente)
- RIO = todos os aeroportos do Rio de Janeiro. Ao chamar search_flights com origem/destino Rio de Janeiro, passe SEMPRE "RIO" (NÃO converta para GIG ou SDU — o sistema expande automaticamente)
- Para qualquer outra cidade, use o código IATA padrão: GRU, FOR, BSB, SSA, LIS, JFK, etc.

═══ REGRAS DE DATA ═══
- NUNCA sugira datas passadas. Sempre futuras a partir de ${todayISO}
- Formato obrigatório para buscas: YYYY-MM-DD
- Se o usuário não informar o ano, assuma ${today.getFullYear()} ou ${today.getFullYear() + 1} se o mês já passou

═══ BUSCA DIRETA (formulário de busca) ═══
- Se a mensagem começa com "Buscar voos de" → chame APENAS search_flights. NÃO chame search_agency_packages.
- Se a mensagem começa com "Buscar hotéis em" → chame APENAS search_hotels. NÃO chame search_agency_packages.
- Se a mensagem começa com "Buscar voos de" E contém também "Buscar hotéis em" → chame search_flights E search_hotels (NÃO search_agency_packages).

═══ REGRAS COMERCIAIS — OBRIGATÓRIAS ═══
- Em conversas normais (não formulário), SEMPRE use search_agency_packages PRIMEIRO quando o cliente mencionar um destino
- Se encontrar pacotes da agência → apresente-os como "Temos pacotes exclusivos para este destino!"
- NUNCA mencione links externos de companhias aéreas (LATAM, Gol, Azul), Google Flights, Booking.com, Expedia ou qualquer concorrente
- NUNCA diga ao usuário para "comprar diretamente no site da companhia aérea" ou "reservar no site do hotel"
- SEMPRE direcione compras para os NOSSOS botões que aparecem nos cards abaixo das mensagens:
  • Voos/pacotes: botão "Comprar" → site Mesquita Turismo
  • Hotéis: botão "Reservar" → site Mesquita Turismo (comprarviagem.com.br/mesquitaturismo)
  • Atividades: botão "Ver passeio" → Civitatis parceiro da agência
- NUNCA inclua links "Reservar agora" ou qualquer URL nas suas respostas de texto — apenas os botões dos cards já têm os links corretos
- SEMPRE ofereça atendimento humano: "Prefere falar com um consultor? WhatsApp ${agency.phone}"

═══ PROATIVIDADE — QUANDO NÃO HÁ PACOTES ═══
Se search_agency_packages retornar 0 resultados:
  1. Informe ao cliente: "Não encontrei pacotes exclusivos para [destino] no momento. Mas você pode pesquisar pacotes também em 👉 www.aviagemteencontra.com.br"
  2. IMEDIATAMENTE em seguida, sem esperar resposta, chame search_flights E search_hotels se já tiver origem, destino e datas
  3. Se faltar origem, destino ou datas → pergunte UMA VEZ de forma direta: "Para buscar voos e hotéis preciso saber: de onde você parte? Quais datas?"
  4. NUNCA fique esperando sem fazer nada — sempre ofereça a próxima ação

═══ LINKS PERMITIDOS ═══
- Site da agência: https://www.mesquitaturismo.com.br
- Voos e pacotes: https://www.comprarviagem.com.br/mesquitaturismo
- Hotéis: https://www.comprarviagem.com.br/mesquitaturismo
- Atividades: https://www.civitatis.com/br/?ag_aid=63335
- WhatsApp: https://wa.me/${agency.whatsapp}
NÃO use nenhum outro link de compra que não seja os acima.
NUNCA insira links "Reservar agora" ou qualquer link nas suas mensagens de texto — os botões dos cards já fazem isso automaticamente.

═══ FLUXO DE CONVERSA ═══
1. Entender destino, datas, pessoas e orçamento
2. Buscar pacotes da agência PRIMEIRO, depois voos + hotéis + atividades
3. Apresentar resultados com análise comparativa breve
4. SEMPRE perguntar após apresentar resultados:
   "Gostou de alguma opção? Posso salvar para você! 😊
    Clique em **Salvar** nos cards ou me diga qual opção prefere.
    Para reservar preciso de: nome completo, data de nascimento, CPF e e-mail.
    Ou prefere falar com um consultor? WhatsApp ${agency.phone}"
5. Se o usuário fornecer dados pessoais → confirmar: "Perfeito! Em breve nosso consultor da ${agency.name} entrará em contato. ✅"
6. Se pedir atendimento humano → enviar: https://wa.me/${agency.whatsapp}

═══ ORÇAMENTO ═══
- Quando o usuário pedir para "salvar", "gerar orçamento" ou "montar pacote":
  → Use a ferramenta save_travel_package para salvar
  → Informe que o orçamento completo em PDF fica disponível em "Minhas Viagens"

═══ FORMATAÇÃO ═══
- Markdown: **negrito** para destaques, ## para seções
- Emojis: ✈️ voos · 🏨 hotéis · 🗺️ atividades · 💰 preços · ☀️ clima
- Seja conciso após apresentar cards — os cards já mostram os detalhes

Idioma: responda sempre em português do Brasil.

IMPORTANTE: Use ferramentas de busca sempre que precisar de dados reais. Nunca invente preços ou disponibilidade.`
}

export const TRAVEL_SYSTEM_PROMPT = getTravelSystemPrompt()

export const TRAVEL_TOOLS: Anthropic.Tool[] = [
  // ─── SEMPRE PRIMEIRO: pacotes da agência ───────────────────────────────────
  {
    name: 'search_agency_packages',
    description: 'Busca pacotes EXCLUSIVOS da Mesquita Turismo no banco de dados da agência. OBRIGATÓRIO: use SEMPRE como PRIMEIRA ferramenta quando o usuário mencionar qualquer destino, viagem ou tipo de turismo. Só use search_flights/search_hotels se não houver pacotes ou o cliente quiser algo específico diferente.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string', description: 'Destino mencionado pelo usuário. Ex: Trancoso, Lisboa, Fortaleza, Nordeste' },
        origin: { type: 'string', description: 'Cidade/aeroporto de origem. Ex: São Paulo, GRU, CGH, BSB' },
        tipo: { type: 'string', enum: ['praia', 'montanha', 'natureza', 'cidade'], description: 'Tipo de viagem inferido' },
        month: { type: 'string', description: 'Mês de ida (MM). Ex: "07" para julho, "12" para dezembro' },
        max_price: { type: 'number', description: 'Orçamento máximo em BRL' },
        all_inclusive: { type: 'boolean' },
        luxo: { type: 'boolean' },
      },
      required: [],
    },
  },
  {
    name: 'extract_travel_intent',
    description: 'Extrai intenção de viagem da conversa. Use sempre que identificar um destino.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string', description: 'Cidade ou país. Ex: Lisboa, Tokyo' },
        destination_code: { type: 'string', description: 'IATA. Ex: LIS, NRT' },
        origin: { type: 'string', description: 'Origem. Ex: São Paulo, GRU' },
        check_in: { type: 'string', description: 'Data ida YYYY-MM-DD — DEVE ser futura!' },
        check_out: { type: 'string', description: 'Data volta YYYY-MM-DD — DEVE ser futura!' },
        adults: { type: 'number' }, children: { type: 'number' },
        budget: { type: 'number', description: 'Orçamento em BRL' },
        trip_type: { type: 'string', enum: ['leisure', 'business', 'adventure', 'romantic', 'family'] },
        duration_days: { type: 'number' },
      },
      required: [],
    },
  },
  {
    name: 'search_flights',
    description: 'Busca voos reais via SerpApi. outbound_date e return_date DEVEM ser datas FUTURAS YYYY-MM-DD.',
    input_schema: {
      type: 'object' as const,
      properties: {
        origin: { type: 'string', description: 'Código IATA do aeroporto de origem. Use SEMPRE o código IATA exato informado pelo usuário. Exemplos: GRU, CGH, BSB, FOR, SSA. IMPORTANTE: SAO = todos os aeroportos de São Paulo (GRU+CGH+VCP). RIO = todos os aeroportos do Rio de Janeiro (GIG+SDU). Preserve SAO e RIO como estão — NÃO converta para outro código.' },
        destination: { type: 'string', description: 'Código IATA do aeroporto de destino. Use SEMPRE o código IATA exato informado pelo usuário. Exemplos: LIS, JFK, NRT, GIG, GRU. IMPORTANTE: SAO = todos os aeroportos de São Paulo. RIO = todos os aeroportos do Rio de Janeiro. Preserve SAO e RIO como estão — NÃO converta para outro código.' },
        outbound_date: { type: 'string', description: 'Data ida YYYY-MM-DD. DEVE ser futura!' },
        return_date: { type: 'string', description: 'Data volta YYYY-MM-DD. Opcional.' },
        adults: { type: 'number', description: 'Número de adultos (padrão: 1)' },
        children: { type: 'number', description: 'Número de crianças (0–11 anos). Extraia do texto do usuário.' },
        currency: { type: 'string', description: 'BRL, USD, EUR (padrão: BRL)' },
      },
      required: ['origin', 'destination', 'outbound_date'],
    },
  },
  {
    name: 'search_hotels',
    description: 'Busca hotéis via SerpApi. Datas DEVEM ser futuras.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string', description: 'Cidade. Ex: Lisboa, Paris' },
        check_in: { type: 'string', description: 'YYYY-MM-DD futuro' },
        check_out: { type: 'string', description: 'YYYY-MM-DD futuro' },
        adults: { type: 'number' },
        currency: { type: 'string' },
      },
      required: ['destination', 'check_in', 'check_out'],
    },
  },
  {
    name: 'search_activities',
    description: 'Busca atividades, ingressos, passeios e tours no destino.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string' },
        category: { type: 'string', enum: ['attractions', 'restaurants', 'tours', 'nightlife', 'shopping', 'nature'] },
      },
      required: ['destination'],
    },
  },
  {
    name: 'get_weather',
    description: 'Clima atual e previsão do destino.',
    input_schema: {
      type: 'object' as const,
      properties: {
        destination: { type: 'string' },
        country_code: { type: 'string' },
      },
      required: ['destination'],
    },
  },
  {
    name: 'save_travel_package',
    description: 'Salva pacote de viagem no banco. Use quando o usuário confirmar interesse ou pedir para salvar.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Ex: Lisboa 7 dias - Julho 2025' },
        destination: { type: 'string' },
        destination_country: { type: 'string' },
        check_in: { type: 'string', description: 'YYYY-MM-DD' },
        check_out: { type: 'string', description: 'YYYY-MM-DD' },
        adults: { type: 'number' },
        children: { type: 'number' },
        total_price: { type: 'number' },
        currency: { type: 'string' },
        notes: { type: 'string', description: 'Resumo ou dados do passageiro se fornecidos' },
      },
      required: ['title', 'destination', 'check_in', 'check_out'],
    },
  },
  {
    name: 'collect_passenger_data',
    description: 'Use quando o usuário fornecer dados para reserva (nome, CPF, data nascimento, email).',
    input_schema: {
      type: 'object' as const,
      properties: {
        full_name: { type: 'string', description: 'Nome completo do passageiro' },
        birth_date: { type: 'string', description: 'Data nascimento DD/MM/YYYY' },
        cpf: { type: 'string', description: 'CPF do passageiro' },
        email: { type: 'string', description: 'E-mail do passageiro' },
        phone: { type: 'string', description: 'Telefone/WhatsApp do passageiro' },
      },
      required: ['full_name'],
    },
  },
]

export interface ClaudeMessage { role: 'user' | 'assistant'; content: string }
