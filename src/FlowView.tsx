import {useEffect,useMemo,useState} from 'react'
import {ReactFlow,ReactFlowProvider,Background,Controls,Handle,MarkerType,Position,useReactFlow} from '@xyflow/react'
import type {Edge,Node,NodeProps} from '@xyflow/react'
import dagre from '@dagrejs/dagre'
import '@xyflow/react/dist/style.css'
import {FLOWS} from './algodata'
import type {FNode,Flow,Kind} from './algodata'
import {Icon} from './ui'

/* Graphe interactif d'un algorithme (React Flow) + parcours guidé pas à pas.
 * La mise en page est calculée automatiquement (dagre) : il suffit de décrire nœuds et liens dans algodata.ts. */
const W=236
export const TAG:Record<Kind,string>={s:'Départ',q:'Décision',a:'Conduite à tenir',A:'Groupe A',B:'Groupe B',C:'Groupe C',r:'Évacuation',go:'Voir aussi'}
type D={n:FNode;cls:string}
const hOf=(n:FNode)=>20+14+Math.ceil(n.t.length/27)*18+(n.l?.length?16:0)+6

function layout(f:Flow){
 const g=new dagre.graphlib.Graph()
 g.setGraph({rankdir:'TB',nodesep:30,ranksep:78,acyclicer:'greedy',ranker:'network-simplex'});g.setDefaultEdgeLabel(()=>({}))
 f.n.forEach(n=>g.setNode(n.id,{width:W,height:hOf(n)}))
 f.e.forEach(([a,b])=>g.setEdge(a,b))
 dagre.layout(g)
 const pos:Record<string,{x:number;y:number;h:number}>={}
 f.n.forEach(n=>{const p=g.node(n.id),h=hOf(n);pos[n.id]={x:p.x-W/2,y:p.y-h/2,h}})
 return pos}

function FN({data}:NodeProps<Node<D>>){
 const{n,cls}=data
 return <div className={'fn k-'+n.k+' '+cls} style={{width:W,minHeight:hOf(n)}}>
  <Handle type="target" position={Position.Top} className="fh" isConnectable={false}/>
  <span className="fk">{TAG[n.k]}</span><b>{n.t}</b>
  {!!n.l?.length&&<small>{n.l.length} point{n.l.length>1?'s':''} · détail au toucher</small>}
  <Handle type="source" position={Position.Bottom} className="fh" isConnectable={false}/>
 </div>}
const nodeTypes={f:FN}
const TONE:Partial<Record<Kind,string>>={A:'ok',B:'wa',C:'ko',r:'ko',q:'in',a:'in',go:'in',s:'in'}

function Inner({flow,guide,openFlow}:{flow:Flow;guide:boolean;openFlow:(k:string)=>void}){
 const rf=useReactFlow(),root=flow.n[0].id
 const pos=useMemo(()=>layout(flow),[flow])
 const [sel,setSel]=useState<string|null>(null),[path,setPath]=useState<string[]>([root])
 useEffect(()=>{setSel(null);setPath([root])},[flow,guide,root])
 const cur=guide?path[path.length-1]:sel
 const node=cur?flow.n.find(n=>n.id===cur)!:null
 const out=guide&&cur?flow.e.filter(e=>e[0]===cur):[]
 useEffect(()=>{
  if(!guide||!cur)return
  const p=pos[cur];if(!p)return
  const t=setTimeout(()=>rf.setCenter(p.x+W/2,p.y+p.h/2,{zoom:.95,duration:450}),30);return()=>clearTimeout(t)
 },[guide,cur,pos,rf])

 const nodes:Node<D>[]=useMemo(()=>flow.n.map(n=>{
  const vis=path.includes(n.id),isCur=guide&&n.id===cur
  const cls=guide?(isCur?'cur':vis?'vis':'dim'):(sel===n.id?'cur':'')
  return{id:n.id,type:'f',position:pos[n.id],data:{n,cls},draggable:false,connectable:false}}),[flow,pos,path,sel,guide,cur])
 const edges:Edge[]=useMemo(()=>{
  const pe=new Set(path.slice(1).map((b,i)=>path[i]+'>'+b))
  return flow.e.map(([a,b,l],i)=>{
   const on=guide?pe.has(a+'>'+b):true
   return{id:a+'-'+b+'-'+i,source:a,target:b,label:l,type:'smoothstep',animated:guide&&on&&path[path.length-2]===a&&cur===b,
    className:on?'fe':'fe off',markerEnd:{type:MarkerType.ArrowClosed,width:16,height:16},
    labelBgPadding:[6,3] as [number,number],labelBgBorderRadius:6}})},[flow,path,guide,cur])

 const target=(id:string)=>flow.n.find(n=>n.id===id)!
 const end=guide&&node&&!out.length&&node.k!=='go'
 const tone=node?TONE[node.k]:undefined
 return <div>
  <div className="fcv" aria-label={'Graphe de l’algorithme : '+flow.name}>
   <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding:.12}} minZoom={.15} maxZoom={1.6}
    nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} proOptions={{hideAttribution:false}}
    onNodeClick={(_,n)=>{if(!guide)setSel(s=>s===n.id?null:n.id)}} onPaneClick={()=>{if(!guide)setSel(null)}}>
    <Background gap={22} size={1.2}/><Controls showInteractive={false} position="bottom-left" fitViewOptions={{padding:.12,duration:300}}/>
   </ReactFlow>
  </div>
  <div className={'fpn vd '+(tone?'t-'+tone:'')+(node?' k-'+node.k:'')} aria-live="polite">
   {!node&&<p className="hintx">Touche un nœud pour lire le détail. Glisse pour te déplacer, pince ou utilise + / − pour zoomer.</p>}
   {node&&<>
    <div className="fph"><span>{TAG[node.k]}</span>{guide&&<span>Étape {path.length}</span>}</div>
    <h3>{node.t}</h3>
    {!!node.l?.length&&<ul>{node.l.map((x,i)=><li key={i}>{x}</li>)}</ul>}
    {node.k==='go'&&<div className="acts"><button className="rst" onClick={()=>openFlow(node.to!)}>Ouvrir : {FLOWS.find(f=>f.key===node.to)?.name}<Icon n="chev" s={16}/></button></div>}
    {end&&<p className="hintx" style={{marginTop:10}}>Fin du parcours.</p>}
   </>}
  </div>
  {guide&&node&&out.length>0&&<><h3 className="lbl">{out.length>1?'QUE CONSTATES-TU ?':'ENSUITE'}</h3>
   <div className="crows">{out.map(([,b,l],i)=><button key={i} className="crow" onClick={()=>setPath(p=>[...p,b])}>
    <span className="tx"><b>{l||target(b).t}</b>{l&&<small>{target(b).t}</small>}</span><Icon n="chev" s={18}/></button>)}</div></>}
  {guide&&<div className="acts"><button className="rst" disabled={path.length<2} onClick={()=>setPath(p=>p.slice(0,-1))}><Icon n="back" s={16}/>Étape précédente</button>
   <button className="rst" disabled={path.length<2} onClick={()=>setPath([root])}><Icon n="flip" s={16}/>Recommencer</button></div>}
 </div>}

export default function FlowView(p:{flow:Flow;guide:boolean;openFlow:(k:string)=>void}){
 return <ReactFlowProvider key={p.flow.key+(p.guide?'g':'m')}><Inner {...p}/></ReactFlowProvider>}