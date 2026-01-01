/**
 * Centralized LocalStorage keys for the entire application.
 * All storage keys should be defined here to ensure consistency and type safety.
 */
export const STORAGE_KEYS = {
    BOOKMARKS: 'dev0gig_bookmarks',
    JOURNAL: 'terminal_journal_entries',
    BUDGET: {
        TRANSACTIONS: 'mybudget_transactions',
        ACCOUNTS: 'mybudget_accounts',
        CATEGORIES: 'mybudget_categories',
        FIXED_COSTS: 'mybudget_fixedcosts',
        FIXED_COST_GROUPS: 'mybudget_fixedcostgroups',
    },
    YOUTUBE: 'youtube_url_history',
    MTG: {
        CARDS: 'mtg-cards',
        CACHE: 'mtg-cache',
    },
    FLASHCARDS: {
        CARDS: 'flashcards_data',
        DECKS: 'flashcards_decks',
    },
    THEME: 'dashboard_accent_color',
    SIDEBAR: 'sidebar_permanent_visible',
    SAVINGS_SIM: {
        CURRENT_SAVINGS: 'savings-sim-currentSavings',
        MONTHLY_CONTRIBUTION: 'savings-sim-monthlyContribution',
        CASH_AMOUNT: 'savings-sim-cashAmount',
        CASH_INTEREST_RATE: 'savings-sim-cashInterestRate',
        ETF_ANNUAL_RETURN: 'savings-sim-etfAnnualReturn',
        TIMEFRAME_YEARS: 'savings-sim-timeframeYears',
        CALCULATION_MODE: 'savings-sim-calculationMode',
        TARGET_AMOUNT: 'savings-sim-targetAmount',
    },
    IMMO_CHECK: {
        NET_INCOME: 'immo-check-netIncome',
        MONTHLY_FIXED_COSTS: 'immo-check-monthlyFixedCosts',
        HOUSE_PRICE: 'immo-check-housePrice',
        EQUITY: 'immo-check-equity',
        INTEREST_RATE: 'immo-check-interestRate',
        REPAYMENT_RATE: 'immo-check-repaymentRate',
        LOAN_DURATION: 'immo-check-loanDuration',
    },
} as const;
