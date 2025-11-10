/* Map integration (D3 + TopoJSON) */
(function () {
  // Legend config and renderer
const legendItems = [
  { key: "experience", label: "Professional Experience" },
  { key: "publication", label: "Research & Innovation" },
  { key: "demo", label: "Interactive Demonstrations" },
];

// Markers config
const markers = [
  // PROFESSIONAL EXPERIENCE
  { type: "experience", role: "CTO & Cofounder", place: "Dallas", coordinates: [-96.9, 32.78], url: "https://austinlu.com/experience/2025-cofounder" }, // tweak: slightly west
  { type: "experience", role: "Project Lead", place: "Champaign", coordinates: [-88.2434, 40.1164], url: "https://austinlu.com/experience/2024-mentorship-ursa" },
  { type: "experience", role: "Full Stack Engineer", place: "Astoria", coordinates: [-90.3679, 40.1589], url: "https://austinlu.com/experience/2023-kkspc" },
  { type: "experience", role: "Software Developer (Intern)", place: "Shanghai", coordinates: [121.4737, 31.2304], url: "https://austinlu.com/experience/2018-coohom-intern" },
  
  // RESEARCH & INNOVATION
  { type: "publication", role: "Published Research (AI/ML)", place: "Malaga", coordinates: [-4.4214, 36.7213], url: "https://austinlu.com/publication/2025-07-05-latent-fxlms" },
  { type: "publication", role: "Published Research (HCI)", place: "Ottawa", coordinates: [-75.6972, 45.4215], url: "https://austinlu.com/publication/2024-03-01-delay-constrained" },
  { type: "publication", role: "Published Research (Cloud)", place: "Bamberg", coordinates: [10.8862, 49.8988], url: "https://austinlu.com/publication/2022-05-08-mechatronic" },
  { type: "publication", role: "Marine Expedition Training", place: "Shinnecock Bay", coordinates: [-72.4949, 40.8534], url: "" },
  
  // INTERACTIVE DEMONSTRATIONS
  { type: "demo", role: "Intl. Partners Exhibition", place: "Chicago", coordinates: [-87.6298, 41.8781], url: "https://austinlu.com/publication/2024-08-27-discovery-partners" },
  { type: "demo", role: "Digital Twin Demo", place: "New Paltz", coordinates: [-74.0746, 41.7474], url: "https://austinlu.com/publication/2023-10-23-interactive-demo" },
  { type: "demo", role: "Cloud-based Research Platform", place: "Nashville", coordinates: [-86.7816, 36.1627], url: "https://austinlu.com/publication/2022-10-01-cloud-research" },
  { type: "demo", role: "Cloud-based Research Platform", place: "Munich", coordinates: [11.5761, 48.1371], url: "https://austinlu.com/publication/2022-10-01-cloud-research" },

  // WORK DEMOS (CLIENT LOCATION)
  { type: "demo", role: "AI Copilot Pilot for Local Town", place: "Indiana", coordinates: [-85.15, 41.07], url: "" },
  { type: "demo", role: "AI Copilot Demo for Local City", place: "California", coordinates: [-122.4194, 37.7749], url: "" },
  { type: "demo", role: "AI Permit Reviewer Pilot for Local City", place: "Washington", coordinates: [-122.3321, 47.6062], url: "" },
  { type: "demo", role: "AI Permit Reviewer Demo for Local City", place: "Texas", coordinates: [-95.3698, 29.7604], url: "" },
];

const d3 = window.d3;
const topojson = window.topojson;

const radius = "6px";
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
      // When a tooltip is active, override default wheel/dblclick zoom handling
      if (stickyMarker && (event.type === "wheel" || event.type === "dblclick")) return false;
      // Default filter from d3-zoom: allow wheel (even with ctrlKey), disallow non-primary buttons
      return (!event.ctrlKey || event.type === "wheel") && !event.button;
  })
  .on("zoom", (event) => {
      currentZoomTransform = event.transform;
      gMap.attr("transform", event.transform);
      // Update circle positions
      gMarkers.selectAll("circle.marker")
          .attr("cx", d => event.transform.apply(projection(d.coordinates))[0])
          .attr("cy", d => event.transform.apply(projection(d.coordinates))[1]);
      // Update square positions
      gMarkers.selectAll("rect.marker")
          .attr("x", d => event.transform.apply(projection(d.coordinates))[0] - radius)
          .attr("y", d => event.transform.apply(projection(d.coordinates))[1] - radius);
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

svg.on("dblclick.stickyZoom", (event) => {
  if (!stickyMarker) return;
  event.preventDefault();
  const [mx, my] = currentZoomTransform.apply(projection(stickyMarker.coordinates));
  // Double-click to zoom in by factor 2 centered on the sticky marker
  zoom.scaleBy(svg, 2, [mx, my]);
});

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
  const titleHtml = d.url
      ? `<a href="${d.url}" target="_blank" rel="noopener noreferrer"><strong>${d.role}</strong></a>`
      : `<strong>${d.role}</strong>`;

  tooltip.html(`
      <div class="tooltip-main">
        ${titleHtml} in ${d.place}
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
  let left = rect.left + window.scrollX + rect.width / 2 + 10;
  let top = rect.top + window.scrollY - 10;

  const node = tooltip.node();
  if (!node) return;
  const tipRect = node.getBoundingClientRect();
  const margin = 12;

  // Clamp within map container if available, otherwise fallback to window
  const containerRect = (window.document.getElementById('map-container') || {}).getBoundingClientRect?.();
  const clampLeftStart = containerRect ? (containerRect.left + window.scrollX) : window.scrollX;
  const clampTopStart = containerRect ? (containerRect.top + window.scrollY) : window.scrollY;
  const clampWidth = containerRect ? containerRect.width : window.innerWidth;
  const clampHeight = containerRect ? containerRect.height : window.innerHeight;

  const minLeft = clampLeftStart + margin;
  const minTop = clampTopStart + margin;
  const maxLeft = clampLeftStart + clampWidth - tipRect.width - margin;
  const maxTop = clampTopStart + clampHeight - tipRect.height - margin;

  // If tooltip would overflow on the right, place it to the left of the marker
  if (left > maxLeft) {
      left = rect.left + window.scrollX - tipRect.width - 10;
  }
  // If tooltip would overflow on the left, clamp to minLeft
  if (left < minLeft) left = minLeft;

  // If tooltip would overflow on the bottom, place it above the marker
  if (top > maxTop) {
      top = rect.top + window.scrollY - tipRect.height - 10;
  }
  // If tooltip would overflow on the top, clamp to minTop
  if (top < minTop) top = minTop;

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