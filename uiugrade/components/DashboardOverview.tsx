import React from 'react';

interface DashboardOverviewProps {
  onNavigate: (view: string) => void;
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ onNavigate }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">SYSTEM OVERVIEW</h2>
          <p className="text-xs font-mono text-gray-500 mt-1">REAL-TIME MONITORING // NODE_ID: 8821X</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => onNavigate('new-claim')}
            className="flex items-center gap-2 bg-primary text-black px-4 py-2 text-xs font-bold font-mono uppercase hover:bg-white transition-colors"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            New Claim
          </button>
          <button className="flex items-center gap-2 border border-white/20 text-white px-4 py-2 text-xs font-bold font-mono uppercase hover:bg-white/5 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>
            Report
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: '1,284', change: '+24', color: 'text-white' },
          { label: 'Verified %', value: '94.2%', change: '+1.2%', color: 'text-primary' },
          { label: 'High-Risk Flags', value: '3', change: '-1', color: 'text-red-500' },
          { label: 'Pending Audits', value: '12', change: 'Stable', color: 'text-yellow-500' }
        ].map((kpi, i) => (
          <div key={i} className="bg-surface-dark border border-white/10 p-4 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{kpi.label}</span>
              <span className={`text-[10px] font-mono ${kpi.color === 'text-red-500' ? 'text-red-500' : 'text-green-500'}`}>{kpi.change}</span>
            </div>
            <div className={`text-3xl font-mono font-bold ${kpi.color}`}>{kpi.value}</div>
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-white/10">
              <div className={`h-full ${kpi.color.replace('text', 'bg')} opacity-50 w-3/4`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-surface-dark border border-white/10 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Activity Log</h3>
            <button onClick={() => onNavigate('claims')} className="text-[10px] font-mono text-primary hover:text-white transition-colors">VIEW ALL</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-gray-500">
                  <th className="pb-3 pl-2">TIMESTAMP</th>
                  <th className="pb-3">EVENT TYPE</th>
                  <th className="pb-3">SOURCE</th>
                  <th className="pb-3 text-right pr-2">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { time: '10:42:05 UTC', event: 'CLAIM_SUBMISSION', source: 'FACILITY_04', status: 'PROCESSING' },
                  { time: '10:38:12 UTC', event: 'AUTO_VERIFICATION', source: 'AI_CORE_V2', status: 'VERIFIED' },
                  { time: '10:15:00 UTC', event: 'MANUAL_FLAG', source: 'AUDITOR_J_DOE', status: 'FLAGGED' },
                  { time: '09:55:23 UTC', event: 'CLAIM_SUBMISSION', source: 'FACILITY_01', status: 'VERIFIED' },
                  { time: '09:42:10 UTC', event: 'BLOCKCHAIN_SYNC', source: 'LEDGER_NODE', status: 'CONFIRMED' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors group cursor-default">
                    <td className="py-3 pl-2 text-gray-400 group-hover:text-white">{row.time}</td>
                    <td className="py-3 text-white">{row.event}</td>
                    <td className="py-3 text-gray-400">{row.source}</td>
                    <td className="py-3 text-right pr-2">
                      <span className={`px-2 py-0.5 border ${
                        row.status === 'VERIFIED' || row.status === 'CONFIRMED' ? 'border-primary/30 text-primary bg-primary/10' :
                        row.status === 'FLAGGED' ? 'border-red-500/30 text-red-500 bg-red-500/10' :
                        'border-yellow-500/30 text-yellow-500 bg-yellow-500/10'
                      }`}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Distribution Chart (Visual Mock) */}
        <div className="bg-surface-dark border border-white/10 p-5 flex flex-col">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6">Risk Distribution</h3>
          <div className="flex-1 flex items-end justify-between gap-2 px-2 pb-2 border-b border-l border-white/10 min-h-[200px]">
            {[30, 45, 25, 60, 80, 20, 10, 5].map((h, i) => (
              <div key={i} className="w-full bg-white/10 hover:bg-primary/50 transition-colors relative group" style={{ height: `${h}%` }}>
                 <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary opacity-0 group-hover:opacity-100 transition-opacity">{h}%</div>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-primary"></div>
                <span className="text-[10px] font-mono text-gray-400">LOW RISK (85%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-white/20"></div>
                <span className="text-[10px] font-mono text-gray-400">MANUAL REVIEW (12%)</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500"></div>
                <span className="text-[10px] font-mono text-gray-400">REJECTED (3%)</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;