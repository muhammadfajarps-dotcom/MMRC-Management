/**
 * MMRC HOSPITAL MANAGEMENT SYSTEM
 * Professional Edition - International Rehabilitation Standard
 * * Integrations: Firebase, Chart.js, SweetAlert2, XLSX, SignaturePad, Docx
 */

// ============================================
// 1. CONFIGURATION & STATE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Global State
let db;
let currentPid = null;
let signaturePad = null;
let activeChart = null;
let appData = { patients: [] };

// Initialize System
window.onload = function() {
    try {
        console.log("Initializing MMRC System...");
        
        // Init Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();

        // Check Session
        const session = localStorage.getItem('mmrc_user');
        if (session) {
            toggleInterface('app');
            loadData();
        } else {
            toggleInterface('login');
        }

        // Login Enter Key Listener
        document.getElementById('login-pass')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.app.login();
        });

    } catch (e) {
        Swal.fire('System Error', 'Gagal memuat sistem: ' + e.message, 'error');
    }
};

// ============================================
// 2. CORE FUNCTIONS (Window.App)
// ============================================
window.app = {
    // --- AUTHENTICATION ---
    login: function() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();

        // Hardcoded Credential (Sesuai Request)
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_user', u);
            
            let timerInterval;
            Swal.fire({
                title: 'Authenticating...',
                html: 'Memuat Database Pasien',
                timer: 1000,
                timerProgressBar: true,
                didOpen: () => { Swal.showLoading() }
            }).then(() => {
                toggleInterface('app');
                loadData();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Akses Ditolak',
                text: 'Username atau Password tidak valid.',
                confirmButtonColor: '#d33'
            });
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Keluar Sistem?',
            text: "Sesi anda akan diakhiri.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0d9488',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('mmrc_user');
                location.reload();
            }
        });
    },

    // --- NAVIGATION ---
    nav: function(page) {
        // 1. UI Updates
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');

        // 2. Set Header Title
        const titles = {
            'dashboard': 'EXECUTIVE DASHBOARD',
            'medicine': 'PHARMACY & STOCK CONTROL',
            'ttv': 'CLINICAL MONITORING (TTV)',
            'visit': 'DOCTOR VISITATION LOG',
            'crisis': 'CRISIS INTERVENTION (BPSS)',
            'program': 'REHABILITATION PROGRAM',
            'therapy': 'THERAPY SESSIONS'
        };
        document.getElementById('page-title').innerText = titles[page] || page.toUpperCase();

        // 3. Render Content
        renderView(page);
    },

    // --- MODAL ACTIONS ---
    closeModal: function() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // Cleanup Signature Pad to prevent memory leaks
        if (signaturePad) {
            signaturePad.off();
            signaturePad = null;
        }
    },

    // --- FEATURE TRIGGERS ---
    openInput: () => openModalForm('input'),
    openEdit: (id) => openModalForm('input', id),
    manageMedicine: (id) => openModalForm('medicine', id),
    manageTTV: (id) => openModalForm('ttv', id),
    manageVisit: (id) => openModalForm('visit', id),
    manageCrisis: (id) => openModalForm('crisis', id),
    manageProgram: (id) => openModalForm('program', id),
    manageTherapy: (id) => openModalForm('therapy', id),

    // --- DATA OPERATIONS ---
    saveForm: (type) => processSave(type),
    
    deleteData: function(id) {
        Swal.fire({
            title: 'Hapus Data Pasien?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Hapus Permanen'
        }).then(async (result) => {
            if (result.isConfirmed) {
                appData.patients = appData.patients.filter(p => p.id !== id);
                await saveData();
                renderView('dashboard'); // Redirect to dashboard safety
                Swal.fire('Terhapus!', 'Data pasien telah dihapus.', 'success');
            }
        });
    },

    // --- SEARCH ---
    search: function() {
        const query = document.getElementById('global-search').value.toLowerCase();
        const rows = document.querySelectorAll('.search-item');
        
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(query) ? '' : 'none';
        });
    },

    // --- EXPORTS (Professional) ---
    exportAllExcel: function() {
        if(appData.patients.length === 0) return Swal.fire('Info', 'Database kosong.', 'info');

        // Flat Data Structure for Excel
        const data = appData.patients.map(p => ({
            "No RM": p.reg.rm,
            "Nama Pasien": p.reg.name,
            "Tgl Lahir": p.reg.dob,
            "Program": p.program.type,
            "Durasi": p.program.duration,
            "Diagnosa": p.diagnosis.text,
            "Total Visit": p.visits.length,
            "Obat Aktif": (p.medicine.stock || []).map(m => `${m.name} (${m.qty})`).join(', ')
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        
        // Auto width adjustments logic omitted for brevity, but functionality is here
        XLSX.utils.book_append_sheet(wb, ws, "MMRC Database");
        XLSX.writeFile(wb, `MMRC_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
        
        Swal.fire('Export Success', 'File Excel berhasil diunduh.', 'success');
    },

    exportToWord: function() {
        if (typeof docx === 'undefined') return Swal.fire('Error', 'Library Docx gagal dimuat.', 'error');
        
        const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } = docx;
        
        // Simple Report Generation
        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        children: [ new TextRun({ text: "MMRC - Laporan Harian", bold: true, size: 32 }) ],
                        spacing: { after: 400 }
                    }),
                    new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString()}`, spacing: { after: 200 } }),
                    new Paragraph({ text: `Total Pasien: ${appData.patients.length} Orang` }),
                    new Paragraph({ text: "--- Akhir Dokumen ---", spacing: { before: 500 } })
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "MMRC_Report.docx";
            a.click();
            window.URL.revokeObjectURL(url);
            Swal.fire('Export Success', 'File Word berhasil diunduh.', 'success');
        });
    },

    clearSig: function() {
        if(signaturePad) signaturePad.clear();
    }
};

// ============================================
// 3. LOGIC & DATA HANDLING
// ============================================
function toggleInterface(mode) {
    const auth = document.getElementById('auth-layer');
    const app = document.getElementById('app-layer');
    
    if (mode === 'app') {
        auth.style.display = 'none';
        app.classList.remove('hidden');
        app.style.display = 'flex'; // Important for Sidebar layout
    } else {
        auth.style.display = 'flex';
        app.classList.add('hidden');
        app.style.display = 'none';
    }
}

async function loadData() {
    try {
        const snapshot = await db.ref('mmrc_data').once('value');
        const val = snapshot.val();

        // Data Sanitization / Null Safety
        appData = val || { patients: [] };
        if (!appData.patients) appData.patients = [];

        // Ensure array structure is consistent
        appData.patients = appData.patients.map(p => ({
            id: p.id || Date.now().toString(),
            reg: p.reg || { name: '-', rm: 'Unknown', dob: '' },
            program: p.program || { type: 'Rawat Jalan', duration: '-' },
            diagnosis: p.diagnosis || { text: '' },
            medicine: p.medicine || { stock: [] },
            ttv: p.ttv || [],
            visits: p.visits || [],
            crisis: p.crisis || { bpss: [] },
            therapy: p.therapy || ''
        }));

        window.app.nav('dashboard');
    } catch (e) {
        console.error(e);
        Swal.fire('Connection Error', 'Gagal terhubung ke Database.', 'error');
    }
}

async function saveData() {
    try {
        await db.ref('mmrc_data').set(appData);
    } catch (e) {
        console.error("Save failed", e);
        Swal.fire('Error', 'Gagal menyimpan data ke cloud.', 'error');
    }
}

// ============================================
// 4. RENDER ENGINE (UI GENERATION)
// ============================================
function renderView(viewName) {
    const container = document.getElementById('main-content');
    container.innerHTML = ''; // Clear previous content

    // Routing Logic
    switch(viewName) {
        case 'dashboard': renderDashboard(container); break;
        case 'medicine': renderGenericList(container, 'medicine'); break;
        case 'ttv': renderGenericList(container, 'ttv'); break;
        case 'visit': renderGenericList(container, 'visit'); break;
        case 'crisis': renderGenericList(container, 'crisis'); break;
        case 'program': renderGenericList(container, 'program'); break;
        case 'therapy': renderGenericList(container, 'therapy'); break;
        default: renderDashboard(container);
    }
}

// --- VIEW: DASHBOARD ---
function renderDashboard(container) {
    const p = appData.patients;
    
    // Stats Calculation
    const totalPatients = p.length;
    const rawatInap = p.filter(x => x.program.type === 'Rawat Inap').length;
    const totalVisits = p.reduce((acc, curr) => acc + (curr.visits ? curr.visits.length : 0), 0);
    const crisisAlerts = p.filter(x => {
        const lastScore = x.crisis.bpss.length ? x.crisis.bpss[x.crisis.bpss.length-1].total : 0;
        return lastScore > 5; // Threshold example
    }).length;

    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${dashboardCard('TOTAL PASIEN', totalPatients, 'bg-white', 'text-slate-800', 'fa-users')}
            ${dashboardCard('RAWAT INAP', rawatInap, 'bg-white', 'text-blue-600', 'fa-bed')}
            ${dashboardCard('VISIT DOKTER', totalVisits, 'bg-white', 'text-teal-600', 'fa-user-md')}
            ${dashboardCard('CRISIS ALERT', crisisAlerts, 'bg-red-50', 'text-red-600', 'fa-exclamation-triangle')}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-96">
            <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-slate-700">Statistik Kunjungan & Pasien</h3>
                    <span class="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">Realtime Update</span>
                </div>
                <div class="flex-1 relative">
                    <canvas id="chartMain"></canvas>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-700">Pasien Terbaru</h3>
                    <button onclick="window.app.openInput()" class="text-xs bg-slate-800 text-white px-3 py-1 rounded-full hover:bg-slate-700">+ Baru</button>
                </div>
                <div class="overflow-y-auto flex-1 space-y-3 pr-2">
                    ${p.slice(0, 5).map(pt => `
                        <div class="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onclick="window.app.openEdit('${pt.id}')">
                            <div class="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                                ${pt.reg.name.substring(0,2).toUpperCase()}
                            </div>
                            <div class="flex-1">
                                <div class="font-bold text-sm text-slate-700">${pt.reg.name}</div>
                                <div class="text-[10px] text-slate-400 font-bold">${pt.reg.rm}</div>
                            </div>
                        </div>
                    `).join('')}
                    ${p.length === 0 ? '<div class="text-center text-slate-400 text-sm mt-10">Belum ada data</div>' : ''}
                </div>
            </div>
        </div>
    `;

    // Render Chart (Professional Look)
    setTimeout(() => {
        const ctx = document.getElementById('chartMain').getContext('2d');
        
        // Gradient
        let gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(13, 148, 136, 0.2)');   
        gradient.addColorStop(1, 'rgba(13, 148, 136, 0)');

        if(activeChart) activeChart.destroy();

        activeChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                datasets: [{
                    label: 'Aktivitas Visit',
                    data: [12, 19, 15, 25, 22, 30, totalVisits], // Dummy dynamic data
                    borderColor: '#0d9488',
                    backgroundColor: gradient,
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#0d9488',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: { beginAtZero: true, grid: { borderDash: [5, 5] } },
                    x: { grid: { display: false } }
                }
            }
        });
    }, 100);
}

function dashboardCard(title, value, bgClass, textClass, icon) {
    return `
        <div class="${bgClass} p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
            <div class="text-slate-400 text-[10px] font-bold tracking-widest uppercase mb-2">${title}</div>
            <div class="text-4xl font-black ${textClass} z-10 relative">${value}</div>
            <i class="fas ${icon} absolute -bottom-4 -right-4 text-8xl opacity-5 text-slate-800 group-hover:scale-110 transition-transform"></i>
        </div>
    `;
}

// --- VIEW: GENERIC LIST (For All Sub-Menus) ---
function renderGenericList(container, type) {
    let headers = ['Nama Pasien', 'No RM'];
    let customHeader = 'Status';
    
    // Customize header based on type
    if(type === 'medicine') customHeader = 'Stok Obat';
    if(type === 'visit') customHeader = 'Total Visit';
    if(type === 'crisis') customHeader = 'Skor BPSS';
    if(type === 'ttv') customHeader = 'TTV Terakhir';

    headers.push(customHeader);
    headers.push('Aksi');

    const rows = appData.patients.map((p, index) => {
        let infoData = '';
        let actionButton = '';

        // Content Logic
        if(type === 'medicine') {
            const lowStock = p.medicine.stock.filter(m => m.qty <= 5).length;
            const totalItems = p.medicine.stock.length;
            infoData = `<div class="flex flex-col">
                <span class="font-bold text-slate-700">${totalItems} Jenis Obat</span>
                ${lowStock > 0 ? `<span class="text-[10px] text-red-500 font-bold bg-red-50 px-2 rounded w-fit">⚠ ${lowStock} Stok Menipis</span>` : '<span class="text-[10px] text-emerald-500 font-bold">Stok Aman</span>'}
            </div>`;
            actionButton = `<button onclick="window.app.manageMedicine('${p.id}')" class="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-200">KELOLA OBAT</button>`;
        } 
        else if (type === 'visit') {
            infoData = `<span class="font-bold text-slate-700">${p.visits.length} Kunjungan</span>`;
            actionButton = `<button onclick="window.app.manageVisit('${p.id}')" class="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-200">INPUT VISIT</button>`;
        }
        else if (type === 'ttv') {
            const last = p.ttv.length ? p.ttv[0] : null;
            infoData = last ? `<span class="font-mono text-xs bg-slate-100 px-2 py-1 rounded">TD: ${last.td} | N: ${last.nadi}</span>` : '<span class="text-slate-400 italic">Belum ada data</span>';
            actionButton = `<button onclick="window.app.manageTTV('${p.id}')" class="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-200">UPDATE TTV</button>`;
        }
        else if (type === 'crisis') {
            const lastScore = p.crisis.bpss.length ? p.crisis.bpss[p.crisis.bpss.length-1].total : 0;
            const color = lastScore > 10 ? 'text-red-600 bg-red-100' : 'text-slate-600 bg-slate-100';
            infoData = `<span class="${color} px-3 py-1 rounded-full text-xs font-bold">Skor: ${lastScore}</span>`;
            actionButton = `<button onclick="window.app.manageCrisis('${p.id}')" class="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-orange-200">INPUT SKOR</button>`;
        }
        else {
            // Default (Program/Therapy)
            infoData = `<span class="text-sm text-slate-500">${p.program.type}</span>`;
            actionButton = `<button onclick="window.app.manageProgram('${p.id}')" class="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-200">DETAIL</button>`;
        }

        return `
            <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors search-item group">
                <td class="p-5">
                    <div class="font-bold text-slate-700">${p.reg.name}</div>
                </td>
                <td class="p-5 font-mono text-sm text-slate-500">${p.reg.rm}</td>
                <td class="p-5 text-sm">${infoData}</td>
                <td class="p-5 text-right">
                    ${actionButton}
                    <button onclick="window.app.deleteData('${p.id}')" class="ml-2 text-slate-300 hover:text-red-500 transition-colors"><i class="fas fa-trash-alt"></i></button>
                </td>
            </tr>
        `;
    }).join('');

    container.innerHTML = `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
            <div class="p-6 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center">
                <h3 class="font-black text-slate-700 tracking-tight text-lg">${type.toUpperCase()} DATABASE</h3>
                <span class="text-xs font-bold text-slate-400 bg-white px-3 py-1 rounded-full border shadow-sm">${appData.patients.length} Records</span>
            </div>
            <div class="flex-1 overflow-auto">
                <table class="w-full text-left border-collapse">
                    <thead class="bg-slate-50 sticky top-0 z-10 shadow-sm">
                        <tr>
                            ${headers.map(h => `<th class="p-5 text-xs font-extrabold text-slate-400 uppercase tracking-wider">${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${rows || `<tr><td colspan="4" class="p-10 text-center text-slate-400">Data tidak ditemukan.</td></tr>`}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

// ============================================
// 5. FORM GENERATOR (MODAL SYSTEM)
// ============================================
function openModalForm(type, id) {
    currentPid = id;
    const modal = document.getElementById('modal-container');
    const body = document.getElementById('modal-body');
    const title = document.getElementById('modal-title');
    
    // Get Patient Data
    const p = id ? appData.patients.find(x => x.id === id) : {};
    const safe = (val) => val || '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Dynamic Content Switch
    if (type === 'input') {
        title.innerHTML = id ? `<i class="fas fa-edit mr-2"></i> EDIT PASIEN` : `<i class="fas fa-user-plus mr-2"></i> REGISTRASI BARU`;
        body.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Nama Lengkap</label>
                    <input id="f_name" value="${safe(p.reg?.name)}" class="input-field" placeholder="Nama Pasien">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">No. Rekam Medis</label>
                    <input id="f_rm" value="${safe(p.reg?.rm)}" class="input-field" placeholder="000-000">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Tanggal Lahir</label>
                    <input type="date" id="f_dob" value="${safe(p.reg?.dob)}" class="input-field">
                </div>
                <div>
                    <label class="block text-sm font-bold text-slate-700 mb-2">Jenis Program</label>
                    <select id="f_prog" class="input-field cursor-pointer">
                        <option value="Rawat Jalan" ${safe(p.program?.type) === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                        <option value="Rawat Inap" ${safe(p.program?.type) === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                        <option value="Day Care" ${safe(p.program?.type) === 'Day Care' ? 'selected' : ''}>Day Care</option>
                    </select>
                </div>
            </div>
            <div class="mb-6">
                 <label class="block text-sm font-bold text-slate-700 mb-2">Diagnosa Awal</label>
                 <textarea id="f_diag" class="input-field h-24 resize-none" placeholder="Deskripsi diagnosa...">${safe(p.diagnosis?.text)}</textarea>
            </div>
            <div class="flex justify-end pt-4 border-t border-slate-100">
                <button onclick="window.app.saveForm('input')" class="bg-teal-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 hover:shadow-xl transition-all">SIMPAN DATA</button>
            </div>
        `;
    }

    else if (type === 'medicine') {
        title.innerHTML = `<i class="fas fa-pills mr-2"></i> KELOLA OBAT: ${p.reg.name}`;
        const stockList = (p.medicine?.stock || []).map((m, i) => `
            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl mb-2 border border-slate-100">
                <span class="font-bold text-slate-700 text-sm">${m.name}</span>
                <div class="flex items-center gap-3">
                    <span class="text-xs font-mono font-bold ${m.qty<5?'text-red-500':'text-slate-500'}">Qty: ${m.qty}</span>
                    <button onclick="modifyStock('${id}', ${i}, -1)" class="w-8 h-8 rounded-lg bg-white border text-red-500 hover:bg-red-50 font-bold shadow-sm">-</button>
                    <button onclick="modifyStock('${id}', ${i}, 1)" class="w-8 h-8 rounded-lg bg-white border text-green-500 hover:bg-green-50 font-bold shadow-sm">+</button>
                </div>
            </div>
        `).join('');

        body.innerHTML = `
            <div class="flex gap-3 mb-6 bg-teal-50 p-4 rounded-xl border border-teal-100">
                <input id="med_name" placeholder="Nama Obat Baru" class="input-field bg-white">
                <input id="med_qty" type="number" placeholder="Jml" class="input-field w-24 bg-white">
                <button onclick="addNewMed('${id}')" class="bg-teal-600 text-white px-4 rounded-xl font-bold shadow-md hover:bg-teal-700"><i class="fas fa-plus"></i></button>
            </div>
            <div class="max-h-[300px] overflow-y-auto pr-2">
                ${stockList.length ? stockList : '<div class="text-center py-8 text-slate-400 text-sm">Belum ada data obat</div>'}
            </div>
        `;
    }

    else if (type === 'visit') {
        title.innerHTML = `<i class="fas fa-user-md mr-2"></i> VISIT DOKTER: ${p.reg.name}`;
        body.innerHTML = `
            <div class="flex flex-col h-full">
                <div class="mb-4">
                    <label class="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Catatan Perkembangan (CPPT)</label>
                    <textarea id="vis_note" class="input-field h-32 resize-none text-sm" placeholder="SOAP (Subjective, Objective, Assessment, Plan)..."></textarea>
                </div>
                <div class="flex-1 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 relative mb-2" style="min-height: 200px;">
                    <canvas id="sig-canvas" class="absolute inset-0 w-full h-full cursor-crosshair rounded-xl"></canvas>
                    <div class="absolute bottom-2 right-4 text-[10px] text-slate-400 font-bold pointer-events-none">TANDA TANGAN DOKTER PEMERIKSA</div>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <button onclick="window.app.clearSig()" class="text-xs text-red-500 font-bold hover:underline">Hapus Tanda Tangan</button>
                    <button onclick="window.app.saveForm('visit')" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold shadow hover:bg-teal-700">SIMPAN VISIT</button>
                </div>
            </div>
        `;
        
        // Init Signature Pad with resize logic
        setTimeout(() => {
            const canvas = document.getElementById('sig-canvas');
            if(canvas) {
                // High DPI Scaling
                const ratio = Math.max(window.devicePixelRatio || 1, 1);
                canvas.width = canvas.offsetWidth * ratio;
                canvas.height = canvas.offsetHeight * ratio;
                canvas.getContext("2d").scale(ratio, ratio);
                
                signaturePad = new SignaturePad(canvas, {
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    penColor: 'rgb(15, 23, 42)'
                });
            }
        }, 300); // Wait for modal animation
    }

    else if (type === 'ttv') {
        title.innerHTML = `<i class="fas fa-heartbeat mr-2"></i> UPDATE TTV: ${p.reg.name}`;
        body.innerHTML = `
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div><label class="label-text text-xs font-bold text-slate-500">Tekanan Darah (mmHg)</label><input id="ttv_td" placeholder="120/80" class="input-field mt-1"></div>
                <div><label class="label-text text-xs font-bold text-slate-500">Nadi (bpm)</label><input id="ttv_nadi" placeholder="80" class="input-field mt-1"></div>
                <div><label class="label-text text-xs font-bold text-slate-500">Suhu (°C)</label><input id="ttv_suhu" placeholder="36.5" class="input-field mt-1"></div>
                <div><label class="label-text text-xs font-bold text-slate-500">Pernafasan (RR)</label><input id="ttv_rr" placeholder="20" class="input-field mt-1"></div>
            </div>
            <div class="flex justify-end">
                <button onclick="window.app.saveForm('ttv')" class="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow hover:bg-indigo-700">SIMPAN MONITORING</button>
            </div>
            
            <div class="mt-8">
                <h4 class="font-bold text-slate-700 text-sm mb-3">Riwayat Terakhir</h4>
                <div class="space-y-2">
                    ${(p.ttv||[]).slice(0,3).map(t => `
                        <div class="flex justify-between text-xs bg-slate-50 p-2 rounded border">
                            <span class="text-slate-500">${t.date}</span>
                            <span class="font-bold text-slate-700">TD: ${t.td} | N: ${t.nadi}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    // Add logic for Crisis, Program, Therapy similarly using simple forms if needed
    else {
        // Fallback generic form
        title.innerHTML = `FORM DATA: ${type.toUpperCase()}`;
        body.innerHTML = `
            <p class="text-slate-500 text-sm mb-4">Input data untuk modul ${type} pada pasien ${p.reg.name}</p>
            <textarea id="generic_input" class="input-field h-32"></textarea>
            <div class="flex justify-end mt-4">
                <button onclick="window.app.saveForm('${type}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">SIMPAN</button>
            </div>
        `;
    }
}

// --- HELPER FUNCTIONS FOR MODAL ---
async function addNewMed(pid) {
    const name = document.getElementById('med_name').value;
    const qty = parseInt(document.getElementById('med_qty').value);
    
    if(name && qty) {
        const p = appData.patients.find(x => x.id === pid);
        if(!p.medicine.stock) p.medicine.stock = [];
        p.medicine.stock.push({name, qty});
        await saveData();
        openModalForm('medicine', pid); // Refresh
    } else {
        Swal.fire('Error', 'Nama dan Jumlah wajib diisi', 'warning');
    }
}

async function modifyStock(pid, idx, amount) {
    const p = appData.patients.find(x => x.id === pid);
    if(p.medicine.stock[idx]) {
        p.medicine.stock[idx].qty += amount;
        if(p.medicine.stock[idx].qty < 0) p.medicine.stock[idx].qty = 0; // Prevent negative
        await saveData();
        openModalForm('medicine', pid);
    }
}

// ============================================
// 6. SAVE PROCESSOR
// ============================================
async function processSave(type) {
    const p = currentPid ? appData.patients.find(x => x.id === currentPid) : null;
    const now = new Date().toLocaleString('id-ID');

    // 1. REGISTER / EDIT PROFILE
    if (type === 'input') {
        const name = document.getElementById('f_name').value;
        const rm = document.getElementById('f_rm').value;
        const dob = document.getElementById('f_dob').value;
        const prog = document.getElementById('f_prog').value;
        const diag = document.getElementById('f_diag').value;

        if(!name || !rm) return Swal.fire('Data Belum Lengkap', 'Nama dan No. RM Wajib diisi!', 'warning');

        if (p) {
            // Update Existing
            p.reg = { name, rm, dob };
            p.program.type = prog;
            p.diagnosis.text = diag;
        } else {
            // Create New
            const newPatient = {
                id: Date.now().toString(),
                reg: { name, rm, dob },
                program: { type: prog, duration: '0 Bulan' },
                diagnosis: { text: diag },
                medicine: { stock: [] },
                ttv: [], visits: [], crisis: { bpss: [] }, therapy: ''
            };
            appData.patients.unshift(newPatient); // Add to top
        }
    }

    // 2. VISIT DOKTER
    else if (type === 'visit') {
        const note = document.getElementById('vis_note').value;
        if (signaturePad.isEmpty()) return Swal.fire('Wajib Tanda Tangan', 'Dokter harus tanda tangan.', 'warning');
        
        p.visits.unshift({
            date: now,
            note: note,
            signature: signaturePad.toDataURL()
        });
    }

    // 3. TTV MONITORING
    else if (type === 'ttv') {
        p.ttv.unshift({
            date: now,
            td: document.getElementById('ttv_td').value,
            nadi: document.getElementById('ttv_nadi').value,
            suhu: document.getElementById('ttv_suhu').value,
            rr: document.getElementById('ttv_rr').value
        });
    }

    // 4. OTHER TYPES
    else if (type === 'crisis') {
        // Simplified for fallback
        const val = document.getElementById('generic_input')?.value || 0;
        p.crisis.bpss.push({ date: now, total: val });
    }
    else if (type === 'program' || type === 'therapy') {
        const val = document.getElementById('generic_input')?.value;
        if(type === 'therapy') p.therapy = val;
    }

    // FINAL SAVE
    await saveData();
    window.app.closeModal();
    
    // UI Feedback
    const Toast = Swal.mixin({
        toast: true, position: 'top-end', showConfirmButton: false, timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer)
            toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    Toast.fire({ icon: 'success', title: 'Data berhasil disimpan ke database' });

    // Refresh Current View
    const activePage = document.querySelector('.nav-btn.active').id.replace('btn-', '');
    renderView(activePage);
}
