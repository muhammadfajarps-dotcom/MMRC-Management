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

    // --- 1. DASHBOARD (REGISTRASI, RIWAYAT, DIAGNOSA) ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold">+ REGISTRASI MASUK</button>
            </div>
            <div class="space-y-8">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border search-item">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="border-r pr-4">
                                <div class="flex items-center gap-3 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/80'}" class="w-16 h-16 rounded-xl object-cover border">
                                    <div>
                                        <h4 class="font-bold text-teal-700">${p.reg.name}</h4>
                                        <p class="text-[10px] text-slate-400">${p.reg.timestamp}</p>
                                    </div>
                                </div>
                                <div class="text-[11px] space-y-1 text-slate-600">
                                    <p><b>TTL/Usia:</b> ${p.reg.ttl} / ${p.reg.age} Thn</p>
                                    <p><b>Status/Pdk:</b> ${p.reg.status} / ${p.reg.edu}</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job}</p>
                                    <p><b>Alamat:</b> ${p.reg.addr}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian}</p>
                                    <p class="text-red-500"><b>Spotcheck:</b> ${p.reg.spotcheck}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase">Riwayat & Kondisi</h5>
                                <div class="text-[11px] space-y-2">
                                    <p><b>Fisik/Psikis:</b> ${p.history.desc}</p>
                                    <p><b>Diagnosa Lalu:</b> ${p.history.prev_diag}</p>
                                    <p><b>Dosis Lalu:</b> ${p.history.prev_rx}</p>
                                    <p class="bg-amber-50 p-1"><b>Terkini:</b> ${p.history.current}</p>
                                </div>
                            </div>
                            <div class="px-4">
                                <h5 class="font-bold text-xs text-slate-400 mb-2 uppercase">Diagnosa Dokter</h5>
                                <div class="text-[11px] space-y-1">
                                    <p><b>Dokter:</b> ${p.diagnosis.dr_name}</p>
                                    <p><b>Planning:</b> ${p.diagnosis.plan}</p>
                                    <div class="flex gap-2 my-2">
                                        <span class="${p.diagnosis.inj ? 'text-teal-600' : 'text-slate-300'} font-bold">Injeksi</span>
                                        <span class="${p.diagnosis.urine ? 'text-teal-600' : 'text-slate-300'} font-bold">Urine Test</span>
                                        <span class="${p.diagnosis.fix ? 'text-teal-600' : 'text-slate-300'} font-bold">Fiksasi</span>
                                    </div>
                                    <p><b>Resep:</b> ${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})</p>
                                </div>
                                <div class="mt-4 flex gap-2">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 border border-amber-600 px-3 py-1 rounded-lg text-[10px]">EDIT</button>
                                    <button onclick="app.delPatient('${p.id}')" class="text-red-600 border border-red-600 px-3 py-1 rounded-lg text-[10px]">HAPUS</button>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>`;
    },

    modalAddPatient(editId = null) {
        const p = editId ? this.data.patients.find(x => x.id === editId) : null;
        document.getElementById('modal-title').innerText = editId ? "EDIT DATA PASIEN" : "REGISTRASI PASIEN BARU";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">1. REGISTRASI & BIODATA</p>
                    <input name="photo_file" type="file" class="input-field text-[10px]">
                    <input name="name" value="${p?p.reg.name:''}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${p?p.reg.ttl:''}" placeholder="Tempat Tanggal Lahir" class="input-field">
                    <input name="age" value="${p?p.reg.age:''}" type="number" placeholder="Usia" class="input-field">
                    <input name="status" value="${p?p.reg.status:''}" placeholder="Status Pernikahan" class="input-field">
                    <input name="edu" value="${p?p.reg.edu:''}" placeholder="Pendidikan Terakhir" class="input-field">
                    <input name="job" value="${p?p.reg.job:''}" placeholder="Pekerjaan" class="input-field">
                    <input name="addr" value="${p?p.reg.addr:''}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${p?p.reg.guardian:''}" placeholder="Nama Wali" class="input-field">
                    <input name="spotcheck" value="${p?p.reg.spotcheck:''}" placeholder="Spotcheck Barang Bawaan" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">2. RIWAYAT PENYAKIT</p>
                    <textarea name="h_desc" placeholder="Riwayat Fisik/Psikis" class="input-field h-20">${p?p.history.desc:''}</textarea>
                    <textarea name="h_prev_diag" placeholder="Diagnosa Dokter Sebelumnya" class="input-field h-20">${p?p.history.prev_diag:''}</textarea>
                    <input name="h_prev_rx" value="${p?p.history.prev_rx:''}" placeholder="Riwayat Dosis Obat" class="input-field">
                    <input name="h_current" value="${p?p.history.current:''}" placeholder="Kondisi Terkini Pasien" class="input-field">
                </div>
                <div class="space-y-2">
                    <p class="font-bold text-xs border-b pb-1 text-teal-700">3. DIAGNOSA DOKTER</p>
                    <input name="d_dr" value="${p?p.diagnosis.dr_name:''}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="d_entry" placeholder="Diagnosa Saat Masuk" class="input-field h-16">${p?p.diagnosis.entry_diag:''}</textarea>
                    <textarea name="d_plan" placeholder="Planning Dokter" class="input-field h-16">${p?p.diagnosis.plan:''}</textarea>
                    <div class="flex gap-2 text-[10px] bg-slate-50 p-2 rounded">
                        <label><input type="checkbox" name="inj" ${p?.diagnosis.inj?'checked':''}> Injeksi</label>
                        <label><input type="checkbox" name="urine" ${p?.diagnosis.urine?'checked':''}> Urine</label>
                        <label><input type="checkbox" name="fix" ${p?.diagnosis.fix?'checked':''}> Fiksasi</label>
                    </div>
                    <input name="d_rx" value="${p?p.diagnosis.rx_name:''}" placeholder="Resep & Nama Obat" class="input-field">
                    <input name="d_qty" value="${p?p.diagnosis.rx_qty:''}" type="number" placeholder="Jumlah Obat" class="input-field">
                </div>
                <button class="md:col-span-3 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA PASIEN</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        let photoBase64 = editId ? this.data.patients.find(x => x.id === editId).reg.photo : null;
        if (photoFile && photoFile.size > 0) photoBase64 = await this.toBase64(photoFile);

        const pData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'), ttl: fd.get('ttl'), age: fd.get('age'), status: fd.get('status'),
                edu: fd.get('edu'), job: fd.get('job'), addr: fd.get('addr'), guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'), photo: photoBase64,
                timestamp: editId ? this.data.patients.find(x => x.id === editId).reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: { desc: fd.get('h_desc'), prev_diag: fd.get('h_prev_diag'), prev_rx: fd.get('h_prev_rx'), current: fd.get('h_current') },
            diagnosis: { 
                dr_name: fd.get('d_dr'), entry_diag: fd.get('d_entry'), plan: fd.get('d_plan'),
                inj: fd.get('inj')==='on', urine: fd.get('urine')==='on', fix: fd.get('fix')==='on',
                rx_name: fd.get('d_rx'), rx_qty: fd.get('d_qty')
            },
            medicine: editId ? this.data.patients.find(x => x.id === editId).medicine : { stock: [], logs: [] },
            ttv: editId ? this.data.patients.find(x => x.id === editId).ttv : [],
            visits: editId ? this.data.patients.find(x => x.id === editId).visits : [],
            crisis: editId ? this.data.patients.find(x => x.id === editId).crisis : { bpss: [] },
            program: editId ? this.data.patients.find(x => x.id === editId).program : { type: '', duration: '' },
            therapy: editId ? this.data.patients.find(x => x.id === editId).therapy : ''
        };

        if(editId) {
            const idx = this.data.patients.findIndex(x => x.id === editId);
            this.data.patients[idx] = pData;
        } else {
            this.data.patients.push(pData);
        }
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 2. MEDICINE (STOK & CATATAN MINUM OTOMATIS) ---
    // [UPDATE: Fungsi Edit & Hapus Diperbaiki]
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-6">${p.reg.name} - MEDICINE</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between items-center mb-4">
                            <h4 class="font-bold text-xs uppercase text-slate-400">Stok Obat Pasien</h4>
                            <button onclick="app.modalMedStock('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-[10px]">+ Stok Baru</button>
                        </div>
                        <div class="space-y-4">
                            ${p.medicine.stock.map((s, i) => `
                                <div class="p-4 border rounded-2xl bg-slate-50 relative">
                                    <div class="flex justify-between items-start">
                                        <div><p class="font-bold text-teal-700">${s.name}</p><p class="text-[9px]">Awal: ${s.init} | Tgl Habis: ${s.exp}</p></div>
                                        <div class="text-right">
                                            <p class="text-lg font-black ${s.init-s.used <= 7 ? 'text-red-500 animate-pulse':'text-teal-600'}">${s.init-s.used}</p>
                                            <p class="text-[8px]">SISA TAB</p>
                                        </div>
                                    </div>
                                    <div class="mt-3 flex gap-2">
                                        <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px]">Catat Minum</button>
                                        <button onclick="app.modalMedStock('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs uppercase text-slate-400 mb-4">Catatan Penggunaan Obat</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-[10px] text-left">
                                <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">Obat</th><th class="p-2">PJ</th><th class="p-2">Aksi</th></tr>
                                ${p.medicine.logs.map((l, i) => `
                                    <tr class="border-b">
                                        <td class="p-2">${l.time}</td><td class="p-2 font-bold">${l.name}</td><td class="p-2">${l.pj}</td>
                                        <td class="p-2 flex gap-2">
                                            <button onclick="app.modalEditLog('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                            <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    modalMedStock(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const s = editIdx !== null ? p.medicine.stock[editIdx] : null;
        document.getElementById('modal-title').innerText = s ? "EDIT STOK OBAT" : "TAMBAH STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" value="${s?s.name:''}" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" value="${s?s.init:''}" type="number" placeholder="Stok Awal" class="input-field">
                <input id="ms_exp" value="${s?s.exp:''}" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    saveMedStock(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const data = { 
            name: document.getElementById('ms_name').value, 
            init: parseInt(document.getElementById('ms_init').value), 
            used: idx !== null ? p.medicine.stock[idx].used : 0, 
            exp: document.getElementById('ms_exp').value 
        };
        if(idx !== null) p.medicine.stock[idx] = data;
        else p.medicine.stock.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    modalUseMed(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <p class="text-sm">Catat penggunaan <b>${stock.name}</b> (Stok berkurang 1)</p>
                <input id="ml_pj" placeholder="Nama PJ (Penanggung Jawab)" class="input-field">
                <textarea id="ml_note" placeholder="Keterangan..." class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${sIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">KONFIRMASI</button>
            </div>`;
        this.openModal();
    },

    saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        if(!pj) return Swal.fire('Error', 'Isi Nama PJ!', 'error');

        stock.used += 1;
        p.medicine.logs.unshift({ time: new Date().toLocaleString('id-ID'), name: stock.name, pj: pj, note: document.getElementById('ml_note').value });
        this.saveDB(); this.closeModal(); this.render();
        if(stock.init - stock.used <= 7) Swal.fire('Reminder', 'Stok tersisa 7!', 'warning');
    },

    // [NEW: Fungsi Edit Log]
    modalEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const log = p.medicine.logs[logIdx];
        document.getElementById('modal-title').innerText = "EDIT CATATAN OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <p class="text-xs text-slate-500 mb-2">Mengedit tidak mengubah jumlah stok.</p>
                <input id="el_time" value="${log.time}" placeholder="Waktu" class="input-field">
                <input id="el_name" value="${log.name}" placeholder="Nama Obat" class="input-field" readonly>
                <input id="el_pj" value="${log.pj}" placeholder="Nama PJ" class="input-field">
                <textarea id="el_note" placeholder="Keterangan..." class="input-field">${log.note || ''}</textarea>
                <button onclick="app.saveEditLog('${pid}', ${logIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN PERUBAHAN</button>
            </div>`;
        this.openModal();
    },

    saveEditLog(pid, logIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.logs[logIdx].time = document.getElementById('el_time').value;
        p.medicine.logs[logIdx].pj = document.getElementById('el_pj').value;
        p.medicine.logs[logIdx].note = document.getElementById('el_note').value;
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Sukses', 'Catatan diperbarui', 'success');
    },

    // --- 3. TTV & GDS ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT TTV/GDS</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-[11px] text-left">
                        <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">TD</th><th class="p-2">Sat/RR</th><th class="p-2">TB/BB</th><th class="p-2">GDS</th><th class="p-2">Aksi</th></tr>
                        ${p.ttv.map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2">${t.time}</td><td class="p-2">${t.td}</td><td class="p-2">${t.sat}% / ${t.rr}</td><td class="p-2">${t.tb}/${t.bb}</td><td class="p-2 font-bold">${t.gds}</td>
                                <td class="p-2 flex gap-2">
                                    <button onclick="app.modalTTV('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>`).join('')}
                    </table>
                </div>
            </div>
        `).join('');
    },

    modalTTV(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const t = editIdx !== null ? p.ttv[editIdx] : null;
        document.getElementById('modal-title').innerText = t ? "EDIT TTV/GDS" : "INPUT TTV/GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="t_td" value="${t?t.td:''}" placeholder="Tensi Darah" class="input-field">
                <input id="t_sat" value="${t?t.sat:''}" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" value="${t?t.rr:''}" placeholder="RR" class="input-field">
                <input id="t_tb" value="${t?t.tb:''}" placeholder="Tinggi (cm)" class="input-field">
                <input id="t_bb" value="${t?t.bb:''}" placeholder="Berat (kg)" class="input-field">
                <input id="t_gds" value="${t?t.gds:''}" placeholder="Keterangan GDS" class="input-field">
                <button onclick="app.saveTTV('${pid}', ${editIdx})" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA</button>
            </div>`;
        this.openModal();
    },

    saveTTV(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const data = { time: idx !== null ? p.ttv[idx].time : new Date().toLocaleString('id-ID'), td: document.getElementById('t_td').value, sat: document.getElementById('t_sat').value, rr: document.getElementById('t_rr').value, tb: document.getElementById('t_tb').value, bb: document.getElementById('t_bb').value, gds: document.getElementById('t_gds').value };
        if(idx !== null) p.ttv[idx] = data;
        else p.ttv.unshift(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 4. VISIT DOKTER ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">SIMPAN VISIT BARU</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${p.visits.map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative">
                            <div class="absolute top-2 right-2 flex gap-2">
                                <button onclick="app.modalAddVisit('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                            </div>
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                            <p class="text-[10px] text-teal-600 font-bold">${v.time}</p>
                            <p class="text-xs italic my-2">"${v.note}"</p>
                            <div class="flex justify-end"><img src="${v.sign}" class="h-10 border-b"></div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    modalAddVisit(pid, editIdx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const v = editIdx !== null ? p.visits[editIdx] : null;
        document.getElementById('modal-title').innerText = v ? "EDIT VISIT" : "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field text-xs">
                <textarea id="v_note" placeholder="Hasil Wawancara Dokter..." class="input-field h-32">${v?v.note:''}</textarea>
                <div class="border rounded-xl p-2 bg-white text-center">
                    <p class="text-[8px] uppercase font-bold text-slate-400">Tanda Tangan Dokter</p>
                    <canvas id="sig-pad" class="w-full h-40 border bg-slate-50 rounded-lg"></canvas>
                    <button onclick="app.signaturePad.clear()" class="text-[9px] text-red-500 mt-1">Hapus TTD</button>
                </div>
                <button onclick="app.saveVisit('${pid}', ${editIdx})" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
        this.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
        if(v) this.signaturePad.fromDataURL(v.sign);
    },

    async saveVisit(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const file = document.getElementById('v_photo').files[0];
        let photo = idx !== null ? p.visits[idx].photo : "https://via.placeholder.com/400x300";
        if(file) photo = await this.toBase64(file);

        const data = { time: idx !== null ? p.visits[idx].time : new Date().toLocaleString('id-ID'), note: document.getElementById('v_note').value, photo: photo, sign: this.signaturePad.toDataURL() };
        if(idx !== null) p.visits[idx] = data;
        else p.visits.unshift(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 5. PASIEN CRISIS (BPSS & CHART POLYGON) ---
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-red-800">PASIEN CRISIS - ${p.reg.name}</h3>
                    <button onclick="app.modalBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT SCORE BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border">
                            <tr class="bg-slate-100"><th>Day</th><th>Bio</th><th>Psy</th><th>Soc</th><th>Spi</th><th>Eval</th><th>Aksi</th></tr>
                            ${p.crisis.bpss.map((b, i) => `
                                <tr class="border-b">
                                    <td>D-${i+1}</td><td>${b.bio}</td><td>${b.psy}</td><td>${b.soc}</td><td>${b.spi}</td>
                                    <td class="font-bold">${b.eval}</td>
                                    <td class="flex gap-2">
                                        <button onclick="app.modalBPSS('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                        <button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                    </td>
                                </tr>`).join('')}
                        </table>
                    </div>
                    <div class="h-64 border rounded-2xl p-4 bg-slate-50"><canvas id="chart-${p.id}"></canvas></div>
                </div>
            </div>
        `).join('');
        this.data.patients.forEach(p => this.renderChart(p));
    },

    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx || p.crisis.bpss.length === 0) return;
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `Day ${i+1}`),
                datasets: [{ label: 'Total Score', data: p.crisis.bpss.map(b => b.eval), borderColor: '#dc2626', backgroundColor: 'rgba(220, 38, 38, 0.1)', fill: true, tension: 0.3 }]
            },
            options: { maintainAspectRatio: false }
        });
    },

    modalBPSS(pid, idx = null) {
        const p = this.data.patients.find(x => x.id === pid);
        const b = idx !== null ? p.crisis.bpss[idx] : null;
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE (0-25)";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" value="${b?b.bio:''}" type="number" placeholder="Biological" class="input-field">
                <input id="b_psy" value="${b?b.psy:''}" type="number" placeholder="Psychological" class="input-field">
                <input id="b_soc" value="${b?b.soc:''}" type="number" placeholder="Social" class="input-field">
                <input id="b_spi" value="${b?b.spi:''}" type="number" placeholder="Spiritual" class="input-field">
                <textarea id="b_note" placeholder="Evaluasi/Change (Masa Detox 7 Hari)" class="input-field col-span-2">${b?b.note:''}</textarea>
                <button onclick="app.saveBPSS('${pid}', ${idx})" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    saveBPSS(pid, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('b_bio').value)||0, psy = parseInt(document.getElementById('b_psy').value)||0, soc = parseInt(document.getElementById('b_soc').value)||0, spi = parseInt(document.getElementById('b_spi').value)||0;
        const data = { bio, psy, soc, spi, eval: bio+psy+soc+spi, note: document.getElementById('b_note').value };
        if(idx !== null) p.crisis.bpss[idx] = data;
        else p.crisis.bpss.push(data);
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 6. RENCANA PROGRAM ---
    viewProgram(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - PROGRAM</h3>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="bg-slate-50 p-4 rounded-xl border"><b>Paket:</b> ${p.program.type || '-'}</div>
                    <div class="bg-slate-50 p-4 rounded-xl border"><b>Waktu:</b> ${p.program.duration || '-'}</div>
                </div>
                <div class="flex gap-2">
                    <button onclick="app.modalProgram('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold">EDIT PROGRAM</button>
                    <button onclick="app.delProgram('${p.id}')" class="text-red-500 px-6 py-2 border border-red-500 rounded-xl text-xs font-bold">HAPUS</button>
                </div>
            </div>
        `).join('');
    },

    modalProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        document.getElementById('modal-title').innerText = "RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <select id="pr_type" class="input-field">
                    <option value="Reguler" ${p.program.type==='Reguler'?'selected':''}>Paket Reguler</option>
                    <option value="Eksklusif" ${p.program.type==='Eksklusif'?'selected':''}>Paket Eksklusif</option>
                </select>
                <select id="pr_dur" class="input-field">
                    <option value="7 Hari" ${p.program.duration==='7 Hari'?'selected':''}>7 Hari (Detox/Stabilisasi)</option>
                    <option value="14 Hari" ${p.program.duration==='14 Hari'?'selected':''}>14 Hari</option>
                    <option value="30 Hari" ${p.program.duration==='30 Hari'?'selected':''}>30 Hari</option>
                    <option value="60 Hari" ${p.program.duration==='60 Hari'?'selected':''}>60 Hari</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = { type: document.getElementById('pr_type').value, duration: document.getElementById('pr_dur').value };
        this.saveDB(); this.closeModal(); this.render();
    },

    delProgram(pid) {
        this.data.patients.find(x => x.id === pid).program = { type: '', duration: '' };
        this.saveDB(); this.render();
    },

    // --- 7. RENCANA TERAPI ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border mb-8 search-item">
                <h3 class="font-bold text-teal-800 mb-4">${p.reg.name} - RENCANA TERAPI</h3>
                <textarea id="ther_${p.id}" class="input-field h-32 mb-4" placeholder="Tulis rencana terapi...">${p.therapy || ''}</textarea>
                <div class="flex gap-2">
                    <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold">SIMPAN</button>
                    <button onclick="app.delTherapy('${p.id}')" class="text-red-500 px-6 py-2 border border-red-500 rounded-xl text-xs font-bold">HAPUS</button>
                </div>
            </div>
        `).join('');
    },

    saveTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = document.getElementById(`ther_${pid}`).value;
        this.saveDB(); Swal.fire('Tersimpan', 'Rencana Terapi Diperbarui', 'success');
    },

    delTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = '';
        this.saveDB(); this.render();
    },

    // --- UTILS ---
    delPatient(pid) {
        if(confirm('Hapus seluruh data pasien ini?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== pid);
            this.saveDB(); this.render();
        }
    },

    delSubItem(pid, path, idx) {
        if(!confirm('Hapus item?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        this.saveDB(); this.render();
    },

    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },

    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),

    // [EXPORT WORD FITUR]
    exportToWord() {
        if (!this.data.patients.length) return Swal.fire('Info', 'Belum ada data pasien', 'info');
        
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType, HeadingLevel } = docx;

        const children = [];
        
        // Judul Dokumen
        children.push(new Paragraph({
            text: "DATA PASIEN MMRC MADANI",
            heading: HeadingLevel.HEADING_1,
            alignment: "center",
            spacing: { after: 300 }
        }));

        this.data.patients.forEach(p => {
            // Nama Pasien
            children.push(new Paragraph({
                children: [new TextRun({ text: p.reg.name, bold: true, size: 28 })],
                spacing: { before: 400, after: 200 }
            }));

            // Tabel Biodata Simple
            children.push(new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("TTL/Usia")] }), new TableCell({ children: [new Paragraph(`${p.reg.ttl} (${p.reg.age} Thn)`)] }) ] }),
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Diagnosa")] }), new TableCell({ children: [new Paragraph(p.diagnosis.entry_diag || '-')] }) ] }),
                    new TableRow({ children: [ new TableCell({ children: [new Paragraph("Resep")] }), new TableCell({ children: [new Paragraph(`${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})`)] }) ] }),
                ]
            }));

            // Judul Sub Section
            children.push(new Paragraph({ text: "Catatan Obat & TTV:", bold: true, spacing: { before: 200 } }));

            // List Singkat Obat
            const logText = p.medicine.logs.length ? p.medicine.logs.map(l => `${l.time}: ${l.name} (${l.pj})`).join('\n') : "Belum ada catatan minum obat.";
            children.push(new Paragraph({ text: logText, spacing: { after: 200 } }));

            // Garis Pembatas
            children.push(new Paragraph({ text: "--------------------------------------------------", alignment: "center" }));
        });

        const doc = new Document({ sections: [{ properties: {}, children: children }] });

        Packer.toBlob(doc).then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "MMRC_Data_Pasien.docx";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        });
    },

    exportAllExcel() {
        if (!this.data.patients.length) return Swal.fire('Info', 'Belum ada data pasien', 'info');
        
        const rows = this.data.patients.map(p => ({
            Nama: p.reg.name,
            Usia: p.reg.age,
            Diagnosa: p.diagnosis.entry_diag,
            Dokter: p.diagnosis.dr_name,
            Resep: p.diagnosis.rx_name,
            Program: p.program.type
        }));

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "MMRC_Data.xlsx");
    }
};

app.render();
