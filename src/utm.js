// Lógica de utm-builder, sin DOM (se prueba con node --test).

export const CAMPOS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'];
export const OBLIGATORIOS = ['utm_source', 'utm_medium', 'utm_campaign'];

// Plantillas habituales: rellenan fuente y medio con los valores que entienden Google Analytics 4 y la mayoría de herramientas.
export const PLANTILLAS = [
  { id: 'google-ads', nombre: 'Google Ads', utm_source: 'google', utm_medium: 'cpc' },
  { id: 'meta-ads', nombre: 'Meta Ads', utm_source: 'facebook', utm_medium: 'paid_social' },
  { id: 'instagram', nombre: 'Instagram (orgánico)', utm_source: 'instagram', utm_medium: 'social' },
  { id: 'linkedin', nombre: 'LinkedIn', utm_source: 'linkedin', utm_medium: 'social' },
  { id: 'tiktok', nombre: 'TikTok', utm_source: 'tiktok', utm_medium: 'social' },
  { id: 'newsletter', nombre: 'Newsletter', utm_source: 'newsletter', utm_medium: 'email' },
  { id: 'whatsapp', nombre: 'WhatsApp', utm_source: 'whatsapp', utm_medium: 'messaging' },
  { id: 'qr', nombre: 'Cartel o folleto (QR)', utm_source: 'qr', utm_medium: 'offline' },
];

/**
 * Normaliza un valor UTM para que las campañas no se partan en informes distintos
 * («Verano 2026», «verano-2026» y «verano_2026 » acaban siendo lo mismo).
 */
export function normalizar(valor, { minusculas = true, sinTildes = true, separador = '-' } = {}) {
  let v = String(valor ?? '').trim();
  if (sinTildes) v = v.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ñ/gi, m => (m === 'ñ' ? 'n' : 'N'));
  if (minusculas) v = v.toLowerCase();
  if (separador) v = v.replace(/\s+/g, separador).replace(new RegExp(`\\${separador}{2,}`, 'g'), separador);
  // Sin separador se conservan los espacios (la interfaz los convierte al salir del campo).
  return v.replace(separador ? /[^\p{L}\p{N}._~\-]/gu : /[^\p{L}\p{N}._~\- ]/gu, '');
}

/** Comprueba la URL base y los campos. Devuelve { errores: [], avisos: [] }. */
export function validar(base, utm) {
  const errores = [], avisos = [];
  let url;
  try {
    url = new URL(String(base || '').trim());
    if (!/^https?:$/.test(url.protocol)) errores.push('La dirección tiene que empezar por http:// o https://');
  } catch {
    errores.push('Escribe una dirección completa, por ejemplo https://tu-web.com/oferta/');
  }
  for (const c of OBLIGATORIOS) if (!String(utm[c] || '').trim()) errores.push(`Falta ${c} (es obligatorio).`);
  if (url) {
    const existentes = [...url.searchParams.keys()].filter(k => k.toLowerCase().startsWith('utm_'));
    if (existentes.length) avisos.push(`La dirección ya lleva ${existentes.join(', ')}: se sustituirán.`);
    if (url.protocol === 'http:') avisos.push('La dirección usa http://; si tu web tiene https, usa https.');
  }
  for (const c of CAMPOS) {
    const v = String(utm[c] || '');
    if (/[A-Z]/.test(v)) avisos.push(`${c} tiene mayúsculas: GA4 distingue «Google» de «google».`);
    if (/\s/.test(v.trim())) avisos.push(`${c} tiene espacios: se verán como %20 en los informes.`);
  }
  return { errores, avisos };
}

/** Construye el enlace final. Respeta los parámetros que ya tenía la URL (salvo utm_*) y el ancla (#). */
export function construir(base, utm) {
  const url = new URL(String(base).trim());
  for (const k of [...url.searchParams.keys()]) if (k.toLowerCase().startsWith('utm_')) url.searchParams.delete(k);
  for (const c of CAMPOS) {
    const v = String(utm[c] || '').trim();
    if (v) url.searchParams.set(c, v);
  }
  return url.toString();
}

/** Varias URLs (una por línea) con los mismos UTM. Ignora líneas vacías y devuelve también las que fallan. */
export function lote(texto, utm) {
  return String(texto || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).map(base => {
    const { errores } = validar(base, utm);
    return errores.length ? { base, error: errores[0] } : { base, enlace: construir(base, utm) };
  });
}

const celda = v => {
  const s = String(v ?? '');
  return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV (separado por comas, con cabecera) para Excel, Google Sheets o tu hoja de campañas. */
export function aCSV(filas) {
  const cab = ['fecha', 'enlace', 'base', ...CAMPOS];
  return [cab.join(','), ...filas.map(f => cab.map(c => celda(f[c])).join(','))].join('\n') + '\n';
}
