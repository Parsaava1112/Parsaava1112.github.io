(function() {
            const canvas = document.getElementById('spaceCanvas');
            const ctx = canvas.getContext('2d');
            const stars = [];
            const shootingStars = [];
            const MAX_STARS = 80;
            let lastShootingStarTime = 0;

            class TwinklingStar {
                constructor() { this.respawn(); }
                respawn() {
                    this.x = Math.random() * canvas.width;
                    this.y = Math.random() * canvas.height;
                    this.radius = 1 + Math.random()*2;
                    this.twinkleSpeed = 0.02 + Math.random()*0.05;
                    this.lifetime = (3 + Math.random()*3) * 1000;
                    this.birthTime = performance.now();
                }
                update(now) {
                    const age = now - this.birthTime;
                    if (age > this.lifetime) this.respawn();
                    this.opacity = 0.4 + 0.4 * Math.sin(age * this.twinkleSpeed);
                }
                draw(ctx) {
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
                    ctx.fillStyle = `rgba(255,255,255,${this.opacity})`;
                    ctx.fill();
                }
            }

            class ShootingStar { /* ... same as before ... */
                constructor() { this.init(); }
                init() {
                    this.x = canvas.width + Math.random()*100;
                    this.y = Math.random() * canvas.height * 0.5;
                    this.length = 50 + Math.random()*80;
                    this.speed = 0.3 + Math.random()*0.5;
                    const angle = Math.PI/6 + Math.random()*Math.PI/6;
                    this.vx = -Math.cos(angle) * this.speed;
                    this.vy = Math.sin(angle) * this.speed;
                    this.opacity = 0.8 + Math.random()*0.2;
                    this.alive = true;
                }
                update() {
                    this.x += this.vx; this.y += this.vy;
                    this.opacity -= 0.003;
                    if (this.x < -this.length || this.y > canvas.height || this.opacity <= 0) this.alive = false;
                }
                draw(ctx) {
                    ctx.save(); ctx.globalAlpha = this.opacity;
                    ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    const tailX = this.x - this.vx * this.length / this.speed;
                    const tailY = this.y - this.vy * this.length / this.speed;
                    ctx.lineTo(tailX, tailY); ctx.stroke();
                    const gradient = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
                    gradient.addColorStop(0, 'rgba(255,255,255,1)');
                    gradient.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.strokeStyle = gradient; ctx.lineWidth = 2; ctx.stroke();
                    ctx.restore();
                }
            }

            function resize() {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                stars.forEach(star => star.respawn());
                shootingStars.length = 0;
            }
            window.addEventListener('resize', resize);
            resize();

            for (let i=0; i<MAX_STARS; i++) stars.push(new TwinklingStar());

            function animate(timestamp) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                stars.forEach(s => { s.update(timestamp); s.draw(ctx); });
                if (timestamp - lastShootingStarTime > 4000 + Math.random()*2000) {
                    shootingStars.push(new ShootingStar());
                    lastShootingStarTime = timestamp;
                }
                for (let i = shootingStars.length-1; i>=0; i--) {
                    const m = shootingStars[i];
                    m.update();
                    if (!m.alive) shootingStars.splice(i,1);
                    else m.draw(ctx);
                }
                requestAnimationFrame(animate);
            }
            requestAnimationFrame(animate);
        })();

function signIn() {
    window.location.href = "/auth";
}

(function() {
            // ================== داده‌های تصاویر ==================
            // مسیر تصاویر در پوشه static/image قرار دارند
            // برای دمو از تصاویر placeholder استفاده می‌شود
            // کافیست مسیرها را با تصاویر خود جایگزین کنید:
            const slidesData = [
                { src: 'static/image/slide1.jpg' },
                { src: 'static/image/slide2.jpg' },
                { src: 'static/image/slide3.jpg' },
                { src: 'static/image/slide4.jpg' },
                { src: 'static/image/slide5.jpg' },
            ];

            // برای نمایش دمو از تصاویر واقعی استفاده می‌کنیم
            // (در پروژه واقعی این بخش را حذف کنید و از مسیرهای بالا استفاده کنید)
            const DEMO_MODE = false;

            function getImageSrc(index) {
                if (DEMO_MODE) {
                    return demoImages[index % demoImages.length];
                }
                return slidesData[index]?.src || demoImages[index % demoImages.length];
            }

            // ================== عناصر DOM ==================
            const sliderFrame = document.getElementById('sliderFrame');
            const slidesContainer = document.getElementById('slidesContainer');
            const dotsContainer = document.getElementById('dotsContainer');
            const progressFill = document.getElementById('progressFill');
            const counterCurrent = document.getElementById('counterCurrent');
            const counterTotal = document.getElementById('counterTotal');
            const prevBtn = document.getElementById('prevBtn');
            const nextBtn = document.getElementById('nextBtn');
            const pauseIndicator = document.getElementById('pauseIndicator');

            const totalSlides = slidesData.length;
            let currentIndex = 0;
            let isAnimating = false;
            let autoplayTimer = null;
            let progressAnimFrame = null;
            let progressStartTime = null;
            let pausedProgress = 0;
            let isPaused = false;
            let isHovering = false;

            // ================== ساخت اسلایدها ==================
            function createSlides() {
                slidesData.forEach((slideData, index) => {
                    const slideEl = document.createElement('div');
                    slideEl.classList.add('slide');
                    slideEl.setAttribute('data-index', index);
                    slideEl.setAttribute('data-src', getImageSrc(index));

                    const img = document.createElement('img');
                    img.src = getImageSrc(index);
                    img.alt = `Slide ${index + 1}`;
                    img.loading = index < 2 ? 'eager' : 'lazy';
                    img.draggable = false;

                    // کلیک روی تصویر => باز کردن مسیر تصویر
                    slideEl.addEventListener('click', (e) => {
                        // اگر در حال انیمیشن هستیم یا کلیک روی دکمه‌ها بوده نادیده بگیر
                        if (isAnimating) return;
                        if (e.target.closest('.nav-btn') || e.target.closest('.dots-container')) return;
                        const src = slideEl.getAttribute('data-src');
                        if (src) {
                            window.open(src, '_blank');
                        }
                    });

                    slideEl.appendChild(img);
                    slidesContainer.appendChild(slideEl);
                });

                // اولین اسلاید را فعال کن
                const firstSlide = slidesContainer.querySelector('.slide[data-index="0"]');
                if (firstSlide) {
                    firstSlide.classList.add('active');
                }
            }

            // ================== ساخت نقطه‌ها ==================
            function createDots() {
                dotsContainer.innerHTML = '';
                for (let i = 0; i < totalSlides; i++) {
                    const dot = document.createElement('button');
                    dot.classList.add('dot');
                    dot.setAttribute('aria-label', `Slide ${i + 1}`);
                    dot.setAttribute('data-index', i);
                    dot.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (isAnimating) return;
                        const targetIndex = parseInt(dot.getAttribute('data-index'));
                        if (targetIndex === currentIndex) return;
                        goToSlide(targetIndex);
                    });
                    dotsContainer.appendChild(dot);
                }
                updateDots();
            }

            function updateDots() {
                const dots = dotsContainer.querySelectorAll('.dot');
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === currentIndex);
                });
            }

            // ================== شمارنده ==================
            function updateCounter() {
                counterCurrent.textContent = String(currentIndex + 1).padStart(2, '0');
                counterTotal.textContent = String(totalSlides).padStart(2, '0');

                // انیمیشن کوچک
                counterCurrent.style.transform = 'scale(1.3)';
                counterCurrent.style.color = '#fff';
                setTimeout(() => {
                    counterCurrent.style.transform = 'scale(1)';
                    counterCurrent.style.color = '#fff';
                }, 200);
            }

            // ================== نوار پیشرفت ==================
            function resetProgress() {
                progressFill.style.transition = 'none';
                progressFill.style.width = '0%';
                pausedProgress = 0;
                progressStartTime = performance.now();
                // force reflow
                progressFill.offsetHeight;
                progressFill.style.transition = 'width 0.1s linear';
                if (!isPaused && !isHovering) {
                    startProgressLoop();
                }
            }

            function startProgressLoop() {
                if (progressAnimFrame) cancelAnimationFrame(progressAnimFrame);
                if (!progressStartTime) progressStartTime = performance.now();

                function update() {
                    if (isPaused || isHovering) {
                        progressAnimFrame = null;
                        return;
                    }
                    const elapsed = performance.now() - progressStartTime;
                    const duration = 5000;
                    const progress = Math.min((elapsed / duration) * 100, 100);
                    progressFill.style.width = progress + '%';
                    pausedProgress = progress;

                    if (progress < 100) {
                        progressAnimFrame = requestAnimationFrame(update);
                    } else {
                        progressAnimFrame = null;
                    }
                }
                progressAnimFrame = requestAnimationFrame(update);
            }

            function pauseProgress() {
                if (progressAnimFrame) {
                    cancelAnimationFrame(progressAnimFrame);
                    progressAnimFrame = null;
                }
                if (progressStartTime) {
                    const elapsed = performance.now() - progressStartTime;
                    pausedProgress = Math.min((elapsed / 5000) * 100, 100);
                }
                progressFill.style.transition = 'none';
                progressFill.style.width = pausedProgress + '%';
            }

            function resumeProgress() {
                if (isPaused || isHovering) return;
                const remainingFraction = 1 - (pausedProgress / 100);
                const remainingMs = Math.max(remainingFraction * 5000, 50);
                progressStartTime = performance.now() - ((5000 - remainingMs));
                progressFill.style.transition = 'width 0.1s linear';
                startProgressLoop();
            }

            // ================== تغییر اسلاید ==================
            function goToSlide(newIndex, direction = 'forward') {
                if (isAnimating || newIndex === currentIndex) return;
                if (newIndex < 0 || newIndex >= totalSlides) return;

                isAnimating = true;
                const oldIndex = currentIndex;
                currentIndex = newIndex;

                const allSlides = slidesContainer.querySelectorAll('.slide');
                const oldSlide = allSlides[oldIndex];
                const newSlide = allSlides[newIndex];

                // پاک کردن کلاس‌های قبلی
                allSlides.forEach(s => {
                    s.classList.remove(
                        'active', 'exiting-right', 'exiting-left',
                        'entering-from-left', 'entering-from-right', 'animate-in'
                    );
                });

                if (direction === 'forward') {
                    // اسلاید جدید از چپ وارد می‌شود
                    newSlide.classList.add('entering-from-left');
                    oldSlide.classList.add('active'); // قدیمی فعلاً فعال است

                    // force reflow
                    newSlide.offsetHeight;

                    // شروع انیمیشن
                    newSlide.classList.add('animate-in');
                    oldSlide.classList.remove('active');
                    oldSlide.classList.add('exiting-right');
                } else {
                    // جهت معکوس: اسلاید جدید از راست وارد می‌شود
                    newSlide.classList.add('entering-from-right');
                    oldSlide.classList.add('active');

                    // force reflow
                    newSlide.offsetHeight;

                    newSlide.classList.add('animate-in');
                    oldSlide.classList.remove('active');
                    oldSlide.classList.add('exiting-left');
                }

                // به‌روزرسانی UI
                updateDots();
                updateCounter();
                resetProgress();

                // پایان انیمیشن
                const transitionDuration = 750; // ms
                setTimeout(() => {
                    // پاکسازی کامل
                    allSlides.forEach(s => {
                        s.classList.remove(
                            'exiting-right', 'exiting-left',
                            'entering-from-left', 'entering-from-right', 'animate-in'
                        );
                        if (parseInt(s.getAttribute('data-index')) !== currentIndex) {
                            s.style.transform = 'translateX(100%)';
                        }
                    });
                    // اطمینان از فعال بودن اسلاید صحیح
                    const activeSlide = allSlides[currentIndex];
                    activeSlide.classList.add('active');
                    activeSlide.style.transform = 'translateX(0)';
                    isAnimating = false;

                    // اگر در حین انیمیشن hover شده بود، دوباره بررسی کن
                    if (!isHovering && !isPaused) {
                        resetAutoplay();
                    }
                }, transitionDuration + 50);
            }

            function nextSlide() {
                const newIndex = (currentIndex + 1) % totalSlides;
                goToSlide(newIndex, 'forward');
            }

            function prevSlide() {
                const newIndex = (currentIndex - 1 + totalSlides) % totalSlides;
                goToSlide(newIndex, 'backward');
            }

            // ================== اتوپلی ==================
            function startAutoplay() {
                stopAutoplay();
                if (isHovering || isPaused) return;
                autoplayTimer = setTimeout(() => {
                    nextSlide();
                }, 5000);
            }

            function stopAutoplay() {
                if (autoplayTimer) {
                    clearTimeout(autoplayTimer);
                    autoplayTimer = null;
                }
            }

            function resetAutoplay() {
                stopAutoplay();
                progressStartTime = performance.now();
                pausedProgress = 0;
                progressFill.style.transition = 'none';
                progressFill.style.width = '0%';
                progressFill.offsetHeight;
                progressFill.style.transition = 'width 0.1s linear';
                if (!isHovering && !isPaused) {
                    startProgressLoop();
                    startAutoplay();
                }
            }

            // ================== رویدادهای hover ==================
            sliderFrame.addEventListener('mouseenter', () => {
                isHovering = true;
                sliderFrame.classList.add('paused');
                stopAutoplay();
                pauseProgress();
            });

            sliderFrame.addEventListener('mouseleave', () => {
                isHovering = false;
                if (!isPaused) {
                    sliderFrame.classList.remove('paused');
                    resumeProgress();
                    startAutoplay();
                }
            });

            // پشتیبانی از تاچ برای موبایل
            sliderFrame.addEventListener('touchstart', () => {
                isHovering = true;
                sliderFrame.classList.add('paused');
                stopAutoplay();
                pauseProgress();
            }, { passive: true });

            sliderFrame.addEventListener('touchend', () => {
                // کمی تأخیر برای بازگشت
                setTimeout(() => {
                    if (!isPaused) {
                        isHovering = false;
                        sliderFrame.classList.remove('paused');
                        resumeProgress();
                        startAutoplay();
                    }
                }, 1500);
            });

            // ================== دکمه‌ها ==================
            prevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isAnimating) return;
                prevSlide();
            });

            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (isAnimating) return;
                nextSlide();
            });

            // ================== کیبورد ==================
            document.addEventListener('keydown', (e) => {
                // فقط وقتی اسلایدر در دید است
                const rect = sliderFrame.getBoundingClientRect();
                const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
                if (!isVisible) return;

                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!isAnimating) nextSlide();
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!isAnimating) prevSlide();
                } else if (e.key === ' ') {
                    e.preventDefault();
                    togglePause();
                }
            });

            // ================== مکث با کلید فاصله ==================
            function togglePause() {
                isPaused = !isPaused;
                if (isPaused) {
                    sliderFrame.classList.add('paused');
                    stopAutoplay();
                    pauseProgress();
                } else {
                    sliderFrame.classList.remove('paused');
                    if (!isHovering) {
                        resumeProgress();
                        startAutoplay();
                    }
                }
            }

            // دابل‌کلیک برای مکث
            sliderFrame.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                togglePause();
            });

            // ================== swipe برای موبایل ==================
            let touchStartX = 0;
            let touchStartY = 0;
            let touchEndX = 0;
            let touchEndY = 0;

            sliderFrame.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            sliderFrame.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                handleSwipe();
            }, { passive: true });

            function handleSwipe() {
                const diffX = touchEndX - touchStartX;
                const diffY = touchEndY - touchStartY;
                const absDiffX = Math.abs(diffX);
                const absDiffY = Math.abs(diffY);

                // فقط swipe افقی با حداقل فاصله
                if (absDiffX > absDiffY && absDiffX > 50) {
                    if (isAnimating) return;
                    if (diffX < -30) {
                        // swipe به چپ => اسلاید بعدی
                        nextSlide();
                    } else if (diffX > 30) {
                        // swipe به راست => اسلاید قبلی
                        prevSlide();
                    }
                }
            }

            // ================== ذرات پس‌زمینه ==================
            function createParticles() {
                const container = document.getElementById('bgParticles');
                const particleCount = 35;
                for (let i = 0; i < particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.classList.add('bg-particle');
                    const size = Math.random() * 3 + 1.2;
                    particle.style.width = size + 'px';
                    particle.style.height = size + 'px';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.top = Math.random() * 100 + '%';
                    particle.style.animationDuration = (Math.random() * 12 + 10) + 's';
                    particle.style.animationDelay = (Math.random() * 10) + 's';
                    particle.style.opacity = Math.random() * 0.5 + 0.1;
                    container.appendChild(particle);
                }
            }

            // ================== راه‌اندازی ==================
            function init() {
                createParticles();
                createSlides();
                createDots();
                updateCounter();
                counterTotal.textContent = String(totalSlides).padStart(2, '0');
                counterCurrent.textContent = '01';
                progressFill.style.width = '0%';
                progressStartTime = performance.now();
                startProgressLoop();
                startAutoplay();
            }

            init();
        })();

        const form = document.getElementById('contactForm');
    const emailInput = document.getElementById('email');
    const phoneInput = document.getElementById('phone');
    const messageInput = document.getElementById('message');
    const submitBtn = document.getElementById('submitButton');
    const spinner = document.getElementById('spinner');
    const btnText = submitBtn.querySelector('.btn-text');
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    // ----- Helper: Show Toast -----
    function showToast(type, message) {
      const icon = toast.querySelector('i');
      icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
      toast.className = `toast ${type}`;
      toastMessage.textContent = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    }

    // ----- Helper: Validate a single field -----
    function validateField(input, condition) {
      const group = input.closest('.input-group');
      if (!condition) {
        group.classList.add('error');
        return false;
      } else {
        group.classList.remove('error');
        return true;
      }
    }

    // ----- Real-time validation (clear error when user types) -----
    [emailInput, phoneInput, messageInput].forEach(input => {
      input.addEventListener('input', () => {
        const group = input.closest('.input-group');
        if (group.classList.contains('error')) {
          // re-validate only if it was previously in error
          let valid = true;
          if (input === emailInput) {
            valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
          } else if (input === phoneInput) {
            valid = input.value.trim() !== '';
          } else if (input === messageInput) {
            valid = input.value.trim() !== '';
          }
          if (valid) group.classList.remove('error');
        }
      });
    });

    // ----- Form Submission -----
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Validate all fields
      const email = emailInput.value.trim();
      const phone = phoneInput.value.trim();
      const message = messageInput.value.trim();

      const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      const isPhoneValid = phone !== '';
      const isMessageValid = message !== '';

      validateField(emailInput, isEmailValid);
      validateField(phoneInput, isPhoneValid);
      validateField(messageInput, isMessageValid);

      if (!isEmailValid || !isPhoneValid || !isMessageValid) {
        showToast('error', 'Please correct the highlighted fields.');
        return;
      }

      // Disable button & show spinner
      submitBtn.disabled = true;
      spinner.style.display = 'inline-block';
      btnText.textContent = 'Sending...';

      try {
        const response = await fetch('/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, phone, message })
        });

        const data = await response.json();

        if (data.success) {
          showToast('success', data.message);
          form.reset();
          // Remove any leftover error classes
          document.querySelectorAll('.input-group').forEach(g => g.classList.remove('error'));
        } else {
          showToast('error', data.error || 'Something went wrong.');
        }
      } catch (err) {
        showToast('error', 'Network error. Please check your connection.');
      } finally {
        // Re-enable button
        submitBtn.disabled = false;
        spinner.style.display = 'none';
        btnText.textContent = 'Send Message';
      }
    });

    (function() {
            const loaderOverlay = document.getElementById('loaderOverlay');
            const neuralCanvas = document.getElementById('neuralCanvas');
            const ctx = neuralCanvas.getContext('2d');
            const progressFill = document.getElementById('progressFill');
            const progressText = document.getElementById('progressText');
            const mainContent = document.getElementById('mainContent');
            const floatingContainer = document.getElementById('floatingParticlesContainer');

            let width, height;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);

            function resizeNeuralCanvas() {
                width = window.innerWidth;
                height = window.innerHeight;
                neuralCanvas.width = width * dpr;
                neuralCanvas.height = height * dpr;
                neuralCanvas.style.width = width + 'px';
                neuralCanvas.style.height = height + 'px';
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.scale(dpr, dpr);
            }

            window.addEventListener('resize', resizeNeuralCanvas);
            resizeNeuralCanvas();

            const NODE_COUNT = 75;
            const CONNECTION_DISTANCE = 130;
            const nodes = [];

            class NeuralNode {
                constructor() {
                    this.reset();
                    this.x = Math.random() * (width || window.innerWidth);
                    this.y = Math.random() * (height || window.innerHeight);
                }

                reset() {
                    this.x = Math.random() * (width || window.innerWidth);
                    this.y = Math.random() * (height || window.innerHeight);
                    this.vx = (Math.random() - 0.5) * 0.55;
                    this.vy = (Math.random() - 0.5) * 0.55;
                    this.radius = Math.random() * 2.2 + 1.2;
                    this.brightness = Math.random();
                    this.pulsePhase = Math.random() * Math.PI * 2;
                    this.pulseSpeed = 0.01 + Math.random() * 0.03;
                    this.isSpecial = Math.random() < 0.12;
                    if (this.isSpecial) {
                        this.radius = Math.random() * 3 + 2.5;
                        this.brightness = 0.7 + Math.random() * 0.3;
                    }
                }

                update() {
                    this.vx += (Math.random() - 0.5) * 0.03;
                    this.vy += (Math.random() - 0.5) * 0.03;
                    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const maxSpeed = 0.9;
                    if (speed > maxSpeed) {
                        this.vx = (this.vx / speed) * maxSpeed;
                        this.vy = (this.vy / speed) * maxSpeed;
                    }
                    this.vx *= 0.999;
                    this.vy *= 0.999;
                    this.x += this.vx;
                    this.y += this.vy;
                    const margin = 30;
                    if (this.x < -margin) this.x = width + margin;
                    if (this.x > width + margin) this.x = -margin;
                    if (this.y < -margin) this.y = height + margin;
                    if (this.y > height + margin) this.y = -margin;
                    this.pulsePhase += this.pulseSpeed;
                }

                getGlowRadius() {
                    const pulse = Math.sin(this.pulsePhase) * 0.4 + 0.6;
                    return this.radius * (this.isSpecial ? 2.5 : 1) * (0.8 + pulse * 0.4);
                }

                getAlpha() {
                    const pulse = Math.sin(this.pulsePhase) * 0.3 + 0.7;
                    return this.brightness * pulse;
                }
            }

            for (let i = 0; i < NODE_COUNT; i++) {
                nodes.push(new NeuralNode());
            }

            function drawNeuralNetwork() {
                ctx.clearRect(0, 0, width, height);
                nodes.forEach(node => node.update());

                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dx = nodes[i].x - nodes[j].x;
                        const dy = nodes[i].y - nodes[j].y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < CONNECTION_DISTANCE) {
                            const alpha = Math.pow(1 - dist / CONNECTION_DISTANCE, 1.8);
                            const finalAlpha = alpha * 0.55;
                            const isSpecialConnection = nodes[i].isSpecial || nodes[j].isSpecial;
                            const mix = dist / CONNECTION_DISTANCE;
                            let r, g, b;
                            if (isSpecialConnection) {
                                r = Math.round(80 + mix * 100);
                                g = Math.round(150 + mix * 60);
                                b = Math.round(220 - mix * 40);
                            } else {
                                r = Math.round(40 + mix * 60);
                                g = Math.round(140 + mix * 50);
                                b = Math.round(200 + mix * 40);
                            }
                            ctx.strokeStyle = `rgba(${r},${g},${b},${finalAlpha})`;
                            ctx.lineWidth = isSpecialConnection ? 0.7 : 0.35;
                            ctx.beginPath();
                            ctx.moveTo(nodes[i].x, nodes[i].y);
                            ctx.lineTo(nodes[j].x, nodes[j].y);
                            ctx.stroke();
                        }
                    }
                }

                nodes.forEach(node => {
                    const alpha = node.getAlpha();
                    const glowRadius = node.getGlowRadius();
                    const glowGradient = ctx.createRadialGradient(
                        node.x, node.y, node.radius * 0.3,
                        node.x, node.y, glowRadius
                    );
                    if (node.isSpecial) {
                        glowGradient.addColorStop(0, `rgba(180,220,255,${alpha})`);
                        glowGradient.addColorStop(0.3, `rgba(0,198,255,${alpha * 0.8})`);
                        glowGradient.addColorStop(0.6, `rgba(124,77,255,${alpha * 0.3})`);
                        glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
                    } else {
                        glowGradient.addColorStop(0, `rgba(160,210,240,${alpha * 0.8})`);
                        glowGradient.addColorStop(0.5, `rgba(0,180,230,${alpha * 0.35})`);
                        glowGradient.addColorStop(1, 'rgba(0,0,0,0)');
                    }
                    ctx.fillStyle = glowGradient;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
                    ctx.fill();

                    const coreGradient = ctx.createRadialGradient(
                        node.x, node.y, 0,
                        node.x, node.y, node.radius
                    );
                    coreGradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
                    coreGradient.addColorStop(0.5, `rgba(200,235,255,${alpha * 0.7})`);
                    coreGradient.addColorStop(1, `rgba(0,180,240,${alpha * 0.2})`);
                    ctx.fillStyle = coreGradient;
                    ctx.beginPath();
                    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
                    ctx.fill();
                });

                const flowParticleCount = 12;
                const now = performance.now() * 0.001;
                for (let f = 0; f < flowParticleCount; f++) {
                    const seed = f * 137.508 + now * 0.4;
                    const pairIndex = Math.floor((seed % 1) * nodes.length);
                    const nodeA = nodes[pairIndex];
                    const nodeB = nodes[(pairIndex + Math.floor(seed * 7 + 3)) % nodes.length];
                    const dx = nodeB.x - nodeA.x;
                    const dy = nodeB.y - nodeA.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < CONNECTION_DISTANCE && dist > 10) {
                        const t = (Math.sin(seed * 2.3) + 1) * 0.5;
                        const fx = nodeA.x + dx * t;
                        const fy = nodeA.y + dy * t;
                        ctx.fillStyle = 'rgba(255,255,255,0.7)';
                        ctx.shadowColor = 'rgba(0,200,255,0.8)';
                        ctx.shadowBlur = 4;
                        ctx.beginPath();
                        ctx.arc(fx, fy, 0.8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    }
                }
            }

            function createFloatingParticle() {
                const particle = document.createElement('div');
                particle.classList.add('floating-particle');
                const size = Math.random() * 3 + 1.5;
                const startX = Math.random() * 100;
                const duration = Math.random() * 6 + 5;
                const delay = Math.random() * 4;
                const colors = ['#00c6ff', '#7c4dff', '#b388ff', '#ffffff', '#00e5ff', '#ff80ab'];
                const color = colors[Math.floor(Math.random() * colors.length)];
                particle.style.cssText = `
                    width: ${size}px;
                    height: ${size}px;
                    background: ${color};
                    box-shadow: 0 0 ${size * 4}px ${color}, 0 0 ${size * 8}px ${color};
                    left: ${startX}%;
                    bottom: -20px;
                    animation-duration: ${duration}s;
                    animation-delay: ${delay}s;
                `;
                floatingContainer.appendChild(particle);
                const totalTime = (duration + delay) * 1000;
                setTimeout(() => {
                    if (particle.parentNode) particle.remove();
                }, totalTime + 200);
            }

            function spawnParticles() {
                const count = Math.floor(Math.random() * 3) + 1;
                for (let i = 0; i < count; i++) {
                    createFloatingParticle();
                }
            }

            const particleInterval = setInterval(spawnParticles, 600);
            for (let i = 0; i < 20; i++) {
                setTimeout(() => createFloatingParticle(), i * 80);
            }

            let animationId;
            function animateNeural() {
                drawNeuralNetwork();
                animationId = requestAnimationFrame(animateNeural);
            }
            animateNeural();

            let progress = 0;
            const totalLoadTime = 3200;
            const updateInterval = 40;
            const steps = totalLoadTime / updateInterval;
            let currentStep = 0;

            function updateProgress() {
                currentStep++;
                const t = currentStep / steps;
                const eased = 1 / (1 + Math.exp(-10 * (t - 0.5)));
                const baseProgress = eased * 100;
                const noise = (Math.random() - 0.5) * 3 * (1 - Math.abs(t - 0.5) * 2);
                progress = Math.min(100, Math.max(0, baseProgress + noise));
                if (t > 0.85) {
                    progress = Math.min(100, progress + (Math.random() * 5));
                }
                if (currentStep >= steps) {
                    progress = 100;
                }
                progressFill.style.width = progress + '%';
                progressText.textContent = Math.round(progress) + '%';
                if (progress >= 100) {
                    clearInterval(progressInterval);
                    setTimeout(hideLoader, 400);
                }
            }

            const progressInterval = setInterval(updateProgress, updateInterval);

            function hideLoader() {
                clearInterval(particleInterval);
                loaderOverlay.classList.add('hidden');
                setTimeout(() => {
                    mainContent.classList.add('visible');
                }, 400);
                setTimeout(() => {
                    if (animationId) cancelAnimationFrame(animationId);
                    floatingContainer.innerHTML = '';
                    nodes.length = 0;
                }, 1200);
            }

            window.addEventListener('load', () => {
                if (progress < 85) {
                    const fastForward = setInterval(() => {
                        if (progress >= 100) {
                            clearInterval(fastForward);
                            return;
                        }
                        progress += Math.random() * 4 + 2;
                        if (progress > 100) progress = 100;
                        progressFill.style.width = progress + '%';
                        progressText.textContent = Math.round(progress) + '%';
                        if (progress >= 100) {
                            clearInterval(fastForward);
                            clearInterval(progressInterval);
                            setTimeout(hideLoader, 300);
                        }
                    }, 50);
                }
            });
        })();