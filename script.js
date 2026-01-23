const app = {
    // Inisialisasi Database Lokal
    data: JSON.parse(localStorage.getItem('MMRC_DB_FINAL')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    // Fungsi Simpan ke LocalStorage
    save() {
        localStorage.setItem('MMRC_DB_FINAL', JSON.stringify(this.data));
    },

    // --- AUTENTIKASI ---
    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
            Swal.fire('Login Berhasil', 'Selamat Datang di Sistem MMRC', 'success');
        } else {
            Swal.fire('Login Gagal', 'Username atau Password Salah!', 'error');
        }
    },

    // --- NAVIGASI HALAMAN ---
    nav(page) {
        this.currentPage = page;
        
        // Update Tampilan Sidebar Active
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if(btn) btn.classList.add('active');
        
        // Update Judul Halaman
        document.getElementById('page-title').innerText = page.toUpperCase().replace('_', ' ');
        
        // Render Konten
        const container = document.getElementById('main-content');
        container.innerHTML = '';
        
        if (page === 'dashboard') this.viewDashboard(container);
        else if (page === 'medicine') this.viewMedicine(container);
        else if (page === 'ttv') this.viewTTV(container);
        else if (page === 'visit') this.viewVisit(container);
        else if (page === 'crisis') this.viewCrisis(container);
        else if (page === 'program') this.viewProgram(container);
        else if (page === 'therapy') this.viewTherapy(container);
    },

    // ==========================================
    // 1. DASHBOARD (3 KOLOM UTAMA)
    // ==========================================
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-teal-800">Data Pasien Terdaftar</h3>
                <button onclick="app.modalPatient()" class="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-xl shadow transition">+ Pasien Baru</button>
            </div>
            ${this.data.patients.length === 0 ? '<p class="text-center text-gray-400">Belum ada data pasien.</p>' : ''}
            <div class="grid grid-cols-1 gap-8">
                ${this.data.patients.map(p => {
                    const r = p.reg;
                    const h = p.history || {};
                    const d = p.diagnosis || {};
                    return `
                    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 search-item">
                        <div class="flex justify-between items-center mb-4 border-b pb-2">
                            <h4 class="font-bold text-lg text-teal-700">${r.name} (${r.age} Th)</h4>
                            <div>
                                <button onclick="app.modalPatient('${p.id}')" class="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg mr-2 font-bold">EDIT</button>
                                <button onclick="app.deletePatient('${p.id}')" class="text-xs bg-red-100 text-red-700 px-3 py-1 rounded-lg font-bold">HAPUS</button>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                            <div class="px-2">
                                <h5 class="font-bold text-xs text-slate-400 uppercase mb-3">I. Registrasi Masuk</h5>
                                <div class="flex gap-4 mb-3">
                                    <img src="${r.photo || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-xl object-cover bg-slate-200">
                                    <div class="text-sm">
                                        <p class="font-semibold">${r.timestamp}</p>
                                        <p class="text-slate-500">${r.status}</p>
                                    </div>
                                </div>
                                <div class="text-xs space-y-1 text-slate-600">
                                    <p><b>TTL:</b> ${r.birth}</p>
                                    <p><b>Pekerjaan:</b> ${r.job}</p>
                                    <p><b>Wali:</b> ${r.guardian}</p>
                                    <p><b>Alamat:</b> ${r.addr}</p>
                                    <div class="mt-2 p-2 bg-slate-50 rounded"><b>Spotcheck:</b> ${r.spot}</div>
                                </div>
                            </div>

                            <div class="px-2 pt-4 md:pt-0">
                                <div class="flex justify-between mb-3">
                                    <h5 class="font-bold text-xs text-slate-400 uppercase">II. Riwayat Penyakit</h5>
                                    <button onclick="app.modalHistory('${p.id}')" class="text-[10px] text-blue-600 hover:underline">Edit Riwayat</button>
                                </div>
                                <div class="space-y-3 text-xs">
                                    <div><span class="block font-bold text-slate-700">Fisik & Psikis:</span><p class="p-2 bg-slate-50 rounded">${h.phys || '-'}</p></div>
                                    <div><span class="block font-bold text-slate-700">Diagnosa Lalu:</span><p class="p-2 bg-slate-50 rounded">${h.prev_diag || '-'}</p></div>
                                    <div><span class="block font-bold text-slate-700">Riwayat Obat:</span><p class="p-2 bg-slate-50 rounded">${h.prev_med || '-'}</p></div>
                                    <div><span class="block font-bold text-slate-700">Kondisi Kini:</span><p class="p-2 bg-slate-50 rounded">${h.curr_cond || '-'}</p></div>
                                </div>
                            </div>

                            <div class="px-2 pt-4 md:pt-0">
                                <div class="flex justify-between mb-3">
                                    <h5 class="font-bold text-xs text-slate-400 uppercase">III. Diagnosa Dokter</h5>
                                    <button onclick="app.modalDiagnosis('${p.id}')" class="text-[10px] text-blue-600 hover:underline">Edit Diagnosa</button>
                                </div>
                                <div class="space-y-3 text-xs">
                                    <p><b>Dokter:</b> ${d.doc_name || '-'}</p>
                                    <p><b>Diagnosa Masuk:</b> ${d.entry_diag || '-'}</p>
                                    <p><b>Planning:</b> ${d.plan || '-'}</p>
                                    <div class="p-2 border rounded bg-slate-50">
                                        <p class="font-bold mb-1">Intervensi:</p>
                                        <div class="flex flex-wrap gap-2">
                                            ${d.inj ? '<span class="px-2 py-0.5 bg-red-100 text-red-600 rounded">Injeksi</span>' : ''}
                                            ${d.fix ? '<span class="px-2 py-0.5 bg-orange-100 text-orange-600 rounded">Fiksasi</span>' : ''}
                                            ${d.urine ? '<span class="px-2 py-0.5 bg-blue-100 text-blue-600 rounded">Urine</span>' : ''}
                                        </div>
                                        ${d.urine ? `<p class="mt-1 italic text-slate-500">Ket: ${d.urine_note}</p>` : ''}
                                    </div>
                                    <div>
                                        <span class="block font-bold text-slate-700">Resep Obat:</span>
                                        <p class="p-2 bg-teal-50 text-teal-800 rounded font-medium">${d.rx || '-'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        `;
    },

    // --- MODAL & SAVE: PASIEN ---
    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? 'Edit Data Pasien' : 'Registrasi Pasien Baru';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, '${id}')" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="col-span-2"><label class="text-xs font-bold text-slate-500">Waktu Masuk</label><input type="datetime-local" name="ts" value="${p ? p.reg.timestamp.replace(' ', 'T') : ''}" class="input-field" required></div>
                <div class="col-span-2"><label class="text-xs font-bold text-slate-500">Foto Pasien</label><input type="file" id="f_photo" class="input-field"></div>
                <input name="name" value="${p?.reg.name||''}" placeholder="Nama Lengkap" class="input-field" required>
                <input name="birth" value="${p?.reg.birth||''}" placeholder="Tempat Tgl Lahir" class="input-field">
                <input type="number" name="age" value="${p?.reg.age||''}" placeholder="Usia" class="input-field">
                <input name="status" value="${p?.reg.status||''}" placeholder="Status Pernikahan" class="input-field">
                <input name="edu" value="${p?.reg.edu||''}" placeholder="Pendidikan" class="input-field">
                <input name="job" value="${p?.reg.job||''}" placeholder="Pekerjaan" class="input-field">
                <input name="guardian" value="${p?.reg.guardian||''}" placeholder="Nama Wali" class="input-field">
                <textarea name="addr" placeholder="Alamat Lengkap" class="input-field col-span-2">${p?.reg.addr||''}</textarea>
                <textarea name="spot" placeholder="Spotcheck Barang" class="input-field col-span-2">${p?.reg.spot||''}</textarea>
                <button class="col-span-2 bg-teal-600 text-white py-3 rounded-xl font-bold">SIMPAN DATA</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, id) {
        e.preventDefault();
        const f = e.target;
        let photo = id && id !== 'null' ? this.data.patients.find(x => x.id === id).reg.photo : null;
        if(document.getElementById('f_photo').files[0]) {
            photo = await this.toBase64(document.getElementById('f_photo').files[0]);
        }

        const regData = {
            timestamp: f.ts.value, name: f.name.value, birth: f.birth.value, age: f.age.value,
            status: f.status.value, edu: f.edu.value, job: f.job.value, guardian: f.guardian.value,
            addr: f.addr.value, spot: f.spot.value, photo
        };

        if(id && id !== 'null') {
            const p = this.data.patients.find(x => x.id === id);
            p.reg = regData;
        } else {
            this.data.patients.push({
                id: Date.now().toString(), reg: regData, history: {}, diagnosis: {},
                medicine: {stock:[], logs:[]}, ttv: [], visits: [], crisis: {scores:{}, meta:{}}, program: {}, therapy: ''
            });
        }
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    // --- MODAL & SAVE: RIWAYAT ---
    modalHistory(id) {
        const h = this.data.patients.find(x => x.id === id).history || {};
        document.getElementById('modal-title').innerText = 'Edit Riwayat Penyakit';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveSub(event, '${id}', 'history')" class="space-y-4">
                <textarea name="phys" placeholder="Riwayat Fisik & Psikis" class="input-field h-24">${h.phys||''}</textarea>
                <input name="prev_diag" value="${h.prev_diag||''}" placeholder="Diagnosa Sebelumnya" class="input-field">
                <input name="prev_med" value="${h.prev_med||''}" placeholder="Riwayat Obat" class="input-field">
                <textarea name="curr_cond" placeholder="Kondisi Terkini" class="input-field h-24">${h.curr_cond||''}</textarea>
                <button class="w-full bg-teal-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },

    // --- MODAL & SAVE: DIAGNOSA ---
    modalDiagnosis(id) {
        const d = this.data.patients.find(x => x.id === id).diagnosis || {};
        document.getElementById('modal-title').innerText = 'Edit Diagnosa Dokter';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveDiagnosis(event, '${id}')" class="space-y-4">
                <input name="doc_name" value="${d.doc_name||''}" placeholder="Nama Dokter" class="input-field">
                <input name="entry_diag" value="${d.entry_diag||''}" placeholder="Diagnosa Masuk" class="input-field">
                <textarea name="plan" placeholder="Planning Dokter" class="input-field">${d.plan||''}</textarea>
                <div class="p-4 border rounded-lg bg-slate-50">
                    <p class="font-bold text-sm mb-2">Intervensi:</p>
                    <div class="flex gap-4 mb-2">
                        <label class="flex items-center gap-2"><input type="checkbox" name="inj" ${d.inj?'checked':''}> Injeksi</label>
                        <label class="flex items-center gap-2"><input type="checkbox" name="fix" ${d.fix?'checked':''}> Fiksasi</label>
                        <label class="flex items-center gap-2"><input type="checkbox" name="urine" ${d.urine?'checked':''}> Urine Test</label>
                    </div>
                    <input name="urine_note" value="${d.urine_note||''}" placeholder="Ket. Urine Test" class="input-field">
                </div>
                <textarea name="rx" placeholder="Resep Obat (Nama & Jumlah)" class="input-field h-20">${d.rx||''}</textarea>
                <button class="w-full bg-teal-600 text-white py-2 rounded-lg font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveDiagnosis(e, id) {
        e.preventDefault();
        const f = e.target;
        const p = this.data.patients.find(x => x.id === id);
        p.diagnosis = {
            doc_name: f.doc_name.value, entry_diag: f.entry_diag.value, plan: f.plan.value,
            inj: f.inj.checked, fix: f.fix.checked, urine: f.urine.checked, urine_note: f.urine_note.value, rx: f.rx.value
        };
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    saveSub(e, id, key) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const p = this.data.patients.find(x => x.id === id);
        if(!p[key]) p[key] = {};
        fd.forEach((v, k) => p[key][k] = v);
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    // ==========================================
    // 2. MEDICINE (STOK & LOG)
    // ==========================================
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-xl text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-bold">+ Stok Obat</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-bold text-sm text-slate-500 mb-2">STOK OBAT</h4>
                        <table class="w-full text-xs text-left">
                            <tr class="border-b bg-slate-50"><th class="p-2">Nama</th><th class="p-2">Awal</th><th class="p-2">Pakai</th><th class="p-2">Sisa</th><th class="p-2">Aksi</th></tr>
                            ${(p.medicine?.stock || []).map((m, i) => {
                                const sisa = m.init - m.used;
                                const alert = sisa <= 7 ? 'text-red-600 font-bold animate-pulse' : '';
                                return `<tr class="border-b">
                                    <td class="p-2">${m.name}</td><td class="p-2">${m.init}</td><td class="p-2">${m.used}</td>
                                    <td class="p-2 ${alert}">${sisa}</td>
                                    <td class="p-2"><button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-600 text-white px-2 py-1 rounded">Minum</button></td>
                                </tr>`;
                            }).join('')}
                        </table>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm text-slate-500 mb-2">CATATAN PENGGUNAAN</h4>
                        <div class="h-40 overflow-y-auto bg-slate-50 p-2 rounded border space-y-2">
                            ${(p.medicine?.logs || []).slice().reverse().map(l => `
                                <div class="bg-white p-2 rounded text-xs border">
                                    <div class="flex justify-between font-bold text-teal-700"><span>${l.name}</span><span>${l.time}</span></div>
                                    <div>Ket: ${l.note} | PJ: ${l.pj}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`).join('');
    },
    modalMedStock(id) {
        document.getElementById('modal-title').innerText = 'Tambah Stok Obat';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveMedStock(event, '${id}')" class="space-y-4">
                <input name="name" placeholder="Nama Obat" class="input-field" required>
                <div class="flex gap-4">
                    <input type="number" name="init" placeholder="Jumlah Awal" class="input-field" required>
                    <input type="date" name="est" class="input-field">
                </div>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveMedStock(e, id) {
        e.preventDefault();
        const f = e.target;
        const p = this.data.patients.find(x => x.id === id);
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({name: f.name.value, init: parseInt(f.init.value), used: 0, est: f.est.value});
        this.save(); this.closeModal(); this.nav('medicine');
    },
    useMed(id, idx) {
        Swal.fire({
            title: 'Konfirmasi Minum Obat',
            html: '<input id="swal-pj" class="swal2-input" placeholder="Nama PJ"><input id="swal-note" class="swal2-input" placeholder="Keterangan">',
            preConfirm: () => [document.getElementById('swal-pj').value, document.getElementById('swal-note').value]
        }).then(res => {
            if(res.isConfirmed) {
                const p = this.data.patients.find(x => x.id === id);
                const s = p.medicine.stock[idx];
                s.used++;
                p.medicine.logs.push({name: s.name, time: new Date().toLocaleString(), pj: res.value[0], note: res.value[1]});
                if(s.init - s.used <= 7) Swal.fire('REMINDER', `Stok ${s.name} tinggal ${s.init - s.used}!`, 'warning');
                this.save(); this.nav('medicine');
            }
        });
    },

    // ==========================================
    // 3. TTV & GDS
    // ==========================================
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Input Data</button>
                </div>
                <table class="w-full text-xs text-left">
                    <tr class="bg-slate-50 border-b"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat</th><th class="p-2">RR</th><th class="p-2">TB/BB</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                    ${(p.ttv || []).map((t, i) => `
                        <tr class="border-b">
                            <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}</td>
                            <td class="p-2">${t.rr}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2">${t.gds}</td>
                            <td class="p-2"><button onclick="app.delItem('${p.id}', 'ttv', ${i})" class="text-red-500">Hapus</button></td>
                        </tr>
                    `).join('')}
                </table>
            </div>`).join('');
    },
    modalTTV(id) {
        document.getElementById('modal-title').innerText = 'Input TTV & GDS';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTTV(event, '${id}')" class="grid grid-cols-2 gap-4">
                <input type="datetime-local" name="time" class="input-field col-span-2" required>
                <input name="td" placeholder="Tensi (mmHg)" class="input-field">
                <input name="sat" placeholder="Saturasi (%)" class="input-field">
                <input name="rr" placeholder="RR" class="input-field">
                <div class="flex gap-2"><input name="tb" placeholder="TB" class="input-field"><input name="bb" placeholder="BB" class="input-field"></div>
                <input name="gds" placeholder="Ket. GDS" class="input-field col-span-2">
                <button class="col-span-2 bg-teal-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveTTV(e, id) {
        e.preventDefault();
        const f = e.target;
        this.data.patients.find(x=>x.id===id).ttv.push({
            time: f.time.value, td: f.td.value, sat: f.sat.value, rr: f.rr.value, tb: f.tb.value, bb: f.bb.value, gds: f.gds.value
        });
        this.save(); this.closeModal(); this.nav('ttv');
    },

    // ==========================================
    // 4. VISIT DOKTER
    // ==========================================
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Visit Baru</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.visits || []).map((v, i) => `
                        <div class="border rounded-xl p-3 bg-slate-50 relative">
                            <button onclick="app.delItem('${p.id}', 'visits', ${i})" class="absolute top-2 right-2 text-red-500 font-bold">&times;</button>
                            <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2 bg-white">
                            <div class="font-bold text-xs text-teal-700">${v.time}</div>
                            <p class="text-sm italic text-slate-600 mb-2">"${v.note}"</p>
                            <div class="text-right"><img src="${v.sign}" class="h-8 inline"></div>
                        </div>
                    `).join('')}
                </div>
            </div>`).join('');
    },
    modalVisit(id) {
        document.getElementById('modal-title').innerText = 'Input Visit Dokter';
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field">
                <textarea id="v_note" placeholder="Keterangan Dokter" class="input-field h-24"></textarea>
                <div class="border p-2 bg-slate-50"><p class="text-xs mb-1">Tanda Tangan:</p><canvas id="sig-pad" class="w-full h-32 bg-white border"></canvas></div>
                <button onclick="app.saveVisit('${id}')" class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN VISIT</button>
            </div>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
            this.signaturePad = new SignaturePad(canvas);
        }, 100);
    },
    async saveVisit(id) {
        const photo = await this.toBase64(document.getElementById('v_photo').files[0]);
        const note = document.getElementById('v_note').value;
        const sign = this.signaturePad.toDataURL();
        this.data.patients.find(x=>x.id===id).visits.push({time: new Date().toLocaleString(), photo, note, sign});
        this.save(); this.closeModal(); this.nav('visit');
    },

    // ==========================================
    // 5. CRISIS (BPSS)
    // ==========================================
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white rounded-3xl p-6 mb-6 shadow-sm border border-slate-100 search-item">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="font-bold text-lg">${p.reg.name} - BPSS (7 Hari)</h3>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-center border">
                            <tr class="bg-slate-50"><th class="p-2 border">Aspek</th>${[1,2,3,4,5,6,7].map(d=>`<th class="p-2 border">D${d}</th>`).join('')}</tr>
                            ${['Bio','Psy','Soc','Spi'].map(c => `
                                <tr><td class="font-bold p-2 border text-left">${c}</td>
                                ${[1,2,3,4,5,6,7].map(d => `
                                    <td class="p-1 border"><input type="number" class="w-8 text-center" value="${(p.crisis?.scores?.[d]?.[c])||0}" onchange="app.updBPSS('${p.id}', ${d}, '${c}', this.value)"></td>
                                `).join('')}
                                </tr>
                            `).join('')}
                        </table>
                        <div class="mt-4 space-y-2">
                            <textarea onchange="app.updMeta('${p.id}', 'dis', this.value)" placeholder="Discharge Evaluation" class="input-field h-16 text-xs">${p.crisis?.meta?.dis||''}</textarea>
                            <textarea onchange="app.updMeta('${p.id}', 'chg', this.value)" placeholder="Change Score" class="input-field h-16 text-xs">${p.crisis?.meta?.chg||''}</textarea>
                        </div>
                    </div>
                    <div><canvas id="chart-${p.id}"></canvas></div>
                </div>
            </div>`).join('');
        // Render Charts after DOM update
        setTimeout(() => this.data.patients.forEach(p => this.renderChart(p)), 100);
    },
    updBPSS(id, d, c, v) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.crisis) p.crisis = {scores:{}, meta:{}};
        if(!p.crisis.scores[d]) p.crisis.scores[d] = {};
        p.crisis.scores[d][c] = parseInt(v);
        this.save(); this.renderChart(p);
    },
    updMeta(id, k, v) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.crisis) p.crisis = {scores:{}, meta:{}};
        p.crisis.meta[k] = v;
        this.save();
    },
    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx) return;
        const data = ['Bio','Psy','Soc','Spi'].map((c, i) => ({
            label: c, data: [1,2,3,4,5,6,7].map(d => (p.crisis?.scores?.[d]?.[c])||0),
            borderColor: ['#ef4444','#f59e0b','#3b82f6','#10b981'][i], fill: false
        }));
        if(p.chart) p.chart.destroy();
        p.chart = new Chart(ctx, {type:'line', data:{labels:['D1','D2','D3','D4','D5','D6','D7'], datasets:data}});
    },

    // ==========================================
    // 6 & 7. PROGRAM & TERAPI
    // ==========================================
    viewProgram(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="bg-white rounded-3xl p-6 mb-4 flex justify-between items-center shadow-sm search-item">
                <div>
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <p class="text-sm">Paket: <b>${p.program?.paket||'-'}</b> | Durasi: <b>${p.program?.durasi||'-'} Hari</b></p>
                </div>
                <button onclick="app.modalProg('${p.id}')" class="bg-indigo-600 text-white px-3 py-1 rounded text-xs">Edit</button>
            </div>`;
        });
    },
    modalProg(id) {
        const p = this.data.patients.find(x=>x.id===id).program || {};
        document.getElementById('modal-title').innerText = 'Rencana Program';
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveProg(event, '${id}')" class="space-y-4">
                <select name="paket" class="input-field"><option>Reguler</option><option>Eksklusif</option></select>
                <select name="durasi" class="input-field"><option value="7">7 Hari</option><option value="14">14 Hari</option><option value="30">30 Hari</option><option value="60">60 Hari</option></select>
                <button class="w-full bg-indigo-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveProg(e, id) {
        e.preventDefault();
        this.data.patients.find(x=>x.id===id).program = {paket:e.target.paket.value, durasi:e.target.durasi.value};
        this.save(); this.closeModal(); this.nav('program');
    },
    viewTherapy(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="bg-white rounded-3xl p-6 mb-4 shadow-sm search-item">
                <h3 class="font-bold mb-2">${p.reg.name}</h3>
                <textarea onchange="app.saveTherapy('${p.id}', this.value)" class="input-field h-24" placeholder="Ketik rencana terapi...">${p.therapy||''}</textarea>
            </div>`;
        });
    },
    saveTherapy(id, val) {
        this.data.patients.find(x=>x.id===id).therapy = val;
        this.save();
    },

    // --- UTILITIES ---
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    
    toBase64: file => new Promise(r => { 
        const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => r(reader.result); 
    }),

    deletePatient(id) {
        if(confirm('Hapus Pasien Permanen?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== id);
            this.save(); this.nav('dashboard');
        }
    },
    delItem(id, type, idx) {
        if(confirm('Hapus Item?')) {
            this.data.patients.find(x=>x.id===id)[type].splice(idx, 1);
            this.save(); this.nav(this.currentPage);
        }
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    exportAllExcel() {
        const wb = XLSX.utils.book_new();
        const data = this.data.patients.map(p => ({
            Nama: p.reg.name, Usia: p.reg.age, Masuk: p.reg.timestamp, 
            Diagnosa: p.diagnosis?.entry_diag || '-', Program: p.program?.paket || '-'
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Data Pasien");
        XLSX.writeFile(wb, "MMRC_Full_Data.xlsx");
    }
};

// Start App
window.onload = () => {};
