import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-01-27.acacia', // Utilise the latest stable version if omitted it uses account default but typescript might complain, using '2023-10-16' or omit. Actually passing empty object if not strict is fine. Let's just use empty or default.
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const paymentLinks = await stripe.paymentLinks.list({
      limit: 100,
      active: true,
      expand: ['data.line_items.data.price.product'],
    });

    res.status(200).json(paymentLinks.data);
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
