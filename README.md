
# FocusApp – AI Digest

Pequeño experimento para listar solo los vídeos “de hoy” de los canales
que sigo, sin el algoritmo de YouTube:

1. Login con Auth0 (SPA SDK).
2. Netlify Functions + SQLite guardan el feed diario.
3. Una función programada (cron) corre 1 vez/día y mete los nuevos vídeos.
4. Click = se marca como visto y desaparece.

## Deploy

```bash
npm install
git add .
git commit -m "🎉 first"
git remote add origin <tu-repo>
git push -u origin main
En Netlify:

Field	Value
Build command	npm run build
Publish dir	dist
Functions dir	netlify/functions

No olvides las env vars AUTH0_DOMAIN y AUTH0_CLIENT_ID.

Enjoy! 🚀

---

## 4 · ¡A desplegar!

1. `npm install` local (solo la primera vez).  
2. `git push` → Netlify hace todo.  
3. Abre `/.netlify/functions/hello` para chequear funciones.  
4. Ejecuta manualmente  
   `/.netlify/functions/fetchFeeds` (una sola vez) para poblar la DB.  
5. Entra al sitio, logueate y verás la lista “Hoy”.

Cualquier error de build o función pegalo acá y lo pulimos. ¡Éxitos!

