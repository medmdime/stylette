// /supabase/functions/revenuecat-webhook/index.ts

import { createClient } from "npm:@supabase/supabase-js@2";
import { SubscriptionStatus } from "./_types.ts";
import { getActiveSubscriptionFromRC } from "./utils.ts";
import { handleTransferEvent } from "./transferHandler.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

console.log("RevenueCat webhook function is initializing.");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const eventPayload = await req.json();
    const { event } = eventPayload;
    console.log(`Processing RevenueCat event: ${event.type}`);

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    if (event.type === "TRANSFER") {
      return await handleTransferEvent(event, corsHeaders, supabaseAdmin);
    }

    const userIdToProcess = event.app_user_id;

    const rcApiKey = Deno.env.get("REVENUECAT_API_KEY");
    if (!rcApiKey) {
      throw new Error("REVENUECAT_API_KEY environment variable is not set.");
    }

    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${userIdToProcess}`,
      {
        headers: { "Authorization": `Bearer ${rcApiKey}` },
      },
    );

    if (!rcResponse.ok) {
      // If RevenueCat API fails, we cannot verify the user's status.
      // This is a critical point; we shouldn't update our DB with potentially stale or incorrect info.
      console.error(
        `Failed to fetch from RevenueCat API for user ${userIdToProcess}: ${await rcResponse
          .text()}`,
      );

      return new Response(
        `Failed to verify user with RevenueCat.`,
        { status: rcResponse.status, headers: corsHeaders },
      );
    }
    const subscriberData = await rcResponse.json();
    const activeSubscription = getActiveSubscriptionFromRC(subscriberData);

    let statusFromEvent;
    switch (event.type) {
      case "INITIAL_PURCHASE":
      case "RENEWAL":
      case "UNCANCELLATION":
      case "PRODUCT_CHANGE":
      case "NON_RENEWING_PURCHASE":
        statusFromEvent = SubscriptionStatus.ACTIVE;
        break;
      case "CANCELLATION":
        statusFromEvent = SubscriptionStatus.CANCELED;
        break;
      case "EXPIRATION":
      case "BILLING_ISSUE":
        statusFromEvent = SubscriptionStatus.EXPIRED;
        break;
      default:
        console.warn(`Unhandled event type: ${event.type}`);
        return new Response("Unhandled event type", {
          status: 200,
          headers: corsHeaders,
        });
    }

    const subscriptionData = {
      user_id: userIdToProcess,
      status: statusFromEvent,
      plan_id: activeSubscription
        ? activeSubscription.plan_id
        : event.product_id,
      period_end_date: activeSubscription
        ? activeSubscription.period_end_date
        : (event.expiration_at_ms
          ? new Date(event.expiration_at_ms).toISOString()
          : null),
      updated_at: new Date().toISOString(),
    };

    // Upsert (create or update) the subscription record
    const { data, error } = await supabaseAdmin.from("subscriptions").upsert(
      subscriptionData,
      { onConflict: "user_id" },
    ).select().single();

    if (error) {
      throw new Error(
        `Supabase upsert error: ${error?.message || "Unknown error"}`,
      );
    }

    console.log(
      `Successfully processed event for user ${userIdToProcess}. New status: ${subscriptionData.status}.`,
    );
    return new Response(JSON.stringify({ received: true, data }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
