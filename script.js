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
        console.log("MMRC System V17.0 - Ready (Auto Login Enabled)");
        document.getElementById('app-layer').classList.remove('hidden');
        this.isRestoring = true;
        this.loadDB();
    },

    logout() {
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
            const progName = (p.program?.name || '').toLowerCase();
            const isProgramDetox = progName.includes('detox');
            
            let dayRunning = 0;
            if (p.program?.startDate) {
                const start = new Date(p.program.startDate);
                const now = new Date();
                const diffTime = Math.abs(now - start);
                dayRunning = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
            }

            if (category === 'detox') return isProgramDetox && dayRunning <= 7;
            else return !isProgramDetox || (isProgramDetox && dayRunning > 7);
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
            let diff = 0;
            if(p.program?.startDate) {
                 diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            }

            let stripeColor = category === 'detox' ? 'bg-rose-500' : 'bg-brand-600';
            let progLabel = p.program?.name || 'Belum Set Program';
            
            if (category === 'rehab' && (p.program?.name || '').toLowerCase().includes('detox')) {
                stripeColor = 'bg-yellow-500';
                progLabel = `SELESAI DETOX (Hari ke-${diff})`;
            } else {
                if(p.program?.days) progLabel += ` (Hari ${diff}/${p.program.days})`;
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
                    </div>
                </div>
                <div class="pl-4 border-t pt-3 flex justify-end gap-2">
                    <button onclick="app.modalPatient('${p.id}')" class="px-3 py-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-[10px] font-bold"><i class="fas fa-pen"></i></button>
                    <button onclick="app.deletePatient('${p.id}')" class="px-3 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 text-[10px] font-bold"><i class="fas fa-trash"></i></button>
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

        if(tab === 'medicine') {
            const stockHtml = (p.medicine?.stock || []).map((s, i) => {
                const sisa = s.init - s.used;
                const isLow = sisa < 7;
                let estInfo = '<span class="text-[9px] text-slate-400 italic">Set Dosis per Hari</span>';
                if(s.date_in && s.daily_dose && s.daily_dose > 0) {
                    const dateInObj = new Date(s.date_in);
                    const daysToEmpty = Math.floor(s.init / s.daily_dose);
                    dateInObj.setDate(dateInObj.getDate() + daysToEmpty);
                    const estStr = dateInObj.toLocaleDateString('id-ID', {day: 'numeric', month:'short', year:'2-digit'});
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
                        <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-blue-500 hover:bg-blue-50 p-1 rounded"><i class="fas fa-pen"></i></button>
                        <button onclick="app.deleteMedLog('${p.id}', ${i})" class="text-red-500 hover:bg-red-50 p-1 rounded" title="Hapus & Balikin Stok"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('') || '<tr><td colspan="5" class="text-center p-6 text-xs text-slate-400 italic">Belum ada catatan penggunaan.</td></tr>';
            
            return `
                ${searchInput}
                <div class="space-y-8 mt-4">
                    <div class="border rounded-2xl bg-white overflow-hidden shadow-sm">
                        <div class="bg-gradient-to-r from-slate-50 to-white p-4 border-b flex justify-between items-center">
                            <h4 class="font-bold text-brand-800 text-sm flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600"><i class="fas fa-boxes"></i></div> STOK OBAT</h4>
                            <button onclick="app.modalStock('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow hover:bg-brand-700 transition transform hover:-translate-y-0.5"><i class="fas fa-plus mr-1"></i> INPUT OBAT MASUK</button>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th class="p-3">Waktu Masuk</th>
                                        <th class="p-3">Est. Habis (Auto)</th>
                                        <th class="p-3">Jenis Obat</th>
                                        <th class="p-3 text-center">Jumlah (Sisa)</th>
                                        <th class="text-right p-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y">${stockHtml}</tbody>
                            </table>
                        </div>
                    </div>

                    <div class="border rounded-2xl bg-white overflow-hidden shadow-sm">
                        <div class="bg-gradient-to-r from-slate-50 to-white p-4 border-b">
                            <h4 class="font-bold text-brand-800 text-sm flex items-center gap-2"><div class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600"><i class="fas fa-history"></i></div> CATATAN PENGGUNAAN OBAT</h4>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left">
                                <thead class="bg-slate-50 text-[10px] text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th class="p-3">Waktu</th>
                                        <th class="p-3">Nama Obat</th>
                                        <th class="p-3">PJ</th>
                                        <th class="p-3">Catatan</th>
                                        <th class="text-right p-3">Edit/Hapus</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y">${logHtml}</tbody>
                            </table>
                        </div>
                    </div>
                </div>`;
        }

        if(tab === 'ttv') {
            return `${searchInput}<div class="flex justify-between items-center mb-4 mt-2"><h4 class="font-bold text-brand-800">DATA TTV</h4><button onclick="app.modalTTV('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ INPUT</button></div><div class="overflow-x-auto rounded-xl border border-slate-200"><table class="w-full text-xs text-left"><thead class="bg-slate-50"><tr><th class="p-3">Waktu</th><th>TD</th><th>Nadi/RR</th><th>TB/BB</th><th>GDS</th><th class="text-right p-3">Aksi</th></tr></thead><tbody class="divide-y">${(p.ttv||[]).map((t,i)=>`<tr class="hover:bg-slate-50 search-row"><td class="p-3">${t.time}</td><td class="p-3 font-bold">${t.td}</td><td class="p-3">${t.nadi}/${t.rr}</td><td class="p-3">${t.tb}/${t.bb}</td><td class="p-3">${t.gds}</td><td class="p-3 text-right"><button onclick="app.modalTTV('${p.id}',${i})" class="text-blue-500 mr-2"><i class="fas fa-pen"></i></button><button onclick="app.delSubItem('ttv',${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`;
        }

        const signedTabs = ['visit', 'counseling', 'daily', 'assessment', 'plan', 'terminasi'];
        if(signedTabs.includes(tab)) {
            let dataArr, typeLabel, arrName;
            if(tab==='visit') { dataArr=p.visits; typeLabel="VISIT DOKTER"; arrName='visits'; }
            else if(tab==='counseling') { dataArr=p.counseling; typeLabel="KONSELING"; arrName='counseling'; }
            else if(tab==='daily') { dataArr=p.daily_progress; typeLabel="PROGRES HARIAN"; arrName='daily_progress'; }
            else if(tab==='assessment') { dataArr=p.assessment; typeLabel="ASSESSMENT"; arrName='assessment'; }
            else if(tab==='plan') { dataArr=p.plan_therapy; typeLabel="RENCANA TERAPI"; arrName='plan_therapy'; }
            else if(tab==='terminasi') { dataArr=p.termination; typeLabel="TERMINASI"; arrName='termination'; }
            
            return `${searchInput}<div class="flex justify-between items-center mb-6 mt-2"><h4 class="font-bold text-brand-800">${typeLabel}</h4><button onclick="app.modalSign('${p.id}', '${arrName}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ INPUT BARU</button></div><div class="grid grid-cols-1 gap-4">${(dataArr||[]).map((v, i) => `<div class="border rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition bg-slate-50 search-row"><div class="flex-1"><div class="flex justify-between items-start"><h5 class="font-bold text-brand-800 text-sm">${v.time} <span class="text-slate-400 font-normal">| PJ: ${v.pj||'-'}</span></h5><div class="flex gap-2"><button onclick="app.modalSign('${p.id}', '${arrName}', ${i})" class="text-blue-500"><i class="fas fa-pen"></i></button><button onclick="app.delSubItem('${arrName}', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button></div></div><p class="text-xs text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-100">"${v.note}"</p><div class="mt-2 flex items-center justify-between"><span class="text-[9px] text-slate-400 font-bold uppercase">Signature:</span><img src="${v.sign}" class="h-6 opacity-70"></div></div>${v.photo ? `<div class="w-full md:w-32 h-32 flex-shrink-0"><img src="${v.photo}" class="w-full h-full object-cover rounded-xl border cursor-pointer" onclick="Swal.fire({imageUrl: '${v.photo}', showConfirmButton:false})"></div>` : ''}</div>`).join('')}</div>`;
        }

        if(tab === 'screening' || tab === 'conclusi') {
            let dataArr = tab==='screening' ? p.screening : p.conclusi;
            let label = tab==='screening' ? 'SCREENING' : 'CONCLUSI';
            let arrName = tab;
            return `${searchInput}<div class="flex justify-between items-center mb-6 mt-2"><h4 class="font-bold text-brand-800">${label}</h4><button onclick="app.modalSimpleNote('${p.id}', '${arrName}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ INPUT</button></div><div class="space-y-4">${(dataArr||[]).map((v, i) => `<div class="bg-slate-50 p-4 rounded-xl border search-row"><div class="flex justify-between mb-2"><span class="text-xs font-bold text-brand-700">${v.time} | PJ: ${v.pj}</span><button onclick="app.delSubItem('${arrName}',${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button></div><p class="text-sm text-slate-700">${v.note}</p></div>`).join('')}</div>`;
        }

        if(tab === 'crisis') {
            return `<div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-full"><div><div class="flex justify-between items-center mb-4"><h4 class="font-bold text-brand-800">DATA HARIAN (BPSS)</h4><button onclick="app.modalCrisis('${p.id}')" class="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">+ INPUT SKOR</button></div><div class="h-64 border rounded-xl p-2 bg-slate-50"><canvas id="crisisChart"></canvas></div></div><div><h4 class="font-bold text-brand-800 mb-4">LOG SKOR</h4><div class="border rounded-xl bg-white overflow-hidden max-h-80 overflow-y-auto"><table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-2 text-left">Hari</th><th>Detail (B-P-S-Sp)</th><th>Total</th><th class="text-right p-2">Aksi</th></tr></thead><tbody>${(p.crisis?.bpss||[]).map((b,i)=>`<tr class="border-b search-row hover:bg-slate-50"><td class="p-2 text-xs font-bold">Hari-${i+1}</td><td class="p-2 text-xs"><span class="text-blue-600">B:${b.bio}</span> <span class="text-purple-600">P:${b.psy}</span> <span class="text-orange-600">S:${b.soc}</span> <span class="text-green-600">Sp:${b.spi}</span></td><td class="p-2 font-black text-center text-brand-700">${b.total}</td><td class="text-right p-2 flex justify-end gap-2"><button onclick="app.modalCrisis('${p.id}',${i})" class="text-blue-500 hover:text-blue-700"><i class="fas fa-pen"></i></button><button onclick="app.delSubItem('crisis.bpss',${i})" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div></div></div>`;
        }

        if(tab === 'program') {
            const prog = p.program || {};
            let currentInfo = "Belum ada program";
            if(prog.startDate) {
                const diff = Math.floor((new Date() - new Date(prog.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                currentInfo = `Hari ke-${diff} dari ${prog.days} Hari`;
            }
            return `<div class="max-w-2xl mx-auto mt-4"><div class="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 rounded-3xl shadow-xl mb-6 relative overflow-hidden"><p class="text-xs font-bold opacity-70 mb-2 uppercase tracking-widest">Paket Saat Ini</p><h2 class="text-3xl font-black mb-1">${prog.name || 'BELUM DIATUR'}</h2><p class="text-sm font-semibold opacity-90 mb-4">${prog.desc || 'Silakan pilih paket program.'}</p><div class="bg-white/20 backdrop-blur-sm rounded-xl p-4 grid grid-cols-2 gap-4"><div><span class="block text-[10px] opacity-75 uppercase">Tanggal Mulai</span><span class="font-bold text-lg">${prog.startDate ? new Date(prog.startDate).toLocaleDateString('id-ID') : '-'}</span></div><div><span class="block text-[10px] opacity-75 uppercase">Progres</span><span class="font-bold text-lg text-yellow-300">${currentInfo}</span></div></div></div><button onclick="app.modalProgram('${p.id}')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition border border-slate-200 flex items-center justify-center gap-2"><i class="fas fa-cog"></i> ATUR / GANTI PROGRAM</button></div>`;
        }
    },

    // ============================================================
    // MODALS & SAVING LOGIC
    // ============================================================

    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN";
        const v = (val) => val || '';
        const chk = p?.checklist || {};
        this.openModal(`
            <form onsubmit="event.preventDefault(); app.savePatient('${id||''}')" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer relative bg-slate-50 hover:bg-white transition"><input type="file" id="p_photo" class="absolute inset-0 opacity-0 cursor-pointer"><i class="fas fa-camera text-2xl text-slate-400 mb-1"></i><p class="text-xs text-slate-500">Klik untuk upload foto</p></div>
                <input id="p_name" class="input-modern" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" required>
                <div class="grid grid-cols-2 gap-3"><input id="p_ttl" class="input-modern" value="${v(p?.reg.ttl)}" placeholder="Tempat, Tgl Lahir"><input id="p_age" type="number" class="input-modern" value="${v(p?.reg.age)}" placeholder="Usia (Th)"></div>
                <div class="grid grid-cols-2 gap-3"><select id="p_status" class="input-modern"><option value="">- Status Pernikahan -</option><option ${p?.reg.status==='Menikah'?'selected':''}>Menikah</option><option ${p?.reg.status==='Belum Menikah'?'selected':''}>Belum Menikah</option></select><input id="p_job" class="input-modern" value="${v(p?.reg.job)}" placeholder="Pekerjaan"></div>
                <input id="p_guard" class="input-modern" value="${v(p?.reg.guardian)}" placeholder="Penanggung Jawab">
                <textarea id="p_history" class="input-modern h-16" placeholder="Riwayat Penyakit (Terdahulu)">${v(p?.reg.history)}</textarea>
                <textarea id="m_plan" class="input-modern h-20" placeholder="Diagnosa & Plan Saat Ini">${v(p?.diagnosis.plan)}</textarea>
                <input id="m_dr" class="input-modern" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter DPJP">
                <div class="border-t pt-2 mt-2"><p class="text-xs font-bold text-brand-600 mb-2 uppercase">Checklist Medis</p><div class="checklist-item"><input type="checkbox" id="chk_urine" class="chk-box" ${chk.urine?'checked':''}><div class="flex-1"><p class="text-xs font-bold">Urine Test</p></div><input id="note_urine" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.urine_note)}"></div><div class="checklist-item"><input type="checkbox" id="chk_fix" class="chk-box" ${chk.fix?'checked':''}><div class="flex-1"><p class="text-xs font-bold">Fiksasi</p></div><input id="note_fix" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.fix_note)}"></div><div class="checklist-item"><input type="checkbox" id="chk_inj" class="chk-box" ${chk.inj?'checked':''}><div class="flex-1"><p class="text-xs font-bold">Injeksi</p></div><input id="note_inj" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.inj_note)}"></div><textarea id="p_prescription" class="input-modern h-24 mt-3" placeholder="Tulis Resep Obat Dokter di sini...">${v(p?.diagnosis.prescription)}</textarea></div>
                <button class="w-full bg-brand-700 text-white py-3 rounded-xl font-bold shadow-lg mt-4">SIMPAN DATA</button>
            </form>
        `);
    },

    async savePatient(id) {
        const get = (id) => document.getElementById(id).value;
        const pOld = id ? this.data.patients.find(x => x.id === id) : null;
        
        let photo = pOld?.reg.photo || 'https://via.placeholder.com/150';
        const file = document.getElementById('p_photo').files[0];
        if(file) photo = await this.toBase64(file);

        let defaultProgram = pOld?.program || {};
        if (!id && this.currentCategory === 'detox') {
            defaultProgram = { name: 'Stabilisasi (Detox)', days: 7, startDate: new Date().toISOString().split('T')[0], desc: 'Program otomatis 7 hari.' };
        }

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: { name: get('p_name'), age: get('p_age'), ttl: get('p_ttl'), status: get('p_status'), history: get('p_history'), job: get('p_job'), guardian: get('p_guard'), addr: '-', photo, timestamp: pOld?.reg.timestamp || new Date().toLocaleString() },
            diagnosis: { dr_name: get('m_dr'), plan: get('m_plan'), prescription: get('p_prescription') },
            checklist: { urine: document.getElementById('chk_urine').checked, urine_note: get('note_urine'), fix: document.getElementById('chk_fix').checked, fix_note: get('note_fix'), inj: document.getElementById('chk_inj').checked, inj_note: get('note_inj') },
            program: defaultProgram, 
            medicine: pOld?.medicine || {stock:[], logs:[]},
            ttv: pOld?.ttv || [],
            visits: pOld?.visits || [],
            counseling: pOld?.counseling || [],
            daily_progress: pOld?.daily_progress || [],
            screening: pOld?.screening || [],
            conclusi: pOld?.conclusi || [],
            assessment: pOld?.assessment || [],
            plan_therapy: pOld?.plan_therapy || [],
            termination: pOld?.termination || []
        };

        if(id) {
            const idx = this.data.patients.findIndex(x=>x.id===id);
            this.data.patients[idx] = newP;
        } else {
            this.data.patients.push(newP);
        }

        this.closeModal(); this.saveDB(); this.renderPatientList(this.currentCategory);
    },

    modalProgram(id, isSync = false) {
        const p = this.data.patients.find(x => x.id === id);
        const prog = p.program || {};
        
        let options = `<option value="">Pilih Paket...</option>`;
        if(this.currentCategory === 'detox') {
            options += `<option value="Detox 7 Hari|7|Fokus detoksifikasi fisik." ${prog.name==='Detox 7 Hari'?'selected':''}>Detox 7 Hari</option>`;
        } else {
            options += `
                <option value="Recovery 14 Hari|14|Program awal pemulihan." ${prog.name==='Recovery 14 Hari'?'selected':''}>Recovery 14 Hari</option>
                <option value="Primary 1 Bulan|30|Stabilisasi perilaku." ${prog.name==='Primary 1 Bulan'?'selected':''}>Primary 1 Bulan</option>
                <option value="Primary 2 Bulan|60|Pengembangan diri." ${prog.name==='Primary 2 Bulan'?'selected':''}>Primary 2 Bulan</option>
                <option value="Advanced 3 Bulan|90|Pemantapan pemulihan." ${prog.name==='Advanced 3 Bulan'?'selected':''}>Advanced 3 Bulan</option>
                <option value="Re-Entry 6 Bulan|180|Persiapan kembali." ${prog.name==='Re-Entry 6 Bulan'?'selected':''}>Re-Entry 6 Bulan</option>
                <option value="Aftercare 1 Tahun|365|Maintenance jangka panjang." ${prog.name==='Aftercare 1 Tahun'?'selected':''}>Aftercare 1 Tahun</option>
            `;
        }

        if(isSync) {
            options = `
                <option value="Recovery 14 Hari|14|Program awal pemulihan.">Recovery 14 Hari</option>
                <option value="Primary 1 Bulan|30|Stabilisasi perilaku.">Primary 1 Bulan</option>
                <option value="Primary 2 Bulan|60|Pengembangan diri.">Primary 2 Bulan</option>
                <option value="Advanced 3 Bulan|90|Pemantapan pemulihan.">Advanced 3 Bulan</option>
                <option value="Re-Entry 6 Bulan|180|Persiapan kembali.">Re-Entry 6 Bulan</option>
                <option value="Aftercare 1 Tahun|365|Maintenance jangka panjang.">Aftercare 1 Tahun</option>
            `;
        }
        const title = isSync ? "SINKRONISASI KE REHABILITASI" : `PENGATURAN PROGRAM (${this.currentCategory.toUpperCase()})`;
        this.openModal(`
            <h3 class="font-bold mb-4 text-center">${title}</h3>
            <label class="text-xs font-bold text-slate-500">Pilih Paket</label>
            <select id="pr_select" class="input-modern mb-3" onchange="app.updateProgramDesc()">${options}</select>
            <label class="text-xs font-bold text-slate-500">Keterangan</label>
            <input id="pr_desc" class="input-modern mb-3 bg-slate-100" value="${prog.desc||''}" readonly>
            <label class="text-xs font-bold text-slate-500">Tanggal Mulai</label>
            <input id="pr_start" type="date" class="input-modern mb-6" value="${isSync ? new Date().toISOString().split('T')[0] : (prog.startDate||'')}">
            <button onclick="app.saveProgram('${id}')" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN PERUBAHAN</button>
        `);
    },
    updateProgramDesc() {
        const val = document.getElementById('pr_select').value.split('|');
        if(val.length > 1) document.getElementById('pr_desc').value = val[2];
    },
    saveProgram(id) {
        const val = document.getElementById('pr_select').value.split('|');
        const startDate = document.getElementById('pr_start').value;
        if(val.length < 2 || !startDate) return Swal.fire('Error', 'Lengkapi data!', 'error');

        const p = this.data.patients.find(x => x.id === id);
        if(this.currentCategory === 'rehab' || (this.currentCategory==='detox' && !val[0].includes('Detox'))) {
            if(p.program?.name && p.program.name.includes('Detox') && p.program.startDate) {
                const detoxStart = new Date(p.program.startDate);
                const detoxEnd = new Date(detoxStart);
                detoxEnd.setDate(detoxStart.getDate() + 7);
                if(new Date() < detoxEnd) {
                    return Swal.fire({title: 'AKSES DITOLAK', text: `Masa Detox (7 Hari) belum selesai! Pasien baru bisa masuk program Rehabilitasi setelah tanggal ${detoxEnd.toLocaleDateString('id-ID')}.`, icon: 'warning'});
                }
            }
        }
        p.program = { name: val[0], days: parseInt(val[1]), desc: val[2], startDate: startDate };
        this.closeModal(); this.saveDB(); 
        Swal.fire({icon:'success', title:'Program Diperbarui', timer:1000, showConfirmButton:false}).then(() => {
             const isNowDetox = val[0].includes('Detox');
             app.renderPatientList(isNowDetox ? 'detox' : 'rehab');
        });
    },

    modalSign(id, arrName, index = null) {
        const p = this.data.patients.find(x => x.id === id);
        const arr = p[arrName] || [];
        const v = index !== null ? arr[index] : null;

        const html = `
            <h3 class="font-bold mb-4 text-brand-800 uppercase border-b pb-2">${index !== null ? 'Edit' : 'Input'} Laporan</h3>
            <div class="mb-3">
                <label class="block text-xs font-bold text-slate-500 mb-1">Nama Petugas (PJ)</label>
                <input id="v_pj" class="input-modern w-full" placeholder="Nama PJ..." value="${v?.pj || ''}">
            </div>
            <div class="mb-3 p-2 bg-slate-100 rounded border border-slate-300">
                <label class="block text-xs font-bold text-slate-700 mb-2">📸 Upload Foto Kegiatan</label>
                <input id="v_photo" type="file" accept="image/*" class="block w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>
                ${v?.photo ? '<p class="text-[10px] text-green-600 mt-1 font-bold">✅ Foto tersimpan (abaikan jika tidak ingin ganti)</p>' : ''}
            </div>
            <div class="mb-3">
                <label class="block text-xs font-bold text-slate-500 mb-1">Catatan / Laporan</label>
                <textarea id="v_note" class="input-modern w-full h-20" placeholder="Tulis laporan perkembangan...">${v?.note || ''}</textarea>
            </div>
            <div class="mb-4">
                <label class="block text-xs font-bold text-slate-500 mb-1">Tanda Tangan (Wajib)</label>
                <div id="signature-container" style="position: relative; width: 100%; height: 180px; border: 2px dashed #94a3b8; background-color: #f8fafc; border-radius: 12px; touch-action: none;">
                    <canvas id="signature-pad" style="display: block; width: 100%; height: 100%; touch-action: none;"></canvas>
                </div>
                <div class="flex justify-between mt-2 items-center">
                    <span class="text-[10px] text-slate-400">Gunakan jari</span>
                    <button onclick="app.clearSignature()" class="text-xs text-red-500 font-bold hover:underline">Hapus / Ulangi</button>
                </div>
                ${v?.sign ? '<p class="text-[10px] text-green-600 mt-1">✅ Tanda tangan tersimpan</p>' : ''}
            </div>
            <button onclick="app.saveSign('${id}', '${arrName}', ${index})" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow active:scale-95 transition">SIMPAN LAPORAN</button>
        `;
        this.openModal(html);
        setTimeout(() => {
            const canvas = document.getElementById('signature-pad');
            const container = document.getElementById('signature-container');
            if (canvas && container) {
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = container.offsetWidth * ratio;
                canvas.height = container.offsetHeight * ratio;
                const ctx = canvas.getContext("2d");
                ctx.scale(ratio, ratio);
                this.signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgba(255, 255, 255, 0)', penColor: 'rgb(0, 0, 0)', velocityFilterWeight: 0.7 });
            }
        }, 250); 
    },
    
    clearSignature() { if (this.signaturePad) this.signaturePad.clear(); },
    
    async saveSign(id, arrName, index) {
        const pj = document.getElementById('v_pj').value;
        const note = document.getElementById('v_note').value;
        const photoInput = document.getElementById('v_photo');

        if (!pj) return Swal.fire('Gagal', 'Nama PJ wajib diisi!', 'warning');

        const p = this.data.patients.find(x => x.id === id);
        if (!p[arrName]) p[arrName] = [];

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => resolve(reader.result); reader.onerror = error => reject(error);
        });

        let photoData = null;
        if (photoInput && photoInput.files[0]) photoData = await toBase64(photoInput.files[0]);
        else if (index !== null && p[arrName][index].photo) photoData = p[arrName][index].photo;

        let signData = null;
        if (this.signaturePad && !this.signaturePad.isEmpty()) signData = this.signaturePad.toDataURL();
        else if (index !== null && p[arrName][index].sign) signData = p[arrName][index].sign;

        const newData = { time: new Date().toLocaleString('id-ID'), pj: pj, note: note, photo: photoData, sign: signData };

        if (index !== null) p[arrName][index] = newData;
        else p[arrName].unshift(newData);

        this.closeModal(); this.saveDB(); this.renderPatientDetail();
        Swal.fire('Tersimpan', 'Laporan & Tanda tangan berhasil disimpan.', 'success');
    },
    
    modalSimpleNote(id, arrName, index = null) {
        const p = this.data.patients.find(x => x.id === id);
        const arr = p[arrName] || [];
        const v = index !== null ? arr[index] : null;
        this.openModal(`
            <h3 class="font-bold mb-4 text-brand-800 uppercase">${index !== null ? 'Edit' : 'Input'} Data</h3>
            <div class="mb-3"><label class="block text-xs font-bold text-slate-500 mb-1">Nama Petugas (PJ)</label><input id="n_pj" class="input-modern w-full" placeholder="Nama PJ..." value="${v?.pj || ''}"></div>
            <div class="mb-4"><label class="block text-xs font-bold text-slate-500 mb-1">Isi Catatan / Hasil</label><textarea id="n_note" class="input-modern w-full h-40" placeholder="Tulis hasil di sini...">${v?.note || ''}</textarea></div>
            <button onclick="app.saveSimpleNote('${id}', '${arrName}', ${index})" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow hover:bg-brand-700 transition">SIMPAN DATA</button>
        `);
    },

    saveSimpleNote(id, arrName, index) {
        const pj = document.getElementById('n_pj').value;
        const note = document.getElementById('n_note').value;
        if (!pj || !note) return Swal.fire('Gagal', 'PJ dan Catatan wajib diisi!', 'warning');
        const p = this.data.patients.find(x => x.id === id);
        if (!p[arrName]) p[arrName] = [];
        const newData = { time: new Date().toLocaleString('id-ID'), pj: pj, note: note };
        if (index !== null) p[arrName][index] = newData; else p[arrName].unshift(newData);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
        Swal.fire('Berhasil', 'Data berhasil disimpan.', 'success');
    },
  
    modalStock(id, index=null) {
        const p=this.data.patients.find(x=>x.id===id); const s=index!==null?p.medicine.stock[index]:null;
        const today = new Date().toISOString().split('T')[0];
        this.openModal(`
            <h3 class="font-bold mb-3 text-center text-brand-700">INPUT OBAT MASUK</h3>
            <div class="mb-3"><label class="text-[10px] font-bold text-slate-500 uppercase">Jenis / Nama Obat</label><input id="s_name" class="input-modern" value="${s?.name||''}" placeholder="Contoh: Paracetamol"></div>
            <div class="grid grid-cols-2 gap-3 mb-3">
                <div><label class="text-[10px] font-bold text-slate-500 uppercase">Jumlah Masuk</label><input id="s_init" type="number" class="input-modern" value="${s?.init||''}" placeholder="Qty"></div>
                <div><label class="text-[10px] font-bold text-slate-500 uppercase">Tgl Masuk</label><input id="s_date_in" type="date" class="input-modern" value="${s?.date_in || today}"></div>
            </div>
            <div class="bg-blue-50 p-3 rounded-lg border border-blue-200 mb-4">
                <label class="text-[10px] font-bold text-blue-800 uppercase"><i class="fas fa-calculator mr-1"></i> Dosis per Hari (Wajib)</label>
                <p class="text-[9px] text-blue-600 mb-1">Digunakan untuk menghitung otomatis tanggal habis.</p>
                <input id="s_daily" type="number" class="input-modern border-blue-200" value="${s?.daily_dose || ''}" placeholder="Contoh: 3 (3x sehari)">
            </div>
            <button onclick="app.saveStock('${id}',${index})" class="w-full bg-brand-600 text-white py-3 rounded-lg font-bold shadow-lg hover:bg-brand-700">SIMPAN STOK</button>
        `);
    },
    saveStock(id, index) {
        const p=this.data.patients.find(x=>x.id===id); if(!p.medicine) p.medicine={stock:[],logs:[]};
        const prevUsed = index !== null ? p.medicine.stock[index].used : 0;
        const data={ name:document.getElementById('s_name').value, init:Number(document.getElementById('s_init').value), used: prevUsed, date_in: document.getElementById('s_date_in').value, daily_dose: Number(document.getElementById('s_daily').value) };
        if(!data.name || !data.init) return Swal.fire('Error', 'Nama dan Jumlah wajib diisi', 'error');
        if(index!==null) p.medicine.stock[index]=data; else p.medicine.stock.push(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalUseMed(id, index) {
        const p = this.data.patients.find(x => x.id === id);
        const s = p.medicine.stock[index];
        const sisa = parseInt(s.init) - (parseInt(s.used) || 0);

        if (sisa <= 0) return Swal.fire({ icon: 'error', title: 'Stok Habis!', text: `Obat ${s.name} sudah tidak tersedia (0). Harap input stok baru.`, confirmButtonColor: '#ef4444' });

        this.openModal(`
            <div class="text-center mb-6">
                <div class="bg-emerald-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse"><i class="fas fa-pills text-3xl text-emerald-600"></i></div>
                <h3 class="font-black text-xl text-slate-700 uppercase">Konfirmasi Minum</h3><p class="text-sm text-slate-500">Catat pengurangan stok obat harian</p>
            </div>
            <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl mb-5 shadow-sm">
                <h4 class="font-bold text-lg text-emerald-800 text-center mb-1">${s.name}</h4>
                <div class="flex justify-center items-baseline gap-2"><span class="text-xs font-bold text-slate-400 uppercase">Sisa Stok:</span><span class="text-3xl font-black text-emerald-600">${sisa}</span></div>
            </div>
            <form onsubmit="event.preventDefault(); app.saveUseMed('${id}', ${index})">
                <div class="space-y-4">
                    <div><label class="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Nama Petugas (PJ) <span class="text-red-500">*</span></label><input id="u_pj" class="input-modern w-full" placeholder="Ketik nama Anda..." required autocomplete="off"></div>
                    <div><label class="block text-[11px] font-bold text-slate-500 uppercase mb-1 ml-1">Waktu / Catatan (Opsional)</label><input id="u_note" class="input-modern w-full" placeholder="Cth: Pagi / Siang / Malam"></div>
                </div>
                <button type="submit" class="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all transform active:scale-95 mt-6 flex items-center justify-center gap-2"><i class="fas fa-check-circle"></i> KONFIRMASI (KURANGI 1)</button>
            </form>
        `);
        setTimeout(() => { const el = document.getElementById('u_pj'); if(el) el.focus(); }, 100);
    },

    saveUseMed(id, index) {
        const pj = document.getElementById('u_pj').value;
        const note = document.getElementById('u_note').value;
        if(!pj.trim()) return Swal.fire('Gagal', 'Nama Petugas wajib diisi!', 'warning');
        const p = this.data.patients.find(x => x.id === id);
        const s = p.medicine.stock[index];
        if ((parseInt(s.init) - (parseInt(s.used) || 0)) <= 0) return Swal.fire('Error', 'Gagal menyimpan. Stok obat sudah habis!', 'error');

        s.used = (parseInt(s.used) || 0) + 1;
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift({ time: new Date().toLocaleString('id-ID'), name: s.name, pj: pj, note: note || '-' });

        this.closeModal(); this.saveDB(); this.renderPatientDetail();
        Swal.fire({ icon: 'success', title: 'Tercatat!', text: `Stok ${s.name} berkurang 1.`, timer: 1500, showConfirmButton: false, backdrop: `rgba(0,0,0,0.4)` });
    },

    modalEditLog(id, i) {
        const l = this.data.patients.find(x=>x.id===id).medicine.logs[i];
        this.openModal(`
            <h3 class="font-bold text-center mb-4">Edit Log Obat</h3>
            <label class="text-xs font-bold text-slate-500">Nama Obat (Tidak bisa diedit)</label><input class="input-modern mb-2 bg-slate-100" value="${l.name}" readonly>
            <label class="text-xs font-bold text-slate-500">PJ</label><input id="el_pj" class="input-modern mb-2" value="${l.pj}">
            <label class="text-xs font-bold text-slate-500">Waktu</label><input id="el_time" class="input-modern mb-2" value="${l.time}">
            <label class="text-xs font-bold text-slate-500">Catatan</label><textarea id="el_note" class="input-modern mb-4 h-20">${l.note || ''}</textarea>
            <button onclick="app.saveEditLog('${id}',${i})" class="w-full bg-brand-600 text-white py-2 rounded font-bold">UPDATE DATA</button>
        `);
    },
    saveEditLog(id, i) {
        const p=this.data.patients.find(x=>x.id===id); 
        p.medicine.logs[i].pj = document.getElementById('el_pj').value; 
        p.medicine.logs[i].time = document.getElementById('el_time').value;
        p.medicine.logs[i].note = document.getElementById('el_note').value;
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    deleteMedLog(id, i) {
        Swal.fire({ title: 'Hapus Log?', text: "Stok obat akan dikembalikan (+1).", icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus & Kembalikan Stok', cancelButtonText: 'Batal' }).then((result) => {
            if (result.isConfirmed) {
                const p = this.data.patients.find(x => x.id === id);
                const log = p.medicine.logs[i];
                const stockItem = p.medicine.stock.find(s => s.name === log.name);
                if (stockItem && stockItem.used > 0) stockItem.used--; 
                p.medicine.logs.splice(i, 1);
                this.saveDB(); this.renderPatientDetail(); Swal.fire('Terhapus', 'Data dihapus & stok dikembalikan.', 'success');
            }
        });
    },
    
    modalTTV(id, i=null) {
        const t = i!==null ? this.data.patients.find(x=>x.id===id).ttv[i] : null;
        this.openModal(`<div class="grid grid-cols-2 gap-2"><input id="t_td" class="input-modern" placeholder="TD" value="${t?.td||''}"><input id="t_nadi" class="input-modern" placeholder="Nadi" value="${t?.nadi||''}"><input id="t_rr" class="input-modern" placeholder="RR" value="${t?.rr||''}"><input id="t_tb" class="input-modern" placeholder="TB" value="${t?.tb||''}"><input id="t_bb" class="input-modern" placeholder="BB" value="${t?.bb||''}"><input id="t_gds" class="input-modern" placeholder="GDS" value="${t?.gds||''}"><button onclick="app.saveTTV('${id}',${i})" class="col-span-2 bg-brand-600 text-white py-2 rounded">SIMPAN</button></div>`);
    },
    saveTTV(id, i) {
        const p=this.data.patients.find(x=>x.id===id); if(!p.ttv) p.ttv=[];
        const d={time:new Date().toLocaleString(), td:document.getElementById('t_td').value, nadi:document.getElementById('t_nadi').value, rr:document.getElementById('t_rr').value, tb:document.getElementById('t_tb').value, bb:document.getElementById('t_bb').value, gds:document.getElementById('t_gds').value};
        if(i!==null) p.ttv[i]=d; else p.ttv.unshift(d);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },
    modalCrisis(id, i=null) {
        const b = i!==null ? this.data.patients.find(x=>x.id===id).crisis.bpss[i] : null;
        this.openModal(`<h3 class="font-bold text-center mb-2">${i!==null?'EDIT':'INPUT'} BPSS</h3><div class="grid grid-cols-2 gap-2"><input id="c_bio" type="number" class="input-modern" placeholder="Bio" value="${b?.bio||''}"><input id="c_psy" type="number" class="input-modern" placeholder="Psy" value="${b?.psy||''}"><input id="c_soc" type="number" class="input-modern" placeholder="Soc" value="${b?.soc||''}"><input id="c_spi" type="number" class="input-modern" placeholder="Spi" value="${b?.spi||''}"><button onclick="app.saveCrisis('${id}',${i})" class="col-span-2 bg-brand-600 text-white py-2 rounded">SIMPAN</button></div>`);
    },
    saveCrisis(id, i) {
        const p=this.data.patients.find(x=>x.id===id); if(!p.crisis) p.crisis={bpss:[]};
        const bio=+document.getElementById('c_bio').value, psy=+document.getElementById('c_psy').value, soc=+document.getElementById('c_soc').value, spi=+document.getElementById('c_spi').value;
        const d={bio,psy,soc,spi,total:bio+psy+soc+spi};
        if(i!==null) p.crisis.bpss[i]=d; else p.crisis.bpss.push(d);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    renderChart(p) {
        const ctx = document.getElementById('crisisChart'); if(!ctx || !p.crisis?.bpss?.length) return;
        const last = p.crisis.bpss[p.crisis.bpss.length-1];
        if(this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, { type: 'radar', data: { labels: ['Bio','Psy','Soc','Spi'], datasets: [{label:'BPSS', data:[last.bio, last.psy, last.soc, last.spi], backgroundColor:'rgba(225, 29, 72, 0.2)', borderColor:'#e11d48'}] } });
    },
    searchDashboard() { const q=document.getElementById('dash-search').value.toLowerCase(); document.querySelectorAll('.search-item').forEach(e=>e.style.display=e.innerText.toLowerCase().includes(q)?'':'none'); },
    searchTable(i) { const q=i.value.toLowerCase(); document.querySelectorAll('.search-row').forEach(e=>e.style.display=e.innerText.toLowerCase().includes(q)?'':'none'); },
    delSubItem(path, i) {
        const p=this.data.patients.find(x=>x.id===this.activePatientId);
        let t=p; const parts=path.split('.'); for(let k=0; k<parts.length-1; k++) t=t[parts[k]];
        t[parts[parts.length-1]].splice(i,1); this.saveDB(); this.renderPatientDetail();
    },
    openModal(html) { document.getElementById('modal-body').innerHTML=html; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise((r)=>{const reader=new FileReader(); reader.readAsDataURL(f); reader.onload=()=>r(reader.result);}),
    deletePatient(id) { Swal.fire({title:'Hapus?',icon:'warning',showCancelButton:true,confirmButtonColor:'#d33'}).then(r=>{if(r.isConfirmed){this.data.patients=this.data.patients.filter(x=>x.id!==id); this.saveDB(); this.renderPatientList(this.currentCategory);}})},

    // ============================================================
    // FIXED WORD EXPORT (DOCX) 
    // Menyertakan Semua Foto, TTD Digital & Data Menyeluruh
    // ============================================================
    
    base64ToArrayBuffer(base64) {
        if (!base64 || typeof base64 !== 'string' || !base64.includes(',')) return null;
        try {
            const binaryString = window.atob(base64.split(',')[1]); 
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        } catch (e) {
            console.error("Gagal convert gambar:", e);
            return null;
        }
    },

    createImageRun(base64String, width = 100, height = 100) {
        if (typeof docx === 'undefined') return null;
        const buffer = this.base64ToArrayBuffer(base64String);
        if (!buffer) return new docx.TextRun({ text: "-", size: 20 });
        return new docx.ImageRun({ data: buffer, transformation: { width: width, height: height } });
    },

    createTableHeader(texts, widths) {
        const { TableRow, TableCell, Paragraph, WidthType } = docx;
        return new TableRow({
            children: texts.map((text, i) => 
                new TableCell({ 
                    children: [new Paragraph({ text: text, bold: true, size: 22 })], 
                    width: { size: widths[i], type: WidthType.PERCENTAGE },
                    shading: { fill: "E0E0E0" } 
                })
            ),
            tableHeader: true,
        });
    },

    async exportToWord(patientId) {
        if (typeof docx === 'undefined') return alert("ERROR: Library 'docx' belum terpasang di index.html. Cek koneksi internet.");
        if (typeof saveAs === 'undefined') return alert("ERROR: Library 'FileSaver.js' belum terpasang.");

        try {
            const p = this.data.patients.find(x => x.id === patientId);
            if (!p) return alert("Data pasien tidak ditemukan!");

            Swal.fire({ title: 'Sedang Membuat Word...', text: 'Mohon tunggu, sedang memproses semua dokumen, foto, dan tanda tangan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

            const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, HeadingLevel, AlignmentType, ImageRun } = docx;

            // 1. Foto Profil Pasien
            let photoElement = new Paragraph({ text: "" });
            if (p.reg.photo && p.reg.photo.includes('base64')) {
                const photoBuffer = this.base64ToArrayBuffer(p.reg.photo);
                if (photoBuffer) {
                    photoElement = new Paragraph({
                        children: [new ImageRun({ data: photoBuffer, transformation: { width: 150, height: 150 } })],
                        alignment: AlignmentType.CENTER, spacing: { after: 200 }
                    });
                }
            }

            // 2. Header
            const title = new Paragraph({ text: `REKAM MEDIS: ${p.reg.name.toUpperCase()}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER, spacing: { after: 100 } });
            const subTitle = new Paragraph({ children: [new TextRun({ text: `ID: ${p.id} | Usia: ${p.reg.age} Th | TTL: ${p.reg.ttl}`, bold: true })], alignment: AlignmentType.CENTER, spacing: { after: 400 } });

            // 3. Biodata Lengkap Menyeluruh
            const biodataSection = new Paragraph({
                children: [
                    new TextRun({ text: "BIODATA & MEDIS\n", bold: true, size: 24 }),
                    new TextRun({ text: `Status Pernikahan: ${p.reg.status || '-'}\n` }),
                    new TextRun({ text: `Pekerjaan: ${p.reg.job || '-'}\n` }),
                    new TextRun({ text: `Penanggung Jawab: ${p.reg.guardian || '-'}\n` }),
                    new TextRun({ text: `Riwayat Penyakit: ${p.reg.history || '-'}\n\n` }),
                    new TextRun({ text: `Dokter DPJP: ${p.diagnosis?.dr_name || '-'}\n` }),
                    new TextRun({ text: `Diagnosa / Plan: ${p.diagnosis?.plan || '-'}\n` }),
                    new TextRun({ text: `Resep Obat: ${p.diagnosis?.prescription || '-'}\n\n` }),
                    new TextRun({ text: `Program Aktif: ${p.program?.name || 'Belum Diatur'} (Mulai: ${p.program?.startDate || '-'})` })
                ],
                spacing: { after: 400 }
            });

            // 4. Grafik BPSS (Ditarik Dari Canvas Secara Realtime)
            let chartElement = null;
            try {
                const canvas = document.getElementById('crisisChart');
                if (canvas) {
                    const chartDataUrl = canvas.toDataURL("image/png");
                    const chartBuffer = this.base64ToArrayBuffer(chartDataUrl);
                    if (chartBuffer) {
                        chartElement = new Paragraph({
                            children: [new ImageRun({ data: chartBuffer, transformation: { width: 500, height: 250 } })],
                            alignment: AlignmentType.CENTER, spacing: { after: 300 }
                        });
                    }
                }
            } catch (err) {}
            if (!chartElement) chartElement = new Paragraph({ text: "[Grafik BPSS tidak tersedia]", alignment: AlignmentType.CENTER, spacing: { after: 300 } });

            // 5. Tabel BPSS Krisis
            let bpssTable = new Paragraph({ text: "Belum ada data BPSS" });
            const bpssData = p.crisis?.bpss || [];
            if (bpssData.length > 0) {
                const headerRow = this.createTableHeader(["HARI", "BIO", "PSY", "SOC", "SPI", "TOTAL"], [20, 16, 16, 16, 16, 16]);
                const dataRows = bpssData.map((d, i) => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(`Hari ${i + 1}`)] }),
                        new TableCell({ children: [new Paragraph(String(d.bio||0))] }),
                        new TableCell({ children: [new Paragraph(String(d.psy||0))] }),
                        new TableCell({ children: [new Paragraph(String(d.soc||0))] }),
                        new TableCell({ children: [new Paragraph(String(d.spi||0))] }),
                        new TableCell({ children: [new Paragraph({ text: String(d.total||0), bold: true })] }),
                    ],
                }));
                bpssTable = new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } });
            }

            // Helper Untuk Tabel Data Yang Memiliki Foto dan TTD Digital
            const createLogTable = (titleText, dataArray) => {
                if (!dataArray || dataArray.length === 0) return [];
                const headerRow = this.createTableHeader(["WAKTU", "PJ", "CATATAN", "FOTO", "TTD"], [15, 15, 40, 15, 15]);
                
                const rows = dataArray.map(item => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(item.time || "-")] }),
                        new TableCell({ children: [new Paragraph(item.pj || "-")] }),
                        new TableCell({ children: [new Paragraph(item.note || "-")] }),
                        new TableCell({ children: [new Paragraph({ children: [this.createImageRun(item.photo, 80, 80)] })], verticalAlign: "center" }),
                        new TableCell({ children: [new Paragraph({ children: [this.createImageRun(item.sign, 60, 40)] })], verticalAlign: "center" }),
                    ],
                }));

                return [
                    new Paragraph({ text: `\n${titleText}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } }),
                    new Table({ rows: [headerRow, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } })
                ];
            };

            // Helper Tabel Pencatatan Sederhana
            const createSimpleLogTable = (titleText, dataArray) => {
                if (!dataArray || dataArray.length === 0) return [];
                const headerRow = this.createTableHeader(["WAKTU", "PJ", "CATATAN"], [20, 20, 60]);
                const rows = dataArray.map(item => new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(item.time || "-")] }),
                        new TableCell({ children: [new Paragraph(item.pj || "-")] }),
                        new TableCell({ children: [new Paragraph(item.note || "-")] })
                    ],
                }));
                return [
                    new Paragraph({ text: `\n${titleText}`, heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 100 } }),
                    new Table({ rows: [headerRow, ...rows], width: { size: 100, type: WidthType.PERCENTAGE } })
                ];
            };

            // Menggabungkan Semua Section Ke Dalam Dokumen
            const children = [
                photoElement, title, subTitle, biodataSection,
                new Paragraph({ text: "MONITORING KRISIS (BPSS)", heading: HeadingLevel.HEADING_2, spacing: { after: 100 } }),
                chartElement, bpssTable,
                ...createSimpleLogTable("SCREENING", p.screening),
                ...createLogTable("ASSESSMENT AWAL", p.assessment),
                ...createLogTable("RENCANA TERAPI", p.plan_therapy),
                ...createLogTable("VISIT DOKTER", p.visits),
                ...createLogTable("KONSELING", p.counseling),
                ...createLogTable("PROGRES HARIAN", p.daily_progress),
                ...createSimpleLogTable("KESIMPULAN", p.conclusi),
                ...createLogTable("TERMINASI", p.termination)
            ];

            const doc = new Document({ sections: [{ children: children }] });
            const blob = await Packer.toBlob(doc);
            
            saveAs(blob, `RM_${p.reg.name.replace(/\s+/g, '_')}.docx`);
            Swal.fire('Berhasil', 'File Word Terunduh dengan lengkap!', 'success');

        } catch (error) {
            console.error(error);
            Swal.fire('Gagal', 'Error: ' + error.message, 'error');
        }
    },
                          
    exportToExcel(id) {
        try {
            const p = this.data.patients.find(x=>x.id===id);
            if (!p) throw new Error("Pasien tidak ditemukan");
            const wb = XLSX.utils.book_new();
            const bio = [{ Nama: p.reg.name, TTL: p.reg.ttl, Usia: p.reg.age, PJ: p.reg.guardian, Program: p.program?.name, StartDate: p.program?.startDate, Diagnosa: p.diagnosis.plan, Resep: p.diagnosis.prescription }];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata_Program");
            const meds = (p.medicine?.logs||[]).map(l=>({Waktu:l.time, Obat:l.name, PJ:l.pj, Catatan:l.note||'-'}));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meds), "Medicine");
            const ttv = (p.ttv||[]).map(t=>({Waktu:t.time, TD:t.td, Nadi:t.nadi, RR:t.rr, TB:t.tb, BB:t.bb, GDS:t.gds}));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ttv), "TTV_GDS");
            const crisis = (p.crisis?.bpss||[]).map((b,i)=>({Hari:i+1, Bio:b.bio, Psy:b.psy, Soc:b.soc, Spi:b.spi, Total:b.total}));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crisis), "Crisis_BPSS");
            const mapLog = (arr) => (arr||[]).map(x=>({Waktu:x.time, PJ:x.pj, Catatan:x.note, AdaFoto:x.photo?'Ya':'Tidak', AdaTTD:x.sign?'Ya':'Tidak'}));
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.assessment)), "Assessment");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.plan_therapy)), "Rencana_Terapi");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.visits)), "Visit_Dokter");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.counseling)), "Konseling");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.daily_progress)), "Progres_Harian");
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.termination)), "Terminasi");
            XLSX.writeFile(wb, `Laporan_Lengkap_${p.reg.name}.xlsx`);
        } catch (err) { Swal.fire("Error Export", "Gagal membuat Excel.", "error"); }
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app = app; app.init(); });

// ============================================================
// LOGIK ASISTEN AI & EKSPOR WORD (TAMBAHAN SESUAI ARAHAN)
// ============================================================

function toggleAIChat() {
    const chatWindow = document.getElementById('ai-chat-window');
    chatWindow.classList.toggle('hidden');
    if(!chatWindow.classList.contains('hidden')) {
        document.getElementById('ai-chat-input').focus();
    }
}

function appendAIMessage(sender, text, isButtons = false) {
    const container = document.getElementById('ai-chat-messages');
    const msgDiv = document.createElement('div');
    msgDiv.className = sender === 'user' ? 'flex gap-2 max-w-[85%] ml-auto justify-end' : 'flex gap-2 max-w-[85%]';
    
    if (sender === 'user') {
        msgDiv.innerHTML = `
            <div class="bg-brand-700 text-white p-2.5 rounded-xl rounded-tr-none shadow-sm text-slate-700">
                ${text}
            </div>
        `;
    } else {
        msgDiv.innerHTML = `
            <div class="w-6 h-6 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
                <i class="fa-solid fa-robot text-[10px]"></i>
            </div>
            <div class="bg-white p-2.5 rounded-xl rounded-tl-none shadow-sm border border-slate-100 text-slate-700">
                ${text}
            </div>
        `;
    }
    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
}

function sendAIMessage() {
    const input = document.getElementById('ai-chat-input');
    const text = input.value.trim();
    if (!text) return;

    appendAIMessage('user', text);
    input.value = '';

    setTimeout(() => {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('siapkan') || lowerText.includes('rm') || lowerText.includes('rekam medis') || lowerText.includes('unduh')) {
            appendAIMessage('ai', 'Baik, instruksi diterima. Saya sedang membaca database MMRC, mengotomatisasi penyusunan berkas berkas klinis lengkap klien, memproses grafik, tanda tangan, serta foto secara real-time...');
            setTimeout(() => {
                triggerAIAutomation();
            }, 1000);
        } else {
            appendAIMessage('ai', 'Perintah kurang spesifik. Hubungi saya untuk otomatisasi berkas dengan mengetik: <b>"Siapkan berkas rekam medis klien"</b>.');
        }
    }, 800);
}

function triggerAIAutomation() {
    // Memastikan ada pasien yang sedang dipilih secara aktif di aplikasi
    if (!app.activePatientId) {
        Swal.fire('Gagal', 'Silakan pilih pasien terlebih dahulu di dashboard utama MMRC Anda.', 'warning');
        appendAIMessage('ai', '<span class="text-rose-600 font-bold">Gagal otomatisasi:</span> Tidak ada pasien aktif yang dipilih di dashboard.');
        return;
    }

    const patient = app.data.patients.find(p => p.id === app.activePatientId);
    if (!patient) {
        Swal.fire('Gagal', 'Data pasien tidak ditemukan.', 'error');
        return;
    }

    appendAIMessage('ai', `Memulai pembuatan dokumen Word premium untuk pasien: <b>${patient.biodata?.nama || patient.reg?.name || 'Tanpa Nama'}</b>.`);
    exportToWordPremium(patient);
}

function exportToWordPremium(p) {
    // 1. Ambil Chart dari canvas Chart.js yang sedang aktif di UI menjadi Base64 Gambar
    let chartBase64 = "";
    if (app.chartInstance && document.getElementById('crisisChart')) {
        try {
            chartBase64 = document.getElementById('crisisChart').toDataURL("image/png");
        } catch (e) { console.log(e); }
    }

    // 2. Format Konten HTML Khusus yang kompatibel dengan Rendering Microsoft Word
    let docHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
        <title>Rekam Medis MMRC</title>
        <style>
            body { font-family: 'Arial', sans-serif; color: #1e293b; line-height: 1.5; }
            .header-table { width: 100%; border-bottom: 3px double #be123c; padding-bottom: 10px; margin-bottom: 20px; }
            .title { font-size: 20pt; font-weight: bold; color: #be123c; text-align: center; margin: 0; text-transform: uppercase; }
            .subtitle { font-size: 10pt; text-align: center; color: #64748b; margin: 5px 0 0 0; }
            h2 { font-size: 14pt; color: #9f1239; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-top: 25px; text-transform: uppercase; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 8px; font-size: 10pt; text-align: left; }
            table.data-table th { background-color: #ffe4e6; color: #881337; font-weight: bold; }
            .patient-img { width: 120px; height: 150px; border: 1px solid #cbd5e1; object-fit: cover; }
            .chart-img { width: 100%; max-width: 600px; margin-top: 15px; border: 1px solid #e2e8f0; padding: 5px; }
            .sig-img { width: 150px; height: 80px; object-fit: contain; border-bottom: 1px solid #94a3b8; }
            .footer-sign { width: 100%; margin-top: 40px; }
            .footer-sign td { font-size: 10pt; text-align: center; vertical-align: bottom; width: 50%; }
        </style>
    </head>
    <body>

        <table class="header-table">
            <tr>
                <td>
                    <div class="title">MMRC INTEGRATED SYSTEM</div>
                    <div class="subtitle">Rekam Medis Otomatisasi AI & Manajemen Transparan Klinis</div>
                </td>
            </tr>
        </table>

        <h2>A. DATA BIODATA PASIEN</h2>
        <table class="data-table">
            <tr>
                <td style="width: 25%; font-weight: bold;">Nama Lengkap</td>
                <td style="width: 50%;">${p.reg?.name || '-'}</td>
                <td rowspan="4" style="width: 25%; text-align: center; vertical-align: middle;">
                    ${p.reg?.photo ? `<img class="patient-img" src="${p.reg.photo}" />` : '<div style="font-size: 8pt; color:#94a3b8;">[ Tidak ada foto ]</div>'}
                </td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Usia / Tempat Tgl Lahir</td>
                <td>${p.reg?.age || '-'} Thn / ${p.reg?.ttl || '-'}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Status / Pekerjaan</td>
                <td>${p.reg?.status || '-'} / ${p.reg?.job || '-'}</td>
            </tr>
            <tr>
                <td style="font-weight: bold;">Penanggung Jawab</td>
                <td>${p.reg?.guardian || '-'}</td>
            </tr>
        </table>

        <h2>B. MONITORING TTV & GDS</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th>Waktu</th>
                    <th>TD (mmHg)</th>
                    <th>Nadi (x/m)</th>
                    <th>RR (x/m)</th>
                    <th>TB/BB</th>
                    <th>GDS (mg/dL)</th>
                </tr>
            </thead>
            <tbody>
                ${(p.ttv || []).map(t => `
                    <tr>
                        <td>${t.time || '-'}</td>
                        <td>${t.td || '-'}</td>
                        <td>${t.nadi || '-'}</td>
                        <td>${t.rr || '-'}</td>
                        <td>${t.tb || '-'}/${t.bb || '-'}</td>
                        <td>${t.gds || '-'}</td>
                    </tr>
                `).join('')}
                ${(p.ttv || []).length === 0 ? '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Belum ada log TTV</td></tr>' : ''}
            </tbody>
        </table>

        ${chartBase64 ? `
            <div style="page-break-inside: avoid; text-align: center;">
                <p style="font-size: 9pt; font-weight: bold; color: #64748b; margin-top:10px;">Grafik Trend Monitoring BPSS Klien</p>
                <img class="chart-img" src="${chartBase64}" />
            </div>
        ` : ''}

        <div style="page-break-before: always;"></div>

        <h2>C. DIAGNOSIS KRISIS (BPSS)</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 10%;">Hari</th>
                    <th>Biologis (Bio)</th>
                    <th>Psikologis (Psy)</th>
                    <th>Sosial (Soc)</th>
                    <th>Spiritual (Spi)</th>
                    <th style="width: 15%;">Total Skor</th>
                </tr>
            </thead>
            <tbody>
                ${(p.crisis?.bpss || []).map((b, i) => `
                    <tr>
                        <td style="text-align: center;">${i + 1}</td>
                        <td>${b.bio || '-'}</td>
                        <td>${b.psy || '-'}</td>
                        <td>${b.soc || '-'}</td>
                        <td>${b.spi || '-'}</td>
                        <td style="font-weight: bold; text-align: center;">${b.total || '-'}</td>
                    </tr>
                `).join('')}
                ${(p.crisis?.bpss || []).length === 0 ? '<tr><td colspan="6" style="text-align:center; color:#94a3b8;">Belum ada log Evaluasi Krisis</td></tr>' : ''}
            </tbody>
        </table>

        <h2>D. CATATAN ASSESSMENT AWAL</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Waktu</th>
                    <th style="width: 20%;">Penanggung Jawab</th>
                    <th>Catatan Klinis / Evaluasi Mandiri</th>
                </tr>
            </thead>
            <tbody>
                ${(p.assessment || []).map(x => `
                    <tr>
                        <td>${x.time || '-'}</td>
                        <td><b>${x.pj || '-'}</b></td>
                        <td>${x.note || '-'}</td>
                    </tr>
                `).join('')}
                ${(p.assessment || []).length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Belum ada berkas assessment resmi</td></tr>' : ''}
            </tbody>
        </table>

        <h2>E. LAPORAN PROGRES HARIAN</h2>
        <table class="data-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Waktu</th>
                    <th style="width: 20%;">Penanggung Jawab</th>
                    <th>Catatan Progres</th>
                </tr>
            </thead>
            <tbody>
                ${(p.daily_progress || []).map(x => `
                    <tr>
                        <td>${x.time || '-'}</td>
                        <td><b>${x.pj || '-'}</b></td>
                        <td>${x.note || '-'}</td>
                    </tr>
                `).join('')}
                ${(p.daily_progress || []).length === 0 ? '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">Belum ada berkas laporan harian</td></tr>' : ''}
            </tbody>
        </table>

        <table class="footer-sign">
            <tr>
                <td>
                    <p>Petugas Penanggung Jawab,</p>
                    <br><br>
                    <div style="height: 80px; border-bottom: 1px dashed #cbd5e1; width: 150px; margin: 0 auto;"></div>
                    <p style="font-weight: bold; margin-top: 5px;">( _______________________ )</p>
                </td>
                <td>
                    <p>Tanda Tangan Digital Klien Valid,</p>
                    <br>
                    <div style="text-align: center;">
                        ${p.visits && p.visits[0]?.sign ? `<img class="sig-img" src="${p.visits[0].sign}" />` : p.assessment && p.assessment[0]?.sign ? `<img class="sig-img" src="${p.assessment[0].sign}" />` : '<div style="height: 80px; border-bottom: 1px dashed #cbd5e1; width: 150px; margin: 0 auto;"></div>'}
                    </div>
                    <p style="font-weight: bold; margin-top: 5px;">( ${p.reg?.name || 'Nama Klien'} )</p>
                </td>
            </tr>
        </table>

    </body>
    </html>`;

    // 3. Konversi Dokumen HTML Menjadi File Microsoft Word Blob (.doc)
    const converted = htmlToDocBlob(docHtml);
    const url = URL.createObjectURL(converted);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RM_Lengkap_${p.reg?.name || 'Pasien'}_MMRC.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    appendAIMessage('ai', `<span class="text-emerald-600 font-bold">✓ Sukses Ekspor:</span> Dokumen Word Rekam Medis untuk <b>${p.reg?.name}</b> berhasil di-download dengan layout yang rapi beserta foto, grafik, dan tanda tangan digital.`);
}

function htmlToDocBlob(htmlContent) {
    const blob = new Blob(['\ufeff' + htmlContent], {
        type: 'application/msword'
    });
    return blob;
}
