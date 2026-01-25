// 1. KONFIGURASI FIREBASE ANDA
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// 2. INITIALIZE FIREBASE
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    // --- FITUR AUTO-REPAIR (PENTING: MENCEGAH CRASH DATA LAMA) ---
    fixDataStructure(data) {
        if (!data || !data.patients) return { patients: [] };
        
        data.patients = data.patients.map(p => {
            // Pastikan objek utama ada
            if (!p.reg) p.reg = {};
            if (!p.history) p.history = {};
            if (!p.diagnosis) p.diagnosis = {};
            
            // Perbaikan Menu Medicine (Obat)
            // Jika data lama tidak punya folder medicine, kita buatkan kosong
            if (!p.medicine) p.medicine = { stock: [], logs: [] };
            if (!p.medicine.stock) p.medicine.stock = [];
            if (!p.medicine.logs) p.medicine.logs = [];

            // Perbaikan Menu TTV
            if (!p.ttv) p.ttv = [];

            // Perbaikan Menu Visit
            if (!p.visits) p.visits = [];

            // Perbaikan Menu Crisis (BPSS)
            if (!p.crisis) p.crisis = { bpss: [] };
            if (!p.crisis.bpss) p.crisis.bpss = [];

            // Perbaikan Menu Program
            if (!p.program) p.program = { type: '-', duration: '-' };

            // Perbaikan Menu Therapy
            if (!p.therapy) p.therapy = '';

            return p;
        });
        return data;
    },

    async saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        try {
            await db.ref('mmrc_data').set(this.data);
            console.log("Data Tersinkron ke Cloud");
        } catch (e) {
            console.error("Gagal Sinkron:", e);
            Swal.fire('Koneksi Error', 'Gagal menyimpan ke cloud (cek internet), data tersimpan di lokal.', 'warning');
        }
    },

   async loadDB() {
        // Loading screen
        const loadingTimeout = setTimeout(() => {
            if (Swal.isVisible()) {
                Swal.close();
                Swal.fire('Memuat Data', 'Sedang mengambil dan memperbaiki data...', 'info');
            }
        }, 2000);

        try {
            const snapshot = await db.ref('mmrc_data').once('value');
            let cloudData = snapshot.val();
            
            if (cloudData) {
                // JALANKAN PERBAIKAN STRUKTUR DATA
                this.data = this.fixDataStructure(cloudData);
                console.log("Data Cloud Berhasil Diambil & Diperbaiki");
            } else {
                this.data = { patients: [] };
            }

            clearTimeout(loadingTimeout);
            Swal.close();
            this.render();
        } catch (e) {
            console.error("Gagal ambil data cloud:", e);
            clearTimeout(loadingTimeout);
            Swal.close();
            
            const local = localStorage.getItem('MMRC_DATABASE');
            if (local) {
                this.data = this.fixDataStructure(JSON.parse(local));
                Swal.fire('Mode Offline', 'Data diambil dari penyimpanan lokal.', 'info');
            } else {
                this.data = { patients: [] };
            }
            this.render();
        }
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
        container.innerHTML = '';
        
        // Safety check lagi
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
        } catch (error) {
            console.error("Render Error:", error);
            Swal.fire("Error Tampilan", "Terjadi kesalahan data. Silakan refresh halaman.", "error");
        }
    },

    // --- VIEW DASHBOARD ---
    viewDashboard(container) {
        const patients = this.data.patients || [];
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold transition hover:bg-teal-700 shadow-md">+ REGISTRASI MASUK</button>
            </div>
            <div class="space-y-8 pb-10">
                ${patients.length === 0 ? '<p class="text-center text-slate-400 italic">Belum ada data pasien.</p>' : ''}
                ${patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item hover:shadow-md transition">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="border-r pr-4">
                                <div class="flex items-center gap-3 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-xl object-cover border bg-slate-100">
                                    <div>
                                        <h4 class="font-bold text-teal-700 text-lg">${p.reg.name || 'Tanpa Nama'}</h4>
                                        <p class="text-[10px] text-slate-400">${p.reg.timestamp || '-'}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>TTL/Usia:</b> ${p.reg.ttl||'-'} / ${p.reg.age||'-'} Thn</p>
                                    <p><b>Status/Pdk:</b> ${p.reg.status||'-'} / ${p.reg.edu||'-'}</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job||'-'}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr||'-'}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian||'-'}</p>
                                    <p class="text-red-500"><b>Spotcheck:</b> ${p.reg.spotcheck||'-'}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">Riwayat & Kondisi</h5>
                                <div class="text-[11px] space-y-2">
                                    <p><b>Fisik/Psikis:</b> ${p.history.desc||'-'}</p>
                                    <p><b>Diagnosa Lalu:</b> ${p.history.prev_diag||'-'}</p>
                                    <p><b>Dosis Lalu:</b> ${p.history.prev_rx||'-'}</p>
                                    <p class="bg-amber-50 p-2 rounded border border-amber-100 text-amber-900"><b>Terkini:</b> ${p.history.current||'-'}</p>
                                </div>
                            </div>
                            <div class="px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">Diagnosa Dokter</h5>
                                <div class="text-[11px] space-y-1">
                                    <p><b>Dokter:</b> ${p.diagnosis.dr_name||'-'}</p>
                                    <p><b>Planning:</b> ${p.diagnosis.plan||'-'}</p>
                                    <div class="flex gap-2 my-2">
                                        <span class="${p.diagnosis.inj ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Injeksi</span>
                                        <span class="${p.diagnosis.urine ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Urine Test</span>
                                        <span class="${p.diagnosis.fiksasi ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Fiksasi</span>
                                    </div>
                                    <p class="mt-2"><b>Resep:</b> <span class="font-bold text-teal-700">${p.diagnosis.rx_name||'-'} (${p.diagnosis.rx_qty||0})</span></p>
                                </div>
                                <div class="mt-4 flex gap-2">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="flex-1 text-amber-600 border border-amber-600 px-3 py-1.5 rounded-lg text-[10px] hover:bg-amber-50 font-bold">EDIT DATA</button>
                                    <button onclick="app.delPatient('${p.id}')" class="flex-1 text-red-600 border border-red-600 px-3 py-1.5 rounded-lg text-[10px] hover:bg-red-50 font-bold">HAPUS</button>
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

        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">1. Biodata</p>
                    <div class="bg-slate-50 p-2 rounded border">
                        <label class="text-[10px] text-slate-400 block mb-1">Foto</label>
                        <input name="photo_file" type="file" class="w-full text-[10px]">
                    </div>
                    <input name="name" value="${val(p?.reg?.name)}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${val(p?.reg?.ttl)}" placeholder="TTL" class="input-field">
                    <input name="age" value="${val(p?.reg?.age)}" type="number" placeholder="Usia" class="input-field">
                    <input name="status" value="${val(p?.reg?.status)}" placeholder="Status" class="input-field">
                    <input name="edu" value="${val(p?.reg?.edu)}" placeholder="Pendidikan" class="input-field">
                    <input name="job" value="${val(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${val(p?.reg?.addr)}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${val(p?.reg?.guardian)}" placeholder="Wali" class="input-field">
                    <input name="spotcheck" value="${val(p?.reg?.spotcheck)}" placeholder="Spotcheck" class="input-field">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">2. Riwayat</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik/Psikis" class="input-field h-24">${val(p?.history?.desc)}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Lalu" class="input-field h-24">${val(p?.history?.prev_diag)}</textarea>
                    <input name="h_prev_rx" value="${val(p?.history?.prev_rx)}" placeholder="Dosis Lalu" class="input-field">
                    <input name="h_current" value="${val(p?.history?.current)}" placeholder="Kondisi Terkini" class="input-field font-bold text-amber-700 bg-amber-50">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">3. Diagnosa</p>
                    <input name="d_dr" value="${val(p?.diagnosis?.dr_name)}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Masuk" class="input-field h-20">${val(p?.diagnosis?.entry_diag)}</textarea>
                    <textarea name="d_plan" placeholder="Planning" class="input-field h-20">${val(p?.diagnosis?.plan)}</textarea>
                    <div class="flex gap-4 text-[11px] bg-slate-100 p-3 rounded-xl border">
                        <label><input type="checkbox" name="inj" ${p?.diagnosis?.inj?'checked':''}> Injeksi</label>
                        <label><input type="checkbox" name="urine" ${p?.diagnosis?.urine?'checked':''}> Urine</label>
                        <label><input type="checkbox" name="fix" ${p?.diagnosis?.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                    <input name="d_rx" value="${val(p?.diagnosis?.rx_name)}" placeholder="Nama Obat" class="input-field">
                    <input name="d_qty" value="${val(p?.diagnosis?.rx_qty)}" type="number" placeholder="Jumlah" class="input-field">
                </div>
                <button class="md:col-span-3 bg-teal-600 text-white py-4 rounded-2xl font-bold hover:bg-teal-700">SIMPAN DATA</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        
        let photoBase64 = null;
        let existingPatient = null;

        if (editId) {
             existingPatient = this.data.patients.find(x => x.id === editId);
             photoBase64 = existingPatient.reg.photo;
        }

        if (photoFile && photoFile.size > 0) {
            photoBase64 = await this.toBase64(photoFile);
        }

        // INIT DEFAULT SUB-DATA AGAR TIDAK ERROR
        const defMed = { stock: [], logs: [] };
        const defCrisis = { bpss: [] };
        
        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), ttl: fd.get('ttl'), age: fd.get('age'), status: fd.get('status'),
                edu: fd.get('edu'), job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'), photo: photoBase64,
                timestamp: editId ? existingPatient.reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: { desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fiksasi: fd.get('fix')==='on',
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
            },
            // PENTING: Pertahankan data lama, atau buat baru jika kosong
            medicine: existingPatient ? (existingPatient.medicine || defMed) : defMed,
            ttv: existingPatient ? (existingPatient.ttv || []) : [],
            visits: existingPatient ? (existingPatient.visits || []) : [],
            crisis: existingPatient ? (existingPatient.crisis || defCrisis) : defCrisis,
            program: existingPatient ? (existingPatient.program || { type: '-', duration: '-' }) : { type: '-', duration: '-' },
            therapy: existingPatient ? (existingPatient.therapy || '') : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            this.data.patients[idx] = pData;
        } else {
            if(!this.data.patients) this.data.patients = [];
            this.data.patients.push(pData);
        }
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
        Swal.fire('Berhasil', 'Data Pasien Tersimpan', 'success');
    },

    // --- MEDICINE LOGIC (UPDATED WITH SAFETY CHECK) ---
    viewMedicine(container) {
        const patients = this.data.patients || [];
        container.innerHTML = patients.map(p => {
            // Safety Check: Gunakan '?' dan '||'
            const stock = p.medicine?.stock || [];
            const logs = p.medicine?.logs || [];
            
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <div class="flex items-center gap-3 mb-6 pb-4 border-b">
                    <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                        ${p.reg.name.charAt(0)}
                    </div>
                    <h3 class="font-bold text-teal-800 text-lg">${p.reg.name} <span class="text-slate-400 font-normal text-sm">| Manajemen Obat</span></h3>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="bg-slate-50 p-4 rounded-2xl border">
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><i class="fas fa-box"></i> Stok Obat</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">+ STOK</button>
                        </div>
                        <div class="space-y-3">
                            ${stock.length === 0 ? '<p class="text-[10px] text-center text-slate-400">Belum ada stok.</p>' : ''}
                            ${stock.map((s, i) => `
                                <div class="p-4 border rounded-xl bg-white relative shadow-sm">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[10px] text-slate-500 mt-1">Awal: ${s.init} | Exp: ${s.exp}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xl font-black ${s.init-s.used <= 5 ? 'text-red-500 animate-pulse':'text-emerald-600'}">${s.init-s.used}</p>
                                            <p class="text-[8px] font-bold text-slate-400">SISA</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2 pt-2 border-t">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="flex-1 bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold">MINUM</button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500 px-2"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 px-2"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2"><i class="fas fa-history"></i> Log Penggunaan</h4>
                        <div class="overflow-x-auto border rounded-xl shadow-sm bg-white">
                            <table class="w-full text-[10px] text-left">
                                <thead class="bg-slate-100 text-slate-600 font-bold uppercase">
                                    <tr><th class="p-3">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ</th><th class="p-3 text-center">Aksi</th></tr>
                                </thead>
                                <tbody class="divide-y">
                                    ${logs.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-slate-400">Kosong.</td></tr>' : ''}
                                    ${logs.map((l, i) => `
                                        <tr class="hover:bg-slate-50">
                                            <td class="p-3">${l.time}</td>
                                            <td class="p-3 font-bold text-teal-700">${l.name}</td>
                                            <td class="p-3">${l.pj}</td>
                                            <td class="p-3 flex justify-center gap-3">
                                                <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                                <button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = editIdx !== null ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK" : "TAMBAH STOK";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s?s.name:''}" placeholder="Nama Obat" class="input-field">
                <div class="grid grid-cols-2 gap-4">
                    <input id="ms_init" value="${s?s.init:''}" type="number" placeholder="Jumlah Stok" class="input-field">
                    <input id="ms_exp" value="${s?s.exp:''}" type="date" class="input-field">
                </div>
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        // Pastikan path ada
        if (!p.medicine) p.medicine = { stock: [], logs: [] };

        const data = { 
            name: document.getElementById('ms_name').value, 
            init: parseInt(document.getElementById('ms_init').value) || 0, 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };
        
        if (!data.name) return Swal.fire('Error', 'Nama obat wajib diisi', 'error');

        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        if (stock.init - stock.used <= 0) return Swal.fire('Stok Habis', 'Obat sudah habis!', 'error');

        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4 text-center">
                <h2 class="text-xl font-black text-teal-700">${stock.name}</h2>
                <input id="ml_pj" placeholder="Nama PJ (Wajib)" class="input-field text-center font-bold">
                <textarea id="ml_note" placeholder="Keterangan..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        if(!pj) return Swal.fire('Error', 'Isi Nama PJ!', 'error');

        stock.used += 1;
        p.medicine.logs.unshift({ time: new Date().toLocaleString('id-ID'), name: stock.name, pj: pj, note: document.getElementById('ml_note').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    async delMedLog(pid, logIdx) {
        const result = await Swal.fire({
            title: 'Hapus Log?',
            text: "Stok obat akan dikembalikan (+1).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus'
        });

        if (result.isConfirmed) {
            const p = this.data.patients.find(x => x.id === pid);
            const log = p.medicine.logs[logIdx];
            const stockItem = p.medicine.stock.find(s => s.name === log.name);
            
            if(stockItem && stockItem.used > 0) stockItem.used -= 1;
            
            p.medicine.logs.splice(logIdx, 1);
            await this.saveDB(); this.render();
        }
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT LOG";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="el_time" value="${log.time}" class="input-field">
                <input id="el_name" value="${log.name}" class="input-field bg-slate-100" readonly>
                <input id="el_pj" value="${log.pj}" class="input-field">
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
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- TTV ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients || []).map(p => {
            const ttv = p.ttv || [];
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT TTV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-[11px] text-left">
                        <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat/RR</th><th class="p-2">TB/BB</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                        ${ttv.map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}% / ${t.rr}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2 font-bold">${t.gds}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                    </table>
                </div>
            </div>`;
        }).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = editIdx !== null ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT TTV" : "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" value="${t?t.td:''}" placeholder="TD (mmHg)" class="input-field">
                <input id="t_sat" value="${t?t.sat:''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?t.rr:''}" placeholder="RR" class="input-field">
                <input id="t_tb" value="${t?t.tb:''}" placeholder="TB (cm)" class="input-field">
                <input id="t_bb" value="${t?t.bb:''}" placeholder="BB (kg)" class="input-field">
                <input id="t_gds" value="${t?t.gds:''}" placeholder="GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.ttv) p.ttv = [];
        
        const data = { time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString('id-ID'), td: document.getElementById('t_td').value, sat: document.getElementById('t_sat').value, rr: document.getElementById('t_rr').value, tb: document.getElementById('t_tb').value, bb: document.getElementById('t_bb').value, gds: document.getElementById('t_gds').value };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VISIT ---
    viewVisit(container) {
        container.innerHTML = (this.data.patients || []).map(p => {
            const visits = p.visits || [];
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ VISIT</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${visits.map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative group">
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="absolute top-2 right-2 bg-white text-red-500 rounded-full px-2 shadow hidden group-hover:block"><i class="fas fa-times"></i></button>
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                            <p class="text-[10px] text-teal-600 font-bold">${v.time}</p>
                            <p class="text-xs italic my-2 bg-white p-2 rounded border">"${v.note}"</p>
                            <div class="flex justify-end"><img src="${v.sign}" class="h-12 border-b-2"></div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        }).join('');
    },

    modalAddVisit(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = editIdx !== null ? p.visits[editIdx] : null;
        document.getElementById('modal-title').innerText = v ? "EDIT VISIT" : "INPUT VISIT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field text-xs">
                <textarea id="v_note" placeholder="Hasil Wawancara..." class="input-field h-32">${v?v.note:''}</textarea>
                <div class="border rounded-xl p-2 bg-white text-center shadow-inner">
                    <canvas id="sig-pad" class="w-full h-40 border bg-slate-50 rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[10px] text-red-500 mt-2">Hapus Tanda Tangan</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
        setTimeout(() => {
            const c = document.getElementById('sig-pad');
            if(c) { c.width = c.offsetWidth; c.height = c.offsetHeight; this.signaturePad = new SignaturePad(c); }
        }, 100);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.visits) p.visits = [];

        if(this.signaturePad.isEmpty() && idx === null) return Swal.fire('Error', 'Tanda tangan wajib!', 'warning');

        const file = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : "https://via.placeholder.com/400x300?text=No+Photo";
        if(file) photo = await this.toBase64(file);
        
        let sign = this.signaturePad.isEmpty() && idx !== null ? p.visits[idx].sign : this.signaturePad.toDataURL();
        const data = { time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), note: document.getElementById('v_note').value, photo: photo, sign: sign };
        
        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- CRISIS (UPDATED WITH SAFETY CHECK) ---
    viewCrisis(container) {
        container.innerHTML = (this.data.patients || []).map(p => {
            // Safety Check
            const crisis = p.crisis || { bpss: [] };
            const bpss = crisis.bpss || [];
            
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ SCORE BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border rounded-lg">
                            <thead class="bg-red-50 text-red-900">
                                <tr><th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Total</th><th class="p-2">Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${bpss.map((b, i) => `
                                    <tr class="border-b">
                                        <td class="p-2 font-bold">D-${i+1}</td>
                                        <td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
                                        <td class="p-2 font-bold text-red-600">${b.eval}</td>
                                        <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-4 bg-white relative">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
            </div>`;
        }).join('');
        
        setTimeout(() => this.data.patients.forEach(p => this.renderChart(p)), 50);
    },

    renderChart(p) {
        // Pastikan element ada dan data ada sebelum render chart
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis || !p.crisis.bpss || p.crisis.bpss.length === 0) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `D-${i+1}`),
                datasets: [{ label: 'Skor BPSS', data: p.crisis.bpss.map(b => b.eval), borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.4 }]
            },
            options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
        });
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-4 gap-4 mb-4">
                <input id="b_bio" type="number" placeholder="Bio" class="input-field text-center">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field text-center">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field text-center">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field text-center">
            </div>
            <textarea id="b_note" placeholder="Evaluasi..." class="input-field w-full h-24 mb-4"></textarea>
            <button onclick="app.saveBPSS('${pid}')" class="w-full bg-red-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
        `;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.crisis) p.crisis = { bpss: [] };
        if(!p.crisis.bpss) p.crisis.bpss = [];

        const bio = parseInt(document.getElementById('b_bio').value)||0;
        const psy = parseInt(document.getElementById('b_psy').value)||0;
        const soc = parseInt(document.getElementById('b_soc').value)||0;
        const spi = parseInt(document.getElementById('b_spi').value)||0;
        
        p.crisis.bpss.push({ bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('b_note').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- PROGRAM ---
    viewProgram(container) {
        container.innerHTML = (this.data.patients || []).map(p => {
            const prog = p.program || { type: '-', duration: '-' };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - PROGRAM</h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-teal-50 p-6 rounded-xl border border-teal-100 text-center">
                        <p class="text-xs text-teal-600 uppercase font-bold">Paket</p>
                        <p class="text-xl font-black text-slate-700 mt-1">${prog.type}</p>
                    </div>
                    <div class="bg-teal-50 p-6 rounded-xl border border-teal-100 text-center">
                        <p class="text-xs text-teal-600 uppercase font-bold">Durasi</p>
                        <p class="text-xl font-black text-slate-700 mt-1">${prog.duration}</p>
                    </div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="w-full bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold">UBAH PROGRAM</button>
            </div>`;
        }).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const prog = p.program || {};
        document.getElementById('modal-title').innerText = "PROGRAM REHAB";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <select id="pr_type" class="input-field">
                    <option value="Reguler" ${prog.type==='Reguler'?'selected':''}>Reguler</option>
                    <option value="Eksklusif" ${prog.type==='Eksklusif'?'selected':''}>Eksklusif</option>
                    <option value="VIP" ${prog.type==='VIP'?'selected':''}>VIP</option>
                </select>
                <select id="pr_dur" class="input-field">
                    <option value="7 Hari" ${prog.duration==='7 Hari'?'selected':''}>7 Hari</option>
                    <option value="14 Hari" ${prog.duration==='14 Hari'?'selected':''}>14 Hari</option>
                    <option value="30 Hari" ${prog.duration==='30 Hari'?'selected':''}>30 Hari</option>
                    <option value="3 Bulan" ${prog.duration==='3 Bulan'?'selected':''}>3 Bulan</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    // --- THERAPY ---
    viewTherapy(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - CATATAN TERAPI</h3>
                <textarea id="ther_${p.id}" class="input-field h-40 mb-4 p-4 text-sm leading-relaxed" placeholder="Tulis catatan...">${p.therapy || ''}</textarea>
                <div class="flex justify-end">
                    <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-8 py-3 rounded-xl text-sm font-bold shadow-md">SIMPAN</button>
                </div>
            </div>
        `).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        await this.saveDB();
        Swal.fire({ title: 'Tersimpan', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    },

    // --- UTILS ---
    async delPatient(pid) {
        if(confirm('Hapus seluruh data pasien ini?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            await this.saveDB(); this.render();
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        
        // Perbaikan Logic Delete agar lebih aman
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) {
            if(!target[parts[i]]) target[parts[i]] = []; // Jika undefined, jadikan array agar tidak crash
            target = target[parts[i]];
        }
        
        target.splice(idx, 1);
        await this.saveDB(); this.render();
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
        if(!this.data.patients.length) return Swal.fire('Data Kosong', '', 'warning');
        const rows = this.data.patients.map(p => ({ 
            Nama: p.reg.name, 
            Usia: p.reg.age,
            Diagnosa: p.diagnosis.dr_name, 
            Obat: p.diagnosis.rx_name
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    },

    async exportToWord() {
        if(!this.data.patients.length) return Swal.fire('Data Kosong', '', 'warning');
        if(typeof docx === 'undefined') return Swal.fire('Error', 'Library Docx belum siap.', 'error');

        const { Document, Packer, Paragraph, HeadingLevel } = docx;

        const docChildren = [
            new Paragraph({ text: "LAPORAN MMRC", heading: HeadingLevel.HEADING_1, alignment: "center" }),
            new Paragraph({ text: `Dicetak: ${new Date().toLocaleString('id-ID')}`, alignment: "center" }),
            new Paragraph({ text: "" })
        ];

        this.data.patients.forEach((p, index) => {
            docChildren.push(
                new Paragraph({ text: `${index + 1}. ${p.reg.name}`, heading: HeadingLevel.HEADING_3 }),
                new Paragraph({ text: `Diagnosa: ${p.diagnosis.dr_name}`, bullet: { level: 0 } }),
                new Paragraph({ text: `Obat: ${p.diagnosis.rx_name}`, bullet: { level: 0 } }),
                new Paragraph({ text: "----------------------------------------" }),
                new Paragraph({ text: "" })
            );
        });

        const doc = new Document({ sections: [{ children: docChildren }] });
        Packer.toBlob(doc).then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            document.body.appendChild(a); a.href = url; a.download = "Laporan_MMRC.docx"; a.click();
            document.body.removeChild(a);
        });
    }
};

window.app = app;
