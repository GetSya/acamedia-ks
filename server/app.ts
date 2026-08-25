import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { 
  getRowsAsObjects, 
  appendSheetData, 
  updateSheetData, 
  getSheetData 
} from './sheets.js';
import { 
  hashPassword, 
  comparePassword, 
  generateToken, 
  authenticate, 
  authorize, 
  AuthRequest 
} from './auth.js';

const app = express();

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  const { username, password, nama_lengkap, email } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });
  
  try {
    const users = await getRowsAsObjects('users');
    if (users.find(u => u.username?.toLowerCase() === username.trim().toLowerCase())) {
      return res.status(400).json({ message: 'Username sudah terdaftar' });
    }

    const hashedPassword = await hashPassword(password);
    // Spreadsheet columns: nama_lengkap, username, password, email, keranjang, role
    await appendSheetData('users', [[nama_lengkap, username.trim(), hashedPassword, email, '[]', 'user']]);
    
    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Username dan password wajib diisi' });

  try {
    const users = await getRowsAsObjects('users');
    const user = users.find(u => u.username?.toLowerCase() === username.trim().toLowerCase());

    if (!user) {
      return res.status(401).json({ message: 'Username tidak ditemukan' });
    }

    // Try bcrypt comparison
    let isMatch = await comparePassword(password, user.password);
    
    // Fallback: Check if user.password is plain text (for manual sheet entry)
    if (!isMatch && user.password === password) {
      isMatch = true;
    }

    if (!isMatch) {
      return res.status(401).json({ message: 'Password salah' });
    }

    const token = generateToken({ 
      username: user.username, 
      role: user.role?.toLowerCase() || 'user', 
      nama_lengkap: user.nama_lengkap,
      email: user.email 
    });

    const userResponse = { 
      username: user.username, 
      role: user.role?.toLowerCase() || 'user', 
      nama_lengkap: user.nama_lengkap,
      email: user.email
    };

    res.cookie('token', token, { 
      httpOnly: true, 
      maxAge: 7 * 24 * 60 * 60 * 1000, 
      sameSite: 'none', 
      secure: true 
    });
    res.json({ token, user: userResponse });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

app.get('/api/auth/me', authenticate, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

app.patch('/api/auth/profile', authenticate, async (req: AuthRequest, res) => {
  const { nama_lengkap, email, password } = req.body;
  const username = req.user?.username;
  if (!username) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const users = await getRowsAsObjects('users');
    const user = users.find(u => u.username === username);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const rowIndex = user._rowIndex;
    // Columns: nama_lengkap, username, password, email, keranjang, role
    const headers = ['nama_lengkap', 'username', 'password', 'email', 'keranjang', 'role'];
    const range = `users!A${rowIndex + 1}:F${rowIndex + 1}`;
    
    let newPassword = user.password;
    if (password) {
      newPassword = await hashPassword(password);
    }

    const updatedRow = [
      nama_lengkap || user.nama_lengkap,
      user.username,
      newPassword,
      email || user.email,
      user.keranjang,
      user.role
    ];

    await updateSheetData(range, [updatedRow]);
    res.json({ message: 'Profile updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- SHOP ROUTES ---

app.get('/api/items', async (req, res) => {
  try {
    const items = await getRowsAsObjects('items');
    res.json(items);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    const categories = await getRowsAsObjects('kategori');
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/information', async (req, res) => {
  try {
    const info = await getRowsAsObjects('information');
    res.json(info);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/reviews/:kode_item', async (req, res) => {
  try {
    const reviews = await getRowsAsObjects('reviews');
    const filtered = reviews.filter(r => r.kode_item === req.params.kode_item);
    res.json(filtered);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/reviews', authenticate, async (req: AuthRequest, res) => {
  const { kode_item, rating, ulasan } = req.body;
  const username = req.user?.username;
  const timestamp = new Date().toISOString();
  try {
    await appendSheetData('reviews', [[kode_item, username, rating, ulasan, timestamp]]);
    res.status(201).json({ message: 'Review added' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- ORDER ROUTES ---

app.post('/api/orders', authenticate, async (req: AuthRequest, res) => {
  const { items, total_price, noted } = req.body;
  const username = req.user?.username;
  const order_id = 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const timestamp = new Date().toISOString();
  const status = 'pending';
  const admin = '-';

  try {
    // order_id, username, items, total_price, timestamp, status, noted, admin
    await appendSheetData('order', [[order_id, username, JSON.stringify(items), total_price, timestamp, status, noted, admin]]);
    
    // Reduce stock
    const allItems = await getRowsAsObjects('items');
    for (const orderItem of items) {
      const item = allItems.find(i => i.kode_item === orderItem.kode_item);
      if (item) {
        const newStock = Math.max(0, parseInt(item.stok) - orderItem.quantity);
        const headers = ['kode_item', 'nama_item', 'durasi', 'kategori_id', 'stok', 'harga_jual', 'aktif', 'description', 'image_url', 'diskon', 'flashsale'];
        const rowIndex = item._rowIndex;
        const range = `items!A${rowIndex + 1}:K${rowIndex + 1}`;
        const updatedRow = headers.map(h => h === 'stok' ? newStock.toString() : item[h]);
        await updateSheetData(range, [updatedRow]);
      }
    }

    res.status(201).json({ order_id, message: 'Order created' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders/:order_id', authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await getRowsAsObjects('order');
    const order = orders.find(o => o.order_id === req.params.order_id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    if (order.username !== req.user?.username && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(order);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/orders', authenticate, async (req: AuthRequest, res) => {
  try {
    const orders = await getRowsAsObjects('order');
    if (req.user?.role === 'admin') {
      res.json(orders);
    } else {
      const userOrders = orders.filter(o => o.username === req.user?.username);
      res.json(userOrders);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- CHAT ROUTES ---

app.get('/api/chats', authenticate, async (req: AuthRequest, res) => {
  const username = req.user?.username;
  try {
    const chats = await getRowsAsObjects('chat');
    if (req.user?.role === 'admin') {
      res.json(chats);
    } else {
      const userChats = chats.filter(c => c.sender_username === username || c.receiver_username === username);
      res.json(userChats);
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/chats/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const chats = await getRowsAsObjects('chat');
    const users = new Set<string>();
    chats.forEach(c => {
      if (c.sender_username !== 'admin') users.add(c.sender_username);
      if (c.receiver_username !== 'admin') users.add(c.receiver_username);
    });
    res.json(Array.from(users));
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/chats', authenticate, async (req: AuthRequest, res) => {
  const { receiver_username, message } = req.body;
  const sender_username = req.user?.username;
  const timestamp = new Date().toISOString();
  const id = Math.random().toString(36).substr(2, 9);

  try {
    // id, sender_username, receiver_username, message, timestamp
    await appendSheetData('chat', [[id, sender_username, receiver_username, message, timestamp]]);
    res.status(201).json({ message: 'Message sent' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- ADMIN ROUTES ---

app.patch('/api/admin/orders/:order_id', authenticate, authorize(['admin']), async (req, res) => {
  const { status, noted, admin } = req.body;
  try {
    const orders = await getRowsAsObjects('order');
    const order = orders.find(o => o.order_id === req.params.order_id);
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const rowIndex = order._rowIndex;
    const headers = ['order_id', 'username', 'items', 'total_price', 'timestamp', 'status', 'noted', 'admin'];
    const range = `order!A${rowIndex + 1}:H${rowIndex + 1}`;
    
    const updatedRow = headers.map(h => {
      if (h === 'status') return status || order[h];
      if (h === 'noted') return noted || order[h];
      if (h === 'admin') return admin || order[h];
      return order[h];
    });

    await updateSheetData(range, [updatedRow]);
    res.json({ message: 'Order updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// Admin CRUD placeholder pattern
app.post('/api/admin/items', authenticate, authorize(['admin']), async (req, res) => {
  const { kode_item, nama_item, durasi, kategori_id, stok, harga_jual, aktif, description, image_url, diskon, flashsale } = req.body;
  try {
    await appendSheetData('items', [[kode_item, nama_item, durasi, kategori_id, stok, harga_jual, aktif, description, image_url, diskon || '', flashsale || '']]);
    res.status(201).json({ message: 'Item created' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/admin/items/:kode_item', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const items = await getRowsAsObjects('items');
    const item = items.find(i => i.kode_item === req.params.kode_item);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const rowIndex = item._rowIndex;
    const headers = ['kode_item', 'nama_item', 'durasi', 'kategori_id', 'stok', 'harga_jual', 'aktif', 'description', 'image_url', 'diskon', 'flashsale'];
    const range = `items!A${rowIndex + 1}:K${rowIndex + 1}`;
    const updatedRow = headers.map(h => req.body[h] !== undefined ? req.body[h] : item[h]);

    await updateSheetData(range, [updatedRow]);
    res.json({ message: 'Item updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/admin/items/:kode_item', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const items = await getRowsAsObjects('items');
    const item = items.find(i => i.kode_item === req.params.kode_item);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const rowIndex = item._rowIndex;
    // We'll clear the row or mark it as inactive. 
    // mark as inactive is safer for database integrity if we don't have a real delete in sheets helper
    const headers = ['kode_item', 'nama_item', 'durasi', 'kategori_id', 'stok', 'harga_jual', 'aktif', 'description', 'image_url', 'diskon', 'flashsale'];
    const range = `items!A${rowIndex + 1}:K${rowIndex + 1}`;
    const updatedRow = headers.map(h => h === 'aktif' ? 'FALSE' : item[h]);

    await updateSheetData(range, [updatedRow]);
    res.json({ message: 'Item deleted (marked inactive)' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- PAYMENT ROUTES (Pakasir QRIS) ---

app.post('/api/payment/create-qris', authenticate, async (req: AuthRequest, res) => {
  const { order_id, amount } = req.body;
  if (!order_id || !amount) {
    return res.status(400).json({ message: 'order_id dan amount wajib diisi' });
  }

  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;
  if (!apiKey || !project) {
    return res.status(500).json({ message: 'Pakasir API Key / Project belum dikonfigurasi' });
  }

  try {
    const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, order_id, amount: Number(amount), api_key: apiKey })
    });

    const data = await response.json();
    console.log('[Pakasir] create-qris response:', JSON.stringify(data));

    if (!response.ok || !data.payment) {
      return res.status(502).json({ message: data.message || 'Gagal membuat QRIS', detail: data });
    }

    res.json({
      order_id: data.payment.order_id,
      qr_string: data.payment.payment_number,
      amount: data.payment.amount,
      total_payment: data.payment.total_payment,
      expired_at: data.payment.expired_at
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/payment/check-qris', authenticate, async (req: AuthRequest, res) => {
  const { order_id, amount } = req.query;
  if (!order_id || !amount) {
    return res.status(400).json({ message: 'order_id dan amount wajib diisi' });
  }

  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;
  if (!apiKey || !project) {
    return res.status(500).json({ message: 'Pakasir API Key / Project belum dikonfigurasi' });
  }

  try {
    const url = `https://app.pakasir.com/api/transactiondetail?project=${encodeURIComponent(project)}&amount=${encodeURIComponent(String(amount))}&order_id=${encodeURIComponent(String(order_id))}&api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(502).json({ message: data.message || 'Gagal cek status' });
    }

    // Normalkan: Pakasir pakai "completed", kita expose sebagai "success" untuk konsistensi
    const status = data.transaction?.status === 'completed' ? 'success' : (data.transaction?.status || 'pending');
    res.json({ ...data, status });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/orders/verify-payment', authenticate, async (req: AuthRequest, res) => {
  const { order_id } = req.body;
  try {
    const orders = await getRowsAsObjects('order');
    const order = orders.find(o => o.order_id === order_id);
    
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Check if it belongs to the user or if it's already paid
    if (order.username !== req.user?.username && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (order.status === 'sukses pembayaran') {
      return res.json({ message: 'Order already paid', status: order.status });
    }

    const rowIndex = order._rowIndex;
    const headers = ['order_id', 'username', 'items', 'total_price', 'timestamp', 'status', 'noted', 'admin'];
    const range = `order!A${rowIndex + 1}:H${rowIndex + 1}`;
    
    const updatedRow = headers.map(h => {
      if (h === 'status') return 'sukses pembayaran';
      return order[h];
    });

    await updateSheetData(range, [updatedRow]);
    res.json({ message: 'Payment confirmed successfully', status: 'sukses pembayaran' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/admin/users', authenticate, authorize(['admin']), async (req, res) => {
  try {
    const users = await getRowsAsObjects('users');
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// --- CEK STATUS ORDER MANUAL (untuk bot Telegram) ---
// GET /api/payment/status?order_id=ORD001
// Response: { "status": 1 } atau { "status": 0 }

app.get('/api/payment/status', async (req, res) => {
  const { order_id } = req.query;
  if (!order_id) {
    return res.status(400).json({ status: 0, message: 'order_id wajib diisi' });
  }

  try {
    const orders = await getRowsAsObjects('orders-manual');
    const order = orders.find((o: any) => o.order_id === String(order_id));

    if (!order) {
      return res.status(404).json({ status: 0, message: 'Order tidak ditemukan' });
    }

    const isPaid = order.status === '1' || order.status === 1;
    res.json({ status: isPaid ? 1 : 0 });
  } catch (error: any) {
    res.status(500).json({ status: 0, message: error.message });
  }
});

// --- MANUAL PAYMENT ROUTES (Telegram Bot / Public) ---

app.post('/api/payment/manual-create', async (req, res) => {
  const { amount, order_id } = req.body;
  if (!amount || isNaN(Number(amount)) || Number(amount) < 10) {
    return res.status(400).json({ message: 'amount tidak valid (minimal Rp 10)' });
  }

  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;
  if (!apiKey || !project) {
    return res.status(500).json({ message: 'Pakasir API Key / Project belum dikonfigurasi' });
  }

  const finalOrderId = order_id || ('MNL-' + Math.random().toString(36).substr(2, 9).toUpperCase());
  const timestamp = new Date().toISOString();

  try {
    const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project, order_id: finalOrderId, amount: Number(amount), api_key: apiKey })
    });

    const data = await response.json();
    console.log('[Pakasir Manual] create response:', JSON.stringify(data));

    if (!response.ok || !data.payment) {
      return res.status(502).json({ message: data.message || 'Gagal membuat QRIS', detail: data });
    }

    // Simpan ke sheet orders-manual dengan status 0 (pending)
    await appendSheetData('orders-manual', [[finalOrderId, amount, timestamp, '0']]);

    res.json({
      order_id: finalOrderId,
      qr_string: data.payment.payment_number,
      amount: data.payment.amount,
      total_payment: data.payment.total_payment,
      expired_at: data.payment.expired_at
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/payment/manual-check', async (req, res) => {
  const { order_id, amount } = req.query;
  if (!order_id || !amount) {
    return res.status(400).json({ message: 'order_id dan amount wajib diisi' });
  }

  const apiKey = process.env.PAKASIR_API_KEY;
  const project = process.env.PAKASIR_PROJECT;
  if (!apiKey || !project) {
    return res.status(500).json({ message: 'Pakasir API Key / Project belum dikonfigurasi' });
  }

  try {
    const url = `https://app.pakasir.com/api/transactiondetail?project=${encodeURIComponent(project)}&amount=${encodeURIComponent(String(amount))}&order_id=${encodeURIComponent(String(order_id))}&api_key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('[Pakasir Manual] check response:', JSON.stringify(data));

    if (!response.ok) {
      return res.status(502).json({ message: data.message || 'Gagal cek status' });
    }

    const isPaid = data.transaction?.status === 'completed';

    // Update sheet jika sudah lunas
    if (isPaid) {
      const orders = await getRowsAsObjects('orders-manual');
      const order = orders.find((o: any) => o.order_id === String(order_id));
      if (order && order.status !== '1') {
        const rowIndex = order._rowIndex;
        const range = `orders-manual!A${rowIndex + 1}:D${rowIndex + 1}`;
        await updateSheetData(range, [[order.order_id, order.total_price, order.timestamp, '1']]);
      }
    }

    const status = isPaid ? 'success' : (data.transaction?.status || 'pending');
    res.json({ ...data, status });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default app;

