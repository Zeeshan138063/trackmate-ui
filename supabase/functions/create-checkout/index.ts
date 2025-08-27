import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0'

const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
}) : null;

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Define available plans
const PLANS = {
  pro: {
    name: 'Pro Plan',
    description: 'Unlimited job tracking, advanced resume builder, interview preparation',
    monthly: {
      price_id: 'price_pro_monthly', // Replace with actual Stripe Price ID
      amount: 2999, // $29.99 in cents
    },
    yearly: {
      price_id: 'price_pro_yearly', // Replace with actual Stripe Price ID
      amount: 29999, // $299.99 in cents (save $60)
    }
  },
  premium: {
    name: 'Premium Plan',
    description: 'Everything in Pro plus AI-powered insights and priority support',
    monthly: {
      price_id: 'price_premium_monthly', // Replace with actual Stripe Price ID
      amount: 4999, // $49.99 in cents
    },
    yearly: {
      price_id: 'price_premium_yearly', // Replace with actual Stripe Price ID
      amount: 49999, // $499.99 in cents (save $100)
    }
  }
}

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
    if (!authHeader) {
      return new Response('Missing authorization header', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Initialize Supabase client with the auth header
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response('Unauthorized', { 
        status: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const { plan_id, interval, success_url, cancel_url } = await req.json()

    // Validate plan and interval
    if (!PLANS[plan_id as keyof typeof PLANS]) {
      return new Response('Invalid plan ID', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    if (!['monthly', 'yearly'].includes(interval)) {
      return new Response('Invalid interval', { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    const plan = PLANS[plan_id as keyof typeof PLANS]
    const planInterval = plan[interval as 'monthly' | 'yearly']

    // Check if Stripe is configured
    if (!stripe) {
      // Return mock data for testing when Stripe is not configured
      console.log('Stripe not configured, returning mock data')
      
      const mockResponse = {
        session_id: 'cs_test_mock_session_id',
        url: 'https://checkout.stripe.com/pay/mock-session-id',
        payment_id: Math.floor(Math.random() * 1000000)
      };
      
      return new Response(JSON.stringify(mockResponse), {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      })
    }

    // Create or get Stripe customer
    let customerId: string
    
    // Check if user already has a customer ID
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .single()

    if (existingSubscription?.provider_customer_id) {
      customerId = existingSubscription.provider_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
    }

    // Create payment record first
    const { data: paymentData, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: user.id,
        amount: planInterval.amount,
        currency: 'usd',
        status: 'pending',
        provider: 'stripe',
        description: `${plan.name} - ${interval} billing`,
        metadata: {
          plan_id,
          plan_name: plan.name,
          interval,
          customer_id: customerId
        }
      })
      .select()
      .single()

    if (paymentError || !paymentData) {
      console.error('Error creating payment record:', paymentError)
      return new Response('Failed to create payment record', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
        }
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: planInterval.price_id,
          quantity: 1,
        },
      ],
      success_url: success_url || `${req.headers.get('origin')}/settings?tab=billing&success=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/settings?tab=billing&cancelled=true`,
      metadata: {
        user_id: user.id,
        payment_id: paymentData.id.toString(),
        plan_id,
        interval,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id,
          plan_name: plan.name,
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    })

    // Update payment record with session ID
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        provider_session_id: session.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentData.id)

    if (updateError) {
      console.error('Error updating payment with session ID:', updateError)
    }

    return new Response(
      JSON.stringify({
        session_id: session.id,
        url: session.url,
        payment_id: paymentData.id
      }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Checkout creation error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      {
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        status: 500,
      }
    )
  }
})
