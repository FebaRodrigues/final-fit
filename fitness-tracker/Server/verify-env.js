require('dotenv').config();
const stripe = require('stripe');

console.log('=== Environment Variables Check ===');
console.log('Node.js Version:', process.version);
console.log('STRIPE_SECRET_KEY length:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.length : 'undefined');
console.log('STRIPE_SECRET_KEY format check:', process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.match(/^sk_test_[0-9a-zA-Z]{24,}$/) !== null : 'undefined');

const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
    try {
        console.log('Attempting to connect to Stripe...');
        const customers = await stripeClient.customers.list({ limit: 1 });
        console.log('Stripe connection successful!');
        console.log('Retrieved', customers.data.length, 'customers');
    } catch (error) {
        console.log('Stripe connection failed:', error.message);
        console.log('Error details:', {
            type: error.type,
            code: error.code,
            statusCode: error.statusCode
        });
    }
}

testStripeConnection(); 