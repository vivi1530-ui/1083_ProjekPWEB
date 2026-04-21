/**
 * SISTEM MANAJEMEN INVENTARIS - VI'S YUM
 * Tugas P1 Pemrograman Web
 */

// 1. Inisialisasi Data (Poin 8: LocalStorage)
let inventory = JSON.parse(localStorage.getItem('visYumData')) || [];

// Shortcut DOM Elements
const inventoryForm = document.getElementById('inventoryForm');
const productTable = document.querySelector('#productTable tbody');
const searchBar = document.getElementById('searchBar');
const formTitle = document.getElementById('formTitle');
const submitBtn = document.getElementById('submitBtn');

let editId = null; // Penanda mode edit

// --- FUNGSI HELPER ---

// Fungsi mengubah file gambar ke string Base64 agar bisa masuk LocalStorage
const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
    });
};

// --- FUNGSI UTAMA ---

// (2) Render Tabel (Poin 2: Render from Array of Objects)
const renderTable = (data = inventory) => {
    productTable.innerHTML = '';
    
    data.forEach((item) => {
        const row = document.createElement('tr');
        
        // (7) Statistik: Logic Stok Menipis (Poin 7)
        const isLowStock = item.stock < 5;
        const stockWarning = isLowStock ? '<br><span style="color:red; font-size:11px; font-weight:bold;">⚠️ Stok Menipis!</span>' : '';
        
        row.innerHTML = `
            <td><img src="${item.img || 'https://placehold.co/50x50?text=Kue'}" class="prod-thumb" alt="${item.name}"></td>
            <td><strong>${item.id}</strong><br>${item.name}</td>
            <td><span class="badge">${item.category}</span></td>
            <td>${item.stock} Pcs ${stockWarning}</td>
            <td>Rp ${Number(item.price).toLocaleString('id-ID')}</td>
            <td>
                <button onclick="prepareEdit('${item.id}')" style="background:#819b5d; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; margin-bottom:5px;">Edit</button>
                <button onclick="deleteItem('${item.id}')" style="background:#E30613; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer">Hapus</button>
            </td>
        `;
        productTable.appendChild(row);
    });

    updateStats();
    localStorage.setItem('visYumData', JSON.stringify(inventory)); // (8) Simpan ke LocalStorage
};

// (1 & 3) Handle Form Submit (Tambah & Update)
inventoryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // (1) Validasi JavaScript (Poin 1)
    const kode = document.getElementById('kode').value.trim();
    const nama = document.getElementById('nama').value.trim();
    const kategori = document.getElementById('kategori').value;
    const stok = parseInt(document.getElementById('stok').value);
    const harga = parseInt(document.getElementById('harga').value);
    const tanggal = document.getElementById('tanggal').value;
    const fotoFile = document.getElementById('foto').files[0];

    let fotoData = null;
    if (fotoFile) {
        fotoData = await getBase64(fotoFile);
    }

    // Buat objek data
    const itemData = {
        id: kode,
        name: nama,
        category: kategori,
        stock: stok,
        price: harga,
        date: tanggal,
        img: fotoData // Bisa null jika tidak upload
    };

    if (editId) {
        // (3) Fitur Edit: Update Array (Poin 3)
        const index = inventory.findIndex(i => i.id === editId);
        
        // Pertahankan foto lama jika saat edit tidak upload foto baru
        if (!fotoData) itemData.img = inventory[index].img;
        
        inventory[index] = itemData;
        alert("Barang berhasil diperbarui!");
        
        // Kembalikan form ke mode tambah
        editId = null;
        formTitle.innerText = "Tambah Barang Baru";
        submitBtn.innerText = "Simpan Ke Inventaris";
        document.getElementById('kode').readOnly = false;
    } else {
        // Mode Tambah: Validasi kode unik
        if (inventory.some(i => i.id === kode)) {
            return alert("Error: Kode barang '" + kode + "' sudah terdaftar!");
        }
        inventory.push(itemData);
        alert("Barang berhasil ditambahkan!");
    }

    inventoryForm.reset();
    renderTable();
});

// (3) Persiapan Edit: Isi Form dengan data lama
window.prepareEdit = (id) => {
    const item = inventory.find(i => i.id === id);
    if (item) {
        document.getElementById('kode').value = item.id;
        document.getElementById('nama').value = item.name;
        document.getElementById('kategori').value = item.category;
        document.getElementById('stok').value = item.stock;
        document.getElementById('harga').value = item.price;
        document.getElementById('tanggal').value = item.date;
        
        // Set mode edit
        editId = id;
        formTitle.innerText = "Edit Data Barang: " + id;
        submitBtn.innerText = "Simpan Perubahan";
        document.getElementById('kode').readOnly = true; // Kode barang unik tidak boleh diubah
        
        window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll ke form
    }
};

// (4) Fitur Hapus: Dengan Konfirmasi (Poin 4)
window.deleteItem = (id) => {
    if (confirm(`Apakah Anda yakin ingin menghapus barang [${id}]?`)) {
        inventory = inventory.filter(i => i.id !== id);
        renderTable();
    }
};

// (5 & 6) Pencarian Real-time & Filter (Poin 5 & 6)
const filterData = () => {
    const searchTerm = searchBar.value.toLowerCase();
    const activeFilters = Array.from(document.querySelectorAll('.cat-filter:checked'))
                               .map(cb => cb.value);

    const filtered = inventory.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm) || 
                              item.id.toLowerCase().includes(searchTerm);
        const matchesCategory = activeFilters.includes('all') || activeFilters.includes(item.category);
        return matchesSearch && matchesCategory;
    });
    
    renderTable(filtered);
};

// (7) Statistik (Poin 7)
const updateStats = () => {
    // Total Jenis Item
    const totalItems = inventory.length;
    
    // Total Nilai Inventaris (Price * Stock)
    const totalValue = inventory.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
    
    // Total Stok Menipis (< 5)
    const lowStockCount = inventory.filter(i => i.stock < 5).length;

    // Update ke UI
    document.getElementById('statTotalItems').innerText = totalItems;
    document.getElementById('statTotalValue').innerText = `Rp ${totalValue.toLocaleString('id-ID')}`;
    document.getElementById('statLowStock').innerText = lowStockCount;
};

// --- EVENT LISTENERS ---

// Listener Pencarian (Poin 5)
searchBar.addEventListener('input', filterData);

// Listener Filter Kategori (Poin 6)
document.querySelectorAll('.cat-filter').forEach(cb => {
    cb.addEventListener('change', (e) => {
        // Logic: Jika pilih kategori lain, uncheck 'Semua'. Jika pilih 'Semua', uncheck lainnya.
        if (e.target.value === 'all') {
            document.querySelectorAll('.cat-filter').forEach(c => { if(c.value !== 'all') c.checked = false; });
        } else {
            document.querySelector('.cat-filter[value="all"]').checked = false;
        }
        filterData();
    });
});

// Jalankan render pertama kali
document.addEventListener('DOMContentLoaded', renderTable);