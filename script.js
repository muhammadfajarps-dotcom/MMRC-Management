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
    data: { patients: [] }, // Struktur awal default
    currentPage: 'dashboard',
    signaturePad: null,

    // --- FUNGSI SINKRONISASI CLOUD ---
    async saveDB() {
        // Simpan ke Local sebagai cadangan
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        
        // Simpan ke Firebase (SINKRONISASI OTOMATIS)
        try {
            await db.ref('mmrc_data').set(this.data);
            console.log("Data Tersinkron ke Cloud");
        } catch (e) {
            console.error("Gagal Sinkron:", e);
            Swal.fire('Koneksi Error', 'Gagal menyimpan ke cloud, cek internet.', 'warning');
        }
    },

   async loadDB() {
        // Tampilkan loading sebentar
        const loadingTimeout = setTimeout(() => {
            if (Swal.isVisible()) {
                Swal.close();
                Swal.fire('Koneksi Lambat', 'Mengambil data dari memori lokal...', 'info');
            }
        }, 5000); // Batas 5 detik

        try {
            const snapshot = await db.ref('mmrc_data').once('value');
            const cloudData = snapshot.val();
            
            if (cloudData) {
                this.data = cloudData;
                // Pastikan array patients ada (mencegah error jika DB kosong tapi ada node lain)
                if (!this.data.patients) this.data.patients = [];
                console.log("Data Cloud Berhasil Diambil");
            } else {
                // Jika Cloud kosong (aplikasi baru), inisialisasi
                this.data = { patients: [] };
            }

            clearTimeout(loadingTimeout);
            Swal.close();
            this.render();
        } catch (e) {
            console.error("Gagal ambil data cloud:", e);
            clearTimeout(loadingTimeout);
            Swal.close();
            
            // Jika gagal, pakai data lama yang ada di Browser
            const local = localStorage.getItem('MMRC_DATABASE');
            if (local) {
                this.data = JSON.parse(local);
                Swal.fire('Mode Offline', 'Data diambil dari penyimpanan lokal.', 'info');
            }
            this.render();
        }
    }, 

    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        // Login Hardcode sesuai permintaan
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB(); // AMBIL DATA DARI CLOUD SAAT LOGIN
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
        // Safe guard jika this.data.patients undefined
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
                                        <h4 class="font-bold text-teal-700 text-lg">${p.reg.name}</h4>
                                        <p class="text-[10px] text-slate-400">${p.reg.timestamp}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>TTL/Usia:</b> ${p.reg.ttl} / ${p.reg.age} Thn</p>
                                    <p><b>Status/Pdk:</b> ${p.reg.status} / ${p.reg.edu}</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian}</p>
                                    <p class="text-red-500"><b>Spotcheck:</b> ${p.reg.spotcheck}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">Riwayat & Kondisi</h5>
                                <div class="text-[11px] space-y-2">
                                    <p><b>Fisik/Psikis:</b> ${p.history.desc}</p>
                                    <p><b>Diagnosa Lalu:</b> ${p.history.prev_diag}</p>
                                    <p><b>Dosis Lalu:</b> ${p.history.prev_rx}</p>
                                    <p class="bg-amber-50 p-2 rounded border border-amber-100 text-amber-900"><b>Terkini:</b> ${p.history.current}</p>
                                </div>
                            </div>
                            <div class="px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase tracking-wider">Diagnosa Dokter</h5>
                                <div class="text-[11px] space-y-1">
                                    <p><b>Dokter:</b> ${p.diagnosis.dr_name}</p>
                                    <p><b>Planning:</b> ${p.diagnosis.plan}</p>
                                    <div class="flex gap-2 my-2">
                                        <span class="${p.diagnosis.inj ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Injeksi</span>
                                        <span class="${p.diagnosis.urine ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Urine Test</span>
                                        <span class="${p.diagnosis.fiksasi ? 'text-white bg-teal-600 px-2 py-0.5 rounded' : 'text-slate-300'} font-bold text-[9px]">Fiksasi</span>
                                    </div>
                                    <p class="mt-2"><b>Resep:</b> <span class="font-bold text-teal-700">${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})</span></p>
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
        
        // Helper untuk handle null value
        const val = (v) => v || '';

        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">1. Registrasi & Biodata</p>
                    <div class="bg-slate-50 p-2 rounded border">
                        <label class="text-[10px] text-slate-400 block mb-1">Upload Foto Pasien</label>
                        <input name="photo_file" type="file" class="w-full text-[10px]">
                    </div>
                    <input name="name" value="${val(p?.reg.name)}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${val(p?.reg.ttl)}" placeholder="Tempat Tanggal Lahir" class="input-field">
                    <input name="age" value="${val(p?.reg.age)}" type="number" placeholder="Usia" class="input-field">
                    <input name="status" value="${val(p?.reg.status)}" placeholder="Status Pernikahan" class="input-field">
                    <input name="edu" value="${val(p?.reg.edu)}" placeholder="Pendidikan Terakhir" class="input-field">
                    <input name="job" value="${val(p?.reg.job)}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${val(p?.reg.addr)}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${val(p?.reg.guardian)}" placeholder="Nama Wali" class="input-field">
                    <input name="spotcheck" value="${val(p?.reg.spotcheck)}" placeholder="Spotcheck Barang Bawaan" class="input-field">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">2. Riwayat Penyakit</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik/Psikis" class="input-field h-24">${val(p?.history.desc)}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Dokter Sebelumnya" class="input-field h-24">${val(p?.history.prev_diag)}</textarea>
                    <input name="h_prev_rx" value="${val(p?.history.prev_rx)}" placeholder="Riwayat Dosis Obat" class="input-field">
                    <input name="h_current" value="${val(p?.history.current)}" placeholder="Kondisi Terkini Pasien" class="input-field font-bold text-amber-700 bg-amber-50 border-amber-200">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700 uppercase">3. Diagnosa Dokter</p>
                    <input name="d_dr" value="${val(p?.diagnosis.dr_name)}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Saat Masuk" class="input-field h-20">${val(p?.diagnosis.entry_diag)}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter" class="input-field h-20">${val(p?.diagnosis.plan)}</textarea>
                    <div class="flex gap-4 text-[11px] bg-slate-100 p-3 rounded-xl border">
                        <label class="flex items-center gap-1 cursor-pointer hover:text-teal-600"><input type="checkbox" name="inj" ${p?.diagnosis.inj?'checked':''}> Injeksi</label>
                        <label class="flex items-center gap-1 cursor-pointer hover:text-teal-600"><input type="checkbox" name="urine" ${p?.diagnosis.urine?'checked':''}> Urine Test</label>
                        <label class="flex items-center gap-1 cursor-pointer hover:text-teal-600"><input type="checkbox" name="fix" ${p?.diagnosis.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <input name="d_rx" value="${val(p?.diagnosis.rx_name)}" placeholder="Nama Obat" class="input-field col-span-2">
                        <input name="d_qty" value="${val(p?.diagnosis.rx_qty)}" type="number" placeholder="Qty" class="input-field">
                    </div>
                </div>
                <button class="md:col-span-3 bg-teal-600 hover:bg-teal-700 text-white py-4 rounded-2xl font-bold shadow-lg transition transform active:scale-95">SIMPAN DATA PASIEN</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        
        let photoBase64 = null;
        if (editId) {
             const existing = this.data.patients.find(x => x.id === editId);
             photoBase64 = existing.reg.photo;
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
            history: { desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fiksasi: fd.get('fix')==='on',
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
            },
            // Menjaga data sub-collection agar tidak hilang saat edit profil
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
        Swal.fire('Berhasil', 'Data Pasien Tersimpan', 'success');
    },

    // --- MEDICINE LOGIC ---
    viewMedicine(container) {
        const patients = this.data.patients || [];
        container.innerHTML = patients.map(p => `
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
                            <h4 class="font-bold text-xs uppercase text-slate-500 flex items-center gap-2"><i class="fas fa-box"></i> Stok Obat Pasien</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm transition">+ STOK BARU</button>
                        </div>
                        <div class="space-y-3">
                            ${p.medicine.stock.length === 0 ? '<p class="text-[10px] text-center text-slate-400">Belum ada stok obat.</p>' : ''}
                            ${p.medicine.stock.map((s, i) => `
                                <div class="p-4 border rounded-xl bg-white relative shadow-sm hover:shadow-md transition group">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700 text-sm">${s.name}</p>
                                            <p class="text-[10px] text-slate-500 mt-1">Stok Awal: ${s.init} | Exp: ${s.exp}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-xl font-black ${s.init-s.used <= 5 ? 'text-red-500 animate-pulse':'text-emerald-600'}">${s.init-s.used}</p>
                                            <p class="text-[8px] font-bold text-slate-400">SISA TAB</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2 pt-2 border-t">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold">MINUM OBAT</button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500 hover:bg-amber-50 px-2 rounded"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 hover:bg-red-50 px-2 rounded"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-500 mb-4 flex items-center gap-2"><i class="fas fa-history"></i> Log Penggunaan Obat</h4>
                        <div class="overflow-x-auto border rounded-xl shadow-sm">
                            <table class="w-full text-[10px] text-left">
                                <thead class="bg-slate-100 text-slate-600 font-bold uppercase">
                                    <tr><th class="p-3">Waktu</th><th class="p-3">Obat</th><th class="p-3">PJ</th><th class="p-3 text-center">Aksi</th></tr>
                                </thead>
                                <tbody class="bg-white divide-y">
                                    ${p.medicine.logs.length === 0 ? '<tr><td colspan="4" class="p-4 text-center text-slate-400">Belum ada catatan minum obat.</td></tr>' : ''}
                                    ${p.medicine.logs.map((l, i) => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="p-3 whitespace-nowrap text-slate-500">${l.time}</td>
                                            <td class="p-3 font-bold text-teal-700">${l.name}</td>
                                            <td class="p-3">${l.pj}</td>
                                            <td class="p-3 flex justify-center gap-3">
                                                <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500 hover:text-amber-700"><i class="fas fa-edit"></i></button>
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

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = editIdx !== null ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK OBAT" : "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-500">Nama Obat</label>
                    <input id="ms_name" value="${s?s.name:''}" placeholder="Contoh: Risperidone 2mg" class="input-field">
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                         <label class="text-xs font-bold text-slate-500">Jumlah Stok Masuk</label>
                        <input id="ms_init" value="${s?s.init:''}" type="number" placeholder="0" class="input-field">
                    </div>
                    <div>
                         <label class="text-xs font-bold text-slate-500">Tanggal Kedaluwarsa</label>
                        <input id="ms_exp" value="${s?s.exp:''}" type="date" class="input-field">
                    </div>
                </div>
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl font-bold shadow-lg transition">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
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
        if (stock.init - stock.used <= 0) return Swal.fire('Stok Habis', 'Stok obat ini sudah habis!', 'error');

        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4 text-center">
                <div class="bg-teal-50 p-4 rounded-2xl border border-teal-100">
                    <p class="text-sm text-teal-800">Konfirmasi minum obat:</p>
                    <h2 class="text-2xl font-black text-teal-700 my-2">${stock.name}</h2>
                    <p class="text-xs text-slate-500">Stok saat ini: ${stock.init - stock.used} butir</p>
                </div>
                <input id="ml_pj" placeholder="Nama PJ (Penanggung Jawab)" class="input-field text-center font-bold">
                <textarea id="ml_note" placeholder="Keterangan tambahan (opsional)..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl font-bold shadow-lg transition">KONFIRMASI & KURANGI STOK</button>
            </div>`;
        this.openModal();
    },

    async saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        if(!pj) return Swal.fire('Error', 'Isi Nama Penanggung Jawab!', 'error');

        stock.used += 1;
        p.medicine.logs.unshift({ 
            time: new Date().toLocaleString('id-ID'), 
            name: stock.name, 
            pj: pj, 
            note: document.getElementById('ml_note').value 
        });
        await this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Tercatat', 'Obat berhasil dicatat dan stok dikurangi.', 'success');
    },

    async delMedLog(pid, logIdx) {
        const result = await Swal.fire({
            title: 'Batalkan Log?',
            text: "Data akan dihapus dan STOK OBAT AKAN DIKEMBALIKAN (+1).",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Ya, Hapus & Refund Stok'
        });

        if (result.isConfirmed) {
            const p = this.data.patients.find(x => x.id === pid);
            const log = p.medicine.logs[logIdx];
            const stockItem = p.medicine.stock.find(s => s.name === log.name);
            
            // Refund Stok Logic
            if(stockItem && stockItem.used > 0) stockItem.used -= 1;
            
            p.medicine.logs.splice(logIdx, 1);
            await this.saveDB(); 
            this.render();
            Swal.fire('Dihapus', 'Log dihapus dan stok dikembalikan.', 'success');
        }
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <label class="text-xs font-bold text-slate-500">Waktu</label>
                <input id="el_time" value="${log.time}" class="input-field">
                
                <label class="text-xs font-bold text-slate-500">Nama Obat (Tidak bisa diubah)</label>
                <input id="el_name" value="${log.name}" class="input-field bg-slate-100" readonly>
                
                <label class="text-xs font-bold text-slate-500">Penanggung Jawab</label>
                <input id="el_pj" value="${log.pj}" class="input-field">
                
                <label class="text-xs font-bold text-slate-500">Catatan</label>
                <textarea id="el_note" class="input-field">${log.note || ''}</textarea>
                
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

    // --- TTV ---
    viewTTV(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT TTV/GDS</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-[11px] text-left">
                        <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat/RR</th><th class="p-2">TB/BB</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                        ${p.ttv.map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}% / ${t.rr}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2 font-bold">${t.gds}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                    </table>
                </div>
            </div>
        `).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = editIdx !== null ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT TTV/GDS" : "INPUT TTV/GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" value="${t?t.td:''}" placeholder="Tensi Darah (mmHg)" class="input-field">
                <input id="t_sat" value="${t?t.sat:''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?t.rr:''}" placeholder="RR (x/menit)" class="input-field">
                <input id="t_tb" value="${t?t.tb:''}" placeholder="Tinggi (cm)" class="input-field">
                <input id="t_bb" value="${t?t.bb:''}" placeholder="Berat (kg)" class="input-field">
                <input id="t_gds" value="${t?t.gds:''}" placeholder="Keterangan GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    async saveTTV(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const data = { time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString('id-ID'), td: document.getElementById('t_td').value, sat: document.getElementById('t_sat').value, rr: document.getElementById('t_rr').value, tb: document.getElementById('t_tb').value, bb: document.getElementById('t_bb').value, gds: document.getElementById('t_gds').value };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- VISIT DOKTER ---
    viewVisit(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">SIMPAN VISIT BARU</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${p.visits.map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative group">
                            <div class="absolute top-2 right-2 hidden group-hover:block">
                                <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-500 bg-white rounded-full px-2 shadow"><i class="fas fa-times"></i></button>
                            </div>
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                            <p class="text-[10px] text-teal-600 font-bold">${v.time}</p>
                            <p class="text-xs italic my-2 bg-white p-2 rounded border">"${v.note}"</p>
                            <div class="flex justify-end"><img src="${v.sign}" class="h-12 border-b-2 border-slate-300"></div>
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
                <label class="text-xs font-bold">Foto Kegiatan</label>
                <input type="file" id="v_photo" class="input-field text-xs">
                
                <label class="text-xs font-bold">Catatan / Wawancara</label>
                <textarea id="v_note" placeholder="Hasil Wawancara Dokter..." class="input-field h-32">${v?v.note:''}</textarea>
                
                <label class="text-xs font-bold">Tanda Tangan Dokter</label>
                <div class="border rounded-xl p-2 bg-white text-center shadow-inner">
                    <canvas id="sig-pad" class="w-full h-40 border bg-slate-50 rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[10px] text-red-500 mt-2 border border-red-200 px-2 py-1 rounded hover:bg-red-50">Hapus Tanda Tangan</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        // Inisialisasi SignaturePad setelah modal muncul
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            if(canvas) {
                // Resize canvas resolution fix
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                this.signaturePad = new SignaturePad(canvas);
            }
        }, 100);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        
        // Cek TTD kosong
        if(this.signaturePad.isEmpty() && idx === null) {
            return Swal.fire('Error', 'Tanda tangan dokter wajib diisi!', 'warning');
        }

        const file = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : "https://via.placeholder.com/400x300?text=No+Photo";
        if(file) photo = await this.toBase64(file);
        
        // Ambil TTD hanya jika tidak kosong, atau gunakan yang lama jika edit
        let sign = this.signaturePad.isEmpty() && idx !== null ? p.visits[idx].sign : this.signaturePad.toDataURL();

        const data = { 
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), 
            note: document.getElementById('v_note').value, 
            photo: photo, 
            sign: sign 
        };
        
        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- CRISIS ---
    viewCrisis(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT SCORE BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border rounded-lg overflow-hidden">
                            <thead class="bg-red-50 text-red-900">
                                <tr><th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Total</th><th class="p-2">Aksi</th></tr>
                            </thead>
                            <tbody>
                                ${p.crisis.bpss.map((b, i) => `
                                    <tr class="border-b hover:bg-slate-50">
                                        <td class="p-2 font-bold">D-${i+1}</td>
                                        <td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
                                        <td class="p-2 font-bold text-red-600">${b.eval}</td>
                                        <td class="p-2">
                                            <button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500 hover:text-red-700"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>`).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-4 bg-white relative">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
            </div>
        `).join('');
        // Render chart setelah HTML masuk
        setTimeout(() => this.data.patients.forEach(p => this.renderChart(p)), 0);
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis.bpss.length) return;
        
        // Hancurkan chart lama jika ada agar tidak tumpuk (optional, simple check)
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `D-${i+1}`),
                datasets: [{ 
                    label: 'Skor BPSS', 
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
            <div class="grid grid-cols-4 gap-4 mb-4">
                <input id="b_bio" type="number" placeholder="Bio" class="input-field text-center">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field text-center">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field text-center">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field text-center">
            </div>
            <textarea id="b_note" placeholder="Catatan Evaluasi..." class="input-field w-full h-24 mb-4"></textarea>
            <button onclick="app.saveBPSS('${pid}')" class="w-full bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-700">SIMPAN SKOR</button>
        `;
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
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- PROGRAM ---
    viewProgram(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - PROGRAM</h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-teal-50 p-6 rounded-xl border border-teal-100 text-center">
                        <p class="text-xs text-teal-600 uppercase font-bold">Jenis Paket</p>
                        <p class="text-xl font-black text-slate-700 mt-1">${p.program.type || '-'}</p>
                    </div>
                    <div class="bg-teal-50 p-6 rounded-xl border border-teal-100 text-center">
                        <p class="text-xs text-teal-600 uppercase font-bold">Durasi</p>
                        <p class="text-xl font-black text-slate-700 mt-1">${p.program.duration || '-'}</p>
                    </div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="w-full bg-teal-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-teal-700">UBAH PROGRAM</button>
            </div>
        `).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM REHABILITASI";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <label class="font-bold text-slate-500">Pilih Paket</label>
                <select id="pr_type" class="input-field">
                    <option value="Reguler" ${p.program.type==='Reguler'?'selected':''}>Reguler</option>
                    <option value="Eksklusif" ${p.program.type==='Eksklusif'?'selected':''}>Eksklusif</option>
                    <option value="VIP" ${p.program.type==='VIP'?'selected':''}>VIP</option>
                </select>
                
                <label class="font-bold text-slate-500">Durasi</label>
                <select id="pr_dur" class="input-field">
                    <option value="7 Hari" ${p.program.duration==='7 Hari'?'selected':''}>7 Hari</option>
                    <option value="14 Hari" ${p.program.duration==='14 Hari'?'selected':''}>14 Hari</option>
                    <option value="30 Hari" ${p.program.duration==='30 Hari'?'selected':''}>30 Hari</option>
                    <option value="3 Bulan" ${p.program.duration==='3 Bulan'?'selected':''}>3 Bulan</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN PROGRAM</button>
            </div>`;
        this.openModal();
    },

    async saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { type: document.getElementById('pr_type').value, duration: document.getElementById('pr_dur').value };
        await this.saveDB(); this.closeModal(); this.render();
    },

    // --- THERAPY ---
    viewTherapy(container) {
        container.innerHTML = (this.data.patients || []).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - CATATAN TERAPI</h3>
                <textarea id="ther_${p.id}" class="input-field h-40 mb-4 p-4 text-sm leading-relaxed" placeholder="Tuliskan perkembangan terapi pasien di sini...">${p.therapy || ''}</textarea>
                <div class="flex justify-end">
                    <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-teal-700 shadow-md">SIMPAN CATATAN</button>
                </div>
            </div>
        `).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        await this.saveDB();
        Swal.fire({ title: 'Tersimpan', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
    },

    // --- UTILS ---
    async delPatient(pid) {
        const res = await Swal.fire({
            title: 'Hapus Data Pasien?',
            text: "Seluruh data (Obat, Visit, Crisis) akan hilang permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus Semua',
            confirmButtonColor: '#d33'
        });

        if(res.isConfirmed) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            await this.saveDB(); this.render();
            Swal.fire('Terhapus', 'Data pasien telah dihapus.', 'success');
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        
        // Logic akses nested object string (ex: "crisis.bpss")
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        
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
        if(!this.data.patients || this.data.patients.length === 0) return Swal.fire('Data Kosong', 'Belum ada data pasien.', 'warning');
        
        const rows = this.data.patients.map(p => ({ 
            Nama: p.reg.name, 
            Usia: p.reg.age,
            Diagnosa: p.diagnosis.dr_name, 
            Obat: p.diagnosis.rx_name,
            Program: p.program.type,
            Masuk: p.reg.timestamp
        }));
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien MMRC");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    },

    // FIX: FUNGSI INI HILANG SEBELUMNYA, MENYEBABKAN ERROR
    async exportToWord() {
        if(!this.data.patients || this.data.patients.length === 0) return Swal.fire('Data Kosong', 'Belum ada data pasien.', 'warning');
        
        // Memastikan library docx terload
        if(typeof docx === 'undefined') return Swal.fire('Error', 'Library Docx belum siap.', 'error');

        const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } = docx;

        // Membuat isi dokumen
        const docChildren = [
            new Paragraph({
                text: "LAPORAN HARIAN MMRC",
                heading: HeadingLevel.HEADING_1,
                alignment: "center"
            }),
            new Paragraph({
                text: `Dicetak pada: ${new Date().toLocaleString('id-ID')}`,
                alignment: "center"
            }),
            new Paragraph({ text: "" }) // Spacing
        ];

        this.data.patients.forEach((p, index) => {
            docChildren.push(
                new Paragraph({
                    text: `${index + 1}. ${p.reg.name} (${p.reg.age} Thn)`,
                    heading: HeadingLevel.HEADING_3
                }),
                new Paragraph({
                    text: `Diagnosa: ${p.diagnosis.dr_name} | Program: ${p.program.type}`,
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: `Obat: ${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})`,
                    bullet: { level: 0 }
                }),
                new Paragraph({
                    text: `Kondisi Terkini: ${p.history.current || '-'}`,
                    bullet: { level: 0 }
                }),
                 new Paragraph({ text: "" }),
                new Paragraph({ text: "------------------------------------------------------------------" }),
                new Paragraph({ text: "" })
            );
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: docChildren,
            }],
        });

        // Generate dan Download
        Packer.toBlob(doc).then((blob) => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            document.body.appendChild(a);
            a.href = url;
            a.download = "MMRC_Laporan_Pasien.docx";
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            Swal.fire('Sukses', 'File Word berhasil didownload', 'success');
        });
    }
};

// Expose app ke window agar bisa diakses HTML onclick
window.app = app;
