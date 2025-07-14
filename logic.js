window.addEventListener("DOMContentLoaded", () => {
  const BASE_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies";

  const supportedChartCurrencies = [
    "AUD", "BGN", "BRL", "CAD", "CHF", "CNY", "CZK", "DKK", "EUR", "GBP", "HKD",
    "HRK", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KRW", "MXN", "MYR", "NOK",
    "NZD", "PHP", "PLN", "RON", "RUB", "SEK", "SGD", "THB", "TRY", "USD", "ZAR"
  ];

  const dropdowns = document.querySelectorAll(".dropdown select");
  const btn = document.querySelector("form button");
  const fromCurr = document.querySelector("select.from");
  const toCurr = document.querySelector("select.to");
  console.log("FROM:", fromCurr?.value, "TO:", toCurr?.value);
  const msg = document.querySelector(".msg");
  const swapBtn = document.querySelector(".dropdown i");
  const historyList = document.getElementById("history-list");
  const darkToggle = document.getElementById("dark-toggle");
  const amountInput = document.querySelector(".amount input");

  const currencyNames = {
    USD: "United States Dollar", INR: "Indian Rupee", EUR: "Euro",
    GBP: "British Pound", JPY: "Japanese Yen", AUD: "Australian Dollar",
    CAD: "Canadian Dollar", CNY: "Chinese Yuan", RUB: "Russian Ruble",
    PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka", AED: "Emirati Dirham",
  };

  for (let select of dropdowns) {
    for (let currCode in countryList) {
      let option = document.createElement("option");
      option.value = currCode;
      option.innerText = `${currCode} ${currencyNames[currCode] ? "- " + currencyNames[currCode] : ""}`;
      if (select.name === "from" && currCode === "USD") option.selected = true;
      if (select.name === "to" && currCode === "INR") option.selected = true;
      select.appendChild(option);
    }

    select.addEventListener("change", (e) => {
      updateFlag(e.target);
    });
  }

  const updateFlag = (element) => {
    const currCode = element.value;
    const countryCode = countryList[currCode];
    const img = element.parentElement.querySelector("img");
    img.src = `https://flagsapi.com/${countryCode}/flat/64.png`;
  };

  const updateExchangeRate = async () => {
    let amtVal = parseFloat(amountInput.value);
    if (isNaN(amtVal) || amtVal <= 0) {
      amountInput.classList.add("error");
      msg.innerText = "Please enter a valid amount.";
      return;
    } else {
      amountInput.classList.remove("error");
    }

    if (fromCurr.value === toCurr.value) {
      msg.innerText = "Please select different currencies.";
      return;
    }

    const from = fromCurr.value.toLowerCase();
    const to = toCurr.value.toLowerCase();

    try {
      msg.innerText = "Fetching exchange rate...";
      const res = await fetch(`${BASE_URL}/${from}.json`);
      const data = await res.json();

      const rate = data[from]?.[to];
      const date = data.date || new Date().toISOString().split("T")[0];
      if (!rate) {
        msg.innerText = "Exchange rate not found.";
        return;
      }

      const finalAmount = (amtVal * rate).toFixed(2);
      msg.innerText = `${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}\n(Updated on ${date})`;

      saveToHistory(`${amtVal} ${fromCurr.value} = ${finalAmount} ${toCurr.value}`);
      await drawChart(fromCurr.value, toCurr.value);
    } catch (err) {
      console.error("API error:", err);
      msg.innerText = "Currency not supported or network error.";
    }
  };

  let myChart;
  async function drawChart(base, target) {
    const end = new Date();
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    if (!supportedChartCurrencies.includes(base) || !supportedChartCurrencies.includes(target)) {
      msg.innerText += `\nChart not available for ${base} → ${target}`;
      if (myChart) myChart.destroy();
      const ctx = document.getElementById("rateChart").getContext("2d");
      myChart = new Chart(ctx, {
        type: "line",
        data: {
          labels: [],
          datasets: []
        },
        options: { responsive: true }
      });
      return;
    }

    const url = `https://api.frankfurter.app/${startStr}..${endStr}?from=${base}&to=${target}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      const labels = Object.keys(data.rates).sort();
      const values = labels.map(date => data.rates[date][target]);

      if (myChart) myChart.destroy();
      const ctx = document.getElementById("rateChart").getContext("2d");
      myChart = new Chart(ctx, {
        type: "line",
        data: {
          labels,
          datasets: [{
            label: `${base}→${target}`,
            data: values,
            borderColor: "#af4d98",
            backgroundColor: "rgba(175,77,152,0.1)",
            fill: true
          }]
        },
        options: { responsive: true }
      });
    } catch (err) {
      console.error(err);
      msg.innerText += "\nChart error.";
    }
  }

  const saveToHistory = (entry) => {
    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
    history.push(entry);
    localStorage.setItem("conversionHistory", JSON.stringify(history));
    loadHistory();
  };

  const loadHistory = () => {
    let history = JSON.parse(localStorage.getItem("conversionHistory")) || [];
    historyList.innerHTML = "";
    history.slice(-5).reverse().forEach(item => {
      let li = document.createElement("li");
      li.innerText = item;
      historyList.appendChild(li);
    });
  };

  swapBtn.addEventListener("click", () => {
    const temp = fromCurr.value;
    fromCurr.value = toCurr.value;
    toCurr.value = temp;
    updateFlag(fromCurr);
    updateFlag(toCurr);
    updateExchangeRate();
  });

  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkToggle.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    updateExchangeRate();
  });

  updateExchangeRate();
  loadHistory();
});
