var glslify = require('glslify-stream')
var deparse = require('glsl-deparser')
var from    = require('new-from')
var resolve = require('./')

var shader  = [
  '#pragma glslify: ease = require(glsl-easings/bounce-in-out)'
, 'void main() {'
, '  gl_FragColor = vec4(vec3(ease(0.5)), 1.0);'
, '}'
].join('\n')

from([shader])
  .pipe(glslify('/', { resolve: resolve(), input: true }))
  .pipe(deparse())
  .pipe(process.stdout)
