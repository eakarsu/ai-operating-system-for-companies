import { useState } from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';
import AIReport from './AIReport';

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
      <AIReport response={result} title="AI response" />
    </div>
  );
}
