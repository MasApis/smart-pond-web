import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";
import { getDatabase, ref, onValue, set, get } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-database.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

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
const auth = getAuth(app); 
const googleProvider = new GoogleAuthProvider();

// Selector DOM
const authContainer = document.getElementById("auth-container");
const dashboardContainer = document.getElementById("dashboard-container");
const authForm = document.getElementById("auth-form");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const roleGroup = document.getElementById("role-group");
const authRole = document.getElementById("auth-role");
const tokenGroup = document.getElementById("token-group");
const authToken = document.getElementById("auth-token");
const btnAuthSubmit = document.getElementById("btn-auth-submit");
const linkToggleAuth = document.getElementById("link-toggle-auth");
const authFormTitle = document.getElementById("auth-form-title");
const btnGoogle = document.getElementById("btn-google");

const userDisplayEmail = document.getElementById("user-display-email");
const userDisplayRole = document.getElementById("user-display-role");
const btnLogout = document.getElementById("btn-logout");

const phValueEl = document.getElementById("ph-value");
const phStatusEl = document.getElementById("ph-status");
const phCardEl = document.getElementById("card-ph");
const phTimestampEl = document.getElementById("ph-timestamp");
const controlTitle = document.getElementById("control-title");
const btnKatup = document.getElementById("btn-katup");
const btnPompa = document.getElementById("btn-pompa");

// State Form
let isLoginMode = true; 
let isGooglePendingRegistration = false; // Penanda jika user Google butuh melengkapi data

// ==========================================
// FUNGSI RESET TAMPILAN FORM AUTH
// ==========================================
function resetAuthUI() {
    authForm.reset();
    authEmail.disabled = false;
    authPassword.parentElement.classList.remove("hidden");
    authPassword.required = true;
    document.querySelector(".auth-toggle").classList.remove("hidden");
    document.querySelector(".divider").classList.remove("hidden");
    btnGoogle.classList.remove("hidden");
    
    isGooglePendingRegistration = false;
    isLoginMode = true;
    
    authFormTitle.innerText = "Login Pengguna";
    btnAuthSubmit.innerText = "Masuk";
    linkToggleAuth.innerText = "Daftar di sini";
    document.getElementById("toggle-text").firstChild.textContent = "Belum punya akun? ";
    roleGroup.classList.add("hidden");
    tokenGroup.classList.add("hidden");
}

// ==========================================
// MANAGEMENT STATE FORM (LOGIN / DAFTAR)
// ==========================================
linkToggleAuth.addEventListener("click", (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;

    if (isLoginMode) {
        authFormTitle.innerText = "Login Pengguna";
        btnAuthSubmit.innerText = "Masuk";
        linkToggleAuth.innerText = "Daftar di sini";
        document.getElementById("toggle-text").firstChild.textContent = "Belum punya akun? ";
        roleGroup.classList.add("hidden");
        tokenGroup.classList.add("hidden");
    } else {
        authFormTitle.innerText = "Daftar Akun Baru";
        btnAuthSubmit.innerText = "Daftar";
        linkToggleAuth.innerText = "Login di sini";
        document.getElementById("toggle-text").firstChild.textContent = "Sudah punya akun? ";
        roleGroup.classList.remove("hidden");
        if (authRole.value === "admin") tokenGroup.classList.remove("hidden");
    }
});

authRole.addEventListener("change", () => {
    if (authRole.value === "admin") {
        tokenGroup.classList.remove("hidden");
    } else {
        tokenGroup.classList.add("hidden");
    }
});

// ==========================================
// PROSES LOGIN DENGAN GOOGLE (POPUP)
// ==========================================
btnGoogle.addEventListener("click", () => {
    signInWithPopup(auth, googleProvider).catch((error) => {
        alert("Gagal masuk dengan Google: " + error.message);
    });
});

// ==========================================
// PROSES SUBMIT AUTH (LOGIN, DAFTAR & LANJUTKAN GOOGLE)
// ==========================================
authForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = authEmail.value;
    const password = authPassword.value;
    const role = authRole.value;
    const token = authToken.value;

    // SKENARIO 1: Menyelesaikan pendaftaran dari Google
    if (isGooglePendingRegistration && auth.currentUser) {
        if (role === "admin" && token !== "kolam-lele-pak-achmad") {
            alert("Gagal! Token khusus admin tidak valid atau salah.");
            return;
        }
        
        set(ref(db, "users/" + auth.currentUser.uid), {
            email: auth.currentUser.email,
            role: role
        }).then(() => {
            alert("Pendaftaran akun Google berhasil diselesaikan!");
            updateUIDashboard(auth.currentUser, role);
        }).catch(err => alert("Gagal menyimpan data: " + err.message));
        return; // Hentikan eksekusi di sini
    }

    // SKENARIO 2 & 3: Login biasa atau Daftar manual pakai email
    if (isLoginMode) {
        signInWithEmailAndPassword(auth, email, password)
            .catch(error => alert("Gagal Login: Cek kembali email dan password."));
    } else {
        if (role === "admin" && token !== "kolam-lele-pak-achmad") {
            alert("Gagal! Token khusus admin tidak valid atau salah.");
            return;
        }

        createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                const user = userCredential.user;
                return set(ref(db, "users/" + user.uid), {
                    email: email,
                    role: role
                });
            })
            .then(() => {
                alert("Akun berhasil didaftarkan!");
                resetAuthUI();
            })
            .catch(error => alert("Gagal Mendaftar: " + error.message));
    }
});

// ==========================================
// FUNGSI UPDATE UI DASHBOARD (CORE LOGIC)
// ==========================================
function updateUIDashboard(user, userRole) {
    userDisplayEmail.innerText = user.email;
    userDisplayRole.innerText = userRole.toUpperCase();

    if (userRole === "tamu") {
        btnKatup.disabled = true;
        btnPompa.disabled = true;
        controlTitle.innerText = "Panel Kendali Jarak Jauh (Mode View-Only / Tamu)";
        controlTitle.style.color = "#64748b";
    } else if (userRole === "admin") {
        btnKatup.disabled = false;
        btnPompa.disabled = false;
        controlTitle.innerText = "Panel Kendali Jarak Jauh (Mode Akses Admin)";
        controlTitle.style.color = "#0f172a";
    }

    authContainer.classList.add("hidden");
    dashboardContainer.classList.remove("hidden");
}

// ==========================================
// LISTENER STATUS OTENTIKASI & DATABASE
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        get(ref(db, "users/" + user.uid)).then((snapshot) => {
            if (snapshot.exists()) {
                // Akun lama, langsung masuk
                isGooglePendingRegistration = false;
                updateUIDashboard(user, snapshot.val().role);
            } else {
                // Akun BARU dari Google
                isGooglePendingRegistration = true;
                alert("Berhasil terhubung dengan Google! Silakan pilih hak akses untuk menyelesaikan pendaftaran akun Anda.");
                
                // Ubah tampilan form menjadi "Lengkapi Pendaftaran"
                authContainer.classList.remove("hidden");
                dashboardContainer.classList.add("hidden");
                
                authFormTitle.innerText = "Lengkapi Data Akun Google";
                btnAuthSubmit.innerText = "Selesaikan Pendaftaran";
                
                authEmail.value = user.email;
                authEmail.disabled = true; // Kunci input email
                authPassword.parentElement.classList.add("hidden"); // Sembunyikan input password
                authPassword.required = false;
                
                roleGroup.classList.remove("hidden");
                document.querySelector(".auth-toggle").classList.add("hidden"); 
                document.querySelector(".divider").classList.add("hidden");
                btnGoogle.classList.add("hidden");
            }
        });
    } else {
        // Belum login
        authContainer.classList.remove("hidden");
        dashboardContainer.classList.add("hidden");
        resetAuthUI();
    }
});

btnLogout.addEventListener("click", () => {
    signOut(auth).then(() => {
        phChart.data.labels = [];
        phChart.data.datasets[0].data = [];
        phChart.update();
    });
});

// ==========================================
// KONFIGURASI AWAL CHART.JS
// ==========================================
const ctx = document.getElementById('phChart').getContext('2d');
const phChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Tingkat pH',
            data: [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            borderWidth: 3,
            tension: 0.3,
            pointRadius: 4,
            pointBackgroundColor: '#3b82f6',
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: { min: 0, max: 14, ticks: { stepSize: 2 }, grid: { color: '#f1f5f9' } },
            x: { grid: { display: false } }
        },
        plugins: { legend: { display: false } }
    }
});

// ==========================================
// MENGAMBIL DATA SENSOR & KONTROL
// ==========================================
const monitoringRef = ref(db, "monitoring");
onValue(monitoringRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {  // Hapus blokir "hidden" agar data memuat di background
        const ph = data.ph_air;
        phValueEl.innerText = ph.toFixed(1);

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

        const waktuSekarang = new Date();
        const jamString = waktuSekarang.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        phTimestampEl.innerText = `Terakhir diperbarui: ${jamString} WIB`;

        phChart.data.labels.push(jamString);
        phChart.data.datasets[0].data.push(ph);

        if (phChart.data.labels.length > 10) {
            phChart.data.labels.shift();
            phChart.data.datasets[0].data.shift();
        }
        phChart.update();
    }
});

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
    if(btnKatup.disabled) return; 
    const statusSekarang = btnKatup.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_katup"), statusSekarang);
});

btnPompa.addEventListener("click", () => {
    if(btnPompa.disabled) return;
    const statusSekarang = btnPompa.innerText === "ON" ? 0 : 1;
    set(ref(db, "kontrol/saklar_pompa"), statusSekarang);
});