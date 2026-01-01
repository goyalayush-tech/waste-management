import React from 'react';

interface NotFoundProps {
  onBack: () => void;
}

const NotFound: React.FC<NotFoundProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden text-center font-mono">
       <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 pointer-events-none"></div>
       
       <div className="relative z-10 space-y-6">
           <h1 className="text-9xl font-bold text-white/5 tracking-tighter absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none">404</h1>
           
           <div className="text-red-500 text-6xl font-bold mb-4 relative">
               <span className="material-symbols-outlined text-6xl block mb-4">error</span>
               ERROR_404
           </div>
           
           <p className="text-white text-lg uppercase tracking-widest max-w-md mx-auto border-y border-white/10 py-4">
               Requested resource not found or access denied.
           </p>
           
           <p className="text-gray-600 text-xs">
               Incident ID: 0x8f229a...c1 <br />
               All access attempts are logged.
           </p>
           
           <button 
             onClick={onBack}
             className="mt-8 bg-white text-black px-8 py-3 text-xs font-bold uppercase hover:bg-gray-200 transition-colors"
           >
               Return to Dashboard
           </button>
       </div>
    </div>
  );
};

export default NotFound;