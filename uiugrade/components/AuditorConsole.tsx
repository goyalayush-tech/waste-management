import React, { useState } from 'react';

const AuditorConsole: React.FC = () => {
  const [selectedClaim, setSelectedClaim] = useState<string | null>('CLM-FLAG-9921');

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 animate-fade-in">
      {/* Queue Panel */}
      <div className="w-1/3 bg-surface-dark border border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest">Flagged Queue</h3>
          <span className="bg-red-500/20 text-red-500 text-[10px] font-mono px-2 py-0.5 border border-red-500/30">4 PENDING</span>
        </div>
        <div className="overflow-y-auto flex-1">
          {[
            { id: 'CLM-FLAG-9921', risk: 'HIGH', reason: 'Mass Anomaly (+15%)', time: '10m ago' },
            { id: 'CLM-FLAG-9922', risk: 'MED', reason: 'Geofence Mismatch', time: '24m ago' },
            { id: 'CLM-FLAG-9924', risk: 'LOW', reason: 'Blurry Evidence', time: '1h ago' },
            { id: 'CLM-FLAG-9928', risk: 'MED', reason: 'Duplicate Ticket', time: '3h ago' },
          ].map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedClaim(item.id)}
              className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors group ${selectedClaim === item.id ? 'bg-white/5 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}
            >
              <div className="flex justify-between mb-1">
                <span className={`font-mono text-xs font-bold ${selectedClaim === item.id ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{item.id}</span>
                <span className="text-[10px] text-gray-600 font-mono">{item.time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">{item.reason}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 ${
                  item.risk === 'HIGH' ? 'bg-red-500/10 text-red-500' : 
                  item.risk === 'MED' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'
                }`}>
                  {item.risk}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workspace Panel */}
      <div className="flex-1 bg-surface-dark border border-white/10 flex flex-col relative overflow-hidden">
        {selectedClaim ? (
          <>
             {/* Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-black/20">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-2xl font-bold text-white font-mono tracking-tight">{selectedClaim}</h2>
                  <span className="bg-red-500 text-black text-[10px] font-bold px-2 py-0.5 uppercase">Audit Required</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">DETECTED BY: AI_MOD_V4 • REASON: MASS_DEVIATION_DETECTED</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white font-mono">42<span className="text-sm text-gray-500">/100</span></div>
                <div className="text-[10px] text-red-500 uppercase tracking-widest">Risk Score</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Risk Explanation */}
              <div className="bg-red-500/5 border border-red-500/20 p-4">
                <h4 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  Risk Analysis
                </h4>
                <p className="text-sm text-gray-300 leading-relaxed font-mono">
                  The claimed weight (12,450 kg) deviates by <span className="text-white font-bold">15.2%</span> from the historical average for this container type (10,800 kg). 
                  Visual density analysis suggests potential moisture contamination or foreign object inclusion.
                </p>
              </div>

              {/* Score Breakdown */}
              <div>
                 <h4 className="text-xs font-bold text-white uppercase mb-4">Score Factors</h4>
                 <div className="space-y-3">
                   <div>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="text-gray-400">Metadata Integrity</span>
                       <span className="text-green-500">PASS</span>
                     </div>
                     <div className="h-1 bg-white/10 w-full"><div className="h-full bg-green-500 w-full"></div></div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="text-gray-400">Visual Confirmation</span>
                       <span className="text-yellow-500">WARNING</span>
                     </div>
                     <div className="h-1 bg-white/10 w-full"><div className="h-full bg-yellow-500 w-[60%]"></div></div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs mb-1">
                       <span className="text-gray-400">Weight Variance</span>
                       <span className="text-red-500">CRITICAL FAIL</span>
                     </div>
                     <div className="h-1 bg-white/10 w-full"><div className="h-full bg-red-500 w-[15%]"></div></div>
                   </div>
                 </div>
              </div>

              {/* Evidence Strip */}
              <div>
                 <h4 className="text-xs font-bold text-white uppercase mb-4">Corroborating Evidence</h4>
                 <div className="flex gap-4">
                   <div className="w-32 h-24 bg-white/5 border border-white/10 relative group cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Scale Ticket</div>
                   </div>
                   <div className="w-32 h-24 bg-white/5 border border-white/10 relative group cursor-pointer hover:border-primary/50 transition-colors">
                      <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">Gate Cam 01</div>
                   </div>
                 </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="p-6 border-t border-white/10 bg-black/40">
              <div className="mb-4">
                <label className="block text-[10px] font-mono text-gray-500 uppercase mb-2">Mandatory Audit Note</label>
                <textarea 
                  className="w-full bg-black border border-white/20 text-white p-3 text-xs focus:border-primary outline-none font-mono min-h-[80px]"
                  placeholder="Enter detailed justification for decision..."
                ></textarea>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                  <span className="material-symbols-outlined text-sm">vpn_key</span>
                  DIGITAL_SIGNATURE_READY
                </div>
                <div className="flex gap-3">
                  <button className="px-6 py-2 border border-red-500/50 text-red-500 text-xs font-bold uppercase hover:bg-red-500 hover:text-black transition-colors">
                    Reject Claim
                  </button>
                  <button className="px-6 py-2 bg-green-500 hover:bg-green-400 text-black text-xs font-bold uppercase transition-colors">
                    Approve & Sign
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
             <span className="material-symbols-outlined text-4xl mb-2">fact_check</span>
             <p className="text-xs font-mono uppercase">Select a claim to audit</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditorConsole;