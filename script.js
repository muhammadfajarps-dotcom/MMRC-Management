// ============================================================
// 1. SETUP FIREBASE & CONFIG
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

// Initialize Firebase safely
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = typeof firebase !== 'undefined' ? firebase.database() : null;

// ============================================================
// 2. MAIN APPLICATION LOGIC
// ============================================================
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,
    chartInstances: {},

    // --- INIT ---
    init() {
        console.log("System Initialized");
        // Check if previously logged in (optional feature)
        // this.loadDB(); 
    },

    // --- DATABASE (SAVE/LOAD) ---
    saveDB() {
        // Simpan ke LocalStorage (Cadangan)
        try {
            localStorage.setItem('MMRC_DATA_V4', JSON.stringify(this.data));
            
            // Simpan ke Firebase (Utama)
            if(db) {
                db.ref('mmrc_data').set(this.data).catch(err => console.warn("Offline Mode:", err));
            }
        } catch(e) { console.error("Save Error", e); }
    },

    loadDB() {
        // Load Local
        const local = localStorage.getItem('MMRC_DATA_V4');
        if(local) {
            try { this.data = JSON.parse(local); } catch(e){}
        }
        if(!this.data.patients) this.data.patients = [];

        // Sync Firebase
        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                const cloudData = snap.val();
                if(cloudData) {
                    // Logic agar tidak menimpa saat sedang mengetik (simple check)
                    const modalOpen = !document.getElementById('modal-container').classList.contains('hidden');
                    if(!modalOpen) {
                        this.data = cloudData;
                        if(!this.data.patients) this.data.patients = [];
                        localStorage.setItem('MMRC_DATA_V4', JSON.stringify(cloudData));
                        if(document.getElementById('app-layer').style.display !== 'none') this.render();
                    }
                }
            });
        }
    },

    // --- NAVIGATION & AUTH ---
    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;

        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.nav('dashboard');
            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil',
                text: 'Selamat bekerja!',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Akses Ditolak', 'Username atau Password salah.', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        
        // Update Sidebar Active State (Premium Look)
        document.querySelectorAll('.nav-item').forEach(btn => {
            btn.classList.remove('bg-brand-50', 'text-brand-700', 'shadow-sm', 'border', 'border-brand-100');
            btn.classList.add('text-slate-500');
        });
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) {
            activeBtn.classList.add('bg-brand-50', 'text-brand-700', 'shadow-sm', 'border', 'border-brand-100');
            activeBtn.classList.remove('text-slate-500');
        }

        // Update Title
        const titles = {
            'dashboard': 'DASHBOARD PASIEN',
            'medicine': 'MANAJEMEN OBAT',
            'ttv': 'TTV & GULA DARAH',
            'visit': 'VISIT DOKTER',
            'crisis': 'GRAFIK CRISIS (BPSS)',
            'program': 'PROGRAM LAYANAN',
            'therapy': 'CATATAN TERAPI'
        };
        document.getElementById('page-title').innerText = titles[page];
        
        this.render();
    },

    // --- RENDER ENGINE (TAMPILAN) ---
    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = ''; // Clear content
        container.classList.add('fade-in'); // Add animation

        if(!this.data.patients) this.data.patients = [];

        // Routing Views
        switch(this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
        }

        // Remove animation class after render
        setTimeout(() => container.classList.remove('fade-in'), 500);
    },

    // -------------------------------------------------------------------------
    // VIEW: DASHBOARD (PREMIUM CARDS)
    // -------------------------------------------------------------------------
    viewDashboard(container) {
        // Button Add
        const header = document.createElement('div');
        header.className = "flex justify-end mb-6";
        header.innerHTML = `
            <button onclick="app.modalPatient()" class="bg-gradient-to-r from-brand-700 to-brand-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-brand-200 hover:-translate-y-1 transition flex items-center gap-2">
                <i class="fas fa-plus-circle"></i> REGISTRASI PASIEN BARU
            </button>`;
        container.appendChild(header);

        if(this.data.patients.length === 0) {
            container.innerHTML += `<div class="text-center mt-20 text-slate-400"><i class="fas fa-folder-open text-4xl mb-4 opacity-50"></i><p>Belum ada data pasien.</p></div>`;
            return;
        }

        const grid = document.createElement('div');
        grid.className = "grid grid-cols-1 gap-6";
        
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-0 rounded-3xl shadow-sm border border-slate-100 hover:shadow-lg transition-all search-item overflow-hidden";
            card.innerHTML = `
                <div class="flex flex-col md:flex-row">
                    <div class="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center text-center">
                        <div class="relative mb-4">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white">
                            <span class="absolute -bottom-2 -right-2 bg-brand-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">ID: ${p.id.slice(-4)}</span>
                        </div>
                        <h3 class="font-extrabold text-lg text-slate-800">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-semibold mb-4">${p.reg.age} Tahun • ${p.reg.addr}</p>
                        
                        <div class="w-full grid grid-cols-2 gap-2 text-[10px] text-left bg-white p-3 rounded-xl border border-slate-100">
                            <div><span class="text-slate-400 block">Masuk:</span> <b>${p.reg.timestamp.split(',')[0]}</b></div>
                            <div><span class="text-slate-400 block">Wali:</span> <b>${p.reg.guardian}</b></div>
                        </div>
                    </div>

                    <div class="w-full md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Diagnosa Medis</span>
                                <span class="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Dr. ${p.diagnosis.dr_name}</span>
                            </div>
                            <div class="space-y-3">
                                <div class="p-3 bg-brand-50/50 rounded-xl border border-brand-50">
                                    <p class="text-[10px] text-brand-800 font-bold uppercase mb-1">Planning / Tindakan</p>
                                    <p class="text-sm text-slate-700 font-medium leading-relaxed">${p.diagnosis.plan || '-'}</p>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">Kondisi Saat Ini</p>
                                        <p class="text-xs text-slate-700 font-bold mt-1">${p.history.current || '-'}</p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase">Spot Check</p>
                                        <p class="text-xs text-red-600 font-bold mt-1">${p.reg.spotcheck || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onclick="app.modalPatient('${p.id}')" class="px-4 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-bold transition">
                                <i class="fas fa-edit mr-1"></i> Edit
                            </button>
                            <button onclick="app.deletePatient('${p.id}')" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition">
                                <i class="fas fa-trash-alt mr-1"></i> Hapus
                            </button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        container.appendChild(grid);
    },

    // -------------------------------------------------------------------------
    // VIEW: MEDICINE
    // -------------------------------------------------------------------------
    viewMedicine(container) {
        if(!this.data.patients.length) { container.innerHTML = `<p class="text-center text-slate-400 mt-10">Data pasien kosong.</p>`; return; }

        this.data.patients.forEach(p => {
            const wrapper = document.createElement('div');
            wrapper.className = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 search-item";
            
            // Header Pasien
            wrapper.innerHTML = `
                <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold">
                            <i class="fas fa-user-injured"></i>
                        </div>
                        <h3 class="font-bold text-lg text-slate-800">${p.reg.name}</h3>
                    </div>
                    <button onclick="app.modalStock('${p.id}')" class="text-xs font-bold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow">+ Tambah Obat</button>
                </div>
            `;

            const content = document.createElement('div');
            content.className = "grid grid-cols-1 lg:grid-cols-2 gap-8";

            // 1. Stock Cards
            const stockDiv = document.createElement('div');
            stockDiv.innerHTML = `<h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Stok Tersedia</h4>`;
            const stockGrid = document.createElement('div');
            stockGrid.className = "grid grid-cols-1 gap-3";
            
            (p.medicine?.stock || []).forEach((s, idx) => {
                const sisa = s.init - s.used;
                const low = sisa < 5;
                stockGrid.innerHTML += `
                    <div class="flex justify-between items-center p-4 rounded-xl border ${low ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} relative group">
                        <div>
                            <p class="font-bold text-slate-800 text-sm">${s.name}</p>
                            <p class="text-[10px] text-slate-500">Exp: ${s.exp} | Awal: ${s.init}</p>
                        </div>
                        <div class="flex items-center gap-4">
                            <div class="text-right">
                                <span class="block text-2xl font-black ${low ? 'text-red-600' : 'text-slate-700'}">${sisa}</span>
                                <span class="text-[8px] font-bold text-slate-400">TABLET</span>
                            </div>
                            <button onclick="app.modalUseMed('${p.id}', ${idx})" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center shadow-sm" title="Minum Obat">
                                <i class="fas fa-check"></i>
                            </button>
                            <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${idx})" class="w-6 h-6 rounded text-slate-300 hover:text-red-500 transition">
                                <i class="fas fa-trash text-xs"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            stockDiv.appendChild(stockGrid);

            // 2. Logs Table
            const logDiv = document.createElement('div');
            logDiv.innerHTML = `<h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Riwayat Minum</h4>`;
            
            let logRows = (p.medicine?.logs || []).map((l, i) => `
                <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition">
                    <td class="py-3 pl-2 text-slate-500">${l.time.split(' ')[0]} <br> <span class="text-[9px]">${l.time.split(' ')[1]}</span></td>
                    <td class="py-3 font-bold text-slate-700">${l.name}</td>
                    <td class="py-3 text-slate-600">${l.pj}</td>
                    <td class="py-3 text-right pr-2">
                        <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-300 hover:text-red-500"><i class="fas fa-times"></i></button>
                    </td>
                </tr>
            `).join('');

            logDiv.innerHTML += `
                <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                    <table class="w-full text-[11px] text-left">
                        <thead class="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th class="p-3">Waktu</th><th>Obat</th><th>PJ</th><th class="text-right p-3">Hapus</th></tr></thead>
                        <tbody>${logRows}</tbody>
                    </table>
                </div>
            `;

            content.appendChild(stockDiv);
            content.appendChild(logDiv);
            wrapper.appendChild(content);
            container.appendChild(wrapper);
        });
    },

    // -------------------------------------------------------------------------
    // VIEW: TTV
    // -------------------------------------------------------------------------
    viewTTV(container) {
        if(!this.data.patients.length) return;
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 search-item";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-brand-800">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-slate-100 hover:bg-brand-50 text-brand-700 px-3 py-1.5 rounded-lg text-xs font-bold transition">Input TTV Baru</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left text-slate-600">
                        <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]">
                            <tr><th class="p-3 rounded-l-lg">Tanggal</th><th>TD (mmHg)</th><th>Nadi/RR</th><th>Suhu</th><th>GDS</th><th class="p-3 rounded-r-lg text-right">Aksi</th></tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(p.ttv || []).map((t, i) => `
                                <tr class="hover:bg-slate-50 transition">
                                    <td class="p-3">${t.time}</td>
                                    <td class="p-3 font-bold text-brand-700">${t.td}</td>
                                    <td class="p-3">${t.nadi} x/m | ${t.rr} x/m</td>
                                    <td class="p-3">${t.temp}°C</td>
                                    <td class="p-3 font-bold">${t.gds}</td>
                                    <td class="p-3 text-right">
                                        <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
            container.appendChild(card);
        });
    },

    // -------------------------------------------------------------------------
    // MODAL HANDLERS (LOGIC)
    // -------------------------------------------------------------------------
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN";
        
        const v = (val) => val || '';
        const html = `
            <form id="form-patient" class="space-y-6">
                <div>
                    <h4 class="text-xs font-bold text-brand-600 uppercase mb-3 border-b pb-1">1. Biodata Pribadi</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="col-span-2 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition cursor-pointer relative">
                            <input type="file" id="p_photo" class="absolute inset-0 opacity-0 cursor-pointer w-full h-full">
                            <i class="fas fa-camera text-slate-400 text-2xl mb-2"></i>
                            <p class="text-xs text-slate-500 font-bold">Klik untuk upload foto</p>
                        </div>
                        <input class="input-modern" id="p_name" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" required>
                        <input class="input-modern" id="p_age" value="${v(p?.reg.age)}" type="number" placeholder="Usia">
                        <input class="input-modern" id="p_job" value="${v(p?.reg.job)}" placeholder="Pekerjaan">
                        <input class="input-modern" id="p_addr" value="${v(p?.reg.addr)}" placeholder="Alamat Domisili">
                        <input class="input-modern" id="p_guard" value="${v(p?.reg.guardian)}" placeholder="Nama Wali / PJ">
                        <input class="input-modern border-red-200 bg-red-50 text-red-800" id="p_spot" value="${v(p?.reg.spotcheck)}" placeholder="Catatan Khusus / Spotcheck">
                    </div>
                </div>

                <div>
                    <h4 class="text-xs font-bold text-brand-600 uppercase mb-3 border-b pb-1">2. Data Medis</h4>
                    <div class="space-y-3">
                        <input class="input-modern" id="m_dr" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter Penanggung Jawab (DPJP)">
                        <textarea class="input-modern h-20" id="m_plan" placeholder="Planning / Rencana Tindakan">${v(p?.diagnosis.plan)}</textarea>
                        <textarea class="input-modern h-20" id="m_curr" placeholder="Kondisi Saat Ini">${v(p?.history.current)}</textarea>
                    </div>
                </div>

                <button type="button" onclick="app.savePatient('${id || ''}')" class="w-full bg-brand-700 hover:bg-brand-800 text-white py-4 rounded-xl font-bold shadow-lg shadow-brand-200 transition">
                    SIMPAN DATA
                </button>
            </form>
        `;
        this.openModal(html);
    },

    async savePatient(id) {
        const getVal = (id) => document.getElementById(id).value;
        
        let photoData = "https://via.placeholder.com/150";
        // Check existing photo if edit
        if(id) {
            const old = this.data.patients.find(x => x.id === id);
            if(old) photoData = old.reg.photo;
        }
        // Check new photo upload
        const fileInput = document.getElementById('p_photo');
        if(fileInput.files.length > 0) {
            photoData = await this.toBase64(fileInput.files[0]);
        }

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: {
                name: getVal('p_name'), age: getVal('p_age'), job: getVal('p_job'),
                addr: getVal('p_addr'), guardian: getVal('p_guard'), spotcheck: getVal('p_spot'),
                photo: photoData,
                timestamp: new Date().toLocaleString()
            },
            diagnosis: { dr_name: getVal('m_dr'), plan: getVal('m_plan') },
            history: { current: getVal('m_curr') },
            // Preserve existing sub-data if editing, else init empty
            medicine: id ? this.data.patients.find(x => x.id === id).medicine : { stock: [], logs: [] },
            ttv: id ? this.data.patients.find(x => x.id === id).ttv : [],
            visits: id ? this.data.patients.find(x => x.id === id).visits : [],
            crisis: id ? this.data.patients.find(x => x.id === id).crisis : [],
            program: id ? this.data.patients.find(x => x.id === id).program : {},
            therapy: id ? this.data.patients.find(x => x.id === id).therapy : ""
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = newP;
        } else {
            this.data.patients.push(newP);
        }

        this.closeModal();
        this.render();
        this.saveDB();
        Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
    },

    // Stock Modal
    modalStock(id) {
        this.openModal(`
            <div class="space-y-4">
                <input id="s_name" class="input-modern" placeholder="Nama Obat">
                <div class="grid grid-cols-2 gap-4">
                    <input id="s_init" type="number" class="input-modern" placeholder="Jumlah (Tablet)">
                    <input id="s_exp" type="date" class="input-modern">
                </div>
                <button onclick="app.saveStock('${id}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold">TAMBAH STOK</button>
            </div>
        `);
    },
    saveStock(id) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine) p.medicine = { stock: [], logs: [] }; // Safety check
        
        p.medicine.stock.push({
            name: document.getElementById('s_name').value,
            init: document.getElementById('s_init').value,
            exp: document.getElementById('s_exp').value,
            used: 0
        });
        this.closeModal(); this.render(); this.saveDB();
    },

    modalUseMed(id, idx) {
        this.openModal(`
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2"><i class="fas fa-pills text-2xl"></i></div>
                <h3 class="font-bold text-slate-800">Konfirmasi Minum Obat</h3>
            </div>
            <input id="u_pj" class="input-modern mb-4" placeholder="Nama Perawat (PJ)">
            <button onclick="app.execUseMed('${id}', ${idx})" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">KONFIRMASI</button>
        `);
    },
    execUseMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const stock = p.medicine.stock[idx];
        
        if(stock.init - stock.used <= 0) { Swal.fire('Habis', 'Stok obat habis!', 'error'); return; }
        
        stock.used++;
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift({
            time: new Date().toLocaleString(),
            name: stock.name,
            pj: document.getElementById('u_pj').value
        });
        this.closeModal(); this.render(); this.saveDB();
    },

    // TTV Modal
    modalTTV(id) {
        this.openModal(`
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" class="input-modern col-span-2" placeholder="Tensi (ex: 120/80)">
                <input id="t_nadi" class="input-modern" placeholder="Nadi (bpm)">
                <input id="t_rr" class="input-modern" placeholder="RR (x/m)">
                <input id="t_temp" class="input-modern" placeholder="Suhu (C)">
                <input id="t_gds" class="input-modern" placeholder="Gula Darah (GDS)">
                <button onclick="app.saveTTV('${id}')" class="col-span-2 bg-brand-700 text-white py-3 rounded-xl font-bold mt-2">SIMPAN TTV</button>
            </div>
        `);
    },
    saveTTV(id) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.ttv) p.ttv = [];
        p.ttv.unshift({
            time: new Date().toLocaleString(),
            td: document.getElementById('t_td').value,
            nadi: document.getElementById('t_nadi').value,
            rr: document.getElementById('t_rr').value,
            temp: document.getElementById('t_temp').value,
            gds: document.getElementById('t_gds').value
        });
        this.closeModal(); this.render(); this.saveDB();
    },

    // -------------------------------------------------------------------------
    // VISIT & SIGNATURE
    // -------------------------------------------------------------------------
    viewVisit(container) {
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 search-item";
            
            let visitsHtml = (p.visits || []).map((v, i) => `
                <div class="border rounded-2xl p-4 flex gap-4 hover:shadow-md transition bg-slate-50">
                    <img src="${v.photo}" class="w-32 h-32 object-cover rounded-xl bg-white border">
                    <div class="flex-1">
                        <div class="flex justify-between">
                            <h5 class="font-bold text-brand-800 text-sm mb-1">${v.time}</h5>
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                        </div>
                        <p class="text-xs text-slate-600 mb-2 italic">"${v.note}"</p>
                        <div class="mt-2 border-t pt-2 w-32">
                            <p class="text-[9px] text-slate-400">Tanda Tangan Dokter:</p>
                            <img src="${v.sign}" class="h-8">
                        </div>
                    </div>
                </div>
            `).join('');

            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-800">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ Visit Baru</button>
                </div>
                <div class="space-y-4">${visitsHtml || '<p class="text-slate-400 text-xs">Belum ada visit.</p>'}</div>
            `;
            container.appendChild(card);
        });
    },

    modalVisit(id) {
        this.openModal(`
            <div class="space-y-4">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center">
                    <p class="text-xs text-slate-400 mb-2">FOTO KEGIATAN:</p>
                    <input type="file" id="v_photo">
                </div>
                <textarea id="v_note" class="input-modern h-24" placeholder="Catatan Perkembangan Pasien..."></textarea>
                <div class="bg-slate-50 p-2 rounded-xl border">
                    <p class="text-[10px] text-slate-400 mb-1 ml-1">TANDA TANGAN DOKTER:</p>
                    <canvas id="sig-pad" class="bg-white border w-full h-32 rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-xs text-red-500 mt-1">Hapus TTD</button>
                </div>
                <button onclick="app.saveVisit('${id}')" class="w-full bg-brand-700 text-white py-3 rounded-xl font-bold">SIMPAN VISIT</button>
            </div>
        `);
        // Init Signature Pad safely
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            if(canvas) {
                canvas.width = canvas.parentElement.clientWidth - 16;
                canvas.height = 128;
                this.signaturePad = new SignaturePad(canvas);
            }
        }, 300);
    },

    async saveVisit(id) {
        if(this.signaturePad.isEmpty()) { Swal.fire('Error', 'Tanda tangan wajib!', 'error'); return; }
        
        const fileIn = document.getElementById('v_photo');
        let photo = 'https://via.placeholder.com/150';
        if(fileIn.files[0]) photo = await this.toBase64(fileIn.files[0]);

        const p = this.data.patients.find(x => x.id === id);
        if(!p.visits) p.visits = [];
        
        p.visits.unshift({
            time: new Date().toLocaleString(),
            note: document.getElementById('v_note').value,
            photo: photo,
            sign: this.signaturePad.toDataURL()
        });
        this.closeModal(); this.render(); this.saveDB();
    },

    // -------------------------------------------------------------------------
    // UTILS & EXPORTS
    // -------------------------------------------------------------------------
    openModal(htmlContent) {
        const c = document.getElementById('modal-container');
        document.getElementById('modal-body').innerHTML = htmlContent;
        c.classList.remove('hidden');
    },
    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },

    toBase64: file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    }),

    deletePatient(id) {
        Swal.fire({
            title: 'Hapus Pasien?',
            text: "Data tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(p => p.id !== id);
                this.saveDB(); this.render();
                Swal.fire('Terhapus!', '', 'success');
            }
        });
    },

    delSubItem(pid, type, index) {
        const p = this.data.patients.find(x => x.id === pid);
        if(type === 'medicine.stock') p.medicine.stock.splice(index, 1);
        if(type === 'medicine.logs') p.medicine.logs.splice(index, 1);
        if(type === 'ttv') p.ttv.splice(index, 1);
        if(type === 'visits') p.visits.splice(index, 1);
        this.saveDB(); this.render();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    // EXPORT FEATURES
    exportAllExcel() {
        if(!this.data.patients.length) return Swal.fire('Kosong', 'Tidak ada data', 'info');
        
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Biodata
        const dataReg = this.data.patients.map(p => ({
            Nama: p.reg.name, Usia: p.reg.age, Alamat: p.reg.addr,
            Dokter: p.diagnosis.dr_name, Diagnosa: p.diagnosis.plan
        }));
        const ws1 = XLSX.utils.json_to_sheet(dataReg);
        XLSX.utils.book_append_sheet(wb, ws1, "Data Pasien");

        XLSX.writeFile(wb, "MMRC_Database_Full.xlsx");
    },

    async exportToWord() {
        if(!this.data.patients.length) return Swal.fire('Kosong', 'Tidak ada data', 'info');
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const children = [new Paragraph({ text: "LAPORAN HARIAN MMRC", heading: HeadingLevel.HEADING_1 })];

        this.data.patients.forEach(p => {
            children.push(new Paragraph({ text: `PASIEN: ${p.reg.name}`, heading: HeadingLevel.HEADING_2 }));
            children.push(new Paragraph(`Diagnosa: ${p.diagnosis.plan || '-'}`));
            children.push(new Paragraph(`Kondisi: ${p.history.current || '-'}`));
            children.push(new Paragraph("")); // Spacer
        });

        const doc = new Document({ sections: [{ children: children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "Laporan_MMRC.docx"; a.click();
    }
};

// Start System safely
document.addEventListener('DOMContentLoaded', () => {
    window.app = app;
    app.init();
});
