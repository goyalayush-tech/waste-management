import React from 'react';

const DefenseDepth: React.FC = () => {
  return (
    <section className="py-32 px-4 bg-black relative border-t border-white/10">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="relative max-w-5xl mx-auto z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
          <div className="md:col-span-1">
            <p className="text-xs font-mono text-primary mb-4">CORE TECHNOLOGY</p>
            <h2 className="text-4xl font-bold text-white mb-6">Defense in Depth.</h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              Our stack is built on principles of zero-trust and cryptographic verification. It's not just compliance; it's mathematical certainty.
            </p>
            <a href="#" className="text-white text-xs font-mono border-b border-primary pb-1 inline-block hover:text-primary transition-colors">READ WHITE PAPER -&gt;</a>
          </div>
          
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-primary">visibility</span>
                <span className="text-[10px] font-mono text-gray-500">LAYER_01</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Computer Vision</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Multi-spectral analysis identifies material composition with 99.8% accuracy at disposal.
              </p>
            </div>
            
            <div className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-primary">link</span>
                <span className="text-[10px] font-mono text-gray-500">LAYER_02</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Immutable Ledger</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                SHA-256 hashing ensures data integrity. Once written, records cannot be altered.
              </p>
            </div>
            
            <div className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-primary">near_me</span>
                <span className="text-[10px] font-mono text-gray-500">LAYER_03</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Geo-Spatial Lock</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                GPS telemetry binds every claim to a specific physical coordinate and UTC timestamp.
              </p>
            </div>
            
            <div className="p-6 border border-white/10 bg-white/5 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="material-symbols-outlined text-primary">api</span>
                <span className="text-[10px] font-mono text-gray-500">LAYER_04</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">API Gateway</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Restful endpoints for seamless integration with existing ERP and SAP systems.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-24 pt-12 border-t border-dashed border-gray-800 grid grid-cols-2 md:grid-cols-4 gap-8 text-center font-mono">
          <div>
            <p className="text-3xl font-bold text-white mb-1">AES-256</p>
            <p className="text-[10px] text-gray-500 uppercase">Encryption Standard</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">&lt;20ms</p>
            <p className="text-[10px] text-gray-500 uppercase">Network Latency</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">99.99%</p>
            <p className="text-[10px] text-gray-500 uppercase">SLA Guarantee</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-white mb-1">SOC 2</p>
            <p className="text-[10px] text-gray-500 uppercase">Type II Certified</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DefenseDepth;