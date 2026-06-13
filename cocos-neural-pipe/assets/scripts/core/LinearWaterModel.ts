import type { LevelConfig, LevelResult, PipeConfig, SampleResult, WaterSample } from "../data/LevelTypes";

export function cloneLevel(level: LevelConfig): LevelConfig {
  return JSON.parse(JSON.stringify(level));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function signedStrength(pipe: PipeConfig): number {
  return pipe.type === "pump" ? -pipe.strength : pipe.strength;
}

export function evaluateSample(level: LevelConfig, sample: WaterSample): SampleResult {
  let z = level.bias ? level.bias.value : 0;
  const terms: SampleResult["terms"] = [];

  for (const pipe of level.pipes) {
    if (!pipe.installed) continue;
    const inputValue = sample.inputs[pipe.input] ?? 0;
    const contribution = signedStrength(pipe) * inputValue;
    z += contribution;
    terms.push({
      pipeId: pipe.id,
      inputName: level.inputNames[pipe.input] ?? `水源${pipe.input + 1}`,
      inputValue,
      signedStrength: signedStrength(pipe),
      contribution
    });
  }

  return {
    z,
    y: z,
    loss: Math.abs(z - sample.target),
    terms
  };
}

export function evaluateLevel(level: LevelConfig): LevelResult {
  const rows = level.samples.map((sample) => evaluateSample(level, sample));
  const meanLoss = rows.reduce((sum, row) => sum + row.loss, 0) / rows.length;
  return { rows, meanLoss };
}
