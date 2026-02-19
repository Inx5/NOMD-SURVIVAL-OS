// --- CONFIGURACIÓN Y LOGS ---
function log(msg) {
    const el = document.getElementById('log');
    el.innerHTML += `<div>[${new Date().toLocaleTimeString()}] ${msg}</div>`;
    el.scrollTop = el.scrollHeight;
}

// --- RELOJ ---
setInterval(() => { document.getElementById('clock').innerText = new Date().toLocaleTimeString(); }, 1000);

// --- GPS REAL ---
let lastCoords = "Desconocidas";
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(p => {
            const lat = p.coords.latitude.toFixed(5);
            const lon = p.coords.longitude.toFixed(5);
            lastCoords = `${lat}, ${lon}`;
            document.getElementById('gps-display').innerText = `LAT: ${lat} | LON: ${lon}`;
            log("GPS ACTUALIZADO");
        }, e => log("ERROR GPS: " + e.message), {enableHighAccuracy:true});
    }
}

// --- S.O.S REAL (SMS) ---
function triggerSOS() {
    log("INICIANDO PROTOCOLO S.O.S");
    const mensaje = `S.O.S EMERGENCIA! Mi posicion es: https://www.google.com/maps?q=${lastCoords}. NOMD SURVIVAL OS.`;
    // Abre la app de mensajes nativa con el texto listo
    window.location.href = `sms:?body=${encodeURIComponent(mensaje)}`;
    
    // Efecto visual de pánico
    document.body.style.background = "#ff0000";
    setTimeout(() => { document.body.style.background = "#050505"; }, 2000);
}

// --- BRÚJULA PARA IPHONE Y ANDROID ---
function initCompass() {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(state => {
            if (state === 'granted') window.addEventListener('deviceorientation', handleCompass);
        });
    } else {
        window.addEventListener('deviceorientation', handleCompass);
    }
    log("SENSORES ACTIVADOS");
}

function handleCompass(e) {
    let heading = e.webkitCompassHeading || (360 - e.alpha);
    if (heading) {
        document.getElementById('compass-arrow').style.transform = `rotate(${heading}deg)`;
        document.getElementById('heading-val').innerText = Math.round(heading) + "°";
    }
}

// --- TRIAGE START ---
let tStep = 0;
function processTriage(ans) {
    const q = document.getElementById('t-q');
    const res = document.getElementById('t-result');
    const b = document.getElementById('t-btns');

    if (tStep === 0) {
        if (ans) showTriage("VERDE (LEVE)", "#0f0");
        else { q.innerText = "¿Respira?"; tStep = 1; }
    } else if (tStep === 1) {
        if (ans) { q.innerText = "¿Pulso radial?"; tStep = 2; }
        else showTriage("NEGRO (FALLECIDO)", "#444");
    } else if (tStep === 2) {
        if (ans) showTriage("AMARILLO (URGENTE)", "#ff0");
        else showTriage("ROJO (INMEDIATO)", "#f00");
    }
}

function showTriage(txt, col) {
    document.getElementById('t-btns').style.display = 'none';
    document.getElementById('t-q').style.display = 'none';
    const r = document.getElementById('t-result');
    r.style.display = 'block'; r.innerText = txt; r.style.background = col;
    log("TRIAGE: " + txt);
}

function resetTriage() {
    tStep = 0;
    document.getElementById('t-btns').style.display = 'flex';
    document.getElementById('t-q').style.display = 'block';
    document.getElementById('t-q').innerText = "¿Puede caminar?";
    document.getElementById('t-result').style.display = 'none';
}

// --- SEÑALIZACIÓN ---
let strobe = null;
function toggleStrobe() {
    if (strobe) { clearInterval(strobe); strobe = null; document.body.style.background = "#050505"; }
    else { strobe = setInterval(() => { document.body.style.background = (document.body.style.background === 'rgb(255, 255, 255)') ? '#ff0000' : '#ffffff'; }, 100); }
}

async function startMorse() {
    log("MORSE SOS ENVIANDO...");
    try {
        const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}});
        const track = stream.getVideoTracks()[0];
        const sos = [200,200,200,600,600,600,200,200,200];
        for(let ms of sos) {
            track.applyConstraints({advanced:[{torch:true}]});
            await new Promise(r => setTimeout(r, ms));
            track.applyConstraints({advanced:[{torch:false}]});
            await new Promise(r => setTimeout(r, 200));
        }
        track.stop();
    } catch(e) { alert("Flash no disponible"); }
}

// --- MODALES ---
function openModule(id) { document.getElementById(id).style.display = 'flex'; if(id==='map-mod') initMap(); }
function closeModules() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
function toggleNV() { document.body.classList.toggle('night'); }

// --- MAPA ---
let map;
function initMap() {
    if(!map) {
        map = L.map('map').setView([0,0], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        map.locate({setView: true, maxZoom: 16});
    }
}

// --- BOOT ---
window.onload = () => {
    const lines = ["NOMD KERNEL v2.5", "AUTH: GRADO MILITAR", "SENSORES... OK", "GPS... BUSCANDO"];
    let i = 0;
    const interval = setInterval(() => {
        document.getElementById('boot-text').innerHTML += `> ${lines[i]}<br>`;
        i++;
        if(i >= lines.length) {
            clearInterval(interval);
            setTimeout(() => { document.getElementById('boot-screen').style.display='none'; getLocation(); }, 1000);
        }
    }, 400);
};