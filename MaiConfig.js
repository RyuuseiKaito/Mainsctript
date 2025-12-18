/**
 * MORIKNUS STREAMING - GLOBAL CONFIGURATION
 * Simpan file ini di hosting / paste di <head> sebelum script utama.
 */
const MORIKNUS_CONFIG = {
    // 1. Identitas Website
    siteName: "Moriknus Stream",
    websiteURL: "https://stream.moriknus.web.id", // Tanpa slash di akhir
    
    // 2. Link Eksternal (Action Buttons)
    urls: {
        trakter: "https://trakteer.id/moriknus", // Link Donasi
        report: "https://instagram.com/moriknus", // Link Lapor Error
        telegram: "https://t.me/moriknus_update"  // Opsional
    },

    // 3. Pengaturan Tampilan
    ui: {
        defaultTheme: "dark", // 'dark' atau 'light'
        accentColor: "#00a8ff", // Warna utama tombol/highlight
        enableAnnouncement: true, // Tampilkan bar pengumuman jika ada pesan
        posterRatio: "2/3" // Aspect ratio poster
    },

    // 4. Text & Label
    text: {
        locked: "🔒 Tayang Nanti",
        onAir: "Sedang Tayang",
        newEp: "BARU",
        watchNow: "Nonton Sekarang",
        trailer: "Lihat Trailer",
        episodes: "Daftar Episode",
        synopsis: "Sinopsis",
        cast: "Pemeran"
    }
};
