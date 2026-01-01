import React from 'react';

const ValueProp: React.FC = () => {
  return (
    <section className="py-32 px-6 max-w-5xl mx-auto border-l border-white/10 ml-4 md:ml-auto md:mr-auto pl-8 md:pl-12">
      <div className="flex items-start gap-4 mb-8">
        <span className="material-symbols-outlined text-primary text-3xl">fingerprint</span>
        <span className="text-sm font-mono text-primary uppercase tracking-widest mt-1">Forensic Validation</span>
      </div>
      
      <h2 className="text-3xl md:text-5xl font-medium leading-tight text-white mb-8">
        ClaimClean bridges the gap between <span className="text-gray-500">physical waste streams</span> and <span className="text-white border-b border-primary pb-1">digital certainty</span>.
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-16">
        <div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase">Audit Ready</h3>
          <p className="text-gray-400 text-sm leading-relaxed">Every claim is cryptographically signed and timestamped. Generate audit reports in milliseconds, not months.</p>
        </div>
        <div>
          <h3 className="text-lg font-bold text-white mb-2 font-mono uppercase">Sensor Fusion</h3>
          <p className="text-gray-400 text-sm leading-relaxed">Ingest data from scales, optical scanners, and GPS trackers into a single source of truth.</p>
        </div>
      </div>
    </section>
  );
};

export default ValueProp;