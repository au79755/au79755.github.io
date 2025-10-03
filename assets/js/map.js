/* Map integration (D3 + TopoJSON) */
(function () {
  if (!document.getElementById('map-container')) return;

  const d3 = window.d3;
  const topojson = window.topojson;
  if (!d3 || !topojson) return;

  const container = document.getElementById('map-container');
  let { width, height } = container.getBoundingClientRect();
  if (!width || !height) { width = 1000; height = 600; }

  const svg = d3.select('#map-container')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', width)
    .attr('height', height)
    .attr('tabindex', -1)
    .attr('focusable', false);

  const gMap = svg.append('g');
  const gMarkers = svg.append('g');
  const tooltip = d3.select('#tooltip');

  const projection = d3.geoNaturalEarth1();
  projection.fitSize([width, height], { type: 'Sphere' });

  const path = d3.geoPath().projection(projection);

  const zoom = d3.zoom()
    .scaleExtent([1, 4])
    .extent([[0, 0], [width, height]])
    .translateExtent([[0, 0], [width, height]])
    .on('zoom', (event) => {
      gMap.attr('transform', event.transform);
      gMarkers.selectAll('.marker')
        .attr('cx', d => event.transform.apply(projection(d.coordinates))[0])
        .attr('cy', d => event.transform.apply(projection(d.coordinates))[1]);
    });

  svg.call(zoom);

  const css = getComputedStyle(document.documentElement);
  const colorText = (css.getPropertyValue('--global-text-color') || '#333').trim();

  const mapDataUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

  d3.json(mapDataUrl).then(data => {
    const countries = topojson.feature(data, data.objects.countries);

    gMap.selectAll('path')
      .data(countries.features)
      .enter()
      .append('path')
      .attr('class', 'country')
      .attr('vector-effect', 'non-scaling-stroke')
      .attr('d', path)
      .attr('fill', colorText)
      .attr('opacity', 0.3)
      .attr('stroke', 'none');

    drawMarkers();
  });

  // Keep map responsive without scaling marker size
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      width = cr.width; height = cr.height;
      svg.attr('viewBox', `0 0 ${width} ${height}`)
         .attr('width', width)
         .attr('height', height);
      projection.fitSize([width, height], { type: 'Sphere' });
      gMap.selectAll('path').attr('d', path);
      gMarkers.selectAll('.marker')
        .attr('cx', d => projection(d.coordinates)[0])
        .attr('cy', d => projection(d.coordinates)[1]);
      const t = d3.zoomTransform(svg.node());
      const k = t.k || defaultScale;
      const ntx = (1 - k) * (width / 2);
      const nty = (1 - k) * (height / 2);
      svg.call(zoom.transform, d3.zoomIdentity.translate(ntx, nty).scale(k));
    });
    ro.observe(container);
  }

  const markers = [
    // PROFESSIONAL EXPERIENCE: Shows execution, leadership, and career progression.
    { type: "experience", role: "<strong>CTO & Cofounder</strong>", place: "Dallas", coordinates: [-96.7970, 32.7767], url: "https://austinlu.com/experience/2025-cofounder" },
    { type: "experience", role: "<strong>Project Lead</strong>", place: "Champaign", coordinates: [-88.2434, 40.1164], url: "https://austinlu.com/experience/2024-mentorship-ursa" },
    { type: "experience", role: "<strong>Full Stack Engineer</strong>", place: "Astoria", coordinates: [-90.3679, 40.1589], url: "https://austinlu.com/experience/2023-kkspc" },
    { type: "experience", role: "<strong>Software Developer (Intern)</strong>", place: "Shanghai", coordinates: [121.4737, 31.2304], url: "https://austinlu.com/experience/2018-coohom-intern" },
    
    // RESEARCH & INNOVATION: Frames academic work as forward-looking R&D.
    { type: "publication", role: "Published Research (AI/ML)", place: "Malaga", coordinates: [-4.4214, 36.7213], url: "https://austinlu.com/publication/2025-07-05-latent-fxlms" },
    { type: "publication", role: "Published Research (HCI)", place: "Ottawa", coordinates: [-75.6972, 45.4215], url: "https://austinlu.com/publication/2024-03-01-delay-constrained" },
    { type: "publication", role: "Published Research (Cloud)", place: "Bamberg", coordinates: [10.8862, 49.8988], url: "https://austinlu.com/publication/2022-05-08-mechatronic" },
    
    // INTERACTIVE DEMONSTRATIONS: Highlights product sense and communication.
    { type: "demo", role: "Intl. Partners Exhibition", place: "Chicago", coordinates: [-87.6298, 41.8781], url: "https://austinlu.com/publication/2024-08-27-discovery-partners" },
    { type: "demo", role: "Digital Twin Demo", place: "New York City", coordinates: [-74.0060, 40.7128], url: "https://austinlu.com/publication/2023-10-23-interactive-demo" },
    { type: "demo", role: "Cloud-based Research Platform", place: "Nashville", coordinates: [-86.7816, 36.1627], url: "https://austinlu.com/publication/2022-10-01-cloud-research" },
    { type: "demo", role: "Cloud-based Research Platform", place: "Munich", coordinates: [11.5761, 48.1371], url: "https://austinlu.com/publication/2022-10-01-cloud-research" },
];

  function drawMarkers() {
    gMarkers.selectAll('.marker')
      .data(markers)
      .enter()
      .append('circle')
      .attr('class', d => `marker ${d.type}`)
      .attr('cx', d => projection(d.coordinates)[0])
      .attr('cy', d => projection(d.coordinates)[1])
      .on('mouseover', (event, d) => {
        tooltip.style('opacity', 1)
          .html(`${d.role} in ${d.place}`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        window.location.href = d.url;
      });
  }
})();


