// --- 1. GLOBAL ERROR HANDLER (Agar ketahuan jika ada error di HP) ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    // Abaikan error resize observer yang sering muncul di Chrome Mobile
    if (msg.includes("ResizeObserver loop")) return false; 
    
    // Tampilkan error kritis
    alert("SYSTEM ERROR:\n" + msg + "\nLine: " + lineNo);
    return false;
};

// --- 2. KONFIGURASI FIREBASE (SUDAH DIPERBAIKI) ---
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    // PERBAIKAN: Menambahkan URL Database yang hilang di script lama Anda
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Inisialisasi Firebase dengan pengecekan
try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
} catch (e) {
    alert("Firebase Init Error: " + e.message);
}

const db = firebase.database();

// --- 3. LOGIKA APLIKASI UTAMA ---
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    // Fungsi untuk memastikan struktur data tidak error saat dibaca
    fixDataStructure(data) {
        if (!data) return { patients: [] };
        if (!data.patients) data.patients = [];
        
        // Loop setiap pasien untuk memastikan sub-object ada
        data.patients = data.patients.map(p => {
            if (!p.reg) p.reg = {};
            if (!p.history) p.history = {};
            if (!p.diagnosis) p.diagnosis = {};
            
            // Medicine
            if (!p.medicine) p.medicine = { stock: [], logs: [] };
            if (!p.medicine.stock) p.medicine.stock = [];
            if (!p.medicine.logs) p.medicine.logs = [];
            
            // TTV, Visits, Crisis, Program
            if (!p.ttv) p.ttv = [];
            if (!p.visits) p.visits = [];
            if (!p.crisis) p.crisis = { bpss: [] };
            if (!p.crisis.bpss) p.crisis.bpss = [];
            if (!p.program) p.program = { type: '', duration: '' };
            
            return p;
        });
        return data;
    },

    // Fungsi Login
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            // Tampilkan Loading
            Swal.fire({
                title: 'MMRC System',
                text: 'Menghubungkan ke Database...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Sembunyikan Login, Tampilkan App
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            
            // Mulai Load Data
            this.loadDB();
            this.nav('dashboard');
        } else {
            Swal.fire('Akses Ditolak', 'Username atau Password Salah!', 'error');
        }
    },

    // Fungsi Load Database
    async loadDB() {
        try {
            // Set timeout jika koneksi lemot lebih dari 10 detik
            const timeout = setTimeout(() => {
                Swal.fire('Koneksi Lambat', 'Memuat data dari cache lokal...', 'info');
            }, 10000);

            const snapshot = await db.ref('mmrc_data').once('value');
            clearTimeout(timeout);
            
            const cloudData = snapshot.val();
            
            if (cloudData) {
                this.data = this.fixDataStructure(cloudData);
                console.log("Data Cloud Berhasil Diambil");
            } else {
                console.log("Data Cloud Kosong, inisialisasi baru.");
                this.data = { patients: [] };
            }

            Swal.close(); // Tutup loading
            this.render(); // Render halaman

        } catch (e) {
            console.error("Gagal ambil data cloud:", e);
            // Fallback ke LocalStorage jika internet mati
            const local = localStorage.getItem('MMRC_DATABASE');
            if (local) {
                this.data = this.fixDataStructure(JSON.parse(local));
                Swal.fire('Mode Offline', 'Gagal koneksi server. Menggunakan data lokal.', 'warning');
            } else {
                Swal.fire('Error', 'Gagal memuat database: ' + e.message, 'error');
            }
            this.render();
        }
    },

    // Fungsi Simpan ke Database
    async saveDB() {
        // Simpan ke LocalStorage dulu (Backup)
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        
        try {
            await db.ref('mmrc_data').set(this.data);
            console.log("Data Tersinkron ke Cloud");
        } catch (e) {
            console.error("Gagal Sinkron:", e);
            // Jangan alert setiap kali simpan, cukup console log agar tidak mengganggu
        }
    },

    // Navigasi Halaman
    nav(page) {
        this.currentPage = page;
        
        // Update Class Active di Sidebar
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        
        // Update Judul
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = page.toUpperCase();
        
        this.render();
    },

    // Render Utama
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        // Bersihkan container
        container.innerHTML = '';
        
        // Pastikan data aman
        if (!this.data.patients) this.data.patients = [];

        try {
            switch (this.currentPage) {
                case 'dashboard': this.viewDashboard(container); break;
                case 'medicine': this.viewMedicine(container); break;
                case 'ttv': this.viewTTV(container); break;
                case 'visit': this.viewVisit(container); break;
                case 'crisis': this.viewCrisis(container); break;
                case 'program': this.viewProgram(container); break;
                case 'therapy': this.viewTherapy(container); break;
            }
        } catch(e) {
            console.error("Render Error:", e);
            container.innerHTML = `<div class="p-4 text-red-500">Error rendering page: ${e.message}</div>`;
        }
    },

    // --- VIEW: DASHBOARD ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-teal-600/20 active:scale-95 transition-transform">+ REGISTRASI MASUK</button>
            </div>
            <div class="space-y-6 pb-20">
                ${(this.data.patients).map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 search-item hover:border-teal-100 transition-colors">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="lg:border-r lg:pr-4">
                                <div class="flex items-center gap-4 mb-4">
                                    <div class="w-16 h-16 rounded-2xl bg-slate-100 overflow-hidden border">
                                        <img src="${p.reg.photo || 'https://via.placeholder.com/100?text=IMG'}" class="w-full h-full object-cover">
                                    </div>
                                    <div>
                                        <h4 class="font-bold text-teal-800 text-lg leading-tight">${p.reg.name || 'Tanpa Nama'}</h4>
                                        <p class="text-[10px] text-slate-400 font-medium bg-slate-50 inline-block px-2 py-1 rounded mt-1">${p.reg.timestamp || '-'}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1.5 text-slate-600">
                                    <p class="flex justify-between"><span>TTL/Usia:</span> <b>${p.reg.ttl || '-'} / ${p.reg.age || '-'} Th</b></p>
                                    <p class="flex justify-between"><span>Status:</span> <b>${p.reg.status || '-'}</b></p>
                                    <p class="flex justify-between"><span>Pendidikan:</span> <b>${p.reg.edu || '-'}</b></p>
                                    <p class="flex justify-between"><span>Pekerjaan:</span> <b>${p.reg.job || '-'}</b></p>
                                    <div class="pt-2 border-t mt-2">
                                        <p class="text-[10px] text-slate-400">ALAMAT:</p>
                                        <p class="font-medium leading-snug">${p.reg.addr || '-'}</p>
                                    </div>
                                    <p class="text-red-500 text-[10px] pt-1"><b>SPOTCHECK:</b> ${p.reg.spotcheck || '-'}</p>
                                </div>
                            </div>
                            
                            <div class="lg:border-r lg:px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                    <i class="fas fa-history"></i> Riwayat & Kondisi
                                </h5>
                                <div class="text-[11px] space-y-3">
                                    <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <span class="text-[9px] font-bold text-slate-400 block mb-1">FISIK & PSIKIS</span>
                                        ${p.history.desc || '-'}
                                    </div>
                                    <div>
                                        <span class="text-[9px] font-bold text-slate-400">DIAGNOSA SEBELUMNYA:</span>
                                        <p class="font-medium">${p.history.prev_diag || '-'}</p>
                                    </div>
                                    <div>
                                        <span class="text-[9px] font-bold text-slate-400">DOSIS LALU:</span>
                                        <p class="font-medium">${p.history.prev_rx || '-'}</p>
                                    </div>
                                    <div class="bg-amber-50 p-2 rounded-lg text-amber-800 border border-amber-100">
                                        <b>Kondisi Kini:</b> ${p.history.current || '-'}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="lg:px-4 flex flex-col justify-between">
                                <div>
                                    <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                                        <i class="fas fa-user-md"></i> Diagnosa Dokter
                                    </h5>
                                    <div class="text-[11px] space-y-2">
                                        <p><b>DPJP:</b> ${p.diagnosis.dr_name || '-'}</p>
                                        <div class="bg-teal-50 p-3 rounded-xl border border-teal-100 text-teal-900">
                                            <b>Planning:</b> ${p.diagnosis.plan || '-'}
                                        </div>
                                        <div class="flex gap-2 my-2">
                                            <span class="px-2 py-1 rounded ${p.diagnosis.inj ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-300'} text-[10px] font-bold">Injeksi</span>
                                            <span class="px-2 py-1 rounded ${p.diagnosis.urine ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-300'} text-[10px] font-bold">Urine</span>
                                            <span class="px-2 py-1 rounded ${p.diagnosis.fiksasi ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-300'} text-[10px] font-bold">Fiksasi</span>
                                        </div>
                                        <p><b>Resep:</b> ${p.diagnosis.rx_name || '-'} (${p.diagnosis.rx_qty || 0})</p>
                                    </div>
                                </div>
                                <div class="mt-4 pt-4 border-t flex justify-end gap-3">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors">EDIT DATA</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl text-xs font-bold transition-colors">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${this.data.patients.length === 0 ? '<div class="text-center p-10 text-slate-400">Belum ada data pasien.</div>' : ''}
            </div>`;
    },

    // --- MODAL: TAMBAH/EDIT PASIEN ---
    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        
        // Helper untuk ambil value dengan aman
        const v = (obj, key) => obj && obj[key] ? obj[key] : '';

        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
                <div class="space-y-3">
                    <p class="font-black text-xs border-b pb-2 text-teal-700 tracking-wider">1. BIODATA</p>
                    <div>
                        <label class="text-[10px] font-bold text-slate-400 ml-1">FOTO PASIEN</label>
                        <input name="photo_file" type="file" accept="image/*" class="input-field text-[10px]">
                    </div>
                    <input name="name" value="${v(p?.reg, 'name')}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${v(p?.reg, 'ttl')}" placeholder="Tempat Tanggal Lahir" class="input-field">
                    <div class="grid grid-cols-2 gap-2">
                        <input name="age" value="${v(p?.reg, 'age')}" type="number" placeholder="Usia (Thn)" class="input-field">
                        <input name="status" value="${v(p?.reg, 'status')}" placeholder="Status" class="input-field">
                    </div>
                    <input name="edu" value="${v(p?.reg, 'edu')}" placeholder="Pendidikan Terakhir" class="input-field">
                    <input name="job" value="${v(p?.reg, 'job')}" placeholder="Pekerjaan" class="input-field">
                    <textarea name="addr" placeholder="Alamat Lengkap" class="input-field h-20">${v(p?.reg, 'addr')}</textarea>
                    <input name="guardian" value="${v(p?.reg, 'guardian')}" placeholder="Nama Penanggung Jawab / Wali" class="input-field">
                    <input name="spotcheck" value="${v(p?.reg, 'spotcheck')}" placeholder="Hasil Spotcheck Barang" class="input-field border-red-200 focus:border-red-500">
                </div>

                <div class="space-y-3">
                    <p class="font-black text-xs border-b pb-2 text-teal-700 tracking-wider">2. RIWAYAT PENYAKIT</p>
                    <textarea name="h_desc" placeholder="Deskripsi Fisik & Psikis" class="input-field h-24">${v(p?.history, 'desc')}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Dokter Sebelumnya" class="input-field h-20">${v(p?.history, 'prev_diag')}</textarea>
                    <input name="h_prev_rx" value="${v(p?.history, 'prev_rx')}" placeholder="Riwayat Penggunaan Obat" class="input-field">
                    <textarea name="h_current" placeholder="Kondisi Terkini Saat Masuk" class="input-field h-20 bg-amber-50 border-amber-200">${v(p?.history, 'current')}</textarea>
                </div>

                <div class="space-y-3">
                    <p class="font-black text-xs border-b pb-2 text-teal-700 tracking-wider">3. DIAGNOSA DOKTER</p>
                    <input name="d_dr" value="${v(p?.diagnosis, 'dr_name')}" placeholder="Nama Dokter Pemeriksa" class="input-field font-bold">
                    <textarea name="d_entry" placeholder="Diagnosa Masuk" class="input-field h-20">${v(p?.diagnosis, 'entry_diag')}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter" class="input-field h-20">${v(p?.diagnosis, 'plan')}</textarea>
                    
                    <div class="flex gap-4 text-[11px] bg-slate-50 p-3 rounded-xl border">
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="inj" ${p?.diagnosis?.inj?'checked':''}> Injeksi</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="urine" ${p?.diagnosis?.urine?'checked':''}> Urine Test</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="fix" ${p?.diagnosis?.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2">
                        <input name="d_rx" value="${v(p?.diagnosis, 'rx_name')}" placeholder="Nama Obat" class="input-field col-span-2">
                        <input name="d_qty" value="${v(p?.diagnosis, 'rx_qty')}" type="number" placeholder="Jml" class="input-field">
                    </div>
                </div>

                <div class="md:col-span-3 pt-4 border-t">
                    <button type="submit" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold shadow-xl transition-all active:scale-95">
                        <i class="fas fa-save mr-2"></i> SIMPAN DATA PASIEN
                    </button>
                </div>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        
        // Tampilkan loading saat simpan
        Swal.fire({ title: 'Menyimpan...', didOpen: () => Swal.showLoading() });

        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        
        let existing = editId ? this.data.patients.find(x => x.id === editId) : null;
        let photoBase64 = existing ? existing.reg.photo : null;
        
        // Handle Foto
        if (photoFile && photoFile.size > 0) {
            try {
                photoBase64 = await this.toBase64(photoFile);
            } catch (err) {
                console.error("Gagal convert foto", err);
            }
        }

        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), ttl: fd.get('ttl'), age: fd.get('age'), status: fd.get('status'),
                edu: fd.get('edu'), job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'), photo: photoBase64,
                timestamp: editId ? existing.reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: { desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fiksasi: fd.get('fix')==='on',
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
            },
            // Pertahankan data sub-fitur lain jika edit
            medicine: existing ? (existing.medicine || { stock: [], logs: [] }) : { stock: [], logs: [] },
            ttv: existing ? (existing.ttv || []) : [],
            visits: existing ? (existing.visits || []) : [],
            crisis: existing ? (existing.crisis || { bpss: [] }) : { bpss: [] },
            program: existing ? (existing.program || { type: '', duration: '' }) : { type: '', duration: '' },
            therapy: existing ? (existing.therapy || '') : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            if(idx !== -1) this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }

        await this.saveDB(); 
        Swal.close();
        this.closeModal(); 
        this.render();
        Swal.fire({ icon: 'success', title: 'Berhasil', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    },

    // --- VIEW: MEDICINE ---
    viewMedicine(container) {
        container.innerHTML = (this.data.patients).map(p => {
            const med = p.medicine || { stock: [], logs: [] };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-6 flex items-center gap-2"><i class="fas fa-pills"></i> ${p.reg.name}</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400">Stok Obat</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">+ Stok</button>
                        </div>
                        <div class="space-y-3">
                            ${(med.stock || []).map((s, i) => `
                                <div class="p-4 border rounded-2xl bg-slate-50 relative group">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[9px] text-slate-500">Exp: ${s.exp || '-'} | Awal: ${s.init}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xl font-black ${s.init-s.used <= 5 ? 'text-red-500 animate-pulse':'text-slate-700'}">${s.init-s.used}</p>
                                            <p class="text-[8px]">SISA</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow flex-1">
                                            CATAT MINUM
                                        </button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500 bg-white border p-1.5 rounded-lg"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 bg-white border p-1.5 rounded-lg"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                            ${(!med.stock || med.stock.length === 0) ? '<p class="text-xs text-slate-400 italic">Belum ada stok obat.</p>' : ''}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Riwayat Minum</h4>
                        <div class="overflow-x-auto max-h-[400px] overflow-y-auto border rounded-xl">
                            <table class="w-full text-[10px] text-left">
                                <thead class="bg-slate-100 sticky top-0"><tr><th class="p-2">Waktu</th><th class="p-2">Obat</th><th class="p-2">PJ</th><th class="p-2">Aksi</th></tr></thead>
                                <tbody>
                                ${(med.logs || []).map((l, i) => `
                                    <tr class="border-b hover:bg-slate-50">
                                        <td class="p-2">${l.time}</td><td class="p-2 font-bold text-teal-700">${l.name}</td><td class="p-2">${l.pj}</td>
                                        <td class="p-2 flex gap-2">
                                            <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                            <button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = (editIdx !== null && p.medicine) ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK OBAT" : "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s?s.name:''}" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" value="${s?s.init:''}" type="number" placeholder="Jumlah Stok Awal" class="input-field">
                <div>
                    <label class="text-[10px] text-slate-400 ml-1">Tanggal Kadaluarsa</label>
                    <input id="ms_exp" value="${s?s.exp:''}" type="date" class="input-field">
                </div>
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.medicine) p.medicine = { stock: [], logs: [] };
        
        const data = { 
            name: document.getElementById('ms_name').value, 
            init: parseInt(document.getElementById('ms_init').value) || 0, 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };

        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        
        await this.saveDB(); this.closeModal(); this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-xl text-blue-800 text-sm border border-blue-100">
                    Catat penggunaan <b>${stock.name}</b>?<br>
                    <span class="text-xs">Stok akan berkurang 1 otomatis.</span>
                </div>
                <input id="ml_pj" placeholder="Nama PJ (Penanggung Jawab)" class="input-field">
                <textarea id="ml_note" placeholder="Keterangan (Opsional)..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        
        if(!pj) return Swal.fire('Error', 'Nama PJ wajib diisi!', 'error');
        
        stock.used += 1;
        p.medicine.logs.unshift({ 
            time: new Date().toLocaleString('id-ID'), 
            name: stock.name, 
            pj: pj, 
            note: document.getElementById('ml_note').value 
        });
        
        await this.saveDB(); this.closeModal(); this.render();
    },

    async delMedLog(pid, logIdx) {
        const result = await Swal.fire({
            title: 'Hapus Log?',
            text: "Stok akan dikembalikan (+1)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus'
        });

        if(result.isConfirmed) {
            const p = this.data.patients.find(x => x.id === pid);
            const log = p.medicine.logs[logIdx];
            const stockItem = p.medicine.stock.find(s => s.name === log.name);
            
            if(stockItem && stockItem.used > 0) stockItem.used -= 1;
            
            p.medicine.logs.splice(logIdx, 1);
            await this.saveDB(); this.render();
        }
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="el_time" value="${log.time}" class="input-field">
                <input id="el_name" value="${log.name}" class="input-field bg-slate-100" readonly>
                <input id="el_pj" value="${log.pj}" class="input-field">
                <textarea id="el_note" class="input-field">${log.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${logIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    async saveEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[logIdx].time = document.getElementById('el_time').value;
        p.medicine.logs[logIdx].pj = document.getElementById('el_pj').value;
        p.medicine.logs[logIdx].note = document.getElementById('el_note').value;
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VIEW: TTV & GDS ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800 flex items-center gap-2"><i class="fas fa-heartbeat"></i> ${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT DATA</button>
                </div>
                <div class="overflow-x-auto rounded-xl border">
                    <table class="w-full text-[11px] text-left">
                        <thead class="bg-slate-100"><tr class="text-slate-500"><th class="p-3">Waktu</th><th class="p-3">TD</th><th class="p-3">Sat/RR</th><th class="p-3">TB/BB</th><th class="p-3">GDS</th><th class="p-3">Aksi</th></tr></thead>
                        <tbody>
                        ${(p.ttv || []).map((t, i) => `
                            <tr class="border-b hover:bg-slate-50">
                                <td class="p-3">${t.time}</td>
                                <td class="p-3 font-bold text-slate-700">${t.td}</td>
                                <td class="p-3">${t.sat}% / ${t.rr}</td>
                                <td class="p-3">${t.tb}/${t.bb}</td>
                                <td class="p-3 font-bold text-teal-600">${t.gds}</td>
                                <td class="p-3 flex gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                    ${(!p.ttv || p.ttv.length===0)?'<div class="p-4 text-center text-xs text-slate-400">Belum ada data TTV</div>':''}
                </div>
            </div>`).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = (editIdx !== null && p.ttv) ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT TTV/GDS" : "INPUT TTV/GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" value="${t?t.td:''}" placeholder="Tensi (ex: 120/80)" class="input-field">
                <input id="t_sat" value="${t?t.sat:''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?t.rr:''}" placeholder="RR" class="input-field">
                <input id="t_tb" value="${t?t.tb:''}" placeholder="Tinggi (cm)" class="input-field">
                <input id="t_bb" value="${t?t.bb:''}" placeholder="Berat (kg)" class="input-field">
                <input id="t_gds" value="${t?t.gds:''}" placeholder="Hasil GDS" class="input-field bg-teal-50 border-teal-200">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold mt-2">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.ttv) p.ttv = [];
        const data = { 
            time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString('id-ID'), 
            td: document.getElementById('t_td').value, 
            sat: document.getElementById('t_sat').value, 
            rr: document.getElementById('t_rr').value, 
            tb: document.getElementById('t_tb').value, 
            bb: document.getElementById('t_bb').value, 
            gds: document.getElementById('t_gds').value 
        };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VIEW: VISIT DOKTER ---
    viewVisit(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800 flex items-center gap-2"><i class="fas fa-user-md"></i> ${p.reg.name}</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">TAMBAH VISIT</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${(p.visits || []).map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative">
                            <img src="${v.photo}" class="w-full h-48 object-cover rounded-xl mb-3 shadow-sm bg-white border">
                            <p class="text-[10px] text-teal-600 font-bold mb-1">${v.time}</p>
                            <div class="bg-white p-3 rounded-lg border text-xs italic mb-2">"${v.note}"</div>
                            <div class="flex justify-between items-end">
                                <img src="${v.sign}" class="h-12 border-b">
                                <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-500 text-[10px]"><i class="fas fa-trash"></i> Hapus</button>
                            </div>
                        </div>`).join('')}
                    ${(!p.visits || p.visits.length===0)?'<p class="text-center text-slate-400 col-span-2">Belum ada data visit.</p>':''}
                </div>
            </div>`).join('');
    },

    modalAddVisit(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = (editIdx !== null && p.visits) ? p.visits[editIdx] : null;
        document.getElementById('modal-title').innerText = "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-500">Foto Visit</label>
                    <input type="file" id="v_photo" accept="image/*" class="input-field text-xs">
                </div>
                <textarea id="v_note" placeholder="Hasil Wawancara / Catatan Dokter..." class="input-field h-32">${v?v.note:''}</textarea>
                <div class="border rounded-xl p-3 bg-white text-center">
                    <p class="text-xs font-bold text-slate-400 text-left mb-2">Tanda Tangan Dokter:</p>
                    <canvas id="sig-pad" class="w-full h-40 border-2 border-dashed border-slate-300 bg-slate-50 rounded-lg touch-none"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[10px] text-red-500 mt-2 border border-red-200 px-2 py-1 rounded">Hapus TTD</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        
        // Init Signature Pad setelah modal muncul
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            if(canvas) {
                // Resize canvas resolution
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                this.signaturePad = new SignaturePad(canvas);
            }
        }, 500);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.visits) p.visits = [];
        
        const file = document.getElementById('v_photo').files[0];
        let photo = "https://via.placeholder.com/400x300?text=No+Photo";
        
        if(idx !== null && p.visits[idx]) photo = p.visits[idx].photo;
        
        if(file) {
            Swal.fire({title: 'Mengupload Foto...', didOpen: ()=>Swal.showLoading()});
            photo = await this.toBase64(file);
            Swal.close();
        }

        if(this.signaturePad.isEmpty()) {
            return Swal.fire('Error', 'Tanda tangan wajib diisi!', 'warning');
        }

        const data = { 
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), 
            note: document.getElementById('v_note').value, 
            photo: photo, 
            sign: this.signaturePad.toDataURL() 
        };

        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);
        
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VIEW: CRISIS (BPSS) ---
    viewCrisis(container) {
        container.innerHTML = (this.data.patients).map(p => {
            const crisis = p.crisis || { bpss: [] };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800"><i class="fas fa-chart-line"></i> ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border rounded-lg overflow-hidden">
                            <thead class="bg-slate-100"><tr><th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Total</th><th class="p-2">Aksi</th></tr></thead>
                            <tbody>
                            ${(crisis.bpss || []).map((b, i) => `
                                <tr class="border-b">
                                    <td class="p-2">D-${i+1}</td><td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
                                    <td class="p-2 font-bold text-red-600">${b.eval}</td>
                                    <td class="p-2">
                                        <button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-2 bg-slate-50 relative">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        // Render Charts after HTML inserted
        setTimeout(() => {
            this.data.patients.forEach(p => this.renderChart(p));
        }, 100);
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis || !p.crisis.bpss || !p.crisis.bpss.length) return;
        
        // Destroy old chart if exists (prevent overlap)
        if(p.chartInstance) p.chartInstance.destroy();

        p.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `Day ${i+1}`),
                datasets: [{ 
                    label: 'BPSS Score', 
                    data: p.crisis.bpss.map(b => b.eval), 
                    borderColor: '#dc2626', 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { 
                maintainAspectRatio: false,
                responsive: true,
                plugins: { legend: {display: false} }
            }
        });
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" type="number" placeholder="Biological (0-10)" class="input-field">
                <input id="b_psy" type="number" placeholder="Psychological (0-10)" class="input-field">
                <input id="b_soc" type="number" placeholder="Social (0-10)" class="input-field">
                <input id="b_spi" type="number" placeholder="Spiritual (0-10)" class="input-field">
                <textarea id="b_note" placeholder="Catatan Evaluasi..." class="input-field col-span-2 h-20"></textarea>
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold">SIMPAN SKOR</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.crisis) p.crisis = { bpss: [] };
        
        const bio = parseInt(document.getElementById('b_bio').value)||0;
        const psy = parseInt(document.getElementById('b_psy').value)||0;
        const soc = parseInt(document.getElementById('b_soc').value)||0;
        const spi = parseInt(document.getElementById('b_spi').value)||0;
        
        p.crisis.bpss.push({ 
            bio, psy, soc, spi, 
            eval: bio+psy+soc+spi, 
            note: document.getElementById('b_note').value 
        });
        
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VIEW: PROGRAM ---
    viewProgram(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4 flex items-center gap-2"><i class="fas fa-calendar-check"></i> ${p.reg.name}</h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-teal-50 p-4 rounded-xl border border-teal-100 text-center">
                        <span class="text-xs text-teal-600 block mb-1">PAKET PROGRAM</span>
                        <b class="text-lg text-teal-900">${p.program?.type || '-'}</b>
                    </div>
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                        <span class="text-xs text-blue-600 block mb-1">DURASI</span>
                        <b class="text-lg text-blue-900">${p.program?.duration || '-'}</b>
                    </div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold w-full">EDIT RENCANA PROGRAM</button>
            </div>`).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs text-slate-500 font-bold ml-1">Jenis Program</label>
                    <select id="pr_type" class="input-field">
                        <option value="Reguler" ${p.program?.type==='Reguler'?'selected':''}>Reguler</option>
                        <option value="Eksklusif" ${p.program?.type==='Eksklusif'?'selected':''}>Eksklusif</option>
                        <option value="VIP" ${p.program?.type==='VIP'?'selected':''}>VIP</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs text-slate-500 font-bold ml-1">Durasi</label>
                    <select id="pr_dur" class="input-field">
                        <option value="7 Hari" ${p.program?.duration==='7 Hari'?'selected':''}>7 Hari</option>
                        <option value="14 Hari" ${p.program?.duration==='14 Hari'?'selected':''}>14 Hari</option>
                        <option value="30 Hari" ${p.program?.duration==='30 Hari'?'selected':''}>30 Hari</option>
                        <option value="3 Bulan" ${p.program?.duration==='3 Bulan'?'selected':''}>3 Bulan</option>
                    </select>
                </div>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { type: document.getElementById('pr_type').value, duration: document.getElementById('pr_dur').value };
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VIEW: THERAPY ---
    viewTherapy(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4 flex items-center gap-2"><i class="fas fa-brain"></i> ${p.reg.name}</h3>
                <label class="text-xs font-bold text-slate-400 mb-2 block">CATATAN TERAPI:</label>
                <textarea id="ther_${p.id}" class="input-field h-40 mb-4 bg-slate-50">${p.therapy || ''}</textarea>
                <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-lg">SIMPAN CATATAN</button>
            </div>`).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        await this.saveDB();
        Swal.fire({ title: 'Tersimpan', icon: 'success', toast: true, position: 'top-end', timer: 1000, showConfirmButton: false });
    },

    // --- UTILS ---
    async delPatient(pid) {
        const res = await Swal.fire({
            title: 'Hapus Pasien?',
            text: "Data akan hilang permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        });
        
        if(res.isConfirmed) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            await this.saveDB(); this.render();
            Swal.fire('Terhapus!', 'Data pasien telah dihapus.', 'success');
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        
        target.splice(idx, 1);
        await this.saveDB(); this.render();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    
    toBase64: f => new Promise((resolve, reject) => { 
        const rd = new FileReader(); 
        rd.readAsDataURL(f); 
        rd.onload = () => resolve(rd.result); 
        rd.onerror = error => reject(error);
    }),

    exportAllExcel() {
        if(this.data.patients.length === 0) return Swal.fire('Data Kosong', 'Tidak ada data untuk diekspor', 'info');
        
        const rows = this.data.patients.map(p => ({ 
            Nama: p.reg.name, 
            RM: p.reg.rm,
            Diagnosa: p.diagnosis.dr_name, 
            Program: p.program?.type,
            Masuk: p.reg.timestamp
        }));
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "MMRC_Data.xlsx");
    },

    exportToWord() {
        Swal.fire('Fitur Word', 'Sedang dalam pengembangan ekspor dokumen.', 'info');
    }
};

// Ekspos app ke window agar bisa dipanggil dari HTML onclick
window.app = app;
