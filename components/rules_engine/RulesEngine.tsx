
import React, { useState, useEffect, useCallback } from 'react';
import { Rule, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { LoadingIcon, CogIcon, CodeBracketIcon } from '../Icons';

interface RulesEngineProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

type RuleType = 'integrations' | 'queue' | 'sla';

const RulesEngine: React.FC<RulesEngineProps> = ({ t }) => {
    const [activeTab, setActiveTab] = useState<RuleType>('integrations');
    const [ruleContent, setRuleContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
    const [validationError, setValidationError] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchRule = useCallback(async (type: RuleType) => {
        setIsLoading(true);
        setValidationStatus('idle');
        setValidationError(null);
        try {
            const rule = await api.fetchRules(type);
            if (rule) {
                setRuleContent(JSON.stringify(rule.content, null, 2));
            } else {
                setRuleContent('{}');
            }
        } catch (error) {
            console.error(`Failed to fetch rule for ${type}:`, error);
            setRuleContent('// Error loading rule');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRule(activeTab);
    }, [activeTab, fetchRule]);

    const handleValidate = () => {
        try {
            JSON.parse(ruleContent);
            setValidationStatus('valid');
            setValidationError(null);
        } catch (e: any) {
            setValidationStatus('invalid');
            setValidationError(e.message);
        }
    };

    const handleApply = async () => {
        handleValidate();
        if (validationStatus === 'invalid') {
             try { // Double check validation before saving
                JSON.parse(ruleContent);
             } catch (e) {
                return; // Do not save if invalid
             }
        }

        setIsSaving(true);
        try {
            await api.updateRule(activeTab, JSON.parse(ruleContent));
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error(`Failed to update rule for ${activeTab}:`, error);
        } finally {
            setIsSaving(false);
        }
    };

    const tabs: { id: RuleType, labelKey: string }[] = [
        { id: 'integrations', labelKey: 'rules.integrations' },
        { id: 'queue', labelKey: 'rules.queue' },
        { id: 'sla', labelKey: 'rules.sla' },
    ];

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center">
        <CogIcon className="w-7 h-7 mr-3 text-blue-600"/>
        {t.rulesEngine}
      </h2>
      <p className="text-slate-600 mb-6">
        Manage event-based workflows and system logic. Changes applied here will be broadcast to all relevant services in real-time.
      </p>

      <div className="border border-slate-200 rounded-lg">
        <div className="border-b border-slate-200">
            <nav className="-mb-px flex space-x-6 px-4">
                {tabs.map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        {t[tab.labelKey]}
                    </button>
                ))}
            </nav>
        </div>
        
        <div className="p-4">
            <label htmlFor="rule-editor" className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
                <CodeBracketIcon className="w-5 h-5 mr-2" />
                {t['rules.editorTitle']}
            </label>
            {isLoading ? (
                <div className="flex justify-center items-center h-80 bg-slate-50 rounded-md">
                    <LoadingIcon className="h-10 w-10 text-blue-600" />
                </div>
            ) : (
                <textarea
                    id="rule-editor"
                    value={ruleContent}
                    onChange={(e) => {
                        setRuleContent(e.target.value);
                        setValidationStatus('idle');
                    }}
                    className="w-full h-80 p-3 font-mono text-sm bg-slate-50 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            )}
             {validationStatus !== 'idle' && (
                <div className={`mt-2 text-sm p-2 rounded-md ${validationStatus === 'valid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {validationStatus === 'valid' ? t['rules.valid'] : `${t['rules.invalid']} ${validationError}`}
                </div>
            )}
        </div>
        
        <div className="bg-slate-50 px-4 py-3 flex justify-end items-center space-x-3 border-t border-slate-200">
             {showSuccess && <span className="text-sm text-green-600">{t['rules.saved']}</span>}
            <button
                onClick={handleValidate}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
            >
                {t['rules.validate']}
            </button>
            <button
                onClick={handleApply}
                disabled={isSaving || isLoading}
                className="inline-flex justify-center items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:bg-blue-300"
            >
                {isSaving && <LoadingIcon className="h-4 w-4 mr-2" />}
                {t['rules.apply']}
            </button>
        </div>
      </div>
    </div>
  );
};

export default RulesEngine;