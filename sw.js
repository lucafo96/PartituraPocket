/* Partitura Pocket - cache dell'interfaccia, non dei documenti IndexedDB */
const CACHE = 'partitura-pocket-v0.2.4';
const PREFIX = 'partitura-pocket-';
const SHELL = ['./', './index.html', './style.css', './app.js', './manifest.webmanifest', './icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const req=event.request;
  if(req.method !== 'GET') return;
  const url=new URL(req.url);
  // La versione NON va mai servita dalla cache: impedirebbe di vedere aggiornamenti.
  if(url.origin === self.location.origin && url.pathname.endsWith('/version.json')) {
    event.respondWith(fetch(new Request(req,{cache:'no-store'})));
    return;
  }
  if(req.mode === 'navigate' && url.origin === self.location.origin){
    event.respondWith(fetch(req).then(response=>{
      if(response.ok){const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put('./index.html',clone)));}
      return response;
    }).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(hit=>hit || fetch(req).then(response=>{
    if(response.ok && url.origin === self.location.origin){
      const clone=response.clone();event.waitUntil(caches.open(CACHE).then(c=>c.put(req,clone)));
    }
    return response;
  })));
});
