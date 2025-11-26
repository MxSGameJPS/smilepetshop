// Helper para disparar eventos do Meta Pixel (fbq) e encaminhar para CAPI
// Configuração esperada em ambiente de produção (Vercel):
// META_PIXEL_ID (server) e META_CAPI_TOKEN (server) para o endpoint serverless
export async function trackEvent(eventName, params = {}) {
  try {
    // generate a stable event id for deduplication (prefer crypto.randomUUID)
    let eventId = null;
    try {
      if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
      ) {
        eventId = crypto.randomUUID();
      } else if (
        typeof window !== "undefined" &&
        window.crypto &&
        window.crypto.randomUUID
      ) {
        eventId = window.crypto.randomUUID();
      }
    } catch {
      // ignore
    }
    if (!eventId) {
      // fallback: timestamp + random
      eventId = `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
    }

    // client-side Pixel: include event id in the params (both keys to increase compatibility)
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      try {
        const pixelParams = { ...params, event_id: eventId, eventID: eventId };
        window.fbq("track", eventName, pixelParams);
      } catch (err) {
        console.debug("fbq track failed", err);
      }
    }

    // For server-side CAPI we forward eventName, params and event_id. For certain events
    // (Purchase, InitiateCheckout) include user_data when available (pulled from localStorage).
    /* 
    // CAPI DESATIVADO TEMPORARIAMENTE (aguardando token)
    try {
      const body = { eventName, params: { ...params }, event_id: eventId };

      // try to include billing email/phone from checkout localStorage for better match rate
      try {
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem("smilepet_checkout_billing");
          if (raw) {
            const billing = JSON.parse(raw);
            const maybeEmail =
              billing?.email ||
              billing?.email_billing ||
              billing?.billing_email;
            const maybePhone =
              billing?.telefone || billing?.phone || billing?.phone_billing;
            const userData = {};
            if (maybeEmail) userData.email = String(maybeEmail).trim();
            if (maybePhone) userData.phone = String(maybePhone).trim();
            if (Object.keys(userData).length) body.user_data = userData;
          }
        }
      } catch {
        // ignore parsing errors
      }

      void fetch("/api/meta/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).catch((e) => {
        console.debug("CAPI forward failed", e);
      });
    } catch (err) {
      // ignore network errors
    }
    */
  } catch (err) {
    console.debug("trackEvent error", err);
  }
}

export default { trackEvent };
