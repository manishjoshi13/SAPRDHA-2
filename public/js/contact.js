// Contact page JavaScript with GSAP animations
document.addEventListener('DOMContentLoaded', function() {
    // Animate navbar
    gsap.from('.navbar', {
        duration: 0.8,
        y: -50,
        opacity: 0,
        ease: 'power3.out'
    });

    // Animate contact container
    gsap.from('.contact-container', {
        duration: 0.8,
        y: 50,
        opacity: 0,
        delay: 0.2,
        ease: 'power3.out'
    });

    // Animate header
    gsap.from('.contact-header', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        delay: 0.4,
        ease: 'power3.out'
    });

    // Animate info items
    gsap.from('.info-item', {
        duration: 0.6,
        x: -30,
        opacity: 0,
        stagger: 0.1,
        delay: 0.6,
        ease: 'power2.out'
    });

    // Animate form
    gsap.from('.contact-form-section', {
        duration: 0.6,
        x: 30,
        opacity: 0,
        delay: 0.8,
        ease: 'power2.out'
    });

    // Animate form inputs on focus
    const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        input.addEventListener('blur', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });

    // Form submission handler
    const form = document.querySelector('.contact-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Animate submit button
        const submitBtn = document.querySelector('.submit-btn');
        gsap.to(submitBtn, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });

        // Show success message
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            form.reset();
            
            // Animate form reset
            gsap.from('.contact-form input, .contact-form textarea', {
                opacity: 0.5,
                duration: 0.3,
                stagger: 0.05,
                ease: 'power2.out'
            });
        }, 300);
    });

    // Hover animations for info items
    const infoItems = document.querySelectorAll('.info-item');
    infoItems.forEach(item => {
        item.addEventListener('mouseenter', function() {
            gsap.to(this, {
                scale: 1.02,
                duration: 0.3,
                ease: 'power2.out'
            });
        });

        item.addEventListener('mouseleave', function() {
            gsap.to(this, {
                scale: 1,
                duration: 0.3,
                ease: 'power2.out'
            });
        });
    });
});
