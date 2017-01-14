# Building

novaXfer is built with the [Grunt](http://gruntjs.com/) task runner.

## Tasks

***(default)*** — Runs Mocha and Karma

**test** — Same as default

**testCoverage** — Cleans the `build` and `.cache` directories and runs Mocha and Karma with code coverage. Coverage info can be found in `build/reports/coverage/`

**uploadCoverage** — Merges the coverage results from Mocha and Karma and sends it to Coveralls

**build** — Builds the project

 1. Cleans the build and final distribution folder
 2. Runs browserify to bundle JavaScript app
 3. Passes resulting file through Babel, then minifies
 4. Minifies CSS
 5. Renders Pug templates
 6. Copies files from temporary build location to `app/server/public`

**watch** — Watches JS, CSS, and Pug files for changes and rebuilds the necessary components. Useful for developing
