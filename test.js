var Ajv = require('ajv')
var glob = require('glob')
var parse = require('parse-json')
var readFileSync = require('fs').readFileSync
var join = require('path').join
var schema = require('./schema.json')

var ajv = new Ajv()
var validate = ajv.compile(schema)

glob('{ambient,bower,common,github,npm}/**/*.json', function (err, files) {
  if (err) {
    console.error(err)
    process.exit(1)
  }

  files.forEach(function (filename) {
    var data = parse(readFileSync(join(__dirname, filename), 'utf8'))

    var valid = validate(data)

    if (!valid) {
      console.error('Invalid JSON for "' + filename + '":')
      console.error(ajv.errorsText(validate.errors))
      process.exit(1)
    }
  })

  console.log('The registry is valid, thanks to you!')
})
