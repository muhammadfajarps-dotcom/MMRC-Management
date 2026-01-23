const app = {
    data: JSON.parse(localStorage.getItem('MMRC_DATA')) || { patients: [] },

    save() {
        localStorage.setItem('MMRC_DATA', JSON.stringify(this.data));
    },

    // --- NAVIGATION ---
    nav(page) {
        this.currentPage = page;
        const container = document.getElementById('main-content');
        document.getElementById('page-title').innerText = page.toUpperCase();
        
        if (page === 'dashboard') this.renderDashboard(container);
        if (page === 'medicine') this.renderMedicine(container);
        if (page === 'crisis') this.renderBPSS(container);
        if (page === 'ttv') this.renderTTV(container);
        if (page === 'visit') this.renderVisit(container);
    },

    // --- SEARCH ---
    search() {
        const q = document.getElementById('global-search').value.toLowerCase();
        document.querySelectorAll('.item-card').forEach(el => {
            el.style.display = el.innerText.toLowerCase().includes(q) ? '' : 'none';
        });
    },

    // --- MEDICINE CRUD ---
    renderMedicine(container) {
        container.innerHTML = `
            <div class="grid gap-6">
                ${this.data.patients.map(p => `
                    <div class="bg-white p-6 rounded-xl shadow-sm item-card">
                        <div class="flex justify-between mb-4">
                            <h3 class="font-bold text-teal-700">${p.registration.name}</h3>
                            <button onclick="app.addMedModal('${p.id}')" class="text-xs bg-teal-600 text-white px-2 py-1 rounded">+ Stok</button>
                        </div>
                        <table class="table-mmrc">
                            <thead><tr><th>Nama Obat</th><th>Stok</th><th>Aksi</th></tr></thead>
                            <tbody>
                                ${(p.medicine_stock || []).map((m, i) => `
                                    <tr>
                                        <td>${m.name}</td>
                                        <td>${m.init - m.used}</td>
                                        <td>
                                            <button onclick="app.editMed('${p.id}', ${i})" class="text-blue-500 mr-2"><i class="fas fa-edit"></i></button>
                                            <button onclick="app.delMed('${p.id}', ${i})" class="text-red-500"><i class="fas fa-trash"></i></button>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // --- BPSS 7 HARI ---
    renderBPSS(container) {
        container.innerHTML = this.data.patients.map(p => `
            <div class="bg-white p-6 rounded-xl mb-6 shadow-sm item-card">
                <h3 class="font-bold mb-4">${p.registration.name} - Monitoring Crisis (H1-H7)</h3>
                <div class="overflow-x-auto">
                    <table class="w-full text-xs border">
                        <tr class="bg-gray-50">
                            <th class="p-2 border">Kategori</th>
                            ${[1,2,3,4,5,6,7].map(h => `<th class="p-2 border">H${h}</th>`).join('')}
                        </tr>
                        ${['Kesehatan', 'Keluarga', 'Sosial', 'Religius'].map(cat => `
                            <tr>
                                <td class="p-2 border font-bold">${cat}</td>
                                ${[1,2,3,4,5,6,7].map(h => `
                                    <td class="p-2 border">
                                        <input type="number" value="${(p.bpss && p.bpss[h]) ? p.bpss[h][cat] || 0 : 0}" 
                                        onchange="app.saveBPSS('${p.id}', ${h}, '${cat}', this.value)"
                                        class="w-full text-center">
                                    </td>
                                `).join('')}
                            </tr>
                        `).join('')}
                    </table>
                </div>
                <div class="mt-4 flex gap-2">
                    <button onclick="app.exportWord('${p.id}')" class="bg-blue-600 text-white px-4 py-2 rounded text-xs">Download Word (.docx)</button>
                </div>
            </div>
        `).join('');
    },

    saveBPSS(pId, day, cat, val) {
        const p = this.data.patients.find(x => x.id === pId);
        if(!p.bpss) p.bpss = {};
        if(!p.bpss[day]) p.bpss[day] = {};
        p.bpss[day][cat] = parseInt(val);
        this.save();
    },

    // --- EXPORT ALL DATA (WORD) ---
    async exportWord(pId) {
        const p = this.data.patients.find(x => x.id === pId);
        const { Document, Packer, Paragraph, TextRun, ImageRun } = docx;

        // Logika pembuatan dokumen kompleks di sini
        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: "LAPORAN RECOVERY PASIEN MMRC", heading: "Heading1" }),
                    new Paragraph({ text: `Nama: ${p.registration.name}` }),
                    new Paragraph({ text: `Usia: ${p.registration.age}` }),
                    new Paragraph({ text: "DATA BPSS 7 HARI", heading: "Heading2" }),
                    // ... tambahkan data loop lainnya
                ]
            }]
        });

        Packer.toBlob(doc).then(blob => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Laporan_${p.registration.name}.docx`;
            a.click();
        });
    },

    // Modal Utils
    openModal() { document.getElementById('modal-container').classList.replace('hidden', 'flex'); },
    closeModal() { document.getElementById('modal-container').classList.replace('flex', 'hidden'); },
    
    login() {
        document.getElementById('auth-layer').classList.add('hidden');
        document.getElementById('app-layer').classList.remove('hidden');
        this.nav('dashboard');
    }
};

window.onload = () => app.nav('dashboard');
