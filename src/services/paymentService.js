const { createClient } = require('@libsql/client');
const crypto = require('crypto');

const db = createClient({
  url: process.env.TURSO_DATABASE_URL || 'libsql://your-db.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

class PaymentService {
  constructor() {
    this.serverKey = process.env.PAYMENT_GATEWAY_KEY || 'enterprise_secret_key';
    this.merchantId = process.env.PAYMENT_MERCHANT_ID || 'ENT-001';
  }

  /**
   * Create QRIS Transaction
   * @param {string} tenantId - ID Aplikasi/Tenant
   * @param {string} orderId - ID Pesanan
   * @param {number} amount - Nominal
   * @param {object} customerInfo - Data Pelanggan
   */
  async createQrisTransaction(tenantId, orderId, amount, customerInfo = {}) {
    try {
      const referenceNo = `QRIS-${tenantId}-${orderId}-${Date.now()}`;
      const createdAt = new Date().toISOString();

      // Simpan log transaksi ke Turso
      await db.execute({
        sql: `INSERT INTO transactions (
          tenant_id, order_id, amount, method, status, reference_no, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [tenantId, orderId, amount, 'QRIS', 'pending', referenceNo, createdAt]
      });

      return {
        success: true,
        provider: 'Enterprise App Builder Pay',
        referenceNo,
        orderId,
        amount,
        currency: 'IDR',
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${referenceNo}`,
        deepLink: `gopay://pay?amount=${amount}&ref=${referenceNo}`,
        customer: customerInfo.name || 'Pelanggan Enterprise',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        instructions: 'Buka aplikasi e-wallet atau mobile banking Anda, scan kode QR di atas, dan selesaikan pembayaran sebelum waktu habis.'
      };
    } catch (error) {
      console.error('[PaymentService] QRIS Error:', error);
      throw new Error('Gagal memproses pembayaran QRIS. Silakan coba lagi.');
    }
  }

  /**
   * Create Virtual Account Transaction
   * @param {string} tenantId - ID Aplikasi/Tenant
   * @param {string} orderId - ID Pesanan
   * @param {number} amount - Nominal
   * @param {string} bank - Kode Bank (BCA, MANDIRI, BNI)
   */
  async createVirtualAccountTransaction(tenantId, orderId, amount, bank = 'BCA') {
    try {
      const vaNumber = `88${tenantId.toString().padStart(3, '0')}${Math.floor(10000000 + Math.random() * 90000000)}`;
      const referenceNo = `VA-${bank.toUpperCase()}-${orderId}-${Date.now()}`;
      const createdAt = new Date().toISOString();

      await db.execute({
        sql: `INSERT INTO transactions (
          tenant_id, order_id, amount, method, status, reference_no, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [tenantId, orderId, amount, `VA_${bank.toUpperCase()}`, 'pending', referenceNo, createdAt]
      });

      return {
        success: true,
        provider: `${bank.toUpperCase()} Virtual Account`,
        orderId,
        amount,
        vaNumber,
        referenceNo,
        instructions: `Transfer nominal Rp ${amount.toLocaleString('id-ID')} ke nomor Virtual Account ${bank.toUpperCase()}: ${vaNumber}. Pembayaran akan terverifikasi otomatis.`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('[PaymentService] VA Error:', error);
      throw new Error('Gagal membuat Virtual Account. Periksa koneksi jaringan.');
    }
  }

  /**
   * Verify Webhook Signature for Security
   */
  verifyWebhookSignature(payload, signature) {
    if (!signature) return false;
    try {
      const expectedSig = crypto.createHmac('sha256', this.serverKey)
        .update(JSON.stringify(payload))
        .digest('hex');
      return expectedSig === signature;
    } catch (e) {
      return false;
    }
  }

  /**
   * Update Transaction Status from Webhook
   */
  async handleWebhook(payload) {
    const { reference_no, status, payment_type } = payload;
    
    try {
      const result = await db.execute({
        sql: 'UPDATE transactions SET status = ?, updated_at = ? WHERE reference_no = ?',
        args: [status, new Date().toISOString(), reference_no]
      });

      if (result.rowsAffected === 0) {
        throw new Error('Transaksi tidak ditemukan');
      }

      return { success: true, message: 'Status transaksi diperbarui' };
    } catch (error) {
      console.error('[PaymentService] Webhook Update Error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get Transaction History with Pagination
   */
  async getTransactionHistory(tenantId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    try {
      const result = await db.execute({
        sql: 'SELECT * FROM transactions WHERE tenant_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        args: [tenantId, limit, offset]
      });
      return result.rows;
    } catch (error) {
      console.error('[PaymentService] Fetch History Error:', error);
      return [];
    }
  }
}

module.exports = new PaymentService();