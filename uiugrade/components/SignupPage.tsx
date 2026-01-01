import React from 'react';

interface SignupPageProps {
  onSuccess: () => void;
  onLoginClick: () => void;
  onBack: () => void;
}

const SignupPage: React.FC<SignupPageProps> = ({ onSuccess, onLoginClick, onBack }) => {
  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-4 relative overflow-hidden">
       {/* Cryptographic Background Effects */}
       <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-10 pointer-events-none"></div>
       <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] right-[15%] font-mono text-[10px] text-primary/20 animate-pulse">INIT_SEQ::START</div>
          <div className="absolute bottom-[15%] left-[5%] font-mono text-[10px] text-primary/20 animate-pulse" style={{ animationDelay: '1.5s' }}>NODE_REGISTRATION::ACTIVE</div>
          <div className="absolute bottom-[40%] left-[20%] w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50"></div>
       </div>

       <div className="w-full max-w-lg bg-surface-dark border border-white/10 p-8 relative z-10 shadow-2xl animate-fade-in group">
          {/* Tech/Crypto Corner Accents */}
          <div className="absolute -top-px -left-px w-6 h-6 border-t border-l border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -top-px -right-px w-6 h-6 border-t border-r border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -bottom-px -left-px w-6 h-6 border-b border-l border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="absolute -bottom-px -right-px w-6 h-6 border-b border-r border-primary opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="text-center mb-8 relative">
             <div className="absolute top-0 right-0 p-2 border border-white/10 bg-black/50 text-[10px] font-mono text-gray-500 uppercase">
                Step 1/3
             </div>
             <h2 className="text-2xl font-bold text-white tracking-tight mb-2">ORGANIZATION REGISTRATION</h2>
             <p className="text-xs text-gray-500 font-mono flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span>
                Accounts subject to verification
             </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Full Name</label>
                   <input type="text" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                 </div>
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Phone</label>
                   <input type="tel" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                 </div>
             </div>

             <div>
               <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Work Email</label>
               <input type="email" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
             </div>

             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Organization</label>
                   <input type="text" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                 </div>
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Role</label>
                   <select className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none">
                      <option>Recycler</option>
                      <option>Auditor</option>
                      <option>Producer</option>
                   </select>
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Password</label>
                   <input type="password" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                 </div>
                 <div>
                   <label className="block text-xs font-mono text-gray-500 uppercase mb-2">Confirm</label>
                   <input type="password" className="w-full bg-black border border-white/10 text-white px-4 py-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
                 </div>
             </div>

             <div className="pt-2">
                <label className="flex items-start gap-2 text-xs text-gray-400 cursor-pointer hover:text-white transition-colors">
                   <input type="checkbox" className="mt-0.5 bg-black border-white/20 rounded-sm text-primary focus:ring-0 focus:ring-offset-0" />
                   <span className="leading-tight">I agree to the Terms of Service and Data Processing Agreement.</span>
                </label>
             </div>

             <button type="submit" className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 uppercase tracking-wider text-sm transition-colors mt-4 relative group/btn overflow-hidden">
                <span className="relative z-10">Request Access</span>
                <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
             </button>
          </form>
          
          <div className="text-center pt-6 mt-2 border-t border-white/5">
             <button onClick={onLoginClick} className="text-xs text-gray-500 hover:text-primary transition-colors border-b border-transparent hover:border-primary">
                Already have an account? Login
             </button>
          </div>

          <button onClick={onBack} className="absolute top-4 right-4 text-gray-600 hover:text-white transition-colors">
             <span className="material-symbols-outlined text-sm">close</span>
          </button>
       </div>
    </div>
  );
};

export default SignupPage;