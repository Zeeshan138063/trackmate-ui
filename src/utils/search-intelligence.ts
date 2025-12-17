export interface SearchConfig {
    query: string;
    location: string;
    remote: boolean; // kept for backward compatibility/quick toggle
    datePosted: 'any' | 'today' | '3days' | 'week' | 'month' | 'custom';
    customTimeSeconds?: number;
    experienceLevel?: string[]; // 1=Internship, 2=Entry, etc.
    workplaceType?: string[]; // 1=On-site, 2=Remote, 3=Hybrid
    excludedTerms: string[];
}

export const generateSearchUrl = (
    platform: 'google' | 'linkedin' | 'indeed',
    config: SearchConfig
): string => {
    const { query, location, remote, datePosted, excludedTerms, experienceLevel, workplaceType, customTimeSeconds } = config;

    // Base query construction with exclusion
    let q = query;
    if (remote && (!workplaceType || workplaceType.length === 0)) {
        // Legacy behavior: if remote toggle is on but no specific workplace types selected, assume Remote
        // If workplaceType is populated, we rely on that instead
    }

    // Google/Indeed might accept "remote" in keyword, but LinkedIn handles it via filters
    if (platform !== 'linkedin' && remote) {
        q += ' "remote"';
    }

    if (excludedTerms.length > 0) {
        q += ' ' + excludedTerms.map(t => `-${t}`).join(' ');
    }

    const encodedQ = encodeURIComponent(q);
    const encodedLoc = encodeURIComponent(location);

    switch (platform) {
        case 'google':
            // Google Jobs specific params
            let googleUrl = `https://www.google.com/search?q=${encodedQ}&ibp=htl;jobs`;
            if (datePosted === 'today') googleUrl += "&tbs=qdr:d";
            if (datePosted === '3days') googleUrl += "&tbs=qdr:d3";
            if (datePosted === 'week') googleUrl += "&tbs=qdr:w";
            if (datePosted === 'month') googleUrl += "&tbs=qdr:m";
            return googleUrl;

        case 'linkedin':
            // LinkedIn Jobs params
            let liUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQ}&location=${encodedLoc}&sortBy=DD`;

            // Workplace Type (f_WT)
            // 1=On-site, 2=Remote, 3=Hybrid
            let wt: string[] = workplaceType || [];
            if (remote && wt.length === 0) wt.push('2'); // Legacy support

            if (wt.length > 0) {
                liUrl += `&f_WT=${wt.join('%2C')}`; // comma encoded
            }

            // Experience Level (f_E)
            if (experienceLevel && experienceLevel.length > 0) {
                liUrl += `&f_E=${experienceLevel.join('%2C')}`;
            }

            // Time Posted (f_TPR)
            if (datePosted === 'today') liUrl += "&f_TPR=r86400"; // 24h
            else if (datePosted === 'week') liUrl += "&f_TPR=r604800";
            else if (datePosted === 'month') liUrl += "&f_TPR=r2592000";
            else if (datePosted === 'custom' && customTimeSeconds) {
                liUrl += `&f_TPR=r${customTimeSeconds}`;
            }

            return liUrl;

        case 'indeed':
            let indeedUrl = `https://www.indeed.com/jobs?q=${encodedQ}&l=${encodedLoc}&sort=date`;

            if (datePosted === 'today') indeedUrl += "&fromage=1";
            else if (datePosted === '3days') indeedUrl += "&fromage=3";
            else if (datePosted === 'week') indeedUrl += "&fromage=7";
            else if (datePosted === 'month') indeedUrl += "&fromage=30";

            return indeedUrl;

        default:
            return '#';
    }
};

export const suggestKeywords = (title: string): string[] => {
    // Simple keyword expansion (mock intelligence)
    const map: Record<string, string[]> = {
        'developer': ['Software Engineer', 'Programmer', 'Coder', 'Frontend', 'Backend'],
        'manager': ['Lead', 'Director', 'Head of', 'Principal'],
        'designer': ['UX', 'UI', 'Product Designer', 'Creative'],
        'sales': ['Account Executive', 'SDR', 'Business Development'],
        'marketing': ['Growth', 'Brand', 'Content', 'Social Media']
    };

    const lowerTitle = title.toLowerCase();
    for (const key in map) {
        if (lowerTitle.includes(key)) return map[key];
    }
    return [];
};
