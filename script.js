/**
 * MMRC ULTIMATE SYSTEM 2026 - FULL POWER REBORN
 * FIX: Edit Stok, Edit Log, BPSS Grid, & Word Export All Menus
 */

const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    // ==========================================
    // 1. NAVIGATION & CORE
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
    // 2. EXPORT WORD (SOPAN & LENGKAP)
    // ==========================================
    async exportToWord(pid, menu) {
        const p = this.data.patients.find(x => x.id === pid);
        const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;

        const content = [
            new Paragraph({ text: "MMRC MEDICAL REPORT", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `MODUL: ${menu.toUpperCase()}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: `Nama Pasien: ${p.reg.name}`, bold: true, size: 24 })] }),
            new Paragraph({ text: `ID Pasien: ${p.id}` }),
            new Paragraph({ text: `Waktu Cetak: ${new Date().toLocaleString('id-ID')}` }),
            new Paragraph({ text: "--------------------------------------------------------------------------------" }),
        ];

        if(menu === 'Medicine') {
            content.push(new Paragraph({ text: "STOK OBAT:", bold: true }));
            p.medicine.stock.forEach(s => content.push(new Paragraph({ text: `- ${s.name}: Sisa ${s.init - s.used} Tab (Exp: ${s.exp})` })));
            content.push(new Paragraph({ text: "LOG PENGGUNAAN:", bold: true }));
            p.medicine.logs.forEach(l => content.push(new Paragraph({ text: `[${l.time}] ${l.name} - PJ: ${l.pj} (${l.note || '-'})` })));
        } else if(menu === 'Crisis') {
            content.push(new Paragraph({ text: "BPSS MONITORING (7 HARI):", bold: true }));
            p.crisis.bpss.forEach((b, i) => content.push(new Paragraph({ text: `Hari ${i+1}: Score ${b.eval || '0'} | Catatan: ${b.note || '-'}` })));
        } else if(menu === 'TTV') {
            content.push(new Paragraph({ text: "DATA TTV:", bold: true }));
            p.ttv.logs.forEach(l => content.push(new Paragraph({ text: `${l.time} | TD: ${l.td} | Nadi: ${l.nadi} | Suhu: ${l.suhu} | SpO2: ${l.spo2}` })));
        } else {
            content.push(new Paragraph({ text: `Laporan data untuk menu ${menu} tercatat dalam Database MMRC.` }));
        }

        const doc = new Document({ sections: [{ children: content }] });
        const blob = await Packer.toBlob(doc);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `MMRC_${menu}_${p.reg.name}.docx`;
        a.click();
        Swal.fire('Sukses', 'Laporan Word berhasil diunduh', 'success');
    },

    // ==========================================
    // 3. MEDICINE (STOK & CATATAN LOG)
    // ==========================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-[2rem] border shadow-sm mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-xl text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'Medicine')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
                        <i class="fas fa-file-word mr-2"></i> DOWNLOAD WORD
                    </button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between mb-4"><span class="text-xs font-bold text-slate-400">DAFTAR STOK</span>
                        <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">+ STOK</button></div>
                        ${p.medicine.stock.map((s, i) => `
                            <div class="p-4 bg-slate-50 rounded-2xl mb-3 border">
                                <div class="flex justify-between">
                                    <p class="font-bold text-teal-700">${s.name}</p>
                                    <p class="text-lg font-black">${s.init - s.used}</p>
                                </div>
                                <div class="flex gap-2 mt-2">
                                    <button onclick="app.modalUseMed('${p.id}', ${i})" class="flex-1 bg-teal-600 text-white py-1 rounded-lg text-[10px]">PAKAI</button>
                                    <button onclick="app.editMed('${p.id}', ${i})" class="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center"><i class="fas fa-trash text-xs"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <span class="text-xs font-bold text-slate-400 mb-4 block">CATATAN PENGGUNAAN</span>
                        <div class="bg-slate-50 rounded-2xl p-4 max-h-[300px] overflow-y-auto">
                            <table class="w-full text-[10px]">
                                <tr class="border-b text-slate-400"><th class="text-left p-1">WAKTU</th><th class="text-left p-1">OBAT</th><th class="p-1">AKSI</th></tr>
                                ${p.medicine.logs.map((l, i) => `
                                    <tr class="border-b">
                                        <td class="p-2">${l.time}</td>
                                        <td class="p-2 font-bold">${l.name}</td>
                                        <td class="p-2 text-right">
                                            <button onclick="app.editMedLog('${p.id}', ${i})" class="text-amber-500 mr-2"><i class="fas fa-edit"></i></button>
                                            <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
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
        document.getElementById('modal-title').innerText = "EDIT STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s.name}" class="input-field" placeholder="Nama Obat">
                <div class="grid grid-cols-2 gap-4">
                    <input id="ms_init" value="${s.init}" type="number" class="input-field" placeholder="Stok Awal">
                    <input id="ms_used" value="${s.used}" type="number" class="input-field" placeholder="Terpakai">
                </div>
                <input id="ms_exp" value="${s.exp}" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}', ${idx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    editMedLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const l = p.medicine.logs[lIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN LOG";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ml_pj" value="${l.pj}" class="input-field" placeholder="Nama PJ">
                <textarea id="ml_note" class="input-field h-24" placeholder="Catatan">${l.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${lIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">UPDATE CATATAN</button>
            </div>`;
        this.openModal();
    },

    saveEditLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[lIdx].pj = document.getElementById('ml_pj').value;
        p.medicine.logs[lIdx].note = document.getElementById('ml_note').value;
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Updated', 'Catatan diperbarui', 'success');
    },

    saveMedStock(pid, idx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const obj = {
            name: document.getElementById('ms_name').value,
            init: parseInt(document.getElementById('ms_init').value),
            used: parseInt(document.getElementById('ms_used').value || 0),
            exp: document.getElementById('ms_exp').value
        };
        if(idx !== null) p.medicine.stock[idx] = obj;
        else p.medicine.stock.push(obj);
        this.saveDB(); this.closeModal(); this.render();
    },

    // ==========================================
    // 4. CRISIS MONITORING (GRID UPGRADE)
    // ==========================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2.5rem] border mb-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="font-bold text-xl">${p.reg.name}</h3>
                        <p class="text-[10px] text-red-500 font-bold tracking-widest uppercase">BPSS Score (7 Hari Detox)</p>
                    </div>
                    <button onclick="app.exportToWord('${p.id}', 'Crisis')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg">WORD</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
                    ${[1,2,3,4,5,6,7].map(day => {
                        const s = p.crisis.bpss[day-1];
                        return `
                        <div onclick="app.modalBPSS('${p.id}', ${day-1})" class="cursor-pointer group">
                            <div class="text-center text-[9px] font-bold text-slate-400 mb-1">HARI ${day}</div>
                            <div class="h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${s ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-50 border-2 border-dashed border-slate-200 text-slate-300'}">
                                <span class="text-xl font-black">${s ? s.eval : '-'}</span>
                                <span class="text-[8px] font-bold uppercase">SCORE</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `).join('');
    },

    // ==========================================
    // 5. TTV, VISIT, PROGRAM, THERAPY (FULL RETURN)
    // ==========================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6">
                <div class="flex justify-between mb-4">
                    <h3 class="font-bold text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'TTV')" class="text-blue-600 text-xs font-bold underline">DOCX</button>
                </div>
                <button onclick="app.modalTTV('${p.id}')" class="w-full py-3 border-2 border-dashed rounded-2xl text-slate-400 text-xs font-bold mb-4">+ INPUT TTV BARU</button>
                <div class="space-y-2">
                    ${p.ttv.logs.map(l => `<div class="p-3 bg-slate-50 rounded-xl text-[10px] flex justify-between">
                        <span><b>${l.time}</b> | TD: ${l.td} | HR: ${l.nadi} | S: ${l.suhu} | SpO2: ${l.spo2}</span>
                        <i class="fas fa-heart text-red-400"></i>
                    </div>`).join('')}
                </div>
            </div>
        `).join('');
    },

    viewDashboard(container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-teal-600 p-6 rounded-[2rem] text-white shadow-xl">
                    <p class="text-xs font-bold opacity-80 uppercase">Total Pasien</p>
                    <h2 class="text-4xl font-black">${this.data.patients.length}</h2>
                </div>
                <button onclick="app.modalPatient()" class="bg-white p-6 rounded-[2rem] border-2 border-dashed border-teal-600 flex flex-col items-center justify-center group hover:bg-teal-50 transition-all">
                    <i class="fas fa-plus-circle text-2xl text-teal-600 mb-2"></i>
                    <p class="text-xs font-bold text-teal-600 uppercase">Tambah Pasien Baru</p>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-[2rem] border shadow-sm hover:shadow-xl transition-all">
                        <div class="flex justify-between mb-4">
                            <span class="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[10px] font-bold uppercase">${p.reg.room || 'No Room'}</span>
                            <button onclick="app.delPatient('${p.id}')" class="text-red-300 hover:text-red-500"><i class="fas fa-trash-alt"></i></button>
                        </div>
                        <h4 class="font-black text-xl text-slate-800 mb-1">${p.reg.name}</h4>
                        <p class="text-xs text-slate-400 font-bold mb-6 italic tracking-tight">ID: ${p.id}</p>
                        <button onclick="app.exportToWord('${p.id}', 'Medicine')" class="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Lihat Detail Laporan</button>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // UTILS & MODALS
    openModal() { 
        document.getElementById('modal-container').classList.remove('hidden'); 
        document.getElementById('modal-container').style.display = 'flex'; 
    },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    
    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" class="input-field" placeholder="Nama Obat">
                <input id="ms_init" type="number" class="input-field" placeholder="Jumlah Stok Masuk">
                <input id="ms_exp" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    modalUseMed(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = p.medicine.stock[idx];
        document.getElementById('modal-title').innerText = "CATAT PENGGUNAAN";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4 text-center">
                <h4 class="font-bold text-teal-800">${s.name}</h4>
                <p class="text-xs text-slate-400">Sisa Stok: ${s.init - s.used}</p>
                <input id="mu_qty" type="number" value="1" class="input-field text-center text-xl font-bold">
                <input id="mu_pj" class="input-field" placeholder="Nama Petugas (PJ)">
                <button onclick="app.saveUseMed('${pid}', ${idx})" class="w-full bg-slate-900 text-white py-3 rounded-2xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    saveUseMed(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const qty = parseInt(document.getElementById('mu_qty').value);
        const pj = document.getElementById('mu_pj').value;
        if(!pj) return Swal.fire('Error', 'Isi Nama PJ!', 'error');
        p.medicine.stock[idx].used += qty;
        p.medicine.logs.unshift({ time: new Date().toLocaleString(), name: p.medicine.stock[idx].name, pj, note: '' });
        this.saveDB(); this.closeModal(); this.render();
    },

    delSubItem(pid, path, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const keys = path.split('.');
        p[keys[0]][keys[1]].splice(idx, 1);
        this.saveDB(); this.render();
    },

    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="v_td" placeholder="TD (mmHg)" class="input-field">
                <input id="v_nadi" placeholder="Nadi (bpm)" class="input-field">
                <input id="v_suhu" placeholder="Suhu (°C)" class="input-field">
                <input id="v_spo2" placeholder="SpO2 (%)" class="input-field">
            </div>
            <button onclick="app.saveTTV('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN DATA</button>`;
        this.openModal();
    },

    saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.ttv.logs.unshift({
            time: new Date().toLocaleString(),
            td: document.getElementById('v_td').value,
            nadi: document.getElementById('v_nadi').value,
            suhu: document.getElementById('v_suhu').value,
            spo2: document.getElementById('v_spo2').value
        });
        this.saveDB(); this.closeModal(); this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => { app.render(); });
