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
    isFirstLoad: true, // Penanda agar tidak flickering saat load pertama

    // --- FUNGSI SINKRONISASI CLOUD (REALTIME & CEPAT) ---
    async saveDB() {
        // 1. Simpan ke Local Storage (Agar data aman di HP jika internet putus)
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        
        // 2. Kirim ke Firebase di Background (Tanpa menunggu/loading)
        db.ref('mmrc_data').set(this.data)
            .then(() => console.log("✅ Cloud Updated"))
            .catch((e) => console.error("⚠️ Offline Mode (Saved Local):", e));
    },

    loadDB() {
        // STEP 1: Langsung ambil dari Local Storage (Instan / Anti-Loading)
        const local = localStorage.getItem('MMRC_DATABASE');
        if (local) {
            try {
                this.data = JSON.parse(local);
                this.render(); // Tampilkan data local dulu
            } catch (e) {
                console.error("Local Data Corrupt", e);
            }
        }

        // STEP 2: Pasang "Telinga" (Listener) ke Firebase (Fitur Multi-Device)
        // Gunakan .on() bukan .once() agar update otomatis jika device lain input data
        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            
            if (cloudData) {
                // Bandingkan apakah data baru beda dengan data sekarang untuk efisiensi
                const currentStr = JSON.stringify(this.data);
                const cloudStr = JSON.stringify(cloudData);

                if (currentStr !== cloudStr) {
                    this.data = cloudData;
                    // Update backup local
                    localStorage.setItem('MMRC_DATABASE', cloudStr);
                    
                    // Render ulang hanya jika user sudah login (mencegah error di layar login)
                    const appLayer = document.getElementById('app-layer');
                    if (appLayer && !appLayer.classList.contains('hidden')) {
                        this.render();
                        console.log("🔄 Sinkronisasi Data dari Device Lain Berhasil");
                    }
                }
            }
        }, (error) => {
            console.error("Koneksi Internet Bermasalah, menggunakan data lokal:", error);
        });
    },

    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        
        // Credential Tetap
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            
            this.loadDB(); // Aktifkan sinkronisasi saat login sukses
            this.nav('dashboard');
        } else {
            Swal.fire('Akses Ditolak', 'Username atau Password Salah!', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        
        // Update UI Button Active
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        
        // Update Title & Render
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

    // --- VIEW DASHBOARD ---
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
                                    <p><i class="fas fa-birthday-cake w-4 text-center"></i> <b>Usia:</b> ${p.reg.ttl} (${p.reg.age} Thn)</p>
                                    <p><i class="fas fa-user-graduate w-4 text-center"></i> <b>Pendidikan:</b> ${p.reg.edu}</p>
                                    <p><i class="fas fa-briefcase w-4 text-center"></i> <b>Pekerjaan:</b> ${p.reg.job}</p>
                                    <p><i class="fas fa-map-marker-alt w-4 text-center"></i> <b>Alamat:</b> ${p.reg.addr}</p>
                                    <p><i class="fas fa-user-shield w-4 text-center"></i> <b>Wali:</b> ${p.reg.guardian}</p>
                                    <p class="text-red-500 bg-red-50 p-1 rounded mt-1"><b><i class="fas fa-search"></i> Spotcheck:</b> ${p.reg.spotcheck}</p>
                                </div>
                            </div>
                            
                            <div class="border-r border-slate-100 px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">Riwayat & Kondisi</h5>
                                <div class="text-[11px] space-y-3">
                                    <div><b class="text-teal-600">Fisik/Psikis:</b><p class="text-slate-700">${p.history.desc}</p></div>
                                    <div><b class="text-teal-600">Diagnosa Lalu:</b><p class="text-slate-700">${p.history.prev_diag}</p></div>
                                    <div><b class="text-teal-600">Dosis Lalu:</b><p class="text-slate-700">${p.history.prev_rx}</p></div>
                                    <div class="bg-amber-50 p-2 rounded border border-amber-100"><b>Kondisi Terkini:</b> ${p.history.current}</div>
                                </div>
                            </div>

                            <div class="px-4 flex flex-col justify-between">
                                <div>
                                    <h5 class="font-bold text-xs text-slate-400 mb-3 uppercase tracking-wider">Diagnosa MMRC</h5>
                                    <div class="text-[11px] space-y-2">
                                        <p><b>Dokter:</b> ${p.diagnosis.dr_name}</p>
                                        <p class="bg-teal-50 p-2 rounded text-teal-800"><b>Planning:</b> ${p.diagnosis.plan}</p>
                                        <div class="flex gap-2 my-2">
                                            <span class="px-2 py-1 rounded text-[10px] ${p.diagnosis.inj ? 'bg-teal-100 text-teal-700 font-bold' : 'bg-slate-100 text-slate-300'}">Injeksi</span>
                                            <span class="px-2 py-1 rounded text-[10px] ${p.diagnosis.urine ? 'bg-teal-100 text-teal-700 font-bold' : 'bg-slate-100 text-slate-300'}">Urine Test</span>
                                            <span class="px-2 py-1 rounded text-[10px] ${p.diagnosis.fiksasi ? 'bg-teal-100 text-teal-700 font-bold' : 'bg-slate-100 text-slate-300'}">Fiksasi</span>
                                        </div>
                                        <p><b>Resep:</b> ${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})</p>
                                    </div>
                                </div>
                                <div class="mt-4 flex gap-2 justify-end">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 border border-amber-600 hover:bg-amber-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"><i class="fas fa-edit"></i> EDIT</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 border border-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-[10px] font-bold transition"><i class="fas fa-trash"></i> HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${(!this.data.patients || this.data.patients.length === 0) ? '<p class="text-center text-slate-400 py-10">Belum ada data pasien.</p>' : ''}
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
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase tracking-widest">1. Biodata</p>
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
                    <input name="edu" value="${val(p?.reg?.edu)}" placeholder="Pendidikan Terakhir" class="input-field">
                    <input name="job" value="${val(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${val(p?.reg?.addr)}" placeholder="Alamat Domisili" class="input-field">
                    <input name="guardian" value="${val(p?.reg?.guardian)}" placeholder="Nama Penanggung Jawab (Wali)" class="input-field">
                    <input name="spotcheck" value="${val(p?.reg?.spotcheck)}" placeholder="Hasil Spotcheck Barang" class="input-field text-red-600">
                </div>
                
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase tracking-widest">2. Riwayat Medis</p>
                    <textarea name="h_desc" placeholder="Deskripsi Riwayat Fisik & Psikologis..." class="input-field h-24">${val(p?.history?.desc)}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Dokter Sebelumnya..." class="input-field h-20">${val(p?.history?.prev_diag)}</textarea>
                    <input name="h_prev_rx" value="${val(p?.history?.prev_rx)}" placeholder="Riwayat Obat (Dosis)" class="input-field">
                    <textarea name="h_current" placeholder="Kondisi Pasien Saat Ini..." class="input-field h-20 bg-amber-50 border-amber-200">${val(p?.history?.current)}</textarea>
                </div>

                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase tracking-widest">3. Assessment Dokter</p>
                    <input name="d_dr" value="${val(p?.diagnosis?.dr_name)}" placeholder="Nama Dokter Pemeriksa" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Masuk..." class="input-field h-20">${val(p?.diagnosis?.entry_diag)}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter..." class="input-field h-20">${val(p?.diagnosis?.plan)}</textarea>
                    
                    <div class="flex gap-4 text-[11px] bg-slate-50 p-3 rounded-xl border">
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="inj" ${chk(p?.diagnosis?.inj)}> Injeksi</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="urine" ${chk(p?.diagnosis?.urine)}> Urine Test</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" name="fix" ${chk(p?.diagnosis?.fiksasi)}> Fiksasi</label>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-2">
                        <input name="d_rx" value="${val(p?.diagnosis?.rx_name)}" placeholder="Nama Obat" class="input-field col-span-2">
                        <input name="d_qty" value="${val(p?.diagnosis?.rx_qty)}" type="number" placeholder="Jml" class="input-field">
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
        const fd = new FormData(e.target);
        
        const photoFile = fd.get('photo_file');
        let photoBase64 = null;
        
        if (editId) {
            photoBase64 = this.data.patients.find(x => x.id === editId).reg.photo;
        }
        if (photoFile && photoFile.size > 0) {
            photoBase64 = await this.toBase64(photoFile);
        }

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
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
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
            this.data.patients[idx] = pData;
        } else {
            if(!this.data.patients) this.data.patients = [];
            this.data.patients.push(pData);
        }
        
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
        Swal.fire('Berhasil', 'Data pasien telah disimpan.', 'success');
    },

    // --- MEDICINE LOGIC ---
    viewMedicine(container) {
        if (!this.data.patients || this.data.patients.length === 0) {
            container.innerHTML = '<p class="text-slate-400 text-center mt-10">Belum ada pasien terdaftar.</p>';
            return;
        }

        container.innerHTML = this.data.patients.map(p => `
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
                                const isLow = sisa <= 5;
                                return `
                                <div class="p-4 border rounded-2xl ${isLow ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'} relative transition hover:shadow-md">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[10px] text-slate-500 mt-1">
                                                <i class="fas fa-box-open"></i> Awal: ${s.init} | 
                                                <i class="fas fa-calendar-times"></i> Exp: ${s.exp}
                                            </p>
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
                            ${(!p.medicine?.stock?.length) ? '<p class="text-xs text-slate-400 italic">Belum ada stok obat.</p>' : ''}
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
                            ${(!p.medicine?.logs?.length) ? '<p class="text-center text-[10px] p-4 text-slate-400">Belum ada riwayat minum obat.</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
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
        
        if (!name || isNaN(init)) return Swal.fire('Error', 'Nama dan Jumlah wajib diisi', 'error');

        const data = { 
            name: name, 
            init: init, 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };

        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        
        if ((stock.init - stock.used) <= 0) return Swal.fire('Stok Habis', 'Obat ini sudah habis!', 'warning');

        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 text-center">
                    <p class="text-sm text-blue-800">Konfirmasi penggunaan obat:</p>
                    <h4 class="font-bold text-xl text-blue-900 mt-1">${stock.name}</h4>
                    <p class="text-xs text-blue-600 mt-1">(Stok akan berkurang 1)</p>
                </div>
                <input id="ml_pj" placeholder="Nama PJ (Perawat/Staff)" class="input-field">
                <textarea id="ml_note" placeholder="Keterangan (Opsional)..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold transition shadow-lg">KONFIRMASI PEMAKAIAN</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        
        if(!pj) return Swal.fire('Error', 'Nama PJ Wajib Diisi!', 'error');

        stock.used += 1;
        p.medicine.logs.unshift({ 
            time: new Date().toLocaleString('id-ID'), 
            name: stock.name, 
            pj: pj, 
            note: document.getElementById('ml_note').value 
        });
        
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    async delMedLog(pid, logIdx) {
        const result = await Swal.fire({
            title: 'Hapus Catatan?',
            text: "Stok obat akan dikembalikan (+1).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus'
        });

        if (!result.isConfirmed) return;

        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        const stockItem = p.medicine.stock.find(s => s.name === log.name);
        
        if(stockItem && stockItem.used > 0) {
            stockItem.used -= 1;
        }

        p.medicine.logs.splice(logIdx, 1);
        await this.saveDB(); 
        this.render();
        Swal.fire('Terhapus', 'Data dihapus & stok dikembalikan.', 'success');
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-400">WAKTU:</label>
                    <input id="el_time" value="${log.time}" class="input-field">
                </div>
                <input id="el_name" value="${log.name}" class="input-field bg-slate-100" readonly>
                <input id="el_pj" value="${log.pj}" placeholder="Nama PJ" class="input-field">
                <textarea id="el_note" class="input-field" placeholder="Catatan">${log.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${logIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
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

    // --- VIEW TTV ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <div class="flex justify-between items-center mb-6 border-b pb-4">
                    <h3 class="font-bold text-teal-800 text-lg">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow">+ INPUT TTV/GDS</button>
                </div>
                <div class="overflow-x-auto rounded-xl border">
                    <table class="w-full text-[11px] text-left">
                        <thead class="bg-slate-100 text-slate-600 font-bold">
                            <tr><th class="p-3">Waktu</th><th class="p-3">TD</th><th class="p-3">Sat/RR</th><th class="p-3">TB/BB</th><th class="p-3">GDS</th><th class="p-3 text-right">Aksi</th></tr>
                        </thead>
                        <tbody class="divide-y">
                            ${(p.ttv || []).map((t, i) => `
                                <tr class="hover:bg-slate-50">
                                    <td class="p-3">${t.time}</td>
                                    <td class="p-3">${t.td}</td>
                                    <td class="p-3">${t.sat}% / ${t.rr}</td>
                                    <td class="p-3">${t.tb}/${t.bb}</td>
                                    <td class="p-3 font-bold text-teal-700">${t.gds}</td>
                                    <td class="p-3 flex gap-2 justify-end">
                                        <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`).join('')}
                        </tbody>
                    </table>
                     ${(!p.ttv?.length) ? '<p class="text-center text-slate-400 p-4 text-xs">Belum ada data TTV.</p>' : ''}
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
                <input id="t_td" value="${t?.td||''}" placeholder="Tensi (ex: 120/80)" class="input-field">
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
            td: document.getElementById('t_td').value, 
            sat: document.getElementById('t_sat').value, 
            rr: document.getElementById('t_rr').value, 
            tb: document.getElementById('t_tb').value, 
            bb: document.getElementById('t_bb').value, 
            gds: document.getElementById('t_gds').value 
        };
        
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.unshift(data); // Add to top
        
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    // --- VIEW VISIT DOKTER ---
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
                    ${(!p.visits?.length) ? '<div class="col-span-2 text-center text-slate-400 py-4">Belum ada data visit dokter.</div>' : ''}
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
                <textarea id="v_note" placeholder="Hasil Wawancara Dokter & Catatan..." class="input-field h-32">${v?.note||''}</textarea>
                
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
        const file = document.getElementById('v_photo').files[0];
        
        if (this.signaturePad.isEmpty()) return Swal.fire('Error', 'Tanda tangan wajib diisi', 'warning');

        let photo = idx !== null ? p.visits[idx].photo : "https://via.placeholder.com/400x300?text=No+Photo";
        if(file) photo = await this.toBase64(file);

        const data = { 
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), 
            note: document.getElementById('v_note').value, 
            photo: photo, 
            sign: this.signaturePad.toDataURL() 
        };

        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);

        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    // --- VIEW CRISIS ---
    viewCrisis(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm border-l-4 border-l-red-500">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-700 shadow">+ INPUT SCORE BPSS</button>
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
                                        <td class="p-2 font-bold">D-${i+1}</td>
                                        <td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
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
                        ${(!p.crisis?.bpss?.length) ? '<div class="absolute inset-0 flex items-center justify-center text-slate-300 text-xs">Belum ada data grafik</div>' : ''}
                    </div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis?.bpss?.length) return;
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `Day ${i+1}`),
                datasets: [{ 
                    label: 'BPSS Score', 
                    data: p.crisis.bpss.map(b => b.eval), 
                    borderColor: '#dc2626', 
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { 
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true } }
            }
        });
    },

    modalBPSS(pid, idx = null) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2 bg-red-50 p-2 rounded text-[10px] text-red-800 mb-2">
                    Isi score 1-10 untuk setiap aspek.
                </div>
                <input id="b_bio" type="number" placeholder="Biological" class="input-field">
                <input id="b_psy" type="number" placeholder="Psychological" class="input-field">
                <input id="b_soc" type="number" placeholder="Social" class="input-field">
                <input id="b_spi" type="number" placeholder="Spiritual" class="input-field">
                <textarea id="b_note" placeholder="Evaluasi Harian..." class="input-field col-span-2 h-24"></textarea>
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold shadow-lg hover:bg-red-700">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('b_bio').value)||0;
        const psy = parseInt(document.getElementById('b_psy').value)||0;
        const soc = parseInt(document.getElementById('b_soc').value)||0;
        const spi = parseInt(document.getElementById('b_spi').value)||0;
        
        p.crisis.bpss.push({ 
            bio, psy, soc, spi, 
            eval: bio+psy+soc+spi, 
            note: document.getElementById('b_note').value 
        });
        
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    // --- VIEW PROGRAM ---
    viewProgram(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-4 text-lg border-b pb-2">${p.reg.name} - PROGRAM</h3>
                <div class="grid grid-cols-2 gap-4 mb-6">
                    <div class="bg-teal-50 p-5 rounded-2xl border border-teal-100 text-center">
                        <p class="text-xs text-teal-600 uppercase font-bold mb-1">Tipe Paket</p>
                        <p class="text-xl font-black text-teal-900">${p.program.type || '-'}</p>
                    </div>
                    <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
                        <p class="text-xs text-blue-600 uppercase font-bold mb-1">Durasi</p>
                        <p class="text-xl font-black text-blue-900">${p.program.duration || '-'}</p>
                    </div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="w-full bg-teal-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow hover:bg-teal-700 transition">EDIT RENCANA PROGRAM</button>
            </div>
        `).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <label class="text-xs font-bold text-slate-500">Pilih Paket:</label>
                <select id="pr_type" class="input-field">
                    <option value="Reguler" ${p.program.type==='Reguler'?'selected':''}>Reguler</option>
                    <option value="Eksklusif" ${p.program.type==='Eksklusif'?'selected':''}>Eksklusif</option>
                    <option value="VIP" ${p.program.type==='VIP'?'selected':''}>VIP</option>
                </select>
                <label class="text-xs font-bold text-slate-500">Durasi:</label>
                <select id="pr_dur" class="input-field">
                    <option value="7 Hari" ${p.program.duration==='7 Hari'?'selected':''}>7 Hari</option>
                    <option value="14 Hari" ${p.program.duration==='14 Hari'?'selected':''}>14 Hari</option>
                    <option value="30 Hari" ${p.program.duration==='30 Hari'?'selected':''}>30 Hari</option>
                    <option value="Bebas" ${p.program.duration==='Bebas'?'selected':''}>Bebas</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold shadow-lg mt-4">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    async saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { 
            type: document.getElementById('pr_type').value, 
            duration: document.getElementById('pr_dur').value 
        };
        await this.saveDB(); 
        this.closeModal(); 
        this.render();
    },

    // --- VIEW THERAPY ---
    viewTherapy(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item shadow-sm">
                <h3 class="font-bold text-teal-800 mb-4 text-lg border-b pb-2">${p.reg.name} - CATATAN TERAPI</h3>
                <p class="text-[10px] text-slate-400 mb-2">Silakan tulis progress terapi psikologis/konseling:</p>
                <textarea id="ther_${p.id}" class="input-field h-40 mb-4 font-mono text-sm leading-relaxed p-4 bg-slate-50 focus:bg-white transition">${p.therapy || ''}</textarea>
                <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl text-xs font-bold shadow transition">SIMPAN CATATAN</button>
            </div>
        `).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        await this.saveDB();
        Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
    },

    // --- UTILS & EXPORTS ---
    async delPatient(pid) {
        const res = await Swal.fire({
            title: 'Hapus Pasien?',
            text: "Seluruh data (Obat, TTV, Visit) akan hilang permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus Semuanya'
        });

        if(res.isConfirmed) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            await this.saveDB(); 
            this.render();
            Swal.fire('Terhapus', 'Data pasien telah dihapus.', 'success');
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) {
             target = target[parts[i]];
        }
        
        target.splice(idx, 1);
        await this.saveDB(); 
        this.render();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        const items = document.querySelectorAll('.search-item');
        
        items.forEach(el => {
            const txt = el.innerText.toLowerCase();
            el.style.display = txt.includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    
    toBase64: f => new Promise((resolve, reject) => { 
        const rd = new FileReader(); 
        rd.readAsDataURL(f); 
        rd.onload = () => resolve(rd.result); 
        rd.onerror = error => reject(error);
    }),

    exportAllExcel() {
        if(!this.data.patients.length) return Swal.fire('Info', 'Data kosong.', 'info');
        
        const rows = this.data.patients.map(p => ({ 
            Nama: p.reg.name, 
            Usia: p.reg.age,
            Diagnosa: p.diagnosis.dr_name, 
            Planning: p.diagnosis.plan,
            Program: p.program.type,
            Masuk: p.reg.timestamp
        }));
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien MMRC");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    },

    // --- FULL FEATURE: EXPORT WORD (REAL IMPLEMENTATION) ---
    async exportToWord() {
        if (!this.data.patients || this.data.patients.length === 0) {
            return Swal.fire('Info', 'Tidak ada data pasien untuk diexport.', 'info');
        }

        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType } = docx;

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: "NAMA PASIEN", opts: { bold: true } })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "DIAGNOSA", opts: { bold: true } })], width: { size: 35, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "PROGRAM", opts: { bold: true } })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: "STATUS", opts: { bold: true } })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                ],
            }),
        ];

        this.data.patients.forEach(p => {
            tableRows.push(
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(p.reg.name || "-")] }),
                        new TableCell({ children: [new Paragraph(p.diagnosis.plan || "-")] }),
                        new TableCell({ children: [new Paragraph(p.program.type || "-")] }),
                        new TableCell({ children: [new Paragraph(p.history.current || "-")] }),
                    ],
                })
            );
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "LAPORAN HARIAN PASIEN MMRC",
                        heading: HeadingLevel.HEADING_1,
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({ text: `Tanggal Export: ${new Date().toLocaleString('id-ID')}`, alignment: AlignmentType.CENTER }),
                    new Paragraph({ text: "" }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE },
                    }),
                ],
            }],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.style = "display: none";
            a.href = url;
            a.download = "Laporan_MMRC.docx";
            a.click();
            window.URL.revokeObjectURL(url);
            Swal.fire('Sukses', 'Laporan Word berhasil didownload', 'success');
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Gagal membuat file Word', 'error');
        }
    }
};
