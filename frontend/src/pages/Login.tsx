import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Brain } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api.login(email, password);
      localStorage.setItem('token', data.token);
      navigate('/sources');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = () => {
    setEmail('demo@companyos.ai');
    setPassword('demo123');
    setTimeout(() => {
      document.getElementById('login-form')?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">CompanyOS</h1>
          <p className="text-gray-400 mt-2">AI Operating System for Companies</p>
        </div>
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-8">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" required />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-teal-500 hover:bg-teal-400 text-gray-950 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <button onClick={demoLogin} className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors text-sm border border-gray-700">
            Demo Login
          </button>
        </div>
      </div>
    </div>
  );
}
