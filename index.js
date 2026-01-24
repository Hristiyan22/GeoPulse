$(document).ready(function () {
  const map = L.map("map", {
    maxBounds: [
      [-90, -Infinity],
      [90, Infinity],
    ],
    maxBoundsViscosity: 1.0,
    minZoom: 2,
  }).setView([0, 0], 2);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
    className: "grayscale-tiles",
  }).addTo(map);

  let marker;
  let timeout;

  const input = $("#addressInput");
  const suggestionsList = $("#suggestions");
  const resultsList = $("#results");

  input.on("input", function () {
    clearTimeout(timeout);
    const query = input.val().trim();

    if (query.length < 2) {
      suggestionsList.empty();
      return;
    }

    timeout = setTimeout(() => {
      fetch(
        `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest?f=json&text=${encodeURIComponent(query)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          suggestionsList.empty();
          if (data.suggestions) {
            data.suggestions.forEach((s) => {
              const li = $("<li>").text(s.text);

              li.on("mouseover", function () {
                input.val(s.text);
              });

              li.on("click", function () {
                input.val(s.text);
                suggestionsList.empty();
                searchAddress(s.text);
              });

              suggestionsList.append(li);
            });
          }
        })
        .catch((err) => console.error("Грешка:", err));
    }, 300);
  });

  function searchAddress(address) {
    fetch(
      `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(address)}&f=json`,
    )
      .then((res) => res.json())
      .then((data) => {
        resultsList.empty();
        suggestionsList.empty();

        const candidates = data.candidates || [];

        if (candidates.length === 0) {
          resultsList.html("<li>Няма намерени резултати</li>");
          return;
        }

        candidates.forEach((c) => {
          const li = $("<li>").text(
            `${c.address} (${c.location.x.toFixed(5)}, ${c.location.y.toFixed(5)})`
          );

          li.on("mouseover", function () {
            input.val(`${c.address} (${c.location.x.toFixed(5)}, ${c.location.y.toFixed(5)})`);
          });

          li.on("click", function () {
            map.setView([c.location.y, c.location.x], 15);

            if (marker) {
              map.removeLayer(marker);
            }

            marker = L.marker([c.location.y, c.location.x], {
              zIndexOffset: 10000,
            }).addTo(map);
            input.val(`${c.address} (${c.location.x.toFixed(5)}, ${c.location.y.toFixed(5)})`);
            resultsList.empty();
          });

          resultsList.append(li);
        });
      })
      .catch((err) => console.error("Грешка:", err));
  }

  $("#searchForm").submit(function (e) {
    e.preventDefault();
    const query = input.val().trim();
    if (query) {
      searchAddress(query);
    }
  });

  $("#searchButton").click(function (e) {
    e.preventDefault();
    const query = input.val().trim();
    if (query) {
      searchAddress(query);
    }
  });
});