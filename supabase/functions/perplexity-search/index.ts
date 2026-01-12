import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface JobPayload {
    title?: string;
    company?: string;
    location?: string;
    url?: string;
    Job_URL?: string; // fallback
    Job_Title?: string; // fallback
    Company?: string; // fallback
    Location?: string; // fallback
    date_posted?: string;
    description?: string;
    salary_range?: string;
    'Salary Range'?: string; // fallback
    technologies?: string[];
    'Key Technologies'?: string[]; // fallback
    type?: string;
}

interface PerplexityJob {
    title: string;
    company: string;
    location: string;
    salary_range: string;
    type: string;
    technologies: string[];
    source: string;
    url: string;
    date_posted: string;
}

interface SearchRequestBody {
    role?: string;
    jobs?: JobPayload[];
    keyword?: string; // for Push mode context
}

Deno.serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        if (req.method !== 'POST') {
            throw new Error(`Method ${req.method} not allowed`);
        }

        const body: SearchRequestBody = await req.json().catch(() => ({}));

        // ------------------------------------------------------------------
        // MODE 1: PUSH (Direct Data Ingestion)
        // ------------------------------------------------------------------
        if (body.jobs && Array.isArray(body.jobs) && body.jobs.length > 0) {
            console.log(`[PUSH] Received ${body.jobs.length} jobs.`);
            return await handlePushMode(body.jobs, body.keyword || 'perplexity_push');
        }

        // ------------------------------------------------------------------
        // MODE 2: PULL (Trigger Perplexity API Search)
        // ------------------------------------------------------------------
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (authError || !user) {
            console.error("Auth Error:", authError);
            return new Response(
                JSON.stringify({ error: 'Unauthorized: You must be logged in to search.' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const role = body.role || "Python / AI";
        console.log(`[PULL] Triggering search for: ${role} (User: ${user.email})`);
        return await handlePullMode(role);

    } catch (error: any) {
        console.error("Handler Error:", error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

/**
 * Handle direct job ingestion (Push Mode)
 */
async function handlePushMode(jobs: JobPayload[], keywordContext: string) {
    const jobsToInsert = jobs.map((j) => {
        const url = j.url || j.Job_URL || "";
        const title = j.title || j.Job_Title || "Unknown Title";
        const company = j.company || j.Company || "Unknown Company";
        // Generate a random external_id if URL is missing to ensure uniqueness for manual entries,
        // but prefer URL if available.
        const external_id = url || `manual-${Date.now()}-${Math.random().toString(36).substring(7)}`;

        const techList = j.technologies || j['Key Technologies'] || [];
        const salary = j.salary_range || j['Salary Range'] || 'N/A';

        return {
            external_id: external_id,
            title: title,
            company: company,
            location: j.location || j.Location || "Remote",
            job_url: url,
            keyword: keywordContext,
            source: 'perplexity_push',
            posted_at: j.date_posted || new Date().toISOString(),
            description: j.description || `Salary: ${salary}, Tech: ${Array.isArray(techList) ? techList.join(', ') : techList}`
        };
    });

    if (jobsToInsert.length > 0) {
        const { error } = await supabase
            .from('discovered_jobs')
            .upsert(jobsToInsert, { onConflict: 'external_id', ignoreDuplicates: true });

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw new Error(`Database Insert Failed: ${error.message}`);
        }
    }

    return new Response(
        JSON.stringify({ success: true, count: jobsToInsert.length, mode: 'push' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
}

/**
 * Handle Perplexity API Search (Pull Mode)
 */
async function handlePullMode(role: string) {
    if (!PERPLEXITY_API_KEY) {
        throw new Error('PERPLEXITY_API_KEY is not set in Edge Function secrets.');
    }

    const systemPrompt = "You are a specialized job search assistant. You return purely JSON data.";
    const userPrompt = `
      Search for the latest remote job openings related to: ${role} (and related like Django, ML, Scraping).

      Search across multiple reliable sources including LinkedIn, Indeed, Wellfound, RemoteOK, We Work Remotely, and company career pages.

      Rules:
      - Only include jobs posted within the last 10 days.
      - Remote or remote-friendly only.
      - Exclude internships and junior-only roles.
      - Deduplicate jobs.

      Output strictly valid JSON (no markdown) with this structure:
      {
        "jobs": [
          {
            "title": "Job Title",
            "company": "Company Name",
            "location": "Remote / Country",
            "salary_range": "Salary if available",
            "type": "Full-time / Contract",
            "technologies": ["Tech1", "Tech2"],
            "source": "Source Name",
            "url": "Job URL",
            "date_posted": "YYYY-MM-DD"
          }
        ]
      }
    `;

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'llama-3.1-sonar-large-128k-online',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.1
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Perplexity API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let content = data.choices[0]?.message?.content;
    if (!content) {
        throw new Error("Perplexity returned empty content.");
    }

    // Cleanup JSON string (remove markdown fences)
    content = content.replace(/```json\n?|\n?```/g, '').trim();

    let jobs: PerplexityJob[] = [];
    try {
        const parsed = JSON.parse(content);
        jobs = parsed.jobs || [];
    } catch (e) {
        console.error("JSON Parse Error. Content was:", content);
        throw new Error("Failed to parse Perplexity JSON response");
    }

    console.log(`[PULL] Perplexity found ${jobs.length} jobs.`);

    const jobsToInsert = jobs.map(j => ({
        external_id: j.url || `pplx-${Date.now()}-${Math.random()}`,
        title: j.title || "Unknown Title",
        company: j.company || "Unknown Company",
        location: j.location,
        job_url: j.url || "",
        keyword: role,
        source: 'perplexity_auto',
        posted_at: j.date_posted || new Date().toISOString(),
        description: `Salary: ${j.salary_range}, Type: ${j.type}, Tech: ${Array.isArray(j.technologies) ? j.technologies.join(', ') : j.technologies}`,
    }));

    if (jobsToInsert.length > 0) {
        const { error } = await supabase
            .from('discovered_jobs')
            .upsert(jobsToInsert, { onConflict: 'external_id', ignoreDuplicates: true });

        if (error) {
            console.error("Supabase Insert Error:", error);
            throw new Error(`Database Insert Failed: ${error.message}`);
        }
    }

    return new Response(
        JSON.stringify({ success: true, count: jobsToInsert.length, jobs: jobsToInsert, mode: 'pull' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
}
