class PremiumCardEditor {
    constructor() {
        // Detectar si estamos en Netlify para ajustar la API
        this.isNetlify = window.location.hostname.includes('netlify.app');
        // REEMPLAZA ESTA URL con la dirección real de tu archivo api.php en Hostinger
        this.apiUrl = 'https://marialuz-15-invitacion.kcrsf.com/api.php'; 

        this.images = [];
        this.bgImages = [];
        this.currentBgIndex = 0;
        this.selectedImage = null;
        this.decorations = []; // Ahora es un array para libertad total
        this.dynamicSections = []; // Secciones de scroll infinito
        this.palettes = [
            { bg: '#ff6b9d', text: '#ffffff', accent: '#ffd93d' }, // Rose & Gold
            { bg: '#1a1a1a', text: '#ffffff', accent: '#00d4ff' }, // Dark Cyber
            { bg: '#ffffff', text: '#1a1a1a', accent: '#ff6b9d' }, // Clean White
            { bg: '#6c5ce7', text: '#ffffff', accent: '#a29bfe' }, // Purple Royal
            { bg: '#f1c40f', text: '#1a1a1a', accent: '#e67e22' }, // Sun Gold
            { bg: '#0f172a', text: '#ffffff', accent: '#fbbf24' }, // Navy & Amber
            { bg: '#e5b3a3', text: '#ffffff', accent: '#f7e7ce' }, // Rose Gold Silk
            { bg: '#064e3b', text: '#ffffff', accent: '#34d399' }, // Emerald Luxury
            { bg: '#ff7f50', text: '#ffffff', accent: '#ffe4b5' }, // Peach Fizz
            { bg: '#111827', text: '#ffffff', accent: '#f43f5e' }, // Midnight Ruby
            { bg: '#faf5ff', text: '#581c87', accent: '#d8b4fe' }, // Lavender Mist
            { bg: '#ecfdf5', text: '#064e3b', accent: '#10b981' }, // Mint Garden
            { bg: '#312e81', text: '#ffffff', accent: '#818cf8' }, // Indigo Night
            { bg: '#fff7ed', text: '#7c2d12', accent: '#fb923c' }, // Warm Orange
            { bg: '#1e1b4b', text: '#ffffff', accent: '#e879f9' }, // Galactic Pink
            { bg: '#fdf2f8', text: '#831843', accent: '#f472b6' }  // Strawberry Cream
        ];
        this.particlesEnabled = false;
        this.glitterEnabled = false;
        this.clickCount = 0;
        this.clickTimer = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSavedData();
        this.updateCard();
        this.initParticles();
        this.startBgSlideshow();
        this.renderPalettes();
    }

    bindEvents() {
        // Acceso al panel admin es via F2 (PC) o triple toque (móvil)
        document.getElementById('toggleAdmin').onclick = () => this.toggleAdmin();
        
        document.getElementById('imageUpload').onchange = (e) => this.handleImageUpload(e);
        document.getElementById('bgUpload').onchange = (e) => this.handleBgUpload(e);
        document.getElementById('musicUpload').onchange = (e) => this.handleMusicUpload(e);
        document.getElementById('addDecoration').onchange = (e) => this.handleAddDecoration(e);
        
        // Eventos para las pestañas del panel
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.onclick = () => {
                document.querySelectorAll('.tab-btn, .tab-pane').forEach(el => el.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.add('active');
            };
        });

        ['bgColor','textColor','accentColor','heroTitleInput','customName','customAge','customMessage',
         'fontSelect','cardOpacity','shadowIntensity','musicVolume','particleShape',
         'eventDate', 'countdownDate', 'eventAddress', 'eventMap', 'eventWhatsapp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = () => this.updateCard();
        });
        
        const templateSelect = document.getElementById('templateSelect');
        if (templateSelect) templateSelect.onchange = () => this.updateCard();
        
        const particles = document.getElementById('particles');
        if (particles) particles.onchange = () => this.toggleParticles();
        
        const glitter = document.getElementById('glitter');
        if (glitter) glitter.onchange = () => this.toggleGlitter();
        
        const generateConfig = document.getElementById('generateConfig');
        if (generateConfig) generateConfig.onclick = () => this.generatePermanentConfig();

        // Acceso secreto móvil/táctil: Triple clic/toque sobre la tarjeta
        document.getElementById('landingContent').onclick = () => {
            this.clickCount++;
            clearTimeout(this.clickTimer);
            this.clickTimer = setTimeout(() => { this.clickCount = 0; }, 500);
            
            if (this.clickCount === 3) {
                this.showAdminPrompt();
                this.clickCount = 0;
            }
        };

        // Acceso secreto: Presionar la tecla "F2" para abrir el editor
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F2') {
                e.preventDefault();
                this.showAdminPrompt();
            }
        });
    }

    showAdminPrompt() {
        console.log('showAdminPrompt called via secret access'); // Debugging log
        const pass = prompt('🔐 Panel Admin Premium\n\nContraseña:\nadmin123\n\n(Escribe exactamente)');
        if (pass === 'admin123') {
            this.toggleAdmin();
        } else {
            alert('❌ Acceso denegado');
        }
    }

    toggleAdmin() {
        const panel = document.getElementById('adminPanel');
        if (panel) {
            panel.classList.toggle('show');
            console.log('Admin panel visibility toggled. Current classes:', panel.classList); // Debugging log
        } else {
            console.error('Error: Admin panel element not found in DOM.');
        }
    }

    handleImageUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            if (file.type.startsWith('image/') && file.size < 5000000) { // 5MB max
                const reader = new FileReader();
                reader.onload = (ev) => {
                    this.images.push(ev.target.result);
                    this.selectedImage = ev.target.result;
                    this.renderImageGallery();
                    this.updateCard();
                    this.saveData();
                };
                reader.readAsDataURL(file);
            }
        });
        e.target.value = '';
    }

    handleBgUpload(e) {
        const files = Array.from(e.target.files);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                this.bgImages.push(ev.target.result);
                this.renderBgGallery();
                this.updateBgSlideshowUI();
                this.saveData();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    }

    handleAddDecoration(e) {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.decorations.push({
                src: ev.target.result,
                x: 50, y: 50, scale: 100, rotate: 0
            });
            this.renderDecorationControls();
            this.updateCard();
            this.saveData();
        };
        reader.readAsDataURL(file);
    }

    renderDecorationControls() {
        const container = document.getElementById('decorationControls');
        if (!container) return;
        container.innerHTML = this.decorations.map((d, i) => `
            <div class="decor-control-item">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:10px; font-weight:bold;">Elemento #${i+1}</span>
                    <button onclick="window.editor.removeDecoration(${i})" style="border:none; background:none; cursor:pointer;">🗑️</button>
                </div>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:5px;">
                    <input type="range" min="0" max="100" value="${d.x}" oninput="window.editor.updateDecor(${i}, 'x', this.value)" title="Posición X">
                    <input type="range" min="0" max="100" value="${d.y}" oninput="window.editor.updateDecor(${i}, 'y', this.value)" title="Posición Y">
                    <input type="range" min="20" max="300" value="${d.scale}" oninput="window.editor.updateDecor(${i}, 'scale', this.value)" title="Tamaño">
                    <input type="range" min="-180" max="180" value="${d.rotate}" oninput="window.editor.updateDecor(${i}, 'rotate', this.value)" title="Giro">
                </div>
            </div>
        `).join('');
    }

    updateDecor(index, property, value) {
        this.decorations[index][property] = value;
        this.updateCard();
        this.saveData();
    }

    removeDecoration(index) {
        this.decorations.splice(index, 1);
        this.renderDecorationControls();
        this.updateCard();
        this.saveData();
    }

    renderPalettes() {
        const container = document.getElementById('paletteContainer');
        container.innerHTML = this.palettes.map((p, i) => `
            <div class="palette-item" 
                 style="background: linear-gradient(45deg, ${p.bg} 33%, ${p.accent} 33% 66%, ${p.text} 66%);" 
                 onclick="window.editor.applyPalette(${i})"
                 title="Fondo, Acento y Texto"></div>
        `).join('');
    }

    applyPalette(i) {
        const p = this.palettes[i];
        document.getElementById('bgColor').value = p.bg;
        document.getElementById('textColor').value = p.text;
        document.getElementById('accentColor').value = p.accent;
        this.updateCard();
    }

    addDynamicSection(type) {
        const id = Date.now();
        let content = '';
        let title = '';
        
        if (type === 'text') { title = 'Nuestra Historia'; content = 'Escribe aquí tu mensaje...'; }
        if (type === 'gift') { title = 'Regalos'; content = 'Alias: tu.alias.aqui\nCBU: 000000...'; }
        if (type === 'memories') { title = 'Galería de Recuerdos'; content = ''; }
        if (type === 'image') { title = ''; content = ''; }

        this.dynamicSections.push({ id, type, title, content });
        this.renderDynamicSectionsManager();
        this.updateCard();
    }

    renderDynamicSectionsManager() {
        const container = document.getElementById('dynamicSectionsManager');
        if (!container) return;
        
        container.innerHTML = this.dynamicSections.map((s, i) => `
            <div class="decor-control-item" style="border-left: 4px solid var(--accent-color); margin-bottom:10px; background:#f9f9f9; padding:10px; border-radius:8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                    <span style="font-size:11px; font-weight:bold; color:#666;">BLOQUE: ${s.type.toUpperCase()}</span>
                    <button onclick="window.editor.removeDynamicSection(${i})" style="border:none; background:none; cursor:pointer; font-size:14px;">🗑️</button>
                </div>
                <input type="text" value="${s.title}" placeholder="Título de sección" 
                       oninput="window.editor.updateDynamicSection(${i}, 'title', this.value)" 
                       style="padding:5px 10px; margin-bottom:5px; font-size:13px; border-radius:8px;">
                ${s.type !== 'memories' && s.type !== 'image' ? `
                    <textarea oninput="window.editor.updateDynamicSection(${i}, 'content', this.value)" 
                              style="padding:5px 10px; font-size:13px; height:60px; border-radius:8px;">${s.content}</textarea>
                ` : '<p style="font-size:10px; color:#888;">(Este bloque usa las fotos cargadas en Media)</p>'}
            </div>
        `).join('');
    }

    updateDynamicSection(index, prop, value) {
        this.dynamicSections[index][prop] = value;
        this.updateCard();
    }

    removeDynamicSection(index) {
        this.dynamicSections.splice(index, 1);
        this.renderDynamicSectionsManager();
        this.updateCard();
    }

    renderBgGallery() {
        const gallery = document.getElementById('bgGallery');
        if (gallery) {
            gallery.innerHTML = this.bgImages.map((img, i) => `
                <div style="position:relative; width:60px; height:60px;">
                    <img src="${img}" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
                    <button onclick="event.stopPropagation(); window.editor.removeBgImage(${i})" 
                            style="position:absolute; top:-5px; right:-5px; background:#ff4757; color:white; border:none; border-radius:50%; width:18px; height:18px; cursor:pointer; font-size:10px; display:flex; align-items:center; justify-content:center; border: 2px solid white;">✕</button>
                </div>
            `).join('');
        }
    }

    renderImageGallery() {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;
        if (this.images.length === 0) {
            gallery.innerHTML = '<div style="color:#888; font-size:13px; text-align:center; padding:25px 0;">📸 Sube tu primera foto</div>';
            return;
        }

        gallery.innerHTML = this.images.map((img, i) => `
            <div style="position:relative; width:90px; height:90px;">
                <img src="${img}" class="${this.selectedImage === img ? 'selected' : ''}" 
                     onclick="window.editor.selectImage(${i})">
                <button onclick="event.stopPropagation(); window.editor.removeImage(${i})" 
                        style="position:absolute; top:-5px; right:-5px; background:#ff4757; color:white; border:none; border-radius:50%; width:22px; height:22px; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center; border: 2px solid white; font-weight:bold;">✕</button>
            </div>
        `).join('');
    }

    removeImage(index) {
        const removedImg = this.images[index];
        this.images.splice(index, 1);
        if (this.selectedImage === removedImg) {
            this.selectedImage = this.images.length > 0 ? this.images[0] : null;
        }
        this.renderImageGallery();
        this.updateCard();
        this.saveData();
    }

    removeBgImage(index) {
        this.bgImages.splice(index, 1);
        if (this.currentBgIndex >= this.bgImages.length) {
            this.currentBgIndex = 0;
        }
        this.renderBgGallery();
        this.updateBgSlideshowUI();
        this.saveData();
    }

    selectImage(index) {
        this.selectedImage = this.images[index];
        this.renderImageGallery();
        this.updateCard();
    }

    handleMusicUpload(e) {
        const file = e.target.files[0];
        if (file && file.type.startsWith('audio/') && file.size < 10000000) { // 10MB max
            const reader = new FileReader();
            reader.onload = (ev) => {
                const audio = document.getElementById('bgMusic');
                const currentVol = document.getElementById('musicVolume').value;
                audio.src = ev.target.result;
                audio.volume = currentVol;
                setTimeout(() => audio.play().catch(() => {}), 800);
                document.getElementById('musicList').innerHTML = 
                    `<div style="color:#28a745; font-size:14px; padding:12px; background:#d4edda; border-radius:10px; margin-top:10px; border-left:4px solid #28a745;">✅ ${file.name.slice(0,25)}${file.name.length>25?'...':''}</div>`;
                this.saveData();
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    }

    getTemplateStyles(template) {
        const templates = {
            quince: 'linear-gradient(135deg, #ff6b9d 0%, #c44569 50%, #fecfef 100%)',
            glam: 'linear-gradient(135deg, #ffd93d 0%, #ff6b9d 50%, #fecfef 100%)',
            modern: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            elegant: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
        };
        return templates[template] || templates.quince;
    }

    updateCard() {
        const heroTitle = document.getElementById('heroTitleInput')?.value || '';
        const name = document.getElementById('customName')?.value || '';
        const age = document.getElementById('customAge')?.value || '';
        const message = document.getElementById('customMessage')?.value || '';
        const fontFamily = document.getElementById('fontSelect')?.value || 'inherit';
        const opacity = document.getElementById('cardOpacity')?.value || 1;
        const shadowVal = document.getElementById('shadowIntensity')?.value || 0.5;
        const volume = document.getElementById('musicVolume')?.value || 0.5;

        // Datos de Landing Page
        const eventDate = document.getElementById('eventDate')?.value || 'Próximamente...';
        const eventAddress = document.getElementById('eventAddress')?.value || 'Dirección del salón';
        const eventMap = document.getElementById('eventMap')?.value;
        const eventWhatsapp = document.getElementById('eventWhatsapp')?.value;

        // Actualizar Landing Page UI
        if (document.getElementById('displayDate')) document.getElementById('displayDate').innerText = eventDate;
        if (document.getElementById('displayAddress')) document.getElementById('displayAddress').innerText = eventAddress;
        
        const mapCont = document.getElementById('mapContainer');
        if (mapCont) {
            if(eventMap && eventMap.includes('iframe')) {
                mapCont.innerHTML = eventMap;
            } else if(eventMap) {
                mapCont.innerHTML = `<iframe src="${eventMap}"></iframe>`;
            }
        }

        const rsvp = document.getElementById('rsvpBtn');
        if(rsvp && eventWhatsapp) {
            rsvp.href = `https://wa.me/${eventWhatsapp.replace(/\+/g,'')}?text=Hola! Confirmo mi asistencia a los 15 de ${name}`;
            rsvp.style.display = 'block';
        } else if (rsvp) {
            rsvp.style.display = 'none';
        }

        const bgColor = document.getElementById('bgColor')?.value || '#ff6b9d';
        const txtColor = document.getElementById('textColor')?.value || '#ffffff';
        const accColor = document.getElementById('accentColor')?.value || '#ffd93d';

        // Actualizar visualizadores de HEX en el panel
        if(document.getElementById('hex-bgColor')) document.getElementById('hex-bgColor').innerText = bgColor;
        if(document.getElementById('hex-textColor')) document.getElementById('hex-textColor').innerText = txtColor;
        if(document.getElementById('hex-accentColor')) document.getElementById('hex-accentColor').innerText = accColor;
        
        // Lógica de Contraste Automático
        const contrastColor = this.getContrastYIQ(bgColor);
        document.documentElement.style.setProperty('--text-auto', contrastColor);
        document.documentElement.style.setProperty('--bg-color', bgColor);
        document.documentElement.style.setProperty('--accent-color', accColor);

        // Actualizar Hero Section
        if (document.getElementById('heroTitle')) document.getElementById('heroTitle').innerText = heroTitle || '';
        if (document.getElementById('heroName')) document.getElementById('heroName').innerText = name || '';
        if (document.getElementById('heroAge')) document.getElementById('heroAge').innerText = age || '';
        if (document.getElementById('heroMessage')) document.getElementById('heroMessage').innerHTML = (message || '').replace(/\n/g, '<br>');
        if (document.getElementById('heroImageContainer')) {
            document.getElementById('heroImageContainer').innerHTML = this.selectedImage ? 
                `<img src="${this.selectedImage}" class="card-image">` : '';
        }
        
        // Renderizar Secciones Dinámicas en el Scroll
        const dynamicCont = document.getElementById('dynamicContentContainer');
        if (dynamicCont) {
            dynamicCont.innerHTML = this.dynamicSections.map(s => `
            <section class="memories-section dynamic-block" style="margin-bottom:40px; text-align:center; background: rgba(255,255,255,${opacity * 0.1});">
                ${s.title ? `<h2 class="section-title">${s.title}</h2>` : ''}
                ${s.type === 'text' ? `<p class="card-message">${s.content.replace(/\n/g, '<br>')}</p>` : ''}
                ${s.type === 'gift' ? `
                    <div class="gift-card">
                        <p class="card-message">Si deseas hacerme un regalo, puedes realizar una transferencia:</p>
                        <div class="gift-info" id="gift-val-${s.id}">${s.content}</div>
                        <button class="copy-btn" onclick="window.editor.copyToClipboard('${s.content}')">📋 Copiar Datos</button>
                    </div>
                ` : ''}
                ${s.type === 'memories' ? `
                    <div class="memories-grid">
                        ${this.images.map(img => `
                            <div class="memory-item" style="break-inside: avoid; margin-bottom: 20px;">
                                <img src="${img}" style="width:100%; border-radius:15px; border: 8px solid white; box-shadow: 0 15px 35px rgba(0,0,0,0.2);">
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${s.type === 'image' && this.selectedImage ? `<img src="${this.selectedImage}" style="width:100%; max-width:600px; border-radius:20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">` : ''}
            </section>
            `).join('');
        }

        // Renderizar Decoraciones Libres
        if (document.getElementById('floatingDecorations')) {
            document.getElementById('floatingDecorations').innerHTML = this.decorations.map(d => 
                `<img src="${d.src}" class="free-decoration" style="
                    left: ${d.x}%; 
                    top: ${d.y}%; 
                    width: ${d.scale}px; 
                    transform: translate(-50%, -50%) rotate(${d.rotate}deg);">`
            ).join('');
        }

        document.body.style.fontFamily = fontFamily;
        
        // Actualizar volumen
        const audio = document.getElementById('bgMusic');
        if (audio) audio.volume = volume;

        this.saveData();
        this.startCountdown();
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            alert("✅ Datos copiados al portapapeles");
        });
    }

    // Función para calcular si el color es oscuro o claro
    getContrastYIQ(hexcolor){
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0,2),16);
        const g = parseInt(hexcolor.substr(2,2),16);
        const b = parseInt(hexcolor.substr(4,2),16);
        const yiq = ((r*299)+(g*587)+(b*114))/1000;
        return (yiq >= 128) ? '#1a1a1a' : '#ffffff';
    }

    startCountdown() {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        
        const targetDate = document.getElementById('countdownDate')?.value;
        const section = document.getElementById('countdownSection');
        const timerContainer = document.getElementById('countdownTimer');

        // Si no hay fecha, ocultamos la sección por completo
        if (!targetDate || targetDate === "") {
            if (section) section.style.display = 'none';
            return;
        }

        // Si hay fecha, mostramos la sección
        if (section) section.style.display = 'block';

        const update = () => {
            const now = new Date().getTime();
            const target = new Date(targetDate).getTime();
            const diff = target - now;

            if (diff <= 0) {
                clearInterval(this.countdownInterval);
                if (timerContainer) timerContainer.innerHTML = "<h3 style='color:white; width:100%;'>¡Llegó el momento! 🥳</h3>";
                return;
            }

            // Si el timerContainer tiene el mensaje de "Llegó el momento", restauramos la estructura
            if (timerContainer && !document.getElementById('days')) {
                timerContainer.innerHTML = `
                    <div class="timer-item"><span id="days">00</span><small>Días</small></div>
                    <div class="timer-item"><span id="hours">00</span><small>Hs</small></div>
                    <div class="timer-item"><span id="minutes">00</span><small>Min</small></div>
                    <div class="timer-item"><span id="seconds">00</span><small>Seg</small></div>
                `;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            if (document.getElementById('days')) document.getElementById('days').innerText = String(d).padStart(2, '0');
            if (document.getElementById('hours')) document.getElementById('hours').innerText = String(h).padStart(2, '0');
            if (document.getElementById('minutes')) document.getElementById('minutes').innerText = String(m).padStart(2, '0');
            if (document.getElementById('seconds')) document.getElementById('seconds').innerText = String(s).padStart(2, '0');
        };

        update();
        this.countdownInterval = setInterval(update, 1000);
    }

    async generatePermanentConfig() {
        // Ahora este botón guardará en la nube
        const btn = document.getElementById('generateConfig');
        const originalText = btn.innerText;
        
        try {
            btn.innerText = "⏳ Guardando en la nube...";
            const data = this.getSerializedData();
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                alert("✅ ¡Cambios guardados para todos los invitados!");
            } else {
                const errorText = await response.text();
                throw new Error(`Servidor: ${response.status} - ${errorText}`);
            }
        } catch (e) {
            console.warn('Fallo en guardado remoto:', e);
            if (this.isNetlify) {
                alert("ℹ️ Estás en Netlify (Hosting Estático).\n\nLos cambios se han guardado en este navegador, pero no se verán en otros dispositivos. Para guardado global, necesitas un backend (PHP o Firebase).");
            } else {
                alert("❌ Error de conexión. No se pudo guardar en el servidor.");
            }
        } finally {
            btn.innerText = originalText;
        }
    }

    updateBgSlideshowUI() {
        const container = document.getElementById('bgSlideshow');
        if (this.bgImages.length === 0) {
            container.innerHTML = '';
            return;
        }
        
        container.innerHTML = this.bgImages.map((img, i) => 
            `<div class="bg-slide ${i === 0 ? 'active' : ''}" style="background-image: url(${img})"></div>`
        ).join('');
    }

    startBgSlideshow() {
        setInterval(() => {
            const slides = document.querySelectorAll('.bg-slide');
            if (slides.length < 2) return;
            
            slides[this.currentBgIndex].classList.remove('active');
            this.currentBgIndex = (this.currentBgIndex + 1) % slides.length;
            slides[this.currentBgIndex].classList.add('active');
        }, 6000); // Cambia cada 6 segundos
    }

    toggleParticles() {
        this.particlesEnabled = document.getElementById('particles').checked;
        if (this.particlesEnabled) this.startParticles();
        else this.stopParticles();
    }

    toggleGlitter() {
        this.glitterEnabled = document.getElementById('glitter').checked;
        document.body.classList.toggle('glitter-active', this.glitterEnabled);
    }

    initParticles() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particlesCanvas';
        this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:100;display:none;';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }

    startParticles() {
        this.canvas.style.display = 'block';
        this.particles = [];
        for (let i = 0; i < 80; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.2,
                vy: (Math.random() - 0.5) * 1.2,
                size: Math.random() * 6 + 2,
                opacity: Math.random() * 0.5 + 0.4,
                hue: Math.random() * 60 + 30
            });
        }
        this.animateParticles();
    }

    stopParticles() {
        if (this.canvas) this.canvas.style.display = 'none';
        if (this.animationId) cancelAnimationFrame(this.animationId);
    }

    animateParticles() {
        if (!this.particlesEnabled) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const shape = document.getElementById('particleShape')?.value || 'circle';
        
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
            
            this.ctx.save();
            this.ctx.globalAlpha = p.opacity;
            this.ctx.fillStyle = `hsl(${p.hue}, 100%, 70%)`;
            this.ctx.shadowColor = `hsl(${p.hue}, 100%, 50%)`;
            this.ctx.shadowBlur = 15;
            
            this.ctx.beginPath();
            if(shape === 'star') {
                for(let i=0; i<5; i++) {
                    this.ctx.lineTo(p.x + p.size * Math.cos((18+i*72)*Math.PI/180), p.y - p.size * Math.sin((18+i*72)*Math.PI/180));
                    this.ctx.lineTo(p.x + (p.size/2) * Math.cos((54+i*72)*Math.PI/180), p.y - (p.size/2) * Math.sin((54+i*72)*Math.PI/180));
                }
            } else if(shape === 'heart') {
                const s = p.size;
                this.ctx.moveTo(p.x, p.y + s/4);
                this.ctx.bezierCurveTo(p.x, p.y, p.x - s, p.y, p.x - s, p.y + s/2);
                this.ctx.bezierCurveTo(p.x - s, p.y + s, p.x, p.y + s * 1.3, p.x, p.y + s * 1.5);
                this.ctx.bezierCurveTo(p.x, p.y + s * 1.3, p.x + s, p.y + s, p.x + s, p.y + s/2);
                this.ctx.bezierCurveTo(p.x + s, p.y, p.x, p.y, p.x, p.y + s/4);
            } else if(shape === 'flower') {
                for(let i=0; i<6; i++) {
                    this.ctx.arc(p.x + Math.cos(i*Math.PI/3)*p.size/2, p.y + Math.sin(i*Math.PI/3)*p.size/2, p.size/2, 0, Math.PI*2);
                }
            } else {
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }
            this.ctx.fill();
            this.ctx.restore();
        });
        
        this.animationId = requestAnimationFrame(() => this.animateParticles());
    }

    saveData() {
        try {
            const data = this.getSerializedData();
            const jsonData = JSON.stringify(data);
            localStorage.setItem('tarjeta15Premium_v2', jsonData);
            console.log("💾 Cambios guardados en el navegador");
        } catch (e) {
            console.error("Error al guardar:", e);
            // Si el almacenamiento está lleno (por fotos pesadas), avisamos al usuario
            if (e.name === 'QuotaExceededError' || e.code === 22) {
                alert("⚠️ ¡Espacio lleno! No se pueden guardar más cambios porque las fotos son muy pesadas. Prueba borrando algunas fotos o usando imágenes de menor tamaño.");
            }
        }
    }

    getSerializedData() {
        return {
            images: this.images.slice(0, 20), // Aumentamos un poco el límite de fotos
            bgImages: this.bgImages,
            selectedImage: this.selectedImage,
            decorations: this.decorations,
            dynamicSections: this.dynamicSections,
            settings: {
                bgColor: document.getElementById('bgColor')?.value || '#ff6b9d',
                textColor: document.getElementById('textColor')?.value || '#ffffff',
                accentColor: document.getElementById('accentColor')?.value || '#ffd93d',
                template: document.getElementById('templateSelect')?.value || 'quince',
                particleShape: document.getElementById('particleShape')?.value || 'circle',
                heroTitleInput: document.getElementById('heroTitleInput')?.value || '',
                customName: document.getElementById('customName')?.value || '',
                customAge: document.getElementById('customAge')?.value || '',
                customMessage: document.getElementById('customMessage')?.value || '',
                particles: this.particlesEnabled,
                glitter: this.glitterEnabled,
                fontSelect: document.getElementById('fontSelect')?.value || "'Poppins', sans-serif",
                cardOpacity: document.getElementById('cardOpacity')?.value || 1,
                shadowIntensity: document.getElementById('shadowIntensity')?.value || 0.5,
                musicVolume: document.getElementById('musicVolume')?.value || 0.5,
                eventDate: document.getElementById('eventDate')?.value || '',
                countdownDate: document.getElementById('countdownDate')?.value || '',
                eventAddress: document.getElementById('eventAddress')?.value || '',
                eventMap: document.getElementById('eventMap')?.value || '',
                eventWhatsapp: document.getElementById('eventWhatsapp')?.value || ''
            }
        };
    }

    async loadSavedData() {
        try {
            let data = {};
            console.log("Intentando cargar configuración desde:", this.apiUrl);

            // Solo intentar cargar de la API si no estamos en Netlify o si apiUrl es una URL externa
            if (!this.isNetlify || this.apiUrl.startsWith('http')) {
                try {
                    const response = await fetch(this.apiUrl + '?t=' + Date.now());
                    if (response.ok) {
                        const remoteData = await response.json();
                        if (remoteData && remoteData.settings) {
                            data = remoteData;
                            console.log("✅ Datos cargados desde Hostinger");
                        }
                    }
                } catch (apiError) {
                    console.log("Servidor no disponible, usando copia local.");
                }
            }

            // Si no hay datos de la API, usar localStorage
            if (!data.settings) {
                data = JSON.parse(localStorage.getItem('tarjeta15Premium_v2') || '{}');
            }

            if (data.images) {
                this.images = data.images;
                if (data.selectedImage) this.selectedImage = data.selectedImage;
            }
            if (data.bgImages) this.bgImages = data.bgImages;
            if (data.decorations) {
                this.decorations = Array.isArray(data.decorations) ? data.decorations : [];
                this.renderDecorationControls();
            }
            if (data.dynamicSections) {
                this.dynamicSections = Array.isArray(data.dynamicSections) ? data.dynamicSections : [];
                this.renderDynamicSectionsManager();
            }

            if (data.settings) {
                Object.entries(data.settings).forEach(([key, value]) => {
                    const el = document.getElementById(key);
                    if (el) {
                        if (el.type === 'checkbox') el.checked = value;
                        else el.value = value;
                    }
                });
                this.particlesEnabled = data.settings.particles || false;
                this.glitterEnabled = data.settings.glitter || false;
            }
            this.renderImageGallery();
            this.renderBgGallery();
            this.updateBgSlideshowUI();
            this.updateCard();
            if (this.particlesEnabled) this.startParticles();
            if (this.glitterEnabled) document.body.classList.add('glitter-active');
        } catch(e) {
            console.log('Nueva instalación');
        }
    }
}

// 🚀 INICIO
window.addEventListener('load', () => {
    window.editor = new PremiumCardEditor();
});