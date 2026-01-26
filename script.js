// CONFIG
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
    activeTab: 'biodata', // biodata, medicine, ttv, visit, crisis, program, counseling
    signaturePad: null,
    chartInstance: null,

    init() {
        console.log("MMRC System V6 Loaded");
        // this.loadDB(); 
    },

    saveDB() {
        try {
            localStorage.setItem('MMRC_DATA_V6', JSON.stringify(this.data));
            if(db) db.ref('mmrc_data').set(this.data);
        } catch(e){}
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_V6');
        if(local) try { this.data = JSON.parse(local); } catch(e){}
        if(!this.data.patients) this.data.patients = [];
        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                if(snap.val() && document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = snap.val();
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATA_V6', JSON.stringify(this.data));
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

    // --- NAVIGATION ---
    renderDashboard() {
        this.activePatientId = null;
        document.getElementById('page-title').innerText = "DASHBOARD UTAMA";
        const container = document.getElementById('main-content');
        
        // Header Search
        document.getElementById('header-actions').innerHTML = `
            <input id="dash-search" onkeyup="app.searchDashboard()" placeholder="Cari Pasien..." class="bg-slate-100 rounded-full px-4 py-2 text-xs font-bold w-64 outline-none focus:ring-2 ring-brand-100">
            <button onclick="app.modalPatient()" class="bg-brand-600 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-700 shadow flex items-center gap-2"><i class="fas fa-plus"></i> BARU</button>
        `;

        if(!this.data.patients.length) {
            container.innerHTML = `<div class="text-center mt-20 text-slate-400"><i class="fas fa-users text-4xl mb-4 opacity-30"></i><p>Belum ada data pasien.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6";
        
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-5 rounded-3xl border border-slate-100 card-hover cursor-pointer search-item relative overflow-hidden group";
            card.onclick = (e) => { if(!e.target.closest('button')) app.openPatient(p.id); };
            
            card.innerHTML = `
                <div class="absolute top-0 left-0 w-2 h-full bg-brand-600"></div>
                <div class="flex items-center gap-4 mb-4 pl-4">
                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-50 border shadow-sm">
                    <div>
                        <h3 class="font-extrabold text-slate-800 text-lg leading-tight group-hover:text-brand-700 transition">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-semibold">${p.reg.age} Th • ${p.program?.type || 'Reguler'}</p>
                    </div>
                </div>
                <div class="pl-4 space-y-2 mb-4">
                    <div class="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p class="text-[10px] font-bold text-slate-400 uppercase">Diagnosa</p>
                        <p class="text-xs font-bold text-brand-800 truncate">${p.diagnosis.dr_name} - ${p.diagnosis.plan || '-'}</p>
                    </div>
                </div>
                <div class="flex justify-end gap-2 pl-4 border-t pt-3">
                    <button onclick="app.modalPatient('${p.id}')" class="px-3 py-1 rounded bg-amber-50 text-amber-600 text-[10px] font-bold hover:bg-amber-100">EDIT</button>
                    <button onclick="app.deletePatient('${p.id}')" class="px-3 py-1 rounded bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100">HAPUS</button>
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
        
        // Header Actions (Export & Back)
        document.getElementById('header-actions').innerHTML = `
            <button onclick="app.exportToWord('${p.id}')" class="bg-blue-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-blue-700" title="Export Word Lengkap"><i class="fas fa-file-word"></i></button>
            <button onclick="app.exportToExcel('${p.id}')" class="bg-emerald-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow hover:bg-emerald-700" title="Export Excel Lengkap"><i class="fas fa-file-excel"></i></button>
            <div class="w-px h-8 bg-slate-300 mx-2"></div>
            <button onclick="app.renderDashboard()" class="bg-slate-200 text-slate-600 px-4 py-2 rounded-full text-xs font-bold hover:bg-slate-300 flex items-center gap-2"><i class="fas fa-arrow-left"></i> KEMBALI</button>
        `;

        const container = document.getElementById('main-content');
        
        // 1. Patient Header
        let html = `
            <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6 mb-6 items-center md:items-start fade-in">
                <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover border-4 border-slate-50 shadow-md">
                <div class="flex-1 text-center md:text-left">
                    <h1 class="text-2xl font-black text-brand-800">${p.reg.name}</h1>
                    <p class="text-sm text-slate-500 font-bold mb-2">ID: ${p.id} • Masuk: ${p.reg.timestamp}</p>
                    <div class="flex flex-wrap gap-2 justify-center md:justify-start">
                        <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100">Dr. ${p.diagnosis.dr_name}</span>
                        <span class="px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-100">Paket: ${p.program?.duration || '-'}</span>
                        <span class="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-100">Spot: ${p.reg.spotcheck || '-'}</span>
                    </div>
                </div>
            </div>
        `;

        // 2. Tabs Navigation
        const tabs = [
            {id: 'biodata', icon: 'fa-id-card', label: 'Biodata'},
            {id: 'medicine', icon: 'fa-pills', label: 'Medicine'},
            {id: 'ttv', icon: 'fa-stethoscope', label: 'TTV & GDS'},
            {id: 'visit', icon: 'fa-user-md', label: 'Visit Dokter'},
            {id: 'crisis', icon: 'fa-chart-pie', label: 'Crisis (BPSS)'},
            {id: 'program', icon: 'fa-list-check', label: 'Program'},
            {id: 'counseling', icon: 'fa-comments', label: 'Konseling'},
        ];

        html += `<div class="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">`;
        tabs.forEach(t => {
            html += `<button onclick="app.switchTab('${t.id}')" class="tab-btn ${this.activeTab === t.id ? 'active' : ''}"><i class="fas ${t.icon} mr-2"></i> ${t.label}</button>`;
        });
        html += `</div>`;

        // 3. Tab Content Area
        html += `<div id="tab-content" class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm min-h-[400px] fade-in relative">`;
        html += this.getTabContent(p, this.activeTab);
        html += `</div>`;

        container.innerHTML = html;

        // Init Chart if Crisis Tab
        if(this.activeTab === 'crisis') this.renderChart(p);
    },

    switchTab(tabId) {
        this.activeTab = tabId;
        this.renderPatientDetail();
    },

    getTabContent(p, tab) {
        // --- SEARCH HELPER ---
        const searchInput = `
            <div class="absolute top-6 right-6">
                <input onkeyup="app.searchTable(this)" placeholder="Cari di menu ini..." class="bg-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold outline-none focus:ring-1 ring-brand-200">
            </div>`;

        // --- 1. BIODATA ---
        if(tab === 'biodata') {
            return `
                <h3 class="font-bold text-lg text-brand-800 mb-6 border-b pb-2">Informasi Lengkap Pasien</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm">
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400">TTL / Usia</span>${p.reg.age} Tahun</div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400">Alamat</span>${p.reg.addr}</div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400">Pekerjaan</span>${p.reg.job}</div>
                    <div class="p-4 bg-slate-50 rounded-xl border"><span class="block text-xs font-bold text-slate-400">Penanggung Jawab</span>${p.reg.guardian}</div>
                    <div class="p-4 bg-slate-50 rounded-xl border col-span-1 md:col-span-2"><span class="block text-xs font-bold text-slate-400">Diagnosa & Planning</span>${p.diagnosis.plan}</div>
                    <div class="p-4 bg-amber-50 rounded-xl border border-amber-100 col-span-1 md:col-span-2"><span class="block text-xs font-bold text-amber-600">Kondisi Saat Ini</span>${p.history?.current || '-'}</div>
                </div>
                <button onclick="app.modalPatient('${p.id}')" class="mt-6 bg-brand-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow hover:bg-brand-700">EDIT BIODATA</button>
            `;
        }

        // --- 2. MEDICINE (STOK + LOGS) ---
        if(tab === 'medicine') {
            const stockHtml = (p.medicine?.stock || []).map((s, i) => {
                const sisa = s.init - s.used;
                return `
                <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center relative search-row">
                    <div><p class="font-bold text-sm">${s.name}</p><p class="text-[10px]">Sisa: <b class="${sisa<5?'text-red-500':''}">${sisa}</b> | Exp: ${s.exp}</p></div>
                    <div class="flex gap-2">
                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white" title="Minum"><i class="fas fa-check"></i></button>
                        <button onclick="app.delSubItem('medicine.stock', ${i})" class="text-red-300 hover:text-red-500 px-2"><i class="fas fa-trash"></i></button>
                    </div>
                </div>`;
            }).join('');

            const logHtml = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b last:border-0 hover:bg-slate-50 search-row">
                    <td class="py-2 text-xs text-slate-500">${l.time}</td>
                    <td class="py-2 font-bold text-slate-700">${l.name}</td>
                    <td class="py-2 text-xs">${l.pj}</td>
                    <td class="text-right"><button onclick="app.delSubItem('medicine.logs', ${i})" class="text-red-400"><i class="fas fa-times"></i></button></td>
                </tr>`).join('');

            return `
                ${searchInput}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
                    <div class="lg:col-span-1">
                        <div class="flex justify-between items-center mb-4"><h4 class="font-bold text-brand-800">STOK OBAT</h4><button onclick="app.modalStock('${p.id}')" class="text-[10px] bg-brand-600 text-white px-2 py-1 rounded font-bold">+ STOK</button></div>
                        <div class="space-y-2 max-h-[400px] overflow-y-auto">${stockHtml || '<p class="text-xs text-slate-400">Kosong</p>'}</div>
                    </div>
                    <div class="lg:col-span-2">
                        <h4 class="font-bold text-brand-800 mb-4">CATATAN MINUM OBAT</h4>
                        <div class="bg-white border rounded-xl overflow-hidden">
                            <table class="w-full text-left p-2"><thead class="bg-slate-50 text-xs text-slate-500"><tr><th class="p-2">Waktu</th><th>Obat</th><th>PJ</th><th class="text-right p-2">Del</th></tr></thead>
                            <tbody class="p-2">${logHtml}</tbody></table>
                        </div>
                    </div>
                </div>`;
        }

        // --- 3. TTV ---
        if(tab === 'ttv') {
            return `
                ${searchInput}
                <div class="flex justify-between items-center mb-4 mt-2">
                    <h4 class="font-bold text-brand-800">RIWAYAT TTV & GDS</h4>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">+ INPUT DATA</button>
                </div>
                <div class="overflow-x-auto rounded-xl border border-slate-200">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-50 text-slate-500 font-bold"><tr><th class="p-3">Waktu</th><th>TD</th><th>Nadi/RR</th><th>TB/BB</th><th>GDS</th><th class="text-right p-3">Aksi</th></tr></thead>
                        <tbody class="divide-y divide-slate-100">
                        ${(p.ttv||[]).map((t,i)=>`
                            <tr class="hover:bg-slate-50 search-row">
                                <td class="p-3">${t.time}</td>
                                <td class="p-3 font-bold text-brand-700">${t.td}</td>
                                <td class="p-3">${t.nadi} / ${t.rr}</td>
                                <td class="p-3">${t.tb}/${t.bb}</td>
                                <td class="p-3 font-bold">${t.gds}</td>
                                <td class="p-3 text-right"><button onclick="app.delSubItem('ttv',${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        // --- 4. VISIT DOKTER & 6. KONSELING (Mirip) ---
        if(tab === 'visit' || tab === 'counseling') {
            const isVisit = tab === 'visit';
            const dataArr = isVisit ? (p.visits || []) : (p.counseling || []);
            const title = isVisit ? "VISIT DOKTER" : "SESI KONSELING";
            
            return `
                ${searchInput}
                <div class="flex justify-between items-center mb-6 mt-2">
                    <h4 class="font-bold text-brand-800">RIWAYAT ${title}</h4>
                    <button onclick="app.modalSign('${p.id}', '${tab}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow">+ ${title} BARU</button>
                </div>
                <div class="grid grid-cols-1 gap-4">
                    ${dataArr.map((v, i) => `
                    <div class="border rounded-2xl p-4 flex gap-4 hover:shadow-md transition bg-slate-50 search-row">
                        <img src="${v.photo}" class="w-24 h-24 object-cover rounded-xl bg-white border cursor-pointer" onclick="Swal.fire({imageUrl: '${v.photo}', showConfirmButton:false})">
                        <div class="flex-1 flex flex-col justify-between">
                            <div>
                                <div class="flex justify-between"><h5 class="font-bold text-brand-800 text-sm">${v.time}</h5><button onclick="app.delSubItem('${isVisit?'visits':'counseling'}', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button></div>
                                <p class="text-xs text-slate-600 mt-1 line-clamp-2">"${v.note}"</p>
                            </div>
                            <div class="mt-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                                <span class="text-[9px] text-slate-400 uppercase font-bold">Tanda Tangan Digital:</span>
                                <img src="${v.sign}" class="h-8 bg-white px-2 rounded border border-slate-200">
                            </div>
                        </div>
                    </div>`).join('')}
                </div>`;
        }

        // --- 5. CRISIS (BPSS CHART) ---
        if(tab === 'crisis') {
            const bpss = p.crisis?.bpss || [];
            const listHtml = bpss.map((b,i) => `
                <tr class="border-b search-row"><td class="p-2 text-xs">Hari-${i+1}</td><td class="p-2 text-center">${b.total}</td><td class="text-right p-2"><button onclick="app.delSubItem('crisis.bpss',${i})" class="text-red-400"><i class="fas fa-trash"></i></button></td></tr>
            `).join('');

            return `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-brand-800">DATA HARIAN (BPSS)</h4>
                            <button onclick="app.modalCrisis('${p.id}')" class="bg-brand-600 text-white px-3 py-1 rounded text-xs font-bold">+ INPUT</button>
                        </div>
                        <div class="h-64 border rounded-xl p-2 bg-slate-50"><canvas id="crisisChart"></canvas></div>
                    </div>
                    <div>
                        <h4 class="font-bold text-brand-800 mb-4">LOG SKOR</h4>
                        <div class="border rounded-xl bg-white overflow-hidden max-h-64 overflow-y-auto">
                            <table class="w-full text-xs"><thead class="bg-slate-50"><tr><th class="p-2 text-left">Hari</th><th>Total Score</th><th class="text-right p-2">Del</th></tr></thead>
                            <tbody>${listHtml}</tbody></table>
                        </div>
                    </div>
                </div>`;
        }

        // --- 6. PROGRAM ---
        if(tab === 'program') {
            return `
                <div class="max-w-md mx-auto mt-6 text-center">
                    <div class="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-8 rounded-3xl shadow-xl mb-6">
                        <p class="text-xs font-bold opacity-70 mb-2 uppercase tracking-widest">Paket Saat Ini</p>
                        <h2 class="text-3xl font-black mb-1">${p.program?.type || 'BELUM ADA'}</h2>
                        <p class="text-lg font-semibold">${p.program?.duration || '-'}</p>
                    </div>
                    <button onclick="app.modalProgram('${p.id}')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold transition border border-slate-200">UBAH PAKET PROGRAM</button>
                </div>
            `;
        }
    },

    // --- MODALS ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT BIODATA" : "PASIEN BARU";
        const v = (val) => val || '';
        this.openModal(`
            <form onsubmit="event.preventDefault(); app.savePatient('${id||''}')" class="space-y-4">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center cursor-pointer relative">
                    <input type="file" id="p_photo" class="absolute inset-0 opacity-0 cursor-pointer">
                    <p class="text-xs text-slate-500">Klik Upload Foto</p>
                </div>
                <input id="p_name" class="input-modern" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" required>
                <div class="grid grid-cols-2 gap-3">
                    <input id="p_age" type="number" class="input-modern" value="${v(p?.reg.age)}" placeholder="Usia">
                    <input id="p_spot" class="input-modern border-red-200 bg-red-50" value="${v(p?.reg.spotcheck)}" placeholder="Spotcheck">
                </div>
                <input id="p_job" class="input-modern" value="${v(p?.reg.job)}" placeholder="Pekerjaan">
                <input id="p_addr" class="input-modern" value="${v(p?.reg.addr)}" placeholder="Alamat">
                <input id="p_guard" class="input-modern" value="${v(p?.reg.guardian)}" placeholder="Penanggung Jawab">
                <div class="border-t pt-2 mt-2"><p class="text-xs font-bold text-brand-600 mb-2">MEDIS</p>
                    <input id="m_dr" class="input-modern mb-2" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter DPJP">
                    <textarea id="m_plan" class="input-modern h-20" placeholder="Diagnosa & Plan">${v(p?.diagnosis.plan)}</textarea>
                </div>
                <button class="w-full bg-brand-700 text-white py-3 rounded-xl font-bold shadow-lg">SIMPAN</button>
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
            reg: { name: get('p_name'), age: get('p_age'), spotcheck: get('p_spot'), job: get('p_job'), addr: get('p_addr'), guardian: get('p_guard'), photo, timestamp: pOld?.reg.timestamp || new Date().toLocaleString() },
            diagnosis: { dr_name: get('m_dr'), plan: get('m_plan') },
            history: { current: '' },
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

    modalStock(id) {
        this.openModal(`
            <input id="s_name" class="input-modern mb-2" placeholder="Nama Obat">
            <input id="s_init" type="number" class="input-modern mb-2" placeholder="Jumlah Stok">
            <input id="s_exp" type="date" class="input-modern mb-4">
            <button onclick="app.saveStock('${id}')" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">TAMBAH</button>
        `);
    },
    saveStock(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({name:document.getElementById('s_name').value, init:document.getElementById('s_init').value, exp:document.getElementById('s_exp').value, used:0});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalUseMed(id, idx) {
        this.openModal(`
            <h3 class="font-bold text-center mb-4">Konfirmasi Minum</h3>
            <input id="u_pj" class="input-modern mb-4" placeholder="Nama PJ (Perawat)">
            <button onclick="app.execUseMed('${id}', ${idx})" class="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">CATAT</button>
        `);
    },
    execUseMed(id, idx) {
        const p = this.data.patients.find(x=>x.id===id);
        const s = p.medicine.stock[idx];
        if(s.init - s.used <= 0) return Swal.fire('Habis', 'Stok 0', 'error');
        s.used++;
        p.medicine.logs.unshift({time:new Date().toLocaleString(), name:s.name, pj:document.getElementById('u_pj').value});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalTTV(id) {
        this.openModal(`
            <div class="grid grid-cols-2 gap-3">
                <input id="t_td" class="input-modern col-span-2" placeholder="Tensi (120/80)">
                <input id="t_nadi" class="input-modern" placeholder="Nadi">
                <input id="t_rr" class="input-modern" placeholder="RR">
                <input id="t_tb" class="input-modern" placeholder="TB (cm)">
                <input id="t_bb" class="input-modern" placeholder="BB (kg)">
                <input id="t_gds" class="input-modern col-span-2" placeholder="GDS">
                <button onclick="app.saveTTV('${id}')" class="col-span-2 bg-brand-600 text-white py-3 rounded-lg font-bold mt-2">SIMPAN</button>
            </div>
        `);
    },
    saveTTV(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.ttv) p.ttv = [];
        p.ttv.unshift({time:new Date().toLocaleString(), td:document.getElementById('t_td').value, nadi:document.getElementById('t_nadi').value, rr:document.getElementById('t_rr').value, tb:document.getElementById('t_tb').value, bb:document.getElementById('t_bb').value, gds:document.getElementById('t_gds').value});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalSign(id, type) { // Generic for Visit & Counseling
        this.openModal(`
            <div class="space-y-3">
                <div class="border-dashed border-2 p-4 text-center rounded-xl"><input type="file" id="v_photo"><p class="text-xs">Foto Kegiatan</p></div>
                <textarea id="v_note" class="input-modern h-20" placeholder="Catatan / Hasil..."></textarea>
                <div class="bg-slate-50 border p-2 rounded-xl"><canvas id="sig-pad" class="bg-white border w-full h-32 rounded"></canvas><button onclick="app.signaturePad.clear()" class="text-xs text-red-500 mt-1">Clear</button></div>
                <button onclick="app.saveSign('${id}', '${type}')" class="w-full bg-brand-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
            </div>
        `);
        setTimeout(()=>{const c=document.getElementById('sig-pad'); c.width=c.parentElement.clientWidth-16; c.height=128; this.signaturePad=new SignaturePad(c);},300);
    },
    async saveSign(id, type) {
        if(this.signaturePad.isEmpty()) return Swal.fire('Error','TTD Wajib','error');
        const p = this.data.patients.find(x=>x.id===id);
        const arr = type === 'visit' ? (p.visits || (p.visits=[])) : (p.counseling || (p.counseling=[]));
        const f = document.getElementById('v_photo').files[0];
        const photo = f ? await this.toBase64(f) : 'https://via.placeholder.com/150';
        arr.unshift({time:new Date().toLocaleString(), note:document.getElementById('v_note').value, photo, sign:this.signaturePad.toDataURL()});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    modalCrisis(id) {
        this.openModal(`
            <p class="text-xs text-center mb-2">Input Skor 1-5</p>
            <div class="grid grid-cols-2 gap-2">
                <input id="c_bio" type="number" class="input-modern" placeholder="Biological">
                <input id="c_psy" type="number" class="input-modern" placeholder="Psychological">
                <input id="c_soc" type="number" class="input-modern" placeholder="Social">
                <input id="c_spi" type="number" class="input-modern" placeholder="Spiritual">
                <button onclick="app.saveCrisis('${id}')" class="col-span-2 bg-brand-600 text-white py-2 rounded-lg font-bold mt-2">SIMPAN SKOR</button>
            </div>
        `);
    },
    saveCrisis(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.crisis) p.crisis = {bpss:[]};
        const bio= +document.getElementById('c_bio').value, psy= +document.getElementById('c_psy').value, soc= +document.getElementById('c_soc').value, spi= +document.getElementById('c_spi').value;
        p.crisis.bpss.push({bio, psy, soc, spi, total: bio+psy+soc+spi});
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

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
    saveProgram(id) {
        const p = this.data.patients.find(x=>x.id===id);
        p.program = {duration: document.getElementById('pr_dur').value, type: document.getElementById('pr_type').value};
        this.closeModal(); this.saveDB(); this.renderPatientDetail();
    },

    // --- CHART & UTILS ---
    renderChart(p) {
        const ctx = document.getElementById('crisisChart');
        if(!ctx || !p.crisis?.bpss?.length) return;
        const last = p.crisis.bpss[p.crisis.bpss.length-1];
        if(this.chartInstance) this.chartInstance.destroy();
        this.chartInstance = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Biological', 'Psychological', 'Social', 'Spiritual'],
                datasets: [{ label: 'Skor Terkini', data: [last.bio, last.psy, last.soc, last.spi], backgroundColor: 'rgba(190, 18, 60, 0.2)', borderColor: '#be123c', borderWidth: 2 }]
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
        Swal.fire({title:'Hapus?', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>{
            if(r.isConfirmed) {
                const p = this.data.patients.find(x=>x.id===this.activePatientId);
                let t = p; const parts = path.split('.');
                for(let i=0; i<parts.length-1; i++) t = t[parts[i]];
                t[parts[parts.length-1]].splice(idx, 1);
                this.saveDB(); this.renderPatientDetail();
            }
        });
    },
    
    // --- UTILS ---
    openModal(html) { document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise((r,j) => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    deletePatient(id) { Swal.fire({title:'Hapus Pasien?', icon:'warning', showCancelButton:true, confirmButtonColor:'#d33'}).then(r=>{if(r.isConfirmed){this.data.patients=this.data.patients.filter(x=>x.id!==id); this.saveDB(); this.renderDashboard();}})},

    // --- FULL EXPORT FEATURES ---
    async exportToWord(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, HeadingLevel, ImageRun } = docx;

        const b64Blob = (b64) => { try{ return Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0)) }catch(e){return null} };
        
        const children = [
            new Paragraph({ text: "REKAM MEDIS PASIEN MMRC", heading: HeadingLevel.HEADING_1, alignment: "center" }),
            new Paragraph({ text: `Dicetak: ${new Date().toLocaleString()}`, alignment: "center" }),
            new Paragraph({ text: "" }),
            new Paragraph({ text: "1. BIODATA & PROGRAM", heading: HeadingLevel.HEADING_2 }),
            new Paragraph(`Nama: ${p.reg.name} | Usia: ${p.reg.age} | ID: ${p.id}`),
            new Paragraph(`Diagnosa: ${p.diagnosis.plan}`),
            new Paragraph(`Program: ${p.program?.type || '-'} (${p.program?.duration || '-'})`),
            new Paragraph({ text: "" }),
        ];

        // Helper Image
        const addImg = (b64, w=100, h=100) => { const d=b64Blob(b64); if(d) children.push(new Paragraph({children:[new ImageRun({data:d, transformation:{width:w, height:h}})]})); };

        // 2. MEDICINE
        children.push(new Paragraph({ text: "2. RIWAYAT OBAT", heading: HeadingLevel.HEADING_2 }));
        (p.medicine?.logs || []).forEach(l => children.push(new Paragraph(`${l.time} - ${l.name} (PJ: ${l.pj})`)));

        // 3. TTV
        children.push(new Paragraph({ text: "3. DATA TTV", heading: HeadingLevel.HEADING_2 }));
        (p.ttv || []).forEach(t => children.push(new Paragraph(`${t.time}: TD ${t.td}, Nadi ${t.nadi}, GDS ${t.gds}`)));

        // 4. VISIT
        children.push(new Paragraph({ text: "4. VISIT DOKTER", heading: HeadingLevel.HEADING_2 }));
        (p.visits || []).forEach(v => {
            children.push(new Paragraph({text: v.time, bold:true}));
            children.push(new Paragraph(v.note));
            if(v.photo) addImg(v.photo, 200, 150);
            if(v.sign) { children.push(new Paragraph("TTD Dokter:")); addImg(v.sign, 100, 50); }
            children.push(new Paragraph(""));
        });

        // 5. KONSELING
        children.push(new Paragraph({ text: "5. KONSELING", heading: HeadingLevel.HEADING_2 }));
        (p.counseling || []).forEach(c => {
            children.push(new Paragraph({text: c.time, bold:true}));
            children.push(new Paragraph(c.note));
            if(c.photo) addImg(c.photo, 200, 150);
            if(c.sign) { children.push(new Paragraph("TTD Konselor:")); addImg(c.sign, 100, 50); }
            children.push(new Paragraph(""));
        });

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url; a.download = `RekamMedis_${p.reg.name}.docx`; a.click();
    },

    exportToExcel(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const wb = XLSX.utils.book_new();

        // Sheet 1: Biodata
        const bio = [{ Nama: p.reg.name, Usia: p.reg.age, Alamat: p.reg.addr, Diagnosa: p.diagnosis.plan, Program: p.program?.type }];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata");

        // Sheet 2: Obat
        const meds = (p.medicine?.logs||[]).map(l=>({Waktu:l.time, Obat:l.name, PJ:l.pj}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meds), "Obat");

        // Sheet 3: TTV
        const ttv = (p.ttv||[]).map(t=>({Waktu:t.time, TD:t.td, GDS:t.gds}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ttv), "TTV");

        // Sheet 4: Visit & Konseling
        const visits = (p.visits||[]).map(v=>({Tipe:'Dokter', Waktu:v.time, Note:v.note}));
        const cons = (p.counseling||[]).map(c=>({Tipe:'Konseling', Waktu:c.time, Note:c.note}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([...visits, ...cons]), "Visit_Konseling");

        // Sheet 5: Crisis
        const crisis = (p.crisis?.bpss||[]).map((b,i)=>({Hari:i+1, Total:b.total}));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crisis), "Crisis");

        XLSX.writeFile(wb, `DataLengkap_${p.reg.name}.xlsx`);
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app = app; app.init(); });
