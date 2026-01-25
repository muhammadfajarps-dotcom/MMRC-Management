/**
 * MMRC SYSTEM - FINAL PRODUCTION FIX
 * Mode: Diagnostic & High Performance
 */

// ============================================
// 1. GLOBAL ERROR CATCHER (Supaya ketahuan kalau ada error)
// ============================================
window.onerror = function(msg, url, line, col, error) {
    // Abaikan error resize observer Chrome yang tidak berbahaya
    if (msg.includes("ResizeObserver")) return;
    
    // Tampilkan Alert Merah jika ada error fatal supaya user tau
    Swal.fire({
        icon: 'error',
        title: 'SYSTEM CRASH',
        text: msg + " (Line: " + line + ")",
        footer: 'Screenshot ini dan kirim ke developer'
    });
    return false;
};

// ============================================
// 2. CONFIGURATION
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    // DATABASE URL ASIA (FIXED)
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// ============================================
// 3. CORE APPLICATION
// ============================================
let db;
let app = {
    data: { patients: [] },
    user: null,
    currentPage: 'dashboard',
    chartInstance: null,
    signaturePad: null,
    currentEditId: null
};

// JALANKAN SAAT DOM SIAP
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log("System Booting...");

        // 1. Cek Ketersediaan Library
        if (typeof firebase === 'undefined') throw new Error("Firebase Library belum terload!");
        if (typeof Swal === 'undefined') throw new Error("SweetAlert Library belum terload!");

        // 2. Init Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();

        // 3. Cek Elemen HTML Kunci (Diagnosa ID)
        const btnLogin = document.getElementById('login-btn') || document.getElementById('btn-login'); // Coba cari tombol login
        // Jika pakai onclick di HTML, kita pastikan function terekspos ke window
        
        // 4. Cek Session Login
        const session = localStorage.getItem('mmrc_session');
        if (session) {
            toggleInterface('app');
            loadDataFromCloud();
        } else {
            // Pastikan Auth Layer muncul
            toggleInterface('login');
        }

        // 5. DIAGNOSTIC SUCCESS (Tanda file baru sudah masuk)
        // Hapus baris di bawah ini nanti kalau sudah fix
        // Swal.fire({ icon: 'info', title: 'SYSTEM READY', text: 'Script baru berhasil dimuat!', timer: 1000, showConfirmButton: false });

    } catch (err) {
        alert("GAGAL MEMUAT SYSTEM: " + err.message);
    }
});

// ============================================
// 4. AUTHENTICATION MODULE
// ============================================
// Expose function ke Global Window agar bisa dipanggil HTML onclick="..."
window.app = {
    login: function() {
        // Ambil ID sesuai HTML Anda: login-user & login-pass
        const uField = document.getElementById('login-user');
        const pField = document.getElementById('login-pass');

        if(!uField || !pField) {
            Swal.fire('Error HTML', 'Element Input ID login-user/login-pass tidak ditemukan!', 'error');
            return;
        }

        const u = uField.value.trim();
        const p = pField.value.trim();

        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_session', u);
            
            let timerInterval;
            Swal.fire({
                title: 'AUTHENTICATING',
                html: 'Menghubungkan Database...',
                timer: 1000,
                timerProgressBar: true,
                didOpen: () => Swal.showLoading(),
                willClose: () => clearInterval(timerInterval)
            }).then(() => {
                toggleInterface('app');
                loadDataFromCloud();
            });
        } else {
            Swal.fire('Akses Ditolak', 'Username/Password Salah', 'error');
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Logout?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
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
        app.currentPage = page;
        
        // Update Sidebar
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Header
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = page.toUpperCase().replace('-', ' ');

        renderView(page);
    },

    // --- MODAL FUNCTIONS ---
    closeModal: function() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    },

    openModalInput: function(editId = null) {
        openInputForm(editId);
    },

    // --- CRUD ACTIONS ---
    saveData: function() {
        processSaveData();
    },

    deletePatient: function(id) {
        processDelete(id);
    },

    // --- EXPORT ---
    exportAllExcel: function() {
        if(app.data.patients.length === 0) return Swal.fire('Info', 'Data kosong', 'info');
        const d = app.data.patients.map((p, i) => ({
            NO: i+1, NAMA: p.reg.name, RM: p.reg.rm, PROGRAM: p.program.type, DOB: p.reg.dob
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d), "DATA");
        XLSX.writeFile(wb, "MMRC_Data.xlsx");
    }
};

// Helper: Toggle Layar Login vs App
function toggleInterface(mode) {
    const auth = document.getElementById('auth-layer');
    const main = document.getElementById('app-layer');
    
    if (mode === 'app') {
        auth.style.display = 'none';
        main.classList.remove('hidden');
        main.style.display = 'flex';
    } else {
        auth.style.display = 'flex';
        main.classList.add('hidden');
        main.style.display = 'none';
    }
}

// ============================================
// 5. DATABASE LOGIC
// ============================================
async function loadDataFromCloud() {
    try {
        const snap = await db.ref('mmrc_data').once('value');
        const val = snap.val();
        
        // Sanitasi Data
        app.data = val || { patients: [] };
        if(!app.data.patients) app.data.patients = [];
        
        // Deep Sanitization
        app.data.patients = app.data.patients.map(p => ({
            id: p.id || Date.now().toString(),
            reg: p.reg || { name: '-', rm: '-', dob: '' },
            program: p.program || { type: 'Umum' },
            diagnosis: p.diagnosis || { text: '', signature: '' },
            medicine: p.medicine || { stock: [] },
            files: p.files || []
        }));

        renderView('dashboard');
        checkStock();

    } catch (e) {
        console.error(e);
        Swal.fire('Koneksi Error', 'Gagal ambil data: ' + e.message, 'error');
    }
}

async function saveToCloud() {
    try {
        await db.ref('mmrc_data').set(app.data);
    } catch (e) {
        Swal.fire('Error', 'Gagal simpan: ' + e.message, 'error');
    }
}

// ============================================
// 6. RENDER ENGINE
// ============================================
function renderView(page) {
    const container = document.getElementById('main-content');
    container.innerHTML = '';

    switch(page) {
        case 'dashboard': renderDashboard(container); break;
        case 'data': renderDataList(container); break;
        case 'input': window.app.openModalInput(); window.app.nav('dashboard'); break;
        default: renderDashboard(container);
    }
}

function renderDashboard(c) {
    const p = app.data.patients;
    const stats = {
        total: p.length,
        rj: p.filter(x => x.program.type === 'Rawat Jalan').length,
        ri: p.filter(x => x.program.type === 'Rawat Inap').length,
        meds: p.reduce((a, b) => a + (b.medicine?.stock?.length || 0), 0)
    };

    c.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${uiCard('TOTAL PASIEN', stats.total, 'text-slate-800')}
            ${uiCard('RAWAT JALAN', stats.rj, 'text-emerald-600')}
            ${uiCard('RAWAT INAP', stats.ri, 'text-blue-600')}
            ${uiCard('ITEM OBAT', stats.meds, 'text-orange-600')}
        </div>
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96">
            <h3 class="font-bold text-slate-700 mb-4">Analitik Kunjungan</h3>
            <div class="h-full pb-10"><canvas id="mainChart"></canvas></div>
        </div>
    `;

    setTimeout(() => {
        const ctx = document.getElementById('mainChart');
        if(ctx) {
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                    datasets: [{
                        label: 'Pasien',
                        data: [10, 15, 8, 20, 25, stats.total],
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
    const rows = app.data.patients.map((p, i) => `
        <tr class="border-b hover:bg-slate-50">
            <td class="p-4 font-bold text-slate-400">#${i+1}</td>
            <td class="p-4 font-bold text-slate-700">${p.reg.name}</td>
            <td class="p-4 text-xs font-mono">${p.reg.rm}</td>
            <td class="p-4"><span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase ${p.program.type==='Rawat Inap'?'bg-blue-100 text-blue-600':'bg-emerald-100 text-emerald-600'}">${p.program.type}</span></td>
            <td class="p-4 text-right">
                <button onclick="window.app.openModalInput('${p.id}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded mr-2"><i class="fas fa-edit"></i></button>
                <button onclick="window.app.deletePatient('${p.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    c.innerHTML = `
        <div class="bg-white rounded-[2rem] shadow-sm border overflow-hidden flex flex-col h-full">
            <div class="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <h3 class="font-bold text-slate-700">DATABASE</h3>
                <input type="text" onkeyup="searchLocal(this.value)" placeholder="Cari..." class="border rounded-xl px-4 py-2 text-sm outline-none">
            </div>
            <div class="overflow-auto flex-1">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] sticky top-0">
                        <tr><th class="p-4">No</th><th class="p-4">Nama</th><th class="p-4">RM</th><th class="p-4">Program</th><th class="p-4 text-right">Aksi</th></tr>
                    </thead>
                    <tbody id="table-body">${rows || '<tr><td colspan="5" class="p-8 text-center text-slate-300">Kosong</td></tr>'}</tbody>
                </table>
            </div>
        </div>
    `;
}

function uiCard(t, v, c) {
    return `<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100"><div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${t}</div><div class="text-4xl font-black ${c}">${v}</div></div>`;
}

// ============================================
// 7. FORM HANDLER
// ============================================
function openInputForm(editId) {
    app.currentEditId = editId;
    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    // Data Setup
    let d = {};
    if(editId) d = app.data.patients.find(p => p.id === editId) || {};
    const safe = (v) => v || '';

    title.innerText = editId ? "EDIT DATA" : "REGISTRASI BARU";
    
    body.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div><label class="label-text">NAMA LENGKAP</label><input id="f_name" value="${safe(d.reg?.name)}" class="input-field"></div>
            <div><label class="label-text">NO. RM</label><input id="f_rm" value="${safe(d.reg?.rm)}" class="input-field"></div>
            <div><label class="label-text">TGL LAHIR</label><input type="date" id="f_dob" value="${safe(d.reg?.dob)}" class="input-field"></div>
            <div><label class="label-text">PROGRAM</label>
                <select id="f_prog" class="input-field bg-white">
                    <option ${safe(d.program?.type)==='Rawat Jalan'?'selected':''}>Rawat Jalan</option>
                    <option ${safe(d.program?.type)==='Rawat Inap'?'selected':''}>Rawat Inap</option>
                    <option ${safe(d.program?.type)==='Konseling'?'selected':''}>Konseling</option>
                </select>
            </div>
        </div>
        <div class="mt-6 pt-6 border-t">
            <label class="label-text">CATATAN MEDIS / DIAGNOSA</label>
            <textarea id="f_diag" class="input-field h-24">${safe(d.diagnosis?.text)}</textarea>
        </div>
        <div class="mt-6 flex justify-end">
            <button onclick="window.app.saveData()" class="bg-teal-600 text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:bg-teal-700">SIMPAN</button>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

async function processSaveData() {
    const name = document.getElementById('f_name').value;
    const rm = document.getElementById('f_rm').value;

    if(!name || !rm) return Swal.fire('Error', 'Nama & RM Wajib diisi', 'warning');

    let p = app.currentEditId 
        ? app.data.patients.find(x => x.id === app.currentEditId)
        : { id: Date.now().toString(), medicine: {stock:[]}, files:[] };

    p.reg = { name, rm, dob: document.getElementById('f_dob').value };
    p.program = { type: document.getElementById('f_prog').value };
    p.diagnosis = { text: document.getElementById('f_diag').value, signature: p.diagnosis?.signature || '' };

    if(!app.currentEditId) app.data.patients.push(p);

    await saveToCloud();
    window.app.closeModal();
    Swal.fire({ icon: 'success', title: 'Tersimpan', timer: 1500, showConfirmButton: false });
    window.app.nav('dashboard');
}

async function processDelete(id) {
    if(confirm("Hapus data ini permanen?")) {
        app.data.patients = app.data.patients.filter(p => p.id !== id);
        await saveToCloud();
        window.app.nav('data');
    }
}

// Utils
function checkStock() {
    const low = [];
    app.data.patients.forEach(p => {
        p.medicine?.stock?.forEach(m => {
            if(m.qty < 7) low.push(`${m.name} (${p.reg.name})`);
        });
    });
    if(low.length > 0) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'warning', title: 'Stok Menipis', html: low.join('<br>'), showConfirmButton: false, timer: 5000 });
    }
}

window.searchLocal = function(q) {
    const rows = document.querySelectorAll('#table-body tr');
    rows.forEach(r => r.style.display = r.innerText.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
};
