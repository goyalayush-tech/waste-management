import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden pt-32 pb-12">
      <div className="absolute inset-0 grid-bg bg-grid-pattern opacity-10 pointer-events-none"></div>
      
      <div className="z-10 animate-fade-in space-y-6 max-w-5xl mx-auto relative">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-white/10 rounded-full bg-white/5 backdrop-blur-sm mb-4">
          <span className="material-symbols-outlined text-primary text-sm">encrypted</span>
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Enterprise Grade Encryption</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[0.9]">
          Compliance Runs on Claims. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-white to-gray-400">Trust is Mathematical.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-lg text-text-silver font-light">
          Forensic-level waste management verification. Immutable ledgers, AI-driven auditing, and infinite scale for the global enterprise.
        </p>
        
        <div className="pt-8 flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6 items-center">
          <a href="#" className="bg-white text-black hover:bg-gray-200 px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-colors w-full md:w-auto">
            Deploy Infrastructure
          </a>
          <a href="#" className="border border-white/20 hover:border-white/50 text-white px-8 py-3 font-mono text-sm font-bold uppercase tracking-wider transition-colors w-full md:w-auto flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">terminal</span>
            View Documentation
          </a>
        </div>
      </div>

      <div className="relative w-full max-w-6xl mt-16 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="relative aspect-[21/9] bg-surface-dark border border-white/10 overflow-hidden shadow-2xl shadow-primary/5">
          <div className="scan-overlay"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50 animate-pulse"></div>
          
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAUtkLikWROCnqN65idzEK_CifNMqLnp6FDskMQpJJrAqunYH1i-1OZi5hjOoOK9lNCwxxUvYd88dWfH-6odGyzSmsM68o7UDFMmf33isz8heqiHxj55-h4Pxs9vMuXP5v8Wg83aLdpTDsQiiwv4Qd-IyNaGBYJDNpP4v_oUkFDRHGOtdqa_Z0clYF7eKniFYo1WwBdRNqsf_ChcwLySNZPBbOeLnig-vZxD8DhtLsjqcdhiYTnP1kx8AWPzm_TlscCrFuyRHjStFnT" 
            alt="Abstract crystalline digital structure" 
            className="w-full h-full object-cover opacity-60 mix-blend-luminosity hover:opacity-80 transition-opacity duration-700"
          />
          
          <div className="absolute top-6 left-6 flex flex-col gap-1">
            <span className="text-[10px] font-mono text-primary uppercase">[SECURE_CONNECTION]</span>
            <span className="text-xs font-mono text-white">BLOCK: #8920193</span>
          </div>
          
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div className="bg-black/80 backdrop-blur-md border border-white/10 p-4 min-w-[200px] tech-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Status</span>
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              </div>
              <div className="text-white font-mono text-xl tracking-tighter">VERIFIED_100%</div>
              <div className="mt-2 text-[10px] text-gray-600 font-mono break-all">
                0x7F28B...3A9C1
              </div>
            </div>
            
            <div className="hidden md:flex gap-2">
              <div className="px-3 py-1 bg-black/60 border border-white/10 text-[10px] font-mono text-gray-400">LAYER 1: SENSOR</div>
              <div className="px-3 py-1 bg-black/60 border border-white/10 text-[10px] font-mono text-gray-400">LAYER 2: HASH</div>
              <div className="px-3 py-1 bg-black/60 border border-white/10 text-[10px] font-mono text-primary border-primary/30">LAYER 3: AUDIT</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;