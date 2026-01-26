// ============================================================
// 1. KONFIGURASI FIREBASE
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

// Cek Firebase Loaded
if (typeof firebase === 'undefined') {
    alert("CRITICAL ERROR: Firebase SDK belum dimuat di index.html!");
} else {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ============================================================
// 2. LOGIKA APLIKASI (OFFLINE FIRST ARCHITECTURE)
// ============================================================
const app = {
    data: { patients: [] }, 
    currentPage: 'dashboard',
    signaturePad: null,
    chartInstances: {}, 

    init() {
        console.log("Aplikasi Dimulai...");
        this.loadDB(); // Load data saat start
    },

    // --- FUNGSI PENYIMPANAN "HYBRID" ---
    // Menyimpan ke Layar & LocalStorage DULU (Instan), baru ke Cloud (Background)
    async saveDB() {
        // 1. Simpan Local (Wajib Sukses)
        try {
            const jsonStr = JSON.stringify(this.data);
            localStorage.setItem('MMRC_DATABASE', jsonStr);
        } catch (e) {
            console.error("Local Save Error:", e);
            Swal.fire('Error Memori', 'Memori Browser Penuh!', 'error');
            return;
        }

        // 2. Simpan Cloud (Firebase)
        // Kita tidak menunggu ini selesai agar UI tidak lag
        db.ref('mmrc_data').set(this.data).then(() => {
            console.log("☁️ Cloud Synced");
            // Opsional: Tampilkan toast kecil jika sukses sync
        }).catch((e) => {
            console.error("☁️ Cloud Fail:", e);
            Swal.fire({
                icon: 'warning',
                title: 'Disimpan di HP/Laptop saja',
                text: 'Gagal sync ke Cloud (Cek Koneksi/Rules). Data aman di perangkat ini.',
                timer: 3000
            });
        });
    },

    loadDB() {
        // Prioritas 1: Ambil Local Storage (Supaya cepat)
        const local = localStorage.getItem('MMRC_DATABASE');
        if (local) {
            this.data = JSON.parse(local);
            if(!this.data.patients) this.data.patients = [];
            this.render(); 
        }

        // Prioritas 2: Cek Cloud untuk update terbaru
        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                // Cek apakah sedang buka modal? Jika ya, jangan refresh paksa
                const modalHidden = document.getElementById('modal-container').classList.contains('hidden');
                
                if (modalHidden) {
                    this.data = cloudData;
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
                    if (this.currentPage !== 'login') this.render();
                }
            }
        });
    },

    // --- NAVIGASI & LOGIN ---
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Gagal', 'Username/Password Salah', 'error');
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

    // --- RENDER UTAMA ---
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        container.innerHTML = ''; 
        
        // Safety check data
        if(!this.data.patients) this.data.patients = [];

        try {
            switch (this.currentPage) {
                case 'dashboard': this.viewDashboard(container); break;
                case 'medicine': this.viewMedicine(container); break;
                case 'ttv': this.viewTTV(container); break;
                case 'visit': this.viewVisit(container); break;
                case 'crisis': this.viewCrisis(container); break;
                case 'program': this.viewProgram(container); break;
                case 'therapy': this.viewTherapy(container); break;
            }
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div class="text-red-500">Error Rendering: ${err.message}</div>`;
        }
    },

    // ============================================================
    // MENU 1: DASHBOARD & REGISTRASI (FIXED)
    // ============================================================
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DATA PASIEN (${this.data.patients.length})</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <i class="fas fa-plus"></i> REGISTRASI
                </button>
            </div>
            <div class="space-y-6">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 search-item">
                        <div class="flex gap-4">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-20 h-20 rounded-xl object-cover border bg-slate-50">
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <h4 class="font-bold text-teal-700 text-lg">${p.reg.name}</h4>
                                    <div class="flex gap-2">
                                        <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-500 hover:text-amber-700"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delPatient('${p.id}')" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                                <p class="text-xs text-slate-500">${p.reg.ttl} | ${p.reg.age} Thn | ${p.reg.addr}</p>
                                <div class="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                                    <div class="bg-slate-50 p-2 rounded"><b>Diagnosa:</b> ${p.diagnosis.dr_name}</div>
                                    <div class="bg-teal-50 p-2 rounded text-teal-800"><b>Plan:</b> ${p.diagnosis.plan}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA" : "REGISTRASI BARU";
        
        const v = (val) => val ? val : ''; // Helper safe value

        // FORM DENGAN ID SPESIFIK & TYPE=BUTTON (PENTING AGAR TIDAK RELOAD)
        document.getElementById('modal-body').innerHTML = `
            <form id="form-patient" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-3 bg-blue-50 p-2 text-center text-xs text-blue-800 rounded mb-2">
                    Pastikan semua data terisi sebelum klik Simpan.
                </div>

                <div class="space-y-2">
                    <p class="font-bold text-xs text-teal-700 border-b">BIODATA</p>
                    <input type="file" id="fp_photo" class="input-field text-xs">
                    <input id="fp_name" value="${v(p?.reg?.name)}" placeholder="Nama Lengkap" class="input-field">
                    <div class="flex gap-2">
                        <input id="fp_ttl" value="${v(p?.reg?.ttl)}" placeholder="TTL" class="input-field w-2/3">
                        <input id="fp_age" value="${v(p?.reg?.age)}" type="number" placeholder="Usia" class="input-field w-1/3">
                    </div>
                    <input id="fp_job" value="${v(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input id="fp_addr" value="${v(p?.reg?.addr)}" placeholder="Alamat" class="input-field">
                    <input id="fp_guardian" value="${v(p?.reg?.guardian)}" placeholder="Wali" class="input-field">
                    <input id="fp_spot" value="${v(p?.reg?.spotcheck)}" placeholder="Spotcheck (Merah)" class="input-field text-red-600">
                </div>

                <div class="space-y-2">
                    <p class="font-bold text-xs text-teal-700 border-b">RIWAYAT MEDIS</p>
                    <textarea id="fp_h_desc" placeholder="Riwayat Fisik & Psikologis" class="input-field h-20">${v(p?.history?.desc)}</textarea>
                    <textarea id="fp_h_prev" placeholder="Diagnosa Sebelumnya" class="input-field h-16">${v(p?.history?.prev_diag)}</textarea>
                    <textarea id="fp_h_curr" placeholder="Kondisi Saat Ini" class="input-field h-16 bg-amber-50">${v(p?.history?.current)}</textarea>
                </div>

                <div class="space-y-2">
                    <p class="font-bold text-xs text-teal-700 border-b">ASSESSMENT MMRC</p>
                    <input id="fp_dr" value="${v(p?.diagnosis?.dr_name)}" placeholder="Nama Dokter" class="input-field">
                    <textarea id="fp_plan" placeholder="Planning Dokter" class="input-field h-20">${v(p?.diagnosis?.plan)}</textarea>
                    <div class="flex gap-2 text-[10px]">
                        <label><input type="checkbox" id="fp_inj" ${p?.diagnosis?.inj?'checked':''}> Injeksi</label>
                        <label><input type="checkbox" id="fp_urine" ${p?.diagnosis?.urine?'checked':''}> Urine</label>
                        <label><input type="checkbox" id="fp_fix" ${p?.diagnosis?.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                </div>

                <div class="md:col-span-3 mt-4">
                    <button type="button" onclick="app.processSavePatient('${editId || ''}')" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-xl font-bold shadow-lg text-lg">
                        SIMPAN DATA SEKARANG
                    </button>
                </div>
            </form>
        `;
        this.openModal();
    },

    async processSavePatient(editId) {
        // AMBIL VALUE LANGSUNG DARI ID (LEBIH STABIL)
        const getVal = (id) => document.getElementById(id).value;
        const getChk = (id) => document.getElementById(id).checked;

        // Validasi Sederhana
        if(getVal('fp_name') === '') return Swal.fire('Eits!', 'Nama Pasien Wajib Diisi', 'warning');

        Swal.fire({title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading()});

        // Handle Foto
        let photoBase64 = null;
        if(editId) {
             // Jika edit, pakai foto lama dulu
             const oldP = this.data.patients.find(x => x.id === editId);
             if(oldP) photoBase64 = oldP.reg.photo;
        }
        const fileInput = document.getElementById('fp_photo');
        if (fileInput.files.length > 0) {
            photoBase64 = await this.toBase64(fileInput.files[0]);
        }

        // BENTUK OBJECT DATA
        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: getVal('fp_name'), ttl: getVal('fp_ttl'), age: getVal('fp_age'),
                job: getVal('fp_job'), addr: getVal('fp_addr'), guardian: getVal('fp_guardian'),
                spotcheck: getVal('fp_spot'), photo: photoBase64,
                timestamp: new Date().toLocaleString()
            },
            history: { 
                desc: getVal('fp_h_desc'), prev_diag: getVal('fp_h_prev'), current: getVal('fp_h_curr') 
            },
            diagnosis: { 
                dr_name: getVal('fp_dr'), plan: getVal('fp_plan'),
                inj: getChk('fp_inj'), urine: getChk('fp_urine'), fiksasi: getChk('fp_fix')
            },
            // Pertahankan data sub-menu jika sedang edit
            medicine: editId ? this.data.patients.find(x => x.id === editId).medicine : { stock: [], logs: [] },
            ttv: editId ? this.data.patients.find(x => x.id === editId).ttv : [],
            visits: editId ? this.data.patients.find(x => x.id === editId).visits : [],
            crisis: editId ? this.data.patients.find(x => x.id === editId).crisis : { bpss: [] },
            program: editId ? this.data.patients.find(x => x.id === editId).program : {},
            therapy: editId ? this.data.patients.find(x => x.id === editId).therapy : ''
        };

        // UPDATE ARRAY
        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            if(idx !== -1) this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }

        // EXECUTE SAVE
        await this.saveDB();
        
        Swal.close();
        this.closeModal();
        this.render(); // Langsung update layar
        Swal.fire({icon: 'success', title: 'Berhasil', text: 'Data Pasien Tersimpan', timer: 1500, showConfirmButton: false});
    },

    // ============================================================
    // MENU 2: OBAT (FIXED)
    // ============================================================
    viewMedicine(container) {
        container.innerHTML = `
            <div class="mb-4 text-right">
                <button onclick="app.exportMedicineExcel()" class="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold shadow">Download Laporan XLS</button>
            </div>
            ${this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <h3 class="font-bold text-teal-800 border-b pb-2 mb-4">${p.reg.name}</h3>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <h4 class="text-xs font-bold text-slate-500">DAFTAR STOK OBAT</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="text-xs bg-teal-600 text-white px-2 py-1 rounded">+ Stok</button>
                        </div>
                        <div class="space-y-3">
                            ${(p.medicine?.stock || []).map((s, i) => {
                                const sisa = s.init - s.used;
                                return `
                                <div class="p-3 border rounded-xl flex justify-between items-center ${sisa<5?'bg-red-50 border-red-200':''}">
                                    <div>
                                        <p class="font-bold text-sm text-teal-700">${s.name}</p>
                                        <p class="text-[10px] text-slate-400">Exp: ${s.exp}</p>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="text-right">
                                            <span class="block text-xl font-bold ${sisa<5?'text-red-600':'text-teal-600'}">${sisa}</span>
                                            <span class="text-[9px]">Sisa</span>
                                        </div>
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow">Minum</button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>`
                            }).join('')}
                        </div>
                    </div>

                    <div>
                         <h4 class="text-xs font-bold text-slate-500 mb-2">RIWAYAT MINUM</h4>
                         <div class="bg-slate-50 rounded-xl h-64 overflow-y-auto p-2 border">
                            ${(p.medicine?.logs || []).map((l, i) => `
                                <div class="bg-white p-2 rounded mb-2 border text-[11px] flex justify-between">
                                    <div>
                                        <span class="font-bold text-teal-700">${l.name}</span>
                                        <div class="text-slate-500">${l.time}</div>
                                        <div class="italic">PJ: ${l.pj}</div>
                                    </div>
                                    <button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400 self-start"><i class="fas fa-times"></i></button>
                                </div>
                            `).join('')}
                         </div>
                    </div>
                </div>
            </div>`).join('')}`;
    },

    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-3">
                <input id="ms_name" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" type="number" placeholder="Jumlah (Misal: 30)" class="input-field">
                <input id="ms_exp" type="date" class="input-field">
                <button type="button" onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold mt-2">SIMPAN STOK</button>
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
        const st = p.medicine.stock[idx];
        if(st.init - st.used <= 0) return Swal.fire('Habis', 'Stok Obat Kosong!', 'error');

        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="text-center mb-4">
                <h3 class="font-bold text-xl text-teal-800">${st.name}</h3>
                <p class="text-sm text-slate-500">Stok akan berkurang 1</p>
            </div>
            <input id="mu_pj" placeholder="Nama PJ (Perawat)" class="input-field mb-3">
            <button type="button" onclick="app.saveUseMed('${pid}', ${idx})" class="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">KONFIRMASI</button>
        `;
        this.openModal();
    },

    async saveUseMed(pid, idx) {
        const pj = document.getElementById('mu_pj').value;
        if(!pj) return alert("Nama PJ harus diisi!");
        
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({
            time: new Date().toLocaleString(),
            name: p.medicine.stock[idx].name,
            pj: pj
        });
        
        this.closeModal(); this.render(); await this.saveDB();
    },

    // ============================================================
    // MENU 3: TTV (FIXED)
    // ============================================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <div class="flex justify-between mb-4">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - Grafik TTV</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg font-bold">+ Data TTV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-100"><tr><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat</th><th class="p-2">GDS</th><th class="p-2">Hapus</th></tr></thead>
                        <tbody>
                            ${(p.ttv || []).map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td>
                                <td class="p-2 font-bold">${t.td}</td>
                                <td class="p-2">${t.sat}%</td>
                                <td class="p-2">${t.gds}</td>
                                <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500">x</button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`).join('');
    },

    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <input id="tt_td" placeholder="TD (120/80)" class="input-field">
                <input id="tt_sat" placeholder="Saturasi" class="input-field">
                <input id="tt_rr" placeholder="RR" class="input-field">
                <input id="tt_gds" placeholder="GDS" class="input-field">
                <input id="tt_tb" placeholder="TB" class="input-field">
                <input id="tt_bb" placeholder="BB" class="input-field">
                <button type="button" onclick="app.saveTTV('${pid}')" class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold mt-2">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const d = {
            time: new Date().toLocaleString(),
            td: document.getElementById('tt_td').value,
            sat: document.getElementById('tt_sat').value,
            rr: document.getElementById('tt_rr').value,
            gds: document.getElementById('tt_gds').value,
            tb: document.getElementById('tt_tb').value,
            bb: document.getElementById('tt_bb').value
        };
        if(!p.ttv) p.ttv = [];
        p.ttv.unshift(d);
        this.closeModal(); this.render(); await this.saveDB();
    },

    // ============================================================
    // MENU 4: VISIT DOKTER (DENGAN TTD)
    // ============================================================
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <div class="flex justify-between mb-4">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white text-xs px-3 py-2 rounded-lg font-bold">+ Input Visit</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.visits || []).map((v, i) => `
                        <div class="border rounded-xl p-3 bg-slate-50">
                            <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                            <p class="text-[10px] font-bold text-teal-600">${v.time}</p>
                            <p class="text-xs text-slate-700 bg-white p-2 border rounded my-2 h-16 overflow-y-auto">"${v.note}"</p>
                            <img src="${v.sign}" class="h-8 border-b border-slate-300">
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="mt-2 text-red-500 text-xs w-full text-right">Hapus Data</button>
                        </div>
                    `).join('')}
                </div>
            </div>`).join('');
    },

    modalVisit(pid) {
        document.getElementById('modal-title').innerText = "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-3">
                <input type="file" id="mv_photo" class="input-field text-xs">
                <textarea id="mv_note" placeholder="Catatan Perkembangan Pasien..." class="input-field h-24"></textarea>
                <div class="border p-2 rounded bg-white">
                    <p class="text-xs text-slate-400 mb-1">Tanda Tangan Dokter:</p>
                    <canvas id="sig-pad" class="w-full h-32 border bg-slate-50 cursor-crosshair"></canvas>
                    <button type="button" onclick="app.signaturePad.clear()" class="text-xs text-red-500">Ulangi TTD</button>
                </div>
                <button type="button" onclick="app.saveVisit('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        
        const c = document.getElementById('sig-pad');
        c.width = c.parentElement.clientWidth - 20;
        c.height = 120;
        this.signaturePad = new SignaturePad(c);
    },

    async saveVisit(pid) {
        if(this.signaturePad.isEmpty()) return alert("Tanda tangan wajib diisi!");
        
        const p = this.data.patients.find(x => x.id === pid);
        const f = document.getElementById('mv_photo').files[0];
        let photoBase64 = "https://via.placeholder.com/300?text=No+Photo";
        
        if(f) photoBase64 = await this.toBase64(f);
        
        const d = {
            time: new Date().toLocaleString(),
            note: document.getElementById('mv_note').value,
            photo: photoBase64,
            sign: this.signaturePad.toDataURL()
        };
        
        if(!p.visits) p.visits = [];
        p.visits.unshift(d);
        this.closeModal(); this.render(); await this.saveDB();
    },

    // ============================================================
    // MENU 5: CRISIS (CHART BPSS)
    // ============================================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item border-l-4 border-l-red-500">
                <div class="flex justify-between mb-4">
                    <h3 class="font-bold text-red-800">${p.reg.name} - CRISIS SCORE</h3>
                    <button onclick="app.modalCrisis('${p.id}')" class="bg-red-600 text-white text-xs px-3 py-2 rounded-lg font-bold">+ Input Score</button>
                </div>
                <div class="h-48 border rounded-xl p-2 mb-4 bg-slate-50">
                    <canvas id="chart-${p.id}"></canvas>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-red-50 text-red-900"><tr><th>Day</th><th>Total</th><th>Note</th><th>X</th></tr></thead>
                        <tbody>
                             ${(p.crisis?.bpss || []).map((b, i) => `
                                <tr class="border-b"><td class="p-2">H-${i+1}</td><td class="p-2 font-bold">${b.eval}</td><td class="p-2 text-slate-500 truncate max-w-[100px]">${b.note}</td>
                                <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500">x</button></td></tr>
                             `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`).join('');
        
        // Render Charts
        this.data.patients.forEach(p => {
            const ctx = document.getElementById(`chart-${p.id}`);
            if(ctx && p.crisis?.bpss?.length) {
                if(this.chartInstances[p.id]) this.chartInstances[p.id].destroy();
                this.chartInstances[p.id] = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: p.crisis.bpss.map((_, i) => `H-${i+1}`),
                        datasets: [{ 
                            label: 'Score (0-25)', data: p.crisis.bpss.map(b => b.eval),
                            borderColor: '#dc2626', backgroundColor: 'rgba(220,38,38,0.1)', fill: true, tension: 0.3
                        }]
                    },
                    options: { maintainAspectRatio: false, scales: { y: { min:0, max:25 } } }
                });
            }
        });
    },

    modalCrisis(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE (1-10)";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                <input type="number" id="cb_bio" placeholder="Bio Score" class="input-field">
                <input type="number" id="cb_psy" placeholder="Psy Score" class="input-field">
                <input type="number" id="cb_soc" placeholder="Soc Score" class="input-field">
                <input type="number" id="cb_spi" placeholder="Spi Score" class="input-field">
                <textarea id="cb_note" placeholder="Catatan Evaluasi..." class="col-span-2 input-field h-20"></textarea>
                <button type="button" onclick="app.saveCrisis('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-xl font-bold">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    async saveCrisis(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('cb_bio').value)||0;
        const psy = parseInt(document.getElementById('cb_psy').value)||0;
        const soc = parseInt(document.getElementById('cb_soc').value)||0;
        const spi = parseInt(document.getElementById('cb_spi').value)||0;
        
        if(!p.crisis) p.crisis = {bpss:[]};
        p.crisis.bpss.push({ bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('cb_note').value });
        
        this.closeModal(); this.render(); await this.saveDB();
    },

    // ============================================================
    // MENU PROGRAM & THERAPY (SIMPLE UPDATE)
    // ============================================================
    viewProgram(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <h3 class="font-bold text-teal-800 border-b pb-2 mb-4">${p.reg.name}</h3>
                <div class="space-y-4">
                     <select id="prog_type_${p.id}" onchange="app.quickSaveProg('${p.id}')" class="input-field">
                        <option value="Reguler" ${p.program?.type==='Reguler'?'selected':''}>Paket Reguler</option>
                        <option value="VIP" ${p.program?.type==='VIP'?'selected':''}>Paket VIP</option>
                     </select>
                     <select id="prog_dur_${p.id}" onchange="app.quickSaveProg('${p.id}')" class="input-field">
                        <option value="1 Minggu" ${p.program?.duration==='1 Minggu'?'selected':''}>1 Minggu</option>
                        <option value="1 Bulan" ${p.program?.duration==='1 Bulan'?'selected':''}>1 Bulan</option>
                     </select>
                </div>
            </div>`).join('');
    },

    async quickSaveProg(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = {
            type: document.getElementById(`prog_type_${pid}`).value,
            duration: document.getElementById(`prog_dur_${pid}`).value
        };
        await this.saveDB();
    },

    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm search-item">
                <h3 class="font-bold text-teal-800 border-b pb-2 mb-4">${p.reg.name} - CATATAN HARIAN</h3>
                <textarea id="th_note_${p.id}" class="input-field h-40 mb-2">${p.therapy || ''}</textarea>
                <button onclick="app.quickSaveTherapy('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Simpan Catatan</button>
            </div>`).join('');
    },

    async quickSaveTherapy(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.therapy = document.getElementById(`th_note_${pid}`).value;
        await this.saveDB();
        Swal.fire({icon: 'success', title: 'Tersimpan', toast: true, position: 'top-end', timer: 1000, showConfirmButton:false});
    },

    // ============================================================
    // UTILITIES
    // ============================================================
    async delPatient(pid) {
        if(confirm("Yakin hapus pasien ini permanen?")) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            this.render(); await this.saveDB();
        }
    },
    
    async delSubItem(pid, path, idx) {
        if(!confirm("Hapus item ini?")) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        this.render(); await this.saveDB();
    },
    
    async delMedLog(pid, idx) {
        if(!confirm("Hapus log minum obat? Stok tidak kembali otomatis.")) return;
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs.splice(idx, 1);
        this.render(); await this.saveDB();
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    
    exportMedicineExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        const rows = [];
        this.data.patients.forEach(p => {
             (p.medicine?.stock||[]).forEach(s => rows.push({Tipe:'STOK', Pasien:p.reg.name, Obat:s.name, Sisa:s.init-s.used}));
             (p.medicine?.logs||[]).forEach(l => rows.push({Tipe:'LOG', Pasien:p.reg.name, Obat:l.name, Waktu:l.time}));
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Obat");
        XLSX.writeFile(wb, "Laporan_Obat_MMRC.xlsx");
    },

    exportAllExcel() {
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Usia: p.reg.age, Diagnosa: p.diagnosis.dr_name }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "Data_Pasien.xlsx");
    }
};

// Start Global
window.app = app;
app.init();
