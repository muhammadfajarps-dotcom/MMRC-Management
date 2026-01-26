// ============================================================
// 1. KONFIGURASI FIREBASE
// ============================================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAyC3ZPW1XOciNwaJHOhkwSY8vFY1BRlz8",
  authDomain: "mmrc-stock1999.firebaseapp.com",
  databaseURL: "https://mmrc-stock1999-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mmrc-stock1999",
  storageBucket: "mmrc-stock1999.firebasestorage.app",
  messagingSenderId: "486588564272",
  appId: "1:486588564272:web:308b276a53401a738ebef5",
  measurementId: "G-4218HRWRTC"
};

if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ============================================================
// 2. APLIKASI UTAMA (LOGIKA 800ms YANG BAPAK SUKA)
// ============================================================
const app = {
    data: { patients: [] },
    currentPage: 'dashboard',
    saveTimer: null,
    chartInstances: {}, 
    signaturePad: null,

    init() { console.log("MMRC Ready"); },

    login() {
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            document.getElementById('auth-layer').style.display = 'none';
            document.getElementById('app-layer').classList.remove('hidden');
            this.loadDB();
            this.nav('dashboard');
        } else {
            Swal.fire('Error', 'Akses Ditolak!', 'error');
        }
    },

    // --- LOGIKA SIMPAN (800ms DELAY) ---
    saveDB() {
        if (this.saveTimer) clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            try {
                // Simpan Local
                localStorage.setItem('MMRC_DB', JSON.stringify(this.data));
                // Simpan Cloud
                db.ref('mmrc_data').set(this.data);
            } catch (err) { console.error(err); }
        }, 800);
    },

    loadDB() {
        const local = localStorage.getItem('MMRC_DB');
        if (local) {
            try { this.data = JSON.parse(local); if(!this.data.patients) this.data.patients=[]; } catch(e){}
        }
        db.ref('mmrc_data').on('value', (snap) => {
            const val = snap.val();
            if (val && document.getElementById('modal-container').classList.contains('hidden')) {
                this.data = val;
                if(!this.data.patients) this.data.patients = [];
                this.render();
            }
        });
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
        const c = document.getElementById('main-content');
        if(!c) return;
        c.innerHTML = '';

        if(this.currentPage === 'dashboard') this.viewDashboard(c);
        else if(this.currentPage === 'medicine') this.viewMedicine(c);
        else if(this.currentPage === 'ttv') this.viewTTV(c);
        else if(this.currentPage === 'visit') this.viewVisit(c);
        else if(this.currentPage === 'crisis') this.viewCrisis(c);
        else if(this.currentPage === 'program') this.viewProgram(c);
        else if(this.currentPage === 'therapy') this.viewTherapy(c);
    },

    // ============================================================
    // MENU 1: DASHBOARD (FIX INPUT & EXPORT)
    // ============================================================
    viewDashboard(c) {
        c.innerHTML = `
            <div class="flex justify-between items-center mb-6">
                <h3 class="font-bold text-gray-700">Total Pasien: ${this.data.patients.length}</h3>
                <button onclick="app.modalPatient()" class="bg-red-800 text-white px-6 py-2 rounded-xl font-bold shadow hover:bg-red-900">+ PASIEN BARU</button>
            </div>
            <div class="grid gap-6">
                ${this.data.patients.map(p => `
                <div class="card-mmrc search-item relative">
                    <div class="flex flex-col md:flex-row gap-6">
                        <div class="w-full md:w-1/4 text-center border-r border-gray-100 pr-4">
                            <img src="${p.reg.photo || 'logo.png'}" class="w-24 h-24 mx-auto rounded-full object-cover border-4 border-red-50 mb-2">
                            <h4 class="font-black text-xl text-red-900">${p.reg.name}</h4>
                            <p class="text-xs text-gray-500">${p.reg.age} Thn | ${p.reg.gender}</p>
                            
                            <div class="flex flex-col gap-2 mt-4">
                                <button onclick="app.exportWord('${p.id}')" class="bg-blue-600 text-white py-1 px-2 rounded text-xs font-bold w-full">WORD LENGKAP</button>
                                <button onclick="app.exportExcel('${p.id}')" class="bg-green-600 text-white py-1 px-2 rounded text-xs font-bold w-full">EXCEL DATA</button>
                            </div>
                        </div>
                        <div class="w-full md:w-3/4">
                            <div class="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div class="bg-gray-50 p-2 rounded"><b>Diagnosa:</b><br>${p.diagnosis.entry_diag || '-'}</div>
                                <div class="bg-red-50 p-2 rounded"><b>Dokter PJ:</b><br>${p.diagnosis.dr_name || '-'}</div>
                                <div class="col-span-2 bg-yellow-50 p-2 rounded"><b>Kondisi:</b> ${p.history.current || '-'}</div>
                            </div>
                            <div class="flex justify-end gap-2 border-t pt-2">
                                <button onclick="app.modalPatient('${p.id}')" class="text-amber-600 font-bold text-xs px-3 py-1 border border-amber-200 rounded">EDIT</button>
                                <button onclick="app.delPatient('${p.id}')" class="text-red-600 font-bold text-xs px-3 py-1 border border-red-200 rounded">HAPUS</button>
                            </div>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        `;
    },

    modalPatient(id = null) {
        const p = id ? this.data.patients.find(x => x.id === id) : null;
        document.getElementById('modal-title').innerText = id ? "EDIT PASIEN" : "REGISTRASI BARU";
        const v = (val) => val ? val : '';
        
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input id="p_name" value="${v(p?.reg.name)}" placeholder="Nama Lengkap" class="input-field">
                <input id="p_ttl" value="${v(p?.reg.ttl)}" placeholder="TTL" class="input-field">
                <input id="p_age" value="${v(p?.reg.age)}" type="number" placeholder="Usia" class="input-field">
                <input id="p_gender" value="${v(p?.reg.gender)}" placeholder="L/P" class="input-field">
                <input id="p_addr" value="${v(p?.reg.addr)}" placeholder="Alamat" class="input-field col-span-2">
                
                <div class="col-span-2 border-t pt-2 font-bold text-red-800">MEDIS</div>
                <input id="p_dr" value="${v(p?.diagnosis.dr_name)}" placeholder="Dokter PJ" class="input-field">
                <textarea id="p_diag" placeholder="Diagnosa" class="input-field h-20">${v(p?.diagnosis.entry_diag)}</textarea>
                <textarea id="p_curr" placeholder="Kondisi" class="input-field h-20">${v(p?.history.current)}</textarea>
                
                <div class="col-span-2"><input type="file" id="p_photo" class="text-xs"></div>
            </div>
            <button onclick="app.savePatient('${id || ''}')" class="w-full bg-red-800 text-white py-3 rounded-xl font-bold mt-4">SIMPAN</button>
        `;
        this.openModal();
    },

    async savePatient(id) {
        const name = document.getElementById('p_name').value;
        if(!name) return Swal.fire('Gagal', 'Nama wajib diisi', 'warning');

        let photo = id ? this.data.patients.find(x=>x.id===id).reg.photo : '';
        const f = document.getElementById('p_photo').files[0];
        if(f) photo = await this.toBase64(f);

        const newP = {
            id: id || 'P-'+Date.now(),
            reg: {
                name, ttl: document.getElementById('p_ttl').value,
                age: document.getElementById('p_age').value,
                gender: document.getElementById('p_gender').value,
                addr: document.getElementById('p_addr').value, photo
            },
            diagnosis: {
                dr_name: document.getElementById('p_dr').value,
                entry_diag: document.getElementById('p_diag').value
            },
            history: { current: document.getElementById('p_curr').value },
            // Data Nested (JANGAN DIHAPUS SAAT EDIT)
            medicine: id ? this.data.patients.find(x=>x.id===id).medicine : { stock:[], logs:[] },
            ttv: id ? this.data.patients.find(x=>x.id===id).ttv : [],
            visits: id ? this.data.patients.find(x=>x.id===id).visits : [],
            crisis: id ? this.data.patients.find(x=>x.id===id).crisis : { bpss:[] },
            program: id ? this.data.patients.find(x=>x.id===id).program : { list:[] },
            therapy: id ? this.data.patients.find(x=>x.id===id).therapy : { logs:[] }
        };

        if(id) {
            const idx = this.data.patients.findIndex(x => x.id === id);
            this.data.patients[idx] = newP;
        } else {
            this.data.patients.push(newP);
        }

        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // MENU 2: OBAT
    // ============================================================
    viewMedicine(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2">
                    <h3 class="font-bold text-red-900">${p.reg.name}</h3>
                    <button onclick="app.modalMed('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Obat</button>
                </div>
                <div class="grid md:grid-cols-2 gap-4">
                    <div>
                        <h4 class="text-xs font-bold text-gray-500">STOK OBAT</h4>
                        ${(p.medicine.stock||[]).map((s,i) => {
                            const low = (s.init - s.used) < 7;
                            return `<div class="flex justify-between items-center p-2 border rounded mb-1 ${low?'bg-red-100 animate-pulse':''}">
                                <div><b>${s.name}</b><br><span class="text-xs">Sisa: ${s.init - s.used}</span></div>
                                <button onclick="app.useMed('${p.id}',${i})" class="bg-blue-600 text-white text-xs px-2 py-1 rounded">Minum</button>
                                <button onclick="app.delSub('${p.id}','medicine.stock',${i})" class="text-red-500 ml-1">x</button>
                            </div>`
                        }).join('')}
                    </div>
                    <div class="h-40 overflow-y-auto bg-gray-50 p-2 text-xs">
                        <h4 class="font-bold text-gray-500">LOG</h4>
                        ${(p.medicine.logs||[]).map(l => `<div>${l.time}: ${l.name} (${l.pj})</div>`).join('')}
                    </div>
                </div>
            </div>`).join('');
    },
    modalMed(id) {
        document.getElementById('modal-title').innerText = "TAMBAH OBAT";
        document.getElementById('modal-body').innerHTML = `<input id="m_name" placeholder="Nama Obat" class="input-field mb-2"><input id="m_qty" type="number" placeholder="Jumlah" class="input-field mb-2"><button onclick="app.saveMed('${id}')" class="w-full bg-red-800 text-white py-2 rounded">SIMPAN</button>`;
        this.openModal();
    },
    saveMed(id) {
        const p = this.data.patients.find(x=>x.id===id);
        p.medicine.stock.push({name:document.getElementById('m_name').value, init:document.getElementById('m_qty').value, used:0});
        this.saveDB(); this.closeModal(); this.render();
    },
    useMed(id, idx) {
        const pj = prompt("Nama PJ:");
        if(!pj) return;
        const p = this.data.patients.find(x=>x.id===id);
        p.medicine.stock[idx].used++;
        p.medicine.logs.unshift({time: new Date().toLocaleString(), name: p.medicine.stock[idx].name, pj});
        this.saveDB(); this.render();
    },

    // ============================================================
    // MENU 3, 4, 5, 6 (TTV, VISIT, CRISIS, PROGRAM)
    // ============================================================
    viewTTV(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4">
                <div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalTTV('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ TTV</button></div>
                <div class="overflow-x-auto"><table class="w-full text-xs text-left"><thead class="bg-red-50"><tr><th>Waktu</th><th>TD</th><th>GDS</th><th>X</th></tr></thead><tbody>
                ${(p.ttv||[]).map((t,i)=>`<tr><td>${t.time}</td><td>${t.td}</td><td>${t.gds}</td><td><button onclick="app.delSub('${p.id}','ttv',${i})" class="text-red-500">x</button></td></tr>`).join('')}
                </tbody></table></div></div>`).join('');
    },
    modalTTV(id) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `<input id="t_td" placeholder="TD" class="input-field mb-2"><input id="t_gds" placeholder="GDS" class="input-field mb-2"><button onclick="app.saveTTV('${id}')" class="w-full bg-red-800 text-white py-2 rounded">SIMPAN</button>`;
        this.openModal();
    },
    saveTTV(id) {
        const p = this.data.patients.find(x=>x.id===id);
        p.ttv.unshift({time:new Date().toLocaleString(), td:document.getElementById('t_td').value, gds:document.getElementById('t_gds').value});
        this.saveDB(); this.closeModal(); this.render();
    },

    viewVisit(c) {
        c.innerHTML = this.data.patients.map(p => `<div class="card-mmrc mb-4"><div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalVisit('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Visit</button></div><div class="grid grid-cols-2 gap-2">${(p.visits||[]).map((v,i)=>`<div class="border p-2 rounded"><img src="${v.photo}" class="h-20 w-full object-cover"><p class="text-xs mt-1">"${v.note}"</p><img src="${v.sign}" class="h-10 w-full object-contain border-t mt-1"><button onclick="app.delSub('${p.id}','visits',${i})" class="text-red-500 text-xs">Hapus</button></div>`).join('')}</div></div>`).join('');
    },
    modalVisit(id) {
        document.getElementById('modal-title').innerText = "VISIT DOKTER";
        document.getElementById('modal-body').innerHTML = `<input type="file" id="v_photo" class="mb-2"><textarea id="v_note" class="input-field mb-2" placeholder="Catatan"></textarea><canvas id="sig-pad" class="border w-full h-32 bg-gray-50"></canvas><button onclick="app.saveVisit('${id}')" class="w-full bg-red-800 text-white py-2 rounded mt-2">SIMPAN</button>`;
        this.openModal();
        this.signaturePad = new SignaturePad(document.getElementById('sig-pad'));
    },
    async saveVisit(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const f = document.getElementById('v_photo').files[0];
        const photo = f ? await this.toBase64(f) : '';
        p.visits.unshift({time:new Date().toLocaleString(), note:document.getElementById('v_note').value, photo, sign:this.signaturePad.toDataURL()});
        this.saveDB(); this.closeModal(); this.render();
    },

    viewCrisis(c) {
        c.innerHTML = this.data.patients.map(p => `
            <div class="card-mmrc mb-4 border-l-4 border-red-600">
                <div class="flex justify-between mb-2"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalCrisis('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Score</button></div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="h-40 border rounded relative"><canvas id="chart-${p.id}"></canvas></div>
                    <div class="h-40 overflow-y-auto text-xs bg-gray-50 p-2">
                        ${(p.crisis.bpss||[]).map((b,i)=>`<div class="border-b">H-${i+1}: <b>${b.total}</b> <button onclick="app.delSub('${p.id}','crisis.bpss',${i})" class="text-red-500">x</button></div>`).join('')}
                    </div>
                </div>
            </div>`).join('');
        
        setTimeout(() => {
            this.data.patients.forEach(p => {
                const ctx = document.getElementById(`chart-${p.id}`);
                if(ctx && p.crisis.bpss?.length) {
                    if(this.chartInstances[p.id]) this.chartInstances[p.id].destroy();
                    this.chartInstances[p.id] = new Chart(ctx, {
                        type: 'line',
                        data: { labels: p.crisis.bpss.map((_,i)=>`H${i+1}`), datasets: [{label:'Score', data:p.crisis.bpss.map(b=>b.total), borderColor:'#991b1b', tension:0.1}] },
                        options: {maintainAspectRatio:false, scales:{y:{min:0, max:25}}}
                    });
                }
            });
        }, 100);
    },
    modalCrisis(id) {
        document.getElementById('modal-title').innerText = "INPUT BPSS";
        document.getElementById('modal-body').innerHTML = `<div class="grid grid-cols-2 gap-2"><input id="cb_bio" type="number" placeholder="Bio"><input id="cb_psy" type="number" placeholder="Psy"><input id="cb_soc" type="number" placeholder="Soc"><input id="cb_spi" type="number" placeholder="Spi"></div><button onclick="app.saveCrisis('${id}')" class="w-full bg-red-800 text-white py-2 rounded mt-2">SIMPAN</button>`;
        this.openModal();
    },
    saveCrisis(id) {
        const p = this.data.patients.find(x=>x.id===id);
        const bio=parseInt(document.getElementById('cb_bio').value)||0, psy=parseInt(document.getElementById('cb_psy').value)||0, soc=parseInt(document.getElementById('cb_soc').value)||0, spi=parseInt(document.getElementById('cb_spi').value)||0;
        if(!p.crisis) p.crisis = {bpss:[]};
        p.crisis.bpss.push({bio, psy, soc, spi, total:bio+psy+soc+spi});
        this.saveDB(); this.closeModal(); this.render();
    },

    viewProgram(c) {
        c.innerHTML = this.data.patients.map(p => `<div class="card-mmrc mb-4"><div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalProg('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Program</button></div><ul class="list-disc pl-5 text-sm">${(p.program.list||[]).map((l,i)=>`<li>${l.date}: ${l.desc} <button onclick="app.delSub('${p.id}','program.list',${i})" class="text-red-500 text-xs">[hapus]</button></li>`).join('')}</ul></div>`).join('');
    },
    modalProg(id) {
        document.getElementById('modal-title').innerText = "INPUT PROGRAM";
        document.getElementById('modal-body').innerHTML = `<input type="date" id="p_date" class="input-field mb-2"><textarea id="p_desc" class="input-field" placeholder="Deskripsi"></textarea><button onclick="app.saveProg('${id}')" class="w-full bg-red-800 text-white py-2 rounded mt-2">SIMPAN</button>`;
        this.openModal();
    },
    saveProg(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.program) p.program = {list:[]};
        p.program.list.push({date:document.getElementById('p_date').value, desc:document.getElementById('p_desc').value});
        this.saveDB(); this.closeModal(); this.render();
    },

    viewTherapy(c) {
        c.innerHTML = this.data.patients.map(p => `<div class="card-mmrc mb-4"><div class="flex justify-between border-b pb-2 mb-2"><h3 class="font-bold text-red-900">${p.reg.name}</h3><button onclick="app.modalTherapy('${p.id}')" class="bg-red-800 text-white px-2 py-1 rounded text-xs">+ Terapi</button></div><ul class="list-decimal pl-5 text-sm">${(p.therapy.logs||[]).map((l,i)=>`<li>${l.date}: ${l.act} <button onclick="app.delSub('${p.id}','therapy.logs',${i})" class="text-red-500 text-xs">[hapus]</button></li>`).join('')}</ul></div>`).join('');
    },
    modalTherapy(id) {
        document.getElementById('modal-title').innerText = "INPUT TERAPI";
        document.getElementById('modal-body').innerHTML = `<input type="date" id="th_date" class="input-field mb-2"><textarea id="th_act" class="input-field" placeholder="Aktivitas"></textarea><button onclick="app.saveTherapy('${id}')" class="w-full bg-red-800 text-white py-2 rounded mt-2">SIMPAN</button>`;
        this.openModal();
    },
    saveTherapy(id) {
        const p = this.data.patients.find(x=>x.id===id);
        if(!p.therapy) p.therapy = {logs:[]};
        p.therapy.logs.push({date:document.getElementById('th_date').value, act:document.getElementById('th_act').value});
        this.saveDB(); this.closeModal(); this.render();
    },

    // ============================================================
    // FITUR EXPORT LENGKAP (WORD & EXCEL) PER PASIEN
    // ============================================================
    
    // EXPORT WORD
    async exportWord(id) {
        const p = this.data.patients.find(x => x.id === id);
        const { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, ImageRun, HeadingLevel, AlignmentType } = docx;
        const b64 = (s) => { try { return Uint8Array.from(atob(s.split(',')[1]), c=>c.charCodeAt(0)); } catch(e){return null} };

        const children = [
            new Paragraph({text: `REKAM MEDIS: ${p.reg.name}`, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER}),
            new Paragraph("")
        ];

        // Foto & Biodata
        const photo = b64(p.reg.photo);
        if(photo) children.push(new Paragraph({children:[new ImageRun({data:photo, transformation:{width:100,height:100}})], alignment: AlignmentType.CENTER}));
        children.push(new Paragraph(`TTL: ${p.reg.ttl}, Usia: ${p.reg.age}, Alamat: ${p.reg.addr}`));
        children.push(new Paragraph(`Diagnosa: ${p.diagnosis.entry_diag}`));
        children.push(new Paragraph(""));

        // Tabel Obat
        children.push(new Paragraph({text: "RIWAYAT OBAT", heading: HeadingLevel.HEADING_2}));
        const medRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Waktu")]}), new TableCell({children:[new Paragraph("Obat")]}), new TableCell({children:[new Paragraph("PJ")]})]})];
        (p.medicine.logs||[]).forEach(l => medRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(l.time)]}), new TableCell({children:[new Paragraph(l.name)]}), new TableCell({children:[new Paragraph(l.pj)]})] })));
        children.push(new Table({width:{size:100, type:WidthType.PERCENTAGE}, rows:medRows}));
        children.push(new Paragraph(""));

        // Tabel BPSS
        children.push(new Paragraph({text: "SKOR BPSS (Harian)", heading: HeadingLevel.HEADING_2}));
        const bpssRows = [new TableRow({children:[new TableCell({children:[new Paragraph("Hari")]}), new TableCell({children:[new Paragraph("Bio")]}), new TableCell({children:[new Paragraph("Psy")]}), new TableCell({children:[new Paragraph("Soc")]}), new TableCell({children:[new Paragraph("Spi")]}), new TableCell({children:[new Paragraph("Total")]})]})];
        (p.crisis.bpss||[]).forEach((b, i) => bpssRows.push(new TableRow({children:[new TableCell({children:[new Paragraph(`H-${i+1}`)]}), new TableCell({children:[new Paragraph(""+b.bio)]}), new TableCell({children:[new Paragraph(""+b.psy)]}), new TableCell({children:[new Paragraph(""+b.soc)]}), new TableCell({children:[new Paragraph(""+b.spi)]}), new TableCell({children:[new Paragraph(""+b.total)]})] })));
        children.push(new Table({width:{size:100, type:WidthType.PERCENTAGE}, rows:bpssRows}));
        children.push(new Paragraph(""));

        // Visit + TTD
        children.push(new Paragraph({text: "VISIT DOKTER", heading: HeadingLevel.HEADING_2}));
        (p.visits||[]).forEach(v => {
            children.push(new Paragraph({text: `Waktu: ${v.time}`, bold:true}));
            children.push(new Paragraph(v.note));
            const sign = b64(v.sign);
            if(sign) children.push(new Paragraph({children:[new ImageRun({data:sign, transformation:{width:100,height:50}})]}));
            children.push(new Paragraph("--------------------------------"));
        });

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a); a.style = "display:none"; a.href = url; a.download = `MMRC_${p.reg.name}.docx`; a.click();
    },

    // EXPORT EXCEL
    exportExcel(id) {
        const p = this.data.patients.find(x => x.id === id);
        const wb = XLSX.utils.book_new();
        
        const bio = [{Kategori:"Nama", Nilai:p.reg.name}, {Kategori:"Diagnosa", Nilai:p.diagnosis.entry_diag}];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(bio), "Biodata");

        if(p.medicine.logs) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.medicine.logs), "Obat");
        if(p.ttv) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.ttv), "TTV");
        if(p.crisis.bpss) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(p.crisis.bpss), "BPSS");

        XLSX.writeFile(wb, `MMRC_${p.reg.name}.xlsx`);
    },

    // UTILS
    delSub(pid, path, idx) {
        if(!confirm('Hapus?')) return;
        const p = this.data.patients.find(x=>x.id===pid);
        let t = p; const parts = path.split('.');
        for(let i=0; i<parts.length-1; i++) t = t[parts[i]];
        t[parts[parts.length-1]].splice(idx,1);
        this.saveDB(); this.render();
    },
    delPatient(id) {
        if(confirm('Hapus Pasien Permanen?')) {
            this.data.patients = this.data.patients.filter(p=>p.id!==id);
            this.saveDB(); this.render();
        }
    },
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.search-item').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? 'block' : 'none';
        });
    },
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    toBase64: f => new Promise(r => { const rd = new FileReader(); rd.readAsDataURL(f); rd.onload = () => r(rd.result); })
};

window.app = app;
app.init();
