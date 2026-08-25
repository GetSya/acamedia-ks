export interface Item {
  _rowIndex: number;
  kode_item: string;
  nama_item: string;
  durasi: string;
  kategori_id: string;
  stok: string;
  harga_jual: string;
  diskon: string;
  flashsale: string;
  aktif: string;
  description: string;
  image_url: string;
}

export interface Category {
  _rowIndex: number;
  kategori_id: string;
  kategori_nama: string;
}

export interface Review {
  _rowIndex: number;
  kode_item: string;
  username: string;
  rating: string;
  ulasan: string;
  timestamp: string;
}

export interface Order {
  _rowIndex: number;
  order_id: string;
  username: string;
  items: string; // JSON string of items
  total_price: string;
  timestamp: string;
  status: 'pending' | 'diproses' | 'selesai' | 'dibatalkan';
  noted: string;
  admin: string;
}

export interface Chat {
  _rowIndex: number;
  id: string;
  sender_username: string;
  receiver_username: string;
  message: string;
  timestamp: string;
}

export interface Information {
  _rowIndex: number;
  kode_informasi: string;
  judul: string;
  deskripsi: string;
}
