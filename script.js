// ============================================================
// CONFIGURATION (MMRC V17.0 - MEDICINE AUTOMATION FINAL)
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
    isRestoring: false,

    init() {
        console.log("MMRC System V17.0 - Ready");
        this.checkSession();
    },

    // --- FITUR LOGIN ULANG SAAT KELUAR (STRICT SESSION) ---
    // Menggunakan sessionStorage agar saat tab ditutup/keluar, session hilang.
    checkSession() {
        const session = sessionStorage.getItem('MMRC_SESSION');
        if (session === 'LOGGED_IN') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.isRestoring = true;
            this.loadDB();
        } else {
            // Jika tidak ada session (baru buka/tutup browser), wajib login
            document.getElementById('auth-layer').classList.remove('hidden');
            document.getElementById('app-layer').classList.add('hidden');
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_SESSION', 'LOGGED_IN'); 
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.renderDashboard();
        } else Swal.fire('Error', 'Login Gagal', 'error');
    },

    logout() {
        sessionStorage.removeItem('MMRC_SESSION'); 
        localStorage.removeItem('MMRC_LAST_STATE');
        location.reload();
    },

    // --- STATE & DB ---
    saveState(viewType, detailId = null) {
        const state = { view: viewType, category: this.currentCategory, id: detailId, tab: this.activeTab };
        localStorage.setItem('MMRC_LAST_STATE', JSON.stringify(state));
    },

    restoreLastView() {
        const lastState = localStorage.getItem('MMRC_LAST_STATE');
        if (lastState && this.data.patients.length > 0) {
            const state = JSON.parse(lastState);
            this.currentCategory = state.category || 'rehab';
            if (state.view === 'detail' && state.id) {
                const exists = this.data.patients.find(p => p.id === state.id);
                if (exists) {
                    this.activePatientId = state.id;
                    this.activeTab = state.tab || 'biodata';
                    this.renderPatientDetail();
                } else this.renderPatientList(this.currentCategory);
            } else if (state.view === 'list') this.renderPatientList(this.currentCategory);
            else this.renderDashboard();
        } else this.renderDashboard();
        this.isRestoring = false;
    },

    saveDB() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            try {
                localStorage.setItem('MMRC_DATA_V17', JSON.stringify(this.data));
                if(db) db.ref('mmrc_data').set(this.data);
            } catch(e) { console.error("Save failed:", e); }
        }, 500);
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_V17');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];

        if (this.isRestoring) this.restoreLastView();

        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                const val = snap.val();
                if(val && document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = val;
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATA_V17', JSON.stringify(this.data));
                    if (!this.isRestoring) {
                        if(this.activePatientId) this.renderPatientDetail();
                        else if(document.getElementById('page-title').innerText.includes('DASHBOARD')) this.renderDashboard();
                        else this.renderPatientList(this.currentCategory);
                    }
                }
            });
        }
    },

    // ============================================================
    // RENDERING
    // ============================================================
    renderDashboard() {
        this.activePatientId = null;
        this.saveState('dashboard');
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = `<button onclick="app.logout()" class="text-xs text-red-500 font-bold hover:underline">LOGOUT</button>`;
        const container = document.getElementById('main-content');
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
                <div class="text-center mb-4">
                    <h2 class="text-2xl font-black text-slate-700">PILIH UNIT LAYANAN</h2>
                    <p class="text-slate-400">Silakan pilih kategori pasien</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-4">
                    <div onclick="app.renderPatientList('detox')" class="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-rose-100 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-procedures text-5xl text-rose-500 mb-4 group-hover:scale-110 transition duration-300"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">STABILISASI & DETOX</h3>
                        <p class="text-sm text-slate-500 font-medium">Program 7 Hari. Screening & Conclusi.</p>
                        <div class="mt-6 flex items-center text-rose-600 font-bold text-sm group-hover:translate-x-2 transition">BUKA DATA <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                    <div onclick="app.renderPatientList('rehab')" class="group cursor-pointer bg-white p-8 rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-brand-100 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:scale-110 transition"></div>
                        <i class="fas fa-walking text-5xl text-brand-600 mb-4 group-hover:scale-110 transition duration-300"></i>
                        <h3 class="text-2xl font-black text-slate-800 mb-2">REHABILITASI</h3>
                        <p class="text-sm text-slate-500 font-medium">Lanjutan (14 Hari - 1 Tahun). Visit, Assessment, Terapi.</p>
                        <div class="mt-6 flex items-center text-brand-700 font-bold text-sm group-hover:translate-x-2 transition">BUKA DATA <i class="fas fa-arrow-right ml-2"></i></div>
                    </div>
                </div>
            </div>`;
    },

    renderPatientList(category) {
        this.currentCategory = category; 
        this.activePatientId = null;
        this.saveState('list');
        const title = category === 'detox' ? "UNIT STABILISASI (DETOX)" : "UNIT REHABILITASI";
        const themeColor = category === 'detox' ? 'text-rose-600' : 'text-brand-600';
        document.getElementById('page-title').innerHTML = `<span class="text-slate-400 cursor-pointer hover:underline" onclick="app.renderDashboard()">DASHBOARD</span> / <span class="${themeColor}">${title}</span>`;
        document.getElementById('header-actions').innerHTML = `
            <button onclick="app.renderDashboard()" class="mr-2 bg-slate-200 text-slate-600 w-8 h-8 rounded-full hover:bg-slate-300 flex items-center justify-center"><i class="fas fa-arrow-left"></i></button>
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Pasien..." class="bg-slate-100 rounded-full px-4 py-2 text-xs font-bold w-48 md:w-64 outline-none focus:ring-2 ring-brand-100">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow flex items-center gap-2"><i class="fas fa-plus"></i> PASIEN BARU</button>
        `;
        const filteredPatients = this.data.patients.filter(p => {
            const prog = (p.program?.name || '').toLowerCase();
            if(category === 'detox') return prog.includes('detox');
            else return !prog.includes('detox');
        });
        const container = document.getElementById('main-content');
        if(!filteredPatients.length) {
            container.innerHTML = `<div class="text-center mt-20 text-slate-400"><i class="fas fa-folder-open text-4xl mb-4 opacity-30"></i><p>Belum ada pasien di unit ini.</p></div>`;
            return;
        }
        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in";
        filteredPatients.forEach(p => {
            const card = document.createElement('div');
            let stripeColor = category === 'detox' ? 'bg-rose-500' : 'bg-brand-600';
            let progLabel = p.program?.name || 'Belum Set Program';
            let statusBadge = '';
            if(p.program?.startDate && p.program?.days) {
                const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                progLabel += ` (Hari ${diff}/${p.program.days})`;
                if(category === 'detox' && diff >= 7) {
                    stripeColor = 'bg-emerald-500';
                    statusBadge = `<div class="mt-2 bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded inline-block border border-emerald-200 shadow-sm animate-pulse">✅ SIAP TRANSISI KE REHAB</div>`;
                }
            }
            card.className = "bg-white p-5 rounded-3xl border border-slate-100 card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full ${stripeColor}"></div>
                <div class="flex items-center gap-4 mb-4 pl-4">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm">
                    <div>
                        <h3 class="font-extrabold text-slate-800 text-lg leading-tight">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-semibold">${p.reg.age} Th • ${progLabel}</p>
                        ${statusBadge}
                    </div>
                </div>
                <div class="pl-4 border-t pt-3 flex justify-end gap-2">
                    <button onclick="app.modalPatient('${p.id}')" class="px-3 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-bold"><i class="fas fa-pen"></i></button>
                    <button onclick="app.deletePatient('${p.id}')" class="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold"><i class="fas fa-trash"></i></button>
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
        
        this.saveState('detail', p.id);
        document.getElementById('page-title').innerText = "DETAIL BERKAS PASIEN";
        
        let customActions = '';
        if(this.currentCategory === 'detox' && p.program?.startDate) {
            const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            if(diff >= 7) {
                customActions = `
                    <button onclick="app.modalProgram('${p.id}', true)" class="bg-gradient-to-r from-emerald-500 to-emerald-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:shadow-emerald-200 hover:-translate-y-1 transition flex items-center gap-2 animate-bounce">
                        <i class="fas fa-sync-alt"></i> SINKRONISASI KE REHABILITASI
                    </button>
                    <div class="w-px h-8 bg-slate-300 mx-2"></div>
                `;
            }
        }

        document.getElementById('header-actions').innerHTML = `
            ${customActions}
            <button onclick="app.exportToWord('${p.id}')" class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-blue-700" title="Download Word"><i class="fas fa-file-word"></i></button>
            <button onclick="app.exportToExcel('${p.id}')" class="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-emerald-700" title="Download Excel"><i class="fas fa-file-excel"></i></button>
            <div class="w-px h-8 bg-slate-300 mx-2"></div>
            <button onclick="app.renderPatientList('${this.currentCategory}')" class="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-300 flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        const container = document.getElementById('main-content');
        let tabs = [];
        if (this.currentCategory === 'detox') {
            tabs = [{id: 'biodata', icon: 'fa-id-card', label: 'Biodata'}, {id: 'program', icon: 'fa-list-check', label: 'Program'}, {id: 'medicine', icon: 'fa-pills', label: 'Medicine'}, {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'}, {id: 'screening', icon: 'fa-search', label: 'Screening'}, {id: 'conclusi', icon: 'fa-clipboard-check', label: 'Conclusi'}, {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'}, {id: 'daily', icon: 'fa-calendar-check', label: 'Progres Harian'}];
        } else {
            tabs = [{id: 'biodata', icon: 'fa-id-card', label: 'Biodata'}, {id: 'program', icon: 'fa-list-check', label: 'Program'}, {id: 'assessment', icon: 'fa-file-medical-alt', label: 'Assessment'}, {id: 'plan', icon: 'fa-notes-medical', label: 'Rencana Terapi'}, {id: 'visit', icon: 'fa-user-md', label: 'Visit Dokter'}, {id: 'medicine', icon: 'fa-pills', label: 'Medicine'}, {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'}, {id: 'terminasi', icon: 'fa-flag-checkered', label: 'Terminasi'}, {id: 'counseling', icon: 'fa-comments', label: 'Konseling'}, {id: 'daily', icon: 'fa-calendar-check', label: 'Progres Harian'}, {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'}];
        }

        let programStatus = `<span class="text-slate-400 italic">Belum ada program aktif</span>`;
        if(p.program?.startDate && p.program?.days) {
            const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            const percent = Math.min(100, Math.max(0, (diff/p.program.days)*100));
            programStatus = `
                <div class="mt-2">
                    <p class="text-xs font-bold text-brand-700 mb-1 uppercase tracking-wide"><i class="fas fa-clock mr-1"></i> ${p.program.name} : Hari ke-${diff} / ${p.program.days}</p>
                    <div class="w-full bg-slate-200 rounded-full h-2"><div class="bg-brand-600 h-2 rounded-full" style="width: ${percent}%"></div></div>
                </div>`;
        }

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-6 items-center md:items-start fade-in">
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
            <div class="flex-1 w-full text-center md:text-left">
                <h1 class="text-2xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold mb-1">ID: ${p.id.slice(-6)} • Masuk: ${p.reg.timestamp}</p>
                ${programStatus}
                <div class="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                    <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Dr. ${p.diagnosis.dr_name}</span>
                    ${p.checklist?.urine ? '<span class="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[10px] font-bold">Urine (+)</span>' : ''}
                </div>
            </div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">`;
        tabs.forEach(t => nav += `<button onclick="app.switchTab('${t.id}')" class="tab-btn ${this.activeTab === t.id ? 'active' : ''}"><i class="fas ${t.icon} mr-2"></i> ${t.label}</button>`);
        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        container.innerHTML = nav;
        if(this.activeTab === 'crisis') this.renderChart(p);
    },

    switchTab(tabId) { this.activeTab = tabId; this.saveState('detail', this.activePatientId); this.renderPatientDetail(); },

    getTabContent(p, tab) {
        const searchInput = `<div class="absolute top-6 right-6"><input onkeyup="app.searchTable(this)" placeholder="Cari..." class="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 ring-brand-200"></div>`;
        const v = (val) => val || '-';

        if(tab === 'biodata') {
            const check = p.checklist || {};
            return `
                <h3 class="font-bold text-lg text-brand-800 mb-6 border-b pb-2">Informasi Lengkap Pasien</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400 uppercase">TTL</span><div class="font-bold text-slate-700">${v(p.reg.ttl)}</div></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400 uppercase">Usia</span><div class="font-bold text-slate-700">${v(p.reg.age)} Tahun</div></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400 uppercase">Status</span><div class="font-bold text-slate-700">${v(p.reg.status)}</div></div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400 uppercase">PJ</span><div class="font-bold text-slate-700">${v(p.reg.guardian)}</div></div>
                    <div class="p-4 bg-slate-50 rounded-xl border col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Riwayat</span><div class="text-slate-700 mt-1">${v(p.reg.history)}</div></div>
                    <div class="p-4 bg-slate-50 rounded-xl border col-span-2"><span class="block text-xs font-bold text-slate-400 uppercase">Diagnosa</span><div class="text-slate-700 mt-1">${v(p.diagnosis.plan)}</div></div>
                </div>
                <h4 class="font-bold text-sm text-brand-600 uppercase mb-3">Checklist Medis</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div class="p-3 border rounded-xl ${check.urine?'bg-yellow-50 border-yellow-200':''}"><p class="font-bold text-xs mb-1">Tes Urine</p><p class="text-sm">${check.urine ? '✅ ' + check.urine_note : '❌ Tidak'}</p></div>
                    <div class="p-3 border rounded-xl ${check.fix?'bg-red-50 border-red-200':''}"><p class="font-bold text-xs mb-1">Fiksasi</p><p class="text-sm">${check.fix ? '✅ ' + check.fix_note : '❌ Tidak'}</p></div>
                    <div class="p-3 border rounded-xl ${check.inj?'bg-blue-50 border-blue-200':''}"><p class="font-bold text-xs mb-1">Injeksi</p><p class="text-sm">${check.inj ? '✅ ' + check.inj_note : '❌ Tidak'}</p></div>
                </div>
                <div class="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mb-6"><p class="font-bold text-xs text-brand-600 uppercase mb-2"><i class="fas fa-file-prescription mr-2"></i>RESEP OBAT DOKTER</p><p class="text-slate-700 text-sm whitespace-pre-line">${v(p.diagnosis.prescription)}</p></div>
                <button onclick="app.modalPatient('${p.id}')" class="bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow hover:bg-brand-700">EDIT BIODATA</button>
            `;
        }

        // --- 1. MEDICINE FINAL OVERHAUL (V17.0) ---
        // Dibagi 2 Menu: STOK OBAT & CATATAN PENGGUNAAN
        // Otomatisasi Estimasi Habis + Link Hapus Log ke Stok
        if(tab === 'medicine') {
            const stockHtml = (p.medicine?.stock || []).map((s, i) => {
                const sisa = s.init - s.used;
                const isLow = sisa < 7;
                
                // 3. Otomatisasi Estimasi Habis (Tgl Masuk + (Jumlah / Dosis))
                let estInfo = '<span class="text-[9px] text-slate-400 italic">Set Dosis per Hari</span>';
                if(s.date_in && s.daily_dose && s.daily_dose > 0) {
                    const dateInObj = new Date(s.date_in);
                    const daysToEmpty = Math.floor(s.init / s.daily_dose);
                    dateInObj.setDate(dateInObj.getDate() + daysToEmpty);
                    const estStr = dateInObj.toLocaleDateString('id-ID', {day: 'numeric', month:'short', year:'2-digit'});
                    
                    // Warna merah jika estimasi sudah lewat atau sisa sedikit
                    const isExpired = new Date() > dateInObj;
                    const colorClass = isExpired || isLow ? 'text-red-600 bg-red-50' : 'text-brand-700 bg-brand-50';
                    estInfo = `<span class="text-[10px] ${colorClass} px-2 py-0.5 rounded font-bold">${estStr}</span>`;
                }

                return `
                <tr class="border-b hover:bg-slate-50 text-xs search-row">
                    <td class="p-3">${s.date_in || '-'}</td>
                    <td class="p-3">${estInfo}</td>
                    <td class="p-3 font-bold text-slate-700">${s.name}</td>
                    <td class="p-3 text-center">
                        <span class="text-slate-400 text-[10px] mr-1">Awal: ${s.init}</span>
                        <span class="font-bold text-sm ${isLow ? 'text-red-600' : 'text-emerald-600'}">${sisa}</span>
                    </td>
                    <td class="p-3 text-right flex justify-end gap-1">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-emerald-600 text-white px-2 py-1 rounded hover:bg-emerald-700 shadow-sm text-[10px]" title="Catat Minum"><i class="fas fa-check mr-1"></i> MINUM</button>
                        <button onclick="app.modalStock('${p.id}', ${i})" class="bg-slate-100 text-slate-600 p-1 rounded hover:bg-slate-200"><i class="fas fa-pen"></i></button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="bg-red-50 text-red-500 p-1 rounded hover:bg-red-100"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('') || '<tr><td colspan="5" class="text-center p-6 text-xs text-slate-400 italic">Belum ada stok obat masuk.</td></tr>';

            const logHtml = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b hover:bg-slate-50 text-xs search-row">
                    <td class="p-3 text-slate-500">${l.time}</td>
                    <td class="p-3 font-bold text-brand-700">${l.name}</td>
                    <td class="p-3">${l.pj}</td>
                    <td class="p-3 italic text-slate-600">${l.note || '-'}</td>
                    <td class="p-3 text-right flex justify-end gap-2">
                        <button onclick="app.deleteMedLog('${p.id}', ${i})" class="text-red-500 hover:bg-red-50 p-1 rounded" title="Hapus & Balikin Stok"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') || '<tr><td colspan="5" class="text-center p-6 text-xs text-slate-400 italic">Belum ada catatan penggunaan.</td></tr>';

            return `
                ${searchInput}
                <div class="space-y-8 mt-4">
                    <div class="border rounded-2xl bg-white overflow-hidden shadow-sm">
                        <div class="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 flex justify-between items-center border-b">
                            <h4 class="font-bold text-brand-800 text-sm flex items-center gap-2"><i class="fas fa-boxes"></i> MONITORING STOK OBAT</h4>
                            <button onclick="app.modalStock('${p.id}')" class="bg-brand-600 text-white px-3 py-1.5 rounded-full text-xs font-bold hover:bg-brand-700 shadow-sm"><i class="fas fa-plus"></i> STOK BARU</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b">
                                    <tr><th class="p-3">Tgl Masuk</th><th class="p-3">Estimasi Habis</th><th class="p-3">Nama Obat</th><th class="p-3 text-center">Sisa Stok</th><th class="p-3 text-right">Aksi</th></tr>
                                </thead>
                                <tbody>${stockHtml}</tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="border rounded-2xl bg-white overflow-hidden shadow-sm">
                        <div class="bg-gradient-to-r from-emerald-50 to-emerald-100 px-6 py-4 border-b">
                            <h4 class="font-bold text-emerald-800 text-sm flex items-center gap-2"><i class="fas fa-history"></i> CATATAN PENGGUNAAN (LOG)</h4>
                        </div>
                        <div class="overflow-x-auto max-h-80">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-[10px] text-slate-500 uppercase font-bold border-b sticky top-0">
                                    <tr><th class="p-3">Waktu</th><th class="p-3">Nama Obat</th><th class="p-3">PJ</th><th class="p-3">Catatan</th><th class="p-3 text-right">Hapus</th></tr>
                                </thead>
                                <tbody>${logHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
        }

        return `<div class="text-center p-12 text-slate-300">Konten belum tersedia untuk tab ini.</div>`;
    },

    // ============================================================
    // MODAL & HANDLERS (LOGIC FIX)
    // ============================================================
    
    openModal(title, html) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal-container').classList.remove('hidden');
    },

    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // --- MEDICINE ACTIONS ---
    
    // 1. Modal Stock (Add/Edit)
    modalStock(pId, idx = null) {
        const p = this.data.patients.find(x => x.id === pId);
        const stock = idx !== null ? p.medicine.stock[idx] : { name: '', init: 0, used: 0, date_in: new Date().toISOString().split('T')[0], daily_dose: 0 };
        
        this.openModal('ATUR STOK OBAT', `
            <input type="hidden" id="stock-idx" value="${idx !== null ? idx : ''}">
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Nama Obat</label>
                    <input id="st-name" value="${stock.name}" class="input-modern" placeholder="Contoh: Alprazolam 1mg">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">Jumlah Masuk (Tablet)</label>
                        <input type="number" id="st-init" value="${stock.init}" class="input-modern">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-1">Dosis Harian (Est)</label>
                        <input type="number" id="st-dose" value="${stock.daily_dose || 0}" class="input-modern">
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Tanggal Masuk</label>
                    <input type="date" id="st-date" value="${stock.date_in}" class="input-modern">
                </div>
                <button onclick="app.saveStock('${pId}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 shadow mt-4">SIMPAN STOK</button>
            </div>
        `);
    },

    saveStock(pId) {
        const p = this.data.patients.find(x => x.id === pId);
        const idx = document.getElementById('stock-idx').value;
        const form = {
            name: document.getElementById('st-name').value,
            init: parseInt(document.getElementById('st-init').value) || 0,
            used: idx ? p.medicine.stock[idx].used : 0, // Keep used count if editing
            daily_dose: parseInt(document.getElementById('st-dose').value) || 0,
            date_in: document.getElementById('st-date').value
        };

        if(!form.name) return Swal.fire('Error', 'Nama obat wajib diisi', 'error');

        if(!p.medicine) p.medicine = { stock: [], logs: [] };
        if(!p.medicine.stock) p.medicine.stock = [];

        if(idx !== '') p.medicine.stock[idx] = form;
        else p.medicine.stock.push(form);

        this.saveDB();
        this.closeModal();
        this.renderPatientDetail();
    },

    // 2. Modal Use Med (Minum Obat)
    modalUseMed(pId, stockIdx) {
        const p = this.data.patients.find(x => x.id === pId);
        const stock = p.medicine.stock[stockIdx];
        
        // Cek stok
        if(stock.init - stock.used <= 0) return Swal.fire('Habis', 'Stok obat ini sudah habis!', 'warning');

        this.openModal('CATAT MINUM OBAT', `
            <input type="hidden" id="use-stock-idx" value="${stockIdx}">
            <div class="bg-blue-50 p-4 rounded-xl mb-4 text-center">
                <p class="text-xs text-blue-600 font-bold uppercase">OBAT</p>
                <h3 class="text-xl font-black text-blue-800">${stock.name}</h3>
                <p class="text-xs text-slate-500">Sisa saat ini: <span class="font-bold">${stock.init - stock.used}</span></p>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Waktu Minum</label>
                    <input type="datetime-local" id="use-time" class="input-modern" value="${new Date().toISOString().slice(0,16)}">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">PJ (Perawat/Staff)</label>
                    <input id="use-pj" class="input-modern" placeholder="Nama Staff...">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-500 mb-1">Catatan (Opsional)</label>
                    <input id="use-note" class="input-modern" placeholder="Kondisi pasien...">
                </div>
                <button onclick="app.saveUseMed('${pId}')" class="w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 shadow mt-4">KONFIRMASI MINUM</button>
            </div>
        `);
    },

    saveUseMed(pId) {
        const p = this.data.patients.find(x => x.id === pId);
        const stockIdx = parseInt(document.getElementById('use-stock-idx').value);
        const stock = p.medicine.stock[stockIdx];

        const log = {
            time: document.getElementById('use-time').value.replace('T', ' '),
            name: stock.name,
            pj: document.getElementById('use-pj').value || 'Admin',
            note: document.getElementById('use-note').value,
            stockRef: stockIdx // Link ke stok untuk restore
        };

        // Update Stock
        stock.used = (stock.used || 0) + 1;
        
        // Update Log
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift(log); // Add to top

        this.saveDB();
        this.closeModal();
        this.renderPatientDetail();
        Swal.fire({title: 'Sukses', text: 'Stok dikurangi & Log dicatat', icon: 'success', timer: 1500, showConfirmButton: false});
    },

    // 3. Delete Log & Restore Stock
    deleteMedLog(pId, logIdx) {
        Swal.fire({
            title: 'Hapus Log?',
            text: "Stok obat akan dikembalikan (+1)",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                const p = this.data.patients.find(x => x.id === pId);
                const log = p.medicine.logs[logIdx];
                
                // Restore Stock Logic
                let stockTarget = null;
                if(log.stockRef !== undefined && p.medicine.stock[log.stockRef]) {
                    stockTarget = p.medicine.stock[log.stockRef];
                } else {
                    stockTarget = p.medicine.stock.find(s => s.name === log.name);
                }

                if(stockTarget) {
                    stockTarget.used = Math.max(0, stockTarget.used - 1);
                }

                // Hapus Log
                p.medicine.logs.splice(logIdx, 1);
                
                this.saveDB();
                this.renderPatientDetail();
                Swal.fire('Dihapus!', 'Log dihapus dan stok dikembalikan.', 'success');
            }
        });
    },

    // --- OTHER STANDARD HELPERS ---
    searchDashboard() {
        const q = document.getElementById('dash-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },
    
    searchTable(input) {
        const q = input.value.toLowerCase();
        const tbody = input.closest('#tab-content').querySelector('tbody');
        if(tbody) {
            tbody.querySelectorAll('tr').forEach(tr => {
                tr.style.display = tr.innerText.toLowerCase().includes(q) ? 'table-row' : 'none';
            });
        }
    },

    delSubItem(path, idx) {
        Swal.fire({ title: 'Hapus Item?', icon: 'warning', showCancelButton: true }).then(r => {
            if(r.isConfirmed) {
                const p = this.data.patients.find(x => x.id === this.activePatientId);
                const parts = path.split('.');
                if(parts.length === 2) p[parts[0]][parts[1]].splice(idx, 1);
                this.saveDB();
                this.renderPatientDetail();
            }
        });
    },

    // PLACEHOLDERS FOR OTHER GENERIC FUNCTIONS (Jaga-jaga agar tidak error)
    modalPatient(id=null) { 
        // Implementasi standar modal pasien baru/edit (reconstructed)
        const p = id ? this.data.patients.find(x => x.id === id) : { reg: {}, diagnosis: {}, checklist: {} };
        const isEdit = !!id;
        this.openModal(isEdit ? 'EDIT PASIEN' : 'PASIEN BARU', `
            <div class="space-y-4">
                <input type="hidden" id="pat-id" value="${id || ''}">
                <div><label class="text-xs font-bold text-slate-500">Nama Lengkap</label><input id="pat-name" value="${p.reg.name||''}" class="input-modern"></div>
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs font-bold text-slate-500">Usia</label><input type="number" id="pat-age" value="${p.reg.age||''}" class="input-modern"></div>
                    <div><label class="text-xs font-bold text-slate-500">Program</label>
                    <select id="pat-prog" class="input-modern">
                        <option value="detox" ${p.program?.name?.includes('Detox')?'selected':''}>Detox (7 Hari)</option>
                        <option value="rehab" ${!p.program?.name?.includes('Detox')?'selected':''}>Rehabilitasi</option>
                    </select>
                    </div>
                </div>
                <div><label class="text-xs font-bold text-slate-500">Diagnosa / Plan</label><input id="pat-plan" value="${p.diagnosis.plan||''}" class="input-modern"></div>
                <button onclick="app.savePatient()" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold mt-4">SIMPAN DATA</button>
            </div>
        `);
    },
    
    savePatient() {
        const id = document.getElementById('pat-id').value;
        const name = document.getElementById('pat-name').value;
        if(!name) return Swal.fire('Error','Nama wajib diisi','error');
        
        let p;
        if(id) {
            p = this.data.patients.find(x => x.id === id);
        } else {
            p = { id: Date.now().toString(), reg: { timestamp: new Date().toLocaleDateString() }, diagnosis: {}, program: {}, medicine: {stock:[], logs:[]} };
            this.data.patients.push(p);
        }
        
        p.reg.name = name;
        p.reg.age = document.getElementById('pat-age').value;
        p.diagnosis.plan = document.getElementById('pat-plan').value;
        const progType = document.getElementById('pat-prog').value;
        
        if(!p.program.name) {
            p.program = progType === 'detox' ? { name: 'Program Detox', days: 7, startDate: new Date().toISOString() } : { name: 'Program Rehab', days: 180, startDate: new Date().toISOString() };
        }
        
        this.saveDB();
        this.closeModal();
        this.renderPatientList(this.currentCategory);
    },

    deletePatient(id) {
        Swal.fire({ title: 'Hapus Pasien?', text: 'Data tidak bisa kembali', icon: 'warning', showCancelButton: true }).then(r => {
            if(r.isConfirmed) {
                this.data.patients = this.data.patients.filter(x => x.id !== id);
                this.saveDB();
                this.renderPatientList(this.currentCategory);
            }
        });
    },

    modalProgram(id, sync=false) {
        if(sync) {
            const p = this.data.patients.find(x => x.id === id);
            p.program = { name: 'Program Rehabilitasi Reguler', days: 180, startDate: new Date().toISOString() };
            this.saveDB();
            this.renderPatientDetail();
            Swal.fire('Berhasil', 'Pasien dipindahkan ke Unit Rehab', 'success');
        }
    },
    
    exportToWord(id) { Swal.fire('Info', 'Fitur Export Word sedang diproses', 'info'); },
    exportToExcel(id) { Swal.fire('Info', 'Fitur Export Excel sedang diproses', 'info'); },
    renderChart(p) { /* Chart logic placeholder if needed */ }
};

document.addEventListener('DOMContentLoaded', () => app.init());
