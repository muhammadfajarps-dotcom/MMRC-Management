/**
 * MMRC ULTIMATE SYSTEM 2026 - FULL POWER VERSION
 * Fitur: Edit Stok, Edit Log, Export Word All Menu, Modern BPSS Grid
 */

const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
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
    // MENU EXPORT WORD (AUTO DATA GENERATOR)
    // ==========================================
    async exportToWord(pid, menu) {
        const p = this.data.patients.find(x => x.id === pid);
        const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;

        const content = [
            new Paragraph({ text: "MMRC MEDICAL REPORT", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: `KATEGORI: ${menu.toUpperCase()}`, alignment: AlignmentType.CENTER }),
            new Paragraph({ text: "" }),
            new Paragraph({ children: [new TextRun({ text: `Nama Pasien: ${p.reg.name}`, bold: true })] }),
            new Paragraph({ text: `ID: ${p.id}` }),
            new Paragraph({ text: `Dicetak pada: ${new Date().toLocaleString()}` }),
            new Paragraph({ text: "--------------------------------------------------" }),
        ];

        // LOGIKA ISI BERDASARKAN MENU
        if(menu === 'Medicine') {
            content.push(new Paragraph({ text: "STOK OBAT:", bold: true }));
            p.medicine.stock.forEach(s => content.push(new Paragraph({ text: `- ${s.name}: Sisa ${s.init - s.used} (Exp: ${s.exp})` })));
            content.push(new Paragraph({ text: "LOG PENGGUNAAN:", bold: true }));
            p.medicine.logs.forEach(l => content.push(new Paragraph({ text: `[${l.time}] ${l.name} - PJ: ${l.pj}` })));
        } else if(menu === 'Crisis') {
            content.push(new Paragraph({ text: "BPSS 7 HARI:", bold: true }));
            p.crisis.bpss.forEach((b, i) => content.push(new Paragraph({ text: `Hari ${i+1}: Score ${b.eval || '0'} - Ket: ${b.note || '-'}` })));
        } else if(menu === 'TTV') {
            p.ttv.logs.forEach(l => content.push(new Paragraph({ text: `${l.time} | TD: ${l.td} | Nadi: ${l.nadi} | Suhu: ${l.suhu}` })));
        } else {
            content.push(new Paragraph({ text: "Data tercatat di sistem digital MMRC." }));
        }

        const doc = new Document({ sections: [{ children: content }] });
        const blob = await Packer.toBlob(doc);
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `MMRC_${menu}_${p.reg.name}.docx`;
        a.click();
        Swal.fire('Export Berhasil', 'File Word sudah didownload', 'success');
    },

    // ==========================================
    // MEDICINE MODULE (FIXED & FULL EDIT)
    // ==========================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-xl">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'Medicine')" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold">
                        <i class="fas fa-file-word mr-2"></i> WORD
                    </button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div class="flex justify-between mb-2"><span class="text-xs font-bold text-slate-400">STOK OBAT</span>
                        <button onclick="app.modalMedStock('${p.id}')" class="text-teal-600 text-[10px] font-bold">+ TAMBAH</button></div>
                        ${p.medicine.stock.map((s, i) => `
                            <div class="p-4 bg-slate-50 rounded-2xl mb-2 flex justify-between items-center">
                                <div><p class="font-bold text-sm">${s.name}</p><p class="text-[10px] text-slate-400">Sisa: ${s.init - s.used}</p></div>
                                <div class="flex gap-2">
                                    <button onclick="app.editMed('${p.id}', ${i})" class="text-amber-500 bg-white w-8 h-8 rounded-lg shadow-sm border flex items-center justify-center"><i class="fas fa-edit text-xs"></i></button>
                                    <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">PAKAI</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <span class="text-xs font-bold text-slate-400 mb-2 block">CATATAN PENGGUNAAN</span>
                        <div class="overflow-x-auto">
                            <table class="w-full text-[10px]">
                                <tr class="bg-slate-100"><th class="p-2 text-left">Obat</th><th class="p-2 text-left">PJ</th><th class="p-2">Aksi</th></tr>
                                ${p.medicine.logs.map((l, i) => `
                                    <tr class="border-b">
                                        <td class="p-2 font-bold">${l.name}</td>
                                        <td class="p-2">${l.pj}</td>
                                        <td class="p-2 text-center">
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
                <button onclick="app.saveMedStock('${pid}', ${idx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">UPDATE DATA</button>
            </div>`;
        this.openModal();
    },

    editMedLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const l = p.medicine.logs[lIdx];
        document.getElementById('modal-title').innerText = "EDIT LOG PENGGUNAAN";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ml_pj" value="${l.pj}" class="input-field" placeholder="Nama PJ">
                <textarea id="ml_note" class="input-field h-24" placeholder="Catatan">${l.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${lIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    saveEditLog(pid, lIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[lIdx].pj = document.getElementById('ml_pj').value;
        p.medicine.logs[lIdx].note = document.getElementById('ml_note').value;
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Updated', 'Log berhasil diubah!', 'success');
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
    // MODULE LAINNYA (DENGAN TOMBOL WORD)
    // ==========================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'TTV')" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px]">WORD</button>
                </div>
                <button onclick="app.modalTTV('${p.id}')" class="w-full py-2 border-2 border-dashed rounded-xl text-xs text-slate-400 mb-4">+ INPUT TTV</button>
                <div class="bg-slate-50 p-4 rounded-2xl max-h-40 overflow-y-auto">
                    ${p.ttv.logs.map(l => `<p class="text-[10px] border-b py-1"><b>${l.time}</b>: TD ${l.td} | HR ${l.nadi} | S ${l.suhu}</p>`).join('')}
                </div>
            </div>
        `).join('');
    },

    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-6 shadow-sm">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'Crisis')" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px]">WORD</button>
                </div>
                <div class="grid grid-cols-7 gap-2">
                    ${[1,2,3,4,5,6,7].map(d => {
                        const s = p.crisis.bpss[d-1];
                        return `<div onclick="app.modalBPSS('${p.id}', ${d-1})" class="p-2 rounded-xl text-center cursor-pointer ${s ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}">
                            <p class="text-[8px] font-bold">H${d}</p>
                            <p class="text-sm font-black">${s ? s.eval : '-'}</p>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `).join('');
    },

    // --- UTILS (WAJIB ADA) ---
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').style.display = 'flex'; },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" class="input-field" placeholder="Nama Obat">
                <input id="ms_init" type="number" class="input-field" placeholder="Stok Awal">
                <input id="ms_exp" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },
    delSubItem(pid, path, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const keys = path.split('.');
        p[keys[0]][keys[1]].splice(idx, 1);
        this.saveDB(); this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => { 
    if(typeof docx === 'undefined') console.error("Library docx belum terpasang!");
    app.render(); 
});
