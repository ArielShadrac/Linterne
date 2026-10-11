/* L'interne : service worker (mode hors ligne).
 * - Coquille de l'app mise en cache à l'installation.
 * - Assets/ : cache d'abord (hash immuable).
 * - Polices et APIs publiques : stale-while-revalidate.
 * - DATA : cache dédié pour les données locales (scores récents, fiches mémo).
 * Pour forcer une purge complète, change le numéro de VERSION. */
const VERSION='interne-v2'
const SHELL=VERSION+'-shell'
const RUN  =VERSION+'-run'
const DATA =VERSION+'-data'
const BASE =self.registration.scope

const wait=(p,ms)=>Promise.race([p,new Promise((_,r)=>setTimeout(()=>r(new Error('to')),ms))])

/* ── Installation : pré-cache de la coquille ── */
self.addEventListener('install',e=>{
 e.waitUntil((async()=>{
  const c=await caches.open(SHELL)
  const res=await fetch(BASE,{cache:'reload'})
  const html=await res.clone().text()
  await c.put(BASE,res)
  const urls=new Set([
   BASE+'manifest.webmanifest',
   BASE+'icons/icon-192.png',
   BASE+'icons/icon-512.png',
   BASE+'icons/favicon.svg'])
  for(const m of html.matchAll(/(?:src|href)="([^"]+)"/g)){
   try{const u=new URL(m[1],BASE);if(u.origin===location.origin||u.hostname==='fonts.googleapis.com')urls.add(u.href)}catch{}}
  await Promise.all([...urls].map(async u=>{
   try{
    const cross=new URL(u).origin!==location.origin
    const r=await fetch(u,cross?{mode:'no-cors'}:undefined)
    if(r.ok||r.type==='opaque')await c.put(u,r)}catch{}}))
  await self.skipWaiting()})())})

/* ── Activation : purge des vieux caches ── */
self.addEventListener('activate',e=>{
 e.waitUntil((async()=>{
  for(const k of await caches.keys())if(!k.startsWith(VERSION))await caches.delete(k)
  await self.clients.claim()
  /* Notifie les clients qu'on est à jour */
  const clients=await self.clients.matchAll({type:'window'})
  clients.forEach(c=>c.postMessage({type:'SW_ACTIVATED',version:VERSION}))
 })())})

/* ── Stratégies de récupération ── */
const page=async req=>{
 const c=await caches.open(SHELL)
 try{const r=await wait(fetch(req),3500);if(r.ok)c.put(BASE,r.clone());return r}
 catch{return(await c.match(BASE))||(await c.match(req))||Response.error()}}

const keep=async(req,store=RUN)=>{
 const hit=await caches.match(req)
 if(hit)return hit
 try{const r=await fetch(req);if(r.ok)(await caches.open(store)).put(req,r.clone());return r}
 catch{return Response.error()}}

const fresh=async(req,store)=>{
 const c=await caches.open(store),hit=await c.match(req)
 const net=fetch(req).then(r=>{if(r.ok||r.type==='opaque')c.put(req,r.clone());return r}).catch(()=>null)
 return hit||(await net)||Response.error()}

/* ── Fetch : routage ── */
self.addEventListener('fetch',e=>{
 const req=e.request
 if(req.method!=='GET')return
 const u=new URL(req.url)
 if(req.mode==='navigate'){e.respondWith(page(req));return}
 if(u.origin===location.origin){
  /* Assets hashés → cache immuable */
  if(u.pathname.includes('/assets/')){e.respondWith(keep(req));return}
  /* Icônes et manifest */
  if(u.pathname.startsWith('/icons/')||u.pathname.endsWith('.webmanifest')){e.respondWith(keep(req));return}
  e.respondWith(fresh(req,RUN));return}
 /* Polices Google */
 if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
  e.respondWith(fresh(req,RUN));return}
 /* Images Unsplash (splash screen) → stale-while-revalidate */
 if(u.hostname.includes('unsplash.com')||u.hostname.includes('images.unsplash.com')){
  e.respondWith(fresh(req,RUN));return}})

/* ── Message : synchronisation des données ──
 * L'app peut envoyer {type:'CACHE_DATA', key, value} pour persister des données hors ligne.
 * Elle peut lire {type:'GET_DATA', key} pour récupérer des données cachées.
 * La réponse est postée sur le même client via postMessage. */
self.addEventListener('message',e=>{
 if(!e.data||!e.source)return
 if(e.data.type==='SW_VERSION'){
  e.source.postMessage({type:'SW_VERSION',version:VERSION});return}
 if(e.data.type==='CACHE_DATA'){
  /* Persiste une donnée clé-valeur dans le cache DATA */
  const {key,value}=e.data
  if(!key)return
  const url=BASE+'__data__/'+encodeURIComponent(key)
  caches.open(DATA).then(c=>{
   const body=JSON.stringify(value)
   c.put(new Request(url),new Response(body,{headers:{'Content-Type':'application/json','X-Cached-At':new Date().toISOString()}}))
   e.source.postMessage({type:'CACHE_DATA_OK',key})});return}
 if(e.data.type==='GET_DATA'){
  const {key}=e.data
  if(!key)return
  const url=BASE+'__data__/'+encodeURIComponent(key)
  caches.open(DATA).then(async c=>{
   const r=await c.match(new Request(url))
   if(!r){e.source.postMessage({type:'GET_DATA_RESULT',key,value:null});return}
   const value=await r.json()
   e.source.postMessage({type:'GET_DATA_RESULT',key,value})});return}
 if(e.data.type==='CLEAR_DATA'){
  caches.delete(DATA).then(()=>e.source.postMessage({type:'CLEAR_DATA_OK'}));return}})
