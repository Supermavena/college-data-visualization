let collegesData = []
async function readCollegesData() {
    collegesData = await d3.tsv('colleges.tsv');

    const n = 100;
    const majorsAndEarnings = collegesData.map(college => ({
        major: college.institution_name,
        medianEarnings: college.median_earnings ? parseFloat(college.median_earnings) : 0,
    })).filter(d => !isNaN(d.medianEarnings)).filter((d, i) => i % n === 0);

    const graph1Params = {
        height: 400,
        width: 800,
        data: majorsAndEarnings,
        xKey: 'major',
        yKey: 'medianEarnings',
        xLabel: 'Insitution Name',
        yLabel: 'Median Earnings',
        colors: { bar: 'steelblue' },
        tooltipFormat: d => {
            const major = d.major || 'N/A';
            const medianEarnings = d.medianEarnings || 'N/A';
            return `Insitution Name: ${major}<br>Median Earnings: ${medianEarnings}`;
        },
        margin: { top: 20, right: 30, bottom: 300, left: 100 },
    };
    createGraph("chart-container1", "bar", graph1Params);

    // Question 2
    const validSatScoreData = collegesData.map(college => ({
        satScore: (parseFloat(college.sat_verbal_quartile_1) + parseFloat(college.sat_verbal_quartile_3)) / 2,
        medianEarnings: college.median_earnings ? parseFloat(college.median_earnings) : 0,
    })).filter(d => !isNaN(d.medianEarnings)).filter(d => !isNaN(d.satScore));

    const scatterPlotParams = {
        height: 400,
        width: 800,
        data: validSatScoreData,
        xKey: 'satScore',
        yKey: 'medianEarnings',
        xLabel: 'SAT Score',
        yLabel: 'Median Earnings',
        tooltipFormat: d => {
            const satScore = d.satScore || 'N/A';
            const medianEarnings = d.medianEarnings || 'N/A';
            return `SAT Score: ${satScore}<br>Median Earnings: ${medianEarnings}`;
        },
        colors: { scatter: 'steelblue' },
        margin: { top: 20, right: 30, bottom: 70, left: 100 },
    };

    createGraph('chart-container2', 'scatter', scatterPlotParams);

    // Question 3
    const top50Data = collegesData.filter(college => college.top_50 === 'TRUE');
    const nonTop50Data = collegesData.filter(college => college.top_50 !== 'TRUE');

    const top50MedianEarnings = d3.median(top50Data, college => college.median_earnings);
    const nonTop50MedianEarnings = d3.median(nonTop50Data, college => college.median_earnings);

    const comparisonData = [
        { category: 'US News Top 50', medianEarnings: top50MedianEarnings },
        { category: 'Non Top 50', medianEarnings: nonTop50MedianEarnings },
    ];
    const barChartParams = {
        height: 400,
        width: 800,
        data: comparisonData,
        xKey: 'category',
        yKey: 'medianEarnings',
        xLabel: 'Category',
        yLabel: 'Median Earnings',
        colors: { bar: 'steelblue' },
        tooltipFormat: d => {
            const category = d.category || 'N/A';
            const medianEarnings = d.medianEarnings || 'N/A';
            return `Category: ${category}<br>Median Earnings: ${medianEarnings}`;
        },
        margin: { top: 20, right: 30, bottom: 70, left: 100 },
    };

    createGraph('chart-container3', 'bar', barChartParams);
}

readCollegesData();



function createGraph(containerId, chartType, params) {
    const {
        height,
        width,
        data,
        xKey,
        yKey,
        xLabel,
        yLabel,
        tooltipFormat,
        colors,
        margin,
    } = params;

    const svg = d3.select(`#${containerId}`).append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Creating scales and axes
    const xScale = chartType == "scatter" ? d3.scaleLinear().range([0, width]) : d3.scaleBand().range([0, width]).padding(.1);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    if (chartType === 'scatter') {
        xScale.domain([d3.min(data, d => d.satScore), d3.max(data, d => d.satScore)]);
        yScale.domain([0, d3.max(data, d => d[yKey])]);
    } else {
        xScale.domain(data.map(d => d[xKey]));
        yScale.domain([0, d3.max(data, d => d[yKey])]);
    }

    // Adding axes
    svg.append('g')
        .attr('transform', `translate(0, ${height})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('transform', 'rotate(-45)');

    svg.append('g')
        .attr('class', 'y axis')
        .call(yAxis);

    // Adding axis labels
    svg.append('text')
        .attr('transform', `translate(${width / 2}, ${height + margin.bottom - margin.top * 2})`)
        .style('text-anchor', 'middle')
        .text(xLabel);

    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', 0 - margin.left)
        .attr('x', 0 - (height / 2))
        .attr('dy', '1em')
        .style('text-anchor', 'middle')
        .text(yLabel);

    svg.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#f5f5f5');

    // Adding tooltip for better readability of scatter graph
    const tooltip = d3.select(`#${containerId}`).append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0.5)
        .style('background', '#fff')
        .style('padding', '0.5rem')
        .style('border', '1px solid #ddd')
        .style('border-radius', '5px')
        .style('box-shadow', '2px 2px 5px rgba(0, 0, 0, 0.1)');;

    // Creating chart elements based on chart type
    if (chartType === 'scatter') {
        svg.selectAll('.dot').data(data).enter().append('circle')
            .attr('cx', d => xScale(+d[xKey]))
            .attr('cy', d => yScale(d[yKey])).attr('r', 5)
            .style('fill', colors.scatter)
            .on('mouseover', (e, d) => {
                d3.select(e.target).style('fill', 'orange');
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(tooltipFormat(d))
            })
            .on('mousemove', (e) => {
                // Update tooltip position
                tooltip.style('left', `${e.pageX}px`).style('top', `${e.pageY - 28}px`);
            }).on('mouseout', (e, d) => {
                // Reset point appearance on mouseout
                d3.select(e.target).style('fill', colors.scatter);

                tooltip.transition().duration(500).style('opacity', 0);
            });
    } else {
        svg.selectAll('.bar')
            .data(data)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => xScale(d[xKey]))
            .attr('width', xScale.bandwidth())
            .attr('y', d => yScale(d[yKey]))
            .attr('height', d => height - yScale(d[yKey]))
            .style('fill', colors.bar)
            .on('mouseover', (e, d) => {
                d3.select(e.target).style('fill', 'orange');
                tooltip.transition().duration(200).style('opacity', .9);
                tooltip.html(tooltipFormat(d))
            })
            .on('mousemove', (e) => {
                tooltip.style('left', `${e.pageX}px`).style('top', `${e.pageY - 28}px`);
            }).on('mouseout', (e, d) => {
                // Reset point appearance on mouseout
                d3.select(e.target).style('fill', colors.bar);
                tooltip.transition().duration(500).style('opacity', 0);
            });;
    }
}

