// Home page JavaScript with GSAP animations
gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

document.addEventListener('DOMContentLoaded', function() {
    // Animate navbar
    gsap.from('.navbar', {
        duration: 0.8,
        y: -50,
        opacity: 0,
        ease: 'power3.out'
    });

    // Animate hero content
    gsap.from('.hero-badge', {
        duration: 0.8,
        scale: 0,
        opacity: 0,
        delay: 0.2,
        ease: 'back.out(1.7)'
    });

    gsap.from('.hero-title', {
        duration: 1,
        y: 50,
        opacity: 0,
        delay: 0.4,
        ease: 'power3.out'
    });

    gsap.from('.hero-subtitle', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        delay: 0.6,
        ease: 'power2.out'
    });

    gsap.from('.hero-buttons', {
        duration: 0.8,
        y: 30,
        opacity: 0,
        delay: 0.8,
        ease: 'power2.out'
    });

    // Animate floating icons
    gsap.to('.floating-icon', {
        y: '+=30',
        rotation: 10,
        duration: 3,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
        stagger: 0.5
    });

    // Animate sports cards on scroll
    const sportCards = document.querySelectorAll('.sport-card');
    
    const observerOptions = {
        threshold: 0.2,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                gsap.to(entry.target, {
                    duration: 0.6,
                    y: 0,
                    opacity: 1,
                    delay: index * 0.1,
                    ease: 'power2.out'
                });
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    sportCards.forEach((card, index) => {
        gsap.set(card, {
            y: 50,
            opacity: 0
        });
        observer.observe(card);
    });

    // Animate section header
    gsap.from('.section-header', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        scrollTrigger: {
            trigger: '.sports-section',
            start: 'top 80%',
            toggleActions: 'play none none none'
        }
    });

    // Hover animations for sport cards
    sportCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.05,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            const icon = this.querySelector('.sport-icon');
            gsap.to(icon, {
                rotation: 360,
                duration: 0.6,
                ease: 'power2.out'
            });
        });

        card.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
            
            const icon = this.querySelector('.sport-icon');
            gsap.to(icon, {
                rotation: 0,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Animate info cards
    const infoCards = document.querySelectorAll('.info-card');
    infoCards.forEach((card, index) => {
        gsap.from(card, {
            duration: 0.6,
            y: 30,
            opacity: 0,
            delay: 0.3 + (index * 0.1),
            scrollTrigger: {
                trigger: card,
                start: 'top 85%',
                toggleActions: 'play none none none'
            },
            ease: 'power2.out'
        });
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                gsap.to(window, {
                    duration: 1,
                    scrollTo: {
                        y: target,
                        offsetY: 80
                    },
                    ease: 'power2.inOut'
                });
            }
        });
    });

    // Parallax effect for hero
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = document.querySelector('.hero-content');
        if (heroContent) {
            gsap.to(heroContent, {
                y: scrolled * 0.5,
                duration: 0.3,
                ease: 'power1.out'
            });
        }
    });

    // Animate CTA buttons on hover
    const ctaButtons = document.querySelectorAll('.cta-button');
    ctaButtons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            const arrow = this.querySelector('.btn-arrow');
            if (arrow) {
                gsap.to(arrow, {
                    x: 5,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });

        button.addEventListener('mouseleave', function() {
            const arrow = this.querySelector('.btn-arrow');
            if (arrow) {
                gsap.to(arrow, {
                    x: 0,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            }
        });
    });
});
