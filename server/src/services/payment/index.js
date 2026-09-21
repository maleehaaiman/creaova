const UnconfiguredPaymentProvider = require('./unconfigured.provider');

let provider;

function getPaymentProvider() {
  if (provider) return provider;
  if (process.env.PAYMENT_PROVIDER === 'razorpay' && process.env.PAYMENT_PROVIDER_KEY && process.env.PAYMENT_PROVIDER_SECRET) {
    const RazorpayProvider = require('./razorpay.provider');
    provider = new RazorpayProvider();
  } else {
    provider = new UnconfiguredPaymentProvider();
  }
  return provider;
}

module.exports = { getPaymentProvider };