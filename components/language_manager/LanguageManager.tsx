
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Language, I18nCoverage } from '../../types';
import * as api from '../../services/api';
import { ALL_LANGUAGES } from '../../constants';
// FIX: Replaced DocumentMagnifyingGlassIcon with SearchIcon which is already defined.
import { LoadingIcon, SearchIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '../Icons';

interface LanguageManagerProps {
  t: Record<string, string>;
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
        setEditableLocales(prev => ({