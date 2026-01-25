/**
 * MMRC HOSPITAL MANAGEMENT SYSTEM
 * Version: 2.0 (Stable/Production)
 * Fix: Global Scope Binding & Event Handling
 */

// ==========================================
// 1. CONFIGURATION & SETUP
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

// Initialize Firebase immediately
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// ==========================================
// 2. CORE APPLICATION (Global Scope)
// ==========================================
// Kita mendefinisikan window.app langsung agar HTML bisa membacanya segera
window.app = {
    db: typeof firebase !== 'undefined' ? firebase.database() : null,
    data: { patients: [] },
    currentPage: 'dashboard',
    sigPad: null,
    chartInstance: null,

    // --- AUTHENTICATION ---
    login: function() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();

        // Hardcoded Credentials sesuai request
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            document.getElementById('app-layer').style.display = 'flex';
            
            this.loadData(); // Load data from Firebase
            this.nav('dashboard'); // Masuk ke dashboard
            
            // Simpan sesi sederhana
            localStorage.setItem('mmrc_session', 'active');
        } else {
            Swal.fire({ icon: 'error', title: 'Akses Ditolak', text: 'Username atau Password Salah!' });
        }
    },

    logout: function() {
        Swal.fire({
            title: 'Keluar Sistem?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Keluar'
        }).then((result) => {
            if (result.isConfirmed) {
                localStorage.removeItem('mmrc_session');
                location.reload();
            }
        });
    },

    // --- DATABASE HANDLER ---
    loadData: async function() {
        Swal.fire({ title: 'Memuat Data...', didOpen: () => Swal.showLoading() });
        
        try {
            const snapshot = await this.db.ref('mmrc_data').once('value');
            const val = snapshot.val();
            
            if (val) {
                this.data = this.sanitizeData(val);
                console.log("Data Cloud Loaded:", this.data);
            } else {
                console.log("Data Kosong, inisialisasi baru.");
                this.data = { patients: [] };
            }
            
            Swal.close();
            this.render(); // Render halaman aktif
            
        } catch (error) {
            console.error("Firebase Error:", error);
            Swal.fire('Koneksi Error', 'Gagal mengambil data database.', 'error');
            // Fallback ke local storage jika ada
            const local = localStorage.getItem('mmrc_backup');
            if(local) {
                this.data = JSON.parse(local);
                this.render();
            }
        }
    },

    saveData: async function() {
        try {
            // Backup ke local dulu
            localStorage.setItem('mmrc_backup', JSON.stringify(this.data));
            // Save ke Cloud
            await this.db.ref('mmrc_data').set(this.data);
            console.log("Data Synced");
        } catch (e) {
            console.error("Save Error:", e);
            Swal.fire('Gagal Simpan', 'Periksa koneksi internet Anda', 'warning');
        }
    },

    // Mencegah error "Undefined" pada data lama
    sanitizeData: function(rawData) {
        if (!rawData.patients) rawData.patients = [];
        rawData.patients = rawData.patients.map(p => ({
            id: p.id || 'P-'+Date.now(),
            reg: p.reg || { name: 'Tanpa Nama', rm: '-' },
            history: p.history || {},
            diagnosis: p.diagnosis || {},
            medicine: p.medicine || { stock: [], logs: [] },
            ttv: p.ttv || [],
            visits: p.visits || [],
            crisis: p.crisis || { bpss: [] },
            program: p.program || { type: '-', duration: '-' },
            therapy: p.therapy || ''
        }));
        return rawData;
    },

    // --- NAVIGATION ---
    nav: function(pageId) {
        this.currentPage = pageId;
        
        // Update Sidebar Active State
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById('btn-' + pageId);
        if (activeBtn) activeBtn.classList.add('active');

        // Update Title Header
        const titles = {
            'dashboard': 'DASHBOARD UTAMA',
            'medicine': 'MANAJEMEN OBAT',
            'ttv': 'MONITORING TTV & GDS',
            'visit': 'VISIT DOKTER',
            'crisis': 'GRAFIK CRISIS & BPSS',
            'program': 'RENCANA PROGRAM',
            'therapy': 'CATATAN TERAPI'
        };
        document.getElementById('page-title').innerText = titles[pageId] || 'SYSTEM';

        // Render Content
        this.render();
    },

    // --- RENDER ENGINE (View Controller) ---
    render: function() {
        const container = document.getElementById('main-content');
        if (!container) return;
        
        container.innerHTML = ''; // Bersihkan layar

        switch (this.currentPage) {
            case 'dashboard': this.renderDashboard(container); break;
            case 'medicine': this.renderMedicine(container); break;
            case 'ttv': this.renderTTV(container); break;
            case 'visit': this.renderVisit(container); break;
            case 'crisis': this.renderCrisis(container); break;
            case 'program': this.renderProgram(container); break;
            case 'therapy': this.renderTherapy(container); break;
            default: container.innerHTML = '<div class="p-4">Halaman tidak ditemukan</div>';
        }
    },

    // ==========================================
    // 3. PAGE RENDERERS
    // ==========================================

    // --- DASHBOARD ---
    renderDashboard: function(c) {
        c.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <div class="grid grid-cols-3 gap-4 w-full max-w-2xl">
                    <div class="bg-teal-600 text-white p-4 rounded-2xl shadow-lg shadow-teal-200">
                        <div class="text-xs font-bold opacity-70">TOTAL PASIEN</div>
                        <div class="text-3xl font-black">${this.data.patients.length}</div>
                    </div>
                    <div class="bg-white text-slate-700 p-4 rounded-2xl border shadow-sm">
                        <div class="text-xs font-bold opacity-70">RAWAT INAP</div>
                        <div class="text-3xl font-black">${this.data.patients.filter(p=>p.program.type==='Rawat Inap').length}</div>
                    </div>
                    <div class="bg-white text-slate-700 p-4 rounded-2xl border shadow-sm">
                        <div class="text-xs font-bold opacity-70">RAWAT JALAN</div>
                        <div class="text-3xl font-black">${this.data.patients.filter(p=>p.program.type==='Rawat Jalan').length}</div>
                    </div>
                </div>
                <button onclick="app.modalForm('patient')" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all flex items-center gap-2">
                    <i class="fas fa-user-plus"></i> REGISTRASI BARU
                </button>
            </div>

            <div class="grid grid-cols-1 gap-6">
                ${this.data.patients.length === 0 ? '<div class="text-center p-10 text-slate-400">Belum ada data pasien. Silakan Registrasi.</div>' : ''}
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl border hover:shadow-md transition-shadow search-item">
                        <div class="flex items-start gap-4">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-20 h-20 rounded-2xl object-cover border bg-slate-100">
                            <div class="flex-1">
                                <div class="flex justify-between">
                                    <h3 class="font-bold text-lg text-slate-800">${p.reg.name}</h3>
                                    <span class="text-xs bg-slate-100 px-2 py-1 rounded font-mono">${p.reg.rm || 'No-RM'}</span>
                                </div>
                                <div class="text-xs text-slate-500 mt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                                    <p><i class="fas fa-birthday-cake w-4"></i> ${p.reg.ttl || '-'}</p>
                                    <p><i class="fas fa-briefcase w-4"></i> ${p.reg.job || '-'}</p>
                                    <p><i class="fas fa-map-marker-alt w-4"></i> ${p.reg.addr || '-'}</p>
                                    <p><i class="fas fa-user-shield w-4"></i> ${p.reg.guardian || '-'}</p>
                                </div>
                                <div class="mt-3 flex gap-2">
                                    <button onclick="app.modalForm('patient', '${p.id}')" class="text-xs bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg font-bold border border-amber-200">EDIT DATA</button>
                                    <button onclick="app.deletePatient('${p.id}')" class="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold border border-red-200">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- MEDICINE ---
    renderMedicine: function(c) {
        c.innerHTML = this.data.patients.map(p => {
            const med = p.medicine || {stock:[], logs:[]};
            return `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <div class="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 class="font-bold text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.modalForm('stock', '${p.id}')" class="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold">+ TAMBAH OBAT</button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="text-xs font-bold text-slate-400 uppercase mb-2">Stok Tersedia</h4>
                        <div class="space-y-2">
                            ${(med.stock||[]).map((s, idx) => `
                                <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border">
                                    <div>
                                        <div class="font-bold text-sm text-slate-700">${s.name}</div>
                                        <div class="text-[10px] text-slate-400">Exp: ${s.exp || '-'}</div>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <div class="text-right">
                                            <div class="font-black text-lg ${s.qty < 5 ? 'text-red-500' : 'text-teal-600'}">${s.qty}</div>
                                            <div class="text-[8px] uppercase">Sisa</div>
                                        </div>
                                        <button onclick="app.useMedicine('${p.id}', ${idx})" class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-center">
                                            <i class="fas fa-check"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                            ${med.stock.length === 0 ? '<p class="text-xs italic text-slate-400">Belum ada data obat</p>' : ''}
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-slate-400 uppercase mb-2">Riwayat Minum</h4>
                        <div class="h-48 overflow-y-auto border rounded-xl bg-slate-50 p-2">
                            <table class="w-full text-[10px]">
                                <thead class="text-left text-slate-400"><tr><th class="p-1">Waktu</th><th class="p-1">Obat</th><th class="p-1">PJ</th></tr></thead>
                                <tbody>
                                    ${(med.logs||[]).map(l => `
                                        <tr class="border-b border-slate-200">
                                            <td class="p-1 font-mono text-slate-500">${l.time}</td>
                                            <td class="p-1 font-bold text-slate-700">${l.name}</td>
                                            <td class="p-1">${l.pj}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join('');
    },

    // --- TTV ---
    renderTTV: function(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-800">${p.reg.name}</h3>
                    <button onclick="app.modalForm('ttv', '${p.id}')" class="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold">+ INPUT DATA</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-slate-50 text-slate-500 font-bold">
                            <tr><th class="p-3 rounded-l-xl">Waktu</th><th>TD (mmHg)</th><th>Nadi</th><th>Suhu</th><th>RR</th><th>GDS</th><th class="p-3 rounded-r-xl">Aksi</th></tr>
                        </thead>
                        <tbody>
                            ${(p.ttv||[]).map((t, idx) => `
                                <tr class="border-b">
                                    <td class="p-3 font-mono">${t.date}</td>
                                    <td class="p-3 font-bold text-slate-700">${t.td}</td>
                                    <td class="p-3">${t.nadi}</td>
                                    <td class="p-3">${t.suhu}</td>
                                    <td class="p-3">${t.rr}</td>
                                    <td class="p-3 font-bold text-amber-600">${t.gds}</td>
                                    <td class="p-3"><button onclick="app.deleteSubItem('${p.id}', 'ttv', ${idx})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
    },

    // --- VISIT ---
    renderVisit: function(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-slate-800">${p.reg.name}</h3>
                    <button onclick="app.modalForm('visit', '${p.id}')" class="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg font-bold">+ CATAT VISIT</button>
                </div>
                <div class="space-y-4">
                    ${(p.visits||[]).map((v, idx) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative">
                            <div class="flex items-center gap-3 mb-2 border-b pb-2">
                                <i class="fas fa-user-md text-teal-600 text-xl"></i>
                                <div>
                                    <div class="text-[10px] text-slate-400 font-bold uppercase">${v.date}</div>
                                    <div class="text-xs font-bold text-slate-700">Catatan Dokter</div>
                                </div>
                            </div>
                            <p class="text-sm text-slate-600 mb-3 whitespace-pre-wrap">${v.note}</p>
                            ${v.signature ? `<img src="${v.signature}" class="h-12 border rounded bg-white mt-2">` : ''}
                            <button onclick="app.deleteSubItem('${p.id}', 'visits', ${idx})" class="absolute top-4 right-4 text-slate-300 hover:text-red-500"><i class="fas fa-times"></i></button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    // --- CRISIS ---
    renderCrisis: function(c) {
        c.innerHTML = this.data.patients.map(p => {
            const bpss = p.crisis?.bpss || [];
            const lastScore = bpss.length > 0 ? bpss[bpss.length-1].total : 0;
            return `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h3 class="font-bold text-slate-800">${p.reg.name}</h3>
                        <div class="text-xs text-red-500 font-bold">BPSS Score Terakhir: ${lastScore}</div>
                    </div>
                    <button onclick="app.modalForm('crisis', '${p.id}')" class="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-bold">+ INPUT SKOR</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="h-48 border rounded-xl p-2"><canvas id="chart-${p.id}"></canvas></div>
                    <div class="h-48 overflow-y-auto">
                        <table class="w-full text-[10px] border-collapse">
                            <tr class="bg-slate-100 text-left"><th>Tgl</th><th>Bio</th><th>Psy</th><th>Soc</th><th>Spi</th><th>Total</th></tr>
                            ${bpss.map(b => `
                                <tr class="border-b">
                                    <td class="p-1">${b.date.split(',')[0]}</td>
                                    <td>${b.bio}</td><td>${b.psy}</td><td>${b.soc}</td><td>${b.spi}</td>
                                    <td class="font-bold">${b.total}</td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                </div>
            </div>`;
        }).join('');

        // Render Charts after DOM update
        setTimeout(() => {
            this.data.patients.forEach(p => {
                const ctx = document.getElementById(`chart-${p.id}`);
                if (ctx && p.crisis?.bpss?.length > 0) {
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: p.crisis.bpss.map(b => b.date.split(',')[0]),
                            datasets: [{
                                label: 'Total Score',
                                data: p.crisis.bpss.map(b => b.total),
                                borderColor: '#dc2626',
                                tension: 0.3,
                                fill: false
                            }]
                        },
                        options: { maintainAspectRatio: false, plugins: { legend: {display: false} } }
                    });
                }
            });
        }, 100);
    },

    // --- PROGRAM ---
    renderProgram: function(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <h3 class="font-bold text-slate-800 mb-4">${p.reg.name}</h3>
                <div class="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                    <div class="grid grid-cols-2 gap-6 mb-4">
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase">Jenis Program</label>
                            <select id="prog-type-${p.id}" onchange="app.saveProgramDirect('${p.id}')" class="input-field mt-1">
                                <option ${p.program.type==='Rawat Jalan'?'selected':''}>Rawat Jalan</option>
                                <option ${p.program.type==='Rawat Inap'?'selected':''}>Rawat Inap</option>
                                <option ${p.program.type==='Intensif'?'selected':''}>Intensif</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] font-bold text-slate-400 uppercase">Target Durasi</label>
                            <input id="prog-dur-${p.id}" value="${p.program.duration}" onchange="app.saveProgramDirect('${p.id}')" class="input-field mt-1" placeholder="Contoh: 1 Bulan">
                        </div>
                    </div>
                    <div class="text-xs text-slate-400 italic text-center">Perubahan otomatis tersimpan saat anda mengganti nilai.</div>
                </div>
            </div>
        `).join('');
    },

    // --- THERAPY ---
    renderTherapy: function(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 search-item">
                <h3 class="font-bold text-slate-800 mb-4">${p.reg.name}</h3>
                <div class="relative">
                    <textarea id="note-${p.id}" class="w-full h-40 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-slate-700 leading-relaxed focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Tulis catatan perkembangan terapi disini...">${p.therapy || ''}</textarea>
                    <button onclick="app.saveTherapyDirect('${p.id}')" class="absolute bottom-4 right-4 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">
                        SIMPAN CATATAN
                    </button>
                </div>
            </div>
        `).join('');
    },

    // ==========================================
    // 4. MODAL & FORM HANDLERS
    // ==========================================
    modalForm: function(type, id = null) {
        const modal = document.getElementById('modal-container');
        const body = document.getElementById('modal-body');
        const title = document.getElementById('modal-title');
        
        // Find patient if ID exists
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        let html = '';

        if (type === 'patient') {
            title.innerText = id ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
            html = `
                <form onsubmit="app.handleSave(event, 'patient', '${id||''}')" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="col-span-2 flex justify-center mb-4">
                        <label class="w-24 h-24 bg-slate-100 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:bg-slate-200">
                            <i class="fas fa-camera text-slate-400"></i>
                            <input type="file" name="photo" class="hidden" accept="image/*">
                        </label>
                    </div>
                    <input name="name" value="${p?.reg.name||''}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="rm" value="${p?.reg.rm||''}" placeholder="No. RM" class="input-field">
                    <input name="ttl" value="${p?.reg.ttl||''}" placeholder="Tempat, Tgl Lahir" class="input-field">
                    <input name="job" value="${p?.reg.job||''}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${p?.reg.addr||''}" placeholder="Alamat Domisili" class="input-field">
                    <input name="guardian" value="${p?.reg.guardian||''}" placeholder="Penanggung Jawab" class="input-field">
                    <button type="submit" class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold mt-4">SIMPAN DATA</button>
                </form>
            `;
        }
        else if (type === 'stock') {
            title.innerText = `TAMBAH OBAT: ${p.reg.name}`;
            html = `
                <form onsubmit="app.handleSave(event, 'stock', '${id}')" class="space-y-4">
                    <input name="name" placeholder="Nama Obat" class="input-field" required>
                    <div class="grid grid-cols-2 gap-4">
                        <input name="qty" type="number" placeholder="Jumlah (Qty)" class="input-field" required>
                        <input name="exp" type="date" class="input-field" required>
                    </div>
                    <button type="submit" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">TAMBAH STOK</button>
                </form>
            `;
        }
        else if (type === 'ttv') {
            title.innerText = `INPUT TTV: ${p.reg.name}`;
            html = `
                <form onsubmit="app.handleSave(event, 'ttv', '${id}')" class="grid grid-cols-2 gap-4">
                    <input name="td" placeholder="TD (mmHg)" class="input-field">
                    <input name="nadi" placeholder="Nadi" class="input-field">
                    <input name="suhu" placeholder="Suhu" class="input-field">
                    <input name="rr" placeholder="RR" class="input-field">
                    <input name="gds" placeholder="GDS" class="input-field col-span-2">
                    <button type="submit" class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN HASIL</button>
                </form>
            `;
        }
        else if (type === 'visit') {
            title.innerText = `CATATAN DOKTER: ${p.reg.name}`;
            html = `
                <form onsubmit="app.handleSave(event, 'visit', '${id}')" class="space-y-4">
                    <textarea name="note" placeholder="Catatan perkembangan..." class="input-field h-32"></textarea>
                    <div class="border rounded-xl bg-slate-50 p-2">
                        <div class="text-[10px] text-slate-400 mb-1">Tanda Tangan Dokter:</div>
                        <canvas id="sig-canvas" class="w-full h-32 border bg-white cursor-crosshair"></canvas>
                        <button type="button" onclick="app.sigPad.clear()" class="text-xs text-red-500 mt-1">Hapus TTD</button>
                    </div>
                    <button type="submit" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN VISIT</button>
                </form>
            `;
            setTimeout(() => {
                const cvs = document.getElementById('sig-canvas');
                cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight;
                this.sigPad = new SignaturePad(cvs);
            }, 300);
        }
        else if (type === 'crisis') {
            title.innerText = `BPSS SCORING: ${p.reg.name}`;
            html = `
                <form onsubmit="app.handleSave(event, 'crisis', '${id}')" class="grid grid-cols-2 gap-4">
                    <input name="bio" type="number" placeholder="Bio Score" class="input-field">
                    <input name="psy" type="number" placeholder="Psy Score" class="input-field">
                    <input name="soc" type="number" placeholder="Soc Score" class="input-field">
                    <input name="spi" type="number" placeholder="Spi Score" class="input-field">
                    <button type="submit" class="col-span-2 bg-red-600 text-white py-3 rounded-xl font-bold">HITUNG & SIMPAN</button>
                </form>
            `;
        }

        body.innerHTML = html;
    },

    closeModal: function() {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').classList.remove('flex');
    },

    // --- DATA PROCESSORS ---
    handleSave: async function(e, type, id) {
        e.preventDefault();
        const fd = new FormData(e.target);
        
        if (type === 'patient') {
            let p = id ? this.data.patients.find(x => x.id === id) : null;
            
            // Handle Photo
            let photoBase64 = p ? p.reg.photo : null;
            const file = fd.get('photo');
            if (file && file.size > 0) photoBase64 = await this.toBase64(file);

            const newReg = {
                name: fd.get('name'), rm: fd.get('rm'), ttl: fd.get('ttl'),
                job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                photo: photoBase64
            };

            if (p) {
                p.reg = { ...p.reg, ...newReg };
            } else {
                this.data.patients.push({
                    id: 'P-' + Date.now(),
                    reg: newReg,
                    program: { type: 'Rawat Jalan', duration: '-' },
                    medicine: { stock: [], logs: [] },
                    ttv: [], visits: [], crisis: { bpss: [] }
                });
            }
        }
        else if (type === 'stock') {
            const p = this.data.patients.find(x => x.id === id);
            p.medicine.stock.push({
                name: fd.get('name'),
                qty: parseInt(fd.get('qty')),
                exp: fd.get('exp')
            });
        }
        else if (type === 'ttv') {
            const p = this.data.patients.find(x => x.id === id);
            p.ttv.unshift({
                date: new Date().toLocaleString(),
                td: fd.get('td'), nadi: fd.get('nadi'), suhu: fd.get('suhu'),
                rr: fd.get('rr'), gds: fd.get('gds')
            });
        }
        else if (type === 'visit') {
            const p = this.data.patients.find(x => x.id === id);
            p.visits.unshift({
                date: new Date().toLocaleString(),
                note: fd.get('note'),
                signature: !this.sigPad.isEmpty() ? this.sigPad.toDataURL() : null
            });
        }
        else if (type === 'crisis') {
            const p = this.data.patients.find(x => x.id === id);
            const bio = parseInt(fd.get('bio'))||0;
            const psy = parseInt(fd.get('psy'))||0;
            const soc = parseInt(fd.get('soc'))||0;
            const spi = parseInt(fd.get('spi'))||0;
            p.crisis.bpss.push({
                date: new Date().toLocaleString(),
                bio, psy, soc, spi,
                total: bio + psy + soc + spi
            });
        }

        await this.saveData();
        this.closeModal();
        this.render();
        Swal.fire({ icon: 'success', title: 'Data Tersimpan', timer: 1000, showConfirmButton: false });
    },

    // --- UTILITIES (Direct Actions) ---
    useMedicine: async function(pid, idx) {
        const { value: pjName } = await Swal.fire({
            title: 'Konfirmasi Minum Obat',
            input: 'text',
            inputLabel: 'Nama PJ (Perawat/Wali)',
            showCancelButton: true
        });

        if (pjName) {
            const p = this.data.patients.find(x => x.id === pid);
            const med = p.medicine.stock[idx];
            
            if(med.qty > 0) {
                med.qty -= 1;
                p.medicine.logs.unshift({
                    time: new Date().toLocaleString(),
                    name: med.name,
                    pj: pjName
                });
                await this.saveData();
                this.render();
            } else {
                Swal.fire('Stok Habis', 'Obat ini sudah habis.', 'error');
            }
        }
    },

    saveProgramDirect: async function(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program.type = document.getElementById(`prog-type-${pid}`).value;
        p.program.duration = document.getElementById(`prog-dur-${pid}`).value;
        await this.saveData();
    },

    saveTherapyDirect: async function(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.therapy = document.getElementById(`note-${pid}`).value;
        await this.saveData();
        Swal.fire({ icon: 'success', title: 'Catatan Tersimpan', toast: true, position: 'top-end', timer: 1500 });
    },

    deletePatient: async function(id) {
        if((await Swal.fire({ title: 'Hapus Pasien?', icon: 'warning', showCancelButton: true })).isConfirmed) {
            this.data.patients = this.data.patients.filter(p => p.id !== id);
            await this.saveData();
            this.render();
        }
    },

    deleteSubItem: async function(pid, key, idx) {
        if(confirm("Hapus item ini?")) {
            const p = this.data.patients.find(x => x.id === pid);
            p[key].splice(idx, 1);
            await this.saveData();
            this.render();
        }
    },

    search: function() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    toBase64: file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    })
};

// ==========================================
// 5. SYSTEM BOOTSTRAP
// ==========================================
// Memastikan script berjalan setelah HTML siap
document.addEventListener('DOMContentLoaded', () => {
    // Cek sesi login
    if(localStorage.getItem('mmrc_session')) {
        document.getElementById('auth-layer').style.display = 'none';
        document.getElementById('app-layer').classList.remove('hidden');
        document.getElementById('app-layer').style.display = 'flex';
        window.app.loadData();
        window.app.nav('dashboard');
    }
});
