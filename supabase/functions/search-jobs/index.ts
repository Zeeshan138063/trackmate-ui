import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// Using Remote HF API

const EMBEDDING_MODEL = 'Supabase/gte-small';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function generateEmbedding(text) {
    const HF_TOKEN = Deno.env.get('HF_TOKEN');
    if (!HF_TOKEN) {
        console.error("Missing HF_TOKEN environment variable");
        return null;
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
                if (response.status === 503) {
                    // Model loading
                    await new Promise(r => setTimeout(r, 3000));
                    continue;
                }
                console.error("HF Error", errorText);
                return null;
            }

            const result = await response.json();
            if (Array.isArray(result) && Array.isArray(result[0])) return result[0];
            return result;
        } catch (e) {
            return null;
        }
    }
    return null;
}

Deno.serve(async (req) => {
    // CORS logic
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
    }

    try {
        const { query, offset = 0, limit = 20, datePosted, remote } = await req.json();

        if (!query) {
            return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        // 1. Generate Embedding for Query via HF API
        console.log(`Embedding query: ${query}, Offset: ${offset}, Limit: ${limit}, Date: ${datePosted}, Remote: ${remote}`);
        const queryEmbedding = await generateEmbedding(query);

        if (!queryEmbedding) {
            return new Response(JSON.stringify({ error: "Failed to generate embedding" }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
        }

        // 2. Prepare Filters
        let minPostedDate = null;
        if (datePosted) {
            const now = new Date();
            if (datePosted === 'today') {
                now.setHours(now.getHours() - 24);
                minPostedDate = now.toISOString();
            } else if (datePosted === '3days') {
                now.setDate(now.getDate() - 3);
                minPostedDate = now.toISOString();
            } else if (datePosted === 'week') {
                now.setDate(now.getDate() - 7);
                minPostedDate = now.toISOString();
            } else if (datePosted === 'month') {
                now.setMonth(now.getMonth() - 1);
                minPostedDate = now.toISOString();
            }
        }

        // 3. Call RPC
        const { data: jobs, error } = await supabase.rpc('match_jobs', {
            query_embedding: queryEmbedding,
            match_threshold: 0.60, // 60% similarity
            match_count: limit,
            offset_val: offset,
            min_posted_date: minPostedDate,
            is_remote: remote
        });

        if (error) {
            console.error("Vector search error", error);
            throw error;
        }

        console.log(`Found ${jobs?.length} matches`);

        return new Response(JSON.stringify(jobs), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            status: 500
        })
    }
})
