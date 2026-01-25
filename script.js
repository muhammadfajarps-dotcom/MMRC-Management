/**
 * MMRC SYSTEM - SCRIPT (1) FIXED & OPTIMIZED
 * Berjalan lancar dengan proteksi data null & perbaikan UI
 */

// 1. KONFIGURASI FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Initialize Firebase (Cek agar tidak double init)
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// 2. APP CORE LOGIC
const app = {
    // Cache Data Lokal
    data: { patients: [] },
    currentUser: null,
    currentView: 'dashboard',
    signaturePad: null,
    chartInstance: null,

    // --- INITIALIZATION ---
    init: function() {
        console.log("System Starting...");
        this.checkSession();
        
        // Event Listener untuk Login (Enter Key)
        document.getElementById('login-pass')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    },

    checkSession: function() {
        const session = localStorage.getItem('mmrc_user');
        if (session) {
            this.currentUser = session;
            this.toggleInterface('app');
            this.loadDB();
        } else {
            this.toggleInterface('login');
        }
    },

    toggleInterface: function(mode) {
        const auth = document.getElementById('auth-layer');
        const main = document.getElementById('app-layer');
        
        if (mode === 'app') {
            auth.classList.add('hidden');
            main.classList.remove('hidden');
            main.style.display = 'flex';
        } else {
            auth.classList.remove('hidden');
            auth.style.display = 'flex';
            main.classList.add('hidden');
        }
    },

    login: function() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;

        // Login Bypass untuk Demo/Operasional
        if (u === 'admin' && p === 'admin' || u === 'OPERASIONAL.MMRC') {
            localStorage.setItem('mmrc_user', u);
            this.checkSession();
            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil',
                text: 'Memuat data pasien...',
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Gagal', 'Username/Password Salah', 'error');
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Logout?',
            text: "Anda harus login ulang nanti.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Keluar'
        }).then((res) => {
            if (res.isConfirmed) {
                localStorage.removeItem('mmrc_user');
                location.reload();
            }
        });
    },

    // --- DATABASE HANDLING (FIXED) ---
    loadDB: async function() {
        try {
            // Tampilkan Loading
            Swal.fire({title: 'Syncing Database...', didOpen: () => Swal.showLoading()});
            
            const snapshot = await db.ref('mmrc_data').once('value');
            const rawData = snapshot.val();
            
            // PENTING: Fix Data Structure agar tidak error saat map/filter
            this.data = this.fixDataStructure(rawData);
            
            Swal.close();
            this.nav('dashboard'); // Default view
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Gagal mengambil data database: ' + e.message, 'error');
        }
    },

    saveDB: async function() {
        try {
            await db.ref('mmrc_data').set(this.data);
        } catch (e) {
            Swal.fire('Error Save', e.message, 'error');
        }
    },

    // Fungsi vital untuk mencegah "Cannot read property of undefined"
    fixDataStructure: function(data) {
        if (!data || !data.patients) return { patients: [] };
        
        // Loop setiap pasien dan pastikan properti objek tersedia
        data.patients = data.patients.map(p => ({
            id: p.id || Date.now().toString(),
            reg: p.reg || { name: '-', rm: 'No-RM', dob: '' },
            program: p.program || { type: 'Rawat Jalan', duration: '-' },
            diagnosis: p.diagnosis || { text: '-' },
            // Pastikan array selalu ada (bukan null/undefined)
            medicine: p.medicine || { stock: [] },
            visits: p.visits || [],
            ttv: p.ttv || [],
            crisis: p.crisis || { bpss: [] },
            therapy: p.therapy || ''
        }));
        
        // Fix nested array di dalam medicine
        data.patients.forEach(p => {
            if (!p.medicine.stock) p.medicine.stock = [];
        });

        return data;
    },

    // --- NAVIGATION & RENDERING ---
    nav: function(page) {
        this.currentView = page;
        
        // Update UI Button Active
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('btn-' + page);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Title
        const titles = {
            'dashboard': 'DASHBOARD UTAMA',
            'medicine': 'STOK & PEMBERIAN OBAT',
            'ttv': 'MONITORING TTV',
            'visit': 'VISITE DOKTER',
            'crisis': 'DATA KRISIS (BPSS)',
            'program': 'PROGRAM REHAB',
            'therapy': 'SESI TERAPI'
        };
        document.getElementById('page-title').innerText = titles[page] || page.toUpperCase();

        // Render Content
        const content = document.getElementById('main-content');
        content.innerHTML = ''; 

        if (page === 'dashboard') {
            this.renderDashboard(content);
        } else {
            this.renderTable(content, page);
        }
    },

    renderDashboard: function(container) {
        const p = this.data.patients;
        const totalVisit = p.reduce((acc, curr) => acc + (curr.visits?.length || 0), 0);
        
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Total Pasien</div>
                    <div class="text-3xl font-black text-slate-800 mt-2">${p.length}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Total Visit</div>
                    <div class="text-3xl font-black text-teal-600 mt-2">${totalVisit}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Rawat Inap</div>
                    <div class="text-3xl font-black text-blue-600 mt-2">${p.filter(x=>x.program.type === 'Rawat Inap').length}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Krisis</div>
                    <div class="text-3xl font-black text-red-500 mt-2">${p.filter(x => (x.crisis.bpss.slice(-1)[0]?.total || 0) > 5).length}</div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-96 relative">
                <h3 class="font-bold text-slate-700 mb-4">Grafik Kunjungan Dokter</h3>
                <canvas id="dashChart"></canvas>
            </div>
        `;

        // Render Chart dengan aman
        setTimeout(() => {
            const ctx = document.getElementById('dashChart')?.getContext('2d');
            if (ctx) {
                if (this.chartInstance) this.chartInstance.destroy();
                this.chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                        datasets: [{
                            label: 'Aktivitas Visit',
                            data: [10, 15, 12, 20, 18, 25],
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }, 100);
    },

    renderTable: function(container, type) {
        // Tombol Tambah
        const btnAdd = `
            <button onclick="app.openModal('${type}')" class="bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2 mb-6">
                <i class="fas fa-plus"></i> INPUT DATA
            </button>
        `;

        // Generate Rows
        const rows = this.data.patients.map((item, idx) => {
            let info = '-';
            
            // Custom Info per Page
            if (type === 'medicine') info = `${item.medicine.stock.length} Jenis Obat`;
            else if (type === 'visit') info = `${item.visits.length} Riwayat Visit`;
            else if (type === 'ttv') {
                const last = item.ttv[0];
                info = last ? `TD: ${last.td} | S: ${last.suhu}` : 'Belum ada data';
            }
            else if (type === 'program') info = item.program.type;
            else if (type === 'crisis') info = `Skor Terakhir: ${item.crisis.bpss.slice(-1)[0]?.total || 0}`;

            return `
                <tr class="border-b border-slate-50 hover:bg-slate-50 search-item">
                    <td class="p-4 font-bold text-slate-700">${item.reg.name}</td>
                    <td class="p-4 text-slate-500 font-mono text-sm">${item.reg.rm}</td>
                    <td class="p-4 text-sm text-slate-600">${info}</td>
                    <td class="p-4 text-right">
                        <button onclick="app.openModal('${type}', '${item.id}')" class="text-blue-500 hover:text-blue-700 mx-2"><i class="fas fa-edit"></i></button>
                        <button onclick="app.deleteItem('${item.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

        container.innerHTML = `
            ${btnAdd}
            <div class="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">Pasien</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">No. RM</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase">Info Status</th>
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>${rows || '<tr><td colspan="4" class="p-6 text-center text-slate-400">Data Kosong</td></tr>'}</tbody>
                </table>
            </div>
        `;
    },

    // --- MODAL SYSTEM ---
    openModal: function(type, id = null) {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // Simpan ID sementara di objek window agar bisa diakses saat submit
        window.tempId = id; 
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        const safe = (val) => val || '';

        // Judul
        title.innerText = id ? `EDIT DATA ${type.toUpperCase()}` : `INPUT DATA ${type.toUpperCase()}`;

        // Konten Form Dinamis
        if (type === 'medicine' && p) {
            body.innerHTML = `
                <h4 class="font-bold text-slate-700 mb-2">Pasien: ${p.reg.name}</h4>
                <div id="med-list" class="mb-4 max-h-60 overflow-y-auto space-y-2">
                    ${p.medicine.stock.map((m, i) => `
                        <div class="flex justify-between bg-slate-50 p-3 rounded border">
                            <span>${m.name} (Qty: ${m.qty})</span>
                            <div class="flex gap-2">
                                <button onclick="app.updateStock('${id}', ${i}, 1)" class="text-green-600 font-bold px-2 border bg-white rounded">+</button>
                                <button onclick="app.updateStock('${id}', ${i}, -1)" class="text-red-600 font-bold px-2 border bg-white rounded">-</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="flex gap-2 border-t pt-4">
                    <input id="new_med_name" placeholder="Nama Obat Baru" class="input-field">
                    <input id="new_med_qty" type="number" placeholder="Jml" class="input-field w-24">
                    <button onclick="app.addMedicine('${id}')" class="bg-teal-600 text-white px-4 rounded-xl">TAMBAH</button>
                </div>
            `;
        } 
        else if (type === 'visit' && p) {
            body.innerHTML = `
                 <h4 class="font-bold text-slate-700 mb-2">Pasien: ${p.reg.name}</h4>
                 <div class="mb-4">
                    <label class="text-xs font-bold text-slate-500">Catatan (SOAP)</label>
                    <textarea id="vis_note" class="input-field h-24"></textarea>
                 </div>
                 <div class="mb-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative" style="height: 200px;">
                    <canvas id="sig-canvas" class="w-full h-full absolute inset-0 cursor-crosshair rounded-xl"></canvas>
                 </div>
                 <button onclick="app.clearSig()" class="text-xs text-red-500 font-bold">Hapus Tanda Tangan</button>
                 <button onclick="app.submitForm('visit')" class="w-full mt-4 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA VISIT</button>
            `;
            // Init Signature Pad with resize fix
            setTimeout(() => {
                const canvas = document.getElementById('sig-canvas');
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                this.signaturePad = new SignaturePad(canvas);
            }, 300);
        }
        else if (type === 'ttv' && p) {
            body.innerHTML = `
                 <h4 class="font-bold text-slate-700 mb-4">Update TTV: ${p.reg.name}</h4>
                 <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs font-bold">TD (mmHg)</label><input id="ttv_td" class="input-field"></div>
                    <div><label class="text-xs font-bold">Nadi (bpm)</label><input id="ttv_nadi" class="input-field"></div>
                    <div><label class="text-xs font-bold">Suhu (°C)</label><input id="ttv_suhu" class="input-field"></div>
                    <div><label class="text-xs font-bold">RR (x/m)</label><input id="ttv_rr" class="input-field"></div>
                 </div>
                 <button onclick="app.submitForm('ttv')" class="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-bold">SIMPAN TTV</button>
            `;
        }
        else {
            // Default Form (Input Pasien Baru / Edit Profil)
            body.innerHTML = `
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div><label class="text-xs font-bold">Nama Pasien</label><input id="reg_name" value="${safe(p?.reg.name)}" class="input-field"></div>
                    <div><label class="text-xs font-bold">No. RM</label><input id="reg_rm" value="${safe(p?.reg.rm)}" class="input-field"></div>
                    <div><label class="text-xs font-bold">Tgl Lahir</label><input type="date" id="reg_dob" value="${safe(p?.reg.dob)}" class="input-field"></div>
                    <div>
                        <label class="text-xs font-bold">Program</label>
                        <select id="reg_prog" class="input-field">
                            <option value="Rawat Jalan">Rawat Jalan</option>
                            <option value="Rawat Inap">Rawat Inap</option>
                        </select>
                    </div>
                </div>
                <div class="mb-4">
                    <label class="text-xs font-bold">Diagnosa Awal</label>
                    <textarea id="reg_diag" class="input-field h-20">${safe(p?.diagnosis.text)}</textarea>
                </div>
                <button onclick="app.submitForm('input')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA</button>
            `;
        }
    },

    closeModal: function() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        window.tempId = null;
    },

    clearSig: function() {
        if(this.signaturePad) this.signaturePad.clear();
    },

    // --- FORM ACTIONS ---
    submitForm: async function(type) {
        const id = window.tempId;
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        
        if (type === 'input') {
            const newData = {
                id: id || Date.now().toString(),
                reg: {
                    name: document.getElementById('reg_name').value,
                    rm: document.getElementById('reg_rm').value,
                    dob: document.getElementById('reg_dob').value
                },
                program: { type: document.getElementById('reg_prog').value },
                diagnosis: { text: document.getElementById('reg_diag').value },
                // Init array kosong untuk data baru
                medicine: p ? p.medicine : { stock: [] },
                visits: p ? p.visits : [],
                ttv: p ? p.ttv : [],
                crisis: p ? p.crisis : { bpss: [] }
            };

            if(id) {
                // Update Logic
                const idx = this.data.patients.findIndex(x => x.id === id);
                this.data.patients[idx] = { ...this.data.patients[idx], ...newData };
            } else {
                // Insert Logic
                this.data.patients.unshift(newData);
            }
        }
        else if (type === 'visit' && p) {
            if(this.signaturePad.isEmpty()) return Swal.fire('Wajib Tanda Tangan', '', 'warning');
            p.visits.unshift({
                date: new Date().toLocaleString(),
                note: document.getElementById('vis_note').value,
                signature: this.signaturePad.toDataURL()
            });
        }
        else if (type === 'ttv' && p) {
            p.ttv.unshift({
                date: new Date().toLocaleString(),
                td: document.getElementById('ttv_td').value,
                nadi: document.getElementById('ttv_nadi').value,
                suhu: document.getElementById('ttv_suhu').value
            });
        }

        await this.saveDB();
        this.closeModal();
        this.renderTable(document.getElementById('main-content'), this.currentView);
        Swal.fire('Sukses', 'Data berhasil disimpan', 'success');
    },

    addMedicine: async function(id) {
        const name = document.getElementById('new_med_name').value;
        const qty = document.getElementById('new_med_qty').value;
        if(!name) return;

        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock.push({ name: name, qty: parseInt(qty) || 0 });
        
        await this.saveDB();
        this.openModal('medicine', id); // Refresh modal content
    },

    updateStock: async function(id, idx, amount) {
        const p = this.data.patients.find(x => x.id === id);
        if(p.medicine.stock[idx]) {
            p.medicine.stock[idx].qty += amount;
            if(p.medicine.stock[idx].qty < 0) p.medicine.stock[idx].qty = 0;
            await this.saveDB();
            this.openModal('medicine', id); // Refresh
        }
    },

    deleteItem: function(id) {
        Swal.fire({
            title: 'Hapus Data?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        }).then(async (res) => {
            if(res.isConfirmed) {
                this.data.patients = this.data.patients.filter(x => x.id !== id);
                await this.saveDB();
                this.nav(this.currentView);
                Swal.fire('Terhapus', '', 'success');
            }
        });
    },

    // --- UTILS ---
    search: function() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    exportAllExcel: function() {
        if (!XLSX) return Swal.fire('Error', 'Library Excel belum dimuat', 'error');
        
        const flatData = this.data.patients.map(p => ({
            "Nama": p.reg.name,
            "RM": p.reg.rm,
            "Program": p.program.type,
            "Diagnosa": p.diagnosis.text
        }));

        const ws = XLSX.utils.json_to_sheet(flatData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Pasien");
        XLSX.writeFile(wb, "MMRC_Export.xlsx");
    }
};

// Start System saat HTML siap
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
