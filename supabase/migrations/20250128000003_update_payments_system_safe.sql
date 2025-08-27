-- Safe migration to update payments system - handles existing tables gracefully

-- Update payments table (if it exists) or create it
DO $$ 
BEGIN
    -- Check if payments table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        -- Table exists, add missing columns if they don't exist
        
        -- Add columns that might be missing
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider') THEN
            ALTER TABLE public.payments ADD COLUMN provider text NOT NULL DEFAULT 'stripe';
        END IF;
         
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider_session_id') THEN
            ALTER TABLE public.payments ADD COLUMN provider_session_id text;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'provider_payment_intent_id') THEN
            ALTER TABLE public.payments ADD COLUMN provider_payment_intent_id text;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'transaction_id') THEN
            ALTER TABLE public.payments ADD COLUMN transaction_id text;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'description') THEN
            ALTER TABLE public.payments ADD COLUMN description text;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'metadata') THEN
            ALTER TABLE public.payments ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
        END IF;
        
        -- Update status constraint if it exists and is different
        BEGIN
            ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
            ALTER TABLE public.payments ADD CONSTRAINT payments_status_check 
                CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded'));
        EXCEPTION
            WHEN OTHERS THEN NULL; -- Ignore errors if constraint doesn't exist
        END;
        
        -- Ensure currency has default
        ALTER TABLE public.payments ALTER COLUMN currency SET DEFAULT 'usd';
        
        RAISE NOTICE 'Updated existing payments table with new columns';
    ELSE
        -- Table doesn't exist, create it
        CREATE TABLE public.payments (
            id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            amount int NOT NULL,
            currency text NOT NULL DEFAULT 'usd',
            status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'cancelled', 'refunded')),
            provider text NOT NULL DEFAULT 'stripe',
            provider_session_id text,
            provider_payment_intent_id text,
            transaction_id text,
            description text,
            metadata jsonb DEFAULT '{}'::jsonb,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
        RAISE NOTICE 'Created new payments table';
    END IF;
END $$;

-- Create subscriptions table (safe creation)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_subscription_id text NOT NULL UNIQUE,
    provider_customer_id text NOT NULL,
    status text NOT NULL CHECK (status IN ('trialing', 'active', 'incomplete', 'incomplete_expired', 'past_due', 'cancelled', 'unpaid')),
    plan_id text NOT NULL,
    plan_name text NOT NULL,
    amount int NOT NULL,
    currency text NOT NULL DEFAULT 'usd',
    interval_type text NOT NULL CHECK (interval_type IN ('month', 'year')),
    current_period_start timestamp with time zone NOT NULL,
    current_period_end timestamp with time zone NOT NULL,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    cancelled_at timestamp with time zone,
    trial_start timestamp with time zone,
    trial_end timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create payment_methods table (safe creation)
CREATE TABLE IF NOT EXISTS public.payment_methods (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_customer_id text NOT NULL,
    provider_payment_method_id text NOT NULL UNIQUE,
    type text NOT NULL DEFAULT 'card',
    card_brand text,
    card_last4 text,
    card_exp_month int,
    card_exp_year int,
    is_default boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (safe - won't error if already enabled)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies (with IF NOT EXISTS equivalent using DO blocks)

-- Payments policies
DO $$ 
BEGIN
    -- Check if policy exists before creating
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can view their own payments') THEN
        CREATE POLICY "Users can view their own payments" 
        ON public.payments 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can create their own payments') THEN
        CREATE POLICY "Users can create their own payments" 
        ON public.payments 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can update their own payments') THEN
        CREATE POLICY "Users can update their own payments" 
        ON public.payments 
        FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    -- Note: No DELETE policy for payments table - payments should be kept for audit purposes
    -- If you need to allow deletion, uncomment the following:
    /*
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Users can delete their own payments') THEN
        CREATE POLICY "Users can delete their own payments" 
        ON public.payments 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
    */
END $$;

-- Subscriptions policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can view their own subscriptions') THEN
        CREATE POLICY "Users can view their own subscriptions" 
        ON public.subscriptions 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can create their own subscriptions') THEN
        CREATE POLICY "Users can create their own subscriptions" 
        ON public.subscriptions 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'subscriptions' AND policyname = 'Users can update their own subscriptions') THEN
        CREATE POLICY "Users can update their own subscriptions" 
        ON public.subscriptions 
        FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Payment methods policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Users can view their own payment methods') THEN
        CREATE POLICY "Users can view their own payment methods" 
        ON public.payment_methods 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Users can create their own payment methods') THEN
        CREATE POLICY "Users can create their own payment methods" 
        ON public.payment_methods 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Users can update their own payment methods') THEN
        CREATE POLICY "Users can update their own payment methods" 
        ON public.payment_methods 
        FOR UPDATE 
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Users can delete their own payment methods') THEN
        CREATE POLICY "Users can delete their own payment methods" 
        ON public.payment_methods 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Create triggers (safe - will replace if exists)
DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON public.payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
    BEFORE UPDATE ON public.payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes (safe - will not error if exists)
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_provider_session_id ON public.payments(provider_session_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_provider_subscription_id ON public.subscriptions(provider_subscription_id);

CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON public.payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_provider_customer_id ON public.payment_methods(provider_customer_id);

-- Log completion
DO $$ 
BEGIN
    RAISE NOTICE 'Payment system migration completed successfully';
    RAISE NOTICE 'Tables: payments (updated/created), subscriptions (created), payment_methods (created)';
    RAISE NOTICE 'RLS policies, triggers, and indexes have been applied';
END $$;
