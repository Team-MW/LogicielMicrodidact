import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// Plugin local pour simuler les Serverless Functions de Vercel durant le `npm run dev`
const stripeDevPlugin = (env: Record<string, string>) => ({
  name: 'stripe-dev-api',
  async configureServer(server: any) {
    // Import dynamique pour ne pas ralentir le démarrage de Vite
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(env.STRIPE_SECRET_KEY || '');
    
    server.middlewares.use('/api/stripe/payment-links', async (_req: any, res: any) => {
      try {
        const paymentLinks = await stripe.paymentLinks.list({ limit: 100, active: true, expand: ['data.line_items.data.price.product'] });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(paymentLinks.data));
      } catch (e: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });

    server.middlewares.use('/api/stripe/subscriptions', async (_req: any, res: any) => {
      try {
        const subscriptions = await stripe.subscriptions.list({ limit: 100, status: 'active', expand: ['data.customer', 'data.plan.product'] });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(subscriptions.data));
      } catch (e: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });

    server.middlewares.use('/api/stripe/invoices', async (_req: any, res: any) => {
      try {
        const invoices = await stripe.invoices.list({ limit: 100, expand: ['data.customer'] });
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
        const customers = await stripe.customers.list({ limit: 100 });
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
        
        const invoices = await stripe.invoices.list({ customer: customerId, limit: 50 });
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(invoices.data));
      } catch (e: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: e.message }));
      }
    });
  }
});

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [vue(), stripeDevPlugin(env)],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  }
})
