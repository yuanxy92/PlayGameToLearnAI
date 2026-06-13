# Scripts Layering

This Cocos project keeps gameplay rules separate from rendering.

## data

Level data, story text, targets, pipe defaults, and sample inputs.

Files in this folder should not import from `cc`.

## core

Pure gameplay rules:

- linear water model
- level evaluation
- stars / pass checks
- status labels

Files in this folder should not import from `cc`.

## app

Global app state, persistence, and scene navigation.

This layer may import from `cc` only when it deals with Cocos runtime APIs.

## scenes

Scene controllers for Boot, Home, Map, Level, and ChapterSummary.

Attach controllers in Cocos Creator:

- `BootController` on the root node of `Boot.scene`
- `HomeController` on the root node of `Home.scene`
- `MapController` on the root node of `Map.scene`
- `LevelController` on the root node of `Level.scene`
- `ChapterSummaryController` on the root node of `ChapterSummary.scene`

## components

Cocos node components for visual objects such as water sources, pipes, tanks, buttons, and map nodes.

Components can import from `cc`, but they should not hard-code level data.
