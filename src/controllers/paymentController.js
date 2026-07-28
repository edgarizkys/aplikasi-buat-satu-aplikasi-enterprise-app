const paymentService = require('../services/paymentService');

// Buat pembayaran QRIS
async function createQrisPayment(req, res) {
    const { orderId, amount, customerInfo } = req.body;
    // Multi-tenant: Kaitkan pembayaran dengan req.tenantId atau req.user.appId
    if (!orderId || !amount) {
        return res.status(400).json({ message: 'ID pesanan dan jumlah perlu.' });
    }
    try {
        const transaction = await paymentService.createQrisTransaction(orderId, amount, customerInfo);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('QRIS buat gagal:', error);
        res.status(500).json({ message: 'QRIS buat gagal. Coba lagi.' });
    }
}

// Buat pembayaran Virtual Account
async function createVirtualAccountPayment(req, res) {
    const { orderId, amount, bank } = req.body;
    // Multi-tenant: Kaitkan pembayaran dengan req.tenantId atau req.user.appId
    if (!orderId || !amount || !bank) {
        return res.status(400).json({ message: 'ID pesanan, jumlah, dan bank perlu.' });
    }
    try {
        const transaction = await paymentService.createVirtualAccountTransaction(orderId, amount, bank);
        res.status(201).json(transaction);
    } catch (error) {
        console.error('VA buat gagal:', error);
        res.status(500).json({ message: 'VA buat gagal. Coba lagi.' });
    }
}

// Tangani webhook gateway pembayaran
async function handleWebhook(req, res) {
    const payload = req.body;
    const signature = req.headers['x-signature']; // Atau 'x-midtrans-signature', 'x-xendit-signature'
    // Multi-tenant: Webhook mungkin berisi pengenal tenant, atau perlu dipetakan berdasarkan orderId
    // Keamanan: Verifikasi tanda tangan penting untuk keaslian webhook
    if (!paymentService.verifyWebhookSignature(payload, signature)) {
        console.warn('Webhook tanda tangan tidak cocok. Potensi penipuan.');
        return res.status(403).json({ message: 'Tanda tangan tidak valid.' });
    }

    try {
        // Proses payload: perbarui status pesanan, log transaksi, dll.
        // Contoh:
        // const { order_id, transaction_status, gross_amount } = payload;
        // await transactionService.updateTransactionStatus(order_id, transaction_status);
        console.log('Webhook diterima:', payload);
        res.status(200).json({ message: 'Webhook sukses diterima.' });
    } catch (error) {
        console.error('Webhook proses gagal:', error);
        res.status(500).json({ message: 'Webhook proses gagal.' });
    }
}

module.exports = {
    createQrisPayment,
    createVirtualAccountPayment,
    handleWebhook
};