// Admin page JavaScript with GSAP animations + Partner Sport Filter
let allRegistrations = [];
let filteredRegistrations = [];

const PARTNER_SPORTS = [
    'badminton-doubles',
    'badminton-mixed',
    'tabletennis-doubles',
    'tabletennis-mixed',
    'carrom-doubles'
];

// Dynamically add partner sport filter dropdown
function addPartnerSportFilter() {
    const filtersSection = document.querySelector('.filters-section');
    if (!filtersSection) return;
    if (document.getElementById('partnerSportFilter')) return; // Already present

    const label = document.createElement('label');
    label.textContent = "Partner Filter: ";
    label.setAttribute('for', 'partnerSportFilter');
    label.style.marginLeft = "16px";

    const select = document.createElement('select');
    select.id = 'partnerSportFilter';
    select.style.marginLeft = "4px";
    select.innerHTML = `<option value="">All/Any Partner</option>` +
        PARTNER_SPORTS.map(s => 
            `<option value="${s}">${s.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>`
        ).join('');
    
    // insert before stats-section if possible, else append
    const insertionPoint = document.querySelector('.stats-section') || document.querySelector('.stat-section');
    filtersSection.insertBefore(label, insertionPoint);
    filtersSection.insertBefore(select, insertionPoint);
}

document.addEventListener('DOMContentLoaded', function() {
    // GSAP Animations on page load
    gsap.from('.admin-header', {
        duration: 0.8,
        y: -30,
        opacity: 0,
        ease: 'power3.out'
    });

    gsap.from('.filters-section', {
        duration: 0.6,
        y: 30,
        opacity: 0,
        delay: 0.2,
        ease: 'power2.out'
    });

    // Add stat-section animation - fix selector and animate opacity+scale
    let statSection = document.querySelector('.stat-section') || document.querySelector('.stats-section');
    if (statSection) {
        statSection.style.opacity = 1; // Ensure visible even before JS
        statSection.style.transform = "scale(1)"; // Reset scaling if needed
        gsap.from(statSection, {
            opacity: 0,
            scale: 0.95,
            duration: 0.6,
            delay: 0.25,
            ease: 'power2.out'
        });
    }

    gsap.from('.table-section', {
        duration: 0.6,
        y: 30,
        opacity: 0,
        delay: 0.6,
        ease: 'power2.out'
    });

    addPartnerSportFilter();

    loadRegistrations();

    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('downloadPDF').addEventListener('click', downloadPDF);

    // Optionally, trigger filtering on partner filter change
    document.getElementById('partnerSportFilter').addEventListener('change', applyFilters);
});

async function loadRegistrations() {
    const tbody = document.getElementById('tableBody');
    try {
        tbody.innerHTML = '<tr><td colspan="7" class="loading-text">Loading registrations...</td></tr>';
        const response = await fetch('/admin/data', {cache: "no-store"});

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let data;
        try {
            data = await response.json();
        } catch (e) {
            throw new Error('Failed to parse JSON data');
        }

        if (!Array.isArray(data)) {
            throw new Error('Invalid data format received');
        }

        if (data.length === 0) {
            allRegistrations = [];
            filteredRegistrations = [];
            tbody.innerHTML = `<tr>
                <td colspan="7" class="loading-text" style="text-align:center;color:#888;">
                    There are currently <b>no registrations</b> to display.<br>
                    <a href="/form" style="color: var(--primary-color); text-decoration: underline;">Register now</a>
                </td>
            </tr>`;
            updateStats([]); // Update stats section
            showStatsSection(true);
            return;
        }

        allRegistrations = data;
        filteredRegistrations = data;
        displayRegistrations(data);
        updateStats(data);
        showStatsSection(true);

    } catch (error) {
        console.error('Error loading registrations:', error);

        // Show table error
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="loading-text" style="color: red; text-align:center;">
                    <div style="padding: 60px 10px;">
                        <div>🚫 <strong>There is some problem in fetching data.</strong></div>
                        <div style="margin-top: 10px;font-size: 0.92em; color: #a66;">${error.message}</div>
                        <div style="margin-top: 8px;">Please check your network connection, server status, and refresh the page.</div>
                    </div>
                </td>
            </tr>
        `;
        allRegistrations = [];
        filteredRegistrations = [];
        updateStats([]);
        showStatsSection(true);
    }
}

// Ensure stats section always shown (but never animate to opacity:0 or display:none!)
function showStatsSection(show) {
    const stats = document.querySelector('.stat-section') || document.querySelector('.stats-section');
    if (stats) {
        stats.style.display = '';
        stats.style.opacity = 1; // force visible every time
        stats.style.transform = "scale(1)";
    }
}

function applyFilters() {
    const sportFilter = document.getElementById('sportFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const partnerSportFilter = document.getElementById('partnerSportFilter').value;

    gsap.to('#applyFilters', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
    });

    filteredRegistrations = allRegistrations.filter(reg => {
        // Existing logic
        const sportMatch = !sportFilter || (Array.isArray(reg.sports) && reg.sports.includes(sportFilter));
        const yearMatch = !yearFilter || reg.year?.toString() === yearFilter;
        const genderMatch = !genderFilter || reg.gender === genderFilter;

        // New: filter by partner sport. Show only registrations that have a partner entry for selected sport.
        let partnerSportMatch = true;
        if (partnerSportFilter) {
            partnerSportMatch = Array.isArray(reg.partners) && reg.partners.some(p => 
                p && p.sport === partnerSportFilter && p.name && p.name.trim()
            );
        }

        return sportMatch && yearMatch && genderMatch && partnerSportMatch;
    });

    displayRegistrations(filteredRegistrations);
    updateStats(filteredRegistrations);
    showStatsSection(true);
}

function displayRegistrations(registrations) {
    const tbody = document.getElementById('tableBody');
    if (!Array.isArray(registrations) || registrations.length === 0) {
        tbody.innerHTML = `<tr>
            <td colspan="7" style="text-align:center; padding:40px 20px; color:#666;">
                No registrations found.
                <a href="/form" style="color: var(--primary-color); text-decoration: underline; margin-left:5px;">Register now</a>
            </td>
        </tr>`;
        tbody.style.opacity = 1;
        showStatsSection(true);
        return;
    }

    gsap.to(tbody, {
        opacity: 0,
        duration: 0.25,
        onComplete: () => {
            tbody.innerHTML = '';

            registrations.forEach((reg, index) => {
                const row = document.createElement('tr');

                const sportsList = Array.isArray(reg.sports) ? reg.sports.map(s => s.replace('-', ' ')).join(', ') : 'N/A';

                let partnersHtml = 'N/A';
                if (reg.partners && Array.isArray(reg.partners) && reg.partners.length > 0) {
                    partnersHtml = reg.partners.map(p => {
                        if (p && p.sport && p.name) {
                            return `${p.sport.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}: ${p.name}`;
                        }
                        return '';
                    }).filter(p => p).join('<br>') || 'N/A';
                }

                row.innerHTML = `
                    <td>${reg.name || 'N/A'}</td>
                    <td>${reg.course || 'N/A'}</td>
                    <td>${reg.year || 'N/A'}</td>
                    <td>${reg.gender || 'N/A'}</td>
                    <td>${sportsList}</td>
                    <td>${partnersHtml}</td>
                    <td>
                       
                        <button class="btn-delete" onclick="deleteRegistration('${reg._id}')">Delete</button>
                    </td>
                `;

                gsap.set(row, {
                    opacity: 0,
                    x: -20
                });

                tbody.appendChild(row);

                gsap.to(row, {
                    opacity: 1,
                    x: 0,
                    duration: 0.35,
                    delay: index * 0.03,
                    ease: 'power2.out'
                });
            });

            gsap.to(tbody, {
                opacity: 1,
                duration: 0.2
            });
            showStatsSection(true);
        }
    });
}

// Fix/Update stat card animation: only animate text, NOT the parent stat-section opacity or display!
function updateStats(registrations) {
    const totalCount = document.getElementById('totalCount');
    const currentFilter = document.getElementById('currentFilter');

    let currentCount = 0;
    try {
        currentCount = parseInt(totalCount.textContent) || 0;
    } catch {
        currentCount = 0;
    }

    let displayCount = (Array.isArray(registrations) ? registrations.length : 0) || 0;
    showStatsSection(true);

    // Animate only the count, not the container
    gsap.to({ value: currentCount }, {
        value: displayCount,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate: function() {
            totalCount.textContent = Math.round(this.targets()[0].value);
        }
    });

    const sportFilter = document.getElementById('sportFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const partnerSportFilter = document.getElementById('partnerSportFilter') ? document.getElementById('partnerSportFilter').value : '';

    let filterText = '';
    if (sportFilter) filterText += sportFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    else filterText += 'All Sports';

    filterText += ' - ';

    if (yearFilter) filterText += `${yearFilter}${getOrdinal(yearFilter)} Year`;
    else filterText += 'All Years';

    if (genderFilter) filterText += ` - ${genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1)}`;

    if (partnerSportFilter) {
        filterText += ` - Partner: ${partnerSportFilter.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`;
    }

    // Animate just the text content (never animate opacity to 0 or change display of parent!)
    if (currentFilter.textContent !== filterText) {
        gsap.to(currentFilter, {
            y: -8,
            opacity: 0.2,
            duration: 0.1,
            onComplete: () => {
                currentFilter.textContent = filterText;
                gsap.fromTo(currentFilter,
                    { y: 8, opacity: 0.2 },
                    { y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' }
                );
            }
        });
    }
}

function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = parseInt(n) % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
}

async function deleteRegistration(id) {
    if (!confirm('Are you sure you want to delete this registration?')) {
        return;
    }

    try {
        const rows = document.querySelectorAll('#tableBody tr');
        rows.forEach(row => {
            if (row.innerHTML.includes(id)) {
                gsap.to(row, {
                    opacity: 0,
                    x: -50,
                    duration: 0.3,
                    onComplete: () => {
                        row.remove();
                    }
                });
            }
        });

        const response = await fetch(`/admin/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            allRegistrations = allRegistrations.filter(reg => reg._id !== id);
            filteredRegistrations = filteredRegistrations.filter(reg => reg._id !== id);

            if (filteredRegistrations.length === 0) {
                displayRegistrations([]);
            } else {
                displayRegistrations(filteredRegistrations);
            }
            updateStats(filteredRegistrations);
            showStatsSection(true);
        } else {
            alert('Error deleting registration');
            loadRegistrations();
        }
    } catch (error) {
        console.error('Error deleting registration:', error);
        alert('Error deleting registration');
        loadRegistrations();
    }
}

function editRegistration(id) {
    window.location.href = `/admin/edit/${id}`;
}

async function downloadPDF() {
    gsap.to('#downloadPDF', {
        scale: 0.95,
        duration: 0.1,
        yoyo: true,
        repeat: 1,
        ease: 'power2.out'
    });

    const sportFilter = document.getElementById('sportFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const partnerSportFilter = document.getElementById('partnerSportFilter') ? document.getElementById('partnerSportFilter').value : '';

    const params = new URLSearchParams();
    if (sportFilter) params.append('sport', sportFilter);
    if (yearFilter) params.append('year', yearFilter);
    if (genderFilter) params.append('gender', genderFilter);
    if (partnerSportFilter) params.append('partner', partnerSportFilter);

    window.open(`/admin/download-pdf?${params.toString()}`, '_blank');
}
