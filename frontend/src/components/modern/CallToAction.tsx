import React from 'react';

const CallToAction: React.FC = () => {
  return (
    <section className="py-32 px-4 bg-background-dark text-center border-t border-white/10">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to certify the future?</h2>
        <p className="text-gray-400 mb-10 text-lg">Deploy the ClaimClean infrastructure today.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <a href="#" className="bg-primary hover:bg-cyan-400 text-black px-8 py-4 font-mono font-bold uppercase tracking-wider transition-colors">Start Integration</a>
          <a href="#" className="text-white hover:text-primary px-8 py-4 font-mono font-bold uppercase tracking-wider transition-colors border border-white/20 hover:border-primary/50">Contact Sales</a>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;