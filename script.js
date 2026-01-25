/**
 * MMRC HOSPITAL MANAGEMENT SYSTEM
 * Enterprise Edition - Full Integrated
 */

// 1. CONFIGURATION & SETUP
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Initialize App State
let db;
let app = {
    data: { patients: [] },
    user: null,
    currentPage: 'dashboard',
    chart: null,
    signaturePad: null,
    currentEditId: null
};

// 2. SYSTEM BOOTSTRAP (Fail-Safe Loading)
window.onload = function() {
    try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        
        // Cek Login Session
        const session = localStorage.getItem('mmrc_session');
        if(session) {
            app.user = session;
            toggleAuthLayer(false);
            loadData();
        }

        // Event Listener untuk Enter di Password
        document.getElementById('login-pass')?.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') login();
        });

    } catch (error) {
        console.error("System Boot Error:", error);
        Swal.fire('System Error', 'Gagal memuat konfigurasi. Cek koneksi internet.', 'error');
    }
};

// 3. AUTHENTICATION MODULE
function login() {
    const u = document.getElementById('login-user').value;
    const p = document.getElementById('login-pass').value;

    if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
        localStorage.setItem('mmrc_session', u);
        app.user = u;
        
        let timerInterval;
        Swal.fire({
            title: 'Authenticating...',
            html: 'Menghubungkan ke Database Aman...',
            timer: 1000,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading(),
            willClose: () => clearInterval(timerInterval)
        }).then(() => {
            toggleAuthLayer(false);
            loadData();
        });
    } else {
        Swal.fire('Akses Ditolak', 'Username atau Password salah.', 'error');
    }
}

function logout() {
    Swal.fire({
        title: 'Keluar Sistem?',
        text: "Sesi Anda akan diakhiri.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Keluar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('mmrc_session');
            location.reload();
        }
    });
}

function toggleAuthLayer(show) {
    const auth = document.getElementById('auth-layer');
    const main = document.getElementById('app-layer');
    if(show) {
        auth.style.display = 'flex';
        main.classList.add('hidden');
        main.style.display = 'none';
    } else {
        auth.style.display = 'none';
        main.classList.remove('hidden');
        main.style.display = 'flex';
    }
}

// 4. DATABASE CORE (CRUD)
async function loadData() {
    try {
        const snapshot = await db.ref('mmrc_data').once('value');
        const val = snapshot.val();
        
        // Data Sanitization (Penting untuk mencegah error undefined)
        app.data = val ? val : { patients: [] };
        if(!app.data.patients) app.data.patients = [];
        
        // Deep Check Structure
        app.data.patients.forEach(p => {
            if(!p.reg) p.reg = {};
            if(!p.program) p.program = {};
            if(!p.medicine) p.medicine = { stock: [], logs: [] };
            if(!p.medicine.stock) p.medicine.stock = [];
        });

        renderPage('dashboard');
        checkStockAlert(); // Fitur Notifikasi Stok

    } catch (error) {
        console.error("Load Error:", error);
        Swal.fire('Koneksi Gagal', 'Gagal mengambil data dari server.', 'error');
    }
}

async function saveData() {
    try {
        await db.ref('mmrc_data').set(app.data);
    } catch (error) {
        console.error("Save Error:", error);
        Swal.fire('Error', 'Gagal menyimpan data ke cloud.', 'error');
    }
}

// 5. NAVIGATION & ROUTING
window.nav = function(page) {
    app.currentPage = page;
    
    // Update Sidebar Active State
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        // Pencocokan ID tombol navigasi di HTML
        if(btn.id === `btn-${page}`) btn.classList.add('active');
    });

    // Update Header Title
    const title = document.getElementById('page-title');
    if(title) title.innerText = page.toUpperCase().replace('-', ' ');

    renderPage(page);
};

function renderPage(page) {
    const container = document.getElementById('main-content');
    container.innerHTML = ''; // Clear Content

    switch(page) {
        case 'dashboard': renderDashboard(container); break;
        case 'input': renderInputForm(container); break;
        case 'data': renderDataList(container); break;
        // Tambahkan case lain jika HTML sidebar Anda punya menu lain
        default: renderDashboard(container);
    }
}

// 6. MODULES: DASHBOARD
function renderDashboard(container) {
    const p = app.data.patients;
    const stats = {
        total: p.length,
        rj: p.filter(x => x.program?.type === 'Rawat Jalan').length,
        ri: p.filter(x => x.program?.type === 'Rawat Inap').length,
        meds: p.reduce((acc, curr) => acc + (curr.medicine?.stock?.length || 0), 0)
    };

    const html = `
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            ${createCard('TOTAL PASIEN', stats.total, 'text-slate-800')}
            ${createCard('RAWAT JALAN', stats.rj, 'text-emerald-600')}
            ${createCard('RAWAT INAP', stats.ri, 'text-blue-600')}
            ${createCard('ITEM OBAT', stats.meds, 'text-orange-600')}
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96 relative">
                <h3 class="font-bold text-slate-700 mb-4">Statistik Kunjungan</h3>
                <canvas id="chartVisit"></canvas>
            </div>
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-teal-600">
                    <i class="fas fa-user-plus text-2xl"></i>
                </div>
                <h3 class="font-bold text-slate-800">Registrasi Cepat</h3>
                <p class="text-xs text-slate-400 mb-6">Input pasien baru ke database.</p>
                <button onclick="nav('input')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all">
                    INPUT DATA
                </button>
            </div>
        </div>
    `;
    container.innerHTML = html;
    initChart();
}

function createCard(title, value, color) {
    return `
        <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${title}</div>
            <div class="text-4xl font-black ${color}">${value}</div>
        </div>`;
}

function initChart() {
    const ctx = document.getElementById('chartVisit');
    if(!ctx) return;
    
    if(app.chart) app.chart.destroy();
    
    // Dummy Data Dinamis (Bisa dikembangkan real data nanti)
    app.chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
            datasets: [{
                label: 'Pasien',
                data: [10, 25, 15, 30, 20, app.data.patients.length],
                borderColor: '#0d9488',
                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// 7. MODULES: INPUT FORM (ADD & EDIT)
function renderInputForm(container, editId = null) {
    app.currentEditId = editId;
    let data = {};
    if(editId) {
        data = app.data.patients.find(p => p.id === editId) || {};
    }

    const val = (path) => {
        return path || '';
    };

    const html = `
        <div class="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 max-w-4xl mx-auto animate-fade-in">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-2xl font-black text-slate-800">${editId ? 'EDIT DATA PASIEN' : 'REGISTRASI PASIEN BARU'}</h2>
                ${editId ? `<button onclick="nav('data')" class="text-slate-400 hover:text-red-500"><i class="fas fa-times"></i> Batal</button>` : ''}
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label class="block text-xs font-bold text-slate-400 mb-1">NAMA LENGKAP</label>
                <input id="in_name" value="${val(data.reg?.name)}" class="input-field" placeholder="Nama Pasien"></div>
                
                <div><label class="block text-xs font-bold text-slate-400 mb-1">NO. REKAM MEDIS</label>
                <input id="in_rm" value="${val(data.reg?.rm)}" class="input-field" placeholder="No. RM"></div>
                
                <div><label class="block text-xs font-bold text-slate-400 mb-1">TANGGAL LAHIR</label>
                <input type="date" id="in_dob" value="${val(data.reg?.dob)}" class="input-field"></div>
                
                <div><label class="block text-xs font-bold text-slate-400 mb-1">PROGRAM</label>
                <select id="in_prog" class="input-field bg-white">
                    <option ${val(data.program?.type) === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                    <option ${val(data.program?.type) === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                    <option ${val(data.program?.type) === 'Konseling' ? 'selected' : ''}>Konseling</option>
                </select></div>
            </div>

            <div class="mt-6 border-t pt-6">
                <label class="block text-xs font-bold text-slate-400 mb-2">CATATAN AWAL / DIAGNOSA MASUK</label>
                <textarea id="in_diag" class="input-field h-24" placeholder="Keterangan kondisi pasien...">${val(data.diagnosis?.text)}</textarea>
            </div>

            <div class="mt-8 pt-6 border-t flex justify-end gap-3">
                <button onclick="submitData()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all active:scale-95">
                    <i class="fas fa-save mr-2"></i> ${editId ? 'UPDATE DATA' : 'SIMPAN DATA'}
                </button>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

async function submitData() {
    const name = document.getElementById('in_name').value;
    const rm = document.getElementById('in_rm').value;
    
    if(!name || !rm) {
        return Swal.fire('Data Tidak Lengkap', 'Nama dan No RM wajib diisi!', 'warning');
    }

    const payload = {
        id: app.currentEditId || Date.now().toString(),
        reg: {
            name: name,
            rm: rm,
            dob: document.getElementById('in_dob').value,
            last_update: new Date().toLocaleString()
        },
        program: {
            type: document.getElementById('in_prog').value
        },
        // Preserve existing data if editing, else new structure
        diagnosis: app.currentEditId ? 
            { ...app.data.patients.find(p=>p.id===app.currentEditId).diagnosis, text: document.getElementById('in_diag').value } : 
            { text: document.getElementById('in_diag').value },
        medicine: app.currentEditId ? app.data.patients.find(p=>p.id===app.currentEditId).medicine : { stock: [], logs: [] },
        history: {}, files: [], ttv: [], visits: [], crisis: { bpss: [] }
    };

    if(app.currentEditId) {
        const idx = app.data.patients.findIndex(p => p.id === app.currentEditId);
        app.data.patients[idx] = payload;
    } else {
        app.data.patients.push(payload);
    }

    await saveData();
    Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data tersimpan di Database.', timer: 1500, showConfirmButton: false });
    nav('data');
}

// 8. MODULES: DATA LIST & SEARCH
function renderDataList(container) {
    const rows = app.data.patients.map((p, i) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group search-item" onclick="openDetailModal('${p.id}')">
            <td class="p-4 font-bold text-slate-400">#${i + 1}</td>
            <td class="p-4 font-bold text-slate-800 group-hover:text-teal-600">${p.reg.name}</td>
            <td class="p-4 text-slate-500 font-mono text-xs">${p.reg.rm}</td>
            <td class="p-4">
                <span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide 
                ${p.program.type === 'Rawat Inap' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}">
                ${p.program.type}
                </span>
            </td>
            <td class="p-4 text-right" onclick="event.stopPropagation()">
                <button onclick="editPatient('${p.id}')" class="text-amber-500 hover:bg-amber-50 p-2 rounded-lg mr-1"><i class="fas fa-edit"></i></button>
                <button onclick="deletePatient('${p.id}')" class="text-red-500 hover:bg-red-50 p-2 rounded-lg"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    const html = `
        <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
            <div class="p-6 border-b border-slate-100 flex gap-4 items-center bg-slate-50/50">
                <i class="fas fa-search text-slate-400"></i>
                <input type="text" id="global-search" onkeyup="searchFilter()" placeholder="Cari nama atau No RM..." class="bg-transparent w-full outline-none font-medium text-slate-600">
            </div>
            <div class="overflow-auto flex-1">
                <table class="w-full text-left text-sm">
                    <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                        <tr>
                            <th class="p-4">No</th>
                            <th class="p-4">Nama Pasien</th>
                            <th class="p-4">No. RM</th>
                            <th class="p-4">Program</th>
                            <th class="p-4 text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-body">
                        ${rows || '<tr><td colspan="5" class="p-10 text-center text-slate-300">Belum ada data.</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

function searchFilter() {
    const q = document.getElementById('global-search').value.toLowerCase();
    document.querySelectorAll('.search-item').forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(q) ? '' : 'none';
    });
}

function editPatient(id) {
    renderInputForm(document.getElementById('main-content'), id);
}

async function deletePatient(id) {
    const result = await Swal.fire({
        title: 'Hapus Data?',
        text: "Data tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Ya, Hapus'
    });

    if (result.isConfirmed) {
        app.data.patients = app.data.patients.filter(p => p.id !== id);
        await saveData();
        renderDataList(document.getElementById('main-content'));
        Swal.fire('Terhapus!', '', 'success');
    }
}

// 9. MODULES: DETAIL MODAL (With Stock & Signature)
window.openDetailModal = function(id) {
    const p = app.data.patients.find(x => x.id === id);
    if(!p) return;

    const modal = document.getElementById('modal-container');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');
    
    title.innerText = `${p.reg.name} (${p.reg.rm})`;
    
    // Render Modal Content (Tabs Concept)
    body.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 h-full overflow-y-auto pr-2">
            <div>
                <h4 class="font-bold text-slate-700 mb-3 border-b pb-2">STOK OBAT</h4>
                <div class="flex gap-2 mb-3">
                    <input id="md_name" class="input-field py-1 text-xs" placeholder="Nama Obat">
                    <input id="md_qty" type="number" class="input-field py-1 text-xs w-20" placeholder="Jml">
                    <button onclick="addMed('${id}')" class="bg-teal-600 text-white px-3 rounded-lg text-xs">+</button>
                </div>
                <div class="space-y-2 max-h-60 overflow-y-auto">
                    ${p.medicine.stock.map((m, i) => `
                        <div class="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                            <span class="text-xs font-bold text-slate-700">${m.name}</span>
                            <div class="flex items-center gap-2">
                                <span class="text-xs ${m.qty < 7 ? 'text-red-500 font-bold' : 'text-slate-500'}">Stok: ${m.qty}</span>
                                <button onclick="modMed('${id}', ${i}, -1)" class="w-6 h-6 bg-red-100 text-red-600 rounded text-xs">-</button>
                                <button onclick="modMed('${id}', ${i}, 1)" class="w-6 h-6 bg-emerald-100 text-emerald-600 rounded text-xs">+</button>
                            </div>
                        </div>
                    `).join('')}
                    ${p.medicine.stock.length === 0 ? '<p class="text-xs text-slate-400 italic">Belum ada obat.</p>' : ''}
                </div>
            </div>

            <div>
                <h4 class="font-bold text-slate-700 mb-3 border-b pb-2">DIAGNOSA & VALIDASI</h4>
                <textarea id="det_diag" class="input-field h-24 text-xs mb-3" placeholder="Update diagnosa...">${p.diagnosis.text || ''}</textarea>
                
                <div class="border-2 border-dashed border-slate-300 rounded-xl h-32 relative bg-slate-50 mb-2">
                    ${p.diagnosis.signature ? `<img src="${p.diagnosis.signature}" class="absolute inset-0 w-full h-full object-contain z-0">` : ''}
                    <canvas id="det_sig" class="absolute inset-0 w-full h-full z-10 cursor-crosshair opacity-0 hover:opacity-100 transition-opacity"></canvas>
                    <div class="absolute bottom-1 right-1 text-[9px] text-slate-400">Area Tanda Tangan</div>
                </div>
                
                <div class="flex gap-2">
                    <button onclick="saveDetail('${id}')" class="flex-1 bg-teal-600 text-white py-2 rounded-lg text-xs font-bold">SIMPAN PERUBAHAN</button>
                    <button onclick="clearSig()" class="px-3 border text-red-500 rounded-lg text-xs">Hapus TTD</button>
                </div>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.style.display = 'flex';

    // Init Signature Pad
    setTimeout(() => {
        const cvs = document.getElementById('det_sig');
        if(cvs) {
            cvs.width = cvs.offsetWidth;
            cvs.height = cvs.offsetHeight;
            app.signaturePad = new SignaturePad(cvs);
        }
    }, 200);
};

window.app.closeModal = function() {
    const modal = document.getElementById('modal-container');
    modal.classList.add('hidden');
    modal.style.display = 'none';
};

// 10. MODULES: DETAIL LOGIC
async function addMed(pid) {
    const n = document.getElementById('md_name').value;
    const q = parseInt(document.getElementById('md_qty').value);
    
    if(n && q) {
        const p = app.data.patients.find(x => x.id === pid);
        p.medicine.stock.push({ name: n, qty: q });
        await saveData();
        openDetailModal(pid); // Refresh Modal
    }
}

async function modMed(pid, idx, val) {
    const p = app.data.patients.find(x => x.id === pid);
    p.medicine.stock[idx].qty += val;
    if(p.medicine.stock[idx].qty < 0) p.medicine.stock[idx].qty = 0;
    await saveData();
    openDetailModal(pid);
}

async function saveDetail(pid) {
    const p = app.data.patients.find(x => x.id === pid);
    p.diagnosis.text = document.getElementById('det_diag').value;
    
    if(app.signaturePad && !app.signaturePad.isEmpty()) {
        p.diagnosis.signature = app.signaturePad.toDataURL();
    }
    
    await saveData();
    Swal.fire({ icon: 'success', title: 'Tersimpan', toast: true, position: 'top-end', timer: 1000, showConfirmButton: false });
}

function clearSig() {
    if(app.signaturePad) app.signaturePad.clear();
}

// 11. EXPORT & ALERTS
window.app.exportAllExcel = function() {
    if(typeof XLSX === 'undefined') return Swal.fire('Error', 'Library Excel Error', 'error');
    if(app.data.patients.length === 0) return Swal.fire('Info', 'Data kosong', 'info');

    const data = app.data.patients.map(p => ({
        NAMA: p.reg.name,
        RM: p.reg.rm,
        PROGRAM: p.program.type,
        DIAGNOSA: p.diagnosis.text || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Database MMRC");
    XLSX.writeFile(wb, "MMRC_Export.xlsx");
};

function checkStockAlert() {
    const low = [];
    app.data.patients.forEach(p => {
        p.medicine.stock.forEach(m => {
            if(m.qty < 7) low.push(`${m.name} (${p.reg.name})`);
        });
    });

    if(low.length > 0) {
        Swal.fire({
            title: 'STOK MENIPIS!',
            html: `<ul style="text-align:left; font-size:12px;">${low.map(x=>`<li>${x}</li>`).join('')}</ul>`,
            icon: 'warning',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 5000
        });
    }
}
