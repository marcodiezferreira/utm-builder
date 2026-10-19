// node --test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aCSV, construir, lote, normalizar, validar } from '../src/utm.js';

test('normaliza como un informe agradece', () => {
  assert.equal(normalizar('  Campaña Verano  2026 '), 'campana-verano-2026');
  assert.equal(normalizar('Black Friday', { separador: '_' }), 'black_friday');
  assert.equal(normalizar('Mayúsculas', { minusculas: false, sinTildes: false }), 'Mayúsculas');
  assert.equal(normalizar('oferta?%&raro'), 'ofertararo');
  assert.equal(normalizar('Rebajas Otoño', { separador: '' }), 'rebajas otono');
});

test('construye respetando parámetros y ancla', () => {
  const enlace = construir('https://tienda.com/zapatillas/?talla=42#reseñas', { utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'otono' });
  assert.equal(enlace, 'https://tienda.com/zapatillas/?talla=42&utm_source=google&utm_medium=cpc&utm_campaign=otono#rese%C3%B1as');
});

test('sustituye utm antiguos', () => {
  const enlace = construir('https://web.com/?utm_source=viejo&utm_medium=x', { utm_source: 'nuevo', utm_medium: 'email', utm_campaign: 'c' });
  assert.equal(new URL(enlace).searchParams.get('utm_source'), 'nuevo');
  assert.equal(new URL(enlace).searchParams.getAll('utm_source').length, 1);
});

test('valida obligatorios, URL y avisa de mayúsculas', () => {
  const r = validar('tu-web.com', { utm_source: 'Google', utm_medium: '', utm_campaign: 'x' });
  assert.ok(r.errores.some(e => e.includes('dirección completa')));
  assert.ok(r.errores.some(e => e.includes('utm_medium')));
  const r2 = validar('https://web.com/?utm_campaign=a', { utm_source: 'Google', utm_medium: 'cpc', utm_campaign: 'b' });
  assert.equal(r2.errores.length, 0);
  assert.ok(r2.avisos.some(a => a.includes('mayúsculas')));
  assert.ok(r2.avisos.some(a => a.includes('ya lleva')));
});

test('lote con errores por línea', () => {
  const r = lote('https://a.com/\n\nno-es-url\nhttps://b.com/x', { utm_source: 's', utm_medium: 'm', utm_campaign: 'c' });
  assert.equal(r.length, 3);
  assert.ok(r[0].enlace.startsWith('https://a.com/?utm_source=s'));
  assert.ok(r[1].error);
});

test('CSV con comillas cuando hace falta', () => {
  const csv = aCSV([{ fecha: '2026-10-19', enlace: 'https://a.com/?x=1,2', base: 'https://a.com/', utm_source: 's' }]);
  assert.equal(csv.split('\n')[0], 'fecha,enlace,base,utm_source,utm_medium,utm_campaign,utm_term,utm_content,utm_id');
  assert.ok(csv.includes('"https://a.com/?x=1,2"'));
});
