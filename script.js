const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

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
            Swal.fire('Error', 'Login Gagal', 'error');
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
        // Menjaga semua menu tetap ada
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- 1. MEDICINE (STOK & LOG) + EDIT/HAPUS ---
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
                            <tr class="bg-slate-50"><th class="p-2">Nama</th><th class="p-2">Sisa</th><th class="p-2">Aksi</th></tr>
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
                        <p class="font-bold text-xs text-slate-400 mb-2 uppercase">Log Penggunaan</p>
                        <div class="space-y-2 h-40 overflow-y-auto">
                            ${(p.medicine?.logs || []).map((l, i) => `
                            <div class="p-2 bg-slate-50 border rounded text-[10px] flex justify-between items-center">
                                <div><b>${l.time}</b> - ${l.name} (${l.pj})</div>
                                <button onclick="app.delSub('${p.id}', 'medicine.logs', ${i})" class="text-red-400 ml-2"><i class="fas fa-times"></i></button>
                            </div>`).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    },

    modalMedStock(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const m = idx !== null ? p.medicine.stock[idx] : null;
        document.getElementById('modal-title').innerText = idx !== null ? 'Edit Stok Obat' : 'Tambah Stok Obat';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveMedStock(event, '${id}', ${idx})" class="space-y-4">
                <input name="name" value="${m ? m.name : ''}" placeholder="Nama Obat" class="input-field" required>
                <input type="number" name="init" value="${m ? m.init : ''}" placeholder="Jumlah Stok" class="input-field" required>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },

    saveMedStock(e, id, idx) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        const data = { name: e.target.name.value, init: parseInt(e.target.init.value), used: idx !== null ? p.medicine.stock[idx].used : 0 };
        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 2. TTV & GDS + EDIT/HAPUS ---
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

    modalTTV(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const t = idx !== null ? p.ttv[idx] : null;
        document.getElementById('modal-title').innerText = idx !== null ? 'Edit TTV' : 'Input TTV';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTTV(event, '${id}', ${idx})" class="grid grid-cols-2 gap-4">
                <input type="datetime-local" name="time" value="${t ? t.time.replace(' ', 'T') : ''}" class="input-field col-span-2" required>
                <input name="td" value="${t ? t.td : ''}" placeholder="TD" class="input-field">
                <input name="gds" value="${t ? t.gds : ''}" placeholder="GDS" class="input-field">
                <button class="col-span-2 bg-teal-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },

    saveTTV(e, id, idx) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === id);
        const data = { time: e.target.time.value, td: e.target.td.value, gds: e.target.gds.value };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 3. VISIT DOKTER + SIMPAN/EDIT/HAPUS ---
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
                            <button onclick="app.modalVisit('${p.id}', ${i})" class="text-amber-500 bg-white p-1 rounded shadow-sm"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSub('${p.id}', 'visits', ${i})" class="text-red-500 bg-white p-1 rounded shadow-sm"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                        <p class="text-xs font-bold">${v.time}</p>
                        <p class="text-xs italic mb-2">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 bg-white border p-1 rounded">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    modalVisit(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const v = idx !== null ? p.visits[idx] : null;
        document.getElementById('modal-title').innerText = idx !== null ? 'Edit Visit Dokter' : 'Visit Dokter Baru';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field">
                <textarea id="v_note" placeholder="Catatan Dokter" class="input-field h-24">${v ? v.note : ''}</textarea>
                <div class="border p-2 bg-slate-50"><p class="text-xs mb-1">Tanda Tangan:</p><canvas id="sig-pad" class="w-full h-32 bg-white border"></canvas></div>
                <button onclick="app.saveVisit('${id}', ${idx})" class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN VISIT</button>
            </div>`;
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
        const photoFile = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : '';
        if(photoFile) photo = await this.toBase64(photoFile);
        
        const data = {
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString(),
            photo: photo,
            note: document.getElementById('v_note').value,
            sign: this.signaturePad.isEmpty() ? (v ? v.sign : '') : this.signaturePad.toDataURL()
        };

        if(idx !== null) p.visits[idx] = data;
        else p.visits.push(data);
        
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 4. RENCANA TERAPI + SIMPAN/HAPUS/EDIT ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <div class="flex gap-2">
                         <button onclick="app.modalTherapy('${p.id}')" class="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs">Edit/Simpan</button>
                         <button onclick="app.clearTherapy('${p.id}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs">Hapus</button>
                    </div>
                </div>
                <div class="p-4 bg-teal-50 rounded-xl min-h-[100px] text-sm text-teal-900 border border-teal-100">
                    ${p.therapy || '<i class="text-slate-400">Belum ada rencana terapi...</i>'}
                </div>
            </div>`).join('');
    },

    modalTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = 'Edit Rencana Terapi';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTherapy(event, '${id}')" class="space-y-4">
                <textarea name="therapy" class="input-field h-48" placeholder="Ketik rencana terapi di sini...">${p.therapy || ''}</textarea>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN TERAPI</button>
            </form>`;
        this.openModal();
    },

    saveTherapy(e, id) {
        e.preventDefault();
        this.data.patients.find(x => x.id === id).therapy = e.target.therapy.value;
        this.saveDB(); this.closeModal(); this.render();
    },

    clearTherapy(id) {
        if(confirm('Hapus isi rencana terapi ini?')) {
            this.data.patients.find(x => x.id === id).therapy = '';
            this.saveDB(); this.render();
        }
    },

    // --- UTILS (HAPUS & CARI) ---
    delSub(id, path, idx) {
        if(confirm('Hapus data ini?')) {
            const p = this.data.patients.find(x => x.id === id);
            const keys = path.split('.');
            let target = p;
            for(let i=0; i < keys.length; i++) target = target[keys[i]];
            target.splice(idx, 1);
            this.saveDB(); this.render();
        }
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};
