/* Map integration (D3 + TopoJSON) */
(function () {
  // Legend config and renderer
const legendItems = [
  { key: "ai", label: "The Common AI, Inc. (Pilots, Demos, etc.)" },
  { key: "experience", label: "Professional Experience" },
  { key: "publication", label: "Research & Innovation" },
  { key: "demo", label: "Interactive Demonstrations" },
];

// Markers config
const markers = [
  // PROFESSIONAL EXPERIENCE
  { type: "experience", content: '<a href="https://austinlu.com/experience/2025-cofounder" target="_blank" rel="noopener noreferrer"><strong>CTO & Cofounder</strong></a>', place: "Dallas", coordinates: [-96.9, 32.78] }, // tweak: slightly west
  { type: "experience", content: '<a href="https://austinlu.com/experience/2024-mentorship-ursa" target="_blank" rel="noopener noreferrer"><strong>Project Lead</strong></a>', place: "Champaign", coordinates: [-88.2434, 40.1164] },
  { type: "experience", content: '<a href="https://austinlu.com/experience/2023-kkspc" target="_blank" rel="noopener noreferrer"><strong>Full Stack Engineer</strong></a>', place: "Astoria", coordinates: [-90.3679, 40.1589] },
  { type: "experience", content: '<a href="https://austinlu.com/experience/2018-coohom-intern" target="_blank" rel="noopener noreferrer"><strong>Software Developer (Intern)</strong></a>', place: "Shanghai", coordinates: [121.4737, 31.2304] },
  
  // RESEARCH & INNOVATION
  { type: "publication", content: '<a href="https://austinlu.com/publication/2025-07-05-latent-fxlms" target="_blank" rel="noopener noreferrer"><strong>Published Research (AI/ML)</strong></a>', place: "Malaga", coordinates: [-4.4214, 36.7213] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2024-03-01-delay-constrained" target="_blank" rel="noopener noreferrer"><strong>Published Research (HCI)</strong></a>', place: "Ottawa", coordinates: [-75.6972, 45.4215] },
  { type: "publication", content: '<a href="https://austinlu.com/publication/2022-05-08-mechatronic" target="_blank" rel="noopener noreferrer"><strong>Published Research (Cloud)</strong></a>', place: "Bamberg", coordinates: [10.8862, 49.8988] },
  { type: "publication", content: '<strong>Marine Expedition Training</strong>', place: "Shinnecock Bay", coordinates: [-72.4949, 40.8534] },
  
  // INTERACTIVE DEMONSTRATIONS
  { type: "demo", content: '<a href="https://austinlu.com/publication/2024-08-27-discovery-partners" target="_blank" rel="noopener noreferrer"><strong>Intl. Partners Exhibition</strong></a>', place: "Chicago", coordinates: [-87.6298, 41.8781] },
  { type: "demo", content: '<a href="https://austinlu.com/publication/2023-10-23-interactive-demo" target="_blank" rel="noopener noreferrer"><strong>Digital Twin Demo</strong></a>', place: "New Paltz", coordinates: [-74.0746, 41.7474] },
  { type: "demo", content: '<a href="https://austinlu.com/publication/2022-10-01-cloud-research" target="_blank" rel="noopener noreferrer"><strong>Cloud-based Research Platform</strong></a>', place: "Nashville", coordinates: [-86.7816, 36.1627] },
  { type: "demo", content: '<a href="https://austinlu.com/publication/2022-10-01-cloud-research" target="_blank" rel="noopener noreferrer"><strong>Cloud-based Research Platform</strong></a>', place: "Munich", coordinates: [11.5761, 48.1371] },

  // WORK DEMOS (CLIENT LOCATION)
  { type: "ai", content: '<strong>National Planning Conference</strong> seminar for AI Permit Review', place: "Detroit", coordinates: [-83.05, 42.33] },
  { type: "ai", content: '<strong>AI Chatbot Pilot</strong> for city 311 platform', place: "Indiana", coordinates: [-85.15, 41.07] },
  { type: "ai", content: '<strong>AI Chatbot Demo</strong> for city staff', place: "California", coordinates: [-122.4194, 37.7749] },
  { type: "ai", content: '<strong>AI Permit Reviewer Paid Pilot</strong> for city planners', place: "Washington", coordinates: [-122.3321, 47.6062] },
  { type: "ai", content: '<strong>AI Permit Reviewer Demo</strong> for city CIOs', place: "Texas", coordinates: [-95.3698, 29.7604] },
  { type: "ai", content: 'Showcasing our <strong>AI Permit Reviewer and Chatbot</strong>', place: '<a href="https://fall.smartcitiesconnect.org/" target="_blank" rel="noopener noreferrer"><strong>Smart Cities Connect 2025</strong></a> (National Harbor, MD)', coordinates: [-77.0369, 38.9638] },
  
];

const d3 = window.d3;
const topojson = window.topojson;

const radius = 6;
const container = document.getElementById('map-container');
let { width, height } = container.getBoundingClientRect();
if (!width || !height) { width = 1000; height = 600; }

const svg = d3.select("#map-container")
  .append("svg")
  .attr("viewBox", `0 ${Math.floor(height*0.1)} ${width} ${Math.floor(height*0.6)}`)
  .attr("width", "100%")
  .attr("height", "100%")
  .attr("tabindex", -1)
  .attr("focusable", false);

const gMap = svg.append("g");
const gMarkers = svg.append("g");
const tooltip = d3.select("#tooltip");
let stickyMarker = null;
let currentZoomTransform = d3.zoomIdentity;

const projection = d3.geoNaturalEarth1();
projection.fitSize([width, height], { type: "Sphere" });

const pathGenerator = d3.geoPath().projection(projection);

const zoom = d3.zoom()
  .scaleExtent([1, 8])
  .extent([[0, 0], [width, height]])
  .translateExtent([[0, 0], [width, height]])
  .filter((event) => {
      // When a tooltip is active, override default wheel zoom handling
      if (stickyMarker && event.type === "wheel") return false;
      // Default filter from d3-zoom: allow wheel (even with ctrlKey), disallow non-primary buttons
      return (!event.ctrlKey || event.type === "wheel") && !event.button;
  })
  .on("start", (event) => {
      // Hide tooltip if the user initiates a drag/pan interaction
      const t = event?.sourceEvent?.type;
      if (t === "mousedown" || t === "touchstart" || t === "pointerdown") {
          if (stickyMarker) {
              stickyMarker = null;
              tooltip.classed("is-visible", false);
          }
      }
  })
  .on("zoom", (event) => {
      currentZoomTransform = event.transform;
      gMap.attr("transform", event.transform);
      // Update circle positions
      gMarkers.selectAll("circle.marker")
          .attr("cx", d => event.transform.apply(projection(d.coordinates))[0])
          .attr("cy", d => event.transform.apply(projection(d.coordinates))[1]);
      if (stickyMarker) {
          positionTooltipAtElement(document.querySelector(`circle.marker.${stickyMarker.type}[data-id='${getMarkerId(stickyMarker)}']`));
      }
  });

svg.call(zoom);

// When a tooltip is active (marker clicked), enforce zoom around that marker
svg.on("wheel.stickyZoom", (event) => {
  if (!stickyMarker) return;
  event.preventDefault();
  // Match d3-zoom's wheel delta sensitivity
  const k = Math.pow(2, -event.deltaY * 0.002);
  const [mx, my] = currentZoomTransform.apply(projection(stickyMarker.coordinates));
  zoom.scaleBy(svg, k, [mx, my]);
});

svg.on("dblclick.stickyZoom", null);
svg.on("dblclick.zoom", null);

const mapDataUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

d3.json(mapDataUrl).then(data => {
  const countries = topojson.feature(data, data.objects.countries);

  gMap.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("class", "country")
      .attr("vector-effect", "non-scaling-stroke")
      .attr("d", pathGenerator);

  drawMarkers();

  // Render legend after DOM is ready
  renderLegend();
});

function drawMarkers() {
  const circlesData = markers

  gMarkers.selectAll("circle.marker")
      .data(circlesData, d => getMarkerId(d))
      .enter()
      .append("circle")
      .attr("class", d => `marker ${d.type}`)
      .attr("data-id", d => getMarkerId(d))
      .attr("vector-effect", "non-scaling-stroke")
      .attr("cx", d => projection(d.coordinates)[0])
      .attr("cy", d => projection(d.coordinates)[1])
      .attr("r", radius)
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
  });

  tooltip.classed("is-visible", true);
}

function positionTooltipAtElement(el) {
  if (!el) return;
  const rect = el.getBoundingClientRect();
  // Preferred placement: to the right and slightly above the marker
  const left = rect.left + window.scrollX + rect.width / 2 + 10;
  const top = rect.top + window.scrollY - 10;

  const node = tooltip.node();
  if (!node) return;

  tooltip.style("left", left + "px").style("top", top + "px");
}

function renderLegend() {
  const container = d3.select("#legend-text");
  if (container.empty()) return;

  // Remove any previously rendered items (keep any headings inside the list)
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
})();