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

    init() {
        console.log("MMRC System V5 Ready");
        // this.loadDB(); // Opsional: Auto load jika tidak mau login terus
    },

    saveDB() {
        try {
            localStorage.setItem('MMRC_DATA_V5', JSON.stringify(this.data));
            if(db) db.ref('mmrc_data').set(this.data).catch(err => console.warn("Offline:", err));
        } catch(e) { console.error("Save Error", e); }
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATA_V5');
        if(local) {
            try { this.data = JSON.parse(local); } catch(e){}
        }
        if(!this.data.patients) this.data.patients = [];

        if(db) {
            db.ref('mmrc_data').on('value', snap => {
                const cloudData = snap.val();
                if(cloudData) {
                    const modalOpen = !document.getElementById('modal-container').classList.contains('hidden');
                    if(!modalOpen) {
                        this.data = cloudData;
                        if(!this.data.patients) this.data.patients = [];
                        localStorage.setItem('MMRC_DATA_V5', JSON.stringify(cloudData));
                        if(document.getElementById('app-layer').style.display !== 'none') this.render();
                    }
                }
            });
        }
    },

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
        
        // Update Sidebar Styles via script (Syncs with CSS classes)
        document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');

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

    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = ''; 
        container.classList.remove('fade-in'); 
        void container.offsetWidth; // Trigger reflow
        container.classList.add('fade-in');

        if(!this.data.patients) this.data.patients = [];

        switch(this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
        }
    },

    // --- DASHBOARD ---
    viewDashboard(container) {
        const header = document.createElement('div');
        header.className = "flex justify-end mb-6";
        header.innerHTML = `
            <button onclick="app.modalPatient()" class="bg-gradient-to-r from-brand-700 to-brand-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-brand-200/50 hover:-translate-y-1 transition flex items-center gap-2">
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
            card.className = "bg-white rounded-3xl shadow-sm border border-slate-100 search-item overflow-hidden";
            card.innerHTML = `
                <div class="flex flex-col md:flex-row">
                    <div class="w-full md:w-1/3 bg-slate-50 p-6 border-b md:border-b-0 md:border-r border-slate-100 flex flex-col items-center text-center">
                        <div class="relative mb-4">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white">
                            <span class="absolute -bottom-2 -right-2 bg-brand-600 text-white text-[10px] px-2 py-1 rounded-full font-bold">ID: ${p.id.slice(-4)}</span>
                        </div>
                        <h3 class="font-extrabold text-lg text-slate-800">${p.reg.name}</h3>
                        <p class="text-xs text-slate-500 font-semibold mb-4">${p.reg.age} Tahun • ${p.reg.addr}</p>
                    </div>
                    <div class="w-full md:w-2/3 p-6 flex flex-col justify-between">
                        <div>
                            <div class="flex items-center gap-2 mb-4">
                                <span class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Diagnosa</span>
                                <span class="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">Dr. ${p.diagnosis.dr_name}</span>
                            </div>
                            <div class="space-y-3">
                                <div class="p-3 bg-brand-50/50 rounded-xl border border-brand-50">
                                    <p class="text-[10px] text-brand-800 font-bold uppercase mb-1">Planning</p>
                                    <p class="text-sm text-slate-700 font-medium leading-relaxed">${p.diagnosis.plan || '-'}</p>
                                </div>
                            </div>
                        </div>
                        <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                            <button onclick="app.modalPatient('${p.id}')" class="px-4 py-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-bold transition"><i class="fas fa-edit mr-1"></i> Edit</button>
                            <button onclick="app.deletePatient('${p.id}')" class="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold transition"><i class="fas fa-trash-alt mr-1"></i> Hapus</button>
                        </div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
        container.appendChild(grid);
    },

    // --- MEDICINE ---
    viewMedicine(container) {
        if(!this.data.patients.length) { container.innerHTML = `<p class="text-center text-slate-400 mt-10">Data pasien kosong.</p>`; return; }
        this.data.patients.forEach(p => {
            const wrapper = document.createElement('div');
            wrapper.className = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 search-item";
            wrapper.innerHTML = `
                <div class="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold"><i class="fas fa-user-injured"></i></div>
                        <h3 class="font-bold text-lg text-slate-800">${p.reg.name}</h3>
                    </div>
                    <button onclick="app.modalStock('${p.id}')" class="text-xs font-bold bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 shadow">+ Tambah Obat</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Stok Tersedia</h4>
                        <div class="space-y-3">
                        ${(p.medicine?.stock || []).map((s, idx) => {
                            const sisa = s.init - s.used;
                            const low = sisa < 5;
                            return `
                            <div class="flex justify-between items-center p-4 rounded-xl border ${low ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} relative">
                                <div><p class="font-bold text-slate-800 text-sm">${s.name}</p><p class="text-[10px] text-slate-500">Exp: ${s.exp}</p></div>
                                <div class="flex items-center gap-4">
                                    <div class="text-right"><span class="block text-2xl font-black ${low ? 'text-red-600' : 'text-slate-700'}">${sisa}</span></div>
                                    <button onclick="app.modalUseMed('${p.id}', ${idx})" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition flex items-center justify-center shadow-sm"><i class="fas fa-check"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${idx})" class="text-slate-300 hover:text-red-500"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>`;
                        }).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4">Riwayat Minum</h4>
                        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table class="w-full text-[11px] text-left">
                                <thead class="bg-slate-50 text-slate-500 font-bold uppercase"><tr><th class="p-3">Waktu</th><th>Obat</th><th>PJ</th><th class="text-right p-3">Del</th></tr></thead>
                                <tbody>
                                ${(p.medicine?.logs || []).map((l, i) => `
                                    <tr class="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                        <td class="py-3 pl-2 text-slate-500">${l.time.split(' ')[0]}</td>
                                        <td class="py-3 font-bold text-slate-700">${l.name}</td>
                                        <td class="py-3 text-slate-600">${l.pj}</td>
                                        <td class="py-3 text-right pr-2"><button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-300 hover:text-red-500"><i class="fas fa-times"></i></button></td>
                                    </tr>
                                `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(wrapper);
        });
    },

    // --- TTV ---
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
                        <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px]"><tr><th class="p-3">Waktu</th><th>TD</th><th>Nadi/RR</th><th>Suhu</th><th>GDS</th><th class="text-right p-3">Aksi</th></tr></thead>
                        <tbody class="divide-y divide-slate-100">
                            ${(p.ttv || []).map((t, i) => `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-3">${t.time}</td>
                                    <td class="p-3 font-bold text-brand-700">${t.td}</td>
                                    <td class="p-3">${t.nadi} | ${t.rr}</td>
                                    <td class="p-3">${t.temp}°C</td>
                                    <td class="p-3 font-bold">${t.gds}</td>
                                    <td class="p-3 text-right"><button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash-alt"></i></button></td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>`;
            container.appendChild(card);
        });
    },

    // --- VISIT ---
    viewVisit(container) {
        this.data.patients.forEach(p => {
            const card = document.createElement('div');
            card.className = "bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6 search-item";
            card.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-800">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-brand-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ Visit Baru</button>
                </div>
                <div class="space-y-4">
                ${(p.visits || []).map((v, i) => `
                    <div class="border rounded-2xl p-4 flex gap-4 hover:shadow-md transition bg-slate-50">
                        <img src="${v.photo}" class="w-24 h-24 object-cover rounded-xl bg-white border">
                        <div class="flex-1">
                            <div class="flex justify-between"><h5 class="font-bold text-brand-800 text-sm">${v.time}</h5><button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button></div>
                            <p class="text-xs text-slate-600 mb-2 italic">"${v.note}"</p>
                            <img src="${v.sign}" class="h-8 border-b border-slate-300">
                        </div>
                    </div>`).join('')}
                </div>`;
            container.appendChild(card);
        });
    },

    // --- MODALS ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT DATA" : "REGISTRASI";
        const v = (val) => val || '';
        
        this.openModal(`
            <form id="form-patient" class="space-y-6">
                <div>
                    <h4 class="text-xs font-bold text-brand-600 uppercase mb-3 border-b pb-1">Biodata</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="col-span-2 border-2 border-dashed border-slate-300 rounded-xl p-4 text-center relative cursor-pointer hover:bg-slate-50">
                            <input type="file" id="p_photo" class="absolute inset-0 opacity-0 cursor-pointer">
                            <i class="fas fa-camera text-slate-400 text-2xl mb-1"></i><p class="text-xs text-slate-500">Upload Foto</p>
                        </div>
                        <input class="input-modern" id="p_name" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" required>
                        <input class="input-modern" id="p_age" value="${v(p?.reg.age)}" type="number" placeholder="Usia">
                        <input class="input-modern" id="p_addr" value="${v(p?.reg.addr)}" placeholder="Alamat">
                        <input class="input-modern" id="p_guard" value="${v(p?.reg.guardian)}" placeholder="Wali">
                    </div>
                </div>
                <div>
                    <h4 class="text-xs font-bold text-brand-600 uppercase mb-3 border-b pb-1">Medis</h4>
                    <div class="space-y-3">
                        <input class="input-modern" id="m_dr" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter PJ">
                        <textarea class="input-modern h-20" id="m_plan" placeholder="Planning">${v(p?.diagnosis.plan)}</textarea>
                    </div>
                </div>
                <button type="button" onclick="app.savePatient('${id || ''}')" class="w-full bg-brand-700 hover:bg-brand-800 text-white py-4 rounded-xl font-bold shadow-lg transition">SIMPAN DATA</button>
            </form>
        `);
    },

    async savePatient(id) {
        const getVal = (id) => document.getElementById(id).value;
        let photoData = "https://via.placeholder.com/150";
        if(id) { const old = this.data.patients.find(x => x.id === id); if(old) photoData = old.reg.photo; }
        const fileInput = document.getElementById('p_photo');
        if(fileInput.files.length > 0) photoData = await this.toBase64(fileInput.files[0]);

        const newP = {
            id: id || 'P-' + Date.now(),
            reg: { name: getVal('p_name'), age: getVal('p_age'), addr: getVal('p_addr'), guardian: getVal('p_guard'), photo: photoData, timestamp: new Date().toLocaleString() },
            diagnosis: { dr_name: getVal('m_dr'), plan: getVal('m_plan') },
            history: { current: '' }, // Simplified for brevity
            medicine: id ? this.data.patients.find(x => x.id === id).medicine : { stock: [], logs: [] },
            ttv: id ? this.data.patients.find(x => x.id === id).ttv : [],
            visits: id ? this.data.patients.find(x => x.id === id).visits : [],
            crisis: [], program: {}, therapy: ""
        };

        if(id) { const idx = this.data.patients.findIndex(x => x.id === id); this.data.patients[idx] = newP; } 
        else { this.data.patients.push(newP); }
        this.closeModal(); this.render(); this.saveDB();
        Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
    },

    modalStock(id) {
        this.openModal(`
            <div class="space-y-4">
                <input id="s_name" class="input-modern" placeholder="Nama Obat">
                <div class="grid grid-cols-2 gap-4">
                    <input id="s_init" type="number" class="input-modern" placeholder="Jumlah">
                    <input id="s_exp" type="date" class="input-modern">
                </div>
                <button onclick="app.saveStock('${id}')" class="w-full bg-brand-600 text-white py-3 rounded-xl font-bold">TAMBAH</button>
            </div>`);
    },
    saveStock(id) {
        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock.push({ name: document.getElementById('s_name').value, init: document.getElementById('s_init').value, exp: document.getElementById('s_exp').value, used: 0 });
        this.closeModal(); this.render(); this.saveDB();
    },

    modalUseMed(id, idx) {
        this.openModal(`
            <div class="text-center mb-6"><h3 class="font-bold text-slate-800">Konfirmasi Minum Obat</h3></div>
            <input id="u_pj" class="input-modern mb-4" placeholder="Nama Perawat (PJ)">
            <button onclick="app.execUseMed('${id}', ${idx})" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">KONFIRMASI</button>`);
    },
    execUseMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const stock = p.medicine.stock[idx];
        if(stock.init - stock.used <= 0) { Swal.fire('Habis', 'Stok obat habis!', 'error'); return; }
        stock.used++;
        p.medicine.logs.unshift({ time: new Date().toLocaleString(), name: stock.name, pj: document.getElementById('u_pj').value });
        this.closeModal(); this.render(); this.saveDB();
    },

    modalTTV(id) {
        this.openModal(`
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" class="input-modern col-span-2" placeholder="Tensi (ex: 120/80)">
                <input id="t_nadi" class="input-modern" placeholder="Nadi">
                <input id="t_rr" class="input-modern" placeholder="RR">
                <input id="t_temp" class="input-modern" placeholder="Suhu">
                <input id="t_gds" class="input-modern" placeholder="GDS">
                <button onclick="app.saveTTV('${id}')" class="col-span-2 bg-brand-700 text-white py-3 rounded-xl font-bold mt-2">SIMPAN</button>
            </div>`);
    },
    saveTTV(id) {
        const p = this.data.patients.find(x => x.id === id);
        p.ttv.unshift({ time: new Date().toLocaleString(), td: document.getElementById('t_td').value, nadi: document.getElementById('t_nadi').value, rr: document.getElementById('t_rr').value, temp: document.getElementById('t_temp').value, gds: document.getElementById('t_gds').value });
        this.closeModal(); this.render(); this.saveDB();
    },

    modalVisit(id) {
        this.openModal(`
            <div class="space-y-4">
                <div class="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center"><input type="file" id="v_photo"></div>
                <textarea id="v_note" class="input-modern h-24" placeholder="Catatan..."></textarea>
                <div class="bg-slate-50 p-2 rounded-xl border"><canvas id="sig-pad" class="bg-white border w-full h-32 rounded-lg"></canvas><button onclick="app.signaturePad.clear()" class="text-xs text-red-500 mt-1">Hapus TTD</button></div>
                <button onclick="app.saveVisit('${id}')" class="w-full bg-brand-700 text-white py-3 rounded-xl font-bold">SIMPAN</button>
            </div>`);
        setTimeout(() => { const c = document.getElementById('sig-pad'); if(c){ c.width = c.parentElement.clientWidth-16; c.height=128; this.signaturePad = new SignaturePad(c); } }, 300);
    },
    async saveVisit(id) {
        if(this.signaturePad.isEmpty()) { Swal.fire('Error', 'TTD Wajib', 'error'); return; }
        const f = document.getElementById('v_photo'); let ph = 'https://via.placeholder.com/150';
        if(f.files[0]) ph = await this.toBase64(f.files[0]);
        const p = this.data.patients.find(x => x.id === id);
        p.visits.unshift({ time: new Date().toLocaleString(), note: document.getElementById('v_note').value, photo: ph, sign: this.signaturePad.toDataURL() });
        this.closeModal(); this.render(); this.saveDB();
    },

    // UTILS
    openModal(html) { document.getElementById('modal-body').innerHTML = html; document.getElementById('modal-container').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise((r,j) => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); rd.onerror = j; }),
    delSubItem(pid, type, idx) { 
        const p = this.data.patients.find(x => x.id === pid);
        if(type==='medicine.stock') p.medicine.stock.splice(idx,1);
        else if(type==='medicine.logs') p.medicine.logs.splice(idx,1);
        else if(type==='ttv') p.ttv.splice(idx,1);
        else if(type==='visits') p.visits.splice(idx,1);
        this.saveDB(); this.render();
    },
    deletePatient(id) {
        Swal.fire({ title: 'Hapus?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' }).then((r) => {
            if(r.isConfirmed) { this.data.patients = this.data.patients.filter(p => p.id !== id); this.saveDB(); this.render(); }
        });
    },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none');
    },
    exportAllExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data Kosong', 'info');
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Diagnosa: p.diagnosis.dr_name, Plan: p.diagnosis.plan }));
        const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Pasien");
        XLSX.writeFile(wb, "MMRC_Data.xlsx");
    },
    async exportToWord() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data Kosong', 'info');
        const { Document, Packer, Paragraph, HeadingLevel } = docx;
        const ch = [new Paragraph({ text: "LAPORAN MMRC", heading: HeadingLevel.HEADING_1 })];
        this.data.patients.forEach(p => {
            ch.push(new Paragraph({ text: `Pasien: ${p.reg.name}`, heading: HeadingLevel.HEADING_2 }));
            ch.push(new Paragraph(`Diagnosa: ${p.diagnosis.plan || '-'}`));
            ch.push(new Paragraph(""));
        });
        const blob = await Packer.toBlob(new Document({ sections: [{ children: ch }] }));
        const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href=url; a.download="Laporan.docx"; a.click();
    }
};

document.addEventListener('DOMContentLoaded', () => { window.app = app; app.init(); });
