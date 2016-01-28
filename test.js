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
var EOL = require('os').EOL
var schema = require('./schema.json')

var ajv = new Ajv()
var filesBatch = new Batch()
var typingsBatch = new Batch()
var validate = ajv.compile(schema)
var changedOnly = process.argv.indexOf('--changed') > -1
var listFiles = process.argv.indexOf('--list') > -1
var match = '{ambient,bower,common,github,npm}/**/*.json'

filesBatch.concurrency(10)
typingsBatch.concurrency(5)

if (changedOnly) {
  exec('git diff --name-status HEAD~1', cbify(function (stdout) {
    var mm = new Minimatch(match)

    var files = stdout.trim().split(/\r?\n/g)
      .map(function (line) {
        return line.split('\t')
      })

    // Check each line is a new, valid, addition.
    files.forEach(function (line) {
      if (line[0] === 'A' && !mm.match(line[1])) {
        throw new TypeError('Invalid filename: ' + line[1])
      }
    })

    // Files to actually test are a subset of changed.
    var testFiles = files
      .filter(function (line) {
        return line[0] !== 'D' && mm.match(line[1])
      })
      .map(function (line) {
        return line[1]
      })

    return execFiles(testFiles)
  }))
} else {
  glob(match, cbify(execFiles))
}

/**
 * Run the test on all files.
 */
function execFiles (files) {
  if (files.length === 0) {
    console.error('No files added...')
    process.exit(0)
  }

  console.error('Testing ' + files.length + ' files...')
  console.error()

  if (listFiles) {
    console.error(files.join(EOL))
    console.error()
  }

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
    console.error()

    typingsBatch.end(cbify(function () {
      console.error()
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
