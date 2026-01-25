const firebaseConfig = {
    apiKey: "AIzaSyBdzWrKOBqrcu6talld7MN-2flHNibEWnE",
    authDomain: "mmrc-stock.firebaseapp.com",
    databaseURL: "https://mmrc-stock-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "mmrc-stock",
    storageBucket: "mmrc-stock.firebasestorage.app",
    messagingSenderId: "722563453659",
    appId: "1:722563453659:web:b9f867367ecadb7a1df2fe"
};

let db;
let app;

window.onload = function() {
    try {
        if (typeof firebase === 'undefined' || typeof Swal === 'undefined') {
            alert("Network Error: Libraries failed to load. Please refresh.");
            return;
        }
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.database();
        initApp();
    } catch (err) {
        console.error("Critical Init Error:", err);
        alert("System Initialization Failed. Check Console.");
    }
};

function initApp() {
    app = {
        data: { patients: [] },
        currentPage: 'dashboard',
        chartInstance: null,
        sigPad: null,

        init() {
            const u = localStorage.getItem('mmrc_user');
            if (u) {
                const layer = document.getElementById('auth-layer');
                if(layer) layer.classList.add('hidden');
                this.loadDB();
            }

            const cvs = document.getElementById('signature-pad');
            if (cvs && typeof SignaturePad !== 'undefined') {
                this.sigPad = new SignaturePad(cvs, { backgroundColor: 'rgb(255, 255, 255)' });
            }

            const btnLogin = document.getElementById('btn-login');
            if (btnLogin) btnLogin.onclick = () => this.login();
            
            const btnLogout = document.getElementById('btn-logout');
            if (btnLogout) btnLogout.onclick = () => this.logout();

            const passInput = document.getElementById('pass');
            if(passInput) {
                passInput.addEventListener("keypress", function(event) {
                    if (event.key === "Enter") app.login();
                });
            }
        },

        login() {
            const u = document.getElementById('user').value;
            const p = document.getElementById('pass').value;

            if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
                localStorage.setItem('mmrc_user', u);
                let timerInterval;
                Swal.fire({
                    title: 'System Access',
                    html: 'Verifying Secure Connection...',
                    timer: 800,
                    timerProgressBar: true,
                    didOpen: () => Swal.showLoading(),
                    willClose: () => clearInterval(timerInterval)
                }).then(() => {
                    document.getElementById('auth-layer').classList.add('hidden');
                    this.loadDB();
                });
            } else {
                Swal.fire({ icon: 'error', title: 'Access Denied', text: 'Invalid Credentials', showConfirmButton: false, timer: 1500 });
            }
        },

        logout() {
            Swal.fire({
                title: 'End Session?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'Logout'
            }).then((result) => {
                if (result.isConfirmed) {
                    localStorage.removeItem('mmrc_user');
                    location.reload();
                }
            });
        },

        async loadDB() {
            try {
                const snap = await db.ref('mmrc_data').once('value');
                const val = snap.val();
                this.data = this.sanitize(val);
                this.render();
                this.checkLowStock();
            } catch (e) {
                Swal.fire('Database Error', 'Connection to Enterprise Cloud failed.', 'error');
            }
        },

        async saveDB() {
            try {
                await db.ref('mmrc_data').set(this.data);
            } catch (e) {
                console.error("Save failed", e);
                Swal.fire('Sync Error', 'Data update failed.', 'error');
            }
        },

        sanitize(data) {
            if (!data) return { patients: [] };
            if (!data.patients) data.patients = [];
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
                    html: `<div class="text-left text-sm space-y-1">${low.map(x => `<div class="text-red-600 font-bold">• ${x}</div>`).join('')}</div>`,
                    icon: 'warning',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 6000,
                    timerProgressBar: true
                });
            }
        },

        nav(page) {
            this.currentPage = page;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            const btns = document.getElementsByTagName('button');
            for(let btn of btns) {
                if(btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(page)) {
                    btn.classList.add('active');
                }
            }
            this.render();
        },

        render() {
            const container = document.getElementById('main-content');
            if (!container) return;
            
            container.style.opacity = '0';
            setTimeout(() => {
                if (this.currentPage === 'dashboard') this.renderDashboard(container);
                else if (this.currentPage === 'input') this.renderInput(container);
                else if (this.currentPage === 'data') this.renderData(container);
                container.style.transition = 'opacity 0.2s ease';
                container.style.opacity = '1';
            }, 100);
        },

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
                <div class="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 h-96 relative">
                    <h3 class="font-bold text-slate-700 mb-4 tracking-tight">ANALYTICS OVERVIEW</h3>
                    <div class="h-full pb-10"><canvas id="mainChart"></canvas></div>
                </div>`;

            setTimeout(() => {
                const ctx = document.getElementById('mainChart');
                if (ctx && typeof Chart !== 'undefined') {
                    if (this.chartInstance) this.chartInstance.destroy();
                    this.chartInstance = new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                            datasets: [{
                                label: 'Monthly Traffic',
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

        renderInput(c) {
            c.innerHTML = `
                <div class="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 max-w-4xl mx-auto animate-fade-in">
                    <h2 class="text-2xl font-black text-slate-800 mb-8 tracking-tight">NEW REGISTRATION</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">FULL NAME</label><input id="i_name" class="input-field" placeholder="Patient Name"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">DATE OF BIRTH</label><input type="date" id="i_dob" class="input-field"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">MEDICAL RECORD (RM)</label><input id="i_rm" class="input-field" placeholder="RM Number"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">PROGRAM TYPE</label>
                            <select id="i_prog" class="input-field">
                                <option>Rawat Jalan</option><option>Rawat Inap</option><option>Konseling</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-8 pt-6 border-t flex justify-end">
                        <button onclick="app.pushData()" class="bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-10 rounded-xl shadow-lg transition-transform active:scale-95">SAVE RECORD</button>
                    </div>
                </div>`;
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
            Swal.fire({ icon: 'success', title: 'Data Secured', timer: 1500, showConfirmButton: false });
            this.nav('data');
        },

        renderData(c) {
            const rows = this.data.patients.map((p, i) => `
                <tr class="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer group" onclick="app.detail(${i})">
                    <td class="p-4 font-bold text-slate-400">#${String(i + 1).padStart(3, '0')}</td>
                    <td class="p-4 font-bold text-slate-800 group-hover:text-teal-600 transition-colors">${p.reg.name}</td>
                    <td class="p-4 text-slate-500 font-mono text-xs">${p.reg.rm}</td>
                    <td class="p-4"><span class="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${p.program.type === 'Rawat Inap' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}">${p.program.type}</span></td>
                    <td class="p-4 text-right" onclick="event.stopPropagation()">
                        <button onclick="app.drop(${i})" class="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>`).join('');

            c.innerHTML = `
                <div class="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
                    <div class="p-6 border-b border-slate-100 flex gap-4 items-center bg-slate-50/30">
                        <i class="fas fa-search text-slate-300"></i>
                        <input type="text" id="g_search" onkeyup="app.filter()" placeholder="Search Database..." class="bg-transparent w-full outline-none font-medium text-slate-600">
                    </div>
                    <div class="overflow-auto flex-1 custom-scroll">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-slate-50 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                                <tr><th class="p-4">ID</th><th class="p-4">PATIENT</th><th class="p-4">RM NO</th><th class="p-4">PROGRAM</th><th class="p-4 text-right">ACTION</th></tr>
                            </thead>
                            <tbody id="t_body">${rows || '<tr><td colspan="5" class="p-10 text-center text-slate-300 font-bold">NO RECORDS FOUND</td></tr>'}</tbody>
                        </table>
                    </div>
                </div>`;
        },

        filter() {
            const q = document.getElementById('g_search').value.toLowerCase();
            Array.from(document.querySelectorAll('#t_body tr')).forEach(r => r.style.display = r.innerText.toLowerCase().includes(q) ? '' : 'none');
        },

        async drop(i) {
            const r = await Swal.fire({ title: 'Delete Record?', text: "This is irreversible.", icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33', confirmButtonText: 'Confirm' });
            if (r.isConfirmed) {
                this.data.patients.splice(i, 1);
                await this.saveDB();
                this.render();
            }
        },

        currIdx: null,
        detail(i) {
            this.currIdx = i;
            const p = this.data.patients[i];
            const title = document.getElementById('modal-title');
            const cont = document.getElementById('modal-container');
            if(title) title.innerText = p.reg.name.toUpperCase();
            if(cont) cont.classList.replace('hidden', 'flex');
            this.tab('identity');
        },

        closeModal() {
            document.getElementById('modal-container').classList.replace('flex', 'hidden');
        },

        tab(t) {
            const p = this.data.patients[this.currIdx];
            const box = document.getElementById('modal-content');
            const btns = `<div class="flex gap-2 mb-6 overflow-x-auto pb-2 custom-scroll border-b">
                ${['identity', 'history', 'diagnosis', 'medicine', 'files'].map(k => 
                    `<button onclick="app.tab('${k}')" class="px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${t===k ? 'bg-teal-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}">${k}</button>`
                ).join('')}
            </div>`;

            let content = '';
            if (t === 'identity') {
                content = `
                    <div class="grid grid-cols-2 gap-4">
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">NAME</label><input id="e_name" value="${p.reg.name}" class="input-field"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">RM</label><input id="e_rm" value="${p.reg.rm}" class="input-field"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">DOB</label><input id="e_dob" type="date" value="${p.reg.dob}" class="input-field"></div>
                        <div><label class="label-text block text-xs font-bold text-slate-400 mb-1">PROGRAM</label><select id="e_prog" class="input-field"><option ${p.program.type==='Rawat Jalan'?'selected':''}>Rawat Jalan</option><option ${p.program.type==='Rawat Inap'?'selected':''}>Rawat Inap</option></select></div>
                    </div>
                    <button onclick="app.updIdentity()" class="mt-4 w-full bg-teal-600 text-white py-3 rounded-xl font-bold">UPDATE IDENTITY</button>`;
            } else if (t === 'diagnosis') {
                content = `
                    <textarea id="e_diag" class="input-field h-32 mb-4" placeholder="Medical Diagnosis...">${p.diagnosis.text || ''}</textarea>
                    <div class="border-2 border-dashed border-slate-300 rounded-xl h-40 relative bg-slate-50 mb-4 overflow-hidden">
                        ${p.diagnosis.sig ? `<img src="${p.diagnosis.sig}" class="absolute inset-0 w-full h-full object-contain z-0">` : ''}
                        <canvas id="cvs_sig" class="absolute inset-0 w-full h-full z-10 cursor-crosshair opacity-0 hover:opacity-100 transition-opacity"></canvas>
                        <div class="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none">SIGNATURE LAYER</div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="app.saveDiag()" class="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold">SAVE DIAGNOSIS & SIGN</button>
                        <button onclick="app.clsSig()" class="px-4 border border-red-200 text-red-500 rounded-xl hover:bg-red-50">CLEAR</button>
                    </div>`;
                setTimeout(() => {
                    const cvs = document.getElementById('cvs_sig');
                    if (cvs && this.sigPad) {
                        cvs.width = cvs.offsetWidth; cvs.height = cvs.offsetHeight;
                        this.sigPad = new SignaturePad(cvs);
                    }
                }, 200);
            } else if (t === 'medicine') {
                content = `
                    <div class="flex gap-2 mb-4">
                        <input id="m_name" placeholder="Drug Name" class="input-field flex-1">
                        <input id="m_qty" type="number" placeholder="Qty" class="input-field w-20">
                        <button onclick="app.addMed()" class="bg-teal-600 text-white px-4 rounded-xl font-bold">+</button>
                    </div>
                    <div class="space-y-2 h-64 overflow-y-auto custom-scroll">
                        ${p.medicine.stock.map((m, i) => `
                            <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <div><div class="font-bold text-slate-700">${m.name}</div><div class="text-[10px] ${m.qty < 7 ? 'text-red-500 font-bold' : 'text-slate-400'}">STOCK: ${m.qty}</div></div>
                                <div class="flex gap-1">
                                    <button onclick="app.modMed(${i}, -1)" class="w-8 h-8 rounded-lg bg-red-100 text-red-600 font-bold">-</button>
                                    <button onclick="app.modMed(${i}, 1)" class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 font-bold">+</button>
                                </div>
                            </div>`).join('')}
                    </div>`;
            }

            box.innerHTML = btns + '<div class="animate-fade-in">' + (content || '<div class="p-10 text-center text-slate-300">MODULE UNDER MAINTENANCE</div>') + '</div>';
        },

        async updIdentity() {
            const p = this.data.patients[this.currIdx];
            p.reg.name = document.getElementById('e_name').value;
            p.reg.rm = document.getElementById('e_rm').value;
            p.reg.dob = document.getElementById('e_dob').value;
            p.program.type = document.getElementById('e_prog').value;
            await this.saveDB();
            this.render();
            Swal.fire({ icon: 'success', title: 'Updated', toast: true, position: 'top-end', timer: 1000, showConfirmButton: false });
        },

        async saveDiag() {
            const p = this.data.patients[this.currIdx];
            p.diagnosis.text = document.getElementById('e_diag').value;
            if (this.sigPad && !this.sigPad.isEmpty()) p.diagnosis.sig = this.sigPad.toDataURL();
            await this.saveDB();
            this.tab('diagnosis');
            Swal.fire({ icon: 'success', title: 'Saved', toast: true, position: 'top-end', timer: 1000, showConfirmButton: false });
        },

        clsSig() { if(this.sigPad) this.sigPad.clear(); },

        async addMed() {
            const n = document.getElementById('m_name').value;
            const q = parseInt(document.getElementById('m_qty').value);
            if (n && q) {
                this.data.patients[this.currIdx].medicine.stock.push({ name: n, qty: q });
                await this.saveDB();
                this.tab('medicine');
                this.checkLowStock();
            }
        },

        async modMed(i, v) {
            const m = this.data.patients[this.currIdx].medicine.stock[i];
            m.qty += v;
            if (m.qty < 0) m.qty = 0;
            await this.saveDB();
            this.tab('medicine');
            this.checkLowStock();
        },

        exportAllExcel() {
            if(typeof XLSX === 'undefined') return alert('Library Error');
            const d = this.data.patients.map(p => ({ NAME: p.reg.name, RM: p.reg.rm, PROGRAM: p.program.type }));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(d), "MMRC_EXPORT");
            XLSX.writeFile(wb, "MMRC_DATABASE.xlsx");
        }
    };

    app.init();
}
