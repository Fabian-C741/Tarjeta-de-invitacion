class PremiumCardEditor {
    constructor() {
        // URL actualizada a tu dominio de Hostinger
        this.apiUrl = 'https://marialuz-15-invitacion.kcrsf.com/api.php';
        this.images = [];
        this.bgImages = [];
        this.currentBgIndex = 0;
        this.selectedImage = null;
        this.decorations = { tl: null, tr: null, bl: null, br: null, ml: null, mr: null };
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
    }

    bindEvents() {
        document.getElementById('adminBtn').onclick = () => this.showAdminPrompt();
        document.getElementById('toggleAdmin').onclick = () => this.toggleAdmin();
        
        document.getElementById('imageUpload').onchange = (e) => this.handleImageUpload(e);
        document.getElementById('bgUpload').onchange = (e) => this.handleBgUpload(e);
        document.getElementById('musicUpload').onchange = (e) => this.handleMusicUpload(e);

        // Bind para cada decoracion
        ['tl','tr','bl','br','ml','mr'].forEach(pos => {
            const el = document.getElementById('up' + pos.toUpperCase());
            if(el) el.onchange = (e) => this.handleSpecificDecor(e, pos);
        });
        
        ['bgColor','textColor','accentColor','customName','customAge','customMessage','customFooter',
         'fontSelect','cardOpacity','shadowIntensity','musicVolume',
         'eventDate', 'eventAddress', 'eventMap', 'eventWhatsapp'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.oninput = () => this.updateCard();
        });
        
        document.getElementById('templateSelect').onchange = () => this.updateCard();
        document.getElementById('particles').onchange = () => this.toggleParticles();
        document.getElementById('glitter').onchange = () => this.toggleGlitter();
        document.getElementById('generateConfig').onclick = () => this.generatePermanentConfig();

        // Acceso secreto móvil/táctil: Triple clic/toque sobre la tarjeta
        document.getElementById('birthdayCard').onclick = () => {
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
        const pass = prompt('🔐 Panel Admin Premium\n\nContraseña:\nadmin123\n\n(Escribe exactamente)');
        if (pass === 'admin123') {
            this.toggleAdmin();
        } else {
            alert('❌ Acceso denegado');
        }
    }

    toggleAdmin() {
        const panel = document.getElementById('adminPanel');
        panel.classList.toggle('show');
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

    handleSpecificDecor(e, pos) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            this.decorations[pos] = ev.target.result;
            this.updateCard();
            this.saveData();
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    }

    renderBgGallery() {
        const gallery = document.getElementById('bgGallery');
        gallery.innerHTML = this.bgImages.map(img => `<img src="${img}">`).join('');
    }

    renderImageGallery() {
        const gallery = document.getElementById('imageGallery');
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
        const card = document.getElementById('birthdayCard');
        const template = document.getElementById('templateSelect').value;
        const name = document.getElementById('customName').value || 'Marialuz';
        const age = document.getElementById('customAge').value || '15';
        const message = document.getElementById('customMessage').value || '¡Feliz Quinceañera!\n\nQue Dios te bendiga siempre\n✨💖✨';
        const footer = document.getElementById('customFooter')?.value || '💖 Hecho con amor 💖';
        const fontFamily = document.getElementById('fontSelect').value;
        const opacity = document.getElementById('cardOpacity').value;
        const shadowVal = document.getElementById('shadowIntensity').value;
        const volume = document.getElementById('musicVolume').value;

        // Datos de Landing Page
        const eventDate = document.getElementById('eventDate').value || 'Próximamente...';
        const eventAddress = document.getElementById('eventAddress').value || 'Dirección del salón';
        const eventMap = document.getElementById('eventMap').value;
        const eventWhatsapp = document.getElementById('eventWhatsapp').value;

        // Actualizar Landing Page UI
        document.getElementById('displayDate').innerText = eventDate;
        document.getElementById('displayAddress').innerText = eventAddress;
        
        const mapCont = document.getElementById('mapContainer');
        if(eventMap && eventMap.includes('iframe')) {
            mapCont.innerHTML = eventMap;
        } else if(eventMap) {
            mapCont.innerHTML = `<iframe src="${eventMap}"></iframe>`;
        }

        const rsvp = document.getElementById('rsvpBtn');
        if(eventWhatsapp) {
            rsvp.href = `https://wa.me/${eventWhatsapp.replace(/\+/g,'')}?text=Hola! Confirmo mi asistencia a los 15 de ${name}`;
            rsvp.style.display = 'block';
        } else {
            rsvp.style.display = 'none';
        }

        const bgColor = document.getElementById('bgColor').value;
        const textColor = document.getElementById('textColor').value;
        
        // Aplicar estilos dinámicos a la tarjeta
        card.style.background = this.getTemplateStyles(template);
        card.style.fontFamily = fontFamily;
        card.style.setProperty('--card-blur', opacity < 1 ? '15px' : '0px');
        card.style.backgroundColor = `rgba(255,255,255,${opacity})`;
        card.style.setProperty('--card-shadow', `0 ${shadowVal * 80}px ${shadowVal * 120}px rgba(0,0,0,${shadowVal})`);
        card.style.setProperty('--accent-color', bgColor);

        // Actualizar volumen
        const audio = document.getElementById('bgMusic');
        if (audio) audio.volume = volume;

        // ESTRUCTURA CENTRO PERFECTA
        card.innerHTML = `
            ${Object.entries(this.decorations).map(([pos, img]) => 
                img ? `<img src="${img}" class="corner-decoration corner-${pos}">` : ''
            ).join('')}
            <div style="display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; min-height: 100%; position: relative; z-index: 2; font-family: inherit;">
                ${this.selectedImage ? `<img src="${this.selectedImage}" class="card-image" alt="Foto" loading="lazy">` : ''}
                <div class="card-title" style="--accent-color: ${bgColor}">¡Feliz</div>
                <div class="card-name" style="color: ${textColor}; text-shadow: 0 10px 40px rgba(0,0,0,0.6);">${name}</div>
                <div class="card-age" style="--accent-color: ${bgColor}"> ${age} </div>
                <div class="card-message" style="color: ${textColor}; text-shadow: 0 6px 30px rgba(0,0,0,0.5);">${message.replace(/\n/g, '<br>')}</div>
                <div class="card-footer" style="color: rgba(255,255,255,0.9)">${footer}</div>
            </div>
        `;

        this.saveData();
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
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
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
            settings: {
                bgColor: document.getElementById('bgColor').value,
                textColor: document.getElementById('textColor').value,
                accentColor: document.getElementById('accentColor').value,
                template: document.getElementById('templateSelect').value,
                customName: document.getElementById('customName').value,
                customAge: document.getElementById('customAge').value,
                customMessage: document.getElementById('customMessage').value,
                customFooter: document.getElementById('customFooter').value,
                particles: this.particlesEnabled,
                glitter: this.glitterEnabled,
                fontSelect: document.getElementById('fontSelect').value,
                cardOpacity: document.getElementById('cardOpacity').value,
                shadowIntensity: document.getElementById('shadowIntensity').value,
                musicVolume: document.getElementById('musicVolume').value,
                eventDate: document.getElementById('eventDate').value,
                eventAddress: document.getElementById('eventAddress').value,
                eventMap: document.getElementById('eventMap').value,
                eventWhatsapp: document.getElementById('eventWhatsapp').value
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
            if (data.decorations) this.decorations = data.decorations;

            if (data.settings) {
                Object.entries(data.settings).forEach(([key, value]) => {
                    const el = document.getElementById(key);
                    if (el) {
                        if (el.type === 'checkbox') el.checked = value;
                        else el.value = value;
                    }
                });
            }
            this.renderImageGallery();
            this.renderBgGallery();
            this.updateBgSlideshowUI();
            this.updateCard();
        } catch(e) {
            console.log('Nueva instalación');
        }
    }
}

// 🚀 INICIO
window.addEventListener('load', () => {
    window.editor = new PremiumCardEditor();
});