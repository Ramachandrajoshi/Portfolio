// KV-cache capacity calculator — change the inputs and press Run.
// All results are theoretical: real engines add fragmentation, workspace and kernel overheads.

interface Model {
  name: string;
  params: number; // billions
  layers: number;
  kvHeads: number;
  headDim: number;
}

const model: Model = { name: '8B-class (GQA)', params: 8, layers: 32, kvHeads: 8, headDim: 128 };

const gpuMemoryGB = 24;
const runtimeReserveGB = 2.5; // CUDA context, activations, workspace (assumption)
const weightBits = 4.5; // 16 = FP16, 8 = INT8, ~4.5 = 4-bit + scales
const kvBytesPerElement = 2; // 2 = FP16 KV cache, 1 = FP8 KV cache
const averageContextTokens = 3000;

const kvBytesPerToken = 2 * model.layers * model.kvHeads * model.headDim * kvBytesPerElement;
const weightsGB = (model.params * 1e9 * weightBits) / 8 / 1e9;
const kvBudgetGB = gpuMemoryGB - weightsGB - runtimeReserveGB;
const kvTokens = Math.floor((kvBudgetGB * 1e9) / kvBytesPerToken);

const report = [
  `Model: ${model.name}`,
  `KV cache per token: ${(kvBytesPerToken / 1024).toFixed(0)} KiB`,
  `Weights: ${weightsGB.toFixed(1)} GB at ${weightBits} bits`,
  `KV budget: ${kvBudgetGB.toFixed(1)} GB → ${kvTokens.toLocaleString()} tokens`,
  `Concurrent sequences at ${averageContextTokens.toLocaleString()} tokens: ${Math.floor(kvTokens / averageContextTokens)}`,
  `Concurrent sequences at 8,192 tokens: ${Math.floor(kvTokens / 8192)}`,
  kvBudgetGB <= 0 ? '⚠ The weights alone do not fit — quantise further or use more GPUs.' : '',
].filter(Boolean);

console.log(report.join('\n'));
document.body.innerHTML = `<pre style="font: 14px/1.7 ui-monospace, monospace; padding: 1rem">${report.join('\n')}</pre>`;
