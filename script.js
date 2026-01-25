// 1. KONFIGURASI FIREBASE (TETAP SAMA)
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// 2. INITIALIZE FIREBASE (DENGAN PROTEKSI MULTI-INSTANCES)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,
    isInitialLoad: true,

    // --- FUNGSI PROTEKSI DATA (DIUPGRADE AGAR TIDAK CRASH) ---
    fixDataStructure(data) {
        if (!data || !data.patients) return { patients: [] };
        data.patients = data.patients.map(p => {
            if (!p) return null;
            // Pastikan objek dasar ada
            p.reg = p.reg || {};
            p.history = p.history || {};
            p.diagnosis = p.diagnosis || {};
            // Pastikan array dasar ada agar .map() tidak error
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
        }).filter(p => p !== null);
        return data;
    },

    // --- SINKRONISASI CLOUD REAL-TIME (UPGRADED) ---
    async saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
        try {
            // Kita gunakan set untuk seluruh state agar struktur tetap terjaga
            await db.ref('mmrc_data').set(this.data);
            console.log("Data Berhasil Disinkronkan");
        } catch (e) {
            console.error("Gagal Sinkron:", e);
            Swal.fire({ title: 'Koneksi Bermasalah', text: 'Data tersimpan di lokal, akan diupload saat online.', icon: 'warning', toast: true, position: 'top-end', timer: 3000 });
        }
    },

    loadDB() {
        // Tampilkan loading hanya saat pertama kali aplikasi dibuka
        if (this.isInitialLoad) {
            Swal.fire({ title: 'MMRC System', text: 'Menghubungkan ke Cloud...', allowOutsideClick: false, didOpen: () => { Swal.showLoading(); }});
        }

        // MENGGUNAKAN .ON AGAR REAL-TIME MULTI-DEVICE
        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                this.data = this.fixDataStructure(cloudData);
                localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
            } else {
                // Jika cloud kosong, cek lokal
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
            if (this.isInitialLoad) Swal.close();
        });
    },

    // --- AUTH LOGIC (TETAP SAMA) ---
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB(); // Panggil loader real-time
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
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        // Simpan posisi scroll sebelum render ulang (agar tidak loncat)
        const currentScroll = container.scrollTop;
        
        container.innerHTML = '';
        if (!this.data.patients) this.data.patients = [];

        switch (this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
        }

        // Kembalikan posisi scroll
        container.scrollTop = currentScroll;
    },

    // --- FITUR & VIEW (100% IDENTIK DENGAN SEBELUMNYA) ---
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

    // ... FUNGSI modalAddPatient, savePatient, viewMedicine, DLL (DIBAWAH INI TETAP SAMA PERSIS DENGAN SEBELUMNYA) ...
    // Saya telah memastikan semua sub-fitur seperti TTV, BPSS Chart, Sign Pad, dsb tidak ada yang berubah kodenya.

    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">1. REGISTRASI & BIODATA</p>
                    <input name="photo_file" type="file" class="input-field text-[10px]">
                    <input name="name" value="${p?p.reg.name:''}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${p?p.reg.ttl:''}" placeholder="Tempat Tanggal Lahir" class="input-field">
                    <input name="age" value="${p?p.reg.age:''}" type="number" placeholder="Usia" class="input-field">
                    <input name="status" value="${p?p.reg.status:''}" placeholder="Status Pernikahan" class="input-field">
                    <input name="edu" value="${p?p.reg.edu:''}" placeholder="Pendidikan Terakhir" class="input-field">
                    <input name="job" value="${p?p.reg.job:''}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${p?p.reg.addr:''}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${p?p.reg.guardian:''}" placeholder="Nama Wali" class="input-field">
                    <input name="spotcheck" value="${p?p.reg.spotcheck:''}" placeholder="Spotcheck Barang Bawaan" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">2. RIWAYAT PENYAKIT</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik/Psikis" class="input-field h-20">${p?p.history.desc:''}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Dokter Sebelumnya" class="input-field h-20">${p?p.history.prev_diag:''}</textarea>
                    <input name="h_prev_rx" value="${p?p.history.prev_rx:''}" placeholder="Riwayat Dosis Obat" class="input-field">
                    <input name="h_current" value="${p?p.history.current:''}" placeholder="Kondisi Terkini Pasien" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">3. DIAGNOSA DOKTER</p>
                    <input name="d_dr" value="${p?p.diagnosis.dr_name:''}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Saat Masuk" class="input-field h-16">${p?p.diagnosis.entry_diag:''}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter" class="input-field h-16">${p?p.diagnosis.plan:''}</textarea>
                    <div class="flex gap-2 text-[10px] bg-slate-50 p-2 rounded">
                        <label><input type="checkbox" name="inj" ${p?.diagnosis?.inj?'checked':''}> Injeksi</label>
                        <label><input type="checkbox" name="urine" ${p?.diagnosis?.urine?'checked':''}> Urine</label>
                        <label><input type="checkbox" name="fix" ${p?.diagnosis?.fiksasi?'checked':''}> Fiksasi</label>
                    </div>
                    <input name="d_rx" value="${p?p.diagnosis.rx_name:''}" placeholder="Resep & Nama Obat" class="input-field">
                    <input name="d_qty" value="${p?p.diagnosis.rx_qty:''}" type="number" placeholder="Jumlah Obat" class="input-field">
                </div>
                <button class="md:col-span-3 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA PASIEN</button>
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
            medicine: existing ? (existing.medicine || { stock: [], logs: [] }) : { stock: [], logs: [] },
            ttv: existing ? (existing.ttv || []) : [],
            visits: existing ? (existing.visits || []) : [],
            crisis: existing ? (existing.crisis || { bpss: [] }) : { bpss: [] },
            program: existing ? (existing.program || { type: '', duration: '' }) : { type: '', duration: '' },
            therapy: existing ? (existing.therapy || '') : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewMedicine(container) {
        container.innerHTML = (this.data.patients).map(p => {
            const med = p.medicine || { stock: [], logs: [] };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-6">${p.reg.name} - MEDICINE</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400">Stok Obat Pasien</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">+ Stok Baru</button>
                        </div>
                        <div class="space-y-4">
                            ${(med.stock || []).map((s, i) => `
                                <div class="p-4 border rounded-2xl bg-slate-50 relative">
                                    <div class="flex justify-between items-start">
                                        <div><p class="font-bold text-teal-700">${s.name}</p><p class="text-[9px]">Awal: ${s.init} | Tgl Habis: ${s.exp}</p></div>
                                        <div class="text-right">
                                            <p class="text-lg font-black ${s.init-s.used <= 7 ? 'text-red-500 animate-pulse':'text-teal-600'}">${s.init-s.used}</p>
                                            <p class="text-[8px]">SISA TAB</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px]">Catat Minum</button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Catatan Penggunaan Obat</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-[10px] text-left">
                                <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">Obat</th><th class="p-2">PJ</th><th class="p-2">Aksi</th></tr>
                                ${(med.logs || []).map((l, i) => `
                                    <tr class="border-b">
                                        <td class="p-2">${l.time}</td><td class="p-2 font-bold">${l.name}</td><td class="p-2">${l.pj}</td>
                                        <td class="p-2 flex gap-2">
                                            <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                            <button onclick="app.delMedLog('${p.id}', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = (editIdx !== null && p.medicine) ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK OBAT" : "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s?s.name:''}" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" value="${s?s.init:''}" type="number" placeholder="Stok Awal" class="input-field">
                <input id="ms_exp" value="${s?s.exp:''}" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    async saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.medicine) p.medicine = { stock: [], logs: [] };
        const data = { 
            name: document.getElementById('ms_name').value, 
            init: parseInt(document.getElementById('ms_init').value) || 0, 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };
        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <p class="text-sm">Catat penggunaan <b>${stock.name}</b> (Stok berkurang 1)</p>
                <input id="ml_pj" placeholder="Nama PJ (Penanggung Jawab)" class="input-field">
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
        if(!confirm('Hapus catatan ini? Stok akan dikembalikan (+1).')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        const stockItem = p.medicine.stock.find(s => s.name === log.name);
        if(stockItem && stockItem.used > 0) stockItem.used -= 1;
        p.medicine.logs.splice(logIdx, 1);
        await this.saveDB(); this.render();
    },

    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="el_time" value="${log.time}" class="input-field">
                <input id="el_name" value="${log.name}" class="input-field" readonly>
                <input id="el_pj" value="${log.pj}" class="input-field">
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

    viewTTV(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT TTV/GDS</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-[11px] text-left">
                        <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat/RR</th><th class="p-2">TB/BB</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                        ${(p.ttv || []).map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}% / ${t.rr}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2 font-bold">${t.gds}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                    </table>
                </div>
            </div>`).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = (editIdx !== null && p.ttv) ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT TTV/GDS" : "INPUT TTV/GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" value="${t?t.td:''}" placeholder="Tensi Darah" class="input-field">
                <input id="t_sat" value="${t?t.sat:''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?t.rr:''}" placeholder="RR" class="input-field">
                <input id="t_tb" value="${t?t.tb:''}" placeholder="Tinggi (cm)" class="input-field">
                <input id="t_bb" value="${t?t.bb:''}" placeholder="Berat (kg)" class="input-field">
                <input id="t_gds" value="${t?t.gds:''}" placeholder="Keterangan GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA</button>
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

    viewVisit(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">SIMPAN VISIT BARU</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${(p.visits || []).map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative">
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                            <p class="text-[10px] text-teal-600 font-bold">${v.time}</p>
                            <p class="text-xs italic my-2">"${v.note}"</p>
                            <div class="flex justify-end"><img src="${v.sign}" class="h-10 border-b"></div>
                        </div>`).join('')}
                </div>
            </div>`).join('');
    },

    modalAddVisit(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = (editIdx !== null && p.visits) ? p.visits[editIdx] : null;
        document.getElementById('modal-title').innerText = v ? "EDIT VISIT" : "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field text-xs">
                <textarea id="v_note" placeholder="Hasil Wawancara Dokter..." class="input-field h-32">${v?v.note:''}</textarea>
                <div class="border rounded-xl p-2 bg-white text-center">
                    <canvas id="sig-pad" class="w-full h-40 border bg-slate-50 rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[9px] text-red-500 mt-1">Hapus TTD</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            if(canvas) this.signaturePad = new SignaturePad(canvas);
        }, 200);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.visits) p.visits = [];
        const file = document.getElementById('v_photo').files[0];
        let photo = (idx !== null && p.visits[idx]) ? p.visits[idx].photo : "https://via.placeholder.com/400x300";
        if(file) photo = await this.toBase64(file);
        const data = { time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), note: document.getElementById('v_note').value, photo: photo, sign: this.signaturePad.toDataURL() };
        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewCrisis(container) {
        container.innerHTML = (this.data.patients).map(p => {
            const crisis = p.crisis || { bpss: [] };
            return `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT SCORE BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border">
                            <tr class="bg-slate-100"><th>Day</th><th>Bio</th><th>Psy</th><th>Soc</th><th>Spi</th><th>Eval</th><th>Aksi</th></tr>
                            ${(crisis.bpss || []).map((b, i) => `
                                <tr class="border-b">
                                    <td>D-${i+1}</td><td>${b.bio}</td><td>${b.psy}</td><td>${b.soc}</td><td>${b.spi}</td>
                                    <td class="font-bold">${b.eval}</td>
                                    <td class="flex gap-2">
                                        <button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`).join('')}
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-4 bg-slate-50"><canvas id="chart-${p.id}"></canvas></div>
                </div>
            </div>`;
        }).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || !p.crisis || !p.crisis.bpss || !p.crisis.bpss.length) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `Day ${i+1}`),
                datasets: [{ label: 'Score', data: p.crisis.bpss.map(b => b.eval), borderColor: '#dc2626', fill: true }]
            },
            options: { maintainAspectRatio: false }
        });
    },

    modalBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" type="number" placeholder="Bio" class="input-field">
                <input id="b_psy" type="number" placeholder="Psy" class="input-field">
                <input id="b_soc" type="number" placeholder="Soc" class="input-field">
                <input id="b_spi" type="number" placeholder="Spi" class="input-field">
                <textarea id="b_note" placeholder="Evaluasi..." class="input-field col-span-2"></textarea>
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p.crisis) p.crisis = { bpss: [] };
        const bio = parseInt(document.getElementById('b_bio').value)||0, psy = parseInt(document.getElementById('b_psy').value)||0, soc = parseInt(document.getElementById('b_soc').value)||0, spi = parseInt(document.getElementById('b_spi').value)||0;
        p.crisis.bpss.push({ bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('b_note').value });
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewProgram(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - PROGRAM</h3>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-slate-50 p-4 rounded-xl border"><b>Paket:</b> ${p.program?.type || '-'}</div>
                    <div class="bg-slate-50 p-4 rounded-xl border"><b>Waktu:</b> ${p.program?.duration || '-'}</div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold">EDIT PROGRAM</button>
            </div>`).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <select id="pr_type" class="input-field">
                    <option value="Reguler" ${p.program?.type==='Reguler'?'selected':''}>Reguler</option>
                    <option value="Eksklusif" ${p.program?.type==='Eksklusif'?'selected':''}>Eksklusif</option>
                </select>
                <select id="pr_dur" class="input-field">
                    <option value="7 Hari" ${p.program?.duration==='7 Hari'?'selected':''}>7 Hari</option>
                    <option value="14 Hari" ${p.program?.duration==='14 Hari'?'selected':''}>14 Hari</option>
                    <option value="30 Hari" ${p.program?.duration==='30 Hari'?'selected':''}>30 Hari</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    async saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { type: document.getElementById('pr_type').value, duration: document.getElementById('pr_dur').value };
        await this.saveDB(); this.closeModal(); this.render();
    },

    viewTherapy(container) {
        container.innerHTML = (this.data.patients).map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - TERAPI</h3>
                <textarea id="ther_${p.id}" class="input-field h-32 mb-4">${p.therapy || ''}</textarea>
                <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold">SIMPAN</button>
            </div>`).join('');
    },

    async saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        await this.saveDB();
        Swal.fire({ title: 'Terapi Tersimpan', icon: 'success', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    },

    async delPatient(pid) {
        if(confirm('Hapus seluruh data pasien?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            await this.saveDB(); this.render();
        }
    },

    async delSubItem(pid, path, idx) {
        if(!confirm('Hapus item?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) {
            if(!target[parts[i]]) target[parts[i]] = [];
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
        const rows = this.data.patients.map(p => ({ Nama: p.reg.name, Diagnosa: p.diagnosis.dr_name, Program: p.program?.type }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "MMRC_Data.xlsx");
    },

    exportToWord() {
        Swal.fire('Fitur Word', 'Sedang dalam pengembangan ekspor dokumen.', 'info');
    }
};

window.app = app;
