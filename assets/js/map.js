/* Map integration (D3 + TopoJSON) */
(function () {
  // Legend config and renderer
const legendItems = [
  { key: "ai", label: "CTO @ The Common AI, Inc. (Pilots, Talks)" },
  { key: "publication", label: "Ex-AI/ML Research @ Illinois (Papers, Presentations)" },
];

// Markers config
const markers = [
  // Ex-AI/ML Research @ Illinois (Papers, Presentations)
  { type: "publication", content: '<a href="https://austinlu.com/publication/2022-05-08-mechatronic" target="_blank" rel="noopener noreferrer"><strong>Published Research (Cloud Robotics)</strong></a>', place: "Nashville", coordinates: [-86.7816, 36.1627] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2023-10-23-interactive-demo" target="_blank" rel="noopener noreferrer"><strong>Digital Twin Demo</strong></a>', place: "New Paltz", coordinates: [-74.0746, 41.7474] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2024-03-01-delay-constrained" target="_blank" rel="noopener noreferrer"><strong>Published Research (HCI)</strong></a>', place: "Ottawa", coordinates: [-75.6972, 45.4215] },
  { type: "publication", content: '<strong>Marine Expedition Training</strong>', place: "Shinnecock Bay", coordinates: [-72.4949, 40.8534] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2024-08-27-discovery-partners" target="_blank" rel="noopener noreferrer"><strong>Intl. Partners Exhibition</strong></a>', place: "Chicago", coordinates: [-87.6298, 41.8781] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2025-07-05-latent-fxlms" target="_blank" rel="noopener noreferrer"><strong>Published Research (AI/ML)</strong></a>', place: "Champaign", coordinates: [-88.2434, 40.1164] },

  // CTO @ The Common AI, Inc. (Pilots, Talks)
  { type: "ai", content: '<a href="https://austinlu.com/experience/2025-cofounder" target="_blank" rel="noopener noreferrer"><strong>CTO & Cofounder</strong></a>', place: "Dallas", coordinates: [-96.9, 32.78] }, // tweak: slightly west
  { type: "ai", content: '<strong>AI Chatbot Pilot</strong> for city 311 platform', place: "Indiana", coordinates: [-85.15, 41.07] },
  { type: "ai", content: '<strong>AI Chatbot Demo</strong> for city staff', place: "California", coordinates: [-122.4194, 37.7749] },
  { type: "ai", content: '<strong>AI Permit Review Pilot</strong> for city plan reviewers', place: "Washington", coordinates: [-122.3321, 47.6062] },
  { type: "ai", content: '<strong>AI Permit Review Pilot</strong> for city inspectors', place: "Texas", coordinates: [-95.3698, 29.7604] },
  { type: "ai", content: 'Showcasing our <strong>AI GovTech Platform</strong>', place: '<a href="https://fall.smartcitiesconnect.org/" target="_blank" rel="noopener noreferrer"><strong>Smart Cities Connect 2025</strong></a> (National Harbor, MD)', coordinates: [-77.0369, 38.9638] },
  { type: "ai", content: 'Seminar on <strong>AI Permit Review</strong>', place: 'the <a href="https://www.planning.org/conference/" target="_blank" rel="noopener noreferrer"><strong>National Planning Conference 2026</strong></a> (Detroit, MI)', coordinates: [-83.05, 42.33] },
];

const d3 = window.d3;
const topojson = window.topojson;

const radius = 6;
const container = document.getElementById('map-container');
let { width, height } = container.getBoundingClientRect();
if (!width || !height) { width = 1000; height = 600; }

const svg = d3.select("#map-container")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("tabindex", -1)
  .attr("focusable", false);

const gMap = svg.append("g");
const gMarkers = svg.append("g");
const tooltip = d3.select("#tooltip");
let stickyMarker = null;

const projection = d3.geoMercator();
const pathGenerator = d3.geoPath().projection(projection);

const mapDataUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

d3.json(mapDataUrl).then(data => {
  const states = topojson.feature(data, data.objects.states);
  // Filter to CONUS (lower-48 + DC): include only FIPS 01-56, excluding Alaska (02) and Hawaii (15)
  // This also excludes territories like PR (72), USVI (78), Guam (66), AS (60), CNMI (69)
  const conusIds = new Set(
    states.features
      .map(f => Number(f.id))
      .filter(id => id <= 56 && id !== 2 && id !== 15)
  );
  const conus = {
    type: "FeatureCollection",
    features: states.features.filter(f => conusIds.has(Number(f.id)))
  };
  // Fit projection to CONUS states edge-to-edge (no padding)
  projection.fitSize([width, height], conus);

  gMap.selectAll("path.state")
      .data(conus.features)
      .enter()
      .append("path")
      .attr("class", "country state")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("d", pathGenerator);

  // State borders mesh
  const borders = topojson.mesh(
    data,
    data.objects.states,
    (a, b) => a !== b && conusIds.has(Number(a.id)) && conusIds.has(Number(b.id))
  );
  gMap.append("path")
      .datum(borders)
      .attr("class", "state-borders")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("d", pathGenerator);

  drawMarkers();
  drawArcs();
  renderLegend();
});

// Close tooltip when clicking outside a marker
svg.on("click", () => {
  if (stickyMarker) {
    stickyMarker = null;
    tooltip.classed("is-visible", false);
    gMap.selectAll("path.arc").classed("is-highlight", false);
  }
});

function drawMarkers() {
  gMarkers.selectAll("circle.marker")
      .data(markers, d => d.id || getMarkerId(d))
      .enter()
      .append("circle")
      .attr("class", d => `marker ${d.type}`)
      .attr("data-id", d => d.id || getMarkerId(d))
      .attr("vector-effect", "non-scaling-stroke")
      .attr("cx", d => projection(d.coordinates)[0])
      .attr("cy", d => projection(d.coordinates)[1])
      .attr("r", radius)
      .on("mouseenter", (event, d) => {
          gMap.selectAll("path.arc").classed("is-highlight", dd => dd.type === d.type);
      })
      .on("mouseleave", () => {
          if (!stickyMarker) gMap.selectAll("path.arc").classed("is-highlight", false);
      })
      .on("click", (event, d) => {
          event.stopPropagation();
          stickyMarker = d;
          renderTooltip(d);
          positionTooltipAtElement(event.currentTarget);
      });
}

function getMarkerId(d) {
  return `${d.type}-${Math.round(d.coordinates[0]*10000)}-${Math.round(d.coordinates[1]*10000)}`;
}

function renderTooltip(d) {
  tooltip.html(`
      <div class="tooltip-main">
        ${d.content} in ${d.place}
      </div>
      <button class="tooltip-close" aria-label="Close">×</button>
  `);

  tooltip.select(".tooltip-close").on("click", () => {
      stickyMarker = null;
      tooltip.classed("is-visible", false);
      gMap.selectAll("path.arc").classed("is-highlight", false);
  });

  tooltip.classed("is-visible", true);
  // Keep arc highlight while tooltip is open
  gMap.selectAll("path.arc").classed("is-highlight", dd => dd.type === d.type);
}

function positionTooltipAtElement(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const left = rect.left + window.scrollX + rect.width / 2 + 10;
  const top = rect.top + window.scrollY - 10;

  const node = tooltip.node();
  if (!node) return;

  tooltip.style("left", left + "px").style("top", top + "px");
}

function renderLegend() {
  const container = d3.select("#legend-text");
  if (container.empty()) return;

  container.selectAll("li.legend-item").remove();

  const items = container
      .selectAll("li.legend-item")
      .data(legendItems)
      .enter()
      .append("li")
      .attr("class", "legend-item");

  const svgs = items
      .append("svg")
      .attr("class", d => `legend-dot ${d.key}`)
      .attr("width", 11)
      .attr("height", 11)
      .attr("viewBox", "0 0 11 11")
      .attr("aria-hidden", true)
      .attr("focusable", false);

  svgs.each(function(d) {
      const s = d3.select(this);
      s.append("circle")
          .attr("cx", 5.5)
          .attr("cy", 5.5)
          .attr("r", 5);
  });

  items.append("span").text(d => d.label);
}

// ----- Arcs between consecutive markers per category -----
const arcCurvature = 0.7;

function buildCurvedArcPath(fromLonLat, toLonLat, curvature = arcCurvature) {
  const [ax, ay] = projection(fromLonLat);
  const [bx, by] = projection(toLonLat);
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2;
  const dx = bx - ax;
  const dy = by - ay;
  let nx = -dy;
  let ny = dx;
  const nlen = Math.hypot(nx, ny) || 1;
  nx /= nlen;
  ny /= nlen;
  if (ny > 0) { nx = -nx; ny = -ny; }
  const distance = Math.hypot(dx, dy);
  const offset = distance * curvature;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  return `M ${ax},${ay} Q ${cx},${cy} ${bx},${by}`;
}

function drawArcs() {
  const categories = ["ai", "publication"];
  const arcs = [];
  categories.forEach(type => {
    const list = markers.filter(m => m.type === type && Array.isArray(m.coordinates));
    if (list.length < 2) return;
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i];
      const b = list[i + 1];
      const sourceId = a.id || getMarkerId(a);
      const targetId = b.id || getMarkerId(b);
      const dPath = buildCurvedArcPath(a.coordinates, b.coordinates);
      arcs.push({ type, sourceId, targetId, d: dPath });
    }
  });
  gMap.selectAll("path.arc")
    .data(arcs)
    .enter()
    .append("path")
    .attr("class", d => `arc ${d.type}`)
    .attr("data-src", d => d.sourceId)
    .attr("data-tgt", d => d.targetId)
    .attr("vector-effect", "non-scaling-stroke")
    .attr("d", d => d.d);
}

})();
