// CONFIGURATION
const DB_KEY = 'MMRC_DATABASE';
const appData = {
    patients: []
};

// INITIALIZATION
const app = {
    init: () => {
        const storedData = localStorage.getItem(DB_KEY);
        if (storedData) {
            appData.patients = JSON.parse(storedData);
        }
        app.checkAuth();
    },

    checkAuth: () => {
        const isLogged = sessionStorage.getItem('mmrc_logged');
        if (isLogged) {
            document.getElementById('auth-layer').classList.add('hidden');
            document.getElementById('app-layer').classList.remove('hidden');
            app.nav('dashboard');
        }
    },

    login: (e) => {
        e.preventDefault();
        const u = document.getElementById('login-user').value;
        const p = document.getElementById('login-pass').value;
        if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
            sessionStorage.setItem('mmrc_logged', 'true');
            Swal.fire('Sukses', 'Selamat Datang di MMRC System', 'success').then(() => {
                location.reload();
            });
        } else {
            Swal.fire('Gagal', 'Username atau Password Salah', 'error');
        }
    },

    logout: () => {
        sessionStorage.removeItem('mmrc_logged');
        location.reload();
    },

    nav: (page) => {
        // Reset Active Class
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.getElementById(`btn-${page}`).classList.add('active');
        
        // Render Page Content
        const content = document.getElementById('content-area');
        const title = document.getElementById('page-title');
        
        title.innerText = page.toUpperCase().replace('_', ' ');
        content.innerHTML = app.pages[page]();
        
        // Post-render scripts (Listeners, Charts, etc)
        if(page === 'dashboard') app.renderPatientTable();
        if(page === 'crisis') app.initChart();
    },

    saveDB: () => {
        localStorage.setItem(DB_KEY, JSON.stringify(appData.patients));
    },

    // --- MODALS & FORMS ---
    openModal: (title, html) => {
        document.getElementById('modal-title').innerText = title;
        document.getElementById('modal-body').innerHTML = html;
        document.getElementById('modal-container').classList.remove('hidden');
    },

    closeModal: () => {
        document.getElementById('modal-container').classList.add('hidden');
    },

    // --- PAGES RENDERER ---
    pages: {
        dashboard: () => `
            <div class="card">
                <div class="grid-2">
                    <h3>Data Pasien</h3>
                    <div style="text-align:right;">
                        <button onclick="app.forms.addPatient()" class="btn btn-primary"><i class="fas fa-plus"></i> Registrasi Pasien Baru</button>
                        <button onclick="app.exportToExcel()" class="btn btn-success"><i class="fas fa-file-excel"></i> Export Excel</button>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nama Pasien</th>
                            <th>Usia</th>
                            <th>Diagnosa Masuk</th>
                            <th>Dokter PJ</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="patient-table-body"></tbody>
                </table>
            </div>
        `,
        medicine: () => `
            <div class="card">
                <h3>Manajemen Obat Pasien</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-med" onchange="app.renderMedicineView()" class="input-field"></select>
                </div>
                <div id="medicine-view"></div>
            </div>
        `,
        ttv: () => `
            <div class="card">
                <h3>Tanda Tanda Vital (TTV) & GDS</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-ttv" onchange="app.renderTTVView()" class="input-field"></select>
                </div>
                <div id="ttv-view"></div>
            </div>
        `,
        visit: () => `
            <div class="card">
                <h3>Visit Dokter</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-visit" onchange="app.renderVisitView()" class="input-field"></select>
                </div>
                <div id="visit-view"></div>
            </div>
        `,
        crisis: () => `
            <div class="card">
                <h3>Pasien Crisis & BPSS Score</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-crisis" onchange="app.renderCrisisView()" class="input-field"></select>
                </div>
                <div id="crisis-view"></div>
            </div>
        `,
        program: () => `
            <div class="card">
                <h3>Rencana Program</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-prog" onchange="app.renderProgramView()" class="input-field"></select>
                </div>
                <div id="program-view"></div>
            </div>
        `,
        therapy: () => `
            <div class="card">
                <h3>Rencana Terapi</h3>
                <div class="form-group">
                    <label>Pilih Pasien:</label>
                    <select id="select-patient-tera" onchange="app.renderTherapyView()" class="input-field"></select>
                </div>
                <div id="therapy-view"></div>
            </div>
        `
    },

    // --- LOGIC: DASHBOARD & PATIENT ---
    renderPatientTable: () => {
        const tbody = document.getElementById('patient-table-body');
        let html = '';
        appData.patients.forEach((p, index) => {
            html += `
                <tr>
                    <td>${p.id}</td>
                    <td>${p.biodata.nama}</td>
                    <td>${p.biodata.usia}</td>
                    <td>${p.diagnosa.diagnosaMasuk}</td>
                    <td>${p.diagnosa.dokter}</td>
                    <td>
                        <button onclick="app.forms.editPatient(${index})" class="btn btn-secondary"><i class="fas fa-edit"></i></button>
                        <button onclick="app.deletePatient(${index})" class="btn btn-danger"><i class="fas fa-trash"></i></button>
                        <button onclick="app.exportWordPatient(${index})" class="btn btn-primary"><i class="fas fa-file-word"></i></button>
                    </td>
                </tr>
            `;
        });
        tbody.innerHTML = html;
    },

    forms: {
        addPatient: () => {
            app.openModal('Registrasi Pasien Baru', `
                <div class="grid-3">
                    <div class="form-group">
                        <label>Nama Lengkap</label>
                        <input type="text" id="p-nama" class="input-field">
                        <label>TTL</label>
                        <input type="text" id="p-ttl" class="input-field">
                        <label>Usia</label>
                        <input type="number" id="p-usia" class="input-field">
                        <label>Status</label>
                        <select id="p-status" class="input-field">
                            <option>Menikah</option><option>Lajang</option><option>Cerai</option>
                        </select>
                        <label>Alamat</label>
                        <input type="text" id="p-alamat" class="input-field">
                        <label>Wali</label>
                        <input type="text" id="p-wali" class="input-field">
                    </div>
                    <div class="form-group">
                        <label>Riwayat Fisik</label>
                        <textarea id="p-fisik" class="input-field"></textarea>
                        <label>Riwayat Psikis</label>
                        <textarea id="p-psikis" class="input-field"></textarea>
                        <label>Diagnosa Lalu</label>
                        <input type="text" id="p-diag-lalu" class="input-field">
                        <label>Riwayat Obat</label>
                        <input type="text" id="p-obat-lalu" class="input-field">
                    </div>
                    <div class="form-group">
                        <label>Nama Dokter</label>
                        <input type="text" id="p-dokter" class="input-field">
                        <label>Diagnosa Masuk</label>
                        <input type="text" id="p-diag-masuk" class="input-field">
                        <label>Planning</label>
                        <textarea id="p-planning" class="input-field"></textarea>
                        <label>Intervensi</label>
                        <div>
                            <input type="checkbox" id="chk-inj"> Injeksi <br>
                            <input type="checkbox" id="chk-urin"> Urine Test <br>
                            <input type="checkbox" id="chk-fik"> Fiksasi
                        </div>
                    </div>
                </div>
                <button onclick="app.submitPatient()" class="btn btn-success" style="width:100%">SIMPAN DATA</button>
            `);
        }
    },

    submitPatient: () => {
        const id = 'P-' + Date.now();
        const newPatient = {
            id: id,
            timestamp: new Date().toLocaleString(),
            biodata: {
                nama: document.getElementById('p-nama').value,
                ttl: document.getElementById('p-ttl').value,
                usia: document.getElementById('p-usia').value,
                status: document.getElementById('p-status').value,
                alamat: document.getElementById('p-alamat').value,
                wali: document.getElementById('p-wali').value
            },
            history: {
                fisik: document.getElementById('p-fisik').value,
                psikis: document.getElementById('p-psikis').value,
                obat: document.getElementById('p-obat-lalu').value
            },
            diagnosa: {
                dokter: document.getElementById('p-dokter').value,
                diagnosaMasuk: document.getElementById('p-diag-masuk').value,
                planning: document.getElementById('p-planning').value,
                intervensi: {
                    injeksi: document.getElementById('chk-inj').checked,
                    urine: document.getElementById('chk-urin').checked,
                    fiksasi: document.getElementById('chk-fik').checked
                }
            },
            medicine: [], // Array of {name, initial, used, current, exp}
            medicineLog: [],
            ttv: [],
            visits: [],
            bpss: [],
            program: {},
            therapy: ""
        };
        
        appData.patients.push(newPatient);
        app.saveDB();
        app.closeModal();
        app.renderPatientTable();
        Swal.fire('Sukses', 'Data Tersimpan', 'success');
    },

    deletePatient: (index) => {
        if(confirm('Hapus data pasien ini?')) {
            appData.patients.splice(index, 1);
            app.saveDB();
            app.renderPatientTable();
        }
    },

    populatePatientSelect: (elemId) => {
        const select = document.getElementById(elemId);
        select.innerHTML = '<option value="">-- Pilih Pasien --</option>';
        appData.patients.forEach((p, idx) => {
            select.innerHTML += `<option value="${idx}">${p.biodata.nama} (${p.id})</option>`;
        });
    },

    // --- LOGIC: MEDICINE ---
    renderMedicineView: () => {
        app.populatePatientSelect('select-patient-med');
        const select = document.getElementById('select-patient-med');
        
        // Re-attach listener hack for dynamic content
        select.onchange = () => {
            const idx = select.value;
            const container = document.getElementById('medicine-view');
            if(idx === "") { container.innerHTML = ''; return; }
            
            const p = appData.patients[idx];
            
            let stockHtml = p.medicine.map((m, i) => `
                <tr>
                    <td>${m.name}</td>
                    <td>${m.initial}</td>
                    <td>${m.used}</td>
                    <td class="${m.current <= 7 ? 'text-danger' : ''}">${m.current}</td>
                    <td>${m.exp}</td>
                    <td><button onclick="app.useMedicine(${idx}, ${i})" class="btn btn-warning btn-small">Gunakan</button></td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div class="grid-2">
                    <div>
                        <h4>Stok Obat</h4>
                        <button onclick="app.addMedicineStock(${idx})" class="btn btn-primary" style="margin-bottom:10px;">+ Tambah Obat</button>
                        <table>
                            <thead><tr><th>Nama</th><th>Awal</th><th>Pakai</th><th>Sisa</th><th>Exp</th><th>Aksi</th></tr></thead>
                            <tbody>${stockHtml}</tbody>
                        </table>
                    </div>
                    <div>
                        <h4>Riwayat Penggunaan</h4>
                        <ul style="max-height:300px; overflow-y:auto; list-style:none;">
                            ${p.medicineLog.map(l => `<li style="border-bottom:1px solid #ddd; padding:5px;"><b>${l.obat}</b> (${l.amount}) - ${l.timestamp} <br> <small>Ket: ${l.ket} | PJ: ${l.pj}</small></li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }
    },

    addMedicineStock: (pIdx) => {
        app.openModal('Tambah Stok Obat', `
            <label>Nama Obat</label><input type="text" id="med-name" class="input-field">
            <label>Jumlah Awal</label><input type="number" id="med-qty" class="input-field">
            <label>Exp Date</label><input type="date" id="med-exp" class="input-field">
            <button onclick="app.submitMedicine(${pIdx})" class="btn btn-success" style="margin-top:10px; width:100%">SIMPAN</button>
        `);
    },

    submitMedicine: (pIdx) => {
        const name = document.getElementById('med-name').value;
        const qty = parseInt(document.getElementById('med-qty').value);
        const exp = document.getElementById('med-exp').value;

        appData.patients[pIdx].medicine.push({
            name: name,
            initial: qty,
            used: 0,
            current: qty,
            exp: exp
        });
        app.saveDB();
        app.closeModal();
        document.getElementById('select-patient-med').onchange(); // Refresh view
    },

    useMedicine: (pIdx, mIdx) => {
        app.openModal('Catat Penggunaan', `
            <label>Jumlah Digunakan</label><input type="number" id="use-qty" class="input-field">
            <label>Nama PJ</label><input type="text" id="use-pj" class="input-field">
            <label>Keterangan</label><input type="text" id="use-ket" class="input-field">
            <button onclick="app.submitUseMedicine(${pIdx}, ${mIdx})" class="btn btn-danger" style="margin-top:10px; width:100%">KURANGI STOK</button>
        `);
    },

    submitUseMedicine: (pIdx, mIdx) => {
        const qty = parseInt(document.getElementById('use-qty').value);
        const pj = document.getElementById('use-pj').value;
        const ket = document.getElementById('use-ket').value;
        const med = appData.patients[pIdx].medicine[mIdx];

        if(med.current < qty) {
            Swal.fire('Error', 'Stok tidak cukup!', 'error');
            return;
        }

        med.used += qty;
        med.current -= qty;

        appData.patients[pIdx].medicineLog.push({
            timestamp: new Date().toLocaleString(),
            obat: med.name,
            amount: qty,
            pj: pj,
            ket: ket
        });

        app.saveDB();
        app.closeModal();
        document.getElementById('select-patient-med').onchange();
    },

    // --- LOGIC: CRISIS & CHART ---
    renderCrisisView: () => {
        app.populatePatientSelect('select-patient-crisis');
        const select = document.getElementById('select-patient-crisis');
        
        select.onchange = () => {
            const idx = select.value;
            const container = document.getElementById('crisis-view');
            if(idx === "") { container.innerHTML = ''; return; }
            
            const p = appData.patients[idx];
            
            container.innerHTML = `
                <div class="grid-2">
                    <div>
                        <h4>Input Score BPSS (Day 1-7)</h4>
                        <label>Hari Ke-</label>
                        <select id="bpss-day" class="input-field">
                            <option value="1">Day 1</option><option value="2">Day 2</option><option value="3">Day 3</option>
                            <option value="4">Day 4</option><option value="5">Day 5</option><option value="6">Day 6</option><option value="7">Day 7</option>
                        </select>
                        <div class="grid-2">
                            <input type="number" id="sc-bio" placeholder="Bio (0-25)" class="input-field">
                            <input type="number" id="sc-psy" placeholder="Psy (0-25)" class="input-field">
                            <input type="number" id="sc-soc" placeholder="Social (0-25)" class="input-field">
                            <input type="number" id="sc-spi" placeholder="Spiritual (0-25)" class="input-field">
                        </div>
                        <button onclick="app.submitBPSS(${idx})" class="btn btn-primary" style="width:100%; margin-top:10px;">UPDATE SCORE</button>
                    </div>
                    <div>
                        <h4>Grafik Perkembangan</h4>
                        <canvas id="bpssChart"></canvas>
                    </div>
                </div>
            `;
            setTimeout(() => app.renderChart(p), 100);
        }
    },

    submitBPSS: (pIdx) => {
        const day = document.getElementById('bpss-day').value;
        const score = {
            day: day,
            bio: parseInt(document.getElementById('sc-bio').value) || 0,
            psy: parseInt(document.getElementById('sc-psy').value) || 0,
            soc: parseInt(document.getElementById('sc-soc').value) || 0,
            spi: parseInt(document.getElementById('sc-spi').value) || 0,
        };
        
        // Remove existing day if present
        appData.patients[pIdx].bpss = appData.patients[pIdx].bpss.filter(s => s.day !== day);
        appData.patients[pIdx].bpss.push(score);
        
        app.saveDB();
        app.renderChart(appData.patients[pIdx]);
        Swal.fire('Tersimpan', 'Score diperbarui', 'success');
    },

    renderChart: (patient) => {
        const ctx = document.getElementById('bpssChart').getContext('2d');
        
        // Prepare Data
        let labels = ['Bio', 'Psy', 'Soc', 'Spi'];
        let datasets = [];
        
        // Only showing latest day for Radar simplicity, or Day 1 vs Day 7 logic can be applied
        // Here we map all available days
        patient.bpss.sort((a,b) => a.day - b.day).forEach(d => {
            datasets.push({
                label: `Day ${d.day}`,
                data: [d.bio, d.psy, d.soc, d.spi],
                fill: true,
                backgroundColor: `rgba(0, 128, 128, 0.${d.day})`,
                borderColor: 'rgba(0, 128, 128, 1)',
                pointBackgroundColor: 'rgba(0, 128, 128, 1)',
            });
        });

        // Destroy old chart if exists (need global ref or recreation)
        // For simplicity in this structure:
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: datasets
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 25
                    }
                }
            }
        });
    },

    // --- LOGIC: VISIT DOKTER (Signature) ---
    renderVisitView: () => {
        app.populatePatientSelect('select-patient-visit');
        const select = document.getElementById('select-patient-visit');
        
        select.onchange = () => {
            const idx = select.value;
            const container = document.getElementById('visit-view');
            if(idx === "") { container.innerHTML = ''; return; }
            
            const p = appData.patients[idx];
            
            container.innerHTML = `
                <div class="form-group">
                    <label>Keterangan Dokter</label>
                    <textarea id="visit-ket" class="input-field"></textarea>
                    <label>Tanda Tangan Dokter</label>
                    <div style="border:1px solid #ccc; background:#fff;">
                        <canvas id="sig-canvas" width="400" height="200"></canvas>
                    </div>
                    <button onclick="app.clearSig()" class="btn btn-secondary btn-small">Clear Sign</button>
                    <button onclick="app.submitVisit(${idx})" class="btn btn-primary" style="margin-top:10px;">SIMPAN VISIT</button>
                </div>
                <h4>Riwayat Visit</h4>
                ${p.visits.map(v => `<div class="card"><b>${v.date}</b><p>${v.ket}</p><img src="${v.sign}" width="100"/></div>`).join('')}
            `;
            
            setTimeout(() => {
                window.signaturePad = new SignaturePad(document.getElementById('sig-canvas'));
            }, 100);
        }
    },

    clearSig: () => { window.signaturePad.clear(); },

    submitVisit: (pIdx) => {
        if(window.signaturePad.isEmpty()) { Swal.fire('Error', 'Tanda tangan kosong', 'warning'); return; }
        
        const visit = {
            date: new Date().toLocaleString(),
            ket: document.getElementById('visit-ket').value,
            sign: window.signaturePad.toDataURL()
        };
        
        appData.patients[pIdx].visits.push(visit);
        app.saveDB();
        document.getElementById('select-patient-visit').onchange();
        Swal.fire('Sukses', 'Data Visit Tersimpan', 'success');
    },

    // --- PLACEHOLDERS FOR TTV, PROGRAM, THERAPY (Structure similar to above) ---
    renderTTVView: () => { 
        app.populatePatientSelect('select-patient-ttv'); 
        document.getElementById('select-patient-ttv').onchange = (e) => {
            const idx = e.target.value;
            if(idx === "") return;
            const p = appData.patients[idx];
            document.getElementById('ttv-view').innerHTML = `
                <div class="grid-2">
                    <input type="text" id="ttv-td" placeholder="TD" class="input-field">
                    <input type="text" id="ttv-sat" placeholder="Sat" class="input-field">
                    <input type="text" id="ttv-gds" placeholder="GDS" class="input-field">
                </div>
                <button onclick="app.addTTV(${idx})" class="btn btn-primary" style="margin-top:10px">Simpan TTV</button>
                <br><br>
                <table><thead><tr><th>Waktu</th><th>TD</th><th>Sat</th><th>GDS</th></tr></thead>
                <tbody>${p.ttv.map(t => `<tr><td>${t.date}</td><td>${t.td}</td><td>${t.sat}</td><td>${t.gds}</td></tr>`).join('')}</tbody></table>
            `;
        }
    },
    addTTV: (idx) => {
        appData.patients[idx].ttv.push({
            date: new Date().toLocaleString(),
            td: document.getElementById('ttv-td').value,
            sat: document.getElementById('ttv-sat').value,
            gds: document.getElementById('ttv-gds').value
        });
        app.saveDB();
        document.getElementById('select-patient-ttv').onchange({target:{value:idx}});
    },

    // --- EXPORT FUNCTIONS ---
    exportToExcel: () => {
        const ws = XLSX.utils.json_to_sheet(appData.patients.map(p => ({
            Nama: p.biodata.nama,
            Usia: p.biodata.usia,
            Diagnosa: p.diagnosa.diagnosaMasuk,
            Dokter: p.diagnosa.dokter
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Pasien");
        XLSX.writeFile(wb, "MMRC_Data_Pasien.xlsx");
    },

    exportWordPatient: (idx) => {
        const p = appData.patients[idx];
        const content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
            <head><meta charset='utf-8'><title>Export HTML To Doc</title></head>
            <body>
                <h1>DATA PASIEN MMRC</h1>
                <h2>BIODATA</h2>
                <p>Nama: ${p.biodata.nama}</p>
                <p>Usia: ${p.biodata.usia}</p>
                <p>Alamat: ${p.biodata.alamat}</p>
                <h2>MEDIS</h2>
                <p>Diagnosa: ${p.diagnosa.diagnosaMasuk}</p>
                <p>Dokter PJ: ${p.diagnosa.dokter}</p>
                <p>History Fisik: ${p.history.fisik}</p>
            </body>
            </html>
        `;
        const blob = new Blob(['\ufeff', content], {
            type: 'application/msword'
        });
        saveAs(blob, 'Pasien_' + p.biodata.nama + '.doc');
    },

    search: () => {
        const term = document.getElementById('global-search').value.toLowerCase();
        const rows = document.querySelectorAll('#patient-table-body tr');
        rows.forEach(row => {
            const text = row.innerText.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }
};

// Event Listener for Login Form
document.getElementById('login-form').addEventListener('submit', app.login);

// Start
app.init();
