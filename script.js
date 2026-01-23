const app = {
    // 1. DATABASE & INITIALIZATION
    data: JSON.parse(localStorage.getItem('MMRC_DB')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    saveDB() {
        localStorage.setItem('MMRC_DB', JSON.stringify(this.data));
    },

    // 2. LOGIN (Sesuai HTML: app.login)
    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Gagal', 'Username/Password Salah', 'error');
        }
    },

    // 3. NAVIGASI (Sesuai HTML: app.nav)
    nav(page) {
        this.currentPage = page;
        // Update Sidebar Active Class
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if(btn.id === `btn-${page}`) btn.classList.add('active');
        });
        // Update Title
        document.getElementById('page-title').innerText = page.toUpperCase();
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';

        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        else if (this.currentPage === 'medicine') this.viewMedicine(container);
        else if (this.currentPage === 'ttv') this.viewTTV(container);
        else if (this.currentPage === 'visit') this.viewVisit(container);
        else if (this.currentPage === 'crisis') this.viewCrisis(container);
        else if (this.currentPage === 'program') this.viewProgram(container);
        else if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- MODUL MEDICINE (EDIT & HAPUS ADA) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.reg?.name || 'Pasien'}</h3>
                    <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Stok</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <p class="font-bold text-xs text-slate-400 mb-2">STOK OBAT</p>
                        <table class="w-full text-xs text-left border">
                            <tr class="bg-slate-50 border-b"><th class="p-2">Nama</th><th class="p-2">Sisa</th><th class="p-2">Aksi</th></tr>
                            ${(p.medicine?.stock || []).map((m, i) => `
                            <tr class="border-b">
                                <td class="p-2">${m.name}</td><td class="p-2">${m.init - m.used}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSub('${p.id}', 'medicine.stock', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    <button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-500 text-white px-1 rounded">Minum</button>
                                </td>
                            </tr>`).join('')}
                        </table>
                    </div>
                    <div>
                        <p class="font-bold text-xs text-slate-400 mb-2">LOG PENGGUNAAN</p>
                        <div class="space-y-2 h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                            ${(p.medicine?.logs || []).map((l, i) => `
                            <div class="p-2 bg-white border rounded text-[10px] flex justify-between items-center">
                                <div><b>${l.time}</b>: ${l.name}</div>
                                <button onclick="app.delSub('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-times"></i></button>
                            </div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    },

    // --- MODUL TTV (EDIT & HAPUS ADA) ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg?.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input Data</button>
                </div>
                <table class="w-full text-xs text-left border">
                    <tr class="bg-slate-50 border-b"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                    ${(p.ttv || []).map((t, i) => `
                    <tr class="border-b">
                        <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.gds}</td>
                        <td class="p-2 flex gap-2">
                            <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSub('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`).join('')}
                </table>
            </div>`).join('');
    },

    // --- MODUL VISIT (SIMPAN, EDIT, HAPUS ADA) ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg?.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Visit Baru</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.visits || []).map((v, i) => `
                    <div class="border rounded-xl p-3 bg-slate-50 relative">
                        <div class="absolute top-2 right-2 flex gap-2">
                            <button onclick="app.modalVisit('${p.id}', ${i})" class="text-amber-500 bg-white p-1 rounded"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSub('${p.id}', 'visits', ${i})" class="text-red-500 bg-white p-1 rounded"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                        <p class="text-[10px] font-bold">${v.time}</p>
                        <p class="text-xs italic mb-2">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 bg-white border p-1 rounded">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    // --- MODUL THERAPY (SIMPAN, EDIT, HAPUS ADA) ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg?.name}</h3>
                    <div class="flex gap-2">
                         <button onclick="app.modalTherapy('${p.id}')" class="bg-amber-500 text-white px-3 py-1 rounded text-xs">Edit/Simpan</button>
                         <button onclick="app.clearTherapy('${p.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs">Hapus</button>
                    </div>
                </div>
                <div class="p-4 bg-teal-50 rounded-xl min-h-[100px] text-sm text-teal-900 border border-teal-100">
                    ${p.therapy || '<i class="text-slate-400">Belum ada rencana terapi...</i>'}
                </div>
            </div>`).join('');
    },

    // --- FITUR DOWNLOAD WORD ---
    async exportToWord(id) {
        const p = this.data.patients.find(x => x.id === id);
        const { Document, Packer, Paragraph, TextRun, ImageRun } = docx;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: `MMRC REPORT: ${p.reg.name}`, bold: true, size: 32 })] }),
                    new Paragraph({ text: `Usia: ${p.reg.age} | Alamat: ${p.reg.addr}` }),
                    new Paragraph({ text: `\nRENCANA TERAPI:`, bold: true }),
                    new Paragraph({ text: p.therapy || '-' }),
                    new Paragraph({ text: `\nRIWAYAT VISIT DOKTER:`, bold: true }),
                    ...p.visits.map(v => new Paragraph({
                        children: [
                            new TextRun({ text: `Waktu: ${v.time} - Catatan: ${v.note}`, break: 1 }),
                            new ImageRun({ data: v.sign, transformation: { width: 100, height: 40 } })
                        ]
                    }))
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `MMRC_${p.reg.name}.docx`;
        link.click();
    },

    // --- MODALS CORE ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Pasien' : 'Pasien Baru';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${id ? `'${id}'` : 'null'})" class="grid grid-cols-2 gap-4">
                <input name="name" value="${p ? p.reg.name : ''}" placeholder="Nama Pasien" class="input-field col-span-2" required>
                <input name="age" value="${p ? p.reg.age : ''}" placeholder="Usia" class="input-field">
                <input name="addr" value="${p ? p.reg.addr : ''}" placeholder="Alamat" class="input-field">
                <button class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA</button>
            </form>`;
        this.openModal();
    },

    savePatient(e, id) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const pData = { name: fd.get('name'), age: fd.get('age'), addr: fd.get('addr') };
        if(id) {
            const p = this.data.patients.find(x => x.id === id);
            p.reg = { ...p.reg, ...pData };
        } else {
            this.data.patients.push({
                id: Date.now().toString(), reg: pData, medicine: {stock:[], logs:[]},
                ttv: [], visits: [], crisis: {scores:{}, meta:{}}, therapy: '', program: {}
            });
        }
        this.saveDB(); this.closeModal(); this.render();
    },

    modalVisit(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const v = idx !== null ? p.visits[idx] : null;
        document.getElementById('modal-title').innerText = 'Visit Dokter';
        document.getElementById('modal-body').innerHTML = `
            <input type="file" id="v_photo" class="input-field mb-4">
            <textarea id="v_note" placeholder="Catatan Medis" class="input-field h-24 mb-4">${v ? v.note : ''}</textarea>
            <div class="border p-2 bg-slate-50"><canvas id="sig-pad" class="w-full h-32 bg-white border"></canvas></div>
            <button onclick="app.saveVisit('${id}', ${idx})" class="w-full bg-teal-600 text-white py-3 mt-4 rounded-xl font-bold">SIMPAN VISIT</button>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
            this.signaturePad = new SignaturePad(canvas);
            if(v) this.signaturePad.fromDataURL(v.sign);
        }, 100);
    },

    async saveVisit(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const file = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : 'https://via.placeholder.com/150';
        if(file) photo = await this.toBase64(file);
        
        const data = {
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString(),
            photo, note: document.getElementById('v_note').value, sign: this.signaturePad.toDataURL()
        };
        if(idx !== null) p.visits[idx] = data;
        else p.visits.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- UTILS ---
    viewDashboard(container) {
        container.innerHTML = `<div class="flex justify-between mb-6"><h3 class="font-bold">Daftar Pasien</h3><button onclick="app.modalPatient()" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Pasien Baru</button></div>
        <div class="grid gap-4">${this.data.patients.map(p => `<div class="bg-white p-4 rounded-2xl border flex justify-between items-center search-item">
            <div><p class="font-bold text-teal-700">${p.reg.name}</p><p class="text-xs text-slate-500">${p.reg.addr}</p></div>
            <div class="flex gap-2"><button onclick="app.exportToWord('${p.id}')" class="text-blue-600 text-xs">WORD</button><button onclick="app.modalPatient('${p.id}')" class="text-amber-500 text-xs">EDIT</button><button onclick="app.deletePatient('${p.id}')" class="text-red-500 text-xs">HAPUS</button></div>
        </div>`).join('')}</div>`;
    },
    modalMedStock(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const m = idx !== null ? p.medicine.stock[idx] : null;
        document.getElementById('modal-title').innerText = 'Stok Obat';
        document.getElementById('modal-body').innerHTML = `<form onsubmit="app.saveMedStock(event, '${id}', ${idx})" class="space-y-4">
            <input name="name" value="${m?m.name:''}" placeholder="Nama Obat" class="input-field" required>
            <input type="number" name="init" value="${m?m.init:''}" placeholder="Jumlah" class="input-field" required>
            <button class="w-full bg-teal-600 text-white py-2 rounded-xl font-bold">SIMPAN</button></form>`;
        this.openModal();
    },
    saveMedStock(e, id, idx) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === id);
        const data = { name: e.target.name.value, init: parseInt(e.target.init.value), used: idx!==null?p.medicine.stock[idx].used:0 };
        if(idx!==null) p.medicine.stock[idx] = data; else p.medicine.stock.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },
    useMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock[idx].used++;
        p.medicine.logs.push({ name: p.medicine.stock[idx].name, time: new Date().toLocaleString() });
        this.saveDB(); this.render();
    },
    delSub(id, path, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const keys = path.split('.');
        let target = p;
        for(let i=0; i<keys.length; i++) target = target[keys[i]];
        target.splice(idx, 1);
        this.saveDB(); this.render();
    },
    deletePatient(id) { if(confirm('Hapus Pasien?')) { this.data.patients = this.data.patients.filter(x=>x.id!==id); this.saveDB(); this.render(); }},
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(q) ? 'flex' : 'none');
    },
    modalTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = 'Rencana Terapi';
        document.getElementById('modal-body').innerHTML = `<form onsubmit="app.saveTherapy(event, '${id}')" class="space-y-4"><textarea name="txt" class="input-field h-40">${p.therapy||''}</textarea><button class="w-full bg-teal-600 text-white py-2 rounded-xl">SIMPAN</button></form>`;
        this.openModal();
    },
    saveTherapy(e, id) { e.preventDefault(); this.data.patients.find(x=>x.id===id).therapy = e.target.txt.value; this.saveDB(); this.closeModal(); this.render(); },
    clearTherapy(id) { this.data.patients.find(x=>x.id===id).therapy = ''; this.saveDB(); this.render(); },
    openModal() { document.getElementById('modal-container').classList.replace('hidden','flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex','hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};
