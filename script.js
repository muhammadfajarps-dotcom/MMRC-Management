const app = {
    data: JSON.parse(localStorage.getItem('MMRC_PRO_DB')) || { patients: [] },
    signaturePad: null,

    save() {
        localStorage.setItem('MMRC_PRO_DB', JSON.stringify(this.data));
    },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Error', 'Kredensial Tidak Valid!', 'error');
        }
    },

    nav(page) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.getElementById(`nav-${page}`).classList.add('active');
        const container = document.getElementById('main-content');
        container.innerHTML = `<div class="flex items-center justify-center h-full"><i class="fas fa-circle-notch fa-spin text-4xl text-teal-500"></i></div>`;
        
        setTimeout(() => {
            document.getElementById('page-title').innerText = page.replace('_', ' ');
            this.renderPage(page, container);
        }, 300);
    },

    renderPage(page, container) {
        container.innerHTML = '';
        if (page === 'dashboard') this.viewDashboard(container);
        if (page === 'medicine') this.viewMedicine(container);
        if (page === 'ttv') this.viewTTV(container);
        if (page === 'visit') this.viewVisit(container);
        if (page === 'crisis') this.viewCrisis(container);
        if (page === 'program') this.viewProgram(container);
        if (page === 'therapy') this.viewTherapy(container);
    },

    // --- DASHBOARD SECTION ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-extrabold text-slate-800 tracking-tight">Data Registrasi & Diagnosa</h1>
                    <p class="text-slate-500">Kelola informasi pasien, riwayat, dan diagnosa medis.</p>
                </div>
                <button onclick="app.modalReg()" class="btn-primary">+ Registrasi Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${this.data.patients.map(p => `
                    <div class="card-gradient searchable">
                        <div class="flex items-start gap-5 mb-6">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-20 h-20 rounded-3xl object-cover bg-teal-100 shadow-inner">
                            <div>
                                <h3 class="font-black text-lg text-slate-800 leading-tight">${p.reg.name}</h3>
                                <p class="text-xs font-bold text-teal-600 mb-1 uppercase">${p.reg.age} Tahun • ${p.reg.status}</p>
                                <p class="text-[10px] text-slate-400 font-medium tracking-wide"><i class="far fa-clock mr-1"></i> ${p.reg.timestamp}</p>
                            </div>
                        </div>
                        <div class="space-y-4 mb-8">
                            <div class="flex items-center gap-3 text-xs bg-white p-3 rounded-2xl border border-slate-100">
                                <i class="fas fa-map-marker-alt text-teal-500"></i>
                                <span class="truncate">${p.reg.addr}</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="app.modalReg('${p.id}')" class="bg-slate-100 py-3 rounded-xl text-[10px] font-black hover:bg-slate-200 transition-all">EDIT BIODATA</button>
                            <button onclick="app.modalDiagnosis('${p.id}')" class="bg-teal-50 text-teal-700 py-3 rounded-xl text-[10px] font-black hover:bg-teal-100 transition-all">DIAGNOSA</button>
                            <button onclick="app.deletePatient('${p.id}')" class="col-span-2 text-red-400 text-[10px] font-bold py-2">HAPUS DATA PASIEN</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- MEDICINE SECTION (AUTO STOCK LOGIC) ---
    viewMedicine(container) {
        if (this.data.patients.length === 0) {
            container.innerHTML = `<div class="text-center py-20 text-slate-400">Belum ada pasien terdaftar</div>`;
            return;
        }
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-10 shadow-sm border border-slate-100 searchable">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                        <p class="text-sm text-slate-500">Manajemen Stok & Catatan Penggunaan Obat</p>
                    </div>
                    <button onclick="app.modalAddStock('${p.id}')" class="btn-primary text-xs">+ Tambah Stok Obat</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-5 gap-10">
                    <div class="xl:col-span-3">
                        <span class="label-title">Stok Obat Aktif</span>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead class="text-slate-400 text-[10px] uppercase font-black tracking-widest border-b">
                                    <tr>
                                        <th class="py-4 text-left">Nama Obat</th>
                                        <th class="py-4 text-center">Awal</th>
                                        <th class="py-4 text-center">Terpakai</th>
                                        <th class="py-4 text-center">Sisa</th>
                                        <th class="py-4 text-center">Estimasi Habis</th>
                                        <th class="py-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${(p.med_stock || []).map((s, idx) => {
                                        const sisa = s.init - (s.used || 0);
                                        const isLow = sisa <= 7;
                                        return `
                                        <tr class="${isLow ? 'bg-red-50/50' : ''}">
                                            <td class="py-4 font-bold">${s.name} ${isLow ? '<i class="fas fa-exclamation-triangle text-red-500 ml-1"></i>' : ''}</td>
                                            <td class="py-4 text-center text-slate-400">${s.init}</td>
                                            <td class="py-4 text-center font-bold text-teal-600">${s.used || 0}</td>
                                            <td class="py-4 text-center font-black ${isLow ? 'text-red-600 animate-pulse' : 'text-slate-800'}">${sisa}</td>
                                            <td class="py-4 text-center text-slate-500">${s.est_date || '-'}</td>
                                            <td class="py-4 text-right">
                                                <button onclick="app.useMed('${p.id}', ${idx})" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold shadow-sm">MINUM OBAT</button>
                                            </td>
                                        </tr>`;
                                    }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div class="xl:col-span-2 border-l border-slate-100 pl-10">
                        <span class="label-title">Catatan Penggunaan Terkini</span>
                        <div class="space-y-4 max-h-[300px] overflow-y-auto pr-4">
                            ${(p.med_logs || []).reverse().map(l => `
                                <div class="bg-slate-50 p-4 rounded-2xl border border-slate-100 relative overflow-hidden">
                                    <div class="absolute left-0 top-0 bottom-0 w-1 bg-teal-500"></div>
                                    <div class="flex justify-between items-start mb-1">
                                        <h4 class="font-black text-teal-700 text-xs">${l.med_name}</h4>
                                        <span class="text-[9px] font-bold text-slate-400">${l.time}</span>
                                    </div>
                                    <p class="text-[10px] text-slate-600 italic">"${l.note}"</p>
                                    <p class="text-[9px] font-black text-slate-800 mt-2 uppercase text-right">PJ: ${l.pj}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // --- CRISIS SECTION (BPSS & CHART) ---
    viewCrisis(container) {
        if (this.data.patients.length === 0) {
            container.innerHTML = `<div class="text-center py-20 text-slate-400">Belum ada pasien terdaftar</div>`;
            return;
        }
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-10 shadow-sm border border-slate-100 searchable">
                <div class="flex justify-between items-center mb-8">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                        <p class="text-sm text-slate-500">Monitoring Krisis & Skor BPSS (Day 1 - Day 7)</p>
                    </div>
                    <button onclick="app.exportWord('${p.id}')" class="bg-blue-600 text-white px-5 py-2 rounded-full text-xs font-bold shadow-md"><i class="fas fa-file-word mr-2"></i> EXPORT WORD</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] border-collapse">
                            <thead>
                                <tr class="bg-slate-50 border-b-2 border-slate-200">
                                    <th class="p-3 text-left">Aspek BPSS</th>
                                    ${[1,2,3,4,5,6,7].map(d => `<th class="p-3 text-center">Day ${d}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${['Biological', 'Psychological', 'Social', 'Spiritual'].map(cat => `
                                    <tr class="border-b border-slate-100">
                                        <td class="p-3 font-black text-slate-600">${cat}</td>
                                        ${[1,2,3,4,5,6,7].map(d => `
                                            <td class="p-3">
                                                <input type="number" min="0" max="25" onchange="app.updateBPSS('${p.id}', ${d}, '${cat}', this.value)" 
                                                value="${(p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0}" class="w-full text-center bg-transparent focus:bg-white focus:ring-1 focus:ring-teal-400 rounded transition-all">
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div class="mt-6 p-6 bg-teal-50/50 rounded-2xl grid grid-cols-2 gap-6">
                            <div>
                                <span class="label-title">Discharge Evaluation</span>
                                <textarea onchange="app.saveBPSSMeta('${p.id}', 'discharge', this.value)" class="w-full p-3 bg-white border border-teal-100 rounded-xl text-[11px] h-20">${p.bpss_meta?.discharge || ''}</textarea>
                            </div>
                            <div>
                                <span class="label-title">Change Score Summary</span>
                                <textarea onchange="app.saveBPSSMeta('${p.id}', 'change', this.value)" class="w-full p-3 bg-white border border-teal-100 rounded-xl text-[11px] h-20">${p.bpss_meta?.change || ''}</textarea>
                            </div>
                        </div>
                    </div>
                    <div class="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                        <span class="label-title">Grafik Poligon Tren Krisis</span>
                        <div class="h-[350px]">
                            <canvas id="chart-${p.id}"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    // --- LOGIC FUNCTIONS ---
    async useMed(pId, medIdx) {
        const p = this.data.patients.find(x => x.id === pId);
        const stock = p.med_stock[medIdx];
        
        if (stock.init - (stock.used || 0) <= 0) {
            Swal.fire('Stok Kosong', 'Harap lakukan refill obat ini segera!', 'error');
            return;
        }

        const { value: note } = await Swal.fire({
            title: `Pemberian ${stock.name}`,
            input: 'text',
            inputLabel: 'Keterangan (misal: Sesuai jadwal, sudah makan)',
            inputPlaceholder: 'Masukkan keterangan...',
            showCancelButton: true
        });

        if (note) {
            stock.used = (stock.used || 0) + 1;
            p.med_logs.push({
                med_name: stock.name,
                time: new Date().toLocaleString('id-ID'),
                pj: 'Petugas Shift', // Idealnya diambil dari data login
                note: note
            });

            if (stock.init - stock.used <= 7) {
                Swal.fire('REMINDER!', `Stok ${stock.name} sisa ${stock.init - stock.used} tablet. Harap laporkan ke farmasi.`, 'warning');
            }

            this.save();
            this.nav('medicine');
        }
    },

    renderChart(p) {
        const canvas = document.getElementById(`chart-${p.id}`);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const labels = [1,2,3,4,5,6,7].map(d => `Day ${d}`);
        const cats = ['Biological', 'Psychological', 'Social', 'Spiritual'];
        const colors = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6'];

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: cats.map((cat, i) => ({
                    label: cat,
                    data: [1,2,3,4,5,6,7].map(d => (p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0),
                    borderColor: colors[i],
                    backgroundColor: colors[i] + '22',
                    fill: true,
                    tension: 0.4,
                    pointStyle: 'rectRot',
                    pointRadius: 6
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { font: { family: 'Plus Jakarta Sans', size: 10, weight: 'bold' } } } },
                scales: { 
                    y: { min: 0, max: 25, ticks: { stepSize: 5 } },
                    x: { grid: { display: false } }
                }
            }
        });
    },

    // --- MODAL BUILDERS (REGISTRATION, DIAGNOSIS, ETC) ---
    modalReg(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Biodata Pasien' : 'Registrasi Pasien Baru';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveReg(event, '${id}')" class="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div class="md:col-span-1 space-y-6">
                    <div class="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center relative overflow-hidden group">
                        <input type="file" id="reg-photo" class="absolute inset-0 opacity-0 cursor-pointer z-10">
                        <img id="photo-preview" src="${p?.reg.photo || 'https://via.placeholder.com/200'}" class="w-full aspect-square object-cover rounded-2xl mb-4">
                        <p class="text-[10px] font-black text-teal-600">KLIK UNTUK UNGGAH FOTO</p>
                    </div>
                    <div>
                        <span class="label-title">Spotcheck Barang Bawaan</span>
                        <textarea name="spot" class="input-field h-32" placeholder="Daftar barang yang dibawa pasien...">${p?.reg.spot || ''}</textarea>
                    </div>
                </div>
                <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="col-span-2"><span class="label-title">Nama Lengkap Pasien</span><input type="text" name="name" value="${p?.reg.name || ''}" class="input-field" required></div>
                    <div><span class="label-title">Tempat Tanggal Lahir</span><input type="text" name="birth" value="${p?.reg.birth || ''}" class="input-field"></div>
                    <div><span class="label-title">Usia</span><input type="number" name="age" value="${p?.reg.age || ''}" class="input-field"></div>
                    <div><span class="label-title">Status Pernikahan</span><select name="status" class="input-field"><option value="Menikah">Menikah</option><option value="Belum Menikah">Belum Menikah</option><option value="Duda/Janda">Duda/Janda</option></select></div>
                    <div><span class="label-title">Pendidikan Terakhir</span><input type="text" name="edu" value="${p?.reg.edu || ''}" class="input-field"></div>
                    <div><span class="label-title">Pekerjaan</span><input type="text" name="job" value="${p?.reg.job || ''}" class="input-field"></div>
                    <div><span class="label-title">Nama Wali Pasien</span><input type="text" name="guardian" value="${p?.reg.guardian || ''}" class="input-field"></div>
                    <div class="col-span-2"><span class="label-title">Alamat Lengkap</span><textarea name="addr" class="input-field h-24">${p?.reg.addr || ''}</textarea></div>
                    <button class="col-span-2 btn-primary mt-4 py-4">SIMPAN DATA REGISTRASI</button>
                </div>
            </form>
        `;
        this.openModal();
    },

    async saveReg(e, id) {
        e.preventDefault();
        const f = new FormData(e.target);
        let photo = p ? p.reg.photo : null;
        const file = document.getElementById('reg-photo').files[0];
        if(file) photo = await this.toBase64(file);

        const payload = {
            id: id || Date.now().toString(),
            reg: {
                name: f.get('name'), birth: f.get('birth'), age: f.get('age'),
                status: f.get('status'), edu: f.get('edu'), job: f.get('job'),
                guardian: f.get('guardian'), addr: f.get('addr'), spot: f.get('spot'),
                photo: photo, timestamp: new Date().toLocaleString('id-ID')
            },
            history: {}, diagnosis: {}, medicine_stock: [], med_logs: [], bpss: {}, bpss_meta: {}, visits: [], ttv: []
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = { ...this.data.patients[idx], reg: payload.reg };
        } else {
            this.data.patients.push(payload);
        }
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    // --- UTILS ---
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: (file) => new Promise((res) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = () => res(reader.result);
    }),
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.searchable').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    }
};

window.onload = () => app.nav('dashboard');
