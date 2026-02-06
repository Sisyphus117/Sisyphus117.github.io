(() => {
  const patchRunMetingOnPjax = () => {
    const globalFn = window.globalFn
    if (!globalFn || !globalFn.pjaxComplete) return

    const pjaxCompleteFns = globalFn.pjaxComplete
    const original = pjaxCompleteFns.runMetingJS
    if (typeof original !== 'function') return

    if (original.__aplayerPjaxContinuityPatched) return

    const wrapped = () => {
      const players = Array.from(document.getElementsByClassName('aplayer'))
      const hasNonFixedPlayer = players.some(el => el?.dataset?.fixed !== 'true')
      if (!hasNonFixedPlayer) return
      original()
    }

    wrapped.__aplayerPjaxContinuityPatched = true
    pjaxCompleteFns.runMetingJS = wrapped
  }

  document.addEventListener('DOMContentLoaded', () => {
    patchRunMetingOnPjax()
    document.addEventListener('pjax:complete', patchRunMetingOnPjax)
  })
})()

