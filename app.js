let map, userMarker;
let lastPos = { lat: 0, lon: 0 };
let strobeInt, strobeActive = false;
function forceGPS() {
        if (!navigator.geolocation) {
            document.getElementById('gps-box').innerText = "GPS NO SOPORTADO";
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        // Usamos watchPosition en lugar de getCurrentPosition para forzar al iPhone
        navigator.geolocation.watchPosition(p => {
            gpsOnce = true;
            lastPos.lat = p.coords.latitude;
            lastPos.lon = p.coords.longitude;
            
            const box = document.getElementById('gps-box');
            box.innerText = `POS: ${lastPos.lat.toFixed(4)} | ${lastPos.lon.toFixed(4)}`;
            box.style.color = "var(--g)";
            box.style.borderColor = "var(--g)";
            
            if(map) {
                // Solo centramos el mapa automáticamente la primera vez
                if(!window.firstLoadDone) {
                    map.setView([lastPos.lat, lastPos.lon], 16);
                    window.firstLoadDone = true;
                }
                if(userMarker) map.removeLayer(userMarker);
                userMarker = L.circleMarker([lastPos.lat, lastPos.lon], {
                    color: '#00ff41',
                    radius: 10,
                    fillOpacity: 1,
                    weight: 3
                }).addTo(map);
            }
        }, (error) => {
            const box = document.getElementById('gps-box');
            if(error.code === 1) box.innerText = "BLOQUEADO: VE A AJUSTES > SAFARI";
            else box.innerText = "BUSCANDO SEÑAL GPS...";
            box.style.color = "var(--r)";
        }, options);
    }
    let dTime, dRun = false;
    function calcDist() {
        const b = document.getElementById('dist-btn');
        if(!dRun){ dTime = Date.now(); dRun = true; b.innerText = "PARAR AL OÍR..."; }
        else {
            let m = Math.round(((Date.now() - dTime)/1000) * 343);
            document.getElementById('dist-res').innerText = m + " m";
            dRun = false; b.innerText = "INICIAR CAPTURA";
        }
    }

    function saveBreadcrumb() {
        if(lastPos.lat === 0) return;
        const time = new Date().toLocaleTimeString().slice(0,5);
        breadcrumbs.unshift(`[${time}] ${lastPos.lat.toFixed(4)}, ${lastPos.lon.toFixed(4)}`);
        document.getElementById('breadcrumb-list').innerHTML = breadcrumbs.slice(0,5).join('<br>');
        if(map) L.circleMarker([lastPos.lat, lastPos.lon], {color: '#0066ff', radius: 6}).addTo(map);
    }

    function triageResult(res) {
        let color = res === 'ROJO' ? '#ff4141' : (res === 'AMARILLO' ? '#ffb400' : (res === 'VERDE' ? '#00ff41' : '#555'));
        document.getElementById('triage-step').innerHTML = `<div style="background:${color}; color:#000; padding:10px; font-weight:bold; text-align:center;">${res}</div><button class="btn-action" onclick="location.reload()" style="margin-top:10px;">REINICIAR</button>`;
    }

    function nextTriage(step) {
        const div = document.getElementById('triage-step');
        if(step===1) div.innerHTML = `<p>¿Respira?</p><button class="triage-btn" onclick="nextTriage(2)">SÍ</button><button class="triage-btn" onclick="triageResult('NEGRO')">NO</button>`;
        else if(step===2) div.innerHTML = `<p>Frecuencia > 30/min?</p><button class="triage-btn" onclick="triageResult('ROJO')">SÍ</button><button class="triage-btn" onclick="nextTriage(3)">NO</button>`;
        else if(step===3) div.innerHTML = `<p>¿Pulso presente?</p><button class="triage-btn" onclick="nextTriage(4)">SÍ</button><button class="triage-btn" onclick="triageResult('ROJO')">NO</button>`;
        else if(step===4) div.innerHTML = `<p>¿Obedece órdenes?</p><button class="triage-btn" onclick="nextTriage(5)">SÍ</button><button class="triage-btn" onclick="triageResult('ROJO')">NO</button>`;
    }

    function calcH2O() {
        const p = parseFloat(document.getElementById('h2o-weight').value);
        const f = parseFloat(document.getElementById('h2o-clima').value);
        document.getElementById('h2o-res').innerText = ((p * f) / 1000).toFixed(2) + " L/DÍA";
    }

    function closeMod() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }
    
    window.onload = () => {
        setInterval(() => { document.getElementById('timer').innerText = new Date().toLocaleTimeString().slice(0,5); }, 1000);
        forceGPS();
    };

    let strobeInt, strobeActive = false;
    function runStrobe(c) {
        const l = document.getElementById('strobe-layer');
        if(strobeActive){ clearInterval(strobeInt); strobeActive = false; l.style.opacity = "0"; }
        else { strobeActive = true; l.style.background = c; strobeInt = setInterval(()=>l.style.opacity = l.style.opacity==="1"?"0":"1", 60); }
    }
    async function runCustomMorse() {
        const text = document.getElementById('morse-input').value.toUpperCase();
        const l = document.getElementById('strobe-layer'); l.style.background = "white"; strobeActive = true;
        const M = {'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.', 'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..', 'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.', 'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-', 'Y': '-.--', 'Z': '--..', ' ': '/'};
        for(let char of text){
            let code = M[char]; if(!code) continue;
            for(let s of code){
                l.style.opacity = "1"; await new Promise(r=>setTimeout(r, s==='.'?200:600));
                l.style.opacity = "0"; await new Promise(r=>setTimeout(r, 200));
            }
            await new Promise(r=>setTimeout(r, 400));
        }
        strobeActive = false;
    }
</script>
</body>
</html>


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
    const input = document.getElementById('morse-input').value.toUpperCase();
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

function calcH2O() {
    const t = parseFloat(document.getElementById('h2o-temp').value);
    const a = parseFloat(document.getElementById('h2o-act').value);
    document.getElementById('h2o-res').innerText = (t * a).toFixed(1) + " LITROS";
}

let dTime, dRun = false;
function calcDist() {
    const btn = document.getElementById('dist-btn');
    if(!dRun){ dTime = Date.now(); dRun = true; btn.innerText = "PARAR AL OÍR..."; }
    else {
        let m = Math.round(((Date.now() - dTime)/1000) * 343);
        document.getElementById('dist-res').innerText = m + " metros";
        dRun = false; btn.innerText = "DISTANCIA SONIDO";
    }
}

function generateQR() {
    openMod('m-qr');
    const mapsLink = `https://www.google.com/maps?q=${lastPos.lat},${lastPos.lon}`;
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mapsLink)}`;
    document.getElementById('qr-root').innerHTML = `<img src="${url}" style="width:180px; border:10px solid white;"><p style="color:#ffb400; font-size:10px; margin-top:10px;">ESCANEAME PARA POSICIÓN</p>`;
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
function closeMod() { document.querySelectorAll('.modal').forEach(m => m.style.display = 'none'); }

window.onload = () => {
    setInterval(() => { document.getElementById('timer').innerText = new Date().toLocaleTimeString().slice(0,5); }, 1000);
    forceGPS();

};

