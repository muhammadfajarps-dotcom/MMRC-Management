// ==========================================
// 1. KONFIGURASI FIREBASE (FIXED)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    // PERBAIKAN UTAMA: URL DATABASE SUDAH DIMASUKKAN
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ==========================================
// 2. LOGIKA APLIKASI UTAMA (APP CONTROLLER)
// ==========================================
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    currentPatientIndex: null, // Untuk melacak pasien yang sedang diedit
    signaturePad: null,

    // --- PROTEKSI STRUKTUR DATA (Agar tidak error saat load) ---
    fixDataStructure(data) {
        if (!data) return { patients: [] };
        if (!data.patients) data.patients = [];
        
        // Deep check setiap properti agar tidak undefined
        data.patients = data.patients.map(p => {
            if (!p.reg) p.reg = {};
            if (!p.program) p.program = {};
            if (!p.history) p.history = {};
            if (!p.diagnosis) p.diagnosis = {};
            if (!p.medicine) p.medicine = { stock: [], logs: [] };
            if (!p.medicine.stock) p.medicine.stock = [];
            if (!p.medicine.logs) p.medicine.logs = [];
            if (!p.files) p.files = [];
            return p;
        });
        return data;
    },

    // --- INIT & AUTH ---
    async init() {
        this.checkAuth();
        
        // Event Listeners Dasar
        document.getElementById('btn-login').onclick = () => this.login();
        document.getElementById('btn-logout').onclick = () => this.logout();
        
        // Setup Signature Pad Global (akan di-resize saat modal dibuka)
        const canvas = document.getElementById('signature-pad');
        if(canvas) {
            this.signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
        }

        // Auto Load jika sudah login
        if(localStorage.getItem('mmrc_user')) {
            await this.loadDB();
        }
    },

    checkAuth() {
        const user = localStorage.getItem('mmrc_user');
        const authLayer = document.getElementById('auth-layer');
        if(user) {
            authLayer.classList.add('hidden');
        } else {
            authLayer.classList.remove('hidden');
        }
    },

    login() {
        const u = document.getElementById('user').value;
        const p = document.getElementById('pass').value;
        if(u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_user', u);
            this.checkAuth();
            this.loadDB();
        } else {
            Swal.fire('Error', 'Username/Password Salah!', 'error');
        }
    },

    logout() {
        Swal.fire({
            title: 'Keluar?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('mmrc_user');
                location.reload();
            }
        });
    },

    // --- DATABASE OPERATIONS ---
    async loadDB() {
        try {
            console.log("Menghubungkan ke Firebase...");
            const snapshot = await db.ref('mmrc_data').once('value');
            const val = snapshot.val();
            this.data = this.fixDataStructure(val);
            console.log("Data Loaded:", this.data);
            this.render(); 
        } catch (error) {
            console.error("LOAD ERROR:", error);
            Swal.fire('Koneksi Bermasalah', 'Gagal memuat data dari server.', 'error');
        }
    },

    async saveDB() {
        try {
            await db.ref('mmrc_data').set(this.data);
            console.log("Saved to Firebase");
        } catch (e) {
            Swal.fire('Gagal Simpan', e.message, 'error');
        }
    },

    // --- NAVIGASI ---
    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`button[onclick="app.nav('${page}')"]`);
        if(activeBtn) activeBtn.classList.add('active');
        this.render();
    },

    // --- RENDERER UTAMA ---
    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = ''; 

        if (this.currentPage === 'dashboard') this.renderDashboard(container);
        else if (this.currentPage === 'input') this.renderInput(container);
        else if (this.currentPage === 'data') this.renderData(container);
    },

    // 1. HALAMAN DASHBOARD
    renderDashboard(container) {
        const p = this.data.patients || [];
        const total = p.length;
        const rj = p.filter(x => x.program?.type === 'Rawat Jalan').length;
        const ri = p.filter(x => x.program?.type === 'Rawat Inap').length;
        
        let totalObat = 0;
        p.forEach(px => {
            if(px.medicine?.stock) totalObat += px.medicine.stock.length;
        });

        const html = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold mb-2">TOTAL PASIEN</div>
                    <div class="text-4xl font-black text-slate-800">${total}</div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div class="text-emerald-400 text-xs font-bold mb-2">RAWAT JALAN</div>
                    <div class="text-4xl font-black text-emerald-600">${rj}</div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div class="text-blue-400 text-xs font-bold mb-2">RAWAT INAP</div>
                    <div class="text-4xl font-black text-blue-600">${ri}</div>
                </div>
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                    <div class="text-orange-400 text-xs font-bold mb-2">STOK OBAT AKTIF</div>
                    <div class="text-4xl font-black text-orange-600">${totalObat}</div>
                </div>
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-80">
                <h3 class="font-bold text-slate-700 mb-4">Grafik Kunjungan</h3>
                <canvas id="chartVisit"></canvas>
            </div>
        `;
        container.innerHTML = html;
        this.renderChart();
    },

    renderChart() {
        setTimeout(() => {
            const ctx = document.getElementById('chartVisit');
            if(ctx) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                        datasets: [{
                            label: 'Pasien Baru',
                            data: [12, 19, 3, 5, 2, 3],
                            borderColor: '#0d9488',
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false }
                });
            }
        }, 100);
    },

    // 2. HALAMAN INPUT DATA
    renderInput(container) {
        container.innerHTML = `
            <div class="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 max-w-4xl mx-auto">
                <h2 class="text-2xl font-black text-slate-800 mb-6">Registrasi Pasien Baru</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-2">NAMA LENGKAP</label>
                        <input type="text" id="reg-name" class="input-field" placeholder="Nama Pasien">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-2">TANGGAL LAHIR</label>
                        <input type="date" id="reg-dob" class="input-field">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-2">NO. REKAM MEDIS (RM)</label>
                        <input type="text" id="reg-rm" class="input-field" placeholder="Contoh: 001/RM/2026">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-500 mb-2">PROGRAM LAYANAN</label>
                        <select id="reg-prog" class="input-field">
                            <option value="Rawat Jalan">Rawat Jalan</option>
                            <option value="Rawat Inap">Rawat Inap</option>
                            <option value="Fisioterapi">Fisioterapi</option>
                        </select>
                    </div>
                </div>
                <div class="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    <button onclick="app.submitNewPatient()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-teal-200 transition-all">
                        <i class="fas fa-save mr-2"></i> SIMPAN DATA
                    </button>
                </div>
            </div>
        `;
    },

    async submitNewPatient() {
        const name = document.getElementById('reg-name').value;
        const dob = document.getElementById('reg-dob').value;
        const rm = document.getElementById('reg-rm').value;
        const prog = document.getElementById('reg-prog').value;

        if(!name || !rm) return Swal.fire('Perhatian', 'Nama dan No. RM wajib diisi!', 'warning');

        const newP = {
            id: Date.now().toString(),
            reg: { name, dob, rm, tgl_masuk: new Date().toISOString().split('T')[0] },
            program: { type: prog },
            history: {},
            diagnosis: {},
            medicine: { stock: [], logs: [] },
            files: []
        };

        this.data.patients.push(newP);
        await this.saveDB();
        
        Swal.fire('Berhasil', 'Data Pasien Tersimpan', 'success');
        this.nav('data');
    },

    // 3. HALAMAN LIST DATA
    renderData(container) {
        let rows = '';
        this.data.patients.forEach((p, index) => {
            rows += `
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer" onclick="app.openDetail(${index})">
                    <td class="p-4 font-bold text-slate-700">#${index+1}</td>
                    <td class="p-4">
                        <div class="font-bold text-slate-800">${p.reg?.name || 'Tanpa Nama'}</div>
                        <div class="text-xs text-slate-400">RM: ${p.reg?.rm || '-'}</div>
                    </td>
                    <td class="p-4 text-slate-500">${p.reg?.dob || '-'}</td>
                    <td class="p-4">
                        <span class="px-3 py-1 rounded-full text-xs font-bold ${p.program?.type === 'Rawat Inap' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}">
                            ${p.program?.type || 'Umum'}
                        </span>
                    </td>
                    <td class="p-4 text-right" onclick="event.stopPropagation()">
                        <button onclick="app.deletePatient(${index})" class="text-red-400 hover:text-red-600 p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button onclick="app.openDetail(${index})" class="text-teal-600 hover:text-teal-800 p-2 ml-2">
                            <i class="fas fa-edit"></i> Detail
                        </button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                <div class="p-6 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
                    <i class="fas fa-search text-slate-400"></i>
                    <input type="text" id="global-search" onkeyup="app.search()" placeholder="Cari nama atau No. RM..." class="bg-transparent w-full outline-none text-slate-600 font-medium">
                </div>
                <div class="overflow-auto flex-1">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider sticky top-0">
                            <tr>
                                <th class="p-4">No</th>
                                <th class="p-4">Pasien</th>
                                <th class="p-4">Tgl Lahir</th>
                                <th class="p-4">Program</th>
                                <th class="p-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody id="table-body">${rows || '<tr><td colspan="5" class="p-8 text-center text-slate-400">Data kosong</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('#table-body tr').forEach(row => {
            row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    async deletePatient(index) {
        if(await Swal.fire({ title: 'Hapus Data?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Hapus' }).then(r => r.isConfirmed)) {
            this.data.patients.splice(index, 1);
            await this.saveDB();
            this.render();
            Swal.fire('Terhapus', '', 'success');
        }
    },

    // ==========================================
    // 4. DETAIL PASIEN (MODAL KOMPLEKS)
    // ==========================================
    openDetail(index) {
        this.currentPatientIndex = index;
        const p = this.data.patients[index];
        const modal = document.getElementById('modal-container');
        const content = document.getElementById('modal-content');
        
        // Setup Modal Title
        document.getElementById('modal-title').innerText = `${p.reg.name} (${p.reg.rm})`;
        
        // Render Tabs Default (Identity)
        this.renderTab('identity');
        
        modal.classList.replace('hidden', 'flex');
    },

    closeModal() {
        document.getElementById('modal-container').classList.replace('flex', 'hidden');
        this.currentPatientIndex = null;
    },

    // RENDER ISI TAB (Identity, History, Diagnosis, Medicine, Files)
    renderTab(tabName) {
        const p = this.data.patients[this.currentPatientIndex];
        const container = document.getElementById('modal-content');
        
        // Update Tab UI Active State
        document.querySelectorAll('.tab-btn').forEach(btn => {
            if(btn.dataset.tab === tabName) {
                btn.classList.add('bg-teal-50', 'text-teal-700', 'border-teal-200');
                btn.classList.remove('text-slate-500', 'border-transparent');
            } else {
                btn.classList.remove('bg-teal-50', 'text-teal-700', 'border-teal-200');
                btn.classList.add('text-slate-500', 'border-transparent');
            }
        });

        // CONTENT SWITCHER
        if(tabName === 'identity') {
            container.innerHTML = `
                <div class="grid grid-cols-2 gap-4">
                    <div><label class="text-xs font-bold text-slate-400">NAMA</label><input type="text" id="edit-name" value="${p.reg.name}" class="input-field mt-1"></div>
                    <div><label class="text-xs font-bold text-slate-400">NO RM</label><input type="text" id="edit-rm" value="${p.reg.rm}" class="input-field mt-1"></div>
                    <div><label class="text-xs font-bold text-slate-400">TGL LAHIR</label><input type="date" id="edit-dob" value="${p.reg.dob}" class="input-field mt-1"></div>
                    <div><label class="text-xs font-bold text-slate-400">PROGRAM</label>
                        <select id="edit-prog" class="input-field mt-1">
                            <option value="Rawat Jalan" ${p.program.type === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                            <option value="Rawat Inap" ${p.program.type === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                        </select>
                    </div>
                </div>
                <button onclick="app.saveIdentity()" class="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg w-full font-bold">UPDATE IDENTITAS</button>
            `;
        } 
        else if (tabName === 'history') {
            container.innerHTML = `
                <textarea id="hist-text" class="input-field h-64" placeholder="Tulis riwayat medis...">${p.history?.notes || ''}</textarea>
                <button onclick="app.saveHistory()" class="mt-4 bg-teal-600 text-white px-4 py-2 rounded-lg w-full font-bold">SIMPAN RIWAYAT</button>
            `;
        }
        else if (tabName === 'diagnosis') {
            const sig = p.diagnosis?.signature || '';
            container.innerHTML = `
                <div class="mb-4">
                    <label class="text-xs font-bold text-slate-400">DIAGNOSA MEDIS</label>
                    <textarea id="diag-text" class="input-field h-32 mt-1">${p.diagnosis?.text || ''}</textarea>
                </div>
                <div class="mb-4">
                    <label class="text-xs font-bold text-slate-400">TANDA TANGAN DOKTER</label>
                    <div class="border border-slate-300 rounded-lg h-40 relative bg-white overflow-hidden">
                        ${sig ? `<img src="${sig}" class="absolute inset-0 w-full h-full object-contain">` : '<div class="text-center text-slate-300 mt-16">Belum ada TTD</div>'}
                        <canvas id="signature-pad" class="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 cursor-crosshair"></canvas>
                    </div>
                    <button onclick="app.clearSig()" class="text-xs text-red-500 mt-1">Hapus TTD</button>
                </div>
                <button onclick="app.saveDiagnosis()" class="bg-teal-600 text-white px-4 py-2 rounded-lg w-full font-bold">SIMPAN DIAGNOSA & TTD</button>
            `;
            // Re-init signature pad on this canvas
            setTimeout(() => {
                const cvs = document.getElementById('signature-pad');
                if(cvs) {
                    cvs.width = cvs.offsetWidth;
                    cvs.height = cvs.offsetHeight;
                    this.signaturePad = new SignaturePad(cvs);
                }
            }, 200);
        }
        else if (tabName === 'medicine') {
            this.renderMedicineTab(container, p);
        }
        else if (tabName === 'files') {
            let fileList = '';
            (p.files || []).forEach((f, i) => {
                fileList += `
                    <div class="flex justify-between items-center p-3 bg-slate-50 rounded-lg mb-2">
                        <a href="${f.data}" download="${f.name}" class="text-blue-600 underline text-sm truncate w-2/3">${f.name}</a>
                        <button onclick="app.deleteFile(${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                    </div>`;
            });
            container.innerHTML = `
                <div class="mb-4">
                    <input type="file" id="file-upload" class="input-field">
                    <button onclick="app.uploadFile()" class="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">Upload</button>
                </div>
                <div class="h-64 overflow-y-auto border p-2 rounded-lg">${fileList}</div>
            `;
        }
    },

    // --- LOGIC PER-TAB ---

    async saveIdentity() {
        const p = this.data.patients[this.currentPatientIndex];
        p.reg.name = document.getElementById('edit-name').value;
        p.reg.rm = document.getElementById('edit-rm').value;
        p.reg.dob = document.getElementById('edit-dob').value;
        p.program.type = document.getElementById('edit-prog').value;
        await this.saveDB();
        Swal.fire('Tersimpan', '', 'success');
        this.render(); // Update list di background
    },

    async saveHistory() {
        const p = this.data.patients[this.currentPatientIndex];
        p.history.notes = document.getElementById('hist-text').value;
        await this.saveDB();
        Swal.fire('Tersimpan', '', 'success');
    },

    async saveDiagnosis() {
        const p = this.data.patients[this.currentPatientIndex];
        p.diagnosis.text = document.getElementById('diag-text').value;
        if(!this.signaturePad.isEmpty()) {
            p.diagnosis.signature = this.signaturePad.toDataURL();
        }
        await this.saveDB();
        Swal.fire('Tersimpan', '', 'success');
        this.renderTab('diagnosis'); // Refresh view image
    },
    
    clearSig() {
        if(this.signaturePad) this.signaturePad.clear();
    },

    // --- MEDICINE LOGIC (Yang sering error di versi lama) ---
    renderMedicineTab(container, p) {
        let stockRows = '';
        (p.medicine.stock || []).forEach((m, i) => {
            stockRows += `
                <tr class="border-b">
                    <td class="p-2">${m.name}</td>
                    <td class="p-2 text-center font-bold">${m.qty}</td>
                    <td class="p-2 text-right">
                        <button onclick="app.medAction(${i}, -1)" class="bg-red-100 text-red-600 px-2 rounded">-</button>
                        <button onclick="app.medAction(${i}, 1)" class="bg-green-100 text-green-600 px-2 rounded">+</button>
                        <button onclick="app.deleteMed(${i})" class="ml-2 text-slate-400 hover:text-red-500"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        });

        container.innerHTML = `
            <div class="flex gap-2 mb-4">
                <input type="text" id="new-med-name" placeholder="Nama Obat" class="input-field w-2/3">
                <input type="number" id="new-med-qty" placeholder="Jml" class="input-field w-1/4">
                <button onclick="app.addMedicine()" class="bg-teal-600 text-white px-3 rounded-lg"><i class="fas fa-plus"></i></button>
            </div>
            <div class="h-64 overflow-y-auto border rounded-lg">
                <table class="w-full text-sm">
                    <thead class="bg-slate-100 text-xs font-bold text-slate-500">
                        <tr><td class="p-2">NAMA OBAT</td><td class="p-2 text-center">STOK</td><td class="p-2 text-right">AKSI</td></tr>
                    </thead>
                    <tbody>${stockRows}</tbody>
                </table>
            </div>
        `;
    },

    async addMedicine() {
        const name = document.getElementById('new-med-name').value;
        const qty = parseInt(document.getElementById('new-med-qty').value);
        if(!name || !qty) return;

        const p = this.data.patients[this.currentPatientIndex];
        p.medicine.stock.push({ name, qty, addedAt: new Date().toISOString() });
        
        await this.saveDB();
        this.renderTab('medicine');
    },

    async medAction(index, change) {
        const p = this.data.patients[this.currentPatientIndex];
        const med = p.medicine.stock[index];
        med.qty += change;
        
        // Log penggunaan (Opsional, tapi bagus ada)
        if(change < 0) {
            p.medicine.logs.push({
                item: med.name,
                qty: change,
                date: new Date().toISOString()
            });
        }

        if(med.qty < 0) med.qty = 0;
        await this.saveDB();
        this.renderTab('medicine');
    },

    async deleteMed(index) {
        if(!confirm('Hapus obat ini?')) return;
        const p = this.data.patients[this.currentPatientIndex];
        p.medicine.stock.splice(index, 1);
        await this.saveDB();
        this.renderTab('medicine');
    },

    // --- FILE UPLOAD LOGIC ---
    async uploadFile() {
        const input = document.getElementById('file-upload');
        if(input.files.length === 0) return;
        
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = async (e) => {
            const p = this.data.patients[this.currentPatientIndex];
            p.files.push({
                name: file.name,
                data: e.target.result, // Base64
                date: new Date().toISOString()
            });
            await this.saveDB();
            this.renderTab('files');
            Swal.fire('Upload Berhasil', '', 'success');
        };
        reader.readAsDataURL(file);
    },

    async deleteFile(index) {
        if(!confirm('Hapus file?')) return;
        const p = this.data.patients[this.currentPatientIndex];
        p.files.splice(index, 1);
        await this.saveDB();
        this.renderTab('files');
    },

    // --- EXPORT FEATURES ---
    exportAllExcel() {
        if(this.data.patients.length === 0) return Swal.fire('Info', 'Data kosong', 'info');
        
        const rows = this.data.patients.map(p => ({
            Nama: p.reg?.name,
            RM: p.reg?.rm,
            Lahir: p.reg?.dob,
            Program: p.program?.type,
            Diagnosa: p.diagnosis?.text || '-',
            Obat: (p.medicine?.stock || []).map(m => `${m.name}(${m.qty})`).join(', ')
        }));
        
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Data Pasien");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    }
};

// Start App
document.addEventListener('DOMContentLoaded', () => app.init());
