import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating subscription product...');

  // Check if product already exists
  const existingProducts = await stripe.products.search({
    query: "name:'CRM Professional'"
  });

  if (existingProducts.data.length > 0) {
    console.log('Product already exists:', existingProducts.data.map(p => p.name).join(', '));
    console.log('Skipping product creation. Delete existing products in Stripe Dashboard to recreate.');
    return;
  }

  // Create Professional Plan - RM59.99/month
  const proProduct = await stripe.products.create({
    name: 'CRM Professional',
    description: 'Full-featured CRM for real estate agents - unlimited contacts, deals, and AI assistant',
    metadata: {
      contacts: 'unlimited',
      deals: 'unlimited',
      email_templates: 'unlimited',
      ai_assistant: 'true',
    },
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 5999, // RM59.99
    currency: 'myr',
    recurring: { interval: 'month' },
  });

  console.log('Created: CRM Professional - RM59.99/month');

  console.log('\nProduct created successfully!');
  console.log('Webhooks will automatically sync it to the database.');
}

createProducts().catch(console.error);
