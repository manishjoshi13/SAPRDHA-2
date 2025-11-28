// Form page JavaScript with GSAP animations
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('sportsForm');
    const sportsCheckboxes = document.querySelectorAll('input[name="sports"]');
    const partnersSection = document.getElementById('partnersSection');
    const partnersContainer = document.getElementById('partnersContainer');
    const container = document.querySelector('.container');

    // GSAP Animations on page load
    gsap.from('.container', {
        duration: 0.8,
        y: 50,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.form-header', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        delay: 0.2,
        ease: 'power3.out'
    });

    gsap.from('.form-section', {
        duration: 0.6,
        y: 30,
        opacity: 0,
        stagger: 0.1,
        delay: 0.4,
        ease: 'power2.out'
    });

    // Animate form inputs on focus
    const inputs = document.querySelectorAll('input, select, textarea');
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

    // Sports that require partners
    const partnerSports = ['badminton-doubles', 'badminton-mixed', 'carrom-doubles'];

    // Utility function to animate height auto (GSAP doesn't support height:auto directly)
    function animateHeightAuto(element, animOpts = {}) {
        // Get current height
        const startHeight = element.offsetHeight;
        // Temporarily show all children to get new height
        element.style.height = 'auto';
        const endHeight = element.offsetHeight;
        element.style.height = startHeight + 'px';
        // Animate to new height
        gsap.to(element, Object.assign({
            height: endHeight,
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out',
            clearProps: "height,opacity"
        }, animOpts));
    }

    // Function to update partners section
    function updatePartnersSection() {
        const selectedSports = Array.from(sportsCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        const needsPartners = selectedSports.some(sport => partnerSports.includes(sport));

        if (needsPartners) {
            // Save existing input values before any changes
            const existingValues = {};
            const existingInputs = partnersContainer.querySelectorAll('input[type="text"]');
            existingInputs.forEach(input => {
                const sport = input.getAttribute('data-sport');
                if (sport) {
                    existingValues[sport] = input.value; // Save even if empty to preserve state
                }
            });

            const wasHidden = partnersSection.style.display === 'none' || partnersSection.style.display === '' || partnersContainer.children.length === 0;

            // Show the section
            partnersSection.style.display = 'block';
            partnersSection.style.overflow = 'visible'; // Ensure visible while animating

            // Get currently selected partner sports
            const selectedPartnerSports = selectedSports.filter(sport => partnerSports.includes(sport));

            // Remove inputs for sports that are no longer selected
            const existingDivs = partnersContainer.querySelectorAll('.partner-input');
            existingDivs.forEach(div => {
                const input = div.querySelector('input');
                const sport = input ? input.getAttribute('data-sport') : null;
                if (sport && !selectedPartnerSports.includes(sport)) {
                    div.remove();
                }
            });

            // Add or update partner inputs for selected sports
            let newInputs = [];
            selectedPartnerSports.forEach(sport => {
                let existingInput = document.getElementById(`partner-${sport}`);

                if (!existingInput) {
                    // Create new input if it doesn't exist
                    const partnerDiv = document.createElement('div');
                    partnerDiv.className = 'partner-input';
                    const savedValue = existingValues[sport] || '';
                    partnerDiv.innerHTML = `
                        <label for="partner-${sport}">Partner Name for ${sport.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} <span class="required">*</span></label>
                        <input type="text" name="partners[${sport}]" data-sport="${sport}" id="partner-${sport}" required placeholder="Enter partner name" value="${savedValue}">
                    `;
                    partnersContainer.appendChild(partnerDiv);
                    newInputs.push(partnerDiv);
                    gsap.from(partnerDiv, {
                        duration: 0.4,
                        x: -20,
                        opacity: 0,
                        delay: wasHidden ? 0.3 : 0.1,
                        ease: 'power2.out'
                    });
                }
            });

            // Animate height auto for section
            if (wasHidden) {
                partnersSection.style.height = '0px';
                partnersSection.style.opacity = '0';
                // Animate to the new height
                requestAnimationFrame(() => {
                    animateHeightAuto(partnersSection, {opacity: 1});
                });
            } else {
                // Animate height change when adding/removing inputs
                animateHeightAuto(partnersSection, {duration: 0.35, opacity: 1});
            }
        } else {
            // Animate to hide and then clean up
            const onComplete = () => {
                partnersSection.style.display = 'none';
                partnersSection.style.height = '';
                partnersSection.style.overflow = '';
                partnersSection.style.opacity = '';
                partnersContainer.innerHTML = '';
            };
            // Animate out
            gsap.to(partnersSection, {
                duration: 0.3,
                height: 0,
                opacity: 0,
                ease: 'power2.in',
                onComplete: onComplete,
                overwrite: true
            });
        }
    }

    // Add event listeners to sports checkboxes
    sportsCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updatePartnersSection();

            // Animate checkbox selection
            const label = this.closest('.sport-checkbox');
            if (this.checked) {
                gsap.to(label, {
                    scale: 1.05,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 1,
                    ease: 'power2.out'
                });
            }
        });
    });

    // Animate radio buttons
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            const label = this.closest('.radio-label');
            gsap.to(label, {
                scale: 1.1,
                duration: 0.2,
                yoyo: true,
                repeat: 1,
                ease: 'power2.out'
            });
        });
    });

    // Form submission handler
    form.addEventListener('submit', function(e) {
        const selectedSports = Array.from(sportsCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        if (selectedSports.length === 0) {
            e.preventDefault();

            // Animate error
            gsap.to('.checkbox-group', {
                x: [-10, 10, -10, 10, 0],
                duration: 0.5,
                ease: 'power2.out'
            });

            alert('Please select at least one sport.');
            return false;
        }

        // Validate partner names for partner sports
        const needsPartners = selectedSports.some(sport => partnerSports.includes(sport));
        if (needsPartners) {
            const partnerInputs = partnersContainer.querySelectorAll('input[type="text"]');
            let allPartnersFilled = true;

            partnerInputs.forEach(input => {
                if (!input.value.trim()) {
                    allPartnersFilled = false;
                }
            });

            if (!allPartnersFilled) {
                e.preventDefault();

                // Animate error
                gsap.to('#partnersSection', {
                    x: [-10, 10, -10, 10, 0],
                    duration: 0.5,
                    ease: 'power2.out'
                });

                alert('Please enter partner names for all selected partner sports.');
                return false;
            }
        }

        // Log form data before submission for debugging
        const formData = new FormData(form);
        console.log('Form data being submitted:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Animate submit button
        const submitBtn = document.querySelector('.submit-btn');
        gsap.to(submitBtn, {
            scale: 0.95,
            duration: 0.1,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });
    });

    // Animate alerts
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        gsap.from(alert, {
            duration: 0.5,
            x: -50,
            opacity: 0,
            ease: 'power2.out'
        });
    });

    // Initial adjustment in case of pre-selected sports
    updatePartnersSection();
});
