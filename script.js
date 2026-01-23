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
        if(!container) return;
        container.innerHTML = '';
        if (this.currentPage === 'dashboard') this.viewDashboard ? this.viewDashboard(container) : container.innerHTML = 'Dashboard Ready';
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
        // Tambahkan fungsi view lain (crisis, program, dll) jika Anda memilikinya di file asli
    },

    // --- 1. MEDICINE & STOCK (FIX: EDIT & HAPUS AKTIF) ---
    viewMedicine(container) {
        container.innerHTML = `
            <div class="space-y-6">
                ${this.data.patients.map(p => `
                <div class="bg-white p-6 rounded-3xl shadow-sm border search-item">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                        <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs">+ Stok</button>
                    </div>
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
                </div>`).join('')}
            </div>`;
    },

    modalMedStock(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine) p.medicine = { stock: [], logs: [] };
        const m = idx !== null ? p.medicine.stock[idx] : null;
        
        document.getElementById('modal-title').innerText = idx !== null ? 'Edit Stok' : 'Tambah Stok';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${m ? m.name : ''}" placeholder="Nama Obat" class="w-full p-2 border rounded">
                <input id="ms_init" type="number" value="${m ? m.init : ''}" placeholder="Jumlah Stok" class="w-full p-2 border rounded">
                <button onclick="app.saveMedStock('${id}', ${idx})" class="w-full bg-teal-600 text-white py-2 rounded">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    saveMedStock(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const name = document.getElementById('ms_name').value;
        const init = parseInt(document.getElementById('ms_init').value);
        
        if(!name || isNaN(init)) return Swal.fire('Error', 'Isi data dengan benar', 'error');

        const data = { name, init, used: idx !== null ? p.medicine.stock[idx].used : 0 };
        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 2. TTV & GDS (FIX: EDIT AKTIF) ---
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
        document.getElementById('modal-title').innerText = 'Input TTV';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ttv_td" value="${t ? t.td : ''}" placeholder="Tensi (TD)" class="w-full p-2 border rounded">
                <input id="ttv_gds" value="${t ? t.gds : ''}" placeholder="GDS" class="w-full p-2 border rounded">
                <button onclick="app.saveTTV('${id}', ${idx})" class="w-full bg-teal-600 text-white py-2 rounded">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    saveTTV(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.ttv) p.ttv = [];
        const data = { 
            time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString(), 
            td: document.getElementById('ttv_td').value, 
            gds: document.getElementById('ttv_gds').value 
        };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 3. VISIT DOKTER (FIX: SIMPAN & EDIT BERFUNGSI) ---
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
                            <button onclick="app.modalVisit('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                        <p class="text-[10px] font-bold">${v.time}</p>
                        <p class="text-xs italic">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 mt-2 border bg-white">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    modalVisit(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const v = idx !== null ? p.visits[idx] : null;
        document.getElementById('modal-title').innerText = 'Visit Dokter';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-3">
                <input type="file" id="v_photo" class="w-full text-xs">
                <textarea id="v_note" placeholder="Catatan Medis" class="w-full p-2 border rounded h-20">${v ? v.note : ''}</textarea>
                <div class="border rounded bg-white"><canvas id="sig-pad" class="w-full h-32"></canvas></div>
                <button onclick="app.saveVisit('${id}', ${idx})" class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            this.signaturePad = new SignaturePad(canvas);
            if(v) this.signaturePad.fromDataURL(v.sign);
        }, 300);
    },

    async saveVisit(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.visits) p.visits = [];
        const file = document.getElementById('v_photo').files[0];
        let photo = v ? v.photo : 'https://via.placeholder.com/150';
        if(file) photo = await this.toBase64(file);

        const data = {
            time: idx !== null ? p.visits[idx].time : new Date().toLocaleString(),
            note: document.getElementById('v_note').value,
            photo: photo,
            sign: this.signaturePad.toDataURL()
        };

        if(idx !== null) p.visits[idx] = data;
        else p.visits.push(data);
        
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 4. RENCANA TERAPI (FIX: TOMBOL LENGKAP) ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <div class="flex gap-2">
                         <button onclick="app.modalTherapy('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-[10px]">Edit/Simpan</button>
                         <button onclick="app.delTherapy('${p.id}')" class="bg-red-600 text-white px-3 py-1 rounded text-[10px]">Hapus</button>
                    </div>
                </div>
                <div class="p-4 bg-slate-50 rounded-xl min-h-[80px] text-sm">
                    ${p.therapy || '<span class="text-slate-400 italic">Belum ada rencana terapi...</span>'}
                </div>
            </div>`).join('');
    },

    modalTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = 'Rencana Terapi';
        document.getElementById('modal-body').innerHTML = `
            <textarea id="t_plan" class="w-full p-2 border rounded h-40">${p.therapy || ''}</textarea>
            <button onclick="app.saveTherapy('${id}')" class="w-full bg-teal-600 text-white py-2 mt-2 rounded">SIMPAN</button>`;
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

    // --- UTILS (WAJIB ADA AGAR TIDAK ERROR) ---
    saveDB() { localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data)); },
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    useMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        p.medicine.stock[idx].used++;
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
    }
};
