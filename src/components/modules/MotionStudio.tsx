import React from 'react';
import { Film } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MotionStudio: React.FC = () => {
  const { setActiveModule } = useApp();

  return (
    <section className="mx-auto max-w-2xl rounded-xl border border-[#222] bg-[#0C0C0C] p-8 text-center">
      <Film size={28} className="mx-auto text-neutral-400" />
      <h1 className="mt-4 text-xl font-bold text-white">Motion deliverables</h1>
      <p className="mt-2 text-sm text-neutral-400">
        Motion work is now managed as part of the shared production project, deliverable and client-review workflow.
      </p>
      <button
        onClick={() => setActiveModule('production')}
        className="mt-5 rounded bg-[#FF1E1E] px-4 py-2 text-sm font-semibold text-white"
      >
        Open Production Center
      </button>
    </section>
  );
};

export default MotionStudio;
