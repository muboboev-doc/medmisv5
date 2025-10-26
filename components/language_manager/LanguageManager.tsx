

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, I18nCoverage, TranslationMap } from '../../types';
import * as api from '../../services/api';
import { ALL_LANGUAGES } from '../../constants';
// FIX: Replaced DocumentMagnifyingGlassIcon with SearchIcon which is already defined.
import { LoadingIcon, SearchIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '../Icons';

interface LanguageManagerProps {
  // FIX: Use TranslationMap for 't' prop
  t: TranslationMap;
}

const LanguageManager: React.FC<LanguageManagerProps> = ({ t }) => {
    const [locales, setLocales] = useState<Record<Language, Record<string, string>>>({} as any);
    const [editableLocales, setEditableLocales] = useState<Record<Language, Record<string, string>>>({} as any);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [coverage, setCoverage] = useState<I18nCoverage | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.fetchLocales();
            setLocales(data);
            setEditableLocales(JSON.parse(JSON.stringify(data)));
        } catch (error) {
            console.error("Failed to fetch locales:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const allKeys = useMemo(() => {
        const keySet = new Set<string>();
        Object.values(locales).forEach(lang => {
            if (lang) Object.keys(lang).forEach(key => keySet.add(key));
        });
        return Array.from(keySet).sort();
    }, [locales]);

    const filteredKeys = useMemo(() => {
        if (!searchQuery) return allKeys;
        const lowercasedQuery = searchQuery.toLowerCase();
        return allKeys.filter(key => 
            key.toLowerCase().includes(lowercasedQuery) ||
            Object.values(editableLocales).some(lang => lang[key]?.toLowerCase().includes(lowercasedQuery))
        );
    }, [allKeys, searchQuery, editableLocales]);

    const handleValueChange = (lang: Language, key: string, value: string) => {
        // FIX: Ensure prev[lang] is an object before spreading to prevent type errors
        setEditableLocales(prev => ({
            ...prev,
            [lang]: {
                ...(prev[lang] || {}), // Initialize with empty object if undefined
                [key]: value
            }
        }));
    };

    const handleSaveChanges = async () => {
        setIsSaving(true);
        try {
            await api.updateLocales(editableLocales);
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
            fetchData();
        } catch (e) {
            console.error("Failed to save locales", e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCheckCoverage = async () => {
        setIsChecking(true);
        try {
            const result = await api.checkI18nCoverage();
            setCoverage(result);
        } catch (e) {
            console.error("Failed to check coverage", e);
        } finally {
            setIsChecking(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><LoadingIcon className="h-12 w-12 text-blue-600" /></div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t.languageManager}</h2>
            
            <div className="flex justify-between items-center mb-4">
                <div className="relative">
                    <SearchIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search keys or translations..."
                        className="pl-10 pr-4 py-2 border rounded-md"
                    />
                </div>
                <div className="flex space-x-2">
                    <button onClick={handleCheckCoverage} disabled={isChecking} className="btn-secondary">
                        {isChecking ? <LoadingIcon className="h-4 w-4 mr-2"/> : null}
                        {t['langMgr.checkCoverage']}
                    </button>
                    <button className="btn-secondary">{t['langMgr.import']}</button>
                    <button className="btn-secondary">{t['langMgr.export']}</button>
                    <button onClick={handleSaveChanges} disabled={isSaving} className="btn-primary">
                        {isSaving ? <LoadingIcon className="h-4 w-4 mr-2"/> : null}
                        {t['langMgr.save']}
                    </button>
                </div>
            </div>

            {coverage && (
                <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                    <h3 className="font-bold text-slate-800 mb-2">{t['langMgr.coverageReport']}</h3>
                    <div className="flex space-x-4">
                        {Object.entries(coverage.coverage).map(([lang, data]) => (
                            <div key={lang}>
                                <span className="font-bold uppercase">{lang}:</span> {data.percentage}% ({data.count}/{coverage.totalKeys})
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="p-3 text-left font-semibold text-slate-700 w-1/5">{t['langMgr.key']}</th>
                            {ALL_LANGUAGES.map(lang => <th key={lang} className="p-3 text-left font-semibold text-slate-700 uppercase">{lang}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {filteredKeys.map(key => (
                            <tr key={key} className="border-t hover:bg-slate-50">
                                <td className="p-2 font-mono text-xs text-slate-600">{key}</td>
                                {ALL_LANGUAGES.map(lang => (
                                    <td key={lang} className="p-2">
                                        <input
                                            type="text"
                                            value={editableLocales[lang]?.[key] || ''}
                                            onChange={(e) => handleValueChange(lang, key, e.target.value)}
                                            className="w-full p-1 border border-transparent rounded hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <style>{`
                .btn-primary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-medium; color: white; background-color: #2563eb; border-radius: 0.375rem; }
                .btn-primary:hover { background-color: #1d4ed8; }
                .btn-secondary { display: inline-flex; align-items: center; padding: 0.5rem 1rem; font-medium; color: #334155; background-color: #f1f5f9; border-radius: 0.375rem; }
                .btn-secondary:hover { background-color: #e2e8f0; }
            `}</style>
        </div>
    );
};

export default LanguageManager;
