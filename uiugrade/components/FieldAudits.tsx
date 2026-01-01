import React from 'react';

const FieldAudits: React.FC = () => {
  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      <div className="flex justify-between items-end mb-8 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">FIELD OPERATIONS</h2>
          <div className="flex items-center gap-2 mt-1">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <p className="text-xs font-mono text-gray-500">GPS: ACTIVE [34.0522° N, 118.2437° W]</p>
          </div>
        </div>
        <button className="bg-white text-black px-4 py-2 text-xs font-bold font-mono uppercase hover:bg-gray-200 transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">sync</span>
            Sync Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Schedule List */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Upcoming Schedule</h3>
          {[
            { id: 'AUD-2023-X1', facility: 'Apex Materials', status: 'IN_PROGRESS', time: 'Now' },
            { id: 'AUD-2023-X2', facility: 'GreenCycle Inc', status: 'SCHEDULED', time: '14:00' },
            { id: 'AUD-2023-X3', facility: 'EcoLoop Systems', status: 'PENDING', time: 'Tomorrow' },
          ].map((audit, i) => (
             <div key={i} className={`p-4 border ${audit.status === 'IN_PROGRESS' ? 'bg-primary/5 border-primary' : 'bg-surface-dark border-white/10'} hover:border-white/30 transition-colors cursor-pointer group`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold text-white">{audit.facility}</span>
                   <span className="text-[10px] font-mono text-gray-500">{audit.time}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] font-mono text-gray-400">{audit.id}</span>
                   <span className={`text-[10px] px-1.5 py-0.5 border ${
                       audit.status === 'IN_PROGRESS' ? 'border-primary text-primary' : 'border-gray-600 text-gray-500'
                   }`}>
                       {audit.status}
                   </span>
                </div>
             </div>
          ))}
        </div>

        {/* Active Audit Interface */}
        <div className="lg:col-span-2 bg-surface-dark border border-white/10 p-6 relative">
           <div className="absolute top-0 right-0 p-2 bg-primary/10 text-primary text-[10px] font-mono font-bold border-l border-b border-primary/20">
              LIVE AUDIT SESSION
           </div>
           
           <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-1">Apex Materials - Facility A</h3>
              <p className="text-xs text-gray-500 font-mono">ID: FAC-004 • TYPE: UNSCHEDULED SPOT CHECK</p>
           </div>

           <div className="space-y-6">
              
              {/* Checklist */}
              <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-3 border-b border-white/5 pb-2">Compliance Checklist</h4>
                  <div className="space-y-2">
                      {[
                          'Scale calibration certificate verified',
                          'Material separation barriers intact',
                          'No unauthorized hazardous waste detected',
                          'Digital logs match physical inventory'
                      ].map((item, i) => (
                          <label key={i} className="flex items-center gap-3 p-2 hover:bg-white/5 transition-colors cursor-pointer">
                              <input type="checkbox" className="bg-black border-white/20 rounded-sm text-primary focus:ring-0 focus:ring-offset-0" />
                              <span className="text-sm text-gray-300">{item}</span>
                          </label>
                      ))}
                  </div>
              </div>

              {/* Photo Capture */}
              <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-3 border-b border-white/5 pb-2">Evidence Capture</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="aspect-square bg-black border-2 border-dashed border-white/20 hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors text-gray-500 hover:text-white">
                          <span className="material-symbols-outlined mb-1">photo_camera</span>
                          <span className="text-[10px] uppercase">Add Photo</span>
                      </div>
                      <div className="aspect-square bg-white/5 border border-white/10 relative">
                          <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full border border-black"></div>
                      </div>
                  </div>
              </div>

              {/* Notes */}
               <div>
                  <h4 className="text-xs font-bold text-white uppercase mb-3 border-b border-white/5 pb-2">Field Notes</h4>
                  <textarea className="w-full bg-black border border-white/10 text-white p-3 text-xs focus:border-primary outline-none font-mono min-h-[80px]" placeholder="Observations..."></textarea>
              </div>

              <div className="pt-4 flex justify-end">
                  <button className="bg-primary text-black px-6 py-3 text-xs font-bold uppercase hover:bg-white transition-colors">
                      Complete Audit
                  </button>
              </div>

           </div>
        </div>

      </div>
    </div>
  );
};

export default FieldAudits;