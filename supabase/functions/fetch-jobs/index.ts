import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";

// Configuration
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Use a remote embedding model via HF
const HF_TOKEN = Deno.env.get('HF_TOKEN');

// ATS Domains to "Dork" for
// We prioritize these as they have standard DOM structures
const ATS_DOMAINS = [
    'site:boards.greenhouse.io',
    'site:jobs.lever.co',
    'site:apply.workable.com',
    'site:jobs.ashbyhq.com'
];

interface Job {
    external_id: string;
    title: string;
    company: string;
    location: string;
    job_url: string;
    keyword: string;
    source: string;
    posted_at: string;
    description?: string;
    embedding?: number[];
}

/**
 * Generate Embedding (Shared Utility)
 */
async function generateEmbedding(text: string) {
    if (!HF_TOKEN) return null;
    try {
        const response = await fetch(
            "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5",
            {
                headers: { Authorization: `Bearer ${HF_TOKEN}`, "Content-Type": "application/json" },
                method: "POST",
                body: JSON.stringify({ inputs: text.substring(0, 5000) }), // truncate
            }
        );
        if (!response.ok) return null;
        const result = await response.json();
        if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
        if (Array.isArray(result)) return result;
        return null;
    } catch {
        return null;
    }
}

/**
 * Perform a generic search to find URLs.
 * Uses DuckDuckGo HTML version to avoid complex anti-bot on Google.
 */
export async function searchWeb(query: string): Promise<string[]> {
    console.log(`Searching Web for: ${query}`);
    try {
        // Using html.duckduckgo.com for easier parsing
        const formData = new URLSearchParams();
        formData.append('q', query);

        const response = await fetch("https://html.duckduckgo.com/html/", {
            method: "POST",
            body: formData,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Search failed: ${response.status}`);
            return [];
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");

        if (!doc) return [];

        // Select results
        const links = Array.from(doc.querySelectorAll('.result__a'))
            .map(el => el.getAttribute('href'))
            .filter(href => href && href.startsWith('http'));

        // Filter out non-job links (ads, duckduckgo internal)
        const cleanLinks = links.filter(l =>
            !l.includes('duckduckgo.com') &&
            (l.includes('greenhouse.io') || l.includes('lever.co') || l.includes('workable.com') || l.includes('ashbyhq.com'))
        );

        return [...new Set(cleanLinks)]; // Dedupe
    } catch (error) {
        console.error("Search Error:", error);
        return [];
    }
}

/**
 * Universal ATS Parser
 */
export async function parseATS(url: string): Promise<Partial<Job> | null> {
    try {
        console.log(`Parsing ATS: ${url}`);
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        if (!response.ok) return null;

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, "text/html");
        if (!doc) return null;

        let title, company, location, description;

        // Greenhouse
        if (url.includes('greenhouse.io')) {
            title = doc.querySelector('.app-title, #app_title')?.textContent?.trim();
            company = doc.querySelector('.company-name')?.textContent?.trim();
            location = doc.querySelector('.location')?.textContent?.trim();
            description = doc.querySelector('#content, .content')?.textContent?.trim();
            company = company?.replace('at ', '');
        }
        // Lever
        else if (url.includes('lever.co')) {
            title = doc.querySelector('.posting-headline h2')?.textContent?.trim();
            company = doc.title?.split('-')[0]?.trim();
            location = doc.querySelector('.posting-categories .location, .location')?.textContent?.trim();
            description = doc.querySelector('.posting-description, .content')?.textContent?.trim();
        }
        // Workable
        else if (url.includes('workable.com')) {
            title = doc.querySelector('[data-ui="job-title"], h1')?.textContent?.trim();
            company = doc.querySelector('[data-ui="company-name"]')?.textContent?.trim();
            description = doc.querySelector('[data-ui="job-description"]')?.textContent?.trim();
            location = doc.querySelector('[data-ui="job-location"]')?.textContent?.trim();
        }
        // Ashby
        else if (url.includes('ashbyhq.com')) {
            title = doc.querySelector('h1')?.textContent?.trim();
            // Ashby often uses meta tags well
            const metaCompany = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content');
            company = metaCompany || "Unknown";
            description = doc.querySelector('.job-description')?.textContent?.trim();
        }

        if (title) {
            return {
                title,
                company: company || 'Unknown',
                location: location || 'Remote',
                description: description || title,
                job_url: url
            };
        }
        return null;
    } catch (e) {
        console.error(`Failed to parse ${url}`, e);
        return null;
    }
}

Deno.serve(async (req) => {
    try {
        const { keyword } = await req.json().catch(() => ({}));

        let queries = [];
        if (keyword) {
            queries.push({ keyword, filters: {} });
        } else {
            const { data } = await supabase.from('job_search_queries').select('keyword, filters').eq('is_active', true);
            queries = data || [];
        }

        const discoveredJobs: Job[] = [];
        const uniqueUrls = new Set<string>();

        // Limit concurrent execution for safety in this MVP
        for (const q of queries) {
            console.log(`\n--- Processing Query: ${q.keyword} ---`);

            // 1. Search Phase
            const searchPromises = ATS_DOMAINS.map(domain => {
                const query = `${domain} "${q.keyword}"`;
                return searchWeb(query);
            });

            const results = await Promise.all(searchPromises);
            const allLinks = results.flat();
            console.log(`Found ${allLinks.length} raw links`);

            // 2. Processing Phase
            for (const link of allLinks) {
                if (uniqueUrls.has(link)) continue;
                uniqueUrls.add(link);

                // Check DB for existing
                // Simple optimization: check if we scraped this URL recently? 
                // For now, let's just parse and let the DB dedupe on insert if we want, 
                // OR check existence now to save "parse" time.
                // We'll rely on the parser to be fast.

                const jobData = await parseATS(link);
                if (jobData) {
                    // Generate Embedding
                    const textToEmbed = `${jobData.title} ${jobData.company} ${jobData.location} ${jobData.description?.substring(0, 200)}`;
                    const embedding = await generateEmbedding(textToEmbed);

                    discoveredJobs.push({
                        external_id: link, // URL is the ID
                        title: jobData.title!,
                        company: jobData.company!,
                        location: jobData.location!,
                        job_url: link,
                        keyword: q.keyword,
                        source: 'ats_auto',
                        posted_at: new Date().toISOString(),
                        description: jobData.description,
                        embedding: embedding || undefined
                    });
                }

                // Be nice to the servers
                await new Promise(r => setTimeout(r, 500));
            }
        }

        // 3. Storage Phase
        if (discoveredJobs.length > 0) {
            console.log(`Inserting ${discoveredJobs.length} jobs...`);
            // We use 'upsert' or 'insert' with ignoreDuplicates if possible. 
            // supabase-js insert doesn't have 'ignoreDuplicates' easily without onConflict
            // Assumes 'discovered_jobs' has unique constraint on 'external_id'
            const { error } = await supabase
                .from('discovered_jobs')
                .upsert(discoveredJobs, { onConflict: 'external_id', ignoreDuplicates: true });

            if (error) console.error("DB Error:", error);
        }

        // Update Last Run
        // ... (omitted for brevity, can add later)

        return new Response(
            JSON.stringify({ success: true, count: discoveredJobs.length, jobs: discoveredJobs.map(j => j.title) }),
            { headers: { "Content-Type": "application/json" } }
        );

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
})
