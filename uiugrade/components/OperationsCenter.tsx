import React from 'react';

const OperationsCenter: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-black border-y border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-2 h-2 bg-primary"></div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest">Global Operations Center</p>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-none tracking-tight">
              The ultimate validation. <br />
              <span className="text-gray-600">Wherever you operate.</span>
            </h2>
            
            <p className="text-gray-400 mb-8 max-w-md font-light">
              ClaimClean turns any facility into a verified data node. Scale compliance efforts globally without leaving the control center.
            </p>
            
            <ul className="space-y-4 font-mono text-sm text-gray-300">
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span>ISO 14001 Compliant Workflows</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span>Real-time Anomaly Detection</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                <span>Cross-border Data Sovereignty</span>
              </li>
            </ul>
          </div>
          
          <div className="relative rounded-lg overflow-hidden border border-white/20">
            <div className="absolute top-4 left-4 z-20 flex gap-2">
              <div className="bg-black/80 text-primary text-[10px] font-mono px-2 py-1 border border-primary/30">REC ●</div>
              <div className="bg-black/80 text-white text-[10px] font-mono px-2 py-1 border border-white/20">CAM_04</div>
            </div>
            
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDVswB8xReJGlwrC-eQRGJbgpz65tU_SI64WMH-NHtZ9f3yJbKzeZGDp2YtKKSaHmfSElWvnvTJ4rr0cgONP79lMlVaaHX5BAdmUO_iyfd0dSKQxm0-3KhPDxjpZVrA4QJtsG6DkUQgJKHUDQ37otkkgVsQJZnBoAMhizpOIPWBow8bnX62tpGIrT6-omWs4yfWr6Fkl-hhWdtEouvSC4VJUSo0e9751MeQ0cP16KLZD7RMtF2VWExLO2vpVMjQyZMmvRsevcJreavq" 
              alt="Office View" 
              className="w-full h-auto object-cover opacity-80 mix-blend-luminosity filter contrast-125"
            />
            
            <div className="absolute inset-0 bg-primary/5 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-primary/20"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-px bg-primary/20"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OperationsCenter;