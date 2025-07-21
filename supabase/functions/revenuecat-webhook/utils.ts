// /supabase/functions/revenuecat-webhook/utils.ts

import { SubscriptionStatus } from "./_types.ts";

export function getActiveSubscriptionFromRC(subscriberData: any) {
    const entitlements = subscriberData?.subscriber?.entitlements;
    if (!entitlements) return null;

    const activeEntitlement: any = Object.values(entitlements).find(
        (ent: any) =>
            ent.expires_date === null ||
            new Date(ent.expires_date) > new Date(),
    );

    if (!activeEntitlement) return null;

    return {
        plan_id: activeEntitlement.product_identifier,
        period_end_date: activeEntitlement.expires_date
            ? new Date(activeEntitlement.expires_date).toISOString()
            : null,
        status: SubscriptionStatus.ACTIVE,
    };
}
