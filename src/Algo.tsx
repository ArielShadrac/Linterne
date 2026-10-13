import {useEffect,useMemo,useState} from 'react'
import {motion} from 'framer-motion'
import {COURSE,ENTRY,FLOWS,QUIZ,SIGNS_B,SIGNS_C,TERRAIN} from './algodata'
import type {Sec,Sign} from './algodata'
import FlowView from './FlowView'
import {Icon} from './ui'
import {useBackLayer} from './nav'
import {Empty,KV,Num,Pills,Res,Scale,Verdict} from './Calc'

/* Section « Prise en charge » : cours · algorithmes interactifs · outils (triage, doses) · quiz.
 * Même langage visuel que « Calculs » (lignes .crow, verdicts, tableaux KV, pastilles .op).
 * Contenu dans algodata.ts, graphe dans FlowView.tsx. Données locales (localStorage), tout marche hors ligne. */
type Tab='cours'|'algo'|'outils'|'quiz'
function useLS<T>(k:string,i:T){const[v,s]=useState<T>(()=>{try{const r=localStorage.getItem(k);return r?JSON.parse(r):i}catch{return i}})
 useEffect(()=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}},[k,v]);return[v,s] as const}
const TONE={A:'ok',B:'wa',C:'ko'} as const
const CODE:Record<string,string>={csps:'CSPS',cm:'CM',chr:'CHU',severe:'SEV',shock:'CHOC',hemo:'HÉM',preg:'GRS',nn1:'NN1',nn2:'NN2',nn3:'NN3',nn4:'NN4'}

/* ---------- Cours ---------- */
function CourseDetail({s}:{s:Sec}){
 return <div>{s.blocks.map((b,i)=>b.tone
  ?<div key={i} className={'vd t-'+TONE[b.tone]}><b>{b.h}</b>{b.p&&<p>{b.p}</p>}{b.ul&&<ul>{b.ul.map((x,j)=><li key={j}>{x}</li>)}</ul>}</div>
  :<section key={i} className="lc"><h3 className="lh">{b.h.toUpperCase()}</h3>{b.p&&<p>{b.p}</p>}{b.ul&&<ul>{b.ul.map((x,j)=><li key={j}>{x}</li>)}</ul>}{b.nb&&<div className="ex">NB : {b.nb}</div>}</section>)}</div>}

/* ---------- Algorithmes ---------- */
function Checks({items,v,set}:{items:Sign[];v:Record<string,boolean>;set:(k:string)=>void}){
 return <div className="stack">{items.map(s=><button key={s.k} type="button" className={'op'+(v[s.k]?' on':'')} aria-pressed={!!v[s.k]} onClick={()=>set(s.k)}>
  <b aria-hidden="true">{v[s.k]&&<Icon n="check" s={14}/>}</b><span>{s.l}</span></button>)}</div>}

function Triage({open}:{open:(k:string)=>void}){
 const [v,setV]=useState<Record<string,boolean>>({})
 const tg=(k:string)=>setV(s=>({...s,[k]:!s[k]}))
 const any=(L:Sign[])=>L.filter(s=>v[s.k])
 const c=any(SIGNS_C),b=any(SIGNS_B),t=any(TERRAIN),e=any(ENTRY)
 const g=c.length?'C':(b.length||t.length)?'B':'A'
 const R={A:{h:'Groupe A : ambulatoire',a:['Repos, hydratation orale (adulte ≥ 2 L/j ; enfant 70–100 mL/kg/j)','Paracétamol aux doses de l’onglet Doses','Revoir à H48 / J2 ; retour immédiat si saignement, vomissements persistants, troubles de la conscience']},
  B:{h:'Groupe B : surveillance étroite',a:['Structure avec laboratoire (CM, CMA, CHR)','NFS, GSRH, urémie, créatininémie, transaminases · hématocrite de référence','Boire ; sinon perfusion NaCl 0,9 % / RL : 5–7 mL/kg/h 1–2 h, puis 3–5, puis 2–3 mL/kg/h','Au CSPS : conditionner (voie veineuse) puis évacuer']},
  C:{h:'Groupe C : urgence',a:['Voie veineuse de bon calibre, oxygène','Choc : bolus 20 mL/kg en 15 min · sévère sans choc : 5–10 mL/kg/h pendant 3 h','Évacuer au niveau supérieur (CHR / CHU)']}}[g]
 const flow=g==='C'?(c.some(s=>s.k==='c1')?'shock':'severe'):'chr'
 return <div className="frm">
  <p className="hnt" style={{textAlign:'left',marginBottom:4}}>Coche ce que tu constates : le groupe est calculé en direct. Un seul critère de B ou de C suffit.</p>
  <h3 className="lbl">CRITÈRES D’ENTRÉE · {e.length}/3</h3><Checks items={ENTRY} v={v} set={tg}/>
  <h3 className="lbl">SIGNES DE DÉCOMPENSATION (C)</h3><Checks items={SIGNS_C} v={v} set={tg}/>
  <h3 className="lbl">SIGNES D’ALERTE (B)</h3><Checks items={SIGNS_B} v={v} set={tg}/>
  <h3 className="lbl">TERRAIN À RISQUE (B)</h3><Checks items={TERRAIN} v={v} set={tg}/>
  <h3 className="lbl">RÉSULTAT</h3>
  <div className={'vd t-'+TONE[g]} role="status"><b>{R.h}</b><ul>{R.a.map((x,i)=><li key={i}>{x}</li>)}</ul></div>
  {e.length<3&&<Empty t="Critères d’entrée incomplets : la définition de cas suspect n’est pas remplie."/>}
  <div className="acts"><button className="rst" onClick={()=>open(flow)}><Icon n="branch" s={16}/>Voir l’algorithme</button><button className="rst" onClick={()=>setV({})}><Icon n="flip" s={16}/>Effacer</button></div></div>}

const f0=(x:number)=>Math.round(x).toLocaleString('fr-FR')
const rg=(a:number,b:number,u:string)=>`${f0(a)}–${f0(b)} ${u}`
function Doses(){
 const [kg,setKg]=useLS<string>('rv-algo-kg-s',''),[ad,setAd]=useLS<'e'|'a'>('rv-algo-age','e')
 const x=parseFloat(kg.replace(',','.')),w=x>0&&x<250?x:0,adult=ad==='a'
 const base:[string,string][]=adult?[['Paracétamol · 4–6 h','500 mg–1 g/prise · max 4 g/j'],['Boisson','≥ 2 L/j']]:w?[['Paracétamol · 4–6 h',`${f0(15*w)}–${f0(20*w)} mg/prise · max ${f0(60*w)} mg/j`],['Boisson',rg(70*w,100*w,'mL/j')]]:[]
 const perf:[string,string][]=w?[
  ['Entretien B · 1–2 h (5–7 mL/kg/h)',rg(5*w,7*w,'mL/h')],['… puis 2–4 h (3–5 mL/kg/h)',rg(3*w,5*w,'mL/h')],['… puis (2–3 mL/kg/h)',rg(2*w,3*w,'mL/h')],
  ['Aggravation + Ht ↑ (5–10 mL/kg/h)',rg(5*w,10*w,'mL/h')],['Sévère sans choc · 3 h (5–10 mL/kg/h)',rg(5*w,10*w,'mL/h')],['2ᵉ bolus sévère · 1 h (10–20 mL/kg/h)',rg(10*w,20*w,'mL/h')],
  ['Choc : bolus en 15 min (20 mL/kg)',`${f0(20*w)} mL`]]:[]
 const sang:[string,string][]=w?[['Plaquettes (5–10 mL/kg)',rg(5*w,10*w,'mL')],['Concentré érythrocytaire (5–10 mL/kg)',rg(5*w,10*w,'mL')],['Sang total frais (10–20 mL/kg)',rg(10*w,20*w,'mL')]]:[]
 return <div className="frm">
  <Pills v={ad} on={setAd} o={[['e','Enfant'],['a','Adulte (≥ 14 ans)']]}/>
  <Num l="Poids" u="kg" v={kg} on={setKg} ph="ex. 18"/>
  {!w&&<Empty t="Entre le poids pour calculer les débits de perfusion et les doses."/>}
  {base.length>0&&<><h3 className="lbl">TRAITEMENT AMBULATOIRE</h3><KV rows={base}/></>}
  {w>0&&<><h3 className="lbl">PERFUSION</h3><KV rows={perf}/><h3 className="lbl">PRODUITS SANGUINS</h3><KV rows={sang}/></>}
  <p className="disc">Valeurs de l’algorithme national multipliées par le poids. Outil pédagogique : vérifie avant toute prescription (femme enceinte : éviter le remplissage excessif).</p></div>}

/* ---------- Quiz ---------- */
const shuffle=<T,>(a:T[])=>{const r=[...a];for(let i=r.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[r[i],r[j]]=[r[j],r[i]]}return r}
function Quiz(){
 const [run,setRun]=useState(0),Qs=useMemo(()=>shuffle(QUIZ),[run])
 const [i,setI]=useState(0),[pick,setPick]=useState<number|null>(null),[score,setScore]=useState(0)
 const [best,setBest]=useLS<number>('rv-algo-best',0)
 const done=i>=Qs.length
 useEffect(()=>{if(done&&score>best)setBest(score)},[done,score,best,setBest])
 const restart=()=>{setRun(r=>r+1);setI(0);setPick(null);setScore(0)}
 if(done){const n=Qs.length;return <div>
  <Res k="Score" big={String(score)} unit={`/ ${n}`} line={`Meilleur score : ${Math.max(best,score)} / ${n}`}/>
  <Scale min={-.5} max={n+.5} v={score} seg={[{to:n*.5,t:'ko',l:'à revoir'},{to:n*.8,t:'wa',l:'correct'},{to:n+.5,t:'ok',l:'solide'}]}/>
  <p className="hnt" style={{textAlign:'left'}}>{score>=n*.8?'Solide : relis tout de même les erreurs.':'Reprends le cours et les algorithmes, puis réessaie.'}</p>
  <button className="cta" onClick={restart}>Recommencer</button></div>}
 const q=Qs[i]
 return <div>
  <div className="pb" style={{margin:'0 0 8px'}}><motion.i animate={{width:`${i/Qs.length*100}%`}}/></div>
  <div className="st" style={{textAlign:'left',margin:'8px 0 16px'}}>Question {i+1} / {Qs.length} · score {score}{best?` · record ${best}`:''}</div>
  <h3 className="qq">{q.q}</h3>
  <div className="stack">{q.o.map((o,k)=>{const st=pick===null?'':k===q.a?' ok':k===pick?' ko':' dim'
   return <button key={k} type="button" disabled={pick!==null} className={'op'+st} onClick={()=>{setPick(k);if(k===q.a)setScore(s=>s+1)}}><b>{String.fromCharCode(65+k)}</b><span>{o}</span></button>})}</div>
  {pick!==null&&<div style={{marginTop:16}} role="status"><Verdict tone={pick===q.a?'ok':'ko'} t={pick===q.a?'Exact':'Pas tout à fait'}>{q.x}</Verdict>
   <button className="cta" style={{marginTop:4,width:'100%'}} onClick={()=>{setI(i+1);setPick(null)}}>{i+1===Qs.length?'Voir le score':'Suivant'}</button></div>}
 </div>}

/* ---------- Écran ---------- */
export default function Algo(){
 const [tab,setTab]=useState<Tab>('cours'),[flow,setFlow]=useState<string|null>(null),[sec,setSec]=useState<string|null>(null),[guide,setGuide]=useState(false)
 const f=FLOWS.find(x=>x.key===flow),s=COURSE.find(x=>x.k===sec)
 useBackLayer(!!f||!!s,()=>{setFlow(null);setSec(null)})
 const openFlow=(k:string)=>{setTab('algo');setGuide(false);setFlow(k)}
 const T:[Tab,string][]=[['cours','Cours'],['algo','Algos'],['outils','Outils'],['quiz','Quiz']]
 const disc=<p className="disc">Source : algorithme national de prise en charge des cas de dengue (définitions SIMR, mai 2021). Outil d’aide à l’apprentissage : il ne remplace ni le jugement clinique ni les protocoles de ton service.</p>

 if(f)return <div key={'f-'+f.key} className="page"><div className="top"><div><small>{f.cat}</small><h1 className="sm">{f.name}</h1></div>
  <button className="ib" onClick={()=>setFlow(null)} aria-label="Retour aux algorithmes"><Icon n="back"/></button></div>
  <div className="cx"><p className="hnt" style={{textAlign:'left',margin:'-12px 0 16px'}}>{f.lvl}</p>
   <div className="seg">{([[false,'Carte'],[true,'Pas à pas']] as [boolean,string][]).map(([g,l])=>
    <button key={l} className={guide===g?'on':''} onClick={()=>setGuide(g)}>{guide===g&&<motion.i layoutId="fseg"/>}<span>{l}</span></button>)}</div>
   <FlowView flow={f} guide={guide} openFlow={openFlow}/>{disc}</div></div>

 if(s)return <div key={'s-'+s.k} className="page"><div className="top"><div><small>Cours · dengue</small><h1 className="sm">{s.t}</h1></div>
  <button className="ib" onClick={()=>setSec(null)} aria-label="Retour au cours"><Icon n="back"/></button></div>
  <div className="cx"><CourseDetail s={s}/>{disc}</div></div>

 const cats=[...new Set(FLOWS.map(x=>x.cat))]
 return <div key="list" className="page"><div className="top"><div><small>Prise en charge</small><h1>Dengue</h1></div></div>
  <div className="cx"><div className="seg">{T.map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{tab===k&&<motion.i layoutId="atab"/>}<span>{l}</span></button>)}</div>
   {tab==='cours'&&<div className="crows">{COURSE.map((x,i)=><motion.button key={x.k} className="crow" initial={{y:12}} animate={{y:0}} transition={{delay:.04*i}} onClick={()=>setSec(x.k)}>
    <span className="cd" aria-hidden="true">{x.code}</span><span className="tx"><b>{x.t}</b><small>{x.sub}</small></span><Icon n="chev" s={18}/></motion.button>)}</div>}
   {tab==='algo'&&cats.map(c=><section key={c}><h3 className="lbl" style={{marginTop:c===cats[0]?0:22}}>{c.toUpperCase()}</h3>
    <div className="crows">{FLOWS.filter(x=>x.cat===c).map((x,i)=><motion.button key={x.key} className="crow" initial={{y:12}} animate={{y:0}} transition={{delay:.04*i}} onClick={()=>{setGuide(false);setFlow(x.key)}}>
     <span className="cd" aria-hidden="true">{CODE[x.key]}</span><span className="tx"><b>{x.name}</b><small>{x.sub}</small></span><Icon n="chev" s={18}/></motion.button>)}</div></section>)}
   {tab==='outils'&&<ToolsTab open={openFlow}/>}
   {tab==='quiz'&&<Quiz/>}
   {disc}</div></div>}

function ToolsTab({open}:{open:(k:string)=>void}){
 const [t,setT]=useState<'tri'|'dos'>('tri')
 return <div><Pills v={t} on={setT} o={[['tri','Triage A · B · C'],['dos','Doses & débits']]}/>
  {t==='tri'?<Triage open={open}/>:<Doses/>}</div>}