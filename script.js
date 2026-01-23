const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

   login() {
    // Ambil element input
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-pass');

    // Validasi apakah element ada di HTML
    if (!userInput || !passInput) {
        console.error("Input login tidak ditemukan di HTML!");
        return;
    }

    const u = userInput.value.trim(); // .trim() untuk buang spasi liar
    const p = passInput.value.trim();

    if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
        // Hilangkan layar login, munculkan aplikasi
        document.getElementById('auth-layer').classList.add('hidden');
        document.getElementById('app-layer').classList.remove('hidden');
        
        // Pindah ke dashboard
        this.nav('dashboard');
        
        Swal.fire({
            icon: 'success',
            title: 'Login Berhasil',
            timer: 1000,
            showConfirmButton: false
        });
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
        if(!container) return;
        container.innerHTML = '';
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- 1. MEDICINE & STOCK (FIXED) ---
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
                                <button onclick="app.editMed('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
                                <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
                                <button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-500 text-white px-2 rounded">Pakai</button>
                            </td>
                        </tr>`).join('')}
                    </table>
                </div>`).join('')}
            </div>`;
    },

    modalMedStock(patientId) {
        document.getElementById('modal-title').innerText = "Tambah Stok Obat";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveNewMed(event, '${patientId}')" class="space-y-4">
                <input name="name" placeholder="Nama Obat" class="input-field" required>
                <input type="number" name="init" placeholder="Jumlah Stok Awal" class="input-field" required>
                <button class="w-full bg-teal-600 text-white py-2 rounded">Simpan Obat</button>
            </form>`;
        this.openModal();
    },

    saveNewMed(e, patientId) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === patientId);
        if(!p.medicine) p.medicine = { stock: [] };
        p.medicine.stock.push({
            name: e.target.name.value,
            init: parseInt(e.target.init.value),
            used: 0
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    editMed(patientId, index) {
        const p = this.data.patients.find(x => x.id === patientId);
        const m = p.medicine.stock[index];
        Swal.fire({
            title: 'Edit Nama Obat',
            input: 'text',
            inputValue: m.name,
            showCancelButton: true
        }).then(res => {
            if(res.value) {
                m.name = res.value;
                this.saveDB(); this.render();
            }
        });
    },

    useMed(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        if(p.medicine.stock[idx].init - p.medicine.stock[idx].used > 0) {
            p.medicine.stock[idx].used++;
            this.saveDB(); this.render();
        } else {
            Swal.fire('Habis', 'Stok obat sudah 0', 'error');
        }
    },

    // --- 2. TTV & GDS (FIXED) ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input TTV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left border">
                        <tr class="bg-slate-50 border-b">
                            <th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">GDS</th><th class="p-2">Aksi</th>
                        </tr>
                        ${(p.ttv || []).map((t, i) => `
                        <tr class="border-b">
                            <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.gds}</td>
                            <td class="p-2 flex gap-2">
                                <button onclick="app.editTTV('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
                                <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`).join('')}
                    </table>
                </div>
            </div>`).join('');
    },

    modalTTV(id) {
        document.getElementById('modal-title').innerText = "Input TTV Baru";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTTV(event, '${id}')" class="space-y-4">
                <input name="td" placeholder="Tensi Darah (TD)" class="input-field" required>
                <input name="gds" placeholder="Gula Darah (GDS)" class="input-field" required>
                <button class="w-full bg-teal-600 text-white py-2 rounded">Simpan TTV</button>
            </form>`;
        this.openModal();
    },

    saveTTV(e, id) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === id);
        if(!p.ttv) p.ttv = [];
        p.ttv.push({
            time: new Date().toLocaleString('id-ID'),
            td: e.target.td.value,
            gds: e.target.gds.value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    editTTV(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const t = p.ttv[idx];
        document.getElementById('modal-title').innerText = "Edit TTV";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.updateTTV(event, '${id}', ${idx})" class="space-y-4">
                <input name="td" value="${t.td}" class="input-field" required>
                <input name="gds" value="${t.gds}" class="input-field" required>
                <button class="w-full bg-amber-600 text-white py-2 rounded">Update TTV</button>
            </form>`;
        this.openModal();
    },

    updateTTV(e, id, idx) {
        e.preventDefault();
        const p = this.data.patients.find(x => x.id === id);
        p.ttv[idx].td = e.target.td.value;
        p.ttv[idx].gds = e.target.gds.value;
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 3. VISIT DOKTER (FIXED) ---
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
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-600"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2">
                        <p class="text-xs font-bold">${v.time}</p>
                        <p class="text-xs italic">"${v.note}"</p>
                        <img src="${v.sign}" class="h-8 mt-2">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    modalVisit(id) {
        document.getElementById('modal-title').innerText = "Input Visit Baru";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field" accept="image/*">
                <textarea id="v_note" placeholder="Catatan Dokter..." class="input-field h-24"></textarea>
                <div class="border rounded bg-white p-2">
                    <p class="text-[10px] text-slate-400">Tanda Tangan:</p>
                    <canvas id="sig-pad" class="w-full h-32 border"></canvas>
                </div>
                <button onclick="app.saveVisit('${id}')" class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        const canvas = document.getElementById('sig-pad');
        this.signaturePad = new SignaturePad(canvas);
    },

    async saveVisit(id) {
        const p = this.data.patients.find(x => x.id === id);
        const file = document.getElementById('v_photo').files[0];
        const note = document.getElementById('v_note').value;
        const sign = this.signaturePad.toDataURL();
        
        let photo = "https://via.placeholder.com/150";
        if(file) photo = await this.toBase64(file);

        if(!p.visits) p.visits = [];
        p.visits.push({
            time: new Date().toLocaleString('id-ID'),
            note: note,
            photo: photo,
            sign: sign
        });
        
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- UTILS (WAJIB ADA) ---
    delSubItem(patientId, path, index) {
        Swal.fire({
            title: 'Hapus Item?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus'
        }).then(res => {
            if(res.isConfirmed) {
                const p = this.data.patients.find(x => x.id === patientId);
                const parts = path.split('.');
                let target = p;
                for(let i=0; i<parts.length; i++) { target = target[parts[i]]; }
                target.splice(index, 1);
                this.saveDB(); this.render();
            }
        });
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    
    // Fallback untuk dashboard agar tidak error saat render
    viewDashboard(c) { c.innerHTML = `<h1 class="text-2xl font-bold">Selamat Datang di MMRC</h1><p>Gunakan menu samping untuk mengelola data.</p>`; },
    viewCrisis(c) { c.innerHTML = `Halaman Crisis`; },
    viewProgram(c) { c.innerHTML = `Halaman Program`; },
    viewTherapy(c) { c.innerHTML = `Halaman Therapy`; }
};

// Auto render saat pertama buka
app.render();
