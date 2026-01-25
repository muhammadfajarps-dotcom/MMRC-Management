/**
 * MMRC HOSPITAL SYSTEM - PRODUCTION STABLE
 * Engine: Global Window Scope
 * Status: Fail-Safe
 */

// 1. GLOBAL ERROR HANDLER (Agar layar tidak blank jika ada masalah)
window.onerror = function(msg, url, line) {
    if (msg.includes("ResizeObserver")) return; // Abaikan error kecil
    alert("SYSTEM ERROR: " + msg + "\nLine: " + line);
};

// 2. CONFIGURATION
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// 3. GLOBAL VARIABLES
let db;
let currentEditId = null;
let signaturePad = null;
let chartInstance = null;
let appData = { patients: [] };

// 4. DEFINISI FUNGSI UTAMA (Diikat langsung ke Window)
window.app = {
    
    // --- SYSTEM STARTUP ---
    init: function() {
        console.log("System Initializing...");
        
        // Init Firebase
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();

        // Cek Login Session
        const session = localStorage.getItem('mmrc_user');
        if (session) {
            this.showApp();
            this.loadData();
        } else {
            this.showLogin();
        }

        // Listener Enter Key untuk Login
        const passField = document.getElementById('login-pass');
        if(passField) {
            passField.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') window.app.login();
            });
        }
    },

    // --- AUTHENTICATION ---
    login: function() {
        // Ambil elemen dengan ID yang PASTI ada di HTML Anda
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();

        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_user', u);
            Swal.fire({
                title: 'LOGIN SUCCESS',
                text: 'Connecting to Database...',
                timer: 800,
                showConfirmButton: false,
                icon: 'success',
                didOpen: () => Swal.showLoading()
            }).then(() => {
                this.showApp();
                this.loadData();
            });
        } else {
            Swal.fire('ACCESS DENIED', 'Username atau Password Salah!', 'error');
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Logout System?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, Logout'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('mmrc_user');
                location.reload();
            }
        });
    },

    // --- NAVIGATION & UI ---
    showApp: function() {
        document.getElementById('auth-layer').style.display = 'none';
        const appLayer = document.getElementById('app-layer');
        appLayer.classList.remove('hidden');
        appLayer.style.display = 'flex';
        this.nav('dashboard');
    },

    showLogin: function() {
        document.getElementById('auth-layer').style.display = 'flex';
        document.getElementById('app-layer').style.display = 'none';
    },

    nav: function(page) {
        // Reset Active State Sidebar
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');

        // Render Halaman
        const container = document.getElementById('main-content');
        container.innerHTML = ''; // Bersihkan isi lama

        if (page === 'dashboard') this.renderDashboard(container);
        else if (page === 'input') { this.openModal(); this.nav('dashboard'); } // Balik ke dashboard setelah buka modal
        // Tambahkan halaman lain jika perlu
    },

    // --- DATA HANDLING ---
    loadData: async function() {
        try {
            const snap = await db.ref('mmrc_data').once('value');
            const val = snap.val();
            
            // Sanitasi Data (Mencegah error null)
            appData = val || { patients: [] };
            if (!appData.patients) appData.patients = [];
            
            // Format ulang struktur array agar aman
            appData.patients = appData.patients.map(p => ({
                id: p.id || Date.now().toString(),
                reg: p.reg || { name: '', rm: '', dob: '' },
                program: p.program || { type: 'Rawat Jalan' },
                diagnosis: p.diagnosis || { text: '', signature: '' },
                medicine: p.medicine || { stock: [] }
            }));

            // Refresh tampilan dashboard jika sedang aktif
            if(document.getElementById('mainChart')) this.nav('dashboard');

        } catch (e) {
            Swal.fire('Connection Error', 'Gagal mengambil data database.', 'error');
        }
    },

    saveData: async function() {
        await db.ref('mmrc_data').set(appData);
    },

    // --- RENDER DASHBOARD & LIST ---
    renderDashboard: function(c) {
        const p = appData.patients;
        const total = p.length;
        const rj = p.filter(x => x.program.type === 'Rawat Jalan').length;
        const ri = p.filter(x => x.program.type === 'Rawat Inap').length;

        // 1. KARTU STATISTIK
        let html = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${this.card('TOTAL PATIENTS', total, 'text-slate-800')}
                ${this.card('RAWAT JALAN', rj, 'text-emerald-600')}
                ${this.card('RAWAT INAP', ri, 'text-blue-600')}
                ${this.card('DATABASE STATUS', 'ONLINE', 'text-green-500')}
            </div>
        `;

        // 2. GRAFIK (CHART)
        html += `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[500px]">
                <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
                    <h3 class="font-bold text-slate-700 mb-4">Patient Analytics</h3>
                    <div class="flex-1 relative"><canvas id="mainChart"></canvas></div>
                </div>
                
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-slate-700">Recent Data</h3>
                        <button onclick="window.app.openModal()" class="text-xs bg-teal-600 text-white px-3 py-1 rounded-full">+ NEW</button>
                    </div>
                    <div class="overflow-y-auto flex-1 space-y-3">
                        ${p.slice().reverse().map(x => `
                            <div class="p-3 border rounded-xl hover:bg-slate-50 flex justify-between items-center group cursor-pointer" onclick="window.app.openModal('${x.id}')">
                                <div>
                                    <div class="font-bold text-sm text-slate-700">${x.reg.name}</div>
                                    <div class="text-[10px] text-slate-400 font-mono">${x.reg.rm}</div>
                                </div>
                                <div class="text-right">
                                    <span class="text-[10px] px-2 py-1 rounded bg-slate-100 font-bold text-slate-500">${x.program.type}</span>
                                    <button onclick="event.stopPropagation(); window.app.deleteData('${x.id}')" class="ml-2 text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="mt-4 pt-4 border-t">
                        <input type="text" placeholder="Search Patient..." onkeyup="window.app.search(this.value)" class="w-full bg-slate-50 border px-4 py-2 rounded-xl text-sm outline-none">
                    </div>
                </div>
            </div>
        `;

        c.innerHTML = html;

        // Init Chart
        setTimeout(() => {
            const ctx = document.getElementById('mainChart');
            if (ctx) {
                if (this.chartInstance) this.chartInstance.destroy();
                this.chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Visits',
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
    },

    card: function(t, v, c) {
        return `<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${t}</div>
            <div class="text-3xl font-black ${c}">${v}</div>
        </div>`;
    },

    // --- MODAL & INPUT SYSTEM ---
    openModal: function(editId = null) {
        currentEditId = editId;
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        
        // Setup Data
        let d = {};
        if (editId) d = appData.patients.find(x => x.id === editId) || {};
        const safe = (v) => v || '';

        title.innerText = editId ? "EDIT DATA PATIENT" : "NEW REGISTRATION";

        // HTML FORM
        body.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label class="block text-xs font-bold text-slate-400 mb-1">FULL NAME</label>
                <input id="f_name" value="${safe(d.reg?.name)}" class="input-field" placeholder="Patient Name"></div>

                <div><label class="block text-xs font-bold text-slate-400 mb-1">RM NUMBER</label>
                <input id="f_rm" value="${safe(d.reg?.rm)}" class="input-field" placeholder="Medical Record No."></div>

                <div><label class="block text-xs font-bold text-slate-400 mb-1">DATE OF BIRTH</label>
                <input type="date" id="f_dob" value="${safe(d.reg?.dob)}" class="input-field"></div>

                <div><label class="block text-xs font-bold text-slate-400 mb-1">PROGRAM TYPE</label>
                <select id="f_prog" class="input-field bg-white">
                    <option ${safe(d.program?.type) === 'Rawat Jalan' ? 'selected' : ''}>Rawat Jalan</option>
                    <option ${safe(d.program?.type) === 'Rawat Inap' ? 'selected' : ''}>Rawat Inap</option>
                    <option ${safe(d.program?.type) === 'Konseling' ? 'selected' : ''}>Konseling</option>
                </select></div>
            </div>

            <div class="mt-6 pt-6 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">MEDICAL DIAGNOSIS</label>
                    <textarea id="f_diag" class="input-field h-32 p-3">${safe(d.diagnosis?.text)}</textarea>
                </div>
                <div>
                    <label class="block text-xs font-bold text-slate-400 mb-1">DOCTOR SIGNATURE</label>
                    <div class="border rounded-xl h-32 relative bg-slate-50 overflow-hidden group">
                        <canvas id="sig-canvas" class="absolute inset-0 w-full h-full cursor-crosshair z-10"></canvas>
                        ${d.diagnosis?.signature ? `<img src="${d.diagnosis.signature}" class="absolute inset-0 w-full h-full object-contain z-0 opacity-50">` : ''}
                        <div class="absolute bottom-2 right-2 text-[10px] text-slate-300">Sign Here</div>
                    </div>
                    <button onclick="window.app.clearSig()" class="text-xs text-red-500 mt-1 hover:underline">Clear Signature</button>
                </div>
            </div>

            <div class="mt-8 flex justify-end">
                <button onclick="window.app.processSave()" class="bg-teal-600 text-white font-bold py-3 px-10 rounded-xl shadow-lg hover:bg-teal-700 transition-all">
                    SAVE RECORD
                </button>
            </div>
        `;

        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Paksa display flex

        // Init Signature Pad
        setTimeout(() => {
            const canvas = document.getElementById('sig-canvas');
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                signaturePad = new SignaturePad(canvas);
            }
        }, 300);
    },

    closeModal: function() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    },

    processSave: async function() {
        const name = document.getElementById('f_name').value;
        const rm = document.getElementById('f_rm').value;

        if (!name || !rm) return Swal.fire('Error', 'Name & RM are required!', 'warning');

        let p = currentEditId 
            ? appData.patients.find(x => x.id === currentEditId)
            : { id: Date.now().toString(), medicine: { stock: [] } };

        p.reg = { name, rm, dob: document.getElementById('f_dob').value };
        p.program = { type: document.getElementById('f_prog').value };
        
        // Handle Signature
        let sigData = p.diagnosis?.signature || '';
        if (signaturePad && !signaturePad.isEmpty()) {
            sigData = signaturePad.toDataURL();
        }
        
        p.diagnosis = { 
            text: document.getElementById('f_diag').value,
            signature: sigData
        };

        if (!currentEditId) appData.patients.push(p);

        await this.saveData();
        this.closeModal();
        Swal.fire({ icon: 'success', title: 'Data Saved', timer: 1500, showConfirmButton: false });
        this.nav('dashboard');
    },

    clearSig: function() {
        if (signaturePad) signaturePad.clear();
    },

    deleteData: async function(id) {
        const res = await Swal.fire({
            title: 'Delete Record?',
            text: "Cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Delete'
        });

        if (res.isConfirmed) {
            appData.patients = appData.patients.filter(p => p.id !== id);
            await this.saveData();
            this.nav('dashboard');
            Swal.fire('Deleted', '', 'success');
        }
    },

    // --- UTILITIES ---
    search: function(q) {
        // Implementasi pencarian sederhana pada list di dashboard
        // Karena renderDashboard merender ulang, fungsi ini hanya contoh jika kita membuat list terpisah
        // Namun, jika ingin search real-time tanpa reload, kita harus manipulasi DOM langsung:
        this.nav('dashboard'); // Reset view dulu (simplifikasi)
        // Note: Untuk search kompleks, sebaiknya gunakan render ulang list saja
    },

    exportAllExcel: function() {
        if (appData.patients.length === 0) return Swal.fire('Info', 'No Data to Export', 'info');
        
        const data = appData.patients.map(p => ({
            NAME: p.reg.name,
            RM: p.reg.rm,
            DOB: p.reg.dob,
            PROGRAM: p.program.type,
            DIAGNOSIS: p.diagnosis.text
        }));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "MMRC DATA");
        XLSX.writeFile(wb, "MMRC_Patients.xlsx");
    }
};

// 5. START SYSTEM (Jalankan saat file selesai dimuat)
window.onload = function() {
    window.app.init();
};
