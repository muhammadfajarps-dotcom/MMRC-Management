/**
 * MMRC Management System - Core Logic
 * Professional Rehabilitation Standard
 */

const app = {
    // State Management
    currentUser: null,
    currentView: 'dashboard',
    signaturePad: null,
    db: {
        patients: [],
        medicines: [],
        ttv: [],
        visits: [],
        crisis: [],
        programs: [],
        therapies: []
    },

    // --- INITIALIZATION ---
    init: function() {
        this.loadData();
        this.checkAuth();
        console.log("MMRC System Initialized");
    },

    loadData: function() {
        const stored = localStorage.getItem('mmrc_db');
        if (stored) {
            this.db = JSON.parse(stored);
        } else {
            // Seed Dummy Data for Demo
            this.db.patients = [
                { id: 1, name: "Budi Santoso", mr: "RM-001", room: "VIP A" },
                { id: 2, name: "Siti Aminah", mr: "RM-002", room: "Regular 1" }
            ];
            this.saveDataLocally();
        }
    },

    saveDataLocally: function() {
        localStorage.setItem('mmrc_db', JSON.stringify(this.db));
    },

    // --- AUTHENTICATION ---
    login: function() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        // Hardcoded login for demo purpose
        if (user === 'OPERASIONAL.MMRC' && pass === 'MADANI1999') {
            this.currentUser = user;
            
            // Animation out
            const authLayer = document.getElementById('auth-layer');
            authLayer.style.opacity = '0';
            authLayer.style.transition = 'opacity 0.5s';
            
            setTimeout(() => {
                authLayer.classList.add('hidden');
                document.getElementById('app-layer').classList.remove('hidden');
                this.nav('dashboard');
                
                Swal.fire({
                    icon: 'success',
                    title: 'Login Berhasil',
                    text: 'Selamat datang di Sistem MMRC',
                    timer: 1500,
                    showConfirmButton: false
                });
            }, 500);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Akses Ditolak',
                text: 'Username atau Password salah!'
            });
        }
    },

    checkAuth: function() {
        // Session persistence check could go here
    },

    // --- NAVIGATION ---
    nav: function(viewName) {
        this.currentView = viewName;
        
        // Update Active Button State
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${viewName}`);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Header Title
        document.getElementById('page-title').innerText = viewName.replace('_', ' ').toUpperCase();

        // Render Content
        const contentDiv = document.getElementById('main-content');
        contentDiv.innerHTML = ''; // Clear content

        switch(viewName) {
            case 'dashboard':
                this.renderDashboard(contentDiv);
                break;
            case 'medicine':
                this.renderGenericTable(contentDiv, 'medicines', ['Tanggal', 'Pasien', 'Obat', 'Dosis', 'Waktu'], ['date', 'patient', 'drug', 'dose', 'time']);
                break;
            case 'ttv':
                this.renderGenericTable(contentDiv, 'ttv', ['Tanggal', 'Pasien', 'TD', 'Nadi', 'Suhu', 'SpO2'], ['date', 'patient', 'bp', 'hr', 'temp', 'spo2']);
                break;
            case 'visit':
                this.renderGenericTable(contentDiv, 'visits', ['Tanggal', 'Pasien', 'Dokter', 'Catatan', 'Tanda Tangan'], ['date', 'patient', 'doctor', 'notes', 'signature_img']);
                break;
            case 'crisis':
                this.renderGenericTable(contentDiv, 'crisis', ['Waktu', 'Pasien', 'Jenis Insiden', 'Penanganan'], ['datetime', 'patient', 'type', 'action']);
                break;
            case 'program':
                this.renderGenericTable(contentDiv, 'programs', ['Minggu', 'Pasien', 'Fokus Program', 'Status'], ['week', 'patient', 'focus', 'status']);
                break;
            case 'therapy':
                this.renderGenericTable(contentDiv, 'therapies', ['Sesi', 'Pasien', 'Jenis Terapi', 'Evaluasi'], ['session', 'patient', 'type', 'evaluation']);
                break;
        }
    },

    // --- RENDERING MODULES ---
    
    renderDashboard: function(container) {
        // Statistics Cards
        const totalPatients = this.db.patients.length;
        const totalVisits = this.db.visits.length;
        
        const html = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Total Pasien</div>
                    <div class="text-3xl font-black text-slate-800 mt-2">${totalPatients}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Visit Dokter</div>
                    <div class="text-3xl font-black text-teal-600 mt-2">${totalVisits}</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Kepatuhan Obat</div>
                    <div class="text-3xl font-black text-blue-600 mt-2">98%</div>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div class="text-slate-400 text-xs font-bold uppercase">Insiden Crisis</div>
                    <div class="text-3xl font-black text-red-500 mt-2">${this.db.crisis.length}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-700 mb-4">Statistik Kesehatan Mingguan</h3>
                    <canvas id="chartHealth"></canvas>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 class="font-bold text-slate-700 mb-4">Sebaran Diagnosis</h3>
                    <canvas id="chartDiagnosis"></canvas>
                </div>
            </div>
        `;
        container.innerHTML = html;

        // Render Charts (Mock Data)
        setTimeout(() => {
            new Chart(document.getElementById('chartHealth'), {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Rata-rata TTV Stabil',
                        data: [85, 88, 87, 90, 92, 91, 94],
                        borderColor: '#0d9488',
                        tension: 0.4
                    }]
                }
            });

            new Chart(document.getElementById('chartDiagnosis'), {
                type: 'doughnut',
                data: {
                    labels: ['Schizophrenia', 'Bipolar', 'Depression', 'Anxiety', 'Addiction'],
                    datasets: [{
                        data: [30, 20, 25, 15, 10],
                        backgroundColor: ['#0d9488', '#2dd4bf', '#99f6e4', '#ccfbf1', '#f0fdfa']
                    }]
                }
            });
        }, 100);
    },

    renderGenericTable: function(container, collectionName, headers, keys) {
        // Header with Add Button
        const headerHtml = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold text-slate-800">Data ${this.currentView.toUpperCase()}</h3>
                <button onclick="app.openModal('${collectionName}')" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl shadow-lg font-bold text-sm transition-all flex items-center gap-2">
                    <i class="fas fa-plus"></i> TAMBAH DATA
                </button>
            </div>
        `;

        // Table
        let tableRows = '';
        const data = this.db[collectionName];

        if (data.length === 0) {
            tableRows = `<tr><td colspan="${headers.length + 1}" class="text-center py-8 text-slate-400">Belum ada data tersedia.</td></tr>`;
        } else {
            data.forEach((item, index) => {
                let cells = '';
                keys.forEach(key => {
                    let val = item[key] || '-';
                    // Special render for signature/image
                    if(key === 'signature_img' && val !== '-') {
                        val = `<img src="${val}" class="h-8 border rounded bg-white">`;
                    }
                    cells += `<td class="p-4 text-sm text-slate-600">${val}</td>`;
                });
                
                tableRows += `
                    <tr class="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                        ${cells}
                        <td class="p-4 text-right">
                            <button onclick="app.deleteItem('${collectionName}', ${index})" class="text-red-400 hover:text-red-600">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        const tableHtml = `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200">
                                ${headers.map(h => `<th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">${h}</th>`).join('')}
                                <th class="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${tableRows}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        container.innerHTML = headerHtml + tableHtml;
    },

    // --- MODAL & FORMS ---
    openModal: function(type) {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        title.innerText = `INPUT DATA: ${type.toUpperCase()}`;

        // Generate Form Fields
        let fields = '';
        const patientOptions = this.db.patients.map(p => `<option value="${p.name}">${p.name} (${p.mr})</option>`).join('');
        const patientSelect = `
            <div class="mb-4">
                <label class="block text-sm font-bold text-slate-700 mb-2">Nama Pasien</label>
                <select id="input-patient" class="input-field">
                    ${patientOptions}
                </select>
            </div>
        `;

        // Determine fields based on type
        if (type === 'medicines') {
            fields = `
                ${patientSelect}
                <div class="grid grid-cols-2 gap-4">
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Nama Obat</label>
                        <input type="text" id="input-drug" class="input-field" placeholder="Contoh: Risperidone">
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-bold text-slate-700 mb-2">Dosis</label>
                        <input type="text" id="input-dose" class="input-field" placeholder="Contoh: 2mg">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Waktu Pemberian</label>
                    <input type="datetime-local" id="input-time" class="input-field">
                </div>
            `;
        } else if (type === 'visits') {
            fields = `
                ${patientSelect}
                <div class="mb-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Nama Dokter</label>
                    <input type="text" id="input-doctor" class="input-field" placeholder="Dr. SpKJ">
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Catatan Perkembangan (CPPT)</label>
                    <textarea id="input-notes" class="input-field h-32" placeholder="SOAP..."></textarea>
                </div>
                <div class="mb-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Tanda Tangan Dokter</label>
                    <div class="border rounded-xl bg-slate-50" style="height: 200px;">
                        <canvas id="sig-canvas" class="w-full h-full rounded-xl"></canvas>
                    </div>
                    <button type="button" onclick="app.clearSignature()" class="text-xs text-red-500 mt-2 font-bold">Hapus Tanda Tangan</button>
                </div>
            `;
        } else if (type === 'ttv') {
             fields = `
                ${patientSelect}
                <div class="grid grid-cols-2 gap-4">
                    <div class="mb-4"><label class="text-sm font-bold">Tekanan Darah (mmHg)</label><input id="input-bp" class="input-field" placeholder="120/80"></div>
                    <div class="mb-4"><label class="text-sm font-bold">Nadi (bpm)</label><input id="input-hr" class="input-field" placeholder="80"></div>
                    <div class="mb-4"><label class="text-sm font-bold">Suhu (°C)</label><input id="input-temp" class="input-field" placeholder="36.5"></div>
                    <div class="mb-4"><label class="text-sm font-bold">SpO2 (%)</label><input id="input-spo2" class="input-field" placeholder="98"></div>
                </div>
            `;
        }
        // Add other types similarly...
        else {
             fields = `
                ${patientSelect}
                <div class="mb-4">
                    <label class="block text-sm font-bold text-slate-700 mb-2">Deskripsi / Detail</label>
                    <textarea id="input-desc" class="input-field" placeholder="Detail data..."></textarea>
                </div>
            `;
        }

        body.innerHTML = `
            <form onsubmit="event.preventDefault(); app.saveData('${type}')">
                ${fields}
                <div class="mt-8 pt-4 border-t flex justify-end gap-3">
                    <button type="button" onclick="app.closeModal()" class="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100">Batal</button>
                    <button type="submit" class="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-teal-700 shadow-lg">SIMPAN DATA</button>
                </div>
            </form>
        `;

        // Init Signature Pad if needed
        if (type === 'visits') {
            setTimeout(() => {
                const canvas = document.getElementById('sig-canvas');
                // Resize canvas for high DPI
                const ratio =  Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                
                this.signaturePad = new SignaturePad(canvas, {
                    backgroundColor: 'rgba(255, 255, 255, 0)'
                });
            }, 100);
        }
    },

    closeModal: function() {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').classList.remove('flex');
    },

    clearSignature: function() {
        if(this.signaturePad) this.signaturePad.clear();
    },

    // --- DATA HANDLING ---
    saveData: function(collection) {
        const newData = {
            id: Date.now(),
            date: new Date().toLocaleDateString('id-ID'),
            datetime: new Date().toLocaleString('id-ID'),
            patient: document.getElementById('input-patient') ? document.getElementById('input-patient').value : 'Unknown'
        };

        // Capture specific fields
        if(collection === 'medicines') {
            newData.drug = document.getElementById('input-drug').value;
            newData.dose = document.getElementById('input-dose').value;
            newData.time = document.getElementById('input-time').value;
        } else if (collection === 'visits') {
            newData.doctor = document.getElementById('input-doctor').value;
            newData.notes = document.getElementById('input-notes').value;
            if(!this.signaturePad.isEmpty()) {
                newData.signature_img = this.signaturePad.toDataURL();
            } else {
                Swal.fire('Error', 'Tanda tangan wajib diisi', 'warning');
                return;
            }
        } else if (collection === 'ttv') {
            newData.bp = document.getElementById('input-bp').value;
            newData.hr = document.getElementById('input-hr').value;
            newData.temp = document.getElementById('input-temp').value;
            newData.spo2 = document.getElementById('input-spo2').value;
        }

        // Add to Local DB
        this.db[collection].push(newData);
        this.saveDataLocally();

        // UI Feedback
        this.closeModal();
        this.nav(this.currentView); // Refresh view
        Swal.fire({
            icon: 'success',
            title: 'Tersimpan',
            text: 'Data berhasil ditambahkan ke database',
            timer: 1500,
            showConfirmButton: false
        });
    },

    deleteItem: function(collection, index) {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data yang dihapus tidak bisa dikembalikan",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus'
        }).then((result) => {
            if (result.isConfirmed) {
                this.db[collection].splice(index, 1);
                this.saveDataLocally();
                this.nav(this.currentView);
                Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
            }
        });
    },

    search: function() {
        const query = document.getElementById('global-search').value.toLowerCase();
        // Simple search filter logic implementation depends on requirement
        // For now, this is a placeholder for filtering the displayed table
        const rows = document.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    // --- EXPORTS ---
    exportAllExcel: function() {
        const wb = XLSX.utils.book_new();
        
        // Add sheets
        for (const [key, data] of Object.entries(this.db)) {
            if(Array.isArray(data) && data.length > 0) {
                // Filter out large images from excel for performance
                const cleanData = data.map(item => {
                    const copy = {...item};
                    if(copy.signature_img) copy.signature_img = "[Signature Image]";
                    return copy;
                });
                const ws = XLSX.utils.json_to_sheet(cleanData);
                XLSX.utils.book_append_sheet(wb, ws, key.toUpperCase());
            }
        }

        XLSX.writeFile(wb, "MMRC_Full_Report.xlsx");
        Swal.fire('Success', 'Laporan Excel berhasil diunduh', 'success');
    },

    exportToWord: function() {
        // Simple DOCX export using 'docx' library
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx;

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: "Laporan Medis MMRC",
                        heading: HeadingLevel.HEADING_1,
                    }),
                    new Paragraph({
                        text: `Diekspor pada: ${new Date().toLocaleString('id-ID')}`,
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: "Ringkasan data pasien dan aktivitas harian...",
                        spacing: { after: 400 }
                    }),
                    // Add more dynamic content here based on this.db
                ],
            }],
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "MMRC_Report.docx";
            a.click();
            window.URL.revokeObjectURL(url);
            Swal.fire('Success', 'Laporan Word berhasil diunduh', 'success');
        });
    }
};

// Start the App
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
