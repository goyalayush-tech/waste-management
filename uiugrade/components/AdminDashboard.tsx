import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">SYSTEM ADMINISTRATION</h2>
          <p className="text-xs font-mono text-red-500 mt-1">ROOT ACCESS // ELEVATED PRIVILEGES</p>
        </div>
      </div>

      {/* System Health */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
              { label: 'CPU Load', value: '12%', status: 'NORMAL' },
              { label: 'Memory Usage', value: '4.2 GB', status: 'NORMAL' },
              { label: 'Network I/O', value: '850 MB/s', status: 'HIGH' },
              { label: 'Active Nodes', value: '1,024', status: 'STABLE' },
          ].map((stat, i) => (
              <div key={i} className="bg-surface-dark border border-white/10 p-4">
                  <div className="text-[10px] font-mono text-gray-500 uppercase mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold text-white font-mono mb-1">{stat.value}</div>
                  <div className={`text-[10px] font-bold ${stat.status === 'HIGH' ? 'text-yellow-500' : 'text-green-500'}`}>{stat.status}</div>
              </div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Config */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* User Management */}
              <div className="bg-surface-dark border border-white/10">
                  <div className="p-4 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-sm font-bold text-white uppercase">User & Role Management</h3>
                      <button className="text-xs text-primary hover:text-white transition-colors">ADD USER</button>
                  </div>
                  <div className="overflow-x-auto">
                       <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-white/5">
                              <tr>
                                  <th className="p-3 text-gray-500">USER</th>
                                  <th className="p-3 text-gray-500">ROLE</th>
                                  <th className="p-3 text-gray-500">LAST ACTIVE</th>
                                  <th className="p-3 text-right text-gray-500">STATUS</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {[
                                  { user: 'admin@claimclean.com', role: 'SUPER_ADMIN', active: 'Now', status: 'ACTIVE' },
                                  { user: 'auditor.lead@corp.net', role: 'AUDITOR_L2', active: '2h ago', status: 'ACTIVE' },
                                  { user: 'facility.mgr@apex.com', role: 'PRODUCER', active: '5m ago', status: 'FLAGGED' },
                              ].map((row, i) => (
                                  <tr key={i} className="hover:bg-white/5">
                                      <td className="p-3 text-white">{row.user}</td>
                                      <td className="p-3 text-gray-400">{row.role}</td>
                                      <td className="p-3 text-gray-500">{row.active}</td>
                                      <td className="p-3 text-right">
                                          <span className={`text-[10px] px-1.5 py-0.5 border ${
                                              row.status === 'ACTIVE' ? 'border-green-500 text-green-500' : 'border-red-500 text-red-500'
                                          }`}>{row.status}</span>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                       </table>
                  </div>
              </div>

              {/* Recycler Queue */}
              <div className="bg-surface-dark border border-white/10 p-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-4">Recycler Verification Queue</h3>
                  <div className="space-y-3">
                      {[
                          { name: 'Global Waste Solutions', id: 'REQ-9921', status: 'Pending Doc Review' },
                          { name: 'EcoTech Processors', id: 'REQ-9922', status: 'Pending Site Visit' },
                      ].map((item, i) => (
                          <div key={i} className="flex justify-between items-center p-3 border border-white/10 hover:border-white/30 transition-colors">
                              <div>
                                  <p className="text-xs font-bold text-white">{item.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">{item.id}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                  <span className="text-[10px] text-yellow-500">{item.status}</span>
                                  <button className="text-[10px] border border-white/20 px-2 py-1 hover:bg-white text-white hover:text-black transition-colors">REVIEW</button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>

          </div>

          {/* Side Panel: Config & Logs */}
          <div className="space-y-8">
              
              {/* Thresholds */}
              <div className="bg-surface-dark border border-white/10 p-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-4">System Thresholds</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                              <span>Auto-Verify Trust Score</span>
                              <span>{'>'} 95</span>
                          </label>
                          <input type="range" className="w-full accent-primary h-1 bg-white/10 appearance-none" />
                      </div>
                      <div>
                          <label className="flex justify-between text-[10px] font-mono text-gray-500 mb-1">
                              <span>Max Daily API Calls</span>
                              <span>10,000</span>
                          </label>
                          <input type="range" className="w-full accent-primary h-1 bg-white/10 appearance-none" />
                      </div>
                      <button className="w-full border border-white/20 text-white text-xs py-2 hover:bg-white/10 transition-colors uppercase">Save Config</button>
                  </div>
              </div>

              {/* Audit Logs */}
              <div className="bg-black border border-white/10 p-4 font-mono text-[10px] h-[300px] overflow-y-auto">
                  <div className="text-gray-500 mb-2">SYSTEM_LOGS_STREAM::LIVE</div>
                  <div className="space-y-1 text-gray-400">
                      <p><span className="text-primary">14:22:01</span> User login success (admin)</p>
                      <p><span className="text-primary">14:21:55</span> API Rate Limit warning (node_8)</p>
                      <p><span className="text-primary">14:20:12</span> Database backup complete</p>
                      <p><span className="text-primary">14:18:44</span> New claim submitted (CLM-229)</p>
                      <p><span className="text-red-500">14:15:00</span> Failed login attempt (IP: 192.168.1.5)</p>
                      <p><span className="text-primary">14:10:22</span> Cron job executed: risk_calc</p>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;