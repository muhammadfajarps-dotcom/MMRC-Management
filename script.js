const app = {
    // 1. DATABASE & INITIALIZATION
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    // 2. SISTEM LOGIN (Sesuai HTML)
    login() {
        const user = document.getElementById('login-user').value;
        const pass = document.getElementById('login-pass').value;

        if (user === 'ADMIN' && pass === 'MMRC123') { // Ganti username/pass sesuai keinginan
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Gagal', 'Username atau Password salah!', 'error');
        }
    },

    // 3. NAVIGASI (Sesuai HTML)
    nav(page) {
        this.currentPage = page;
        
        // Update UI Button Active
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.getElementById(`btn-${page}`);
        if(activeBtn) activeBtn.classList.add('active');

        // Update Judul
        document.getElementById('page-title').innerText = page.toUpperCase();

        // Render Konten
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';

        if (this.currentPage === 'dashboard') {
            this.renderDashboard(container);
        } else {
            container.innerHTML = `<div class="text-center p-20 text-slate-400">Fitur ${this.currentPage} sedang dalam pengembangan atau gunakan Dashboard untuk kelola data.</div>`;
        }
    },

    // 4. FITUR DASHBOARD (CRUD)
    renderDashboard(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-xl font-bold">Daftar Pasien</h3>
                <button onclick="app.modalPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">+ Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 gap-4">
                ${this.data.patients.length === 0 ? '<p class="text-center py-10">Belum ada data pasien.</p>' : ''}
                ${this.data.patients.map(p => `
                    <div class="card-patient search-item flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <div>
                            <h4 class="font-bold text-lg text-teal-700">${p.name}</h4>
                            <p class="text-sm text-slate-500">${p.age} Tahun | ${p.address}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="app.modalPatient('${p.id}')" class="bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-bold text-xs"><i class="fas fa-edit"></i> EDIT</button>
                            <button onclick="app.deletePatient('${p.id}')" class="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-bold text-xs"><i class="fas fa-trash"></i> HAPUS</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // 5. MODAL INPUT & EDIT
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Data Pasien' : 'Registrasi Pasien Baru';
        
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${id ? `'${id}'` : 'null'})" class="space-y-4">
                <div>
                    <label class="text-xs font-bold text-slate-500">NAMA LENGKAP</label>
                    <input type="text" name="name" value="${p ? p.name : ''}" class="input-field" required>
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-500">USIA</label>
                    <input type="number" name="age" value="${p ? p.age : ''}" class="input-field" required>
                </div>
                <div>
                    <label class="text-xs font-bold text-slate-500">ALAMAT</label>
                    <textarea name="address" class="input-field" required>${p ? p.address : ''}</textarea>
                </div>
                <button type="submit" class="w-full bg-teal-600 text-white py-3 rounded-xl font-bold">
                    ${id ? 'UPDATE DATA' : 'SIMPAN DATA'}
                </button>
            </form>
        `;
        this.openModal();
    },

    savePatient(e, id) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const patientData = {
            id: id || Date.now().toString(),
            name: fd.get('name'),
            age: fd.get('age'),
            address: fd.get('address')
        };

        if (id) {
            // Edit data lama
            const index = this.data.patients.findIndex(p => p.id === id);
            this.data.patients[index] = patientData;
        } else {
            // Tambah data baru
            this.data.patients.push(patientData);
        }

        this.saveDB();
        this.closeModal();
        this.render();
        Swal.fire('Berhasil', 'Data telah disimpan!', 'success');
    },

    deletePatient(id) {
        Swal.fire({
            title: 'Hapus data?',
            text: "Data yang dihapus tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Ya, Hapus!'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(p => p.id !== id);
                this.saveDB();
                this.render();
            }
        });
    },

    // 6. FITUR CARI (Sesuai HTML)
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            const text = el.innerText.toLowerCase();
            el.style.display = text.includes(q) ? 'flex' : 'none';
        });
    },

    // UTILS
    openModal() {
        document.getElementById('modal-container').classList.remove('hidden');
        document.getElementById('modal-container').classList.add('flex');
    },
    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').classList.remove('flex');
    }
};

// Jalankan sistem saat page load
window.onload = () => {
    // Pastikan jika refresh masih login atau kembali ke login
    // Sementara kita biarkan user login manual
};
