// ============================================================
// 1. DATA & CONFIG (LOCALSTORAGE)
// ============================================================
const DB_KEY = 'MMRC_DATA_STORE';
const app = {
    data: { patients: [] },
    currentUser: null,
    signaturePad: null,
    chartInstance: null,

    // --- INIT ---
    init() {
        // Load Data Local
        const local = localStorage.getItem(DB_KEY);
        if (local) {
            try { this.data = JSON.parse(local); if(!this.data.patients) this.data.patients=[]; } catch(e){}
        }
        
        // Cek Sesi Login
        if(sessionStorage.getItem('MMRC_SESSION')) {
            this.showApp();
        }
    },

    // --- AUTH ---
    login(e) {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('MMRC_SESSION', 'true');
            this.showApp();
            Swal.fire({icon:'success', title:'Login Berhasil', timer:1000, showConfirmButton:false});
        } else {
            Swal.fire('Gagal', 'Username/Password Salah', 'error');
        }
    },

    logout() {
        sessionStorage.removeItem('MMRC_SESSION');
        location.reload();
    },

    showApp() {
        document.getElementById('auth-layer').classList.add('hidden');
        document.getElementById('app-layer').classList.remove('hidden');
        this.nav('dashboard');
    },

    // --- DATA MANAGEMENT ---
    saveDB() {
        localStorage.setItem(DB_KEY, JSON.stringify(this.data));
    },

    // --- NAVIGATION ---
    nav(page) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-${page}`).classList.add('active');
        document.getElementById('page-title').innerText = page.replace('_',' ').toUpperCase();
        
        const container = document.getElementById('content-area');
        container.innerHTML = '';

        // Router
        switch(page) {
            case 'dashboard': this.renderDashboard(container); break;
            case 'medicine': this.renderMedicine(container); break;
            case 'ttv': this.renderTTV(container); break;
            case 'visit': this.renderVisit(container); break;
            case 'crisis': this.renderCrisis(container); break;
            case 'program': this.renderProgram(container); break;
            case 'therapy': this.renderTherapy(container); break;
        }
    },

    // ============================================================
    // MENU 1: DASHBOARD (REGISTRASI & LIST)
    // ============================================================
    renderDashboard(c) {
        c.innerHTML = `
            <div class="flex justify-between mb-6">
                <div class="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div class="bg-red-100 p-3 rounded-full text-mmrc-maroon"><i class="fas fa-users text-xl"></i></div>
                    <div><p class="text-xs text-gray-500">Total Pasien</p><h3 class="text-xl font-black">${this.data.patients.length}</h3></div>
                </div>
                <button onclick="app.modalPatient()" class="bg-mmrc-maroon text-white px-6 py-2 rounded-xl font-bold shadow-lg hover:bg-red-900 transition flex items-center gap-2">
                    <i class="fas fa-plus"></i> PASIEN BARU
                </button>
            </div>
            
            <div class="grid gap-6">
                ${this.data.patients.map(p => `
                <div class="card-mmrc search-item group relative">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="w-full md:w-1/4 text-center border-r border-gray-100 pr-4">
                            <img src="${p.reg.photo || 'logo.png'}" class="w-24 h-24 mx-auto rounded-full object-cover border-4 border-red-50 shadow-md mb-2">
                            <h4 class="font-black text-lg text-mmrc-maroon">${p.reg.name}</h4>
                            <p class="text-xs font-bold text-gray-500">${p.reg.age} Thn | ${p.reg.status}</p>
                            
                            <div class="mt-4 flex flex-col gap-2">
                                <button onclick="app.exportWord('${p.id}')" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-[10px] font-bold"><i class="fas fa-file-word"></i> WORD LENGKAP</button>
                                <button onclick="app.exportExcel('${p.id}')" class="w-full bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-[10px] font-bold"><i class="fas fa-file-excel"></i> EXCEL DATA</button>
                            </div>
                        </div>
                        <div class="w-full md:w-3/4 flex flex-col justify-between">
                            <div class="grid grid-cols-2 gap-4 text-sm">
                                <div><p class="text-[10px] text-gray-400 font-bold uppercase">Diagnosa Masuk</p><p class="font-bold">${p.diag.entry || '-'}</p></div>
                                <div><p class="text-[10px] text-gray-400 font-bold uppercase">Dokter PJ</p><p class="font-bold">${p.diag.doc || '-'}</p></div>
                                <div class="col-span-2 bg-yellow-50 p-2 rounded border border-yellow-100"><p class="text-[10px] text-yellow-700 font-bold uppercase">Kondisi Terkini</p><p class="italic text-yellow-900">"${p.hist.current || '-'}"</p></div>
                            </div>
                            <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                                <button onclick="app.modalPatient('${p.id}')" class="text-gray-500 hover:text-mmrc-maroon text-xs font-bold px-3 border rounded">EDIT BIODATA</button>
                                <button onclick="app.delPatient('${p.id}')" class="text-red-500 hover:bg-red-50 text-xs font-bold px-3 border border-red-200 rounded">HAPUS</button>
                            </div>
                        </div>
                    </div>
                </div>`).join('')}
                ${this.data.patients.length === 0 ? '<p class="text-center text-gray-400 py-10">Belum ada data pasien.</p>' : ''}
            </div>
        `;
    },

    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        const v = (val) => val || '';
        const c = (val) => val ? 'checked' : '';

        app.openModal(id ? 'EDIT DATA PASIEN' : 'REGISTRASI PASIEN BARU', `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div class="col-span-2 font-bold text-mmrc-maroon border-b pb-1">A. IDENTITAS</div>
                <input id="in_name" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" class="input-field">
                <input id="in_ttl" value="${v(p?.reg.ttl)}" placeholder="Tempat, Tgl Lahir" class="input-field">
                <input id="in_age" value="${v(p?.reg.age)}" type="number" placeholder="Usia" class="input-field">
                <input id="in_job" value="${v(p?.reg.job)}" placeholder="Pekerjaan" class="input-field">
                <select id="in_stat" class="input-field">
                    <option value="Lajang">Lajang</option><option value="Menikah">Menikah</option>
                </select>
                <input id="in_wali" value="${v(p?.reg.wali)}" placeholder="Nama Wali" class="input-field">
                <input id="in_addr" value="${v(p?.reg.addr)}" placeholder="Alamat Lengkap" class="input-field col-span-2">
                <input id="in_spot" value="${v(p?.reg.spot)}" placeholder="Spotcheck Barang (Merah jika bahaya)" class="input-field col-span-2 border-red-300 bg-red-50">
                <div class="col-span-2"><label class="text-xs">Foto Pasien:</label><input type="file" id="in_photo" class="block w-full text-xs mt-1"></div>

                <div class="col-span-2 font-bold text-mmrc-maroon border-b pb-1 mt-4">B. RIWAYAT & DIAGNOSA</div>
                <textarea id="in_hist_fisik" placeholder="Riwayat Penyakit Fisik" class="input-field h-20">${v(p?.hist.fisik)}</textarea>
                <textarea id="in_hist_psy" placeholder="Riwayat Penyakit Psikis" class="input-field h-20">${v(p?.hist.psy)}</textarea>
                <input id="in_doc" value="${v(p?.diag.doc)}" placeholder="Dokter Penanggung Jawab" class="input-field">
                <textarea id="in_diag_entry" placeholder="Diagnosa Masuk" class="input-field h-16">${v(p?.diag.entry)}</textarea>
                <textarea id="in_plan" placeholder="Planning Dokter" class="input-field h-16">${v(p?.diag.plan)}</textarea>
                <textarea id="in_curr" placeholder="Kondisi Terkini Pasien" class="input-field h-16 bg-yellow-50">${v(p?.hist.current)}</textarea>
                
                <div class="col-span-2 flex gap-4 bg-gray-50 p-2 rounded">
                    <label><input type="checkbox" id="chk_inj" ${c(p?.diag.act?.inj)}> Injeksi</label>
                    <label><input type="checkbox" id="chk_urine" ${c(p?.diag.act?.urine)}> Urine Test</label>
                    <label><input type="checkbox" id="chk_fix" ${c(p?.diag.act?.fix)}> Fiksasi</label>
                </div>
            </div>
            <button onclick="app.savePatient('${id||''}')" class="w-full bg-mmrc-maroon text-white py-3 rounded-xl font-bold mt-6">SIMPAN DATA</button>
        `);
    },

    async savePatient(id) {
        const name = document.getElementById('in_name').value;
        if(!name) return Swal.fire('Error', 'Nama Wajib Diisi', 'warning');

        // Photo Handler
        let photo = id ? this.data.patients.find(x=>x.id===id).reg.photo : '';
        const f = document.getElementById('in_photo').files[0];
        if(f) photo = await app.toBase64(f);

        const newP = {
            id: id || 'P-'+Date.now(),
            reg: {
                name, ttl: document.getElementById('in_ttl').value,
                age: document.getElementById('in_age').value,
                job: document.getElementById('in_job').value,
                status: document.getElementById('in_stat').value,
                wali: document.getElementById('in_wali').value,
                addr: document.getElementById('in_addr').value,
                spot: document.getElementById('in_spot').value,
                photo
            },
            hist: {
                fisik: document.getElementById('in_hist_fisik').value,
                psy: document.getElementById('in_hist_psy').value,
                current: document.getElementById('in_curr').value
            },
            diag: {
                doc: document.getElementById('in_doc').value,
                entry: document.getElementById('in_diag_entry').value,
                plan: document.getElementById('in_plan').value,
                act: {
                    inj: document.getElementById('chk_inj').checked,
                    urine: document.getElementById('chk_urine').checked,
                    fix: document.getElementById('chk_fix').checked
                }
            },
            // Nested Data (Keep existing if edit)
            medicine: id ? this.data.patients.find(x=>x.id===id).medicine : {stock:[], logs:[]},
            ttv: id ? this.data.patients.find(x=>x.id===id).ttv : [],
            visits: id ? this.data.patients.find(x=>x.id===id).visits : [],
            crisis: id ? this.data.patients.find(x=>x.id===id).crisis : {bpss:[]},
            program: id ? this.data.patients.find(x=>x.id===id).program : {list:[]},
            therapy: id ? this.data.patients.find(x=>x.id===id).therapy : {logs:[]}
        };

        if(id) {
            const idx = this.data.patients.findIndex(x=>x.id===id);
            this.data.patients[idx] = newP;
        } else {
            this.data.patients.push(newP);
        }

        app.saveDB();
        app.closeModal();
        app.nav('dashboard');
        Swal.fire('Sukses', 'Data Tersimpan', 'success');
    },

    delPatient(id) {
        if(confirm('Hapus Pasien Permanen?')) {
            this.data.patients = this.data.patients.filter(p => p.id !== id);
            this.saveDB();
            this.nav('dashboard');
        }
    },

    // ============================================================
    // MENU 2: MEDICINE
    // ============================================================
    renderMedicine(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3>
                    <button onclick="app.modalMed('${p.id}')" class="bg-mmrc-maroon text-white px-2 py-1 rounded text-xs">+ Obat</button>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 mb-2">STOK OBAT (Merah jika < 7)</h4>
                        ${(p.medicine.stock||[]).map((s,i) => `
                            <div class="flex justify-between items-center bg-gray-50 p-2 rounded mb-1 border ${(s.init-s.used)<7 ? 'bg-red-100 border-red-300 animate-pulse' : ''}">
                                <div><p class="font-bold text-sm">${s.name}</p><p class="text-[10px]">Sisa: ${s.init - s.used} tab</p></div>
                                <div>
                                    <button onclick="app.useMed('${p.id}',${i})" class="bg-blue-500 text-white px-2 py-1 rounded text-[10px]">Minum</button>
                                    <button onclick="app.delSub('${p.id}','medicine.stock',${i})" class="text-red-500 ml-1 font-bold">x</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="h-40 overflow-y-auto bg-gray-50 p-2 rounded border text-xs">
                        <h4 class="font-bold text-gray-400 mb-2 sticky top-0 bg-gray-50">LOG PENGGUNAAN</h4>
                        ${(p.medicine.logs||[]).map(l => `<div class="border-b py-1"><b>${l.time}</b>: ${l.name} (${l.pj})<br><span class="italic text-gray-500">${l.ket}</span></div>`).join('')}
                    </div>
                </div>
            </div>`).join('');
    },
    modalMed(id) {
        app.openModal('TAMBAH OBAT', `
            <input id="m_name" placeholder="Nama Obat" class="input-field mb-2">
            <input id="m_qty" type="number" placeholder="Jumlah Stok Awal" class="input-field mb-2">
            <input id="m_exp" type="date" class="input-field mb-2">
            <button onclick="app.saveMed('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded font-bold">SIMPAN</button>
        `);
    },
    saveMed(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const name=document.getElementById('m_name').value, qty=document.getElementById('m_qty').value;
        if(name && qty) {
            p.medicine.stock.push({name, init:parseInt(qty), used:0, exp:document.getElementById('m_exp').value});
            app.saveDB(); app.closeModal(); app.nav('medicine');
        }
    },
    useMed(id, idx) {
        const p = this.data.patients.find(x=>x.id===id);
        app.openModal('CATAT MINUM OBAT', `
            <p class="mb-2 font-bold">${p.medicine.stock[idx].name}</p>
            <input id="u_pj" placeholder="Nama PJ" class="input-field mb-2">
            <textarea id="u_ket" placeholder="Keterangan" class="input-field mb-2"></textarea>
            <button onclick="app.saveUseMed('${id}', ${idx})" class="w-full bg-blue-600 text-white py-2 rounded font-bold">KONFIRMASI</button>
        `);
    },
    saveUseMed(id, idx) {
        const p = this.data.patients.find(x=>x.id===id);
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({
            time: new Date().toLocaleString(),
            name: p.medicine.stock[idx].name,
            pj: document.getElementById('u_pj').value,
            ket: document.getElementById('u_ket').value
        });
        app.saveDB(); app.closeModal(); app.nav('medicine');
    },

    // ============================================================
    // MENU 3: TTV & GDS
    // ============================================================
    renderTTV(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3><button onclick="app.modalTTV('${p.id}')" class="bg-mmrc-maroon text-white px-2 py-1 rounded text-xs">+ Input</button></div>
                <div class="overflow-x-auto"><table class="w-full text-xs text-left"><thead class="bg-red-50"><tr><th>Waktu</th><th>TD</th><th>Sat</th><th>RR</th><th>GDS</th><th>X</th></tr></thead><tbody>
                ${(p.ttv||[]).map((t,i)=>`<tr><td>${t.time}</td><td>${t.td}</td><td>${t.sat}</td><td>${t.rr}</td><td class="font-bold text-red-600">${t.gds}</td><td><button onclick="app.delSub('${p.id}','ttv',${i})" class="text-red-500">x</button></td></tr>`).join('')}
                </tbody></table></div></div>`).join('');
    },
    modalTTV(id) {
        app.openModal('INPUT TTV & GDS', `
            <div class="grid grid-cols-2 gap-2">
                <input id="t_td" placeholder="TD (mmHg)" class="input-field">
                <input id="t_sat" placeholder="Saturasi (%)" class="input-field">
                <input id="t_rr" placeholder="RR" class="input-field">
                <input id="t_tb" placeholder="TB (cm)" class="input-field">
                <input id="t_bb" placeholder="BB (kg)" class="input-field">
                <input id="t_gds" placeholder="GDS" class="input-field border-red-300">
            </div>
            <button onclick="app.saveTTV('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded mt-2 font-bold">SIMPAN</button>
        `);
    },
    saveTTV(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const v = (id) => document.getElementById(id).value;
        p.ttv.unshift({
            time: new Date().toLocaleString(),
            td:v('t_td'), sat:v('t_sat'), rr:v('t_rr'), tb:v('t_tb'), bb:v('t_bb'), gds:v('t_gds')
        });
        app.saveDB(); app.closeModal(); app.nav('ttv');
    },

    // ============================================================
    // MENU 4: VISIT DOKTER
    // ============================================================
    renderVisit(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3><button onclick="app.modalVisit('${p.id}')" class="bg-mmrc-maroon text-white px-2 py-1 rounded text-xs">+ Visit</button></div>
                <div class="grid grid-cols-2 gap-2">
                    ${(p.visits||[]).map((v,i) => `
                        <div class="border rounded p-2 text-xs">
                            <div class="flex justify-between font-bold text-gray-500 mb-1"><span>${v.time}</span><button onclick="app.delSub('${p.id}','visits',${i})" class="text-red-500">x</button></div>
                            <img src="${v.photo}" class="w-full h-24 object-cover rounded mb-1 bg-gray-100">
                            <p class="italic mb-1">"${v.ket}"</p>
                            <img src="${v.sign}" class="h-8 border-t w-full object-contain">
                        </div>
                    `).join('')}
                </div>
            </div>`).join('');
    },
    modalVisit(id) {
        app.openModal('VISIT DOKTER', `
            <input type="file" id="v_photo" class="text-xs mb-2">
            <textarea id="v_ket" placeholder="Keterangan Dokter" class="input-field mb-2 h-20"></textarea>
            <p class="text-xs font-bold">Tanda Tangan:</p>
            <canvas id="sig-pad" class="border w-full h-32 bg-gray-50 cursor-crosshair"></canvas>
            <button onclick="app.saveVisit('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded mt-2 font-bold">SIMPAN</button>
        `);
        app.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
    },
    async saveVisit(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const f = document.getElementById('v_photo').files[0];
        const photo = f ? await app.toBase64(f) : '';
        if(app.signaturePad.isEmpty()) return Swal.fire('Info', 'Tanda tangan kosong', 'warning');
        
        p.visits.unshift({
            time: new Date().toLocaleString(),
            ket: document.getElementById('v_ket').value,
            photo,
            sign: app.signaturePad.toDataURL()
        });
        app.saveDB(); app.closeModal(); app.nav('visit');
    },

    // ============================================================
    // MENU 5: CRISIS (BPSS & CHART)
    // ============================================================
    renderCrisis(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4 border-l-4 border-red-600">
                <div class="flex justify-between mb-2"><h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3><button onclick="app.modalCrisis('${p.id}')" class="bg-red-600 text-white px-2 py-1 rounded text-xs">+ Score</button></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-40 border rounded relative bg-white"><canvas id="chart-${p.id}"></canvas></div>
                    <div class="h-40 overflow-y-auto text-xs bg-gray-50 p-2">
                        ${(p.crisis.bpss||[]).map((b,i)=>`<div class="border-b py-1 flex justify-between"><span>Day ${b.day}: <b>${b.total}</b></span><button onclick="app.delSub('${p.id}','crisis.bpss',${i})" class="text-red-500">x</button></div>`).join('')}
                    </div>
                </div>
            </div>`).join('');
        
        setTimeout(() => {
            this.data.patients.forEach(p => {
                const ctx = document.getElementById(`chart-${p.id}`);
                if(ctx && p.crisis.bpss?.length) {
                    if(app.chartInstances[p.id]) app.chartInstances[p.id].destroy();
                    // Sort by day logic simplistic
                    const sorted = [...p.crisis.bpss].sort((a,b)=>a.day-b.day);
                    app.chartInstances[p.id] = new Chart(ctx, {
                        type: 'radar',
                        data: {
                            labels: ['Bio','Psy','Soc','Spi'],
                            datasets: sorted.map(d => ({
                                label: `Day ${d.day}`,
                                data: [d.bio, d.psy, d.soc, d.spi],
                                borderColor: d.day==1?'red':'blue',
                                borderWidth: 1
                            }))
                        },
                        options: { maintainAspectRatio:false, scales:{r:{min:0, max:25}} }
                    });
                }
            });
        }, 100);
    },
    modalCrisis(id) {
        app.openModal('INPUT BPSS (0-25)', `
            <select id="cb_day" class="input-field mb-2"><option value="1">Day 1</option><option value="2">Day 2</option><option value="3">Day 3</option><option value="4">Day 4</option><option value="5">Day 5</option><option value="6">Day 6</option><option value="7">Day 7</option></select>
            <div class="grid grid-cols-2 gap-2">
                <input id="cb_bio" type="number" placeholder="Bio" class="input-field">
                <input id="cb_psy" type="number" placeholder="Psy" class="input-field">
                <input id="cb_soc" type="number" placeholder="Soc" class="input-field">
                <input id="cb_spi" type="number" placeholder="Spi" class="input-field">
            </div>
            <textarea id="cb_ket" placeholder="Keterangan / Evaluasi" class="input-field mt-2 h-16"></textarea>
            <button onclick="app.saveCrisis('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded mt-2 font-bold">SIMPAN</button>
        `);
    },
    saveCrisis(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const day = document.getElementById('cb_day').value;
        const b = (id) => parseInt(document.getElementById(id).value)||0;
        const score = { day, bio:b('cb_bio'), psy:b('cb_psy'), soc:b('cb_soc'), spi:b('cb_spi'), ket:document.getElementById('cb_ket').value };
        score.total = score.bio+score.psy+score.soc+score.spi;
        
        // Remove existing day
        p.crisis.bpss = p.crisis.bpss.filter(x=>x.day !== day);
        p.crisis.bpss.push(score);
        
        app.saveDB(); app.closeModal(); app.nav('crisis');
    },

    // ============================================================
    // MENU 6 & 7: PROGRAM & TERAPI
    // ============================================================
    renderProgram(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3><button onclick="app.modalProg('${p.id}')" class="bg-mmrc-maroon text-white px-2 py-1 rounded text-xs">Update</button></div>
                <div class="text-sm">
                    ${(p.program.list||[]).map((pg,i) => `<div class="mb-2 p-2 bg-gray-50 rounded"><b>${pg.paket} (${pg.durasi})</b><br>${pg.ket} <button onclick="app.delSub('${p.id}','program.list',${i})" class="text-red-500 text-xs float-right">Hapus</button></div>`).join('')}
                </div>
            </div>`).join('');
    },
    modalProg(id) {
        app.openModal('RENCANA PROGRAM', `
            <select id="p_paket" class="input-field mb-2"><option>Reguler</option><option>Eksklusif</option></select>
            <select id="p_dur" class="input-field mb-2"><option>7 Hari</option><option>14 Hari</option><option>30 Hari</option><option>60 Hari</option></select>
            <textarea id="p_ket" placeholder="Detail Program" class="input-field h-24"></textarea>
            <button onclick="app.saveProg('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded mt-2 font-bold">SIMPAN</button>
        `);
    },
    saveProg(id) {
        const p = this.data.patients.find(x=>x.id===id);
        p.program.list.push({paket:document.getElementById('p_paket').value, durasi:document.getElementById('p_dur').value, ket:document.getElementById('p_ket').value});
        app.saveDB(); app.closeModal(); app.nav('program');
    },

    renderTherapy(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-mmrc-maroon">${p.reg.name}</h3><button onclick="app.modalTherapy('${p.id}')" class="bg-mmrc-maroon text-white px-2 py-1 rounded text-xs">+ Catatan</button></div>
                <div class="text-sm h-40 overflow-y-auto">
                    ${(p.therapy.logs||[]).map((t,i) => `<div class="mb-2 border-b pb-1"><p class="text-xs text-gray-400">${t.date}</p><p>${t.note}</p><button onclick="app.delSub('${p.id}','therapy.logs',${i})" class="text-red-500 text-xs">Hapus</button></div>`).join('')}
                </div>
            </div>`).join('');
    },
    modalTherapy(id) {
        app.openModal('CATATAN TERAPI', `
            <textarea id="th_note" placeholder="Catatan Perkembangan / Rencana Terapi" class="input-field h-32"></textarea>
            <button onclick="app.saveTherapy('${id}')" class="w-full bg-mmrc-maroon text-white py-2 rounded mt-2 font-bold">SIMPAN</button>
        `);
    },
    saveTherapy(id) {
        const p = this.data.patients.find(x=>x.id===id);
        p.therapy.logs.unshift({date:new Date().toLocaleString(), note:document.getElementById('th_note').value});
        app.saveDB(); app.closeModal(); app.nav('therapy');
    },

    // ============================================================
    // FITUR EXPORT LENGKAP
    // ============================================================
    
    // WORD EXPORT (DOCX.js)
    async exportWord(id) {
        const p = this.data.patients.find(x => x.id === id);
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ImageRun, TextRun, HeadingLevel, AlignmentType } = docx;
        const b64 = (s) => { try{ return Uint8Array.from(atob(s.split(',')[1]), c=>c.charCodeAt(0)); }catch(e){return null} };

        const children = [
            new Paragraph({text: `LAPORAN PASIEN: ${p.reg.name}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER}),
            new Paragraph({text: `ID: ${p.id} | Generated: ${new Date().toLocaleDateString()}`, alignment: AlignmentType.CENTER}),
            new Paragraph("")
        ];

        // 1. BIODATA
        children.push(new Paragraph({text: "A. IDENTITAS & DIAGNOSA", heading: HeadingLevel.HEADING_2}));
        const photo = b64(p.reg.photo);
        if(photo) children.push(new Paragraph({children:[new ImageRun({data:photo, transformation:{width:120,height:120}})], alignment: AlignmentType.CENTER}));
        
        children.push(new Paragraph(`TTL: ${p.reg.ttl} | Usia: ${p.reg.age}`));
        children.push(new Paragraph(`Alamat: ${p.reg.addr}`));
        children.push(new Paragraph(`Diagnosa: ${p.diag.entry}`));
        children.push(new Paragraph(`Dokter: ${p.diag.doc}`));
        children.push(new Paragraph(""));

        // 2. OBAT
        children.push(new Paragraph({text: "B. RIWAYAT OBAT", heading: HeadingLevel.HEADING_2}));
        const medRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Waktu")]}), new TableCell({children:[new Paragraph("Obat")]}), new TableCell({children:[new Paragraph("PJ")]})]})];
        (p.medicine.logs||[]).forEach(l=> medRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(l.time)]}), new TableCell({children:[new Paragraph(l.name)]}), new TableCell({children:[new Paragraph(l.pj)]})]})));
        children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE}, rows:medRows}));
        children.push(new Paragraph(""));

        // 3. TTV
        children.push(new Paragraph({text: "C. TTV & GDS", heading: HeadingLevel.HEADING_2}));
        const ttvRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Waktu")]}), new TableCell({children:[new Paragraph("TD")]}), new TableCell({children:[new Paragraph("GDS")]})]})];
        (p.ttv||[]).forEach(t=> ttvRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(t.time)]}), new TableCell({children:[new Paragraph(t.td)]}), new TableCell({children:[new Paragraph(t.gds)]})]})));
        children.push(new Table({width:{size:100,type:WidthType.PERCENTAGE}, rows:ttvRows}));
        children.push(new Paragraph(""));

        // 4. VISIT
        children.push(new Paragraph({text: "D. VISIT DOKTER", heading: HeadingLevel.HEADING_2}));
        (p.visits||[]).forEach(v => {
            children.push(new Paragraph({text:v.time, bold:true}));
            children.push(new Paragraph(v.ket));
            const sign = b64(v.sign);
            if(sign) children.push(new Paragraph({children:[new ImageRun({data:sign, transformation:{width:80,height:40}})]}));
            children.push(new Paragraph("---"));
        });

        // 5. BPSS
        children.push(new Paragraph({text: "E. BPSS SCORE", heading: HeadingLevel.HEADING_2}));
        (p.crisis.bpss||[]).forEach(b => children.push(new Paragraph(`Day ${b.day}: Bio(${b.bio}) Psy(${b.psy}) Soc(${b.soc}) Spi(${b.spi}) -> TOTAL: ${b.total}`)));

        // 6. THERAPY
        children.push(new Paragraph({text: "F. LOG TERAPI", heading: HeadingLevel.HEADING_2}));
        (p.therapy.logs||[]).forEach(t => children.push(new Paragraph(`[${t.date}] ${t.note}`)));

        const doc = new Document({sections:[{children}]});
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `MMRC_${p.reg.name}.docx`);
    },

    // EXCEL EXPORT (SHEETJS)
    exportExcel(id) {
        const p = this.data.patients.find(x => x.id === id);
        const wb = XLSX.utils.book_new();

        // Sheet 1
        const bio = [{Kategori:"Nama", Nilai:p.reg.name}, {Kategori:"Diagnosa", Nilai:p.diag.entry}];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata");

        // Sheet 2
        if(p.medicine.logs) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.medicine.logs), "Obat");
        // Sheet 3
        if(p.ttv) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");
        // Sheet 4
        if(p.crisis.bpss) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.crisis.bpss), "BPSS");

        XLSX.writeFile(wb, `Data_${p.reg.name}.xlsx`);
    },

    // UTILS
    openModal(title, html) {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal-container').classList.remove('hidden');
        document.getElementById('modal-container').classList.add('flex');
    },
    closeModal() {
        document.getElementById('modal-container').classList.add('hidden');
        document.getElementById('modal-container').classList.remove('flex');
    },
    delSub(pid, path, idx) {
        if(!confirm('Hapus?')) return;
        const p = this.data.patients.find(x=>x.id===pid);
        let t = p; const parts = path.split('.');
        for(let i=0; i<parts.length-1; i++) t = t[parts[i]];
        t[parts[parts.length-1]].splice(idx,1);
        this.saveDB(); this.render();
    },
    search() {
        const q = document.getElementById('search-input').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

// Event Enter Login
document.getElementById('login-form').addEventListener('submit', app.login);

// Start
app.init();
