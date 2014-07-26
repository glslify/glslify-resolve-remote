var readJSON = require('read-package-json')
var resolve  = require('glsl-resolve')
var request  = require('request')
var findup   = require('findup')
var mkdirp   = require('mkdirp')
var path     = require('path')
var zlib     = require('zlib')
var tar      = require('tar')
var fs       = require('fs')

module.exports = remoteResolve

function remoteResolve(cache) {
  cache = cache || path.join(__dirname, '.glslify')

  return remoteResolve

  function remoteResolve(src, dst, ready) {
    // handle local dependencies as usual
    if (dst.charAt(0) === '.') return resolve(dst, { basedir: path.dirname(src) }, done)
    // disallow absolute dependencies
    if (dst.charAt(0) === '/') return done(new Error('absolute URLs not permitted'))

    // Module dependencies: download the latest version
    // from npm, caching locally where possible.
    var paths = dst.split(/\/+/g)
    var module = paths.shift()

    paths = './' + paths.join('/')

    return findup(
        path.dirname(src)
      , 'package.json'
      , checkJSONVersion
    )

    function done(err, destination) {
      if (err) return ready(err)
      var rel = path.relative(cache, destination)
      if (rel.indexOf('..') === -1) return ready(null, destination)

      ready(new Error(
        'Module attempting to reach outside of the cache tree.'
      ))
    }

    function checkJSONVersion(err, result) {
      if (err && err.message === 'not found') {
        return request('http://registry.npmjs.org/'+module+'/latest', {
          json: true
        }, gotMetadata)
      }

      if (err) return done(err)

      readJSON(path.join(result, 'package.json'), function(err, json) {
        if (err) return done(err)

        var version = json.dependencies && json.dependencies[module] || 'latest'

        return request('http://registry.npmjs.org/'+module+'/latest', {
          json: true
        }, gotMetadata)
      })
    }

    function gotMetadata(err, res, data) {
      if (err) return done(err)

      var tarballURL = data.dist && data.dist.tarball
      if (!tarballURL) return done(new Error(
        'No tarball available for this module'
      ))

      var version = data.version
      var directory = path.join(cache, module, version)
      var pack = path.join(directory, 'package')
      var pkgjson = path.join(pack, 'package.json')

      fs.exists(pkgjson, function(exists) {
        if (exists) return resolve(paths, { basedir: pack }, done)

        mkdirp(directory, preppedDirectory)
      })

      function preppedDirectory(err) {
        if (err) return done(err)

        request.get(tarballURL)
          .pipe(zlib.createGunzip())
          .pipe(tar.Extract({ path: directory }))
          .once('end', function() {
            if (!paths) return console.error(paths)

            resolve(paths, { basedir: pack }, done)
          })
      }
    }
  }
}
