const app = {
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
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- 1. MEDICINE & STOCK (UPGRADE: EDIT & HAPUS LOG) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                    <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs">+ Stok</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <p class="font-bold text-[10px] text-slate-400 mb-2 uppercase">Stok Obat</p>
                        <table class="w-full text-xs text-left border">
                            <tr class="bg-slate-50 border-b"><th class="p-2">Obat</th><th class="p-2">Sisa</th><th class="p-2">Aksi</th></tr>
                            ${(p.medicine?.stock || []).map((m, i) => `
                            <tr class="border-b">
                                <td class="p-2">${m.name}</td><td class="p-2">${m.init - m.used}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
                                    <button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-500 text-white px-2 rounded">Pakai</button>
                                </td>
                            </tr>`).join('')}
                        </table>
                    </div>
                    <div>
                        <p class="font-bold text-[10px] text-slate-400 mb-2 uppercase">Catatan Penggunaan</p>
                        <div class="space-y-2 h-40 overflow-y-auto bg-slate-50 p-2 rounded">
                            ${(p.medicine?.logs || []).map((l, i) => `
                            <div class="p-2 bg-white border rounded text-[10px] flex justify-between items-center">
                                <span><b>${l.time}</b>: ${l.name}</span>
                                <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-times"></i></button>
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

    // --- 2. TTV & GDS (UPGRADE: EDIT AKTIF) ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input TTV</button>
                </div>
                <table class="w-full text-xs text-left border">
                    <tr class="bg-slate-50 border-b"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                    ${(p.ttv || []).map((t, i) => `
                    <tr class="border-b">
                        <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.gds}</td>
                        <td class="p-2 flex gap-2">
                            <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
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
                <input name="time" value="${t ? t.time : new Date().toLocaleString()}" class="input-field col-span-2">
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

    // --- 3. VISIT DOKTER (UPGRADE: FIX SIMPAN, EDIT & HAPUS) ---
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
                            <button onclick="app.modalVisit('${p.id}', ${i})" class="text-amber-600 bg-white p-1 rounded shadow-sm"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-600 bg-white p-1 rounded shadow-sm"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                        <p class="text-xs font-bold">${v.time}</p>
                        <p class="text-xs italic">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 mt-2 bg-white p-1 border">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    modalVisit(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const v = idx !== null ? p.visits[idx] : null;
        document.getElementById('modal-title').innerText = idx !== null ? 'Edit Visit' : 'Input Visit Baru';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field">
                <textarea id="v_note" placeholder="Catatan Dokter" class="input-field h-24">${v ? v.note : ''}</textarea>
                <div class="border p-2 bg-white rounded"><canvas id="sig-pad" class="w-full h-32"></canvas></div>
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
        let photoBase64 = idx !== null ? p.visits[idx].photo : 'https://via.placeholder.com/150';
        
        if(photoFile) photoBase64 = await this.toBase64(photoFile);
        
        const data = {
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString(),
            photo: photoBase64,
            note: document.getElementById('v_note').value,
            sign: this.signaturePad.toDataURL()
        };

        if(idx !== null) p.visits[idx] = data;
        else p.visits.push(data);

        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 4. RENCANA TERAPI (UPGRADE: SIMPAN, EDIT, HAPUS) ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <div class="flex gap-2">
                         <button onclick="app.modalTherapy('${p.id}')" class="bg-amber-100 text-amber-700 px-3 py-1 rounded text-xs">Edit/Simpan</button>
                         <button onclick="app.delTherapy('${p.id}')" class="bg-red-100 text-red-700 px-3 py-1 rounded text-xs">Hapus</button>
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
            <textarea id="t_plan" class="input-field h-40">${p.therapy || ''}</textarea>
            <button onclick="app.saveTherapy('${id}')" class="w-full bg-teal-600 text-white py-2 mt-4 rounded font-bold">SIMPAN RENCANA</button>`;
        this.openModal();
    },

    saveTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        p.therapy = document.getElementById('t_plan').value;
        this.saveDB(); this.closeModal(); this.render();
    },

    delTherapy(id) {
        if(confirm('Hapus rencana terapi?')) {
            this.data.patients.find(x => x.id === id).therapy = '';
            this.saveDB(); this.render();
        }
    },

    // --- FITUR UTILS (TETAP SAMA) ---
    useMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock[idx].used++;
        if(!p.medicine.logs) p.medicine.logs = [];
        p.medicine.logs.unshift({ name: p.medicine.stock[idx].name, time: new Date().toLocaleString() });
        this.saveDB(); this.render();
    },

    delSubItem(patientId, path, index) {
        if(confirm('Hapus item ini?')) {
            const p = this.data.patients.find(x => x.id === patientId);
            const parts = path.split('.');
            let target = p;
            for(let i=0; i<parts.length; i++) target = target[parts[i]];
            target.splice(index, 1);
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
