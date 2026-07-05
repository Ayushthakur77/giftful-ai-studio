import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 500 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();

        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(expected);
        const b = Buffer.from(signature);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }

        const event = payload?.event as string | undefined;
        const paymentEntity = payload?.payload?.payment?.entity as any | undefined;
        if (!event || !paymentEntity) return new Response("ignored", { status: 200 });

        const providerOrderId = paymentEntity.order_id as string | undefined;
        if (!providerOrderId) return new Response("no order", { status: 200 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: payment } = await supabaseAdmin
          .from("payments").select("*").eq("provider_order_id", providerOrderId).maybeSingle();
        if (!payment) return new Response("payment not found", { status: 200 });

        if (event === "payment.captured") {
          // Delegate everything to the shared idempotent processor so
          // webhook and client-verify cannot diverge.
          const { processSuccessfulPayment } = await import("@/lib/payment-processing.server");
          await processSuccessfulPayment({
            orderId: payment.order_id,
            paymentRowId: payment.id,
            captured: {
              provider_payment_id: paymentEntity.id,
              method: paymentEntity.method,
              raw_response: paymentEntity,
            },
          });
        } else if (event === "payment.failed") {
          await supabaseAdmin.from("payments").update({
            status: "failed",
            error_code: paymentEntity.error_code,
            error_description: paymentEntity.error_description,
            raw_response: paymentEntity,
          }).eq("id", payment.id);
          await supabaseAdmin.from("orders")
            .update({ payment_status: "failed" })
            .eq("id", payment.order_id).eq("payment_status", "pending");
          await supabaseAdmin.from("notifications").insert({
            user_id: payment.user_id,
            type: "payment_failed",
            title: "Payment failed",
            body: paymentEntity.error_description ?? "Please retry your payment.",
            link: `/account/orders/${payment.order_id}`,
          });
        }
        return new Response("ok", { status: 200 });
      },
    },
  },
});
