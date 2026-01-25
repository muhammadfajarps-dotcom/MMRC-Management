/**
 * MMRC SYSTEM CORE - FIXED & MATCHED
 * Menggunakan Library CDN (Cloudflare/Unpkg) yang ada di HTML
 */

// Konfigurasi Global App
const app = {
    // State Data (Simulasi Database Lokal)
    db: {
        patients: [
            { id: 1, name: "Tn. Ahmad", mr: "001-MED", room: "VIP 1" },
            { id: 2, name: "Ny. Rina", mr: "002-MED", room: "Reg 3" }
        ],
        visits: [],
        medicines: [],
        crisis: [],
        programs: [],
        ttv: []
    },
    
    // Variabel untuk menyimpan instance library
    activeChart: null,
    signaturePad: null,
    currentView: 'dashboard',

    // --- 1. INISIALISASI ---
    init: function() {
        console.log("MMRC System Loaded via Cloudflare CDNs");
        this.loadLocalData();
        this.checkSession();
    },

    loadLocalData: function() {
        // Cek apakah ada data tersimpan di browser
        const saved = localStorage.getItem('mmrc_data');
        if(saved) {
            this.db = JSON.parse(saved);
        }
    },

    saveLocal: function() {
        localStorage.setItem('mmrc_data', JSON.stringify(this.db));
    },

    // --- 2. AUTENTIKASI (Login) ---
    login: function() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;

        // Login Sederhana (Username: admin, Pass: admin)
        if(u === 'admin' && p === 'admin') {
            // Efek UI
            Swal.fire({
                icon: 'success',
                title: 'Login Berhasil',
                text: 'Memuat Dashboard...',
                timer: 1000,
                showConfirmButton: false,
                willClose: () => {
                    document.getElementById('auth-layer').classList.add('hidden');
                    document.getElementById('app-layer').classList.remove('hidden');
                    document.getElementById('app-layer').classList.add('flex'); // Fix display flex
                    this.nav('dashboard');
                }
            });
        } else {
            Swal.fire('Gagal', 'Username/Password salah! (Coba: admin/admin)', 'error');
        }
    },

    checkSession: function() {
        // Jika mau auto-login bisa diaktifkan di sini
    },

    // --- 3. NAVIGASI ---
    nav: function(page) {
        this.currentView = page;
        
        // 1. Update Judul Header
        const titleMap = {
            'dashboard': 'DASHBOARD UTAMA',
            'medicine': 'PEMBERIAN OBAT',
            'ttv': 'TTV & GDS MONITORING',
            'visit': 'VISITE DOKTER',
            'crisis': 'DATA PASIEN CRISIS',
            'program': 'PROGRAM REHABILITASI',
            'therapy': 'SESI TERAPI'
        };
        document.getElementById('page-title').innerText = titleMap[page] || 'DASHBOARD';

        // 2. Update Tombol Aktif (Sidebar)
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('btn-' + page);
        if(activeBtn) activeBtn.classList.add('active');

        // 3. Render Konten ke div #main-content
        const content = document.getElementById('main-content');
        content.innerHTML = ''; // Bersihkan konten lama

        if(page === 'dashboard') {
            this.renderDashboard(content);
        } else {
            this.renderTable(content, page);
        }
    },

    // --- 4. RENDER DASHBOARD (Chart.js) ---
    renderDashboard: function(container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Total Pasien</div>
                    <div class="text-3xl font-black text-slate-800 mt-2">${this.db.patients.length}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Visite Bulan Ini</div>
                    <div class="text-3xl font-black text-teal-600 mt-2">${this.db.visits.length}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Insiden Crisis</div>
                    <div class="text-3xl font-black text-red-500 mt-2">${this.db.crisis.length}</div>
                </div>
                 <div class="bg-white p-6 rounded-2xl shadow border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Terapi Selesai</div>
                    <div class="text-3xl font-black text-blue-500 mt-2">${this.db.programs.length}</div>
                </div>
            </div>

            <div class="bg-white p-6 rounded-2xl shadow border border-slate-100 h-96">
                <h3 class="font-bold text-slate-700 mb-4">Grafik Kesehatan Pasien (Realtime)</h3>
                <canvas id="mainChart"></canvas>
            </div>
        `;

        // Render Chart.js
        const ctx = document.getElementById('mainChart').getContext('2d');
        if(this.activeChart) this.activeChart.destroy(); // Hapus chart lama agar tidak bug

        this.activeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'],
                datasets: [{
                    label: 'Stabilitas TTV',
                    data: [120, 118, 122, 119, 120, 121],
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    // --- 5. RENDER TABEL (Generic) ---
    renderTable: function(container, type) {
        // Tentukan Kolom berdasarkan Halaman
        let columns = [];
        let keys = [];

        if(type === 'medicine') {
            columns = ['Waktu', 'Pasien', 'Nama Obat', 'Dosis'];
            keys = ['time', 'patient', 'drug', 'dose'];
        } else if (type === 'visit') {
            columns = ['Tanggal', 'Pasien', 'Dokter', 'SOAP', 'TTD'];
            keys = ['date', 'patient', 'doctor', 'soap', 'signature'];
        } else if (type === 'ttv') {
            columns = ['Waktu', 'Pasien', 'TD', 'Nadi', 'Suhu'];
            keys = ['time', 'patient', 'td', 'nadi', 'suhu'];
        } else {
            columns = ['Tanggal', 'Pasien', 'Keterangan'];
            keys = ['date', 'patient', 'desc'];
        }

        // Buat Tombol Tambah
        let html = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-800 uppercase">Data ${type}</h3>
                <button onclick="app.openModal('${type}')" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl shadow font-bold text-sm flex items-center gap-2 transition-transform active:scale-95">
                    <i class="fas fa-plus"></i> INPUT DATA
                </button>
            </div>
            
            <div class="bg-white rounded-2xl shadow border border-slate-100 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-slate-50 border-b">
                        <tr>
                            ${columns.map(c => `<th class="p-4 text-xs font-bold text-slate-500 uppercase">${c}</th>`).join('')}
                            <th class="p-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
        `;

        const data = this.db[type] || [];
        
        if(data.length === 0) {
            html += `<tr><td colspan="${columns.length + 1}" class="p-8 text-center text-slate-400">Belum ada data. Klik Input Data.</td></tr>`;
        } else {
            data.forEach((row, index) => {
                html += `<tr>`;
                keys.forEach(k => {
                    let val = row[k];
                    // Jika kolom adalah Tanda Tangan (Image Base64)
                    if(k === 'signature' && val) {
                        val = `<img src="${val}" class="h-10 border rounded bg-white">`;
                    }
                    html += `<td class="p-4 text-sm text-slate-600">${val || '-'}</td>`;
                });
                html += `
                    <td class="p-4 text-right">
                        <button onclick="app.deleteData('${type}', ${index})" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`;
            });
        }

        html += `</tbody></table></div>`;
        container.innerHTML = html;
    },

    // --- 6. MODAL SYSTEM ---
    openModal: function(type) {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        title.innerText = `FORM INPUT: ${type.toUpperCase()}`;

        // Dropdown Pasien
        const patientOpts = this.db.patients.map(p => `<option value="${p.name}">${p.name}</option>`).join('');
        
        // Generate Form Fields Sesuai Tipe
        let formFields = `
            <div class="mb-4">
                <label class="block text-sm font-bold text-slate-700 mb-1">Pilih Pasien</label>
                <select id="inp-patient" class="input-field cursor-pointer">${patientOpts}</select>
            </div>
        `;

        if(type === 'medicine') {
            formFields += `
                <div class="grid grid-cols-2 gap-4">
                    <div class="mb-4"><label class="text-sm font-bold">Nama Obat</label><input id="inp-drug" class="input-field" placeholder="Cth: Risperidone"></div>
                    <div class="mb-4"><label class="text-sm font-bold">Dosis</label><input id="inp-dose" class="input-field" placeholder="Cth: 2mg"></div>
                </div>
                <div class="mb-4"><label class="text-sm font-bold">Waktu</label><input type="time" id="inp-time" class="input-field"></div>
            `;
        } else if (type === 'visit') {
            formFields += `
                <div class="mb-4"><label class="text-sm font-bold">Nama Dokter</label><input id="inp-doctor" class="input-field"></div>
                <div class="mb-4"><label class="text-sm font-bold">Catatan (SOAP)</label><textarea id="inp-soap" class="input-field h-24"></textarea></div>
                
                <div class="mb-4">
                    <label class="text-sm font-bold block mb-2">Tanda Tangan Dokter</label>
                    <div class="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative" style="height: 180px;">
                        <canvas id="sig-pad-canvas" class="w-full h-full absolute top-0 left-0 cursor-crosshair"></canvas>
                    </div>
                    <button type="button" onclick="app.clearSig()" class="text-xs text-red-500 mt-1 font-bold">Hapus Tanda Tangan</button>
                </div>
            `;
        } else if (type === 'ttv') {
             formFields += `
                <div class="grid grid-cols-3 gap-4">
                    <div class="mb-4"><label class="text-sm font-bold">TD (mmHg)</label><input id="inp-td" class="input-field"></div>
                    <div class="mb-4"><label class="text-sm font-bold">Nadi</label><input id="inp-nadi" class="input-field"></div>
                    <div class="mb-4"><label class="text-sm font-bold">Suhu</label><input id="inp-suhu" class="input-field"></div>
                </div>
            `;
        } else {
             formFields += `<div class="mb-4"><label class="text-sm font-bold">Keterangan</label><input id="inp-desc" class="input-field"></div>`;
        }

        body.innerHTML = `
            <form onsubmit="event.preventDefault(); app.submitData('${type}')">
                ${formFields}
                <button type="submit" class="w-full bg-teal-600 text-white font-bold py-3 rounded-xl mt-4 shadow-lg hover:bg-teal-700">SIMPAN DATA</button>
            </form>
        `;

        // Inisialisasi Signature Pad jika tipe visit
        if(type === 'visit') {
            setTimeout(() => {
                const canvas = document.getElementById('sig-pad-canvas');
                // Resize agar resolusi tajam
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                
                this.signaturePad = new SignaturePad(canvas, { backgroundColor: 'transparent' });
            }, 300); // Delay sedikit agar modal muncul dulu
        }
    },

    closeModal: function() {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').classList.remove('flex');
    },

    clearSig: function() {
        if(this.signaturePad) this.signaturePad.clear();
    },

    // --- 7. SUBMIT DATA ---
    submitData: function(type) {
        const patient = document.getElementById('inp-patient').value;
        const now = new Date();
        let newData = {
            id: Date.now(),
            date: now.toLocaleDateString('id-ID'),
            time: now.toLocaleTimeString('id-ID'),
            patient: patient
        };

        // Ambil Data Sesuai Form
        if(type === 'medicine') {
            newData.drug = document.getElementById('inp-drug').value;
            newData.dose = document.getElementById('inp-dose').value;
            newData.time = document.getElementById('inp-time').value;
        } else if (type === 'visit') {
            if(this.signaturePad.isEmpty()) {
                Swal.fire('Error', 'Tanda tangan wajib diisi!', 'warning');
                return;
            }
            newData.doctor = document.getElementById('inp-doctor').value;
            newData.soap = document.getElementById('inp-soap').value;
            newData.signature = this.signaturePad.toDataURL(); // Simpan gambar ttd
        } else if (type === 'ttv') {
            newData.td = document.getElementById('inp-td').value;
            newData.nadi = document.getElementById('inp-nadi').value;
            newData.suhu = document.getElementById('inp-suhu').value;
        } else {
            newData.desc = document.getElementById('inp-desc').value;
        }

        // Simpan ke Array DB
        if(!this.db[type]) this.db[type] = [];
        this.db[type].push(newData);
        this.saveLocal();

        this.closeModal();
        this.nav(type); // Refresh halaman
        Swal.fire('Sukses', 'Data berhasil disimpan', 'success');
    },

    deleteData: function(type, index) {
        Swal.fire({
            title: 'Hapus?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus'
        }).then((res) => {
            if(res.isConfirmed) {
                this.db[type].splice(index, 1);
                this.saveLocal();
                this.nav(type);
                Swal.fire('Terhapus', '', 'success');
            }
        });
    },

    // --- 8. SEARCH & EXPORT (Fungsional) ---
    search: function() {
        const term = document.getElementById('global-search').value.toLowerCase();
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    },

    exportAllExcel: function() {
        // Menggunakan library XLSX dari HTML
        const wb = XLSX.utils.book_new();
        // Buat sheet untuk setiap kategori data
        ['visits', 'medicines', 'ttv', 'crisis'].forEach(key => {
            const ws = XLSX.utils.json_to_sheet(this.db[key]);
            XLSX.utils.book_append_sheet(wb, ws, key.toUpperCase());
        });
        XLSX.writeFile(wb, "MMRC_Full_Report.xlsx");
        Swal.fire('Download Mulai', 'File Excel sedang diunduh...', 'info');
    },

    exportToWord: function() {
        // Menggunakan library DOCX
        const { Document, Packer, Paragraph, TextRun } = docx;
        
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "LAPORAN MMRC SYSTEM", heading: "Heading1" }),
                    new Paragraph({ text: "Tanggal Export: " + new Date().toLocaleString() }),
                    new Paragraph({ text: "--- Ringkasan Data ---" }),
                    new Paragraph({ text: `Total Pasien: ${this.db.patients.length}` }),
                    new Paragraph({ text: `Total Visit Dokter: ${this.db.visits.length}` }),
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "MMRC_Report.docx";
            a.click();
            Swal.fire('Sukses', 'Laporan Word diunduh', 'success');
        });
    }
};

// Jalankan saat HTML selesai dimuat
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
