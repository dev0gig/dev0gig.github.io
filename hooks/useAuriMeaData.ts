
import { useState, useEffect, useCallback } from 'react';
import { Account, Transaction, TransactionTemplate, Categories } from '../components/AuriMea/types';
import { INITIAL_ACCOUNTS } from '../components/AuriMea/constants';
import { initialTransactions, initialTemplates, initialCategories } from '../components/AuriMea/data';

export const useAuriMeaData = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
    const [categories, setCategories] = useState<Categories>({ income: [], expense: [] });
    const [activeAccountId, setActiveAccountId] = useState<string>('');
    const [isInitialSetup, setIsInitialSetup] = useState(false);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    // Load state from localStorage on initial render
    useEffect(() => {
        try {
            const storedAccounts = localStorage.getItem('aurimea_accounts');
            const parsedAccounts = storedAccounts ? JSON.parse(storedAccounts) : INITIAL_ACCOUNTS;
            setAccounts(parsedAccounts);

            if (parsedAccounts.length === 0) {
                setIsInitialSetup(true);
            } else {
                const storedActiveId = localStorage.getItem('aurimea_activeAccountId');
                if (storedActiveId && parsedAccounts.some((acc: Account) => acc.id === storedActiveId)) {
                    setActiveAccountId(storedActiveId);
                } else {
                    setActiveAccountId(parsedAccounts[0].id);
                }
            }

            const storedTransactions = localStorage.getItem('aurimea_transactions');
            setTransactions(storedTransactions ? JSON.parse(storedTransactions) : initialTransactions);
            
            const storedTemplates = localStorage.getItem('aurimea_templates');
            setTemplates(storedTemplates ? JSON.parse(storedTemplates) : initialTemplates);

            const storedCategories = localStorage.getItem('aurimea_categories');
            setCategories(storedCategories ? JSON.parse(storedCategories) : initialCategories);

        } catch (error) {
            console.error("Failed to load data from localStorage, falling back to initial data.", error);
            setAccounts(INITIAL_ACCOUNTS);
            if (INITIAL_ACCOUNTS.length > 0) {
                setActiveAccountId(INITIAL_ACCOUNTS[0].id);
            } else {
                setIsInitialSetup(true);
            }
            setTransactions(initialTransactions);
            setTemplates(initialTemplates);
            setCategories(initialCategories);
        } finally {
            setIsDataLoaded(true);
        }
    }, []);
    
    // Effect to exit setup mode once an account is created
    useEffect(() => {
        if (accounts.length > 0 && isInitialSetup) {
            setIsInitialSetup(false);
        }
    }, [accounts, isInitialSetup]);

    // Save state to localStorage whenever it changes
    useEffect(() => { if(isDataLoaded) localStorage.setItem('aurimea_accounts', JSON.stringify(accounts)); }, [accounts, isDataLoaded]);
    useEffect(() => { if(isDataLoaded && activeAccountId) localStorage.setItem('aurimea_activeAccountId', activeAccountId); }, [activeAccountId, isDataLoaded]);
    useEffect(() => { if(isDataLoaded) localStorage.setItem('aurimea_transactions', JSON.stringify(transactions)); }, [transactions, isDataLoaded]);
    useEffect(() => { if(isDataLoaded) localStorage.setItem('aurimea_templates', JSON.stringify(templates)); }, [templates, isDataLoaded]);
    useEffect(() => { if(isDataLoaded) localStorage.setItem('aurimea_categories', JSON.stringify(categories)); }, [categories, isDataLoaded]);

    const importAuriMeaData = useCallback((data: { accounts: Account[], transactions: Transaction[], categories: Categories, templates: TransactionTemplate[], activeAccountId?: string }) => {
        if (data.accounts.length === 0) {
            setIsInitialSetup(true);
            setAccounts([]);
            setActiveAccountId('');
        } else {
            setIsInitialSetup(false);
            setAccounts(data.accounts);
            const newActiveId = data.activeAccountId && data.accounts.some(acc => acc.id === data.activeAccountId)
                ? data.activeAccountId
                : data.accounts[0].id;
            setActiveAccountId(newActiveId);
        }
        setTransactions(data.transactions);
        setCategories(data.categories);
        setTemplates(data.templates);
    }, []);

    const resetAuriMeaData = useCallback(() => {
        setAccounts([]);
        setTransactions([]);
        setTemplates(initialTemplates);
        setCategories(initialCategories);
        setActiveAccountId('');
        setIsInitialSetup(true);
        // Clear local storage too
        localStorage.removeItem('aurimea_accounts');
        localStorage.removeItem('aurimea_transactions');
        localStorage.removeItem('aurimea_templates');
        localStorage.removeItem('aurimea_categories');
        localStorage.removeItem('aurimea_activeAccountId');
    }, []);

    return {
        accounts, setAccounts,
        transactions, setTransactions,
        templates, setTemplates,
        categories, setCategories,
        activeAccountId, setActiveAccountId,
        isInitialSetup,
        isDataLoaded,
        importAuriMeaData,
        resetAuriMeaData,
    };
};