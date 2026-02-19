// --- CONFIGURACIÓN ---
let map, userMarker;
let strobeActive = false;
let strobeInterval;
let victims = JSON.parse(localStorage.getItem('nomd_victims')) || [];

function log(msg) {
    const t = document.getElementById('terminal');
    t.innerHTML += `<div>> ${msg}</div>`;
    t.scrollTop = t.scrollHeight;
}

// --- GPS ENGINE (CORREGIDO PARA IPHONE) ---
function forceGPS() {
    log("SOLICITANDO ACCESO GPS...");
    navigator.geolocation.getCurrentPosition(
        p => {
            const lat = p.coords.latitude.toFixed(5);
            const lon = p.coords.longitude.toFixed(5);
            document.getElementById('gps-box').innerText = `${lat}, ${lon}`;
            document.getElementById('gps-box').style.borderColor = "var(--a)";
            log("GPS LOCK: EXITOSO");
            if (map) updateMap(p.coords.latitude, p.coords.longitude);
        },
        e => log("ERROR GPS: " + e.message),
        { enableHighAccuracy: true, timeout: 10000 }
    );
}

function updateMap(lat, lon) {
    if (!map) return;
    map.setView([lat, lon], 16);
    if (userMarker) map.removeLayer(userMarker);
    userMarker = L.marker([lat, lon]).addTo(map).bindPopup("MI POSICIÓN").openPopup();
}

function initMap() {
    if (!map) {
        map = L.map('map', { zoomControl: false }).setView([40.416, -3.703], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
    }
    setTimeout(() => {
        map.invalidateSize();
        forceGPS();
    }, 400);
}

// --- TRIAGE PRO (CAJA NEGRA) ---
function addVictim(status) {
    const v = {
        id: Math.floor(Math.random() * 999),
        time: new Date().toLocaleTimeString().slice(0,5),
        status: status
    };
    victims.unshift(v);
    if (victims.length > 8) victims.pop();
    localStorage.setItem('nomd_victims', JSON.stringify(victims));
    renderVictims();
    log(`VÍCTIMA ${v.id} REGISTRADA: ${status}`);
}

function renderVictims() {
    const container = document.getElementById('victim-log');
    if (victims.length === 0) { container.innerHTML = "No hay registros."; return; }
    container.innerHTML = victims.map(v => `
        <div class="hist-item">
            <span>ID:${v.id} [${v.time}]</span>
            <b style="color:${v.status === 'ROJO' ? 'red' : (v.status === 'AMARILLO' ? 'yellow' : 'lime')}">${v.status}</b>
        </div>
    `).join('');
}

function clearLog() {
    victims = [];
    localStorage.removeItem('nomd_victims');
    renderVictims();
    log("CAJA NEGRA BORRADA");
}

// --- STROBE ENGINE (TOTAL) ---
function toggleStrobe(color) {
    const shell = document.getElementById('app-shell');
    if (strobeActive) {
        clearInterval(strobeInterval);
        strobeActive = false;
        shell.style.background = "var(--bg)";
        log("STROBE DETENIDO");
    } else {
        strobeActive = true;
        log(`STROBE ${color.toUpperCase()} ACTIVO`);
        strobeInterval = setInterval(() => {
            shell.style.background = (shell.style.background === 'black' || shell.style.background === '') ? color : 'black';
        }, 80);
    }
}

// --- SISTEMA DE MODALES ---
function openMod(id) {
    document.getElementById(id).style.display = 'flex';
    if (id === 'm-map') initMap();
    if (id === 'm-med') renderVictims();
}

function closeMod() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    if (strobeActive) toggleStrobe(); // Apagar strobe al salir
}

// --- INICIO ---
window.onload = () => {
    setInterval(() => {
        const d = new Date();
        document.getElementById('timer').innerText = d.getHours().toString().padStart(2,'0') + ":" + d.getMinutes().toString().padStart(2,'0');
    }, 1000);
    forceGPS();
};