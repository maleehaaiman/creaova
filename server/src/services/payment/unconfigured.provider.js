class UnconfiguredPaymentProvider {
  constructor() {
    this.name = 'unconfigured';
  }

  async createOrder() {
    const error = new Error('Payment provider is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  verifyPayment() {
    const error = new Error('Payment provider is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  verifyWebhook() {
    const error = new Error('Payment provider is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  refund() {
    const error = new Error('Payment provider is not configured on the server.');
    error.statusCode = 503;
    throw error;
  }
}

module.exports = UnconfiguredPaymentProvider;