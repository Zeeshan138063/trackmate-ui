import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.16.0'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const signature = req.headers.get('stripe-signature')
    if (!signature) {
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log(`Processing webhook event: ${event.type}`)

    switch (event.type) {
      // Handle successful checkout sessions
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Update payment record
        const { error: paymentError } = await supabase
          .from('payments')
          .update({
            status: 'paid',
            provider_payment_intent_id: session.payment_intent as string,
            transaction_id: session.payment_intent as string,
            updated_at: new Date().toISOString()
          })
          .eq('provider_session_id', session.id)

        if (paymentError) {
          console.error('Error updating payment:', paymentError)
        }

        // If this is a subscription checkout, handle subscription creation
        if (session.mode === 'subscription' && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
          
          // Get user_id from payment record
          const { data: paymentData } = await supabase
            .from('payments')
            .select('user_id, metadata')
            .eq('provider_session_id', session.id)
            .single()

          if (paymentData) {
            const metadata = paymentData.metadata as any
            
            const { error: subError } = await supabase
              .from('subscriptions')
              .insert({
                user_id: paymentData.user_id,
                provider_subscription_id: subscription.id,
                provider_customer_id: subscription.customer as string,
                status: subscription.status,
                plan_id: metadata?.plan_id || 'pro',
                plan_name: metadata?.plan_name || 'Pro Plan',
                amount: subscription.items.data[0]?.price.unit_amount || 0,
                currency: subscription.items.data[0]?.price.currency || 'usd',
                interval_type: subscription.items.data[0]?.price.recurring?.interval || 'month',
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
              })

            if (subError) {
              console.error('Error creating subscription:', subError)
            }
          }
        }
        break
      }

      // Handle subscription updates
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            cancelled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('provider_subscription_id', subscription.id)

        if (error) {
          console.error('Error updating subscription:', error)
        }
        break
      }

      // Handle subscription cancellations
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        const { error } = await supabase
          .from('subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('provider_subscription_id', subscription.id)

        if (error) {
          console.error('Error cancelling subscription:', error)
        }
        break
      }

      // Handle payment method attached
      case 'payment_method.attached': {
        const paymentMethod = event.data.object as Stripe.PaymentMethod
        
        if (paymentMethod.customer) {
          // Get user_id from existing subscription or payment
          const { data: userData } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('provider_customer_id', paymentMethod.customer as string)
            .single()

          if (userData && paymentMethod.card) {
            const { error } = await supabase
              .from('payment_methods')
              .insert({
                user_id: userData.user_id,
                provider_customer_id: paymentMethod.customer as string,
                provider_payment_method_id: paymentMethod.id,
                type: paymentMethod.type,
                card_brand: paymentMethod.card.brand,
                card_last4: paymentMethod.card.last4,
                card_exp_month: paymentMethod.card.exp_month,
                card_exp_year: paymentMethod.card.exp_year,
                is_default: false
              })

            if (error) {
              console.error('Error storing payment method:', error)
            }
          }
        }
        break
      }

      // Handle failed payments
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const { error } = await supabase
            .from('subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('provider_subscription_id', invoice.subscription as string)

          if (error) {
            console.error('Error updating subscription status:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Webhook handler failed' }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
