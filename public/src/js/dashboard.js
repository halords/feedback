window.onload = function() {
    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!loggedInUser) {
      window.location.href = 'login.html';  // Redirect to login page if not logged in
    } else {
      if(loggedInUser.user_type !== "superadmin"){
        document.getElementById('report').remove();
      }
      // console.log(loggedInUser.offices); // This is the user object that is stored in local storag
      document.getElementById('displayUsername').textContent = loggedInUser.fullname;
      setOptions();
      init(loggedInUser.offices); // Fetch user data if logged in
    }
  };

let myChart;

function getCategoryColor(category) {
    switch (category) {
      case "Environment":
      case "Male":
        return "rgba(75, 192, 192, 0.6)";
      case "Systems and Procedures": 
      case "Female" :
        return "rgba(255, 159, 64, 0.6)";
      case "Staff Service": 
      case "LGBTQ" :
        return "rgba(153, 102, 255, 0.6)";
      case "Others" :
        return "rgba(0, 107, 36, 0.6)";
      
      default: return "rgba(100, 100, 100, 0.6)";
    }
  }  

  function transformDataForChart(monthData) {
    // console.log(monthData);
    if (!monthData || monthData.length === 0) {
      return { labels: [], datasets: [] };
    }
  
    const labels = monthData.map(entry => entry.office);
  
    // Dynamically detect if we should use firstData or secondData
    const firstAvailable = monthData[0].firstData || monthData[0].secondData;
  
    const categories = Object.keys(firstAvailable);
  
    const datasets = categories.map(category => ({
      label: category,
      data: monthData.map(entry => {
        const dataObject = entry.firstData || entry.secondData; // <-- important
        const value = dataObject[category];
  
        // If value is a string percentage ("100%"), convert it to a float
        if (typeof value === "string" && value.includes("%")) {
          return parseFloat(value.replace('%', ''));
        }
  
        return value ?? 0; // In case it's undefined, return 0
      }),
      backgroundColor: getCategoryColor(category)
    }));
  
    return { labels, datasets };
  }  

// Chart drawing function
let charts = {}; // We'll store multiple charts here

function renderChart(monthData, canvasId) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  // If a chart already exists on this canvas, destroy it first
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  const chartData = transformDataForChart(monthData);

  charts[canvasId] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 16 / 9,
      scales: {
        y: {
          beginAtZero: true
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            boxWidth: 20,
            padding: 10
          },
          maxHeight: 30 // Forces legend into one line
        }
      }
    }
  });
}

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
    const mont = document.getElementById('filterMonth');
    const years = document.getElementById('filterYear');
    const dropdown = mont.value+" "+years.value;
    
    const response = await fetch('/api/fetchDashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ months }),
      });
    const userData = await response.json();
    // console.log(userData);
    const allData = {};
    const gender = {};
    userData.forEach(row => {
        Object.values(row).forEach(entry =>{
            const office = entry.department;
            const month = entry.month;

            const firstData = {
                Environment: entry.qValues.Q1.RATE,
                'Systems and Procedures': entry.sysrate,
                'Staff Service' : entry.overrate,
            }

            const secondData = {
              Male: entry.gender.Male,
              Female: entry.gender.Female,
              LGBTQ: entry.gender.LGBTQ,
              Others: entry.gender.Others
            };
            if(!allData[month]){
              allData[month] = [];
            }
            if(!gender[month]){
              gender[month] = [];
            }
            allData[month].push({office, firstData});
            gender[month].push({office, secondData});
        });
    });
    
    renderChart(allData[dropdown], 'myChart');
    renderChart(gender[dropdown], 'responses');
  
    mont?.addEventListener('change', (e) => {
      const selected = e.target.value+" "+years.value;
        console.log(selected);
      const data = allData[selected];
      const genders = gender[selected];
  
      if (data && genders) {
        renderChart(data, 'myChart');
        renderChart(genders, 'responses');
      }else if(data && !gender){
        renderChart(data, 'myChart');
      }else if(!data && gender){
        renderChart(genders, 'responses');
      }
    });
    years?.addEventListener('change', (e) => {
      const selected = mont.value+" "+e.target.value;
      const data = allData[selected];
      const genders = gender[selected];
  
      if (data && genders) {
        console.log("this");
        renderChart(data, 'myChart');
        renderChart(genders, 'responses');
      }else if(data && !gender){
        renderChart(data, 'myChart');
      }else if(!data && gender){
        renderChart(genders, 'responses');
      }
    });
  }  

function setOptions(){
    const baselineYear = 2025;
    const baselineMonth = 1; // March (1-indexed)
  
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();  // Note: months are 0-indexed (0 = January, 11 = December)
    
      const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ];
    
      const filterMonth = document.getElementById('filterMonth');
      const filterYear = document.getElementById('filterYear');
    
      if(currentYear > baselineYear){
        for(let year = baselineYear; year <= currentYear; year++){
          const option = document.createElement('option');
          option.value = year;
          option.innerText = year;
          option.selected = year === currentYear;  // Set current year as selected
          filterYear.appendChild(option);
        }
        for(let month = 1; month <= 12; month++){
          const option2 = document.createElement('option');
          option2.value = months[month-1];  // Months in the dropdown will be 1-indexed (1 = January, 12 = December)
          option2.innerText = months[month-1];
          option2.selected = month === currentMonth;  // Set current month as selected
          filterMonth.appendChild(option2);
        }
      }else if(currentYear === baselineYear){
        const option = document.createElement('option');
        option.value = currentYear;
        option.innerText = currentYear;
        option.selected = currentYear === currentYear;  // Set current year as selected
        filterYear.appendChild(option);
        for(let month = baselineMonth; month <= currentMonth+1; month++){
          const option2 = document.createElement('option');
          option2.value = months[month-1];  // Months in the dropdown will be 1-indexed (1 = January, 12 = December)
          option2.innerText = months[month-1];
          option2.selected = month === currentMonth;  // Set current month as selected
          filterMonth.appendChild(option2);
        }
      }
  }