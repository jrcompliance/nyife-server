# 🔥 Razorpay Payment Links & Webhooks - Complete Setup Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Database Setup](#database-setup)
4. [Razorpay Dashboard Configuration](#razorpay-dashboard-configuration)
5. [Environment Configuration](#environment-configuration)
6. [Testing with Postman](#testing-with-postman)
7. [Webhook Testing](#webhook-testing)
8. [Production Deployment](#production-deployment)

---

## 1. Prerequisites

- Node.js 14+ installed
- MySQL database
- Razorpay account ([Sign up](https://dashboard.razorpay.com/signup))
- ngrok (for local webhook testing)

---

## 2. Installation

```bash
# Install required packages
npm install razorpay crypto uuid

# Already installed in your project
# sequelize, mysql2, express
```

---

## 3. Database Setup

### Create Invoice Table Migration

```sql
-- migrations/create-invoices-table.sql
CREATE TABLE `invoices` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `uuid` VARCHAR(36) NOT NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(20) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'INR',
  `description` TEXT,
  `status` ENUM('pending','completed','cancelled') DEFAULT 'pending',
  `payment_status` ENUM('unpaid','paid','failed') DEFAULT 'unpaid',
  `payment_link_id` VARCHAR(255) DEFAULT NULL,
  `payment_link_url` TEXT,
  `payment_link_reference_id` VARCHAR(255) DEFAULT NULL,
  `payment_link_expires_at` DATETIME DEFAULT NULL,
  `payment_id` VARCHAR(255) DEFAULT NULL,
  `razorpay_payment_id` VARCHAR(255) DEFAULT NULL,
  `payment_method` VARCHAR(50) DEFAULT NULL,
  `razorpay_signature` TEXT,
  `paid_at` DATETIME DEFAULT NULL,
  `notes` JSON DEFAULT NULL,
  `payment_metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `payment_link_id` (`payment_link_id`),
  KEY `razorpay_payment_id` (`razorpay_payment_id`),
  KEY `payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Run Migration

```bash
# Run the SQL in your MySQL client or use Sequelize migration
mysql -u your_user -p your_database < migrations/create-invoices-table.sql
```

---

## 4. Razorpay Dashboard Configuration

### Step 1: Get API Keys

1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys**
3. Generate **Test Mode** keys:
   - **Key ID**: `rzp_test_xxxxxxxxxxxxx`
   - **Key Secret**: `your_secret_key_here`

### Step 2: Setup Webhooks

1. Go to **Settings** → **Webhooks**
2. Click **+ Add New Webhook**
3. Configure webhook:
   - **Webhook URL**: `https://your-domain.com/api/webhooks/razorpay`
     - For local testing: `https://xxxx.ngrok.io/api/webhooks/razorpay`
   - **Secret**: Generate a strong secret (save this!)
   - **Active Events**: Select the following:
     - ✅ `payment_link.paid`
     - ✅ `payment.captured`
     - ✅ `payment.failed`
     - ✅ `payment_link.cancelled`
     - ✅ `payment_link.expired`

4. **Alert Email**: Add your email for webhook failures
5. Click **Create Webhook**

### Important Webhook Notes:
- Webhooks only work on **public URLs** (ports 80 or 443)
- Localhost URLs won't work
- Use ngrok for local development

---

## 5. Environment Configuration

### Update `.env` file

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=your_database
DB_USER=your_user
DB_PASSWORD=your_password

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Update `config/env.js`

```javascript
module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
    
    database: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        }
    },
    
    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
        webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
    }
};
```

---

## 6. Testing with Postman

### Test 1: Create Invoice with Payment Link

**Request:**
```http
POST http://localhost:3000/api/invoices
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+919876543210",
  "amount": 1000.00,
  "currency": "INR",
  "description": "Payment for Premium Subscription",
  "notes": {
    "plan": "premium",
    "duration": "1 year"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoice": {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "customer_name": "John Doe",
      "customer_email": "john@example.com",
      "customer_phone": "+919876543210",
      "amount": "1000.00",
      "currency": "INR",
      "status": "pending",
      "payment_status": "unpaid",
      "payment_link_id": "plink_xxxxxxxxxxxxx",
      "payment_link_url": "https://rzp.io/i/xxxxx",
      "payment_link_reference_id": "INV_1",
      "payment_link_expires_at": "2025-12-19T10:00:00.000Z",
      "created_at": "2025-12-12T10:00:00.000Z"
    },
    "paymentLink": {
      "success": true,
      "paymentLinkId": "plink_xxxxxxxxxxxxx",
      "paymentUrl": "https://rzp.io/i/xxxxx",
      "referenceId": "INV_1",
      "amount": 100000,
      "status": "created",
      "expiresAt": "2025-12-19T10:00:00.000Z"
    }
  }
}
```

### Test 2: Get Invoice by UUID

**Request:**
```http
GET http://localhost:3000/api/invoices/550e8400-e29b-41d4-a716-446655440000
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "customer_name": "John Doe",
    "payment_status": "paid",
    "razorpay_payment_id": "pay_xxxxxxxxxxxxx",
    "paid_at": "2025-12-12T10:30:00.000Z"
  }
}
```

---

## 7. Webhook Testing

### Setup ngrok for Local Testing

```bash
# Install ngrok
# Download from https://ngrok.com/download

# Start ngrok
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Use this as your webhook URL in Razorpay Dashboard
```

### Update Webhook URL in Razorpay

1. Go to Razorpay Dashboard → Webhooks
2. Edit your webhook
3. Change URL to: `https://abc123.ngrok.io/api/webhooks/razorpay`
4. Save

### Test Payment Flow

1. **Create an invoice** (use Postman request above)
2. **Copy the `paymentUrl`** from the response
3. **Open the URL** in a browser
4. **Make a test payment** using:
   - Card: `4111 1111 1111 1111`
   - CVV: Any 3 digits
   - Expiry: Any future date
   - Name: Any name
5. **Check your server logs** - you should see webhook received
6. **Query the invoice** - status should be updated to `paid`

### Webhook Payload Example

When payment is successful, you'll receive:

```json
{
  "entity": "event",
  "account_id": "acc_xxxxxxxxxxxxx",
  "event": "payment_link.paid",
  "contains": ["payment_link", "payment"],
  "payload": {
    "payment_link": {
      "entity": {
        "id": "plink_xxxxxxxxxxxxx",
        "status": "paid",
        "reference_id": "INV_1",
        "amount": 100000,
        "notes": {
          "invoice_id": "1",
          "invoice_uuid": "550e8400-e29b-41d4-a716-446655440000"
        }
      }
    },
    "payment": {
      "entity": {
        "id": "pay_xxxxxxxxxxxxx",
        "amount": 100000,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "email": "john@example.com",
        "contact": "+919876543210"
      }
    }
  },
  "created_at": 1702380000
}
```

---

## 8. Production Deployment

### Checklist

- [ ] Switch to **Live Mode** keys in Razorpay Dashboard
- [ ] Update environment variables with live keys
- [ ] Update webhook URL to production domain
- [ ] Enable HTTPS for webhook endpoint
- [ ] Set up proper error monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Test webhook signature verification
- [ ] Configure email notifications
- [ ] Set up logging and alerting

### Security Best Practices

1. **Never commit API keys** to version control
2. **Always verify webhook signatures**
3. **Use HTTPS** for all endpoints
4. **Implement rate limiting** on webhook endpoint
5. **Log all webhook events** for audit trail
6. **Handle duplicate webhooks** (idempotency)
7. **Set webhook timeout** to 5 seconds max
8. **Whitelist Razorpay IPs** (optional)

### Webhook IP Whitelist (Optional)

Razorpay webhook IPs:
```
3.108.102.206
13.232.16.142
```

---

## 9. Common Issues & Solutions

### Issue 1: Webhook not receiving events

**Solution:**
- Check if webhook URL is publicly accessible
- Verify webhook secret matches
- Check server logs for errors
- Ensure endpoint returns 200 status
- Test with ngrok for local development

### Issue 2: Signature verification failing

**Solution:**
```javascript
// Make sure you're using raw body
app.use('/api/webhooks', express.raw({ type: 'application/json' }));

// Not parsed body
app.use(express.json()); // Don't use this before webhook routes
```

### Issue 3: Duplicate webhook events

**Solution:**
```javascript
// Use x-razorpay-event-id header for idempotency
const eventId = req.headers['x-razorpay-event-id'];

// Check if already processed
const processed = await checkIfEventProcessed(eventId);
if (processed) {
    return res.status(200).json({ message: 'Already processed' });
}
```

### Issue 4: Invoice not updating

**Solution:**
- Check if `invoice_id` is in payment link notes
- Verify database connection
- Check logs for errors
- Ensure transaction is committed

---

## 10. Monitoring & Logs

### Important Metrics to Track

1. **Payment Success Rate**
2. **Webhook Delivery Success Rate**
3. **Average Payment Time**
4. **Failed Payments Count**
5. **Expired Payment Links**

### Log Example

```javascript
// Good logging practice
logger.info('Payment link created', {
    invoiceId: invoice.id,
    paymentLinkId: paymentLink.id,
    amount: invoice.amount,
    customer: invoice.customer_email
});

logger.info('Webhook received', {
    event: webhookBody.event,
    eventId: req.headers['x-razorpay-event-id'],
    accountId: webhookBody.account_id
});
```

---

## 11. Testing Checklist

- [ ] Create invoice with payment link
- [ ] Verify payment link is generated
- [ ] Open payment link and complete payment
- [ ] Verify webhook is received
- [ ] Verify invoice status is updated to "paid"
- [ ] Test failed payment scenario
- [ ] Test payment link expiry
- [ ] Test payment link cancellation
- [ ] Verify email notifications (if configured)
- [ ] Test with different payment methods

---

## 12. Support & Resources

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Payment Links API Reference](https://razorpay.com/docs/api/payments/payment-links/)
- [Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Razorpay Support](https://razorpay.com/support/)

---

## ✅ Quick Start Commands

```bash
# 1. Install dependencies
npm install razorpay crypto uuid

# 2. Setup database
mysql -u root -p your_database < migrations/create-invoices-table.sql

# 3. Configure environment
cp .env.example .env
# Edit .env with your Razorpay keys

# 4. Start server
npm run dev

# 5. Start ngrok (in another terminal)
ngrok http 3000

# 6. Test with Postman
# Use the requests provided in section 6

# 7. Make a test payment
# Open the payment URL from the API response
```

---

**🎉 You're all set! Happy coding!**