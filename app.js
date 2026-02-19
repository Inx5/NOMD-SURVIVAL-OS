let map, userMarker;
let lastPos = { lat: 40.41, lon: -3.70 };
let strobeInt, strobeActive = false;

function log(msg) { document.getElementById('gps-box').innerText = msg; }

// --- GPS CON FILTRO ---
function forceGPS() {
    navigator.geolocation.getCurrentPosition(p => {
        lastPos.lat = p.coords.latitude.toFixed(6);
        lastPos.lon = p.coords.longitude.toFixed(6);
        document.getElementById('gps-box').innerText = `POS: ${lastPos.lat} , ${lastPos.lon}`;
        if(map) {
            map.setView([lastPos.lat, lastPos.lon], 16);
            if(userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker([lastPos.lat, lastPos.lon], {color: '#00ff41', radius: 10}).addTo(map);
        }
    }, () => log("GPS ERROR: REINTENTANDO..."), {enableHighAccuracy:true});
}

// --- MOTOR STROBE v5 (OPACIDAD HARDWARE) ---
function runStrobe(color) {
    const layer = document.getElementById('strobe-layer');
    if(strobeActive) {
        clearInterval(strobeInt);
        strobeActive = false;
        layer.style.opacity = "0";
        log("BEACON: OFF");
    } else {
        strobeActive = true;
        layer.style.background = color;
        log(`BEACON: ${color.toUpperCase()}`);
        strobeInt = setInterval(() => {
            // Alternamos opacidad en lugar de visibilidad para saltar bloqueos de iOS
            layer.style.opacity = (layer.style.opacity === "1") ? "0" : "1";
        }, 60);
    }
}

async function runMorse() {
    const layer = document.getElementById('strobe-layer');
    layer.style.background = "white";
    const sos = [200,200,200, 600,600,600, 200,200,200];
    for(let ms of sos) {
        layer.style.opacity = "1";
        await new Promise(r => setTimeout(r, ms));
        layer.style.opacity = "0";
        await new Promise(r => setTimeout(r, 200));
    }
}

// --- QR MAPS DIRECTO ---
function generateQR() {
    openMod('m-qr');
    // Generamos enlace directo a Google Maps
    const mapsLink = `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lon}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapsLink)}`;
    document.getElementById('qrcode').innerHTML = `<img src="${url}" style="width:100%">`;
    document.getElementById('qr-data').innerText = "LINK: GOOGLE MAPS POS";
}

// --- DISTANCIA ---
let dTime, dRun = false;
function calcDist() {
    const btn = document.getElementById('dist-btn');
    if(!dRun){ dTime = Date.now(); dRun = true; btn.innerText = "ESPERANDO SONIDO..."; }
    else {
        let m = Math.round(((Date.now() - dTime)/1000) * 343);
        document.getElementById('dist-res').innerText = m + " m";
        dRun = false; btn.innerText = "REPETIR CAPTURA";
    }
}

function openMod(id) {
    document.getElementById(id).style.display = 'flex';
    if(id === 'm-map') {
        if(!map) {
            map = L.map('map', {zoomControl: false}).setView([lastPos.lat, lastPos.lon], 15);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
        }
        setTimeout(() => { map.invalidateSize(); forceGPS(); }, 400);
    }
}

function closeMod() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); if(strobeActive) runStrobe(); }

window.onload = () => {
    setInterval(() => { document.getElementById('timer').innerText = new Date().toLocaleTimeString().slice(0,5); }, 1000);
    forceGPS();
};