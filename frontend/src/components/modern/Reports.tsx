import React from 'react';

const Reports: React.FC = () => {
  return (
    <div className="animate-fade-in space-y-8">
       <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">COMPLIANCE REPORTING</h2>
          <p className="text-xs font-mono text-gray-500 mt-1">REGULATOR READY OUTPUTS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Generator */}
          <div className="lg:col-span-1 bg-surface-dark border border-white/10 p-6 h-fit">
              <h3 className="text-sm font-bold text-white uppercase mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-base">tune</span>
                  Report Configuration
              </h3>
              
              <div className="space-y-6">
                  <div className="space-y-2">
                      <label className="text-xs font-mono text-gray-500 uppercase">Report Type</label>
                      <select className="w-full bg-black border border-white/20 text-white p-3 text-xs focus:border-primary outline-none">
                          <option>Form-1 (Annual Return)</option>
                          <option>Form-4 (Quarterly Compliance)</option>
                          <option>Detailed Audit Log</option>
                      </select>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-mono text-gray-500 uppercase">Date Range</label>
                      <div className="grid grid-cols-2 gap-2">
                          <input type="date" className="bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none" />
                          <input type="date" className="bg-black border border-white/20 text-white p-2 text-xs focus:border-primary outline-none" />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-xs font-mono text-gray-500 uppercase">Jurisdiction</label>
                      <select className="w-full bg-black border border-white/20 text-white p-3 text-xs focus:border-primary outline-none">
                          <option>National (CPCB)</option>
                          <option>State (SPCB)</option>
                          <option>International (Basel)</option>
                      </select>
                  </div>

                  <div className="pt-4">
                      <button className="w-full bg-primary text-black py-3 text-xs font-bold uppercase hover:bg-white transition-colors flex items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-sm">rocket_launch</span>
                          Generate Report
                      </button>
                  </div>
              </div>
          </div>

          {/* History & Preview */}
          <div className="lg:col-span-2 space-y-8">
              
              {/* Submission Proof */}
              <div className="bg-surface-dark border border-white/10 p-6">
                  <h3 className="text-sm font-bold text-white uppercase mb-4">Historical Submissions</h3>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs font-mono">
                          <thead>
                              <tr className="border-b border-white/10 text-gray-500">
                                  <th className="pb-3 pl-2">DATE</th>
                                  <th className="pb-3">TYPE</th>
                                  <th className="pb-3">HASH (PROOF)</th>
                                  <th className="pb-3 text-right pr-2">ACTION</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {[
                                  { date: '2023-09-30', type: 'Form-4 (Q3)', hash: '0x8f2...9a1', status: 'SUBMITTED' },
                                  { date: '2023-06-30', type: 'Form-4 (Q2)', hash: '0x3a4...b2c', status: 'SUBMITTED' },
                                  { date: '2023-03-31', type: 'Annual Return', hash: '0x1c9...d4e', status: 'ACKNOWLEDGED' },
                              ].map((row, i) => (
                                  <tr key={i} className="hover:bg-white/5 transition-colors">
                                      <td className="py-3 pl-2 text-white">{row.date}</td>
                                      <td className="py-3 text-gray-400">{row.type}</td>
                                      <td className="py-3 font-mono text-primary text-[10px]">{row.hash}</td>
                                      <td className="py-3 text-right pr-2">
                                          <button className="text-gray-500 hover:text-white transition-colors">DOWNLOAD</button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Preview */}
              <div className="border border-white/10 bg-black p-8 opacity-50 relative pointer-events-none min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                      <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">description</span>
                      <p className="text-xs text-gray-500 font-mono">Report Preview Will Appear Here</p>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Reports;