const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    login() {
        const u = document.getElementById('login-user').value.trim();
        const p = document.getElementById('login-pass').value.trim();
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
        if (!container) return;
        container.innerHTML = '';
        
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        else if (this.currentPage === 'medicine') this.viewMedicine(container);
        else if (this.currentPage === 'ttv') this.viewTTV(container);
        else if (this.currentPage === 'visit') this.viewVisit(container);
        else if (this.currentPage === 'crisis') this.viewCrisis(container);
        else if (this.currentPage === 'program') this.viewProgram(container);
        else if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- DASHBOARD: REGISTRASI & BIODATA ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DATA REGISTRASI PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-teal-700 shadow-lg">+ REGISTRASI BARU</button>
            </div>
            <div class="grid grid-cols-1 gap-6">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="border-r pr-4">
                                <div class="flex items-center gap-4 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-20 h-20 rounded-2xl object-cover border-2 border-teal-50">
                                    <div>
                                        <h4 class="font-bold text-teal-700 text-lg">${p.reg.name}</h4>
                                        <p class="text-[10px] text-slate-400">Masuk: ${p.reg.timestamp}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>Usia:</b> ${p.reg.age} Thn | <b>Status:</b> ${p.reg.status}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2">DIAGNOSA & RESEP</h5>
                                <div class="text-[11px] bg-slate-50 p-3 rounded-xl">
                                    <p><b>Diagnosa:</b> ${p.diagnosis.entry_diag || '-'}</p>
                                    <p class="mt-2 text-teal-700"><b>Obat:</b> ${p.diagnosis.rx_name} (${p.diagnosis.rx_qty} Tab)</p>
                                </div>
                            </div>
                            <div class="flex flex-col justify-center gap-2">
                                <button onclick="app.exportToWord('${p.id}')" class="bg-blue-50 text-blue-600 py-2 rounded-xl text-xs font-bold border border-blue-100">DOWNLOAD DOCX</button>
                                <button onclick="app.delPatient('${p.id}')" class="bg-red-50 text-red-600 py-2 rounded-xl text-xs font-bold border border-red-100">HAPUS PASIEN</button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    modalAddPatient() {
        document.getElementById('modal-title').innerText = "FORM REGISTRASI PASIEN";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event)" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-3">
                    <p class="text-xs font-bold text-teal-600">BIODATA</p>
                    <input name="name" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="age" type="number" placeholder="Usia" class="input-field" required>
                    <input name="guardian" placeholder="Nama Wali" class="input-field">
                    <input name="addr" placeholder="Alamat" class="input-field">
                    <input name="photo_file" type="file" class="input-field text-xs">
                </div>
                <div class="space-y-3">
                    <p class="text-xs font-bold text-teal-600">MEDIS AWAL</p>
                    <textarea name="d_entry" placeholder="Diagnosa Masuk" class="input-field h-20"></textarea>
                    <input name="d_rx" placeholder="Nama Obat Utama" class="input-field">
                    <input name="d_qty" type="number" placeholder="Jumlah Stok Obat" class="input-field">
                </div>
                <button class="md:col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN DATA PASIEN</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        let photoBase64 = null;
        if (photoFile && photoFile.size > 0) photoBase64 = await this.toBase64(photoFile);

        const newPatient = {
            id: 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), age: fd.get('age'), guardian: fd.get('guardian'),
                addr: fd.get('addr'), photo: photoBase64, timestamp: new Date().toLocaleString('id-ID')
            },
            diagnosis: { entry_diag: fd.get('d_entry'), rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty') },
            medicine: { stock: [], logs: [] },
            ttv: [], visits: [], crisis: { bpss: [] }, program: {}, therapy: ""
        };

        // Otomatis masukkan stok obat ke modul Medicine
        if(fd.get('d_rx')) {
            newPatient.medicine.stock.push({
                name: fd.get('d_rx'), init: parseInt(fd.get('d_qty')) || 0, used: 0, exp: '-'
            });
        }

        this.data.patients.push(newPatient);
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Berhasil', 'Pasien telah didaftarkan', 'success');
    },

    // --- FUNGSI EXPORT EXCEL (AGAR TIDAK ERROR) ---
    exportAllExcel() {
        if(this.data.patients.length === 0) return Swal.fire('Kosong', 'Tidak ada data', 'warning');
        const sheetData = this.data.patients.map(p => ({
            Nama: p.reg.name, Usia: p.reg.age, Alamat: p.reg.addr, 
            Wali: p.reg.guardian, Diagnosa: p.diagnosis.entry_diag, Obat: p.diagnosis.rx_name
        }));
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "Data_MMRC.xlsx");
    },

    // --- UTILS ---
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },
    delPatient(pid) {
        Swal.fire({
            title: 'Hapus Pasien?',
            text: "Semua data medis akan hilang!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(x => x.id !== pid);
                this.saveDB(); this.render();
            }
        });
    },
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    app.render();
});
