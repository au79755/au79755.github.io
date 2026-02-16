/* Map integration (D3 + TopoJSON) */
(function () {
  // Legend config and renderer
const legendItems = [
  { key: "ai", coordinates: [-96.8067, 32.7767], label: '<a href="https://austinlu.com/experience/2025-cofounder" target="_blank" rel="noopener noreferrer"><strong>CTO &amp; Cofounder</strong></a> @ The Common AI, Inc.' },
  { key: "publication", coordinates: [-88.2434, 40.1164], label: "Ex-AI/ML Research @ University of Illinois" },
];

// Markers config
const markers = [
  // Ex-AI/ML Research @ Illinois (Papers, Presentations)
  { type: "publication", curvature: 0.14, content: '2022 Q2 <a href="https://austinlu.com/publication/2022-05-08-mechatronic" target="_blank" rel="noopener noreferrer"><strong>Robotic Orchestration</strong></a>', place: "Nashville", coordinates: [-86.7816, 36.1627] },
  { type: "publication", curvature: 0.4, content: '2022 Q4 <a href="https://austinlu.com/publication/2022-10-01-cloud-research.md" target="_blank" rel="noopener noreferrer"><strong>Cloud Robotics</strong></a>', place: "Munich (Germany)", coordinates: [-68, 42.5] },
  {
    type: "publication",
    curvature: 0.14,
    content: `2023 Q1
      <a href="https://austinlu.com/publication/2023-03-01-bandwidth-extension" target="_blank" rel="noopener noreferrer">[1]</a>
      <a href="https://austinlu.com/publication/2023-03-01-mechanized-panels" target="_blank" rel="noopener noreferrer">[2]</a>
      <a href="https://austinlu.com/publication/2023-03-01-printed-simulators" target="_blank" rel="noopener noreferrer">[3]</a>
      <a href="https://austinlu.com/publication/2023-03-01-source-separation-bandlimited" target="_blank" rel="noopener noreferrer">[3]</a>
      `,
    place: "Chicago",
    coordinates: [-87.6298, 41.8781]
  },
  {
    type: "publication",
    curvature: 0,
    content: '2023 Q2 <a href="https://austinlu.com/publication/2023-05-08-investigating-sample-bias" target="_blank" rel="noopener noreferrer"><strong>Multiple: AI/ML for Human-Computer Interaction</strong></a>',
    place: "Champaign",
    coordinates: [-88.2434, 40.1164]
  },
  { type: "publication", curvature: 0.14, content: '2023 Q4 <a href="https://austinlu.com/publication/2023-10-23-interactive-demo" target="_blank" rel="noopener noreferrer"><strong>Interactive Digital Twins</strong></a>', place: "New Paltz", coordinates: [-74.0746, 41.7474] },
  { type: "publication", curvature: 0.3, content: '2024 Q1 <a href="https://austinlu.com/publication/2024-03-01-delay-constrained" target="_blank" rel="noopener noreferrer"><strong>Wearable Implants for Human Computer Interaction</strong></a>', place: "Ottawa", coordinates: [-75.6972, 45.4215] },
  // { type: "publication", curvature: 0.14, content: '2024 Q2 <strong>Oceanography and Robotics training</strong>', place: "Shinnecock Bay", coordinates: [-72.4949, 40.8534] },
  { type: "publication", curvature: 0.14, content: '2024 Q3 <a href="https://austinlu.com/publication/2024-08-27-discovery-partners" target="_blank" rel="noopener noreferrer"><strong>International Innovation Showcase</strong></a>', place: "Chicago", coordinates: [-87.6298, 41.8781] },
  { type: "publication", curvature: 0.14, content: '2025 Q3 <a href="https://austinlu.com/publication/2025-07-05-latent-fxlms" target="_blank" rel="noopener noreferrer"><strong>AI/ML: Latent Signal Processing</strong></a>', place: "Malaga (Spain)", coordinates: [-71.5, 39] },

  // CTO @ The Common AI, Inc. (Pilots, Talks)
  // { type: "ai", curvature: 0.6, content: '2025 Q1 <strong>AI Chatbot Pilot</strong> for city 311 platform', place: "Indiana", coordinates: [-85.15, 41.07] },
  { type: "ai", curvature: 0.2, content: '2025 Q2 <strong>AI Chatbot Demo</strong> for city staff', place: "California", coordinates: [-122.4194, 37.7749] },
  { type: "ai", curvature: 0.3, content: '2025 Q3 <strong>AI Permit Review Pilot</strong> for city plan reviewers', place: "Washington", coordinates: [-122.3321, 47.6062] },
  { type: "ai", curvature: 0.3, content: '2025 Q4 Showcasing our <strong>AI GovTech Platform</strong>', place: '<a href="https://fall.smartcitiesconnect.org/" target="_blank" rel="noopener noreferrer"><strong>Smart Cities Connect 2025</strong></a> (National Harbor, MD)', coordinates: [-77.0369, 38.9638] },
  { type: "ai", curvature: 0, content: '2026 Q1 <strong>AI Permit Review Pilot</strong> for city inspectors', place: "Dallas", coordinates: [-96.8067, 32.7767] },
  { type: "ai", curvature: 0.6, content: '2026 Q2 Seminar on <strong>AI Permit Review</strong>', place: 'the <a href="https://www.planning.org/conference/" target="_blank" rel="noopener noreferrer"><strong>National Planning Conference 2026</strong></a> (Detroit, MI)', coordinates: [-83.05, 42.33] },
];

const d3 = window.d3;
const topojson = window.topojson;

const radius = 5;
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

  items.append("span").html(d => d.label);
}

// ----- Star arcs: hub in each category connects to all others -----
function buildCurvedArcPath(fromLonLat, toLonLat, curvature = 0.2) {
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
  const arcs = [];
  legendItems.forEach(legend => {
    if (!legend.coordinates) return;
    const type = legend.key;
    const hubCoords = legend.coordinates;
    const hubId = `hub-${type}`;
    const list = markers.filter(m => m.type === type && Array.isArray(m.coordinates));
    list.forEach(spoke => {
      const spokeId = spoke.id || getMarkerId(spoke);
      const dPath = buildCurvedArcPath(hubCoords, spoke.coordinates, spoke.curvature);
      arcs.push({ type, sourceId: hubId, targetId: spokeId, d: dPath });
    });
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
