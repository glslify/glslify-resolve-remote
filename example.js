var deps    = require('glslify-deps')
var bundle  = require('glslify-bundle')
var resolve = require('./')

var shader  = [
  '#pragma glslify: ease = require(glsl-easings/bounce-in-out)'
, 'void main() {'
, '  gl_FragColor = vec4(vec3(ease(0.5)), 1.0);'
, '}'
].join('\n')

deps({
  resolve: resolve()
}).inline(shader, '/', function(err, tree) {
  if (err) throw err
  console.log(bundle(tree))
})
