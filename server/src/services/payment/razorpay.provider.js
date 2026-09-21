const crypto = require('crypto');
const Razorpay = require('razorpay');

class RazorpayProvider {
  constructor() {
    this.name = 'razorpay';
    this.client = new Razorpay({
      key_id: process.env.PAYMENT_PROVIDER_KEY,
      key_secret: process.env.PAYMENT_PROVIDER_SECRET
    });
  }

  async createOrder({ amount, currency, receipt }) {
    const order = await this.client.orders.create({ amount, currency, receipt, payment_capture: 1 });
    return { provider: this.name, providerOrderId: order.id, publicKey: process.env.PAYMENT_PROVIDER_KEY, amount: order.amount, currency: order.currency };
  }

  verifyPayment({ orderId, paymentId, signature }) {
    const expected = crypto.createHmac('sha256', process.env.PAYMENT_PROVIDER_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
    const received = Buffer.from(signature || '');
    return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), received);
  }

  verifyWebhook(rawBody, signature) {
    const expected = crypto.createHmac('sha256', process.env.PAYMENT_WEBHOOK_SECRET).update(rawBody).digest('hex');
    const received = Buffer.from(signature || '');
    return received.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), received);
  }

  async refund({ paymentId, amount }) {
    const refund = await this.client.payments.refund(paymentId, { amount });
    return { reference: refund.id };
  }
}

module.exports = RazorpayProvider;