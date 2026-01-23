const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MMRC1999') {
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

    // --- 1. MEDICINE & STOCK (TAMBAH EDIT, HAPUS, CARI) ---
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

    // --- 2. TTV & GDS (TAMBAH EDIT, HAPUS, CARI) ---
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

    // --- 3. VISIT DOKTER (TAMBAH EDIT, HAPUS, CARI) ---
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
                            <button onclick="app.editVisit('${p.id}', ${i})" class="text-amber-600"><i class="fas fa-edit"></i></button>
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

    // --- 4 & 5. DOWNLOAD DOCX (LENGKAP TEKS + GAMBAR + GRAFIK) ---
    async exportToWord(patientId) {
        const p = this.data.patients.find(x => x.id === patientId);
        const { Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell, WidthType } = docx;

        // Mengambil screenshot grafik jika ada
        let chartImg;
        const chartCanvas = document.getElementById(`chart-${p.id}`);
        if(chartCanvas) chartImg = chartCanvas.toDataURL("image/png");

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ children: [new TextRun({ text: `DATA PASIEN: ${p.reg.name}`, bold: true, size: 32 })] }),
                    new Paragraph({ text: `Usia: ${p.reg.age} | Alamat: ${p.reg.addr}` }),
                    new Paragraph({ text: `Status: ${p.reg.status} | Wali: ${p.reg.guardian}` }),
                    
                    new Paragraph({ text: "\nI. RIWAYAT & DIAGNOSA", bold: true }),
                    new Paragraph({ text: `Diagnosa Masuk: ${p.diagnosis?.entry_diag || '-'}` }),
                    new Paragraph({ text: `Resep Obat: ${p.diagnosis?.rx || '-'}` }),

                    new Paragraph({ text: "\nII. GRAFIK BPSS (7 HARI)", bold: true }),
                    ...(chartImg ? [new Paragraph({
                        children: [new ImageRun({ data: chartImg, transformation: { width: 400, height: 200 } })]
                    })] : [new Paragraph("Tidak ada data grafik")]),

                    new Paragraph({ text: "\nIII. DATA VISIT DOKTER", bold: true }),
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
        link.download = `Data_MMRC_${p.reg.name}.docx`;
        link.click();
    },

    // --- FITUR UTILS: HAPUS & CARI ---
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
                for(let i=0; i<parts.length; i++) {
                    target = target[parts[i]];
                }
                target.splice(index, 1);
                this.saveDB();
                this.render();
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
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};
