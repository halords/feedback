window.onload = function() {
  const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!loggedInUser) {
    window.location.href = 'login.html';
  } else {
    if (loggedInUser.user_type !== "superadmin") {
      const reportEl = document.getElementById('report');
      if (reportEl) reportEl.remove();
    }
    document.getElementById('displayUsername').textContent = loggedInUser.fullname;
    document.getElementById('displayUserType').textContent = loggedInUser.user_type;
    document.getElementById('officehandled').textContent = loggedInUser.offices;

    // 1. Populate dropdowns first so values are available for fetchUserData
    populateFilterDropdowns();
    fetchUserData(loggedInUser.offices);
  }
};

let coms = [];
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function fetchUserData(offices) {
  // Get initial values from the dropdowns (populated by populateFilterDropdowns)
  const selectedMonthValue = $('#filterMonth').val();
  const selectedYearValue = $('#filterYear').val();

  try {
    const response = await fetch('/api/fetchUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offices }),
    });
    const userData = await response.json();
    if (!userData.length) return;

    coms = []; // Reset global array on fetch

    userData.forEach(data => {
      const comment = data.user.Comment?.trim().toLowerCase() || "";
      const isTooShort = /^[a-z]{1,2}$/.test(comment);
      const excludedPhrases = ["na", "n/a", "no comment", "none", "not applicable", "", "awan", "wala"];
      const isExcludedPhrase = excludedPhrases.includes(comment);

      const dat = new Date(data.user.Date);
      const year = dat.getFullYear();
      const monthStr = dat.toLocaleString('default', { month: 'long' });

      // Build the global list for the "Update Classifications" modal
      if (!isTooShort && !isExcludedPhrase && (data.user.Class === "" || !data.user.Class)) {
        coms.push({
          documentID: data.docID,
          office: data.user.Office,
          comment: data.user.Comment,
          month: monthStr,
          year: year,
        });
      }
    });

    // Format data for the DataTable
    const formattedData = userData.map(data => {
      const d = new Date(data.user.Date);
      return {
        ...data.user,
        Date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        _jsDate: d // Helper for filtering
      };
    });

    renderTableHeaders(formattedData);
    const table = initializeDataTable(formattedData);

    // Initial Filter Apply
    filterTableByDropdowns(table);

    // Setup Listeners
    $('#filterMonth, #filterYear').on('change', function() {
      filterTableByDropdowns(table);
    });

    // Reset row numbering
    table.on('order.dt search.dt draw.dt', function () {
      const startIndex = table.page.info().start;
      table.column(0, { search: 'applied', order: 'applied', page: 'current' })
        .nodes().each((cell, i) => { cell.innerHTML = startIndex + i + 1; });
    });

  } catch (err) {
    console.error('Fetch error:', err);
    alert('Failed to load user data.');
  }
}

// Logic to filter the DataTable based on dropdowns
function filterTableByDropdowns(table) {
  const selMonthIdx = parseInt($('#filterMonth').val()) - 1;
  const selYear = $('#filterYear').val();

  $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
    const rowData = table.row(dataIndex).data();
    const date = rowData._jsDate;
    return date.getFullYear().toString() === selYear && date.getMonth() === selMonthIdx;
  });

  table.draw();
  $.fn.dataTable.ext.search.pop(); // Clear filter for next run
}

// Global constants
const BASELINE_YEAR = 2025;
const BASELINE_MONTH = 3; // March
const months2 = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function populateFilterDropdowns() {
  const filterMonth = document.getElementById('filterMonth');
  const filterYear = document.getElementById('filterYear');
  if (!filterMonth || !filterYear) return;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed (Jan = 1)

  // 1. Populate Years (From 2025 to Current Year)
  filterYear.innerHTML = '';
  for (let y = BASELINE_YEAR; y <= currentYear; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.innerText = y;
    if (y === currentYear) opt.selected = true;
    filterYear.appendChild(opt);
  }

  // 2. Function to update months based on selected year
  const updateMonthOptions = (selectedYear) => {
    const previousValue = filterMonth.value;
    filterMonth.innerHTML = '';

    let startMonth = 1;
    let endMonth = 12;

    if (selectedYear == BASELINE_YEAR) {
      // 2025: Start at March, go to Dec (or current month if 2025 were the current year)
      startMonth = BASELINE_MONTH;
      endMonth = (currentYear === BASELINE_YEAR) ? currentMonth : 12;
    } else if (selectedYear == currentYear) {
      // Current Year (e.g., 2026): Start at Jan, go to Current Month
      startMonth = 1;
      endMonth = currentMonth;
    } else {
      // Any year in between (if applicable in future): Full year
      startMonth = 1;
      endMonth = 12;
    }

    for (let m = startMonth; m <= endMonth; m++) {
      const opt = document.createElement('option');
      opt.value = m;
      opt.innerText = months2[m - 1];
      
      // Auto-select current month if it's the current year
      if (selectedYear == currentYear && m === currentMonth) {
        opt.selected = true;
      } 
      // Or maintain previous selection if it's still valid
      else if (m == previousValue) {
        opt.selected = true;
      }
      
      filterMonth.appendChild(opt);
    }
  };

  // Initialize months for the default selected year (Current Year)
  updateMonthOptions(filterYear.value);

  // Listener to change months when year changes
  $(filterYear).on('change', function() {
    updateMonthOptions(this.value);
    // If you want the table to refresh immediately when year changes:
    if (typeof table !== 'undefined') filterTableByDropdowns(table);
  });
}

// Update the fetchUserData function to call this correctly
async function fetchUserData(offices) {
  // Populate dropdowns first so we have a starting Month/Year
  populateFilterDropdowns();

  try {
    const response = await fetch('/api/fetchUserData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offices }),
    });
    
    const userData = await response.json();
    if (!userData.length) return;

    // Reset global coms
    coms = [];

    const formattedData = userData.map(data => {
      const d = new Date(data.user.Date);
      
      // Logic for unclassified comments (for the modal)
      const comment = data.user.Comment?.trim().toLowerCase() || "";
      const isTooShort = /^[a-z]{1,2}$/.test(comment);
      const excludedPhrases = ["na", "n/a", "no comment", "none", "not applicable", "", "awan", "wala"];
      
      if (!isTooShort && !excludedPhrases.includes(comment) && !data.user.Class) {
        coms.push({
          documentID: data.docID,
          office: data.user.Office,
          comment: data.user.Comment,
          month: months[d.getMonth()],
          year: d.getFullYear(),
        });
      }

      return {
        ...data.user,
        Date: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        _jsDate: d 
      };
    });

    renderTableHeaders(formattedData);
    const table = initializeDataTable(formattedData);

    // Initial Filter Apply
    filterTableByDropdowns(table);

    // Listeners for Filtering
    $('#filterMonth, #filterYear').on('change', () => filterTableByDropdowns(table));

    // Reset row numbering logic
    table.on('order.dt search.dt draw.dt', function () {
      const startIndex = table.page.info().start;
      table.column(0, { search: 'applied', order: 'applied', page: 'current' })
        .nodes().each((cell, i) => { cell.innerHTML = startIndex + i + 1; });
    });

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

function renderTableHeaders(userData) {
  const tableHead = document.getElementById('tableHead');
  if (!userData.length) return;
  const keys = ['No.', 'Name', 'Client_Type', 'Office', 'Service_Availed', 'Comment', 'Class', 'Date'];
  const customLabels = {
    'No.': 'No.',
    Name: 'Client Name',
    Client_Type: 'Client Type',
    Office: 'Office',
    Service_Availed: 'Service Availed',
    Comment: 'Comment',
    Class: 'Comment Type',
    Date: 'Date of Visit',
  };
  tableHead.innerHTML = keys.map(k => `<th>${customLabels[k] || k}</th>`).join('');
}

function initializeDataTable(userData) {
  if ($.fn.DataTable.isDataTable('#data-table')) {
    $('#data-table').DataTable().destroy();
  }
  return $('#data-table').DataTable({
    data: userData,
    columns: [
      { title: 'No.', data: null, defaultContent: '' },
      { data: 'Name' },
      { data: 'Client_Type' },
      { data: 'Office' },
      { data: 'Service_Availed' },
      { data: 'Comment' },
      { data: 'Class' },
      { data: 'Date' },
    ],
    autoWidth: false,
    order: [[7, 'desc']], // Sort by Date column
  });
}

// Updated Update Button Logic to filter the modal list based on selection
document.getElementById('updateComs').addEventListener('click', function () {
  const selMonthIdx = parseInt($('#filterMonth').val()) - 1;
  const selYear = parseInt($('#filterYear').val());

  const filteredComs = coms.filter(c => months.indexOf(c.month) === selMonthIdx && c.year === selYear);

  const modalBody = document.getElementById('commentsModalBody');
  if (filteredComs.length === 0) {
    modalBody.innerHTML = '<p class="text-center">No unclassified comments for the selected period.</p>';
  } else {
    modalBody.innerHTML = `
      <table class="table table-bordered">
        <thead>
          <tr><th>Office</th><th>Comment</th><th>Classification</th></tr>
        </thead>
        <tbody>
          ${filteredComs.map(com => `
            <tr>
              <td>${com.office}</td>
              <td>${com.comment}</td>
              <td>
                <select class="form-select classification-dropdown" data-id="${com.documentID}">
                  <option value="">Select...</option>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                  <option value="Suggestion">Suggestion</option>
                </select>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>`;
  }

  const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
  modal.show();
});

// Submit classifications remains mostly the same, just cleanup added
document.getElementById('submitClassifications').addEventListener('click', () => {
  const selections = [];
  document.querySelectorAll('.classification-dropdown').forEach(select => {
    if (select.value) {
      selections.push({ documentID: select.dataset.id, classification: select.value });
    }
  });

  if (selections.length === 0) return alert("Please classify at least one item.");

  fetch('/api/updateComments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(selections),
  })
    .then(res => res.json())
    .then(() => {
      alert('Classifications updated successfully!');
      location.reload(); // Simplest way to refresh table and global "coms" array
    })
    .catch(err => console.error(err));
});