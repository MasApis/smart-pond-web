// 1. Import library Firebase dari CDN resmi
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js"; // <-- SUDAH BENAR

// 2. Konfigurasi Firebase (Ganti dengan data milik kelompokmu yang didapat dari Langkah 3)
const firebaseConfig = {
    apiKey: "AIzaSyCyaAAyMsGTlf1aozIw3XwJp1ZN56Z4fks",
    authDomain: "smart-pond-web.firebaseapp.com",
    databaseURL: "https://smart-pond-web-default-rtdb.asia-southeast1.firebasedatabase.app/", // <-- TAMBAHKAN BARIS INI
    projectId: "smart-pond-web",
    storageBucket: "smart-pond-web.firebasestorage.app",
    messagingSenderId: "182376136532",
    appId: "1:182376136532:web:ae1def240e2264c2f012c1"
};

// 3. Inisialisasi Koneksi ke Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// 4. Ambil Elemen HTML (DOM) agar bisa dimanipulasi lewat JS
const phValueEl = document.getElementById("ph-value");
const phStatusEl = document.getElementById("ph-status");
const phCardEl = document.getElementById("card-ph");

const turbValueEl = document.getElementById("turbidity-value");
const turbStatusEl = document.getElementById("turbidity-status");
const turbCardEl = document.getElementById("card-turbidity");

const btnKatup = document.getElementById("btn-katup");
const btnPompa = document.getElementById("btn-pompa");

// ==========================================
// TAHAP 1: MEMBACA DATA SENSOR (MONITORING)
// ==========================================
// onValue akan otomatis berjalan SETIAP KALI data di Firebase berubah (Real-time)
const monitoringRef = ref(db, "monitoring");
onValue(monitoringRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // --- LOGIKA PENGONDISIAN SENSOR pH ---
        const ph = data.ph_air;
        phValueEl.innerText = ph.toFixed(1); // Tampilkan 1 angka di belakang koma

        if (ph < 6.5) {
            phStatusEl.innerText = "TERLALU ASAM (BAHAYA)";
            phCardEl.className = "card bahaya"; // Berubah warna jadi merah
        } else if (ph > 8.5) {
            phStatusEl.innerText = "TERLALU BASA (BAHAYA)";
            phCardEl.className = "card bahaya";
        } else {
            phStatusEl.innerText = "AMAN / NORMAL";
            phCardEl.className = "card aman"; // Berubah warna jadi hijau
        }

        // --- LOGIKA PENGONDISIAN SENSOR KEKERUHAN ---
        const kekeruhan = data.kekeruhan_air; // Skala persen 0 - 100%
        turbValueEl.innerText = kekeruhan + "%";

        if (kekeruhan > 80) {
            turbStatusEl.innerText = "AIR KOTOR (BAHAYA)";
            turbCardEl.className = "card bahaya"; // Berubah warna jadi merah
        } else {
            turbStatusEl.innerText = "JERNIH / AMAN";
            turbCardEl.className = "card aman"; // Berubah warna jadi hijau
        }
    }
});

// ==========================================
// TAHAP 2: MENGONTROL TOMBOL REMOTE (KONTROL)
// ==========================================
// Baca status saklar dari Firebase saat pertama kali dibuka agar posisi tombol sinkron
const kontrolRef = ref(db, "kontrol");
onValue(kontrolRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Update tampilan Tombol Katup Pembuangan
        if (data.saklar_katup === 1) {
            btnKatup.innerText = "ON";
            btnKatup.className = "btn btn-on";
        } else {
            btnKatup.innerText = "OFF";
            btnKatup.className = "btn btn-off";
        }

        // Update tampilan Tombol Pompa Pengisi
        if (data.saklar_pompa === 1) {
            btnPompa.innerText = "ON";
            btnPompa.className = "btn btn-on";
        } else {
            btnPompa.innerText = "OFF";
            btnPompa.className = "btn btn-off";
        }
    }
});

// Logika saat Tombol Katup Pembuangan diklik di Web
btnKatup.addEventListener("click", () => {
    // Jika tombol bertuliskan ON, berarti saat diklik kita mau matikan (kirim 0 ke Firebase)
    const statusSekarang = btnKatup.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_katup"), statusSekarang);
});

// Logika saat Tombol Pompa Pengisi diklik di Web
btnPompa.addEventListener("click", () => {
    const statusSekarang = btnPompa.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_pompa"), statusSekarang);
});