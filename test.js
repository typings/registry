var Ajv = require('ajv')
var glob = require('glob')
var parse = require('parse-json')
var readFile = require('fs').readFile
var join = require('path').join
var Batch = require('batch')
var typings = require('typings')
var arrify = require('arrify')
var exec = require('child_process').exec
var Minimatch = require('minimatch').Minimatch
var schema = require('./schema.json')

var ajv = new Ajv()
var filesBatch = new Batch()
var typingsBatch = new Batch()
var validate = ajv.compile(schema)
var changedOnly = process.argv.indexOf('--changed') > -1
var match = '{ambient,bower,common,github,npm}/**/*.json'

filesBatch.concurrency(10)
typingsBatch.concurrency(5)

if (changedOnly) {
  exec('git diff --name-only HEAD~1', cbify(function (stdout) {
    var mm = new Minimatch(match)

    var files = stdout.split(/\r?\n/g)
      .map(function (filename) {
        return filename.trim()
      })
      .filter(function (filename) {
        return mm.match(filename)
      })

    return execFiles(files)
  }))
} else {
  glob(match, cbify(execFiles))
}

/**
 * Run the test on all files.
 */
function execFiles (files) {
  console.error('Testing ' + files.length + ' files...')

  files.forEach(function (file) {
    filesBatch.push(function (done) {
      readFile(join(__dirname, file), 'utf8', function (err, contents) {
        var data

        if (err) {
          return done(err)
        }

        try {
          data = parse(contents)
        } catch (err) {
          return done(err)
        }

        var valid = validate(data)

        if (!valid) {
          return done(new Error('Invalid JSON for "' + file + '":\n' + ajv.errorsText(validate.errors)))
        }

        // Push all typings installation tests into a batch executor.
        Object.keys(data.versions).forEach(function (version) {
          arrify(data.versions[version]).forEach(function (location) {
            typingsBatch.push(function (done) {
              typings.installDependency(location, {
                cwd: __dirname,
                name: 'test',
                ambient: /^ambient/.test(file)
              })
                .then(function () {
                  return done()
                }, done)
            })
          })
        })

        return done()
      })
    })
  })

  filesBatch.on('progress', function (e) {
    console.error('Reading files: ' + e.percent + '%')
  })

  typingsBatch.on('progress', function (e) {
    console.error('Typings installation: ' + e.percent + '%')
  })

  filesBatch.end(cbify(function () {
    typingsBatch.end(cbify(function () {
      console.error('The registry is valid, thank you!')
      process.exit(0)
    }))
  }))
}

/**
 * Wrap a function to exit the process on failure.
 */
function cbify (done) {
  return function (err, value) {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    return done.apply(this, Array.prototype.slice.call(arguments, 1))
  }
}
