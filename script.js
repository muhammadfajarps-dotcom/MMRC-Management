// ============================================================
// 1. KONFIGURASI FIREBASE (CLAUDE FLARE - SESUAI REQUEST)
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

// INITIALIZE FIREBASE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ============================================================
// 2. APLIKASI UTAMA (LOGIC)
// ============================================================
const app = {
    data: { patients: [] }, 
    currentPage: 'dashboard',
    signaturePad: null,
    saveTimer: null,
    isRendering: false,
    chartInstances: {}, // SOLUSI KLIK IKUTAN (Agar chart tidak tumpuk)

    // --- SYSTEM STARTUP ---
    init() {
        console.log("App Starting...");
    },

    // --- SISTEM SIMPAN ANTI-LAG ---
    saveDB() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            try {
                // 1. Simpan Local
                const jsonStr = JSON.stringify(this.data);
                localStorage.setItem('MMRC_DATABASE', jsonStr);
                
                // 2. Simpan Cloud (Background)
                db.ref('mmrc_data').set(this.data).then(() => {
                    console.log("✅ Cloud Synced");
                }).catch(e => {
                    console.warn("⚠️ Offline Mode:", e);
                });
            } catch (err) {
                console.error("Storage Error:", err);
            }
        }, 800);
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATABASE');
        if (local) {
            try { this.data = JSON.parse(local); this.render(); } catch (e) { console.error(e); }
        }

        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                const isModalOpen = document.getElementById('modal-container') && !document.getElementById('modal-container').classList.contains('hidden');
                
                if (!this.data.patients || (JSON.stringify(this.data) !== JSON.stringify(cloudData) && !isModalOpen)) {
                    this.data = cloudData;
                    localStorage.setItem('MMRC_DATABASE', JSON.stringify(cloudData));
                    if (document.getElementById('app-layer') && !document.getElementById('app-layer').classList.contains('hidden')) {
                        this.render();
                    }
                }
            }
        });
    },

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
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase();
        
        setTimeout(() => this.render(), 50);
    },

    render() {
        if(this.isRendering) return;
        this.isRendering = true;

        requestAnimationFrame(() => {
            const container = document.getElementById('main-content');
            if (container) {
                container.innerHTML = ''; 
                switch (this.currentPage) {
                    case 'dashboard': this.viewDashboard(container); break;
                    case 'medicine': this.viewMedicine(container); break;
                    case 'ttv': this.viewTTV(container); break;
                    case 'visit': this.viewVisit(container); break;
                    case 'crisis': this.viewCrisis(container); break;
                    case 'program': this.viewProgram(container); break;
                    case 'therapy': this.viewTherapy(container); break;
                }
            }
            this.isRendering = false;
        });
    },

    // --- DASHBOARD (NO CHANGE) ---
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

        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">1. Biodata</p>
                    <div class="border border-dashed border-slate-300 p-2 rounded-xl text-center">
                        <input name="photo_file" type="file" class="text-[10px] w-full">
                        <p class="text-[9px] text-slate-400 mt-1">*Upload Foto Wajah</p>
                    </div>
                    <input name="name" value="${val(p?.reg?.name)}" placeholder="Nama Lengkap" class="input-field" required>
                    <div class="grid grid-cols-2 gap-2">
                        <input name="ttl" value="${val(p?.reg?.ttl)}" placeholder="TTL" class="input-field">
                        <input name="age" value="${val(p?.reg?.age)}" type="number" placeholder="Usia" class="input-field">
                    </div>
                    <input name="status" value="${val(p?.reg?.status)}" placeholder="Status Pernikahan" class="input-field">
                    <input name="edu" value="${val(p?.reg?.edu)}" placeholder="Pendidikan" class="input-field">
                    <input name="job" value="${val(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${val(p?.reg?.addr)}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${val(p?.reg?.guardian)}" placeholder="Wali" class="input-field">
                    <input name="spotcheck" value="${val(p?.reg?.spotcheck)}" placeholder="Spotcheck" class="input-field text-red-600">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">2. Riwayat Medis</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik & Psikologis" class="input-field h-24">${val(p?.history?.desc)}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Sebelumnya" class="input-field h-20">${val(p?.history?.prev_diag)}</textarea>
                    <input name="h_prev_rx" value="${val(p?.history?.prev_rx)}" placeholder="Riwayat Obat" class="input-field">
                    <textarea name="h_current" placeholder="Kondisi Saat Ini" class="input-field h-20 bg-amber-50">${val(p?.history?.current)}</textarea>
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">3. Assessment</p>
                    <input name="d_dr" value="${val(p?.diagnosis?.dr_name)}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Masuk" class="input-field h-20">${val(p?.diagnosis?.entry_diag)}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter" class="input-field h-20">${val(p?.diagnosis?.plan)}</textarea>
                    <div class="flex gap-4 text-[11px] bg-slate-50 p-3 rounded-xl border">
                        <label class="flex items-center gap-2"><input type="checkbox" name="inj" ${chk(p?.diagnosis?.inj)}> Injeksi</label>
                        <label class="flex items-center gap-2"><input type="checkbox" name="urine" ${chk(p?.diagnosis?.urine)}> Urine</label>
                        <label class="flex items-center gap-2"><input type="checkbox" name="fix" ${chk(p?.diagnosis?.fiksasi)}> Fiksasi</label>
                    </div>
                </div>
                <button class="md:col-span-3 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg mt-4 transition">
                    <i class="fas fa-save mr-2"></i> SIMPAN DATA PASIEN
                </button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault(); 
        this.closeModal(); 
        Swal.fire({ title: 'Menyimpan...', timer: 800, showConfirmButton: false, didOpen: () => Swal.showLoading() });

        const fd = new FormData(e.target);
        let photoBase64 = null;
        
        if (editId) {
            const existing = this.data.patients.find(x => x.id === editId);
            if(existing) photoBase64 = existing.reg.photo;
        }
        const photoFile = fd.get('photo_file');
        if (photoFile && photoFile.size > 0) photoBase64 = await this.toBase64(photoFile);

        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), ttl: fd.get('ttl'), age: fd.get('age'), status: fd.get('status'),
                edu: fd.get('edu'), job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'), photo: photoBase64,
                timestamp: editId ? this.data.patients.find(x => x.id === editId).reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: { 
                desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), 
                prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') 
            },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fiksasi: fd.get('fix')==='on',
            },
            medicine: editId ? this.data.patients.find(x => x.id === editId).medicine : { stock: [], logs: [] },
            ttv: editId ? this.data.patients.find(x => x.id === editId).ttv : [],
            visits: editId ? this.data.patients.find(x => x.id === editId).visits : [],
            crisis: editId ? this.data.patients.find(x => x.id === editId).crisis : { bpss: [] },
            program: editId ? this.data.patients.find(x => x.id === editId).program : { type: '', duration: '' },
            therapy: editId ? this.data.patients.find(x => x.id === editId).therapy : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            if(idx !== -1) this.data.patients[idx] = pData;
        } else {
            if(!this.data.patients) this.data.patients = [];
            this.data.patients.push(pData);
        }
        this.render(); this.saveDB();
    },

    // --- MEDICINE (FITUR NO.1: REMINDER < 7 & FITUR NO.3: EXCEL) ---
    viewMedicine(container) {
        if (!this.data.patients || this.data.patients.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center mt-10">Belum ada pasien terdaftar.</p>';
            return;
        }

        // FITUR NO.3: TOMBOL DOWNLOAD EXCEL
        container.innerHTML = `
        <div class="mb-4 text-right">
            <button onclick="app.exportMedicineExcel()" class="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 shadow flex items-center gap-2 ml-auto">
                <i class="fas fa-file-excel"></i> DOWNLOAD LAPORAN OBAT (XLS)
            </button>
        </div>` + 
        this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-6 text-lg border-b pb-2"><i class="fas fa-user-injured mr-2"></i> ${p.reg.name}</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400 tracking-wider">Stok Obat</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow hover:bg-teal-700 transition">+ Tambah Stok</button>
                        </div>
                        <div class="space-y-4">
                            ${(p.medicine?.stock || []).map((s, i) => {
                                const sisa = s.init - s.used;
                                
                                // FITUR NO.1: REMINDER JIKA STOK < 7 (MERAH & BERKEDIP)
                                const isLow = sisa < 7;
                                
                                return `
                                <div class="p-4 border rounded-2xl ${isLow ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} relative transition hover:shadow-md">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[10px] text-slate-500 mt-1">Awal: ${s.init} | Exp: ${s.exp}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-2xl font-black ${isLow ? 'text-red-500 animate-pulse':'text-teal-600'}">${sisa}</p>
                                            <p class="text-[8px] font-bold text-slate-400 uppercase">SISA TAB</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2 border-t pt-3 border-slate-200/50">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-[10px] font-bold flex-1 transition">Catat Minum</button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500 px-2 hover:bg-amber-50 rounded"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 px-2 hover:bg-red-50 rounded"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>`;
                            }).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4 tracking-wider">Log Penggunaan</h4>
                        <div class="overflow-x-auto border rounded-xl">
                            <table class="w-full text-[10px] text-left">
                                <thead class="bg-slate-100 text-slate-600">
                                    <tr><th class="p-3">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ</th><th class="p-3 text-right">Aksi</th></tr>
                                </thead>
                                <tbody class="divide-y">
                                    ${(p.medicine?.logs || []).map((l, i) => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="p-3 text-slate-500">${l.time}</td>
                                            <td class="p-3 font-bold text-slate-700">${l.name}</td>
                                            <td class="p-3">${l.pj}</td>
                                            <td class="p-3 flex gap-2 justify-end">
                                                <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500 hover:text-amber-600"><i class="fas fa-edit"></i></button>
                                                <button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                                            </td>
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

    // --- LOGIKA EXPORT EXCEL OBAT (BAGIAN DARI FITUR NO.3) ---
    exportMedicineExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        
        let rows = [];
        this.data.patients.forEach(p => {
            // Data Stok
            if(p.medicine && p.medicine.stock) {
                p.medicine.stock.forEach(s => {
                    rows.push({
                        "TIPE": "STOK",
                        "PASIEN": p.reg.name,
                        "NAMA OBAT": s.name,
                        "JUMLAH AWAL": s.init,
                        "TERPAKAI": s.used,
                        "SISA": s.init - s.used,
                        "EXPIRED": s.exp,
                        "KETERANGAN": "-"
                    });
                });
            }
            // Data Log
            if(p.medicine && p.medicine.logs) {
                p.medicine.logs.forEach(l => {
                    rows.push({
                        "TIPE": "PEMAKAIAN",
                        "PASIEN": p.reg.name,
                        "NAMA OBAT": l.name,
                        "JUMLAH AWAL": "-",
                        "TERPAKAI": 1,
                        "SISA": "-",
                        "EXPIRED": "-",
                        "KETERANGAN": `Waktu: ${l.time}, PJ: ${l.pj}`
                    });
                });
            }
        });

        if(rows.length === 0) return Swal.fire('Info', 'Belum ada data obat.', 'info');

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Laporan Obat");
        XLSX.writeFile(wb, "Laporan_Obat_MMRC.xlsx");
    },

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = editIdx !== null ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK OBAT" : "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s?.name||''}" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" value="${s?.init||''}" type="number" placeholder="Jumlah Stok Awal" class="input-field">
                <div class="space-y-1">
                     <p class="text-[10px] text-slate-400 font-bold ml-1">TANGGAL KADALUARSA:</p>
                     <input id="ms_exp" value="${s?.exp||''}" type="date" class="input-field">
                </div>
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold transition shadow-md">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const name = document.getElementById('ms_name').value;
        const init = parseInt(document.getElementById('ms_init').value);
        
        if (!name || isNaN(init)) return Swal.fire('Error', 'Nama & Jumlah wajib diisi', 'error');

        const data = { 
            name: name, init: init, 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };

        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        
        this.closeModal(); this.render(); this.saveDB(); 
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        if ((stock.init - stock.used) <= 0) return Swal.fire('Stok Habis', 'Obat ini sudah habis!', 'warning');

        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <h4 class="font-bold text-xl text-blue-900 mt-1">${stock.name}</h4>
                    <p class="text-xs text-blue-600 mt-1">(Stok akan berkurang 1)</p>
                </div>
                <input id="ml_pj" placeholder="Nama PJ (Perawat/Staff)" class="input-field">
                <textarea id="ml_note" placeholder="Keterangan..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold transition shadow-lg">KONFIRMASI PEMAKAIAN</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const pj = document.getElementById('ml_pj').value;
        if(!pj) return Swal.fire('Error', 'Nama PJ Wajib Diisi!', 'error');

        p.medicine.stock[sIdx].used += 1;
        p.medicine.logs.unshift({ 
            time: new Date().toLocaleString('id-ID'), 
            name: p.medicine.stock[sIdx].name, 
            pj: pj, 
            note: document.getElementById('ml_note').value 
        });
        
        this.closeModal(); this.render(); this.saveDB(); 
    },

    async delMedLog(pid, logIdx) {
        const result = await Swal.fire({
            title: 'Hapus?', text: "Stok akan dikembalikan.", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Ya, Hapus'
        });
        if (result.isConfirmed) {
            const p = this.data.patients.find(x => x.id === pid);
            const log = p.medicine.logs[logIdx];
            const stockItem = p.medicine.stock.find(s => s.name === log.name);
            if(stockItem && stockItem.used > 0) stockItem.used -= 1;

            p.medicine.logs.splice(logIdx, 1);
            this.render(); this.saveDB();
        }
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="el_time" value="${log.time}" class="input-field">
                <input id="el_name" value="${log.name}" class="input-field bg-slate-100" readonly>
                <input id="el_pj" value="${log.pj}" placeholder="Nama PJ" class="input-field">
                <textarea id="el_note" class="input-field">${log.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${logIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[logIdx].time = document.getElementById('el_time').value;
        p.medicine.logs[logIdx].pj = document.getElementById('el_pj').value;
        p.medicine.logs[logIdx].note = document.getElementById('el_note').value;
        this.closeModal(); this.render(); this.saveDB();
    },

    // --- TTV (NO CHANGE) ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <div class="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 class="font-bold text-teal-800 text-lg">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">+ INPUT DATA</button>
                </div>
                <div class="overflow-x-auto rounded-xl border">
                    <table class="w-full text-[11px] text-left">
                        <thead class="bg-slate-100 font-bold text-slate-700">
                            <tr>
                                <th class="p-3">Waktu</th>
                                <th class="p-3 bg-teal-50 text-teal-900 border-x border-teal-100 w-32 text-center">Tensi Darah (TD)</th>
                                <th class="p-3">Sat/RR</th>
                                <th class="p-3">TB/BB</th>
                                <th class="p-3">GDS</th>
                                <th class="p-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y">
                            ${(p.ttv || []).map((t, i) => `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-3">${t.time}</td>
                                    <td class="p-3 font-bold text-center bg-teal-50/50 text-teal-800 border-x border-teal-100">${t.td || '-'}</td>
                                    <td class="p-3">${t.sat}% / ${t.rr}</td>
                                    <td class="p-3">${t.tb}/${t.bb}</td>
                                    <td class="p-3 font-bold">${t.gds}</td>
                                    <td class="p-3 flex gap-2 justify-end">
                                        <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = editIdx !== null ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT DATA TTV" : "INPUT DATA TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 bg-teal-50 p-3 rounded-xl border border-teal-100">
                    <label class="text-xs font-bold text-teal-800">Tekanan Darah (TD):</label>
                    <input id="t_td" value="${t?.td||''}" placeholder="Contoh: 120/80" class="input-field mt-1 font-bold text-lg text-center">
                </div>
                <input id="t_sat" value="${t?.sat||''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?.rr||''}" placeholder="Resp Rate (RR)" class="input-field">
                <input id="t_tb" value="${t?.tb||''}" placeholder="Tinggi (cm)" class="input-field">
                <input id="t_bb" value="${t?.bb||''}" placeholder="Berat (kg)" class="input-field">
                <input id="t_gds" value="${t?.gds||''}" placeholder="Gula Darah (GDS)" class="input-field">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold mt-2 shadow-lg">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const data = { 
            time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString('id-ID'), 
            td: document.getElementById('t_td').value, sat: document.getElementById('t_sat').value, 
            rr: document.getElementById('t_rr').value, tb: document.getElementById('t_tb').value, 
            bb: document.getElementById('t_bb').value, gds: document.getElementById('t_gds').value 
        };
        
        if(idx !== null) p.ttv[idx] = data; else p.ttv.unshift(data);
        this.closeModal(); this.render(); this.saveDB();
    },

    // --- VISIT (NO CHANGE) ---
    viewVisit(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow hover:bg-teal-700 transition">SIMPAN VISIT BARU</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${(p.visits || []).map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative hover:shadow-md transition">
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white border">
                            <p class="text-[10px] text-teal-600 font-bold mb-1"><i class="far fa-clock"></i> ${v.time}</p>
                            <div class="bg-white p-2 rounded border border-dashed text-xs italic text-slate-600 h-20 overflow-y-auto mb-2">"${v.note}"</div>
                            <div class="flex justify-between items-end">
                                <img src="${v.sign}" class="h-10 border-b border-slate-300">
                                <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    modalAddVisit(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = editIdx !== null ? p.visits[editIdx] : null;
        document.getElementById('modal-title').innerText = v ? "EDIT VISIT" : "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="border border-dashed p-3 rounded-xl text-center">
                    <input type="file" id="v_photo" class="input-field text-xs mb-1">
                    <p class="text-[9px] text-slate-400">Foto Kegiatan Visit</p>
                </div>
                <textarea id="v_note" placeholder="Hasil Wawancara..." class="input-field h-32">${v?.note||''}</textarea>
                <div class="border rounded-xl p-3 bg-white text-center shadow-inner">
                    <p class="text-xs font-bold text-slate-400 mb-2 text-left">Tanda Tangan Dokter:</p>
                    <canvas id="sig-pad" class="w-full h-40 border bg-slate-50 rounded-lg cursor-crosshair"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[10px] text-red-500 mt-2 font-bold hover:underline">Bersihkan TTD</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold shadow-lg">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        
        const canvas = document.getElementById('sig-pad');
        canvas.width = canvas.parentElement.clientWidth - 24; 
        canvas.height = 160;
        this.signaturePad = new SignaturePad(canvas);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if (this.signaturePad.isEmpty()) return Swal.fire('Error', 'Tanda tangan wajib diisi', 'warning');
        
        this.closeModal();

        const file = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : "https://via.placeholder.com/400x300?text=No+Photo";
        if(file) photo = await this.toBase64(file);

        const data = { 
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), 
            note: document.getElementById('v_note').value, 
            photo: photo, 
            sign: this.signaturePad.toDataURL() 
        };

        if(idx !== null) p.visits[idx] = data; else p.visits.unshift(data);
        this.render(); this.saveDB();
    },

    // --- CRISIS (FITUR NO.2: GRAFIK H1-H7 & SKALA 0-25 & FIX KLIK IKUTAN) ---
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
                            <thead class="bg-red-50 text-red-900">
                                <tr><th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Total</th><th class="p-2">Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${(p.crisis?.bpss || []).map((b, i) => `
                                    <tr class="border-b hover:bg-slate-50">
                                        <td class="p-2 font-bold">H-${i+1}</td><td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
                                        <td class="p-2 font-black text-red-600 text-lg">${b.eval}</td>
                                        <td class="p-2">
                                            <button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>`).join('')}
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

        // SOLUSI "KLIK IKUTAN": Hancurkan chart lama sebelum buat baru
        if (this.chartInstances[p.id]) {
            this.chartInstances[p.id].destroy();
        }

        this.chartInstances[p.id] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `H-${i+1}`), // LABEL SUMBU X: H-1, H-2, dst
                datasets: [{ 
                    label: 'Skor BPSS', 
                    data: p.crisis.bpss.map(b => b.eval), 
                    borderColor: '#dc2626', 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: true, 
                    tension: 0.3,
                    pointRadius: 6,
                    pointBackgroundColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: { 
                maintainAspectRatio: false,
                scales: {
                    y: { 
                        beginAtZero: true, 
                        min: 0,
                        max: 25, // SKALA SUMBU Y: 0-25
                        grid: { color: '#f1f5f9' },
                        title: { display: true, text: 'Score (0-25)' }
                    },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 bg-red-50 p-2 rounded text-[10px] text-red-800 mb-2">Isi score 1-10</div>
                <input id="b_bio" type="number" placeholder="Bio" class="input-field">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field">
                <textarea id="b_note" placeholder="Evaluasi Harian..." class="input-field col-span-2 h-24"></textarea>
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold shadow-lg">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('b_bio').value)||0, psy = parseInt(document.getElementById('b_psy').value)||0, soc = parseInt(document.getElementById('b_soc').value)||0, spi = parseInt(document.getElementById('b_spi').value)||0;
        p.crisis.bpss.push({ bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('b_note').value });
        this.closeModal(); this.render(); this.saveDB();
    },

    // --- PROGRAM (NO CHANGE) ---
    viewProgram(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-4 text-lg border-b pb-2">${p.reg.name} - PROGRAM</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-teal-50 p-5 rounded-2xl border text-center"><p class="text-xs font-bold mb-1">PAKET</p><p class="text-xl font-black">${p.program.type || '-'}</p></div>
                    <div class="bg-blue-50 p-5 rounded-2xl border text-center"><p class="text-xs font-bold mb-1">DURASI</p><p class="text-xl font-black">${p.program.duration || '-'}</p></div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="w-full bg-teal-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow transition">EDIT PROGRAM</button>
            </div>
        `).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <label class="text-xs font-bold text-slate-500">Paket:</label>
                <select id="pr_type" class="input-field"><option value="Reguler">Reguler</option><option value="Eksklusif">Eksklusif</option><option value="VIP">VIP</option></select>
                <label class="text-xs font-bold text-slate-500">Durasi:</label>
                <select id="pr_dur" class="input-field"><option value="7 Hari">7 Hari</option><option value="14 Hari">14 Hari</option><option value="30 Hari">30 Hari</option><option value="Bebas">Bebas</option></select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold shadow-lg mt-4">SIMPAN</button>
            </div>`;
        this.openModal();
        document.getElementById('pr_type').value = p.program.type || 'Reguler';
        document.getElementById('pr_dur').value = p.program.duration || '7 Hari';
    },

    async saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { type: document.getElementById('pr_type').value, duration: document.getElementById('pr_dur').value };
        this.closeModal(); this.render(); this.saveDB();
    },

    // --- THERAPY (NO CHANGE) ---
    viewTherapy(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-4 text-lg border-b pb-2">${p.reg.name} - CATATAN TERAPI</h3>
                <textarea id="ther_${p.id}" class="input-field h-40 mb-4 font-mono text-sm leading-relaxed p-4 bg-slate-50">${p.therapy || ''}</textarea>
                <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow transition">SIMPAN CATATAN</button>
            </div>
        `).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        this.saveDB(); 
        const toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 800 });
        toast.fire({ icon: 'success', title: 'Tersimpan' });
    },

    // --- UTILS & GLOBAL ---
    async delPatient(pid) {
        const res = await Swal.fire({ title: 'Hapus Pasien?', text: "Data hilang permanen!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Ya, Hapus' });
        if(res.isConfirmed) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            this.render(); this.saveDB();
            Swal.fire('Terhapus', '', 'success');
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        this.render(); this.saveDB();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),

    exportAllExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Usia: p.reg.age, Diagnosa: p.diagnosis.dr_name, Planning: p.diagnosis.plan }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien MMRC");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    },

    // FITUR NO.3: EXPORT WORD (LENGKAP DENGAN FOTO & TTD)
    async exportToWord() {
        if (!this.data.patients || this.data.patients.length === 0) return Swal.fire('Info', 'Data kosong.', 'info');
        if(typeof docx === 'undefined') return Swal.fire('Error', 'Library Word belum siap. Coba refresh.', 'error');

        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, ImageRun, TextRun } = docx;

        // Helper untuk konversi Base64 ke Blob
        const b64toBlob = (b64) => {
            if(!b64 || !b64.includes('base64,')) return null;
            try {
                const bin = atob(b64.split(',')[1]);
                const len = bin.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
                return bytes;
            } catch(e) { return null; }
        };

        const children = [];
        // JUDUL LAPORAN
        children.push(new Paragraph({ text: "LAPORAN LENGKAP MMRC", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: `Dicetak: ${new Date().toLocaleString('id-ID')}`, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: "" })); 

        // LOOP SETIAP PASIEN
        for (const p of this.data.patients) {
            const profileImg = b64toBlob(p.reg.photo);
            
            // Halaman Baru per Pasien
            children.push(new Paragraph({ text: `PASIEN: ${p.reg.name} (ID: ${p.id})`, heading: HeadingLevel.HEADING_2, pageBreakBefore: true }));
            
            // FOTO PROFIL
            if(profileImg) {
                children.push(new Paragraph({
                    children: [new ImageRun({ data: profileImg, transformation: { width: 100, height: 100 } })],
                    alignment: AlignmentType.CENTER
                }));
            }

            // TABEL BIODATA
            children.push(new Paragraph({ text: "BIODATA & DIAGNOSA", heading: HeadingLevel.HEADING_4 }));
            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Diagnosa")] }), new TableCell({ children: [new Paragraph(p.diagnosis.plan || "-")] }) ] }),
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Dokter")] }), new TableCell({ children: [new Paragraph(p.diagnosis.dr_name || "-")] }) ] }),
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Kondisi Terkini")] }), new TableCell({ children: [new Paragraph(p.history.current || "-")] }) ] }),
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Program")] }), new TableCell({ children: [new Paragraph(`${p.program.type} (${p.program.duration})]`)] }) ] }),
                ]
            }));
            children.push(new Paragraph({ text: "" }));

            // RIWAYAT VISIT (DENGAN FOTO & TTD)
            children.push(new Paragraph({ text: "RIWAYAT VISIT DOKTER", heading: HeadingLevel.HEADING_4 }));
            
            if(p.visits && p.visits.length > 0) {
                for(const v of p.visits) {
                    const visitImg = b64toBlob(v.photo);
                    const signImg = b64toBlob(v.sign);
                    
                    const visitCells = [
                        new TableCell({ children: [new Paragraph({ text: v.time, bold: true }), new Paragraph(v.note)] }),
                    ];

                    if(signImg) {
                        visitCells.push(new TableCell({ 
                            children: [
                                new Paragraph("TTD Dokter:"),
                                new Paragraph({ children: [new ImageRun({ data: signImg, transformation: { width: 80, height: 40 } })] })
                            ] 
                        }));
                    } else {
                         visitCells.push(new TableCell({ children: [new Paragraph("-")] }));
                    }

                    children.push(new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [new TableRow({ children: visitCells })]
                    }));
                    
                    if(visitImg) {
                        children.push(new Paragraph({
                            children: [new ImageRun({ data: visitImg, transformation: { width: 150, height: 100 } })],
                            alignment: AlignmentType.CENTER
                        }));
                    }
                    children.push(new Paragraph({ text: "" })); 
                }
            } else {
                children.push(new Paragraph({ text: "Belum ada data visit.", italic: true }));
            }
            
            // TABEL OBAT
            children.push(new Paragraph({ text: "RIWAYAT OBAT", heading: HeadingLevel.HEADING_4 }));
            const medRows = [
                new TableRow({ 
                    children: [
                        new TableCell({ children: [new Paragraph({text: "Waktu", bold:true})] }),
                        new TableCell({ children: [new Paragraph({text: "Nama Obat", bold:true})] }),
                        new TableCell({ children: [new Paragraph({text: "PJ", bold:true})] })
                    ] 
                })
            ];
            (p.medicine?.logs || []).forEach(l => {
                medRows.push(new TableRow({
                    children: [
                         new TableCell({ children: [new Paragraph(l.time)] }),
                         new TableCell({ children: [new Paragraph(l.name)] }),
                         new TableCell({ children: [new Paragraph(l.pj)] }),
                    ]
                }));
            });
            children.push(new Table({ rows: medRows, width: { size: 100, type: WidthType.PERCENTAGE } }));
            children.push(new Paragraph({ text: "__________________________________________________________________________________" }));
        }

        // GENERATE FILE
        const doc = new Document({ sections: [{ children: children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a); a.style="display:none"; a.href=url; a.download="Laporan_MMRC_Lengkap.docx"; a.click();
        window.URL.revokeObjectURL(url);
    }
};

// START APP
window.app = app;
app.init();
