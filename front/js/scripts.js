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
        var ga34count = 0;
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
          else if (itemData.version === "3, 4") {
            ga34count++;
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
          paging: true,
          pageLength: 50,
          lengthMenu: [
            [10, 25, 50, -1],
            [10, 25, 50, 'All']
          ],
          layout: {
            topStart: {
              buttons: ['pageLength', 'copy', 'csv', 'excel', 'pdf', 'print']
            }
          },
          initComplete: function () {
            this.api()
              .columns()
              .every(function () {
                let column = this;

                console.log(column);
                // Create select element
                let select = document.createElement('select');
                select.add(new Option(''));
                column.footer().replaceChildren(select);

                // Apply listener for user change in value
                select.addEventListener('change', function () {
                  column
                    .search(select.value, { exact: true })
                    .draw();
                });

                // Add list of options
                column
                  .data()
                  .unique()
                  .sort()
                  .each(function (d, j) {
                    select.add(new Option(d));
                  });
              });
          }
        });

        if (window.doughnutChart !== undefined)
          window.doughnutChart.destroy();

        var chrt = document.getElementById("chartId").getContext("2d");

        let chartConfig = {
          type: 'doughnut',
          data: {
            labels: ["GA3", "GA4", "GA4/GA4", "NÃO TEM GA", "OFFLINE"],
            datasets: [{
              label: "Versão do Google Analytics",
              data: [ga3count, ga4count, ga34count, ganonecount, offlinecount],
              backgroundColor: ['yellow', 'green', 'blue', 'red', 'gray'],
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