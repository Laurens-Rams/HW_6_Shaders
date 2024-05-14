#include './noise.glsl'

uniform float u_time;
uniform vec3 u_sphereCenter;
uniform float uHoldingSpeed;
uniform float uMainDisplacement;
uniform float uNoiseDisplacement;
uniform sampler2D uMap;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  vUv = uv;
  vNormal = normal;
  vec3 newPosition = position;

  float d = distance(uv, vec2(0.5));
  d = 1.0 - smoothstep(0.0, 1.0, d);

  newPosition.z -= d * uHoldingSpeed * 20000.0;

  vec4 textureColor = texture2D(uMap, vUv);
  
  float brightness = dot(textureColor.rgb, vec3(0.299, 0.587, 0.114));
  float mainDisplacement = brightness * uMainDisplacement;
  newPosition += normal * mainDisplacement;

  float noise = snoise(vec3(
      0.07 * newPosition.x + u_time, 
      0.09 * newPosition.y, 
      0.02 * newPosition.z
  ));
  
  float noiseDisplacement = smoothstep(-1.0, 1.0, noise);
  newPosition += normal * noiseDisplacement * uNoiseDisplacement;

  float dampeningFactor = 1.2;
  newPosition = mix(position, newPosition, dampeningFactor);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  vUv = uv;
}
