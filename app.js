import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, onValue, set } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCyaAAyMsGTlf1aozIw3XwJp1ZN56Z4fks",
    authDomain: "smart-pond-web.firebaseapp.com",
    databaseURL: "https://smart-pond-web-default-rtdb.asia-southeast1.firebasedatabase.app/",
    projectId: "smart-pond-web",
    storageBucket: "smart-pond-web.firebasestorage.app",
    messagingSenderId: "182376136532",
    appId: "1:182376136532:web:ae1def240e2264c2f012c1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Selector Elemen DOM
const phValueEl = document.getElementById("ph-value");
const phStatusEl = document.getElementById("ph-status");
const phCardEl = document.getElementById("card-ph");
const phTimestampEl = document.getElementById("ph-timestamp");

const btnKatup = document.getElementById("btn-katup");
const btnPompa = document.getElementById("btn-pompa");

// ==========================================
// KONFIGURASI AWAL CHART.JS
// ==========================================
const ctx = document.getElementById('phChart').getContext('2d');
const phChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [], // Diisi rentang waktu (X-Axis) secara dinamis
        datasets: [{
            label: 'Tingkat pH',
            data: [], // Diisi nilai pH (Y-Axis) secara dinamis
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderWidth: 3,
            tension: 0.3, // Membuat lengkungan garis lebih smooth/halus
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                min: 0,
                max: 14, // Batas skala pH universal
                ticks: { stepSize: 2 },
                grid: { color: '#f1f5f9' }
            },
            x: {
                grid: { display: false } // Hilangkan grid vertikal agar bersih
            }
        },
        plugins: {
            legend: { display: false } // Sembunyikan label legend atas
        }
    }
});

// ==========================================
// TAHAP 1: MEMBACA DATA SENSOR (MONITORING)
// ==========================================
const monitoringRef = ref(db, "monitoring");
onValue(monitoringRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const ph = data.ph_air;
        phValueEl.innerText = ph.toFixed(1);

        // Pengkondisian Status pH
        if (ph < 6.5) {
            phStatusEl.innerText = "TERLALU ASAM (BAHAYA)";
            phCardEl.className = "card bahaya"; 
        } else if (ph > 8.5) {
            phStatusEl.innerText = "TERLALU BASA (BAHAYA)";
            phCardEl.className = "card bahaya";
        } else {
            phStatusEl.innerText = "AMAN / NORMAL";
            phCardEl.className = "card aman"; 
        }

        // Generator Waktu Waktu Lokal (WIB/Sesuai Perangkat)
        const waktuSekarang = new Date();
        const jamString = waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        phTimestampEl.innerText = `Terakhir diperbarui: ${jamString} WIB`;

        // Push data baru ke dalam Array Chart
        phChart.data.labels.push(jamString);
        phChart.data.datasets[0].data.push(ph);

        // Algoritma Queue: Batasi maksimal 10 poin data yang tampil di layar
        // Jika data > 10, hapus data paling lama agar grafik tidak menumpuk dan berat
        if (phChart.data.labels.length > 10) {
            phChart.data.labels.shift();
            phChart.data.datasets[0].data.shift();
        }

        // Render ulang grafik dengan data terbaru
        phChart.update();
    }
});

// ==========================================
// TAHAP 2: MENGONTROL TOMBOL REMOTE (KONTROL)
// ==========================================
const kontrolRef = ref(db, "kontrol");
onValue(kontrolRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        if (data.saklar_katup === 1) {
            btnKatup.innerText = "ON";
            btnKatup.className = "btn btn-on";
        } else {
            btnKatup.innerText = "OFF";
            btnKatup.className = "btn btn-off";
        }

        if (data.saklar_pompa === 1) {
            btnPompa.innerText = "ON";
            btnPompa.className = "btn btn-on";
        } else {
            btnPompa.innerText = "OFF";
            btnPompa.className = "btn btn-off";
        }
    }
});

btnKatup.addEventListener("click", () => {
    const statusSekarang = btnKatup.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_katup"), statusSekarang);
});

btnPompa.addEventListener("click", () => {
    const statusSekarang = btnPompa.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_pompa"), statusSekarang);
});