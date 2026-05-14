import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

function formatText(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-bold text-white mt-2">{line.slice(2,-2)}</p>;
    if (line.startsWith('- ')||line.startsWith('• ')) return <li key={i} className="ml-4 text-gray-200">{line.slice(2)}</li>;
    if (line.match(/^\d+\./)) return <li key={i} className="ml-4 text-gray-200 list-decimal">{line.replace(/^\d+\.\s*/,'')}</li>;
    if (line.startsWith('## ')) return <h3 key={i} className="font-semibold text-teal-300 mt-3 text-base">{line.slice(3)}</h3>;
    if (line.startsWith('# ')) return <h2 key={i} className="font-bold text-white mt-3 text-lg">{line.slice(2)}</h2>;
    if (line==='') return <br key={i} />;
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return <p key={i} className="text-gray-200">{parts.map((p,j)=>p.startsWith('**')&&p.endsWith('**')?<strong key={j} className="text-white">{p.slice(2,-2)}</strong>:p)}</p>;
  });
}

export default function AIResponse({ result, loading }: { result: string|null; loading: boolean }) {
  const [copied, setCopied] = useState(false);
  if (loading) return (
    <div className="bg-gradient-to-br from-teal-900/50 to-emerald-900/50 border border-teal-700/50 rounded-xl p-6 mt-4">
      <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-teal-400 animate-pulse" /><span className="text-teal-300 font-medium">AI is thinking...</span></div>
      <div className="space-y-2">{[1,2,3,4].map(i=><div key={i} className="h-4 bg-teal-800/50 rounded animate-pulse" />)}</div>
    </div>
  );
  if (!result) return null;
  return (
    <div className="bg-gradient-to-br from-teal-900/50 to-emerald-900/50 border border-teal-700/50 rounded-xl p-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-teal-400" /><span className="text-teal-300 font-medium">AI Response</span></div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</span>
          <button onClick={()=>{if(result){navigator.clipboard.writeText(result);setCopied(true);setTimeout(()=>setCopied(false),2000);}}} className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors">{copied?<Check className="w-3.5 h-3.5 text-green-400"/>:<Copy className="w-3.5 h-3.5"/>}{copied?'Copied':'Copy'}</button>
        </div>
      </div>
      <div className="space-y-1 text-sm leading-relaxed">{formatText(result)}</div>
    </div>
  );
}
