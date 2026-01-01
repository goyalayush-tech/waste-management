import React, { useState } from 'react';

interface NewClaimProps {
  onNavigate: (view: string) => void;
}

const NewClaim: React.FC<NewClaimProps> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, label: 'Metadata' },
    { num: 2, label: 'Material' },
    { num: 3, label: 'Evidence' },
    { num: 4, label: 'Review' }
  ];

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
         <button onClick={() => onNavigate('claims')} className="text-xs font-mono text-gray-500 hover:text-white mb-2 flex items-center gap-1 transition-colors">
            <span className="material-symbols-outlined text-sm">arrow_back</span> BACK TO REGISTRY
         </button>
         <h2 className="text-2xl font-bold text-white tracking-tight">NEW CLAIM SUBMISSION</h2>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-px bg-white/10 -z-10"></div>
          {steps.map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-background-dark px-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm border ${
                      step >= s.num ? 'bg-primary text-black border-primary' : 'bg-black text-gray-500 border-white/20'
                  }`}>
                      {s.num}
                  </div>
                  <span className={`text-[10px] uppercase font-mono tracking-widest ${step >= s.num ? 'text-primary' : 'text-gray-600'}`}>
                      {s.label}
                  </span>
              </div>
          ))}
      </div>

      {/* Content Form */}
      <div className="bg-surface-dark border border-white/10 p-8 min-h-[400px]">
          
          {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-xs font-mono text-gray-500 uppercase">Recycler ID</label>
                          <input type="text" className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm" placeholder="RCY-..." />
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-mono text-gray-500 uppercase">Facility Location</label>
                          <select className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm">
                              <option>Facility A - North America</option>
                              <option>Facility B - Europe</option>
                          </select>
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono text-gray-500 uppercase">Batch Reference Code</label>
                      <input type="text" className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm" placeholder="BTC-2023-..." />
                  </div>
                  <div className="bg-blue-900/10 border border-blue-500/20 p-4 flex gap-3">
                      <span className="material-symbols-outlined text-blue-400">info</span>
                      <p className="text-xs text-blue-200 leading-relaxed">
                          Ensure Recycler ID matches the physical manifest. Mismatched IDs will trigger an automatic L2 Audit.
                      </p>
                  </div>
              </div>
          )}

          {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                          <label className="text-xs font-mono text-gray-500 uppercase">Material Type</label>
                          <select className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm">
                              <option>HDPE Plastic</option>
                              <option>PET Clear</option>
                              <option>Aluminum</option>
                          </select>
                      </div>
                      <div className="space-y-2">
                          <label className="text-xs font-mono text-gray-500 uppercase">Net Weight (kg)</label>
                          <input type="number" className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm" placeholder="0.00" />
                      </div>
                  </div>
                  <div className="space-y-2">
                      <label className="text-xs font-mono text-gray-500 uppercase">Source Stream</label>
                      <input type="text" className="w-full bg-black border border-white/20 text-white p-3 focus:border-primary outline-none text-sm" placeholder="e.g. Municipal Collection" />
                  </div>
              </div>
          )}

          {step === 3 && (
              <div className="space-y-8 animate-fade-in">
                  <div className="space-y-4">
                      <label className="text-xs font-mono text-gray-500 uppercase">Upload Scale Ticket</label>
                      <div className="border-2 border-dashed border-white/10 hover:border-primary/50 transition-colors rounded-lg p-8 text-center cursor-pointer">
                          <span className="material-symbols-outlined text-gray-500 text-3xl mb-2">cloud_upload</span>
                          <p className="text-sm text-gray-300">Drag & drop or click to upload</p>
                          <p className="text-xs text-gray-600 mt-2">Supports JPG, PNG, PDF (Max 10MB)</p>
                      </div>
                  </div>
                   <div className="space-y-4">
                      <label className="text-xs font-mono text-gray-500 uppercase">Material Photos (Visual Proof)</label>
                      <div className="grid grid-cols-3 gap-4">
                          <div className="aspect-square bg-white/5 border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                              <span className="material-symbols-outlined text-gray-500">add_a_photo</span>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                  <div className="border border-red-500/30 bg-red-500/5 p-4 flex gap-4 items-start">
                      <span className="material-symbols-outlined text-red-500 mt-1">warning</span>
                      <div>
                          <h4 className="text-red-500 font-bold text-sm uppercase mb-1">Audit Warning</h4>
                          <p className="text-xs text-red-200/70 leading-relaxed">
                              By submitting this claim, you are cryptographically signing the data. 
                              False claims will result in immediate suspension of node privileges and may be flagged for regulatory review.
                          </p>
                      </div>
                  </div>
                  
                  <div className="space-y-4 border-t border-white/10 pt-4">
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Recycler:</span>
                          <span className="text-white font-mono">Apex Materials (RCY-004)</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Material:</span>
                          <span className="text-white font-mono">HDPE Plastic</span>
                      </div>
                      <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Weight:</span>
                          <span className="text-white font-mono">2,450 kg</span>
                      </div>
                       <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Evidence:</span>
                          <span className="text-primary font-mono">3 Files Attached</span>
                      </div>
                  </div>
              </div>
          )}

      </div>

      {/* Footer Actions */}
      <div className="flex justify-between mt-6">
          <button 
             onClick={() => setStep(Math.max(1, step - 1))}
             disabled={step === 1}
             className={`px-6 py-3 border border-white/10 text-xs font-bold uppercase tracking-wider ${step === 1 ? 'opacity-50 cursor-not-allowed text-gray-600' : 'text-white hover:bg-white/10'}`}
          >
              Previous
          </button>

          {step < 4 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="bg-white text-black px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors"
              >
                  Next Step
              </button>
          ) : (
              <button 
                onClick={() => onNavigate('claims')}
                className="bg-primary text-black px-8 py-3 text-xs font-bold uppercase tracking-wider hover:bg-white transition-colors flex items-center gap-2"
              >
                  <span className="material-symbols-outlined text-sm">fingerprint</span>
                  Sign & Submit
              </button>
          )}
      </div>
    </div>
  );
};

export default NewClaim;