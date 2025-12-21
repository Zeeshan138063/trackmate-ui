import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { linkedinUrl } = await req.json()

        if (!linkedinUrl) {
            throw new Error('No LinkedIn URL provided')
        }

        console.log('Fetching LinkedIn profile via Jina:', linkedinUrl)

        // Jina AI Reader URL format
        const jinaUrl = `https://r.jina.ai/${linkedinUrl}`

        const response = await fetch(jinaUrl)

        if (!response.ok) {
            throw new Error(`Failed to fetch from Jina: ${response.status} ${response.statusText}`)
        }

        const markdown = await response.text()

        if (!markdown || markdown.length < 50) {
            throw new Error('Received empty or invalid response from Jina')
        }

        return new Response(
            JSON.stringify({ markdown }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Error fetching LinkedIn profile:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            }
        )
    }
})
