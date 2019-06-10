const deviceList = [];

// Bind the functions to the buttons
function init() {
 
  createMarkers(locations);
  retrieveWeather(locations);
  retrieveForecast(locations, populateForecast);
  
  let forecastButton = document.getElementById('forecast-menu');
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      let button = document.createElement('div');
      button.className = "item";
      button.textContent = i * 8 + j;
      forecastButton.children[i].children[0].appendChild(button);
    }
  }

  var closeBox = document.getElementById('close');
  closeBox.onclick = function () {
      chrome.app.window.current().close();
  };

  let powerButton = document.getElementById('power-button');
  powerButton.onclick = function() {
      togglePower();
  };

  let currentButton = document.getElementById('current-weather');
  currentButton.onclick = function() {
    for (let loc of locations) {
      updateMarker(loc.weather.main.temp, loc.weather.weather[0].main, loc.id);
    }
  }


  let newWindow = document.getElementById('new-window');
  newWindow.onclick = () => {
    chrome.app.window.create('connect.html', {
      id: 'connect-window',
      minHeight: 300,
      minWidth: 200,
      bounds: {
        height: 400,
        width: 300
      }
    }, onInitConnect);
  };

  // createMarkers(locations);
  let x = document.getElementById(locations[0].id);
  console.log(x);

  document.addEventListener("click", findMousePos);

  // for the forecast dropdown menu
  $('.ui.dropdown.link.item')
  .dropdown()
;

};

function populateForecast() {
  // populate the forecast buttons
  let forecastButton = document.getElementById('forecast-menu');
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 8; j++) {
      let button = forecastButton.children[i].children[0].children[j];
      button.textContent = locations[0].forecast.list[(8 * i + j)].dt_txt;
      button.id = 8 * i + j;
      button.onclick = () => {
        for (let loc of locations) {
          updateMarker(loc.forecast.list[button.id].main.temp, loc.forecast.list[button.id].weather[0].main, loc.id);
        }
      }
    }
  }
}

function createMarkers(locations) {
  var background = document.getElementById('background-container');

  for (let loc of locations) {
    let marker = document.createElement('div');
    let button = document.createElement('div');
    let label = document.createElement('a');
    let icon = document.createElement('a');
    let temp = document.createElement('i');

    marker.className = "ui labeled button";
    button.className = "ui tiny secondary button";
    label.className = "ui left pointing label";
    icon.className = label.className.slice();

    button.textContent = loc.name; 
    marker.id = loc.id;
    marker.style.top = loc.pos.y +  "px";
    marker.style.left = loc.pos.x + "px";
    marker.style.position = "absolute";
    icon.appendChild(temp);
    marker.appendChild(button);
    marker.appendChild(label);
    marker.appendChild(icon);
    background.appendChild(marker);
  }
}

function updateMarker(locTemp, locWeather, locID) {
  var background = document.getElementById('background-container');
  let marker = document.getElementById(locID);
  let button = marker.children[0];
  let label = marker.children[1];
  let icon = marker.children[2];

  button.onclick = () => {
    let weather = locWeather;
    let temp = convertTemp(locTemp);
    // change color temperature based on temperature
    let message = '{"id":1,"method":"set_ct_abx","params":[' + getColorTemp(temp) + ', "smooth", 500]}';
    rtm({
      type: 'request',
      message: message
    });
    // change brightness based on weather
    message = '{"id":1,"method":"set_bright","params":[' + getBrightness(weather) + ', "smooth", 500]}';
    rtm({
      type: 'request',
      message: message
    });
  }

  changeRGB(label, convertTemp(locTemp));
  label.textContent = convertTemp(locTemp) + "ºF"; 
  icon.children[0].className = getWeatherIcon(locWeather);
}


// Change the background color of the temperature label of the marker based
// on its temperature
// Cold is blue, warm is orange
function changeRGB(label, temp) {
  const rgb = tempRGB(temp);
  label.style.backgroundColor = "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")";
}

// Given a weather string, return the appropriate weather icon DOM element
function getWeatherIcon(weather) {
  let icon = ""; 

  switch(weather) {
    case "Clouds":
      icon = "wi wi-cloud";
      break;
    case "Rain":
      icon = "wi wi-rain";
      break
    case "Thunderstorm":
      icon = "wi wi-thunderstorm";
      break;
    case "Drizzle":
      icon = "wi wi-showers";
      break;
    default:
      icon = "wi wi-day-sunny";
  }

  return icon;
}
// Runtime machine for messaging other parts of the chrome app
function rtm(message, callback) {
  if (callback) {
    chrome.runtime.sendMessage(chrome.runtime.id, message, callback);
  } else {
    chrome.runtime.sendMessage(chrome.runtime.id, message);
  }
}

function onInitConnect(appWindow) {
    appWindow.show();
    var document = appWindow.contentWindow.document;
    document.addEventListener('DOMContentLoaded', function () {
        rtm({
                type: 'init-connect',
                list: deviceList,       // list of devices found
            });
    });
}

function listDevice(did, loc) {
  let device = {did: did, loc: loc};
  deviceList.push(device);
}

function findMousePos(event) {
  const mousePos = {
    x: event.clientX,
    y: event.clientY
  };
  console.log(mousePos);
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message) {
    switch (message.type) {
    case 'init':
        init();
        break;
    case 'info':
        console.log(message);
        break;
    case 'add-device':
        listDevice(message.did, message.location);
        console.log("device added");
        break;
    }
  }
});
