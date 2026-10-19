// Interfaz de utm-builder. La lógica está en utm.js; el código QR, en vendor/qrcode.js (MIT, Kazuhiko Arase).
import qrcode from '../vendor/qrcode.js';
import { CAMPOS, PLANTILLAS, aCSV, construir, lote, normalizar, validar } from './utm.js';

const $ = id => document.getElementById(id);
const CLAVE_HISTORIAL = 'utm-builder:historial';
const CLAVE_FORMULARIO = 'utm-builder:formulario';
let enlaceActual = '';
let loteActual = [];

// Almacenamiento local con red de seguridad (navegación privada, almacenamiento bloqueado…).
const leer = (clave, defecto) => { try { return JSON.parse(localStorage.getItem(clave)) ?? defecto; } catch { return defecto; } };
const escribir = (clave, valor) => { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch { /* sin almacenamiento */ } };

const opciones = () => ({ minusculas: $('op-minusculas').checked, sinTildes: $('op-tildes').checked, separador: $('op-separador').value });
const valores = () => Object.fromEntries(CAMPOS.map(c => [c, $(c).value]));

function descargar(nombre, contenido, tipo) {
  const url = URL.createObjectURL(contenido instanceof Blob ? contenido : new Blob([contenido], { type: tipo }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pintarQR(texto) {
  const qr = qrcode(0, 'M');
  qr.addData(texto);
  qr.make();
  $('qr-imagen').innerHTML = qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: 'Código QR del enlace' });
  $('qr').hidden = false;
}

function actualizar() {
  const utm = valores();
  const { errores, avisos } = validar($('base').value, utm);
  const lista = $('mensajes');
  lista.replaceChildren(...errores.map(t => Object.assign(document.createElement('li'), { className: 'error', textContent: t })),
    ...avisos.map(t => Object.assign(document.createElement('li'), { className: 'aviso', textContent: t })));
  const base = $('base').value.trim();
  const listo = errores.length === 0;
  enlaceActual = listo ? construir(base, utm) : '';
  $('enlace').textContent = enlaceActual || 'Rellena la dirección, la fuente, el medio y la campaña.';
  $('copiar').disabled = $('guardar').disabled = !listo;
  if (listo) pintarQR(enlaceActual); else $('qr').hidden = true;
  escribir(CLAVE_FORMULARIO, { base, ...utm, opciones: opciones() });
}

function normalizarCampo(e) {
  const campo = e.target;
  const pos = campo.selectionStart;
  const antes = campo.value;
  // Al escribir solo se aplican minúsculas y tildes; los espacios se convierten al salir del campo (para poder escribir con naturalidad).
  const v = e.type === 'blur' ? normalizar(antes, opciones()) : normalizar(antes, { ...opciones(), separador: '' });
  if (v !== antes) { campo.value = v; if (e.type !== 'blur') campo.setSelectionRange(pos, pos); }
  actualizar();
}

function pintarHistorial() {
  const items = leer(CLAVE_HISTORIAL, []);
  $('historial').replaceChildren(...items.map(it => {
    const li = document.createElement('li');
    li.append(Object.assign(document.createElement('span'), { className: 'fecha', textContent: new Date(it.fecha).toLocaleString('es-ES') }),
      Object.assign(document.createElement('a'), { href: it.enlace, textContent: it.enlace, rel: 'noopener', target: '_blank' }));
    return li;
  }));
  if (!items.length) $('historial').replaceChildren(Object.assign(document.createElement('li'), { textContent: 'Todavía no has guardado ningún enlace.' }));
}

function iniciar() {
  for (const p of PLANTILLAS) {
    const b = Object.assign(document.createElement('button'), { type: 'button', className: 'secundario', textContent: p.nombre });
    b.addEventListener('click', () => { $('utm_source').value = p.utm_source; $('utm_medium').value = p.utm_medium; actualizar(); $('utm_campaign').focus(); });
    $('plantillas').append(b);
  }
  const guardado = leer(CLAVE_FORMULARIO, null);
  if (guardado) {
    $('base').value = guardado.base || '';
    for (const c of CAMPOS) $(c).value = guardado[c] || '';
    if (guardado.opciones) {
      $('op-minusculas').checked = guardado.opciones.minusculas;
      $('op-tildes').checked = guardado.opciones.sinTildes;
      $('op-separador').value = guardado.opciones.separador;
    }
  }
  $('base').addEventListener('input', actualizar);
  for (const c of CAMPOS) { $(c).addEventListener('input', normalizarCampo); $(c).addEventListener('blur', normalizarCampo); }
  for (const id of ['op-minusculas', 'op-tildes', 'op-separador']) $(id).addEventListener('change', actualizar);

  $('copiar').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(enlaceActual); $('copiar').textContent = 'Copiado ✓'; }
    catch { $('copiar').textContent = 'Selecciónalo y cópialo'; }
    setTimeout(() => { $('copiar').textContent = 'Copiar enlace'; }, 1800);
  });
  $('guardar').addEventListener('click', () => {
    const items = leer(CLAVE_HISTORIAL, []);
    items.unshift({ fecha: new Date().toISOString(), enlace: enlaceActual, base: $('base').value.trim(), ...valores() });
    escribir(CLAVE_HISTORIAL, items.slice(0, 100));
    pintarHistorial();
  });
  $('qr-svg').addEventListener('click', () => descargar('qr-utm.svg', $('qr-imagen').innerHTML, 'image/svg+xml'));
  $('qr-png').addEventListener('click', () => {
    const img = new Image();
    img.onload = () => {
      const c = Object.assign(document.createElement('canvas'), { width: 1024, height: 1024 });
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 1024, 1024); ctx.drawImage(img, 0, 0, 1024, 1024);
      c.toBlob(b => descargar('qr-utm.png', b), 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent($('qr-imagen').innerHTML);
  });

  $('lote-crear').addEventListener('click', () => {
    loteActual = lote($('lote').value, valores());
    $('lote-resultado').replaceChildren(...loteActual.map(r => Object.assign(document.createElement('li'),
      r.error ? { className: 'error', textContent: `${r.base}: ${r.error}` } : { textContent: r.enlace })));
    $('lote-csv').disabled = !loteActual.some(r => r.enlace);
  });
  $('lote-csv').addEventListener('click', () => {
    const fecha = new Date().toISOString();
    descargar('enlaces-utm.csv', aCSV(loteActual.filter(r => r.enlace).map(r => ({ fecha, enlace: r.enlace, base: r.base, ...valores() }))), 'text/csv;charset=utf-8');
  });
  $('hist-csv').addEventListener('click', () => descargar('historial-utm.csv', aCSV(leer(CLAVE_HISTORIAL, [])), 'text/csv;charset=utf-8'));
  $('hist-borrar').addEventListener('click', () => {
    if (confirm('¿Borrar todo el historial de este navegador?')) { escribir(CLAVE_HISTORIAL, []); pintarHistorial(); }
  });
  pintarHistorial();
  actualizar();
}

iniciar();
