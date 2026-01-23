const app = {
    // 1. DATA CORE (Mengikuti struktur asli HTML Anda)
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    // 2. SISTEM LOGIN (Sesuai HTML)
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

    // 3. NAVIGASI (Sesuai ID btn- di HTML Anda)
    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');
        
        document.getElementById('page-title').innerText = page.replace('-', ' ').toUpperCase();
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';

        // Router Menu
        switch(this.currentPage) {
            case 'dashboard': this.viewDashboard(container); break;
            case 'medicine': this.viewMedicine(container); break;
            case 'ttv': this.viewTTV(container); break;
            case 'visit': this.viewVisit(container); break;
            case 'crisis': this.viewCrisis(container); break;
            case 'program': this.viewProgram(container); break;
            case 'therapy': this.viewTherapy(container); break;
            default: container.innerHTML = '<p class="text-center p-20">Menu sedang dikembangkan.</p>';
        }
    },

    // --- VIEW DASHBOARD ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Daftar Pasien</h3>
                <button onclick="app.modalPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">+ Registrasi Baru</button>
            </div>
            <div class="grid grid-cols-1 gap-4">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item flex justify-between items-center">
                        <div>
                            <h4 class="font-bold text-teal-700">${p.registration.name}</h4>
                            <p class="text-xs text-slate-500">${p.registration.age} Th | ${p.registration.address}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="app.downloadWord('${p.id}')" class="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">WORD</button>
                            <button onclick="app.modalPatient('${p.id}')" class="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-xs font-bold">EDIT</button>
                            <button onclick="app.deletePatient('${p.id}')" class="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-xs font-bold">HAPUS</button>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    // --- VIEW MEDICINE (EVALUASI 1: EDIT & HAPUS ADA) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-teal-700">${p.registration.name}</h3>
                    <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Tambah Stok</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <table class="w-full text-xs border">
                        <tr class="bg-slate-50 border-b"><th class="p-2">Obat</th><th class="p-2">Sisa</th><th class="p-2">Aksi</th></tr>
                        ${(p.medicine_stock || []).map((m, i) => `
                        <tr class="border-b">
                            <td class="p-2">${m.name}</td><td class="p-2">${m.stock}</td>
                            <td class="p-2 flex gap-2">
                                <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                <button onclick="app.delItem('${p.id}', 'medicine_stock', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                            </td>
                        </tr>`).join('')}
                    </table>
                </div>
            </div>`).join('');
    },

    // --- VIEW TTV (EVALUASI 2: EDIT ADA) ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.registration.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input TTV</button>
                </div>
                <table class="w-full text-xs text-left border">
                    <tr class="bg-slate-50 border-b">
                        <th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">GDS</th><th class="p-2">Aksi</th>
                    </tr>
                    ${(p.ttv_records || []).map((t, i) => `
                    <tr class="border-b">
                        <td class="p-2">${t.date}</td><td class="p-2">${t.td}</td><td class="p-2">${t.gds}</td>
                        <td class="p-2 flex gap-2">
                            <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delItem('${p.id}', 'ttv_records', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                        </td>
                    </tr>`).join('')}
                </table>
            </div>`).join('');
    },

    // --- VIEW VISIT (EVALUASI 3: EDIT & HAPUS BISA SIMPAN) ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.registration.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Visit Baru</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.doctor_visits || []).map((v, i) => `
                    <div class="border rounded-xl p-3 bg-slate-50 relative">
                        <div class="absolute top-2 right-2 flex gap-2">
                            <button onclick="app.modalVisit('${p.id}', ${i})" class="text-amber-500 bg-white p-1 rounded shadow-sm"><i class="fas fa-edit"></i></button>
                            <button onclick="app.delItem('${p.id}', 'doctor_visits', ${i})" class="text-red-500 bg-white p-1 rounded shadow-sm"><i class="fas fa-trash"></i></button>
                        </div>
                        <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2">
                        <p class="text-[10px] font-bold">${v.date}</p>
                        <p class="text-xs italic">"${v.note}"</p>
                        <img src="${v.signature}" class="h-8 mt-2 bg-white border">
                    </div>`).join('')}
                </div>
            </div>`).join('');
    },

    // --- VIEW THERAPY (EVALUASI 4: SIMPAN, HAPUS, EDIT) ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl shadow-sm border mb-6 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold">${p.registration.name}</h3>
                    <div class="flex gap-2">
                         <button onclick="app.modalTherapy('${p.id}')" class="bg-amber-500 text-white px-3 py-1 rounded text-xs">Edit/Simpan</button>
                         <button onclick="app.delTherapy('${p.id}')" class="bg-red-500 text-white px-3 py-1 rounded text-xs">Hapus</button>
                    </div>
                </div>
                <div class="p-4 bg-teal-50 rounded-xl min-h-[100px] text-sm text-teal-900 border border-teal-100">
                    ${p.therapy_plan || '<i class="text-slate-400">Belum ada rencana terapi...</i>'}
                </div>
            </div>`).join('');
    },

    // --- MODAL & LOGIC ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Data Pasien' : 'Registrasi Pasien';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${id ? `'${id}'` : 'null'})" class="space-y-4">
                <input name="name" value="${p ? p.registration.name : ''}" placeholder="Nama Lengkap" class="input-field" required>
                <input name="age" value="${p ? p.registration.age : ''}" placeholder="Usia" class="input-field" required>
                <textarea name="addr" placeholder="Alamat" class="input-field">${p ? p.registration.address : ''}</textarea>
                <button class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },

    savePatient(e, id) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const data = { name: fd.get('name'), age: fd.get('age'), address: fd.get('addr') };
        
        if(id) {
            const p = this.data.patients.find(x => x.id === id);
            p.registration = data;
        } else {
            this.data.patients.push({
                id: Date.now().toString(),
                registration: data,
                medicine_stock: [],
                ttv_records: [],
                doctor_visits: [],
                therapy_plan: ''
            });
        }
        this.saveDB(); this.closeModal(); this.render();
    },

    modalVisit(id, idx = null) {
        const p = this.data.patients.find(x => x.id === id);
        const v = idx !== null ? p.doctor_visits[idx] : null;
        document.getElementById('modal-title').innerText = 'Input Visit Dokter';
        document.getElementById('modal-body').innerHTML = `
            <input type="file" id="v_file" class="input-field mb-4">
            <textarea id="v_note" placeholder="Catatan" class="input-field h-24 mb-4">${v ? v.note : ''}</textarea>
            <canvas id="v_sig" class="w-full h-32 border bg-white mb-4"></canvas>
            <button onclick="app.saveVisit('${id}', ${idx})" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN VISIT</button>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('v_sig');
            this.signaturePad = new SignaturePad(canvas);
            if(v) this.signaturePad.fromDataURL(v.signature);
        }, 200);
    },

    async saveVisit(id, idx) {
        const p = this.data.patients.find(x => x.id === id);
        const file = document.getElementById('v_file').files[0];
        let photo = v ? v.photo : 'https://via.placeholder.com/150';
        if(file) photo = await this.toBase64(file);

        const vData = {
            date: new Date().toLocaleString(),
            note: document.getElementById('v_note').value,
            photo: photo,
            signature: this.signaturePad.toDataURL()
        };

        if(idx !== null) p.doctor_visits[idx] = vData;
        else p.doctor_visits.push(vData);
        
        this.saveDB(); this.closeModal(); this.render();
    },

    modalTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = 'Edit Terapi';
        document.getElementById('modal-body').innerHTML = `
            <textarea id="t_plan" class="input-field h-40">${p.therapy_plan || ''}</textarea>
            <button onclick="app.saveTherapy('${id}')" class="w-full bg-teal-600 text-white py-3 mt-4 rounded-xl font-bold">SIMPAN RENCANA</button>`;
        this.openModal();
    },

    saveTherapy(id) {
        const p = this.data.patients.find(x => x.id === id);
        p.therapy_plan = document.getElementById('t_plan').value;
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- FITUR DOWNLOAD WORD (DOCX) ---
    async downloadWord(id) {
        const p = this.data.patients.find(x => x.id === id);
        const { Document, Packer, Paragraph, TextRun, ImageRun } = docx;

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: `LAPORAN PASIEN: ${p.registration.name}`, bold: true, size: 28 })] }),
                    new Paragraph({ text: `Usia: ${p.registration.age} | Alamat: ${p.registration.address}` }),
                    new Paragraph({ text: `\nRENCANA TERAPI:`, bold: true }),
                    new Paragraph({ text: p.therapy_plan || '-' }),
                    new Paragraph({ text: `\nVISIT DOKTER:`, bold: true }),
                    ...p.doctor_visits.map(v => new Paragraph({
                        children: [
                            new TextRun({ text: `Waktu: ${v.date} | Note: ${v.note}`, break: 1 }),
                            new ImageRun({ data: v.signature, transformation: { width: 100, height: 40 } })
                        ]
                    }))
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Report_${p.registration.name}.docx`;
        link.click();
    },

    // --- HELPER UTILS ---
    delItem(pid, key, idx) {
        if(confirm('Hapus data ini?')) {
            this.data.patients.find(x => x.id === pid)[key].splice(idx, 1);
            this.saveDB(); this.render();
        }
    },
    deletePatient(id) {
        if(confirm('Hapus seluruh data pasien ini?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== id);
            this.saveDB(); this.render();
        }
    },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'flex' : 'none';
        });
    },
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};
