import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Cache en mémoire pour accélérer les réponses Stripe en dev
const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30000; // Cache de 30 secondes

function getCachedData(key: string) {
  const cached = apiCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any) {
  apiCache.set(key, { data, timestamp: Date.now() });
}

// Plugin local pour simuler les Serverless Functions de Vercel durant le `npm run dev`
const stripeDevPlugin = (env: Record<string, string>) => {
  let stripeInstance: any = null;
  const getStripe = async () => {
    if (!stripeInstance) {
      const Stripe = (await import('stripe')).default;
      stripeInstance = new Stripe(env.STRIPE_SECRET_KEY || '');
    }
    return stripeInstance;
  };

  return {
    name: 'stripe-dev-api',
    configureServer(server: any) {
      server.middlewares.use('/api/stripe/payment-links', async (_req: any, res: any) => {
        try {
          const cached = getCachedData('payment-links');
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const paymentLinks = await stripe.paymentLinks.list({ limit: 50, active: true });
          setCachedData('payment-links', paymentLinks.data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(paymentLinks.data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/stripe/subscriptions', async (_req: any, res: any) => {
        try {
          const cached = getCachedData('subscriptions');
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const subscriptions = await stripe.subscriptions.list({ limit: 50, status: 'active', expand: ['data.customer', 'data.plan.product'] });
          setCachedData('subscriptions', subscriptions.data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(subscriptions.data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/stripe/invoices', async (_req: any, res: any) => {
        try {
          const cached = getCachedData('invoices');
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const invoices = await stripe.invoices.list({ limit: 50 });
          setCachedData('invoices', invoices.data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(invoices.data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/stripe/create-checkout', async (req: any, res: any) => {
        if (req.method !== 'POST') return res.end();
        let body = '';
        req.on('data', (chunk: any) => { body += chunk.toString(); });
        req.on('end', async () => {
          try {
            const stripe = await getStripe();
            const { amount, description, customerEmail } = JSON.parse(body);
            if (!amount || !description) throw new Error("Amount and description required");
            
            const session = await stripe.checkout.sessions.create({
              payment_method_types: ['card', 'sepa_debit'],
              mode: 'subscription',
              line_items: [{
                price_data: {
                  currency: 'eur',
                  recurring: { interval: 'month' },
                  product_data: { name: description },
                  unit_amount: Math.round(amount * 100),
                },
                quantity: 1,
              }],
              customer_email: customerEmail || undefined,
              success_url: 'http://localhost:5173/facturation?success=true',
              cancel_url: 'http://localhost:5173/facturation?canceled=true',
            });
            apiCache.clear(); // Réinitialise le cache lors de la création d'un checkout
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: session.url }));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      });

      server.middlewares.use('/api/stripe/customers', async (_req: any, res: any) => {
        try {
          const cached = getCachedData('customers');
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }
          const stripe = await getStripe();
          const customers = await stripe.customers.list({ limit: 50 });
          setCachedData('customers', customers.data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(customers.data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });

      server.middlewares.use('/api/stripe/customer-invoices', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost');
          const customerId = urlObj.searchParams.get('customerId');
          if (!customerId) throw new Error('Customer ID is required');
          
          const cacheKey = `customer-invoices-${customerId}`;
          const cached = getCachedData(cacheKey);
          if (cached) {
            res.setHeader('Content-Type', 'application/json');
            return res.end(JSON.stringify(cached));
          }

          const stripe = await getStripe();
          const invoices = await stripe.invoices.list({ customer: customerId, limit: 30 });
          setCachedData(cacheKey, invoices.data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(invoices.data));
        } catch (e: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
      });
    }
  };
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    clearScreen: false,
    plugins: [vue(), stripeDevPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      }
    },
    optimizeDeps: {
      holdUntilCrawlEnd: false,
      include: [
        'vue',
        'vue-router',
        '@supabase/supabase-js',
        'lucide-vue-next',
        'clsx',
        'tailwind-merge',
        'reka-ui',
        'radix-vue',
      ],
      exclude: ['stripe']
    },
    server: {
      host: '127.0.0.1',
      port: 5173
    },
    ssr: {
      external: ['stripe']
    }
  }
})
