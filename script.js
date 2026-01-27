// ============================================================
// CONFIGURATION (MMRC V17.0 - MAROON EDITION)
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAyC3ZPW1XOciNwaJHOhkwSY8vFY1BRlz8",
  authDomain: "mmrc-stock1999.firebaseapp.com",
  databaseURL: "https://mmrc-stock1999-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mmrc-stock1999",
  storageBucket: "mmrc-stock1999.firebasestorage.app",
  messagingSenderId: "486588564272",
  appId: "1:486588564272:web:308b276a53401a738ebef5",
  measurementId: "G-4218HRWRTC"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

// ============================================================
// MAIN APPLICATION LOGIC
// ============================================================
const app = {
    data: { patients: [] },
    activePatientId: null,
    activeTab: 'biodata',
    currentCategory: 'rehab',
    
    init() {
        console.log("MMRC System V17.0 - Ready");
        this.checkSession(); // Cek Login saat start
    },

    // --- 1. FITUR LOGIN ULANG (STRICT SESSION) ---
    // Menggunakan sessionStorage: data hilang jika browser/tab ditutup.
    checkSession() {
        const session = sessionStorage.getItem('MMRC_SESSION_KEY');
        if (session === 'VALID_LOGIN') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB(); // Load data hanya jika login valid
        } else {
            // Jika tidak ada session, paksa ke layar login
            document.getElementById('auth-layer').classList.remove('hidden');
            document.getElementById('app-layer').classList.add('hidden');
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        // Password Hardcoded sesuai request
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_SESSION_KEY', 'VALID_LOGIN'); 
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.renderDashboard();
            Swal.fire({
                icon: 'success', 
                title: 'Akses Diterima', 
                text: 'Selamat bekerja, Staff MMRC.',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Akses Ditolak', 'ID atau Kode Akses salah.', 'error');
        }
    },

    logout() {
        sessionStorage.removeItem('MMRC_SESSION_KEY'); // Hapus session key
        location.reload(); // Reload halaman agar kembali ke login screen
    },

    // --- DATABASE HANDLERS ---
    saveDB() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('MMRC_DATA_LOC', JSON.stringify(this.data));
                if(db) db.ref('mmrc_data').set(this.data);
            } catch(e) { console.error("Save failed:", e); }
        }, 500);
    },

    loadDB() {
        // Load local dulu agar cepat
        const local = localStorage.getItem('MMRC_DATA_LOC');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];

        // Sync Firebase
        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                const val = snap.val();
                if(val) {
                    // Hanya update jika tidak sedang membuka modal (mencegah conflict input)
                    if(document.getElementById('modal-container').classList.contains('hidden')) {
                        this.data = val;
                        if(!this.data.patients) this.data.patients = [];
                        localStorage.setItem('MMRC_DATA_LOC', JSON.stringify(this.data));
                        // Refresh view jika sedang membuka halaman
                        if(this.activePatientId) this.renderPatientDetail();
                    }
                }
            });
        }
    },

    // ============================================================
    // RENDERING & LOGIC
    // ============================================================
    
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = `<span class="text-xs font-bold text-slate-400">MMRC STOCK 1999</span>`;
        
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
                <div class="text-center mb-4">
                    <h2 class="text-3xl font-black text-brand-800 tracking-tight">PILIH UNIT LAYANAN</h2>
                    <p class="text-slate-400 font-medium">Silakan pilih kategori pasien untuk dikelola</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    <div onclick="app.renderPatientList('detox')" class="group cursor-pointer bg-white p-8 rounded-3xl border-2 border-transparent hover:border-brand-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-procedures text-5xl text-brand-600 mb-6 group-hover:scale-110 transition duration-300"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">STABILISASI & DETOX</h3>
                        <p class="text-sm text-slate-500 font-bold mb-4">Program 7 Hari. Screening & Conclusi.</p>
                        <div class="flex items-center text-brand-700 font-bold text-sm group-hover:translate-x-2 transition uppercase tracking-wider">Buka Data <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                    <div onclick="app.renderPatientList('rehab')" class="group cursor-pointer bg-white p-8 rounded-3xl border-2 border-transparent hover:border-brand-200 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-walking text-5xl text-slate-600 mb-6 group-hover:scale-110 transition duration-300"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">REHABILITASI</h3>
                        <p class="text-sm text-slate-500 font-bold mb-4">Lanjutan (14 Hari - 1 Tahun). Visit, Terapi.</p>
                        <div class="flex items-center text-slate-700 font-bold text-sm group-hover:translate-x-2 transition uppercase tracking-wider">Buka Data <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                </div>
            </div>`;
    },

    renderPatientList(category) {
        this.currentCategory = category;
        this.activePatientId = null;
        const title = category === 'detox' ? "UNIT STABILISASI (DETOX)" : "UNIT REHABILITASI";
        
        document.getElementById('page-title').innerHTML = `<span class="text-slate-400 cursor-pointer hover:text-brand-600 transition" onclick="app.renderDashboard()">DASHBOARD</span> <span class="text-slate-300 mx-2">/</span> <span class="text-brand-800">${title}</span>`;
        
        document.getElementById('header-actions').innerHTML = `
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Nama Pasien..." class="bg-white border border-slate-200 rounded-full px-5 py-2 text-xs font-bold w-64 shadow-sm outline-none focus:border-brand-600 focus:ring-1 focus:ring-brand-600 transition">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-5 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow-lg transform hover:scale-105 transition flex items-center gap-2"><i class="fas fa-plus"></i> PASIEN BARU</button>
        `;

        const filtered = this.data.patients.filter(p => {
            const prog = (p.program?.name || '').toLowerCase();
            return category === 'detox' ? prog.includes('detox') : !prog.includes('detox');
        });

        const container = document.getElementById('main-content');
        if(!filtered.length) {
            container.innerHTML = `<div class="text-center mt-24 text-slate-300"><i class="fas fa-folder-open text-6xl mb-4 opacity-50"></i><p class="font-bold">Belum ada pasien di unit ini.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in pb-10";
        
        filtered.forEach(p => {
            const card = document.createElement('div');
            // Logic status hari
            let info = p.program?.name || 'Belum Set Program';
            if(p.program?.startDate) {
                const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                info += ` • Hari ke-${diff}`;
            }

            card.className = "bg-white p-6 rounded-3xl border border-slate-100 shadow-lg card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
                <div class="flex items-start gap-4 mb-4 pl-3">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-100 shadow-sm">
                    <div>
                        <h3 class="font-black text-slate-800 text-lg leading-tight group-hover:text-brand-700 transition">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-bold mt-1 uppercase">${p.reg.age} Th • ${p.reg.status||'Umum'}</p>
                        <p class="text-[10px] text-brand-600 font-bold mt-2 bg-brand-50 px-2 py-1 rounded inline-block border border-brand-100">${info}</p>
                    </div>
                </div>
                <div class="flex justify-between items-center border-t pt-4 pl-3">
                    <div class="text-[10px] text-slate-400 font-bold">ID: ${p.id.slice(-6)}</div>
                    <div class="flex gap-2">
                        <button onclick="app.modalPatient('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-brand-600 hover:text-white transition shadow-sm flex items-center justify-center"><i class="fas fa-pen text-xs"></i></button>
                        <button onclick="app.deletePatient('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition shadow-sm flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        container.innerHTML = '';
        container.appendChild(grid);
    },

    openPatient(id) {
        this.activePatientId = id;
        this.activeTab = 'biodata';
        this.renderPatientDetail();
    },

    renderPatientDetail() {
        const p = this.data.patients.find(x => x.id === this.activePatientId);
        if(!p) return this.renderPatientList(this.currentCategory);
        
        document.getElementById('page-title').innerText = "DETAIL BERKAS PASIEN";
        document.getElementById('header-actions').innerHTML = `
            <button onclick="app.renderPatientList('${this.currentCategory}')" class="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-100 transition shadow-sm flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        const tabs = this.currentCategory === 'detox' 
            ? [{id:'biodata', l:'Biodata', i:'fa-id-card'}, {id:'program', l:'Program', i:'fa-list-check'}, {id:'medicine', l:'Medicine', i:'fa-pills'}, {id:'ttv', l:'TTV & GDS', i:'fa-stethoscope'}, {id:'conclusi', l:'Conclusi', i:'fa-clipboard-check'}, {id:'daily', l:'Harian', i:'fa-calendar'}]
            : [{id:'biodata', l:'Biodata', i:'fa-id-card'}, {id:'program', l:'Program', i:'fa-list-check'}, {id:'assessment', l:'Assessment', i:'fa-file-medical'}, {id:'medicine', l:'Medicine', i:'fa-pills'}, {id:'ttv', l:'TTV & GDS', i:'fa-stethoscope'}, {id:'visit', l:'Visit Dokter', i:'fa-user-md'}, {id:'daily', l:'Harian', i:'fa-calendar'}];

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-6 items-center md:items-start fade-in relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-brand-600"></div>
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
            <div class="flex-1 text-center md:text-left">
                <h1 class="text-3xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold mb-2">Diagnosis: ${p.diagnosis.plan || '-'}</p>
                <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200"><i class="fas fa-user-circle mr-1"></i> ${p.reg.guardian||'Tanpa PJ'}</span>
                    <span class="px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-100"><i class="fas fa-notes-medical mr-1"></i> ${this.currentCategory.toUpperCase()}</span>
                </div>
            </div>
        </div>
        
        <div class="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar px-1">`;
        
        tabs.forEach(t => {
            nav += `<button onclick="app.switchTab('${t.id}')" class="tab-btn ${this.activeTab === t.id ? 'active' : ''}"><i class="fas ${t.i} mr-2"></i> ${t.l}</button>`;
        });
        
        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[500px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        document.getElementById('main-content').innerHTML = nav;
    },

    switchTab(t) { this.activeTab = t; this.renderPatientDetail(); },

    getTabContent(p, tab) {
        if(tab === 'biodata') {
            return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div class="p-4 border rounded-xl bg-slate-50"><p class="text-xs font-bold text-slate-400 uppercase">Nama</p><p class="font-bold text-slate-700 text-lg">${p.reg.name}</p></div>
                    <div class="p-4 border rounded-xl bg-slate-50"><p class="text-xs font-bold text-slate-400 uppercase">TTL</p><p class="font-bold text-slate-700">${p.reg.ttl||'-'}</p></div>
                    <div class="p-4 border rounded-xl bg-slate-50"><p class="text-xs font-bold text-slate-400 uppercase">Usia</p><p class="font-bold text-slate-700">${p.reg.age||'-'} Tahun</p></div>
                </div>
                <div class="space-y-4">
                    <div class="p-4 border rounded-xl bg-slate-50"><p class="text-xs font-bold text-slate-400 uppercase">Penanggung Jawab</p><p class="font-bold text-slate-700">${p.reg.guardian||'-'}</p></div>
                    <div class="p-4 border rounded-xl bg-slate-50"><p class="text-xs font-bold text-slate-400 uppercase">Riwayat Penggunaan</p><p class="font-bold text-slate-700">${p.reg.history||'-'}</p></div>
                    <button onclick="app.modalPatient('${p.id}')" class="w-full py-3 bg-brand-600 text-white rounded-xl font-bold shadow hover:bg-brand-700">EDIT DATA PASIEN</button>
                </div>
            </div>`;
        }

        // --- 2. FITUR MEDICINE (DIPERBAIKI SESUAI LOGIKA CORETAAN) ---
        // Atas: Tabel Stok.
        // Bawah: Tabel Log (Hasil dari klik Minum di atas).
        if(tab === 'medicine') {
            const stocks = p.medicine?.stock || [];
            const logs = p.medicine?.logs || [];

            // Tabel 1: STOK OBAT
            const stockRows = stocks.map((s, i) => {
                const sisa = s.init - s.used;
                const isLow = sisa <= 5; 
                return `
                <tr class="border-b hover:bg-slate-50 text-xs">
                    <td class="p-3 font-bold text-slate-700">${s.name}</td>
                    <td class="p-3 text-center text-slate-500">${s.init}</td>
                    <td class="p-3 text-center">
                        <span class="font-black text-sm ${isLow ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-emerald-600'}">${sisa}</span>
                    </td>
                    <td class="p-3 text-right">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-700 shadow-sm transition transform hover:scale-105">
                           <i class="fas fa-capsules mr-1"></i> MINUM
                        </button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="text-red-400 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic text-xs">Belum ada stok obat.</td></tr>`;

            // Tabel 2: LOG PENGGUNAAN (Target Panah)
            const logRows = logs.map((l, i) => `
                <tr class="border-b hover:bg-slate-50 text-xs animate-fade-in">
                    <td class="p-3 text-slate-500 font-mono">${l.time}</td>
                    <td class="p-3 font-bold text-brand-700">${l.name}</td>
                    <td class="p-3">${l.pj}</td>
                    <td class="p-3 italic text-slate-500">${l.note || '-'}</td>
                    <td class="p-3 text-right">
                        <button onclick="app.deleteMedLog('${p.id}', ${i})" class="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition" title="Hapus & Restore Stok">
                            <i class="fas fa-undo"></i>
                        </button>
                    </td>
                </tr>
            `).join('') || `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic text-xs">Belum ada riwayat minum obat.</td></tr>`;

            return `
            <div class="space-y-8">
                <div class="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div class="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                        <h4 class="font-bold text-brand-800 flex items-center gap-2"><i class="fas fa-boxes"></i> MONITORING STOK OBAT</h4>
                        <button onclick="app.modalStock('${p.id}')" class="bg-white border border-slate-300 text-slate-600 hover:text-brand-600 hover:border-brand-600 px-3 py-1 rounded-full text-xs font-bold transition shadow-sm">+ TAMBAH OBAT</button>
                    </div>
                    <table class="w-full text-left">
                        <thead class="text-[10px] uppercase font-bold text-slate-400 bg-slate-50 border-b">
                            <tr><th class="p-3 pl-6">Nama Obat</th><th class="p-3 text-center">Awal</th><th class="p-3 text-center">Sisa</th><th class="p-3 text-right pr-6">Aksi</th></tr>
                        </thead>
                        <tbody>${stockRows}</tbody>
                    </table>
                </div>

                <div class="flex justify-center -my-4 relative z-10">
                    <div class="bg-brand-50 text-brand-300 rounded-full p-2 border border-brand-100"><i class="fas fa-arrow-down"></i></div>
                </div>

                <div class="border border-brand-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <div class="bg-brand-50 px-6 py-4 border-b border-brand-100">
                        <h4 class="font-bold text-brand-800 flex items-center gap-2"><i class="fas fa-history"></i> RIWAYAT PENGGUNAAN (LOG)</h4>
                    </div>
                    <div class="max-h-80 overflow-y-auto">
                        <table class="w-full text-left">
                            <thead class="text-[10px] uppercase font-bold text-brand-800/50 bg-white border-b sticky top-0">
                                <tr><th class="p-3 pl-6">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ Staff</th><th class="p-3">Catatan</th><th class="p-3 text-right pr-6">Batal</th></tr>
                            </thead>
                            <tbody>${logRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        }

        return `<div class="text-center p-10 text-slate-300">Konten tab ini belum tersedia.</div>`;
    },

    // ============================================================
    // MODAL LOGIC
    // ============================================================
    
    openModal(title, content) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = content;
        document.getElementById('modal-container').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // --- MODAL PASIEN BARU/EDIT ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : { reg: {}, diagnosis: {}, program: {} };
        const isEdit = !!id;
        
        this.openModal(isEdit ? 'EDIT DATA PASIEN' : 'REGISTRASI PASIEN BARU', `
            <input type="hidden" id="form-id" value="${id || ''}">
            <div class="space-y-4">
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Nama Lengkap</label>
                <input id="form-name" value="${p.reg.name || ''}" class="input-modern" placeholder="Nama Pasien"></div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="block text-xs font-bold text-slate-500 mb-1">Usia</label>
                    <input type="number" id="form-age" value="${p.reg.age || ''}" class="input-modern"></div>
                    <div><label class="block text-xs font-bold text-slate-500 mb-1">Status</label>
                    <select id="form-status" class="input-modern">
                        <option value="Umum">Umum</option><option value="BPJS">BPJS</option><option value="Sosial">Sosial</option>
                    </select></div>
                </div>

                <div><label class="block text-xs font-bold text-slate-500 mb-1">Program Layanan</label>
                <select id="form-prog" class="input-modern">
                    <option value="detox" ${p.program?.name?.includes('Detox') ? 'selected' : ''}>Stabilisasi & Detox (7 Hari)</option>
                    <option value="rehab" ${!p.program?.name?.includes('Detox') ? 'selected' : ''}>Rehabilitasi Reguler</option>
                </select></div>

                <button onclick="app.savePatient()" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold mt-4 shadow-lg hover:bg-brand-700 transition">SIMPAN DATA</button>
            </div>
        `);
    },

    savePatient() {
        const id = document.getElementById('form-id').value;
        const name = document.getElementById('form-name').value;
        if(!name) return Swal.fire('Gagal', 'Nama wajib diisi!', 'error');

        let p;
        if(id) {
            p = this.data.patients.find(x => x.id === id);
        } else {
            p = { id: Date.now().toString(), reg: { timestamp: new Date().toLocaleDateString() }, diagnosis: {}, program: {}, medicine: {stock:[], logs:[]} };
            this.data.patients.push(p);
        }

        p.reg.name = name;
        p.reg.age = document.getElementById('form-age').value;
        p.reg.status = document.getElementById('form-status').value;
        const progType = document.getElementById('form-prog').value;
        
        if(!p.program.name || !id) { // Set program jika baru atau dipaksa
            p.program = progType === 'detox' 
                ? { name: 'Program Detox', days: 7, startDate: new Date().toISOString() }
                : { name: 'Program Rehabilitasi', days: 180, startDate: new Date().toISOString() };
        }

        this.saveDB();
        this.closeModal();
        this.renderPatientList(this.currentCategory);
        Swal.fire('Tersimpan', 'Data pasien berhasil disimpan.', 'success');
    },

    deletePatient(id) {
        Swal.fire({
            title: 'Hapus Pasien?', text: "Data akan hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(x => x.id !== id);
                this.saveDB();
                this.renderPatientList(this.currentCategory);
                Swal.fire('Terhapus', 'Data pasien dihapus.', 'success');
            }
        });
    },

    // --- MODAL & LOGIC MEDICINE (THE CORE REQUEST) ---

    // 1. Tambah Stok
    modalStock(pId) {
        this.openModal('TAMBAH STOK OBAT', `
            <div class="space-y-4">
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Nama Obat</label>
                <input id="st-name" class="input-modern" placeholder="Contoh: Paracetamol 500mg"></div>
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Jumlah Masuk (Tablet/Pcs)</label>
                <input type="number" id="st-init" class="input-modern" placeholder="0"></div>
                <button onclick="app.saveStock('${pId}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow hover:bg-brand-700">SIMPAN STOK</button>
            </div>
        `);
    },

    saveStock(pId) {
        const p = this.data.patients.find(x => x.id === pId);
        const name = document.getElementById('st-name').value;
        const init = parseInt(document.getElementById('st-init').value);

        if(!name || !init) return Swal.fire('Error', 'Data tidak lengkap', 'error');

        if(!p.medicine) p.medicine = { stock: [], logs: [] };
        if(!p.medicine.stock) p.medicine.stock = [];

        p.medicine.stock.push({ name: name, init: init, used: 0, date_in: new Date().toLocaleDateString() });
        this.saveDB();
        this.closeModal();
        this.renderPatientDetail();
    },

    // 2. Minum Obat (THE ARROW LOGIC: Stock -> Log)
    modalUseMed(pId, stockIdx) {
        const p = this.data.patients.find(x => x.id === pId);
        const stock = p.medicine.stock[stockIdx];
        
        // Cek jika habis
        if(stock.init - stock.used <= 0) return Swal.fire('Stok Habis', 'Obat ini sudah habis!', 'warning');

        this.openModal('CATAT PENGGUNAAN', `
            <input type="hidden" id="use-idx" value="${stockIdx}">
            <div class="bg-brand-50 p-4 rounded-xl mb-4 text-center border border-brand-100">
                <p class="text-[10px] font-bold text-brand-600 uppercase">Menggunakan Obat</p>
                <h3 class="text-xl font-black text-brand-800">${stock.name}</h3>
                <p class="text-xs text-slate-500">Sisa Stok: <b>${stock.init - stock.used}</b></p>
            </div>
            <div class="space-y-3">
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Waktu</label>
                <input type="datetime-local" id="use-time" class="input-modern" value="${new Date().toISOString().slice(0,16)}"></div>
                <div><label class="block text-xs font-bold text-slate-500 mb-1">PJ (Staff)</label>
                <input id="use-pj" class="input-modern" placeholder="Nama Staff..."></div>
                <div><label class="block text-xs font-bold text-slate-500 mb-1">Catatan</label>
                <input id="use-note" class="input-modern" placeholder="Kondisi Pasien..."></div>
                <button onclick="app.saveUseMed('${pId}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow hover:bg-brand-700 mt-2">KONFIRMASI MINUM</button>
            </div>
        `);
    },

    saveUseMed(pId) {
        const idx = document.getElementById('use-idx').value;
        const p = this.data.patients.find(x => x.id === pId);
        const stock = p.medicine.stock[idx];

        // LOGIKA UTAMA: Kurangi Stok -> Buat Log
        stock.used = (stock.used || 0) + 1;

        const newLog = {
            time: document.getElementById('use-time').value.replace('T', ' '),
            name: stock.name,
            pj: document.getElementById('use-pj').value || 'Admin',
            note: document.getElementById('use-note').value,
            stockRefName: stock.name // Referensi untuk restore jika log dihapus
        };

        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift(newLog); // Masukkan ke paling atas (Tabel Bawah)

        this.saveDB();
        this.closeModal();
        this.renderPatientDetail();
        Swal.fire({ icon: 'success', title: 'Tercatat', text: 'Stok berkurang, Log bertambah.', timer: 1000, showConfirmButton: false });
    },

    // 3. Hapus Log (Restore Stok)
    deleteMedLog(pId, logIdx) {
        Swal.fire({
            title: 'Batalkan Penggunaan?',
            text: "Stok obat akan dikembalikan (+1)",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Ya, Batalkan'
        }).then((result) => {
            if (result.isConfirmed) {
                const p = this.data.patients.find(x => x.id === pId);
                const log = p.medicine.logs[logIdx];

                // Cari stok yang namanya sama
                const stock = p.medicine.stock.find(s => s.name === log.name || s.name === log.stockRefName);
                
                // Balikin Stok (Reverse Logic)
                if(stock) {
                    stock.used = Math.max(0, stock.used - 1);
                }

                // Hapus Log
                p.medicine.logs.splice(logIdx, 1);
                
                this.saveDB();
                this.renderPatientDetail();
                Swal.fire('Dibatalkan', 'Stok telah dikembalikan.', 'success');
            }
        });
    },

    delSubItem(path, idx) {
        // Helper umum untuk hapus item array
        const p = this.data.patients.find(x => x.id === this.activePatientId);
        const parts = path.split('.');
        if(parts.length === 2) {
             p[parts[0]][parts[1]].splice(idx, 1);
             this.saveDB();
             this.renderPatientDetail();
        }
    },

    searchDashboard() {
        const q = document.getElementById('dash-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
