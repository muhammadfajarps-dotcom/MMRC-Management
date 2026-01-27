// ============================================================
// CONFIGURATION
// ============================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

if (typeof firebase !== 'undefined' && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

const app = {
    data: { patients: [] },
    activePatientId: null,
    activeTab: 'biodata',
    currentCategory: 'rehab', // 'detox' or 'rehab'
    signaturePad: null,
    chartInstance: null,

    init() {
        console.log("MMRC System V13.0 - Optimized Menu & Export");
    },

    saveDB() {
        try {
            localStorage.setItem('MMRC_DATA_V13', JSON.stringify(this.data));
            if(db) db.ref('mmrc_data').set(this.data);
        } catch(e) { console.error("Save failed", e); }
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_V13');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];

        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                if(snap.val() && document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = snap.val();
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATA_V13', JSON.stringify(this.data));
                    if(this.activePatientId) this.renderPatientDetail();
                    else this.renderDashboard();
                }
            });
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.renderDashboard();
        } else Swal.fire('Error', 'Login Gagal', 'error');
    },

    // ============================================================
    // 1. DASHBOARD UTAMA
    // ============================================================
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = '';

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
            </div>
        `;
    },

    // ============================================================
    // 2. PATIENT LIST
    // ============================================================
    renderPatientList(category) {
        this.currentCategory = category; 
        this.activePatientId = null;
        
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

    // ============================================================
    // 3. PATIENT DETAIL (REORDERED TABS & FEATURES)
    // ============================================================
    renderPatientDetail() {
        const p = this.data.patients.find(x => x.id === this.activePatientId);
        if(!p) return this.renderPatientList(this.currentCategory);

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
        
        // --- 1. REORDERED TABS AS REQUESTED ---
        let tabs = [];
        if (this.currentCategory === 'detox') {
            tabs = [
                {id: 'biodata', icon: 'fa-id-card', label: 'Biodata'},
                {id: 'program', icon: 'fa-list-check', label: 'Program'},
                {id: 'medicine', icon: 'fa-pills', label: 'Medicine'},
                {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'},
                {id: 'screening', icon: 'fa-search', label: 'Screening'}, 
                {id: 'conclusi', icon: 'fa-clipboard-check', label: 'Conclusi'}, 
                {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'},
                {id: 'daily', icon: 'fa-calendar-check', label: 'Progres Harian'}
            ];
        } else {
            // URUTAN SESUAI PERMINTAAN:
            // Biodata -> Program -> Assessment -> Rencana Terapi -> Visit Dokter -> Medicine -> TTV -> Terminasi
            tabs = [
                {id: 'biodata', icon: 'fa-id-card', label: 'Biodata'},
                {id: 'program', icon: 'fa-list-check', label: 'Program'},
                {id: 'assessment', icon: 'fa-file-medical-alt', label: 'Assessment'}, 
                {id: 'plan', icon: 'fa-notes-medical', label: 'Rencana Terapi'}, 
                {id: 'visit', icon: 'fa-user-md', label: 'Visit Dokter'},
                {id: 'medicine', icon: 'fa-pills', label: 'Medicine'},
                {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'},
                {id: 'terminasi', icon: 'fa-flag-checkered', label: 'Terminasi'}, 
                // Sisa menu
                {id: 'counseling', icon: 'fa-comments', label: 'Konseling'},
                {id: 'daily', icon: 'fa-calendar-check', label: 'Progres Harian'},
                {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'}
            ];
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

    switchTab(tabId) { this.activeTab = tabId; this.renderPatientDetail(); },

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
                return `<div class="p-3 rounded-xl border ${isLow ? 'stock-low' : 'bg-slate-50 border-slate-200'} relative search-row mb-3 flex justify-between items-center transition-all">
                    ${isLow ? '<div class="stock-badge">STOK < 7</div>' : ''}
                    <div><p class="font-bold text-sm ${isLow ? 'text-red-700' : 'text-slate-800'}">${s.name}</p><p class="text-[10px] text-slate-500">Sisa: <b class="text-lg">${sisa}</b> / ${s.init}</p></div>
                    <div class="flex gap-1">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:text-white flex items-center justify-center"><i class="fas fa-check"></i></button>
                        <button onclick="app.modalStock('${p.id}', ${i})" class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 flex items-center justify-center"><i class="fas fa-pen"></i></button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center"><i class="fas fa-trash"></i></button>
                    </div></div>`;
            }).join('') || '<p class="text-center text-xs text-slate-400">Kosong</p>';
            const logHtml = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b hover:bg-slate-50 text-xs"><td class="py-2 pl-2 text-slate-500">${l.time}</td><td class="py-2 font-bold">${l.name}</td><td class="py-2">${l.pj}</td><td class="text-right pr-2 flex justify-end gap-2"><button onclick="app.modalEditLog('${p.id}', ${i})" class="text-blue-400"><i class="fas fa-pen"></i></button><button onclick="app.deleteMedLog('${p.id}', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>`).join('');
            return `${searchInput}<div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4"><div class="lg:col-span-1 border-r pr-4"><div class="flex justify-between items-center mb-4"><h4 class="font-bold text-brand-800">STOK OBAT</h4><button onclick="app.modalStock('${p.id}')" class="text-[10px] bg-brand-600 text-white px-2 py-1 rounded font-bold">+ STOK</button></div><div class="max-h-[500px] overflow-y-auto pr-1">${stockHtml}</div></div><div class="lg:col-span-2"><h4 class="font-bold text-brand-800 mb-4">LOG MINUM OBAT</h4><div class="bg-white border rounded-xl overflow-hidden"><table class="w-full text-left"><thead class="bg-slate-50 text-[10px]"><tr><th class="p-2">Waktu</th><th>Obat</th><th>PJ</th><th class="text-right p-2">Aksi</th></tr></thead><tbody>${logHtml}</tbody></table></div></div></div>`;
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
            // --- UPDATED CRISIS VIEW WITH EDIT BUTTON ---
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

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: { name: get('p_name'), age: get('p_age'), ttl: get('p_ttl'), status: get('p_status'), history: get('p_history'), job: get('p_job'), guardian: get('p_guard'), addr: pOld?.reg.addr||'-', photo, timestamp: pOld?.reg.timestamp || new Date().toLocaleString() },
            diagnosis: { dr_name: get('m_dr'), plan: get('m_plan'), prescription: get('p_prescription') },
            checklist: { urine: document.getElementById('chk_urine').checked, urine_note: get('note_urine'), fix: document.getElementById('chk_fix').checked, fix_note: get('note_fix'), inj: document.getElementById('chk_inj').checked, inj_note: get('note_inj') },
            medicine: pOld?.medicine || {stock:[], logs:[]},
            ttv: pOld?.ttv || [],
            visits: pOld?.visits || [],
            crisis: pOld?.crisis || { bpss: [] },
            program: pOld?.program || {},
            counseling: pOld?.counseling || [],
            daily_progress: pOld?.daily_progress || [],
            screening: pOld?.screening || [], 
            conclusi: pOld?.conclusi || [], 
            assessment: pOld?.assessment || [], 
            plan_therapy: pOld?.plan_therapy || [], 
            termination: pOld?.termination || [] 
        };
        
        if(id) this.data.patients[this.data.patients.findIndex(x=>x.id===id)] = newP;
        else this.data.patients.push(newP);
        
        this.closeModal(); this.saveDB();
        if(!id) this.renderPatientList(this.currentCategory); else this.renderPatientDetail();
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
                    return Swal.fire({
                        title: 'AKSES DITOLAK',
                        text: `Masa Detox (7 Hari) belum selesai! Pasien baru bisa masuk program Rehabilitasi setelah tanggal ${detoxEnd.toLocaleDateString('id-ID')}.`,
                        icon: 'warning'
                    });
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

    // 3. GENERIC MODALS
    modalSign(id, arrName, index = null) {
        const p = this.data.patients.find(x=>x.id===id);
        const arr = p[arrName] || [];
        const v = index !== null ? arr[index] : null;
        
        this.openModal(`
            <h3 class="font-bold mb-4 uppercase">${index!==null?'Edit':'Input'} Data</h3>
            <input id="v_pj" class="input-modern mb-2" placeholder="Nama PJ (Wajib)" value="${v?.pj||''}">
            <textarea id="v_note" class="input-modern h-24 mb-2" placeholder="Catatan...">${v?.note||''}</textarea>
            ${v?.photo ? '<p class="text-xs text-green-600 text-center">Foto tersimpan</p>' : ''}
            <input type="file" id="v_photo" class="text-xs mb-2">
            <div class="bg-slate-50 border p-2 rounded-xl mb-2"><canvas id="sig-pad" class="bg-white border w-full h-32 rounded"></canvas><button onclick="app.signaturePad.clear()" class="text-xs text-red-500 mt-1">Hapus TTD</button></div>
            <button onclick="app.saveSign('${id}', '${arrName}', ${index})" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
        `);
        setTimeout(()=>{const c=document.getElementById('sig-pad'); c.width=c.parentElement.clientWidth-16; c.height=128; this.signaturePad=new SignaturePad(c);},300);
    },
    async saveSign(id, arrName, index) {
        const pj = document.getElementById('v_pj').value;
        if(!pj) return Swal.fire('Error','Nama PJ Wajib','error');
        const p = this.data.patients.find(x=>x.id===id);
        const arr = p[arrName] || (p[arrName]=[]);
        const f = document.getElementById('v_photo').files[0];
        let photo = index!==null?arr[index].photo:''; 
        if(f) photo = await this.toBase64(f);
        let sign = !this.signaturePad.isEmpty() ? this.signaturePad.toDataURL() : (index!==null?arr[index].sign:'');
        if(!sign) return Swal.fire('Error','TTD Wajib','error');

        const data = { time: index!==null?arr[index].time:new Date().toLocaleString(), note:document.getElementById('v_note').value, pj, photo, sign };
        if(index!==null) arr[index] = data; else arr.unshift(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalSimpleNote(id, arrName) {
        this.openModal(`
            <h3 class="font-bold mb-4 uppercase">Input ${arrName}</h3>
            <input id="sn_pj" class="input-modern mb-3" placeholder="Nama PJ">
            <textarea id="sn_note" class="input-modern h-32 mb-4" placeholder="Catatan..."></textarea>
            <button onclick="app.saveSimpleNote('${id}', '${arrName}')" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
        `);
    },
    saveSimpleNote(id, arrName) {
        const pj = document.getElementById('sn_pj').value;
        const note = document.getElementById('sn_note').value;
        if(!pj || !note) return Swal.fire('Error','Isi semua data','error');
        const p = this.data.patients.find(x=>x.id===id);
        if(!p[arrName]) p[arrName] = [];
        p[arrName].unshift({time:new Date().toLocaleString(), pj, note});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalStock(id, index=null) {
        const p=this.data.patients.find(x=>x.id===id); const s=index!==null?p.medicine.stock[index]:null;
        this.openModal(`<h3 class="font-bold mb-3">Stok Obat</h3><input id="s_name" class="input-modern mb-2" value="${s?.name||''}" placeholder="Nama"><input id="s_init" type="number" class="input-modern mb-2" value="${s?.init||''}" placeholder="Jml Awal"><input id="s_used" type="number" class="input-modern mb-2" value="${s?.used||0}" placeholder="Terpakai"><input id="s_exp" type="date" class="input-modern mb-3" value="${s?.exp||''}"><button onclick="app.saveStock('${id}',${index})" class="w-full bg-brand-600 text-white py-2 rounded font-bold">SIMPAN</button>`);
    },
    saveStock(id, index) {
        const p=this.data.patients.find(x=>x.id===id); if(!p.medicine) p.medicine={stock:[],logs:[]};
        const data={name:document.getElementById('s_name').value, init:Number(document.getElementById('s_init').value), used:Number(document.getElementById('s_used').value), exp:document.getElementById('s_exp').value};
        if(index!==null) p.medicine.stock[index]=data; else p.medicine.stock.push(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },
    modalUseMed(id, idx) {
        this.openModal(`<h3 class="font-bold text-center mb-2">Konfirmasi</h3><input id="u_pj" class="input-modern mb-4" placeholder="Nama PJ"><button onclick="app.execUseMed('${id}', ${idx})" class="w-full bg-emerald-600 text-white py-2 rounded font-bold">CATAT</button>`);
    },
    execUseMed(id, idx) {
        const p=this.data.patients.find(x=>x.id===id);
        if(p.medicine.stock[idx].init - p.medicine.stock[idx].used <= 0) return Swal.fire('Habis','','error');
        p.medicine.stock[idx].used++; p.medicine.logs.unshift({time:new Date().toLocaleString(), name:p.medicine.stock[idx].name, pj:document.getElementById('u_pj').value});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },
    modalEditLog(id, i) {
        const l = this.data.patients.find(x=>x.id===id).medicine.logs[i];
        this.openModal(`<input id="el_pj" class="input-modern mb-2" value="${l.pj}"><input id="el_time" class="input-modern mb-4" value="${l.time}"><button onclick="app.saveEditLog('${id}',${i})" class="w-full bg-brand-600 text-white py-2 rounded">UPDATE</button>`);
    },
    saveEditLog(id, i) {
        const p=this.data.patients.find(x=>x.id===id); p.medicine.logs[i].pj=document.getElementById('el_pj').value; p.medicine.logs[i].time=document.getElementById('el_time').value;
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },
    deleteMedLog(id, i) {
        const p=this.data.patients.find(x=>x.id===id); const log=p.medicine.logs[i];
        const s=p.medicine.stock.find(x=>x.name===log.name); if(s && s.used>0) s.used--;
        p.medicine.logs.splice(i,1); this.saveDB(); this.renderPatientDetail();
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
    
    // --- UPDATED CRISIS MODAL (EDIT SUPPORT) ---
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
    // 4. POWERFUL EXPORT LOGIC (WORD & EXCEL)
    // ============================================================
    async exportToWord(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, ImageRun, WidthType, BorderStyle } = docx;
        
        const b64Blob = (b64) => { try{ return Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0)) }catch(e){return null} };
        
        // Helper: Create Section with Note, Photo, Sign
        const createDetailSection = (title, dataArr) => {
            const rows = [
                new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing:{before:400, after:200} })
            ];
            
            if(!dataArr || dataArr.length === 0) {
                rows.push(new Paragraph({text: "(Data Kosong)", italic: true}));
                return rows;
            }

            dataArr.forEach(item => {
                const itemChildren = [
                    new Paragraph({ text: `Waktu: ${item.time} | PJ: ${item.pj}`, bold: true }),
                    new Paragraph({ text: item.note, spacing:{after:100} })
                ];

                if(item.photo) {
                    const imgData = b64Blob(item.photo);
                    if(imgData) itemChildren.push(new Paragraph({children:[new ImageRun({data:imgData, transformation:{width:150, height:100}})]}));
                }

                if(item.sign) {
                    const signData = b64Blob(item.sign);
                    if(signData) {
                         itemChildren.push(new Paragraph({text: "Tanda Tangan:", size: 16}));
                         itemChildren.push(new Paragraph({children:[new ImageRun({data:signData, transformation:{width:100, height:50}})]}));
                    }
                }
                
                // Add separator
                itemChildren.push(new Paragraph({ text: "__________________________________________________________________________________", color: "CCCCCC" }));
                rows.push(...itemChildren);
            });
            return rows;
        };

        const children = [];

        // --- I. BIODATA & PROGRAM ---
        children.push(new Paragraph({ text: "REKAM MEDIS PASIEN MMRC", heading: HeadingLevel.HEADING_1, alignment: "center" }));
        children.push(new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString()}`, alignment: "center", spacing:{after:300} }));
        
        children.push(new Paragraph({ text: "I. IDENTITAS & PROGRAM", heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph(`Nama Lengkap: ${p.reg.name}`));
        children.push(new Paragraph(`TTL: ${p.reg.ttl} | Usia: ${p.reg.age} Th`));
        children.push(new Paragraph(`Status: ${p.reg.status} | Pekerjaan: ${p.reg.job}`));
        children.push(new Paragraph(`Penanggung Jawab: ${p.reg.guardian}`));
        children.push(new Paragraph(`Program Saat Ini: ${p.program?.name || 'Belum Ada'} (${p.program?.days || 0} Hari)`));
        children.push(new Paragraph(`Mulai Program: ${p.program?.startDate || '-'}`));
        children.push(new Paragraph({text:""}));
        
        // --- II. MEDICINE TABLE ---
        children.push(new Paragraph({ text: "II. RIWAYAT PENGGUNAAN OBAT", heading: HeadingLevel.HEADING_2 }));
        const medRows = [
            new TableRow({ children: [
                new TableCell({ children: [new Paragraph({text: "Waktu", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Nama Obat", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "PJ", bold:true})] })
            ]})
        ];
        (p.medicine?.logs || []).forEach(l => {
            medRows.push(new TableRow({ children: [
                 new TableCell({ children: [new Paragraph(l.time)] }),
                 new TableCell({ children: [new Paragraph(l.name)] }),
                 new TableCell({ children: [new Paragraph(l.pj)] }),
            ]}));
        });
        children.push(new Table({ rows: medRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
        
        // --- III. TTV & GDS TABLE ---
        children.push(new Paragraph({ text: "III. TANDA VITAL (TTV & GDS)", heading: HeadingLevel.HEADING_2, spacing:{before:300} }));
        const ttvRows = [
            new TableRow({ children: [
                new TableCell({ children: [new Paragraph({text: "Waktu", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "TD", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Nadi/RR", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "GDS", bold:true})] })
            ]})
        ];
        (p.ttv || []).forEach(t => {
            ttvRows.push(new TableRow({ children: [
                 new TableCell({ children: [new Paragraph(t.time)] }),
                 new TableCell({ children: [new Paragraph(t.td)] }),
                 new TableCell({ children: [new Paragraph(`${t.nadi}/${t.rr}`)] }),
                 new TableCell({ children: [new Paragraph(t.gds)] }),
            ]}));
        });
        children.push(new Table({ rows: ttvRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

        // --- IV. BPSS SCORE TABLE ---
        children.push(new Paragraph({ text: "IV. SKOR BPSS (CRISIS)", heading: HeadingLevel.HEADING_2, spacing:{before:300} }));
        const bpssRows = [
            new TableRow({ children: [
                new TableCell({ children: [new Paragraph({text: "Hari", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Bio", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Psy", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Soc", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Spi", bold:true})] }),
                new TableCell({ children: [new Paragraph({text: "Total", bold:true})] })
            ]})
        ];
        (p.crisis?.bpss || []).forEach((b, i) => {
            bpssRows.push(new TableRow({ children: [
                 new TableCell({ children: [new Paragraph(`Hari-${i+1}`)] }),
                 new TableCell({ children: [new Paragraph(String(b.bio))] }),
                 new TableCell({ children: [new Paragraph(String(b.psy))] }),
                 new TableCell({ children: [new Paragraph(String(b.soc))] }),
                 new TableCell({ children: [new Paragraph(String(b.spi))] }),
                 new TableCell({ children: [new Paragraph(String(b.total))] }),
            ]}));
        });
        children.push(new Table({ rows: bpssRows, width: { size: 100, type: WidthType.PERCENTAGE } }));

        // --- V - X. DETAILED SECTIONS WITH PHOTOS & SIGNS ---
        children.push(...createDetailSection("V. ASSESSMENT", p.assessment));
        children.push(...createDetailSection("VI. RENCANA TERAPI", p.plan_therapy));
        children.push(...createDetailSection("VII. VISIT DOKTER", p.visits));
        children.push(...createDetailSection("VIII. KONSELING", p.counseling));
        children.push(...createDetailSection("IX. PROGRES HARIAN", p.daily_progress));
        children.push(...createDetailSection("X. TERMINASI", p.termination));

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `Laporan_Lengkap_${p.reg.name}.docx`; a.click();
    },

    exportToExcel(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const wb = XLSX.utils.book_new();
        
        // 1. Biodata & Program
        const bio = [{ 
            Nama: p.reg.name, TTL: p.reg.ttl, Usia: p.reg.age, PJ: p.reg.guardian, 
            Program: p.program?.name, StartDate: p.program?.startDate,
            Diagnosa: p.diagnosis.plan, Resep: p.diagnosis.prescription 
        }];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata_Program");

        // 2. Medicine
        const meds = (p.medicine?.logs||[]).map(l=>({Waktu:l.time, Obat:l.name, PJ:l.pj}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meds), "Medicine");

        // 3. TTV
        const ttv = (p.ttv||[]).map(t=>({Waktu:t.time, TD:t.td, Nadi:t.nadi, RR:t.rr, TB:t.tb, BB:t.bb, GDS:t.gds}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ttv), "TTV_GDS");

        // 4. BPSS
        const crisis = (p.crisis?.bpss||[]).map((b,i)=>({Hari:i+1, Bio:b.bio, Psy:b.psy, Soc:b.soc, Spi:b.spi, Total:b.total}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crisis), "Crisis_BPSS");

        // 5. Detailed Logs (Combined or Separated) - Separated for clarity
        const mapLog = (arr) => (arr||[]).map(x=>({Waktu:x.time, PJ:x.pj, Catatan:x.note, AdaFoto:x.photo?'Ya':'Tidak', AdaTTD:x.sign?'Ya':'Tidak'}));
        
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.assessment)), "Assessment");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.plan_therapy)), "Rencana_Terapi");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.visits)), "Visit_Dokter");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.counseling)), "Konseling");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.daily_progress)), "Progres_Harian");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mapLog(p.termination)), "Terminasi");

        XLSX.writeFile(wb, `Laporan_Lengkap_${p.reg.name}.xlsx`);
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app = app; app.init(); });
