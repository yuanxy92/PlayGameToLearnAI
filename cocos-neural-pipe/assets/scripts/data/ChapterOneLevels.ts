import type { LevelConfig } from "./LevelTypes";

export const chapterOneLevels: LevelConfig[] = [
  {
    id: "c1-1",
    chapter: 1,
    index: 1,
    title: "接通山泉",
    concept: "水流会沿管道送到供水池。",
    lesson: "输水管会把上游水源送到下游。第一关里，山泉流量会原样送进供水池。",
    objective: "接上第一根输水管，让供水池贴近黄线。",
    tolerance: 0.04,
    samples: [{ inputs: [0.72], target: 0.72, label: "当前水情" }],
    inputNames: ["山泉"],
    pipes: [{ id: "w1", label: "山泉输水管", input: 0, type: "supply", strength: 1, installed: false, lockType: true, lockStrength: true }],
    bias: null
  },
  {
    id: "c1-2",
    chapter: 1,
    index: 2,
    title: "调管道粗细",
    concept: "管道越粗，送来的水越多。",
    lesson: "管道粗细决定这股水的影响。管越粗，送到供水池的流量越大。",
    objective: "山泉水很足，小镇只需要适量供水。调细管道，别让供水池溢出。",
    tolerance: 0.035,
    samples: [{ inputs: [1.0], target: 0.6, label: "当前水情" }],
    inputNames: ["山泉"],
    pipes: [{ id: "w1", label: "山泉输水管", input: 0, type: "supply", strength: 0.35, installed: true, lockType: true }],
    bias: null
  },
  {
    id: "c1-3",
    chapter: 1,
    index: 3,
    title: "两个水源合流",
    concept: "多处水源会在合流池汇合。",
    lesson: "合流池会把多处水源加在一起。每根管道都给最终水位贡献一部分。",
    objective: "把山泉和井水都接入合流池，让供水池贴近黄线。",
    tolerance: 0.04,
    samples: [{ inputs: [0.35, 0.45], target: 0.8, label: "当前水情" }],
    inputNames: ["山泉", "井水"],
    pipes: [
      { id: "w1", label: "山泉输水管", input: 0, type: "supply", strength: 1, installed: true, lockType: true },
      { id: "w2", label: "井水输水管", input: 1, type: "supply", strength: 0, installed: false, lockType: true }
    ],
    bias: null
  },
  {
    id: "c1-4",
    chapter: 1,
    index: 4,
    title: "抽水管的抑制",
    concept: "抽水管会压低总水位。",
    lesson: "抽水管不是让水倒流，而是在合流池里抵消一部分水位，用来压住过高的输出。",
    objective: "雨水槽来水会让水位过高。改用抽水管，把供水池压回黄线。",
    tolerance: 0.045,
    samples: [{ inputs: [0.9, 0.5], target: 0.42, label: "当前水情" }],
    inputNames: ["山泉", "雨水槽"],
    pipes: [
      { id: "w1", label: "山泉管道", input: 0, type: "supply", strength: 0.55, installed: true },
      { id: "w2", label: "雨水槽管道", input: 1, type: "supply", strength: 0.15, installed: true }
    ],
    bias: null
  },
  {
    id: "c1-5",
    chapter: 1,
    index: 5,
    title: "加一座泵站",
    concept: "泵站能整体抬高或降低水位。",
    lesson: "泵站会给整段水路加一点基础水压。它不依赖某一处水源，而是整体抬高或降低供水。",
    objective: "基础水压偏低。启动泵站，把整段水路托到黄线附近。",
    tolerance: 0.035,
    samples: [{ inputs: [0.5], target: 0.8, label: "当前水情" }],
    inputNames: ["山泉"],
    pipes: [{ id: "w1", label: "山泉输水管", input: 0, type: "supply", strength: 0.72, installed: true, lockType: true }],
    bias: { value: 0, min: -0.5, max: 0.7 }
  },
  {
    id: "c1-6",
    chapter: 1,
    index: 6,
    title: "一天里的几种水情",
    concept: "同一套水路要照顾多种水情。",
    lesson: "同一套管道不能只适合一种水情。它要在不同来水情况下都尽量稳定。",
    objective: "早、中、晚来水不同。调同一套管道和泵站，让三次水情都尽量稳定。",
    tolerance: 0.06,
    samples: [
      { inputs: [0], target: 0.2, label: "早晨" },
      { inputs: [0.5], target: 0.6, label: "午后" },
      { inputs: [1], target: 1.0, label: "傍晚" }
    ],
    inputNames: ["山泉"],
    pipes: [{ id: "w1", label: "山泉输水管", input: 0, type: "supply", strength: 0.45, installed: true, lockType: true }],
    bias: { value: 0.05, min: -0.3, max: 0.6 }
  },
  {
    id: "c1-7",
    chapter: 1,
    index: 7,
    title: "全天水路日志",
    concept: "多种水情下都稳定才算过关。",
    lesson: "全天通水看的是多种水情下的整体表现。单次刚好还不够，全天稳定才算好。",
    objective: "调两根管道和泵站，让小镇全天都稳定。",
    tolerance: 0.055,
    samples: [
      { inputs: [0.2, 0.8], target: 0.1, label: "早晨" },
      { inputs: [0.8, 0.2], target: 0.55, label: "午后" },
      { inputs: [0.7, 0.7], target: 0.38, label: "傍晚" }
    ],
    inputNames: ["山泉", "雨水槽"],
    pipes: [
      { id: "w1", label: "山泉管道", input: 0, type: "supply", strength: 0.35, installed: true },
      { id: "w2", label: "雨水槽管道", input: 1, type: "pump", strength: 0.2, installed: true }
    ],
    bias: { value: 0.15, min: -0.4, max: 0.7 }
  }
];
