uniform sampler2D uMap;
uniform float uHoldingSpeed;

varying vec2 vUv;

void main() {
    vec4 videoColor = texture2D(uMap, vUv);
    float brightnessAdjustment = 1.0 + uHoldingSpeed * 30.0; 
    vec4 adjustedColor = vec4(videoColor.rgb * brightnessAdjustment, videoColor.a);
    gl_FragColor = adjustedColor;
}
