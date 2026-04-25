class PremiumCardEditor {
    constructor() {
        // URL actualizada a tu dominio de Hostinger
        this.apiUrl = 'https://marialuz-15-invitacion.kcrsf.com/api.php';
        this.images = [];
        this.bgImages = [];
        this.currentBgIndex = 0;
        this.selectedImage = null;
        this.decorations = []; // Ahora es un array para libertad total
        this.dynamicSections = []; // Secciones de scroll infinito
        this.palettes = [
            { bg: '#ff6b9d', text: '#ffffff', accent: '#ffd93d' },
            { bg: '#1a1a1a', text: '#ffffff', accent: '#00d4ff' },
            { bg: '#ffffff', text: '#1a1a1a', accent: '#ff6b9d' },
            { bg: '#6c5ce7', text: '#ffffff', accent: '#a29bfe' },
            { bg: '#f1c40f', text: '#1a1a1a', accent: '#e67e22' }
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
            <div class="palette-item" style="background: ${p.bg};" onclick="window.editor.applyPalette(${i})"></div>
        `).join('');
    }

    applyPalette(i) {
        const p = this.palettes[i];
        document.getElementById('bgColor').value = p.bg;
        document.getElementById('textColor').value = p.text;
        document.getElementById('accentColor').value = p.accent;
        this.updateCard();
    }

    renderBgGallery() {
        const gallery = document.getElementById('bgGallery');
        if (gallery) {
        gallery.innerHTML = this.bgImages.map(img => `<img src="${img}">`).join('');
        }
    }

    renderImageGallery() {
        const gallery = document.getElementById('imageGallery');
        if (!gallery) return;
        if (this.images.length === 0) {
            gallery.innerHTML = '<div style="color:#888; font-size:13px; text-align:center; padding:25px 0;">📸 Sube tu primera foto</div>';
            return;
        }

        gallery.innerHTML = '';
        this.images.slice(0, 8).forEach((img, i) => {
            const imgEl = document.createElement('img');
            imgEl.src = img;
            imgEl.className = this.selectedImage === img ? 'selected' : '';
            imgEl.title = `Foto ${i + 1}`;
            imgEl.onclick = () => this.selectImage(i);
            gallery.appendChild(imgEl);
        });
        
        // Renderizar Galeria de Recuerdos abajo
        const memGrid = document.getElementById('memoriesGrid');
        if(memGrid) {
            memGrid.innerHTML = this.images.map(img => `
                <div class="memory-item">
                    <img src="${img}" style="width:100%; border-radius:20px; border:5px solid white; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                </div>
            `).join('');
        }
    }

    selectImage(index) {
        this.selectedImage = this.images[index];
        document.querySelectorAll('#imageGallery img').forEach((img, i) => {
            img.classList.toggle('selected', i === index);
        });
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
        
        // Lógica de Contraste Automático
        const contrastColor = this.getContrastYIQ(bgColor);
        document.documentElement.style.setProperty('--text-auto', contrastColor);
        document.documentElement.style.setProperty('--accent-color', bgColor);

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
        const targetDate = document.getElementById('countdownDate').value;
        if (!targetDate) return;

        const update = () => {
            const now = new Date().getTime();
            const diff = new Date(targetDate).getTime() - now;

            if (diff <= 0) {
                clearInterval(this.countdownInterval);
                document.getElementById('countdownTimer').innerHTML = "<h3 style='color:white'>¡Llegó el momento! 🥳</h3>";
                return;
            }

            const d = Math.floor(diff / (1000 * 60 * 60 * 24));
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);

            document.getElementById('days').innerText = String(d).padStart(2, '0');
            document.getElementById('hours').innerText = String(h).padStart(2, '0');
            document.getElementById('minutes').innerText = String(m).padStart(2, '0');
            document.getElementById('seconds').innerText = String(s).padStart(2, '0');
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
            
            if (response.ok) alert("✅ ¡Cambios guardados para todos los invitados!");
            else throw new Error();
        } catch (e) {
            alert("❌ Error al conectar con Hostinger. Revisa la consola.");
        } finally {
            btn.innerText = originalText;
        }
    }

    updateBgSlideshowUI() {
        const container = document.getElementById('bgSlideshow');
        if (this.bgImages.length === 0) return;
        
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
        const data = this.getSerializedData();
        localStorage.setItem('tarjeta15Premium_v2', JSON.stringify(data));
    }

    getSerializedData() {
        return {
            images: this.images.slice(0, 12),
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
            // Primero intentamos cargar de la base de datos (Hostinger)
            let data = {};
            // Añadimos un pequeño timestamp para evitar que el navegador guarde una copia vieja (cache)
            const response = await fetch(this.apiUrl + '?t=' + Date.now());
            
            if (response.ok) {
                const remoteData = await response.json();
                // Si los datos remotos tienen contenido, los usamos
                data = (remoteData && remoteData.settings && Object.keys(remoteData.settings).length > 0) ? remoteData : JSON.parse(localStorage.getItem('tarjeta15Premium_v2') || '{}');
            } else {
                // Si falla la nube, usamos localStorage como respaldo
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