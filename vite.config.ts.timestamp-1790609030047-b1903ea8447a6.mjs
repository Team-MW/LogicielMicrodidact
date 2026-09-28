// vite.config.ts
import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "file:///Users/elamine/Desktop/MWCREA/logiciel/logicielMicrodidact/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/elamine/Desktop/MWCREA/logiciel/logicielMicrodidact/node_modules/@vitejs/plugin-vue/dist/index.mjs";
var __vite_injected_original_import_meta_url = "file:///Users/elamine/Desktop/MWCREA/logiciel/logicielMicrodidact/vite.config.ts";
var apiCache = /* @__PURE__ */ new Map();
var CACHE_TTL_MS = 3e4;
function getCachedData(key) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}
function setCachedData(key, data) {
  apiCache.set(key, { data, timestamp: Date.now() });
}
var stripeDevPlugin = (env) => {
  let stripeInstance = null;
  const getStripe = async () => {
    if (!stripeInstance) {
      const Stripe = (await import("file:///Users/elamine/Desktop/MWCREA/logiciel/logicielMicrodidact/node_modules/stripe/esm/stripe.esm.node.js")).default;
      stripeInstance = new Stripe(env.STRIPE_SECRET_KEY || "");
    }
    return stripeInstance;
  };
  return {
    name: "stripe-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/stripe/payment-links", async (_req, res) => {
        try {
          const cached = getCachedData("payment-links");
          if (cached) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const paymentLinks = await stripe.paymentLinks.list({ limit: 50, active: true });
          setCachedData("payment-links", paymentLinks.data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(paymentLinks.data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use("/api/stripe/subscriptions", async (_req, res) => {
        try {
          const cached = getCachedData("subscriptions");
          if (cached) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const subscriptions = await stripe.subscriptions.list({ limit: 50, status: "active", expand: ["data.customer", "data.plan.product"] });
          setCachedData("subscriptions", subscriptions.data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(subscriptions.data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use("/api/stripe/invoices", async (_req, res) => {
        try {
          const cached = getCachedData("invoices");
          if (cached) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const invoices = await stripe.invoices.list({ limit: 50 });
          setCachedData("invoices", invoices.data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(invoices.data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use("/api/stripe/create-checkout", async (req, res) => {
        if (req.method !== "POST") return res.end();
        let body = "";
        req.on("data", (chunk) => {
          body += chunk.toString();
        });
        req.on("end", async () => {
          try {
            const stripe = await getStripe();
            const { amount, description, customerEmail } = JSON.parse(body);
            if (!amount || !description) throw new Error("Amount and description required");
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ["card", "sepa_debit"],
              mode: "subscription",
              line_items: [{
                price_data: {
                  currency: "eur",
                  recurring: { interval: "month" },
                  product_data: { name: description },
                  unit_amount: Math.round(amount * 100)
                },
                quantity: 1
              }],
              customer_email: customerEmail || void 0,
              success_url: "http://localhost:5173/facturation?success=true",
              cancel_url: "http://localhost:5173/facturation?canceled=true"
            });
            apiCache.clear();
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ url: session.url }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });
      server.middlewares.use("/api/stripe/customers", async (_req, res) => {
        try {
          const cached = getCachedData("customers");
          if (cached) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const customers = await stripe.customers.list({ limit: 50 });
          setCachedData("customers", customers.data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(customers.data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
      server.middlewares.use("/api/stripe/customer-invoices", async (req, res) => {
        try {
          const urlObj = new URL(req.url, "http://localhost");
          const customerId = urlObj.searchParams.get("customerId");
          if (!customerId) throw new Error("Customer ID is required");
          const cacheKey = `customer-invoices-${customerId}`;
          const cached = getCachedData(cacheKey);
          if (cached) {
            res.setHeader("Content-Type", "application/json");
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const invoices = await stripe.invoices.list({ customer: customerId, limit: 30 });
          setCachedData(cacheKey, invoices.data);
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(invoices.data));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
};
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    clearScreen: false,
    plugins: [vue(), stripeDevPlugin(env)],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", __vite_injected_original_import_meta_url))
      }
    },
    optimizeDeps: {
      holdUntilCrawlEnd: false,
      include: [
        "vue",
        "vue-router",
        "@supabase/supabase-js",
        "lucide-vue-next",
        "clsx",
        "tailwind-merge",
        "reka-ui",
        "radix-vue"
      ],
      exclude: ["stripe"]
    },
    server: {
      host: "127.0.0.1",
      port: 5173
    },
    ssr: {
      external: ["stripe"]
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvZWxhbWluZS9EZXNrdG9wL01XQ1JFQS9sb2dpY2llbC9sb2dpY2llbE1pY3JvZGlkYWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvZWxhbWluZS9EZXNrdG9wL01XQ1JFQS9sb2dpY2llbC9sb2dpY2llbE1pY3JvZGlkYWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9lbGFtaW5lL0Rlc2t0b3AvTVdDUkVBL2xvZ2ljaWVsL2xvZ2ljaWVsTWljcm9kaWRhY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBmaWxlVVJMVG9QYXRoLCBVUkwgfSBmcm9tICdub2RlOnVybCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgdnVlIGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZSdcblxuLy8gQ2FjaGUgZW4gbVx1MDBFOW1vaXJlIHBvdXIgYWNjXHUwMEU5bFx1MDBFOXJlciBsZXMgclx1MDBFOXBvbnNlcyBTdHJpcGUgZW4gZGV2XG5jb25zdCBhcGlDYWNoZSA9IG5ldyBNYXA8c3RyaW5nLCB7IGRhdGE6IGFueTsgdGltZXN0YW1wOiBudW1iZXIgfT4oKTtcbmNvbnN0IENBQ0hFX1RUTF9NUyA9IDMwMDAwOyAvLyBDYWNoZSBkZSAzMCBzZWNvbmRlc1xuXG5mdW5jdGlvbiBnZXRDYWNoZWREYXRhKGtleTogc3RyaW5nKSB7XG4gIGNvbnN0IGNhY2hlZCA9IGFwaUNhY2hlLmdldChrZXkpO1xuICBpZiAoY2FjaGVkICYmIERhdGUubm93KCkgLSBjYWNoZWQudGltZXN0YW1wIDwgQ0FDSEVfVFRMX01TKSB7XG4gICAgcmV0dXJuIGNhY2hlZC5kYXRhO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBzZXRDYWNoZWREYXRhKGtleTogc3RyaW5nLCBkYXRhOiBhbnkpIHtcbiAgYXBpQ2FjaGUuc2V0KGtleSwgeyBkYXRhLCB0aW1lc3RhbXA6IERhdGUubm93KCkgfSk7XG59XG5cbi8vIFBsdWdpbiBsb2NhbCBwb3VyIHNpbXVsZXIgbGVzIFNlcnZlcmxlc3MgRnVuY3Rpb25zIGRlIFZlcmNlbCBkdXJhbnQgbGUgYG5wbSBydW4gZGV2YFxuY29uc3Qgc3RyaXBlRGV2UGx1Z2luID0gKGVudjogUmVjb3JkPHN0cmluZywgc3RyaW5nPikgPT4ge1xuICBsZXQgc3RyaXBlSW5zdGFuY2U6IGFueSA9IG51bGw7XG4gIGNvbnN0IGdldFN0cmlwZSA9IGFzeW5jICgpID0+IHtcbiAgICBpZiAoIXN0cmlwZUluc3RhbmNlKSB7XG4gICAgICBjb25zdCBTdHJpcGUgPSAoYXdhaXQgaW1wb3J0KCdzdHJpcGUnKSkuZGVmYXVsdDtcbiAgICAgIHN0cmlwZUluc3RhbmNlID0gbmV3IFN0cmlwZShlbnYuU1RSSVBFX1NFQ1JFVF9LRVkgfHwgJycpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyaXBlSW5zdGFuY2U7XG4gIH07XG5cbiAgcmV0dXJuIHtcbiAgICBuYW1lOiAnc3RyaXBlLWRldi1hcGknLFxuICAgIGNvbmZpZ3VyZVNlcnZlcihzZXJ2ZXI6IGFueSkge1xuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zdHJpcGUvcGF5bWVudC1saW5rcycsIGFzeW5jIChfcmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gZ2V0Q2FjaGVkRGF0YSgncGF5bWVudC1saW5rcycpO1xuICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeShjYWNoZWQpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgc3RyaXBlID0gYXdhaXQgZ2V0U3RyaXBlKCk7XG4gICAgICAgICAgY29uc3QgcGF5bWVudExpbmtzID0gYXdhaXQgc3RyaXBlLnBheW1lbnRMaW5rcy5saXN0KHsgbGltaXQ6IDUwLCBhY3RpdmU6IHRydWUgfSk7XG4gICAgICAgICAgc2V0Q2FjaGVkRGF0YSgncGF5bWVudC1saW5rcycsIHBheW1lbnRMaW5rcy5kYXRhKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkocGF5bWVudExpbmtzLmRhdGEpKTtcbiAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgcmVzLnN0YXR1c0NvZGUgPSA1MDA7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeSh7IGVycm9yOiBlLm1lc3NhZ2UgfSkpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2VydmVyLm1pZGRsZXdhcmVzLnVzZSgnL2FwaS9zdHJpcGUvc3Vic2NyaXB0aW9ucycsIGFzeW5jIChfcmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gZ2V0Q2FjaGVkRGF0YSgnc3Vic2NyaXB0aW9ucycpO1xuICAgICAgICAgIGlmIChjYWNoZWQpIHtcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXR1cm4gcmVzLmVuZChKU09OLnN0cmluZ2lmeShjYWNoZWQpKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgY29uc3Qgc3RyaXBlID0gYXdhaXQgZ2V0U3RyaXBlKCk7XG4gICAgICAgICAgY29uc3Qgc3Vic2NyaXB0aW9ucyA9IGF3YWl0IHN0cmlwZS5zdWJzY3JpcHRpb25zLmxpc3QoeyBsaW1pdDogNTAsIHN0YXR1czogJ2FjdGl2ZScsIGV4cGFuZDogWydkYXRhLmN1c3RvbWVyJywgJ2RhdGEucGxhbi5wcm9kdWN0J10gfSk7XG4gICAgICAgICAgc2V0Q2FjaGVkRGF0YSgnc3Vic2NyaXB0aW9ucycsIHN1YnNjcmlwdGlvbnMuZGF0YSk7XG4gICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHN1YnNjcmlwdGlvbnMuZGF0YSkpO1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGUubWVzc2FnZSB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3N0cmlwZS9pbnZvaWNlcycsIGFzeW5jIChfcmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gZ2V0Q2FjaGVkRGF0YSgnaW52b2ljZXMnKTtcbiAgICAgICAgICBpZiAoY2FjaGVkKSB7XG4gICAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgICAgcmV0dXJuIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoY2FjaGVkKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IHN0cmlwZSA9IGF3YWl0IGdldFN0cmlwZSgpO1xuICAgICAgICAgIGNvbnN0IGludm9pY2VzID0gYXdhaXQgc3RyaXBlLmludm9pY2VzLmxpc3QoeyBsaW1pdDogNTAgfSk7XG4gICAgICAgICAgc2V0Q2FjaGVkRGF0YSgnaW52b2ljZXMnLCBpbnZvaWNlcy5kYXRhKTtcbiAgICAgICAgICByZXMuc2V0SGVhZGVyKCdDb250ZW50LVR5cGUnLCAnYXBwbGljYXRpb24vanNvbicpO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoaW52b2ljZXMuZGF0YSkpO1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGUubWVzc2FnZSB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3N0cmlwZS9jcmVhdGUtY2hlY2tvdXQnLCBhc3luYyAocmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIGlmIChyZXEubWV0aG9kICE9PSAnUE9TVCcpIHJldHVybiByZXMuZW5kKCk7XG4gICAgICAgIGxldCBib2R5ID0gJyc7XG4gICAgICAgIHJlcS5vbignZGF0YScsIChjaHVuazogYW55KSA9PiB7IGJvZHkgKz0gY2h1bmsudG9TdHJpbmcoKTsgfSk7XG4gICAgICAgIHJlcS5vbignZW5kJywgYXN5bmMgKCkgPT4ge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBjb25zdCBzdHJpcGUgPSBhd2FpdCBnZXRTdHJpcGUoKTtcbiAgICAgICAgICAgIGNvbnN0IHsgYW1vdW50LCBkZXNjcmlwdGlvbiwgY3VzdG9tZXJFbWFpbCB9ID0gSlNPTi5wYXJzZShib2R5KTtcbiAgICAgICAgICAgIGlmICghYW1vdW50IHx8ICFkZXNjcmlwdGlvbikgdGhyb3cgbmV3IEVycm9yKFwiQW1vdW50IGFuZCBkZXNjcmlwdGlvbiByZXF1aXJlZFwiKTtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IHN0cmlwZS5jaGVja291dC5zZXNzaW9ucy5jcmVhdGUoe1xuICAgICAgICAgICAgICBwYXltZW50X21ldGhvZF90eXBlczogWydjYXJkJywgJ3NlcGFfZGViaXQnXSxcbiAgICAgICAgICAgICAgbW9kZTogJ3N1YnNjcmlwdGlvbicsXG4gICAgICAgICAgICAgIGxpbmVfaXRlbXM6IFt7XG4gICAgICAgICAgICAgICAgcHJpY2VfZGF0YToge1xuICAgICAgICAgICAgICAgICAgY3VycmVuY3k6ICdldXInLFxuICAgICAgICAgICAgICAgICAgcmVjdXJyaW5nOiB7IGludGVydmFsOiAnbW9udGgnIH0sXG4gICAgICAgICAgICAgICAgICBwcm9kdWN0X2RhdGE6IHsgbmFtZTogZGVzY3JpcHRpb24gfSxcbiAgICAgICAgICAgICAgICAgIHVuaXRfYW1vdW50OiBNYXRoLnJvdW5kKGFtb3VudCAqIDEwMCksXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBxdWFudGl0eTogMSxcbiAgICAgICAgICAgICAgfV0sXG4gICAgICAgICAgICAgIGN1c3RvbWVyX2VtYWlsOiBjdXN0b21lckVtYWlsIHx8IHVuZGVmaW5lZCxcbiAgICAgICAgICAgICAgc3VjY2Vzc191cmw6ICdodHRwOi8vbG9jYWxob3N0OjUxNzMvZmFjdHVyYXRpb24/c3VjY2Vzcz10cnVlJyxcbiAgICAgICAgICAgICAgY2FuY2VsX3VybDogJ2h0dHA6Ly9sb2NhbGhvc3Q6NTE3My9mYWN0dXJhdGlvbj9jYW5jZWxlZD10cnVlJyxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXBpQ2FjaGUuY2xlYXIoKTsgLy8gUlx1MDBFOWluaXRpYWxpc2UgbGUgY2FjaGUgbG9ycyBkZSBsYSBjclx1MDBFOWF0aW9uIGQndW4gY2hlY2tvdXRcbiAgICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgdXJsOiBzZXNzaW9uLnVybCB9KSk7XG4gICAgICAgICAgfSBjYXRjaCAoZTogYW55KSB7XG4gICAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZS5tZXNzYWdlIH0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIHNlcnZlci5taWRkbGV3YXJlcy51c2UoJy9hcGkvc3RyaXBlL2N1c3RvbWVycycsIGFzeW5jIChfcmVxOiBhbnksIHJlczogYW55KSA9PiB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gZ2V0Q2FjaGVkRGF0YSgnY3VzdG9tZXJzJyk7XG4gICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGNhY2hlZCkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb25zdCBzdHJpcGUgPSBhd2FpdCBnZXRTdHJpcGUoKTtcbiAgICAgICAgICBjb25zdCBjdXN0b21lcnMgPSBhd2FpdCBzdHJpcGUuY3VzdG9tZXJzLmxpc3QoeyBsaW1pdDogNTAgfSk7XG4gICAgICAgICAgc2V0Q2FjaGVkRGF0YSgnY3VzdG9tZXJzJywgY3VzdG9tZXJzLmRhdGEpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShjdXN0b21lcnMuZGF0YSkpO1xuICAgICAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICByZXMuc3RhdHVzQ29kZSA9IDUwMDtcbiAgICAgICAgICByZXMuZW5kKEpTT04uc3RyaW5naWZ5KHsgZXJyb3I6IGUubWVzc2FnZSB9KSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBzZXJ2ZXIubWlkZGxld2FyZXMudXNlKCcvYXBpL3N0cmlwZS9jdXN0b21lci1pbnZvaWNlcycsIGFzeW5jIChyZXE6IGFueSwgcmVzOiBhbnkpID0+IHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCB1cmxPYmogPSBuZXcgVVJMKHJlcS51cmwsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgY29uc3QgY3VzdG9tZXJJZCA9IHVybE9iai5zZWFyY2hQYXJhbXMuZ2V0KCdjdXN0b21lcklkJyk7XG4gICAgICAgICAgaWYgKCFjdXN0b21lcklkKSB0aHJvdyBuZXcgRXJyb3IoJ0N1c3RvbWVyIElEIGlzIHJlcXVpcmVkJyk7XG4gICAgICAgICAgXG4gICAgICAgICAgY29uc3QgY2FjaGVLZXkgPSBgY3VzdG9tZXItaW52b2ljZXMtJHtjdXN0b21lcklkfWA7XG4gICAgICAgICAgY29uc3QgY2FjaGVkID0gZ2V0Q2FjaGVkRGF0YShjYWNoZUtleSk7XG4gICAgICAgICAgaWYgKGNhY2hlZCkge1xuICAgICAgICAgICAgcmVzLnNldEhlYWRlcignQ29udGVudC1UeXBlJywgJ2FwcGxpY2F0aW9uL2pzb24nKTtcbiAgICAgICAgICAgIHJldHVybiByZXMuZW5kKEpTT04uc3RyaW5naWZ5KGNhY2hlZCkpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IHN0cmlwZSA9IGF3YWl0IGdldFN0cmlwZSgpO1xuICAgICAgICAgIGNvbnN0IGludm9pY2VzID0gYXdhaXQgc3RyaXBlLmludm9pY2VzLmxpc3QoeyBjdXN0b21lcjogY3VzdG9tZXJJZCwgbGltaXQ6IDMwIH0pO1xuICAgICAgICAgIHNldENhY2hlZERhdGEoY2FjaGVLZXksIGludm9pY2VzLmRhdGEpO1xuICAgICAgICAgIHJlcy5zZXRIZWFkZXIoJ0NvbnRlbnQtVHlwZScsICdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgICAgICAgcmVzLmVuZChKU09OLnN0cmluZ2lmeShpbnZvaWNlcy5kYXRhKSk7XG4gICAgICAgIH0gY2F0Y2ggKGU6IGFueSkge1xuICAgICAgICAgIHJlcy5zdGF0dXNDb2RlID0gNTAwO1xuICAgICAgICAgIHJlcy5lbmQoSlNPTi5zdHJpbmdpZnkoeyBlcnJvcjogZS5tZXNzYWdlIH0pKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xufTtcblxuLy8gaHR0cHM6Ly92aXRlLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiB7XG4gIGNvbnN0IGVudiA9IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSwgJycpO1xuICByZXR1cm4ge1xuICAgIGNsZWFyU2NyZWVuOiBmYWxzZSxcbiAgICBwbHVnaW5zOiBbdnVlKCksIHN0cmlwZURldlBsdWdpbihlbnYpXSxcbiAgICByZXNvbHZlOiB7XG4gICAgICBhbGlhczoge1xuICAgICAgICAnQCc6IGZpbGVVUkxUb1BhdGgobmV3IFVSTCgnLi9zcmMnLCBpbXBvcnQubWV0YS51cmwpKSxcbiAgICAgIH1cbiAgICB9LFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaG9sZFVudGlsQ3Jhd2xFbmQ6IGZhbHNlLFxuICAgICAgaW5jbHVkZTogW1xuICAgICAgICAndnVlJyxcbiAgICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgICAgICAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJyxcbiAgICAgICAgJ2x1Y2lkZS12dWUtbmV4dCcsXG4gICAgICAgICdjbHN4JyxcbiAgICAgICAgJ3RhaWx3aW5kLW1lcmdlJyxcbiAgICAgICAgJ3Jla2EtdWknLFxuICAgICAgICAncmFkaXgtdnVlJyxcbiAgICAgIF0sXG4gICAgICBleGNsdWRlOiBbJ3N0cmlwZSddXG4gICAgfSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIGhvc3Q6ICcxMjcuMC4wLjEnLFxuICAgICAgcG9ydDogNTE3M1xuICAgIH0sXG4gICAgc3NyOiB7XG4gICAgICBleHRlcm5hbDogWydzdHJpcGUnXVxuICAg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
