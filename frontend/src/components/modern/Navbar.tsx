import React from 'react';

interface NavbarProps {
  onLoginClick?: () => void;
  isLoggedIn?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onLoginClick, isLoggedIn = false }) => {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[rgba(5,5,5,0.8)] backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 text-xs font-mono">
            <div className="flex items-center space-x-12">
              <a href="#" onClick={(e) => { e.preventDefault(); if(onLoginClick) onLoginClick(); }} className="text-base font-bold tracking-tighter text-white flex items-center gap-2">
                <span className="w-3 h-3 bg-primary rounded-sm"></span>
                CLAIMCLEAN_ENT
              </a>
              <div className="hidden md:flex space-x-8 text-gray-400">
                <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider">Platform</a>
                <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider">Intelligence</a>
                <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider">API Reference</a>
                <a href="#" className="hover:text-primary transition-colors uppercase tracking-wider">Security</a>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex items-center gap-2 text-gray-500">
                <span className={`w-2 h-2 rounded-full ${isLoggedIn ? 'bg-primary' : 'bg-green-500'} animate-pulse`}></span>
                {isLoggedIn ? 'SECURE CONNECTION' : 'SYSTEM OPTIMAL'}
              </div>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  if (onLoginClick) onLoginClick();
                }}
                className={`border ${isLoggedIn ? 'border-red-500 text-red-500 hover:bg-red-500/10' : 'border-primary/30 text-primary hover:bg-primary/10'} px-4 py-2 transition-all uppercase tracking-widest text-[10px]`}
              >
                {isLoggedIn ? 'Disconnect // Logout' : 'Login // Terminal'}
              </button>
            </div>
          </div>
        </div>
      </nav>
      {!isLoggedIn && (
        <div className="fixed top-16 z-40 w-full border-b border-white/5 bg-black/90 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center text-[10px] font-mono text-gray-500 uppercase tracking-wider">
            <span>Module: Trust_Infrastructure_v2.4</span>
            <div className="flex space-x-6">
              <span className="text-primary">Status: Monitoring</span>
              <span className="hidden sm:inline">Latency: 12ms</span>
              <span className="hidden sm:inline">Hash Rate: 4.2TH/s</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;