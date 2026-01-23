const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    save() {
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
            Swal.fire('Gagal', 'Username atau Password salah!', 'error');
        }
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-${page}`).classList.add('active');
        document.getElementById('page-title').innerText = page.replace('_', ' ');
        this.render();
    },

    render() {
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        
        if (this.currentPage === 'dashboard') this.viewDashboard(container);
        if (this.currentPage === 'medicine') this.viewMedicine(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // --- DASHBOARD: REGISTRASI, RIWAYAT, DIAGNOSA ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold">Data Registrasi Pasien</h3>
                <button onclick="app.modalPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl">+ Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.data.patients.map(p => `
                    <div class="card-patient searchable">
                        <div class="flex gap-4 mb-4">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-2xl object-cover bg-slate-100">
                            <div>
                                <h4 class="font-bold text-lg">${p.reg.name}</h4>
                                <p class="text-xs text-slate-500">${p.reg.age} Thn • ${p.reg.edu}</p>
                            </div>
                        </div>
                        <div class="text-xs space-y-1 mb-4 border-t pt-2">
                            <p><b>Wali:</b> ${p.reg.guardian}</p>
                            <p><b>Masuk:</b> ${p.reg.timestamp}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <button onclick="app.modalPatient('${p.id}')" class="bg-slate-100 py-2 rounded-lg text-[10px] font-bold">EDIT BIO</button>
                            <button onclick="app.deletePatient('${p.id}')" class="bg-red-50 text-red-500 py-2 rounded-lg text-[10px] font-bold">HAPUS</button>
                            <button onclick="app.modalDiagnosis('${p.id}')" class="col-span-2 bg-teal-50 text-teal-700 py-2 rounded-lg text-[10px] font-bold">RIWAYAT & DIAGNOSA</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- MEDICINE: STOK & PENGGUNAAN (AUTOMATIC) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-8 mb-8 shadow-sm searchable">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-bold text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.modalAddStock('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs">+ Tambah Stok</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <p class="font-bold text-sm mb-4 text-slate-400">STOK OBAT AKTIF</p>
                        <table class="w-full text-sm">
                            <tr class="text-left text-slate-400 border-b">
                                <th class="pb-2">Nama Obat</th>
                                <th class="pb-2">Sisa Stok</th>
                                <th class="pb-2">Estimasi Habis</th>
                                <th class="pb-2 text-right">Aksi</th>
                            </tr>
                            ${(p.med_stock || []).map((s, idx) => {
                                const sisa = s.init - (s.used || 0);
                                const statusClass = sisa <= 7 ? 'text-red-500 font-bold animate-pulse' : '';
                                return `
                                <tr>
                                    <td class="py-3 border-b">${s.name}</td>
                                    <td class="py-3 border-b ${statusClass}">${sisa} Tablet ${sisa <= 7 ? '(REFILL!)' : ''}</td>
                                    <td class="py-3 border-b">${s.est_date || '-'}</td>
                                    <td class="py-3 border-b text-right">
                                        <button onclick="app.useMed('${p.id}', ${idx})" class="bg-emerald-500 text-white px-2 py-1 rounded text-[10px]">MINUM OBAT</button>
                                    </td>
                                </tr>`;
                            }).join('')}
                        </table>
                    </div>
                    <div>
                        <p class="font-bold text-sm mb-4 text-slate-400">CATATAN MINUM OBAT</p>
                        <div class="space-y-2 h-48 overflow-y-auto">
                            ${(p.med_logs || []).map(l => `
                                <div class="bg-slate-50 p-3 rounded-xl text-xs flex justify-between items-center">
                                    <div>
                                        <p class="font-bold">${l.med_name}</p>
                                        <p class="text-slate-500">${l.time}</p>
                                    </div>
                                    <div class="text-right">
                                        <p>PJ: ${l.pj}</p>
                                        <p class="text-[10px] text-slate-400">${l.note}</p>
                                    </div>
                                </div>
                            `).reverse().join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // --- KRISIS & BPSS 7 HARI ---
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-8 mb-8 shadow-sm searchable">
                <h3 class="text-xl font-bold mb-6">${p.reg.name} - BPSS Scoring (7 Hari)</h3>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] border">
                            <thead>
                                <tr class="bg-slate-50">
                                    <th class="p-2 border">Aspek</th>
                                    ${[1,2,3,4,5,6,7].map(d => `<th class="p-2 border">Day ${d}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${['Biological', 'Psychological', 'Social', 'Spiritual'].map(cat => `
                                    <tr>
                                        <td class="p-2 border font-bold">${cat}</td>
                                        ${[1,2,3,4,5,6,7].map(d => `
                                            <td class="p-2 border">
                                                <input type="number" onchange="app.updateBPSS('${p.id}', ${d}, '${cat}', this.value)" 
                                                value="${(p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0}" class="w-8 text-center bg-transparent">
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    <div class="h-64 bg-slate-50 rounded-2xl p-4">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
                <div class="mt-4 flex gap-4">
                    <button onclick="app.exportWord('${p.id}')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs">Download Laporan Word</button>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    // --- CORE FUNCTIONS (MODALS & CRUD) ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Biodata Pasien' : 'Registrasi Pasien Baru';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, '${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2">
                    <label class="text-xs font-bold text-slate-400">FOTO PASIEN</label>
                    <input type="file" id="f_photo" class="input-field">
                </div>
                <input type="text" name="name" value="${p ? p.reg.name : ''}" placeholder="Nama Lengkap" class="input-field" required>
                <input type="text" name="birth" value="${p ? p.reg.birth : ''}" placeholder="Tempat Tanggal Lahir" class="input-field">
                <input type="number" name="age" value="${p ? p.reg.age : ''}" placeholder="Usia" class="input-field">
                <select name="status" class="input-field">
                    <option value="Menikah">Menikah</option>
                    <option value="Belum Menikah">Belum Menikah</option>
                    <option value="Duda/Janda">Duda/Janda</option>
                </select>
                <input type="text" name="edu" value="${p ? p.reg.edu : ''}" placeholder="Pendidikan Terakhir" class="input-field">
                <input type="text" name="job" value="${p ? p.reg.job : ''}" placeholder="Pekerjaan" class="input-field">
                <input type="text" name="guardian" value="${p ? p.reg.guardian : ''}" placeholder="Nama Wali" class="input-field">
                <textarea name="addr" placeholder="Alamat Lengkap" class="input-field col-span-2">${p ? p.reg.addr : ''}</textarea>
                <textarea name="spot" placeholder="Spotcheck Barang Bawaan" class="input-field col-span-2">${p ? p.reg.spot : ''}</textarea>
                <button class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA</button>
            </form>
        `;
        this.openModal();
    },

    async savePatient(e, id) {
        e.preventDefault();
        const fd = new FormData(e.target);
        let photoBase64 = id ? this.data.patients.find(x => x.id === id).reg.photo : null;
        
        const file = document.getElementById('f_photo').files[0];
        if(file) photoBase64 = await this.toBase64(file);

        const payload = {
            id: id || Date.now().toString(),
            reg: {
                name: fd.get('name'),
                birth: fd.get('birth'),
                age: fd.get('age'),
                status: fd.get('status'),
                edu: fd.get('edu'),
                job: fd.get('job'),
                guardian: fd.get('guardian'),
                addr: fd.get('addr'),
                spot: fd.get('spot'),
                photo: photoBase64,
                timestamp: new Date().toLocaleString('id-ID')
            },
            med_stock: id ? this.data.patients.find(x => x.id === id).med_stock : [],
            med_logs: id ? this.data.patients.find(x => x.id === id).med_logs : [],
            bpss: id ? this.data.patients.find(x => x.id === id).bpss : {},
            visits: id ? this.data.patients.find(x => x.id === id).visits : []
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = payload;
        } else {
            this.data.patients.push(payload);
        }
        
        this.save();
        this.closeModal();
        this.nav('dashboard');
        Swal.fire('Berhasil', 'Data telah diperbarui', 'success');
    },

    // --- LOGIKA STOK OTOMATIS ---
    useMed(pId, medIdx) {
        const p = this.data.patients.find(x => x.id === pId);
        const s = p.med_stock[medIdx];
        
        if((s.init - (s.used || 0)) <= 0) {
            Swal.fire('Habis', 'Stok obat tidak mencukupi!', 'error');
            return;
        }

        s.used = (s.used || 0) + 1;
        p.med_logs.push({
            med_name: s.name,
            time: new Date().toLocaleString('id-ID'),
            pj: 'Petugas Shift',
            note: 'Diberikan sesuai jadwal'
        });

        if((s.init - s.used) === 7) {
            Swal.fire('Reminder', `Stok ${s.name} tersisa 7 tablet. Segera refill!`, 'warning');
        }

        this.save();
        this.render();
    },

    // --- GRAFIK POLYGON ---
    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`).getContext('2d');
        const labels = [1,2,3,4,5,6,7].map(d => `H${d}`);
        const datasets = ['Biological', 'Psychological', 'Social', 'Spiritual'].map((cat, i) => ({
            label: cat,
            data: [1,2,3,4,5,6,7].map(d => (p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0),
            borderColor: ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6'][i],
            tension: 0.3,
            fill: false
        }));

        new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: { 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { labels: { boxWidth: 10, font: { size: 10 } } } }
            }
        });
    },

    // --- UTILS ---
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: (file) => new Promise((res) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => res(reader.result);
    }),
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.searchable').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    }
};

window.onload = () => { /* App Ready */ };
