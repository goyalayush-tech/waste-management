import React from 'react';

const CommandCenter: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background-dark relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent"></div>
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Command Center</p>
          <h2 className="text-4xl md:text-5xl font-bold text-white">Full Spectrum Visibility</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="relative h-[400px] border border-white/10 bg-surface-dark group hover:border-primary/50 transition-colors">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLK8fAIy077TvfiTz-DCXK7pzOlHmp4Iw0cNiYSPlQXhR_8XQGehREENc1Y3eLKqMhMK0snU1HkVe0ScRkMxH9fzxSbBRp9UqxMHb3y0mm5l4XFA0lB9jq5jn7DymPevIZ3rHAVCT3KvIx4S7pM439CTbbFS1eisedZVsbRk77bZyS3sVLbO1yGs-DdUeyaydawIpgVRELSYzdIDkZlOvQUvPf_lDMUrjrjA3ZAlSmGUR_NpVmhMNsy80mg5EALNeC68II3vaTjZYm" 
              alt="Collaborative Review" 
              className="w-full h-full object-cover opacity-50 mix-blend-screen group-hover:opacity-70 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="w-full h-px bg-white/20 mb-4 group-hover:bg-primary transition-colors"></div>
              <h3 className="text-white text-xl font-bold font-mono mb-1">Collaborative Review</h3>
              <p className="text-gray-400 text-xs">Multi-stakeholder secure access.</p>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="relative h-[400px] border border-white/10 bg-surface-dark group hover:border-primary/50 transition-colors">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQBPPDJMOSPmnjPk7L5nAPcWYrTZxcQ8BMDkEmmSRABSNcLF25ACfk7T0gPwzJKWsMLZF9aXOmJKsCcufgPnUhXjptehbGpomp06cWhfLKfIfwdBIS6XHTJ0D-Lp1GLMN6x_SNaA_L-CIUNi-OTunzcg4np91o8zLJX8GiwCgjXWlna2M0byVki2RgCmPtewiGgS2_5nu8By_2DPMPUPzP922j5-QnGYVMVmqMCtmxCymeTiqlqyEuRhJP1cCI05k-tOe3oX0ZFRf9" 
              alt="Global Tracking" 
              className="w-full h-full object-cover opacity-60 mix-blend-screen group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
            
            <div className="absolute top-10 right-10 flex flex-col items-end gap-1">
              <span className="text-[10px] text-primary font-mono bg-primary/10 px-1">NODES: 4,203</span>
              <span className="text-[10px] text-primary font-mono bg-primary/10 px-1">UPTIME: 99.99%</span>
            </div>
            
            <div className="absolute bottom-0 left-0 p-8 w-full">
              <div className="w-full h-px bg-white/20 mb-4 group-hover:bg-primary transition-colors"></div>
              <h3 className="text-white text-xl font-bold font-mono mb-1">Global Tracking</h3>
              <p className="text-gray-400 text-xs">Cross-continental stream monitoring.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CommandCenter;