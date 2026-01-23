const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

    // --- CORE SYSTEM ---
    saveDB() {
        localStorage.setItem('MMRC_DATABASE', JSON.stringify(this.data));
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = document.getElementById(`btn-${page}`);
        if (btn) btn.classList.add('active');
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

    // --- 1. MENU DASHBOARD (REGISTRASI, RIWAYAT, DIAGNOSA) ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="mb-6 flex justify-between items-center">
                <h3 class="text-xl font-bold text-slate-700">DASHBOARD - MANAJEMEN PASIEN</h3>
                <button onclick="app.modalAddPatient()" class="bg-teal-600 text-white px-6 py-2 rounded-xl font-bold shadow-lg">+ REGISTRASI PASIEN</button>
            </div>
            <div class="space-y-8">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-3xl shadow-sm border-2 border-slate-100 search-item">
                        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div class="border-r pr-4">
                                <div class="flex items-center gap-4 mb-4">
                                    <img src="${p.reg.photo || 'https://via.placeholder.com/80'}" class="w-20 h-20 rounded-2xl object-cover border">
                                    <div>
                                        <h4 class="font-bold text-teal-700">${p.reg.name}</h4>
                                        <p class="text-[10px] text-slate-400">${p.reg.timestamp}</p>
                                    </div>
                                </div>
                                <div class="text-xs space-y-1">
                                    <p><b>TTL:</b> ${p.reg.ttl}</p>
                                    <p><b>Usia:</b> ${p.reg.age} Thn</p>
                                    <p><b>Status:</b> ${p.reg.marital}</p>
                                    <p><b>Pekerjaan:</b> ${p.reg.job}</p>
                                    <p><b>Alamat:</b> ${p.reg.address}</p>
                                    <p><b>Wali:</b> ${p.reg.guardian}</p>
                                    <p class="text-red-500"><b>Spotcheck:</b> ${p.reg.spotcheck}</p>
                                </div>
                            </div>
                            <div class="border-r px-4">
                                <h5 class="font-bold text-xs uppercase text-slate-500 mb-2">Riwayat & Kondisi</h5>
                                <div class="text-xs space-y-2">
                                    <p><b>Riwayat Psikis/Fisik:</b> ${p.history.desc}</p>
                                    <p><b>Diagnosa Lalu:</b> ${p.history.prev_diag}</p>
                                    <p><b>Dosis Obat Lalu:</b> ${p.history.prev_rx}</p>
                                    <p class="bg-amber-50 p-2 rounded"><b>Kondisi Terkini:</b> ${p.history.current_state}</p>
                                </div>
                            </div>
                            <div class="px-4">
                                <h5 class="font-bold text-xs uppercase text-slate-500 mb-2">Diagnosa Dokter Masuk</h5>
                                <div class="text-xs space-y-2">
                                    <p><b>Dokter:</b> ${p.diagnosis.dr_name}</p>
                                    <p><b>Diagnosa:</b> ${p.diagnosis.entry_diag}</p>
                                    <div class="flex gap-2 flex-wrap">
                                        <span class="px-2 py-1 bg-slate-100 rounded ${p.diagnosis.inj ? 'text-teal-600 font-bold' : 'text-slate-300'}">Injeksi</span>
                                        <span class="px-2 py-1 bg-slate-100 rounded ${p.diagnosis.urine ? 'text-teal-600 font-bold' : 'text-slate-300'}">Urine Test</span>
                                        <span class="px-2 py-1 bg-slate-100 rounded ${p.diagnosis.fixation ? 'text-teal-600 font-bold' : 'text-slate-300'}">Fiksasi</span>
                                    </div>
                                    <p><b>Resep:</b> ${p.diagnosis.rx_name} (${p.diagnosis.rx_qty})</p>
                                </div>
                                <div class="mt-4 flex gap-2">
                                    <button onclick="app.modalAddPatient('${p.id}')" class="text-amber-600 border border-amber-600 px-3 py-1 rounded-lg text-[10px]">EDIT DATA</button>
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
            <form onsubmit="app.savePatient(event, ${editId ? `'${editId}'` : 'null'})" class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="space-y-3">
                    <p class="font-bold text-teal-700 border-b">1. BIODATA</p>
                    <input name="photo_file" type="file" class="input-field text-[10px]">
                    <input name="name" value="${p ? p.reg.name : ''}" placeholder="Nama Lengkap" class="input-field" required>
                    <input name="ttl" value="${p ? p.reg.ttl : ''}" placeholder="Tempat Tanggal Lahir" class="input-field">
                    <input name="age" value="${p ? p.reg.age : ''}" type="number" placeholder="Usia" class="input-field">
                    <input name="marital" value="${p ? p.reg.marital : ''}" placeholder="Status Pernikahan" class="input-field">
                    <input name="job" value="${p ? p.reg.job : ''}" placeholder="Pekerjaan" class="input-field">
                    <input name="address" value="${p ? p.reg.address : ''}" placeholder="Alamat" class="input-field">
                    <input name="guardian" value="${p ? p.reg.guardian : ''}" placeholder="Nama Wali" class="input-field">
                    <input name="spotcheck" value="${p ? p.reg.spotcheck : ''}" placeholder="Spotcheck Barang Bawaan" class="input-field">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-teal-700 border-b">2. RIWAYAT</p>
                    <textarea name="history_desc" placeholder="Riwayat Penyakit (Fisik/Psikis)" class="input-field h-20">${p ? p.history.desc : ''}</textarea>
                    <textarea name="prev_diag" placeholder="Diagnosa Dokter Sebelumnya" class="input-field h-20">${p ? p.history.prev_diag : ''}</textarea>
                    <input name="prev_rx" value="${p ? p.history.prev_rx : ''}" placeholder="Riwayat Dosis Obat" class="input-field">
                    <input name="current_state" value="${p ? p.history.current_state : ''}" placeholder="Kondisi Terkini" class="input-field">
                </div>
                <div class="space-y-3">
                    <p class="font-bold text-teal-700 border-b">3. DIAGNOSA DOKTER</p>
                    <input name="dr_name" value="${p ? p.diagnosis.dr_name : ''}" placeholder="Nama Dokter" class="input-field">
                    <textarea name="entry_diag" placeholder="Diagnosa Saat Masuk" class="input-field h-20">${p ? p.diagnosis.entry_diag : ''}</textarea>
                    <div class="flex gap-4 text-xs bg-slate-50 p-2 rounded-lg">
                        <label><input type="checkbox" name="inj" ${p?.diagnosis.inj ? 'checked' : ''}> Injeksi</label>
                        <label><input type="checkbox" name="urine" ${p?.diagnosis.urine ? 'checked' : ''}> Urine Test</label>
                        <label><input type="checkbox" name="fixation" ${p?.diagnosis.fixation ? 'checked' : ''}> Fiksasi</label>
                    </div>
                    <input name="rx_name" value="${p ? p.diagnosis.rx_name : ''}" placeholder="Nama Obat (Resep)" class="input-field">
                    <input name="rx_qty" value="${p ? p.diagnosis.rx_qty : ''}" type="number" placeholder="Jumlah Obat" class="input-field">
                </div>
                <button class="md:col-span-3 bg-teal-600 text-white py-3 rounded-2xl font-bold shadow-lg">SIMPAN DATA PASIEN</button>
            </form>`;
        this.openModal();
    },

    async savePatient(e, editId) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const photoFile = fd.get('photo_file');
        let photoBase64 = editId ? this.data.patients.find(x => x.id === editId).reg.photo : null;

        if (photoFile && photoFile.size > 0) {
            photoBase64 = await this.toBase64(photoFile);
        }

        const patientData = {
            id: editId || 'P-' + Date.now(),
            reg: {
                name: fd.get('name'),
                ttl: fd.get('ttl'),
                age: fd.get('age'),
                marital: fd.get('marital'),
                job: fd.get('job'),
                address: fd.get('address'),
                guardian: fd.get('guardian'),
                spotcheck: fd.get('spotcheck'),
                photo: photoBase64,
                timestamp: editId ? this.data.patients.find(x => x.id === editId).reg.timestamp : new Date().toLocaleString('id-ID')
            },
            history: {
                desc: fd.get('history_desc'),
                prev_diag: fd.get('prev_diag'),
                prev_rx: fd.get('prev_rx'),
                current_state: fd.get('current_state')
            },
            diagnosis: {
                dr_name: fd.get('dr_name'),
                entry_diag: fd.get('entry_diag'),
                inj: fd.get('inj') === 'on',
                urine: fd.get('urine') === 'on',
                fixation: fd.get('fixation') === 'on',
                rx_name: fd.get('rx_name'),
                rx_qty: fd.get('rx_qty')
            },
            medicine: editId ? this.data.patients.find(x => x.id === editId).medicine : { stock: [], logs: [] },
            ttv: editId ? this.data.patients.find(x => x.id === editId).ttv : [],
            visits: editId ? this.data.patients.find(x => x.id === editId).visits : [],
            crisis: editId ? this.data.patients.find(x => x.id === editId).crisis : { bpss: [] },
            program: editId ? this.data.patients.find(x => x.id === editId).program : { type: '', duration: '' },
            therapy: editId ? this.data.patients.find(x => x.id === editId).therapy : ''
        };

        if (editId) {
            const index = this.data.patients.findIndex(x => x.id === editId);
            this.data.patients[index] = patientData;
        } else {
            this.data.patients.push(patientData);
        }

        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Berhasil', 'Data Pasien Disimpan', 'success');
    },

    // --- 2. MENU MEDICINE (STOK & OTOMATISASI LOG) ---
    viewMedicine(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800 text-lg">${p.reg.name} - MANAJEMEN OBAT</h3>
                    <button onclick="app.modalAddStock('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ TAMBAH STOK BARU</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <h4 class="font-bold text-xs text-slate-400 mb-4 uppercase">STOK OBAT PASIEN</h4>
                        <div class="space-y-4">
                            ${p.medicine.stock.map((s, i) => `
                                <div class="p-4 border rounded-2xl bg-slate-50 relative">
                                    <div class="flex justify-between items-start">
                                        <div>
                                            <p class="font-bold text-teal-700">${s.name}</p>
                                            <p class="text-[10px]">Stok Awal: ${s.init} | Digunakan: ${s.used}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-lg font-black ${s.init - s.used <= 7 ? 'text-red-500' : 'text-teal-600'}">${s.init - s.used}</p>
                                            <p class="text-[9px]">SISA TAB</p>
                                        </div>
                                    </div>
                                    ${s.init - s.used <= 7 ? '<div class="mt-2 text-[9px] bg-red-100 text-red-600 p-1 rounded text-center animate-pulse font-bold">⚠️ REMINDER: STOK MENIPIS!</div>' : ''}
                                    <div class="mt-2 text-[10px] text-slate-500 italic">Estimasi Habis: ${s.exp_date || '-'}</div>
                                    <div class="mt-3 flex gap-2">
                                        <button onclick="app.modalAddLog('${p.id}', ${i})" class="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px]">CATAT MINUM OBAT</button>
                                        <button onclick="app.delSubItem('${p.id}', 'medicine.stock', ${i})" class="text-red-500 p-1"><i class="fas fa-trash"></i></button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-bold text-xs text-slate-400 mb-4 uppercase">CATATAN PENGGUNAAN OBAT (PJ)</h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-[10px] text-left">
                                <tr class="bg-slate-100"><th class="p-2">Waktu</th><th class="p-2">Obat</th><th class="p-2">PJ</th><th class="p-2">Aksi</th></tr>
                                ${p.medicine.logs.map((l, i) => `
                                    <tr class="border-b">
                                        <td class="p-2">${l.time}</td>
                                        <td class="p-2 font-bold">${l.name}</td>
                                        <td class="p-2">${l.pj}</td>
                                        <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button></td>
                                    </tr>
                                `).join('')}
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    modalAddStock(pid) {
        document.getElementById('modal-title').innerText = "INPUT STOK OBAT BARU";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" placeholder="Nama Obat" class="input-field">
                <input id="ms_init" type="number" placeholder="Jumlah Stok Awal (Tablet)" class="input-field">
                <input id="ms_exp" type="date" class="input-field">
                <p class="text-[10px] text-slate-400">Pilih estimasi tanggal obat habis</p>
                <button onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN STOK</button>
            </div>`;
        this.openModal();
    },

    saveMedStock(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const name = document.getElementById('ms_name').value;
        const init = parseInt(document.getElementById('ms_init').value);
        const exp = document.getElementById('ms_exp').value;
        if(!name || !init) return;

        p.medicine.stock.push({ name, init, used: 0, exp_date: exp });
        this.saveDB(); this.closeModal(); this.render();
    },

    modalAddLog(pid, stockIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[stockIdx];
        document.getElementById('modal-title').innerText = "KONFIRMASI MINUM OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <div class="p-4 bg-teal-50 rounded-xl">
                    <p class="font-bold text-teal-800">${stock.name}</p>
                    <p class="text-xs">Sisa Stok Saat Ini: ${stock.init - stock.used} Tablet</p>
                </div>
                <input id="ml_pj" placeholder="Nama PJ (Perawat/Staff)" class="input-field">
                <textarea id="ml_note" placeholder="Keterangan (misal: Pasien kooperatif)" class="input-field"></textarea>
                <button onclick="app.saveMedLog('${pid}', ${stockIdx})" class="w-full bg-blue-600 text-white py-3 rounded-2xl font-bold">KONFIRMASI (STOK BERKURANG 1)</button>
            </div>`;
        this.openModal();
    },

    saveMedLog(pid, sIdx) {
        const p = this.data.patients.find(x => x.id === pid);
        const stock = p.medicine.stock[sIdx];
        const pj = document.getElementById('ml_pj').value;
        if(!pj) return Swal.fire('Error', 'Nama PJ Wajib Diisi', 'error');

        // Otomatisasi Stok
        stock.used += 1;
        p.medicine.logs.unshift({
            time: new Date().toLocaleString('id-ID'),
            name: stock.name,
            pj: pj,
            note: document.getElementById('ml_note').value
        });

        this.saveDB(); this.closeModal(); this.render();
        if(stock.init - stock.used <= 7) Swal.fire('Peringatan Stok', 'Stok obat tersisa ' + (stock.init - stock.used) + '. Segera ajukan pengadaan!', 'warning');
    },

    // --- 3. MENU TTV & GDS ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - TTV & GDS</h3>
                    <button onclick="app.modalAddTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT DATA TTV/GDS</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs text-left">
                        <tr class="bg-slate-100">
                            <th class="p-2">Waktu</th><th class="p-2">Tensi</th><th class="p-2">Saturasi</th><th class="p-2">RR</th>
                            <th class="p-2">TB/BB</th><th class="p-2">GDS (Ket)</th><th class="p-2">Aksi</th>
                        </tr>
                        ${p.ttv.map((t, i) => `
                            <tr class="border-b">
                                <td class="p-2 text-[10px]">${t.time}</td>
                                <td class="p-2">${t.td}</td><td class="p-2">${t.sat}%</td><td class="p-2">${t.rr}</td>
                                <td class="p-2">${t.tb}/${t.bb}</td><td class="p-2 font-bold">${t.gds}</td>
                                <td class="p-2">
                                    <button onclick="app.delSubItem('${p.id}', 'ttv', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
            </div>
        `).join('');
    },

    modalAddTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV & GDS";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="ttv_td" placeholder="Tensi Darah (mmHg)" class="input-field">
                <input id="ttv_sat" placeholder="Saturasi (%)" class="input-field">
                <input id="ttv_rr" placeholder="RR (x/menit)" class="input-field">
                <input id="ttv_tb" placeholder="Tinggi Badan (cm)" class="input-field">
                <input id="ttv_bb" placeholder="Berat Badan (kg)" class="input-field">
                <input id="ttv_gds" placeholder="Keterangan GDS" class="input-field col-span-2">
                <button onclick="app.saveTTV('${pid}')" class="col-span-2 bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN DATA TTV</button>
            </div>`;
        this.openModal();
    },

    saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.ttv.unshift({
            time: new Date().toLocaleString('id-ID'),
            td: document.getElementById('ttv_td').value,
            sat: document.getElementById('ttv_sat').value,
            rr: document.getElementById('ttv_rr').value,
            tb: document.getElementById('ttv_tb').value,
            bb: document.getElementById('ttv_bb').value,
            gds: document.getElementById('ttv_gds').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 4. VISIT DOKTER (DENGAN TTD & FOTO) ---
    viewVisit(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - VISIT DOKTER</h3>
                    <button onclick="app.modalAddVisit('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT VISIT</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${p.visits.map((v, i) => `
                        <div class="border rounded-2xl p-4 bg-slate-50 relative">
                            <button onclick="app.delSubItem('${p.id}', 'visits', ${i})" class="absolute top-2 right-2 text-red-400"><i class="fas fa-trash"></i></button>
                            <img src="${v.photo}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm bg-white">
                            <p class="text-[10px] text-teal-600 font-bold">${v.time}</p>
                            <div class="bg-white p-3 rounded-xl border text-xs my-2 italic">"${v.note}"</div>
                            <div class="flex justify-end mt-4">
                                <div class="text-center">
                                    <img src="${v.sign}" class="h-12 border-b">
                                    <p class="text-[8px] uppercase mt-1">Tanda Tangan Dokter</p>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    },

    modalAddVisit(pid) {
        document.getElementById('modal-title').innerText = "INPUT VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="v_photo" class="input-field" accept="image/*">
                <textarea id="v_note" placeholder="Hasil Wawancara Dokter & Keterangan" class="input-field h-32"></textarea>
                <div class="border rounded-2xl p-2 bg-white">
                    <p class="text-[10px] text-center font-bold text-slate-400 uppercase mb-1">Tanda Tangan Digital Dokter</p>
                    <canvas id="sig-pad" class="w-full h-40 bg-slate-50 border-2 border-dashed rounded-xl"></canvas>
                    <button onclick="app.signaturePad.clear()" class="w-full text-[10px] text-red-500 mt-1">Hapus Tanda Tangan</button>
                </div>
                <button onclick="app.saveVisit('${pid}')" class="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-lg">SIMPAN DATA VISIT</button>
            </div>`;
        this.openModal();
        const canvas = document.getElementById('sig-pad');
        this.signaturePad = new SignaturePad(canvas);
    },

    async saveVisit(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const file = document.getElementById('v_photo').files[0];
        const note = document.getElementById('v_note').value;
        const sign = this.signaturePad.toDataURL();
        
        let photo = "https://via.placeholder.com/400x300?text=No+Photo";
        if(file) photo = await this.toBase64(file);

        p.visits.unshift({
            time: new Date().toLocaleString('id-ID'),
            note: note,
            photo: photo,
            sign: sign
        });

        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 5. PASIEN CRISIS (BPSS & CHART) ---
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - PASIEN CRISIS (BPSS)</h3>
                    <button onclick="app.modalAddBPSS('${p.id}')" class="bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT SCORE BPSS</button>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="w-full text-[10px] text-left border">
                            <tr class="bg-slate-100">
                                <th class="p-2">Day</th><th class="p-2">Bio</th><th class="p-2">Psy</th><th class="p-2">Soc</th><th class="p-2">Spi</th><th class="p-2">Eval</th><th class="p-2">Hapus</th>
                            </tr>
                            ${p.crisis.bpss.map((b, i) => `
                                <tr class="border-b">
                                    <td class="p-2 font-bold">D-${i+1}</td>
                                    <td class="p-2">${b.bio}</td><td class="p-2">${b.psy}</td><td class="p-2">${b.soc}</td><td class="p-2">${b.spi}</td>
                                    <td class="p-2 font-bold text-teal-600">${b.eval}</td>
                                    <td class="p-2"><button onclick="app.delSubItem('${p.id}', 'crisis.bpss', ${i})" class="text-red-400">×</button></td>
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    <div class="h-64 bg-slate-50 rounded-2xl p-4 border relative">
                        <canvas id="chart-${p.id}"></canvas>
                    </div>
                </div>
            </div>
        `).join('');
        // Render Charts after HTML is in DOM
        this.data.patients.forEach(p => this.renderBpssChart(p));
    },

    renderBpssChart(p) {
        const canvas = document.getElementById(`chart-${p.id}`);
        if(!canvas || p.crisis.bpss.length === 0) return;
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: p.crisis.bpss.map((_, i) => `Day ${i+1}`),
                datasets: [{
                    label: 'BPSS TOTAL SCORE',
                    data: p.crisis.bpss.map(b => b.eval),
                    borderColor: '#0d9488',
                    backgroundColor: 'rgba(13, 148, 136, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    },

    modalAddBPSS(pid) {
        document.getElementById('modal-title').innerText = "INPUT BPSS SCORE (MAX 25/SEKTOR)";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="b_bio" type="number" placeholder="Biological (0-25)" class="input-field">
                <input id="b_psy" type="number" placeholder="Psychological (0-25)" class="input-field">
                <input id="b_soc" type="number" placeholder="Social (0-25)" class="input-field">
                <input id="b_spi" type="number" placeholder="Spiritual (0-25)" class="input-field">
                <textarea id="b_note" placeholder="Keterangan Evaluasi/Perubahan" class="input-field col-span-2"></textarea>
                <button onclick="app.saveBPSS('${pid}')" class="col-span-2 bg-red-600 text-white py-3 rounded-2xl font-bold shadow-lg">SIMPAN SCORE</button>
            </div>`;
        this.openModal();
    },

    saveBPSS(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        const bio = parseInt(document.getElementById('b_bio').value) || 0;
        const psy = parseInt(document.getElementById('b_psy').value) || 0;
        const soc = parseInt(document.getElementById('b_soc').value) || 0;
        const spi = parseInt(document.getElementById('b_spi').value) || 0;
        
        p.crisis.bpss.push({
            time: new Date().toLocaleString('id-ID'),
            bio, psy, soc, spi,
            eval: bio + psy + soc + spi,
            note: document.getElementById('b_note').value
        });
        
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 6. RENCANA PROGRAM ---
    viewProgram(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - RENCANA PROGRAM</h3>
                    <button onclick="app.modalAddProgram('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">SET PROGRAM</button>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-6 bg-slate-50 rounded-2xl border text-center">
                        <p class="text-[10px] uppercase text-slate-400">Paket Terpilih</p>
                        <p class="text-xl font-bold text-teal-700">${p.program.type || 'BELUM DISET'}</p>
                    </div>
                    <div class="p-6 bg-slate-50 rounded-2xl border text-center">
                        <p class="text-[10px] uppercase text-slate-400">Durasi Rencana</p>
                        <p class="text-xl font-bold text-teal-700">${p.program.duration || 'BELUM DISET'}</p>
                    </div>
                </div>
            </div>
        `).join('');
    },

    modalAddProgram(pid) {
        document.getElementById('modal-title').innerText = "ATUR RENCANA PROGRAM";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <select id="pr_type" class="input-field">
                    <option value="Reguler">Paket Reguler</option>
                    <option value="Eksklusif">Paket Eksklusif</option>
                </select>
                <select id="pr_duration" class="input-field">
                    <option value="7 Hari (Detox)">7 Hari (Hanya Detox/Stabilisasi)</option>
                    <option value="14 Hari">14 Hari</option>
                    <option value="30 Hari">30 Hari</option>
                    <option value="60 Hari">60 Hari</option>
                </select>
                <button onclick="app.saveProgram('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN PROGRAM</button>
            </div>`;
        this.openModal();
    },

    saveProgram(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.program = {
            type: document.getElementById('pr_type').value,
            duration: document.getElementById('pr_duration').value
        };
        this.saveDB(); this.closeModal(); this.render();
    },

    // --- 7. RENCANA TERAPI ---
    viewTherapy(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-3xl border shadow-sm mb-8 search-item">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-bold text-teal-800">${p.reg.name} - RENCANA TERAPI</h3>
                </div>
                <textarea id="ther_${p.id}" class="input-field h-32 mb-4" placeholder="Tuliskan keterangan rencana terapi disini...">${p.therapy || ''}</textarea>
                <div class="flex gap-2">
                    <button onclick="app.saveTherapy('${p.id}')" class="bg-teal-600 text-white px-6 py-2 rounded-xl text-xs font-bold">SIMPAN</button>
                    <button onclick="app.delTherapy('${p.id}')" class="bg-red-50 text-red-600 px-6 py-2 rounded-xl text-xs font-bold">HAPUS</button>
                </div>
            </div>
        `).join('');
    },

    saveTherapy(pid) {
        const text = document.getElementById(`ther_${pid}`).value;
        this.data.patients.find(x => x.id === pid).therapy = text;
        this.saveDB(); Swal.fire('Tersimpan', 'Rencana terapi berhasil diperbarui', 'success');
    },

    delTherapy(pid) {
        this.data.patients.find(x => x.id === pid).therapy = '';
        this.saveDB(); this.render();
    },

    // --- SHARED UTILS ---
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); }),
    delSubItem(pid, path, idx) {
        if(!confirm('Hapus item ini?')) return;
        const p = this.data.patients.find(x => x.id === pid);
        const parts = path.split('.');
        let target = p;
        for(let i=0; i<parts.length; i++) target = target[parts[i]];
        target.splice(idx, 1);
        this.saveDB(); this.render();
    },
    delPatient(pid) {
        if(!confirm('PERINGATAN! Seluruh data pasien akan dihapus permanen. Lanjutkan?')) return;
        this.data.patients = this.data.patients.filter(x => x.id !== pid);
        this.saveDB(); this.render();
    },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    }
};

// Mulai aplikasi
app.render();
