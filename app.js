const DEFAULT_CITY = "Brazzaville";
const HISTORY_KEY = "datadash_history";

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("error-message");

const historySection = document.getElementById("history-section");
const historyTags = document.getElementById("history-tags");

const dashboard = document.getElementById("dashboard");
const cityName = document.getElementById("city-name");
const weatherIcon = document.getElementById("weather-icon");
const temperature = document.getElementById("temperature");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");
const feelsLike = document.getElementById("feels-like");

const forecastSection = document.getElementById("forecast-section");
const forecastGrid = document.getElementById("forecast-grid");

// ----- Historique (localStorage) -----

let history = [];
try {
  history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
} catch (error) {
  history = [];
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function addToHistory(city) {
  history = history.filter(function (c) {
    return c.toLowerCase() !== city.toLowerCase();
  });
  history.unshift(city);
  history = history.slice(0, 5);
  saveHistory();
  renderHistory();
}

function renderHistory() {
  historySection.hidden = history.length === 0;
  historyTags.innerHTML = "";
  history.forEach(function (city) {
    const tag = document.createElement("button");
    tag.type = "button";
    tag.className = "history-tag";
    tag.textContent = city;
    tag.addEventListener("click", function () {
      fetchWeather(city);
    });
    historyTags.appendChild(tag);
  });
}

// ----- Formatage -----

function formatTime(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDay(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

// ----- Récupération météo actuelle -----

async function fetchWeather(city) {
  loader.hidden = false;
  errorMessage.hidden = true;
  dashboard.hidden = true;
  forecastSection.hidden = true;

  try {
    const url =
      "https://api.openweathermap.org/data/2.5/weather?q=" +
      encodeURIComponent(city) +
      "&appid=" +
      OWM_API_KEY +
      "&units=metric&lang=fr";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Ville introuvable (" + response.status + ")");
    }
    const data = await response.json();
    renderCurrentWeather(data);
    addToHistory(data.name);
    await fetchForecast(data.name);
  } catch (error) {
    errorMessage.textContent = "Impossible de récupérer la météo pour cette ville.";
    errorMessage.hidden = false;
    console.log(error);
  }

  loader.hidden = true;
}

function renderCurrentWeather(data) {
  cityName.textContent = data.name + ", " + data.sys.country;
  temperature.textContent = Math.round(data.main.temp) + "°C";
  description.textContent = data.weather[0].description;
  weatherIcon.src = "https://openweathermap.org/img/wn/" + data.weather[0].icon + "@2x.png";
  weatherIcon.alt = data.weather[0].description;
  humidity.textContent = data.main.humidity + " %";
  wind.textContent = Math.round(data.wind.speed * 3.6) + " km/h";
  feelsLike.textContent = Math.round(data.main.feels_like) + "°C";
  dashboard.hidden = false;
}

// ----- Prévisions 5 jours -----

async function fetchForecast(city) {
  try {
    const url =
      "https://api.openweathermap.org/data/2.5/forecast?q=" +
      encodeURIComponent(city) +
      "&appid=" +
      OWM_API_KEY +
      "&units=metric&lang=fr";
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Prévisions indisponibles (" + response.status + ")");
    }
    const data = await response.json();

    // L'API renvoie des prévisions toutes les 3h : on garde 1 entrée par jour (autour de midi)
    const dailyForecasts = data.list.filter(function (item) {
      return item.dt_txt.includes("12:00:00");
    });

    renderForecast(dailyForecasts);
  } catch (error) {
    console.log(error);
  }
}

function renderForecast(list) {
  forecastGrid.innerHTML = "";

  list.forEach(function (item) {
    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML =
      '<p class="forecast-day">' + formatDay(item.dt) + "</p>" +
      '<img src="https://openweathermap.org/img/wn/' + item.weather[0].icon + '.png" alt="' + item.weather[0].description + '">' +
      '<p class="forecast-temp">' + Math.round(item.main.temp) + "°C</p>" +
      '<p class="forecast-desc">' + item.weather[0].description + "</p>";
    forecastGrid.appendChild(card);
  });

  forecastSection.hidden = list.length === 0;
}

// ----- Recherche -----

function triggerSearch() {
  const city = searchInput.value.trim();
  if (city !== "") {
    fetchWeather(city);
  }
}

searchBtn.addEventListener("click", triggerSearch);
searchInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    triggerSearch();
  }
});

// ----- Démarrage -----

renderHistory();
fetchWeather(DEFAULT_CITY);