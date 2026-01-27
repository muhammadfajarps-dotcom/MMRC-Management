// ============================================================
// CONFIGURATION & SETUP
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
// MAIN LOGIC
// ============================================================
const app = {
    data: { patients: [] },
    activePatientId: null,
    activeTab: 'biodata',
    currentCategory: 'rehab',
    chartInstance: null, // Untuk Chart BPSS

    init() {
        console.log("MMRC System V17.5 Full Loaded");
        this.checkSession();
    },

    // --- SESSION CONTROL (STRICT) ---
    checkSession() {
        const session = sessionStorage.getItem('MMRC_SESSION');
        if (session === 'LOGGED_IN') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
        } else {
            document.getElementById('auth-layer').classList.remove('hidden');
            document.getElementById('app-layer').classList.add('hidden');
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_SESSION', 'LOGGED_IN');
            this.checkSession();
            this.renderDashboard();
        } else Swal.fire('Gagal', 'Akses Ditolak', 'error');
    },

    logout() {
        sessionStorage.removeItem('MMRC_SESSION');
        location.reload();
    },

    // --- DATA HANDLING ---
    saveDB() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            localStorage.setItem('MMRC_DATA_FULL', JSON.stringify(this.data));
            if(db) db.ref('mmrc_data').set(this.data);
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
    // RENDERING
    // ============================================================
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = `<span class="text-xs font-bold text-slate-400">MMRC 1999</span>`;
        document.getElementById('main-content').innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
                <h2 class="text-3xl font-black text-brand-800">PILIH UNIT LAYANAN</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    <div onclick="app.renderPatientList('detox')" class="group cursor-pointer bg-white p-8 rounded-3xl border hover:border-brand-200 shadow-xl hover:-translate-y-2 transition relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-procedures text-5xl text-brand-600 mb-6"></i>
                        <h3 class="text-2xl font-black text-slate-800">STABILISASI (DETOX)</h3>
                        <p class="text-sm text-slate-500 font-bold">Program 7 Hari. Medis Intensif.</p>
                    </div>
                    <div onclick="app.renderPatientList('rehab')" class="group cursor-pointer bg-white p-8 rounded-3xl border hover:border-brand-200 shadow-xl hover:-translate-y-2 transition relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-slate-100 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-walking text-5xl text-slate-600 mb-6"></i>
                        <h3 class="text-2xl font-black text-slate-800">REHABILITASI</h3>
                        <p class="text-sm text-slate-500 font-bold">Lanjutan. Konseling & Terapi.</p>
                    </div>
                </div>
            </div>`;
    },

    renderPatientList(category) {
        this.currentCategory = category;
        this.activePatientId = null;
        document.getElementById('page-title').innerHTML = `<span onclick="app.renderDashboard()" class="cursor-pointer text-slate-400 hover:text-brand-600">DASHBOARD</span> / ${category.toUpperCase()}`;
        document.getElementById('header-actions').innerHTML = `
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Pasien..." class="bg-white border rounded-full px-4 py-2 text-xs font-bold w-64 outline-none focus:ring-1 ring-brand-600 shadow-sm">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow flex gap-2 items-center"><i class="fas fa-plus"></i> PASIEN BARU</button>
        `;

        const filtered = this.data.patients.filter(p => {
            const prog = (p.program?.name || '').toLowerCase();
            return category === 'detox' ? prog.includes('detox') : !prog.includes('detox');
        });

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in pb-10";
        
        filtered.forEach(p => {
            const card = document.createElement('div');
            let info = p.program?.startDate ? `Hari ke-${Math.floor((new Date() - new Date(p.program.startDate))/(86400000))+1}` : 'Belum Mulai';
            card.className = "bg-white p-6 rounded-3xl border border-slate-100 shadow-lg card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
                <div class="flex gap-4 mb-4">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-xl object-cover bg-slate-100">
                    <div>
                        <h3 class="font-black text-slate-800 text-lg group-hover:text-brand-700">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-bold">${p.reg.age} Th • ${p.reg.status}</p>
                        <span class="inline-block mt-2 px-2 py-1 bg-brand-50 text-brand-700 text-[10px] font-bold rounded">${info}</span>
                    </div>
                </div>
                <div class="flex justify-between border-t pt-4">
                    <span class="text-[10px] text-slate-400 font-bold">ID: ${p.id.slice(-4)}</span>
                    <div class="flex gap-2">
                        <button onclick="app.modalPatient('${p.id}')" class="w-8 h-8 rounded-full bg-slate-100 hover:bg-brand-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-pen text-xs"></i></button>
                        <button onclick="app.deletePatient('${p.id}')" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                    </div>
                </div>`;
            grid.appendChild(card);
        });
        
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        if(filtered.length === 0) container.innerHTML = `<div class="text-center mt-20 text-slate-300 font-bold">Belum ada data pasien.</div>`;
        else container.appendChild(grid);
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
        // TOMBOL EXPORT EXCEL ADA DISINI
        document.getElementById('header-actions').innerHTML = `
            <button onclick="app.exportToExcel('${p.id}')" class="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2 mr-2"><i class="fas fa-file-excel"></i> EXPORT EXCEL</button>
            <button onclick="app.renderPatientList('${this.currentCategory}')" class="bg-white border text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-100 flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        // MENU LENGKAP DIKEMBALIKAN
        const tabs = this.currentCategory === 'detox' 
            ? ['biodata', 'program', 'medicine', 'ttv', 'screening', 'conclusi', 'crisis', 'daily']
            : ['biodata', 'program', 'medicine', 'ttv', 'assessment', 'plan', 'visit', 'daily', 'crisis', 'terminasi'];
        
        const icons = {
            biodata: 'fa-id-card', program: 'fa-list-check', medicine: 'fa-pills', ttv: 'fa-stethoscope',
            screening: 'fa-search', conclusi: 'fa-clipboard-check', crisis: 'fa-chart-pie', daily: 'fa-calendar-alt',
            assessment: 'fa-file-medical-alt', plan: 'fa-notes-medical', visit: 'fa-user-md', terminasi: 'fa-flag-checkered'
        };

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 mb-6 items-center relative overflow-hidden">
            <div class="absolute top-0 left-0 w-full h-2 bg-brand-600"></div>
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
            <div>
                <h1 class="text-3xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold">Diagnosa: ${p.diagnosis.plan || '-'}</p>
            </div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-2 mb-2 no-scrollbar px-1">`;

        tabs.forEach(t => {
            nav += `<button onclick="app.switchTab('${t}')" class="tab-btn ${this.activeTab === t ? 'active' : ''}"><i class="fas ${icons[t]} mr-2"></i> ${t.toUpperCase()}</button>`;
        });

        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[500px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        document.getElementById('main-content').innerHTML = nav;
        
        // Render Chart jika di tab Crisis
        if(this.activeTab === 'crisis') this.renderChart(p);
    },

    switchTab(t) { this.activeTab = t; this.renderPatientDetail(); },

    getTabContent(p, tab) {
        // --- BIODATA ---
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

        // --- MEDICINE (FITUR BARU + LOGIKA PANAH) ---
        if(tab === 'medicine') {
            const stocks = p.medicine?.stock || [];
            const logs = p.medicine?.logs || [];
            
            const stockHtml = stocks.map((s,i) => `
                <tr class="border-b text-xs hover:bg-slate-50">
                    <td class="p-3 font-bold">${s.name}</td>
                    <td class="p-3 text-center">${s.init}</td>
                    <td class="p-3 text-center font-black ${s.init-s.used<=5?'text-red-600':'text-emerald-600'}">${s.init-s.used}</td>
                    <td class="p-3 text-right">
                        <button onclick="app.modalUseMed('${p.id}',${i})" class="bg-brand-600 text-white px-3 py-1 rounded hover:bg-brand-700 shadow-sm text-[10px] font-bold"><i class="fas fa-arrow-down mr-1"></i> MINUM</button>
                        <button onclick="app.delSub('medicine.stock',${i})" class="text-red-400 hover:text-red-600 ml-2"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('');

            const logHtml = logs.map((l,i) => `
                <tr class="border-b text-xs hover:bg-slate-50">
                    <td class="p-3 text-slate-500">${l.time}</td>
                    <td class="p-3 font-bold text-brand-700">${l.name}</td>
                    <td class="p-3">${l.pj}</td>
                    <td class="p-3 italic text-slate-500">${l.note}</td>
                    <td class="p-3 text-right"><button onclick="app.deleteMedLog('${p.id}',${i})" class="text-red-500 hover:bg-red-50 p-1 rounded"><i class="fas fa-undo"></i> Batal</button></td>
                </tr>`).join('');

            return `
            <div class="space-y-6">
                <div class="border rounded-2xl overflow-hidden bg-white shadow-sm">
                    <div class="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
                        <h4 class="font-bold text-brand-800"><i class="fas fa-boxes"></i> STOK OBAT</h4>
                        <button onclick="app.modalStock('${p.id}')" class="text-xs bg-white border px-3 py-1 rounded-full font-bold shadow-sm hover:text-brand-600">+ TAMBAH</button>
                    </div>
                    <table class="w-full text-left"><thead><tr><th class="p-3">Nama</th><th class="p-3 text-center">Awal</th><th class="p-3 text-center">Sisa</th><th class="p-3 text-right">Aksi</th></tr></thead><tbody>${stockHtml}</tbody></table>
                </div>
                
                <div class="flex justify-center -my-3 relative z-10"><div class="bg-brand-50 text-brand-400 rounded-full p-2 border"><i class="fas fa-arrow-down"></i></div></div>

                <div class="border rounded-2xl overflow-hidden bg-white shadow-sm border-brand-100">
                    <div class="bg-brand-50 px-6 py-4 border-b border-brand-100"><h4 class="font-bold text-brand-800"><i class="fas fa-history"></i> LOG PENGGUNAAN</h4></div>
                    <div class="max-h-80 overflow-y-auto">
                        <table class="w-full text-left"><thead><tr><th class="p-3">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ</th><th class="p-3">Catatan</th><th class="p-3 text-right">Batal</th></tr></thead><tbody>${logHtml}</tbody></table>
                    </div>
                </div>
            </div>`;
        }

        // --- TTV & GDS (RESTORED FEATURE) ---
        if(tab === 'ttv') {
            const list = (p.ttv || []).map((t,i) => `
                <tr class="border-b text-xs">
                    <td class="p-3">${t.time}</td>
                    <td class="p-3 font-bold">${t.td}</td>
                    <td class="p-3">${t.nadi}</td>
                    <td class="p-3">${t.rr}</td>
                    <td class="p-3">${t.gds}</td>
                    <td class="p-3 text-right"><button onclick="app.delSub('ttv',${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('');
            
            return `
            <div class="grid grid-cols-1 md:grid-cols-5 gap-2 mb-4">
                <input id="ttv-td" placeholder="TD (mmHg)" class="input-modern">
                <input id="ttv-nadi" placeholder="Nadi (x/m)" class="input-modern">
                <input id="ttv-rr" placeholder="RR (x/m)" class="input-modern">
                <input id="ttv-gds" placeholder="GDS (mg/dL)" class="input-modern">
                <button onclick="app.addTTV('${p.id}')" class="bg-brand-600 text-white rounded-lg font-bold hover:bg-brand-700">SIMPAN</button>
            </div>
            <table class="w-full text-left border rounded-lg overflow-hidden">
                <thead><tr><th class="p-3">Waktu</th><th class="p-3">TD</th><th class="p-3">Nadi</th><th class="p-3">RR</th><th class="p-3">GDS</th><th class="p-3 text-right">Hapus</th></tr></thead>
                <tbody>${list}</tbody>
            </table>`;
        }

        // --- CRISIS / BPSS (RESTORED CHART) ---
        if(tab === 'crisis') {
            return `
            <div class="grid grid-cols-5 gap-2 mb-6">
                <input id="bpss-bio" type="number" placeholder="Bio (0-10)" class="input-modern">
                <input id="bpss-psy" type="number" placeholder="Psy (0-10)" class="input-modern">
                <input id="bpss-soc" type="number" placeholder="Soc (0-10)" class="input-modern">
                <input id="bpss-spi" type="number" placeholder="Spi (0-10)" class="input-modern">
                <button onclick="app.addCrisis('${p.id}')" class="bg-brand-600 text-white font-bold rounded-lg shadow">INPUT</button>
            </div>
            <div class="h-80 w-full"><canvas id="crisisChart"></canvas></div>
            `;
        }

        // --- GENERIC LISTS (Screening, Assessment, Plan, Visit, Daily) ---
        if(['screening','assessment','plan','visit','daily','conclusi','terminasi'].includes(tab)) {
            const items = (p[tab] || []).map((x,i) => `
                <div class="p-4 border-b hover:bg-slate-50 text-sm group">
                    <div class="flex justify-between font-bold text-slate-700 mb-1">
                        <span>${x.time} • ${x.pj}</span>
                        <button onclick="app.delSub('${tab}',${i})" class="text-red-400 opacity-0 group-hover:opacity-100"><i class="fas fa-trash"></i></button>
                    </div>
                    <p class="text-slate-600 whitespace-pre-wrap">${x.note}</p>
                </div>`).join('');
            
            return `
            <div class="space-y-4">
                <textarea id="generic-note" class="input-modern h-24" placeholder="Tulis catatan perkembangan / hasil..."></textarea>
                <div class="flex justify-between">
                    <input id="generic-pj" class="input-modern w-1/3" placeholder="Nama PJ">
                    <button onclick="app.addGeneric('${p.id}','${tab}')" class="bg-brand-600 text-white px-6 rounded-lg font-bold shadow hover:bg-brand-700">SIMPAN CATATAN</button>
                </div>
                <div class="border rounded-xl mt-4 overflow-hidden bg-white shadow-sm">${items}</div>
            </div>`;
        }

        return `<div class="p-10 text-center text-slate-300">Konten Belum Tersedia</div>`;
    },

    // ============================================================
    // LOGIC FUNCTIONS
    // ============================================================
    
    // --- MEDICINE LOGIC (CORE) ---
    modalStock(pId) {
        this.openModal('TAMBAH STOK', `<div class="space-y-3">
            <input id="st-name" class="input-modern" placeholder="Nama Obat">
            <input type="number" id="st-init" class="input-modern" placeholder="Jumlah Masuk">
            <button onclick="app.saveStock('${pId}')" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold mt-2">SIMPAN</button>
        </div>`);
    },
    saveStock(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const name = document.getElementById('st-name').value;
        const init = document.getElementById('st-init').value;
        if(!name || !init) return;
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({name, init:parseInt(init), used:0, date: new Date().toLocaleDateString()});
        this.saveDB(); this.closeModal(); this.renderPatientDetail();
    },
    modalUseMed(pId, idx) {
        const p = this.data.patients.find(x=>x.id===pId);
        const s = p.medicine.stock[idx];
        if(s.init-s.used<=0) return Swal.fire('Habis','Stok 0','error');
        this.openModal('MINUM OBAT', `<div class="space-y-3">
            <div class="bg-brand-50 p-3 rounded text-center"><h3 class="font-bold text-brand-800">${s.name}</h3><p class="text-xs">Sisa: ${s.init-s.used}</p></div>
            <input id="use-pj" class="input-modern" placeholder="Nama PJ">
            <input id="use-note" class="input-modern" placeholder="Catatan">
            <button onclick="app.saveUseMed('${pId}',${idx})" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold">KONFIRMASI</button>
        </div>`);
    },
    saveUseMed(pId, idx) {
        const p = this.data.patients.find(x=>x.id===pId);
        const s = p.medicine.stock[idx];
        s.used++;
        const log = {
            time: new Date().toLocaleString(), name: s.name, 
            pj: document.getElementById('use-pj').value || '-', 
            note: document.getElementById('use-note').value,
            refName: s.name
        };
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift(log);
        this.saveDB(); this.closeModal(); this.renderPatientDetail();
    },
    deleteMedLog(pId, logIdx) {
        const p = this.data.patients.find(x=>x.id===pId);
        const l = p.medicine.logs[logIdx];
        const s = p.medicine.stock.find(x=>x.name===l.refName);
        if(s) s.used = Math.max(0, s.used-1);
        p.medicine.logs.splice(logIdx, 1);
        this.saveDB(); this.renderPatientDetail();
    },

    // --- OTHER FEATURE LOGIC ---
    addTTV(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const form = {
            time: new Date().toLocaleString(),
            td: document.getElementById('ttv-td').value,
            nadi: document.getElementById('ttv-nadi').value,
            rr: document.getElementById('ttv-rr').value,
            gds: document.getElementById('ttv-gds').value
        };
        if(!p.ttv) p.ttv = [];
        p.ttv.unshift(form);
        this.saveDB(); this.renderPatientDetail();
    },

    addGeneric(pId, key) {
        const p = this.data.patients.find(x=>x.id===pId);
        const note = document.getElementById('generic-note').value;
        const pj = document.getElementById('generic-pj').value;
        if(!note) return;
        if(!p[key]) p[key] = [];
        p[key].unshift({ time: new Date().toLocaleString(), note, pj: pj||'-' });
        this.saveDB(); this.renderPatientDetail();
    },

    addCrisis(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const d = {
            bio: parseInt(document.getElementById('bpss-bio').value)||0,
            psy: parseInt(document.getElementById('bpss-psy').value)||0,
            soc: parseInt(document.getElementById('bpss-soc').value)||0,
            spi: parseInt(document.getElementById('bpss-spi').value)||0,
            date: new Date().toLocaleDateString()
        };
        d.total = d.bio+d.psy+d.soc+d.spi;
        if(!p.crisis) p.crisis = [];
        p.crisis.push(d);
        this.saveDB(); this.renderPatientDetail();
    },

    delSub(key, idx) {
        const p = this.data.patients.find(x=>x.id===this.activePatientId);
        const parts = key.split('.');
        if(parts.length===2) p[parts[0]][parts[1]].splice(idx,1);
        else p[key].splice(idx,1);
        this.saveDB(); this.renderPatientDetail();
    },

    // --- CHART & EXPORT ---
    renderChart(p) {
        const ctx = document.getElementById('crisisChart');
        if(!ctx || !p.crisis) return;
        const labels = p.crisis.map(x=>x.date);
        const data = p.crisis.map(x=>x.total);
        if(this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Total Score BPSS', data, borderColor: '#e11d48', tension: 0.3 }] }
        });
    },

    exportToExcel(pId) {
        const p = this.data.patients.find(x=>x.id===pId);
        const wb = XLSX.utils.book_new();
        
        // Sheet Biodata
        const bioData = [
            ["NAMA", p.reg.name], ["USIA", p.reg.age], ["STATUS", p.reg.status],
            ["PJ", p.reg.guardian], ["DIAGNOSA", p.diagnosis.plan]
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bioData), "Biodata");

        // Sheet Medicine
        if(p.medicine?.logs) {
            const medData = p.medicine.logs.map(l=>({Waktu:l.time, Obat:l.name, PJ:l.pj, Catatan:l.note}));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(medData), "Obat");
        }

        // Sheet TTV
        if(p.ttv) {
             XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");
        }

        XLSX.writeFile(wb, `Data_${p.reg.name}.xlsx`);
    },

    // --- MODAL SYSTEM ---
    openModal(t, h) { document.getElementById('modal-title').innerText=t; document.getElementById('modal-body').innerHTML=h; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    
    // --- PATIENT FORM ---
    modalPatient(id=null) {
        const p = id ? this.data.patients.find(x=>x.id===id) : {reg:{},program:{}};
        this.openModal(id?'EDIT PASIEN':'PASIEN BARU', `
            <input type="hidden" id="pid" value="${id||''}">
            <div class="space-y-3">
                <input id="fname" value="${p.reg.name||''}" class="input-modern" placeholder="Nama">
                <input type="number" id="fage" value="${p.reg.age||''}" class="input-modern" placeholder="Usia">
                <select id="fstatus" class="input-modern"><option>Umum</option><option>BPJS</option></select>
                <select id="fprog" class="input-modern"><option value="detox">Detox</option><option value="rehab">Rehab</option></select>
                <button onclick="app.savePatient()" class="bg-brand-600 text-white w-full py-3 rounded-lg font-bold">SIMPAN</button>
            </div>
        `);
    },
    savePatient() {
        const id = document.getElementById('pid').value;
        const name = document.getElementById('fname').value;
        if(!name) return;
        let p;
        if(id) p = this.data.patients.find(x=>x.id===id);
        else { p = {id:Date.now().toString(), reg:{}, diagnosis:{}, program:{}, medicine:{stock:[],logs:[]}}; this.data.patients.push(p); }
        
        p.reg.name = name;
        p.reg.age = document.getElementById('fage').value;
        p.reg.status = document.getElementById('fstatus').value;
        const type = document.getElementById('fprog').value;
        if(!p.program.name) p.program = { name: type==='detox'?'Program Detox':'Rehab', startDate: new Date().toISOString() };
        
        this.saveDB(); this.closeModal(); this.renderPatientList(this.currentCategory);
    },
    deletePatient(id) {
        if(confirm('Hapus?')) {
            this.data.patients = this.data.patients.filter(x=>x.id!==id);
            this.saveDB(); this.renderPatientList(this.currentCategory);
        }
    },
    searchDashboard() {
        const q = document.getElementById('dash-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(e => e.style.display = e.innerText.toLowerCase().includes(q)?'block':'none');
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
