/**
 * MMRC SYSTEM - ULTIMATE FIX
 * Version: 5.0 (Fail-Safe Global Scope)
 */

// ============================================
// 1. ERROR TRAP (Agar kita tahu jika ada error)
// ============================================
window.onerror = function(msg, url, line) {
    if (msg.includes("ResizeObserver")) return; // Abaikan error sepele
    alert("SYSTEM ERROR:\n" + msg + "\nLine: " + line);
};

// ============================================
// 2. CONFIGURATION
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

// Variabel Global
let db;
let currentEditId = null;
let signaturePad = null;
let chartInstance = null;
let appData = { patients: [] };

// ============================================
// 3. CORE APPLICATION (Exposed to Window)
// ============================================
// Kita pasang 'app' langsung ke window agar HTML bisa baca
window.app = {
    
    // --- AUTHENTICATION ---
    login: function() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;

        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_session', u);
            Swal.fire({
                title: 'LOGIN SUKSES',
                timer: 800,
                showConfirmButton: false,
                icon: 'success'
            }).then(() => {
                toggleScreen('app');
                loadData();
            });
        } else {
            Swal.fire('ERROR', 'Username/Password Salah', 'error');
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Keluar?',
            showCancelButton: true,
            confirmButtonText: 'Ya'
        }).then((res) => {
            if (res.isConfirmed) {
                localStorage.removeItem('mmrc_session');
                location.reload();
            }
        });
    },

    // --- NAVIGATION ---
    nav: function(page) {
        // 1. Update Tombol Sidebar
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('btn-' + page);
        if(activeBtn) activeBtn.classList.add('active');

        // 2. Update Judul Header
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = page.toUpperCase().replace('-', ' ');

        // 3. Render Halaman
        renderPage(page);
    },

    // --- MODAL SYSTEM ---
    openModalInput: function(id = null) {
        currentEditId = id;
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');

        title.innerText = id ? "EDIT DATA PASIEN" : "REGISTRASI BARU";
        
        // Ambil data jika edit
        let d = {};
        if(id) d = appData.patients.find(p => p.id === id) || {};
        const safe = (val) => val || '';

        body.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label class="block text-xs font-bold text-gray-400">NAMA LENGKAP</label>
                <input id="in_name" value="${safe(d.reg?.name)}" class="input-field" placeholder="Nama Pasien"></div>
                
                <div><label class="block text-xs font-bold text-gray-400">NO. REKAM MEDIS</label>
                <input id="in_rm" value="${safe(d.reg?.rm)}" class="input-field" placeholder="Nomor RM"></div>
                
                <div><label class="block text-xs font-bold text-gray-400">TANGGAL LAHIR</label>
                <input type="date" id="in_dob" value="${safe(d.reg?.dob)}" class="input-field"></div>
                
                <div><label class="block text-xs font-bold text-gray-400">PROGRAM</label>
                <select id="in_prog" class="input-field bg-white">
                    <option ${safe(d.program?.type) === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                    <option ${safe(d.program?.type) === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                    <option ${safe(d.program?.type) === 'Konseling' ? 'selected' : ''}>Konseling</option>
                </select></div>
            </div>
            
            <div class="mt-6 pt-6 border-t">
                <label class="block text-xs font-bold text-gray-400">DIAGNOSA & TANDA TANGAN</label>
                <textarea id="in_diag" class="input-field h-24 mb-4" placeholder="Catatan medis...">${safe(d.diagnosis?.text)}</textarea>
                
                <div class="border rounded h-32 relative bg-gray-50">
                    <canvas id="sig-canvas" class="absolute inset-0 w-full h-full"></canvas>
                    ${d.diagnosis?.signature ? `<img src="${d.diagnosis.signature}" class="absolute bottom-1 right-1 h-10 border bg-white z-20">` : ''}
                    <div class="absolute bottom-1 left-2 text-[10px] text-gray-400">Area Tanda Tangan</div>
                </div>
                <button onclick="clearSig()" class="text-xs text-red-500 mt-1">Hapus Tanda Tangan</button>
            </div>

            <div class="mt-6 flex justify-end">
                <button onclick="saveProcess()" class="bg-teal-600 text-white py-3 px-8 rounded-xl font-bold hover:bg-teal-700">SIMPAN DATA</button>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.classList.add('flex'); // Paksa flex agar muncul

        // Init Signature
        setTimeout(() => {
            const cvs = document.getElementById('sig-canvas');
            if(cvs) {
                cvs.width = cvs.offsetWidth;
                cvs.height = cvs.offsetHeight;
                signaturePad = new SignaturePad(cvs);
            }
        }, 300);
    },

    closeModal: function() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    // --- CRUD ACTIONS ---
    deletePatient: function(id) {
        Swal.fire({
            title: 'Hapus Data?',
            text: "Data hilang permanen!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Hapus'
        }).then((res) => {
            if(res.isConfirmed) {
                appData.patients = appData.patients.filter(p => p.id !== id);
                saveToFirebase();
                renderPage('data');
                Swal.fire('Terhapus', '', 'success');
            }
        });
    },

    exportAllExcel: function() {
        if(appData.patients.length === 0) return Swal.fire('Kosong', 'Tidak ada data', 'info');
        
        const exportData = appData.patients.map(p => ({
            NAMA: p.reg.name,
            RM: p.reg.rm,
            PROGRAM: p.program.type,
            DIAGNOSA: p.diagnosis.text
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Database MMRC");
        XLSX.writeFile(wb, "Data_Pasien.xlsx");
    }
};

// ============================================
// 4. INTERNAL FUNCTIONS (Logic Behind Scenes)
// ============================================

window.onload = function() {
    try {
        console.log("System Booting...");
        
        // 1. Init Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();

        // 2. Cek Login
        const session = localStorage.getItem('mmrc_session');
        if (session) {
            toggleScreen('app');
            loadData();
        } else {
            toggleScreen('login');
        }

        // 3. Listener Enter di Login
        document.getElementById('login-pass')?.addEventListener('keypress', (e) => {
            if(e.key === 'Enter') window.app.login();
        });

    } catch (e) {
        alert("Boot Error: " + e.message);
    }
};

function toggleScreen(mode) {
    const auth = document.getElementById('auth-layer');
    const main = document.getElementById('app-layer');
    
    if (mode === 'app') {
        auth.style.display = 'none';
        main.classList.remove('hidden');
        main.style.display = 'flex';
        renderPage('dashboard');
    } else {
        auth.style.display = 'flex';
        main.classList.add('hidden');
        main.style.display = 'none';
    }
}

async function loadData() {
    try {
        const snap = await db.ref('mmrc_data').once('value');
        const val = snap.val();
        
        // Sanitasi Data (Penting!)
        appData = val ? val : { patients: [] };
        if(!appData.patients) appData.patients = [];

        // Normalisasi Struktur Array
        appData.patients = appData.patients.map(p => ({
            id: p.id || Date.now().toString(),
            reg: p.reg || { name: '-', rm: '-' },
            program: p.program || { type: '-' },
            diagnosis: p.diagnosis || { text: '' },
            medicine: p.medicine || { stock: [] }
        }));

        window.app.nav('dashboard'); // Refresh Dashboard

    } catch (e) {
        Swal.fire('Koneksi Gagal', 'Gagal ambil data: ' + e.message, 'error');
    }
}

async function saveToFirebase() {
    await db.ref('mmrc_data').set(appData);
}

// --- FUNGSI SAVE FORM ---
window.saveProcess = async function() {
    const name = document.getElementById('in_name').value;
    const rm = document.getElementById('in_rm').value;

    if(!name || !rm) return Swal.fire('Error', 'Nama & RM Wajib Diisi', 'warning');

    let p = currentEditId 
        ? appData.patients.find(x => x.id === currentEditId)
        : { id: Date.now().toString(), medicine: {stock:[]} };

    p.reg = { 
        name: name, 
        rm: rm, 
        dob: document.getElementById('in_dob').value 
    };
    
    p.program = { type: document.getElementById('in_prog').value };
    
    // Simpan Diagnosa & TTD
    p.diagnosis = { text: document.getElementById('in_diag').value };
    if(signaturePad && !signaturePad.isEmpty()) {
        p.diagnosis.signature = signaturePad.toDataURL();
    } else if (p.diagnosis.signature) {
        // Keep existing signature if not changed
        p.diagnosis.signature = p.diagnosis.signature; 
    }

    if(!currentEditId) appData.patients.push(p);

    await saveToFirebase();
    window.app.closeModal();
    Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1000, showConfirmButton: false });
    window.app.nav('data');
};

window.clearSig = function() {
    if(signaturePad) signaturePad.clear();
};

// --- RENDER HALAMAN ---
function renderPage(page) {
    const container = document.getElementById('main-content');
    container.innerHTML = ''; // Reset Isi

    if(page === 'dashboard') {
        const p = appData.patients;
        const total = p.length;
        const rj = p.filter(x => x.program.type === 'Rawat Jalan').length;
        const ri = p.filter(x => x.program.type === 'Rawat Inap').length;
        
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${cardBox('TOTAL PASIEN', total, 'text-slate-800')}
                ${cardBox('RAWAT JALAN', rj, 'text-emerald-600')}
                ${cardBox('RAWAT INAP', ri, 'text-blue-600')}
                ${cardBox('DATABASE', 'ONLINE', 'text-green-500')}
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow h-96">
                <h3 class="font-bold text-gray-700 mb-4">Grafik Kunjungan</h3>
                <canvas id="chartDash"></canvas>
            </div>
        `;
        
        setTimeout(() => initChart([10, 15, 8, 20, 25, total]), 100);
        
    } else if (page === 'data') {
        const rows = appData.patients.map((p, i) => `
            <tr class="border-b hover:bg-slate-50 search-item">
                <td class="p-4 text-gray-400 font-bold">#${i+1}</td>
                <td class="p-4 font-bold text-gray-700">${p.reg.name}</td>
                <td class="p-4 font-mono text-xs">${p.reg.rm}</td>
                <td class="p-4"><span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100">${p.program.type}</span></td>
                <td class="p-4 text-right">
                    <button onclick="window.app.openModalInput('${p.id}')" class="text-blue-600 hover:bg-blue-100 p-2 rounded mr-2"><i class="fas fa-edit"></i></button>
                    <button onclick="window.app.deletePatient('${p.id}')" class="text-red-600 hover:bg-red-100 p-2 rounded"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="bg-white rounded-[2rem] shadow border flex flex-col h-full overflow-hidden">
                <div class="p-6 border-b flex justify-between items-center bg-gray-50">
                    <h3 class="font-bold text-gray-700">DATA PASIEN</h3>
                    <input onkeyup="searchLocal(this.value)" placeholder="Cari..." class="border rounded-xl px-4 py-2 text-sm outline-none">
                </div>
                <div class="overflow-auto flex-1">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-100 text-gray-500 font-bold uppercase text-[10px]">
                            <tr><th class="p-4">No</th><th class="p-4">Nama</th><th class="p-4">RM</th><th class="p-4">Program</th><th class="p-4 text-right">Aksi</th></tr>
                        </thead>
                        <tbody>${rows || '<tr><td colspan="5" class="p-8 text-center text-gray-400">Data Kosong</td></tr>'}</tbody>
                    </table>
                </div>
            </div>
        `;

    } else if (page === 'input') {
        window.app.openModalInput();
        window.app.nav('dashboard'); // Balik ke dashboard di background
    }
}

function cardBox(title, val, color) {
    return `<div class="bg-white p-6 rounded-[2rem] shadow border hover:shadow-md transition">
        <div class="text-gray-400 text-[10px] font-bold tracking-widest mb-2">${title}</div>
        <div class="text-3xl font-black ${color}">${val}</div>
    </div>`;
}

function initChart(data) {
    const ctx = document.getElementById('chartDash');
    if(!ctx) return;
    if(chartInstance) chartInstance.destroy();
    
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            datasets: [{
                label: 'Pasien',
                data: data,
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// Global Search Helper
window.searchLocal = function(q) {
    const rows = document.querySelectorAll('.search-item');
    rows.forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
    });
};
