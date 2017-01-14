var cheerio = require('cheerio');
var models = require('../models.js');
var util = require('../util.js');
var normalizeWhitespace = util.normalizeWhitespace;
var request = util.request;

const dataUrl = 'http://ascs8.eservices.virginia.edu/AsEquivs/Home/EquivsShow?schoolId=1001975';
const institution = new models.Institution('UVA', 'University of Virginia', 'Virginia');
const headerRows = 2;
const nvccIndex = 1; // CSS queries are 1-indexed
const uvaIndex = 2;

// Used when the college doens't accept equivalencies for a NVCC course
const COURSE_NO_EQUIV = new models.Course('NONE', '000', 0);

function findAll(done) {
    return request(dataUrl, institution).then(parseEquivalencies);
}

function parseEquivalencies(body) {
    var $ = cheerio.load(body);
    var equivalencies = [];

    var rows = $($('table')[3]).find('tr').slice(headerRows);
    rows.each(function(index, element) {
        var rowType = getRowType($(this));

        switch (getRowType($(this))) {
            case 'unknown':
                reject(new Error("Found row with type 'unknown'"));
                return false;
            case 'empty':// This is a row to separate courses, skip
            case 'input':
            case 'output':
                // We handle supplement and freebie rows when their base courses
                // are found
                return true;
        }

        var nvccCourses = [ parseCourse($(this), nvccIndex) ];
        var uvaCourses = [ parseCourse($(this), uvaIndex) ];

        var eq = new models.CourseEquivalency(nvccCourses, uvaCourses);

        if (index + 1 < rows.length) {
            // Possibility of extraneous row
            var nextRowType = getRowType($(rows[index + 1]));
            if (nextRowType === 'unknown') {
                reject("Found row with type 'unknown'");
                return false;
            }
            if (nextRowType === 'input' || nextRowType === 'output') {
                // Add a supplement
                var columnIndex = nvccIndex; // Assume input course
                if (nextRowType === 'output')
                    index = uvaIndex;
                eq[nextRowType].push(parseCourse($(rows[index + 1]), columnIndex));
            }
        }

        eq.type = determineEquivType(eq.output);

        equivalencies.push(eq);
    });

    return new models.EquivalencyContext(institution, equivalencies);
}

function parseCourse($tr, index) {
    var baseStr = normalizeWhitespace($tr.children(`td:nth-child(${index})`)
            .text());
    if (baseStr === '(no credit)') {
        // UVA doesn't offer credit for this course, make up our own
        // course number
        return COURSE_NO_EQUIV;
    }

    // Business as usual
    var parts = baseStr.split(' ');

    var credits = -1;
    if (parts.length >= 3)
        credits = parseInt(parts[2]);
    return new models.Course(parts[0], parts[1], credits);
}

/**
 * Identifies the type of data present in the given row.
 *
 * Returns:
 *   'normal' => NVCC and UVA course present
 *   'input' => Specifies extra NVCC course to take to get credit for the UVA
 *              course in the above row.
 *   'output' => Specifies extra UVA course one would get credit for if they
 *               also got credit for the NVCC course specified in the above
 *               row.
 *   'empty' => This row is used to visually separate other course equivalencies
 *   'unknown' => Logically shouldn't be returned so if you see this you know
 *                something's wrong.
 */
function getRowType($tr) {
    var nvccColumn = $tr.children('td:nth-child(1)').text().trim();
    var uvaColumn = $tr.children('td:nth-child(2)').text().trim();

    if (nvccColumn !== '' && uvaColumn !== '')
        return 'normal';
    if (nvccColumn === '' && uvaColumn === '')
        return 'empty';
    if (nvccColumn !== '' && uvaColumn === '')
        return 'input';
    if (nvccColumn === '' && uvaColumn !== '')
        return 'output';
    return 'unknown';
}

function determineEquivType(uvaCourses) {
    if (uvaCourses[0].subject === COURSE_NO_EQUIV.subject &&
            uvaCourses[0].number === COURSE_NO_EQUIV.number) {

        return models.TYPE_NONE;
    }

    return util.determineEquivType(uvaCourses, 'T');
}

module.exports.findAll = findAll;
module.exports.institution = institution;