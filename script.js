/**
 * MMRC HOSPITAL MANAGEMENT SYSTEM
 * Enterprise Edition - Full Integrated
 * Author: Professional Dev
 */

// ============================================
// 1. SYSTEM CONFIGURATION
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

// Global App State
let db;
let app = {
    data: { patients: [] },
    user: null,
    currentPage: 'dashboard',
    chartInstance: null,
    signaturePad: null,
    currentEditId: null
};

// ============================================
// 2. BOOTSTRAP & SECURITY
// ============================================
window.onload = function() {
    try {
        // Init Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();

        // Cek Session Login
        const session = localStorage.getItem('mmrc_session');
        if(session) {
            app.user = session;
            toggleInterface('app');
            loadDataFromCloud();
        }

        // Listener Tombol Enter pada Login
        document.getElementById('login-pass')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginProcess();
        });

        // Expose app ke window agar bisa dipanggil HTML onclick
        window.app = appFunctions; 

    } catch (err) {
        console.error("System Crash:", err);
        Swal.fire('Critical Error', 'Gagal memuat sistem inti. Cek koneksi internet.', 'error');
    }
};

// ============================================
// 3. AUTHENTICATION MODULE
// ============================================
function loginProcess() {
    const uField = document.getElementById('login-user');
    const pField = document.getElementById('login-pass');
    
    const u = uField ? uField.value.trim() : '';
    const p = pField ? pField.value.trim() : '';

    if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
        localStorage.setItem('mmrc_session', u);
        
        let timerInterval;
        Swal.fire({
            title: 'AUTHENTICATING',
            html: 'Establishing secure connection...',
            timer: 1000,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading(),
            willClose: () => clearInterval(timerInterval)
        }).then(() => {
            toggleInterface('app');
            loadDataFromCloud();
        });
    } else {
        Swal.fire('ACCESS DENIED', 'Username atau Password salah.', 'error');
    }
}

function logoutProcess() {
    Swal.fire({
        title: 'LOGOUT?',
        text: "Sesi kerja Anda akan diakhiri.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Logout'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('mmrc_session');
            location.reload();
        }
    });
}

function toggleInterface(mode) {
    const loginLayer = document.getElementById('auth-layer');
    const appLayer = document.getElementById('app-layer');
    
    if(mode === 'app') {
        loginLayer.style.display = 'none';
        appLayer.classList.remove('hidden');
        appLayer.style.display = 'flex';
    } else {
        loginLayer.style.display = 'flex';
        appLayer.classList.add('hidden');
        appLayer.style.display = 'none';
    }
}

// ============================================
// 4. DATABASE ENGINE (CRUD)
// ============================================
async function loadDataFromCloud() {
    try {
        const snap = await db.ref('mmrc_data').once('value');
        const raw = snap.val();
        
        // Data Sanitization (Mencegah error null/undefined)
        app.data = raw || { patients: [] };
        if(!app.data.patients) app.data.patients = [];
        
        // Deep Clean
        app.data.patients = app.data.patients.map(p => ({
            id: p.id || Date.now().toString(),
            reg: p.reg || { name: '-', rm: '-', dob: '' },
            program: p.program || { type: 'Umum' },
            diagnosis: p.diagnosis || { text: '', signature: '' },
            medicine: p.medicine || { stock: [] },
            files: p.files || []
        }));

        renderView('dashboard');
        checkStockWarning();

    } catch (e) {
        Swal.fire('Sync Error', 'Gagal mengambil data database.', 'error');
    }
}

async function saveToCloud() {
    try {
        await db.ref('mmrc_data').set(app.data);
    } catch (e) {
        Swal.fire('Save Error', 'Gagal menyimpan perubahan.', 'error');
    }
}

// ============================================
// 5. UI CONTROLLER & ROUTING
// ============================================
const appFunctions = {
    // Navigasi Menu
    nav: (page) => {
        app.currentPage = page;
        
        // Highlight Sidebar
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');

        // Ganti Judul
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = page.toUpperCase().replace('-', ' ');

        renderView(page);
    },

    // --- FITUR: INPUT / EDIT ---
    openModalInput: (editId = null) => {
        app.currentEditId = editId;
        const modal = document.getElementById('modal-container');
        const title = document.getElementById('modal-title');
        const body = document.getElementById('modal-body');
        
        // Setup Data (Edit vs Baru)
        let d = {}; 
        if(editId) d = app.data.patients.find(p => p.id === editId) || {};
        const safeVal = (v) => v || '';

        title.innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";

        body.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">NAMA LENGKAP</label>
                    <input id="form_name" value="${safeVal(d.reg?.name)}" class="input-field" placeholder="Nama Pasien">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">NO. REKAM MEDIS (RM)</label>
                    <input id="form_rm" value="${safeVal(d.reg?.rm)}" class="input-field" placeholder="No. RM">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">TANGGAL LAHIR</label>
                    <input type="date" id="form_dob" value="${safeVal(d.reg?.dob)}" class="input-field">
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">PROGRAM</label>
                    <select id="form_prog" class="input-field bg-white">
                        <option ${safeVal(d.program?.type) === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                        <option ${safeVal(d.program?.type) === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                        <option ${safeVal(d.program?.type) === 'Konseling' ? 'selected' : ''}>Konseling</option>
                    </select>
                </div>
            </div>

            <div class="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">DIAGNOSA MEDIS</label>
                    <textarea id="form_diag" class="input-field h-32">${safeVal(d.diagnosis?.text)}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">TANDA TANGAN DOKTER</label>
                    <div class="border rounded-xl h-32 relative bg-slate-50 overflow-hidden group">
                         ${d.diagnosis?.signature ? `<img src="${d.diagnosis.signature}" class="absolute inset-0 w-full h-full object-contain z-0">` : ''}
                        <canvas id="sig-canvas" class="absolute inset-0 w-full h-full z-10 cursor-crosshair opacity-0 group-hover:opacity-100 transition-opacity bg-white/50"></canvas>
                        <div class="absolute bottom-1 right-2 text-[9px] text-slate-400">Hover to Sign</div>
                    </div>
                    <button onclick="app.clearSig()" class="text-xs text-red-500 mt-1 hover:underline">Hapus Tanda Tangan</button>
                </div>
            </div>

            <div class="mt-8 flex justify-end">
                <button onclick="app.saveData()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg">
                    <i class="fas fa-save mr-2"></i> SIMPAN DATA
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = 'flex';

        // Init Signature Pad
        setTimeout(() => {
            const canvas = document.getElementById('sig-canvas');
            if(canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                app.signaturePad = new SignaturePad(canvas);
            }
        }, 300);
    },

    saveData: async () => {
        const name = document.getElementById('form_name').value;
        const rm = document.getElementById('form_rm').value;

        if(!name || !rm) return Swal.fire('Error', 'Nama dan No RM wajib diisi!', 'warning');

        // Ambil data lama jika edit, atau buat object baru
        let patient = app.currentEditId 
            ? app.data.patients.find(p => p.id === app.currentEditId) 
            : { 
                id: Date.now().toString(), 
                medicine: { stock: [] },
                files: []
              };

        // Update Field
        patient.reg = { name, rm, dob: document.getElementById('form_dob').value };
        patient.program = { type: document.getElementById('form_prog').value };
        patient.diagnosis = patient.diagnosis || {};
        patient.diagnosis.text = document.getElementById('form_diag').value;

        // Cek Signature
        if(app.signaturePad && !app.signaturePad.isEmpty()) {
            patient.diagnosis.signature = app.signaturePad.toDataURL();
        }

        // Simpan ke Array Global
        if(!app.currentEditId) app.data.patients.push(patient);

        await saveToCloud();
        appFunctions.closeModal();
        Swal.fire({ icon: 'success', title: 'Data Tersimpan', timer: 1500, showConfirmButton: false });
        
        // Refresh Halaman yg aktif
        renderView(app.currentPage);
    },

    closeModal: () => {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').style.display = 'none';
    },

    clearSig: () => {
        if(app.signaturePad) app.signaturePad.clear();
    },

    // --- FITUR: DELETE ---
    deletePatient: async (id) => {
        const res = await Swal.fire({
            title: 'Hapus Data?',
            text: "Data yang dihapus tidak dapat dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Hapus'
        });

        if(res.isConfirmed) {
            app.data.patients = app.data.patients.filter(p => p.id !== id);
            await saveToCloud();
            renderView('data'); // Refresh List
            Swal.fire('Terhapus', '', 'success');
        }
    },

    // --- FITUR: SEARCH ---
    searchData: () => {
        const query = document.getElementById('global-search').value.toLowerCase();
        const rows = document.querySelectorAll('.data-row');
        rows.forEach(row => {
            const txt = row.innerText.toLowerCase();
            row.style.display = txt.includes(query) ? '' : 'none';
        });
    },

    // --- FITUR: MANAJEMEN OBAT (STOK) ---
    openMedicineModal: (id) => {
        // Bisa dikembangkan untuk membuka modal khusus obat
        // Untuk saat ini, kita arahkan ke Edit Modal dulu atau buat logic terpisah
        // Saya buat logic simple Alert + Prompt untuk nambah obat cepat
        const p = app.data.patients.find(x => x.id === id);
        if(!p) return;

        Swal.fire({
            title: `STOK OBAT: ${p.reg.name}`,
            html: `
                <div class="text-left mb-4 max-h-40 overflow-auto border p-2 rounded">
                    ${p.medicine.stock.length ? p.medicine.stock.map(m => 
                        `<div class="flex justify-between border-b py-1"><span>${m.name}</span> <b>${m.qty}</b></div>`
                    ).join('') : 'Belum ada data obat.'}
                </div>
                <input id="swal-med" class="swal2-input" placeholder="Nama Obat">
                <input id="swal-qty" type="number" class="swal2-input" placeholder="Jumlah">
            `,
            showCancelButton: true,
            confirmButtonText: 'Tambah Stok',
            preConfirm: () => {
                const name = document.getElementById('swal-med').value;
                const qty = document.getElementById('swal-qty').value;
                if(!name || !qty) Swal.showValidationMessage('Isi semua field');
                return { name, qty: parseInt(qty) };
            }
        }).then(async (res) => {
            if(res.isConfirmed) {
                if(!p.medicine) p.medicine = { stock: [] };
                if(!p.medicine.stock) p.medicine.stock = [];
                
                // Cek jika obat sudah ada, update qty
                const exist = p.medicine.stock.find(m => m.name.toLowerCase() === res.value.name.toLowerCase());
                if(exist) {
                    exist.qty += res.value.qty;
                } else {
                    p.medicine.stock.push(res.value);
                }
                
                await saveToCloud();
                Swal.fire('Stok Updated', '', 'success');
                checkStockWarning();
            }
        });
    },

    // --- FITUR: EXPORT ---
    exportAllExcel: () => {
        if(app.data.patients.length === 0) return Swal.fire('Info', 'Data kosong', 'info');
        
        const dataExport = app.data.patients.map((p, i) => ({
            NO: i + 1,
            NAMA: p.reg.name,
            RM: p.reg.rm,
            PROGRAM: p.program.type,
            DIAGNOSA: p.diagnosis.text,
            TGL_LAHIR: p.reg.dob
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dataExport);
        XLSX.utils.book_append_sheet(wb, ws, "MMRC DATA");
        XLSX.writeFile(wb, "MMRC_Database.xlsx");
    },
    
    // Auth wrappers
    login: loginProcess,
    logout: logoutProcess
};

// ============================================
// 6. RENDER ENGINE (VIEW GENERATOR)
// ============================================
function renderView(page) {
    const container = document.getElementById('main-content');
    container.innerHTML = ''; 

    switch(page) {
        case 'dashboard':
            renderDashboard(container);
            break;
        case 'data': // Halaman List Data Pasien
            renderDataList(container);
            break;
        case 'input':
            // Langsung buka modal untuk input
            appFunctions.openModalInput();
            appFunctions.nav('dashboard'); // Kembali ke dashboard di background
            break;
        default:
            renderDashboard(container);
    }
}

function renderDashboard(c) {
    const p = app.data.patients;
    // Statistik Real
    const total = p.length;
    const rj = p.filter(x => x.program.type === 'Rawat Jalan').length;
    const ri = p.filter(x => x.program.type === 'Rawat Inap').length;
    const obat = p.reduce((a, b) => a + (b.medicine?.stock?.length || 0), 0);

    c.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
            ${uiCard('TOTAL PASIEN', total, 'text-slate-800')}
            ${uiCard('RAWAT JALAN', rj, 'text-emerald-600')}
            ${uiCard('RAWAT INAP', ri, 'text-blue-600')}
            ${uiCard('ITEM OBAT', obat, 'text-orange-600')}
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96">
                <h3 class="font-bold text-slate-700 mb-4">Grafik Kunjungan</h3>
                <div class="h-full pb-8"><canvas id="dashChart"></canvas></div>
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-teal-600">
                    <i class="fas fa-file-medical text-2xl"></i>
                </div>
                <h3 class="font-bold text-slate-800">Manajemen Data</h3>
                <p class="text-xs text-slate-400 mb-6">Kelola data pasien, diagnosa, dan obat.</p>
                <button onclick="app.nav('data')" class="w-full bg-slate-800 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-slate-900 transition-all">
                    LIHAT DATA LENGKAP
                </button>
            </div>
        </div>
    `;

    // Render Chart
    setTimeout(() => {
        const ctx = document.getElementById('dashChart');
        if(ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                    datasets: [{
                        label: 'Pasien',
                        data: [10, 15, 8, 20, 25, total],
                        borderColor: '#0d9488',
                        backgroundColor: 'rgba(13, 148, 136, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
            });
        }
    }, 100);
}

function renderDataList(c) {
    const listHtml = app.data.patients.map((p, i) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors data-row group">
            <td class="p-4 text-slate-400 font-bold">#${i+1}</td>
            <td class="p-4 font-bold text-slate-700">${p.reg.name}</td>
            <td class="p-4 text-slate-500 font-mono text-xs">${p.reg.rm}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide
                ${p.program.type === 'Rawat Inap' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}">
                ${p.program.type}
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="app.openMedicineModal('${p.id}')" title="Stok Obat" class="w-8 h-8 rounded-lg bg-orange-100 text-orange-500 hover:bg-orange-200 mr-1"><i class="fas fa-pills"></i></button>
                <button onclick="app.openModalInput('${p.id}')" title="Edit Data" class="w-8 h-8 rounded-lg bg-blue-100 text-blue-500 hover:bg-blue-200 mr-1"><i class="fas fa-edit"></i></button>
                <button onclick="app.deletePatient('${p.id}')" title="Hapus" class="w-8 h-8 rounded-lg bg-red-100 text-red-500 hover:bg-red-200"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    c.innerHTML = `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
            <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-slate-700">DATABASE PASIEN</h3>
                <div class="flex gap-2">
                    <input type="text" id="local-search" onkeyup="appFunctions.searchData()" placeholder="Cari Pasien..." class="bg-white border px-4 py-2 rounded-xl text-sm outline-none focus:border-teal-500">
                    <button onclick="app.openModalInput()" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow hover:bg-teal-700">+ BARU</button>
                </div>
            </div>
            <div class="overflow-auto flex-1">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                        <tr>
                            <th class="p-4">No</th>
                            <th class="p-4">Nama Pasien</th>
                            <th class="p-4">No. RM</th>
                            <th class="p-4">Program</th>
                            <th class="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${listHtml || '<tr><td colspan="5" class="p-8 text-center text-slate-300">Data Kosong</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    
    // Binding search input local ke fungsi search
    document.getElementById('local-search').addEventListener('keyup', function() {
        const q = this.value.toLowerCase();
        document.querySelectorAll('.data-row').forEach(r => {
            r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    });
}

function uiCard(title, val, color) {
    return `
    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all">
        <div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${title}</div>
        <div class="text-4xl font-black ${color}">${val}</div>
    </div>`;
}

function checkStockWarning() {
    const low = [];
    app.data.patients.forEach(p => {
        if(p.medicine && p.medicine.stock) {
            p.medicine.stock.forEach(m => {
                if(m.qty < 5) low.push(`${m.name} (${p.reg.name})`);
            });
        }
    });

    if(low.length > 0) {
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'warning',
            title: 'Stok Obat Menipis',
            html: `<div class="text-xs text-left">${low.join('<br>')}</div>`,
            showConfirmButton: false,
            timer: 5000
        });
    }
}
