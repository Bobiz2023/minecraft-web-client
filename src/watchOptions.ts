// not all options are watched here

import { subscribeKey } from 'valtio/utils'
import { WorldRendererThree } from 'prismarine-viewer/viewer/lib/worldrendererThree'
import { isMobile } from 'prismarine-viewer/viewer/lib/simpleUtils'
import { options, watchValue } from './optionsStorage'
import { reloadChunks } from './utils'
import { miscUiState } from './globalState'

subscribeKey(options, 'renderDistance', reloadChunks)
subscribeKey(options, 'multiplayerRenderDistance', reloadChunks)

watchValue(options, o => {
  document.documentElement.style.setProperty('--chatScale', `${o.chatScale / 100}`)
  document.documentElement.style.setProperty('--chatWidth', `${o.chatWidth}px`)
  document.documentElement.style.setProperty('--chatHeight', `${o.chatHeight}px`)
  // gui scale is set in scaleInterface.ts
})

/** happens once */
export const watchOptionsAfterViewerInit = () => {
  const updateTouch = (o) => {
    miscUiState.currentTouch = o.alwaysShowMobileControls || isMobile()
  }

  watchValue(options, updateTouch)
  window.matchMedia('(pointer: coarse)').addEventListener('change', (e) => {
    updateTouch(options)
  })

  watchValue(options, o => {
    if (!viewer) return
    viewer.world.config.showChunkBorders = o.showChunkBorders
    viewer.entities.setDebugMode(o.showChunkBorders ? 'basic' : 'none')
  })

  watchValue(options, o => {
    if (!viewer) return
    // todo ideally there shouldnt be this setting and we don't need to send all same chunks to all workers
    viewer.world.config.numWorkers = o.lowMemoryMode ? 1 : o.numWorkers
  })

  watchValue(options, o => {
    viewer.entities.setRendering(o.renderEntities)
  })

  // viewer.world.mesherConfig.smoothLighting = options.smoothLighting
  viewer.world.mesherConfig.smoothLighting = false // todo not supported for now
  subscribeKey(options, 'smoothLighting', () => {
    viewer.world.mesherConfig.smoothLighting = options.smoothLighting;
    (viewer.world as WorldRendererThree).rerenderAllChunks()
  })
  subscribeKey(options, 'newVersionsLighting', () => {
    viewer.world.mesherConfig.enableLighting = !bot.supportFeature('blockStateId') || options.newVersionsLighting;
    (viewer.world as WorldRendererThree).rerenderAllChunks()
  })
  customEvents.on('gameLoaded', () => {
    viewer.world.mesherConfig.enableLighting = !bot.supportFeature('blockStateId') || options.newVersionsLighting
  })

  watchValue(options, o => {
    if (!(viewer.world instanceof WorldRendererThree)) return
    viewer.world.starField.enabled = o.starfieldRendering
  })
}

let viewWatched = false
export const watchOptionsAfterWorldViewInit = () => {
  worldView!.keepChunksDistance = options.keepChunksDistance
  if (viewWatched) return
  viewWatched = true
  watchValue(options, o => {
    if (!worldView) return
    worldView.keepChunksDistance = o.keepChunksDistance
  })
}
