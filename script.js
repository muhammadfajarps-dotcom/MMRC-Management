const app = {
    // 1. DATABASE & INITIALIZATION
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Error', 'Username atau Password Salah!', 'error');
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
        container.innerHTML = '';
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- DASHBOARD: UTAMA ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Daftar Pasien</h3>
                <button onclick="app.modalPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">+ Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 gap-4">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-teal-700">${p.reg.name}</h4>
                            <p class="text-xs text-slate-500">${p.reg.age} Th | ${p.reg.addr}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="app.exportToWord('${p.id}')" class="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg font-bold text-xs"><i class="fas fa-file-word"></i> WORD</button>
                            <button onclick="app.modalPatient('${p.id}')" class="bg-amber-100 text-amber-700 px-3 py-2 rounded-lg font-bold text-xs"><i class="fas fa-edit"></i> EDIT</button>
                            <button onclick="app.deletePatient('${p.id}')" class="bg-red-100 text-red-700 px-3 py-2 rounded-lg font-bold text-xs"><i class="fas fa-trash"></i> HAPUS</button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    // --- 1. MEDICINE: STOK & LOG (EDIT & HAPUS) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                    <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Tambah Stok</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <p class="font-bold text-xs text-slate-400 mb-2 uppercase">Stok Obat</p>
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
                        <p class="font-bold text-xs text-slate-400 mb-2 uppercase">Log Penggunaan Obat</p>
                        <div class="space-y-2 h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                            ${(p.medicine?.logs || []).map((l, i) => `
                            <div class="p-2 bg-white border rounded text-[10px] flex justify-between">
                                <div><b>${l.time}</b>: ${l.name} (${l.pj})</div>
                                <button onclick="app.delSub('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-times"></i></button>
                            </div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    },

    // --- 2. TTV & GDS (EDIT & HAPUS) ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
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

    // --- 3. VISIT DOKTER (SIMPAN/EDIT/HAPUS) ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
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
                        <p class="text-xs font-bold">${v.time}</p>
                        <p class="text-xs italic mb-2">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 bg-white border p-1 rounded">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    // --- 4. RENCANA TERAPI (SIMPAN/EDIT/HAPUS) ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
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

    // --- 5. EXPORT WORD (.DOCX) LENGKAP ---
    async exportToWord(patientId) {
        const p = this.data.patients.find(x => x.id === patientId);
        if(!p) return;
        
        const { Document, Packer, Paragraph, TextRun, ImageRun } = docx;

        // Ambil Grafik jika ada
        let chartImg = null;
        const canvas = document.getElementById(`chart-${p.id}`);
        if(canvas) chartImg = canvas.toDataURL("image/png");

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: `DATA PASIEN: ${p.reg.name}`, bold: true, size: 32 })] }),
                    new Paragraph({ text: `Usia: ${p.reg.age} | Alamat: ${p.reg.addr}` }),
                    new Paragraph({ text: `Pekerjaan: ${p.reg.job} | Wali: ${p.reg.guardian}` }),
                    new Paragraph({ text: `---------------------------------------------------` }),
                    new Paragraph({ text: `RENCANA PROGRAM: ${p.program?.paket || '-'} (${p.program?.durasi || '-'} Hari)`, bold: true }),
                    new Paragraph({ text: `RENCANA TERAPI:`, bold: true }),
                    new Paragraph({ text: p.therapy || '-' }),
                    new Paragraph({ text: `---------------------------------------------------` }),
                    new Paragraph({ text: `GRAFIK PERKEMBANGAN BPSS:`, bold: true }),
                    ...(chartImg ? [new Paragraph({ children: [new ImageRun({ data: chartImg, transformation: { width: 400, height: 200 } })] })] : []),
                    new Paragraph({ text: `DATA VISIT DOKTER:`, bold: true }),
                    ...p.visits.map(v => new Paragraph({
                        children: [
                            new TextRun({ text: `Waktu: ${v.time}\nCatatan: ${v.note}`, break: 1 }),
                            new ImageRun({ data: v.sign, transformation: { width: 100, height: 40 } })
                        ]
                    }))
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `MMRC_Report_${p.reg.name}.docx`;
        link.click();
    },

    // --- SISTEM CRUD CORE ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Pasien' : 'Registrasi Pasien';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${id ? `'${id}'` : 'null'})" class="grid grid-cols-2 gap-4">
                <input name="name" value="${p ? p.reg.name : ''}" placeholder="Nama" class="input-field" required>
                <input name="age" value="${p ? p.reg.age : ''}" placeholder="Usia" class="input-field">
                <textarea name="addr" placeholder="Alamat" class="input-field col-span-2">${p ? p.reg.addr : ''}</textarea>
                <button class="col-span-2 bg-teal-600 text-white py-2 rounded">SIMPAN DATA PASIEN</button>
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
            <textarea id="v_note" placeholder="Catatan Dokter" class="input-field h-24 mb-4">${v ? v.note : ''}</textarea>
            <canvas id="sig-pad" class="w-full h-32 bg-white border mb-4"></canvas>
            <button onclick="app.saveVisit('${id}', ${idx})" class="w-full bg-teal-600 text-white py-2 rounded">SIMPAN VISIT</button>`;
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
        let photo = idx !== null ? p.visits[idx].photo : '';
        if(file) photo = await this.toBase64(file);
        
        const data = {
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString(),
            photo: photo,
            note: document.getElementById('v_note').value,
            sign: this.signaturePad.toDataURL()
        };
        if(idx !== null) p.visits[idx] = data;
        else p.visits.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    modalTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = 'Edit Rencana Terapi';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTherapy(event, '${id}')" class="space-y-4">
                <textarea name="txt" class="input-field h-40">${p.therapy || ''}</textarea>
                <button class="w-full bg-teal-600 text-white py-2 rounded">SIMPAN TERAPI</button>
            </form>`;
        this.openModal();
    },

    saveTherapy(e, id) {
        e.preventDefault();
        this.data.patients.find(x => x.id === id).therapy = e.target.txt.value;
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- UTILS ---
    useMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock[idx].used++;
        p.medicine.logs.push({ name: p.medicine.stock[idx].name, time: new Date().toLocaleString(), pj: 'Admin' });
        this.saveDB(); this.render();
    },
    delSub(id, path, idx) {
        if(confirm('Hapus data?')) {
            const p = this.data.patients.find(x => x.id === id);
            const keys = path.split('.');
            let target = p;
            for(let i=0; i<keys.length; i++) target = target[keys[i]];
            target.splice(idx, 1);
            this.saveDB(); this.render();
        }
    },
    deletePatient(id) {
        if(confirm('Hapus pasien?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== id);
            this.saveDB(); this.render();
        }
    },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none');
    },
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

window.onload = () => { /* Initial check if needed */ };
