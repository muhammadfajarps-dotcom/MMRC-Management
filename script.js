const app = {
    // Sinkronisasi dengan localStorage
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    // 1. SISTEM AUTH (Login)
    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
        
        // Sesuai kredensial acuan
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
            Swal.fire({ icon: 'success', title: 'Login Berhasil', timer: 1000, showConfirmButton: false });
        } else {
            Swal.fire('Error', 'Username atau Password Salah!', 'error');
        }
    },

    // 2. NAVIGASI (Sinkron dengan sidebar)
    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if (btn) btn.classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase();
        this.render();
    },

    // 3. RENDER ENGINE
    render() {
        const container = document.getElementById('main-content');
        if (!container) return;
        container.innerHTML = '';

        switch (this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
        }
    },

    // --- VIEW: DASHBOARD (Manajemen Pasien) ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">Daftar Pasien Aktif</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold">+ Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.data.patients.map(p => `
                    <div class="card-patient search-item">
                        <div class="flex justify-between items-start mb-4">
                            <div>
                                <h4 class="font-bold text-lg text-teal-800">${p.reg.name}</h4>
                                <p class="text-xs text-slate-500">ID: ${p.id}</p>
                            </div>
                            <button onclick="app.delPatient('${p.id}')" class="text-red-400 hover:text-red-600"><i class="fas fa-trash"></i></button>
                        </div>
                        <div class="text-xs space-y-1 text-slate-600 mb-4">
                            <p><i class="fas fa-user mr-2"></i> ${p.reg.age} Thn | ${p.reg.gender}</p>
                            <p><i class="fas fa-map-marker-alt mr-2"></i> ${p.reg.addr}</p>
                        </div>
                        <button onclick="app.exportToWord('${p.id}')" class="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200">CETAK DOCX</button>
                    </div>
                `).join('')}
            </div>`;
    },

    // --- VIEW: MEDICINE ---
    viewMedicine(container) {
        container.innerHTML = `
            <div class="space-y-6">
                ${this.data.patients.map(p => `
                <div class="bg-white p-6 rounded-3xl shadow-sm border search-item">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                        <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs">+ Tambah Obat</button>
                    </div>
                    <table class="w-full text-xs text-left border rounded-lg overflow-hidden">
                        <tr class="bg-slate-50 border-b"><th class="p-3">Nama Obat</th><th class="p-3">Sisa Stok</th><th class="p-3">Aksi</th></tr>
                        ${(p.medicine?.stock || []).map((m, i) => `
                        <tr class="border-b hover:bg-slate-50">
                            <td class="p-3 font-medium">${m.name}</td>
                            <td class="p-3">${m.init - m.used}</td>
                            <td class="p-3 flex gap-2">
                                <button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-500 text-white px-3 py-1 rounded">Pakai 1</button>
                                <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 px-1"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`).join('')}
                    </table>
                </div>`).join('')}
            </div>`;
    },

    // --- VIEW: TTV & GDS ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input TTV</button>
                </div>
                <table class="w-full text-xs text-left border">
                    <tr class="bg-slate-50 border-b"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                    ${(p.ttv || []).map((t, i) => `
                    <tr class="border-b">
                        <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.gds}</td>
                        <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button></td>
                    </tr>`).join('')}
                </table>
            </div>`).join('');
    },

    // --- VIEW: VISIT DOKTER ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Visit Baru</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.visits || []).map((v, i) => `
                    <div class="border rounded-2xl p-4 bg-slate-50">
                        <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                        <p class="text-[10px] font-bold text-teal-600">${v.time}</p>
                        <p class="text-xs italic text-slate-700 my-2">"${v.note}"</p>
                        <div class="flex justify-between items-end">
                            <img src="${v.sign}" class="h-10 border-b bg-white">
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-500 text-sm"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    // 4. MODAL HANDLERS
    modalAddPatient() {
        document.getElementById('modal-title').innerText = "Registrasi Pasien Baru";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" placeholder="Nama Lengkap" class="input-field" required>
                <input name="age" type="number" placeholder="Usia" class="input-field" required>
                <select name="gender" class="input-field"><option>Laki-laki</option><option>Perempuan</option></select>
                <input name="addr" placeholder="Alamat" class="input-field" required>
                <button class="md:col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN PASIEN</button>
            </form>`;
        this.openModal();
    },

    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "Tambah Stok Obat";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="m_name" placeholder="Nama Obat" class="input-field">
                <input id="m_init" type="number" placeholder="Jumlah Stok" class="input-field">
                <button onclick="app.saveMed('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    modalVisit(pid) {
        document.getElementById('modal-title').innerText = "Input Visit Dokter";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field" accept="image/*">
                <textarea id="v_note" placeholder="Catatan Medis..." class="input-field h-24"></textarea>
                <div class="border rounded-xl p-2 bg-slate-50 text-center">
                    <p class="text-[10px] mb-2 uppercase font-bold">Tanda Tangan Dokter</p>
                    <canvas id="sig-pad" class="w-full h-40 border bg-white rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[10px] text-red-500 mt-2">Hapus TTD</button>
                </div>
                <button onclick="app.saveVisit('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        const canvas = document.getElementById('sig-pad');
        this.signaturePad = new SignaturePad(canvas);
    },

    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "Input TTV & GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" placeholder="Tensi (TD)" class="input-field">
                <input id="t_gds" placeholder="GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}')" class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    // 5. DATA ACTIONS (Save, Delete, Use)
    savePatient(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const newPatient = {
            id: 'MMRC-' + Date.now(),
            reg: Object.fromEntries(fd),
            medicine: { stock: [] },
            ttv: [],
            visits: []
        };
        this.data.patients.push(newPatient);
        this.saveDB(); this.closeModal(); this.render();
    },

    saveMed(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.stock.push({
            name: document.getElementById('m_name').value,
            init: parseInt(document.getElementById('m_init').value),
            used: 0
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    async saveVisit(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const file = document.getElementById('v_photo').files[0];
        let photo = "https://via.placeholder.com/300x200?text=No+Photo";
        if (file) photo = await this.toBase64(file);

        p.visits.push({
            time: new Date().toLocaleString('id-ID'),
            note: document.getElementById('v_note').value,
            photo: photo,
            sign: this.signaturePad.toDataURL()
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.ttv.push({
            time: new Date().toLocaleString('id-ID'),
            td: document.getElementById('t_td').value,
            gds: document.getElementById('t_gds').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    // 6. UTILS
    saveDB() { localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data)); },
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    
    useMed(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        if (p.medicine.stock[idx].init - p.medicine.stock[idx].used > 0) {
            p.medicine.stock[idx].used++;
            this.saveDB(); this.render();
        }
    },

    delSubItem(pid, path, idx) {
        if (!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for (let i = 0; i < parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        this.saveDB(); this.render();
    },

    delPatient(pid) {
        if (confirm('Hapus seluruh data pasien ini?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            this.saveDB(); this.render();
        }
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    // Placeholder untuk menu lain agar tidak error
    viewCrisis(c) { c.innerHTML = '<div class="p-10 text-center text-slate-400">Halaman Pasien Crisis</div>'; },
    viewProgram(c) { c.innerHTML = '<div class="p-10 text-center text-slate-400">Halaman Rencana Program</div>'; },
    viewTherapy(c) { c.innerHTML = '<div class="p-10 text-center text-slate-400">Halaman Rencana Terapi</div>'; }
};

// Start App
app.render();
