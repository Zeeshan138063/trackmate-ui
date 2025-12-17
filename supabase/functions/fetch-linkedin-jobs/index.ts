import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts";
// Configuration for embedding model
// Using remote HF API
const EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

// Helper to generate embeddings via Hugging Face API
async function generateEmbedding(text) {
    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
        console.error("Missing HF_TOKEN environment variable");
        return null; // Skip embedding generation if token is missing
    }
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(
                "https://router.huggingface.co/hf-inference/models/BAAI/bge-small-en-v1.5",
                {
                    headers: {
                        Authorization: `Bearer ${HF_TOKEN}`,
                        "Content-Type": "application/json",
                    },
                    method: "POST",
                    body: JSON.stringify({ inputs: text }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                // If model is loading (503), wait and retry
                if (response.status === 503) {
                    console.log(`HF Model loading... Attempt ${i + 1}/${maxRetries}. Waiting 5s.`);
                    await new Promise(r => setTimeout(r, 5000));
                    continue;
                }
                console.error(`HF Inference Error [${response.status}]: ${errorText}`);
                console.error("Token used:", "hf_JZW...Xii"); // Verify token is being sent
                return null;
            }

            const result = await response.json();
            if (Array.isArray(result) && Array.isArray(result[0])) {
                return result[0];
            }
            if (Array.isArray(result)) return result; // valid embedding

            console.error("Unexpected HF output format", result);
            return null;
        } catch (e) {
            console.error("Embedding generation failed", e);
            return null;
        }
    }
    return null;
}

Deno.serve(async (req) => {
    try {
        // 1. Get Keywords to search
        const { keyword: payloadKeyword, filters } = await req.json().catch(() => ({}));

        let queries = [];
        if (payloadKeyword) {
            queries.push({ keyword: payloadKeyword, filters: filters || {} });
        } else {
            const { data, error } = await supabase
                .from('job_search_queries')
                .select('keyword, filters')
                .eq('is_active', true);

            if (data && data.length > 0) {
                // Deduplicate queries to avoid scraping the same thing multiple times
                const uniqueMap = new Map();
                data.forEach(q => {
                    // Create a unique key based on keyword and stringified filters
                    // Normalize filters? Ideally yes, but basic stringify is good enough for now
                    const key = `${q.keyword.toLowerCase()}-${JSON.stringify(q.filters)}`;
                    if (!uniqueMap.has(key)) {
                        uniqueMap.set(key, q);
                    }
                });
                queries = Array.from(uniqueMap.values());
                console.log(`Found ${data.length} total active queries, reduced to ${queries.length} unique searches.`);
            }
            else queries = [{ keyword: 'remote software engineer', filters: {} }]; // Default fallback
        }

        const results = [];

        // 2. Process each query
        for (const q of queries) {
            console.log(`Processing query: ${q.keyword}`);

            // Construct URL
            const params = new URLSearchParams();
            params.append('keywords', q.keyword);
            params.append('sortBy', 'DD'); // Date Descending

            // Apply filters
            const f = q.filters || {};
            params.append('f_TPR', f.f_TPR || 'r86400');
            if (f.f_E) params.append('f_E', Array.isArray(f.f_E) ? f.f_E.join(',') : f.f_E);
            if (f.f_WT) params.append('f_WT', Array.isArray(f.f_WT) ? f.f_WT.join(',') : f.f_WT);

            const url = `https://www.linkedin.com/jobs/search/?${params.toString()}`;
            console.log(`Fetching: ${url}`);

            // 3. Fetch HTML
            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.5',
                }
            });

            if (!response.ok) {
                console.error(`Failed to fetch ${url}: ${response.status}`);
                continue;
            }

            const html = await response.text();
            const doc = new DOMParser().parseFromString(html, "text/html");

            if (!doc) continue;

            // 4. Parse Jobs
            const jobCards = doc.querySelectorAll('.base-search-card');
            console.log(`Found ${jobCards.length} cards`);

            const potentialJobs = [];

            // 4a. Extract raw data first (fast)
            for (const card of jobCards) {
                try {
                    const titleElem = card.querySelector('.base-search-card__title');
                    const linkElem = card.querySelector('.base-card__full-link');

                    const title = titleElem?.textContent?.trim();
                    const jobUrl = linkElem?.getAttribute('href');

                    if (!title || !jobUrl) continue;

                    const externalId = card.getAttribute('data-entity-urn') || jobUrl?.split('?')[0];
                    const companyElem = card.querySelector('.base-search-card__subtitle');
                    const locationElem = card.querySelector('.job-search-card__location');
                    const timeElem = card.querySelector('time');

                    const postedText = timeElem?.textContent?.trim(); // e.g. "2 hours ago"

                    // Minimal validation logic
                    const isRecent = postedText?.match(/minute|hour|Just now|New/i) || postedText?.match(/^1 day ago/);
                    if (!isRecent && params.get('f_TPR') === 'r86400') {
                        // We still scrape it if it appeared in 24h filter results
                    }

                    potentialJobs.push({
                        external_id: externalId,
                        title,
                        company: companyElem?.textContent?.trim(),
                        location: locationElem?.textContent?.trim(),
                        job_url: jobUrl.split('?')[0],
                        keyword: q.keyword,
                        source: 'linkedin_auto',
                        posted_at: new Date().toISOString(),
                        description: postedText
                    });

                } catch (e) {
                    console.error("Error parsing card", e);
                }
            }

            // 4b. Filter existing jobs to save compute 
            // SMART FILTER: Only process jobs that are NEW or lack an embedding
            const newJobsToProcess = [];
            if (potentialJobs.length > 0) {
                const ids = potentialJobs.map(j => j.external_id);

                // Find IDs that already have a valid embedding
                const { data: completedJobs } = await supabase
                    .from('discovered_jobs')
                    .select('external_id')
                    .in('external_id', ids)
                    .not('embedding', 'is', null);

                const completedSet = new Set(completedJobs?.map(e => e.external_id));

                for (const job of potentialJobs) {
                    // Only process if NOT in the completed set
                    if (!completedSet.has(job.external_id)) {
                        newJobsToProcess.push(job);
                    }
                }
            }
            // const newJobsToProcess = potentialJobs; // OLD: Process ALL (Disabled)

            console.log(`Jobs to process (New or Missing Embedding): ${newJobsToProcess.length}`);

            const discoveredJobs = [];

            // 4c. Generate Embeddings AND fetch details only for NEW jobs
            for (const job of newJobsToProcess) {
                // Fetch full description if possible
                try {
                    console.log(`Fetching details for: ${job.title}`);
                    const detailRes = await fetch(job.job_url, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                        }
                    });

                    if (detailRes.ok) {
                        const detailHtml = await detailRes.text();
                        const detailDoc = new DOMParser().parseFromString(detailHtml, "text/html");
                        // Try common selectors for description
                        const descContainer = detailDoc?.querySelector('.description__text') ||
                            detailDoc?.querySelector('.show-more-less-html__markup') ||
                            detailDoc?.querySelector('.job-description');

                        if (descContainer) {
                            let text = descContainer.textContent?.trim() || "";
                            // Basic cleanup
                            text = text.replace(/\s+/g, ' ').substring(0, 5000); // Limit length
                            if (text) job.description = text;
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch details for ${job.job_url}`, e);
                }

                // Generate embedding via HF API
                const textToEmbed = `${job.title} ${job.description || ''} ${job.company} ${job.location}`;
                const embedding = await generateEmbedding(textToEmbed);

                // Add a small delay to respect rate limits if processing many
                await new Promise(r => setTimeout(r, 1000)); // Increased delay since we are fetching pages

                discoveredJobs.push({
                    ...job,
                    embedding // might be null, but better than crashing
                });
            }

            // 5. Insert into DB (only new jobs)
            if (discoveredJobs.length > 0) {
                const { error } = await supabase
                    .from('discovered_jobs')
                    .insert(discoveredJobs); // Insert instead of upsert since we filtered

                if (error) console.error("DB Insert Error", error);
                else results.push(...discoveredJobs.map(j => j.title));
            }

            // 6. Update last_run_at for this query (by keyword and filters?)
            // Since we deduped by memory, 'q' might not have the ID if we constructed it manually or if we didn't select ID.
            // But we selected 'keyword, filters' in the previous query. 
            // We should select ID too or update by keyword + user_id?
            // Wait, queries can be shared by multiple users now if we had the same keyword/filters... 
            // But we deduped them. We should update ALL queries that matched this keyword/filter combo.

            // Re-update all matching queries for this keyword to show they ran
            await supabase
                .from('job_search_queries')
                .update({ last_run_at: new Date().toISOString() })
                .eq('keyword', q.keyword)
                .is('is_active', true);

        }

        return new Response(
            JSON.stringify({ success: true, processed: results.length, jobs: results }),
            { headers: { "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { "Content-Type": "application/json" },
            status: 500,
        })
    }
})
