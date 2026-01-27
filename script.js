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
    saveTimeout: null,
    isRestoring: false,

    init() {
        console.log("MMRC System V17.0 - Ready");
        this.checkSession();
    },

    // --- AUTH & SESSION ---
    checkSession() {
        const session = sessionStorage.getItem('MMRC_SESSION');
        if (session === 'LOGGED_IN') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.isRestoring = true;
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

    // --- DATABASE & STATE ---
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

    // --- RENDERING ---
    renderDashboard() {
        this.activePatientId = null;
        this.saveState('dashboard');
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        document.getElementById('header-actions').innerHTML = `<button onclick="app.logout()" class="text-xs text-red-500 font-bold hover:underline">LOGOUT</button>`;
        document.getElementById('main-content').innerHTML = `
            <div class="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-fade-in">
                <div class="text-center mb-4"><h2 class="text-2xl font-black text-slate-700">PILIH UNIT LAYANAN</h2><p class="text-slate-400">Silakan pilih kategori pasien</p></div>
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
                        <p class="text-sm text-slate-500 font-medium">Lanjutan. Visit, Assessment, Terapi.</p>
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
            return category === 'detox' ? prog.includes('detox') : !prog.includes('detox');
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
            if(p.program?.startDate && p.program?.days) {
                const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
                progLabel += ` (Hari ${diff}/${p.program.days})`;
                if(category === 'detox' && diff >= 7) stripeColor = 'bg-emerald-500';
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

    openPatient(id) { this.activePatientId = id; this.activeTab = 'biodata'; this.renderPatientDetail(); },

    renderPatientDetail() {
        const p = this.data.patients.find(x => x.id === this.activePatientId);
        if(!p) return this.renderPatientList(this.currentCategory);
        this.saveState('detail', p.id);
        document.getElementById('page-title').innerText = "DETAIL BERKAS PASIEN";
        
        let customActions = '';
        if(this.currentCategory === 'detox' && p.program?.startDate) {
            const diff = Math.floor((new Date() - new Date(p.program.startDate)) / (1000 * 60 * 60 * 24)) + 1;
            if(diff >= 7) customActions = `<button onclick="app.modalProgram('${p.id}', true)" class="bg-emerald-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-emerald-700 mr-2">SINKRONISASI KE REHAB</button>`;
        }
        document.getElementById('header-actions').innerHTML = `${customActions}<button onclick="app.renderPatientList('${this.currentCategory}')" class="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-300"><i class="fas fa-arrow-left"></i> KEMBALI</button>`;

        const container = document.getElementById('main-content');
        const tabs = this.currentCategory === 'detox' 
            ? [{id:'biodata', icon:'fa-id-card', label:'Biodata'}, {id:'program', icon:'fa-list-check', label:'Program'}, {id:'medicine', icon:'fa-pills', label:'Medicine'}, {id:'ttv', icon:'fa-stethoscope', label:'TTV'}, {id:'screening', icon:'fa-search', label:'Screening'}, {id:'conclusi', icon:'fa-clipboard-check', label:'Conclusi'}, {id:'daily', icon:'fa-calendar-check', label:'Daily'}]
            : [{id:'biodata', icon:'fa-id-card', label:'Biodata'}, {id:'program', icon:'fa-list-check', label:'Program'}, {id:'medicine', icon:'fa-pills', label:'Medicine'}, {id:'ttv', icon:'fa-stethoscope', label:'TTV'}, {id:'assessment', icon:'fa-file-medical-alt', label:'Assess'}, {id:'plan', icon:'fa-notes-medical', label:'Plan'}, {id:'visit', icon:'fa-user-md', label:'Visit'}, {id:'terminasi', icon:'fa-flag-checkered', label:'End'}, {id:'counseling', icon:'fa-comments', label:'Konsel'}, {id:'daily', icon:'fa-calendar-check', label:'Daily'}];

        let nav = `<div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex gap-6 mb-6 items-center">
            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50">
            <div>
                <h1 class="text-2xl font-black text-brand-800">${p.reg.name}</h1>
                <p class="text-sm text-slate-500 font-bold">ID: ${p.id.slice(-6)} • ${p.reg.age} Tahun</p>
            </div>
        </div>
        <div class="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">`;
        tabs.forEach(t => nav += `<button onclick="app.switchTab('${t.id}')" class="tab-btn ${this.activeTab === t.id ? 'active' : ''}"><i class="fas ${t.icon} mr-2"></i> ${t.label}</button>`);
        nav += `</div><div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] fade-in relative">${this.getTabContent(p, this.activeTab)}</div>`;
        container.innerHTML = nav;
    },

    switchTab(tabId) { this.activeTab = tabId; this.saveState('detail', this.activePatientId); this.renderPatientDetail(); },

    getTabContent(p, tab) {
        const v = (val) => val || '-';
        if(tab === 'biodata') {
            return `<div class="grid grid-cols-2 gap-4 text-sm">
                <div class="p-4 bg-slate-50 border rounded-xl"><span class="text-xs font-bold text-slate-400">TTL</span><div class="font-bold">${v(p.reg.ttl)}</div></div>
                <div class="p-4 bg-slate-50 border rounded-xl"><span class="text-xs font-bold text-slate-400">PJ</span><div class="font-bold">${v(p.reg.guardian)}</div></div>
                <div class="col-span-2 p-4 bg-slate-50 border rounded-xl"><span class="text-xs font-bold text-slate-400">Riwayat</span><div class="mt-1">${v(p.reg.history)}</div></div>
                <button onclick="app.modalPatient('${p.id}')" class="col-span-2 bg-brand-600 text-white py-3 rounded-xl font-bold">EDIT BIODATA</button>
            </div>`;
        }
        
        if(tab === 'program') {
            const prog = p.program || {};
            return `<div class="text-center p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                <h2 class="text-2xl font-black text-slate-700 mb-2">${prog.name || 'BELUM DIATUR'}</h2>
                <p class="text-slate-500 mb-6">${prog.desc || 'Silakan pilih paket program.'}</p>
                <button onclick="app.modalProgram('${p.id}')" class="bg-brand-600 text-white px-6 py-2 rounded-full font-bold">ATUR PROGRAM</button>
            </div>`;
        }

        if(tab === 'medicine') {
            const stockHtml = (p.medicine?.stock || []).map((s, i) => {
                const sisa = s.init - (s.used || 0);
                return `<tr class="border-b hover:bg-slate-50 text-xs">
                    <td class="p-3">${s.date_in}</td>
                    <td class="p-3 font-bold">${s.name}</td>
                    <td class="p-3 text-center font-bold text-emerald-600">${sisa}</td>
                    <td class="p-3 text-right flex gap-1 justify-end">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-emerald-600 text-white px-2 py-1 rounded shadow text-[10px]">MINUM</button>
                        <button onclick="app.modalStock('${p.id}', ${i})" class="bg-slate-100 text-slate-600 p-1 rounded"><i class="fas fa-pen"></i></button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="text-red-500 p-1"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            }).join('') || '<tr><td colspan="4" class="text-center p-4 text-slate-400">Belum ada stok.</td></tr>';

            const logHtml = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b text-xs">
                    <td class="p-3 text-slate-500">${l.time}</td>
                    <td class="p-3 font-bold">${l.name}</td>
                    <td class="p-3">${l.pj}</td>
                    <td class="p-3 italic text-slate-500">${l.note||'-'}</td>
                    <td class="p-3 text-right"><button onclick="app.deleteMedLog('${p.id}', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                </tr>`).join('') || '<tr><td colspan="5" class="text-center p-4 text-slate-400">Belum ada riwayat.</td></tr>';
            
            return `<div class="space-y-6">
                <div class="border rounded-xl overflow-hidden"><div class="bg-slate-50 p-3 border-b flex justify-between"><h4 class="font-bold text-brand-800">STOK OBAT</h4><button onclick="app.modalStock('${p.id}')" class="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">+ STOK</button></div><table class="w-full text-left"><tbody class="divide-y">${stockHtml}</tbody></table></div>
                <div class="border rounded-xl overflow-hidden"><div class="bg-slate-50 p-3 border-b"><h4 class="font-bold text-brand-800">RIWAYAT MINUM</h4></div><table class="w-full text-left"><tbody class="divide-y">${logHtml}</tbody></table></div>
            </div>`;
        }
        
        // Generic handler for other tabs
        const simpleTabs = ['ttv','screening','conclusi','daily','assessment','plan','visit','terminasi','counseling'];
        if(simpleTabs.includes(tab)) {
            let arrName = tab === 'ttv' ? 'ttv' : (tab === 'daily' ? 'daily_progress' : (tab === 'visit' ? 'visits' : (tab === 'plan' ? 'plan_therapy' : tab))); 
            if(tab === 'screening' || tab === 'conclusi') arrName = tab;
            const arr = p[arrName] || [];
            return `<div class="flex justify-between mb-4"><h4 class="font-bold uppercase">${tab}</h4><button onclick="app.modalSimpleNote('${p.id}', '${arrName}')" class="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">+ INPUT</button></div>
            <div class="space-y-2">${arr.map((x,i) => `<div class="p-3 border rounded bg-slate-50 text-sm flex justify-between"><div class="text-slate-600"><span class="font-bold text-brand-700">${x.time}</span> | ${x.pj||'-'} : ${x.note||JSON.stringify(x)}</div><button onclick="app.delSubItem('${arrName}',${i})" class="text-red-500"><i class="fas fa-trash"></i></button></div>`).join('')}</div>`;
        }
    },

    // ============================================================
    // FORMS & ACTIONS
    // ============================================================
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT PASIEN" : "PASIEN BARU";
        const v = (val) => val || '';
        this.openModal(`
            <form onsubmit="event.preventDefault(); app.savePatient('${id||''}')" class="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                <input id="p_name" class="input-modern" placeholder="Nama Lengkap" value="${v(p?.reg.name)}" required>
                <div class="grid grid-cols-2 gap-2">
                    <input id="p_age" type="number" class="input-modern" placeholder="Usia" value="${v(p?.reg.age)}">
                    <input id="p_ttl" class="input-modern" placeholder="Tempat, Tgl Lahir" value="${v(p?.reg.ttl)}">
                </div>
                <input id="p_status" class="input-modern" placeholder="Status (Nikah/Lajang)" value="${v(p?.reg.status)}">
                <textarea id="p_history" class="input-modern h-20" placeholder="Riwayat Penggunaan">${v(p?.reg.history)}</textarea>
                <input id="p_job" class="input-modern" placeholder="Pekerjaan" value="${v(p?.reg.job)}">
                <input id="p_guard" class="input-modern" placeholder="Penanggung Jawab" value="${v(p?.reg.guardian)}">
                <div class="border p-2 rounded"><label>Upload Foto</label><input type="file" id="p_photo"></div>
                
                <h4 class="font-bold text-sm mt-4 text-brand-600">CHECKLIST MEDIS</h4>
                <div class="grid grid-cols-1 gap-2 text-xs">
                     <div class="flex items-center gap-2"><input type="checkbox" id="chk_urine" ${p?.checklist?.urine?'checked':''}> <input id="note_urine" class="input-modern py-1" placeholder="Ket. Urine" value="${v(p?.checklist?.urine_note)}"></div>
                     <div class="flex items-center gap-2"><input type="checkbox" id="chk_fix" ${p?.checklist?.fix?'checked':''}> <input id="note_fix" class="input-modern py-1" placeholder="Ket. Fiksasi" value="${v(p?.checklist?.fix_note)}"></div>
                     <div class="flex items-center gap-2"><input type="checkbox" id="chk_inj" ${p?.checklist?.inj?'checked':''}> <input id="note_inj" class="input-modern py-1" placeholder="Ket. Injeksi" value="${v(p?.checklist?.inj_note)}"></div>
                </div>

                <h4 class="font-bold text-sm mt-4 text-brand-600">DIAGNOSA DOKTER</h4>
                <input id="m_dr" class="input-modern" placeholder="Nama Dokter" value="${v(p?.diagnosis?.dr_name)}">
                <input id="m_plan" class="input-modern" placeholder="Diagnosa / Plan" value="${v(p?.diagnosis?.plan)}">
                <textarea id="p_prescription" class="input-modern h-20" placeholder="Resep Obat">${v(p?.diagnosis?.prescription)}</textarea>

                <button class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold mt-4">SIMPAN DATA</button>
            </form>
        `);
    },

    async savePatient(id) {
        const get = (id) => document.getElementById(id).value;
        const pOld = id ? this.data.patients.find(x => x.id === id) : null;
        
        let photo = pOld?.reg.photo || 'https://via.placeholder.com/150';
        const file = document.getElementById('p_photo').files[0];
        if(file) photo = await this.toBase64(file);

        // LOGIC DETOX: Set default program if new and in Detox category
        let defaultProgram = {};
        if (!id && this.currentCategory === 'detox') {
            defaultProgram = { name: 'Stabilisasi (Detox) - Pending', days: 7, startDate: new Date().toISOString().split('T')[0], desc: 'Menunggu pengaturan.' };
        }

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: { name: get('p_name'), age: get('p_age'), ttl: get('p_ttl'), status: get('p_status'), history: get('p_history'), job: get('p_job'), guardian: get('p_guard'), photo, timestamp: pOld?.reg.timestamp || new Date().toLocaleString() },
            diagnosis: { dr_name: get('m_dr'), plan: get('m_plan'), prescription: get('p_prescription') },
            checklist: { urine: document.getElementById('chk_urine').checked, urine_note: get('note_urine'), fix: document.getElementById('chk_fix').checked, fix_note: get('note_fix'), inj: document.getElementById('chk_inj').checked, inj_note: get('note_inj') },
            program: pOld?.program || defaultProgram,
            medicine: pOld?.medicine || {stock:[], logs:[]},
            ttv: pOld?.ttv || [], visits: pOld?.visits || [], counseling: pOld?.counseling || [], daily_progress: pOld?.daily_progress || [], screening: pOld?.screening || [], conclusi: pOld?.conclusi || [], assessment: pOld?.assessment || [], plan_therapy: pOld?.plan_therapy || [], termination: pOld?.termination || []
        };

        if(id) this.data.patients[this.data.patients.findIndex(x=>x.id===id)] = newP;
        else this.data.patients.push(newP);

        this.closeModal();
        this.saveDB();
        if(!id) this.renderPatientList(this.currentCategory);
        else this.renderPatientDetail();
    },

    // --- MEDICINE FEATURES (FIXED) ---
    modalStock(id, index=null) {
        const p = this.data.patients.find(x => x.id === id);
        const s = index!==null ? p.medicine.stock[index] : null;
        this.openModal(`
            <h3 class="font-bold text-center mb-4">INPUT OBAT</h3>
            <input id="s_name" class="input-modern mb-2" placeholder="Nama Obat" value="${s?.name||''}">
            <input id="s_init" type="number" class="input-modern mb-2" placeholder="Jumlah (Qty)" value="${s?.init||''}">
            <input id="s_date" type="date" class="input-modern mb-4" value="${s?.date_in || new Date().toISOString().split('T')[0]}">
            <button onclick="app.saveStock('${id}', ${index})" class="w-full bg-brand-600 text-white py-3 rounded font-bold">SIMPAN</button>
        `);
    },

    saveStock(id, index) {
        const p = this.data.patients.find(x => x.id === id);
        const name = document.getElementById('s_name').value;
        const init = parseInt(document.getElementById('s_init').value);
        const date_in = document.getElementById('s_date').value;
        
        if (!name || isNaN(init)) return Swal.fire('Error', 'Isi nama dan jumlah!', 'error');
        const currentUsed = index !== null ? (p.medicine.stock[index].used || 0) : 0;
        const data = { name, init, date_in, used: currentUsed }; // USED default 0
        
        if (!p.medicine) p.medicine = {stock:[], logs:[]};
        if (!p.medicine.stock) p.medicine.stock = [];

        if (index !== null) p.medicine.stock[index] = data;
        else p.medicine.stock.push(data);

        this.closeModal();
        this.saveDB();
        this.renderPatientDetail();
    },

    modalUseMed(id, index) {
        const p = this.data.patients.find(x => x.id === id);
        const s = p.medicine.stock[index];
        const sisa = s.init - (s.used || 0);
        if (sisa <= 0) return Swal.fire('Habis', 'Stok 0', 'error');

        this.openModal(`
            <h3 class="font-bold text-center mb-2">KONFIRMASI MINUM</h3>
            <p class="text-center text-brand-600 font-bold text-lg mb-4">${s.name} (Sisa: ${sisa})</p>
            <input id="u_pj" class="input-modern mb-2" placeholder="Nama Petugas (Wajib)">
            <input id="u_note" class="input-modern mb-4" placeholder="Catatan (Pagi/Siang/Malam)">
            <button onclick="app.saveUseMed('${id}', ${index})" class="w-full bg-emerald-600 text-white py-3 rounded font-bold">KONFIRMASI (-1)</button>
        `);
    },

    saveUseMed(id, index) {
        const pj = document.getElementById('u_pj').value;
        const note = document.getElementById('u_note').value;
        if(!pj) return Swal.fire('Gagal', 'Nama Petugas Wajib Diisi', 'error');

        const p = this.data.patients.find(x => x.id === id);
        const s = p.medicine.stock[index];
        s.used = (s.used || 0) + 1; // Kurangi stok (tambah used)

        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift({ time: new Date().toLocaleString(), name: s.name, pj, note });

        this.closeModal();
        this.saveDB();
        this.renderPatientDetail();
        Swal.fire({icon:'success', title:'Berhasil', timer:1000, showConfirmButton:false});
    },

    deleteMedLog(id, i) {
        Swal.fire({title:'Hapus?', text:'Stok akan dikembalikan (+1)', icon:'warning', showCancelButton:true}).then(r => {
            if(r.isConfirmed) {
                const p = this.data.patients.find(x => x.id === id);
                const log = p.medicine.logs[i];
                const stock = p.medicine.stock.find(s => s.name === log.name);
                if(stock && stock.used > 0) stock.used--; // Refund stok
                p.medicine.logs.splice(i, 1);
                this.saveDB();
                this.renderPatientDetail();
            }
        });
    },

    // --- TTV & CRISIS ---
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
    modamodalCridnull) {
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

    // UTILS
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
    // EXPORT
    // ============================================================
    async exportToWord(id) {
        try {
            const p = this.data.patients.find(x=>x.id===id);
            if (!p) throw new Error("Data pasien tidak ditemukan");
            if (typeof docx === 'undefined') throw new Error("Library Word belum termuat. Coba refresh halaman.");
            const { Document, Packer, Paragraph, Table, TableRow, TableCell, HeadingLevel, ImageRun, WidthType } = docx;
            const b64Blob = (b64) => { try { if (!b64 || !b64.includes('base64,')) return null; return Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0)) } catch(e) { return null } };
            const createDetailSection = (title, dataArr) => {
                const rows = [new Paragraph({ text: title, heading: HeadingLevel.HEADING_2, spacing:{before:400, after:200} })];
                if(!dataArr || dataArr.length === 0) { rows.push(new Paragraph({text: "(Data Kosong)", italic: true})); return rows; }
                dataArr.forEach(item => {
                    const itemChildren = [ new Paragraph({ text: `Waktu: ${item.time} | PJ: ${item.pj}`, bold: true }), new Paragraph({ text: item.note, spacing:{after:100} }) ];
                    if(item.photo) { const imgData = b64Blob(item.photo); if(imgData) itemChildren.push(new Paragraph({children:[new ImageRun({data:imgData, transformation:{width:150, height:100}})]})); }
                    if(item.sign) { const signData = b64Blob(item.sign); if(signData) { itemChildren.push(new Paragraph({text: "Tanda Tangan:", size: 16})); itemChildren.push(new Paragraph({children:[new ImageRun({data:signData, transformation:{width:100, height:50}})]})); } }
                    itemChildren.push(new Paragraph({ text: "__________________________________________________________________________________", color: "CCCCCC" }));
                    rows.push(...itemChildren);
                });
                return rows;
            };
            const children = [];
            children.push(new Paragraph({ text: "REKAM MEDIS PASIEN MMRC", heading: HeadingLevel.HEADING_1, alignment: "center" }));
            children.push(new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString()}`, alignment: "center", spacing:{after:300} }));
            children.push(new Paragraph({ text: "I. IDENTITAS & PROGRAM", heading: HeadingLevel.HEADING_2 }));
            children.push(new Paragraph(`Nama Lengkap: ${p.reg.name}`));
            children.push(new Paragraph(`TTL: ${p.reg.ttl || '-'} | Usia: ${p.reg.age} Th`));
            children.push(new Paragraph(`Status: ${p.reg.status || '-'} | Pekerjaan: ${p.reg.job || '-'}`));
            children.push(new Paragraph(`Penanggung Jawab: ${p.reg.guardian || '-'}`));
            children.push(new Paragraph(`Program Saat Ini: ${p.program?.name || 'Belum Ada'} (${p.program?.days || 0} Hari)`));
            children.push(new Paragraph(`Mulai Program: ${p.program?.startDate || '-'}`));
            children.push(new Paragraph({text:""}));
            children.push(new Paragraph({ text: "II. RIWAYAT PENGGUNAAN OBAT", heading: HeadingLevel.HEADING_2 }));
            const medRows = [new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Waktu", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Nama Obat", bold:true})] }), new TableCell({ children: [new Paragraph({text: "PJ", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Catatan", bold:true})] })]})];
            (p.medicine?.logs || []).forEach(l => { medRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(l.time)] }), new TableCell({ children: [new Paragraph(l.name)] }), new TableCell({ children: [new Paragraph(l.pj)] }), new TableCell({ children: [new Paragraph(l.note||'-')] })]})); });
            children.push(new Table({ rows: medRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph({ text: "III. TANDA VITAL (TTV & GDS)", heading: HeadingLevel.HEADING_2, spacing:{before:300} }));
            const ttvRows = [new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Waktu", bold:true})] }), new TableCell({ children: [new Paragraph({text: "TD", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Nadi/RR", bold:true})] }), new TableCell({ children: [new Paragraph({text: "GDS", bold:true})] })]})];
            (p.ttv || []).forEach(t => { ttvRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(t.time)] }), new TableCell({ children: [new Paragraph(t.td)] }), new TableCell({ children: [new Paragraph(`${t.nadi}/${t.rr}`)] }), new TableCell({ children: [new Paragraph(t.gds)] }),]})); });
            children.push(new Table({ rows: ttvRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph({ text: "IV. SKOR BPSS (CRISIS)", heading: HeadingLevel.HEADING_2, spacing:{before:300} }));
            const bpssRows = [new TableRow({ children: [new TableCell({ children: [new Paragraph({text: "Hari", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Bio", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Psy", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Soc", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Spi", bold:true})] }), new TableCell({ children: [new Paragraph({text: "Total", bold:true})] })]})];
            (p.crisis?.bpss || []).forEach((b, i) => { bpssRows.push(new TableRow({ children: [new TableCell({ children: [new Paragraph(`Hari-${i+1}`)] }), new TableCell({ children: [new Paragraph(String(b.bio))] }), new TableCell({ children: [new Paragraph(String(b.psy))] }), new TableCell({ children: [new Paragraph(String(b.soc))] }), new TableCell({ children: [new Paragraph(String(b.spi))] }), new TableCell({ children: [new Paragraph(String(b.total))] }),]})); });
            children.push(new Table({ rows: bpssRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
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
        } catch (err) { Swal.fire("Error Export", "Gagal membuat dokumen Word.", "error"); }
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
