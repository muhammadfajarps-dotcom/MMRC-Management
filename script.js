/**
 * MMRC ULTIMATE SYSTEM 2026
 * Developed with Full Power Mode
 */

const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    // ==========================================
    // 1. CORE SYSTEM & AUTH
    // ==========================================
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Gagal', 'Username/Password Salah!', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase();
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        container.innerHTML = '';
        
        // Router System
        const routes = {
            'dashboard': () => this.viewDashboard(container),
            'medicine': () => this.viewMedicine(container),
            'ttv': () => this.viewTTV(container),
            'visit': () => this.viewVisit(container),
            'crisis': () => this.viewCrisis(container),
            'program': () => this.viewProgram(container),
            'therapy': () => this.viewTherapy(container)
        };
        
        if (routes[this.currentPage]) routes[this.currentPage]();
    },

    // ==========================================
    // 2. MEDICINE SYSTEM (FIXED & UPGRADED)
    // ==========================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2rem] border shadow-sm mb-10 search-item">
                <div class="flex justify-between items-start mb-8">
                    <div>
                        <h3 class="font-black text-2xl text-teal-800">${p.reg.name}</h3>
                        <p class="text-xs font-bold text-slate-400 tracking-widest uppercase">Medical Inventory & Logs</p>
                    </div>
                    <button onclick="app.exportToWord('${p.id}', 'Medicine')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-100"><i class="fas fa-file-word mr-2"></i> WORD REPORT</button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="text-xs font-black text-slate-500 uppercase">Stok Obat Aktif</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold">+ TAMBAH OBAT</button>
                        </div>
                        <div class="space-y-4">
                            ${p.medicine.stock.map((s, i) => `
                                <div class="p-5 border rounded-3xl bg-slate-50 relative group transition-all hover:bg-white hover:shadow-xl">
                                    <div class="flex justify-between items-center">
                                        <div>
                                            <p class="font-black text-teal-700 text-lg">${s.name}</p>
                                            <p class="text-[10px] text-slate-400 font-medium">Exp: ${s.exp} | Awal: ${s.init}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-3xl font-black ${s.init - s.used <= 5 ? 'text-red-500 animate-pulse' : 'text-teal-600'}">${s.init - s.used}</p>
                                            <p class="text-[9px] font-bold text-slate-400">SISA TAB</p>
                                        </div>
                                    </div>
                                    <div class="mt-4 flex gap-2">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-bold shadow-md shadow-blue-100">CATAT MINUM</button>
                                        <button onclick="app.editMed('${p.id}', ${i})" class="w-10 h-10 flex items-center justify-center bg-amber-100 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="w-10 h-10 flex items-center justify-center bg-red-100 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-black text-slate-500 uppercase mb-4">Riwayat Penggunaan</h4>
                        <div class="bg-slate-50 rounded-3xl p-4 border max-h-[400px] overflow-y-auto">
                            <table class="w-full text-xs">
                                <thead class="text-slate-400 border-b border-slate-200 uppercase text-[9px] font-bold">
                                    <tr><th class="p-2 text-left">Waktu</th><th class="p-2 text-left">Obat</th><th class="p-2 text-left">PJ</th><th class="p-2 text-center">Aksi</th></tr>
                                </thead>
                                <tbody>
                                    ${p.medicine.logs.map((l, i) => `
                                        <tr class="border-b border-slate-100 hover:bg-white transition-colors">
                                            <td class="p-3 text-[10px] text-slate-500">${l.time}</td>
                                            <td class="p-3 font-bold text-teal-700">${l.name}</td>
                                            <td class="p-3 text-slate-600 font-medium">${l.pj}</td>
                                            <td class="p-3 flex justify-center gap-2">
                                                <button onclick="app.editMedLog('${p.id}', ${i})" class="text-amber-500 hover:scale-110"><i class="fas fa-edit"></i></button>
                                                <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-400 hover:scale-110"><i class="fas fa-trash"></i></button>
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    editMed(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = p.medicine.stock[idx];
        document.getElementById('modal-title').innerText = "EDIT MASTER OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s.name}" class="input-field" placeholder="Nama Obat">
                <div class="grid grid-cols-2 gap-4">
                    <input id="ms_init" value="${s.init}" type="number" class="input-field" placeholder="Stok Awal">
                    <input id="ms_used" value="${s.used}" type="number" class="input-field" placeholder="Terpakai">
                </div>
                <input id="ms_exp" value="${s.exp}" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}', ${idx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">UPDATE DATA STOK</button>
            </div>`;
        this.openModal();
    },

    editMedLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const l = p.medicine.logs[lIdx];
        document.getElementById('modal-title').innerText = "EDIT LOG MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <p class="text-xs text-slate-400">Obat: <b>${l.name}</b> (${l.time})</p>
                <input id="ml_pj" value="${l.pj}" class="input-field" placeholder="Nama Penanggung Jawab">
                <textarea id="ml_note" class="input-field h-24" placeholder="Keterangan Tambahan">${l.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${lIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    saveEditLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[lIdx].pj = document.getElementById('ml_pj').value;
        p.medicine.logs[lIdx].note = document.getElementById('ml_note').value;
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Updated', 'Catatan berhasil diperbarui', 'success');
    },

    // ==========================================
    // 3. CRISIS SYSTEM (ULTIMATE GRID 1-7)
    // ==========================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2.5rem] border mb-10 shadow-sm search-item">
                <div class="flex justify-between items-center mb-8 border-b pb-6">
                    <div>
                        <h3 class="font-black text-2xl text-slate-800">${p.reg.name}</h3>
                        <p class="text-[10px] text-red-500 font-black uppercase tracking-[0.2em]">BPSS CRISIS MONITORING (7 DAYS DETOX)</p>
                    </div>
                    <button onclick="app.exportToWord('${p.id}', 'Crisis')" class="bg-blue-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black shadow-lg shadow-blue-100 uppercase">Export Report</button>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
                    ${[1, 2, 3, 4, 5, 6, 7].map(day => {
                        const score = p.crisis.bpss[day - 1];
                        return `
                        <div onclick="app.modalBPSS('${p.id}', ${day - 1})" class="relative group cursor-pointer transition-all hover:-translate-y-2">
                            <div class="text-center mb-2 font-black text-[9px] text-slate-400 uppercase tracking-tighter">Day ${day}</div>
                            <div class="${score ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-300'} rounded-3xl p-4 h-28 flex flex-col items-center justify-center shadow-md">
                                <span class="text-3xl font-black">${score ? score.eval : '-'}</span>
                                <span class="text-[8px] font-black uppercase opacity-60">${score ? 'Score' : 'Empty'}</span>
                            </div>
                            ${score ? `<i class="fas fa-check-circle absolute -top-1 -right-1 text-teal-500 bg-white rounded-full"></i>` : ''}
                        </div>`;
                    }).join('')}
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div class="lg:col-span-2 h-72 bg-slate-50 rounded-3xl border p-6">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                    <div class="bg-slate-900 rounded-3xl p-6 text-white overflow-y-auto max-h-72">
                        <h5 class="text-[10px] font-black text-teal-400 uppercase mb-4 tracking-widest">Evolution Notes</h5>
                        <div class="space-y-4">
                            ${p.crisis.bpss.map((b, i) => `
                                <div class="border-l-2 border-teal-500/30 pl-3">
                                    <p class="text-[9px] font-black text-slate-500">DAY ${i+1}</p>
                                    <p class="text-[11px] italic">"${b.note || 'No description provided'}"</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    // ==========================================
    // 4. SMART WORD EXPORT (ULTIMATE VERSION)
    // ==========================================
    async exportToWord(pid, menu) {
        const p = this.data.patients.find(x => x.id === pid);
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

        const children = [
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: "MADANI MMRC - MEDICAL DATABASE", bold: true, size: 32, color: "0d9488" }),
                ],
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({ text: `REPORT TYPE: ${menu.toUpperCase()}`, bold: true, size: 24 }),
                ],
            }),
            new Paragraph({ text: "" }),
            new Paragraph({
                children: [
                    new TextRun({ text: "PROFIL PASIEN", bold: true, underline: {} }),
                ],
            }),
            new Paragraph({ text: `Nama Lengkap: ${p.reg.name}` }),
            new Paragraph({ text: `ID Pasien: ${p.id}` }),
            new Paragraph({ text: `Tanggal Laporan: ${new Date().toLocaleString('id-ID')}` }),
            new Paragraph({ text: "--------------------------------------------------------" }),
            new Paragraph({ text: "" }),
        ];

        // Custom content based on menu
        if(menu === 'Medicine') {
            children.push(new Paragraph({ text: "STOK OBAT AKTIF:", bold: true }));
            p.medicine.stock.forEach(s => {
                children.push(new Paragraph({ text: `- ${s.name}: Sisa ${s.init-s.used} Tab (Exp: ${s.exp})` }));
            });
        } else if (menu === 'Crisis') {
            children.push(new Paragraph({ text: "DATA BPSS SCORE (7 HARI):", bold: true }));
            p.crisis.bpss.forEach((b, i) => {
                children.push(new Paragraph({ text: `Hari ${i+1}: Score ${b.eval} - Note: ${b.note}` }));
            });
        } else {
            children.push(new Paragraph({ text: `Laporan detail untuk ${menu} tercatat di sistem.` }));
        }

        const doc = new Document({ sections: [{ children }] });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `REPORT_${menu}_${p.reg.name.replace(/\s+/g, '_')}.docx`;
        link.click();
        
        Swal.fire('Word Ready', 'Laporan berhasil di-generate!', 'success');
    },

    // ==========================================
    // 5. MODAL & UTILS (FIXED)
    // ==========================================
    openModal() {
        document.getElementById('modal-container').style.display = 'flex';
        document.getElementById('modal-container').classList.remove('hidden');
    },
    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
    },
    
    // ... Sisa fungsi saveMedStock, modalBPSS, saveBPSS, savePatient, dll disesuaikan seperti format di atas ...
    // Pastikan memanggil this.saveDB() dan this.render() di setiap akhir save.
};

// Start Apps
document.addEventListener('DOMContentLoaded', () => {
    app.render();
});
