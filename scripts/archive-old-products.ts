import { getUncachableStripeClient } from '../server/stripeClient';

async function archiveOldProducts() {
  const stripe = await getUncachableStripeClient();

  console.log('Archiving old products...');

  // Find old products to archive
  const oldProducts = await stripe.products.search({
    query: "name:'CRM Pro' OR name:'CRM Basic' OR name:'CRM Enterprise'"
  });

  for (const product of oldProducts.data) {
    // Archive the product (set active to false)
    await stripe.products.update(product.id, { active: false });
    console.log(`Archived: ${product.name}`);
  }

  console.log('\nOld products archived successfully!');
}

archiveOldProducts().catch(console.error);
