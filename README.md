# Play Game To Learn AI

这是一个从零重建前保留的**游戏设计仓库**。

当前不保留任何前端代码、运行时代码、美术实现或旧 UI 布局。仓库只保留《神经水厂》的课程目标、剧情设定、关卡机制和第一章关卡设计，方便后续重新选择技术架构后再实现。

## 设计文档

- [项目设计总览](docs/design-overview.md)
- [第 1 章：线性水路关卡设计](docs/chapter-1-linear-pipes.md)
- [重建原则](docs/rebuild-principles.md)
- [Cocos Creator 重建架构](docs/cocos-rebuild-architecture.md)

## 当前决定

- 旧 HTML / Phaser / RexUI / 素材布局全部归零。
- 不沿用此前任何 UI layout、视觉素材和实现代码。
- 只保留教育游戏的核心设计：学生通过水路 puzzle 理解神经网络基础概念。
- 第一章目标：让高中生和本科低年级学生用游戏直觉理解 `y = wx + b`。

下一步应先做架构和视觉方案，而不是继续修补旧实现。
