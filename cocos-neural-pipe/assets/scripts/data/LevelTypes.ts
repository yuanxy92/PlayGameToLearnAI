export type PipeType = "supply" | "pump";

export interface WaterSample {
  inputs: number[];
  target: number;
  label?: string;
}

export interface PipeConfig {
  id: string;
  label: string;
  input: number;
  type: PipeType;
  strength: number;
  installed: boolean;
  lockType?: boolean;
  lockStrength?: boolean;
}

export interface BiasConfig {
  value: number;
  min: number;
  max: number;
}

export interface LevelConfig {
  id: string;
  chapter: 1;
  index: number;
  title: string;
  concept: string;
  lesson: string;
  objective: string;
  tolerance: number;
  inputNames: string[];
  samples: WaterSample[];
  pipes: PipeConfig[];
  bias: BiasConfig | null;
}

export interface PipeTerm {
  pipeId: string;
  inputName: string;
  inputValue: number;
  signedStrength: number;
  contribution: number;
}

export interface SampleResult {
  z: number;
  y: number;
  loss: number;
  terms: PipeTerm[];
}

export interface LevelResult {
  rows: SampleResult[];
  meanLoss: number;
}
