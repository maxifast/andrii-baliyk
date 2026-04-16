/* ===== GSAP Scroll Animations & Interactions ===== */

(function() {
    'use strict';

    // ===== PRELOADER =====
    function hidePreloaderAndAnimate() {
        const preloader = document.getElementById('preloader');
        if (preloader && !preloader.classList.contains('hidden')) {
            preloader.classList.add('hidden');
            animateHeroEntrance();
        }
    }

    window.addEventListener('load', () => {
        setTimeout(hidePreloaderAndAnimate, 600);
    });

    // Safety net: hide preloader after 2.5s no matter what
    setTimeout(hidePreloaderAndAnimate, 2500);

    // Ultimate fallback: force-show all hero elements after 4s
    setTimeout(() => {
        document.querySelectorAll('.hero [data-animate]').forEach(el => {
            el.classList.add('animated');
        });
    }, 4000);

    // ===== CUSTOM CURSOR =====
    const cursor = document.querySelector('.custom-cursor');
    const follower = document.querySelector('.cursor-follower');

    if (cursor && follower && window.innerWidth > 768) {
        let cx = 0, cy = 0, fx = 0, fy = 0;

        document.addEventListener('mousemove', (e) => {
            cx = e.clientX;
            cy = e.clientY;
        });

        function updateCursor() {
            fx += (cx - fx) * 0.15;
            fy += (cy - fy) * 0.15;

            cursor.style.transform = `translate(${cx - 4}px, ${cy - 4}px)`;
            follower.style.transform = `translate(${fx - 18}px, ${fy - 18}px)`;

            requestAnimationFrame(updateCursor);
        }
        updateCursor();

        // Hover effect on interactive elements
        const hoverTargets = document.querySelectorAll('a, button, .faq-question, .story-card, .founder-card, .ai-suggestion');
        hoverTargets.forEach(el => {
            el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
            el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
        });
    }

    // ===== NAVBAR SCROLL =====
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;

        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = scrollY;
    });

    // ===== MOBILE NAV TOGGLE =====
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            const spans = navToggle.querySelectorAll('span');
            if (navLinks.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            }
        });

        // Close on link click
        navLinks.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('active');
                const spans = navToggle.querySelectorAll('span');
                spans[0].style.transform = '';
                spans[1].style.opacity = '';
                spans[2].style.transform = '';
            });
        });
    }

    // ===== HERO ENTRANCE ANIMATION =====
    function animateHeroEntrance() {
        const elements = document.querySelectorAll('.hero [data-animate]');
        elements.forEach((el, i) => {
            const delay = parseFloat(el.getAttribute('data-delay') || 0) * 1000;
            setTimeout(() => {
                el.classList.add('animated');
            }, delay + i * 80 + 200);
        });

        // Counter animation
        setTimeout(() => {
            document.querySelectorAll('[data-count]').forEach(el => {
                const target = parseInt(el.getAttribute('data-count'));
                animateCounter(el, 0, target, 2000);
            });
        }, 800);
    }

    function animateCounter(el, start, end, duration) {
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(start + (end - start) * eased);

            el.textContent = current;

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ===== GSAP SCROLL ANIMATIONS =====
    gsap.registerPlugin(ScrollTrigger);

    // Animate all [data-animate] elements on scroll
    const animateElements = document.querySelectorAll('[data-animate]:not(.hero [data-animate])');

    animateElements.forEach(el => {
        const delay = parseFloat(el.getAttribute('data-delay') || 0);

        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            onEnter: () => {
                setTimeout(() => {
                    el.classList.add('animated');
                }, delay * 1000);
            }
        });
    });

    // ===== HERO PIN + ABOUT OVERLAY EFFECT (desktop only — too expensive on mobile) =====
    const isMobileDevice = window.innerWidth < 768 || 'ontouchstart' in window;

    if (!isMobileDevice) {
        // Pin hero while About scrolls over it
        ScrollTrigger.create({
            trigger: '.hero',
            start: 'top top',
            endTrigger: '.section-about',
            end: 'top top',
            pin: true,
            pinSpacing: false
        });

        // Fade & scale hero content as About approaches
        gsap.to('.hero-content', {
            scale: 0.92,
            opacity: 0,
            y: -40,
            ease: 'none',
            scrollTrigger: {
                trigger: '.section-about',
                start: 'top bottom',
                end: 'top 20%',
                scrub: 1
            }
        });

        // Hero scroll indicator fades quickly
        gsap.to('.hero-scroll', {
            opacity: 0,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: '+=200',
                scrub: true
            }
        });
    }

    // 3D canvas slight scale-down
    gsap.to('#heroCanvas', {
        scale: 1.08,
        ease: 'none',
        scrollTrigger: {
            trigger: '.section-about',
            start: 'top bottom',
            end: 'top top',
            scrub: 1
        }
    });

    // Section titles slide in
    gsap.utils.toArray('.section-title').forEach(title => {
        gsap.fromTo(title, {
            clipPath: 'inset(0 100% 0 0)'
        }, {
            clipPath: 'inset(0 0% 0 0)',
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: title,
                start: 'top 80%',
                once: true
            }
        });
    });

    // ===== FAQ ACCORDION =====
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');

            // Close all
            faqItems.forEach(other => {
                other.classList.remove('active');
                other.querySelector('.faq-answer').style.maxHeight = '0';
            });

            // Open clicked
            if (!isActive) {
                item.classList.add('active');
                answer.style.maxHeight = answer.scrollHeight + 'px';
            }
        });
    });

    // ===== SMOOTH SCROLL =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offset = navbar.offsetHeight + 20;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    // ===== CONTACT FORM =====
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = '<span>Отправлено!</span><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
            btn.style.background = 'linear-gradient(135deg, #48C774, #36D399)';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
                contactForm.reset();
            }, 3000);
        });
    }

    // ===== MAGNETIC BUTTONS =====
    if (window.innerWidth > 768) {
        document.querySelectorAll('.btn-primary').forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // ===== DIPLOMA LIGHTBOX =====
    const lightbox = document.getElementById('diplomaLightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = lightbox ? lightbox.querySelector('.lightbox-close') : null;

    if (lightbox && lightboxImg) {
        document.querySelectorAll('.diploma-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.diploma-link')) return;
                const cert = card.getAttribute('data-cert');
                if (cert) {
                    lightboxImg.src = cert;
                    lightbox.classList.add('active');
                    document.body.style.overflow = 'hidden';
                }
            });
        });

        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        };

        if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) closeLightbox();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
        });
    }

    // ===== ACTIVE NAV LINK HIGHLIGHT =====
    const sections = document.querySelectorAll('section[id]');
    const navLinksAll = document.querySelectorAll('.nav-link:not(.nav-link-cta)');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const top = section.offsetTop - 200;
            if (window.scrollY >= top) {
                current = section.getAttribute('id');
            }
        });

        navLinksAll.forEach(link => {
            link.style.color = '';
            if (link.getAttribute('href') === '#' + current) {
                link.style.color = 'var(--accent)';
            }
        });
    });
})();
