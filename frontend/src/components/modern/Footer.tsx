import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#050505] py-16 px-6 text-xs text-gray-500 border-t border-white/10 font-mono">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <a href="#" className="text-lg font-bold tracking-tight text-white mb-4 block">ClaimClean_Ent</a>
            <p className="max-w-xs mb-4 text-gray-600">The world's most trusted waste verification infrastructure.</p>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px]">Product</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition-colors">Platform</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Sensors</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ledger</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">API</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px]">Developers</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Changelog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Open Source</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px]">Company</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition-colors">About</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Legal</a></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h4 className="font-bold text-white mb-4 uppercase tracking-widest text-[10px]">Social</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-primary transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">LinkedIn</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p>Copyright © 2023 ClaimClean Inc. System Status: Normal.</p>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>All Systems Operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;