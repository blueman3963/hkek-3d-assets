"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.softShadows = void 0;
var THREE = require("three");
var pcss = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.frustum, frustum = _c === void 0 ? 3.75 : _c, _d = _b.size, size = _d === void 0 ? 0.005 : _d, _e = _b.near, near = _e === void 0 ? 9.5 : _e, _f = _b.samples, samples = _f === void 0 ? 17 : _f, _g = _b.rings, rings = _g === void 0 ? 11 : _g;
    return "#define LIGHT_WORLD_SIZE ".concat(size, "\n#define LIGHT_FRUSTUM_WIDTH ").concat(frustum, "\n#define LIGHT_SIZE_UV (LIGHT_WORLD_SIZE / LIGHT_FRUSTUM_WIDTH)\n#define NEAR_PLANE ").concat(near, "\n#define NUM_SAMPLES ").concat(samples, "\n#define NUM_RINGS ").concat(rings, "\n#define BLOCKER_SEARCH_NUM_SAMPLES NUM_SAMPLES\n#define PCF_NUM_SAMPLES NUM_SAMPLES\nvec2 poissonDisk[NUM_SAMPLES];\nvoid initPoissonSamples(const in vec2 randomSeed) {\n  float ANGLE_STEP = PI2 * float(NUM_RINGS) / float(NUM_SAMPLES);\n  float INV_NUM_SAMPLES = 1.0 / float(NUM_SAMPLES);\n  float angle = rand(randomSeed) * PI2;\n  float radius = INV_NUM_SAMPLES;\n  float radiusStep = radius;\n  for (int i = 0; i < NUM_SAMPLES; i++) {\n    poissonDisk[i] = vec2(cos(angle), sin(angle)) * pow(radius, 0.75);\n    radius += radiusStep;\n    angle += ANGLE_STEP;\n  }\n}\nfloat penumbraSize(const in float zReceiver, const in float zBlocker) { // Parallel plane estimation\n  return (zReceiver - zBlocker) / zBlocker;\n}\nfloat findBlocker(sampler2D shadowMap, const in vec2 uv, const in float zReceiver) {\n  float searchRadius = LIGHT_SIZE_UV * (zReceiver - NEAR_PLANE) / zReceiver;\n  float blockerDepthSum = 0.0;\n  int numBlockers = 0;\n  for (int i = 0; i < BLOCKER_SEARCH_NUM_SAMPLES; i++) {\n    float shadowMapDepth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[i] * searchRadius));\n    if (shadowMapDepth < zReceiver) {\n      blockerDepthSum += shadowMapDepth;\n      numBlockers++;\n    }\n  }\n  if (numBlockers == 0) return -1.0;\n  return blockerDepthSum / float(numBlockers);\n}\nfloat PCF_Filter(sampler2D shadowMap, vec2 uv, float zReceiver, float filterRadius) {\n  float sum = 0.0;\n  for (int i = 0; i < PCF_NUM_SAMPLES; i++) {\n    float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + poissonDisk[ i ] * filterRadius));\n    if (zReceiver <= depth) sum += 1.0;\n  }\n  for (int i = 0; i < PCF_NUM_SAMPLES; i++) {\n    float depth = unpackRGBAToDepth(texture2D(shadowMap, uv + -poissonDisk[ i ].yx * filterRadius));\n    if (zReceiver <= depth) sum += 1.0;\n  }\n  return sum / (2.0 * float(PCF_NUM_SAMPLES));\n}\nfloat PCSS(sampler2D shadowMap, vec4 coords) {\n  vec2 uv = coords.xy;\n  float zReceiver = coords.z; // Assumed to be eye-space z in this code\n  initPoissonSamples(uv);\n  float avgBlockerDepth = findBlocker(shadowMap, uv, zReceiver);\n  if (avgBlockerDepth == -1.0) return 1.0;\n  float penumbraRatio = penumbraSize(zReceiver, avgBlockerDepth);\n  float filterRadius = penumbraRatio * LIGHT_SIZE_UV * NEAR_PLANE / zReceiver;\n  return PCF_Filter(shadowMap, uv, zReceiver, filterRadius);\n}");
};
var deployed = false;
var softShadows = function (props) {
    // Avoid adding the effect twice, which may happen in HMR scenarios
    if (!deployed) {
        deployed = true;
        var shader = THREE.ShaderChunk.shadowmap_pars_fragment;
        shader = shader.replace('#ifdef USE_SHADOWMAP', '#ifdef USE_SHADOWMAP\n' + pcss(__assign({}, props)));
        shader = shader.replace('#if defined( SHADOWMAP_TYPE_PCF )', '\nreturn PCSS(shadowMap, shadowCoord);\n#if defined( SHADOWMAP_TYPE_PCF )');
        THREE.ShaderChunk.shadowmap_pars_fragment = shader;
    }
};
exports.softShadows = softShadows;
