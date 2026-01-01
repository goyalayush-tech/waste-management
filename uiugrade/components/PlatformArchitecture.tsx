import React from 'react';

const PlatformArchitecture: React.FC = () => {
  return (
    <section className="py-24 bg-background-dark relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 flex justify-between items-end">
        <div>
          <p className="text-xs font-mono text-primary mb-2">SYSTEM MODULES</p>
          <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">Platform Architecture.</h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button className="w-10 h-10 border border-white/20 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <button className="w-10 h-10 border border-white/20 hover:bg-white/10 flex items-center justify-center text-white transition-colors">
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
        </div>
      </div>
      
      <div className="flex overflow-x-auto snap-x snap-mandatory space-x-6 px-4 sm:px-8 pb-12 hide-scrollbar">
        {/* Module 1 */}
        <div className="snap-center shrink-0 w-[85vw] md:w-[50vw] lg:w-[35vw] relative group cursor-pointer">
          <div className="relative aspect-[4/3] bg-surface-dark border border-white/10 hover:border-primary/50 transition-colors duration-300 overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXz9EvLJrixIha6whNqbDkkJ_6pGsKeDelUslSOAPBoLzkDLc2IUH4_VSmYYn_N-SuAd6j_z4LIGcgtQzkpix4_E2YRchE_fJ2eo0ppBCswhq5tI-zMEnuOAdzqYcT0Nw_zf4UkH2f6B0V6MzTJ-AbkuE9Agg_rtLlpxe4VuJrFs6sCz6GzzcEoVzvWgqZGNbhdht7kC_ZRCV8c72geKdaGJck0apGeDyf-gdo5aYobXT9_1IFsaK9L9zT2GAlqEB8cA8oQ0zhjjRk" 
              alt="Digital Twin" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
            
            <div className="absolute top-4 left-4 font-mono text-[10px] text-primary border border-primary/30 px-2 py-1 bg-black/50">
              MODULE_01
            </div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white font-mono">The Digital Twin</h3>
                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">hub</span>
              </div>
              <p className="text-gray-400 text-xs font-mono leading-relaxed">
                Real-time mirroring of physical assets. Spatial data integration for complete facility oversight.
              </p>
            </div>
          </div>
        </div>

        {/* Module 2 */}
        <div className="snap-center shrink-0 w-[85vw] md:w-[50vw] lg:w-[35vw] relative group cursor-pointer">
          <div className="relative aspect-[4/3] bg-surface-dark border border-white/10 hover:border-primary/50 transition-colors duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAV8D6s1HAxK58mJDIVejekPmOJlVqTZfShisVG7-coa-ybrYvUqhxjtRvN42gHtC7A38oroh590EgyrCxspf2y8pgE04X5BxTLNJCzezKAn9OSPEq0Io5Qk3_YAxtOH4GNT9J8x-_MJpSL34OGxlAId4wGJvwWkLxLNNCVzKnI4VZibAbt7mzY9n3SSfMXNI5pcOz6MgBRGuyaffBSFdXrUNjqIM6PdzEMqCrcT4Q5EYWLLNPUJZ6-3h9PBTIwsu8uss-7NtLUKlVi" 
              alt="Security Interface" 
              className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 border border-primary/30 rounded-full"></div>
                <div className="absolute inset-4 border border-primary/20 rounded-full border-dashed animate-spin-slow" style={{ animationDuration: '10s' }}></div>
                <div className="absolute inset-0 flex items-center justify-center flex-col bg-black/80 backdrop-blur-xl rounded-full border border-white/10 shadow-lg shadow-primary/20">
                  <span className="text-4xl font-bold text-white font-mono tracking-tighter">98.4</span>
                  <span className="text-[10px] text-primary uppercase tracking-widest mt-1">Trust Score</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-primary/10 to-transparent w-full h-full rounded-full animate-pulse opacity-20"></div>
              </div>
            </div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white font-mono">Dynamic Scoring</h3>
                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">radar</span>
              </div>
              <p className="text-gray-400 text-xs font-mono leading-relaxed">
                Algorithmically generated trust metrics based on multi-vector sensor inputs.
              </p>
            </div>
          </div>
        </div>

        {/* Module 3 */}
        <div className="snap-center shrink-0 w-[85vw] md:w-[50vw] lg:w-[35vw] relative group cursor-pointer">
          <div className="relative aspect-[4/3] bg-surface-dark border border-white/10 hover:border-primary/50 transition-colors duration-300 overflow-hidden">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuANtYvIKeILxZsIAncpjifnDJ49oz7xXqD2qxt4AbJ3OkDO37lWelUJJhHuxGxiLAczSMv554Sv6Y5ceNqTCJydQu8KOeC5FvmzH8_Basjju0oHExVXLGvOx3SzphuZ57JgElPMrF2x4ebhb1h8iHall5RhThLeZgbkAEbfqufm4rUL-Up13IoaZvanInx_eFWzxpcidpS2zYRliYmJjVpSEX98jk15Ag2aB23BHaXRHX8hq2Kfm7xqjJfvteocBnRtTLZcraGrIXne" 
              alt="Hardware Sensors" 
              className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-90 transition-opacity"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
            
            <div className="absolute top-4 left-4 font-mono text-[10px] text-primary border border-primary/30 px-2 py-1 bg-black/50">
              MODULE_03
            </div>
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between items-end border-b border-white/10 pb-4 mb-4">
                <h3 className="text-xl font-bold text-white font-mono">Edge Hardware</h3>
                <span className="material-symbols-outlined text-gray-500 group-hover:text-primary transition-colors">memory</span>
              </div>
              <p className="text-gray-400 text-xs font-mono leading-relaxed">
                Proprietary sensor arrays designed for harsh industrial environments. Direct-to-ledger connectivity.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlatformArchitecture;