/* js/app.js */

document.addEventListener('DOMContentLoaded', () => {
    // Ambil elemen yang dibutuhkan
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');

    // Fungsi Toggle (Buka/Tutup)
    function toggleSidebar() {
        sidebar.classList.toggle('active');
        overlay.classList.toggle('active');
    }

    // Pasang event listener
    if (menuBtn) {
        menuBtn.addEventListener('click', toggleSidebar);
    }

    // Jika area gelap (overlay) diklik, tutup sidebar
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }
});
