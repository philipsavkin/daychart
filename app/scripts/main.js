$(function() { 'use strict';

function isLeapYear(y) {
    if (y % 400 === 0) {
        return true;
    }

    if (y % 100 === 0) {
        return false;
    }

    return y % 4 === 0;
}

var months = [
    { name: 'Jan', days: 31, fill: 'rgba(0,   255, 128, 0.4)' },
    { name: 'Feb', days: (isLeapYear(new Date().getFullYear()) ? 29 : 28),
                             fill: 'rgba(0, 205, 128, 0.4)' },
    { name: 'Mar', days: 31, fill: 'rgba(51,  153, 128, 0.4)' },
    { name: 'Apr', days: 30, fill: 'rgba(102, 102, 128, 0.4)' },
    { name: 'May', days: 31, fill: 'rgba(153, 51,  128, 0.4)' },
    { name: 'Jun', days: 30, fill: 'rgba(204, 0,   128, 0.4)' },
    { name: 'Jul', days: 31, fill: 'rgba(255, 0,   128, 0.4)' },
    { name: 'Aug', days: 31, fill: 'rgba(204, 0,   128, 0.4)' },
    { name: 'Sep', days: 30, fill: 'rgba(153, 51,  128, 0.4)' },
    { name: 'Oct', days: 31, fill: 'rgba(102, 102, 128, 0.4)' },
    { name: 'Nov', days: 30, fill: 'rgba(51,  153, 128, 0.4)' },
    { name: 'Dec', days: 31, fill: 'rgba(0,   204, 128, 0.4)' }
];

function getData(lat, lon) {

    function dateDiffSecs(d1, d2) {
        return Math.round((d1.getTime() - d2.getTime()) / 1000);
    }

    var currYear = new Date().getFullYear(),
        beginYearMillis = new Date(currYear, 0, 0, 0, 0, 0, 0).getTime(),
        days = 365 + (isLeapYear(currYear) ? 1 : 0),
        dates = [], durations = [], diffs = [], events = [],
        sunCalcData, dateStr, todayInd;

    var springEquinox  = new Date(currYear, 2, 20).toDateString(),
        summerSolstice = new Date(currYear, 5, 21).toDateString(),
        autumnEquinox  = new Date(currYear, 8, 23).toDateString(),
        winterSolstice = new Date(currYear, 11, 21).toDateString(),
        today = new Date().toDateString();

    for (var i = 0; i < days; i++) {
        dates[i] = new Date(beginYearMillis + (i + 1) * 24 * 3600000);

        dateStr = dates[i].toDateString();
        if (dateStr === springEquinox || dateStr === summerSolstice ||
                dateStr === autumnEquinox || dateStr === winterSolstice) {
            events.push(i);
        }

        if (dateStr === today) {
            todayInd = i;
        }

        sunCalcData = SunCalc.getTimes(dates[i], lat, lon);
        durations[i] = dateDiffSecs(sunCalcData.sunset, sunCalcData.sunrise);
        if (i > 0) {
            diffs[i] = durations[i] - durations[i - 1];
        }
    }

    diffs[0] = durations[0] - durations[durations.length - 1];

    return {
        dates: dates,
        durations: durations,
        diffs: diffs,
        events: events,
        today: todayInd
    };
}

function drawChart(canvas, dateData) {

    var data = dateData.diffs;
    var ctx = canvas.getContext('2d');

    var maxChartHeight = canvas.height - 40;
    var chartProps = {
        maxWidth: canvas.width,
        maxHeight: maxChartHeight,
        xoffset: 30.5,
        yoffset: Math.floor(maxChartHeight / 2),
        gridStep: 20
    };

    // data properties
    var min = Math.min.apply(null, data),
        max = Math.max.apply(null, data),
        multiplier = chartProps.maxHeight * 0.9 / Math.abs(max - min);

    var xstep, i, e, monthWidth, monthX;

    function lineTo(x, y) { ctx.lineTo(x + chartProps.xoffset, y + chartProps.yoffset); }

    function formatTime(time) {
        var mins = Math.floor(time / 60),
            secs = time - mins * 60,
            str = '' + mins + ':' + secs;

        return str.length < 4 ? str + '0' : str;
    }

    function drawGrid(step, condition) {
        var d, y;
        for (d = step; condition(d, step); d += step) {
            y = chartProps.yoffset - d * multiplier;
            ctx.strokeText(formatTime(d), 0, y);
            ctx.moveTo(chartProps.xoffset - 2, y);
            ctx.lineTo(chartProps.maxWidth, y);
        }
    }

    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // setup context
    ctx.font = '9px Arial';
    ctx.textBaseline = 'middle';

    // draw grid
    ctx.beginPath();
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = '#888888';
    ctx.moveTo(chartProps.xoffset, 0);
    ctx.lineTo(chartProps.xoffset, chartProps.maxHeight);
    ctx.moveTo(chartProps.xoffset - 5, chartProps.yoffset);
    lineTo(chartProps.maxWidth, 0);
    ctx.strokeText('0', 0, chartProps.yoffset);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#cccccc';

    drawGrid(chartProps.gridStep,  function (d, step) { return d < (max + step); });
    drawGrid(-chartProps.gridStep, function (d, step) { return d > (min + step); });

    ctx.stroke();

    // draw equinox and solstice events
    xstep = (chartProps.maxWidth - chartProps.xoffset) / data.length;

    ctx.beginPath();
    for (i = 0; i < dateData.events.length; i++) {
        e = chartProps.xoffset + xstep * dateData.events[i];
        ctx.moveTo(e, 0);
        ctx.lineTo(e, chartProps.maxHeight);
    }
    ctx.stroke();

    // mark today's date
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#888888';
    e = chartProps.xoffset + xstep * dateData.today;
    ctx.moveTo(e, 0);
    ctx.lineTo(e, chartProps.maxHeight);
    ctx.stroke();

    // draw months
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#000';
    monthX = chartProps.xoffset;
    for (i = 0; i < months.length; i++) {
        monthWidth = months[i].days * (chartProps.maxWidth - chartProps.xoffset) / data.length;
        ctx.fillStyle = months[i].fill;
        ctx.fillRect(monthX, chartProps.maxHeight + 20, monthWidth, 20);
        ctx.strokeText(months[i].name, monthX, chartProps.maxHeight + 30);
        monthX += monthWidth;
    }

    // draw data
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(151,187,205,1)';
    ctx.moveTo(chartProps.xoffset, chartProps.yoffset - data[0] * multiplier);
    for (i = 1; i < data.length; i++) {
        lineTo(i * xstep, -data[i] * multiplier);
    }

    ctx.stroke();
}

function readCoord(str) {
    return parseFloat(str);
}

function drawForCoords(lat, lon) {
    var data = getData(lat, lon),
        today = new Date(),
        sunCalcData = SunCalc.getTimes(today, lat, lon);

    drawChart($('#chart').get(0), data);

    $('#lat-box').text(lat.toFixed(8));
    $('#lon-box').text(lon.toFixed(8));
    $('#today-box').text(today.toLocaleDateString());
    $('#sunrise-box').text(sunCalcData.sunrise.toLocaleTimeString());
    $('#sunset-box').text(sunCalcData.sunset.toLocaleTimeString());
}

//----------------- Main -----------------------
// display map
var startPoint = new OpenLayers.LonLat(0, 0);
var map = new OpenLayers.Map({
    div: 'map',
    theme: null,
    controls: [
        new OpenLayers.Control.Navigation(),
        new OpenLayers.Control.TouchNavigation({
            dragPanOptions: {
                enableKinetic: true
            }
        }),
        new OpenLayers.Control.Zoom()
    ],
    layers: [
        new OpenLayers.Layer.OSM('OpenStreetMap', null, {
            transitionEffect: 'resize',
            attribution: ''
        })
    ],
    center: startPoint,
    zoom: 1
});

var fromProjection = new OpenLayers.Projection('EPSG:900913'),
    toProjection = new OpenLayers.Projection('EPSG:4326');

map.events.register('click', map, function (e) {
    var point = map.getLonLatFromViewPortPx(e.xy).transform(fromProjection, toProjection);
    console.log('Coordinates: ' + point.lat + ', ' + point.lon);
    drawForCoords(point.lat, point.lon);
});

//$('#calc-btn').click(function () {
//    var latitude = readCoord($('#inp-lat').val()),
//        longitude = readCoord($('#inp-lon').val());
//
//    drawForCoords(latitude, longitude);
//});

drawForCoords(51.5, 0);



});
