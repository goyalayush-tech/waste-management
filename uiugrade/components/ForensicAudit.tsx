import React from 'react';

const ForensicAudit: React.FC = () => {
  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden border-y border-white/10 group">
      <div className="absolute inset-0 bg-black/20 z-10 grid-bg opacity-30"></div>
      
      <img 
        src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkvHmcC-w4RfWRzuZtETk0YnVQIkGdF2Sa3Diin0veoEKaOsjszcDCKNpkiRqfPIFukGKWTpkI3g5KWlxY-rc0KOe-hd2kPcmj6j802HY7CaI9dNGgSIg7oRZXpj-Gr_L-oSzPToE7gnRIbpU1lX9-e3G4_y-W39cTEip5HCgzbolkBeIGn6ThHgY2HxL2_9J0aL9Ah-MEnYALqMQOuk1o_2vvorpM7-BOsg4XZWdg26lG1ADZ8_R2izp5zJQQee0S6RUs8yyvCpWA" 
        alt="AI Scanned Waste Processing Facility" 
        className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:opacity-80 transition-all duration-700 scale-100 group-hover:scale-105"
      />
      
      <div className="absolute inset-0 z-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 border border-primary/50 rounded-full border-dashed animate-spin-slow"></div>
        <div className="absolute top-1/4 left-1/4 w-32 h-32 flex items-center justify-center">
          <div className="w-1 h-1 bg-primary"></div>
        </div>
        
        <div className="absolute top-12 right-12 text-right">
          <p className="text-[10px] font-mono text-primary mb-1">LIVE FEED_01</p>
          <p className="text-2xl font-mono text-white">AI_ANALYSIS_ACTIVE</p>
        </div>
      </div>
      
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent p-8 md:p-16 z-30">
        <div className="max-w-2xl border-l-2 border-primary pl-6">
          <h3 className="text-white text-3xl md:text-4xl font-bold tracking-tight">Visual Forensic Audit.</h3>
          <p className="text-gray-400 mt-2 text-lg font-light">Deep learning models detect contaminants at the molecular level before stream entry.</p>
        </div>
      </div>
    </section>
  );
};

export default ForensicAudit;