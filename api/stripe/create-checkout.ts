import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, description, customerEmail } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ error: 'Amount and description are required' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: 'eur',
            recurring: {
              interval: 'month',
            },
            product_data: {
              name: description,
            },
            unit_amount: Math.round(amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: (req.headers.origin || 'http://localhost:5173') + '/facturation?success=true',
      cancel_url: (req.headers.origin || 'http://localhost:5173') + '/facturation?canceled=true',
    });

    res.status(200).json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: error.message });
  }
}
