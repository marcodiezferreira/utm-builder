# utm-builder

**Crea enlaces con UTM para tus campañas, sin errores y siempre con el mismo formato.**

👉 **Pruébala:** https://marcodiezferreira.github.io/utm-builder/

Los parámetros UTM dicen a Google Analytics de dónde viene cada visita. El problema es que basta un despiste para que una campaña se parta en varias en los informes: «Facebook», «facebook» y «facebook » cuentan como fuentes distintas. Esta app lo evita.

## Qué hace

- **Plantillas** para los canales habituales: Google Ads, Meta Ads, Instagram, LinkedIn, TikTok, newsletter, WhatsApp y carteles con QR.
- **Normaliza mientras escribes:** minúsculas, sin tildes ni ñ, espacios convertidos en guiones (configurable).
- **Avisa de los errores típicos:** dirección incompleta, campos obligatorios vacíos, UTM que ya estaban en la URL o mayúsculas.
- **Respeta tu URL:** conserva sus parámetros y el ancla (`#`) y sustituye los UTM antiguos.
- **Código QR** del enlace, descargable en PNG (1024 px) o SVG, para imprimir.
- **Varios enlaces a la vez:** pega una dirección por línea y descárgalos en CSV.
- **Historial** de los enlaces guardados, exportable a CSV para tu hoja de campañas.
- **Privada:** no hay servidor. Todo se queda en tu navegador.

## Usarla en local

No necesita instalación ni compilación. Sírvela con cualquier servidor estático (los módulos de JavaScript no funcionan abriendo el fichero con doble clic):

```bash
python -m http.server 8000
```

Y abre http://localhost:8000.

## Publicarla en GitHub Pages

En el repositorio: **Settings → Pages → Branch: `main` / carpeta `/ (root)` → Save**. En un minuto estará en `https://<tu-usuario>.github.io/utm-builder/`.

## Estructura

```
index.html        la página
styles.css        estilos (modo claro y oscuro)
src/utm.js        lógica: normalizar, validar, construir, lotes y CSV (sin DOM)
src/app.js        interfaz
vendor/qrcode.js  generador de QR (qrcode-generator, MIT, Kazuhiko Arase)
test/             pruebas de la lógica
```

## Pruebas

```bash
npm test
```

## Autor

Hecho por [Marco Díez](https://marcodiez.es): marketing digital y desarrollo.
¿Quieres medir bien tus campañas? [Escríbeme](https://marcodiez.es/contacto/).

Licencia MIT. El generador de QR incluido es de Kazuhiko Arase (licencia MIT). «QR Code» es una marca registrada de DENSO WAVE INCORPORATED.
