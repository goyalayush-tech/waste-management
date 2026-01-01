import React, { useState } from 'react';
import DashboardOverview from './DashboardOverview';
import ClaimsList from './ClaimsList';
import NewClaim from './NewClaim';
import ClaimDetail from './ClaimDetail';
import AuditorConsole from './AuditorConsole';
import FieldAudits from './FieldAudits';
import Reports from './Reports';
import AdminDashboard from './AdminDashboard';
import Search from './Search';

interface DashboardProps {
    onLogout: () => void;
}

type DashboardView = 'overview' | 'claims' | 'new-claim' | 'claim-detail' | 'auditor-console' | 'field-audits' | 'reports' | 'admin' | 'search';

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [view, setView] = useState<DashboardView>('overview');
    const [selectedClaimId, setSelectedClaimId] = useState<string>('');

    const handleNavigate = (newView: string, id?: string) => {
        if (id) setSelectedClaimId(id);
        setView(newView as DashboardView);
    };

    return (
        <div className="min-h-screen bg-background-dark pt-16 flex">
            
            {/* Sidebar */}
            <aside className="w-64 fixed left-0 top-16 bottom-0 border-r border-white/10 bg-surface-dark/50 backdrop-blur-md hidden lg:flex flex-col z-30 overflow-y-auto">
                <div className="p-6">
                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">Core Modules</div>
                    <nav className="space-y-1 mb-8">
                        <button 
                            onClick={() => handleNavigate('overview')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'overview' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">dashboard</span>
                            Overview
                        </button>
                        <button 
                            onClick={() => handleNavigate('claims')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'claims' || view === 'claim-detail' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">list_alt</span>
                            Claims Registry
                        </button>
                        <button 
                            onClick={() => handleNavigate('search')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'search' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">search</span>
                            Forensic Search
                        </button>
                    </nav>

                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">Audit & Verify</div>
                    <nav className="space-y-1 mb-8">
                         <button 
                            onClick={() => handleNavigate('auditor-console')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'auditor-console' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">gavel</span>
                            Auditor Console
                        </button>
                         <button 
                            onClick={() => handleNavigate('field-audits')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'field-audits' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">location_on</span>
                            Field Audits
                        </button>
                    </nav>

                    <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-4">System</div>
                    <nav className="space-y-1">
                        <button 
                            onClick={() => handleNavigate('reports')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'reports' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">description</span>
                            Reporting
                        </button>
                         <button 
                            onClick={() => handleNavigate('admin')}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-3 transition-colors ${view === 'admin' ? 'bg-primary/10 text-primary border-r-2 border-primary' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                            Administration
                        </button>
                    </nav>

                </div>

                <div className="mt-auto p-6 border-t border-white/10 bg-black/20">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center text-white font-bold text-xs">JD</div>
                        <div>
                            <p className="text-xs text-white font-bold">John Doe</p>
                            <p className="text-[10px] text-gray-500 font-mono">Lead Auditor</p>
                        </div>
                    </div>
                    <button onClick={onLogout} className="text-xs text-red-500 hover:text-red-400 flex items-center gap-2 transition-colors">
                        <span className="material-symbols-outlined text-sm">logout</span>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 lg:ml-64 p-6 lg:p-12 overflow-y-auto">
                {view === 'overview' && <DashboardOverview onNavigate={handleNavigate} />}
                {view === 'claims' && <ClaimsList onNavigate={handleNavigate} />}
                {view === 'new-claim' && <NewClaim onNavigate={handleNavigate} />}
                {view === 'claim-detail' && <ClaimDetail claimId={selectedClaimId} onBack={() => handleNavigate('claims')} />}
                {view === 'auditor-console' && <AuditorConsole />}
                {view === 'field-audits' && <FieldAudits />}
                {view === 'reports' && <Reports />}
                {view === 'admin' && <AdminDashboard />}
                {view === 'search' && <Search />}
            </main>

        </div>
    );
};

export default Dashboard;