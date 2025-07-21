// /supabase/functions/revenuecat-webhook/transferHandler.ts

import { getActiveSubscriptionFromRC } from "./utils.ts";

export async function handleTransferEvent(
    event: any,
    corsHeaders: any,
    supabaseAdmin: any,
) {
    const { transferred_from, transferred_to } = event;

    if (!transferred_from?.length || !transferred_to?.length) {
        throw new Error(
            "Invalid TRANSFER event: missing transferred_from or transferred_to arrays.",
        );
    }

    const newUserId = transferred_to[0];
    console.log(
        `Processing transfer from ${
            transferred_from.join(", ")
        } to ${newUserId}`,
    );

    const rcApiKey = Deno.env.get("REVENUECAT_API_KEY");
    if (!rcApiKey) {
        throw new Error("REVENUECAT_API_KEY environment variable is not set.");
    }

    const rcResponse = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${newUserId}`,
        {
            headers: { "Authorization": `Bearer ${rcApiKey}` },
        },
    );

    if (!rcResponse.ok) {
        // If RevenueCat API fails for the new user, we cannot proceed securely.
        console.error(
            `Failed to fetch from RevenueCat API for transferred_to user ${newUserId}: ${await rcResponse
                .text()}`,
        );
        return new Response(`Failed to verify new user with RevenueCat.`, {
            status: rcResponse.status,
            headers: corsHeaders,
        });
    }

    const subscriberData = await rcResponse.json();
    const activeSubscription = getActiveSubscriptionFromRC(subscriberData);

    // Process and update Supabase with data primarily from RC API (if active)
    // For transfers, we always delete the old, and then upsert the new.
    // If no active subscription for new user, we still delete old and ensure new user has no active subscription.
    if (!activeSubscription) {
        console.warn(
            `No active entitlement found in RevenueCat for transferred user ${newUserId}. Deleting old subscriptions.`,
        );
        // Delete old subscriptions regardless, as the transfer has conceptually happened in RC
        await supabaseAdmin.from("subscriptions").delete().in(
            "user_id",
            transferred_from,
        );

        // Optionally, if new user existed and had a subscription, you might want to expire it here
        // based on no active entitlement found. For simplicity, we just delete the old.
        // If you need to ensure the new user's status is "expired" or similar when no active entitlement,
        // you'd do another upsert here for newUserId with an EXPIRED status.
        // For now, if no active entitlement, we only handle deletion of old user.
        return new Response(
            "Transfer processed: old user removed, no active entitlement for new user.",
            { status: 200, headers: corsHeaders },
        );
    }

    // Use data from activeSubscription (fetched from RC API) for the new user's entry
    const newSubscriptionData = {
        user_id: newUserId,
        status: activeSubscription.status,
        plan_id: activeSubscription.plan_id,
        period_end_date: activeSubscription.period_end_date,
        updated_at: new Date().toISOString(),
    };

    const [deleteResult, upsertResult] = await Promise.all([
        supabaseAdmin.from("subscriptions").delete().in(
            "user_id",
            transferred_from,
        ),
        supabaseAdmin.from("subscriptions").upsert(newSubscriptionData, {
            onConflict: "user_id",
        }).select().single(),
    ]);

    if (deleteResult.error) {
        throw new Error(
            `Failed to delete old subscription: ${deleteResult.error.message}`,
        );
    }
    if (upsertResult.error) {
        throw new Error(
            `Failed to upsert new subscription: ${upsertResult.error.message}`,
        );
    }

    console.log(
        `Successfully processed TRANSFER. Deleted for: ${
            transferred_from.join(", ")
        }. Upserted for: ${newUserId}.`,
    );
    return new Response(
        JSON.stringify({ received: true, data: upsertResult.data }),
        {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
    );
}
