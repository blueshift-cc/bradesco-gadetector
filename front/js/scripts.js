/*!
* Start Bootstrap - Bare v5.0.9 (https://startbootstrap.com/template/bare)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-bare/blob/master/LICENSE)
*/
// This file is intentionally blank
// Use this file to add JavaScript to your project

document.getElementById('submitButton').addEventListener('click', function() {
    let urlTextArea = document.getElementById('urlTextArea').value;
    fetch('/api/process', {
        method: "POST",
        mode: "cors",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
        body: JSON.stringify({urlTextArea: urlTextArea})
    })
      .then(response => response.json())
      .then(data => {
        console.log(data);
        if (data.length > 0) {
            var temp = "";
            data.forEach((itemData) => {
              temp += "<tr>";
              temp += "<td>" + itemData.url + "</td>";
              temp += "<td>" + itemData.version + "</td>";
              temp += "<td>" + itemData.tag + "</td></tr>";
            });
            document.getElementById('tableData').innerHTML = temp;
          }
      })
      .catch(error => console.error('Error:', error));
  });