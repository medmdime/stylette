import { createClient } from 'npm:@supabase/supabase-js@2';
import { RevenueCatEvent, SubscriptionStatus } from './_types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

console.log('RevenueCat webhook function is initializing.');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {

    const eventPayload: RevenueCatEvent = await req.json();
    const { event } = eventPayload;

    console.log(`Processing RevenueCat event: ${event.type} for user: ${event.app_user_id}`);

    // 3. Create a Supabase client with the service role key to bypass RLS.
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

     let status: SubscriptionStatus;
    switch (event.type) {
      case 'INITIAL_PURCHASE':
      case 'RENEWAL':
      case 'UNCANCELLATION':
      case 'PRODUCT_CHANGE':
      case 'NON_RENEWING_PURCHASE':
        status = SubscriptionStatus.ACTIVE;
        break;
      case 'CANCELLATION':
        status = SubscriptionStatus.CANCELED;
        break;
      case 'EXPIRATION':
      case 'BILLING_ISSUE':
        status = SubscriptionStatus.EXPIRED;
        break;
      default:

        console.warn(`Unhandled event type: ${event.type}`);
        return new Response('Unhandled event type', { status: 200, headers: corsHeaders });
    }

    // 5. Prepare the data for upserting into the 'subscriptions' table.
    const subscriptionData = {
      user_id: event.app_user_id,
      status: status,
      plan_id: event.product_id,
      period_end_date: event.expiration_at_ms
        ? new Date(event.expiration_at_ms).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    };

    // 6. Use 'upsert' to create or update the user's subscription record.
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Supabase upsert error:', error);
      throw new Error(`Failed to update subscription in database: ${error.message}`);
    }

    console.log(
      `Successfully processed event for user ${event.app_user_id}. New status: ${status}.`
    );

    // 7. Return a 200 OK response to RevenueCat to acknowledge receipt.
    return new Response(JSON.stringify({ received: true, data }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err : any) {
    console.error('Webhook processing error:', err.message);
    return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
