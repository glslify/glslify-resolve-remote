# glslify-resolve-remote [![experimental](http://badges.github.io/stability-badges/dist/experimental.svg)](http://github.com/badges/stability-badges)

A replacement resolver function for
[glslify](http://github.com/stackgl/glslify) that lets you automatically
pull in GLSL modules from npm.

One part of a potential glslify server API for allowing client-side shader
development without the need for a local server.

**Note:** npm install hooks are not executed because security, so you'll
want to make sure that the package you're requiring has the source files
available in full on publish. 99% of the time this won't be an issue though
:)

## Usage

[![NPM](https://nodei.co/npm/glslify-resolve-remote.png)](https://nodei.co/npm/glslify-resolve-remote/)

### resolve([options])

To use this module, pass it in as a custom resolver to glslify like so:

``` javascript
var resolve = require('glslify-resolve-remote')
var bundle  = require('glslify-bundle')
var deps    = require('glslify-deps')

var src = `
#pragma glslify: ease = require(glsl-easings/bounce-in-out)

void main() {
  gl_FragColor = vec4(vec3(ease(0.5)), 1.0);
}
`

var depper = deps({
  resolve: resolve({
    cache: __dirname + '/.glslify'
  })
})

depper.inline(src, '/', function(err, src) {
  if (err) throw err

  // no "node_modules" required!
  console.log(src)
})
```

The following options are also available:

* `cache`: change where downloaded packages are stored on disk. They should only
  be downloaded once when first required.
* `offline`: rely solely on the cache wherever possible. Identended for use in
  presentations at events such as [CampJS](http://campjs.com/), where internet
  is limited or unavailable. Also useful if you're on the go and don't always
  have internet access.

## License

MIT. See [LICENSE.md](http://github.com/hughsk/glslify-resolve-remote/blob/master/LICENSE.md) for details.
