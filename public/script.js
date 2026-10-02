// --- TAB NAVIGATION ---
const tabSortBtn = document.getElementById('tabSortBtn');
const tabDumpBtn = document.getElementById('tabDumpBtn');
const tabListBtn = document.getElementById('tabListBtn');

const sortSection = document.getElementById('sortSection');
const dumpSection = document.getElementById('dumpSection');
const reportsListSection = document.getElementById('reportsListSection');

function switchTab(activeBtn, activeSection) {
  [tabSortBtn, tabDumpBtn, tabListBtn].forEach(b => b.classList.remove('active'));
  [sortSection, dumpSection, reportsListSection].forEach(s => s.classList.add('hidden'));

  activeBtn.classList.add('active');
  activeSection.classList.remove('hidden');
}

tabSortBtn.addEventListener('click', () => switchTab(tabSortBtn, sortSection));
tabDumpBtn.addEventListener('click', () => switchTab(tabDumpBtn, dumpSection));
tabListBtn.addEventListener('click', () => {
  switchTab(tabListBtn, reportsListSection);
  loadAllReports();
});

// Helper: validate image file (type and max size 5MB)
function validateImageFile(file) {
  if (!file) {
    return 'Kripya pehle ek photo chunein!';
  }
  if (!file.type.startsWith('image/')) {
    return 'Yeh file image nahi hai. Kripya valid photo upload karein.';
  }
  const maxBytes = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxBytes) {
    return 'Photo ka size 5 MB se zyada hai. Kripya choti image chunein.';
  }
  return null;
}

// Helper: fetch with timeout for slow network detection
async function fetchWithTimeout(url, options = {}, timeoutMs = 25000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error('SLOW_NETWORK');
    }
    throw err;
  }
}

// --- FEATURE 1: SORT KACHRA ---
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('previewContainer');
const imagePreview = document.getElementById('imagePreview');
const sortBtn = document.getElementById('sortBtn');
const sortBtnSpinner = sortBtn.querySelector('.btn-spinner');
const sortBtnText = sortBtn.querySelector('.btn-text');
const cardsList = document.getElementById('cardsList');
const sortErrorBox = document.getElementById('sortErrorBox');
const sortErrorMsg = document.getElementById('sortErrorMsg');
const sortRetryBtn = document.getElementById('sortRetryBtn');

let selectedFile = null;

function showSortError(msg) {
  sortErrorMsg.innerText = msg;
  sortErrorBox.classList.remove('hidden');
}

function hideSortError() {
  sortErrorBox.classList.add('hidden');
  sortErrorMsg.innerText = '';
}

imageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  hideSortError();
  if (!file) return;

  const error = validateImageFile(file);
  if (error) {
    showSortError(error);
    selectedFile = null;
    previewContainer.classList.add('hidden');
    sortBtn.classList.add('hidden');
    return;
  }

  selectedFile = file;
  imagePreview.src = URL.createObjectURL(file);
  previewContainer.classList.remove('hidden');
  sortBtn.classList.remove('hidden');
  cardsList.innerHTML = '';
});

async function runSort() {
  hideSortError();

  if (!selectedFile) {
    showSortError('Kripya pehle photo kheencho ya chuno!');
    return;
  }

  // Loading state
  sortBtn.disabled = true;
  sortBtnSpinner.classList.remove('hidden');
  sortBtnText.innerText = 'Saathi soch raha hai...';
  cardsList.innerHTML = '';

  const formData = new FormData();
  formData.append('image', selectedFile);

  try {
    const response = await fetchWithTimeout('/classify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      showSortError('Server ya API mein koi dikkat aayi: ' + (data.error || 'Request fail ho gayi.'));
      return;
    }

    if (data.items && data.items.length > 0) {
      renderSortCards(data.items);
    } else {
      cardsList.innerHTML = '<p style="text-align:center; padding: 16px;">Koyi kachra item nahi mila. Dusri photo try karein.</p>';
    }
  } catch (error) {
    if (error.message === 'SLOW_NETWORK') {
      showSortError('Internet bohot slow hai ya connection timeout ho gaya.');
    } else {
      showSortError('Server se connect nahi ho paya. Kripya network check karein.');
    }
  } finally {
    sortBtn.disabled = false;
    sortBtnSpinner.classList.add('hidden');
    sortBtnText.innerText = 'Sort karo';
  }
}

sortBtn.addEventListener('click', runSort);
sortRetryBtn.addEventListener('click', runSort);

function renderSortCards(items) {
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'card';
    const streamKey = (item.stream || 'dry').toLowerCase().trim();

    card.innerHTML = `
      <div class="card-header">
        <span class="item-name">${item.name}</span>
        <span class="badge badge-${streamKey}">${item.stream}</span>
      </div>
      <p class="tip-text">${item.tip_hi}</p>
    `;
    cardsList.appendChild(card);
  });
}

// --- FEATURE 2: DUMP REPORT ---
const dumpImageInput = document.getElementById('dumpImageInput');
const dumpPreviewContainer = document.getElementById('dumpPreviewContainer');
const dumpImagePreview = document.getElementById('dumpImagePreview');
const locationStatus = document.getElementById('locationStatus');
const refreshLocationBtn = document.getElementById('refreshLocationBtn');
const dumpNote = document.getElementById('dumpNote');
const reportBtn = document.getElementById('reportBtn');
const reportBtnSpinner = reportBtn.querySelector('.btn-spinner');
const reportBtnText = reportBtn.querySelector('.btn-text');
const dumpErrorBox = document.getElementById('dumpErrorBox');
const dumpErrorMsg = document.getElementById('dumpErrorMsg');
const dumpRetryBtn = document.getElementById('dumpRetryBtn');

const reportResult = document.getElementById('reportResult');
const notDumpMsg = document.getElementById('notDumpMsg');
const dumpSuccessContent = document.getElementById('dumpSuccessContent');
const severityBadge = document.getElementById('severityBadge');
const dumpSummaryHi = document.getElementById('dumpSummaryHi');
const dumpWasteTypes = document.getElementById('dumpWasteTypes');
const complaintText = document.getElementById('complaintText');
const copyComplaintBtn = document.getElementById('copyComplaintBtn');

let selectedDumpFile = null;
let userCoords = { lat: null, lng: null };

function showDumpError(msg) {
  dumpErrorMsg.innerText = msg;
  dumpErrorBox.classList.remove('hidden');
}

function hideDumpError() {
  dumpErrorBox.classList.add('hidden');
  dumpErrorMsg.innerText = '';
}

// Geolocation auto-detection with friendly Hinglish messages
function detectLocation() {
  if (!navigator.geolocation) {
    locationStatus.innerText = '📍 Browser mein location support nahi hai';
    return;
  }
  locationStatus.innerText = '📍 Location pata lagayi ja rahi hai...';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      userCoords.lat = pos.coords.latitude;
      userCoords.lng = pos.coords.longitude;
      locationStatus.innerText = `📍 Location: ${userCoords.lat.toFixed(4)}, ${userCoords.lng.toFixed(4)}`;
      hideDumpError();
    },
    (err) => {
      locationStatus.innerText = '📍 Location permission nahi mili (optional)';
      showDumpError('Location access deny kar diya gaya hai. Aap bina location ke bhi report bhej sakte hain.');
    },
    { timeout: 8000 }
  );
}

detectLocation();
refreshLocationBtn.addEventListener('click', detectLocation);

dumpImageInput.addEventListener('change', (event) => {
  const file = event.target.files[0];
  hideDumpError();
  if (!file) return;

  const error = validateImageFile(file);
  if (error) {
    showDumpError(error);
    selectedDumpFile = null;
    dumpPreviewContainer.classList.add('hidden');
    return;
  }

  selectedDumpFile = file;
  dumpImagePreview.src = URL.createObjectURL(file);
  dumpPreviewContainer.classList.remove('hidden');
});

async function runReport() {
  hideDumpError();

  if (!selectedDumpFile) {
    showDumpError('Kripya pehle kachre ke dher ki photo chunein!');
    return;
  }

  // Loading state
  reportBtn.disabled = true;
  reportBtnSpinner.classList.remove('hidden');
  reportBtnText.innerText = 'Saathi soch raha hai...';
  reportResult.classList.add('hidden');
  notDumpMsg.classList.add('hidden');
  dumpSuccessContent.classList.add('hidden');

  const formData = new FormData();
  formData.append('image', selectedDumpFile);
  if (userCoords.lat !== null) formData.append('lat', userCoords.lat);
  if (userCoords.lng !== null) formData.append('lng', userCoords.lng);
  formData.append('note', dumpNote.value);

  try {
    const response = await fetchWithTimeout('/report', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      showDumpError('Report banane mein error: ' + (data.error || 'Server error'));
      return;
    }

    reportResult.classList.remove('hidden');

    if (!data.is_dump) {
      notDumpMsg.classList.remove('hidden');
      return;
    }

    // Success Dump Report
    const ai = data.report.aiResult;
    dumpSuccessContent.classList.remove('hidden');

    const severity = (ai.severity || 'medium').toLowerCase();
    severityBadge.className = `badge badge-${severity}`;
    severityBadge.innerText = severity;

    dumpSummaryHi.innerText = ai.summary_hi || '';

    // Render tags
    dumpWasteTypes.innerHTML = '';
    if (ai.waste_types && Array.isArray(ai.waste_types)) {
      ai.waste_types.forEach((type) => {
        const tag = document.createElement('span');
        tag.className = 'waste-tag';
        tag.innerText = type;
        dumpWasteTypes.appendChild(tag);
      });
    }

    complaintText.value = ai.complaint_text || '';
  } catch (error) {
    if (error.message === 'SLOW_NETWORK') {
      showDumpError('Internet bohot slow hai ya timeout ho gaya. Kripya dobara koshish karein.');
    } else {
      showDumpError('Server se connect nahi ho paya. Dobara try karein.');
    }
  } finally {
    reportBtn.disabled = false;
    reportBtnSpinner.classList.add('hidden');
    reportBtnText.innerText = 'Report karo';
  }
}

reportBtn.addEventListener('click', runReport);
dumpRetryBtn.addEventListener('click', runReport);

copyComplaintBtn.addEventListener('click', () => {
  complaintText.select();
  navigator.clipboard.writeText(complaintText.value);
  copyComplaintBtn.innerText = 'Copied!';
  setTimeout(() => (copyComplaintBtn.innerText = 'Copy'), 2000);
});

// --- FEATURE 3: ALL REPORTS & MAP ---
let mapInstance = null;
let markersLayer = null;

async function loadAllReports() {
  const savedReportsList = document.getElementById('savedReportsList');
  savedReportsList.innerHTML = '<p style="text-align:center; padding: 20px;">Reports load ho rahi hain...</p>';

  // Initialize Leaflet Map once
  if (!mapInstance) {
    mapInstance = L.map('mapContainer').setView([20.5937, 78.9629], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(mapInstance);
    markersLayer = L.layerGroup().addTo(mapInstance);
  } else {
    setTimeout(() => mapInstance.invalidateSize(), 200);
  }

  markersLayer.clearLayers();

  try {
    const res = await fetchWithTimeout('/reports', {}, 10000);
    const reports = await res.json();

    // Empty state requirement: "Abhi koi report nahi hai"
    if (!reports || reports.length === 0) {
      savedReportsList.innerHTML = `
        <div class="empty-state">
          <p>🗑️ <strong>Abhi koi report nahi hai</strong></p>
          <p style="font-size:0.85rem; margin-top:4px;">Nayi report darj karne ke liye 'Dump Report' tab par jayein.</p>
        </div>
      `;
      return;
    }

    savedReportsList.innerHTML = '';
    const validCoords = [];

    reports.forEach((rep) => {
      const ai = rep.aiResult || {};
      const severity = (ai.severity || 'medium').toLowerCase();
      const timeStr = rep.time ? new Date(rep.time).toLocaleString() : '';

      // Add to map if coordinates exist
      if (rep.lat && rep.lng) {
        validCoords.push([rep.lat, rep.lng]);
        const marker = L.marker([rep.lat, rep.lng]).addTo(markersLayer);
        marker.bindPopup(`
          <strong>${ai.summary_hi || 'Garbage Dump'}</strong><br/>
          Severity: <span style="text-transform:uppercase; font-weight:bold;">${severity}</span><br/>
          ${rep.note ? 'Note: ' + rep.note : ''}
        `);
      }

      // Add report card
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-header">
          <span class="item-name">${ai.summary_hi || 'Garbage Dump'}</span>
          <span class="badge badge-${severity}">${severity}</span>
        </div>
        ${rep.note ? `<p style="font-size:0.9rem;"><strong>Landmark:</strong> ${rep.note}</p>` : ''}
        <p class="tip-text" style="font-size:0.85rem; color:#444;">${ai.complaint_text || ''}</p>
        <span class="report-meta">Reported on: ${timeStr} ${rep.lat ? `| 📍 (${rep.lat.toFixed(4)}, ${rep.lng.toFixed(4)})` : ''}</span>
      `;
      savedReportsList.appendChild(card);
    });

    if (validCoords.length > 0) {
      mapInstance.fitBounds(validCoords, { maxZoom: 14, padding: [20, 20] });
    }
  } catch (error) {
    savedReportsList.innerHTML = `
      <div class="error-banner">
        <span>Reports load nahi ho payi.</span>
        <button class="small-retry-btn" onclick="loadAllReports()">Dobara try karo</button>
      </div>
    `;
  }
}
