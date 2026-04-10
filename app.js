/* === Hawaii Football Recruits — Main App === */

(function () {
  'use strict';

  let players = [];
  const grid = document.getElementById('playerGrid');
  const searchInput = document.getElementById('searchInput');
  const classFilter = document.getElementById('classFilter');
  const positionFilter = document.getElementById('positionFilter');
  const resultsCount = document.getElementById('resultsCount');
  const modalOverlay = document.getElementById('modalOverlay');
  const modalClose = document.getElementById('modalClose');
  const modalPhoto = document.getElementById('modalPhoto');
  const modalBody = document.getElementById('modalBody');

  // Load player data — prefer localStorage (set by admin panel), fall back to JSON file
  const stored = localStorage.getItem('hfr_players');
  if (stored) {
    try {
      players = JSON.parse(stored);
      render();
    } catch (e) {
      players = [];
      render();
    }
  } else {
    fetch('data/players.json')
      .then(r => r.json())
      .then(data => {
        players = data;
        render();
      })
      .catch(() => {
        grid.innerHTML = '<div class="no-results">Unable to load player data.</div>';
      });
  }

  // Filters
  searchInput.addEventListener('input', render);
  classFilter.addEventListener('change', render);
  positionFilter.addEventListener('change', render);

  function getFiltered() {
    const q = searchInput.value.toLowerCase().trim();
    const cls = classFilter.value;
    const pos = positionFilter.value;

    return players.filter(p => {
      if (cls && String(p.classYear) !== cls) return false;
      const positions = Array.isArray(p.position) ? p.position : [p.position];
      if (pos && !positions.includes(pos)) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.school.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  function render() {
    const filtered = getFiltered();
    resultsCount.textContent = filtered.length + ' player' + (filtered.length !== 1 ? 's' : '');

    if (filtered.length === 0) {
      grid.innerHTML = '<div class="no-results">No players match your filters.</div>';
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <div class="player-card" data-id="${p.id}">
        <div class="card-photo-wrap">
          <img class="card-photo" src="${p.photo}" alt="${p.name}" loading="lazy"
               onerror="this.src='photos/default.svg'">
        </div>
        <div class="card-body">
          <div class="card-name">${esc(p.name)}</div>
          <div class="card-meta">
            ${(Array.isArray(p.position) ? p.position : [p.position]).map(pos => `<span class="card-tag">${esc(pos)}</span>`).join('')}
            <span class="card-tag year">${p.classYear}</span>
            <span class="card-school">${esc(p.school)}</span>
          </div>
          <div class="card-size">${esc(p.height)} / ${p.weight} lbs</div>
          ${renderCardOffers(p.offers)}
        </div>
      </div>
    `).join('');

    // Attach click listeners
    grid.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', () => openProfile(card.dataset.id));
    });
  }

  // Profile modal
  function openProfile(id) {
    const p = players.find(x => x.id === id);
    if (!p) return;

    modalPhoto.src = p.photo;
    modalPhoto.alt = p.name;
    modalPhoto.onerror = function () { this.src = 'photos/default.svg'; };

    modalBody.innerHTML = `
      <div class="modal-name">${esc(p.name)}</div>
      <div class="modal-size">${esc(p.height)} / ${p.weight} lbs</div>
      <div class="modal-info">
        ${esc(Array.isArray(p.position) ? p.position.join(' / ') : p.position)} &bull; Class of ${p.classYear} &bull; ${esc(p.school)}
        ${p.gpa ? '&bull; GPA: ' + esc(p.gpa) : ''}
      </div>

      ${renderOffers(p.offers)}
      ${renderMeasurables(p.measurables)}
      ${renderAwards(p.awards)}
      ${renderLinks(p.links)}
    `;

    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // Render helpers
  function offerSlug(school) {
    return school.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function renderCardOffers(offers) {
    if (!offers || offers.length === 0) return '';
    return '<div class="card-offers">' + offers.map(function (school) {
      var initial = school.charAt(0).toUpperCase();
      return '<div class="offer-badge" title="' + esc(school) + '">' +
        '<img src="logos/' + offerSlug(school) + '.png" alt="' + esc(school) + '" onerror="this.parentNode.classList.add(\'no-logo\')">' +
        '<span class="offer-initial">' + initial + '</span></div>';
    }).join('') + '</div>';
  }

  function renderOffers(offers) {
    if (!offers || offers.length === 0) return '';
    var items = offers.map(function (school) {
      var slug = offerSlug(school);
      var initial = school.charAt(0).toUpperCase();
      return '<div class="modal-offer-badge">' +
        '<img class="offer-logo-lg" src="logos/' + slug + '.png" alt="' + esc(school) + '" onerror="this.parentNode.classList.add(\'no-logo\')">' +
        '<span class="offer-initial-lg">' + initial + '</span>' +
        '<span class="offer-school-name">' + esc(school) + '</span></div>';
    }).join('');

    return '<div class="modal-section"><h3>Scholarship Offers</h3><div class="offers-grid">' + items + '</div></div>';
  }

  function renderMeasurables(m) {
    if (!m) return '';
    const labels = {
      fortyYard: '40-Yard',
      shuttle: 'Shuttle',
      vertical: 'Vertical',
      broadJump: 'Broad Jump',
      bench: 'Bench'
    };
    const items = Object.entries(labels)
      .filter(([key]) => m[key])
      .map(([key, label]) => `
        <div class="measurable-item">
          <div class="measurable-label">${label}</div>
          <div class="measurable-value">${esc(m[key])}</div>
        </div>
      `).join('');

    if (!items) return '';
    return `
      <div class="modal-section">
        <h3>Measurables</h3>
        <div class="measurables-grid">${items}</div>
      </div>
    `;
  }

  function renderAwards(awards) {
    if (!awards || awards.length === 0) return '';
    return `
      <div class="modal-section">
        <h3>Awards & Recognition</h3>
        <ul class="awards-list">
          ${awards.map(a => `<li>${esc(a)}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  function renderLinks(links) {
    if (!links) return '';
    const defs = [
      { key: 'hudl', label: 'Hudl', icon: linkIcon() },
      { key: 'twitter', label: 'X / Twitter', icon: xIcon() },
      { key: 'rivals', label: 'Rivals', icon: linkIcon() },
      { key: 'twoFourSeven', label: '247Sports', icon: linkIcon() },
      { key: 'youtube', label: 'YouTube', icon: ytIcon() }
    ];
    const items = defs
      .filter(d => links[d.key])
      .map(d => `<a href="${esc(links[d.key])}" target="_blank" rel="noopener" class="profile-link">${d.icon} ${d.label}</a>`)
      .join('');

    if (!items) return '';
    return `
      <div class="modal-section">
        <h3>Profiles & Highlights</h3>
        <div class="profile-links">${items}</div>
      </div>
    `;
  }

  // SVG icons
  function linkIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  }

  function xIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="currentColor"/></svg>';
  }

  function ytIcon() {
    return '<svg viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="currentColor"/></svg>';
  }

  // Escape HTML
  function esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = String(str);
    return d.innerHTML;
  }

})();
