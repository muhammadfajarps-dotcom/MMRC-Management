// ============================================================
// CONFIGURATION (MMRC V17.0 - ORIGINAL STRUCTURE FIXED)
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
    signaturePad: null,
    chartInstance: null,
    saveTimeout: null,
    tempSignature: null,

    init() {
        console.log("MMRC System V17.0 - Ready");
        this.checkSession();
    },

    // --- 1. FITUR LOGIN ULANG (STRICT SESSION) ---
    checkSession() {
        const session = sessionStorage.getItem('MMRC_SESSION');
        if (session === 'LOGGED_IN') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
        } else {
            // Jika tutup browser/tab, session hilang -> Wajib Login lagi
            document.getElementById('auth-layer').classList.remove('hidden');
            document.getElementById('app-layer').classList.add('hidden');
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_SESSION', 'LOGGED_IN');
            this.checkSession(); // Re-check to open app
            this.renderDashboard();
        } else Swal.fire('Error', 'ID atau Password Salah', 'error');
    },

    logout() {
        sessionStorage.removeItem('MMRC_SESSION');
        location.reload();
    },

    // --- DATABASE ---
    saveDB() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('MMRC_DATA_FULL', JSON.stringify(this.data));
                if(db) db.ref('mmrc_data').set(this.data);
            } catch(e) { console.error(e); }
        }, 800);
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_FULL');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];

        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                const val = snap.val();
                if(val && document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = val;
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATA_FULL', JSON.stringify(this.data));
                    if(this.activePatientId) this.renderPatientDetail();
                }
            });
        }
    },

    // ============================================================
    // RENDERING UI
    // ============================================================
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = `<button onclick="app.logout()" class="text-xs text-red-500 font-bold hover:underline">LOGOUT</button>`;
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
                <div class="text-center mb-4">
                    <h2 class="text-3xl font-black text-brand-800">PILIH UNIT LAYANAN</h2>
                    <p class="text-slate-400">Silakan pilih kategori pasien</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    <div onclick="app.renderPatientList('detox')" class="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-xl hover:-translate-y-2 transition relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-procedures text-5xl text-brand-600 mb-6 group-hover:scale-110 transition"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">STABILISASI (DETOX)</h3>
                        <p class="text-sm text-slate-500 font-bold">Program 7 Hari. Medis Intensif.</p>
                        <div class="mt-6 flex items-center text-brand-600 font-bold text-sm uppercase tracking-wider">Buka Data <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                    <div onclick="app.renderPatientList('rehab')" class="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-xl hover:-translate-y-2 transition relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-walking text-5xl text-slate-600 mb-6 group-hover:scale-110 transition"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">REHABILITASI</h3>
                        <p class="text-sm text-slate-500 font-bold">Lanjutan. Konseling & Terapi.</p>
                        <div class="mt-6 flex items-center text-slate-600 font-bold text-sm uppercase tracking-wider">Buka Data <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                </div>
            </div>`;
    },

    renderPatientList(category) {
        this.currentCategory = category;
        this.activePatientId = null;
        document.getElementById('page-title').innerHTML = `<span class="text-slate-400 cursor-pointer hover:underline" onclick="app.renderDashboard()">DASHBOARD</span> / <span class="text-brand-800">${category.toUpperCase()}</span>`;
        document.getElementById('header-actions').innerHTML = `
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Pasien..." class="bg-white border rounded-full px-4 py-2 text-xs font-bold w-48 shadow-sm outline-none focus:ring-1 ring-brand-600">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow flex items-center gap-2"><i class="fas fa-plus"></i> PASIEN BARU</button>
        `;

        const filtered = this.data.patients.filter(p => {
            const prog = (p.program?.name || '').toLowerCase();
            return category === 'detox' ? prog.includes('detox') : !prog.includes('detox');
        });

        const container = document.getElementById('main-content');
        if(!filtered.length) {
            container.innerHTML = `<div class="text-center mt-20 text-slate-400"><i class="fas fa-folder-open text-4xl mb-4 opacity-30"></i><p>Belum ada pasien.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in pb-10";
        filtered.forEach(p => {
            const card = document.createElement('div');
            let info = p.program?.startDate ? `Hari ke-${Math.floor((new Date()-new Date(p.program.startDate))/86400000)+1}` : 'Belum Mulai';
            card.className = "bg-white p-6 rounded-3xl border border-slate-100 shadow-lg card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
                <div class="flex items-center gap-4 mb-4">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm">
                    <div>
                        <h3 class="font-black text-slate-800 text-lg group-hover:text-brand-700 transition">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-bold">${p.reg.age} Th • ${p.reg.status}</p>
                        <span class="inline-block mt-2 px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded border border-brand-100">${info}</span>
                    </div>
                </div>
                <div class="flex justify-between border-t pt-4">
                    <span class="text-[10px] text-slate-400 font-bold">ID: ${p.id.slice(-6)}</span>
                    <div class="flex gap-2">
                        <button onclick="app.modalPatient('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-brand-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-pen text-xs"></i></button>
                        <button onclick="app.deletePatient('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>`;
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
            <button onclick="app.exportToExcel('${p.id}')" class="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2 mr-2"><i class="fas fa-file-excel"></i> EXCEL</button>
            <button onclick="app.renderPatientList('${this.currentCategory}')" class="bg-white border text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-100 flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        // TAB YANG SAMA PERSIS DENGAN KODE LAMA
        const tabs = this.currentCategory === 'detox' 
            ? ['biodata', 'program', 'medicine', 'ttv', 'screening', 'conclusi', 'crisis', 'daily']
            : ['biodata', 'program', 'medicine', 'ttv', 'assessment', 'plan', 'visit', 'daily', 'crisis', 'terminasi'];
        
        // MAPPING ICON
        const icons = {
            biodata:'fa-id-card', program:'fa-list-check', medicine:'fa-pills', ttv:'fa-stethoscope',
            screening:'fa-search', conclusi:'fa-clipboard-check', crisis:'fa-chart-pie', daily:'fa-calendar-alt',
            assessment:'fa-file-medical-alt', plan:'fa-notes-medical', visit:'fa-user-md', terminasi:'fa-flag-checkered'
        };

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 mb-6 items-center relative overflow-hidden fade-in">
            <div class="absolute top-0 left-0 w-full h-2 bg-brand-600"></div>
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
            <div>
                <h1 class="text-3xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold">Diagnosa: ${p.diagnosis.plan || '-'}</p>
                <div class="mt-2 flex gap-2">
                    <span class="px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded">PJ: ${p.reg.guardian||'-'}</span>
                    <span class="px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded">${this.currentCategory.toUpperCase()}</span>
                </div>
            </div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar px-1">`;
        
        tabs.forEach(t => nav += `<button onclick="app.switchTab('${t}')" class="tab-btn ${this.activeTab === t ? 'active' : ''}"><i class="fas ${icons[t]} mr-2"></i> ${t.toUpperCase()}</button>`);
        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[500px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        document.getElementById('main-content').innerHTML = nav;
        
        if(this.activeTab === 'crisis') this.renderChart(p);
    },

    switchTab(t) { this.activeTab = t; this.renderPatientDetail(); },

    getTabContent(p, tab) {
        const searchInput = `<div class="absolute top-6 right-6"><input onkeyup="app.searchTable(this)" placeholder="Cari..." class="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 ring-brand-200"></div>`;
        
        // 1. BIODATA (ASLI)
        if(tab === 'biodata') {
            return `<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <div class="p-4 bg-slate-50 rounded-xl border"><p class="text-xs font-bold text-slate-400">NAMA</p><p class="font-bold text-lg">${p.reg.name}</p></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><p class="text-xs font-bold text-slate-400">USIA</p><p class="font-bold">${p.reg.age} Tahun</p></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><p class="text-xs font-bold text-slate-400">STATUS</p><p class="font-bold">${p.reg.status}</p></div>
                </div>
                <div class="space-y-4">
                    <div class="p-4 bg-slate-50 rounded-xl border"><p class="text-xs font-bold text-slate-400">PJ</p><p class="font-bold">${p.reg.guardian}</p></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><p class="text-xs font-bold text-slate-400">RIWAYAT</p><p class="font-bold">${p.reg.history}</p></div>
                    <button onclick="app.modalPatient('${p.id}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 shadow">EDIT DATA</button>
                </div>
            </div>`;
        }

        // 2. MEDICINE (LOGIKA BARU SESUAI REQUEST: PANAH & OPTIMAL)
        if(tab === 'medicine') {
            const stocks = p.medicine?.stock || [];
            const logs = p.medicine?.logs || [];
            
            // Tabel Stok (Atas)
            const stockHtml = stocks.map((s,i) => {
                const sisa = s.init - s.used;
                const isLow = sisa <= 5;
                return `
                <tr class="border-b text-xs hover:bg-slate-50">
                    <td class="p-3 font-bold text-slate-700">${s.name}</td>
                    <td class="p-3 text-center text-slate-500">${s.init}</td>
                    <td class="p-3 text-center">
                        <span class="font-black text-sm ${isLow ? 'text-red-600 bg-red-50 px-2 py-1 rounded' : 'text-emerald-600'}">${sisa}</span>
                    </td>
                    <td class="p-3 text-right">
                        <button onclick="app.modalUseMed('${p.id}',${i})" class="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold hover:bg-brand-700 shadow-sm transition transform hover:scale-105">
                           <i class="fas fa-arrow-down mr-1"></i> MINUM
                        </button>
                        <button onclick="app.delSub('medicine.stock',${i})" class="text-red-400 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('') || `<tr><td colspan="4" class="p-4 text-center text-slate-400 italic">Stok Kosong</td></tr>`;

            // Tabel Log (Bawah)
            const logHtml = logs.map((l,i) => `
                <tr class="border-b text-xs hover:bg-slate-50 animate-fade-in">
                    <td class="p-3 text-slate-500 font-mono">${l.time}</td>
                    <td class="p-3 font-bold text-brand-700">${l.name}</td>
                    <td class="p-3">${l.pj}</td>
                    <td class="p-3 italic text-slate-500">${l.note}</td>
                    <td class="p-3 text-right">
                        <button onclick="app.deleteMedLog('${p.id}',${i})" class="text-red-500 hover:bg-red-50 p-1 rounded" title="Hapus & Kembalikan Stok"><i class="fas fa-undo"></i> Batal</button>
                    </td>
                </tr>`).join('') || `<tr><td colspan="5" class="p-4 text-center text-slate-400 italic">Belum ada riwayat penggunaan</td></tr>`;

            return `
            <div class="space-y-6">
                <div class="border rounded-2xl overflow-hidden bg-white shadow-sm border-slate-200">
                    <div class="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                        <h4 class="font-bold text-brand-800 flex items-center gap-2"><i class="fas fa-boxes"></i> STOK OBAT</h4>
                        <button onclick="app.modalStock('${p.id}')" class="bg-white border border-slate-300 text-slate-600 px-3 py-1 rounded-full text-xs font-bold hover:text-brand-600 hover:border-brand-600 transition">+ TAMBAH OBAT</button>
                    </div>
                    <table class="w-full text-left">
                        <thead class="text-[10px] uppercase font-bold text-slate-400 bg-slate-50/50 border-b">
                            <tr><th class="p-3 pl-6">Nama Obat</th><th class="p-3 text-center">Awal</th><th class="p-3 text-center">Sisa</th><th class="p-3 text-right pr-6">Aksi</th></tr>
                        </thead>
                        <tbody>${stockHtml}</tbody>
                    </table>
                </div>
                
                <div class="flex justify-center -my-3 relative z-10">
                    <div class="bg-brand-50 text-brand-600 rounded-full p-2 border border-brand-100 shadow-sm animate-bounce"><i class="fas fa-arrow-down"></i></div>
                </div>

                <div class="border rounded-2xl overflow-hidden bg-white shadow-sm border-brand-100">
                    <div class="bg-brand-50 px-6 py-4 border-b border-brand-100">
                        <h4 class="font-bold text-brand-800 flex items-center gap-2"><i class="fas fa-history"></i> LOG PENGGUNAAN OBAT</h4>
                    </div>
                    <div class="max-h-80 overflow-y-auto">
                        <table class="w-full text-left">
                            <thead class="text-[10px] uppercase font-bold text-brand-800/50 bg-white border-b sticky top-0">
                                <tr><th class="p-3 pl-6">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ Staff</th><th class="p-3">Catatan</th><th class="p-3 text-right pr-6">Batal</th></tr>
                            </thead>
                            <tbody>${logHtml}</tbody>
                        </table>
                    </div>
                </div>
            </div>`;
        }

        // 3. TTV (FITUR LAMA DIKEMBALIKAN)
        if(tab === 'ttv') {
            const list = (p.ttv || []).map((t,i) => `
                <tr class="border-b text-xs search-row">
                    <td class="p-3">${t.time}</td><td class="p-3 font-bold">${t.td}</td><td class="p-3">${t.nadi}</td><td class="p-3">${t.rr}</td><td class="p-3">${t.gds}</td>
                    <td class="p-3 text-right"><button onclick="app.delSub('ttv',${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('');
            return `${searchInput}<div class="grid grid-cols-5 gap-2 mb-4"><input id="ttv-td" placeholder="TD" class="input-modern"><input id="ttv-nadi" placeholder="Nadi" class="input-modern"><input id="ttv-rr" placeholder="RR" class="input-modern"><input id="ttv-gds" placeholder="GDS" class="input-modern"><button onclick="app.addTTV('${p.id}')" class="bg-brand-600 text-white rounded font-bold">SIMPAN</button></div><table class="w-full text-left border rounded-lg overflow-hidden"><thead><tr class="bg-slate-50 text-xs"><th>WAKTU</th><th>TD</th><th>NADI</th><th>RR</th><th>GDS</th><th></th></tr></thead><tbody>${list}</tbody></table>`;
        }

        // 4. CHART CRISIS (FITUR LAMA DIKEMBALIKAN)
        if(tab === 'crisis') {
            return `<div class="grid grid-cols-5 gap-2 mb-6"><input id="bpss-bio" type="number" placeholder="Bio" class="input-modern"><input id="bpss-psy" type="number" placeholder="Psy" class="input-modern"><input id="bpss-soc" type="number" placeholder="Soc" class="input-modern"><input id="bpss-spi" type="number" placeholder="Spi" class="input-modern"><button onclick="app.addCrisis('${p.id}')" class="bg-brand-600 text-white font-bold rounded">INPUT</button></div><div class="h-80 w-full"><canvas id="crisisChart"></canvas></div>`;
        }

        // 5. GENERIC LISTS + SIGNATURE (DIKEMBALIKAN SESUAI STRUKTUR LAMA)
        const signedTabs = ['visit', 'counseling', 'daily', 'assessment', 'plan', 'terminasi', 'screening', 'conclusi'];
        if(signedTabs.includes(tab)) {
            // Mapping nama array yang benar sesuai script lama (penting!)
            let arrName = tab;
            if(tab === 'visit') arrName = 'visits'; 
            if(tab === 'plan') arrName = 'plan_therapy';
            if(tab === 'daily') arrName = 'daily_progress';
            if(tab === 'terminasi') arrName = 'termination';
            
            const items = (p[arrName] || []).map((x,i) => `
                <div class="p-4 border-b hover:bg-slate-50 text-sm group relative">
                    <div class="flex justify-between font-bold text-slate-700 mb-1">
                        <span>${x.time} • ${x.pj}</span>
                        <button onclick="app.delSub('${arrName}',${i})" class="text-red-400 opacity-0 group-hover:opacity-100"><i class="fas fa-trash"></i></button>
                    </div>
                    <p class="text-slate-600 whitespace-pre-wrap">${x.note}</p>
                    ${x.sign ? `<img src="${x.sign}" class="h-10 mt-2 border border-slate-200 rounded p-1 bg-white">` : ''}
                </div>`).join('');
            
            return `${searchInput}<div class="space-y-4">
                <textarea id="generic-note" class="input-modern h-24" placeholder="Tulis catatan perkembangan..."></textarea>
                <div class="flex justify-between gap-4">
                    <input id="generic-pj" class="input-modern" placeholder="Nama PJ">
                    <button onclick="app.openSignature('${arrName}')" class="bg-slate-200 px-4 rounded font-bold hover:bg-slate-300 text-xs"><i class="fas fa-signature"></i> TTD</button>
                    <button onclick="app.addGeneric('${p.id}','${arrName}')" class="bg-brand-600 text-white px-6 rounded font-bold shadow">SIMPAN</button>
                </div>
                <div class="border rounded-xl mt-4 overflow-hidden bg-white shadow-sm">${items}</div>
            </div>`;
        }

        return `<div class="p-10 text-center text-slate-300">Konten Belum Tersedia</div>`;
    },

    // ============================================================
    // LOGIC FUNCTIONS
    // ============================================================
    
    // --- MEDICINE LOGIC (FIXED) ---
    modalStock(pId) {
        this.openModal('TAMBAH STOK', `<div class="space-y-3"><input id="st-name" class="input-modern" placeholder="Nama Obat"><input type="number" id="st-init" class="input-modern" placeholder="Jumlah Masuk"><button onclick="app.saveStock('${pId}')" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold mt-2">SIMPAN STOK</button></div>`);
    },
    saveStock(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const name = document.getElementById('st-name').value;
        const init = parseInt(document.getElementById('st-init').value);
        if(!name || !init) return;
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({name, init, used:0, date_in: new Date().toLocaleDateString()});
        this.saveDB(); this.closeModal(); this.renderPatientDetail();
    },
    modalUseMed(pId, idx) {
        const p = this.data.patients.find(x=>x.id===pId);
        const s = p.medicine.stock[idx];
        if(s.init - s.used <= 0) return Swal.fire('Habis', 'Stok obat ini habis!', 'error');
        this.openModal('MINUM OBAT', `<div class="space-y-3"><div class="bg-brand-50 p-3 rounded text-center border border-brand-100"><h3 class="font-bold text-brand-800">${s.name}</h3><p class="text-xs text-brand-600">Sisa Stok: ${s.init - s.used}</p></div><input id="use-pj" class="input-modern" placeholder="Nama PJ (Staff)"><input id="use-note" class="input-modern" placeholder="Catatan (Opsional)"><button onclick="app.saveUseMed('${pId}',${idx})" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold">KONFIRMASI MINUM</button></div>`);
    },
    saveUseMed(pId, idx) {
        const p = this.data.patients.find(x=>x.id===pId);
        const s = p.medicine.stock[idx];
        
        // 1. Kurangi Stok
        s.used = (s.used || 0) + 1;
        
        // 2. Buat Log
        const log = {
            time: new Date().toLocaleString(),
            name: s.name,
            pj: document.getElementById('use-pj').value || 'Admin',
            note: document.getElementById('use-note').value,
            refName: s.name // Kunci untuk restore stok
        };
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift(log); // Tambah ke atas
        
        this.saveDB(); this.closeModal(); this.renderPatientDetail();
        Swal.fire({icon:'success', title:'Tercatat', text:'Stok berkurang & Log ditambahkan', timer:1000, showConfirmButton:false});
    },
    deleteMedLog(pId, logIdx) {
        Swal.fire({title:'Batalkan?', text:"Stok akan dikembalikan (+1)", icon:'question', showCancelButton:true, confirmButtonText:'Ya, Batalkan'}).then(r => {
            if(r.isConfirmed) {
                const p = this.data.patients.find(x=>x.id===pId);
                const log = p.medicine.logs[logIdx];
                // Restore Stok Logic
                const stock = p.medicine.stock.find(s => s.name === log.refName || s.name === log.name);
                if(stock) stock.used = Math.max(0, stock.used - 1);
                
                p.medicine.logs.splice(logIdx, 1);
                this.saveDB(); this.renderPatientDetail();
                Swal.fire('Dibatalkan', 'Stok dikembalikan', 'success');
            }
        });
    },

    // --- OTHER LOGIC (TTV, CRISIS, GENERIC) ---
    addTTV(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const d = { time: new Date().toLocaleString(), td: document.getElementById('ttv-td').value, nadi: document.getElementById('ttv-nadi').value, rr: document.getElementById('ttv-rr').value, gds: document.getElementById('ttv-gds').value };
        if(!p.ttv) p.ttv=[]; p.ttv.unshift(d); this.saveDB(); this.renderPatientDetail();
    },
    addCrisis(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const d = { bio: parseInt(document.getElementById('bpss-bio').value)||0, psy: parseInt(document.getElementById('bpss-psy').value)||0, soc: parseInt(document.getElementById('bpss-soc').value)||0, spi: parseInt(document.getElementById('bpss-spi').value)||0, date: new Date().toLocaleDateString() };
        d.total = d.bio+d.psy+d.soc+d.spi;
        if(!p.crisis) p.crisis=[]; p.crisis.push(d); this.saveDB(); this.renderPatientDetail();
    },
    addGeneric(pId, key) {
        const p = this.data.patients.find(x=>x.id===pId);
        const note = document.getElementById('generic-note').value;
        if(!note) return;
        if(!p[key]) p[key]=[]; 
        p[key].unshift({time:new Date().toLocaleString(), note, pj:document.getElementById('generic-pj').value||'-', sign: this.tempSignature});
        this.tempSignature = null;
        this.saveDB(); this.renderPatientDetail();
    },
    delSub(key, idx) {
        const p = this.data.patients.find(x=>x.id===this.activePatientId);
        // Cek jika key nested atau direct array
        const parts = key.split('.');
        if(parts.length===2) {
             if(p[parts[0]] && p[parts[0]][parts[1]]) p[parts[0]][parts[1]].splice(idx,1);
        } else {
             if(p[key]) p[key].splice(idx,1);
        }
        this.saveDB(); this.renderPatientDetail();
    },

    // --- SIGNATURE & CHART ---
    openSignature(key) {
        this.openModal('TANDA TANGAN', `<div class="bg-slate-50 p-2 rounded"><canvas id="sig-pad" class="border bg-white w-full h-40 touch-none"></canvas></div><button onclick="app.saveSignature('${key}')" class="w-full bg-brand-600 text-white py-2 rounded mt-2 font-bold">SIMPAN TTD</button>`);
        const canvas = document.getElementById('sig-pad');
        // Resize canvas agar tidak blur
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.signaturePad = new SignaturePad(canvas);
    },
    saveSignature(key) {
        if(this.signaturePad.isEmpty()) return alert("Tanda tangan kosong");
        this.tempSignature = this.signaturePad.toDataURL();
        this.closeModal();
        Swal.fire({icon:'success', title:'Tersimpan', text:'Silakan klik tombol SIMPAN di form', timer:1500, showConfirmButton:false});
    },
    renderChart(p) {
        const ctx = document.getElementById('crisisChart');
        if(!ctx || !p.crisis) return;
        if(this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, { type: 'line', data: { labels: p.crisis.map(x=>x.date), datasets: [{ label: 'Total Skor BPSS', data: p.crisis.map(x=>x.total), borderColor: '#e11d48', tension: 0.3 }] } });
    },

    // --- EXPORT EXCEL (DETAIL SESUAI KODE LAMA) ---
    exportToExcel(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const wb = XLSX.utils.book_new();
        
        // 1. BIODATA
        const bio = [["NAMA",p.reg.name],["USIA",p.reg.age],["STATUS",p.reg.status],["DIAGNOSA",p.diagnosis.plan]];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bio), "Biodata");
        
        // 2. MEDICINE
        if(p.medicine?.logs) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.medicine.logs), "Obat");
        
        // 3. TTV
        if(p.ttv) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");
        
        // 4. TAB LAIN (Visits, dll)
        const mapLog = (arr) => (arr||[]).map(x=>({Waktu:x.time, PJ:x.pj, Catatan:x.note, AdaTTD:x.sign?'Ya':'Tidak'}));
        if(p.visits) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.visits)), "Visit_Dokter");
        if(p.daily_progress) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.daily_progress)), "Harian");
        if(p.plan_therapy) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.plan_therapy)), "Rencana_Terapi");

        XLSX.writeFile(wb, `Data_${p.reg.name}.xlsx`);
    },

    exportToWord(id) { Swal.fire('Info', 'Fitur Export Word dalam pengembangan', 'info'); },
    
    // --- STANDARD MODALS ---
    openModal(t, h) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-body').innerHTML=h; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    
    modalPatient(id=null) {
        const p = id ? this.data.patients.find(x=>x.id===id) : {reg:{},program:{}};
        this.openModal(id?'EDIT PASIEN':'PASIEN BARU', `<div class="space-y-3"><input id="fn" value="${p.reg.name||''}" class="input-modern" placeholder="Nama Lengkap"><input id="fa" value="${p.reg.age||''}" class="input-modern" placeholder="Usia"><select id="fs" class="input-modern"><option>Umum</option><option>BPJS</option><option>Sosial</option></select><select id="fp" class="input-modern"><option value="detox">Stabilisasi (Detox)</option><option value="rehab">Rehabilitasi</option></select><button onclick="app.savePatient('${id||''}')" class="bg-brand-600 text-white w-full py-3 rounded font-bold hover:bg-brand-700">SIMPAN DATA</button></div>`);
    },
    savePatient(id) {
        const name = document.getElementById('fn').value;
        if(!name) return Swal.fire('Error','Nama wajib diisi','error');
        
        let p = id ? this.data.patients.find(x=>x.id===id) : {id:Date.now().toString(), reg:{timestamp:new Date().toLocaleDateString()}, diagnosis:{}, program:{}, medicine:{stock:[],logs:[]}};
        if(!id) this.data.patients.push(p);
        
        p.reg.name = name; 
        p.reg.age = document.getElementById('fa').value; 
        p.reg.status = document.getElementById('fs').value;
        const type = document.getElementById('fp').value;
        if(!p.program.name) p.program = {name:type==='detox'?'Program Detox':'Rehab', startDate:new Date().toISOString()};
        
        this.saveDB(); this.closeModal(); this.renderPatientList(this.currentCategory);
    },
    deletePatient(id) {
        Swal.fire({title:'Hapus Data?', text:'Tidak bisa dikembalikan', icon:'warning', showCancelButton:true}).then(r=>{
            if(r.isConfirmed){ this.data.patients = this.data.patients.filter(x=>x.id!==id); this.saveDB(); this.renderPatientList(this.currentCategory); }
        });
    },
    searchDashboard() {
        const q = document.getElementById('dash-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(e => e.style.display = e.innerText.toLowerCase().includes(q)?'block':'none');
    },
    searchTable(el) {
        const q = el.value.toLowerCase();
        el.closest('#tab-content').querySelectorAll('tbody tr').forEach(tr => {
            tr.style.display = tr.innerText.toLowerCase().includes(q) ? 'table-row' : 'none';
        });
    }
};

// --- DUMMY SIGNATURE PAD (Jika library tidak load) ---
if(typeof SignaturePad === 'undefined') {
    window.SignaturePad = class { constructor(c){this.c=c;} isEmpty(){return false;} toDataURL(){return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFhAJ/wlseKgAAAABJRU5ErkJggg==';} };
}

document.addEventListener('DOMContentLoaded', () => app.init());
