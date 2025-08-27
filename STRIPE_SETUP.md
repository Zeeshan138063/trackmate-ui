# Stripe Payment Integration Setup

This document outlines how to set up Stripe payments with Supabase for the TrackMate application.

## Prerequisites

1. **Stripe Account**: Create a Stripe account at https://stripe.com
2. **Supabase Project**: Ensure your Supabase project is set up
3. **Database Migrations**: Run all payment-related migrations

## Required Environment Variables

### Supabase Edge Functions
Add these to your Supabase project's Edge Function secrets:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook endpoint secret from Stripe dashboard

# Supabase Configuration (already configured in Edge Functions)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend Environment Variables
Add these to your `.env.local` file:

```bash
# Stripe Public Key (for client-side)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Supabase Configuration (if not already present)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Setup

### 1. Run Migrations

Run these SQL migrations in your Supabase dashboard:

1. `20250128000000_add_application_goals.sql` - Application goals table
2. `20250128000001_add_user_settings.sql` - User settings table  
3. `20250128000002_add_payments_system.sql` - Payment system tables

### 2. Verify Tables

Ensure these tables exist in your database:
- `payments` - Payment transaction records
- `subscriptions` - Subscription management
- `payment_methods` - Stored payment methods
- `user_settings` - User preferences
- `application_goals` - Weekly application goals

## Stripe Configuration

### 1. Create Products and Prices

In your Stripe dashboard, create these products:

**Pro Plan**
- Product Name: "TrackMate Pro"
- Monthly Price: $29.99 USD (price_pro_monthly)
- Yearly Price: $299.99 USD (price_pro_yearly)

**Premium Plan** 
- Product Name: "TrackMate Premium"  
- Monthly Price: $49.99 USD (price_premium_monthly)
- Yearly Price: $499.99 USD (price_premium_yearly)

### 2. Update Price IDs

In `supabase/functions/create-checkout/index.ts`, update the PLANS object with your actual Stripe Price IDs:

```typescript
const PLANS = {
  pro: {
    monthly: {
      price_id: 'price_1234567890', // Replace with actual Price ID
      amount: 2999,
    },
    yearly: {
      price_id: 'price_0987654321', // Replace with actual Price ID  
      amount: 29999,
    }
  },
  // ... etc
}
```

### 3. Configure Webhooks

1. In Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_method.attached`
   - `invoice.payment_failed`
4. Copy the webhook secret to your Edge Function environment variables

## Deployment Steps

### 1. Deploy Edge Functions

```bash
# Deploy webhook handler
supabase functions deploy stripe-webhook

# Deploy checkout creation
supabase functions deploy create-checkout
```

### 2. Set Environment Variables

```bash
# Set Stripe keys
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Verify secrets
supabase secrets list
```

### 3. Test the Integration

1. **Test Checkout Flow**:
   - Go to Settings → Billing
   - Click "Upgrade to Pro" 
   - Complete test payment with Stripe test card: `4242 4242 4242 4242`

2. **Verify Database Records**:
   - Check `payments` table for transaction record
   - Check `subscriptions` table for subscription record
   - Check `payment_methods` table for stored payment method

3. **Test Webhooks**:
   - Use Stripe CLI to forward webhooks locally
   - Verify webhook events are processed correctly

## Security Checklist

- ✅ RLS policies enabled on all payment tables
- ✅ Service role key used only in Edge Functions
- ✅ Webhook signature verification implemented
- ✅ User authentication verified before checkout creation
- ✅ No sensitive data exposed to client-side
- ✅ Payment data properly encrypted in transit

## Troubleshooting

### Common Issues

1. **Webhook Signature Verification Failed**
   - Verify `STRIPE_WEBHOOK_SECRET` is correctly set
   - Check webhook endpoint URL is correct

2. **Checkout Session Creation Failed**
   - Verify `STRIPE_SECRET_KEY` is valid
   - Check Price IDs match your Stripe dashboard

3. **Database Permission Errors**
   - Verify RLS policies are correctly configured
   - Check user authentication is working

4. **Payment Not Recorded**
   - Check webhook endpoint is receiving events
   - Verify database writes are successful

### Testing with Stripe CLI

```bash
# Install Stripe CLI
# Forward webhooks to local development
stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook

# Trigger test events
stripe trigger checkout.session.completed
```

## Production Considerations

1. **Switch to Live Keys**: Replace test keys with live Stripe keys
2. **Monitor Webhooks**: Set up monitoring for webhook failures
3. **Error Handling**: Implement proper error logging and alerting
4. **Backup Strategy**: Ensure payment data is included in backups
5. **Compliance**: Review PCI DSS requirements for your use case

## Support

For issues with this integration:
1. Check Supabase Edge Function logs
2. Review Stripe webhook event logs
3. Verify database table contents
4. Test with Stripe's test environment first

---

**Note**: This integration handles subscription billing securely through Stripe. All sensitive payment data is processed by Stripe and never stored in your database. Only payment metadata and status information is stored locally.
