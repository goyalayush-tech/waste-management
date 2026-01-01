import React from 'react';

interface ClaimDetailProps {
  claimId: string;
  onBack: () => void;
}

const ClaimDetail: React.FC<ClaimDetailProps> = ({ claimId, onBack }) => {
  return (
    <div className="animate-fade-in space-y-6">
       {/* Top Bar */}
       <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <button onClick={onBack} className="text-xs font-mono text-gray-500 hover:text-white flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> BACK
         </button>
         <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-500 text-xs font-bold font-mono tracking-widest flex items-center gap-2">
                 <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                 VERIFIED
             </div>
             <button className="text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined">more_vert</span></button>
         </div>
       </div>

       {/* Header Summary */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
           <div>
               <h1 className="text-3xl font-bold text-white mb-1 font-mono">{claimId}</h1>
               <p className="text-xs text-gray-500 font-mono">SUBMITTED: 2023-10-24 14:32:01 UTC</p>
           </div>
           <div className="flex items-center gap-8">
               <div className="text-right">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest">Material</p>
                   <p className="text-xl text-white font-mono">HDPE Plastic</p>
               </div>
               <div className="text-right">
                   <p className="text-[10px] text-gray-500 uppercase tracking-widest">Weight</p>
                   <p className="text-xl text-white font-mono">2,450 kg</p>
               </div>
           </div>
       </div>

       {/* Main Grid */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
           
           {/* Left Col: Evidence */}
           <div className="lg:col-span-2 space-y-6">
               {/* Image Analysis */}
               <div className="bg-surface-dark border border-white/10 p-1">
                   <div className="relative aspect-video bg-black overflow-hidden group">
                       <img 
                           src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQBPPDJMOSPmnjPk7L5nAPcWYrTZxcQ8BMDkEmmSRABSNcLF25ACfk7T0gPwzJKWsMLZF9aXOmJKsCcufgPnUhXjptehbGpomp06cWhfLKfIfwdBIS6XHTJ0D-Lp1GLMN6x_SNaA_L-CIUNi-OTunzcg4np91o8zLJX8GiwCgjXWlna2M0byVki2RgCmPtewiGgS2_5nu8By_2DPMPUPzP922j5-QnGYVMVmqMCtmxCymeTiqlqyEuRhJP1cCI05k-tOe3oX0ZFRf9" 
                           alt="Evidence" 
                           className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-500"
                       />
                       {/* AI Overlay Mock */}
                       <div className="absolute top-4 left-4 border border-primary/50 bg-primary/10 px-2 py-1 text-[10px] text-primary font-mono">
                           AI_CONFIDENCE: 98.2%
                       </div>
                       <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-green-500/50 rounded-full flex items-center justify-center">
                           <div className="w-1 h-1 bg-green-500"></div>
                       </div>
                       <div className="absolute bottom-4 right-4 text-xs font-mono text-white bg-black/50 px-2">IMG_SOURCE_RAW</div>
                   </div>
                   <div className="p-4 flex gap-2 overflow-x-auto">
                       {[1,2,3].map(i => (
                           <div key={i} className="w-20 h-20 bg-white/5 border border-white/10 hover:border-primary cursor-pointer transition-colors"></div>
                       ))}
                   </div>
               </div>

               {/* OCR Data */}
               <div className="bg-surface-dark border border-white/10 p-6">
                   <h3 className="text-sm font-bold text-white uppercase mb-4 flex items-center gap-2">
                       <span className="material-symbols-outlined text-primary text-sm">description</span>
                       OCR Extracted Data
                   </h3>
                   <div className="grid grid-cols-2 gap-4 text-xs font-mono bg-black p-4 border border-white/5">
                       <div className="space-y-1">
                           <span className="text-gray-500 block">VENDOR</span>
                           <span className="text-white block">APEX WASTE MANAGEMENT</span>
                       </div>
                       <div className="space-y-1">
                           <span className="text-gray-500 block">TICKET #</span>
                           <span className="text-white block">T-899210</span>
                       </div>
                       <div className="space-y-1">
                           <span className="text-gray-500 block">DATE</span>
                           <span className="text-white block">OCT 24 2023</span>
                       </div>
                       <div className="space-y-1">
                           <span className="text-gray-500 block">GROSS WEIGHT</span>
                           <span className="text-white block">12,450 LBS</span>
                       </div>
                   </div>
               </div>
           </div>

           {/* Right Col: Score & Risk */}
           <div className="space-y-6">
               
               {/* ClaimClean Score */}
               <div className="bg-surface-dark border border-white/10 p-6 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none"></div>
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Trust Score</h3>
                   <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                       <svg className="w-full h-full transform -rotate-90">
                           <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-800" />
                           <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-primary" strokeDasharray="440" strokeDashoffset="44" />
                       </svg>
                       <div className="absolute inset-0 flex items-center justify-center flex-col">
                           <span className="text-4xl font-mono font-bold text-white">98</span>
                           <span className="text-[10px] text-primary uppercase">Excellent</span>
                       </div>
                   </div>
               </div>

               {/* Risk Flags */}
               <div className="bg-surface-dark border border-white/10 p-6">
                   <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Risk Analysis</h3>
                   <ul className="space-y-3">
                       <li className="flex items-start gap-3">
                           <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                           <div>
                               <p className="text-xs text-white">GPS Coordinates Match</p>
                               <p className="text-[10px] text-gray-500">Facility geofence verified</p>
                           </div>
                       </li>
                       <li className="flex items-start gap-3">
                           <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                           <div>
                               <p className="text-xs text-white">Volume/Weight Ratio</p>
                               <p className="text-[10px] text-gray-500">Within standard deviation</p>
                           </div>
                       </li>
                       <li className="flex items-start gap-3">
                           <span className="material-symbols-outlined text-yellow-500 text-sm mt-0.5">warning</span>
                           <div>
                               <p className="text-xs text-white">Historical Anomaly</p>
                               <p className="text-[10px] text-gray-500">12% higher than weekly avg</p>
                           </div>
                       </li>
                   </ul>
               </div>

               {/* Blockchain Hash */}
               <div className="bg-black border border-white/10 p-4">
                   <p className="text-[10px] font-mono text-gray-500 uppercase mb-2">Immutable Ledger Hash</p>
                   <div className="bg-white/5 p-2 rounded border border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-colors">
                       <code className="text-[10px] text-primary truncate w-4/5">0x7f83b...9a2c</code>
                       <span className="material-symbols-outlined text-gray-500 text-xs group-hover:text-white">content_copy</span>
                   </div>
               </div>

           </div>
       </div>

       {/* Audit Trail */}
       <div className="bg-surface-dark border border-white/10 p-6 mt-6">
           <h3 className="text-sm font-bold text-white uppercase mb-6">Audit Trail</h3>
           <div className="relative border-l border-white/10 ml-2 pl-6 space-y-8">
               {[
                   { status: 'Claim Verified', user: 'System (AI Core)', time: 'Today, 14:35', active: true },
                   { status: 'L1 Validation', user: 'System', time: 'Today, 14:32', active: false },
                   { status: 'Claim Submitted', user: 'Facility_Manager_01', time: 'Today, 14:32', active: false },
               ].map((log, i) => (
                   <div key={i} className="relative">
                       <div className={`absolute -left-[31px] w-3 h-3 rounded-full border border-black ${log.active ? 'bg-primary' : 'bg-gray-700'}`}></div>
                       <p className="text-xs font-bold text-white">{log.status}</p>
                       <p className="text-[10px] font-mono text-gray-500">{log.user} • {log.time}</p>
                   </div>
               ))}
           </div>
       </div>
    </div>
  );
};

export default ClaimDetail;