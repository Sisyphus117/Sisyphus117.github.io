(() => {
  window.__aplayerPjaxContinuity = true

  const ensureFixedPlayerDetached = () => {
    const current = document.getElementById('aplayer-fixed')
    const saved = window.__aplayerFixedEl

    if (saved && current && saved !== current) {
      current.remove()
    }

    const fixedEl = saved || current
    if (!fixedEl) return

    window.__aplayerFixedEl = fixedEl

    if (fixedEl.parentNode !== document.body) {
      document.body.appendChild(fixedEl)
    }
  }

  const patchRunMetingOnPjax = () => {
    const globalFn = window.globalFn
    if (!globalFn || !globalFn.pjaxComplete) return

    const pjaxCompleteFns = globalFn.pjaxComplete
    const original = pjaxCompleteFns.runMetingJS
    if (typeof original !== 'function') return

    if (pjaxCompleteFns.runMetingJS.__aplayerPjaxContinuityPatched) return

    const wrapped = () => {
      const hasOtherPlayer = !!document.querySelector('.aplayer:not(#aplayer-fixed)')
      if (!hasOtherPlayer) return

      const fixedEl = window.__aplayerFixedEl || document.getElementById('aplayer-fixed')
      let placeholder = null
      if (fixedEl && fixedEl.parentNode) {
        placeholder = document.createComment('aplayer-fixed-placeholder')
        fixedEl.parentNode.insertBefore(placeholder, fixedEl)
        fixedEl.remove()
      }

      const oldAplayers = Array.isArray(window.aplayers) ? window.aplayers : null
      if (oldAplayers) {
        window.aplayers = oldAplayers.filter(ap => !(ap?.options?.fixed || ap?.container?.id === 'aplayer-fixed'))
      }

      try {
        original()
      } finally {
        if (fixedEl) {
          if (placeholder && placeholder.parentNode) {
            placeholder.parentNode.insertBefore(fixedEl, placeholder)
            placeholder.remove()
          }
          window.__aplayerFixedEl = fixedEl
          if (fixedEl.parentNode !== document.body) {
            document.body.appendChild(fixedEl)
          }
        }

        if (oldAplayers) {
          const fixedInstances = oldAplayers.filter(ap => ap?.options?.fixed || ap?.container?.id === 'aplayer-fixed')
          if (fixedInstances.length) {
            const now = Array.isArray(window.aplayers) ? window.aplayers : []
            window.aplayers = fixedInstances.concat(now)
          }
        }
      }
    }

    wrapped.__aplayerPjaxContinuityPatched = true
    pjaxCompleteFns.runMetingJS = wrapped
  }

  const schedulePatch = () => {
    patchRunMetingOnPjax()
    let tries = 0
    const timer = setInterval(() => {
      tries += 1
      patchRunMetingOnPjax()
      if (window.globalFn?.pjaxComplete?.runMetingJS?.__aplayerPjaxContinuityPatched || tries >= 50) {
        clearInterval(timer)
      }
    }, 200)
  }

  document.addEventListener('DOMContentLoaded', () => {
    ensureFixedPlayerDetached()
    schedulePatch()
    document.addEventListener('pjax:send', ensureFixedPlayerDetached)
    document.addEventListener('pjax:complete', schedulePatch)
    document.addEventListener('pjax:complete', ensureFixedPlayerDetached)
  })
})()
