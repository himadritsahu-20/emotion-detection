const rows = [
 {
  "id": "ensemble",
  "name": "CNN Ensemble (×8)",
  "family": "Ensemble",
  "params": "≈ 92M",
  "top1": 75.2,
  "latencyMs": 212,
  "sizeMb": 351,
  "input": "48×48",
  "mobile": "limited",
  "note": "Upper bound reference; impractical on-device."
 },
 {
  "id": "vgg-ft",
  "name": "VGG-style (tuned)",
  "family": "VGG",
  "params": "≈ 14M",
  "top1": 73.1,
  "latencyMs": 41.5,
  "sizeMb": 54.2,
  "input": "48×48",
  "mobile": "limited",
  "note": "Strong accuracy, heavy weights."
 },
 {
  "id": "resnet18",
  "name": "ResNet-18 (transfer)",
  "family": "ResNet",
  "params": "11.2M",
  "top1": 71.4,
  "latencyMs": 27.8,
  "sizeMb": 42.7,
  "input": "96×96",
  "mobile": "good",
  "note": "ImageNet init, fine-tuned end-to-end."
 },
 {
  "id": "effb0",
  "name": "EfficientNet-B0",
  "family": "EfficientNet",
  "params": "4.0M",
  "top1": 70.2,
  "latencyMs": 19.6,
  "sizeMb": 15.6,
  "input": "96×96",
  "mobile": "good",
  "note": "Compound scaled; SiLU-heavy on WebGL."
 },
 {
  "id": "cnn4",
  "name": "4-Block Deep CNN",
  "family": "Custom CNN",
  "params": "2.4M",
  "top1": 68.9,
  "latencyMs": 6.1,
  "sizeMb": 9.3,
  "input": "48×48",
  "mobile": "native",
  "note": "Conv-BN-ReLU ×2 per block, GAP head."
 },
 {
  "id": "mnv2",
  "name": "MobileNetV2 (α=1.0)",
  "family": "MobileNet",
  "params": "2.3M",
  "top1": 67.6,
  "latencyMs": 8.4,
  "sizeMb": 8.9,
  "input": "96×96",
  "mobile": "native",
  "note": "Inverted residuals, depthwise separable."
 },
 {
  "id": "minixception",
  "name": "mini-Xception",
  "family": "Xception",
  "params": "0.06M",
  "top1": 66,
  "latencyMs": 1.9,
  "sizeMb": 0.8,
  "input": "64×64 gray",
  "mobile": "native",
  "deployed": true,
  "note": "Shipped in this demo — runs live in /inference."
 },
 {
  "id": "human",
  "name": "Human annotators",
  "family": "Baseline",
  "params": "—",
  "top1": 65.5,
  "latencyMs": 0,
  "sizeMb": 0,
  "input": "—",
  "mobile": "native",
  "note": "Reported human-level agreement on FER-2013."
 }
];

export default function handler(req, res) {
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(JSON.stringify({ dataset: 'FER-2013 PrivateTest', n: 3589, rows }));
}
