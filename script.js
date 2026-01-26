// ============================================================
// 1. KONFIGURASI FIREBASE (MMRC-STOCK1999)
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

// INITIALIZE FIREBASE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ============================================================
// 2. APLIKASI UTAMA
// ============================================================
const app = {
    data: { patients: [] }, 
    currentPage: 'dashboard',
    signaturePad: null,
    chartInstances: {}, // Untuk grafik BPSS agar tidak error

    // --- LOGIKA SIMPAN DATA (PERBAIKAN UTAMA DISINI) ---
    async saveDB() {
        try {
            // 1. Simpan ke Local Storage (Penyimpanan Utama agar cepat)
            const jsonStr = JSON.stringify(this.data);
            localStorage.setItem('MMRC_DATABASE', jsonStr);
            
            // 2. Simpan ke Firebase (Backup Cloud)
            // Kita biarkan jalan di background tanpa menunggu (agar UI tidak macet)
            db.ref('mmrc_data').set(this.data).then(() => {
                console.log("✅ Cloud Synced");
            }).catch(e => {
                console.warn("⚠️ Cloud Offline (Data aman di Local):", e);
            });
        } catch (err) {
            console.error("Save Error:", err);
            Swal.fire('Memori Penuh', 'Gagal menyimpan ke browser.', 'error');
        }
    },

    // --- LOAD DATA ---
    loadDB() {
        // Ambil dari Local Storage dulu (Supaya langsung muncul)
        const local = localStorage.getItem('MMRC_DATABASE');
        if (local) {
            try { 
                this.data = JSON.parse(local); 
                if(!this.data.patients) this.data.patients = [];
                this.render(); 
            } catch (e) { console.error(e); }
        }

        // Ambil dari Firebase (Sync Realtime)
        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                // Cek agar tidak ganggu saat user lagi ngetik
                const isModalOpen = !document.getElementById('modal-container').classList.contains('hidden');
                
                if (JSON.stringify(this.data) !== JSON.stringify(cloudData) && !isModalOpen) {
                    this.data = cloudData;
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
                    
                    if (!document.getElementById('app-layer').classList.contains('hidden')) {
                        this.render();
                    }
                }
            }
        });
    },

    // --- LOGIN ---
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.nav('dashboard');
        } else {
            Swal.fire('Akses Ditolak', 'Username atau Password Salah!', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase();
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        // Router Sederhana
        switch (this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
        }
    },

    // ============================================================
    // MENU 1: DASHBOARD & REGISTRASI (FIX SIMPAN)
    // ============================================================
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg flex items-center gap-2">
                    <i class="fas fa-plus"></i> REGISTRASI MASUK
                </button>
            </div>
            <div class="space-y-8">
                ${(this.data.patients || []).map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 search-item hover:shadow-md transition-shadow">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="border-r border-slate-100 pr-4">
                                <div class="flex items-center gap-3 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-16 h-16 rounded-xl object-cover border bg-slate-50">
                                    <div>
                                        <h4 class="font-bold text-teal-700 text-lg">${p.reg.name}</h4>
                                        <p class="text-[10px] text-slate-400 font-bold uppercase"><i class="far fa-clock"></i> ${p.reg.timestamp}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>Usia:</b> ${p.reg.ttl} (${p.reg.age} Thn)</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr}</p>
                                    <p class="text-red-500 bg-red-50 p-1 rounded mt-1"><b>Spotcheck:</b> ${p.reg.spotcheck}</p>
                                </div>
                            </div>
                            <div class="border-r border-slate-100 px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">Riwayat</h5>
                                <div class="text-[11px] space-y-3">
                                    <div><b class="text-teal-600">Diagnosa Lalu:</b><p class="text-slate-700">${p.history.prev_diag}</p></div>
                                    <div class="bg-amber-50 p-2 rounded border border-amber-100"><b>Kondisi:</b> ${p.history.current}</div>
                                </div>
                            </div>
                            <div class="px-4 flex flex-col justify-between">
                                <div>
                                    <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">Diagnosa MMRC</h5>
                                    <div class="text-[11px] space-y-2">
                                        <p><b>Dokter:</b> ${p.diagnosis.dr_name}</p>
                                        <p class="bg-teal-50 p-2 rounded text-teal-800"><b>Planning:</b> ${p.diagnosis.plan}</p>
                                    </div>
                                </div>
                                <div class="mt-4 flex gap-2 justify-end">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 border border-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">EDIT</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 border border-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        
        const val = (v) => v || '';
        const chk = (v) => v ? 'checked' : '';

        // PERBAIKAN: Ganti FORM menjadi DIV biasa agar tidak ada trigger submit reload
        // Tombol SIMPAN menggunakan type="button" dan onclick
        document.getElementById('modal-body').innerHTML = `
            <div id="form-input-patient" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">1. Biodata</p>
                    <div class="border border-dashed border-slate-300 p-2 rounded-xl text-center">
                        <input id="fp_photo" type="file" class="text-[10px] w-full">
                        <p class="text-[9px] text-slate-400 mt-1">*Upload Foto Wajah</p>
                    </div>
                    <input id="fp_name" value="${val(p?.reg?.name)}" placeholder="Nama Lengkap" class="input-field" required>
                    <div class="grid grid-cols-2 gap-2">
                        <input id="fp_ttl" value="${val(p?.reg?.ttl)}" placeholder="TTL" class="input-field">
                        <input id="fp_age" value="${val(p?.reg?.age)}" type="number" placeholder="Usia" class="input-field">
                    </div>
                    <input id="fp_status" value="${val(p?.reg?.status)}" placeholder="Status Pernikahan" class="input-field">
                    <input id="fp_edu" value="${val(p?.reg?.edu)}" placeholder="Pendidikan" class="input-field">
                    <input id="fp_job" value="${val(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input id="fp_addr" value="${val(p?.reg?.addr)}" placeholder="Alamat" class="input-field">
                    <input id="fp_guardian" value="${val(p?.reg?.guardian)}" placeholder="Wali" class="input-field">
                    <input id="fp_spot" value="${val(p?.reg?.spotcheck)}" placeholder="Spotcheck" class="input-field text-red-600">
                </div>
                
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">2. Riwayat Medis</p>
                    <textarea id="fp_h_desc" placeholder="Riwayat Fisik & Psikologis" class="input-field h-24">${val(p?.history?.desc)}</textarea>
                    <textarea id="fp_h_prev" placeholder="Diagnosa Sebelumnya" class="input-field h-20">${val(p?.history?.prev_diag)}</textarea>
                    <input id="fp_h_rx" value="${val(p?.history?.prev_rx)}" placeholder="Riwayat Obat" class="input-field">
                    <textarea id="fp_h_curr" placeholder="Kondisi Saat Ini" class="input-field h-20 bg-amber-50">${val(p?.history?.current)}</textarea>
                </div>

                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">3. Assessment</p>
                    <input id="fp_dr" value="${val(p?.diagnosis?.dr_name)}" placeholder="Nama Dokter" class="input-field">
                    <textarea id="fp_d_entry" placeholder="Diagnosa Masuk" class="input-field h-20">${val(p?.diagnosis?.entry_diag)}</textarea>
                    <textarea id="fp_d_plan" placeholder="Planning Dokter" class="input-field h-20">${val(p?.diagnosis?.plan)}</textarea>
                    <div class="flex gap-4 text-[11px] bg-slate-50 p-3 rounded-xl border">
                        <label class="flex items-center gap-2"><input type="checkbox" id="fp_inj" ${chk(p?.diagnosis?.inj)}> Injeksi</label>
                        <label class="flex items-center gap-2"><input type="checkbox" id="fp_urine" ${chk(p?.diagnosis?.urine)}> Urine</label>
                        <label class="flex items-center gap-2"><input type="checkbox" id="fp_fix" ${chk(p?.diagnosis?.fiksasi)}> Fiksasi</label>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <input id="fp_rx" value="${val(p?.diagnosis?.rx_name)}" placeholder="Nama Obat" class="input-field col-span-2">
                        <input id="fp_qty" value="${val(p?.diagnosis?.rx_qty)}" type="number" placeholder="Jml" class="input-field">
                    </div>
                </div>

                <button type="button" onclick="app.savePatient('${editId || ''}')" class="md:col-span-3 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg mt-4 transition">
                    <i class="fas fa-save mr-2"></i> SIMPAN DATA PASIEN
                </button>
            </div>`;
        this.openModal();
    },

    async savePatient(editId) {
        // VALIDASI MANUAL
        const getName = document.getElementById('fp_name').value;
        if (!getName) return Swal.fire('Error', 'Nama Pasien Wajib Diisi', 'error');

        Swal.fire({ title: 'Menyimpan...', showConfirmButton: false, didOpen: () => Swal.showLoading() });

        // HELPERS
        const getVal = (id) => document.getElementById(id).value;
        const getChk = (id) => document.getElementById(id).checked;

        try {
            // Handle Foto
            let photoBase64 = null;
            if (editId) {
                const existing = this.data.patients.find(x => x.id === editId);
                if(existing) photoBase64 = existing.reg.photo;
            }
            const fileInput = document.getElementById('fp_photo');
            if (fileInput.files.length > 0) {
                photoBase64 = await this.toBase64(fileInput.files[0]);
            }

            // Object Data
            const pData = {
                id: editId || 'P-' + Date.now(),
                reg: {
                    name: getVal('fp_name'), ttl: getVal('fp_ttl'), age: getVal('fp_age'),
                    status: getVal('fp_status'), edu: getVal('fp_edu'), job: getVal('fp_job'),
                    addr: getVal('fp_addr'), guardian: getVal('fp_guardian'), spotcheck: getVal('fp_spot'),
                    photo: photoBase64,
                    timestamp: editId ? this.data.patients.find(x => x.id === editId).reg.timestamp : new Date().toLocaleString('id-ID')
                },
                history: { 
                    desc: getVal('fp_h_desc'), prev_diag: getVal('fp_h_prev'), 
                    prev_rx: getVal('fp_h_rx'), current: getVal('fp_h_curr') 
                },
                diagnosis: { 
                    dr_name: getVal('fp_dr'), entry_diag: getVal('fp_d_entry'), plan: getVal('fp_d_plan'),
                    inj: getChk('fp_inj'), urine: getChk('fp_urine'), fiksasi: getChk('fp_fix'),
                    rx_name: getVal('fp_rx'), rx_qty: getVal('fp_qty')
                },
                // Bawaan data lama atau init baru
                medicine: editId ? this.data.patients.find(x => x.id === editId).medicine : { stock: [], logs: [] },
                ttv: editId ? this.data.patients.find(x => x.id === editId).ttv : [],
                visits: editId ? this.data.patients.find(x => x.id === editId).visits : [],
                crisis: editId ? this.data.patients.find(x => x.id === editId).crisis : { bpss: [] },
                program: editId ? this.data.patients.find(x => x.id === editId).program : { type: '', duration: '' },
                therapy: editId ? this.data.patients.find(x => x.id === editId).therapy : ''
            };

            // Update Array
            if (!this.data.patients) this.data.patients = [];
            if (editId) {
                const idx = this.data.patients.findIndex(x => x.id === editId);
                if (idx !== -1) this.data.patients[idx] = pData;
            } else {
                this.data.patients.push(pData);
            }

            // Simpan & Render
            await this.saveDB();
            this.closeModal();
            this.render();
            Swal.fire({ icon: 'success', title: 'Berhasil', timer: 1000, showConfirmButton: false });

        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal Simpan: ' + err.message, 'error');
        }
    },

    // ============================================================
    // MENU 2: OBAT (REQUEST NO 1 & 3: Sisa < 7 & Download Excel)
    // ============================================================
    viewMedicine(container) {
        if (!this.data.patients || this.data.patients.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center mt-10">Belum ada pasien.</p>';
            return;
        }

        // REQUEST 3: TOMBOL DOWNLOAD EXCEL
        container.innerHTML = `
        <div class="mb-4 text-right">
            <button onclick="app.exportMedicineExcel()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow flex items-center gap-2 ml-auto">
                <i class="fas fa-file-excel"></i> DOWNLOAD LAPORAN OBAT (XLS)
            </button>
        </div>` + 
        this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-6 text-lg border-b pb-2">${p.reg.name}</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400">Stok Obat</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow">+ Tambah Stok</button>
                        </div>
                        <div class="space-y-4">
                            ${(p.medicine?.stock || []).map((s, i) => {
                                const sisa = s.init - s.used;
                                // REQUEST 1: REMINDER JIKA SISA < 7 (MERAH)
                                const isLow = sisa < 7;
                                return `
                                <div class="p-4 border rounded-2xl ${isLow ? 'bg-red-50 border-red-200 animate-pulse' : 'bg-slate-50 border-slate-200'} relative">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[10px] text-slate-500 mt-1">Exp: ${s.exp}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-2xl font-black ${isLow ? 'text-red-500':'text-teal-600'}">${sisa}</p>
                                            <p class="text-[8px] font-bold ${isLow ? 'text-red-500':'text-slate-400'} uppercase">
                                                ${isLow ? 'STOK KRITIS!' : 'SISA TAB'}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2 border-t pt-3 border-slate-200/50">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex-1">Catat Minum</button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 px-2 hover:bg-red-50 rounded"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Log Penggunaan</h4>
                        <div class="overflow-x-auto border rounded-xl h-64 overflow-y-auto">
                            <table class="w-full text-[10px] text-left">
                                <thead class="bg-slate-100 text-slate-600"><tr><th class="p-3">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ</th><th class="p-3">X</th></tr></thead>
                                <tbody class="divide-y">
                                    ${(p.medicine?.logs || []).map((l, i) => `
                                        <tr>
                                            <td class="p-3">${l.time}</td>
                                            <td class="p-3 font-bold">${l.name}</td>
                                            <td class="p-3">${l.pj}</td>
                                            <td class="p-3"><button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400">X</button></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    exportMedicineExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        let rows = [];
        this.data.patients.forEach(p => {
            if(p.medicine?.stock) {
                p.medicine.stock.forEach(s => rows.push({TIPE:"STOK", PASIEN:p.reg.name, OBAT:s.name, SISA:s.init-s.used, EXP:s.exp}));
            }
            if(p.medicine?.logs) {
                p.medicine.logs.forEach(l => rows.push({TIPE:"LOG", PASIEN:p.reg.name, OBAT:l.name, WAKTU:l.time, PJ:l.pj}));
            }
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Obat");
        XLSX.writeFile(wb, "Laporan_Obat_MMRC.xlsx");
    },

    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH STOK";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-3">
                <input id="ms_name" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" type="number" placeholder="Jumlah" class="input-field">
                <input id="ms_exp" type="date" class="input-field">
                <button type="button" onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const name = document.getElementById('ms_name').value;
        const init = parseInt(document.getElementById('ms_init').value);
        if(!name || isNaN(init)) return;

        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({ name, init, used: 0, exp: document.getElementById('ms_exp').value });
        this.closeModal(); this.render(); await this.saveDB();
    },

    modalUseMed(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-3">
                <p>Obat: <b>${p.medicine.stock[idx].name}</b></p>
                <input id="mu_pj" placeholder="Nama PJ" class="input-field">
                <button type="button" onclick="app.saveUseMed('${pid}', ${idx})" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    async saveUseMed(pid, idx) {
        const pj = document.getElementById('mu_pj').value;
        if(!pj) return Swal.fire('Error', 'Isi Nama PJ', 'error');
        const p = this.data.patients.find(x => x.id === pid);
        
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({ time: new Date().toLocaleString(), name: p.medicine.stock[idx].name, pj });
        this.closeModal(); this.render(); await this.saveDB();
    },

    async delMedLog(pid, idx) {
        if(confirm("Hapus log? Stok akan dikembalikan.")) {
            const p = this.data.patients.find(x => x.id === pid);
            const log = p.medicine.logs[idx];
            const stock = p.medicine.stock.find(s => s.name === log.name);
            if(stock && stock.used > 0) stock.used--;
            p.medicine.logs.splice(idx, 1);
            this.render(); await this.saveDB();
        }
    },

    // ============================================================
    // MENU 5: CRISIS (REQUEST NO 2: Chart 0-25 & Fix Glitch)
    // ============================================================
    viewCrisis(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm border-l-4 border-l-red-500">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 shadow">+ INPUT BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto border rounded-xl">
                        <table class="w-full text-[10px] text-left">
                            <thead class="bg-red-50 text-red-900"><tr><th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Total</th><th class="p-2">X</th></tr></thead>
                            <tbody>
                                ${(p.crisis?.bpss || []).map((b, i) => `
                                    <tr class="border-b"><td class="p-2">H-${i+1}</td><td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td><td class="p-2 font-bold">${b.eval}</td>
                                    <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500">X</button></td></tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-4 bg-white shadow-inner relative">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis?.bpss?.length) return;

        // FIX "KLIK IKUTAN": Hancurkan chart lama sebelum buat baru
        if (this.chartInstances[p.id]) {
            this.chartInstances[p.id].destroy();
        }

        this.chartInstances[p.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `H-${i+1}`), // LABEL H-1, H-2...
                datasets: [{ 
                    label: 'Skor BPSS', 
                    data: p.crisis.bpss.map(b => b.eval), 
                    borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: true, tension: 0.3, pointRadius: 6
                }]
            },
            options: { 
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, min: 0, max: 25, // SKALA Y 0-25
                        title: { display: true, text: 'Score (0-25)' }
                    }
                }
            }
        });
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" type="number" placeholder="Bio" class="input-field">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field">
                <textarea id="b_note" placeholder="Evaluasi..." class="input-field col-span-2 h-20"></textarea>
                <button type="button" onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold shadow-lg">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('b_bio').value)||0, psy = parseInt(document.getElementById('b_psy').value)||0, soc = parseInt(document.getElementById('b_soc').value)||0, spi = parseInt(document.getElementById('b_spi').value)||0;
        
        if(!p.crisis) p.crisis = {bpss:[]};
        p.crisis.bpss.push({ bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('b_note').value });
        this.closeModal(); this.render(); await this.saveDB();
    },

    // --- SISANYA (TTV, VISIT, PROGRAM, DLL) SUDAH DENGAN TOMBOL TYPE=BUTTON ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <div class="flex justify-between mb-4">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg font-bold">+ TTV</button>
                </div>
                <div class="overflow-x-auto"><table class="w-full text-xs text-left"><thead class="bg-slate-100"><tr><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat</th><th class="p-2">X</th></tr></thead><tbody>
                ${(p.ttv||[]).map((t,i)=>`<tr><td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}</td><td class="p-2"><button onclick="app.delSubItem('${p.id}','ttv',${i})" class="text-red-500">X</button></td></tr>`).join('')}
                </tbody></table></div></div>`).join('');
    },
    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `<div class="grid grid-cols-2 gap-3"><input id="t_td" placeholder="TD"><input id="t_sat" placeholder="Sat"><button type="button" onclick="app.saveTTV('${pid}')" class="col-span-2 bg-teal-600 text-white py-3 rounded">SIMPAN</button></div>`;
        this.openModal();
    },
    async saveTTV(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        if(!p.ttv) p.ttv=[];
        p.ttv.unshift({time:new Date().toLocaleString(), td:document.getElementById('t_td').value, sat:document.getElementById('t_sat').value});
        this.closeModal(); this.render(); await this.saveDB();
    },

    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <div class="flex justify-between mb-4"><h3 class="font-bold text-teal-800">${p.reg.name} - VISIT</h3><button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg font-bold">+ Visit</button></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${(p.visits||[]).map((v,i)=>`<div class="border rounded p-3"><img src="${v.photo}" class="w-full h-32 object-cover mb-2"><p class="text-xs font-bold">${v.time}</p><p class="text-xs italic">"${v.note}"</p><img src="${v.sign}" class="h-8 border-b"><button onclick="app.delSubItem('${p.id}','visits',${i})" class="text-red-500 text-xs w-full text-right mt-2">Hapus</button></div>`).join('')}</div></div>`).join('');
    },
    modalVisit(pid) {
        document.getElementById('modal-title').innerText = "INPUT VISIT";
        document.getElementById('modal-body').innerHTML = `<div class="space-y-3"><input type="file" id="v_photo"><textarea id="v_note" class="input-field"></textarea><canvas id="sig-pad" class="w-full h-32 border"></canvas><button type="button" onclick="app.saveVisit('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded">SIMPAN</button></div>`;
        this.openModal();
        this.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
    },
    async saveVisit(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        const f = document.getElementById('v_photo').files[0];
        let photo = await (f ? this.toBase64(f) : Promise.resolve(''));
        if(!p.visits) p.visits=[];
        p.visits.unshift({time:new Date().toLocaleString(), note:document.getElementById('v_note').value, photo, sign:this.signaturePad.toDataURL()});
        this.closeModal(); this.render(); await this.saveDB();
    },

    // UTILS
    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus?')) return;
        const p = this.data.patients.find(x=>x.id===pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target=target[parts[i]];
        target.splice(idx,1);
        this.render(); await this.saveDB();
    },
    async delPatient(pid) {
        if(!confirm('Hapus Pasien?')) return;
        this.data.patients = this.data.patients.filter(x=>x.id!==pid);
        this.render(); await this.saveDB();
    },
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    
    exportAllExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Usia: p.reg.age, Diagnosa: p.diagnosis.dr_name }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "Data_Pasien.xlsx");
    },
    
    async exportToWord() {
        if (!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ImageRun } = docx;
        const b64toBlob = (b64) => {
            if(!b64 || !b64.includes('base64,')) return null;
            try { return Uint8Array.from(atob(b64.split(',')[1]), c => c.charCodeAt(0)); } catch(e) { return null; }
        };
        const children = [new Paragraph("LAPORAN MMRC")];
        for (const p of this.data.patients) {
            const profile = b64toBlob(p.reg.photo);
            children.push(new Paragraph(""));
            children.push(new Paragraph(`PASIEN: ${p.reg.name}`));
            if(profile) children.push(new Paragraph({children:[new ImageRun({data:profile, transformation:{width:100,height:100}})]}));
            // Simplified table for word export example
            children.push(new Table({rows:[new TableRow({children:[new TableCell({children:[new Paragraph("Diagnosa")]}), new TableCell({children:[new Paragraph(p.diagnosis.plan||"-")]})]})], width:{size:100,type:WidthType.PERCENTAGE}}));
        }
        const doc = new Document({sections:[{children}]});
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a); a.style="display:none"; a.href=url; a.download="Laporan.docx"; a.click();
    }
};

window.app = app;
