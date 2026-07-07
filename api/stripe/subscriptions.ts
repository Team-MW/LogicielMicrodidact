import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      limit: 100,
      status: 'active',
      expand: ['data.customer', 'data.plan.product'],
    });

    res.status(200).json(subscriptions.data);
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
