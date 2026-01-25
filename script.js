// ============================================
// 1. CONFIGURATION (Enterprise Grade)
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    // URL DATABASE ASIA (FIXED)
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Initialize Firebase safely
let db;
try {
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.database();
} catch (e) {
    console.error("Firebase Init Error", e);
    alert("Database Connection Failed. Check Console.");
}

// ============================================
// 2. APP CONTROLLER
// ============================================
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    chartInstance: null,
    sigPad: null,

    // --- INITIALIZATION ---
    init() {
        // Cek sesi login yang tersimpan
        const savedUser = localStorage.getItem('mmrc_user');
        if (savedUser) {
            this.showAppLayer();
            this.loadDB();
        }

        // Setup Signature Pad (jika modal terbuka nanti)
        // Kita init dinamis saat modal dibuka saja
    },

    // --- LOGIN SYSTEM (FIXED IDs: login-user & login-pass) ---
    login() {
        // PERBAIKAN DI SINI: Menggunakan ID yang sesuai dengan HTML Anda
        const userField = document.getElementById('login-user');
        const passField = document.getElementById('login-pass');

        const u = userField ? userField.value : '';
        const p = passField ? passField.value : '';

        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            localStorage.setItem('mmrc_user', u);
            
            let timerInterval;
            Swal.fire({
                title: 'AUTHENTICATING',
                html: 'Connecting to Secure Database...',
                timer: 800,
                timerProgressBar: true,
                didOpen: () => Swal.showLoading(),
                willClose: () => clearInterval(timerInterval)
            }).then(() => {
                this.showAppLayer();
                this.loadDB();
            });
        } else {
            Swal.fire({ 
                icon: 'error', 
                title: 'ACCESS DENIED', 
                text: 'Invalid Username or Password',
                confirmButtonColor: '#d33'
            });
        }
    },

    logout() {
        Swal.fire({
            title: 'LOGOUT SYSTEM?',
            text: "Session will be terminated.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'LOGOUT'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('mmrc_user');
                location.reload();
            }
        });
    },

    showAppLayer() {
        document.getElementById('auth-layer').style.display = 'none'; // Pakai style display agar lebih pasti
        const appLayer = document.getElementById('app-layer');
        appLayer.classList.remove('hidden');
        appLayer.style.display = 'flex'; // Paksa flex agar layout tidak hancur
    },

    // --- DATABASE HANDLER ---
    async loadDB() {
        try {
            const snap = await db.ref('mmrc_data').once('value');
            const val = snap.val();
            this.data = this.sanitize(val);
            this.render();
            this.checkLowStock();
        } catch (e) {
            Swal.fire('CONNECTION ERROR', 'Failed to fetch data from Cloud.', 'error');
        }
    },

    async saveDB() {
        try {
            await db.ref('mmrc_data').set(this.data);
        } catch (e) {
            console.error("Save Error:", e);
        }
    },

    sanitize(data) {
        if (!data) return { patients: [] };
        if (!data.patients) data.patients = [];
        // Deep ensure structure
        data.patients = data.patients.map(p => {
            p.reg = p.reg || {};
            p.program = p.program || {};
            p.history = p.history || {};
            p.diagnosis = p.diagnosis || {};
            p.medicine = p.medicine || { stock: [], logs: [] };
            p.medicine.stock = p.medicine.stock || [];
            p.medicine.logs = p.medicine.logs || [];
            p.files = p.files || [];
            p.ttv = p.ttv || [];
            p.visits = p.visits || [];
            p.crisis = p.crisis || { bpss: [] };
            p.crisis.bpss = p.crisis.bpss || [];
            return p;
        });
        return data;
    },

    // --- NAVIGATION ---
    nav(page) {
        this.currentPage = page;
        // Update Active State Sidebar
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');
        
        // Update Title
        const titleEl = document.getElementById('page-title');
        if(titleEl) titleEl.innerText = page.toUpperCase();

        this.render();
    },

    // --- RENDER ENGINE ---
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        container.style.opacity = '0';
        setTimeout(() => {
            container.innerHTML = ''; // Clear content
            
            switch(this.currentPage) {
                case 'dashboard': this.renderDashboard(container); break;
                // case 'medicine': this.renderMedicine(container); break; 
                // Note: Fitur lain bisa diaktifkan sesuai kebutuhan, default ke dashboard dulu
                case 'input': this.renderInput(container); break;
                default: this.renderDashboard(container); // Fallback
            }
            
            container.style.transition = 'opacity 0.2s ease';
            container.style.opacity = '1';
        }, 100);
    },

    // 1. DASHBOARD VIEW
    renderDashboard(c) {
        const p = this.data.patients;
        const stats = {
            total: p.length,
            rj: p.filter(x => x.program?.type === 'Rawat Jalan').length,
            ri: p.filter(x => x.program?.type === 'Rawat Inap').length,
            drugs: p.reduce((acc, curr) => acc + (curr.medicine?.stock?.length || 0), 0)
        };

        c.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                ${this.card('TOTAL PATIENTS', stats.total, 'text-slate-800')}
                ${this.card('OUTPATIENT', stats.rj, 'text-emerald-600')}
                ${this.card('INPATIENT', stats.ri, 'text-blue-600')}
                ${this.card('DRUG INVENTORY', stats.drugs, 'text-orange-600')}
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96 relative">
                    <h3 class="font-bold text-slate-700 mb-4 tracking-tight">VISIT ANALYTICS</h3>
                    <div class="h-full pb-10"><canvas id="mainChart"></canvas></div>
                </div>

                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                    <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-teal-600">
                        <i class="fas fa-user-plus text-2xl"></i>
                    </div>
                    <h3 class="font-bold text-slate-800">New Patient</h3>
                    <p class="text-xs text-slate-400 mb-6 px-4">Register new patient entry to the database system.</p>
                    <button onclick="app.modalInput()" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all">
                        REGISTER NOW
                    </button>
                </div>
            </div>
        `;

        // Render Chart
        setTimeout(() => {
            const ctx = document.getElementById('mainChart');
            if (ctx && typeof Chart !== 'undefined') {
                if (this.chartInstance) this.chartInstance.destroy();
                this.chartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                        datasets: [{
                            label: 'Traffic',
                            data: [12, 19, 8, 15, 20, stats.total],
                            borderColor: '#0d9488',
                            backgroundColor: 'rgba(13, 148, 136, 0.1)',
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
                });
            }
        }, 50);
        
        this.checkLowStock();
    },

    card(title, val, color) {
        return `<div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${title}</div>
            <div class="text-4xl font-black ${color}">${val}</div>
        </div>`;
    },

    // --- MODAL & INPUT ---
    modalInput() {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        document.getElementById('modal-title').innerText = "NEW PATIENT REGISTRATION";
        
        body.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label class="block text-xs font-bold text-slate-400 mb-1">FULL NAME</label><input id="i_name" class="input-field w-full p-3 border rounded-xl" placeholder="Patient Name"></div>
                <div><label class="block text-xs font-bold text-slate-400 mb-1">DATE OF BIRTH</label><input type="date" id="i_dob" class="input-field w-full p-3 border rounded-xl"></div>
                <div><label class="block text-xs font-bold text-slate-400 mb-1">RM NUMBER</label><input id="i_rm" class="input-field w-full p-3 border rounded-xl" placeholder="Medical Record No."></div>
                <div><label class="block text-xs font-bold text-slate-400 mb-1">PROGRAM TYPE</label>
                    <select id="i_prog" class="input-field w-full p-3 border rounded-xl bg-white">
                        <option>Rawat Jalan</option><option>Rawat Inap</option><option>Konseling</option>
                    </select>
                </div>
            </div>
            <div class="mt-8 pt-6 border-t flex justify-end">
                <button onclick="app.pushData()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-transform active:scale-95">SAVE RECORD</button>
            </div>
        `;
        
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
    },

    closeModal() {
        const modal = document.getElementById('modal-container');
        modal.classList.add('hidden');
        modal.style.display = 'none';
    },

    async pushData() {
        const n = document.getElementById('i_name').value;
        const r = document.getElementById('i_rm').value;
        if (!n || !r) return Swal.fire('Validation Error', 'Fields cannot be empty.', 'warning');

        this.data.patients.push({
            id: Date.now().toString(),
            reg: { name: n, rm: r, dob: document.getElementById('i_dob').value },
            program: { type: document.getElementById('i_prog').value },
            history: {}, diagnosis: {}, medicine: { stock: [], logs: [] },
            files: [], ttv: [], visits: [], crisis: { bpss: [] }
        });

        await this.saveDB();
        this.closeModal();
        Swal.fire({ icon: 'success', title: 'Data Secured', timer: 1500, showConfirmButton: false });
        this.nav('dashboard');
    },

    // --- UTILITIES ---
    checkLowStock() {
        const low = [];
        this.data.patients.forEach(p => {
            if(p.medicine && p.medicine.stock) {
                p.medicine.stock.forEach(m => {
                    if(m.qty < 7) low.push(`${m.name} (${p.reg.name || 'Unknown'}): ${m.qty}`);
                });
            }
        });

        if(low.length > 0) {
            Swal.fire({
                title: 'CRITICAL STOCK ALERT (<7)',
                html: `<div class="text-left text-sm space-y-1 max-h-40 overflow-auto">${low.map(x => `<div class="text-red-600 font-bold">• ${x}</div>`).join('')}</div>`,
                icon: 'warning',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 6000,
                timerProgressBar: true
            });
        }
    },

    exportAllExcel() {
        if(typeof XLSX === 'undefined') return Swal.fire('Error', 'Library not loaded', 'error');
        if(this.data.patients.length === 0) return Swal.fire('Info', 'No data to export', 'info');
        
        const d = this.data.patients.map(p => ({ NAME: p.reg.name, RM: p.reg.rm, PROGRAM: p.program.type }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d), "MMRC_EXPORT");
        XLSX.writeFile(wb, "MMRC_DATABASE.xlsx");
    },
    
    exportToWord() {
        Swal.fire('Feature Info', 'Word export module under maintenance.', 'info');
    },

    search() {
        // Implementasi pencarian global bisa ditambahkan di sini
        const q = document.getElementById('global-search').value;
        console.log("Searching:", q);
    }
};

// --- SYSTEM BOOT ---
window.onload = function() {
    app.init();
    // Expose app to global window for HTML onclick events
    window.app = app;
};
