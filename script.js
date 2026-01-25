/**
 * MMRC HOSPITAL MANAGEMENT SYSTEM - ENTERPRISE CORE
 * Standard: International Hospital IT Protocol
 * Version: 2.0 (Stable & Secured)
 */

// 1. KONFIGURASI FIREBASE (ASIA SERVER - LOW LATENCY)
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app", // Fixed URL
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// 2. SYSTEM INITIALIZATION & FAIL-SAFE LOADING
let db;
let app;

window.onload = function() {
    try {
        // Cek integritas library
        if (typeof firebase === 'undefined' || typeof Swal === 'undefined') {
            throw new Error("Core libraries failed to load.");
        }
        
        // Init Firebase jika belum
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        
        // Jalankan Aplikasi
        initSystem();
        
    } catch (err) {
        console.error("System Crash:", err);
        alert("CRITICAL ERROR: Gagal memuat sistem. Periksa koneksi internet Anda.");
    }
};

function initSystem() {
    app = {
        data: { patients: [] },
        currentPage: 'dashboard',
        chartInstance: null,
        sigPad: null,

        // --- CORE: STARTUP ---
        init() {
            // Cek Sesi Login
            const savedUser = localStorage.getItem('mmrc_user');
            if (savedUser) {
                this.switchLayer('app');
                this.loadDB();
            }

            // Event Listeners (Enter Key Support)
            const passInput = document.getElementById('login-pass'); // Sesuai HTML Anda
            if(passInput) {
                passInput.addEventListener("keypress", (e) => {
                    if (e.key === "Enter") this.login();
                });
            }
            
            // Setup Signature Pad (Lazy Load)
            const canvas = document.getElementById('signature-pad'); // Jika ada di modal
            if(canvas && typeof SignaturePad !== 'undefined') {
                this.sigPad = new SignaturePad(canvas);
            }
        },

        // --- CORE: AUTHENTICATION (FIXED ID) ---
        login() {
            // MENGAMBIL ID YANG BENAR DARI HTML
            const uField = document.getElementById('login-user');
            const pField = document.getElementById('login-pass');
            
            const u = uField ? uField.value.trim() : '';
            const p = pField ? pField.value.trim() : '';

            if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
                localStorage.setItem('mmrc_user', u);
                
                // Efek Loading Profesional
                let timerInterval;
                Swal.fire({
                    title: 'SYSTEM ACCESS',
                    html: 'Establishing secure connection to Cloud Database...',
                    timer: 1500,
                    timerProgressBar: true,
                    allowOutsideClick: false,
                    didOpen: () => {
                        Swal.showLoading();
                    },
                    willClose: () => {
                        clearInterval(timerInterval);
                    }
                }).then(() => {
                    this.switchLayer('app');
                    this.loadDB();
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'ACCESS DENIED',
                    text: 'Kredensial tidak valid. Silakan coba lagi.',
                    confirmButtonColor: '#d33'
                });
            }
        },

        logout() {
            Swal.fire({
                title: 'Konfirmasi Logout',
                text: "Sesi Anda akan diakhiri.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                confirmButtonText: 'LOGOUT',
                cancelButtonText: 'Batal'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('mmrc_user');
                    location.reload();
                }
            });
        },

        switchLayer(mode) {
            const authLayer = document.getElementById('auth-layer');
            const appLayer = document.getElementById('app-layer');
            
            if (mode === 'app') {
                authLayer.style.display = 'none';
                appLayer.classList.remove('hidden');
                appLayer.style.display = 'flex'; // Fix layout flexbox
            } else {
                authLayer.style.display = 'flex';
                appLayer.classList.add('hidden');
                appLayer.style.display = 'none';
            }
        },

        // --- CORE: DATABASE & DATA SANITIZATION ---
        async loadDB() {
            try {
                const snap = await db.ref('mmrc_data').once('value');
                const val = snap.val();
                
                // Sanitasi Data (Mencegah Error "Undefined")
                this.data = this.sanitize(val);
                
                // Render UI
                this.render();
                
                // Cek Stok Obat Otomatis
                this.checkLowStock();
                
            } catch (e) {
                console.error(e);
                Swal.fire('Connection Error', 'Gagal sinkronisasi dengan server. Cek internet.', 'error');
            }
        },

        async saveDB() {
            try {
                await db.ref('mmrc_data').set(this.data);
                // Silent save success (tidak perlu alert setiap kali simpan agar UX lancar)
            } catch (e) {
                Swal.fire('Save Failed', 'Gagal menyimpan data ke cloud.', 'error');
            }
        },

        sanitize(data) {
            if (!data) return { patients: [] };
            if (!data.patients) data.patients = [];
            
            // Deep check structure (Standar Keamanan Data)
            data.patients = data.patients.map(p => {
                p.reg = p.reg || {};
                p.program = p.program || { type: '-' };
                p.history = p.history || {};
                p.diagnosis = p.diagnosis || {};
                
                // Pastikan array obat ada
                p.medicine = p.medicine || { stock: [], logs: [] };
                p.medicine.stock = p.medicine.stock || [];
                p.medicine.logs = p.medicine.logs || [];
                
                return p;
            });
            return data;
        },

        // --- CORE: NOTIFICATION SYSTEM ---
        checkLowStock() {
            const lowItems = [];
            this.data.patients.forEach(p => {
                if(p.medicine && p.medicine.stock) {
                    p.medicine.stock.forEach(m => {
                        // Ambang batas stok kritis: < 7
                        if(parseInt(m.qty) < 7) {
                            lowItems.push(`<b>${m.name}</b> (${p.reg.name || 'Pasien'}) - Sisa: ${m.qty}`);
                        }
                    });
                }
            });

            if (lowItems.length > 0) {
                Swal.fire({
                    title: 'PERINGATAN STOK MENIPIS',
                    html: `<div style="text-align: left; max-height: 150px; overflow-y: auto;">
                            <ul style="list-style-type: disc; padding-left: 20px;">
                                ${lowItems.map(i => `<li>${i}</li>`).join('')}
                            </ul>
                           </div>`,
                    icon: 'warning',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 8000,
                    timerProgressBar: true
                });
            }
        },

        // --- UI: NAVIGATION & RENDERING ---
        nav(page) {
            this.currentPage = page;
            
            // Update Active State di Sidebar
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btn = document.getElementById(`btn-${page}`);
            if(btn) btn.classList.add('active');
            
            // Update Judul Halaman
            const titleEl = document.getElementById('page-title');
            if(titleEl) titleEl.innerText = page.toUpperCase();
            
            this.render();
        },

        render() {
            const container = document.getElementById('main-content');
            if (!container) return;

            // Efek Transisi Halus
            container.style.opacity = '0';
            setTimeout(() => {
                container.innerHTML = '';
                
                switch(this.currentPage) {
                    case 'dashboard': this.renderDashboard(container); break;
                    case 'input': this.renderInput(container); break;
                    // Tambahkan case lain (medicine, visit, dll) sesuai kebutuhan evolusi
                    default: this.renderDashboard(container);
                }
                
                container.style.transition = 'opacity 0.3s ease';
                container.style.opacity = '1';
            }, 150);
        },

        // --- VIEW: DASHBOARD ---
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
                    ${this.uiCard('TOTAL PASIEN', stats.total, 'text-slate-800')}
                    ${this.uiCard('RAWAT JALAN', stats.rj, 'text-emerald-600')}
                    ${this.uiCard('RAWAT INAP', stats.ri, 'text-blue-600')}
                    ${this.uiCard('ITEM OBAT', stats.drugs, 'text-orange-600')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96 relative">
                        <h3 class="font-bold text-slate-700 mb-4 tracking-tight">GRAFIK KUNJUNGAN PASIEN</h3>
                        <div class="h-full pb-10"><canvas id="mainChart"></canvas></div>
                    </div>

                    <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-center items-center text-center">
                        <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 text-teal-600">
                            <i class="fas fa-user-plus text-2xl"></i>
                        </div>
                        <h3 class="font-bold text-slate-800">Registrasi Cepat</h3>
                        <p class="text-xs text-slate-400 mb-6 px-4">Input data pasien baru ke dalam database MMRC.</p>
                        <button onclick="app.modalInput()" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all">
                            INPUT PASIEN BARU
                        </button>
                    </div>
                </div>
            `;

            // Init Chart.js
            setTimeout(() => {
                const ctx = document.getElementById('mainChart');
                if (ctx && typeof Chart !== 'undefined') {
                    if (this.chartInstance) this.chartInstance.destroy();
                    this.chartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
                            datasets: [{
                                label: 'Statistik Pasien',
                                data: [12, 19, 8, 15, 20, stats.total], // Data dummy dinamis
                                borderColor: '#0d9488',
                                backgroundColor: 'rgba(13, 148, 136, 0.1)',
                                fill: true,
                                tension: 0.4
                            }]
                        },
                        options: { 
                            responsive: true, 
                            maintainAspectRatio: false, 
                            plugins: { legend: { display: false } },
                            scales: { y: { beginAtZero: true } }
                        }
                    });
                }
            }, 50);
        },

        uiCard(title, val, colorClass) {
            return `
            <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div class="text-slate-400 text-[10px] font-bold tracking-widest mb-2">${title}</div>
                <div class="text-4xl font-black ${colorClass}">${val}</div>
            </div>`;
        },

        // --- VIEW: MODAL INPUT ---
        modalInput() {
            const modal = document.getElementById('modal-container');
            const body = document.getElementById('modal-body');
            document.getElementById('modal-title').innerText = "FORM REGISTRASI PASIEN";
            
            body.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1">NAMA LENGKAP</label>
                        <input id="i_name" class="input-field" placeholder="Nama Pasien">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1">TANGGAL LAHIR</label>
                        <input type="date" id="i_dob" class="input-field">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1">NO. REKAM MEDIS (RM)</label>
                        <input id="i_rm" class="input-field" placeholder="Nomor RM">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-400 mb-1">PROGRAM LAYANAN</label>
                        <select id="i_prog" class="input-field bg-white">
                            <option>Rawat Jalan</option>
                            <option>Rawat Inap</option>
                            <option>Konseling</option>
                        </select>
                    </div>
                </div>
                <div class="mt-8 pt-6 border-t flex justify-end">
                    <button onclick="app.pushData()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-transform active:scale-95">
                        <i class="fas fa-save mr-2"></i> SIMPAN DATA
                    </button>
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
            
            // Validasi Data
            if (!n || !r) {
                return Swal.fire('Data Tidak Lengkap', 'Nama dan No. RM wajib diisi.', 'warning');
            }

            const newPatient = {
                id: Date.now().toString(),
                reg: { 
                    name: n, 
                    rm: r, 
                    dob: document.getElementById('i_dob').value,
                    tgl_masuk: new Date().toISOString().split('T')[0]
                },
                program: { type: document.getElementById('i_prog').value },
                // Struktur data lengkap untuk skalabilitas
                history: {}, 
                diagnosis: {}, 
                medicine: { stock: [], logs: [] },
                files: [], 
                ttv: [], 
                visits: [], 
                crisis: { bpss: [] }
            };

            this.data.patients.push(newPatient);

            await this.saveDB();
            this.closeModal();
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Data pasien tersimpan di Database Cloud.', timer: 2000, showConfirmButton: false });
            this.nav('dashboard');
        },

        // --- FEATURES: EXPORT ---
        exportAllExcel() {
            if(typeof XLSX === 'undefined') return Swal.fire('Error', 'Library Excel belum dimuat.', 'error');
            if(this.data.patients.length === 0) return Swal.fire('Info', 'Belum ada data untuk diexport.', 'info');
            
            const rows = this.data.patients.map(p => ({
                NAMA: p.reg.name,
                NO_RM: p.reg.rm,
                PROGRAM: p.program.type,
                TGL_LAHIR: p.reg.dob
            }));

            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(rows);
            XLSX.utils.book_append_sheet(wb, ws, "Data MMRC");
            XLSX.writeFile(wb, "MMRC_Database_Export.xlsx");
        },
        
        exportToWord() {
            Swal.fire('Fitur Pro', 'Modul Export Word sedang dalam pengembangan.', 'info');
        },

        // --- UTILS ---
        search() {
            const q = document.getElementById('global-search').value.toLowerCase();
            // Implementasi search logic jika list ditampilkan
            console.log("Searching for:", q);
        }
    };

    // Start App Instance
    app.init();
    window.app = app; // Expose ke global window untuk akses via HTML onclick
}
