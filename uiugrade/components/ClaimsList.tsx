import React from 'react';

interface ClaimsListProps {
  onNavigate: (view: string, id?: string) => void;
}

const ClaimsList: React.FC<ClaimsListProps> = ({ onNavigate }) => {
  const claims = [
    { id: 'CLM-2023-8821', recycler: 'Apex Materials', material: 'HDPE Plastic', weight: '2,450 kg', score: 98, status: 'VERIFIED' },
    { id: 'CLM-2023-8822', recycler: 'GreenCycle Inc', material: 'Aluminum', weight: '850 kg', score: 92, status: 'VERIFIED' },
    { id: 'CLM-2023-8823', recycler: 'Apex Materials', material: 'PET Clear', weight: '1,200 kg', score: 45, status: 'FLAGGED' },
    { id: 'CLM-2023-8824', recycler: 'EcoLoop Systems', material: 'Cardboard', weight: '5,000 kg', score: 78, status: 'PENDING' },
    { id: 'CLM-2023-8825', recycler: 'GreenCycle Inc', material: 'Mixed Paper', weight: '3,100 kg', score: 88, status: 'VERIFIED' },
    { id: 'CLM-2023-8826', recycler: 'Apex Materials', material: 'HDPE Plastic', weight: '2,100 kg', score: 99, status: 'VERIFIED' },
    { id: 'CLM-2023-8827', recycler: 'EcoLoop Systems', material: 'Glass Cull', weight: '8,400 kg', score: 65, status: 'PENDING' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">CLAIMS REGISTRY</h2>
          <p className="text-xs font-mono text-gray-500 mt-1">DATABASE ACCESS // READ_ONLY</p>
        </div>
        <div className="flex gap-2">
            <button className="p-2 border border-white/20 text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">filter_list</span></button>
            <button className="p-2 border border-white/20 text-gray-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-sm">refresh</span></button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-surface-dark border border-white/10 p-4">
         <div className="space-y-1">
             <label className="text-[10px] font-mono text-gray-500 uppercase">Search ID</label>
             <input type="text" className="w-full bg-black border border-white/20 text-white text-xs px-2 py-1.5 focus:border-primary outline-none" placeholder="CLM-XXXX..." />
         </div>
         <div className="space-y-1">
             <label className="text-[10px] font-mono text-gray-500 uppercase">Status</label>
             <select className="w-full bg-black border border-white/20 text-white text-xs px-2 py-1.5 focus:border-primary outline-none">
                 <option>All Statuses</option>
                 <option>Verified</option>
                 <option>Pending</option>
                 <option>Flagged</option>
             </select>
         </div>
         <div className="space-y-1">
             <label className="text-[10px] font-mono text-gray-500 uppercase">Material</label>
             <select className="w-full bg-black border border-white/20 text-white text-xs px-2 py-1.5 focus:border-primary outline-none">
                 <option>All Materials</option>
                 <option>Plastics</option>
                 <option>Metals</option>
                 <option>Paper</option>
             </select>
         </div>
         <div className="space-y-1">
             <label className="text-[10px] font-mono text-gray-500 uppercase">Date Range</label>
             <input type="date" className="w-full bg-black border border-white/20 text-white text-xs px-2 py-1.5 focus:border-primary outline-none" />
         </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark border border-white/10 overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
            <thead className="bg-white/5 text-gray-400 uppercase tracking-wider">
                <tr>
                    <th className="py-4 pl-6">Claim ID</th>
                    <th className="py-4">Recycler</th>
                    <th className="py-4">Material</th>
                    <th className="py-4">Weight</th>
                    <th className="py-4">CC Score</th>
                    <th className="py-4 text-right pr-6">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {claims.map((claim) => (
                    <tr 
                        key={claim.id} 
                        onClick={() => onNavigate('claim-detail', claim.id)}
                        className="hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                        <td className="py-4 pl-6 font-bold text-white group-hover:text-primary transition-colors">{claim.id}</td>
                        <td className="py-4 text-gray-300">{claim.recycler}</td>
                        <td className="py-4 text-gray-400">{claim.material}</td>
                        <td className="py-4 text-white font-mono">{claim.weight}</td>
                        <td className="py-4">
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${claim.score > 90 ? 'bg-primary' : claim.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                        style={{width: `${claim.score}%`}}
                                    ></div>
                                </div>
                                <span className="text-gray-400">{claim.score}</span>
                            </div>
                        </td>
                        <td className="py-4 pr-6 text-right">
                            <span className={`px-2 py-1 border text-[10px] uppercase tracking-wider ${
                                claim.status === 'VERIFIED' ? 'border-primary/30 text-primary bg-primary/10' :
                                claim.status === 'FLAGGED' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                                'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                            }`}>
                                {claim.status}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs text-gray-500 font-mono">
          <span>Showing 1-7 of 1,284 records</span>
          <div className="flex gap-2">
              <button className="px-3 py-1 border border-white/10 hover:border-white/30 hover:text-white transition-colors">PREV</button>
              <button className="px-3 py-1 border border-white/10 bg-primary/20 text-primary border-primary">1</button>
              <button className="px-3 py-1 border border-white/10 hover:border-white/30 hover:text-white transition-colors">2</button>
              <button className="px-3 py-1 border border-white/10 hover:border-white/30 hover:text-white transition-colors">3</button>
              <button className="px-3 py-1 border border-white/10 hover:border-white/30 hover:text-white transition-colors">NEXT</button>
          </div>
      </div>
    </div>
  );
};

export default ClaimsList;