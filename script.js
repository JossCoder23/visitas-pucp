document.addEventListener("DOMContentLoaded", () => {
    
    // FORMULARIO
    const form = document.querySelector('#my-form-pregrado');

    if (!form) {
        console.error('ERROR: No se encontró el formulario "#my-form-pregrado" en el DOM.');
        return;
    }

    console.log('JavaScript de Evento Padres cargado y formulario detectado.');

    form.addEventListener('submit', async (e) => {
        // Detiene la recarga de la página
        e.preventDefault(); 
        console.log('Envío interceptado en Evento Padres. Procesando datos...');

        // Gestión de estado del botón (UX)
        const submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
        const originalText = submitBtn ? submitBtn.textContent : 'Enviar';
        
        if (submitBtn) {
            submitBtn.textContent = 'Enviando...';
            submitBtn.disabled = true;
        }

        // 2. RECOLECCIÓN DE DATA NATIVA
        const formData = new FormData(form);
        const rawData = Object.fromEntries(formData.entries());

        // =========================================================================
        // 3. OPTIMIZACIÓN CRUCIAL: INYECCIÓN DE IDENTIFICADOR DE CAMPAÑA
        // Asegura que Salesforce clasifique este Lead en "Evento Padres Ori"
        // =========================================================================
        // Nota: Asegúrate de que tu backend en Drupal esté preparado para leer esta key ('origin_landing')
        rawData.origin_landing = 'open-educa'; 
        // Si Salesforce te pide un ID de Campaña específico (tipo 701Hr000...), ponlo aquí:
        // rawData.campaign_id = '701Hr000000xxxxx'; 
        // =========================================================================

        const urlParams = new URLSearchParams(window.location.search);
        const defaults = window.DEFAULT_UTMS || {};
        
        rawData.utm_source = urlParams.get('utm_source') || defaults.source || '';
        rawData.utm_medium = urlParams.get('utm_medium') || defaults.medium || '';
        rawData.utm_campaign = urlParams.get('utm_campaign') || defaults.campaign || '';
        rawData.campaign = urlParams.get('campaign') || defaults.id || '';
        rawData.utm_canal = urlParams.get('utm_canal') || defaults.canal || '';
        rawData.utm_content = urlParams.get('utm_content') || defaults.content || '';
        rawData.utm_term = urlParams.get('utm_term') || defaults.term || '';

        console.log('Payload final a enviar (incluyendo origen):', rawData);

        try {
            // Petición hacia nuestro backend único en Drupal
            const response = await fetch('/api/salesforce/admision/enviar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(rawData)
            });

            const result = await response.json();
            console.log('Respuesta recibida del backend:', result);

            if (response.ok) {
                // Éxito UX: Podrías redirigir a una Thank You Page aquí en lugar de un alert
                window.location.reload();

                // alert('¡Éxito! ' + (result.message || 'Datos procesados correctamente'));
                // form.reset();
                
                // // Si usas el autocompletado global, deberías resetear el borde del input visible manualmente
                // const searchColegio = document.getElementById('search-colegio');
                // if (searchColegio) searchColegio.style.borderColor = '';

            } else {
                console.error("Detalle del error del servidor:", result);
                alert('Contacte al administrador');
            }

        } catch (error) {
            console.error('Error crítico de red o fetch:', error);
            alert('No se pudo conectar con el endpoint de Drupal.');
        } finally {
            // Restauramos el botón
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    });

    const selectTipo = document.getElementById("soy");
    const contenedorDinamico = document.getElementById("contenedor-dinamico");
    
    // Contenedores principales
    const seccionEstudiante = document.getElementById("seccion-estudiante");
    const seccionTutor = document.getElementById("seccion-tutor");
    
    // Contenedores de los inputs (los que se ocultan/muestran)
    const camposEstudiante = document.getElementById("campos-estudiante");
    const camposTutor = document.getElementById("campos-tutor");
    
    // Títulos e Iconos
    const headerEstudiante = document.getElementById("header-estudiante");
    const headerTutor = document.getElementById("header-tutor");
    const tituloTutor = document.getElementById("titulo-tutor");
    const toggleEstudiante = document.getElementById("toggle-estudiante");
    const toggleTutor = document.getElementById("toggle-tutor");

    // Inputs a validar
    const inputsEstudiante = camposEstudiante.querySelectorAll('input:not([type="hidden"]), select');
    const inputsTutor = camposTutor.querySelectorAll('input:not([type="hidden"]), select');

    // Función auxiliar para agregar/quitar 'required'
    function setRequired(inputs, isRequired) {
        inputs.forEach(campo => {
            if (isRequired) campo.setAttribute("required", "true");
            else campo.removeAttribute("required");
        });
    }

    // 1. Lógica principal al seleccionar el tipo de usuario
    selectTipo.addEventListener("change", function() {
        contenedorDinamico.style.display = "flex";
        const tipo = this.value;

        if (tipo === "Postulante") {
            // Estudiante: Arriba, Desplegado, Requerido, Sin Icono "+"
            seccionEstudiante.style.order = "1";
            camposEstudiante.style.display = "flex";
            toggleEstudiante.style.display = "none";
            setRequired(inputsEstudiante, true);
            
            // Tutor: Abajo, Colapsado, NO Requerido, Con Icono "+", Cambio de Título
            seccionTutor.style.order = "2";
            camposTutor.style.display = "none";
            toggleTutor.style.display = "flex";
            toggleTutor.textContent = "+";
            tituloTutor.textContent = "¿Desea agregar acompañante?";
            setRequired(inputsTutor, false);

        } else if (tipo === "Tutor, padre o madre de familia") {
            // Tutor: Arriba, Desplegado, Requerido, Sin Icono "+", Título Original
            seccionTutor.style.order = "1";
            camposTutor.style.display = "flex";
            toggleTutor.style.display = "none";
            tituloTutor.textContent = "Datos del Padre o Apoderado";
            setRequired(inputsTutor, true);
            
            // Estudiante: Abajo, DESPLEGADO, REQUERIDO, SIN Icono "+"
            seccionEstudiante.style.order = "2";
            camposEstudiante.style.display = "flex"; // <-- Ahora está visible por defecto
            toggleEstudiante.style.display = "none";  // <-- Ocultamos el "+"
            setRequired(inputsEstudiante, true);      // <-- Datos del alumno son obligatorios
        }
    });

    // 2. Lógica del Acordeón (Click en el título)
    function toggleSection(camposDiv, toggleIcon) {
        // Solo permitir expandir/colapsar si la sección es opcional (el icono "+" o "-" es visible)
        if (toggleIcon.style.display !== "none") {
            if (camposDiv.style.display === "none") {
                camposDiv.style.display = "flex";
                toggleIcon.textContent = "-";
            } else {
                camposDiv.style.display = "none";
                toggleIcon.textContent = "+";
            }
        }
    }

    headerEstudiante.addEventListener("click", () => toggleSection(camposEstudiante, toggleEstudiante));
    headerTutor.addEventListener("click", () => toggleSection(camposTutor, toggleTutor));

    selectTipo.value = "Postulante";
    selectTipo.dispatchEvent(new Event("change"));

    const btnOpenDisclaimer = document.querySelector('.disclam');
    const btnCloseDisclaimer = document.querySelector('.close-disclaimer');
    const disclaimerContainer = document.querySelector('.disclaimer');

    if (btnOpenDisclaimer && btnCloseDisclaimer && disclaimerContainer) {
        // Abrir disclaimer
        btnOpenDisclaimer.addEventListener('click', () => {
            disclaimerContainer.style.display = 'flex';
        });

        // Cerrar disclaimer
        btnCloseDisclaimer.addEventListener('click', () => {
            disclaimerContainer.style.display = 'none';
        });
    }

    const sliderWrap = document.querySelector('.razonesCtSliderWrap');
    const dots = document.querySelectorAll('.razonesCtSliderButtons span');
    const slides = document.querySelectorAll('.razonesCtSliderWrap__slider');
    
    let currentIndex = 0;
    let startX = 0;
    let currentX = 0;

    // Función unificada para mover el slider
    function moveSlider(index) {
        // Evitar que se salga de los límites (ni antes del primero, ni después del último)
        if (index < 0) index = 0;
        if (index >= slides.length) index = slides.length - 1;
        
        currentIndex = index;
        
        // Mover contenedor usando el cálculo con el gap (1.5rem)
        sliderWrap.style.transform = `translateX(calc(-${currentIndex * 100}% - ${currentIndex * 1.5}rem))`;
        
        // Actualizar el estado visual de los puntos
        document.querySelector('.razonesCtSliderButtons span.active').classList.remove('active');
        dots[currentIndex].classList.add('active');
    }

    // 1. Lógica para los clics en los puntos
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            moveSlider(index);
        });
    });

    // 2. Lógica para deslizar con el dedo (Touch Events)
    sliderWrap.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        currentX = startX; // Inicializar currentX para evitar falsos positivos si solo se hace un "tap"
    }, { passive: true });

    sliderWrap.addEventListener('touchmove', (e) => {
        currentX = e.touches[0].clientX;
    }, { passive: true });

    sliderWrap.addEventListener('touchend', () => {
        let diffX = startX - currentX;

        // Umbral de 50px para considerar que fue un deslizamiento intencional
        if (Math.abs(diffX) > 50) {
            if (diffX > 0) {
                // Deslizó hacia la izquierda -> Mostrar siguiente slide
                moveSlider(currentIndex + 1);
            } else {
                // Deslizó hacia la derecha -> Mostrar slide anterior
                moveSlider(currentIndex - 1);
            }
        }
    });

    document.querySelectorAll('.preguntaCtWrap__title').forEach((title) => {
        title.addEventListener('click', () => {
            const itemActual = title.parentElement; // El contenedor .preguntaCtWrap__ct
            const estaActivo = itemActual.classList.contains('active');

            // 1. Cierra todos los acordeones y restablece sus h2 a "+"
            document.querySelectorAll('.preguntaCtWrap__ct').forEach((item) => {
                item.classList.remove('active');
                const h2 = item.querySelector('.preguntaCtWrap__title h2');
                if (h2) h2.textContent = '+';
            });

            // 2. Si el que se hizo clic NO estaba activo, lo abrimos y cambiamos su h2 a "-"
            if (!estaActivo) {
                itemActual.classList.add('active');
                const h2 = title.querySelector('h2');
                if (h2) h2.textContent = '-';
            }
        });
    });

    // =========================================================================
    // SLIDER DE RUTAS (Scroll Snap + Dots)
    // =========================================================================
    const rutaWrap = document.querySelector('.rutaCtWrap');
    const rutaCards = document.querySelectorAll('.rutaCtCard');
    const rutaDots = document.querySelectorAll('.rutaCtDots .dot');

    if (rutaWrap && rutaDots.length > 0) {
        // 1. Actualizar el dot activo al deslizar (swipe)
        rutaWrap.addEventListener('scroll', () => {
            // Se calcula qué tarjeta está más visible en el viewport del contenedor
            let scrollPos = rutaWrap.scrollLeft;
            let cardTotalWidth = rutaCards[0].offsetWidth + 24; // Ancho + gap (1.5rem ≈ 24px)
            
            // Math.round para detectar la tarjeta central
            let activeIndex = Math.round(scrollPos / cardTotalWidth);

            // Evitar desbordamiento del índice
            if (activeIndex < 0) activeIndex = 0;
            if (activeIndex >= rutaDots.length) activeIndex = rutaDots.length - 1;

            // Actualizar clases
            rutaDots.forEach(dot => dot.classList.remove('active'));
            rutaDots[activeIndex].classList.add('active');
        }, { passive: true });

        // 2. Lógica para los clics en los puntos (mover el scroll)
        rutaDots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                let cardTotalWidth = rutaCards[0].offsetWidth + 24; // Ancho + gap
                let scrollToPosition = index * cardTotalWidth;

                rutaWrap.scrollTo({
                    left: scrollToPosition,
                    behavior: 'smooth'
                });
            });
        });
    }

});