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
    case "PHO":
    case "PTO":
    case "Male":
      return "rgba(75, 192, 192, 0.6)";
    case "Systems and Procedures": 
    case "PHO-Warehouse":
    case "PTO-Cash":
    case "Female" :
      return "rgba(255, 159, 64, 0.6)";
    case "Staff Service": 
    case "PHO-Clinic":
    case "PTO-Assessor":
    case "LGBTQ" :
      return "rgba(153, 102, 255, 0.6)";
    case "Others" :
      return "rgba(0, 107, 36, 0.6)";
    case "Overall Rating" :
      return "rgba(0, 10, 150, 0.6)";
    case "Collection Rate" :
      return "rgba(255, 208, 0, 0.6)";
    case "Client" :
      return "rgba(8, 141, 30, 0.6)";
    case "Logbook" :
      return "rgba(151, 1, 8, 0.6)";
    default: return "rgba(100, 100, 100, 0.6)";
  }
}  

function normalizeCategory(category) {
  if (category === "overallRate") {
    return "Overall Rating";
  }
  if (category === "colRate") {
    return "Collection Rate";
  }
  if (category === "client") {
    return "Client";
  }
  if (category === "visitor") {
    return "Logbook";
  }
  return category;
}

function transformDataForChart(monthData, type = "bar") {
  if (!monthData || monthData.length === 0) {
    return { labels: [], datasets: [] };
  }

  const labels = monthData.map(entry => entry.month || entry.office);

  const firstAvailable =
    monthData[0].firstData ||
    monthData[0].secondData ||
    monthData[0].avgGen ||
    monthData[0].collectRate ||
    monthData[0].monthDataGen ||
    monthData[0].collection; 

  const categories = Object.keys(firstAvailable);

  const datasets = categories.map(category => {
    const displayCategory = normalizeCategory(category);

    const data = monthData.map(entry => {
      const src =
        entry.firstData ||
        entry.secondData ||
        entry.avgGen ||
        entry.collectRate ||
        entry.monthDataGen ||
        entry.collection;
      return src?.[category] ?? 0;
    });

    // Decide type automatically for client/logbook
    let dataset = {};
    if (category.toLowerCase() === "client") {
      dataset = {
        label: displayCategory,
        type: "bar",
        data,
        backgroundColor: getCategoryColor(displayCategory),
        showDataLabel: false // ✅ show datalabel
      };
    } else if (category.toLowerCase() === "logbook" || category.toLowerCase() === "visitor" || category.toLowerCase() === "pto"  || category.toLowerCase() === "pto-assessor" || category.toLowerCase() === "pto-cash" || category.toLowerCase() === "pho" || category.toLowerCase() === "pho-clinic" || category.toLowerCase() === "pho-warehouse") {
      dataset = {
        label: displayCategory,
        type: "line",
        data,
        borderColor: getCategoryColor(displayCategory),
        backgroundColor: getCategoryColor(displayCategory),
        fill: false,
        tension: 0.3,
        pointRadius: 6,
        pointHoverRadius: 8,
        showDataLabel: false // ❌ hide datalabel
      };
    } else {
      // default type
      const isBar = type === "bar";
      dataset = {
        label: displayCategory,
        type: isBar ? "bar" : "line",
        data,
        backgroundColor: getCategoryColor(displayCategory),
        borderColor: isBar ? undefined : getCategoryColor(displayCategory),
        fill: !isBar ? false : undefined,
        tension: !isBar ? 0.3 : undefined,
        pointRadius: !isBar ? 6 : undefined,
        pointHoverRadius: !isBar ? 8 : undefined,
        showDataLabel: true // show by default
      };
    }

    return dataset;
  });

  return { labels, datasets };
}

// Chart drawing function
let charts = {}; // We'll store multiple charts here

function renderChart(monthData, canvasId, type, categ) {
  const chartConfig = {
    yes: { showPercent: true },
    no: { showPercent: false }
  };
  const showPercent = chartConfig[categ]?.showPercent;
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext('2d');

  if (charts[canvasId]) charts[canvasId].destroy();

  const aspectRatio =
    canvasId === "myChart" || canvasId === "responses"
      ? 16 / 16
      : 16 / 8;

  const chartData = transformDataForChart(monthData, type);

  charts[canvasId] = new Chart(ctx, {
    type: type,
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: true, // allow chart to expand
      aspectRatio: aspectRatio,       // optional: define the ratio
      layout: {
        padding: { top: 30, bottom: 30, left: 100, right: 20 }
      },
      scales: {
        x: {
          ticks: {
            font: { size: 15, weight: 'bold' },
            maxRotation: 90,
            minRotation: 45,
            padding: 20,
            callback: function(value, index) {
              return this.getLabelForValue(value); // show every label
            }
          },
          grid: { display: false }
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 15, weight: 'bold' },
            padding: 20,
            callback: val => showPercent ? val + '%' : val
          },
          grid: { drawBorder: false }
        }
      },
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { boxWidth: 20, padding: 10 }
        },
        datalabels: {
          anchor: 'end',

          align: ctx => {
            const type = ctx.chart.config.type;
            return type === 'bar'
              ? ctx.dataIndex % 2 === 0 ? 'top' : 'bottom'
              : 'top';
          },

          offset: ctx => {
            const chart = ctx.chart;
            const type = chart.config.type;
            const i = ctx.dataIndex;
            const datasetIndex = ctx.datasetIndex;
            const data = ctx.dataset.data;
            const current = data[i];

            // Base offset (keep small)
            let offset = type === 'line' ? 6 : 4;

            // Slight separation between datasets
            offset += datasetIndex * (type === 'line' ? 3 : 2);

            // Small boost when values are close (cross-dataset)
            let closeCount = 0;
            chart.data.datasets.forEach(ds => {
              const v = ds.data[i];
              if (v !== undefined && Math.abs(v - current) < 2) {
                closeCount++;
              }
            });
            offset += closeCount * 3;

            // Bar charts can still alternate gently
            if (type === 'bar') {
              return i % 2 === 0 ? -offset : offset;
            }

            return offset;
          },

          // Keep labels visible
          clamp: true,
          clip: false,

          color: '#000',

          font: ctx => {
            const total =
              ctx.chart.data.labels.length *
              ctx.chart.data.datasets.length;

            return {
              weight: 'bold',
              size: total > 80 ? 15 : 15
            };
          },

          formatter: val => {
            if (val === 0 || val === null || val === undefined || isNaN(val)) {
              return null;
            }
            if (typeof val !== 'number') return val;

            return showPercent ? `${val.toFixed(2)}%` : val;
          },

          display: ctx => {
            const val = ctx.dataset.data[ctx.dataIndex];
            // Only display if dataset has showDataLabel = true
            return ctx.dataset.showDataLabel !== false && val !== 0 && val !== null && val !== undefined && !isNaN(val);
          }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

// Main init function
async function init(offices) {
    let months = {
        month: [],
        year: []
    };

    const officeData = {};
    const mainDiv = document.getElementById("dataAnalysis");

    offices.forEach(office => {
      if(office == "PHO" || office == "PHO-Clinic" || office == "PHO-Warehouse"){
        if(!officeData['PHO']){
          officeData['PHO'] = {
            CC: {},
            responses: {},
            general: {},
            collection_rate:{}
          };

          let pho = document.createElement("div");
          pho.id = 'PHO';
          Object.assign(pho.style, {
            margin: "auto",
            justifyContent: "center",  // horizontal
            textAlign: "center",      // vertical
          });

          let title = document.createElement("h2");
          title.textContent = "PHO DATA";

          pho.appendChild(title);

          createElements("PHO", mainDiv, pho);
        }

      }else if(office == "PTO" || office == "PTO-Cash" || office == "PTO-Assessor"){
        if(!officeData['PTO']){
          officeData['PTO'] = {
            CC: {},
            responses: {},
            general: {},
            collection_rate:{}
          };

          let pho = document.createElement("div");
          pho.id = 'PTO';
          Object.assign(pho.style, {
            margin: "auto",
            justifyContent: "center",  // horizontal
            textAlign: "center",      // vertical
          });

          let title = document.createElement("h2");
          title.textContent = "PTO DATA";

          pho.appendChild(title);

          createElements("PTO", mainDiv, pho);
        }
      }else{
        if(!officeData[office]){
          officeData[office] = {
            CC: {},
            responses: {},
            general: {},
            collection_rate:{}
          };
        }
        
        let pho = document.createElement("div");
        pho.id = office;
        Object.assign(pho.style, {
          margin: "auto",
          justifyContent: "center",  // horizontal
          textAlign: "center",      // vertical
        });

        let title = document.createElement("h2");
        title.textContent = office+" DATA";

        pho.appendChild(title);

        createElements(office, mainDiv, pho);
      }
    });

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
            Environment: parseFloat(entry.qValues.Q1.RATE).toFixed(2),
            'Systems and Procedures': parseFloat(entry.sysrate).toFixed(2),
            'Staff Service' : parseFloat(entry.overrate).toFixed(2),
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

        // const monthData = monthNames[currentMonth]+" "+currentYear;
        // console.log(monthData);
        
        if (office === "PHO" || office.startsWith("PHO-")) {
          const deptName = "PHO";

          const ccData = {
            aware: entry.cc1['Yes'] + entry.cc1['Just Now'],
            visible: entry.cc2.Visible + entry.cc2['Somewhat Visible'],
            helpful: entry.cc3['Very Much'] + entry.cc3.Somewhat,
            client: entry.collection
          };

          // Ensure month exists
          if (!officeData[deptName].CC[month]) {
            officeData[deptName].CC[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].CC[month][office]) {
            officeData[deptName].CC[month][office] = [];
          }

          // THIS IS THE ARRAY FOR CC DATA
          officeData[deptName].CC[month][office].push(ccData);

          const genData = {
            overallRate: parseFloat(entry.overrate)
          }

          if (!officeData[deptName].general[month]) {
            officeData[deptName].general[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].general[month][office]) {
            officeData[deptName].general[month][office] = [];
          }

          // THIS IS THE ARRAY FOR GENERAL DATA AND ITS BREAKDOWN
          officeData[deptName].general[month][office].push(genData);

          const collectData = {
            collection: entry.collection,
            logbook: entry.visitor
          }

          if (!officeData[deptName].responses[month]) {
            officeData[deptName].responses[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].responses[month][office]) {
            officeData[deptName].responses[month][office] = [];
          }

          // THIS IS THE ARRAY FOR COLLECTION DATA RATE, BREAKDOWN OVERALL AND DETAILED BREAKDOWN
          officeData[deptName].responses[month][office].push(collectData);

        }else if(office === "PTO" || office.startsWith("PTO-")){
          const deptName = "PTO";

          const ccData = {
            aware: entry.cc1['Yes'] + entry.cc1['Just Now'],
            visible: entry.cc2.Visible + entry.cc2['Somewhat Visible'],
            helpful: entry.cc3['Very Much'] + entry.cc3.Somewhat,
            client: entry.collection
          };

          if (!officeData[deptName].CC[month]) {
            officeData[deptName].CC[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].CC[month][office]) {
            officeData[deptName].CC[month][office] = [];
          }

          officeData[deptName].CC[month][office].push(ccData);

          const genData = {
            overallRate: parseFloat(entry.overrate)
          }

          if (!officeData[deptName].general[month]) {
            officeData[deptName].general[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].general[month][office]) {
            officeData[deptName].general[month][office] = [];
          }

          // THIS IS THE ARRAY FOR GENERAL DATA AND ITS BREAKDOWN
          officeData[deptName].general[month][office].push(genData);

          const collectData = {
            collection: entry.collection,
            logbook: entry.visitor
          }

          if (!officeData[deptName].responses[month]) {
            officeData[deptName].responses[month] = {};
          }

          // Ensure office exists dynamically
          if (!officeData[deptName].responses[month][office]) {
            officeData[deptName].responses[month][office] = [];
          }

          // THIS IS THE ARRAY FOR COLLECTION DATA RATE, BREAKDOWN OVERALL AND DETAILED BREAKDOWN
          officeData[deptName].responses[month][office].push(collectData);
        }else{
          const deptName = office;

          const ccData = {
            aware: entry.cc1['Yes'],
            visible: entry.cc2.Visible,
            helpful: entry.cc3['Very Much'],
            client: entry.collection
          };
          if(!officeData[deptName].CC[month]){
            officeData[deptName].CC[month] = [];
          }
          officeData[deptName].CC[month].push(ccData);

          const genData = {
            overallRate: parseFloat(entry.overrate)
          }

          if(!officeData[deptName].general[month]){
            officeData[deptName].general[month] = [];
          }
          officeData[deptName].general[month].push(genData);

          // THIS IS THE ARRAY FOR GENERAL DATA AND ITS BREAKDOWN
          // officeData[deptName].general[month].push(genData);

          const collectData = {
            collection: entry.collection,
            logbook: entry.visitor
          }

          if(!officeData[deptName].responses[month]){
            officeData[deptName].responses[month] = [];
          }

          // THIS IS THE ARRAY FOR COLLECTION DATA RATE, BREAKDOWN OVERALL AND DETAILED BREAKDOWN
          officeData[deptName].responses[month].push(collectData);
        }
      });
    });

    console.log(officeData);

    renderChart(allData[dropdown], 'myChart', "bar", "yes");
    renderChart(gender[dropdown], 'responses', "bar", "no");
    
    plotOfficeData(officeData, mont, years, dropdown);

    mont?.addEventListener('change', (e) => {
      const selected = e.target.value+" "+years.value;
        console.log(selected);
      const data = allData[selected];
      const genders = gender[selected];
  
      if (data && genders) {
        renderChart(data, 'myChart', "bar", "yes");
        renderChart(genders, 'responses', "bar", "no");
      }else if(data && !gender){
        renderChart(data, 'myChart', "bar", "yes");
      }else if(!data && gender){
        renderChart(genders, 'responses', "bar", "no");
      }

      plotOfficeData(officeData, mont, years, dropdown);

    });
    years?.addEventListener('change', (e) => {
      const selected = mont.value+" "+e.target.value;
      const data = allData[selected];
      const genders = gender[selected];
  
      if (data && genders) {
        console.log("this");
        renderChart(data, 'myChart', "bar", "yes");
        renderChart(genders, 'responses', "bar", "no");
      }else if(data && !gender){
        renderChart(data, 'myChart', "bar", "yes");
      }else if(!data && gender){
        renderChart(genders, 'responses', "bar", "no");
      }

      plotOfficeData(officeData, mont, years, dropdown);

    });
  } 

function setOptions() {
  const baselineYear = 2025;
  const baselineMonth = 0; // March (0-indexed)
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-indexed

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const filterYears = [
    document.getElementById('filterYear'),
    document.getElementById('filterYear2'),
    document.getElementById('filterYear3')
  ].filter(Boolean);

  const filterMonths = [
    document.getElementById('filterMonth'),
    document.getElementById('filterMonth2'),
    document.getElementById('filterMonth3')
  ].filter(Boolean);

  // Populate year selects
  filterYears.forEach(filterYear => {
    for (let year = baselineYear; year <= currentYear; year++) {
      const option = document.createElement('option');
      option.value = year;
      option.innerText = year;
      option.selected = year === currentYear; // default select current year
      filterYear.appendChild(option);
    }

    // Populate months for the default selected year
    populateMonths(filterYear.value, filterMonths);
    
    // Add event listener for year change
    filterYear.addEventListener('change', e => {
      populateMonths(e.target.value, filterMonths);
    });
  });

  // Function to populate months based on selected year
  function populateMonths(selectedYear, monthSelects) {
    monthSelects.forEach(select => {
      select.innerHTML = ''; // clear previous options

      const year = parseInt(selectedYear, 10);
      let startM = 0; // default January
      let endM = 11; // default December

      if (year === baselineYear) startM = baselineMonth; // baseline starts at baselineMonth
      if (year === currentYear) endM = currentMonth;     // current year ends at current month

      for (let m = startM; m <= endM; m++) {
        const option = document.createElement('option');
        option.value = months[m];
        option.innerText = months[m];
        option.selected = (year === currentYear && m === currentMonth); // default current month
        select.appendChild(option);
      }
    });
  }
}

function createElements(officeName, mainDiv, mainName){
  const phoArray = {
    firstDiv:{
      one: ["rate", "Overall Feedback Rating"],
      two: ["breakdown", "Breakdown of Rating Data"]
    },
    secondDiv:{
      one: ["collect", "Overall Collection Rate"],
      two: ["collectBreak", "Breakdown of Collection vs Logbook"]
    },
    thirdDiv:{
      one: ["tableCollect", "Detailed Breakdown of Collection"],
      two: ["tableCCQ", "Citizen's Charter Awareness"]
    }
  }

  const phoArray2 = {
    firstDiv:{
      one: ["rate", "Overall Feedback Rating"],
      two: ["collect", "Overall Collection Rate"]
    },
    thirdDiv:{
      one: ["collectBreak", "Breakdown of Collection vs Logbook"],
      two: ["tableCCQ", "Citizen's Charter Awareness"]
    }
  }
  if(officeName == "PHO" || officeName == "PTO"){ 
    
    for (const divKey of Object.keys(phoArray)) {
      const innerObj = phoArray[divKey];
      let generalDiv = document.createElement('div');
      
      generalDiv.style.justifyContent = "space-around";
      generalDiv.style.gap = "20px";
      // inner loop → one, two
      for (const innerKey of Object.keys(innerObj)) {
        const idName =  innerObj[innerKey][0];
        const textContent =  officeName +" "+ innerObj[innerKey][1];

        let halfdiv = document.createElement('div');
        halfdiv.style.width = "100%";
        halfdiv.style.margin = "auto";

        // this is the canvas or table
        if(divKey == "thirdDiv"){
          Object.assign(halfdiv.style, {
            width: "100%",
            margin: "auto",
            alignItems: "center", // remove if you only want horizontal centering
          });
          generalDiv.style.display = "block";
          let collectionTable = document.createElement("table");
          collectionTable.id = officeName+idName;
          
          //title
          let h3 = document.createElement("h3");
          h3.textContent = textContent;     

          //appending the halfdiv
          halfdiv.appendChild(h3);
          halfdiv.appendChild(collectionTable);
        }else{
          Object.assign(halfdiv.style, {
            width: "100%",
            margin: "auto",
            alignItems: "center", // remove if you only want horizontal centering
          });
          generalDiv.style.display = "block";
          let canv = document.createElement("canvas");
          canv.id = officeName+idName;
          //appending the halfdiv

          //title
          let h3 = document.createElement("h3");
          h3.textContent = textContent;  

          halfdiv.appendChild(h3);
          halfdiv.appendChild(canv);
        }

        //firstappend
        generalDiv.appendChild(halfdiv);
      }
      mainName.appendChild(generalDiv);
    }
    mainDiv.appendChild(mainName);
  }else{
    for (const divKey of Object.keys(phoArray2)) {
      const innerObj = phoArray2[divKey];
      let generalDiv = document.createElement('div');
      generalDiv.style.display = "block";
      generalDiv.style.justifyContent = "space-around";
      generalDiv.style.gap = "20px";
      // inner loop → one, two
      for (const innerKey of Object.keys(innerObj)) {
        const idName =  innerObj[innerKey][0];
        const textContent =  officeName +" "+ innerObj[innerKey][1];

        let halfdiv = document.createElement('div');
        halfdiv.style.width = "100%";
        halfdiv.style.margin = "auto";

        // center horizontally (and vertically if needed)
        Object.assign(halfdiv.style, {
          width: "100%",
          margin: "auto",
          alignItems: "center", // remove if you only want horizontal centering
        });

        // this is the canvas or table
        if (divKey === "thirdDiv" && idName === "tableCCQ") {
          let collectionTable = document.createElement("table");
          collectionTable.id = officeName+idName;
          
          //title
          let h3 = document.createElement("h3");
          h3.textContent = textContent;     

          //appending the halfdiv
          halfdiv.appendChild(h3);
          halfdiv.appendChild(collectionTable);
        }else{
          let canv = document.createElement("canvas");
          canv.id = officeName+idName;
          //appending the halfdiv

          //title
          let h3 = document.createElement("h3");
          h3.textContent = textContent;  

          halfdiv.appendChild(h3);
          halfdiv.appendChild(canv);
        }

        //firstappend
        generalDiv.appendChild(halfdiv);
      }
      mainName.appendChild(generalDiv);
    }
    mainDiv.appendChild(mainName);
  }
}

function plotOfficeData(officeData, mont, years, dropdown){
  Object.keys(officeData).forEach(ofc => {
    const dropD = `${mont.value} ${years.value}`;

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const stopMonth = mont.value; 

    if(ofc == "PHO" || ofc == "PTO"){

      const genRate = officeData[ofc].general;
      const colRate = officeData[ofc].responses;

      const individual= [];
      const total = [];
      const overCollectRate = [];
      const indiCollect = [];

      // e.g., "August"

      // Loop through months in order
      let genCount = 0;
      let genSum = 0;
      let collectSum = 0;
      let visitSum = 0;
      for (const month of monthNames) {
        const monthYear = `${month} ${years.value}`;
        
        if (!genRate[monthYear]) continue; // skip if no data for this month
        const monthDataGen = {};
        for (const officeName of Object.keys(genRate[monthYear])) {
          const record = genRate[monthYear][officeName][0].overallRate;
          const rawCollection = colRate[monthYear][officeName][0].collection;
          const rawLogbook   = colRate[monthYear][officeName][0].logbook;
          // console.log(officeName, rawCollection, rawLogbook);

          const record2 = Number.isFinite(Number(rawCollection)) ? Number(rawCollection) : 0;
          const record3 = Number.isFinite(Number(rawLogbook)) ? Number(rawLogbook) : 0;

          // Only add if it's a valid number
          if (Number.isFinite(record)) {
            monthDataGen[officeName] = record;
            genSum += record;
            collectSum += record2;
            visitSum += record3;
            genCount++;
          }
        }
        const avgGen = {
          overallRate: parseFloat(genSum/genCount).toFixed(2)
        };

        const collectRate = {
          colRate: parseFloat(collectSum/visitSum*100).toFixed(2)
        }

        const collection = {
          client: collectSum,
          visitor: visitSum
        } 

        if (Object.keys(monthDataGen).length > 0) {
          total.push({ month, monthDataGen: monthDataGen });
        }
        
        individual.push({month, avgGen});
        indiCollect.push({month, collection});
        overCollectRate.push({month, collectRate});
        // console.log("PHO", indiCollect);
        // console.log("PHO", overCollectRate);
        genCount = 0;
        genSum = 0;
        collectSum = 0;
        visitSum = 0;

        if (month === stopMonth) {
          break;
        }
      }

      // console.log(total);
      renderChart(individual, ofc+"rate", "bar", "yes");
      renderChart(total, ofc+"breakdown", "line", "no");
      renderChart(indiCollect, ofc+"collectBreak", "bar", "no");
      renderChart(overCollectRate, ofc+"collect", "line", "yes");
      const responseData = {};
      Object.keys(officeData[ofc].CC).forEach(monthCC => {
        if (monthCC == dropD) {
          const tableContainer = document.getElementById(ofc + "tableCCQ");

          if (!tableContainer) return;

          tableContainer.style.width = "100%";
          tableContainer.style.borderCollapse = "collapse";
          tableContainer.style.tableLayout = "fixed";

          // Set table header
          tableContainer.innerHTML = `
            <thead>
              <tr style="background-color: darkblue; color: white;">
                <td>OFFICE</td>
                <td>AWARE</td>
                <td>VISIBLE</td>
                <td>HELPFUL</td>
                <td>CLIENTS</td>
              </tr>
            </thead>
            <tbody id="${ofc}tbodyCCQ"></tbody>
          `;

          const tbody = document.getElementById(`${ofc}tbodyCCQ`);

          // Loop over each office / CC data
          Object.keys(officeData[ofc].CC[monthCC]).forEach(ccqData => {
            const ccData = officeData[ofc].CC[monthCC][ccqData][0]; // access first object

            // Build the row as a single string
            let rowHTML = `<tr>
              <td style="font-weight:bold">${ccqData}</td>
              <td>${ccData.aware}</td>
              <td>${ccData.visible}</td>
              <td>${ccData.helpful}</td>
              <td>${ccData.client}</td>
            </tr>`;

            // Insert the row at once
            tbody.insertAdjacentHTML("beforeend", rowHTML);
          });
        }
      });

      // const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        
      const tableContainer = document.getElementById(ofc + "tableCollect");

      tableContainer.style.width = "100%";
      tableContainer.style.borderCollapse = "collapse";
      tableContainer.style.tableLayout = "fixed";

      tableContainer.innerHTML = `
        <thead>
          <tr id="${ofc}trResponses" style="font-weight:bold; text-align:center; background-color:darkblue; color:white;">
            <th></th>
          </tr>
        </thead>
        <tbody id="${ofc}tbodyRes" style="text-align:center;">

        </tbody>
      `;

      const trConts = document.getElementById(`${ofc}trResponses`);
      let counter = 1;
      for (const month of monthNames) {
        trConts.insertAdjacentHTML("beforeend", `
          <th>${month}</th>
        `);
        counter ++;
        if(month == mont.value){
          break;
        }
      }

      const tbodyres = document.getElementById(`${ofc}tbodyRes`);
      
      for (const month of monthNames) {
        const monthYear = `${month} ${years.value}`;
        const constVar = officeData[ofc].responses[monthYear];

        if (!constVar) continue; // skip if no data

        for (const resOfc of Object.keys(constVar)) {
          if (!responseData[resOfc]) {
            responseData[resOfc] = {
              collection: [],
              visitors: []
            };
          }

          // safely access first element of array
          if (constVar[resOfc] && constVar[resOfc].length > 0) {
            responseData[resOfc].collection.push(constVar[resOfc][0].collection);
            responseData[resOfc].visitors.push(constVar[resOfc][0].logbook); // assuming 'visitors' = 'logbook'
          } else {
            responseData[resOfc].collection.push(0);
            responseData[resOfc].visitors.push(0);
          }
        }

        // Stop at the target month
        if (month === mont.value) {
          break;
        }
      }
      Object.keys(responseData).forEach(resData => {
        // Build header row
        tbodyres.insertAdjacentHTML("beforeend", `
          <tr>
            <th colspan="${counter}">${resData}</th>
          </tr>
        `);

        // Build Collection row
        let collectRow = `<tr><td>Collection</td>`;
        responseData[resData].collection.forEach(val => {
          collectRow += `<td>${val}</td>`;
        });
        collectRow += `</tr>`;
        tbodyres.insertAdjacentHTML("beforeend", collectRow);

        // Build Visitors row
        let visitorRow = `<tr><td>Visitors</td>`;
        responseData[resData].visitors.forEach(val => {
          visitorRow += `<td>${val}</td>`;
        });
        visitorRow += `</tr>`;
        tbodyres.insertAdjacentHTML("beforeend", visitorRow);
      });

      // console.log(responseData);
    }else{
      const individual= [];
      const colRate = [];
      const colDist = [];
      for (const month of monthNames) {
        const monthYear = `${month} ${years.value}`;
        const raw = officeData[ofc].general?.[monthYear]?.[0]?.overallRate;
        const raw2 = officeData[ofc].responses?.[monthYear]?.[0]
        const avgGen = {
          overallRate:Number.isFinite(Number(raw)) ? Number(raw) : 0
        }
        const collection = {
          client: Number.isFinite(Number(raw2.collection)) ? Number(raw2.collection) : 0,
          visitor: Number.isFinite(Number(raw2.logbook)) ? Number(raw2.logbook) : 0
        }

        // console.log(avgGen);
        individual.push({month, avgGen});
        colDist.push({month, collection});

        if (month === stopMonth) {
          break;
        }
      }
      for (const month of monthNames) {
        const monthYear = `${month} ${years.value}`;
        const collection = officeData[ofc].responses?.[monthYear]?.[0]?.collection;
        const logs = officeData[ofc].responses?.[monthYear]?.[0]?.logbook;
        const raw = parseFloat(collection/logs*100).toFixed(2);
        const collectRate = {
          colRate:Number.isFinite(Number(raw)) ? Number(raw) : 0
        }

        // console.log(colRate);
        colRate.push({month, collectRate});

        if (month === stopMonth) {
          break;
        }
      }
      // console.log(colDist);
      renderChart(individual, ofc+"rate", "bar", "yes"); 
      renderChart(colDist, ofc+"collectBreak", "line", "no"); 
      renderChart(colRate, ofc+"collect", "line", "yes"); 

      Object.keys(officeData[ofc].CC).forEach(monthCC => {
        
        if (monthCC == dropD) {

          const tableContainer = document.getElementById(ofc + "tableCCQ");

          tableContainer.style.width = "100%";
          tableContainer.style.borderCollapse = "collapse";
          tableContainer.style.tableLayout = "fixed";

          if (!tableContainer) return;
          // console.log(officeData[ofc].CC[monthCC]);
          tableContainer.innerHTML = `
            <thead>
              <tr style="background-color: darkblue; color: white;">
                <td>AWARE</td>
                <td>VISIBLE</td>
                <td>HELPFUL</td>
                <td>CLIENTS</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${officeData[ofc].CC[monthCC][0].aware}</td>
                <td>${officeData[ofc].CC[monthCC][0].visible}</td>
                <td>${officeData[ofc].CC[monthCC][0].helpful}</td>
                <td>${officeData[ofc].CC[monthCC][0].client}</td>
              </tr>
            </tbody>
          `;
        }
      });
    }
  });
}
