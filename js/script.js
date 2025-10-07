/* script.js
   Responsibilities:
   - Load projects.json
   - Render filter buttons and project cards
   - Filter client-side by track
   - Theme switching
   - Modal rendering for project details
*/

/* ---------- Config & helpers ---------- */

// Map filter codes to expected track names in the JSON.
// Extend this map as you support more track labels vs full names.
const TRACK_MAP = {
    "All": null,
    "SE": "Software Engineering",
    "DA": "Data Analytics",
    "DM": "Digital Marketing",
    "CY": "Cybersecurity",
    "CD": "Cloud",
    "Banking": "Banking"
};

const DATA_PATH = 'data/projects.json'; // relative path to projects.json

// DOM refs
const projectGrid = document.getElementById('projectGrid');
const trackFilters = document.getElementById('trackFilters');
const noResults = document.getElementById('noResults');
const clearFilterBtn = document.getElementById('clearFilter');
// const themeSelector = document.getElementById('themeSelector');
const programHeader = document.getElementById('programHeader');

let allProjects = [];
let activeTrack = null; // null == show all

/* ---------- Render helpers ---------- */

function createTrackButtons() {
    // Build buttons based on TRACK_MAP keys (except All is not shown as button here)
    Object.keys(TRACK_MAP).forEach(code => {
        if (code === "All") return;
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-primary btn-sm';
        btn.type = 'button';
        btn.textContent = code;
        btn.setAttribute('data-track-code', code);
        btn.setAttribute('aria-pressed', 'false');
        btn.addEventListener('click', onTrackClick);
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
        trackFilters.appendChild(btn);
    });
}

function renderProjectsList(projects) {
    projectGrid.innerHTML = ''; // clear
    if (!projects || projects.length === 0) {
        noResults.classList.add('show');
        return;
    }
    noResults.classList.remove('show');

    projects.forEach((p, idx) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6 col-md-4';
        col.setAttribute('role', 'listitem');

        const card = document.createElement('article');
        card.className = 'card project-card h-100';
        card.tabIndex = 0;
        card.setAttribute('aria-labelledby', `title-${idx}`);
        card.setAttribute('data-track', p.track || '');

        // accent strip (uses CSS var theme)
        const accent = document.createElement('div');
        accent.className = 'card-header-accent';
        accent.style.background = `linear-gradient(90deg, var(--accent), rgba(0,0,0,0.04))`;

        const body = document.createElement('div');
        body.className = 'card-body d-flex flex-column';

        // header (small)
        const header = document.createElement('p');
        header.className = 'card-meta mb-1';
        header.textContent = p.header || '';

        // Add special class if this is a Capstone Project
        if (p.header === 'Capstone Project') {
            header.classList.add('capstone-header');
        }

        body.appendChild(header);

        // title
        const title = document.createElement('h3');
        title.className = 'h6 mb-2 title-truncate';
        title.id = `title-${idx}`;
        title.textContent = p.project_title || 'Untitled Project';
        body.appendChild(title);

        // brief description
        const brief = document.createElement('p');
        brief.className = 'small text-muted mb-2';
        brief.textContent = p.brief_description || '';
        body.appendChild(brief);

        // tech list
        const techWrap = document.createElement('div');
        techWrap.className = 'tech-list';
        (p.technologies_used || []).forEach(t => {
            const tspan = document.createElement('span');
            tspan.className = 'tech-pill';
            tspan.textContent = t;
            techWrap.appendChild(tspan);
        });
        body.appendChild(techWrap);

        // actions
        const actions = document.createElement('div');
        actions.className = 'card-actions mt-3';
        const detailsBtn = document.createElement('button');
        detailsBtn.className = 'btn btn-sm';
        detailsBtn.textContent = 'View details';
        detailsBtn.addEventListener('click', () => openModal(p));
        detailsBtn.setAttribute('aria-label', `Open details for ${p.project_title}`);
        actions.appendChild(detailsBtn);
        body.appendChild(actions);

        card.appendChild(accent);
        card.appendChild(body);
        col.appendChild(card);
        projectGrid.appendChild(col);
    });
}

/* ---------- Filtering logic ---------- */

function filterProjectsByTrack(trackCode) {
    // trackCode is a key from TRACK_MAP (e.g., 'DA')
    const expected = TRACK_MAP[trackCode];
    if (!expected) {
        return allProjects.slice(); // show all
    }
    // Filter where p.track includes expected (case-insensitive)
    return allProjects.filter(p => {
        return (p.track || '').toLowerCase().includes(expected.toLowerCase());
    });
}

function onTrackClick(event) {
    const btn = event.currentTarget;
    const trackCode = btn.getAttribute('data-track-code');

    // 1️⃣ Update active button styles
    Array.from(trackFilters.querySelectorAll('button')).forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-outline-primary');
        b.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('active', 'btn-primary');
    btn.classList.remove('btn-outline-primary');
    btn.setAttribute('aria-pressed', 'true');

    // 2️⃣ Filter projects for selected track
    const filteredProjects = filterProjectsByTrack(trackCode);
    renderProjectsList(filteredProjects);

    // 3️⃣ Apply matching theme (header + gallery background)
    applyTheme(trackCode);

    // 4️⃣ Store active track globally
    activeTrack = trackCode;
}


/* ---------- Modal ---------- */

function openModal(project) {
    const modalTitle = document.getElementById('modalTitle');
    const modalHeader = document.getElementById('modalHeader');
    const modalDetailed = document.getElementById('modalDetailed');
    const modalTech = document.getElementById('modalTech');
    const modalFeatures = document.getElementById('modalFeatures');

    modalTitle.textContent = project.project_title || 'Project';
    modalHeader.textContent = `${project.type} • ${project.track} • ${project.header || ''}`;
    modalDetailed.textContent = project.detailed_description || project.brief_description || '';

    modalTech.innerHTML = '';
    (project.technologies_used || []).forEach(t => {
        const li = document.createElement('li');
        li.textContent = t;
        modalTech.appendChild(li);
    });

    modalFeatures.innerHTML = '';
    (project.core_features || []).forEach(f => {
        const li = document.createElement('li');
        li.textContent = f;
        modalFeatures.appendChild(li);
    });

    const bsModal = new bootstrap.Modal(document.getElementById('projectModal'));
    bsModal.show();
}

/* ---------- Theme switching ---------- */

function applyTheme(trackCode) {
    const themePrefix = 'theme-';
    const body = document.body;

    // Remove any previous theme classes
    body.classList.forEach(cls => {
        if (cls.startsWith(themePrefix)) body.classList.remove(cls);
    });

    // Add the new one
    body.classList.add(`theme-${trackCode}`);

    // Update header/banner colors
    const banner = document.getElementById('programHeader');
    const accentHeaders = document.getElementsByClassName('card-header-accent');
    if (banner) {
        switch (trackCode) {
            case 'DA':
                banner.style.background = 'linear-gradient(90deg, #007bff, #00c0ff)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #007bff, #00c0ff)';
                });
                break;
            case 'SE':
                banner.style.background = 'linear-gradient(90deg, #28a745, #85e085)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #28a745, #85e085)';
                });
                break;
            case 'DM':
                banner.style.background = 'linear-gradient(90deg, #ffc107, #fff3cd)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #ffc107, #fff3cd)';
                });
                break;
            case 'CY':
                banner.style.background = 'linear-gradient(90deg, #dc3545, #f8d7da)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #dc3545, #f8d7da)';
                });
                break;
            case 'CD':
                banner.style.background = 'linear-gradient(90deg, #6f42c1, #e2d9f3)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #6f42c1, #e2d9f3)';
                });
                break;
            case 'Banking':
                banner.style.background = 'linear-gradient(90deg, #007bff, #80bdff)';
                Array.from(accentHeaders).forEach(ah => {
                    ah.style.background = 'linear-gradient(90deg, #007bff, #80bdff)';
                });
                break;
            default:
                banner.style.background = '#f8f9fa';
        }
    }
}


/* ---------- Initialization ---------- */

async function init() {
    createTrackButtons();

    // attach clear filter
    clearFilterBtn.addEventListener('click', () => {
        // reset button states
        Array.from(trackFilters.querySelectorAll('button')).forEach(b => {
            b.classList.remove('active', 'btn-primary');
            b.classList.add('btn-outline-primary');
            b.setAttribute('aria-pressed', 'false');
        });
        activeTrack = null;
        renderProjectsList(allProjects);
    });

    // theme selector
    // themeSelector.addEventListener('change', (e) => {
    //     applyTheme(e.target.value);
    // });

    // fetch project data
    try {
        // IMPORTANT: when testing locally, run via a local server (e.g. `npx http-server` or live-server).
        const res = await fetch(DATA_PATH);
        if (!res.ok) throw new Error('Failed to fetch project data');
        allProjects = await res.json();
    } catch (err) {
        console.error('Could not load projects.json — make sure you run this via HTTP server:', err);
        // fallback: show empty array
        allProjects = [];
    }

    // initial render
    //   renderProjectsList(allProjects);
    //   applyTheme(themeSelector.value || 'DA');

    // ---------- Default track setup ----------
    // ----- Default Track Setup -----
    const DEFAULT_TRACK = 'DA'; // Change to SE, DM, etc. if needed

    // Show only the default track on load
    const defaultProjects = filterProjectsByTrack(DEFAULT_TRACK);
    renderProjectsList(defaultProjects);

    // Highlight the default button (if filters exist)
    const defaultBtn = trackFilters.querySelector(`[data-track-code="${DEFAULT_TRACK}"]`);
    if (defaultBtn) {
        defaultBtn.classList.add('active', 'btn-primary');
        defaultBtn.classList.remove('btn-outline-primary');
        defaultBtn.setAttribute('aria-pressed', 'true');
    }

    activeTrack = DEFAULT_TRACK;
    applyTheme(DEFAULT_TRACK);


}

// Start
document.addEventListener('DOMContentLoaded', init);
