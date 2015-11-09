var Ajv = require('ajv')
var glob = require('glob')
var parse = require('parse-json')
var readFile = require('fs').readFile
var join = require('path').join
var Batch = require('batch')
var typings = require('typings')
var arrify = require('arrify')
var schema = require('./schema.json')

var ajv = new Ajv()
var filesBatch = new Batch()
var typingsBatch = new Batch()
var validate = ajv.compile(schema)

filesBatch.concurrency(10)
typingsBatch.concurrency(5)

glob('{ambient,bower,common,github,npm}/**/*.json', function (err, files) {
  if (err) {
    console.error(err)
    process.exit(1)
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
        Object.keys(data.version).forEach(function (version) {
          arrify(data.version[version]).forEach(function (location) {
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
    console.log('Reading files: ' + e.percent + '%')
  })

  typingsBatch.on('progress', function (e) {
    console.log('Typings installation: ' + e.percent + '%')
  })

  filesBatch.end(function (err) {
    if (err) {
      console.log(err)
      process.exit(1)
    }

    typingsBatch.end(function (err) {
      if (err) {
        console.log(err)
        process.exit(1)
      }

      console.log('The registry is valid, thank you!')
      process.exit(0)
    })
  })
})
