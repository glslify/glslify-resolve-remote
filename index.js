var readJSON = require('read-package-json')
var resolve  = require('glsl-resolve')
var request  = require('request')
var semver   = require('semver')
var findup   = require('findup')
var path     = require('path')
var fs       = require('fs')

module.exports = remoteResolve

function remoteResolve(config) {
  if (typeof config === 'string') config = { cache: config }

  var cache = config.cache || path.resolve('.glslify')
  var npmdl = require('npmdl')(cache)

  config = config || {}

  return remoteResolve

  function remoteResolve(dst, opts, ready) {
    var src = (opts = opts || {}).basedir

    dst = dst.trim()
    dst = dst.replace(/^'|'$/g, '')
    dst = dst.replace(/^"|"$/g, '')

    // handle local dependencies as usual
    if (dst.charAt(0) === '.') return resolve(dst, {
      basedir: src
    }, ready)

    // disallow absolute dependencies
    if (dst.charAt(0) === '/') return done(new Error('absolute URLs not permitted'))

    // Module dependencies: download the latest version
    // from npm, caching locally where possible.
    var paths  = dst.split(/\/+/g)
    var module = paths.shift()

    paths = './' + paths.join('/')

    return findup(src
      , 'package.json'
      , getJSON
    )

    function getJSON(err, pkgDir) {
      if (err && err.message !== 'not found') return ready(err)
      if (err) return resolveVersion('latest', gotVersion)

      readJSON(path.join(pkgDir, 'package.json'), function(err, json) {
        return resolveVersion(json.dependencies && json.dependencies[module] || 'latest', gotVersion)
      })
    }

    function resolveVersion(version, next) {
      if (config.offline) {
        var versions = fs.readdirSync(path.join(cache, module))
        var latest   = semver.maxSatisfying(versions, '*')

        return next(null, latest)
      }

      request('http://registry.npmjs.com/'+module+'/'+version, {
        json: true
      }, function(err, res, body) {
        if (err) return next(err)
        next(null, body.version)
      })
    }

    function gotVersion(err, version) {
      if (err) return ready(err)

      npmdl(module, version, 'package.json', function(err, json) {
        if (err) return ready(err)

        try {
          json = JSON.parse(json)
        } catch(err) {
          return ready(err)
        }

        var basedir = path.join(cache, module, version, 'package')

        resolve(paths, {
          basedir: basedir
        }, function(err, destination) {
          if (err) return ready(err)

          var rel = path.relative(cache, destination)
          if (rel.indexOf('..') === -1) return ready(null, destination)

          ready(new Error(
            'Module attempting to reach outside of the cache tree.'
          ))
        })
      })
    }
  }
}
