const app = {
    data: JSON.parse(localStorage.getItem('MMRC_FULL_DB')) || { patients: [] },
    currentPage: 'dashboard',
    signaturePad: null,

    save() { localStorage.setItem('MMRC_FULL_DB', JSON.stringify(this.data)); },

    login() {
        if(document.getElementById('username').value === 'OPERASIONAL.MMRC' && 
           document.getElementById('password').value === 'MADANI1999') {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            this.nav('dashboard');
        } else { Swal.fire('Error', 'Login Gagal', 'error'); }
    },

    nav(page) {
        this.currentPage = page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`nav-${page}`).classList.add('active');
        document.getElementById('page-title').innerText = page.toUpperCase().replace('_', ' ');
        
        const content = document.getElementById('main-content');
        content.innerHTML = ''; // Clear

        if(page === 'dashboard') this.renderDashboard(content);
        else if(page === 'medicine') this.renderMedicine(content);
        else if(page === 'ttv') this.renderTTV(content);
        else if(page === 'visit') this.renderVisit(content);
        else if(page === 'crisis') this.renderCrisis(content);
        else if(page === 'program') this.renderProgram(content);
        else if(page === 'terapi') this.renderTerapi(content);
    },

    // ============================================================
    // 1. DASHBOARD: [Registrasi] -> [Riwayat] -> [Diagnosa]
    // ============================================================
    renderDashboard(container) {
        // Tombol Tambah Pasien
        container.innerHTML = `<div class="mb-6"><button onclick="app.modalRegistrasi()" class="bg-teal-600 text-white px-6 py-2 rounded-lg font-bold shadow">+ INPUT PASIEN BARU</button></div>`;
        
        if(this.data.patients.length === 0) {
            container.innerHTML += `<div class="text-center text-gray-400 mt-10">Belum ada data pasien.</div>`;
            return;
        }

        // Render Setiap Pasien dalam Panel yang memuat 3 Kolom
        this.data.patients.forEach(p => {
            const r = p.reg || {};
            const h = p.history || {};
            const d = p.diagnosis || {};

            const html = `
            <div class="dashboard-card searchable-item">
                <div class="bg-teal-700 text-white p-4 flex justify-between items-center">
                    <h3 class="font-bold text-lg">${r.name} (${r.age} Th)</h3>
                    <div>
                        <button onclick="app.modalRegistrasi('${p.id}')" class="bg-teal-800 hover:bg-teal-900 px-3 py-1 rounded text-xs">Edit Bio</button>
                        <button onclick="app.deletePatient('${p.id}')" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-xs ml-2">Hapus</button>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    
                    <div class="column-body">
                        <div class="font-bold text-teal-700 border-b pb-2 mb-4">I. REGISTRASI MASUK</div>
                        <div class="flex gap-4 mb-4">
                            <img src="${r.photo || 'https://via.placeholder.com/80'}" class="w-20 h-20 object-cover rounded shadow">
                            <div>
                                <span class="info-label">Waktu Masuk</span>
                                <div class="info-value">${r.timestamp}</div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-2">
                            <div><span class="info-label">TTL</span><div class="info-value">${r.birth || '-'}</div></div>
                            <div><span class="info-label">Status</span><div class="info-value">${r.status || '-'}</div></div>
                            <div><span class="info-label">Pendidikan</span><div class="info-value">${r.edu || '-'}</div></div>
                            <div><span class="info-label">Pekerjaan</span><div class="info-value">${r.job || '-'}</div></div>
                            <div class="col-span-2"><span class="info-label">Alamat</span><div class="info-value">${r.address || '-'}</div></div>
                            <div class="col-span-2"><span class="info-label">Wali</span><div class="info-value">${r.guardian || '-'}</div></div>
                            <div class="col-span-2 bg-yellow-50 p-2 rounded"><span class="info-label">Spotcheck Barang</span><div class="info-value text-xs">${r.spotcheck || '-'}</div></div>
                        </div>
                    </div>

                    <div class="column-body bg-slate-50">
                        <div class="flex justify-between border-b pb-2 mb-4">
                            <div class="font-bold text-teal-700">II. RIWAYAT PENYAKIT</div>
                            <button onclick="app.modalRiwayat('${p.id}')" class="text-xs text-blue-600 underline">Edit Riwayat</button>
                        </div>
                        <div class="space-y-4">
                            <div><span class="info-label">Riwayat Fisik & Psikis</span><div class="info-value bg-white p-2 rounded border">${h.phys_psych || '-'}</div></div>
                            <div><span class="info-label">Diagnosa Sebelumnya</span><div class="info-value bg-white p-2 rounded border">${h.prev_diag || '-'}</div></div>
                            <div><span class="info-label">Riwayat Dosis Obat</span><div class="info-value bg-white p-2 rounded border">${h.dose_hist || '-'}</div></div>
                            <div><span class="info-label">Kondisi Terkini</span><div class="info-value bg-white p-2 rounded border">${h.condition || '-'}</div></div>
                        </div>
                    </div>

                    <div class="column-body">
                        <div class="flex justify-between border-b pb-2 mb-4">
                            <div class="font-bold text-teal-700">III. DIAGNOSA DOKTER</div>
                            <button onclick="app.modalDiagnosa('${p.id}')" class="text-xs text-blue-600 underline">Edit Diagnosa</button>
                        </div>
                        <div class="mb-3"><span class="info-label">Dokter PJ</span><div class="info-value">${d.doctor || '-'}</div></div>
                        <div class="mb-3"><span class="info-label">Diagnosa Masuk</span><div class="info-value font-bold">${d.entry_diag || '-'}</div></div>
                        <div class="mb-3"><span class="info-label">Planning</span><div class="info-value italic text-sm">${d.planning || '-'}</div></div>
                        
                        <div class="mb-4">
                            <span class="info-label mb-2">Tindakan Intervensi</span>
                            <div class="flex flex-wrap gap-2">
                                <span class="check-display ${d.inj ? 'check-yes' : 'check-no'}">Injeksi</span>
                                <span class="check-display ${d.urine ? 'check-yes' : 'check-no'}">Urine Test</span>
                                <span class="check-display ${d.fix ? 'check-yes' : 'check-no'}">Fiksasi</span>
                            </div>
                            ${d.urine ? `<div class="mt-1 text-xs text-blue-600">Ket: ${d.urine_note}</div>` : ''}
                        </div>

                        <div class="bg-teal-50 p-3 rounded border border-teal-100">
                            <span class="info-label text-teal-800">Resep Obat & Jumlah</span>
                            <div class="info-value whitespace-pre-line">${d.rx || '-'}</div>
                        </div>
                    </div>
                </div>
            </div>`;
            container.innerHTML += html;
        });
    },

    // --- MODAL REGISTRASI ---
    modalRegistrasi(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id).reg : {};
        document.getElementById('modal-title').innerText = "Form Registrasi Pasien";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveRegistrasi(event, '${id}')" class="grid grid-cols-2 gap-4">
                <div class="col-span-2"><label class="info-label">Waktu Masuk</label><input type="datetime-local" name="timestamp" class="input-field" required></div>
                <div class="col-span-2"><label class="info-label">Foto</label><input type="file" id="photo-input" class="input-field"></div>
                <div class="col-span-2"><label class="info-label">Nama Lengkap</label><input type="text" name="name" value="${p.name||''}" class="input-field" required></div>
                <div><label class="info-label">TTL</label><input type="text" name="birth" value="${p.birth||''}" class="input-field"></div>
                <div><label class="info-label">Usia</label><input type="number" name="age" value="${p.age||''}" class="input-field"></div>
                <div><label class="info-label">Status</label><input type="text" name="status" value="${p.status||''}" class="input-field"></div>
                <div><label class="info-label">Pendidikan</label><input type="text" name="edu" value="${p.edu||''}" class="input-field"></div>
                <div><label class="info-label">Pekerjaan</label><input type="text" name="job" value="${p.job||''}" class="input-field"></div>
                <div><label class="info-label">Wali</label><input type="text" name="guardian" value="${p.guardian||''}" class="input-field"></div>
                <div class="col-span-2"><label class="info-label">Alamat</label><textarea name="address" class="input-field">${p.address||''}</textarea></div>
                <div class="col-span-2"><label class="info-label">Spotcheck</label><textarea name="spotcheck" class="input-field">${p.spotcheck||''}</textarea></div>
                <button class="col-span-2 bg-teal-600 text-white py-2 rounded font-bold mt-4">SIMPAN</button>
            </form>
        `;
        app.openModal();
    },
    async saveRegistrasi(e, id) {
        e.preventDefault();
        const f = e.target;
        let photo = id ? this.data.patients.find(x=>x.id===id).reg.photo : null;
        if(document.getElementById('photo-input').files[0]) {
            photo = await app.toBase64(document.getElementById('photo-input').files[0]);
        }
        const regData = {
            timestamp: f.timestamp.value, photo, name: f.name.value, birth: f.birth.value,
            age: f.age.value, status: f.status.value, edu: f.edu.value, job: f.job.value,
            guardian: f.guardian.value, address: f.address.value, spotcheck: f.spotcheck.value
        };

        if(id) {
            const p = this.data.patients.find(x=>x.id===id);
            p.reg = regData;
        } else {
            this.data.patients.push({ 
                id: Date.now().toString(), reg: regData, history: {}, diagnosis: {}, 
                medicine: {stock:[], logs:[]}, ttv: [], visits: [], crisis: {scores:{}, chart:null}, program:{}, terapi:'' 
            });
        }
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    // --- MODAL RIWAYAT & DIAGNOSA ---
    modalRiwayat(id) {
        const h = this.data.patients.find(x => x.id === id).history || {};
        document.getElementById('modal-title').innerText = "Edit Riwayat";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveSubData(event, '${id}', 'history')" class="space-y-4">
                <div><label class="info-label">Riwayat Fisik & Psikis</label><textarea name="phys_psych" class="input-field h-20">${h.phys_psych||''}</textarea></div>
                <div><label class="info-label">Diagnosa Sebelumnya</label><input name="prev_diag" value="${h.prev_diag||''}" class="input-field"></div>
                <div><label class="info-label">Riwayat Dosis Obat</label><input name="dose_hist" value="${h.dose_hist||''}" class="input-field"></div>
                <div><label class="info-label">Kondisi Terkini</label><textarea name="condition" class="input-field h-20">${h.condition||''}</textarea></div>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN RIWAYAT</button>
            </form>`;
        this.openModal();
    },
    modalDiagnosa(id) {
        const d = this.data.patients.find(x => x.id === id).diagnosis || {};
        document.getElementById('modal-title').innerText = "Edit Diagnosa Dokter";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveDiagnosaData(event, '${id}')" class="space-y-4">
                <div><label class="info-label">Nama Dokter</label><input name="doctor" value="${d.doctor||''}" class="input-field"></div>
                <div><label class="info-label">Diagnosa Masuk</label><input name="entry_diag" value="${d.entry_diag||''}" class="input-field"></div>
                <div><label class="info-label">Planning Dokter</label><textarea name="planning" class="input-field">${d.planning||''}</textarea></div>
                <div class="border p-3 rounded bg-gray-50">
                    <label class="info-label mb-2">Tindakan Intervensi</label>
                    <div class="flex gap-4">
                        <label><input type="checkbox" name="inj" ${d.inj?'checked':''}> Injeksi</label>
                        <label><input type="checkbox" name="fix" ${d.fix?'checked':''}> Fiksasi</label>
                        <label><input type="checkbox" name="urine" ${d.urine?'checked':''}> Urine Test</label>
                    </div>
                    <input name="urine_note" placeholder="Ket. Urine..." value="${d.urine_note||''}" class="input-field mt-2">
                </div>
                <div><label class="info-label">Resep Obat</label><textarea name="rx" class="input-field h-20">${d.rx||''}</textarea></div>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN DIAGNOSA</button>
            </form>`;
        this.openModal();
    },
    saveSubData(e, id, key) {
        e.preventDefault();
        const p = this.data.patients.find(x=>x.id===id);
        const fd = new FormData(e.target);
        fd.forEach((val, k) => p[key][k] = val);
        this.save(); this.closeModal(); this.nav('dashboard');
    },
    saveDiagnosaData(e, id) {
        e.preventDefault();
        const p = this.data.patients.find(x=>x.id===id);
        const f = e.target;
        p.diagnosis = {
            doctor: f.doctor.value, entry_diag: f.entry_diag.value, planning: f.planning.value,
            inj: f.inj.checked, fix: f.fix.checked, urine: f.urine.checked, urine_note: f.urine_note.value, rx: f.rx.value
        };
        this.save(); this.closeModal(); this.nav('dashboard');
    },

    // ============================================================
    // 2. MEDICINE: Stok (Otomatis) & Log
    // ============================================================
    renderMedicine(container) {
        if(this.data.patients.length === 0) return container.innerHTML = "Belum ada pasien.";
        this.data.patients.forEach(p => {
            const med = p.medicine || {stock:[], logs:[]};
            container.innerHTML += `
            <div class="dashboard-card searchable-item">
                <div class="p-4 bg-teal-50 border-b flex justify-between items-center">
                    <h3 class="font-bold text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.modalAddMed('${p.id}')" class="bg-teal-600 text-white px-3 py-1 rounded text-xs">+ Obat</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-4">
                    <div>
                        <h4 class="font-bold text-sm mb-2 border-l-4 border-blue-500 pl-2">KOLOM STOK OBAT</h4>
                        <table class="table-custom">
                            <tr><th>Nama Obat</th><th>Awal</th><th>Pakai</th><th>Sisa</th><th>Est. Habis</th><th>Aksi</th></tr>
                            ${med.stock.map((m, i) => {
                                const sisa = m.init - m.used;
                                const alert = sisa <= 7 ? 'bg-red-100 animate-pulse text-red-700' : '';
                                return `<tr class="${alert}">
                                    <td>${m.name}</td><td>${m.init}</td><td>${m.used}</td><td class="font-bold">${sisa}</td><td>${m.est}</td>
                                    <td><button onclick="app.useMed('${p.id}', ${i})" class="bg-blue-600 text-white px-2 py-1 rounded text-xs">Minum</button></td>
                                </tr>`;
                            }).join('')}
                        </table>
                    </div>
                    <div>
                        <h4 class="font-bold text-sm mb-2 border-l-4 border-green-500 pl-2">KOLOM CATATAN PENGGUNAAN</h4>
                        <div class="h-40 overflow-y-auto border rounded bg-gray-50 p-2 space-y-2">
                            ${med.logs.slice().reverse().map(l => `
                                <div class="bg-white p-2 border rounded text-xs">
                                    <div class="font-bold text-teal-700">${l.name} <span class="text-gray-400 float-right">${l.time}</span></div>
                                    <div>Ket: ${l.note} | PJ: ${l.pj}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>`;
        });
    },
    modalAddMed(id) {
        document.getElementById('modal-title').innerText = "Tambah Stok Obat";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveMed(event, '${id}')" class="space-y-4">
                <input name="name" placeholder="Nama Obat" class="input-field" required>
                <div class="grid grid-cols-2 gap-4">
                    <input type="number" name="init" placeholder="Jumlah Awal" class="input-field" required>
                    <input type="date" name="est" class="input-field">
                </div>
                <button class="w-full bg-teal-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveMed(e, id) {
        e.preventDefault();
        const p = this.data.patients.find(x=>x.id===id);
        const f = e.target;
        if(!p.medicine) p.medicine = {stock:[], logs:[]};
        p.medicine.stock.push({name: f.name.value, init: parseInt(f.init.value), used: 0, est: f.est.value});
        this.save(); this.closeModal(); this.nav('medicine');
    },
    useMed(id, idx) {
        Swal.fire({
            title: 'Minum Obat',
            html: '<input id="swal-pj" placeholder="Nama PJ" class="swal2-input"><input id="swal-note" placeholder="Keterangan" class="swal2-input">',
            preConfirm: () => [document.getElementById('swal-pj').value, document.getElementById('swal-note').value]
        }).then(res => {
            if(res.isConfirmed) {
                const p = this.data.patients.find(x=>x.id===id);
                const s = p.medicine.stock[idx];
                s.used++;
                p.medicine.logs.push({name: s.name, time: new Date().toLocaleString(), pj: res.value[0], note: res.value[1]});
                if((s.init - s.used) <= 7) Swal.fire('REMINDER', `Stok ${s.name} sisa ${s.init - s.used}!`, 'warning');
                this.save(); this.nav('medicine');
            }
        });
    },

    // ============================================================
    // 3. TTV & GDS
    // ============================================================
    renderTTV(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="dashboard-card searchable-item">
                <div class="p-4 border-b flex justify-between">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-blue-600 text-white px-3 py-1 rounded text-xs">+ TTV/GDS</button>
                </div>
                <div class="p-4">
                    <table class="table-custom">
                        <tr><th>Waktu</th><th>Tensi</th><th>Saturasi</th><th>RR</th><th>TB/BB</th><th>Ket. GDS</th></tr>
                        ${(p.ttv || []).map(t => `
                            <tr><td>${t.time}</td><td>${t.td}</td><td>${t.sat}</td><td>${t.rr}</td><td>${t.tb}/${t.bb}</td><td>${t.gds}</td></tr>
                        `).join('')}
                    </table>
                </div>
            </div>`;
        });
    },
    modalTTV(id) {
        document.getElementById('modal-title').innerText = "Input TTV & GDS";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveTTV(event, '${id}')" class="grid grid-cols-2 gap-4">
                <input type="datetime-local" name="time" class="input-field" required>
                <input name="td" placeholder="Tensi (mmHg)" class="input-field">
                <input name="sat" placeholder="Saturasi (%)" class="input-field">
                <input name="rr" placeholder="RR" class="input-field">
                <input name="tb" placeholder="TB (cm)" class="input-field">
                <input name="bb" placeholder="BB (kg)" class="input-field">
                <input name="gds" placeholder="Keterangan GDS" class="input-field col-span-2">
                <button class="col-span-2 bg-blue-600 text-white py-2 rounded font-bold">SIMPAN</button>
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

    // ============================================================
    // 4. VISIT DOKTER
    // ============================================================
    renderVisit(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="dashboard-card searchable-item">
                <div class="p-4 border-b flex justify-between">
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <button onclick="app.modalVisit('${p.id}')" class="bg-purple-600 text-white px-3 py-1 rounded text-xs">+ Visit</button>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${(p.visits || []).map(v => `
                        <div class="border rounded p-3 bg-gray-50">
                            <img src="${v.photo}" class="w-full h-32 object-cover rounded mb-2">
                            <div class="font-bold text-xs mb-1">${v.time}</div>
                            <div class="text-sm italic mb-2">"${v.note}"</div>
                            <div class="text-right"><img src="${v.sign}" class="h-8 inline"></div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
        });
    },
    modalVisit(id) {
        document.getElementById('modal-title').innerText = "Input Visit Dokter";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input type="file" id="visit-photo" class="input-field">
                <textarea id="visit-note" class="input-field h-24" placeholder="Keterangan Dokter..."></textarea>
                <div class="border p-2"><canvas id="sig-pad" class="w-full h-32 bg-gray-100"></canvas></div>
                <button onclick="app.saveVisit('${id}')" class="w-full bg-purple-600 text-white py-2 rounded font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
        setTimeout(() => {
            const canvas = document.getElementById('sig-pad');
            canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight;
            app.signaturePad = new SignaturePad(canvas);
        }, 100);
    },
    async saveVisit(id) {
        const photo = await app.toBase64(document.getElementById('visit-photo').files[0]);
        const note = document.getElementById('visit-note').value;
        const sign = app.signaturePad.toDataURL();
        this.data.patients.find(x=>x.id===id).visits.push({time: new Date().toLocaleString(), photo, note, sign});
        this.save(); this.closeModal(); this.nav('visit');
    },

    // ============================================================
    // 5. PASIEN CRISIS (BPSS 7 HARI & POLYGON)
    // ============================================================
    renderCrisis(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="dashboard-card searchable-item">
                <div class="p-4 border-b"><h3 class="font-bold">${p.reg.name} - BPSS SCORE (7 Hari)</h3></div>
                <div class="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div class="overflow-x-auto">
                        <table class="table-custom text-center text-xs">
                            <tr><th>ASPEK</th>${[1,2,3,4,5,6,7].map(d=>`<th>D${d}</th>`).join('')}</tr>
                            ${['Bio','Psy','Soc','Spi'].map(c => `
                                <tr><td class="font-bold text-left">${c}</td>
                                ${[1,2,3,4,5,6,7].map(d => `<td><input type="number" class="w-8 border text-center" value="${(p.crisis.scores[d]||{})[c]||0}" onchange="app.saveBPSS('${p.id}', ${d}, '${c}', this.value)"></td>`).join('')}
                                </tr>
                            `).join('')}
                        </table>
                    </div>
                    <div><canvas id="chart-${p.id}"></canvas></div>
                </div>
            </div>`;
            setTimeout(() => app.renderChart(p), 100);
        });
    },
    saveBPSS(id, day, cat, val) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.crisis.scores[day]) p.crisis.scores[day] = {};
        p.crisis.scores[day][cat] = parseInt(val);
        this.save(); app.renderChart(p);
    },
    renderChart(p) {
        const ctx = document.getElementById(`chart-${p.id}`);
        if(!ctx) return;
        const data = ['Bio','Psy','Soc','Spi'].map(c => ({
            label: c, data: [1,2,3,4,5,6,7].map(d => (p.crisis.scores[d]||{})[c]||0),
            borderColor: c==='Bio'?'#ef4444':c==='Psy'?'#f59e0b':c==='Soc'?'#3b82f6':'#10b981', fill:false
        }));
        if(p.chartInstance) p.chartInstance.destroy();
        p.chartInstance = new Chart(ctx, {type:'line', data:{labels:['D1','D2','D3','D4','D5','D6','D7'], datasets:data}});
    },

    // ============================================================
    // 6 & 7. PROGRAM & TERAPI
    // ============================================================
    renderProgram(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="dashboard-card searchable-item p-4 flex justify-between items-center">
                <div>
                    <h3 class="font-bold">${p.reg.name}</h3>
                    <div class="mt-2">Paket: <b>${p.program.paket||'-'}</b> | Durasi: <b>${p.program.durasi||'-'} Hari</b></div>
                </div>
                <button onclick="app.modalProgram('${p.id}')" class="bg-indigo-600 text-white px-3 py-1 rounded">Edit</button>
            </div>`;
        });
    },
    modalProgram(id) {
        const pr = this.data.patients.find(x=>x.id===id).program;
        document.getElementById('modal-title').innerText = "Rencana Program";
        document.getElementById('modal-body').innerHTML = `
            <form onsubmit="app.saveProgram(event, '${id}')" class="space-y-4">
                <select name="paket" class="input-field"><option>Reguler</option><option>Eksklusif</option></select>
                <select name="durasi" class="input-field"><option value="7">7 Hari (Detox)</option><option value="14">14 Hari</option><option value="30">30 Hari</option><option value="60">60 Hari</option></select>
                <button class="w-full bg-indigo-600 text-white py-2 rounded">SIMPAN</button>
            </form>`;
        this.openModal();
    },
    saveProgram(e, id) {
        e.preventDefault();
        this.data.patients.find(x=>x.id===id).program = {paket: e.target.paket.value, durasi: e.target.durasi.value};
        this.save(); this.closeModal(); this.nav('program');
    },

    renderTerapi(container) {
        this.data.patients.forEach(p => {
            container.innerHTML += `
            <div class="dashboard-card searchable-item p-4">
                <h3 class="font-bold mb-2">${p.reg.name}</h3>
                <textarea class="input-field h-24" onchange="app.saveTerapi('${p.id}', this.value)">${p.terapi||''}</textarea>
            </div>`;
        });
    },
    saveTerapi(id, val) {
        this.data.patients.find(x=>x.id===id).terapi = val;
        this.save();
    },

    // UTILS
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').classList.add('flex'); },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },
    toBase64: file => new Promise(r => { const reader = new FileReader(); reader.readAsDataURL(file); reader.onload = () => r(reader.result); }),
    deletePatient(id) {
        if(confirm('Hapus Data Pasien?')) {
            this.data.patients = this.data.patients.filter(x => x.id !== id);
            this.save(); this.nav(this.currentPage);
        }
    },
    search() {
        const q = document.getElementById('search-input').value.toLowerCase();
        document.querySelectorAll('.searchable-item').forEach(el => el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none');
    },
    exportExcel() {
        const wb = XLSX.utils.book_new();
        const data = this.data.patients.map(p => ({
            Nama: p.reg.name, Usia: p.reg.age, Masuk: p.reg.timestamp, Diagnosa: p.diagnosis.entry_diag, Program: p.program.paket
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Pasien");
        XLSX.writeFile(wb, "MMRC_DATA.xlsx");
    }
};

// Init
window.onload = () => {};
