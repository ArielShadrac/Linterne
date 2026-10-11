import {useEffect,useState,useCallback} from 'react'

/** Enregistre le service worker (production seulement) et demande à protéger les données locales de l'effacement automatique. */
export function registerSW(){
 const prod=(import.meta as unknown as {env?:{PROD?:boolean}}).env?.PROD
 if(!prod||!('serviceWorker' in navigator))return
 addEventListener('load',()=>{
  navigator.serviceWorker.register('./sw.js').catch(()=>{})
  try{navigator.storage?.persist?.()}catch{}})}

/** true si l'appareil a du réseau (indicatif : « connecté » ne garantit pas que le réseau fonctionne). */
export function useOnline(){
 const [on,setOn]=useState(()=>navigator.onLine)
 useEffect(()=>{
  const u=()=>setOn(true),d=()=>setOn(false)
  addEventListener('online',u);addEventListener('offline',d)
  return()=>{removeEventListener('online',u);removeEventListener('offline',d)}},[]
 )
 return on}

interface BIP extends Event{prompt():Promise<void>}
/** Installation sur l'écran d'accueil. `can` = le navigateur propose l'installation ; `done` = déjà installée. */
export function useInstall(){
 const [ev,setEv]=useState<BIP|null>(null)
 const [done,setDone]=useState(()=>matchMedia('(display-mode: standalone)').matches)
 useEffect(()=>{
  const a=(e:Event)=>{e.preventDefault();setEv(e as BIP)}
  const b=()=>{setDone(true);setEv(null)}
  addEventListener('beforeinstallprompt',a);addEventListener('appinstalled',b)
  return()=>{removeEventListener('beforeinstallprompt',a);removeEventListener('appinstalled',b)}},[])
 return {can:!!ev&&!done,done,install:async()=>{if(!ev)return;await ev.prompt();setEv(null)}}}

/** Persiste/récupère une valeur JSON dans le cache du service worker.
 *  Fonctionne même hors ligne : les données survivent à un rechargement de page.
 *  Usage : const {save, load, saving} = useSWData() */
export function useSWData(){
 const [saving,setSaving]=useState(false)

 const save=useCallback(async(key:string,value:unknown):Promise<boolean>=>{
  if(!('serviceWorker' in navigator))return false
  const sw=await navigator.serviceWorker.ready.catch(()=>null)
  if(!sw?.active)return false
  return new Promise(resolve=>{
   setSaving(true)
   const handler=(e:MessageEvent)=>{
    if(e.data?.type==='CACHE_DATA_OK'&&e.data.key===key){
     navigator.serviceWorker.removeEventListener('message',handler)
     setSaving(false);resolve(true)}}
   navigator.serviceWorker.addEventListener('message',handler)
   sw.active.postMessage({type:'CACHE_DATA',key,value})
   setTimeout(()=>{navigator.serviceWorker.removeEventListener('message',handler);setSaving(false);resolve(false)},3000)
  })},[])

 const load=useCallback(async<T=unknown>(key:string):Promise<T|null>=>{
  if(!('serviceWorker' in navigator))return null
  const sw=await navigator.serviceWorker.ready.catch(()=>null)
  if(!sw?.active)return null
  return new Promise(resolve=>{
   const handler=(e:MessageEvent)=>{
    if(e.data?.type==='GET_DATA_RESULT'&&e.data.key===key){
     navigator.serviceWorker.removeEventListener('message',handler)
     resolve(e.data.value as T)}}
   navigator.serviceWorker.addEventListener('message',handler)
   sw.active.postMessage({type:'GET_DATA',key})
   setTimeout(()=>{navigator.serviceWorker.removeEventListener('message',handler);resolve(null)},2000)
  })},[])

 return {save,load,saving}}