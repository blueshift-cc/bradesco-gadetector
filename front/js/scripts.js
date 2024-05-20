document.getElementById('submitButton').addEventListener('click', function () {
  let urlTextArea = document.getElementById('urlTextArea').value;
  document.getElementById('resultsDiv').style.display = 'none';

  var btn = document.getElementById('submitButton');
  btn.disabled = true;

  if (urlTextArea == "") {
    btn.disabled = false;
    return;
  }
  document.getElementById('loading-spinner').style.display = 'flex';
  fetch('/api/process', {
    method: "POST",
    mode: "cors",
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ urlTextArea: urlTextArea })
  })
    .then(response => response.json())
    .then(data => {
      if (data.length > 0) {
        let table = new DataTable('#results-table');
        table.destroy();
        var temp = "";
        var ga3count = 0;
        var ga4count = 0;
        var offlinecount = 0;
        var ganonecount = 0;
        data.forEach((itemData) => {
          temp += "<tr>";
          temp += "<td>" + itemData.url + "</td>";
          temp += "<td>" + itemData.version + "</td>";
          temp += "<td>" + itemData.tag + "</td></tr>";

          if (itemData.version == 3) {
            ga3count++;
          }
          else if (itemData.version == 4) {
            ga4count++;
          }
          else if (itemData.tag == "offline") {
            offlinecount++;
          }
          else {
            ganonecount++;
          }
        });
        document.getElementById('tableData').innerHTML = temp;
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('resultsDiv').style.display = '';

        table = new DataTable('#results-table', {
          layout: {
            topStart: {
              buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
            }
          }
        });

        if (window.doughnutChart !== undefined)
          window.doughnutChart.destroy();

        var chrt = document.getElementById("chartId").getContext("2d");

        let chartConfig = {
          type: 'doughnut',
          data: {
            labels: ["GA3", "GA4", "NÃO TEM GA", "OFFLINE"],
            datasets: [{
              label: "Versão do Google Analytics",
              data: [ga3count, ga4count, ganonecount, offlinecount],
              backgroundColor: ['yellow', 'green', 'red', 'gray'],
              hoverOffset: 5
            }],
          },
          options: {
            responsive: false,
          },
        };
        window.doughnutChart = new Chart(chrt, chartConfig);
        //chartId.update(chartConfig);
      }
      btn.disabled = false;
    })
    .catch(error => {
      document.getElementById('loading-spinner').style.display = 'none';
      console.error('Error:', error);
      btn.disabled = false;
    });
});

window.addEventListener('DOMContentLoaded', (event) => {

});