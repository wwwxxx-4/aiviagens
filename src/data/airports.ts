export interface Airport {
  iata: string
  name: string
  city: string
  state?: string
  country: string
  flag: string
}

export const AIRPORTS: Airport[] = [
  // ── Brasil ──────────────────────────────────────────────────
  { iata: 'GRU', name: 'Guarulhos Internacional', city: 'São Paulo', state: 'SP', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CGH', name: 'Congonhas', city: 'São Paulo', state: 'SP', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'VCP', name: 'Viracopos Internacional', city: 'Campinas', state: 'SP', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'GIG', name: 'Tom Jobim / Galeão', city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'SDU', name: 'Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'FOR', name: 'Pinto Martins Internacional', city: 'Fortaleza', state: 'CE', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'SSA', name: 'Luís Eduardo Magalhães', city: 'Salvador', state: 'BA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'REC', name: 'Guararapes Internacional', city: 'Recife', state: 'PE', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'BEL', name: 'Val de Cans Internacional', city: 'Belém', state: 'PA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'MAO', name: 'Eduardo Gomes Internacional', city: 'Manaus', state: 'AM', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'BSB', name: 'Presidente Juscelino Kubitschek', city: 'Brasília', state: 'DF', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CNF', name: 'Tancredo Neves Internacional', city: 'Belo Horizonte', state: 'MG', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'PLU', name: 'Pampulha Carlos Drummond', city: 'Belo Horizonte', state: 'MG', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'POA', name: 'Salgado Filho Internacional', city: 'Porto Alegre', state: 'RS', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CWB', name: 'Afonso Pena Internacional', city: 'Curitiba', state: 'PR', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'FLN', name: 'Hercílio Luz Internacional', city: 'Florianópolis', state: 'SC', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'NAT', name: 'Governador Aluízio Alves', city: 'Natal', state: 'RN', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'MCZ', name: 'Zumbi dos Palmares', city: 'Maceió', state: 'AL', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'AJU', name: 'Santa Maria', city: 'Aracaju', state: 'SE', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'THE', name: 'Senador Petrônio Portella', city: 'Teresina', state: 'PI', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'SLZ', name: 'Marechal Cunha Machado', city: 'São Luís', state: 'MA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CGB', name: 'Marechal Rondon Internacional', city: 'Cuiabá', state: 'MT', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CGR', name: 'Internacional de Campo Grande', city: 'Campo Grande', state: 'MS', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'GYN', name: 'Santa Genoveva', city: 'Goiânia', state: 'GO', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'PMW', name: 'Brigadeiro Lysias Rodrigues', city: 'Palmas', state: 'TO', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'VDC', name: 'Vitória da Conquista', city: 'Vitória da Conquista', state: 'BA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'IOS', name: 'Jorge Amado', city: 'Ilhéus', state: 'BA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'BPS', name: 'Porto Seguro', city: 'Porto Seguro', state: 'BA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'VIX', name: 'Eurico de Aguiar Salles', city: 'Vitória', state: 'ES', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'PMG', name: 'Internacional de Ponta Porã', city: 'Ponta Porã', state: 'MS', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'MCP', name: 'Internacional de Macapá', city: 'Macapá', state: 'AP', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'BVB', name: 'Atlas Brasil Cantanhede', city: 'Boa Vista', state: 'RR', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'PVH', name: 'Governador Jorge Teixeira', city: 'Porto Velho', state: 'RO', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'RBR', name: 'Internacional de Rio Branco', city: 'Rio Branco', state: 'AC', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'JPB', name: 'Presidente Castro Pinto', city: 'João Pessoa', state: 'PB', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'CXJ', name: 'Hugo Cantergiani Regional', city: 'Caxias do Sul', state: 'RS', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'LEC', name: 'Horácio de Matos', city: 'Lençóis / Chapada Diamantina', state: 'BA', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'FEN', name: 'Fernando de Noronha', city: 'Fernando de Noronha', state: 'PE', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'XAP', name: 'Chapecó', city: 'Chapecó', state: 'SC', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'NVT', name: 'Ministro Victor Konder', city: 'Navegantes', state: 'SC', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'JPA', name: 'Presidente Castro Pinto', city: 'João Pessoa', state: 'PB', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'MNX', name: 'Manicoré', city: 'Manicoré', state: 'AM', country: 'Brasil', flag: '🇧🇷' },

  // ── América do Sul ───────────────────────────────────────────
  { iata: 'EZE', name: 'Ministro Pistarini Internacional', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { iata: 'AEP', name: 'Jorge Newbery', city: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { iata: 'SCL', name: 'Arturo Merino Benítez', city: 'Santiago', country: 'Chile', flag: '🇨🇱' },
  { iata: 'GRU', name: 'Guarulhos Internacional', city: 'São Paulo', country: 'Brasil', flag: '🇧🇷' },
  { iata: 'BOG', name: 'El Dorado Internacional', city: 'Bogotá', country: 'Colômbia', flag: '🇨🇴' },
  { iata: 'LIM', name: 'Jorge Chávez Internacional', city: 'Lima', country: 'Peru', flag: '🇵🇪' },
  { iata: 'MVD', name: 'Carrasco Internacional', city: 'Montevidéu', country: 'Uruguai', flag: '🇺🇾' },
  { iata: 'ASU', name: 'Silvio Pettirossi Internacional', city: 'Assunção', country: 'Paraguai', flag: '🇵🇾' },
  { iata: 'VVI', name: 'Viru Viru Internacional', city: 'Santa Cruz', country: 'Bolívia', flag: '🇧🇴' },
  { iata: 'GYE', name: 'José Joaquín de Olmedo', city: 'Guayaquil', country: 'Equador', flag: '🇪🇨' },
  { iata: 'CCS', name: 'Simón Bolívar Internacional', city: 'Caracas', country: 'Venezuela', flag: '🇻🇪' },

  // ── América do Norte ─────────────────────────────────────────
  { iata: 'MIA', name: 'Miami Internacional', city: 'Miami', country: 'EUA', flag: '🇺🇸' },
  { iata: 'JFK', name: 'John F. Kennedy Internacional', city: 'Nova York', country: 'EUA', flag: '🇺🇸' },
  { iata: 'EWR', name: 'Newark Liberty Internacional', city: 'Nova York', country: 'EUA', flag: '🇺🇸' },
  { iata: 'LAX', name: 'Los Angeles Internacional', city: 'Los Angeles', country: 'EUA', flag: '🇺🇸' },
  { iata: 'ORD', name: "O'Hare Internacional", city: 'Chicago', country: 'EUA', flag: '🇺🇸' },
  { iata: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta', country: 'EUA', flag: '🇺🇸' },
  { iata: 'MCO', name: 'Orlando Internacional', city: 'Orlando', country: 'EUA', flag: '🇺🇸' },
  { iata: 'LAS', name: 'Harry Reid Internacional', city: 'Las Vegas', country: 'EUA', flag: '🇺🇸' },
  { iata: 'SFO', name: 'San Francisco Internacional', city: 'San Francisco', country: 'EUA', flag: '🇺🇸' },
  { iata: 'BOS', name: 'Logan Internacional', city: 'Boston', country: 'EUA', flag: '🇺🇸' },
  { iata: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', country: 'EUA', flag: '🇺🇸' },
  { iata: 'DFW', name: 'Dallas/Fort Worth Internacional', city: 'Dallas', country: 'EUA', flag: '🇺🇸' },
  { iata: 'YYZ', name: 'Pearson Internacional', city: 'Toronto', country: 'Canadá', flag: '🇨🇦' },
  { iata: 'YUL', name: 'Pierre Elliott Trudeau', city: 'Montreal', country: 'Canadá', flag: '🇨🇦' },
  { iata: 'MEX', name: 'Benito Juárez Internacional', city: 'Cidade do México', country: 'México', flag: '🇲🇽' },
  { iata: 'CUN', name: 'Cancún Internacional', city: 'Cancún', country: 'México', flag: '🇲🇽' },

  // ── Europa ───────────────────────────────────────────────────
  { iata: 'LIS', name: 'Humberto Delgado Internacional', city: 'Lisboa', country: 'Portugal', flag: '🇵🇹' },
  { iata: 'OPO', name: 'Francisco de Sá Carneiro', city: 'Porto', country: 'Portugal', flag: '🇵🇹' },
  { iata: 'MAD', name: 'Adolfo Suárez Barajas', city: 'Madrid', country: 'Espanha', flag: '🇪🇸' },
  { iata: 'BCN', name: 'El Prat', city: 'Barcelona', country: 'Espanha', flag: '🇪🇸' },
  { iata: 'CDG', name: 'Charles de Gaulle', city: 'Paris', country: 'França', flag: '🇫🇷' },
  { iata: 'ORY', name: 'Orly', city: 'Paris', country: 'França', flag: '🇫🇷' },
  { iata: 'LHR', name: 'Heathrow', city: 'Londres', country: 'Reino Unido', flag: '🇬🇧' },
  { iata: 'LGW', name: 'Gatwick', city: 'Londres', country: 'Reino Unido', flag: '🇬🇧' },
  { iata: 'FRA', name: 'Frankfurt am Main', city: 'Frankfurt', country: 'Alemanha', flag: '🇩🇪' },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Países Baixos', flag: '🇳🇱' },
  { iata: 'FCO', name: 'Leonardo da Vinci / Fiumicino', city: 'Roma', country: 'Itália', flag: '🇮🇹' },
  { iata: 'MXP', name: 'Malpensa Internacional', city: 'Milão', country: 'Itália', flag: '🇮🇹' },
  { iata: 'ZRH', name: 'Zurique', city: 'Zurique', country: 'Suíça', flag: '🇨🇭' },
  { iata: 'VIE', name: 'Schwechat Internacional', city: 'Viena', country: 'Áustria', flag: '🇦🇹' },
  { iata: 'CPH', name: 'Kastrup', city: 'Copenhague', country: 'Dinamarca', flag: '🇩🇰' },
  { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Estocolmo', country: 'Suécia', flag: '🇸🇪' },

  // ── Outros destinos populares ────────────────────────────────
  { iata: 'DXB', name: 'Dubai Internacional', city: 'Dubai', country: 'Emirados Árabes', flag: '🇦🇪' },
  { iata: 'NRT', name: 'Narita Internacional', city: 'Tokyo', country: 'Japão', flag: '🇯🇵' },
  { iata: 'HND', name: 'Haneda', city: 'Tokyo', country: 'Japão', flag: '🇯🇵' },
  { iata: 'GRU', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'Tailândia', flag: '🇹🇭' },
  { iata: 'BKK', name: 'Bangkok Suvarnabhumi', city: 'Bangkok', country: 'Tailândia', flag: '🇹🇭' },
  { iata: 'SYD', name: 'Kingsford Smith Internacional', city: 'Sydney', country: 'Austrália', flag: '🇦🇺' },
  { iata: 'JNB', name: 'O.R. Tambo Internacional', city: 'Joanesburgo', country: 'África do Sul', flag: '🇿🇦' },
  { iata: 'PUJ', name: 'Punta Cana Internacional', city: 'Punta Cana', country: 'Rep. Dominicana', flag: '🇩🇴' },
  { iata: 'HAV', name: 'José Martí Internacional', city: 'Havana', country: 'Cuba', flag: '🇨🇺' },
]

// Remove duplicates by IATA
const seen = new Set<string>()
export const AIRPORTS_UNIQUE = AIRPORTS.filter(a => {
  if (seen.has(a.iata + a.city)) return false
  seen.add(a.iata + a.city)
  return true
})

export function searchAirports(query: string, limit = 6): Airport[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return AIRPORTS_UNIQUE.filter(a => {
    const city = a.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const name = a.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    const iata = a.iata.toLowerCase()
    return city.includes(q) || name.includes(q) || iata.includes(q) || a.country.toLowerCase().includes(q)
  }).slice(0, limit)
}
