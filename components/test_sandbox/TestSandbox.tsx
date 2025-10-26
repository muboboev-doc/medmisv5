
import React from 'react';
import { TranslationMap } from '../../types';

interface TestSandboxProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const TestSandbox: React.FC<TestSandboxProps> = ({ t }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">{t.testSandbox}</h2>
      <p className="text-slate-600">
        This module is for simulating end-to-end process chains, making assertions on SLA compliance, and generating test reports.
      </p>
    </div>
  );
};

export default TestSandbox;