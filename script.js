/**
 * MMRC Management System - Logic
 * Author: AI Assistant
 * Stack: Pure JS + LocalStorage
 */

const STORAGE_KEY = 'mmrc_data';

// --- INITIALIZATION ---
const app = {
    data: {
        patients: []
    },
    currentUser: null,
    signaturePad: null,
    bpssChart: null,

    init: function() {
        // Load data from LocalStorage
        const storedData = localStorage.getItem(STORAGE_KEY);
        if (storedData) {
            this.data = JSON.parse(storedData);
        }
        
        // Init Signature Pad if on visit page
        const canvas = document.getElementById('signature-pad');
        if(canvas) {
            this.signaturePad = new SignaturePad(canvas);
        }

        // Check Login Status (Session only for simple demo)
        if(sessionStorage.getItem('isLoggedIn') === 'true') {
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('app-container').classList.remove('hidden');
            this.showPage('dashboard');
        }
    },

    // --- AUTHENTICATION ---
    login: function() {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const form = document.getElementById('login-form');

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (u === 'OPERASIONAL.MMRC' && p === 'MADANI1999') {
                sessionStorage.setItem('isLoggedIn', 'true');
                document.getElementById('login-page').classList.add('hidden');
                document.getElementById('app-container').classList.remove('hidden');
                this.loadPatientDropdowns();
                this.renderPatientTable();
                Swal.fire('Login Berhasil', 'Selamat datang di MMRC System', 'success');
            } else {
                Swal.fire('Login Gagal', 'Username atau Password salah', 'error');
            }
        });
    },

    logout: function() {
        sessionStorage.clear();
        location.reload();
    },

    // --- NAVIGATION ---
    showPage: function(pageId) {
        document.querySelectorAll('.page-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(pageId).classList.remove('hidden');
        
        document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
        // Highlight logic requires getting element by text or index, simplistic here
        document.getElementById('page-title').innerText = pageId.toUpperCase().replace('-', ' ');
        
        if(pageId !== 'dashboard') {
            this.loadPatientDropdowns();
        }
    },

    // --- CRUD: PATIENT REGISTRATION ---
    savePatient: function(e) {
        e.preventDefault();
        
        const fileInput = document.getElementById('foto-pasien');
        let photoData = "";
        
        // Helper to get value
        const getVal = (id) => document.getElementById(id).value;

        // Process Image to Base64
        if (fileInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = function(event) {
                photoData = event.target.result;
                app.processSavePatientData(photoData);
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            this.processSavePatientData("");
        }
    },

    processSavePatientData: function(photoData) {
        const getVal = (id) => document.getElementById(id).value;
        const getCheck = (id) => document.getElementById(id).checked;

        const newPatient = {
            id: Date.now().toString(),
            timestamp: new Date().toLocaleString(),
            photo: photoData,
            biodata: {
                nama: getVal('nama-pasien'),
                ttl: getVal('ttl'),
                usia: getVal('usia'),
                status: getVal('status-nikah'),
                pekerjaan: getVal('pekerjaan'),
                alamat: getVal('alamat'),
                wali: getVal('wali'),
                spotcheck: getVal('spotcheck')
            },
            riwayat: {
                fisik: getVal('riwayat-fisik'),
                psikis: getVal('riwayat-psikis'),
                diagnosaLalu: getVal('diagnosa-lalu'),
                obatLalu: getVal('riwayat-obat'),
                kondisi: getVal('kondisi-kini')
            },
            diagnosa: {
                dokter: getVal('dokter-pj'),
                utama: getVal('diagnosa-masuk'),
                planning: getVal('planning'),
                tindakan: {
                    injeksi: getCheck('check-injeksi'),
                    urine: getCheck('check-urine'),
                    fiksasi: getCheck('check-fiksasi')
                },
                resepAwal: {
                    nama: getVal('resep-nama'),
                    jumlah: getVal('resep-jml')
                }
            },
            // Initialize empty arrays for other modules
            medicine: [],
            medicineLogs: [],
            ttv: [],
            visits: [],
            crisis: [], // BPSS data
            program: {},
            therapy: []
        };

        this.data.patients.push(newPatient);
        this.saveData();
        this.renderPatientTable();
        document.getElementById('form-registrasi').reset();
        Swal.fire('Sukses', 'Data Pasien Berhasil Disimpan', 'success');
    },

    // --- DATA DISPLAY ---
    renderPatientTable: function() {
        const tbody = document.querySelector('#table-pasien tbody');
        tbody.innerHTML = '';
        this.data.patients.forEach(p => {
            const row = `<tr>
                <td>${p.id.substring(8)}</td>
                <td>${p.biodata.nama}</td>
                <td>${p.diagnosa.utama}</td>
                <td>${p.diagnosa.dokter}</td>
                <td>
                    <button onclick="app.deletePatient('${p.id}')" class="btn-small btn-danger"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
            tbody.innerHTML += row;
        });
    },

    deletePatient: function(id) {
        if(confirm('Hapus data pasien ini?')) {
            this.data.patients = this.data.patients.filter(p => p.id !== id);
            this.saveData();
            this.renderPatientTable();
        }
    },

    searchData: function() {
        const query = document.getElementById('search-dashboard').value.toLowerCase();
        const rows = document.querySelectorAll('#table-pasien tbody tr');
        rows.forEach(row => {
            const name = row.cells[1].innerText.toLowerCase();
            row.style.display = name.includes(query) ? '' : 'none';
        });
    },

    loadPatientDropdowns: function() {
        const selects = document.querySelectorAll('select[id$="-pasien-select"]');
        selects.forEach(select => {
            select.innerHTML = '<option value="">-- Pilih Pasien --</option>';
            this.data.patients.forEach(p => {
                select.innerHTML += `<option value="${p.id}">${p.biodata.nama}</option>`;
            });
        });
    },

    // --- MODULE: MEDICINE ---
    loadMedicineData: function() {
        const pid = document.getElementById('med-pasien-select').value;
        const patient = this.data.patients.find(p => p.id === pid);
        const tbody = document.querySelector('#table-obat tbody');
        const selectLog = document.getElementById('log-nama-obat');
        
        tbody.innerHTML = '';
        selectLog.innerHTML = '<option value="">Pilih Obat</option>';
        document.getElementById('stock-warning').classList.add('hidden');

        if(patient && patient.medicine) {
            patient.medicine.forEach((med, index) => {
                // Render Table
                let rowColor = med.stok <= 7 ? 'style="color:red; font-weight:bold"' : '';
                let row = `<tr>
                    <td>${med.nama}</td>
                    <td ${rowColor}>${med.stok}</td>
                    <td>${med.exp}</td>
                    <td><button onclick="app.deleteMedicine('${pid}', ${index})" class="btn-small btn-danger">X</button></td>
                </tr>`;
                tbody.innerHTML += row;

                // Populate Dropdown for Usage Log
                selectLog.innerHTML += `<option value="${index}">${med.nama}</option>`;

                // Reminder Logic
                if(med.stok <= 7) {
                    const warn = document.getElementById('stock-warning');
                    warn.innerText = `PERINGATAN: Stok obat ${med.nama} menipis (${med.stok})`;
                    warn.classList.remove('hidden');
                }
            });
        }
    },

    addMedicine: function() {
        const pid = document.getElementById('med-pasien-select').value;
        if(!pid) return Swal.fire('Error', 'Pilih Pasien Dulu', 'error');

        const newMed = {
            nama: document.getElementById('obat-nama').value,
            stok: parseInt(document.getElementById('obat-stok').value),
            exp: document.getElementById('obat-exp').value
        };

        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        this.data.patients[pIndex].medicine.push(newMed);
        this.saveData();
        this.loadMedicineData();
        // Clear inputs
        document.getElementById('obat-nama').value = '';
        document.getElementById('obat-stok').value = '';
    },

    useMedicine: function() {
        const pid = document.getElementById('med-pasien-select').value;
        const medIndex = document.getElementById('log-nama-obat').value;
        const jumlah = parseInt(document.getElementById('log-jumlah').value);
        
        if(!pid || medIndex === "") return Swal.fire('Error', 'Data tidak lengkap', 'error');

        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        
        // Reduce Stock
        if(this.data.patients[pIndex].medicine[medIndex].stok >= jumlah) {
            this.data.patients[pIndex].medicine[medIndex].stok -= jumlah;
            
            // Add Log
            const log = {
                timestamp: new Date().toLocaleString(),
                obat: this.data.patients[pIndex].medicine[medIndex].nama,
                jumlah: jumlah,
                pj: document.getElementById('log-pj').value,
                ket: document.getElementById('log-ket').value
            };
            this.data.patients[pIndex].medicineLogs.push(log);
            
            this.saveData();
            this.loadMedicineData();
            Swal.fire('Sukses', 'Penggunaan obat tercatat', 'success');
        } else {
            Swal.fire('Gagal', 'Stok tidak mencukupi', 'error');
        }
    },

    // --- MODULE: TTV ---
    saveTTV: function() {
        const pid = document.getElementById('ttv-pasien-select').value;
        if(!pid) return Swal.fire('Error', 'Pilih Pasien', 'error');

        const ttvData = {
            timestamp: new Date().toLocaleString(),
            td: document.getElementById('ttv-td').value,
            sat: document.getElementById('ttv-sat').value,
            rr: document.getElementById('ttv-rr').value,
            tb: document.getElementById('ttv-tb').value,
            bb: document.getElementById('ttv-bb').value,
            gds: document.getElementById('ttv-gds').value
        };

        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        this.data.patients[pIndex].ttv.push(ttvData);
        this.saveData();
        
        // Simple Render Update (Append to table)
        const tbody = document.querySelector('#table-ttv tbody');
        tbody.innerHTML = `<tr>
            <td>${ttvData.timestamp}</td><td>${ttvData.td}</td><td>${ttvData.sat}</td><td>${ttvData.rr}</td><td>${ttvData.gds}</td>
        </tr>` + tbody.innerHTML;
        
        Swal.fire('Tersimpan', '', 'success');
    },

    // --- MODULE: VISIT (SIGNATURE) ---
    clearSignature: function() {
        this.signaturePad.clear();
    },

    saveVisit: function() {
        const pid = document.getElementById('visit-pasien-select').value;
        if(!pid) return;

        if (this.signaturePad.isEmpty()) {
            return Swal.fire('Warning', 'Tanda tangan dokter diperlukan', 'warning');
        }

        const visitData = {
            timestamp: new Date().toLocaleString(),
            keterangan: document.getElementById('visit-ket').value,
            signature: this.signaturePad.toDataURL(),
            // Photo handling would be similar to registration (Base64)
        };

        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        this.data.patients[pIndex].visits.push(visitData);
        this.saveData();
        Swal.fire('Sukses', 'Data Visit Tersimpan', 'success');
        this.clearSignature();
        document.getElementById('visit-ket').value = '';
    },

    // --- MODULE: CRISIS (BPSS CHART) ---
    loadBPSS: function() {
        const pid = document.getElementById('bpss-pasien-select').value;
        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        const bpssData = this.data.patients[pIndex].crisis; // Array of {day, bio, psy, soc, spi}

        // Prepare Chart Data
        const labels = ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'];
        const dataTotal = [0,0,0,0,0,0,0];

        bpssData.forEach(d => {
            const dayIdx = parseInt(d.day) - 1;
            if(dayIdx >=0 && dayIdx < 7) {
                // Simple average or sum logic for radar? Prompt asks for Total score polygon
                // Calculating average of components for the plot
                const avg = (parseInt(d.bio) + parseInt(d.psy) + parseInt(d.soc) + parseInt(d.spi)) / 4;
                dataTotal[dayIdx] = avg; 
            }
        });

        // Render Chart
        const ctx = document.getElementById('bpssChart').getContext('2d');
        
        if(this.bpssChart) this.bpssChart.destroy();

        this.bpssChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'BPSS Progress (Avg)',
                    data: dataTotal,
                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                    borderColor: 'rgba(39, 174, 96, 1)',
                    borderWidth: 1
                }]
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

    saveBPSS: function() {
        const pid = document.getElementById('bpss-pasien-select').value;
        if(!pid) return;

        const data = {
            day: document.getElementById('bpss-day').value,
            bio: document.getElementById('score-bio').value,
            psy: document.getElementById('score-psy').value,
            soc: document.getElementById('score-soc').value,
            spi: document.getElementById('score-spi').value,
            timestamp: new Date().toLocaleString()
        };

        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        // Remove existing day data if any to overwrite
        this.data.patients[pIndex].crisis = this.data.patients[pIndex].crisis.filter(c => c.day !== data.day);
        
        this.data.patients[pIndex].crisis.push(data);
        this.saveData();
        this.loadBPSS(); // Refresh Chart
        Swal.fire('Saved', 'Score BPSS Updated', 'success');
    },

    // --- MODULE: PROGRAM & THERAPY ---
    saveProgram: function() {
        const pid = document.getElementById('prog-pasien-select').value;
        if(!pid) return;
        const progData = {
            paket: document.getElementById('prog-paket').value,
            durasi: document.getElementById('prog-durasi').value,
            timestamp: new Date().toLocaleString()
        };
        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        this.data.patients[pIndex].program = progData;
        this.saveData();
        document.getElementById('program-display').innerHTML = `Paket: ${progData.paket} | Durasi: ${progData.durasi}`;
    },

    saveTherapy: function() {
        const pid = document.getElementById('tera-pasien-select').value;
        if(!pid) return;
        const note = document.getElementById('tera-note').value;
        const pIndex = this.data.patients.findIndex(p => p.id === pid);
        
        this.data.patients[pIndex].therapy.push({
            date: new Date().toLocaleString(),
            note: note
        });
        this.saveData();
        
        const list = document.getElementById('therapy-list');
        list.innerHTML = `<p><b>${new Date().toLocaleTimeString()}</b>: ${note}</p>` + list.innerHTML;
        document.getElementById('tera-note').value = '';
    },

    // --- CORE: DATA MANAGEMENT ---
    saveData: function() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    },

    exportData: function(type) {
        if(type === 'pasien') {
            // Simple Excel Export using SheetJS
            // Flatten data for nice Excel columns
            const flatData = this.data.patients.map(p => ({
                Nama: p.biodata.nama,
                Usia: p.biodata.usia,
                Diagnosa: p.diagnosa.utama,
                Dokter: p.diagnosa.dokter,
                Masuk: p.timestamp
            }));
            
            const ws = XLSX.utils.json_to_sheet(flatData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pasien");
            XLSX.writeFile(wb, "Data_Pasien_MMRC.xlsx");
        }
    },
    
    // Very Basic HTML-to-Word export logic using Blob
    exportWordVisit: function() {
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header+document.getElementById("visit").innerHTML+footer;
        
        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = 'Laporan_Visit.doc';
        fileDownload.click();
        document.body.removeChild(fileDownload);
    }
};

// --- EVENT LISTENER FOR FORM SUBMIT ---
document.getElementById('form-registrasi').addEventListener('submit', function(e) {
    app.savePatient(e);
});

// Initialize
app.init();
