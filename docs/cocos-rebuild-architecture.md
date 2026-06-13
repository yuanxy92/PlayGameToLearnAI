# Cocos Creator 重建架构

## 当前技术选择

项目从零重建，使用：

```text
引擎：Cocos Creator 3.8.8
语言：TypeScript
项目类型：2D
目标形态：手机 Web App，后续可导出微信小游戏
方向：竖屏
设计分辨率：1080 × 1920
```

这里的 `1080 × 1920` 是游戏逻辑设计分辨率，不是要求手机真实屏幕必须是这个尺寸。不同手机只做整体缩放和安全区处理，不按设备重排。

## 仓库结构

建议结构：

```text
Game-NeuralNetworkPipe/
  README.md
  docs/
    design-overview.md
    chapter-1-linear-pipes.md
    rebuild-principles.md
    cocos-rebuild-architecture.md
  cocos-neural-pipe/
    assets/
    settings/
    package.json
    tsconfig.json
```

`docs/` 是设计文档。
`cocos-neural-pipe/` 是 Cocos Creator 创建出来的工程。
不要把 Cocos 工程文件散落在仓库根目录。

注意：Cocos Creator 创建项目时可能会在 `cocos-neural-pipe/` 内生成独立 `.git/`。本仓库建议只保留外层 Git，避免把 Cocos 工程当成 submodule。

## Cocos 工程创建方式

在 Cocos Creator 里创建新项目：

```text
Template：Empty 2D
Project Name：cocos-neural-pipe
Location：Game-NeuralNetworkPipe/
Language：TypeScript
```

创建完成后，工程路径应是：

```text
Game-NeuralNetworkPipe/cocos-neural-pipe
```

## Canvas 与适配策略

主 Canvas：

```text
Design Resolution：1080 × 1920
Fit Width：true
Fit Height：false
```

原因：

- 我们做竖屏手机游戏，宽度稳定更重要。
- 高度多出来或少一点时，用上下安全区吸收。
- 主要交互不要贴近顶部刘海区和底部 Home Indicator。

安全区建议：

```text
顶部安全区：120 px
底部安全区：140 px
左右安全区：48 px
```

关键按钮、关卡节点、文字说明必须落在安全区内。

## 场景划分

第一阶段只建这些 Scene：

```text
Boot.scene
Home.scene
Map.scene
Level.scene
ChapterSummary.scene
```

职责：

| Scene | 职责 |
| --- | --- |
| Boot | 加载配置、初始化进度、进入首页 |
| Home | 游戏标题、故事开场、开始按钮 |
| Map | 章节地图、关卡节点、解锁状态 |
| Level | 单关玩法、管道调节、通关检测 |
| ChapterSummary | 第一章公式总结 |

第一阶段不要做账号、后端、排行榜、复杂设置页。

## Prefab 划分

第一阶段建议 Prefab：

```text
prefabs/
  ui/
    GameButton.prefab
    Dialog.prefab
    ProgressBar.prefab
  map/
    LevelNode.prefab
  level/
    WaterSource.prefab
    Pipe.prefab
    MergePool.prefab
    OutputTank.prefab
    PumpStation.prefab
```

规则：

- Prefab 只负责表现和交互入口。
- 不把关卡公式写进 Prefab。
- 不在 Prefab 里硬编码某一关的数据。

## 代码分层

建议 TypeScript 目录：

```text
assets/scripts/
  app/
    GameApp.ts
    GameState.ts
    SceneRouter.ts
  data/
    ChapterOneLevels.ts
    LevelTypes.ts
  core/
    LinearWaterModel.ts
    LevelEvaluator.ts
  scenes/
    BootController.ts
    HomeController.ts
    MapController.ts
    LevelController.ts
    ChapterSummaryController.ts
  components/
    WaterSourceView.ts
    PipeView.ts
    MergePoolView.ts
    OutputTankView.ts
    PumpStationView.ts
    LevelNodeView.ts
```

分层原则：

| 层 | 内容 |
| --- | --- |
| data | 关卡、剧情、目标、管道初始值 |
| core | 纯计算，不依赖 Cocos 节点 |
| scenes | 页面控制、状态切换 |
| components | Cocos 节点表现、点击、动画 |
| app | 全局状态、路由、存档 |

最重要原则：`core/` 不能 import `cc`。
这样水路计算可以独立测试，不被渲染层绑死。

## 第一阶段垂直切片

只做第 1 关：

```text
首页 -> 地图 -> 第 1 关 -> 安装管道 -> 供水池到黄线 -> 通关弹窗 -> 公式总结入口
```

验收标准：

- 在 Cocos 预览中可完整走通。
- Web Mobile 构建后浏览器可打开。
- 手机竖屏尺寸下不出现 UI 重叠。
- 点击区域与视觉区域一致。
- 第 1 关的计算来自 `LinearWaterModel`，不是写死动画。

## 多设备验收尺寸

每次调整布局后，至少检查：

```text
360 × 800
390 × 844
393 × 852
430 × 932
```

不要为每个尺寸单独写布局逻辑。
如果某个尺寸出问题，优先调整安全区、锚点和整体结构。

## 近期不要做的事

- 不做完整 7 关。
- 不做第二章。
- 不做登录注册。
- 不做后端。
- 不做复杂美术。
- 不做多套响应式布局。
- 不把 UI 放回 HTML/CSS。

先让一个最小游戏切片稳定，再扩展内容。
