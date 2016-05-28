var Ajv = require('ajv')
var glob = require('glob')
var parse = require('parse-json')
var readFile = require('fs').readFile
var join = require('path').join
var Batch = require('batch')
var typings = require('typings-core')
var arrify = require('arrify')
var exec = require('child_process').exec
var minimatch = require('minimatch')
var EOL = require('os').EOL
var schema = require('./schema.json')

var sep = '/'
var ajv = new Ajv()
var filesBatch = new Batch()
var typingsBatch = new Batch()
var validate = ajv.compile(schema)
var changedOnly = process.argv.indexOf('--changed') > -1
var listFiles = process.argv.indexOf('--list') > -1
var match = '{npm,github,bower,common,shared,lib,env,global}/**/*.json'
var exclude = '{.github/**,.vscode/**,.gitignore,.travis.yml,package.json,README.md,schema.json,test.js}'
var globalSources = ['lib', 'env', 'global']

filesBatch.concurrency(10)
typingsBatch.concurrency(5)
if (changedOnly) {
  exec('git diff --name-status HEAD~1', cbify(function (stdout) {
    var files = stdout.trim().split(/\r?\n/g)
      .map(function (line) {
        return line.split('\t')
      })

    // Check each line is a new, valid, addition.
    files.forEach(function (line) {
      if (!minimatch(line[1], match) && !minimatch(line[1], exclude)) {
        throw new TypeError('Invalid filename: ' + line[1])
      }
    })

    // Files to actually test are a subset of changed.
    var testFiles = files
      .filter(function (line) {
        return line[0] !== 'D' && minimatch(line[1], match)
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
        var parts = file.replace(/\.json$/i, '').split(sep)
        var source = parts.shift()
        var name = parts.join('/')
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
          return done(new Error('Invalid JSON for "' + name + ' (' + source + ')":\n' + ajv.errorsText(validate.errors)))
        }

        // Push all typings installation tests into a batch executor.
        Object.keys(data.versions).forEach(function (version) {
          arrify(data.versions[version]).forEach(function (info) {
            // Handle plain string locations.
            if (typeof info === 'string') {
              info = { location: info }
            }

            typingsBatch.push(function (done) {
              typings.installDependency({
                name: name,
                location: info.location
              }, {
                cwd: __dirname,
                name: name,
                global: globalSources.indexOf(source) > -1
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
      console.error(err.toString())
      process.exit(1)
    }

    return done.apply(this, Array.prototype.slice.call(arguments, 1))
  }
}
