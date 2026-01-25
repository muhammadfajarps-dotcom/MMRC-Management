// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// 2. INITIALIZE FIREBASE (Anti-Crash untuk Cloudflare)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,
    isInitialLoad: true,

    // --- FUNGSI PROTEKSI DATA ---
    fixDataStructure(data) {
        if (!data || !data.patients) return { patients: [] };
        data.patients = data.patients.map(function(p) {
            if (!p) return null;
            p.reg = p.reg || {};
            p.history = p.history || {};
            p.diagnosis = p.diagnosis || {};
            p.medicine = p.medicine || { stock: [], logs: [] };
            p.medicine.stock = Array.isArray(p.medicine.stock) ? p.medicine.stock : [];
            p.medicine.logs = Array.isArray(p.medicine.logs) ? p.medicine.logs : [];
            p.ttv = Array.isArray(p.ttv) ? p.ttv : [];
            p.visits = Array.isArray(p.visits) ? p.visits : [];
            p.crisis = p.crisis || { bpss: [] };
            p.crisis.bpss = Array.isArray(p.crisis.bpss) ? p.crisis.bpss : [];
            p.program = p.program || { type: '', duration: '' };
            p.therapy = p.therapy || '';
            return p;
        }).filter(function(x) { return x !== null; });
        return data;
    },

    // --- SINKRONISASI CLOUD ---
    async saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        try {
            await db.ref('mmrc_data').set(this.data);
            console.log("Cloud Updated");
        } catch (e) {
            console.error("Sync Error:", e);
        }
    },

    loadDB() {
    // Tampilkan loading
    Swal.fire({ 
        title: 'MMRC System', 
        text: 'Menghubungkan ke Cloud...', 
        allowOutsideClick: false, 
        didOpen: () => { Swal.showLoading(); }
    });

    // SAFETY TIMEOUT: Jika 5 detik gagal konek ke cloud, paksa buka aplikasi
    const backupTimeout = setTimeout(() => {
        if (this.isInitialLoad) {
            console.warn("Cloud slow/offline. Loading local data...");
            const local = localStorage.getItem('MMRC_DATABASE');
            if (local) this.data = this.fixDataStructure(JSON.parse(local));
            this.render();
            this.isInitialLoad = false;
            Swal.close();
        }
    }, 5000); 

    try {
        db.ref('mmrc_data').on('value', (snapshot) => {
            clearTimeout(backupTimeout); // Batalkan timeout karena cloud respon
            const cloudData = snapshot.val();
            
            if (cloudData) {
                this.data = this.fixDataStructure(cloudData);
                localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
            } else {
                // Jika database cloud benar-benar kosong (awal setup)
                const local = localStorage.getItem('MMRC_DATABASE');
                if (local) this.data = this.fixDataStructure(JSON.parse(local));
            }

            this.render();

            if (this.isInitialLoad) {
                Swal.close();
                this.isInitialLoad = false;
            }
        }, (error) => {
            console.error("Firebase Error:", error);
            // Jika error (misal permission denied), tetap buka aplikasi
            if (this.isInitialLoad) {
                Swal.close();
                this.isInitialLoad = false;
                this.render();
            }
        });
    } catch (e) {
        console.error("Initialization Error:", e);
        Swal.close();
    }
},

    // --- NAVIGASI & AUTH ---
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.nav('dashboard');
        } else {
            Swal.fire('Error', 'Username atau Password Salah!', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById('btn-' + page);
        if(btn) btn.classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase();
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        const currentScroll = container.scrollTop;
        container.innerHTML = '';
        
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        else if (this.currentPage === 'medicine') this.viewMedicine(container);
        else if (this.currentPage === 'ttv') this.viewTTV(container);
        else if (this.currentPage === 'visit') this.viewVisit(container);
        else if (this.currentPage === 'crisis') this.viewCrisis(container);
        else if (this.currentPage === 'program') this.viewProgram(container);
        else if (this.currentPage === 'therapy') this.viewTherapy(container);
        
        container.scrollTop = currentScroll;
    },

    // --- VIEW DASHBOARD ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">+ REGISTRASI MASUK</button>
            </div>
            <div class="space-y-8">
                ${(this.data.patients).map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="border-r pr-4">
                                <div class="flex items-center gap-3 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-xl object-cover border">
                                    <div>
                                        <h4 class="font-bold text-teal-700">${p.reg.name || ''}</h4>
                                        <p class="text-[10px] text-slate-400">${p.reg.timestamp || ''}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>TTL/Usia:</b> ${p.reg.ttl || ''} / ${p.reg.age || ''} Thn</p>
                                    <p><b>Status/Pdk:</b> ${p.reg.status || ''} / ${p.reg.edu || ''}</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job || ''}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr || ''}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian || ''}</p>
                                    <p class="text-red-500"><b>Spotcheck:</b> ${p.reg.spotcheck || ''}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase">Riwayat & Kondisi</h5>
                                <div class="text-[11px] space-y-2">
                                    <p><b>Fisik/Psikis:</b> ${p.history.desc || ''}</p>
                                    <p><b>Diagnosa Lalu:</b> ${p.history.prev_diag || ''}</p>
                                    <p><b>Dosis Lalu:</b> ${p.history.prev_rx || ''}</p>
                                    <p class="bg-amber-50 p-1"><b>Terkini:</b> ${p.history.current || ''}</p>
                                </div>
                            </div>
                            <div class="px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase">Diagnosa Dokter</h5>
                                <div class="text-[11px] space-y-1">
                                    <p><b>Dokter:</b> ${p.diagnosis.dr_name || ''}</p>
                                    <p><b>Planning:</b> ${p.diagnosis.plan || ''}</p>
                                    <div class="flex gap-2 my-2">
                                        <span class="${p.diagnosis.inj ? 'text-teal-600' : 'text-slate-300'} font-bold">Injeksi</span>
                                        <span class="${p.diagnosis.urine ? 'text-teal-600' : 'text-slate-300'} font-bold">Urine Test</span>
                                        <span class="${p.diagnosis.fiksasi ? 'text-teal-600' : 'text-slate-300'} font-bold">Fiksasi</span>
                                    </div>
                                    <p><b>Resep:</b> ${p.diagnosis.rx_name || ''} (${p.diagnosis.rx_qty || 0})</p>
                                </div>
                                <div class="mt-4 flex gap-2">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 border border-amber-600 px-3 py-1 rounded-lg text-[10px]">EDIT</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 border border-red-600 px-3 py-1 rounded-lg text-[10px]">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    // --- MODAL & FORM PATIENT ---
    modalAddPatient(editId) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">1. BIODATA</p>
                    <input name="photo_file" type="file" class="input-field text-[10px]">
                    <input name="name" value="${p?p.reg.name:''}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${p?p.reg.ttl:''}" placeholder="TTL" class="input-field">
                    <input name="age" value="${p?p.reg.age:''}" type="number" placeholder="Usia" class="input-field">
                    <input name="status" value="${p?p.reg.status:''}" placeholder="Status" class="input-field">
                    <input name="edu" value="${p?p.reg.edu:''}" placeholder="Pendidikan" class="input-field">
                    <input name="job" value="${p?p.reg.job:''}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${p?p.reg.addr:''}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${p?p.reg.guardian:''}" placeholder="Wali" class="input-field">
                    <input name="spotcheck" value="${p?p.reg.spotcheck:''}" placeholder="Spotcheck" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">2. RIWAYAT</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik" class="input-field h-20">${p?p.history.desc:''}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Lalu" class="input-field h-20">${p?p.history.prev_diag:''}</textarea>
                    <input name="h_prev_rx" value="${p?p.history.prev_rx:''}" placeholder="Dosis Lalu" class="input-field">
                    <input name="h_current" value="${p?p.history.current:''}" placeholder="Kondisi Terkini" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">3. DIAGNOSA</p>
                    <input name="d_dr" value="${p?p.diagnosis.dr_name:''}" placeholder="Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Masuk" class="input-field h-16">${p?p.diagnosis.entry_diag:''}</textarea>
                    <textarea name="d_plan" placeholder="Planning" class="input-field h-16">${p?p.diagnosis.plan:''}</textarea>
                    <div class="flex gap-2 text-[10px]">
                        <label><input type="checkbox" name="inj" ${p && p.diagnosis.inj?'checked':''}> Inj</label>
                        <label><input type="checkbox" name="urine" ${p && p.diagnosis.urine?'checked':''}> Urine</label>
                        <label><input type="checkbox" name="fix" ${p && p.diagnosis.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                    <input name="d_rx" value="${p?p.diagnosis.rx_name:''}" placeholder="Nama Obat" class="input-field">
                    <input name="d_qty" value="${p?p.diagnosis.rx_qty:''}" type="number" placeholder="Qty" class="input-field">
                </div>
                <button class="md:col-span-3 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        let existing = editId ? this.data.patients.find(x => x.id === editId) : null;
        let photoBase64 = existing ? existing.reg.photo : null;
        if (photoFile && photoFile.size > 0) photoBase64 = await this.toBase64(photoFile);

        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), ttl: fd.get('ttl'), age: fd.get('age'), status: fd.get('status'),
                edu: fd.get('edu'), job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'), photo: photoBase64,
                timestamp: editId ? existing.reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: { desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fiksasi: fd.get('fix')==='on',
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
            },
            medicine: existing ? existing.medicine : { stock: [], logs: [] },
            ttv: existing ? existing.ttv : [],
            visits: existing ? existing.visits : [],
            crisis: existing ? existing.crisis : { bpss: [] },
            program: existing ? existing.program : { type: '', duration: '' },
            therapy: existing ? existing.therapy : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- MEDICINE ---
    viewMedicine(container) {
        container.innerHTML = (this.data.patients).map(p => {
            const med = p.medicine || { stock: [], logs: [] };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-6">${p.reg.name} - MEDICINE</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400">Stok</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">+ Stok</button>
                        </div>
                        <div class="space-y-4">
                            ${(med.stock || []).map((s, i) => `
                                <div class="p-4 border rounded-2xl bg-slate-50 flex justify-between">
                                    <div><p class="font-bold text-teal-700">${s.name}</p><p class="text-[9px]">Exp: ${s.exp}</p>
                                    <div class="mt-2 flex gap-2">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 text-white px-2 py-1 rounded text-[9px]">Minum</button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 text-[9px]">Hapus</button>
                                    </div></div>
                                    <div class="text-right"><p class="text-xl font-black">${s.init - s.used}</p><p class="text-[8px]">SISA</p></div>
                                </div>`).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Logs</h4>
                        <div class="text-[10px]">${(med.logs || []).map(l => `<div class="border-b py-1"><b>${l.time}</b>: ${l.name} (PJ: ${l.pj})</div>`).join('')}</div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH STOK";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" placeholder="Obat" class="input-field">
                <input id="ms_init" type="number" placeholder="Jumlah" class="input-field">
                <input id="ms_exp" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.stock.push({ name: document.getElementById('ms_name').value, init: parseInt(document.getElementById('ms_init').value)||0, used: 0, exp: document.getElementById('ms_exp').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "KONFIRMASI";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ml_pj" placeholder="Nama PJ" class="input-field">
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        stock.used += 1;
        p.medicine.logs.unshift({ time: new Date().toLocaleString('id-ID'), name: stock.name, pj: document.getElementById('ml_pj').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- TTV ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ TTV</button>
                </div>
                <table class="w-full text-[10px] text-left">
                    <tr class="bg-slate-50"><th>Waktu</th><th>TD</th><th>Sat</th><th>GDS</th><th>Aksi</th></tr>
                    ${(p.ttv || []).map((t, i) => `<tr><td>${t.time}</td><td>${t.td}</td><td>${t.sat}%</td><td>${t.gds}</td><td><button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500">X</button></td></tr>`).join('')}
                </table>
            </div>`).join('');
    },

    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" placeholder="Tensi" class="input-field">
                <input id="t_sat" placeholder="Saturasi" class="input-field">
                <input id="t_gds" placeholder="GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}')" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.ttv.unshift({ time: new Date().toLocaleString('id-ID'), td: document.getElementById('t_td').value, sat: document.getElementById('t_sat').value, gds: document.getElementById('t_gds').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VISIT & CHART ---
    viewVisit(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-4"><h3>${p.reg.name}</h3><button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ VISIT</button></div>
                <div class="grid grid-cols-2 gap-4">${(p.visits || []).map(v => `<div class="border p-2 rounded text-[10px]"><img src="${v.photo}" class="h-20 w-full object-cover"><b>${v.time}</b><p>${v.note}</p></div>`).join('')}</div>
            </div>`).join('');
    },

    modalAddVisit(pid) {
        document.getElementById('modal-title').innerText = "VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <input type="file" id="v_photo" class="input-field">
            <textarea id="v_note" placeholder="Note" class="input-field"></textarea>
            <canvas id="sig-pad" class="w-full h-40 border my-2"></canvas>
            <button onclick="app.saveVisit('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>`;
        this.openModal();
        setTimeout(() => { this.signaturePad = new SignaturePad(document.getElementById('sig-pad')); }, 200);
    },

    async saveVisit(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const f = document.getElementById('v_photo').files[0];
        const ph = f ? await this.toBase64(f) : "https://via.placeholder.com/150";
        p.visits.unshift({ time: new Date().toLocaleString('id-ID'), note: document.getElementById('v_note').value, photo: ph, sign: this.signaturePad.toDataURL() });
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewCrisis(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-4"><h3>CRISIS - ${p.reg.name}</h3><button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-3 py-1 rounded text-xs">+ BPSS</button></div>
                <div class="h-48 w-full"><canvas id="chart-${p.id}"></canvas></div>
            </div>`).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    renderChart(p) {
        const ctx = document.getElementById('chart-' + p.id);
        if(!ctx || !p.crisis || !p.crisis.bpss.length) return;
        new Chart(ctx, { type: 'line', data: { labels: p.crisis.bpss.map((_,i)=>'D'+(i+1)), datasets: [{label:'Score', data: p.crisis.bpss.map(b=>b.eval), borderColor:'red'}] }});
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "SCORE BPSS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" type="number" placeholder="Bio" class="input-field">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field">
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = [parseInt(document.getElementById('b_bio').value)||0, parseInt(document.getElementById('b_psy').value)||0, parseInt(document.getElementById('b_soc').value)||0, parseInt(document.getElementById('b_spi').value)||0];
        p.crisis.bpss.push({ bio:v[0], psy:v[1], soc:v[2], spi:v[3], eval: v[0]+v[1]+v[2]+v[3] });
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewProgram(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="mb-2 font-bold">${p.reg.name}</h3>
                <p class="text-xs">Paket: ${p.program ? p.program.type : '-'}</p>
                <button onclick="app.modalProgram('${p.id}')" class="mt-4 bg-teal-600 text-white px-4 py-1 rounded text-xs">EDIT PROGRAM</button>
            </div>`).join('');
    },

    modalProgram(pid) {
        document.getElementById('modal-title').innerText = "PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <select id="pr_type" class="input-field"><option value="Reguler">Reguler</option><option value="Eksklusif">Eksklusif</option></select>
            <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN</button>`;
        this.openModal();
    },

    async saveProgram(pid) {
        this.data.patients.find(x => x.id === pid).program = { type: document.getElementById('pr_type').value };
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewTherapy(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="mb-4">${p.reg.name}</h3>
                <textarea id="ther_${p.id}" class="input-field h-32">${p.therapy || ''}</textarea>
                <button onclick="app.saveTherapy('${p.id}')" class="mt-2 bg-teal-600 text-white px-4 py-1 rounded text-xs">SIMPAN</button>
            </div>`).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById('ther_' + pid).value;
        await this.saveDB(); Swal.fire('Tersimpan', '', 'success');
    },

    async delPatient(pid) {
        if(confirm('Hapus data?')) { this.data.patients = this.data.patients.filter(x => x.id !== pid); await this.saveDB(); this.render(); }
    },

    async delSubItem(pid, path, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        await this.saveDB(); this.render();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => { el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none'; });
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),

    exportAllExcel() {
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Dokter: p.diagnosis.dr_name }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        XLSX.writeFile(wb, "MMRC_Export.xlsx");
    },

    exportToWord() { Swal.fire('Info', 'Fitur Word akan segera hadir.', 'info'); }
};

window.app = app;
