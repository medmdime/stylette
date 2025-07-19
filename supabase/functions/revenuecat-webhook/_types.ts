
export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  EXPIRED = 'expired',
}



export interface RevenueCatEvent {
  api_version: string;
  event: {
    id: string;
    type:
      | 'INITIAL_PURCHASE'
      | 'RENEWAL'
      | 'CANCELLATION'
      | 'UNCANCELLATION'
      | 'PRODUCT_CHANGE'
      | 'EXPIRATION'
      |'NON_RENEWING_PURCHASE'
      | 'BILLING_ISSUE';
    app_user_id: string;
    product_id: string;
    entitlement_ids: string[];
    period_type: string;
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    store: 'APP_STORE' | 'PLAY_STORE' | 'STRIPE' | 'MAC_APP_STORE';
  };
}
