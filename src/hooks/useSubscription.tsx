import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface Subscription {
  id: number;
  providerSubscriptionId: string;
  providerCustomerId: string;
  status: 'trialing' | 'active' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'cancelled' | 'unpaid';
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  intervalType: 'month' | 'year';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
}

export interface PaymentMethod {
  id: number;
  providerPaymentMethodId: string;
  type: string;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const { user } = useAuth();

  const fetchSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching subscription:', error);
        toast.error('Failed to fetch subscription');
        return;
      }

      if (data) {
        setSubscription({
          id: data.id,
          providerSubscriptionId: data.provider_subscription_id,
          providerCustomerId: data.provider_customer_id,
          status: data.status,
          planId: data.plan_id,
          planName: data.plan_name,
          amount: data.amount,
          currency: data.currency,
          intervalType: data.interval_type,
          currentPeriodStart: data.current_period_start,
          currentPeriodEnd: data.current_period_end,
          cancelAtPeriodEnd: data.cancel_at_period_end,
          cancelledAt: data.cancelled_at,
          trialStart: data.trial_start,
          trialEnd: data.trial_end,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      toast.error('Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment methods:', error);
        return;
      }

      if (data) {
        setPaymentMethods(data.map(pm => ({
          id: pm.id,
          providerPaymentMethodId: pm.provider_payment_method_id,
          type: pm.type,
          cardBrand: pm.card_brand,
          cardLast4: pm.card_last4,
          cardExpMonth: pm.card_exp_month,
          cardExpYear: pm.card_exp_year,
          isDefault: pm.is_default,
        })));
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const createCheckoutSession = async (planId: string, interval: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('You must be logged in to subscribe');
      return null;
    }

    setIsCreatingCheckout(true);

    try {
      // Get user session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Authentication required');
        return null;
      }

      const response = await supabase.functions.invoke('create-checkout', {
        body: {
          plan_id: planId,
          interval,
          success_url: `${window.location.origin}/settings?tab=billing&success=true`,
          cancel_url: `${window.location.origin}/settings?tab=billing&cancelled=true`,
        },
      });

      if (response.error) {
        console.error('Checkout creation failed:', response.error);
        toast.error(`Failed to create checkout session: ${response.error.message}`);
        return null;
      }

      return response.data;
      
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session');
      return null;
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) {
      toast.error('No active subscription found');
      return;
    }

    try {
      // Note: This would typically call a backend endpoint to cancel via Stripe API
      // For now, we'll just show a message
      toast.info('Please contact support to cancel your subscription');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  };

  const isSubscriptionActive = () => {
    return subscription?.status === 'active' || subscription?.status === 'trialing';
  };

  const getSubscriptionStatusText = () => {
    if (!subscription) return 'No subscription';
    
    switch (subscription.status) {
      case 'active':
        return 'Active';
      case 'trialing':
        return 'Trial';
      case 'past_due':
        return 'Past Due';
      case 'cancelled':
        return 'Cancelled';
      case 'incomplete':
        return 'Incomplete';
      default:
        return subscription.status;
    }
  };

  const formatPrice = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  useEffect(() => {
    fetchSubscription();
    fetchPaymentMethods();
  }, [user]);

  return {
    subscription,
    paymentMethods,
    loading,
    isCreatingCheckout,
    createCheckoutSession,
    cancelSubscription,
    isSubscriptionActive,
    getSubscriptionStatusText,
    formatPrice,
    refetchSubscription: fetchSubscription,
    refetchPaymentMethods: fetchPaymentMethods,
  };
}
