var util = require('../util.js');
var request = util.request;
var models = require('../models.js');

const dataUrl = 'http://cnu.edu/transfer/pdf/vccs_transferguide.pdf';
const institution = new models.Institution('CNU', 'Christopher Newport University');
const subjectRegex = /^[A-Z]{3}$/;
// Tests if the entirety of a string represents a valid course identifier.
// Example: http://regexr.com/3estr
const courseStringTester = /^(?:([A-Z]{2,4} ?)?([0-9LX]{2,4})(?: & |\/ ?)?)+$/;
// Capture course identifier parts
// Example: http://regexr.com/3esti
const courseStringSeparator = /([A-Z]{3,4} ?)?([0-9LX]{3,4})/g;
const defaultCnuCourseIndex = 4;

function findAll() {
    return request(dataUrl, institution).then(util.parsePdf).then(parseEquivalencies);
}

function parseEquivalencies(rows) {
    var equivalencies = [];
    for (let row of rows) {
        if (subjectRegex.test(row[0])) {
            // NVCC is pretty convenient
            var nvccCourse = new models.Course(row[0], row[1], parseInt(row[2]));

            // CNU isn't
            var cnuCourses = null;
            for (let i = defaultCnuCourseIndex; i < row.length; i++) {
                // Look for a cell represents the CNU course
                var base = row[i].trim();
                if (courseStringTester.test(base)) {
                    cnuCourses = parseCnuCourses(base);
                    break;
                }

                // Sometimes the full identifier can't fit on a single row,
                // search the next row as well.
                if (i + 1 < row.length) {
                    var appended = base + " " + row[i + 1].trim();
                    if (courseStringTester.test(appended)) {
                        cnuCourses = parseCnuCourses(appended);
                        break;
                    }
                }
            }

            if (cnuCourses !== null)
                equivalencies.push(new models.CourseEquivalency([nvccCourse], cnuCourses, institution));
        };
    }

    return equivalencies;
}

function parseCnuCourses(rawString) {
    var matchedCourses = rawString.match(courseStringSeparator);
    var courses = [];

    // Split each match by a space and flat map. For example:
    // ['CHEM 104', '104L'] => ['CHEM', '104', '104L']
    matchedCourses = [].concat.apply([], matchedCourses.map(course => separateCourseParts(course)));

    var subject = matchedCourses[0];
    for (var i = 1; i < matchedCourses.length; i++) {
        if (/[A-Z]/.test(matchedCourses[i][0])) {
            // First letter is alphabetical, assume subject
            subject = matchedCourses[i];
        } else {
            // First letter is non-alphabetical, assume course number
            courses.push(new models.Course(subject, matchedCourses[i], models.CREDITS_UNCLEAR));
        }
    }

    return courses;
}

function separateCourseParts(raw) {
    if (raw.indexOf(' ') !== -1)
        return raw.split(' ');

    var firstNumber = raw.search(/\d/);
    if (firstNumber === 0)
        return [raw];
    return [raw.slice(0, firstNumber), raw.slice(firstNumber)];
}

module.exports.findAll = findAll;
module.exports.institution = institution;
