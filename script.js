const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATABASE')) || { patients: [] },
    currentPage: 'dashboard',

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
            Swal.fire('Gagal', 'Username/Password Salah!', 'error');
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
        const routes = {
            'dashboard': () => this.viewDashboard(container),
            'medicine': () => this.viewMedicine(container),
            'ttv': () => this.viewTTV(container),
            'crisis': () => this.viewCrisis(container)
        };
        if (routes[this.currentPage]) routes[this.currentPage]();
    },

    // --- DASHBOARD & PATIENT MGMT ---
    viewDashboard(container) {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div class="bg-teal-600 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                    <i class="fas fa-users opacity-20 text-8xl absolute -right-4 -bottom-4"></i>
                    <p class="text-xs font-bold opacity-80 uppercase tracking-widest">Total Pasien</p>
                    <h2 class="text-5xl font-black">${this.data.patients.length}</h2>
                </div>
                <button onclick="app.modalPatient()" class="bg-white p-8 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center group hover:border-teal-500 transition-all">
                    <i class="fas fa-user-plus text-3xl text-slate-300 group-hover:text-teal-500 mb-2"></i>
                    <p class="text-xs font-black text-slate-400 group-hover:text-teal-500 uppercase">Tambah Pasien</p>
                </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-[2rem] border shadow-sm">
                        <div class="flex justify-between mb-4">
                            <span class="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">${p.reg.room || 'No Room'}</span>
                            <button onclick="app.delPatient('${p.id}')" class="text-red-200 hover:text-red-500"><i class="fas fa-trash"></i></button>
                        </div>
                        <h4 class="font-black text-xl text-slate-800">${p.reg.name}</h4>
                        <p class="text-[10px] text-slate-400 font-bold mb-6 italic">ID: ${p.id}</p>
                        <button onclick="app.nav('medicine')" class="w-full py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-tighter hover:bg-teal-600 transition-all">Pemeriksaan Lanjut</button>
                    </div>
                `).join('')}
            </div>`;
    },

    modalPatient() {
        document.getElementById('modal-title').innerText = "REGISTRASI PASIEN BARU";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="p_name" class="input-field" placeholder="Nama Lengkap Pasien">
                <input id="p_room" class="input-field" placeholder="Nama Kamar (Contoh: VIP-01)">
                <button onclick="app.savePatient()" class="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold">DAFTARKAN SEKARANG</button>
            </div>`;
        this.openModal();
    },

    savePatient() {
        const name = document.getElementById('p_name').value;
        const room = document.getElementById('p_room').value;
        if(!name) return;
        const newID = 'MMRC-' + Math.random().toString(36).substr(2, 5).toUpperCase();
        this.data.patients.push({
            id: newID,
            reg: { name, room },
            medicine: { stock: [], logs: [] },
            ttv: { logs: [] },
            crisis: { bpss: Array(7).fill(null) }
        });
        this.saveDB(); this.closeModal(); this.render();
        Swal.fire('Berhasil', 'Pasien telah terdaftar', 'success');
    },

    delPatient(id) {
        Swal.fire({
            title: 'Hapus Pasien?',
            text: "Data tidak bisa dikembalikan!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33'
        }).then((result) => {
            if (result.isConfirmed) {
                this.data.patients = this.data.patients.filter(p => p.id !== id);
                this.saveDB(); this.render();
            }
        });
    },

    // --- MODUL OBAT (DARI CODE SEBELUMNYA) ---
    viewMedicine(container) {
        if(this.data.patients.length === 0) return container.innerHTML = "<p class='text-center p-10 font-bold text-slate-400'>Belum ada pasien. Daftarkan di Dashboard.</p>";
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2.5rem] border mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-black text-2xl text-teal-800">${p.reg.name}</h3>
                    <button onclick="app.exportToWord('${p.id}', 'Medicine')" class="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg">WORD REPORT</button>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="flex justify-between mb-4"><span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Stok Obat</span>
                        <button onclick="app.modalMedStock('${p.id}')" class="text-teal-600 font-bold text-xs">+ TAMBAH STOK</button></div>
                        ${p.medicine.stock.map((s, i) => `
                            <div class="p-4 bg-slate-50 rounded-2xl mb-3 border flex justify-between items-center">
                                <div><p class="font-bold">${s.name}</p><p class="text-xs text-slate-400">Sisa: ${s.init - s.used}</p></div>
                                <div class="flex gap-2">
                                    <button onclick="app.modalUseMed('${p.id}', ${i})" class="bg-teal-600 text-white px-3 py-1 rounded-lg text-xs font-bold">PAKAI</button>
                                    <button onclick="app.editMed('${p.id}', ${i})" class="text-amber-500"><i class="fas fa-edit"></i></button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div>
                        <span class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 block">Log Penggunaan</span>
                        <div class="max-h-60 overflow-y-auto space-y-2">
                            ${p.medicine.logs.map((l, i) => `
                                <div class="text-[10px] p-2 border-b flex justify-between">
                                    <span><b>${l.time}</b> - ${l.name} (${l.pj})</span>
                                    <button onclick="app.delSubItem('${p.id}', 'medicine.logs', ${i})" class="text-red-400"><i class="fas fa-trash"></i></button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // --- MODUL CRISIS (BPSS GRID) ---
    viewCrisis(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2.5rem] border mb-6">
                <h3 class="font-black text-xl mb-4">${p.reg.name}</h3>
                <div class="grid grid-cols-2 md:grid-cols-7 gap-4">
                    ${[1,2,3,4,5,6,7].map(day => {
                        const s = p.crisis.bpss[day-1];
                        return `
                        <div onclick="app.modalBPSS('${p.id}', ${day-1})" class="p-4 rounded-3xl cursor-pointer text-center ${s ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}">
                            <p class="text-[9px] font-bold">HARI ${day}</p>
                            <p class="text-2xl font-black">${s ? s.eval : '-'}</p>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        `).join('');
    },

    // --- MODUL TTV ---
    viewTTV(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-8 rounded-[2.5rem] border mb-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="font-black text-xl">${p.reg.name}</h3>
                    <button onclick="app.modalTTV('${p.id}')" class="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold">+ INPUT TTV</button>
                </div>
                <div class="space-y-2">
                    ${p.ttv.logs.map(l => `<div class="p-3 bg-slate-50 rounded-xl text-xs flex justify-between">
                        <span><b>${l.time}</b> | TD: ${l.td} | HR: ${l.nadi} | S: ${l.suhu}</span>
                    </div>`).join('')}
                </div>
            </div>
        `).join('');
    },

    // --- MODALS CORE ---
    openModal() { document.getElementById('modal-container').classList.remove('hidden'); document.getElementById('modal-container').style.display = 'flex'; },
    closeModal() { document.getElementById('modal-container').classList.add('hidden'); },

    modalMedStock(pid) {
        document.getElementById('modal-title').innerText = "INPUT STOK OBAT";
        document.getElementById('modal-body').innerHTML = `
            <div class="space-y-4">
                <input id="ms_name" class="input-field" placeholder="Nama Obat">
                <input id="ms_init" type="number" class="input-field" placeholder="Jumlah Stok">
                <input id="ms_exp" type="date" class="input-field">
                <button onclick="app.saveMedStock('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold">SIMPAN</button>
            </div>`;
        this.openModal();
    },

    modalTTV(pid) {
        document.getElementById('modal-title').innerText = "INPUT TTV";
        document.getElementById('modal-body').innerHTML = `
            <div class="grid grid-cols-2 gap-4">
                <input id="v_td" placeholder="TD" class="input-field">
                <input id="v_nadi" placeholder="Nadi" class="input-field">
                <input id="v_suhu" placeholder="Suhu" class="input-field">
                <input id="v_spo2" placeholder="SpO2" class="input-field">
            </div>
            <button onclick="app.saveTTV('${pid}')" class="w-full bg-teal-600 text-white py-3 rounded-2xl font-bold mt-4">SIMPAN TTV</button>`;
        this.openModal();
    },

    saveTTV(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.ttv.logs.unshift({
            time: new Date().toLocaleString(),
            td: document.getElementById('v_td').value,
            nadi: document.getElementById('v_nadi').value,
            suhu: document.getElementById('v_suhu').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    saveMedStock(pid) {
        const p = this.data.patients.find(x => x.id === pid);
        p.medicine.stock.push({
            name: document.getElementById('ms_name').value,
            init: parseInt(document.getElementById('ms_init').value),
            used: 0,
            exp: document.getElementById('ms_exp').value
        });
        this.saveDB(); this.closeModal(); this.render();
    },

    delSubItem(pid, path, idx) {
        const p = this.data.patients.find(x => x.id === pid);
        const keys = path.split('.');
        p[keys[0]][keys[1]].splice(idx, 1);
        this.saveDB(); this.render();
    }
};

document.addEventListener('DOMContentLoaded', () => { app.render(); });
