let map, userMarker;
let lastPos = { lat: 0, lon: 0 };
let strobeInt, strobeActive = false;

// --- GPS CORE ---
function forceGPS() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(p => {
        lastPos.lat = p.coords.latitude.toFixed(6);
        lastPos.lon = p.coords.longitude.toFixed(6);
        document.getElementById('gps-box').innerText = `COORD: ${lastPos.lat} , ${lastPos.lon}`;
        if(map) {
            map.setView([lastPos.lat, lastPos.lon], 16);
            if(userMarker) map.removeLayer(userMarker);
            userMarker = L.circleMarker([lastPos.lat, lastPos.lon], {color: '#00ff41', radius: 10}).addTo(map);
        }
    }, null, {enableHighAccuracy:true});
}

// --- MOTOR DE SEÑALES ---
function runStrobe(color) {
    const layer = document.getElementById('strobe-layer');
    if(strobeActive) {
        clearInterval(strobeInt);
        strobeActive = false;
        layer.style.opacity = "0";
    } else {
        strobeActive = true;
        layer.style.background = color;
        strobeInt = setInterval(() => {
            layer.style.opacity = (layer.style.opacity === "1") ? "0" : "1";
        }, 60);
    }
}

const MORSE_CODE = {'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----', ' ': '/'};

async function runCustomMorse() {
    const inputField = document.getElementById('morse-input');
    const input = inputField.value.toUpperCase();
    const layer = document.getElementById('strobe-layer');
    layer.style.background = "white";
    strobeActive = true;

    for (let char of input) {
        let code = MORSE_CODE[char];
        if (!code) continue;
        for (let symbol of code) {
            layer.style.opacity = "1";
            await new Promise(r => setTimeout(r, symbol === '.' ? 200 : 600));
            layer.style.opacity = "0";
            await new Promise(r => setTimeout(r, 200));
        }
        await new Promise(r => setTimeout(r, 400));
    }
    strobeActive = false;
    layer.style.opacity = "0";
}

// --- CALCULADORAS ---
function calcH2O() {
    const t = parseFloat(document.getElementById('h2o-temp').value);
    const a = parseFloat(document.getElementById('h2o-act').value);
    const total = (t * a).toFixed(1);
    document.getElementById('h2o-res').innerText = total + " LITROS";
}

let dTime, dRun = false;
function calcDist() {
    const btn = document.getElementById('dist-btn');
    if(!dRun){ 
        dTime = Date.now(); 
        dRun = true; 
        btn.innerText = "ESPERANDO SONIDO..."; 
    } else {
        let m = Math.round(((Date.now() - dTime)/1000) * 343);
        document.getElementById('dist-res').innerText = m + " m";
        dRun = false; 
        btn.innerText = "FLASH-TO-BANG";
    }
}

// --- MODALES ---
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

function closeMod() { 
    document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); 
}

function generateQR() {
    openMod('m-qr');
    const mapsLink = `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lon}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapsLink)}`;
    document.getElementById('qr-root').innerHTML = `<img src="${url}" style="width:180px; border:10px solid white;"><p style="color:#ffb400; font-size:10px; margin-top:10px;">GOOGLE MAPS LINK</p>`;
}

window.onload = () => {
    setInterval(() => { 
        document.getElementById('timer').innerText = new Date().toLocaleTimeString().slice(0,5); 
    }, 1000);
    forceGPS();
};
