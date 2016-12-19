var bodyParser = require('body-parser');
var express = require('express');
var helmet = require('helmet');
var logger = require('morgan');
var mongodb = require('mongodb')
var path = require('path');
var queries = require('./app/queries');
var db = require('./app/database.js');

const app = express();
var api = require('./app/routes/api');

// Catch unhandled Promises
process.on('unhandledRejection', function(reason, p) {
    console.error("Unhandled Promise rejection: ");
    throw reason;
});

///////////////////// CONFIGURATION /////////////////////
app.set('views', path.join(__dirname, 'app/views'));
app.set('view engine', 'pug');
app.use(helmet());
app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'app/public')));

const port = process.env.PORT || 8080;

//////////////// COMMAND LINE ARGUMENTS /////////////////
var doIndex = true;
process.argv.slice(2).forEach(function(val, index, array) {
    if (val === '--no-index') {
        doIndex = false;
    }
});


//////////////////////// ROUTING ////////////////////////
app.use('/api', api);
app.use('/', require('./app/routes/front'));

///////////////////// ERROR HANDLING ////////////////////
// Catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// Development error handler
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// Production error handler
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render("error", {
        message: err.message,
        error: {}
    });
});


///////////////////////// START /////////////////////////
// Connect to MongoDB
db.connect(db.MODE_PRODUCTION).then(function() {
    if (doIndex) {
        console.log('Indexing...');
        return queries.dropIfExists('courses')
                .then(queries.indexInstitutions)
                .then(function(report) {
                    console.log(`Indexed ${report.coursesIndexed} courses from ${report.institutionsIndexed} institutions`)
                });
    } else {
        console.log('Skipping index step. Courses may not be up to date.');
    }
}).then(function() {
    app.listen(port);
    console.log('Magic is happening on port ' + port);
}).catch(function(reason) {
    throw reason;
});
