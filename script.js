const app = {
    data: JSON.parse(localStorage.getItem('MMRC_PRO_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    save() { localStorage.setItem('MMRC_PRO_DATABASE', JSON.stringify(this.data)); },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else {
            Swal.fire('Akses Ditolak', 'Username atau Password salah!', 'error');
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
        if (this.currentPage === 'ttv') this.viewTTV(container);
        if (this.currentPage === 'visit') this.viewVisit(container);
        if (this.currentPage === 'crisis') this.viewCrisis(container);
        if (this.currentPage === 'program') this.viewProgram(container);
        if (this.currentPage === 'therapy') this.viewTherapy(container);
    },

    // ==========================================
    // 1. DASHBOARD (REGISTRASI, RIWAYAT, DIAGNOSA)
    // ==========================================
    viewDashboard(container) {
        container.innerHTML = `
            <div class="flex justify-between items-center mb-10">
                <div>
                    <h1 class="text-3xl font-black text-slate-800 tracking-tight">Manajemen Pasien</h1>
                    <p class="text-slate-400 font-medium">Registrasi, Riwayat Penyakit & Diagnosa Dokter</p>
                </div>
                <button onclick="app.modalReg()" class="btn-primary">+ Registrasi Pasien Baru</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                ${this.data.patients.map(p => `
                    <div class="card-patient searchable">
                        <div class="flex gap-6 mb-6">
                            <img src="${p.reg.photo || 'https://via.placeholder.com/100'}" class="w-24 h-24 rounded-3xl object-cover shadow-inner bg-slate-100">
                            <div>
                                <h4 class="font-black text-xl text-slate-800 leading-tight">${p.reg.name}</h4>
                                <p class="text-xs font-bold text-teal-600 uppercase mt-1">${p.reg.age} Tahun • ${p.reg.job}</p>
                                <p class="text-[10px] text-slate-400 mt-2 font-medium"><i class="far fa-clock mr-1"></i> ${p.reg.timestamp}</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <button onclick="app.modalReg('${p.id}')" class="bg-slate-100 py-3 rounded-xl text-[10px] font-black hover:bg-slate-200">BIODATA</button>
                            <button onclick="app.modalRiwayat('${p.id}')" class="bg-slate-100 py-3 rounded-xl text-[10px] font-black hover:bg-slate-200">RIWAYAT</button>
                            <button onclick="app.modalDiagnosa('${p.id}')" class="col-span-2 bg-teal-50 text-teal-700 py-3 rounded-xl text-[10px] font-black hover:bg-teal-100">DIAGNOSA DOKTER</button>
                            <button onclick="app.deletePatient('${p.id}')" class="col-span-2 text-red-400 text-[10px] font-bold py-2 mt-2">HAPUS DATA PASIEN</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    modalReg(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = "KOLOM: REGISTRASI MASUK PASIEN";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveReg(event, '${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="col-span-2">
                    <span class="label-title">Upload Foto Pasien</span>
                    <input type="file" id="reg-photo" class="input-field">
                </div>
                <div><span class="label-title">Nama Lengkap</span><input type="text" name="name" value="${p?.reg.name || ''}" class="input-field" required></div>
                <div><span class="label-title">Tempat Tanggal Lahir</span><input type="text" name="birth" value="${p?.reg.birth || ''}" class="input-field"></div>
                <div><span class="label-title">Usia</span><input type="number" name="age" value="${p?.reg.age || ''}" class="input-field"></div>
                <div><span class="label-title">Status Pernikahan</span><input type="text" name="status" value="${p?.reg.status || ''}" class="input-field"></div>
                <div><span class="label-title">Pendidikan Terakhir</span><input type="text" name="edu" value="${p?.reg.edu || ''}" class="input-field"></div>
                <div><span class="label-title">Pekerjaan</span><input type="text" name="job" value="${p?.reg.job || ''}" class="input-field"></div>
                <div><span class="label-title">Nama Wali</span><input type="text" name="guardian" value="${p?.reg.guardian || ''}" class="input-field"></div>
                <div><span class="label-title">Alamat</span><input type="text" name="addr" value="${p?.reg.addr || ''}" class="input-field"></div>
                <div class="col-span-2"><span class="label-title">Spotcheck Barang Bawaan</span><textarea name="spot" class="input-field h-24">${p?.reg.spot || ''}</textarea></div>
                <button class="col-span-2 btn-primary">SIMPAN DATA REGISTRASI</button>
            </form>
        `;
        this.openModal();
    },

    modalRiwayat(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = "KOLOM: RIWAYAT PENYAKIT";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveRiwayat(event, '${id}')" class="space-y-6">
                <div><span class="label-title">Riwayat Penyakit Fisik & Psikis</span><textarea name="fisik" class="input-field h-24">${p.history?.fisik || ''}</textarea></div>
                <div><span class="label-title">Diagnosa Dokter Sebelumnya</span><textarea name="diag_prev" class="input-field h-24">${p.history?.diag_prev || ''}</textarea></div>
                <div><span class="label-title">Riwayat Penggunaan Dosis Obat</span><textarea name="dosis_prev" class="input-field h-24">${p.history?.dosis_prev || ''}</textarea></div>
                <div><span class="label-title">Kondisi Terkini Pasien</span><textarea name="kondisi" class="input-field h-24">${p.history?.kondisi || ''}</textarea></div>
                <button class="w-full btn-primary">SIMPAN RIWAYAT</button>
            </form>
        `;
        this.openModal();
    },

    modalDiagnosa(id) {
        const p = this.data.patients.find(x => x.id === id);
        document.getElementById('modal-title').innerText = "KOLOM: DIAGNOSA DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveDiagnosa(event, '${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><span class="label-title">Nama Dokter</span><input type="text" name="doc_name" value="${p.diagnosis?.doc_name || ''}" class="input-field"></div>
                <div><span class="label-title">Diagnosa (Saat Pasien Masuk)</span><input type="text" name="diag_in" value="${p.diagnosis?.diag_in || ''}" class="input-field"></div>
                <div class="col-span-2"><span class="label-title">Planning Dokter</span><textarea name="plan" class="input-field h-20">${p.diagnosis?.plan || ''}</textarea></div>
                
                <div class="col-span-2 p-6 bg-slate-50 rounded-2xl">
                    <span class="label-title mb-4">Tindakan Intervensi (Centang)</span>
                    <div class="flex flex-wrap gap-8">
                        <label class="flex items-center gap-3 font-bold text-sm"><input type="checkbox" name="int_injeksi" ${p.diagnosis?.int_injeksi ? 'checked' : ''} class="w-5 h-5 accent-teal-600"> Injeksi</label>
                        <label class="flex items-center gap-3 font-bold text-sm"><input type="checkbox" name="int_urine" ${p.diagnosis?.int_urine ? 'checked' : ''} class="w-5 h-5 accent-teal-600"> Urine Test</label>
                        <label class="flex items-center gap-3 font-bold text-sm"><input type="checkbox" name="int_fiksasi" ${p.diagnosis?.int_fiksasi ? 'checked' : ''} class="w-5 h-5 accent-teal-600"> Fiksasi</label>
                    </div>
                    <input type="text" name="urine_note" placeholder="Keterangan Urine Test..." value="${p.diagnosis?.urine_note || ''}" class="input-field mt-4">
                </div>

                <div class="col-span-2"><span class="label-title">Resep & Nama Obat (Jumlah)</span><textarea name="resep" class="input-field h-24" placeholder="Contoh: Risperidone 2mg (30 Tablet)...">${p.diagnosis?.resep || ''}</textarea></div>
                <button class="col-span-2 btn-primary">SIMPAN DIAGNOSA</button>
            </form>
        `;
        this.openModal();
    },

    // ==========================================
    // 2. MEDICINE (STOK & CATATAN - OTOMATIS)
    // ==========================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-10 shadow-sm border border-slate-100 searchable">
                <div class="flex justify-between items-center mb-8 border-b pb-6">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                        <p class="text-sm font-bold text-teal-600">STOK & PENGGUNAAN OBAT</p>
                    </div>
                    <button onclick="app.modalAddStock('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold shadow-md">+ Tambah Stok Baru</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div>
                        <span class="label-title">Kolom: Stok Obat Pasien</span>
                        <div class="overflow-x-auto mt-4">
                            <table class="w-full text-left text-sm">
                                <tr class="text-[10px] font-black text-slate-400 uppercase border-b">
                                    <th class="pb-4">Nama Obat</th>
                                    <th class="pb-4">Awal</th>
                                    <th class="pb-4">Terpakai</th>
                                    <th class="pb-4">Sisa</th>
                                    <th class="pb-4">Est. Habis</th>
                                    <th class="pb-4 text-right">Aksi</th>
                                </tr>
                                ${(p.med_stock || []).map((s, idx) => {
                                    const sisa = s.init - (s.used || 0);
                                    const low = sisa <= 7;
                                    return `
                                    <tr class="${low ? 'bg-red-50' : ''}">
                                        <td class="py-4 font-bold">${s.name} ${low ? '<i class="fas fa-exclamation-triangle text-red-500 animate-pulse ml-1"></i>' : ''}</td>
                                        <td class="py-4 text-slate-400">${s.init}</td>
                                        <td class="py-4 text-teal-600 font-bold">${s.used || 0}</td>
                                        <td class="py-4 font-black ${low ? 'text-red-600' : 'text-slate-800'}">${sisa}</td>
                                        <td class="py-4 text-slate-500">${s.est_date}</td>
                                        <td class="py-4 text-right"><button onclick="app.useMed('${p.id}', ${idx})" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px] font-bold">MINUM</button></td>
                                    </tr>`;
                                }).join('')}
                            </table>
                        </div>
                    </div>
                    <div class="bg-slate-50 p-8 rounded-[2rem]">
                        <span class="label-title">Kolom: Catatan Penggunaan Obat</span>
                        <div class="space-y-4 mt-4 h-64 overflow-y-auto pr-4">
                            ${(p.med_logs || []).reverse().map(l => `
                                <div class="bg-white p-4 rounded-2xl shadow-sm border-l-4 border-teal-500">
                                    <div class="flex justify-between items-start mb-2">
                                        <h5 class="font-black text-xs text-slate-700 uppercase">${l.med_name}</h5>
                                        <span class="text-[9px] font-bold text-slate-400">${l.time}</span>
                                    </div>
                                    <p class="text-[10px] text-slate-600 italic">"${l.note}"</p>
                                    <p class="text-[9px] font-black text-teal-600 mt-2 text-right uppercase">PJ: ${l.pj}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // ==========================================
    // 5. PASIEN CRISIS (BPSS & GRAFIK)
    // ==========================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-10 shadow-sm border border-slate-100 searchable">
                <div class="flex justify-between items-center mb-10">
                    <h2 class="text-2xl font-black text-slate-800">${p.reg.name} - BPSS SCORE</h2>
                    <div class="flex gap-2">
                        <div class="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-xs font-bold">Day 1 - Day 7 Stabilisasi</div>
                    </div>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-12">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] border-collapse">
                            <tr class="bg-slate-50 border-b">
                                <th class="p-3 text-left">SKOR BPSS (0-25)</th>
                                ${[1,2,3,4,5,6,7].map(d => `<th class="p-3 text-center border-l">Day ${d}</th>`).join('')}
                            </tr>
                            ${['Biological', 'Psychological', 'Social', 'Spiritual'].map(cat => `
                                <tr class="border-b">
                                    <td class="p-3 font-black text-slate-600">${cat.toUpperCase()}</td>
                                    ${[1,2,3,4,5,6,7].map(d => `
                                        <td class="p-3 border-l">
                                            <input type="number" min="0" max="25" onchange="app.updateBPSS('${p.id}', ${d}, '${cat}', this.value)" 
                                            value="${(p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0}" class="w-full text-center bg-transparent font-bold focus:text-teal-600 outline-none">
                                        </td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </table>
                        <div class="mt-8 grid grid-cols-2 gap-6">
                            <div><span class="label-title">Discharge (Evaluasi Score)</span><textarea onchange="app.saveBPSSMeta('${p.id}', 'discharge', this.value)" class="input-field h-24">${p.bpss_meta?.discharge || ''}</textarea></div>
                            <div><span class="label-title">Change (Perubahan Score)</span><textarea onchange="app.saveBPSSMeta('${p.id}', 'change', this.value)" class="input-field h-24">${p.bpss_meta?.change || ''}</textarea></div>
                        </div>
                    </div>
                    <div class="bg-slate-900 rounded-[2rem] p-8 shadow-2xl">
                        <span class="label-title text-slate-500">Kolom: Grafik Polygon BPSS Score</span>
                        <div class="h-[350px] mt-4">
                            <canvas id="chart-${p.id}"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    // --- LOGIC: UPDATE BPSS & CHART ---
    updateBPSS(id, day, cat, val) {
        const p = this.data.patients.find(x => x.id === id);
        if(!p.bpss) p.bpss = {};
        if(!p.bpss[day]) p.bpss[day] = {};
        p.bpss[day][cat] = parseInt(val) || 0;
        this.save();
        this.renderChart(p);
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx) return;
        const labels = [1,2,3,4,5,6,7].map(d => `Day ${d}`);
        const cats = ['Biological', 'Psychological', 'Social', 'Spiritual'];
        const colors = ['#0d9488', '#f59e0b', '#3b82f6', '#8b5cf6'];
        
        if (window[`chartObj_${p.id}`]) window[`chartObj_${p.id}`].destroy();

        window[`chartObj_${p.id}`] = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: cats.map((cat, i) => ({
                    label: cat,
                    data: [1,2,3,4,5,6,7].map(d => (p.bpss && p.bpss[d]) ? p.bpss[d][cat] || 0 : 0),
                    borderColor: colors[i],
                    backgroundColor: colors[i] + '22',
                    fill: true, tension: 0.4, pointRadius: 5
                }))
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { labels: { color: '#fff', font: { size: 10 } } } },
                scales: { 
                    y: { min: 0, max: 25, grid: { color: '#ffffff11' }, ticks: { color: '#64748b' } },
                    x: { grid: { display: false }, ticks: { color: '#64748b' } }
                }
            }
        });
    },

    // ==========================================
    // 3. TTV & GDS
    // ==========================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-8 shadow-sm searchable border border-slate-100">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                    <button onclick="app.modalAddTTV('${p.id}')" class="btn-primary text-xs py-2">+ Input TTV/GDS</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <tr class="text-[10px] font-black text-slate-400 uppercase border-b">
                            <th class="pb-4">Waktu</th>
                            <th class="pb-4 text-center">Tensi</th>
                            <th class="pb-4 text-center">Saturasi</th>
                            <th class="pb-4 text-center">RR</th>
                            <th class="pb-4 text-center">TB/BB</th>
                            <th class="pb-4">Keterangan GDS</th>
                        </tr>
                        ${(p.ttv || []).map(t => `
                            <tr class="border-b last:border-0">
                                <td class="py-4 text-xs font-bold">${t.timestamp}</td>
                                <td class="py-4 text-center font-bold text-teal-600">${t.tensi}</td>
                                <td class="py-4 text-center font-bold">${t.saturasi}%</td>
                                <td class="py-4 text-center">${t.rr}</td>
                                <td class="py-4 text-center text-slate-500">${t.tb}cm / ${t.bb}kg</td>
                                <td class="py-4 text-xs italic text-slate-600">${t.gds}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `).join('');
    },

    // ==========================================
    // 4. VISIT DOKTER
    // ==========================================
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-8 shadow-sm searchable border border-slate-100">
                <div class="flex justify-between items-center mb-8">
                    <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                    <button onclick="app.modalAddVisit('${p.id}')" class="btn-primary text-xs py-2">+ Catat Visit Baru</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    ${(p.visits || []).map(v => `
                        <div class="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100">
                            <img src="${v.photo || 'https://via.placeholder.com/300x150'}" class="w-full h-32 object-cover rounded-xl mb-4 shadow-sm">
                            <p class="text-[10px] font-black text-teal-600 uppercase mb-2">${v.timestamp}</p>
                            <span class="label-title">Keterangan Dokter:</span>
                            <p class="text-xs text-slate-700 leading-relaxed h-20 overflow-y-auto mb-4 italic">"${v.note}"</p>
                            <div class="border-t pt-4 flex flex-col items-end">
                                <span class="label-title">TTD Dokter:</span>
                                <img src="${v.sign}" class="h-12 w-auto filter grayscale">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    // ==========================================
    // 5. RENCANA PROGRAM & TERAPI
    // ==========================================
    viewProgram(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-8 shadow-sm searchable border border-slate-100">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                    <button onclick="app.modalEditProgram('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">SET PROGRAM</button>
                </div>
                <div class="grid grid-cols-2 gap-8">
                    <div class="bg-teal-50 p-6 rounded-2xl">
                        <span class="label-title text-teal-600">Paket Program:</span>
                        <p class="font-black text-2xl text-teal-900">${p.program?.package || '-'}</p>
                    </div>
                    <div class="bg-slate-50 p-6 rounded-2xl">
                        <span class="label-title">Waktu Rencana:</span>
                        <p class="font-black text-2xl text-slate-800">${p.program?.duration || '-'}</p>
                    </div>
                </div>
            </div>
        `).join('');
    },

    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-[2.5rem] p-10 mb-8 shadow-sm searchable border border-slate-100">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-black text-slate-800">${p.reg.name}</h2>
                    <button onclick="app.modalEditTherapy('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">EDIT RENCANA</button>
                </div>
                <span class="label-title">Keterangan Rencana Terapi:</span>
                <div class="bg-slate-50 p-8 rounded-3xl mt-2 italic text-slate-600 leading-relaxed border border-slate-100">
                    ${p.therapy || 'Belum ada rencana terapi yang diinput.'}
                </div>
            </div>
        `).join('');
    },

    // --- CORE UTILS ---
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.searchable').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    },
    async saveReg(e, id) {
        e.preventDefault();
        const f = new FormData(e.target);
        const file = document.getElementById('reg-photo').files[0];
        let photo = id ? this.data.patients.find(x => x.id === id).reg.photo : null;
        if(file) photo = await new Promise(res => { 
            const r = new FileReader(); r.readAsDataURL(file); r.onload = () => res(r.result); 
        });

        const payload = {
            id: id || Date.now().toString(),
            reg: {
                name: f.get('name'), birth: f.get('birth'), age: f.get('age'), status: f.get('status'),
                edu: f.get('edu'), job: f.get('job'), guardian: f.get('guardian'), addr: f.get('addr'),
                spot: f.get('spot'), photo: photo, timestamp: new Date().toLocaleString('id-ID')
            },
            history: id ? this.data.patients.find(x => x.id === id).history : {},
            diagnosis: id ? this.data.patients.find(x => x.id === id).diagnosis : {},
            med_stock: id ? this.data.patients.find(x => x.id === id).med_stock : [],
            med_logs: id ? this.data.patients.find(x => x.id === id).med_logs : [],
            ttv: id ? this.data.patients.find(x => x.id === id).ttv : [],
            visits: id ? this.data.patients.find(x => x.id === id).visits : [],
            bpss: id ? this.data.patients.find(x => x.id === id).bpss : {},
            bpss_meta: id ? this.data.patients.find(x => x.id === id).bpss_meta : {}
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = payload;
        } else {
            this.data.patients.push(payload);
        }
        this.save(); this.closeModal(); this.nav('dashboard');
    },
    
    // ... (Fungsi saveRiwayat, saveDiagnosa, modalAddStock, useMed, modalAddVisit dll akan mengikuti pola yang sama)
};

window.onload = () => app.nav('dashboard');
