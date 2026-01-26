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

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// 2. LOGIKA UTAMA APLIKASI
// ============================================================
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    saveTimer: null,
    chartInstances: {}, 
    signaturePad: null,

    // --- INIT & LOAD DATA ---
    init() {
        console.log("MMRC System: Starting...");
        this.loadDB();
        
        // Cek Login Session
        if(sessionStorage.getItem('MMRC_USER')) {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        }
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        // PASSWORD HARDCODE SESUAI PERMINTAAN LAMA
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_USER', u);
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
            Swal.fire({icon: 'success', title: 'Login Berhasil', timer: 1000, showConfirmButton: false});
        } else {
            Swal.fire('Akses Ditolak', 'ID Staff atau Password salah!', 'error');
        }
    },

    // --- DATABASE SYNC (800ms DEBOUNCE) ---
    saveDB() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            // 1. Simpan ke LocalStorage (Cadangan)
            localStorage.setItem('MMRC_DB_V2', JSON.stringify(this.data));
            
            // 2. Simpan ke Firebase
            db.ref('mmrc_data').set(this.data)
                .then(() => console.log("✅ Data Tersimpan ke Server"))
                .catch(err => console.error("❌ Gagal Simpan:", err));
        }, 800);
    },

    loadDB() {
        // Load Local dulu biar cepat
        const local = localStorage.getItem('MMRC_DB_V2');
        if (local) {
            try { this.data = JSON.parse(local); if(!this.data.patients) this.data.patients=[]; } catch(e){}
        }

        // Listen Firebase
        db.ref('mmrc_data').on('value', (snap) => {
            const val = snap.val();
            if (val) {
                // Cek jika sedang buka modal (jangan update biar gak kaget)
                if(document.getElementById('modal-container').classList.contains('hidden')) {
                    this.data = val;
                    if(!this.data.patients) this.data.patients = [];
                    this.render();
                }
            }
        });
    },

    nav(page) {
        this.currentPage = page;
        // Update UI Button
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        
        // Update Title
        document.getElementById('page-title').innerText = page.replace('_', ' ').toUpperCase();
        this.render();
    },

    render() {
        const c = document.getElementById('main-content');
        c.innerHTML = '';

        if(this.currentPage === 'dashboard') this.renderDashboard(c);
        else if(this.currentPage === 'medicine') this.renderMedicine(c);
        else if(this.currentPage === 'ttv') this.renderTTV(c);
        else if(this.currentPage === 'visit') this.renderVisit(c);
        else if(this.currentPage === 'crisis') this.renderCrisis(c);
        else if(this.currentPage === 'program') this.renderProgram(c);
        else if(this.currentPage === 'therapy') this.renderTherapy(c);
    },

    // ============================================================
    // MENU 1: DASHBOARD (CRUD PASIEN + EXPORT TOMBOL)
    // ============================================================
    renderDashboard(c) {
        c.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-gray-700">Total Pasien: ${this.data.patients.length}</h3>
                <button onclick="app.modalPatient()" class="bg-red-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-900 shadow-lg flex items-center gap-2">
                    <i class="fas fa-plus-circle"></i> PASIEN BARU
                </button>
            </div>
            <div class="grid gap-6">
                ${this.data.patients.map(p => `
                <div class="card-mmrc search-item relative group">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="w-full md:w-1/4 text-center border-r border-gray-100 pr-4">
                            <img src="${p.reg.photo || 'logo.png'}" onerror="this.src='https://via.placeholder.com/150?text=NO+IMAGE'" class="w-28 h-28 mx-auto rounded-full object-cover border-4 border-red-50 shadow-md mb-2">
                            <h4 class="font-black text-xl text-red-900">${p.reg.name}</h4>
                            <p class="text-xs font-bold text-gray-500">${p.reg.age} Thn | ${p.reg.gender || 'L/P'}</p>
                            
                            <div class="grid grid-cols-2 gap-2 mt-4">
                                <button onclick="app.exportWord('${p.id}')" class="bg-blue-600 text-white text-[10px] py-2 rounded font-bold hover:bg-blue-700 flex flex-col items-center">
                                    <i class="fas fa-file-word text-lg mb-1"></i> WORD LENGKAP
                                </button>
                                <button onclick="app.exportExcel('${p.id}')" class="bg-green-600 text-white text-[10px] py-2 rounded font-bold hover:bg-green-700 flex flex-col items-center">
                                    <i class="fas fa-file-excel text-lg mb-1"></i> EXCEL DATA
                                </button>
                            </div>
                        </div>
                        <div class="w-full md:w-3/4 flex flex-col justify-between">
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div><p class="text-[10px] text-gray-400 font-bold uppercase">Diagnosa</p><p class="font-bold">${p.diagnosis.entry_diag || '-'}</p></div>
                                <div><p class="text-[10px] text-gray-400 font-bold uppercase">Dokter PJ</p><p class="font-bold">${p.diagnosis.dr_name || '-'}</p></div>
                                <div class="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-100"><p class="text-[10px] text-yellow-600 font-bold uppercase">Kondisi</p><p class="italic">"${p.history.current || '-'}"</p></div>
                            </div>
                            <div class="flex justify-end gap-3 mt-4 border-t pt-3">
                                <button onclick="app.modalPatient('${p.id}')" class="text-amber-600 font-bold text-xs border border-amber-200 px-4 py-2 rounded hover:bg-amber-50">EDIT BIODATA</button>
                                <button onclick="app.deletePatient('${p.id}')" class="text-red-600 font-bold text-xs border border-red-200 px-4 py-2 rounded hover:bg-red-50">HAPUS</button>
                            </div>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        `;
    },

    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT PASIEN" : "REGISTRASI BARU";
        
        // Helper Safe Value
        const v = (val) => val ? val : '';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2 border-b pb-2 mb-2 font-bold text-red-800">1. IDENTITAS</div>
                <input id="in_name" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" class="input-field">
                <input id="in_ttl" value="${v(p?.reg.ttl)}" placeholder="TTL" class="input-field">
                <input id="in_age" value="${v(p?.reg.age)}" type="number" placeholder="Usia" class="input-field">
                <input id="in_gender" value="${v(p?.reg.gender)}" placeholder="L / P" class="input-field">
                <input id="in_addr" value="${v(p?.reg.addr)}" placeholder="Alamat" class="input-field col-span-2">
                
                <div class="col-span-2 mt-4 border-b pb-2 mb-2 font-bold text-red-800">2. MEDIS</div>
                <input id="in_dr" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter PJ" class="input-field">
                <textarea id="in_diag" placeholder="Diagnosa Masuk" class="input-field h-20">${v(p?.diagnosis.entry_diag)}</textarea>
                <textarea id="in_curr" placeholder="Kondisi Saat Ini" class="input-field h-20">${v(p?.history.current)}</textarea>
                
                <div class="col-span-2 mt-4">
                    <p class="text-xs mb-1">Foto Profil:</p>
                    <input type="file" id="in_photo" class="text-sm">
                </div>
            </div>
            <button onclick="app.savePatient('${id || ''}')" class="w-full bg-red-800 text-white py-3 rounded-xl font-bold mt-6 text-lg">SIMPAN DATA</button>
        `;
        this.openModal();
    },

    async savePatient(id) {
        const name = document.getElementById('in_name').value;
        if(!name) return Swal.fire('Error', 'Nama wajib diisi!', 'warning');

        // Handle Photo
        let photo = id ? this.data.patients.find(x=>x.id===id).reg.photo : '';
        const file = document.getElementById('in_photo').files[0];
        if(file) photo = await this.toBase64(file);

        const newP = {
            id: id || 'P-'+Date.now(),
            reg: {
                name, 
                ttl: document.getElementById('in_ttl').value,
                age: document.getElementById('in_age').value,
                gender: document.getElementById('in_gender').value,
                addr: document.getElementById('in_addr').value,
                photo: photo
            },
            diagnosis: {
                dr_name: document.getElementById('in_dr').value,
                entry_diag: document.getElementById('in_diag').value
            },
            history: {
                current: document.getElementById('in_curr').value
            },
            // PERTAHANKAN DATA LAMA JIKA EDIT
            medicine: id ? this.data.patients.find(x=>x.id===id).medicine : { stock: [], logs: [] },
            ttv: id ? this.data.patients.find(x=>x.id===id).ttv : [],
            crisis: id ? this.data.patients.find(x=>x.id===id).crisis : { bpss: [] },
            visits: id ? this.data.patients.find(x=>x.id===id).visits : [],
            program: id ? this.data.patients.find(x=>x.id===id).program : { list: [] },
            therapy: id ? this.data.patients.find(x=>x.id===id).therapy : { logs: [] }
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = newP;
        } else {
            this.data.patients.push(newP);
        }

        this.saveDB();
        this.closeModal();
        this.render();
        Swal.fire('Sukses', 'Data Pasien Tersimpan', 'success');
    },

    deletePatient(id) {
        Swal.fire({
            title: 'Hapus Pasien?', text: "Data tidak bisa dikembalikan!", icon: 'warning',
            showCancelButton: true, confirmButtonColor: '#991b1b', confirmButtonText: 'Ya, Hapus'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(p => p.id !== id);
                this.saveDB();
                this.render();
                Swal.fire('Terhapus!', 'Pasien telah dihapus.', 'success');
            }
        });
    },

    // ============================================================
    // MENU 2: OBAT (MEDICINE)
    // ============================================================
    renderMedicine(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalMed('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Obat</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-xs font-bold text-gray-500 mb-2">STOK OBAT</h4>
                        ${(p.medicine.stock||[]).map((m, i) => `
                            <div class="flex justify-between items-center bg-gray-50 p-2 rounded mb-1 border">
                                <div><p class="font-bold text-sm">${m.name}</p><p class="text-[10px]">Sisa: ${m.qty}</p></div>
                                <div>
                                    <button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-500 text-white px-2 py-1 rounded text-[10px]">Minum</button>
                                    <button onclick="app.delSubData('${p.id}', 'medicine.stock', ${i})" class="text-red-500 ml-1">x</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <h4 class="text-xs font-bold text-gray-500 mb-2">RIWAYAT MINUM</h4>
                        <div class="h-32 overflow-y-auto text-xs border p-2 bg-white">
                            ${(p.medicine.logs||[]).map(l => `<div class="border-b py-1"><b>${l.time}</b>: ${l.name} (${l.pj})</div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },
    modalMed(id) {
        document.getElementById('modal-title').innerText = "TAMBAH OBAT";
        document.getElementById('modal-body').innerHTML = `
            <input id="m_name" placeholder="Nama Obat" class="input-field mb-2">
            <input id="m_qty" type="number" placeholder="Jumlah Stok" class="input-field mb-2">
            <button onclick="app.saveMed('${id}')" class="bg-red-800 text-white w-full py-2 rounded font-bold">SIMPAN</button>
        `;
        this.openModal();
    },
    saveMed(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const name = document.getElementById('m_name').value;
        const qty = document.getElementById('m_qty').value;
        if(name && qty) {
            if(!p.medicine.stock) p.medicine.stock = [];
            p.medicine.stock.push({name, qty: parseInt(qty)});
            this.saveDB(); this.closeModal(); this.render();
        }
    },
    useMed(id, idx) {
        const p = this.data.patients.find(x=>x.id===id);
        const pj = prompt("Nama Staff (PJ):");
        if(pj) {
            const med = p.medicine.stock[idx];
            if(med.qty > 0) {
                med.qty -= 1;
                if(!p.medicine.logs) p.medicine.logs = [];
                p.medicine.logs.unshift({time: new Date().toLocaleString(), name: med.name, pj});
                this.saveDB(); this.render();
            } else { Swal.fire('Habis', 'Stok obat habis!', 'error'); }
        }
    },

    // ============================================================
    // MENU 3: TTV & GDS
    // ============================================================
    renderTTV(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ TTV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-gray-100"><tr><th>Waktu</th><th>TD</th><th>Nadi</th><th>Suhu</th><th>GDS</th><th>Opsi</th></tr></thead>
                        <tbody>
                            ${(p.ttv||[]).map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td>
                                <td class="p-2 font-bold">${t.td}</td>
                                <td class="p-2">${t.nadi}</td>
                                <td class="p-2">${t.suhu}</td>
                                <td class="p-2 text-red-600 font-bold">${t.gds}</td>
                                <td class="p-2"><button onclick="app.delSubData('${p.id}','ttv',${i})" class="text-red-500">Hapus</button></td>
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },
    modalTTV(id) {
        document.getElementById('modal-title').innerText = "INPUT TTV & GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-2">
                <input id="t_td" placeholder="TD (mmHg)" class="input-field">
                <input id="t_nadi" placeholder="Nadi" class="input-field">
                <input id="t_suhu" placeholder="Suhu" class="input-field">
                <input id="t_gds" placeholder="GDS" class="input-field border-red-300 bg-red-50">
            </div>
            <button onclick="app.saveTTV('${id}')" class="bg-red-800 text-white w-full py-2 rounded font-bold mt-4">SIMPAN</button>
        `;
        this.openModal();
    },
    saveTTV(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const newData = {
            time: new Date().toLocaleString(),
            td: document.getElementById('t_td').value,
            nadi: document.getElementById('t_nadi').value,
            suhu: document.getElementById('t_suhu').value,
            gds: document.getElementById('t_gds').value
        };
        if(!p.ttv) p.ttv = [];
        p.ttv.unshift(newData);
        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // MENU 4: VISIT DOKTER
    // ============================================================
    renderVisit(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Visit</button>
                </div>
                <div class="grid grid-cols-1 gap-4">
                    ${(p.visits||[]).map((v, i) => `
                        <div class="border rounded p-3 relative">
                            <button onclick="app.delSubData('${p.id}','visits',${i})" class="absolute top-2 right-2 text-red-500 font-bold">x</button>
                            <p class="text-xs font-bold text-gray-500">${v.time}</p>
                            <p class="font-bold my-2">"${v.note}"</p>
                            <div class="flex gap-4 mt-2">
                                <img src="${v.photo}" class="h-20 border rounded">
                                <img src="${v.sign}" class="h-20 border rounded bg-white">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },
    modalVisit(id) {
        document.getElementById('modal-title').innerText = "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <p class="text-sm font-bold">Foto:</p>
            <input type="file" id="v_photo" class="mb-2 w-full text-sm">
            <textarea id="v_note" placeholder="Catatan/Instruksi Dokter" class="input-field h-20 mb-2"></textarea>
            <p class="text-sm font-bold">Tanda Tangan Dokter:</p>
            <canvas id="sig-pad" class="border w-full h-32 bg-gray-50 rounded cursor-crosshair"></canvas>
            <button onclick="app.clearSig()" class="text-xs text-red-500 underline mb-2">Hapus TTD</button>
            <button onclick="app.saveVisit('${id}')" class="bg-red-800 text-white w-full py-3 rounded font-bold">SIMPAN</button>
        `;
        this.openModal();
        this.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
    },
    clearSig() { this.signaturePad.clear(); },
    async saveVisit(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const f = document.getElementById('v_photo').files[0];
        const photo = f ? await this.toBase64(f) : '';
        const sign = this.signaturePad.toDataURL();
        const note = document.getElementById('v_note').value;
        
        if(!p.visits) p.visits = [];
        p.visits.unshift({time: new Date().toLocaleString(), photo, sign, note});
        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // MENU 5: CRISIS (GRAFIK BPSS)
    // ============================================================
    renderCrisis(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-6">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalCrisis('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Score</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="h-48 relative border rounded p-1">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                    <div class="h-48 overflow-y-auto text-xs border p-2 bg-gray-50">
                        ${(p.crisis?.bpss||[]).map((b, i) => `
                            <div class="flex justify-between border-b py-1">
                                <span>H-${i+1} | Skor: <b>${b.total}</b></span>
                                <button onclick="app.delSubData('${p.id}','crisis.bpss',${i})" class="text-red-500">x</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `).join('');

        // Render Grafik
        setTimeout(() => {
            this.data.patients.forEach(p => {
                const ctx = document.getElementById(`chart-${p.id}`);
                if(ctx && p.crisis?.bpss?.length > 0) {
                    if(this.chartInstances[p.id]) this.chartInstances[p.id].destroy();
                    this.chartInstances[p.id] = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: p.crisis.bpss.map((_, i) => `H-${i+1}`),
                            datasets: [{
                                label: 'Skor BPSS',
                                data: p.crisis.bpss.map(b => b.total),
                                borderColor: '#991b1b',
                                tension: 0.1
                            }]
                        },
                        options: { maintainAspectRatio: false, scales: { y: { min: 0 } } }
                    });
                }
            });
        }, 100);
    },
    modalCrisis(id) {
        document.getElementById('modal-title').innerText = "INPUT BPSS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-2 text-sm">
                <input id="cb_bio" type="number" placeholder="Biological" class="input-field">
                <input id="cb_psy" type="number" placeholder="Psychological" class="input-field">
                <input id="cb_soc" type="number" placeholder="Social" class="input-field">
                <input id="cb_spi" type="number" placeholder="Spiritual" class="input-field">
            </div>
            <button onclick="app.saveCrisis('${id}')" class="bg-red-800 text-white w-full py-2 rounded font-bold mt-4">SIMPAN</button>
        `;
        this.openModal();
    },
    saveCrisis(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const bio = parseInt(document.getElementById('cb_bio').value)||0;
        const psy = parseInt(document.getElementById('cb_psy').value)||0;
        const soc = parseInt(document.getElementById('cb_soc').value)||0;
        const spi = parseInt(document.getElementById('cb_spi').value)||0;
        
        if(!p.crisis) p.crisis = { bpss: [] };
        if(!p.crisis.bpss) p.crisis.bpss = [];
        
        p.crisis.bpss.push({ bio, psy, soc, spi, total: bio+psy+soc+spi });
        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // MENU 6: PROGRAM & TERAPI (YANG SEMPAT HILANG)
    // ============================================================
    renderProgram(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalProgram('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Program</button>
                </div>
                <ul class="list-disc pl-5 text-sm">
                    ${(p.program?.list||[]).map((pg, i) => `
                        <li class="mb-1">
                            <span class="font-bold">${pg.date}:</span> ${pg.desc} 
                            <button onclick="app.delSubData('${p.id}','program.list',${i})" class="text-red-500 ml-2 text-xs">[hapus]</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    },
    modalProgram(id) {
        document.getElementById('modal-title').innerText = "INPUT RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <input type="date" id="p_date" class="input-field mb-2">
            <textarea id="p_desc" placeholder="Deskripsi Program..." class="input-field h-24"></textarea>
            <button onclick="app.saveProgram('${id}')" class="bg-red-800 text-white w-full py-2 rounded font-bold mt-2">SIMPAN</button>
        `;
        this.openModal();
    },
    saveProgram(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.program) p.program = { list:[] };
        p.program.list.push({
            date: document.getElementById('p_date').value,
            desc: document.getElementById('p_desc').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    renderTherapy(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalTherapy('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Terapi</button>
                </div>
                 <ul class="list-decimal pl-5 text-sm">
                    ${(p.therapy?.logs||[]).map((th, i) => `
                        <li class="mb-1">
                            <b>${th.date}</b>: ${th.act} 
                            <button onclick="app.delSubData('${p.id}','therapy.logs',${i})" class="text-red-500 ml-2 text-xs">[hapus]</button>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `).join('');
    },
    modalTherapy(id) {
        document.getElementById('modal-title').innerText = "INPUT LOG TERAPI";
        document.getElementById('modal-body').innerHTML = `
            <input type="date" id="th_date" class="input-field mb-2">
            <textarea id="th_act" placeholder="Aktivitas Terapi..." class="input-field h-24"></textarea>
            <button onclick="app.saveTherapy('${id}')" class="bg-red-800 text-white w-full py-2 rounded font-bold mt-2">SIMPAN</button>
        `;
        this.openModal();
    },
    saveTherapy(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.therapy) p.therapy = { logs:[] };
        p.therapy.logs.push({
            date: document.getElementById('th_date').value,
            act: document.getElementById('th_act').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // FITUR EXPORT: WORD & EXCEL (PER PASIEN LENGKAP!)
    // ============================================================
    
    // --- 1. EXPORT WORD ---
    async exportWord(id) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p) return;
        
        Swal.fire({title: 'Membuat Laporan Word...', didOpen:()=>Swal.showLoading()});

        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ImageRun, HeadingLevel, AlignmentType, TextRun } = docx;

        // Helper Base64
        const b64 = (s) => { 
            try { return Uint8Array.from(atob(s.split(',')[1]), c=>c.charCodeAt(0)); } 
            catch(e){return null} 
        };

        const children = [];

        // HEADER
        children.push(new Paragraph({ text: `REKAM MEDIS MMRC: ${p.reg.name}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph({ text: `Generated: ${new Date().toLocaleString()}`, alignment: AlignmentType.CENTER }));
        children.push(new Paragraph(""));

        // FOTO PROFIL
        const photoData = b64(p.reg.photo);
        if(photoData) {
            children.push(new Paragraph({ children: [new ImageRun({ data: photoData, transformation: { width: 150, height: 150 } })], alignment: AlignmentType.CENTER }));
        }

        // A. BIODATA
        children.push(new Paragraph({ text: "A. IDENTITAS PASIEN", heading: HeadingLevel.HEADING_2 }));
        children.push(new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
                new TableRow({ children: [new TableCell({children:[new Paragraph("Nama")]}), new TableCell({children:[new Paragraph(p.reg.name)]})] }),
                new TableRow({ children: [new TableCell({children:[new Paragraph("TTL / Usia")]}), new TableCell({children:[new Paragraph(`${p.reg.ttl} / ${p.reg.age} Thn`)]})] }),
                new TableRow({ children: [new TableCell({children:[new Paragraph("Alamat")]}), new TableCell({children:[new Paragraph(p.reg.addr || '-')]})] }),
            ]
        }));
        children.push(new Paragraph(""));

        // B. DIAGNOSA & HISTORY
        children.push(new Paragraph({ text: "B. DATA KLINIS", heading: HeadingLevel.HEADING_2 }));
        children.push(new Paragraph({ text: `Dokter PJ: ${p.diagnosis.dr_name}`, bold: true }));
        children.push(new Paragraph({ text: `Diagnosa Masuk: ${p.diagnosis.entry_diag}` }));
        children.push(new Paragraph({ text: `Kondisi Saat Ini: ${p.history.current}` }));
        children.push(new Paragraph(""));

        // C. TTV
        children.push(new Paragraph({ text: "C. TTV & GDS", heading: HeadingLevel.HEADING_2 }));
        const ttvRows = [new TableRow({ children: ["Waktu", "TD", "Nadi", "GDS"].map(t=>new TableCell({children:[new Paragraph({text:t, bold:true})]})) })];
        (p.ttv||[]).forEach(t => {
            ttvRows.push(new TableRow({ children: [t.time, t.td, t.nadi, t.gds].map(x=>new TableCell({children:[new Paragraph(x||'-')]})) }));
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: ttvRows }));
        children.push(new Paragraph(""));

        // D. OBAT
        children.push(new Paragraph({ text: "D. RIWAYAT OBAT", heading: HeadingLevel.HEADING_2 }));
        const medRows = [new TableRow({ children: ["Waktu", "Nama Obat", "PJ"].map(t=>new TableCell({children:[new Paragraph({text:t, bold:true})]})) })];
        (p.medicine?.logs||[]).forEach(l => {
            medRows.push(new TableRow({ children: [l.time, l.name, l.pj].map(x=>new TableCell({children:[new Paragraph(x||'-')]})) }));
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: medRows }));
        children.push(new Paragraph(""));

        // E. BPSS (TABEL & GRAFIK)
        children.push(new Paragraph({ text: "E. SKOR BPSS (CRISIS)", heading: HeadingLevel.HEADING_2 }));
        const bpssRows = [new TableRow({ children: ["Hari Ke", "Bio", "Psy", "Soc", "Spi", "Total"].map(t=>new TableCell({children:[new Paragraph({text:t, bold:true})]})) })];
        (p.crisis?.bpss||[]).forEach((b, i) => {
            bpssRows.push(new TableRow({ children: [`H-${i+1}`, b.bio, b.psy, b.soc, b.spi, b.total].map(x=>new TableCell({children:[new Paragraph(x.toString())]})) }));
        });
        children.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: bpssRows }));
        children.push(new Paragraph(""));
        
        // F. VISIT DOKTER
        children.push(new Paragraph({ text: "F. VISIT DOKTER & TTD", heading: HeadingLevel.HEADING_2 }));
        (p.visits||[]).forEach(v => {
            children.push(new Paragraph({ text: `Visit: ${v.time}`, bold: true }));
            children.push(new Paragraph({ text: v.note, italic: true }));
            const sImg = b64(v.sign);
            const pImg = b64(v.photo);
            if(pImg) children.push(new Paragraph({ children: [new ImageRun({ data: pImg, transformation: { width: 100, height: 100 } })] }));
            if(sImg) children.push(new Paragraph({ children: [new TextRun(" TTD Dokter: "), new ImageRun({ data: sImg, transformation: { width: 80, height: 40 } })] }));
            children.push(new Paragraph("--------------------------------------------------"));
        });
        children.push(new Paragraph(""));

        // G. PROGRAM & TERAPI (YANG DIMINTA)
        children.push(new Paragraph({ text: "G. RENCANA PROGRAM", heading: HeadingLevel.HEADING_2 }));
        (p.program?.list||[]).forEach(pg => children.push(new Paragraph(`- [${pg.date}] ${pg.desc}`)));
        children.push(new Paragraph(""));

        children.push(new Paragraph({ text: "H. LOG TERAPI", heading: HeadingLevel.HEADING_2 }));
        (p.therapy?.logs||[]).forEach(th => children.push(new Paragraph(`- [${th.date}] ${th.act}`)));


        // GENERATE FILE
        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a); a.style = "display:none"; a.href = url; a.download = `MMRC_Laporan_${p.reg.name}.docx`; a.click();
        Swal.close();
    },

    // --- 2. EXPORT EXCEL ---
    exportExcel(id) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p) return;

        const wb = XLSX.utils.book_new();

        // Sheet 1: Biodata
        const bio = [
            { Item: "Nama", Nilai: p.reg.name },
            { Item: "TTL", Nilai: p.reg.ttl },
            { Item: "Umur", Nilai: p.reg.age },
            { Item: "Alamat", Nilai: p.reg.addr },
            { Item: "Diagnosa", Nilai: p.diagnosis.entry_diag },
            { Item: "Dokter PJ", Nilai: p.diagnosis.dr_name }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata");

        // Sheet 2: Obat
        if(p.medicine?.logs?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.medicine.logs), "Riwayat Obat");

        // Sheet 3: TTV
        if(p.ttv?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");

        // Sheet 4: BPSS
        if(p.crisis?.bpss?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.crisis.bpss), "Skor BPSS");

        // Sheet 5: Program & Terapi
        const progData = (p.program?.list||[]).map(x => ({ Tipe: 'Program', Tanggal: x.date, Isi: x.desc }));
        const thData = (p.therapy?.logs||[]).map(x => ({ Tipe: 'Terapi', Tanggal: x.date, Isi: x.act }));
        const combined = [...progData, ...thData];
        if(combined.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(combined), "Program_Terapi");

        XLSX.writeFile(wb, `MMRC_Data_${p.reg.name}.xlsx`);
    },

    // UTILS
    delSubData(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x=>x.id===pid);
        let target = p;
        const parts = path.split('.');
        // Traverse object path
        for(let i=0; i<parts.length-1; i++) target = target[parts[i]];
        // Delete array item
        target[parts[parts.length-1]].splice(idx, 1);
        this.saveDB(); this.render();
    },
    
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },
    
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

window.app = app;
app.init();
