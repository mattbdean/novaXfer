var indexers = require('./indexers');
var db = require('./database.js');

const COLL_COURSES = 'courses';
const COLL_INSTITUTIONS = 'institutions';

/**
 * Retrieves all courses in a given subject
 */
module.exports.coursesInSubject = function(subject, done) {
    var col = db.mongo().collection(COLL_COURSES);
    // INJECTION WARNING
    col.find({subject: new RegExp('^' + subject + '$', 'i')})
        .sort({number: 1})
        .toArray(done);
};

/**
 * Gets a document representing the given course data, including only the
 * equivalencies belonging to the given institutions.
 */
module.exports.equivalenciesForCourse = function(courseSubject, courseNumber, institutions, done) {
    var matchEquivalencies = [];
    for (var i = 0; i < institutions.length; i++) {
        matchEquivalencies.push({"equivalencies.institution": institutions[i]});
    }
    db.mongo().collection(COLL_COURSES).aggregate([
        // Match first document with the given subject and number
        { $match: { subject: courseSubject, number: courseNumber} },
        { $limit: 1 },
        // Create seperate documents for each equivalency (all have same ID)
        { $unwind: "$equivalencies" },
        // Filter out all but the given institutions
        { $match: { $or: matchEquivalencies } },
        // Recombine the documents with only the required equivalencies
        { $group: {
            _id: "$_id",
            // Is there a better way to include these fields?
            subject: { $first: "$subject" },
            number: { $first: "$number" },
            equivalencies: {$push: "$equivalencies"}
        } }
    ]).toArray(function(err, docs) {
        if (err !== null)
            return done(err);

        // Aggregation returns maximum of one document
        if (docs.length === 0)
            return done(`No such course: subject=${courseSubject}, number=${courseNumber}`);
        else
            return done(null, docs[0]);
    });
};

module.exports.listInstitutions = function(done) {
    db.mongo().collection(COLL_INSTITUTIONS).find().sort({ acronym: 1 }).toArray(done);
}

module.exports.indexInstitutions = function(done) {
    var courses = db.mongo().collection('courses');
    indexers.findIndexers(function(err, inds) {
        if (err)
            return done(err);

        var institutions = inds.map( indexer => require(indexer).institution );
        upsertInstitutions(institutions, function finished(err) {
            indexers.index(upsertEquivalency, done);
        });
    });
};

function upsertEquivalency(eq) {
    var coll = db.mongo().collection(exports.COLL_COURSES);
    coll.updateOne({number: eq.keyCourse.number, subject: eq.keyCourse.subject},
        {
            // Add to equivalencies array if it doesn't already exist
            $addToSet: {
                equivalencies: {
                    "institution": eq.institution.acronym,
                    "input": eq.input,
                    "output": eq.output
                }
            }
        },
        {upsert: true},
        function(err, result) {
            if (err !== null)
                done(err);
        }
    );
}

function upsertInstitutions(institutions, done) {
    db.mongo().dropCollection(COLL_INSTITUTIONS, function(err, result) {
        db.mongo().collection(COLL_INSTITUTIONS).insertMany(institutions, function(err2, r) {
            if (err)
                return done(err2);
            done(null, result);
        });
    });
}
