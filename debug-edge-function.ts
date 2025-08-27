import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    console.log('=== DEBUG: Function started ===')
    console.log('Method:', req.method)
    console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing')
    console.log('STRIPE_SECRET_KEY:', Deno.env.get('STRIPE_SECRET_KEY') ? 'Set' : 'Missing')

    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      })
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the current user
    console.log('=== DEBUG: Getting user ===')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('User:', user ? `Found: ${user.id}` : 'Not found')
    console.log('Auth error:', authError)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError }), { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      })
    }

    // Parse request body
    console.log('=== DEBUG: Parsing request body ===')
    const body = await req.json()
    console.log('Request body:', body)

    const { plan_id, interval, success_url, cancel_url } = body

    // Validate inputs
    if (!plan_id || !interval) {
      return new Response(JSON.stringify({ error: 'Missing plan_id or interval' }), {
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      })
    }

    // Test database connection
    console.log('=== DEBUG: Testing database connection ===')
    try {
      const { data: testData, error: testError } = await supabase
        .from('payments')
        .select('count')
        .limit(1)

      console.log('Database test result:', testData, testError)
      
      if (testError) {
        return new Response(JSON.stringify({ 
          error: 'Database connection failed', 
          details: testError.message 
        }), {
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          }
        })
      }
    } catch (dbError) {
      console.error('Database test error:', dbError)
      return new Response(JSON.stringify({ 
        error: 'Database test failed', 
        details: dbError.message 
      }), {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        }
      })
    }

    // Return success for debugging
    return new Response(JSON.stringify({
      success: true,
      message: 'Debug function working',
      user_id: user.id,
      plan_id,
      interval,
      environment_check: {
        supabase_url: !!supabaseUrl,
        service_key: !!supabaseServiceKey,
        stripe_key: !!Deno.env.get('STRIPE_SECRET_KEY')
      }
    }), {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    })

  } catch (error) {
    console.error('=== DEBUG: Caught error ===', error)
    return new Response(JSON.stringify({ 
      error: 'Function error', 
      details: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      }
    })
  }
})
