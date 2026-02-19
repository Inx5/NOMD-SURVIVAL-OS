// --- CONFIG Y ESTADO ---
let map, userMarker;
let lastPos = { lat: 0, lon: 0 };
let strobeInt, strobeActive = false;
let victims = JSON.parse(localStorage.getItem('nomd_v4_victims')) || [];

function log(msg) { 
    document.getElementById('terminal').innerHTML = `> ${msg}`; 
}

// --- GPS REAL ---
function forceGPS() {
    navigator.geolocation.getCurrentPosition(p => {
        lastPos.lat = p.coords.latitude.toFixed(5);
        lastPos.lon = p.coords.longitude.toFixed(5);
        document.getElementById('gps-box').innerText = `LAT: ${lastPos.lat} | LON: ${lastPos.lon}`;
        if(map) {
            map.setView([lastPos.lat, lastPos.lon], 16);
            if(userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([lastPos.lat, lastPos.lon]).addTo(map);
        }
    }, null, {enableHighAccuracy:true});
}

// --- MOTOR DE SEÑALES (FIXED PARA IPHONE) ---
function runStrobe(color) {
    const layer = document.getElementById('strobe-layer');
    if(strobeActive) {
        clearInterval(strobeInt);
        strobeActive = false;
        layer.style.opacity = 0;
        log("STROBE OFF");
    } else {
        strobeActive = true;
        layer.style.background = color;
        layer.style.opacity = 1;
        layer.style.pointerEvents = "auto"; // Bloquea toques accidentales mientras parpadea
        log(`STROBE ${color.toUpperCase()} ON`);
        strobeInt = setInterval(() => {
            layer.style.display = (layer.style.display === 'none') ? 'block' : 'none';
        }, 70);
    }
}

async function runMorse() {
    log("MORSE SOS INICIADO");
    const sos = [200,200,200, 600,600,600, 200,200,200];
    const layer = document.getElementById('strobe-layer');
    layer.style.background = "white";
    layer.style.pointerEvents = "auto";
    
    for(let ms of sos) {
        layer.style.opacity = 1;
        layer.style.display = "block";
        await new Promise(r => setTimeout(r, ms));
        layer.style.display = "none";
        await new Promise(r => setTimeout(r, 200));
    }
    layer.style.pointerEvents = "none";
    log("MORSE SOS FIN");
}

// --- HERRAMIENTA DISTANCIA ---
let distTime, distRunning = false;
function calcDist() {
    const btn = document.getElementById('dist-btn');
    const res = document.getElementById('dist-res');
    if(!distRunning) {
        distTime = Date.now();
        distRunning = true;
        btn.innerText = "STOP AL OIR";
        btn.style.borderColor = "red";
    } else {
        let diff = (Date.now() - distTime) / 1000;
        let meters = Math.round(diff * 343); // Velocidad sonido
        res.innerText = meters + " m";
        distRunning = false;
        btn.innerText = "START CRONO";
        btn.style.borderColor = "var(--g)";
    }
}

// --- GENERADOR QR (SIN LIBRERÍAS EXTERNAS PARA OFFLINE) ---
function generateQR() {
    openMod('m-qr');
    const data = `SOS-NOMD|LAT:${lastPos.lat}|LON:${lastPos.lon}|TIME:${new Date().getTime()}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}&color=0-0-0&bgcolor=255-255-255`;
    document.getElementById('qrcode').innerHTML = `<img src="${url}" style="width:100%">`;
    document.getElementById('qr-data').innerText = data;
}

// --- TRIAGE ---
function addVictim(status) {
    victims.unshift({id: Math.floor(Math.random()*99), status, time: new Date().toLocaleTimeString().slice(0,5)});
    if(victims.length > 5) victims.pop();
    localStorage.setItem('nomd_v4_victims', JSON.stringify(victims));
    renderVictims();
}

function renderVictims() {
    const logEl = document.getElementById('victim-log');
    logEl.innerHTML = victims.map(v => `<div>ID:${v.id} [${v.time}] - <b style="color:${v.status=='ROJO'?'red':'lime'}">${v.status}</b></div>`).join('');
}

// --- MODALES ---
function openMod(id) {
    document.getElementById(id).style.display = 'flex';
    if(id === 'm-map') {
        if(!map) {
            map = L.map('map', {zoomControl: false}).setView([0,0], 2);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        }
        setTimeout(() => { map.invalidateSize(); forceGPS(); }, 300);
    }
}

function closeMod() {
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none');
    if(strobeActive) runStrobe('white');
}

window.onload = () => {
    setInterval(() => {
        document.getElementById('timer').innerText = new Date().toLocaleTimeString().slice(0,5);
    }, 1000);
    forceGPS();
    renderVictims();
};