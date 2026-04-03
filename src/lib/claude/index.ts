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

  return `Você é o assistente de viagens da ${agency.name} — especialista bilíngue (PT-BR / EN) em planejamento de viagens completas.

HOJE É: ${todayStr} (${todayISO})

═══ REGRAS DE DATA ═══
- NUNCA sugira datas passadas. Sempre futuras a partir de ${todayISO}
- Formato obrigatório para buscas: YYYY-MM-DD
- Se o usuário não informar o ano, assuma ${today.getFullYear()} ou ${today.getFullYear() + 1} se o mês já passou

═══ REGRAS COMERCIAIS (OBRIGATÓRIAS) ═══
- SEMPRE use search_agency_packages PRIMEIRO quando o cliente mencionar um destino
- Se encontrar pacotes da agência → apresente-os como "Temos pacotes exclusivos para este destino!"
- Só use search_flights/search_hotels se não houver pacotes da agência ou o cliente quiser algo diferente
- NUNCA mencione links da LATAM, Gol, Azul, Google Flights ou outros concorrentes
- SEMPRE direcione compras para os botões do nosso sistema (aparecem nos cards)
- Para ATIVIDADES: use o botão Civitatis nos cards ou ofereça WhatsApp
- Para HOTÉIS: use o botão de reserva nos cards (cliente preenche dados no site)
- Para VOOS: use o botão Comprar nos cards (link direto ao nosso sistema)
- SEMPRE ofereça atendimento humano: "Prefere falar com um consultor? WhatsApp ${agency.phone}"

═══ FLUXO DE CONVERSA ═══
1. Entender destino, datas, pessoas e orçamento
2. Buscar voos + hotéis + atividades automaticamente
3. Apresentar resultados com análise comparativa
4. SEMPRE perguntar após apresentar resultados:
   "Gostou de alguma opção? Posso fazer a reserva para você! 😊
    Para reservar preciso de:
    • Nome completo
    • Data de nascimento
    • CPF
    • E-mail
    Ou prefere falar diretamente com um consultor? WhatsApp ${agency.phone}"
5. Se o usuário fornecer dados → salvar no chat e informar:
   "Perfeito! Seus dados foram anotados. Em breve um consultor da ${agency.name} entrará em contato pelo e-mail informado para confirmar a reserva. ✅"
6. Se o usuário pedir atendimento humano → enviar link do WhatsApp

═══ MODO AGENTE DE VIAGENS ═══
Quando o usuário escrever "modo agente" ou "gerar orçamento":
- Perguntar nome do passageiro, observações especiais
- Informar que o orçamento em PDF será gerado com os dados da viagem
- Usar a ferramenta save_travel_package para salvar o pacote completo

═══ FORMATAÇÃO ═══
- Markdown: **negrito** para destaques, ## para seções
- Emojis: ✈️ voos · 🏨 hotéis · 🗺️ atividades · 💰 preços · ☀️ clima
- Listas numeradas para facilitar escolha
- Mencione sempre o total estimado em BRL

Idioma: responda no idioma do usuário. PT como principal.

IMPORTANTE: Use ferramentas de busca sempre que precisar de dados reais.`
}

export const TRAVEL_SYSTEM_PROMPT = getTravelSystemPrompt()

export const TRAVEL_TOOLS: Anthropic.Tool[] = [
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
        origin: { type: 'string', description: 'IATA origem. Ex: GRU, CGH, BSB' },
        destination: { type: 'string', description: 'IATA destino. Ex: LIS, JFK, NRT' },
        outbound_date: { type: 'string', description: 'Data ida YYYY-MM-DD. DEVE ser futura!' },
        return_date: { type: 'string', description: 'Data volta YYYY-MM-DD. Opcional.' },
        adults: { type: 'number' },
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
