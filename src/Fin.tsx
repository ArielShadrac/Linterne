import {useEffect,useMemo,useState} from 'react'
import {AnimatePresence,animate,motion,useReducedMotion} from 'framer-motion'
import {Icon} from './ui'
import {KV} from './Calc'

/* ====== Fin d'internat : compte à rebours en temps réel ======
 * Les dates (début / fin) se règlent en bas de l'écran et sont gardées sur l'appareil (rv-fin).
 * Le calcul se fait en « heure du mur » : un changement d'heure ne décale jamais l'affichage. */
interface Cfg{s:string;e:string}
const DEF:Cfg={s:'2026-10-01',e:'2027-08-31'}
const KEY='rv-fin'
const DAY=864e5
const load=():Cfg=>{try{const r=JSON.parse(localStorage.getItem(KEY)||'');if(r&&parse(r.s)&&parse(r.e))return r}catch{}return DEF}
function parse(s:string){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(s||'');if(!m)return null;const d=new Date(+m[1],+m[2]-1,+m[3]);return isNaN(+d)?null:d}
const wall=(d:Date)=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate(),d.getHours(),d.getMinutes(),d.getSeconds(),d.getMilliseconds())
const plus=(d:Date,n:number)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n)
const fr=(d:Date,o:Intl.DateTimeFormatOptions={day:'numeric',month:'long',year:'numeric'})=>d.toLocaleDateString('fr-FR',o)
const nf=(n:number)=>Math.round(n).toLocaleString('fr-FR')

export function useNow(){
 const [n,setN]=useState(()=>new Date())
 useEffect(()=>{let t:number;const tick=()=>{setN(new Date());t=window.setTimeout(tick,1000-(Date.now()%1000)+5)};t=window.setTimeout(tick,1000-(Date.now()%1000)+5);return()=>clearTimeout(t)},[])
 return n}

/** Résumé pour l'accueil : « 322 jours restants » */
export function finSub(now=new Date()){
 const c=load(),s=parse(c.s),e=parse(c.e);if(!s||!e)return 'Compte à rebours'
 const end=plus(e,1);if(+now>=+end)return 'Internat terminé'
 if(+now<+s)return `Début dans ${Math.ceil((wall(s)-wall(now))/DAY)} j`
 return `${Math.ceil((wall(end)-wall(now))/DAY)} jours restants`}

function calc(c:Cfg,now:Date){
 const s=parse(c.s)!,e=parse(c.e)!,end=plus(e,1)
 if(+end<=+s)return null
 const N=wall(now),S=wall(s),E=wall(end),total=E-S
 const phase:'avant'|'cours'|'fini'=N<S?'avant':N>=E?'fini':'cours'
 const target=phase==='avant'?S:E
 const rem=phase==='fini'?0:Math.max(0,target-N)
 const sec=Math.floor(rem/1000)
 const pct=phase==='avant'?0:phase==='fini'?1:(N-S)/total
 // mois + jours restants (calendrier)
 const from=phase==='avant'?s:new Date(now.getFullYear(),now.getMonth(),now.getDate())
 let mo=(end.getFullYear()-from.getFullYear())*12+end.getMonth()-from.getMonth()
 const add=(m:number)=>new Date(from.getFullYear(),from.getMonth()+m,from.getDate())
 while(mo>0&&+add(mo)>+end)mo--
 const md=Math.max(0,Math.round((wall(end)-wall(add(Math.max(mo,0))))/DAY))
 // jours ouvrés / samedis restants (aujourd'hui inclus)
 let work=0,sat=0
 if(phase!=='fini'){for(let d=new Date(from);+d<+end;d=plus(d,1)){const w=d.getDay();if(w>0&&w<6)work++;if(w===6)sat++}}
 const totalDays=Math.round(total/DAY)
 return{s,e,end,phase,pct,total,totalDays,d:Math.floor(sec/86400),h:Math.floor(sec%86400/3600),m:Math.floor(sec%3600/60),sc:sec%60,
  hoursLeft:Math.floor(rem/36e5),mo,md,work,sat,weeks:rem/(7*DAY),done:phase==='avant'?0:Math.min(totalDays,Math.floor((N-S)/DAY)),
  perDay:100/totalDays,target}}

/* ---------- Chiffre qui défile ---------- */
function Digit({v}:{v:string}){
 return <span className="dg"><AnimatePresence initial={false} mode="popLayout">
  <motion.span key={v} initial={{y:'70%',opacity:0}} animate={{y:0,opacity:1}} exit={{y:'-70%',opacity:0}} transition={{duration:.3,ease:[.16,1,.3,1]}}>{v}</motion.span></AnimatePresence></span>}
function Roll({v,pad=2}:{v:number;pad?:number}){
 const t=String(v).padStart(pad,'0')
 return <span className="roll" aria-hidden="true">{t.split('').map((c,i)=><Digit key={t.length-i} v={c}/>)}</span>}

/* ---------- Anneau en points ---------- */
const N=72,CX=170,CY=170,R=146,A0=135,SW=270
const pt=(r:number,a:number)=>[CX+r*Math.cos(a*Math.PI/180),CY+r*Math.sin(a*Math.PI/180)]
function Ring({pct,days,label,sub}:{pct:number;days:number;label:string;sub:string}){
 const calm=useReducedMotion()
 const [an,setAn]=useState(0),[done,setDone]=useState(!!calm)
 useEffect(()=>{if(calm)return;const c=animate(0,pct,{duration:1.8,ease:[.16,1,.3,1],onUpdate:setAn,onComplete:()=>setDone(true)});return()=>c.stop()},[]) // eslint-disable-line react-hooks/exhaustive-deps
 const p=done?pct:Math.min(an,pct)
 const lit=Math.round(p*(N-1)),ka=A0+SW*p,[kx,ky]=pt(98,ka)
 return <div className="ring2" role="img" aria-label={`${nf(pct*100)} pour cent du parcours écoulé, ${days} jours restants`}>
  <svg viewBox="0 0 340 340" width="100%">
   <defs><radialGradient id="rg" cx="50%" cy="45%" r="60%"><stop offset="0" stopColor="var(--accent2)" stopOpacity=".16"/><stop offset="1" stopColor="var(--accent2)" stopOpacity="0"/></radialGradient>
    <filter id="gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
   <circle cx={CX} cy={CY} r="132" fill="url(#rg)"/>
   {Array.from({length:N},(_,i)=>{const a=A0+SW*i/(N-1),[x,y]=pt(R,a),on=i<=lit,head=i===lit&&p>0
    return <motion.circle key={i} cx={x} cy={y} r={head?4.6:on?3.2:2.6} className={on?'dt on':'dt'} initial={calm?false:{opacity:0,scale:0}} animate={{opacity:1,scale:1}} transition={{delay:calm?0:i*.011,duration:.35}} style={{transformOrigin:`${x}px ${y}px`}} filter={head?'url(#gl)':undefined}/>})}
   <circle cx={CX} cy={CY} r="106" className="gc"/>
   <circle cx={CX} cy={CY} r="98" className="gt"/>
   <circle cx={CX} cy={CY} r="98" className="ga" pathLength={1} strokeDasharray={`${p*.75} 1`} transform={`rotate(${A0} ${CX} ${CY})`}/>
   {p>0&&<circle cx={kx} cy={ky} r="5.5" className="gk" filter="url(#gl)"/>}
   <text x="26" y="296" className="gl" textAnchor="middle">0</text><text x="314" y="296" className="gl" textAnchor="middle">100</text>
  </svg>
  <div className="rin"><b>{nf(days)}</b><span>{label}</span><small>{sub}</small></div></div>}

/* ---------- Pastilles de statistiques ---------- */
const IC:Record<string,string>={cal:'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',clock:'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',sun:'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5',moon:'M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10z',brief:'M3 8h18v12H3zM9 8V5h6v3M3 13h18',flag:'M5 21V4M5 4h12l-2 4 2 4H5'}
const Ic=({n}:{n:string})=><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={IC[n]}/></svg>
function Stat({i,big,unit,l,delay}:{i:string;big:string;unit?:string;l:string;delay:number}){
 return <motion.div className="stt" initial={{y:14,opacity:0}} animate={{y:0,opacity:1}} transition={{delay,duration:.5,ease:[.16,1,.3,1]}}>
  <span className="sti"><Ic n={i}/></span><div className="stv">{big}{unit&&<small>{unit}</small>}</div><span className="stl">{l}</span></motion.div>}

/* ---------- Écran ---------- */
export default function Fin({onBack}:{onBack:()=>void}){
 const now=useNow(),[cfg,setCfg]=useState<Cfg>(load)
 useEffect(()=>{try{localStorage.setItem(KEY,JSON.stringify(cfg))}catch{}},[cfg])
 const ok=!!parse(cfg.s)&&!!parse(cfg.e)
 const k=useMemo(()=>ok?calc(cfg,now):null,[cfg,now,ok])
 const minute=Math.floor(+now/6e4)
 const label=!k?'':k.phase==='avant'?'avant le début':k.phase==='fini'?'internat terminé':'jours restants'
 const MONTHS=useMemo(()=>{if(!k)return[];const out:{l:string;st:'past'|'now'|'next';y:number}[]=[];const a=new Date(k.s.getFullYear(),k.s.getMonth(),1),z=new Date(k.e.getFullYear(),k.e.getMonth(),1)
  for(let d=new Date(a);+d<=+z&&out.length<40;d=new Date(d.getFullYear(),d.getMonth()+1,1)){
   const nx=new Date(d.getFullYear(),d.getMonth()+1,1),st=+now>=+nx?'past':+now>=+d?'now':'next'
   out.push({l:fr(d,{month:'short'}).replace('.',''),st,y:d.getFullYear()})}
  return out},[k,minute]) // eslint-disable-line react-hooks/exhaustive-deps
 const ms=useMemo(()=>k?[.25,.5,.75,1].map(p=>{const d=new Date(+k.s+0);const t=new Date(k.s.getFullYear(),k.s.getMonth(),k.s.getDate()+Math.round(k.totalDays*p)-(p===1?1:0))
  return{p,d:t,passed:+now>=+(p===1?k.end:t)}}):[],[k,minute]) // eslint-disable-line react-hooks/exhaustive-deps
 const next=ms.find(x=>!x.passed)
 return <div className="page fin"><div className="top"><div><small>Fin d’internat</small><h1>Compte à rebours</h1></div>
  <button className="ib" onClick={onBack} aria-label="Retour à l’accueil"><Icon n="back"/></button></div>
  <div className="cx">
  {!k?<div className="emp"><b>Dates invalides</b>La date de fin doit être après la date de début. Corrige-les plus bas.</div>:<>
   <div className="fhero"><div className="fhin">
    <Ring pct={k.pct} days={k.phase==='fini'?0:k.phase==='avant'?k.d:k.d} label={label} sub={k.phase==='cours'?`${nf(k.pct*100)} % du parcours écoulé`:k.phase==='avant'?`début le ${fr(k.s)}`:`fini le ${fr(k.e)}`}/>
    <div className="tick" role="timer" aria-label={`${k.d} jours, ${k.h} heures et ${k.m} minutes restants`} key="t">
     {([['Jours',k.d,k.d>99?3:2],['Heures',k.h,2],['Min',k.m,2],['Sec',k.sc,2]] as [string,number,number][]).map(([l,v,p],i)=><div key={l} className={'tk'+(i===3?' tlive':'')}><Roll v={v} pad={p}/><span>{l}</span></div>)}</div>
   </div></div>

   <motion.div className="recap" initial={{y:14,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:.15,duration:.5}}>
    <span className="rcl">RÉCAP DU JOUR</span>
    <p>{k.phase==='fini'?'Ton internat est terminé : bravo pour le chemin parcouru.':k.phase==='avant'?`L’internat commence dans ${k.d} jours et ${k.h} h. Profite du temps qu’il reste.`:`Il reste ${k.d} jours et ${k.h} h avant la fin. Chaque jour représente ${(k.perDay).toFixed(2).replace('.',',')} % du parcours.`}</p>
    <div className="rcs"><span>Écoulé <i className="up">↑</i> <b>{nf(k.pct*100)} %</b><u/></span><span>Reste <i className="dn">↓</i> <b>{nf((1-k.pct)*100)} %</b><u/></span></div>
   </motion.div>

   <div className="stg">
    <Stat i="cal" big={nf(k.weeks)} unit="sem." l="Semaines restantes" delay={.2}/>
    <Stat i="moon" big={`${k.mo}`} unit={`mois ${k.md} j`} l="Mois + jours" delay={.25}/>
    <Stat i="clock" big={nf(k.hoursLeft)} unit="h" l="Heures restantes" delay={.3}/>
    <Stat i="brief" big={nf(k.work)} unit="j" l="Jours ouvrés (lun–ven)" delay={.35}/>
    <Stat i="sun" big={nf(k.sat)} unit="" l="Samedis restants" delay={.4}/>
    <Stat i="flag" big={`${nf(k.done)}`} unit={`/ ${nf(k.totalDays)} j`} l="Jours écoulés" delay={.45}/>
   </div>

   <h3 className="lbl">MOIS APRÈS MOIS</h3>
   <div className="mst" role="list">{MONTHS.map((m,i)=><div key={i} role="listitem" className={'ms '+m.st} aria-label={`${m.l} ${m.y} : ${m.st==='past'?'passé':m.st==='now'?'en cours':'à venir'}`}>
    <i/><span>{m.l}</span>{(i===0||m.l==='janv'||MONTHS[i-1]?.y!==m.y)&&<small>{m.y}</small>}</div>)}</div>

   <h3 className="lbl">PALIERS</h3>
   <KV rows={ms.map(x=>[`${Math.round(x.p*100)} % · ${fr(x.d,{day:'numeric',month:'long',year:'numeric'})}`,x.passed?'✓ passé':x===next?(()=>{const dd=Math.ceil((wall(x.d)-wall(now))/DAY);return dd<=0?'aujourd’hui':`dans ${dd} j`})():'à venir'] as [string,string])}/>
   <p className="disc">Compte jusqu’à la fin de la journée du {fr(k.e)} (23 h 59 min 59 s). Les jours fériés et congés ne sont pas déduits des jours ouvrés.</p></>}

   <h3 className="lbl">TES DATES</h3>
   <div className="frm row2">
    <label className="fld">Début<input type="date" value={cfg.s} onChange={e=>setCfg({...cfg,s:e.target.value})}/></label>
    <label className="fld">Fin<input type="date" value={cfg.e} onChange={e=>setCfg({...cfg,e:e.target.value})}/></label></div>
   <button className="rst" onClick={()=>setCfg(DEF)}><Icon n="flip" s={16}/>Remettre 1ᵉʳ oct. 2026 → 31 août 2027</button>
  </div></div>}