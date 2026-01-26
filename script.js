// ============================================================
// CONFIGURATION
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyAyC3ZPW1XOciNwaJHOhkwSY8vFY1BRlz8",
  authDomain: "mmrc-stock1999.firebaseapp.com",
  projectId: "mmrc-stock1999",
  storageBucket: "mmrc-stock1999.firebasestorage.app",
  messagingSenderId: "486588564272",
  appId: "1:486588564272:web:b0e06dcef08ab7618ebef5",
  measurementId: "G-WJJQRYDYPF"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

const app = {
    data: { patients: [] },
    activePatientId: null,
    activeTab: 'biodata',
    signaturePad: null,
    chartInstance: null,

    init() {
        console.log("MMRC System V8 - Complete Edition Ready");
        // this.loadDB(); // Uncomment for auto-load if needed
    },

    saveDB() {
        try {
            localStorage.setItem('MMRC_DATA_V7', JSON.stringify(this.data));
            if(db) db.ref('mmrc_data').set(this.data);
        } catch(e) { console.error("Save failed", e); }
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_V7');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];

        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                if(snap.val() && document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = snap.val();
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATA_V7', JSON.stringify(this.data));
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

    // --- DASHBOARD ---
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        const container = document.getElementById('main-content');
        
        document.getElementById('header-actions').innerHTML = `
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Pasien..." class="bg-slate-100 rounded-full px-4 py-2 text-xs font-bold w-64 outline-none focus:ring-2 ring-brand-100">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow flex items-center gap-2"><i class="fas fa-plus"></i> PASIEN BARU</button>
        `;

        if(!this.data.patients.length) {
            container.innerHTML = `<div class="text-center mt-20 text-slate-400"><i class="fas fa-users text-4xl mb-4 opacity-30"></i><p>Belum ada data.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
        
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-5 rounded-3xl border border-slate-100 card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            
            // Generate Badges for Checklists
            let badges = '';
            if(p.checklist?.urine) badges += `<span class="bg-yellow-100 text-yellow-700 text-[9px] px-1.5 py-0.5 rounded font-bold mr-1">URINE</span>`;
            if(p.checklist?.fix) badges += `<span class="bg-red-100 text-red-700 text-[9px] px-1.5 py-0.5 rounded font-bold mr-1">FIX</span>`;
            if(p.checklist?.inj) badges += `<span class="bg-blue-100 text-blue-700 text-[9px] px-1.5 py-0.5 rounded font-bold">INJ</span>`;

            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
                <div class="flex items-center gap-4 mb-4 pl-4">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm">
                    <div>
                        <h3 class="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-brand-700 transition">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-semibold">${p.reg.age} Th • ${p.program?.type || 'Reguler'}</p>
                        <div class="mt-1">${badges}</div>
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
        if(!p) return this.renderDashboard();

        document.getElementById('page-title').innerText = "DETAIL BERKAS PASIEN";
        
        // Header Actions (Full Export)
        document.getElementById('header-actions').innerHTML = `
            <button onclick="app.exportToWord('${p.id}')" class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-blue-700" title="Download Word Lengkap"><i class="fas fa-file-word"></i></button>
            <button onclick="app.exportToExcel('${p.id}')" class="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-emerald-700" title="Download Excel Lengkap"><i class="fas fa-file-excel"></i></button>
            <div class="w-px h-8 bg-slate-300 mx-2"></div>
            <button onclick="app.renderDashboard()" class="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-300 flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        const container = document.getElementById('main-content');
        
        // Tabs
        const tabs = [
            {id: 'biodata', icon: 'fa-id-card', label: 'Biodata'},
            {id: 'medicine', icon: 'fa-pills', label: 'Medicine'},
            {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'},
            {id: 'visit', icon: 'fa-user-md', label: 'Visit Dokter'},
            {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'},
            {id: 'program', icon: 'fa-list-check', label: 'Program'},
            {id: 'counseling', icon: 'fa-comments', label: 'Konseling'},
        ];

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-6 items-center md:items-start fade-in">
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
            <div class="flex-1 text-center md:text-left">
                <h1 class="text-2xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold mb-2">ID: ${p.id.slice(-6)} • Masuk: ${p.reg.timestamp}</p>
                <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                    <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Dr. ${p.diagnosis.dr_name}</span>
                    ${p.checklist?.urine ? '<span class="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-[10px] font-bold">Urine (+)</span>' : ''}
                    ${p.checklist?.fix ? '<span class="px-2 py-0.5 rounded bg-red-100 text-red-800 text-[10px] font-bold">Fiksasi</span>' : ''}
                </div>
            </div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">`;
        
        tabs.forEach(t => {
            nav += `<button onclick="app.switchTab('${t.id}')" class="tab-btn ${this.activeTab === t.id ? 'active' : ''}"><i class="fas ${t.icon} mr-2"></i> ${t.label}</button>`;
        });
        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        
        container.innerHTML = nav;
        if(this.activeTab === 'crisis') this.renderChart(p);
    },

    switchTab(tabId) { this.activeTab = tabId; this.renderPatientDetail(); },

    getTabContent(p, tab) {
        const searchInput = `<div class="absolute top-6 right-6"><input onkeyup="app.searchTable(this)" placeholder="Cari..." class="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 ring-brand-200"></div>`;
        const noData = `<p class="text-center text-slate-400 text-xs py-4">Belum ada data</p>`;
        const v = (val) => val || '-';

        // --- 1. BIODATA (UPDATED: Added TTL, Status, History) ---
        if(tab === 'biodata') {
            const check = p.checklist || {};
            return `
                <h3 class="font-bold text-lg text-brand-800 mb-6 border-b pb-2">Informasi Lengkap Pasien</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                    <div class="p-4 bg-slate-50 rounded-xl border">
                        <span class="block text-xs font-bold text-slate-400 uppercase">Tempat / Tgl Lahir</span>
                        <div class="font-bold text-slate-700">${v(p.reg.ttl)}</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border">
                        <span class="block text-xs font-bold text-slate-400 uppercase">Usia</span>
                        <div class="font-bold text-slate-700">${v(p.reg.age)} Tahun</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border">
                         <span class="block text-xs font-bold text-slate-400 uppercase">Status Pernikahan</span>
                         <div class="font-bold text-slate-700">${v(p.reg.status)}</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border">
                         <span class="block text-xs font-bold text-slate-400 uppercase">Penanggung Jawab</span>
                         <div class="font-bold text-slate-700">${v(p.reg.guardian)}</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border col-span-2">
                        <span class="block text-xs font-bold text-slate-400 uppercase">Riwayat Penyakit</span>
                        <div class="text-slate-700 mt-1">${v(p.reg.history)}</div>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-xl border col-span-2">
                        <span class="block text-xs font-bold text-slate-400 uppercase">Diagnosa & Planning</span>
                        <div class="text-slate-700 mt-1">${v(p.diagnosis.plan)}</div>
                    </div>
                </div>
                
                <h4 class="font-bold text-sm text-brand-600 uppercase mb-3">Checklist Medis</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="p-3 border rounded-xl ${check.urine?'bg-yellow-50 border-yellow-200':''}">
                        <p class="font-bold text-xs mb-1">Tes Urine</p>
                        <p class="text-sm">${check.urine ? '✅ ' + check.urine_note : '❌ Tidak'}</p>
                    </div>
                    <div class="p-3 border rounded-xl ${check.fix?'bg-red-50 border-red-200':''}">
                        <p class="font-bold text-xs mb-1">Fiksasi</p>
                        <p class="text-sm">${check.fix ? '✅ ' + check.fix_note : '❌ Tidak'}</p>
                    </div>
                    <div class="p-3 border rounded-xl ${check.inj?'bg-blue-50 border-blue-200':''}">
                        <p class="font-bold text-xs mb-1">Injeksi</p>
                        <p class="text-sm">${check.inj ? '✅ ' + check.inj_note : '❌ Tidak'}</p>
                    </div>
                </div>
                <button onclick="app.modalPatient('${p.id}')" class="bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow hover:bg-brand-700">EDIT BIODATA LENGKAP</button>
            `;
        }

        // --- 2. MEDICINE (Revised Logic) ---
        if(tab === 'medicine') {
            const stockHtml = (p.medicine?.stock || []).map((s, i) => {
                const sisa = s.init - s.used;
                const isLow = sisa < 7;
                return `
                <div class="p-3 rounded-xl border ${isLow ? 'stock-low' : 'bg-slate-50 border-slate-200'} relative search-row mb-3 flex justify-between items-center transition-all">
                    ${isLow ? '<div class="stock-badge">STOK < 7</div>' : ''}
                    <div>
                        <p class="font-bold text-sm ${isLow ? 'text-red-700' : 'text-slate-800'}">${s.name}</p>
                        <p class="text-[10px] text-slate-500">Sisa: <b class="text-lg">${sisa}</b> / ${s.init} | Exp: ${s.exp}</p>
                    </div>
                    <div class="flex gap-1">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition flex items-center justify-center shadow-sm" title="Minum Obat"><i class="fas fa-check"></i></button>
                        <button onclick="app.modalStock('${p.id}', ${i})" class="w-8 h-8 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition flex items-center justify-center" title="Edit Stok"><i class="fas fa-pen"></i></button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="w-8 h-8 rounded-full bg-red-50 text-red-400 hover:bg-red-100 transition flex items-center justify-center"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }).join('') || noData;

            const logHtml = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b last:border-0 hover:bg-slate-50 search-row text-xs">
                    <td class="py-2 pl-2 text-slate-500">${l.time}</td>
                    <td class="py-2 font-bold text-slate-700">${l.name}</td>
                    <td class="py-2">${l.pj}</td>
                    <td class="text-right pr-2"><button onclick="app.delSubItem('medicine.logs', ${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-times"></i></button></td>
                </tr>`).join('') || `<tr><td colspan="4" class="text-center p-4 text-xs text-slate-400">Belum ada riwayat minum</td></tr>`;

            return `
                ${searchInput}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                    <div class="lg:col-span-1 border-r pr-4">
                        <div class="flex justify-between items-center mb-4"><h4 class="font-bold text-brand-800">STOK OBAT</h4><button onclick="app.modalStock('${p.id}')" class="text-[10px] bg-brand-600 text-white px-2 py-1 rounded font-bold hover:bg-brand-700 shadow">+ STOK BARU</button></div>
                        <div class="max-h-[500px] overflow-y-auto pr-1">${stockHtml}</div>
                    </div>
                    <div class="lg:col-span-2">
                        <h4 class="font-bold text-brand-800 mb-4">LOG MINUM OBAT</h4>
                        <div class="bg-white border rounded-xl overflow-hidden shadow-sm">
                            <table class="w-full text-left"><thead class="bg-slate-50 text-[10px] text-slate-500 uppercase"><tr><th class="p-2">Waktu</th><th>Obat</th><th>PJ</th><th class="text-right p-2">Del</th></tr></thead>
                            <tbody>${logHtml}</tbody></table>
                        </div>
                    </div>
                </div>`;
        }

        // --- 3. TTV (With Edit) ---
        if(tab === 'ttv') {
            return `
                ${searchInput}
                <div class="flex justify-between items-center mb-4 mt-2">
                    <h4 class="font-bold text-brand-800">DATA TTV & GDS</h4>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">+ INPUT TTV</button>
                </div>
                <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th class="p-3">Waktu</th><th>TD</th><th>Nadi/RR</th><th>TB/BB</th><th>GDS</th><th class="text-right p-3">Aksi</th></tr></thead>
                        <tbody class="divide-y divide-slate-100">
                        ${(p.ttv||[]).map((t,i)=>`
                            <tr class="hover:bg-slate-50 search-row">
                                <td class="p-3">${t.time}</td>
                                <td class="p-3 font-bold text-brand-700">${t.td}</td>
                                <td class="p-3">${t.nadi} / ${t.rr}</td>
                                <td class="p-3">${t.tb}/${t.bb}</td>
                                <td class="p-3 font-bold">${t.gds}</td>
                                <td class="p-3 text-right flex justify-end gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-blue-500"><i class="fas fa-pen"></i></button>
                                    <button onclick="app.delSubItem('ttv',${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('') || `<tr><td colspan="6" class="text-center p-4">Kosong</td></tr>`}
                        </tbody>
                    </table>
                </div>`;
        }

        // --- 4. VISIT & 6. KONSELING (With Edit) ---
        if(tab === 'visit' || tab === 'counseling') {
            const isVisit = tab === 'visit';
            const dataArr = isVisit ? (p.visits || []) : (p.counseling || []);
            const typeLabel = isVisit ? "VISIT DOKTER" : "SESI KONSELING";
            
            return `
                ${searchInput}
                <div class="flex justify-between items-center mb-6 mt-2">
                    <h4 class="font-bold text-brand-800">RIWAYAT ${typeLabel}</h4>
                    <button onclick="app.modalSign('${p.id}', '${tab}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">+ INPUT BARU</button>
                </div>
                <div class="grid grid-cols-1 gap-4">
                    ${dataArr.map((v, i) => `
                    <div class="border rounded-2xl p-4 flex flex-col md:flex-row gap-4 hover:shadow-md transition bg-slate-50 search-row relative group">
                        <img src="${v.photo}" class="w-24 h-24 object-cover rounded-xl bg-white border cursor-pointer hover:scale-105 transition" onclick="Swal.fire({imageUrl: '${v.photo}', showConfirmButton:false})">
                        <div class="flex-1">
                            <div class="flex justify-between items-start">
                                <h5 class="font-bold text-brand-800 text-sm">${v.time}</h5>
                                <div class="flex gap-2">
                                    <button onclick="app.modalSign('${p.id}', '${tab}', ${i})" class="text-blue-500 hover:text-blue-700 p-1 bg-white rounded shadow-sm border"><i class="fas fa-pen"></i></button>
                                    <button onclick="app.delSubItem('${isVisit?'visits':'counseling'}', ${i})" class="text-red-500 hover:text-red-700 p-1 bg-white rounded shadow-sm border"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                            <p class="text-xs text-slate-600 mt-2 italic bg-white p-2 rounded border border-slate-100">"${v.note}"</p>
                            <div class="mt-2 flex items-center justify-between">
                                <span class="text-[9px] text-slate-400 font-bold uppercase">Digital Signature:</span>
                                <img src="${v.sign}" class="h-6 opacity-70">
                            </div>
                        </div>
                    </div>`).join('') || noData}
                </div>`;
        }

        // --- 5. CRISIS / BPSS (With Edit & Detail Score) ---
        if(tab === 'crisis') {
            const listHtml = (p.crisis?.bpss || []).map((b,i) => `
                <tr class="border-b search-row hover:bg-slate-50">
                    <td class="p-2 text-xs font-bold">Hari-${i+1}</td>
                    <td class="p-2 text-xs">
                        <span class="text-blue-600 font-bold">B:${b.bio}</span> 
                        <span class="text-purple-600 font-bold">P:${b.psy}</span> 
                        <span class="text-orange-600 font-bold">S:${b.soc}</span> 
                        <span class="text-green-600 font-bold">Sp:${b.spi}</span>
                    </td>
                    <td class="p-2 font-black text-center text-brand-700">${b.total}</td>
                    <td class="text-right p-2">
                         <button onclick="app.modalCrisis('${p.id}', ${i})" class="text-blue-400 mr-2"><i class="fas fa-pen"></i></button>
                         <button onclick="app.delSubItem('crisis.bpss',${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `).join('');

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-brand-800">DATA HARIAN (BPSS)</h4>
                            <button onclick="app.modalCrisis('${p.id}')" class="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">+ INPUT SKOR</button>
                        </div>
                        <div class="h-64 border rounded-xl p-2 bg-slate-50"><canvas id="crisisChart"></canvas></div>
                    </div>
                    <div>
                        <h4 class="font-bold text-brand-800 mb-4">LOG SKOR DETAIL</h4>
                        <div class="border rounded-xl bg-white overflow-hidden max-h-80 overflow-y-auto">
                            <table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-2 text-left">Hari</th><th>Detail (B-P-S-Sp)</th><th>Total</th><th class="text-right p-2">Aksi</th></tr></thead>
                            <tbody>${listHtml || '<tr><td colspan="4" class="text-center p-2">Kosong</td></tr>'}</tbody></table>
                        </div>
                    </div>
                </div>`;
        }

        // --- PROGRAM ---
        if(tab === 'program') {
            return `
                <div class="max-w-md mx-auto mt-6 text-center">
                    <div class="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 rounded-3xl shadow-xl mb-6 transform hover:scale-105 transition">
                        <p class="text-xs font-bold opacity-70 mb-2 uppercase tracking-widest">Paket Saat Ini</p>
                        <h2 class="text-3xl font-black mb-1">${p.program?.type || 'REGULER'}</h2>
                        <p class="text-lg font-semibold opacity-90">${p.program?.duration || 'Belum diatur'}</p>
                    </div>
                    <button onclick="app.modalProgram('${p.id}')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition border border-slate-200">UBAH PAKET PROGRAM</button>
                </div>`;
        }
    },

    // ============================================================
    // MODALS & SAVING LOGIC
    // ============================================================

    // 1. PATIENT MODAL (ADDED: TTL, Status, History)
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN";
        const v = (val) => val || '';
        const chk = p?.checklist || {};
        
        this.openModal(`
            <form onsubmit="event.preventDefault(); app.savePatient('${id||''}')" class="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer relative bg-slate-50 hover:bg-white transition">
                    <input type="file" id="p_photo" class="absolute inset-0 opacity-0 cursor-pointer">
                    <i class="fas fa-camera text-2xl text-slate-400 mb-1"></i>
                    <p class="text-xs text-slate-500">Klik untuk upload foto</p>
                </div>
                
                <input id="p_name" class="input-modern" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" required>
                
                <div class="grid grid-cols-2 gap-3">
                    <input id="p_ttl" class="input-modern" value="${v(p?.reg.ttl)}" placeholder="Tempat, Tgl Lahir">
                    <input id="p_age" type="number" class="input-modern" value="${v(p?.reg.age)}" placeholder="Usia (Th)">
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <select id="p_status" class="input-modern">
                        <option value="">- Status Pernikahan -</option>
                        <option ${p?.reg.status==='Belum Menikah'?'selected':''}>Belum Menikah</option>
                        <option ${p?.reg.status==='Menikah'?'selected':''}>Menikah</option>
                        <option ${p?.reg.status==='Cerai Hidup'?'selected':''}>Cerai Hidup</option>
                        <option ${p?.reg.status==='Cerai Mati'?'selected':''}>Cerai Mati</option>
                    </select>
                    <input id="p_job" class="input-modern" value="${v(p?.reg.job)}" placeholder="Pekerjaan">
                </div>

                <input id="p_guard" class="input-modern" value="${v(p?.reg.guardian)}" placeholder="Penanggung Jawab">
                
                <textarea id="p_history" class="input-modern h-16" placeholder="Riwayat Penyakit (Terdahulu)">${v(p?.reg.history)}</textarea>

                <textarea id="m_plan" class="input-modern h-20" placeholder="Diagnosa & Plan Saat Ini">${v(p?.diagnosis.plan)}</textarea>
                <input id="m_dr" class="input-modern" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter DPJP">

                <div class="border-t pt-2 mt-2">
                    <p class="text-xs font-bold text-brand-600 mb-2 uppercase">Checklist Medis</p>
                    
                    <div class="checklist-item">
                        <input type="checkbox" id="chk_urine" class="chk-box" ${chk.urine?'checked':''}>
                        <div class="flex-1"><p class="text-xs font-bold">Urine Test</p></div>
                        <input id="note_urine" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.urine_note)}">
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="chk_fix" class="chk-box" ${chk.fix?'checked':''}>
                        <div class="flex-1"><p class="text-xs font-bold">Fiksasi</p></div>
                        <input id="note_fix" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.fix_note)}">
                    </div>

                    <div class="checklist-item">
                        <input type="checkbox" id="chk_inj" class="chk-box" ${chk.inj?'checked':''}>
                        <div class="flex-1"><p class="text-xs font-bold">Injeksi</p></div>
                        <input id="note_inj" class="input-modern py-1 text-xs" style="width:50%" placeholder="Ket..." value="${v(chk.inj_note)}">
                    </div>
                </div>

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

        // Checklist Data
        const checklist = {
            urine: document.getElementById('chk_urine').checked,
            urine_note: get('note_urine'),
            fix: document.getElementById('chk_fix').checked,
            fix_note: get('note_fix'),
            inj: document.getElementById('chk_inj').checked,
            inj_note: get('note_inj')
        };

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: { 
                name: get('p_name'), 
                age: get('p_age'),
                ttl: get('p_ttl'),          // Added
                status: get('p_status'),    // Added
                history: get('p_history'),  // Added
                job: get('p_job'), 
                guardian: get('p_guard'), 
                addr: pOld?.reg.addr||'-', 
                photo, 
                timestamp: pOld?.reg.timestamp || new Date().toLocaleString() 
            },
            diagnosis: { dr_name: get('m_dr'), plan: get('m_plan') },
            checklist: checklist,
            // Keep existing arrays
            medicine: pOld?.medicine || {stock:[], logs:[]},
            ttv: pOld?.ttv || [],
            visits: pOld?.visits || [],
            crisis: pOld?.crisis || { bpss: [] },
            program: pOld?.program || {},
            counseling: pOld?.counseling || []
        };
        
        if(id) this.data.patients[this.data.patients.findIndex(x=>x.id===id)] = newP;
        else this.data.patients.push(newP);
        
        this.closeModal(); this.saveDB();
        if(!id) this.renderDashboard(); else this.renderPatientDetail();
    },

    // 2. STOCK MODAL
    modalStock(id, index = null) {
        const p = this.data.patients.find(x => x.id === id);
        const s = index !== null ? p.medicine.stock[index] : null;
        
        this.openModal(`
            <h3 class="font-bold text-lg mb-4">${index!==null?'Edit Stok':'Tambah Stok'}</h3>
            <input id="s_name" class="input-modern mb-3" placeholder="Nama Obat" value="${s?.name||''}">
            <div class="grid grid-cols-2 gap-3 mb-3">
                <input id="s_init" type="number" class="input-modern" placeholder="Jumlah Awal" value="${s?.init||''}">
                <input id="s_used" type="number" class="input-modern" placeholder="Terpakai" value="${s?.used||0}" ${index===null?'disabled':''}>
            </div>
            <input id="s_exp" type="date" class="input-modern mb-4" value="${s?.exp||''}">
            <button onclick="app.saveStock('${id}', ${index})" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
        `);
    },
    saveStock(id, index) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        
        const data = {
            name: document.getElementById('s_name').value,
            init: Number(document.getElementById('s_init').value),
            used: Number(document.getElementById('s_used').value),
            exp: document.getElementById('s_exp').value
        };

        if(index !== null) p.medicine.stock[index] = data; // Edit
        else p.medicine.stock.push(data); // Add

        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalUseMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const s = p.medicine.stock[idx];
        if((s.init - s.used) <= 0) return Swal.fire('Habis', 'Stok obat ini habis!', 'error');

        this.openModal(`
            <h3 class="font-bold text-center mb-2">Konfirmasi Minum Obat</h3>
            <p class="text-center font-bold text-brand-600 text-lg mb-4">${s.name}</p>
            <input id="u_pj" class="input-modern mb-4" placeholder="Nama PJ (Perawat)">
            <button onclick="app.execUseMed('${id}', ${idx})" class="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold shadow">KONFIRMASI</button>
        `);
    },
    execUseMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({ time: new Date().toLocaleString(), name: p.medicine.stock[idx].name, pj: document.getElementById('u_pj').value });
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
        Swal.fire({icon:'success', title:'Tercatat', timer:1000, showConfirmButton:false});
    },

    // 3. TTV MODAL
    modalTTV(id, index = null) {
        const p = this.data.patients.find(x=>x.id===id);
        const t = index !== null ? p.ttv[index] : null;
        
        this.openModal(`
            <h3 class="font-bold mb-4">${index!==null?'Edit TTV':'Input TTV Baru'}</h3>
            <div class="grid grid-cols-2 gap-3">
                <input id="t_td" class="input-modern col-span-2" placeholder="Tensi (120/80)" value="${t?.td||''}">
                <input id="t_nadi" class="input-modern" placeholder="Nadi" value="${t?.nadi||''}">
                <input id="t_rr" class="input-modern" placeholder="RR" value="${t?.rr||''}">
                <input id="t_tb" class="input-modern" placeholder="TB" value="${t?.tb||''}">
                <input id="t_bb" class="input-modern" placeholder="BB" value="${t?.bb||''}">
                <input id="t_gds" class="input-modern col-span-2" placeholder="GDS" value="${t?.gds||''}">
                <button onclick="app.saveTTV('${id}', ${index})" class="col-span-2 bg-brand-600 text-white py-3 rounded-lg font-bold mt-2">SIMPAN</button>
            </div>
        `);
    },
    saveTTV(id, index) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.ttv) p.ttv = [];
        const data = {
            time: index!==null ? p.ttv[index].time : new Date().toLocaleString(),
            td: document.getElementById('t_td').value,
            nadi: document.getElementById('t_nadi').value,
            rr: document.getElementById('t_rr').value,
            tb: document.getElementById('t_tb').value,
            bb: document.getElementById('t_bb').value,
            gds: document.getElementById('t_gds').value
        };
        if(index!==null) p.ttv[index] = data; else p.ttv.unshift(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    // 4. VISIT & COUNSELING MODAL
    modalSign(id, type, index = null) {
        const p = this.data.patients.find(x=>x.id===id);
        const arr = type === 'visit' ? p.visits : p.counseling;
        const v = index !== null ? arr[index] : null;
        
        this.openModal(`
            <h3 class="font-bold mb-4 uppercase">${index!==null?'Edit':'Input'} ${type}</h3>
            <div class="space-y-3">
                ${v ? `<div class="text-xs text-center text-slate-400">Foto & TTD Lama tersimpan. Upload/TTD baru untuk mengganti.</div>` : ''}
                <div class="border-dashed border-2 p-4 text-center rounded-xl bg-slate-50"><input type="file" id="v_photo"><p class="text-xs">Upload Foto Kegiatan</p></div>
                <textarea id="v_note" class="input-modern h-24" placeholder="Catatan...">${v?.note||''}</textarea>
                <div class="bg-slate-50 border p-2 rounded-xl">
                    <canvas id="sig-pad" class="bg-white border w-full h-32 rounded"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-xs text-red-500 mt-1">Clear Signature</button>
                </div>
                <button onclick="app.saveSign('${id}', '${type}', ${index})" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
            </div>
        `);
        setTimeout(()=>{
            const c=document.getElementById('sig-pad'); 
            c.width=c.parentElement.clientWidth-16; c.height=128; 
            this.signaturePad=new SignaturePad(c);
        },300);
    },
    async saveSign(id, type, index) {
        const p = this.data.patients.find(x=>x.id===id);
        const arr = type === 'visit' ? (p.visits||(p.visits=[])) : (p.counseling||(p.counseling=[]));
        const f = document.getElementById('v_photo').files[0];
        let photo = 'https://via.placeholder.com/150';
        if(f) photo = await this.toBase64(f);
        else if(index!==null) photo = arr[index].photo;

        let sign = this.signaturePad.isEmpty() ? null : this.signaturePad.toDataURL();
        if(index!==null && !sign) sign = arr[index].sign;
        if(!sign) return Swal.fire('Error','Tanda Tangan Wajib','error');

        const data = { time: index!==null ? arr[index].time : new Date().toLocaleString(), note: document.getElementById('v_note').value, photo, sign };
        if(index!==null) arr[index] = data; else arr.unshift(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    // 5. CRISIS MODAL
    modalCrisis(id, index = null) {
        const p = this.data.patients.find(x=>x.id===id);
        const b = index !== null ? p.crisis.bpss[index] : null;

        this.openModal(`
            <h3 class="font-bold mb-4 text-center">${index!==null?'Edit Skor':'Input Skor Baru'}</h3>
            <div class="grid grid-cols-2 gap-3">
                <div><label class="text-[10px] font-bold">BIO</label><input id="c_bio" type="number" class="input-modern" value="${b?.bio||0}"></div>
                <div><label class="text-[10px] font-bold">PSY</label><input id="c_psy" type="number" class="input-modern" value="${b?.psy||0}"></div>
                <div><label class="text-[10px] font-bold">SOC</label><input id="c_soc" type="number" class="input-modern" value="${b?.soc||0}"></div>
                <div><label class="text-[10px] font-bold">SPI</label><input id="c_spi" type="number" class="input-modern" value="${b?.spi||0}"></div>
                <button onclick="app.saveCrisis('${id}', ${index})" class="col-span-2 bg-brand-600 text-white py-2 rounded-lg font-bold mt-2">SIMPAN</button>
            </div>
        `);
    },
    saveCrisis(id, index) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.crisis) p.crisis = {bpss:[]};
        const bio=+document.getElementById('c_bio').value, psy=+document.getElementById('c_psy').value, soc=+document.getElementById('c_soc').value, spi=+document.getElementById('c_spi').value;
        const data = {bio, psy, soc, spi, total: bio+psy+soc+spi};
        if(index!==null) p.crisis.bpss[index] = data; else p.crisis.bpss.push(data);
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    // 6. PROGRAM MODAL
    modalProgram(id) {
        this.openModal(`
            <select id="pr_dur" class="input-modern mb-4">
                <option value="7 Hari">Paket 7 Hari</option>
                <option value="14 Hari">Paket 14 Hari</option>
                <option value="1 Bulan">Paket 1 Bulan</option>
                <option value="2 Bulan">Paket 2 Bulan</option>
                <option value="3 Bulan">Paket 3 Bulan</option>
            </select>
            <select id="pr_type" class="input-modern mb-4"><option>Reguler</option><option>VIP</option></select>
            <button onclick="app.saveProgram('${id}')" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">UPDATE PROGRAM</button>
        `);
    },

    // --- UTILS & HELPERS ---
    renderChart(p) {
        const ctx = document.getElementById('crisisChart');
        if(!ctx || !p.crisis?.bpss?.length) return;
        const last = p.crisis.bpss[p.crisis.bpss.length-1];
        if(this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Biological', 'Psychological', 'Social', 'Spiritual'],
                datasets: [{ label: 'BPSS Terkini', data: [last.bio, last.psy, last.soc, last.spi], backgroundColor: 'rgba(190, 18, 60, 0.2)', borderColor: '#be123c', borderWidth: 2 }]
            },
            options: { scales: { r: { min: 0, max: 5 } } }
        });
    },

    searchDashboard() {
        const q = document.getElementById('dash-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none');
    },
    searchTable(input) {
        const q = input.value.toLowerCase();
        const rows = document.querySelectorAll('.search-row');
        rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
    },
    delSubItem(path, idx) {
        Swal.fire({title:'Hapus Item?', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>{
            if(r.isConfirmed) {
                const p = this.data.patients.find(x=>x.id===this.activePatientId);
                let t = p; const parts = path.split('.');
                for(let i=0; i<parts.length-1; i++) t = t[parts[i]];
                t[parts[parts.length-1]].splice(idx, 1);
                this.saveDB(); this.renderPatientDetail();
            }
        });
    },
    openModal(html) { document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise((r) => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload=()=>r(rd.result); }),
    deletePatient(id) { Swal.fire({title:'Hapus Pasien?', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>{if(r.isConfirmed){this.data.patients=this.data.patients.filter(x=>x.id!==id); this.saveDB(); this.renderDashboard();}})},

    // ============================================================
    // EXPORT LOGIC (WORD & EXCEL - Includes New Biodata)
    // ============================================================
    async exportToWord(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun } = docx;
        const b64Blob = (b64) => { try{ return Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0)) }catch(e){return null} };
        const addImg = (b64, w=100, h=100) => { const d=b64Blob(b64); if(d) children.push(new Paragraph({children:[new ImageRun({data:d, transformation:{width:w, height:h}})]})); };

        const c = p.checklist || {};
        const checkText = `Urine: ${c.urine?'Positif ('+c.urine_note+')':'Negatif'} | Fiksasi: ${c.fix?'Ya ('+c.fix_note+')':'Tidak'} | Injeksi: ${c.inj?'Ya ('+c.inj_note+')':'Tidak'}`;

        const children = [
            new Paragraph({ text: "REKAM MEDIS PASIEN MMRC", heading: HeadingLevel.HEADING_1, alignment: "center" }),
            new Paragraph({ text: `Dicetak: ${new Date().toLocaleString()}`, alignment: "center" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "I. BIODATA PRIBADI", heading: HeadingLevel.HEADING_2 }),
            new Paragraph(`Nama: ${p.reg.name} | ID: ${p.id}`),
            new Paragraph(`TTL: ${p.reg.ttl || '-'} | Usia: ${p.reg.age} Th`),
            new Paragraph(`Status: ${p.reg.status || '-'} | Pekerjaan: ${p.reg.job || '-'}`),
            new Paragraph(`Penanggung Jawab: ${p.reg.guardian}`),
            new Paragraph(`Riwayat Penyakit: ${p.reg.history || '-'}`),
            new Paragraph(`Diagnosa: ${p.diagnosis.plan}`),
            new Paragraph(`Checklist Medis: ${checkText}`),
            new Paragraph({ text: "" }),
        ];

        // LOG OBAT
        children.push(new Paragraph({ text: "II. RIWAYAT OBAT", heading: HeadingLevel.HEADING_2 }));
        (p.medicine?.logs || []).forEach(l => children.push(new Paragraph(`${l.time} - ${l.name} (PJ: ${l.pj})`)));

        // TTV
        children.push(new Paragraph({ text: "III. DATA TTV & GDS", heading: HeadingLevel.HEADING_2 }));
        (p.ttv || []).forEach(t => children.push(new Paragraph(`${t.time}: TD ${t.td}, Nadi ${t.nadi}, GDS ${t.gds}, TB/BB ${t.tb}/${t.bb}`)));

        // VISIT & KONSELING
        const addSection = (title, arr, label) => {
            children.push(new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }));
            (arr || []).forEach(v => {
                children.push(new Paragraph({text: v.time, bold:true}));
                children.push(new Paragraph(v.note));
                if(v.photo) addImg(v.photo, 200, 150);
                if(v.sign) { children.push(new Paragraph(`TTD ${label}:`)); addImg(v.sign, 100, 50); }
                children.push(new Paragraph("--------------------------------"));
            });
        };
        addSection("IV. VISIT DOKTER", p.visits, "Dokter");
        addSection("V. KONSELING", p.counseling, "Konselor");

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `RekamMedis_${p.reg.name}.docx`; a.click();
    },

    exportToExcel(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const wb = XLSX.utils.book_new();
        const c = p.checklist || {};

        const bio = [{ 
            Nama: p.reg.name, TTL: p.reg.ttl, Usia: p.reg.age, 
            Status: p.reg.status, Riwayat_Penyakit: p.reg.history,
            Diagnosa: p.diagnosis.plan, 
            Urine: c.urine?'YA':'TDK', Urine_Ket: c.urine_note, 
            Fiksasi: c.fix?'YA':'TDK', Fiks_Ket: c.fix_note, 
            Injeksi: c.inj?'YA':'TDK', Inj_Ket: c.inj_note 
        }];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata");

        const meds = (p.medicine?.logs||[]).map(l=>({Waktu:l.time, Obat:l.name, PJ:l.pj}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meds), "Obat");

        const ttv = (p.ttv||[]).map(t=>({Waktu:t.time, TD:t.td, GDS:t.gds, TB:t.tb, BB:t.bb}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ttv), "TTV");

        const allVisits = [
            ...(p.visits||[]).map(v=>({Tipe:'Dokter', Waktu:v.time, Note:v.note})),
            ...(p.counseling||[]).map(c=>({Tipe:'Konseling', Waktu:c.time, Note:c.note}))
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(allVisits), "Visit_Konseling");
        
        const crisis = (p.crisis?.bpss||[]).map((b,i)=>({Hari:i+1, Bio:b.bio, Psy:b.psy, Soc:b.soc, Spi:b.spi, Total:b.total}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crisis), "Crisis_BPSS");

        XLSX.writeFile(wb, `Data_${p.reg.name}.xlsx`);
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app = app; app.init(); });
