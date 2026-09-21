const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { testConnection } = require('./db');
const { ensurePaymentSchema } = require('./services/payment/schema');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({
  verify: (req, res, buffer) => {
    req.rawBody = buffer;
  }
}));

// Routes
const authRoutes = require('./routes/auth.routes');
const creatorRoutes = require('./routes/creator.routes');
const brandRoutes = require('./routes/brand.routes');
const campaignRoutes = require('./routes/campaign.routes');
const applicationRoutes = require('./routes/application.routes');
const collaborationRoutes = require('./routes/collaboration.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const paymentRoutes = require('./routes/payment.routes');
const socialRoutes = require('./routes/social.routes');
const metaRoutes = require('./routes/meta.routes');
const affiliateRoutes = require('./routes/affiliate.routes');

app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/collaborations', collaborationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/social-accounts', socialRoutes);
app.use('/api/meta', metaRoutes);
app.use('/api/affiliates', affiliateRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    app: 'Creova API',
    tablesCount: 10,
    timestamp: new Date().toISOString()
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(` Creova Backend running on port ${PORT}`);
  await ensurePaymentSchema();
  await testConnection();
});
