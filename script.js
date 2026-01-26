// ============================================================
// 1. KONFIGURASI FIREBASE (SESUAI REQUEST)
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

// INITIALIZE
if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// 2. APLIKASI UTAMA (LOGIKA 800ms + FIX CRUD)
// ============================================================
const app = {
    data: { patients: [] }, 
    currentPage: 'dashboard',
    signaturePad: null,
    saveTimer: null,
    isRendering: false,
    chartInstances: {}, 

    init() { console.log("MMRC System Ready"); },

    // --- SISTEM SIMPAN (LOGIKA ASLI YANG DIPERBAIKI) ---
    saveDB() {
        // Debounce 800ms (Sesuai Permintaan)
        if (this.saveTimer) clearTimeout(this.saveTimer);

        this.saveTimer = setTimeout(() => {
            try {
                // 1. Simpan Local (Supaya tidak hilang)
                const jsonStr = JSON.stringify(this.data);
                localStorage.setItem('MMRC_DATABASE', jsonStr);
                
                // 2. Simpan Cloud (Background)
                db.ref('mmrc_data').set(this.data)
                    .then(() => console.log("☁️ Cloud Synced"))
                    .catch(e => console.warn("⚠️ Offline Mode"));
            } catch (err) {
                console.error("Storage Error:", err);
            }
        }, 800);
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DATABASE');
        if (local) {
            try { this.data = JSON.parse(local); if(!this.data.patients) this.data.patients=[]; this.render(); } 
            catch (e) { this.data = { patients: [] }; }
        }

        db.ref('mmrc_data').on('value', (snapshot) => {
            const cloudData = snapshot.val();
            if (cloudData) {
                const isModalOpen = !document.getElementById('modal-container').classList.contains('hidden');
                if (JSON.stringify(this.data) !== JSON.stringify(cloudData) && !isModalOpen) {
                    this.data = cloudData;
                    if(!this.data.patients) this.data.patients = [];
                    localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
                    if (!document.getElementById('app-layer').classList.contains('hidden')) this.render();
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
            Swal.fire('Error', 'Username/Password Salah!', 'error');
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
        if(this.isRendering) return;
        this.isRendering = true;
        requestAnimationFrame(() => {
            const container = document.getElementById('main-content');
            if (container) {
                container.innerHTML = ''; 
                // Router
                if(this.currentPage === 'dashboard') this.viewDashboard(container);
                else if(this.currentPage === 'medicine') this.viewMedicine(container);
                else if(this.currentPage === 'ttv') this.viewTTV(container);
                else if(this.currentPage === 'visit') this.viewVisit(container);
                else if(this.currentPage === 'crisis') this.viewCrisis(container);
                else if(this.currentPage === 'program') this.viewProgram(container);
                else if(this.currentPage === 'therapy') this.viewTherapy(container);
            }
            this.isRendering = false;
        });
    },

    // ============================================================
    // MENU 1: DASHBOARD (FIXED CRUD & EXPORT PER PASIEN)
    // ============================================================
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DATA PASIEN (${this.data.patients.length})</h3>
                <button onclick="app.modalAddPatient()" class="bg-red-800 hover:bg-red-900 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                    <i class="fas fa-user-plus"></i> REGISTRASI BARU
                </button>
            </div>
            <div class="grid grid-cols-1 gap-6">
                ${(this.data.patients || []).map(p => `
                    <div class="card-mmrc search-item">
                        <div class="flex flex-col md:flex-row gap-6">
                            <div class="w-full md:w-1/4 flex flex-col items-center text-center border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
                                <img src="${p.reg.photo || 'https://via.placeholder.com/150'}" class="w-24 h-24 rounded-full object-cover border-4 border-red-50 mb-3">
                                <h4 class="font-black text-lg text-red-900 leading-tight">${p.reg.name}</h4>
                                <p class="text-xs text-slate-500 font-bold mt-1">${p.reg.age} Thn | ${p.reg.ttl}</p>
                                <span class="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-1 rounded mt-2 uppercase tracking-widest">ID: ${p.id}</span>
                                
                                <div class="flex gap-2 mt-4 w-full justify-center">
                                    <button onclick="app.exportOnePatientWord('${p.id}')" class="bg-blue-600 text-white p-2 rounded-lg text-xs font-bold shadow hover:bg-blue-700 flex-1 flex items-center justify-center gap-1" title="Download Laporan Lengkap Word"><i class="fas fa-file-word"></i> Laporan</button>
                                    <button onclick="app.exportOnePatientExcel('${p.id}')" class="bg-green-600 text-white p-2 rounded-lg text-xs font-bold shadow hover:bg-green-700 flex-1 flex items-center justify-center gap-1" title="Download Data Excel"><i class="fas fa-file-excel"></i> Data</button>
                                </div>
                            </div>

                            <div class="w-full md:w-3/4 flex flex-col justify-between">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                                    <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                        <p class="text-[10px] text-gray-400 font-bold uppercase">Diagnosa Masuk</p>
                                        <p class="font-bold text-slate-700">${p.diagnosis.entry_diag || '-'}</p>
                                    </div>
                                    <div class="bg-red-50 p-3 rounded-xl border border-red-100">
                                        <p class="text-[10px] text-red-400 font-bold uppercase">Dokter Penanggung Jawab</p>
                                        <p class="font-bold text-red-900">${p.diagnosis.dr_name || '-'}</p>
                                    </div>
                                    <div class="col-span-1 md:col-span-2 bg-yellow-50 p-3 rounded-xl border border-yellow-100">
                                        <p class="text-[10px] text-yellow-600 font-bold uppercase">Kondisi Saat Ini</p>
                                        <p class="text-slate-700 italic">"${p.history.current || '-'}"</p>
                                    </div>
                                </div>
                                <div class="flex justify-end gap-3 border-t pt-4 border-gray-100">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 font-bold text-xs hover:bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 transition">EDIT DATA</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 font-bold text-xs hover:bg-red-50 px-4 py-2 rounded-lg border border-red-200 transition">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                ${(!this.data.patients.length) ? '<div class="text-center py-20 opacity-50"><i class="fas fa-folder-open text-4xl mb-4"></i><p>Belum ada data pasien.</p></div>' : ''}
            </div>`;
    },

    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        
        const val = (v) => v || '';
        const chk = (v) => v ? 'checked' : '';

        // FORM DENGAN ID YANG JELAS & TOMBOL TYPE BUTTON AGAR TIDAK RELOAD
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-red-800 uppercase">1. Identitas</p>
                    <div class="border-2 border-dashed border-gray-300 p-4 rounded-xl text-center hover:bg-gray-50 transition cursor-pointer relative">
                        <input id="fp_photo" type="file" class="absolute inset-0 opacity-0 cursor-pointer">
                        <i class="fas fa-camera text-gray-400 text-2xl mb-2"></i>
                        <p class="text-[10px] text-gray-500">Klik Upload Foto</p>
                    </div>
                    <input id="fp_name" value="${val(p?.reg?.name)}" placeholder="Nama Lengkap (Wajib)" class="input-field bg-white">
                    <div class="flex gap-2">
                        <input id="fp_ttl" value="${val(p?.reg?.ttl)}" placeholder="TTL" class="input-field w-2/3">
                        <input id="fp_age" value="${val(p?.reg?.age)}" type="number" placeholder="Umur" class="input-field w-1/3">
                    </div>
                    <input id="fp_job" value="${val(p?.reg?.job)}" placeholder="Pekerjaan" class="input-field">
                    <input id="fp_addr" value="${val(p?.reg?.addr)}" placeholder="Alamat" class="input-field">
                    <input id="fp_guardian" value="${val(p?.reg?.guardian)}" placeholder="Nama Wali" class="input-field">
                    <input id="fp_spot" value="${val(p?.reg?.spotcheck)}" placeholder="Spotcheck (Merah)" class="input-field text-red-600 font-bold border-red-200 bg-red-50">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-red-800 uppercase">2. Riwayat Medis</p>
                    <textarea id="fp_h_desc" placeholder="Riwayat Fisik & Psikologis" class="input-field h-24">${val(p?.history?.desc)}</textarea>
                    <textarea id="fp_h_prev" placeholder="Diagnosa Sebelumnya" class="input-field h-20">${val(p?.history?.prev_diag)}</textarea>
                    <input id="fp_h_rx" value="${val(p?.history?.prev_rx)}" placeholder="Riwayat Pengobatan" class="input-field">
                    <textarea id="fp_h_curr" placeholder="Kondisi Saat Ini" class="input-field h-24 bg-yellow-50 border-yellow-200">${val(p?.history?.current)}</textarea>
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-xs border-b pb-1 text-red-800 uppercase">3. Assessment MMRC</p>
                    <input id="fp_dr" value="${val(p?.diagnosis?.dr_name)}" placeholder="Dokter PJ" class="input-field font-bold">
                    <textarea id="fp_d_entry" placeholder="Diagnosa Masuk" class="input-field h-20 font-bold text-red-900">${val(p?.diagnosis?.entry_diag)}</textarea>
                    <textarea id="fp_d_plan" placeholder="Planning Dokter" class="input-field h-24">${val(p?.diagnosis?.plan)}</textarea>
                    <div class="flex gap-4 text-[11px] bg-gray-100 p-3 rounded-xl">
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="fp_inj" ${chk(p?.diagnosis?.inj)}> Injeksi</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="fp_urine" ${chk(p?.diagnosis?.urine)}> Urine</label>
                        <label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" id="fp_fix" ${chk(p?.diagnosis?.fiksasi)}> Fiksasi</label>
                    </div>
                </div>
                <button type="button" onclick="app.savePatient('${editId||''}')" class="md:col-span-3 bg-red-800 hover:bg-red-900 text-white py-4 rounded-xl font-black shadow-lg text-lg tracking-widest mt-4">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    async savePatient(editId) {
        // VALIDASI AGAR TIDAK KOSONG
        const name = document.getElementById('fp_name').value;
        if(!name) return Swal.fire('Gagal', 'Nama Wajib Diisi!', 'warning');

        Swal.fire({title: 'Menyimpan...', didOpen:()=>Swal.showLoading()});

        // AMBIL VALUE (Helper)
        const v = (id) => document.getElementById(id).value;
        const c = (id) => document.getElementById(id).checked;

        // FOTO
        let photo = null;
        if(editId) photo = this.data.patients.find(x=>x.id===editId).reg.photo;
        const f = document.getElementById('fp_photo').files[0];
        if(f) photo = await this.toBase64(f);

        const pData = {
            id: editId || 'P-'+Date.now(),
            reg: {
                name: v('fp_name'), ttl: v('fp_ttl'), age: v('fp_age'), job: v('fp_job'),
                addr: v('fp_addr'), guardian: v('fp_guardian'), spotcheck: v('fp_spot'), photo,
                timestamp: new Date().toLocaleDateString()
            },
            history: { desc: v('fp_h_desc'), prev_diag: v('fp_h_prev'), prev_rx: v('fp_h_rx'), current: v('fp_h_curr') },
            diagnosis: { 
                dr_name: v('fp_dr'), entry_diag: v('fp_d_entry'), plan: v('fp_d_plan'),
                inj: c('fp_inj'), urine: c('fp_urine'), fiksasi: c('fp_fix')
            },
            // DATA LAIN TETAP DIPERTAHANKAN
            medicine: editId ? this.data.patients.find(x=>x.id===editId).medicine : {stock:[], logs:[]},
            ttv: editId ? this.data.patients.find(x=>x.id===editId).ttv : [],
            visits: editId ? this.data.patients.find(x=>x.id===editId).visits : [],
            crisis: editId ? this.data.patients.find(x=>x.id===editId).crisis : {bpss:[]},
            program: editId ? this.data.patients.find(x=>x.id===editId).program : {},
            therapy: editId ? this.data.patients.find(x=>x.id===editId).therapy : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x=>x.id===editId);
            this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }

        this.closeModal();
        this.render();
        this.saveDB(); // Trigger Simpan (800ms timer)
        Swal.fire({icon:'success', title:'Tersimpan', timer:1000, showConfirmButton:false});
    },

    // ============================================================
    // MENU 2: OBAT (STOK < 7 MERAH)
    // ============================================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-6">
                <h3 class="font-bold text-red-900 text-lg border-b pb-2 mb-4">${p.reg.name}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div class="flex justify-between mb-2"><h4 class="font-bold text-xs text-gray-400">STOK OBAT</h4><button onclick="app.modalMedStock('${p.id}')" class="text-xs bg-red-800 text-white px-2 py-1 rounded">+ Stok</button></div>
                        <div class="space-y-2">
                            ${(p.medicine?.stock||[]).map((s,i) => {
                                const sisa = s.init - s.used;
                                const isLow = sisa < 7; // LOGIC MERAH JIKA < 7
                                return `
                                <div class="border rounded-lg p-3 flex justify-between items-center ${isLow?'bg-red-100 border-red-300 animate-pulse':''}">
                                    <div><p class="font-bold text-sm text-slate-700">${s.name}</p><p class="text-[10px] text-gray-500">Exp: ${s.exp}</p></div>
                                    <div class="text-right"><p class="text-xl font-black ${isLow?'text-red-600':'text-green-600'}">${sisa}</p><div class="flex gap-2 mt-1"><button onclick="app.useMed('${p.id}',${i})" class="bg-blue-500 text-white px-2 rounded text-[10px]">Minum</button><button onclick="app.delSub('${p.id}','medicine.stock',${i})" class="text-red-500 text-xs">x</button></div></div>
                                </div>`
                            }).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs text-gray-400 mb-2">RIWAYAT PENGGUNAAN</h4>
                        <div class="h-48 overflow-y-auto border rounded-lg bg-gray-50 p-2 text-xs">
                            ${(p.medicine?.logs||[]).map(l=>`<div class="flex justify-between border-b py-1"><span><b>${l.name}</b> (${l.time})</span><span class="italic text-gray-500">${l.pj}</span></div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    },
    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH OBAT";
        document.getElementById('modal-body').innerHTML = `<input id="ms_name" placeholder="Nama Obat" class="input-field mb-2"><input id="ms_init" type="number" placeholder="Jumlah" class="input-field mb-2"><input id="ms_exp" type="date" class="input-field mb-2"><button onclick="app.saveMedStock('${pid}')" class="w-full bg-red-800 text-white py-3 rounded font-bold">SIMPAN</button>`;
        this.openModal();
    },
    async saveMedStock(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        const name=document.getElementById('ms_name').value;
        const init=parseInt(document.getElementById('ms_init').value);
        if(!name) return;
        p.medicine.stock.push({name, init, used:0, exp:document.getElementById('ms_exp').value});
        this.closeModal(); this.render(); this.saveDB();
    },
    useMed(pid, idx) {
        const pj = prompt("Nama PJ:");
        if(!pj) return;
        const p = this.data.patients.find(x=>x.id===pid);
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({time:new Date().toLocaleString(), name:p.medicine.stock[idx].name, pj});
        this.render(); this.saveDB();
    },

    // ============================================================
    // MENU 3: TTV
    // ============================================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-6">
                <div class="flex justify-between mb-4"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalTTV('${p.id}')" class="bg-red-800 text-white px-3 py-1 rounded text-xs">+ Input</button></div>
                <div class="overflow-x-auto"><table class="w-full text-xs text-left"><thead class="bg-gray-100"><tr><th>Waktu</th><th>TD</th><th>Sat</th><th>TB/BB</th><th>GDS</th><th>X</th></tr></thead><tbody>
                ${(p.ttv||[]).map((t,i)=>`<tr><td class="p-2">${t.time}</td><td class="p-2 font-bold">${t.td}</td><td class="p-2">${t.sat}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2">${t.gds}</td><td class="p-2"><button onclick="app.delSub('${p.id}','ttv',${i})" class="text-red-500">x</button></td></tr>`).join('')}</tbody></table></div></div>`).join('');
    },
    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `<div class="grid grid-cols-2 gap-2"><input id="t_td" placeholder="TD"><input id="t_sat" placeholder="Sat"><input id="t_rr" placeholder="RR"><input id="t_gds" placeholder="GDS"><input id="t_tb" placeholder="TB"><input id="t_bb" placeholder="BB"></div><button onclick="app.saveTTV('${pid}')" class="w-full bg-red-800 text-white py-3 rounded mt-4">SIMPAN</button>`;
        this.openModal();
    },
    async saveTTV(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        const v = (id) => document.getElementById(id).value;
        p.ttv.unshift({time:new Date().toLocaleString(), td:v('t_td'), sat:v('t_sat'), rr:v('t_rr'), gds:v('t_gds'), tb:v('t_tb'), bb:v('t_bb')});
        this.closeModal(); this.render(); this.saveDB();
    },

    // ============================================================
    // MENU 4: CRISIS (GRAFIK HARI KE HARI)
    // ============================================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-6 border-l-4 border-red-500">
                <div class="flex justify-between mb-4"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalCrisis('${p.id}')" class="bg-red-600 text-white px-3 py-1 rounded text-xs">+ Score</button></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="h-48 border rounded bg-white relative"><canvas id="chart-${p.id}"></canvas></div>
                    <div class="h-48 overflow-y-auto border rounded bg-gray-50 text-xs p-2">
                        ${(p.crisis?.bpss||[]).map((b,i)=>`<div class="flex justify-between border-b py-1"><span>H-${i+1} Total: <b>${b.eval}</b></span><span class="truncate w-20">${b.note}</span><button onclick="app.delSub('${p.id}','crisis.bpss',${i})" class="text-red-500">x</button></div>`).join('')}
                    </div>
                </div>
            </div>`).join('');
        this.data.patients.forEach(p => {
            const ctx = document.getElementById(`chart-${p.id}`);
            if(ctx && p.crisis?.bpss?.length) {
                if(this.chartInstances[p.id]) this.chartInstances[p.id].destroy();
                this.chartInstances[p.id] = new Chart(ctx, {
                    type: 'line',
                    data: { labels: p.crisis.bpss.map((_,i)=>`H-${i+1}`), datasets: [{label:'Score', data:p.crisis.bpss.map(b=>b.eval), borderColor:'#991b1b', tension:0.3}] },
                    options: { maintainAspectRatio:false, scales:{y:{min:0, max:25}} }
                });
            }
        });
    },
    modalCrisis(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS";
        document.getElementById('modal-body').innerHTML = `<div class="grid grid-cols-2 gap-2"><input id="cb_bio" type="number" placeholder="Bio"><input id="cb_psy" type="number" placeholder="Psy"><input id="cb_soc" type="number" placeholder="Soc"><input id="cb_spi" type="number" placeholder="Spi"></div><textarea id="cb_note" class="input-field mt-2" placeholder="Catatan"></textarea><button onclick="app.saveCrisis('${pid}')" class="w-full bg-red-800 text-white py-3 rounded mt-2">SIMPAN</button>`;
        this.openModal();
    },
    async saveCrisis(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        const bio=parseInt(document.getElementById('cb_bio').value)||0;
        const psy=parseInt(document.getElementById('cb_psy').value)||0;
        const soc=parseInt(document.getElementById('cb_soc').value)||0;
        const spi=parseInt(document.getElementById('cb_spi').value)||0;
        p.crisis.bpss.push({bio, psy, soc, spi, eval:bio+psy+soc+spi, note:document.getElementById('cb_note').value});
        this.closeModal(); this.render(); this.saveDB();
    },

    // ============================================================
    // MENU LAINNYA & FITUR EXPORT LENGKAP PER PASIEN
    // ============================================================
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `<div class="card-mmrc mb-6"><div class="flex justify-between mb-4"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalVisit('${p.id}')" class="bg-red-800 text-white px-3 py-1 rounded text-xs">+ Visit</button></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${(p.visits||[]).map((v,i)=>`<div class="border rounded p-3"><img src="${v.photo}" class="h-32 w-full object-cover mb-2"><p class="text-xs font-bold">${v.time}</p><p class="text-xs italic">"${v.note}"</p><img src="${v.sign}" class="h-8 border-b"><button onclick="app.delSub('${p.id}','visits',${i})" class="text-red-500 text-xs w-full text-right">Hapus</button></div>`).join('')}</div></div>`).join('');
    },
    modalVisit(pid) {
        document.getElementById('modal-title').innerText = "INPUT VISIT";
        document.getElementById('modal-body').innerHTML = `<input type="file" id="v_photo"><textarea id="v_note" class="input-field mt-2" placeholder="Catatan"></textarea><canvas id="sig-pad" class="border w-full h-32 mt-2 bg-gray-50"></canvas><button onclick="app.saveVisit('${pid}')" class="w-full bg-red-800 text-white py-3 rounded mt-2">SIMPAN</button>`;
        this.openModal();
        this.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
    },
    async saveVisit(pid) {
        const p = this.data.patients.find(x=>x.id===pid);
        const f = document.getElementById('v_photo').files[0];
        const photo = await (f ? this.toBase64(f) : Promise.resolve(''));
        p.visits.unshift({time:new Date().toLocaleString(), note:document.getElementById('v_note').value, photo, sign:this.signaturePad.toDataURL()});
        this.closeModal(); this.render(); this.saveDB();
    },

    // --- FUNGSI EXPORT SATU PASIEN WORD ---
    async exportOnePatientWord(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p) return;

        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ImageRun, TextRun, HeadingLevel, AlignmentType } = docx;
        const b64 = (s) => { try { return Uint8Array.from(atob(s.split(',')[1]), c=>c.charCodeAt(0)); } catch(e){return null} };

        const children = [
            new Paragraph({text: `REKAM MEDIS: ${p.reg.name}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER}),
            new Paragraph({text: `ID: ${p.id} | Usia: ${p.reg.age}`, alignment: AlignmentType.CENTER}),
            new Paragraph("")
        ];

        // Foto Profil
        const photo = b64(p.reg.photo);
        if(photo) children.push(new Paragraph({children:[new ImageRun({data:photo, transformation:{width:150,height:150}})], alignment: AlignmentType.CENTER}));

        // 1. BIODATA & DIAGNOSA
        children.push(new Paragraph({text: "1. DATA KLINIS", heading: HeadingLevel.HEADING_2}));
        children.push(new Table({
            width: {size:100, type:WidthType.PERCENTAGE},
            rows: [
                new TableRow({children:[new TableCell({children:[new Paragraph("Diagnosa Masuk")]}), new TableCell({children:[new Paragraph(p.diagnosis.entry_diag)]})]}),
                new TableRow({children:[new TableCell({children:[new Paragraph("Dokter PJ")]}), new TableCell({children:[new Paragraph(p.diagnosis.dr_name)]})]}),
                new TableRow({children:[new TableCell({children:[new Paragraph("Riwayat")]}), new TableCell({children:[new Paragraph(p.history.desc)]})]})
            ]
        }));

        // 2. OBAT
        children.push(new Paragraph(""));
        children.push(new Paragraph({text: "2. RIWAYAT OBAT", heading: HeadingLevel.HEADING_2}));
        const medRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Waktu")]}), new TableCell({children:[new Paragraph("Obat")]}), new TableCell({children:[new Paragraph("PJ")]})]})];
        (p.medicine?.logs||[]).forEach(l => medRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(l.time)]}), new TableCell({children:[new Paragraph(l.name)]}), new TableCell({children:[new Paragraph(l.pj)]})] })));
        children.push(new Table({width:{size:100, type:WidthType.PERCENTAGE}, rows:medRows}));

        // 3. TTV
        children.push(new Paragraph(""));
        children.push(new Paragraph({text: "3. TTV & GDS", heading: HeadingLevel.HEADING_2}));
        const ttvRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Waktu")]}), new TableCell({children:[new Paragraph("TD")]}), new TableCell({children:[new Paragraph("GDS")]})]})];
        (p.ttv||[]).forEach(t => ttvRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(t.time)]}), new TableCell({children:[new Paragraph(t.td)]}), new TableCell({children:[new Paragraph(t.gds)]})] })));
        children.push(new Table({width:{size:100, type:WidthType.PERCENTAGE}, rows:ttvRows}));

        // 4. VISIT DOKTER
        children.push(new Paragraph(""));
        children.push(new Paragraph({text: "4. VISIT DOKTER", heading: HeadingLevel.HEADING_2}));
        (p.visits||[]).forEach(v => {
            children.push(new Paragraph({text: `Visit: ${v.time}`, bold:true}));
            children.push(new Paragraph({text: v.note, italic:true}));
            const sign = b64(v.sign);
            if(sign) children.push(new Paragraph({children:[new ImageRun({data:sign, transformation:{width:100,height:50}})]}));
            children.push(new Paragraph("------------------------------------------------"));
        });

        // 5. BPSS TABLE (Ganti Grafik)
        children.push(new Paragraph(""));
        children.push(new Paragraph({text: "5. SKOR BPSS (Harian)", heading: HeadingLevel.HEADING_2}));
        const bpssRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Hari")]}), new TableCell({children:[new Paragraph("Bio")]}), new TableCell({children:[new Paragraph("Psy")]}), new TableCell({children:[new Paragraph("Soc")]}), new TableCell({children:[new Paragraph("Spi")]}), new TableCell({children:[new Paragraph("Total")]})]})];
        (p.crisis?.bpss||[]).forEach((b, i) => {
            bpssRows.push(new TableRow({children:[
                new TableCell({children:[new Paragraph(`H-${i+1}`)]}),
                new TableCell({children:[new Paragraph(b.bio.toString())]}),
                new TableCell({children:[new Paragraph(b.psy.toString())]}),
                new TableCell({children:[new Paragraph(b.soc.toString())]}),
                new TableCell({children:[new Paragraph(b.spi.toString())]}),
                new TableCell({children:[new Paragraph(b.eval.toString())]})
            ]}));
        });
        children.push(new Table({width:{size:100, type:WidthType.PERCENTAGE}, rows:bpssRows}));

        const doc = new Document({sections:[{children}]});
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a); a.style="display:none"; a.href=url; a.download=`MMRC_${p.reg.name}.docx`; a.click();
    },

    // --- FUNGSI EXPORT SATU PASIEN EXCEL ---
    exportOnePatientExcel(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        if(!p) return;

        const wb = XLSX.utils.book_new();
        
        // Sheet Biodata
        const bioData = [
            { Kategori: "Nama", Data: p.reg.name },
            { Kategori: "TTL", Data: p.reg.ttl },
            { Kategori: "Diagnosa", Data: p.diagnosis.entry_diag },
            { Kategori: "Dokter", Data: p.diagnosis.dr_name }
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bioData), "Biodata");

        // Sheet Obat
        if(p.medicine?.logs) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.medicine.logs), "Obat");
        }

        // Sheet TTV
        if(p.ttv) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");
        }

        // Sheet BPSS
        if(p.crisis?.bpss) {
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.crisis.bpss), "BPSS");
        }

        XLSX.writeFile(wb, `MMRC_DATA_${p.reg.name}.xlsx`);
    },

    // UTILS LAINNYA
    async delSub(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x=>x.id===pid);
        let t = p; const parts = path.split('.');
        for(let i=0; i<parts.length-1; i++) t = t[parts[i]];
        t[parts[parts.length-1]].splice(idx,1);
        this.render(); this.saveDB();
    },
    async delPatient(pid) {
        if(!confirm('Hapus pasien permanen?')) return;
        this.data.patients = this.data.patients.filter(x=>x.id!==pid);
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
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

window.app = app;
app.init();
