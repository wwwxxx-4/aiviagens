/**
 * safeHtml — wrapper para `dangerouslySetInnerHTML`.
 *
 * Sanitiza HTML proveniente de fontes não-confiáveis (saída de LLM,
 * descrições de fornecedores, mensagens de erro de APIs externas) antes
 * de injetar no DOM, mitigando XSS.
 *
 * Uso:
 *   import { safeHtml } from '@/lib/safeHtml'
 *   <div dangerouslySetInnerHTML={safeHtml(rawHtml)} />
 *
 * Implementação usa `isomorphic-dompurify` para funcionar tanto em
 * componentes client ('use client') quanto em renderização no servidor.
 */
import DOMPurify from 'isomorphic-dompurify'

// Tags/atributos permitidos para o renderer de markdown do chat.
// Mantém formatação leve (negrito, itálico, listas, headings, links)
// e bloqueia <script>, <iframe>, on*-handlers, javascript: URLs, etc.
const ALLOWED_TAGS = [
  'a', 'b', 'br', 'em', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'i', 'li', 'ol', 'p', 'strong', 'u', 'ul', 'span', 'div',
  'code', 'pre', 'blockquote', 'hr', 'small',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'class']

export function safeHtml(html: string | null | undefined): { __html: string } {
  if (!html) return { __html: '' }
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Força rel="noopener noreferrer" e target="_blank" não vazar referrer
    ADD_ATTR: ['target', 'rel'],
    // Bloqueia URLs javascript:, data: (exceto imagens), vbscript:
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  })
  return { __html: clean }
}
