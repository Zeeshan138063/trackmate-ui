export interface SearchConfig {
    query: string;
    location: string;
    remote: boolean;
    datePosted: 'any' | 'today' | '3days' | 'week' | 'month';
    excludedTerms: string[];
}

export const generateSearchUrl = (
    platform: 'google' | 'linkedin' | 'indeed',
    config: SearchConfig
): string => {
    const { query, location, remote, datePosted, excludedTerms } = config;

    // Base query construction with exclusion
    let q = query;
    if (remote) q += ' "remote"';
    if (excludedTerms.length > 0) {
        q += ' ' + excludedTerms.map(t => `-${t}`).join(' ');
    }

    const encodedQ = encodeURIComponent(q);
    const encodedLoc = encodeURIComponent(location);

    switch (platform) {
        case 'google':
            // Google Jobs specific params
            // ibp=htl;jobs (triggers jobs UI)
            // q=...
            let googleUrl = `https://www.google.com/search?q=${encodedQ}&ibp=htl;jobs`;
            if (datePosted === 'today') googleUrl += "&tbs=qdr:d";
            if (datePosted === '3days') googleUrl += "&tbs=qdr:d3";
            if (datePosted === 'week') googleUrl += "&tbs=qdr:w";
            if (datePosted === 'month') googleUrl += "&tbs=qdr:m";
            return googleUrl;

        case 'linkedin':
            // LinkedIn Jobs params
            // f_TPR=r86400 (24h), r604800 (week)
            // f_WT=2 (Remote)
            let liUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodedQ}&location=${encodedLoc}`;

            if (remote) liUrl += "&f_WT=2"; // Remote filter

            if (datePosted === 'today') liUrl += "&f_TPR=r86400";
            else if (datePosted === 'week') liUrl += "&f_TPR=r604800";
            else if (datePosted === 'month') liUrl += "&f_TPR=r2592000";

            return liUrl;

        case 'indeed':
            // Indeed params
            // fromage=1 (1 day), 3, 7
            // sc=0kf:attr(DSQF7); (Remote filter varies, usually keyword is better)
            let indeedUrl = `https://www.indeed.com/jobs?q=${encodedQ}&l=${encodedLoc}`;

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
