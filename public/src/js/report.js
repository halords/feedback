let loggedInUser;
let summaryPDF = [];
window.onload = async function() {
  loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));

  if (!loggedInUser) {
    window.location.href = 'login.html';  // Redirect to login page if not logged in
  } else {
      if(loggedInUser.user_type !== "superadmin"){
        document.getElementById('report').remove();
      }
      document.getElementById('displayUsername').textContent = loggedInUser.fullname;
      document.getElementById('displayUserType').textContent = loggedInUser.user_type;
      document.getElementById('officehandled').textContent = loggedInUser.offices;

      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();  // Note: months are 0-indexed (0 = January, 11 = December)
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];

      setOptions();
      await getData(loggedInUser.offices, months[currentMonth-1], currentYear);  // Fetch user data if logged in
      await summaryReport(months[currentMonth-1], currentYear);
      switchTab('data-content');
      init(loggedInUser.offices); // Fetch user data if logged in
  }
};
  
  let reportData = {};
  async function getData(offices, month, year) {
    const resultsContainer = document.getElementById('results-container');
    // console.log(offices);
    // const month = document.getElementById('filterMonth');
    // const year = document.getElementById('filterYear');
    // console.log(month+" "+year+" test"+offices);
    const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

    try {
      const response = await fetch('/api/getReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ offices, month, year }),
      });
      const results = await response.json();
      // console.log(results);
      reportData = results;
      
      // console.log(reportData);
      if (!results || Object.keys(results).length === 0) {
        resultsContainer.innerHTML = `<p class="text-muted italic">No data to display.</p>`;
        $('#generateReport').hide();
        return;
      }
      $('#generateReport').show();
      // Convert the results object into an array of office data
      officeDataArray = Object.entries(results);
      reportIndex = 0; // Reset index for new data
      displayOfficeData(reportIndex);
      updatePaginationButtons();
      hideLoadingOverlay();
    } catch (err) {
      console.error('Fetch error:', err);
      alert('Failed to load user data.');
    }
  }
    const resultsContainer = document.getElementById('results-container');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const reportIndexDisplay = document.getElementById('report-index');
    let reportIndex = 0;
    let officeDataArray = [];
  function displayOfficeData(index) {
    const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

    if (index < 0 || index >= officeDataArray.length) {
        return; // Index out of bounds
    }
    const [office, officeData] = officeDataArray[index];
    let html = '';
    const feedbackStatements = [
      "0. I am satisfied with the service that I availed.",
      "1. Place is tidy, customer & PWD friendly, and safety signs are present.",
      "2. I spent a reasonable amount of time for my transaction.",
      "3. The office/staff followed the transaction's requirements and steps based on the information provided.",
      "4. The steps I needed to do for my transaction were simple.",
      "5. I easily found information about my transaction from the office or its website.",
      "6. I paid a reasonable amount of fees for my transaction. (If no fee, select N/A-0)",
      "7. The office/staff was fair to everyone during my transaction.",
      "8. I was treated courteously and (if asked questions) the staff was helpful.",
      "9. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
    ];
    
    // const resoponses = officeData.Male + officeData.Female + officeData.Others;
    html += `<div class="office-section">
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div class="grid grid-cols-2">
                          <h2 class="office-title">${office}</h2>
                        </div>
                        <div class="grid grid-cols-2">
                          <h2 class="office-title">Total Responses: ${Number(officeData.collection) === 0 ? 'No collection' : officeData.collection}</h2>
                        </div>
                       </div>
                       <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                           <div>
                                <div> <h3 class="data-category-title">Client Demographics</h3></div
                                <div><h4>Offiline: ${officeData.offline || ''} </h4>
                                <p>Online: ${officeData.online || ''}</p></div>
                               <div class="grid grid-cols-2">
                                   <div>
                                       <p class="data-item">Male: ${officeData.gender.Male || ''}</p>
                                       <p class="data-item">Female: ${officeData.gender.Female || ''}</p>
                                       <p class="data-item">LGBTQ: ${officeData.gender.LGBTQ || ''}</p>
                                       <p class="data-item">Prefer not to say: ${officeData.gender.Others || ''}</p>
                                   </div>
                                   <div>
                                        <p class="data-item">Citizen: ${officeData.clientType.Citizen || ''}</p>
                                        <p class="data-item">Government: ${officeData.clientType["Government (Employee or another Agency)"] || ''}</p>
                                        <p class="data-item">Business: ${officeData.clientType.Business || ''}</p>
                                   </div>
                               </div>
                           </div>
                           <div>
                               <h3 class="data-category-title">Awareness of Citizen's Charter (CC)</h3>
                                <div class="grid grid-cols-2">
                                    <div>
                                        <p class="data-item">Yes: ${officeData.cc1.Yes || ''}</p>
                                        <p class="data-item">Just Now: ${officeData.cc1["Just Now"] || ''}</p>
                                    </div>
                                    <div>
                                        <p class="data-item">No: ${officeData.cc1.No || ''}</p>
                                    </div>
                                </div>
                           </div>
                       </div>
                       <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                           <div>
                                <h3 class="data-category-title">Citizen's Charter Visibility</h3>
                                 <div class="grid grid-cols-2">
                                    <div>
                                        <p class="data-item">Visible: ${officeData.cc2.Visible || ''}</p>
                                        <p class="data-item">Somewhat Visible: ${officeData.cc2["Somewhat Visible"] || ''}</p>
                                        <p class="data-item">Difficult to see: ${officeData.cc2["Difficult to see"] || ''}</p>
                                    </div>
                                    <div>
                                        <p class="data-item">Not Visible: ${officeData.cc2["Not Visible"] || ''}</p>
                                        <p class="data-item">N/A: ${officeData.cc2["N/A"] || ''}</p>
                                    </div>
                                 </div>
                           </div>
                            <div>
                               <h3 class="data-category-title">Relevance of the Citizen's Charter to Transaction</h3>
                                <div class="grid grid-cols-2">
                                    <div>
                                        <p class="data-item">Very Much: ${officeData.cc3["Very Much"] || ''}</p>
                                        <p class="data-item">Somewhat: ${officeData.cc3.Somewhat || ''}</p>
                                    </div>
                                    <div>
                                        <p class="data-item">Did Not Help: ${officeData.cc3["Did Not Help"] || ''}</p>
                                        <p class="data-item">N/A: ${officeData.cc3["N/A"] || ''}</p>
                                    </div>
                                </div>
                            </div>
                       </div>
                    <div class="data-category">
                        <h3 class="data-category-title">Q Values</h3>
                        <div class="table-container">
                            <table class="table table-bordered styled-table">
                                <thead>
                                    <tr>
                                        <th>Question</th>
                                        <th>0</th>
                                        <th>1</th>
                                        <th>2</th>
                                        <th>3</th>
                                        <th>4</th>
                                        <th>5</th>
                                        <th>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>`;
            for (let i = 0; i <= 9; i++) {
                const qKey = `Q${i}`;
                const qValues = officeData.qValues[qKey] || {};
                html += `<tr>
                            <td>${feedbackStatements[i]}</td>
                            <td>${qValues['NA'] || ''}</td>
                            <td>${qValues['1'] || ''}</td>
                            <td>${qValues['2'] || ''}</td>
                            <td>${qValues['3'] || ''}</td>
                            <td>${qValues['4'] || ''}</td>
                            <td>${qValues['5'] || ''}</td>
                            <td>${qValues['RATE'] || ''}</td>
                        </tr>`;
            }
            html += `</tbody>
                            </table>
                        </div>
                     </div>`;
            html += `<div class="data-category grid grid-cols-3">
                        <div>
                          <h3 class="data-category-title">Commendation</h3>
                          ${officeData.comments.positive.length > 0
                              ? officeData.comments.positive.map(comment => `<p class="comment-item">${comment}</p>`).join('')
                              : `<p class="data-item no-data">No comments available</p>`
                          }
                        </div>
                        <div>
                          <h3 class="data-category-title">Complaints</h3>
                          ${officeData.comments.negative.length > 0
                              ? officeData.comments.negative.map(comment => `<p class="comment-item">${comment}</p>`).join('')
                              : `<p class="data-item no-data">No comments available</p>`
                          }
                        </div>
                        <div>
                          <h3 class="data-category-title">Suggestions</h3>
                          ${officeData.comments.suggestions.length > 0
                              ? officeData.comments.suggestions.map(comment => `<p class="comment-item">${comment}</p>`).join('')
                              : `<p class="data-item no-data">No comments available</p>`
                          }
                        </div>
                     </div>`;
            html += `</div>`;
    resultsContainer.innerHTML = html;
    updatePaginationButtons();
    hideLoadingOverlay();
}
function updatePaginationButtons() {
  prevButton.disabled = reportIndex === 0;
  nextButton.disabled = reportIndex === officeDataArray.length - 1;
  reportIndexDisplay.textContent = `Report ${reportIndex + 1} of ${officeDataArray.length}`;
}
// Event listeners for pagination buttons
prevButton.addEventListener('click', () => {
  if (reportIndex > 0) {
      reportIndex--;
      displayOfficeData(reportIndex);
  }
});
nextButton.addEventListener('click', () => {
  if (reportIndex < officeDataArray.length - 1) {
      reportIndex++;
      displayOfficeData(reportIndex);
  }
});
function logout() {
  localStorage.removeItem('loggedInUser');
  location.reload(); // or reset the DOM to show loginCard
}

function setOptions() {
  const baselineYear = 2025;
  const baselineMonth = 1; // March (1-indexed)

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed (0 = January)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterMonths = [document.getElementById('filterMonth'), document.getElementById('filterMonth2'), , document.getElementById('filterMonth3')].filter(Boolean);
  const filterYears = [document.getElementById('filterYear'), document.getElementById('filterYear2'), document.getElementById('filterYear3')].filter(Boolean);

  if (currentYear > baselineYear) {
    for (let year = baselineYear; year <= currentYear; year++) {
      filterYears.forEach(filterYear => {
        const option = document.createElement('option');
        option.value = year;
        option.innerText = year;
        option.selected = year === currentYear;
        filterYear.appendChild(option);
      });
    }

    for (let month = 1; month <= 12; month++) {
      filterMonths.forEach(filterMonth => {
        const option2 = document.createElement('option');
        option2.value = months[month - 1];
        option2.innerText = months[month - 1];
        option2.selected = month - 1 === currentMonth-1; // Fix: `month-1` to match 0-indexed month
        filterMonth.appendChild(option2);
      });
    }

  } else if (currentYear === baselineYear) {
    filterYears.forEach(filterYear => {
      const option = document.createElement('option');
      option.value = currentYear;
      option.innerText = currentYear;
      option.selected = true;
      filterYear.appendChild(option);
    });

    for (let month = baselineMonth; month <= currentMonth + 1; month++) {
      filterMonths.forEach(filterMonth => {
        const option2 = document.createElement('option');
        option2.value = months[month - 1];
        option2.innerText = months[month - 1];
        option2.selected = month - 1 === currentMonth-1;
        filterMonth.appendChild(option2);
      });
    }
  }
}

// Attach a change event to both dropdowns
$('#filterMonth').on('change', function () {
  const selectedMonth = $('#filterMonth').val();
  const selectedYear = parseInt($('#filterYear').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);
  
  // Pass selected data to getData
  getData(loggedInUser.offices, selectedMonth, selectedYear); 
});

$('#filterMonth2').on('change', function () {
  const selectedMonth = $('#filterMonth2').val();
  const selectedYear = parseInt($('#filterYear2').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);
  
  // Pass selected data to getData
  summaryReport(selectedMonth, selectedYear); 
});

$('#filterMonth3').on('change', function () {
  const selectedMonth = $('#filterMonth3').val();
  const selectedYear = parseInt($('#filterYear3').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);
  
  // Pass selected data to getData
  summaryReport(selectedMonth, selectedYear); 
});

$('#filterYear').on('change', function () {
  const selectedMonth = $('#filterMonth').val();
  const selectedYear = parseInt($('#filterYear').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 

  const baselineYear = 2025;
  const baselineMonth = 1; // March (1-indexed)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterMonth = document.getElementById('filterMonth');
  $('#filterMonth').empty();

  let startMonth = 0;
  let endMonth = 11;

  if (selectedYear === baselineYear && currentYear === baselineYear) {
    // From baseline month to current month
    startMonth = baselineMonth - 1; // Convert to 0-indexed
    endMonth = currentMonth;
  } else if (selectedYear === currentYear && selectedYear > baselineYear) {
    // From January to current month
    startMonth = 0;
    endMonth = currentMonth;
  } else {
    // Full year (January to December)
    startMonth = 0;
    endMonth = 11;
  }

  for (let month = startMonth; month <= endMonth; month++) {
    const option = document.createElement('option');
    option.value = months[month]; // e.g. "March"
    option.innerText = months[month];
    if (month === currentMonth) {
      option.selected = true;
    }
    filterMonth.appendChild(option);
  }  
  // Pass selected data to getData
  getData(loggedInUser.offices, selectedMonth, selectedYear); 
});

$('#filterYear2').on('change', function () {
  const selectedMonth = $('#filterMonth2').val();
  const selectedYear = parseInt($('#filterYear2').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 

  const baselineYear = 2025;
  const baselineMonth = 1; // March (1-indexed)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterMonth = document.getElementById('filterMonth2');
  $('#filterMonth2').empty();

  let startMonth = 0;
  let endMonth = 11;

  if (selectedYear === baselineYear && currentYear === baselineYear) {
    // From baseline month to current month
    startMonth = baselineMonth - 1; // Convert to 0-indexed
    endMonth = currentMonth;
  } else if (selectedYear === currentYear && selectedYear > baselineYear) {
    // From January to current month
    startMonth = 0;
    endMonth = currentMonth;
  } else {
    // Full year (January to December)
    startMonth = 0;
    endMonth = 11;
  }

  for (let month = startMonth; month <= endMonth; month++) {
    const option = document.createElement('option');
    option.value = months[month]; // e.g. "March"
    option.innerText = months[month];
    if (month === currentMonth) {
      option.selected = true;
    }
    filterMonth.appendChild(option);
  }  
  // Pass selected data to getData
  summaryReport(selectedMonth, selectedYear); 
});

$('#filterYear3').on('change', function () {
  const selectedMonth = $('#filterMonth3').val();
  const selectedYear = parseInt($('#filterYear3').val()); // Convert "2025" -> 2025
  // console.log('Selected Month:', selectedMonth, 'Selected Year:', selectedYear);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 

  const baselineYear = 2025;
  const baselineMonth = 1; // March (1-indexed)

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterMonth = document.getElementById('filterMonth3');
  $('#filterMonth3').empty();

  let startMonth = 0;
  let endMonth = 11;

  if (selectedYear === baselineYear && currentYear === baselineYear) {
    // From baseline month to current month
    startMonth = baselineMonth - 1; // Convert to 0-indexed
    endMonth = currentMonth;
  } else if (selectedYear === currentYear && selectedYear > baselineYear) {
    // From January to current month
    startMonth = 0;
    endMonth = currentMonth;
  } else {
    // Full year (January to December)
    startMonth = 0;
    endMonth = 11;
  }

  for (let month = startMonth; month <= endMonth; month++) {
    const option = document.createElement('option');
    option.value = months[month]; // e.g. "March"
    option.innerText = months[month];
    if (month === currentMonth) {
      option.selected = true;
    }
    filterMonth.appendChild(option);
  }  
  // Pass selected data to getData
  summaryReport(selectedMonth, selectedYear); 
});

document.getElementById('generateReport').addEventListener('click', async () => {
    if (!reportData || Object.keys(reportData).length === 0) {
        alert('No data to generate PDF.');
        return;
    }

    // --- Show Loading Overlay ---
    const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Generating PDF...</p>'; // You can add a CSS spinner here
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations
    console.log("executed");
    try {
        loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const newValue = { name: "fullname", value: loggedInUser.fullname };
        const insertIntoObject = (reportData, newValue) => {
            for (const key in reportData) {
                if (reportData.hasOwnProperty(key)) {
                    // If the object has a `fullname` field, insert the value
                    if (reportData[key].hasOwnProperty(newValue.name)) {
                        reportData[key][newValue.name] = newValue.value;
                    }
                }
            }
        };

        insertIntoObject(reportData, newValue);

        const response = await fetch(`${window.location.origin}/api/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reportData)
        });

        if (!response.ok) throw new Error('Failed to generate PDF');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank'); // open in new tab

    } catch (err) {
        console.error('Error generating PDF:', err);
        alert('Failed to generate PDF');
    } finally {
        // --- Hide Loading Overlay ---
        hideLoadingOverlay(); // This will run whether there's an error or not
    }
});

// Function to switch tabs
function switchTab(tabId) {
  const allTabs = document.querySelectorAll('.tab-content');
  const allButtons = document.querySelectorAll('.tab-button');

  // Hide all tabs and remove active class from buttons
  allTabs.forEach(tab => tab.classList.remove('actives'));
  allButtons.forEach(button => button.classList.remove('actives'));

  // Show the selected tab and activate the corresponding button
  document.getElementById(`tab-${tabId}-content`).classList.add('actives');
  document.getElementById(`tab-${tabId}`).classList.add('actives');
}

// Event listeners for tab buttons
document.getElementById('tab-summary').addEventListener('click', function(){

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if(summaryPDF.length === 0){
    summaryReport(months[currentMonth-1], currentYear);
  }
  switchTab('summary');
});

document.getElementById('tab-data-content').addEventListener('click', ()=>switchTab('data-content'));

document.getElementById('tab-graphs').addEventListener('click', function(){

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); 

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  if(summaryPDF.length === 0){
    summaryReport(months[currentMonth-1], currentYear);
  }
  switchTab('graphs');
});

// Set default active tab (user info)
async function summaryReport(month, year){
  const offices = [
    "OPG", "OPA", "SPO", "OPAss", "PTO", "PTO-Assessor", "PTO-Cash", "PBO", "OPAcc", 
    "PEO", "PGSO", "PLO", "PPDC", "PHO", "PHO-Clinic", "PHO-Warehouse", "PSWDO", 
    "OPAg", "OPVet", "PGENRO", "PIO", "LUPTO", "ICTU", "BACSU", "LEEIPO", 
    "HRMU", "ASMU", "SSU", "LUPJ", "PDRRMO", "PESU", "LIBRARY"
  ];
  // console.log(month, year);
  if(summaryPDF.length > 0){
    return;
  }
  const summarySatus = document.getElementById('summaryStatus');
  const graphStatus = document.getElementById('graphStatus');
  
  let html = '';

  const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

  try{
    const response = await fetch('/api/getReport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offices, month, year }),
    });
    const results = await response.json();
    // console.log(results);
    if (!results || Object.keys(results).length === 0) {
      summarySatus.innerHTML = `<p class="text-muted italic">No data to display.</p>`;
      graphStatus.innerHTML = `<p class="text-muted italic">No data to display.</p>`;
      return;
    }
    
    html += `
      <div class="table-container">
        <table class="table table-bordered styled-table" style="text-align: center;">
          <thead style="vertical-align: middle;">
            <th>Offices</th>
            <th>Responses</th>
            <th>Registered Clients</th>
            <th>Male</th>
            <th>Female</th>
            <th>LGBTQ</th>
            <th>Undefined Gender</th>
            <th>Environment Rating</th>
            <th>Systems and Procedures Rating</th>
            <th>Staff Service Rating</th>
            <th>General Rating</th>
            <th>Commendation</th>
            <th>Complaints</th>
            <th>Suggestions</th>
          </thead>
          <tbody>`;
    Object.keys(results).forEach((key) => {
      html += `
        <tr>
          <td>${results[key].department}</td>
          <td>${(Number(results[key].offline) + Number(results[key].online)) === 0 ? "" : (Number(results[key].offline) + Number(results[key].online))}</td>
          <td>${Number(results[key].visitor) === 0 ? "" : results[key].visitor}</td>
          <td>${Number(results[key].gender.Male) === 0 ? "" : results[key].gender.Male}</td>
          <td>${Number(results[key].gender.Female) === 0 ? "" : results[key].gender.Female}</td>
          <td>${Number(results[key].gender.LGBTQ) === 0 ? "" : results[key].gender.LGBTQ}</td>
          <td>${Number(results[key].gender.Others) === 0 ? "" : results[key].gender.Others}</td>
          <td>${results[key].qValues.Q1?.RATE === "N/A" ? "" : results[key].qValues.Q1?.RATE}</td>
          <td>${results[key].sysrate === "N/A" ? "" : results[key].sysrate}</td>
          <td>${results[key].staffrate === "N/A" ? "" : results[key].staffrate}</td>
          <td>${results[key].overrate === "N/A" ? "" : results[key].overrate}</td>
          <td>${Number(results[key].comments.positive?.length) === 0 ? "" : results[key].comments.positive?.length}</td>
          <td>${Number(results[key].comments.negative?.length) === 0 ? "" : results[key].comments.negative?.length}</td>
          <td>${Number(results[key].comments.suggestions?.length) === 0 ? "" : results[key].comments.suggestions?.length}</td>
        </tr>`;
        // console.log(results[key].offline + results[key].online);
    });
    html += `</tbody>
          </table>
        </div>`;

    summarySatus.innerHTML = html;  
    summaryPDF = results;
    hideLoadingOverlay();
    // console.log(summaryPDF);
  }catch(err){
    console.error('Fetch error:', err);
  }
}

document.getElementById('generateSummary').addEventListener('click', async function() {
    const months = document.getElementById('filterMonth2').value;
    const years = document.getElementById('filterYear2').value;
    const sortedSummaryPDF = {};
    const departments = [
        "OPG", "OPA", "SPO", "OPAss", "PTO", "PTO-Assessor", "PTO-Cash", "PBO", "OPAcc",
        "PEO", "PGSO", "PLO", "PPDC", "PHO", "PHO-Clinic", "PHO-Warehouse", "PSWDO",
        "OPAg", "OPVet", "PGENRO", "PIO", "LUPTO", "ICTU", "BACSU", "LEEIPO",
        "HRMU", "ASMU", "SSU", "LUPJ", "PDRRMO", "PESU", "LIBRARY"
    ];

    departments.forEach(dept => {
        if (summaryPDF.hasOwnProperty(dept)) {
            sortedSummaryPDF[dept] = summaryPDF[dept];
        }
    });
    const finals = months + " " + years;
    // console.log(sortedSummaryPDF);

    // --- Show Loading Overlay ---
    const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

    try {
        const response = await fetch('/api/summary-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ summaryPDF: sortedSummaryPDF, finals }),
        });

        if (!response.ok) throw new Error('Failed to generate PDF');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank'); // open in new tab

    } catch (err) {
        console.error('Generate PDF error:', err);
        alert('Failed to generate summary PDF.'); // Added an alert for user feedback
    } finally {
        // --- Hide Loading Overlay ---
        hideLoadingOverlay(); // This will run whether there's an error or not
    }
});

function getCategoryColor(category) {
  switch (category) {
    case "General Rating":
    case "Male":
    case "Online":
      return "rgba(75, 192, 192, 0.6)";
    case "Systems and Procedures": 
    case "Female" :
    case "Offline":
      return "rgba(255, 159, 64, 0.6)";
    case "Staff Service": 
    case "LGBTQ" :
      return "rgba(96, 60, 168, 0.6)";
    case "Environment" :
      return "rgba(86, 161, 247, 0.6)";
    
    default: return "rgba(100, 100, 100, 0.6)";
  }
}  

function transformDataForChart(monthData, type) {
  // console.log(monthData);
  if (!monthData || monthData.length === 0) {
    return { labels: [], datasets: [] };
  }

  if (type === 'pie' || type === 'doughnut') {
    const labels = Object.keys(monthData);
    const data = labels.map(label => {
      const value = monthData[label];
      if (typeof value === "string" && value.includes("%")) {
        return parseFloat(value.replace('%', ''));
      }
      return value ?? 0;
    });

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(getCategoryColor)
      }]
    };
  }

  const labels = monthData.map(entry =>
    entry.office || entry.montS || entry.genderS || 'Unknown'
  );
  

  // Dynamically detect if we should use firstData or secondData
  const firstAvailable = monthData[0].firstData || monthData[0].secondData || monthData[0].thirdData || monthData[0].fourthData || monthData[0].fifthData || monthData[0].sixthData || monthData[0].pushRate || monthData[0].responses;

  const categories = Object.keys(firstAvailable);

  const datasets = categories.map(category => {
    const dataset = {
      label: category,
      data: monthData.map(entry => {
        const dataObject = entry.firstData || entry.secondData || entry.thirdData || entry.fourthData || entry.fifthData || entry.sixthData || entry.pushRate || entry.responses;
        const value = dataObject[category];
  
        if (typeof value === "string" && value.includes("%")) {
          return parseFloat(value.replace('%', ''));
        }
  
        return (value === null || value === undefined || value === '' || isNaN(value) || value === '0' || value === 'N/A') ? 0 : value;
      })
    };
  
    if (type === 'line') {
      dataset.borderColor = getCategoryColor(category);
      dataset.borderWidth = 3;
      dataset.backgroundColor = 'transparent';
      dataset.tension = 0.4;
    } else {
      dataset.backgroundColor = getCategoryColor(category);
    }
  
    return dataset;
  });
  
  return { labels, datasets };
}
// Chart drawing function
let charts = {}; // We'll store multiple charts here

function guessXAxisLabelFromValues(labels) {
  if (!labels || labels.length === 0) return 'Category';

  const lowerLabels = labels.map(label => label.toString().toLowerCase());

  // Check for months
  if (lowerLabels.every(l => /^(january|february|march|april|may|june|july|august|september|october|november|december)$/.test(l))) {
    return 'Month';
  }

  // Check for gender-related labels
  if (lowerLabels.every(l => /^(male|female|non-binary|prefer not to say|other)$/.test(l))) {
    return 'Gender';
  }

  // Check for years
  if (lowerLabels.every(l => /^\d{4}$/.test(l))) {
    return 'Year';
  }

  // Fallback category label if no patterns match
  // return 'Category';
}

function renderChart(monthData, canvasId, month, code, type) {
  
  let value = false;
  let ratingType = "";
  if(type === "bar" || type === "pie"){
    value = true;
  }
  if(canvasId === "genRating"){
    ratingType = "GENERAL RATING";
  }else if(canvasId === "summary"){
    ratingType = "GRAPHICAL SUMMARY REPORT";
  }else if(canvasId === "envi"){
    ratingType = "ENVIRONMENT RATING";
  }else if(canvasId === "sysproc"){
    ratingType = "SYSTEMS AND PROCEDURES RATING";
  }else if(canvasId === "staffServe"){
    ratingType = "STAFF SERVICE RATING";
  }else if(canvasId === "genders"){
    ratingType = "GENDER";
  }else if(canvasId ==="monthlyRating"){
    ratingType = "MONTHLY RATING";
  }else if(canvasId ==="monthlyGender"){
    ratingType = "MONTHLY RESPONDENTS";
  }else if(canvasId ==="monthlyDistribution"){
    ratingType = "RESPONDENTS DISTRIBUTION";
    // console.log(monthData);
  }
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // If a chart already exists on this canvas, destroy it first
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  const chartData = transformDataForChart(monthData, type);
  // console.log(chartData);
  const isPie = type === 'pie' || type === 'doughnut';
   // Load the logo image
   const logoImage = new Image();
   logoImage.src = '/src/files/pglu-logo.png'; // Update with correct path
 
   // Wait for the image to load before creating the chart
   logoImage.onload = () => {
     // Image is now fully loaded
     const imagePlugin = {
       id: 'customImage',
       afterDraw: (chart) => {
         const { ctx, chartArea, options } = chart;
         const titleHeight = options.plugins.title.font?.size || 18; // Title height
         const imageHeight = titleHeight*5;
         const imageWidth = imageHeight; // Image width as height (maintaining aspect ratio)
 
         // Calculate position for the image (adjusting to be placed near title)
         const x = chart.width - imageWidth - 100; // 20px from the right edge
         const y = chartArea.top - imageHeight - 35; // Position just above the chart
 
         // Draw the image only if it's fully loaded
         if (logoImage.complete) {
           ctx.drawImage(logoImage, x, y, imageWidth, imageHeight);
         } else {
           console.warn('Image not loaded yet');
         }
          // Add a footer text
        const footerText = code; // Customize footer text
        const footerFontSize = 14;
        const footerWidth = ctx.measureText(footerText).width;
        const footerX = 20; // Center the footer text
        const footerY = chart.height - 10; // Position the footer 20px from the bottom

        ctx.font = `${footerFontSize}px Arial`;
        ctx.fillStyle = '#000'; // Set text color (black)
        ctx.fillText(footerText, footerX, footerY); // Draw the footer text
       }
     };

     const xAxisLabel = guessXAxisLabelFromValues(chartData.labels);

      charts[canvasId] = new Chart(ctx, {
        type: type,
        data: {
          labels: chartData.labels,
          datasets: chartData.datasets,
        },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        aspectRatio: 13 / 8.5,
        layout:{
          padding: {
            bottom: 30
          }
        },
        scales: type === 'pie' ? {} : {
          y: {
            beginAtZero: true
          },
          x: {
            ticks: {
              font: {
                weight: 'bold',  // Bold text for the x-axis labels
                size: 15,  // Font size for the x-axis labels
                family: 'Arial',  // Optional: Customize font family
              },
              color: '#000',  // Color of x-axis labels
            },
            title: {
              display: true,
              text: xAxisLabel,  // Dynamically set x-axis title (e.g., "Month", "Category")
              font: {
                size: 15,  // Title font size
                weight: 'bold',  // Title font weight
              },
              color: '#000',  // Title font color
            },
          },
        },
        plugins: {
          title: {
            display: true,
            text: [
              'Provincial Government of La Union',
              'CUSTOMER FEEDBACK CONSOLIDATION REPORT',
              ratingType,
              month.toUpperCase()
            ],
            font: {
              size: 20
            },
            color: '#000',
            padding: {
              top: 10,
              bottom: 30
            }
          },
          legend: {
            display: type === 'pie' || type === 'bar',
            position: type === 'pie' ? 'bottom' : 'top',
            labels: {
              boxWidth: 20,
              padding: 10,
              font: {
                weight: 'bold',
                size: 15
              },
              color: '#000',
            },
            maxHeight: 30
          },
          datalabels:
            type === 'bar'
              ? {
                anchor: 'center',
                align: function (context) {
                  const datasetIndex = context.datasetIndex;
                  return datasetIndex === 0
                    ? 'end'
                    : datasetIndex === 1
                    ? 'center'
                    : 'start';
                },
                offset: 6,
                rotation: function (){
                  if (canvasId === "monthlyDistribution") {
                    return 0;
                  }else{
                    return -90;
                  }
                },
                formatter: function (value) {
                  if (
                    value === null ||
                    value === undefined ||
                    value === '' ||
                    isNaN(value) ||
                    value === 0 ||
                    value === '0'
                  ) {
                    return null;
                  }
                  if (canvasId === "monthlyDistribution") {
                    return value;
                  }else{
                    return value + '%';
                  }
                },
                font: {
                  weight: 'bold',
                  size: 15
                },
                color: '#000',
                display: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return (
                    value !== null &&
                    value !== undefined &&
                    value !== 0 &&
                    value !== ''
                  );
                }
              }
            : type === 'pie'
            ? {
                anchor: 'center',
                align: 'end',
                offset: 10,
                formatter: function (value, context) {
                  const label = context.chart.data.labels[context.dataIndex];
                  return value + ' ' + label; // e.g., "35 Male"
                },
                font: {
                  weight: 'bold',
                  size: 15
                },
                color: '#000'
              }
            : {
                anchor: 'end',
                align: function (context) {
                  return context.dataIndex % 2 === 0 ? 'top' : 'bottom';
                },
                offset: 4,
                rotation: 0,
                formatter: function (value, context) {
                  if (
                    value === null ||
                    value === undefined ||
                    value === '' ||
                    isNaN(value) ||
                    value === 0 ||
                    value === '0'
                  ) {
                    return null;
                  }
                
                  // Unified canvasId check
                  if (canvasId === "monthlyGender") {
                    return value;
                  } else {
                    return value + '%';
                  }
                },
                font: {
                  weight: 'bold',
                  size: 15
                },
                color: '#000',
                clip: false,
                display: function (context) {
                  const value = context.dataset.data[context.dataIndex];
                  return (
                    value !== null &&
                    value !== undefined &&
                    value !== 0 &&
                    value !== ''
                  );
                }
              }
          }
      },
      plugins: [ChartDataLabels, imagePlugin]
    });
  };

  // Handle error if image fails to load
  logoImage.onerror = () => {
    console.error('Failed to load image.');
  };
}
let graphChange = [];
// Main init function
async function init(offices) {
  let months = {
      month: [],
      year: []
  };

  const summaryData = [];

  const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
  const startMonth = 0; // February (0-based index)
  const startYear = 2025;
  
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based
  const currentYear = now.getFullYear();
  
  let year = startYear;
  let month = startMonth;
  
  while (year < currentYear || (year === currentYear && month <= currentMonth)) {
  months.month.push(monthNames[month]);
  months.year.push(year);
      month++;
      if (month > 11) {
          month = 0;
          year++;
      }
  }
  months.offices = offices;
  // console.log(months);
  const mont = document.getElementById('filterMonth3');
  const years = document.getElementById('filterYear3');
  const dropdown = mont.value+" "+years.value;
  // console.log(summaryPDF);
  const allData = {};
  const summaryChart = {};
  const envi = {};
  const sysproc = {};
  const staffServe = {};
  const genderPie = {
    Male : 0,
    Female : 0,
    LGBTQ : 0,
    Undefined : 0
  };
  const resType = {};

  const monthlyData = [];
  const responseData = [];
  const values = Array.from(mont.options).map(option => option.value);

  for (let i = 0; i < monthNames.length; i++) {
    let montS = "";
    let overallRate = 0;
    let allResponse = 0;
    const month = monthNames[i];
  
    if (values.includes(month)) {
      const monthR = await changeFilter(month, parseInt(years.value));
      count = 0;
      montS = month;
      Object.keys(monthR).forEach((key) => {
        if( monthR[key].overrate !== 'N/A'){
          count +=1;
          overallRate += parseFloat(monthR[key].overrate.replace("%", ""));
          // console.log(monthR[key].overrate);
          allResponse += monthR[key].online + monthR[key].offline;
        }
      });
       const pushRate = {
        overallRate : parseFloat((overallRate/count).toFixed(2))
       };
       const responses = {
        responses : allResponse
       }
      if(!monthlyData[years.value]){
        monthlyData[years.value] = [];
      }
      if(!responseData[years.value]){
        responseData[years.value] = [];
      }
      if(i <= currentMonth-1){
        monthlyData[years.value].push({montS, pushRate});
        responseData[years.value].push({montS, responses});
      }
    } //else {
    //   const pushRate = {
    //     overallRate : 0
    //    };
    //    const responses = {
    //     responses : 0
    //    }
    //   montS = month;
    //   if(!monthlyData[years.value]){
    //     monthlyData[years.value] = [];
    //   }
    //   if(!responseData[years.value]){
    //     responseData[years.value] = [];
    //   }
    //   monthlyData[years.value].push({montS, pushRate});
    //   responseData[years.value].push({montS, responses});
    // }
  }

  Object.keys(summaryPDF).forEach((key) => {
    const office = summaryPDF[key].department;
    const month = summaryPDF[key].month;
    let overrate = summaryPDF[key].overrate;
    if(summaryPDF[key].overrate === 'N/A'){
      overrate = 0;
    }
    const firstData = {
      'General Rating' : overrate
    }

    const secondData = {
      Environment : parseFloat(summaryPDF[key].qValues.Q1.RATE.replace("%", "")),
      'Systems and Procedures' : parseFloat(summaryPDF[key].sysrate.replace("%", "")),
      'Staff Service' : parseFloat(summaryPDF[key].staffrate.replace("%", ""))
    }

    const thirdData = {
      Environment : summaryPDF[key].qValues.Q1.RATE
    }
    const fourthData = {
      'Systems and Procedures' : summaryPDF[key].staffrate
    }
    const fifthData = {
      'Staff Service' : summaryPDF[key].sysrate
    }
    const sixthData = {
      'Online' : summaryPDF[key].online,
      'Offline' : summaryPDF[key].offline,
    }

    genderPie.Male += summaryPDF[key].gender.Male;
    genderPie.Female += summaryPDF[key].gender.Female;
    genderPie.LGBTQ += summaryPDF[key].gender.LGBTQ;
    genderPie.Undefined += summaryPDF[key].gender.Others;

    if(!allData[month]){
      allData[month] = [];
    }
    if(!summaryChart[month]){
      summaryChart[month] = [];
    }
    if(!envi[month]){
      envi[month] = [];
    }
    if(!sysproc[month]){
      sysproc[month] = [];
    }
    if(!staffServe[month]){
      staffServe[month] = [];
    }
    if(!resType[month]){
      resType[month] = [];
    }
    allData[month].push({office, firstData});
    summaryChart[month].push({office, secondData});
    envi[month].push({office, thirdData});
    sysproc[month].push({office, fourthData});
    staffServe[month].push({office, fifthData});
    resType[month].push({office, sixthData});
  });
  // console.log(genderPie);
  const general = "ADM-050-1";
  const line = "line";
  const sammary = "ADM-051-1";
  const bar = "bar";
  const enviC = "ADM-052-1";
  const sysprocC = "ADM-053-1";
  const staffServeC = "ADM-054-1";
  const genderC = "ADM-057-0";
  const monthDataC = "ADM-055-0";
  const responseC = "ADM-056-0";
  const pie = "pie";
  // console.log(allData[dropdown]);
  renderChart(allData[dropdown], 'genRating', dropdown, general, line);
  renderChart(summaryChart[dropdown], 'summary', dropdown, sammary, bar);
  renderChart(envi[dropdown], 'envi', dropdown, enviC, line);
  renderChart(sysproc[dropdown], 'sysproc', dropdown, sysprocC, line);
  renderChart(staffServe[dropdown], 'staffServe', dropdown, staffServeC, line);
  renderChart(genderPie, 'genders', dropdown, genderC, pie);
  renderChart(monthlyData[years.value], 'monthlyRating', years.value, monthDataC, line);
  renderChart(responseData[years.value], 'monthlyGender', years.value, responseC, line);
  renderChart(resType[dropdown], 'monthlyDistribution', dropdown, "", bar);

  mont?.addEventListener('change', async(e) => {
    // console.log(mont.value, years.value);
    const filterM = {};
    const summaryM = {};
    const enviM = {};
    const sysprocM = {};
    const staffServeM = {};
    const genderPieM = {
      Male : 0,
      Female : 0,
      LGBTQ : 0,
      Undefined : 0
    };
    const resTypeM = {};
    const intM = parseInt(years.value);
    const dataM = await changeFilter(mont.value, intM);
    const dropM = mont.value+" "+years.value;
    
    // console.log(dataM);
     Object.keys(dataM).forEach((key) => {
      const office = dataM[key].department;
      const month = dataM[key].month;
      let overrate = dataM[key].overrate;
      if(dataM[key].overrate === 'N/A'){
        overrate = 0;
      }
      const firstData = {
        'General Rating' : overrate
      }
      const secondData = {
        Environment : parseFloat(dataM[key].qValues.Q1.RATE.replace("%", "")),
        'Systems and Procedures' : parseFloat(dataM[key].sysrate.replace("%", "")),
        'Staff Service' : parseFloat(dataM[key].staffrate.replace("%", ""))
      }
      const thirdData = {
        Environment : dataM[key].qValues.Q1.RATE
      }

      const fourthData = {
        'Systems and Procedures' : dataM[key].staffrate
      }
      const fifthData = {
        'Staff Service' : dataM[key].sysrate
      }
      const sixthData = {
        'Online' : dataM[key].online,
        'Offline' : dataM[key].offline,
      }

      genderPieM.Male += dataM[key].gender.Male;
      genderPieM.Female += dataM[key].gender.Female;
      genderPieM.LGBTQ += dataM[key].gender.LGBTQ;
      genderPieM.Undefined += dataM[key].gender.Others;

      if(!filterM[month]){
        filterM[month] = [];
      }
      if(!summaryM[month]){
        summaryM[month] = [];
      }
      if(!enviM[month]){
        enviM[month] = [];
      }
      if(!sysprocM[month]){
        sysprocM[month] = [];
      }
      if(!staffServeM[month]){
        staffServeM[month] = [];
      }
      if(!resTypeM[month]){
        resTypeM[month] = [];
      }
      filterM[month].push({office, firstData});
      summaryM[month].push({office, secondData});
      enviM[month].push({office, thirdData});
      sysprocM[month].push({office, fourthData});
      staffServeM[month].push({office, fifthData});
      resTypeM[month].push({office, sixthData});
    });
    // console.log(sysprocM[dropdown]);
    renderChart(filterM[dropM], 'genRating', dropM, general, line);
    renderChart(summaryM[dropM], 'summary', dropM, sammary, bar);
    renderChart(enviM[dropM], 'envi', dropM, enviC, line);
    renderChart(sysprocM[dropM], 'sysproc', dropM, sysprocC, line);
    renderChart(staffServeM[dropM], 'staffServe', dropM, staffServeC, line);
    renderChart(genderPieM, 'genders', dropM, genderC, pie);
    renderChart(resTypeM[dropM], 'monthlyDistribution', dropM, "", bar);
  });

  years?.addEventListener('change', async(e) => {
    const filterY = {};
    const summaryY = {};
    const enviY = {};
    const sysprocY = {};
    const staffServeY = {};
    const genderPieY = {
      Male : 0,
      Female : 0,
      LGBTQ : 0,
      Undefined : 0
    };
    const resTypeY = {};

    const intM = parseInt(years.value);
    const dataY = await changeFilter(mont.value, intM);
    const dropY = mont.value+" "+years.value;

    const monthlyDatay = [];
    const responseDatay = [];
    const valuesy = Array.from(mont.options).map(option => option.value);

    for (let i = 0; i < monthNames.length; i++) {
      let montS = "";
      let overallRate = 0;
      let allResponse = 0;
      const month = monthNames[i];
    
      if (valuesy.includes(month)) {
        const monthR = await changeFilter(month, parseInt(years.value));
        count = 0;
        montS = month;
        Object.keys(monthR).forEach((key) => {
          if( monthR[key].overrate !== 'N/A'){
            count +=1;
            overallRate += parseFloat(monthR[key].overrate.replace("%", ""));
            // console.log(monthR[key].overrate);
            allResponse += monthR[key].online + monthR[key].offline;
          }
        });
        const pushRate = {
          overallRate : parseFloat((overallRate/count).toFixed(2))
        };
        const responses = {
          responses : allResponse
        }
        if(!monthlyDatay[years.value]){
          monthlyDatay[years.value] = [];
        }
        if(!responseDatay[years.value]){
          responseDatay[years.value] = [];
        }
        monthlyDatay[years.value].push({montS, pushRate});
        responseDatay[years.value].push({montS, responses});

      } else {
        const pushRate = {
          overallRate : 0
        };
        const responses = {
          responses : 0
        }
        montS = month;
        if(!monthlyDatay[years.value]){
          monthlyDatay[years.value] = [];
        }
        if(!responseDatay[years.value]){
          responseDatay[years.value] = [];
        }
        monthlyDatay[years.value].push({montS, pushRate});
        responseDatay[years.value].push({montS, responses});
      }
    }

    Object.keys(dataY).forEach((key) => {
      const office = dataY[key].department;
      const month = dataY[key].month;
      let overrate = dataY[key].overrate;
      if(dataY[key].overrate === 'N/A'){
        overrate = 0;
      }
      const firstData = {
        'General Rating' : overrate
      }
      const secondData = {
        Environment : parseFloat(dataY[key].qValues.Q1.RATE.replace("%", "")),
        'Systems and Procedures' : parseFloat(dataY[key].sysratereplace("%", "")),
        'Staff Service' : parseFloat(dataY[key].staffratereplace("%", ""))
      }
      const thirdData = {
        Environment : dataY[key].qValues.Q1.RATE,
      }
 
      const fourthData = {
        'Systems and Procedures' : dataY[key].staffrate
      }
      const fifthData = {
        'Staff Service' : dataY[key].sysrate
      }
      const sixthData = {
        'Online' : dataY[key].online,
        'Offline' : dataY[key].offline,
      }

      genderPieY.Male += dataY[key].gender.Male;
      genderPieY.Female += dataY[key].gender.Female;
      genderPieY.LGBTQ += dataY[key].gender.LGBTQ;
      genderPieY.Undefined += dataY[key].gender.Others;

      if(!filterY[month]){
        filterY[month] = [];
      }
      if(!summaryY[month]){
        summaryY[month] = [];
      }
      if(!enviY[month]){
        enviY[month] = [];
      }
      if(!staffServeY[month]){
        staffServeY[month] = [];
      }
      if(!sysprocY[month]){
        sysprocY[month] = [];
      }
      if(!resTypeY[month]){
        resTypeY[month] = [];
      }
      filterY[month].push({office, firstData});
      summaryY[month].push({office, secondData});
      enviY[month].push({office, thirdData});
      sysprocY[month].push({office, fourthData});
      staffServeY[month].push({office, fifthData});
      staffServeY[month].push({office, fifthData});
      resTypeY[month].push({office, sixthData});
    });
    
    renderChart(filterY[dropY], 'genRating', dropY, general, line);
    renderChart(summaryY[dropY], 'summary', dropY, sammary, bar);
    renderChart(enviY[dropY], 'envi', dropY, enviC, line);
    renderChart(sysprocY[dropY], 'sysproc', dropY, sysprocC, line);
    renderChart(staffServeY[dropY], 'staffServe', dropY, staffServeC, line);
    renderChart(genderPieY, 'genders', dropY, genderC, pie);
    renderChart(monthlyDatay[years.value], 'monthlyRating', years.value, monthDataC, line);
    renderChart(responseDatay[years.value], 'monthlyGender', years.value, responseC, line);
    renderChart(resTypeY[dropY], 'monthlyDistribution', dropY, "", bar);
  });
}  

async function changeFilter(month, year){
  // console.log(month, year);
  const offices = ["PBO","OPAcc","PTO","OPAss","LUPTO","OPAg","OPVet","PEO","LEEIPO","PGENRO","PDRRMO","PSWDO","PHO","LUPJ","OPG","BACSU","ICTU","SSU","OPA","HRMU","PIO","LIBRARY","PGSO","PLO","PPDC","SPO","PESU","ASMU","PHO-Clinic","PHO-Warehouse","PTO-Cash","PTO-Assessor"];
  
  const graphStatus = document.getElementById('graphStatus');
  
  const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Loading...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

  try{
    const response = await fetch('/api/getReport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ offices, month, year }),
    });
    const results = await response.json();
    // console.log(results);
    if (!results || Object.keys(results).length === 0) {
      graphStatus.innerHTML = `<p class="text-muted italic">No data to display.</p>`;
      return;
    }
    
    // console.log(results);
    return results;
  }catch(err){
    console.error('Fetch error:', err);
  }finally{
    hideLoadingOverlay();
  }
}

$('#generateGraph').on('click', function() {
    // --- Show Loading Overlay ---
    const showLoadingOverlay = () => {
        let overlay = document.getElementById('loadingOverlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Semi-transparent black
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            overlay.style.color = 'white';
            overlay.style.fontSize = '20px';
            overlay.style.zIndex = '9999'; // Ensure it's on top
            overlay.innerHTML = '<div class="spinner"></div><p>Generating Graph PDF...</p>'; // Updated message
            document.body.appendChild(overlay);
        }
        overlay.style.display = 'flex';
    };

    const hideLoadingOverlay = () => {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };

    showLoadingOverlay(); // Call this before your async operations

    let base64Images = [];

    const chartIds = ["genRating", "summary", "envi", "sysproc", "staffServe", "monthlyRating", "monthlyGender", "genders", "monthlyDistribution"];

    chartIds.forEach(chartId => {
        // Get the canvas element
        const canvas = document.getElementById(chartId);

        if (canvas) {
            // Convert the canvas content to a base64 image (you can specify the image format here)
            const chartBase64 = canvas.toDataURL('image/png'); // You can specify the image format (PNG or JPEG)

            // Log the base64 string to check the format
            // console.log(`Base64 Image for ${chartId}:`, chartBase64);

            // Check if the base64 string is a valid PNG or JPEG format
            if (chartBase64.startsWith('data:image/png;base64,')) {
                // console.log(`${chartId} image is in PNG format.`);
            } else if (chartBase64.startsWith('data:image/jpeg;base64,')) {
                // console.log(`${chartId} image is in JPEG format.`);
            } else {
                // console.warn(`${chartId} image has an unknown format.`);

            }

            // Add the base64 string to the array
            base64Images.push(chartBase64);
        } else {
            console.warn(`Canvas with ID ${chartId} not found.`);
        }
    });

    // Use a self-executing async function or convert the outer function to async
    // to properly use try...catch...finally with fetch.
    (async () => {
        try {
            const response = await fetch('/api/export-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ images: base64Images }) // Send an array of base64 images
            });

            if (!response.ok) throw new Error('Failed to generate PDF');

            const blob = await response.blob(); // Server responds with the PDF
            // Create a URL for the PDF Blob
            const url = URL.createObjectURL(blob);

            // Open the PDF in a new tab
            window.open(url, '_blank'); // Open in a new tab

            // Optionally, you can revoke the URL after some time to free up resources
            setTimeout(() => URL.revokeObjectURL(url), 1000);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to generate graph PDF.'); // Added an alert for user feedback
        } finally {
            hideLoadingOverlay(); // This will run whether there's an error or not
        }
    })(); // Self-executing async function
});