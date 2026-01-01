import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
   onSuccess: () => void;
   onSignupClick: () => void;
   onBack: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onSignupClick, onBack }) => {
   const { login, loading } = useAuth();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState<string | null>(null);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      try {
         await login(email, password);
         onSuccess();
      } catch (err: any) {
         const message = err?.response?.data?.error || err?.message || 'Authentication failed';
         setError(message);
      }
   };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
       {/* Cryptographic Background Effects */}
       <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-10 pointer-events-none"></div>
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[15%] left-[10%] font-mono text-[10px] text-primary/20 animate-pulse">HASH_VERIFIED::0x9A...F2</div>
          <div className="absolute bottom-[20%] right-[10%] font-mono text-[10px] text-primary/20 animate-pulse" style={{ animationDelay: '2s' }}>ENCRYPTION::AES-256</div>
          <div className="absolute top-[40%] right-[25%] w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
       </div>

       <div className="w-full max-w-md bg-surface-dark border border-white/10 p-8 relative z-10 shadow-2xl animate-fade-in group">
          {/* Tech/Crypto Corner Accents */}
          <div className="absolute -top-px -left-px w-6 h-6 border-t border-l border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-px -right-px w-6 h-6 border-t border-r border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -bottom-px -left-px w-6 h-6 border-b border-l border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -bottom-px -right-px w-6 h-6 border-b border-r border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="text-center mb-10 relative">
             <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/5 border border-primary/20 mb-4 animate-pulse">
                <span className="material-symbols-outlined text-primary text-xl">encrypted</span>
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight mb-2">SECURE ACCESS</h2>
             <div className="flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                <p className="text-xs text-primary font-mono uppercase tracking-widest">Authorized personnel only</p>
             </div>
          </div>

               <form className="space-y-6" onSubmit={handleSubmit}>
             <div className="group/input">
               <label className="block text-xs font-mono text-gray-500 uppercase mb-2 group-focus-within/input:text-primary transition-colors">Email Address</label>
               <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-600 group-focus-within/input:text-primary material-symbols-outlined text-sm transition-colors">alternate_email</span>
                           <input
                              type="email"
                              className="w-full bg-black border border-white/10 text-white pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                              placeholder="name@company.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                           />
               </div>
             </div>
             
             <div className="group/input">
               <label className="block text-xs font-mono text-gray-500 uppercase mb-2 group-focus-within/input:text-primary transition-colors">Password</label>
               <div className="relative">
                  <span className="absolute left-3 top-3 text-gray-600 group-focus-within/input:text-primary material-symbols-outlined text-sm transition-colors">key</span>
                           <input
                              type="password"
                              className="w-full bg-black border border-white/10 text-white pl-10 pr-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
                              placeholder="••••••••"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                           />
               </div>
             </div>

                   {error && (
                      <div className="text-xs text-red-400 bg-red-900/30 border border-red-500/40 rounded px-3 py-2">
                         {error}
                      </div>
                   )}

             <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 text-gray-400 cursor-pointer hover:text-white transition-colors">
                   <input type="checkbox" className="bg-black border-white/20 rounded-sm text-primary focus:ring-0 focus:ring-offset-0" />
                   Remember me
                </label>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">Forgot password?</a>
             </div>

             <button
               type="submit"
               disabled={loading}
               className="w-full bg-primary hover:bg-cyan-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-bold py-3 uppercase tracking-wider text-sm transition-all relative overflow-hidden group/btn"
             >
                <span className="relative z-10 flex items-center justify-center gap-2">
                   {loading ? 'Authenticating...' : 'Authenticate'} <span className="material-symbols-outlined text-sm">login</span>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
             </button>
          </form>

          <div className="my-8 flex items-center gap-4">
             <div className="h-px bg-white/10 flex-1"></div>
             <span className="text-[10px] text-gray-600 uppercase font-mono">Or connect with</span>
             <div className="h-px bg-white/10 flex-1"></div>
          </div>

          <button className="w-full flex items-center justify-center gap-2 border border-white/10 py-3 text-xs text-gray-400 hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all group/google">
             <span className="material-symbols-outlined text-sm group-hover/google:text-primary transition-colors">grid_view</span>
             Google Workspace Identity
          </button>
          
          <div className="text-center border-t border-white/10 pt-6 mt-6">
             <p className="text-[10px] text-gray-600 font-mono mb-3 uppercase flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[10px]">verified_user</span>
                All access attempts are logged
             </p>
             <button onClick={onSignupClick} className="text-xs text-primary hover:text-white transition-colors font-medium border-b border-transparent hover:border-primary">
                Don't have an account? Register
             </button>
          </div>
          
          <button onClick={onBack} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
             <span className="material-symbols-outlined text-sm">close</span>
          </button>
       </div>
    </div>
  );
};

export default LoginPage;