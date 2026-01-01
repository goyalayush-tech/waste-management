import React, { useState } from 'react';

const Search: React.FC = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-8">
      
      {/* Search Bar */}
      <div>
         <h2 className="text-2xl font-bold text-white tracking-tight mb-6">GLOBAL FORENSIC SEARCH</h2>
         <div className="relative group">
             <span className="absolute left-4 top-4 material-symbols-outlined text-gray-500 group-focus-within:text-primary transition-colors">search</span>
             <input 
                type="text" 
                className="w-full bg-black border border-white/20 text-white pl-12 pr-4 py-4 text-lg focus:border-primary outline-none transition-colors"
                placeholder="Search by ID, Hash, Facility, or Material..."
                autoFocus
             />
             <div className="absolute right-4 top-3">
                 <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-gray-500 hover:text-white flex items-center gap-1 font-mono uppercase border border-white/10 px-2 py-1.5"
                 >
                     <span className="material-symbols-outlined text-sm">tune</span>
                     {showAdvanced ? 'Hide Filters' : 'Advanced'}
                 </button>
             </div>
         </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
          <div className="bg-surface-dark border border-white/10 p-6 grid grid-cols-3 gap-6 animate-fade-in">
              <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Entity Type</label>
                  <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" className="bg-black border-white/20 rounded-sm text-primary" checked /> Claims</label>
                      <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" className="bg-black border-white/20 rounded-sm text-primary" checked /> Audits</label>
                      <label className="flex items-center gap-2 text-xs text-gray-300"><input type="checkbox" className="bg-black border-white/20 rounded-sm text-primary" /> Documents</label>
                  </div>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Risk Level</label>
                  <select className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none">
                      <option>Any Risk Level</option>
                      <option>High Risk Only</option>
                      <option>Flagged Only</option>
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-mono text-gray-500 uppercase">Date Range</label>
                  <input type="date" className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none mb-2" />
                  <input type="date" className="w-full bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none" />
              </div>
              <div className="col-span-3 flex justify-between items-center border-t border-white/5 pt-4">
                  <button className="text-xs text-gray-500 hover:text-white transition-colors">Clear All</button>
                  <div className="flex gap-2">
                      <button className="text-xs border border-white/20 px-3 py-1 text-white hover:bg-white/10">Save Template</button>
                      <button className="text-xs bg-primary text-black px-4 py-1 font-bold">Apply Filters</button>
                  </div>
              </div>
          </div>
      )}

      {/* Results */}
      <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-xs font-mono text-gray-500">23 RESULTS FOUND (0.04s)</span>
              <div className="flex gap-2 text-[10px] font-mono text-gray-500">
                  <span className="cursor-pointer text-white">RELEVANCE</span>
                  <span className="cursor-pointer hover:text-white">DATE</span>
                  <span className="cursor-pointer hover:text-white">RISK</span>
              </div>
          </div>

          {[
              { type: 'CLAIM', id: 'CLM-2023-8821', title: 'HDPE Plastic - Apex Materials', detail: 'Verified • 2,450 kg • Facility A', date: 'Oct 24, 2023' },
              { type: 'AUDIT', id: 'AUD-LOG-991', title: 'Field Audit Report - GreenCycle', detail: 'Passed • Auditor: J. Doe', date: 'Oct 22, 2023' },
              { type: 'DOC', id: 'DOC-PDF-442', title: 'Scale_Ticket_8821.pdf', detail: 'Uploaded by: Facility_Mgr', date: 'Oct 24, 2023' },
              { type: 'CLAIM', id: 'CLM-2023-8819', title: 'PET Clear - EcoLoop', detail: 'Flagged (Weight Variance) • 1,200 kg', date: 'Oct 20, 2023' },
          ].map((res, i) => (
              <div key={i} className="group cursor-pointer">
                  <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 flex items-center justify-center border border-white/10 ${
                          res.type === 'CLAIM' ? 'bg-blue-500/10 text-blue-500' :
                          res.type === 'AUDIT' ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                          <span className="material-symbols-outlined text-sm">
                              {res.type === 'CLAIM' ? 'inventory_2' : res.type === 'AUDIT' ? 'fact_check' : 'description'}
                          </span>
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between">
                              <h3 className="text-sm font-bold text-primary group-hover:underline">{res.title}</h3>
                              <span className="text-[10px] font-mono text-gray-600">{res.date}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{res.detail}</p>
                          <p className="text-[10px] font-mono text-gray-600 mt-1 uppercase">{res.type} ID: {res.id}</p>
                      </div>
                  </div>
              </div>
          ))}

          <div className="pt-8 flex justify-center">
              <button className="text-xs border border-white/10 px-4 py-2 text-gray-400 hover:text-white hover:border-white/30 transition-colors">Load More Results</button>
          </div>
      </div>

    </div>
  );
};

export default Search;