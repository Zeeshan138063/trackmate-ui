import { SearchConfig } from "./search-intelligence";

export const mapConfigToFilters = (config: SearchConfig): Record<string, any> => {
    const filters: Record<string, any> = {};

    // 1. Date Posted (f_TPR)
    if (config.datePosted === 'today') filters.f_TPR = "r86400";
    else if (config.datePosted === 'week') filters.f_TPR = "r604800";
    else if (config.datePosted === 'month') filters.f_TPR = "r2592000";
    else if (config.datePosted === 'custom' && config.customTimeSeconds) {
        filters.f_TPR = `r${config.customTimeSeconds}`;
    }
    // Default to 24h if not specified? Or let backend decide? 
    // Let's stick to what the user selected. If 'any', we send nothing (or backend defaults).

    // 2. Experience Level (f_E)
    if (config.experienceLevel && config.experienceLevel.length > 0) {
        filters.f_E = config.experienceLevel;
    }

    // 3. Workplace Type (f_WT)
    let wt = config.workplaceType || [];
    if (config.remote && wt.length === 0) wt = ['2']; // Legacy support

    if (wt.length > 0) {
        filters.f_WT = wt;
    }

    // 4. Excluded terms?? 
    // Backend scraper supports `keywords` param. Exclusions usually done in query string "-term".
    // We should probably include regular query + exclusions in the "keyword" column?
    // The current JobQueryManager takes "keyword" input separately. 
    // Ideally we append exclusions to the keyword string.

    return filters;
};

export const getEffectivedKeyword = (config: SearchConfig, baseKeyword?: string): string => {
    let q = baseKeyword || config.query;
    if (config.excludedTerms && config.excludedTerms.length > 0) {
        q += ' ' + config.excludedTerms.map(t => `-${t}`).join(' ');
    }
    return q;
}
