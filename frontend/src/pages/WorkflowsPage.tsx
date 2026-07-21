import { FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, RefreshCw, Send, ShieldCheck, Workflow } from 'lucide-react';
import { apiFetch } from '../api';

const operations: Record<string,string[]> = {
  crm:['upsert_account','create_opportunity'], accounting:['post_invoice'], ticketing:['create_ticket'],
  calendar:['create_event'], messaging:['send_notification'], data_warehouse:['load_record']
};
const nextStates: Record<string,string[]> = { intake:['validated','cancelled'], validated:['approval_pending','cancelled'], approval_pending:['approved','rejected'], approved:['dispatch_pending','cancelled'], delivery_failed:['dispatch_pending','cancelled'] };

export default function WorkflowsPage(){
  const[items,setItems]=useState<any[]>([]);const[connector,setConnector]=useState('crm');const[error,setError]=useState('');const[loading,setLoading]=useState(true);
  const user=useMemo(()=>JSON.parse(localStorage.getItem('user')||'{}'),[]);
  async function refresh(){setLoading(true);setError('');try{setItems(await apiFetch('/governed-workflows'))}catch(err:any){setError(err.message)}finally{setLoading(false)}}
  useEffect(()=>{refresh()},[]);
  async function create(event:FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const data=new FormData(form);
    try{
      await apiFetch('/governed-workflows',{
        method:'POST',headers:{'Idempotency-Key':crypto.randomUUID()},
        body:JSON.stringify({title:data.get('title'),connector,operation:data.get('operation'),acceptanceCriteria:String(data.get('criteria')).split('\n').map(value=>value.trim()).filter(Boolean),payload:JSON.parse(String(data.get('payload')))})
      });
      form.reset();await refresh();
    }catch(err:any){setError(err.message)}
  }
  async function transition(item:any,toStatus:string){try{await apiFetch(`/governed-workflows/${item.id}/transitions`,{method:'POST',body:JSON.stringify({expectedVersion:item.version,toStatus,reason:`${user.role||'operator'} confirmed transition`})});await refresh()}catch(err:any){setError(err.message)}}
  return <div className="h-full overflow-auto bg-gray-950 p-8 space-y-6"><header className="flex justify-between items-start"><div><h1 className="text-2xl font-bold flex gap-2 items-center"><Workflow className="text-teal-400"/>Governed workflows</h1><p className="text-gray-400 mt-1">Typed cross-company work with independent approval, connector receipts, and evaluated acceptance evidence.</p></div><button onClick={refresh} className="border border-gray-700 rounded-lg px-3 py-2 flex gap-2"><RefreshCw className="w-4 h-4"/>Refresh</button></header>
  {error&&<div role="alert" className="bg-red-950 border border-red-800 text-red-200 rounded-lg p-3">{error}</div>}
  {['requester','admin'].includes(user.role)&&<form onSubmit={create} className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid md:grid-cols-2 gap-4"><h2 className="font-semibold col-span-full">New operations request</h2>
    <label className="text-sm text-gray-300">Title<input required minLength={3} maxLength={200} name="title" className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded p-2"/></label>
    <label className="text-sm text-gray-300">Connector<select value={connector} onChange={event=>setConnector(event.target.value)} className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded p-2">{Object.keys(operations).map(value=><option key={value}>{value}</option>)}</select></label>
    <label className="text-sm text-gray-300">Operation<select name="operation" className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded p-2">{operations[connector].map(value=><option key={value}>{value}</option>)}</select></label>
    <label className="text-sm text-gray-300">Acceptance criteria (one per line)<textarea required name="criteria" placeholder={'account linked\nowner notified'} className="mt-1 block w-full bg-gray-950 border border-gray-700 rounded p-2 min-h-24"/></label>
    <label className="text-sm text-gray-300 col-span-full">Typed payload JSON<textarea required name="payload" defaultValue={'{"accountRef":"acct-1","name":"Acme"}'} className="font-mono mt-1 block w-full bg-gray-950 border border-gray-700 rounded p-2 min-h-28"/></label>
    <button className="bg-teal-600 rounded-lg px-4 py-2 font-semibold justify-self-start flex gap-2"><Send className="w-4 h-4"/>Create request</button></form>}
  <section className="space-y-3" aria-busy={loading}>{items.map(item=><article key={item.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 grid md:grid-cols-[1fr_auto] gap-4"><div><div className="flex gap-2 items-center"><strong>{item.title}</strong><span className="text-xs rounded-full bg-teal-950 text-teal-300 px-2 py-1">{item.status}</span></div><p className="text-sm text-gray-400 mt-2">{item.connector} / {item.operation} · version {item.version}</p>{item.provider_receipt&&<p className="text-xs text-emerald-400 flex gap-1"><CheckCircle2 className="w-4 h-4"/>Receipt {item.provider_receipt}</p>}{item.last_error&&<p className="text-xs text-red-400">{item.last_error}</p>}</div><div className="flex flex-wrap gap-2 items-center justify-end">{(nextStates[item.status]||[]).map(state=><button key={state} onClick={()=>transition(item,state)} className="border border-gray-700 rounded-lg px-3 py-2 text-sm flex gap-1 items-center">{state==='approved'&&<ShieldCheck className="w-4 h-4"/>}{state.split('_').join(' ')}</button>)}</div></article>)}{!loading&&!items.length&&<p className="text-gray-500">No workflows are visible for this role and tenant.</p>}</section></div>
}
