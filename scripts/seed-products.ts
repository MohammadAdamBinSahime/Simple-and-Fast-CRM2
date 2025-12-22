import { getUncachableStripeClient } from '../server/stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Creating subscription products...');

  // Check if products already exist
  const existingProducts = await stripe.products.search({
    query: "name:'CRM Pro' OR name:'CRM Basic' OR name:'CRM Enterprise'"
  });

  if (existingProducts.data.length > 0) {
    console.log('Products already exist:', existingProducts.data.map(p => p.name).join(', '));
    console.log('Skipping product creation. Delete existing products in Stripe Dashboard to recreate.');
    return;
  }

  // Create Basic Plan
  const basicProduct = await stripe.products.create({
    name: 'CRM Basic',
    description: 'Perfect for individual agents getting started with CRM',
    metadata: {
      contacts: '100',
      deals: '50',
      email_templates: '5',
      ai_assistant: 'false',
    },
  });

  await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 1999, // $19.99
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Created: CRM Basic - $19.99/month');

  // Create Pro Plan
  const proProduct = await stripe.products.create({
    name: 'CRM Pro',
    description: 'For growing teams with advanced features',
    metadata: {
      contacts: 'unlimited',
      deals: 'unlimited',
      email_templates: 'unlimited',
      ai_assistant: 'true',
    },
  });

  await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 4999, // $49.99
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Created: CRM Pro - $49.99/month');

  // Create Enterprise Plan
  const enterpriseProduct = await stripe.products.create({
    name: 'CRM Enterprise',
    description: 'Full-featured CRM for large teams and brokerages',
    metadata: {
      contacts: 'unlimited',
      deals: 'unlimited',
      email_templates: 'unlimited',
      ai_assistant: 'true',
      priority_support: 'true',
      custom_integrations: 'true',
    },
  });

  await stripe.prices.create({
    product: enterpriseProduct.id,
    unit_amount: 9999, // $99.99
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  console.log('Created: CRM Enterprise - $99.99/month');

  console.log('\nAll products created successfully!');
  console.log('Webhooks will automatically sync them to the database.');
}

createProducts().catch(console.error);
