let currentTempC = null;
let isCelsius = true;

function getWeather() {
  const city = document.getElementById('city').value.trim();
  const messageElem = document.getElementById('message');
  messageElem.textContent = '';
  document.getElementById('temp-toggle').style.display = 'none';

  if (!city) {
    messageElem.textContent = "Please enter a city name.";
    return;
  }

  const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  
  fetch(geoUrl)
    .then(response => response.json())
    .then(geoData => {
      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found");
      }
      const { latitude, longitude, name, country } = geoData.results[0];
      document.getElementById('location').textContent = `${name}, ${country}`;
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m`;
      return fetch(weatherUrl);
    })
    .then(response => response.json())
    .then(weatherData => {
      if (!weatherData.current_weather) {
        throw new Error("Weather data not available");
      }
      currentTempC = weatherData.current_weather.temperature;
      isCelsius = true;
      document.getElementById('temperature').textContent = `Temperature: ${currentTempC.toFixed(1)} °C`;
      document.getElementById('wind-speed').textContent = `Wind Speed: ${weatherData.current_weather.windspeed} km/h`;
      const weatherCode = weatherData.current_weather.weathercode;
      document.getElementById('condition').textContent = `Condition: ${mapWeatherCode(weatherCode)}`;

      const currentTime = weatherData.current_weather.time;
      const closestIndex = findClosestIndex(currentTime, weatherData.hourly.time);
      const humidity = weatherData.hourly.relative_humidity_2m[closestIndex];
      document.getElementById('humidity').textContent = `Humidity: ${humidity}%`;

      document.getElementById('temp-container').style.display = 'flex';
      updateTempToggleText();
      document.getElementById('temp-toggle').style.display = 'inline-block';
    })
    .catch(error => {
      messageElem.textContent = error.message;
      console.error('Error:', error);
    });
}

function findClosestIndex(targetTimeStr, timeArray) {
  const targetTime = new Date(targetTimeStr).getTime();
  let closestIndex = 0, minDiff = Infinity;
  timeArray.forEach((timeStr, index) => {
    const diff = Math.abs(new Date(timeStr).getTime() - targetTime);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = index;
    }
  });
  return closestIndex;
}

function toggleTemperature() {
  const tempElem = document.getElementById('temperature');
  if (currentTempC === null) return;
  if (isCelsius) {
    const tempF = (currentTempC * 9) / 5 + 32;
    tempElem.textContent = `Temperature: ${tempF.toFixed(1)} °F`;
    isCelsius = false;
  } else {
    tempElem.textContent = `Temperature: ${currentTempC.toFixed(1)} °C`;
    isCelsius = true;
  }
  updateTempToggleText();
}

function updateTempToggleText() {
  const toggleBtn = document.getElementById('temp-toggle');
  toggleBtn.textContent = isCelsius ? "to Fahrenheit" : "to Celsius";
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
}

function mapWeatherCode(code) {
  if (code === 0) return "Clear sky";
  if ([1, 2, 3].includes(code)) return "Mainly clear / partly cloudy / overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55].includes(code)) return "Drizzle";
  if ([61, 63, 65].includes(code)) return "Rain";
  if ([66, 67].includes(code)) return "Freezing rain";
  if ([71, 73, 75].includes(code)) return "Snow fall";
  if ([80, 81, 82].includes(code)) return "Rain showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown weather";
}
