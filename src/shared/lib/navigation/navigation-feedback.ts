'use client'

type NavigationFeedbackSnapshot = {
  active: boolean
  visible: boolean
  progress: number
  completing: boolean
}

type NavigationFeedbackListener = () => void

const SHOW_DELAY_MS = 100
const COMPLETE_HIDE_DELAY_MS = 180
const TRICKLE_INTERVAL_MS = 160
const INITIAL_PROGRESS = 0.08
const MAX_PROGRESS = 0.9

const listeners = new Set<NavigationFeedbackListener>()

let snapshot: NavigationFeedbackSnapshot = {
  active: false,
  visible: false,
  progress: 0,
  completing: false,
}

let showTimer: ReturnType<typeof setTimeout> | null = null
let hideTimer: ReturnType<typeof setTimeout> | null = null
let trickleTimer: ReturnType<typeof setInterval> | null = null

function emit() {
  listeners.forEach(listener => listener())
}

function setSnapshot(nextSnapshot: NavigationFeedbackSnapshot) {
  snapshot = nextSnapshot
  emit()
}

function clearShowTimer() {
  if (showTimer) {
    clearTimeout(showTimer)
    showTimer = null
  }
}

function clearHideTimer() {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
}

function clearTrickleTimer() {
  if (trickleTimer) {
    clearInterval(trickleTimer)
    trickleTimer = null
  }
}

function resetSnapshot() {
  setSnapshot({
    active: false,
    visible: false,
    progress: 0,
    completing: false,
  })
}

function startTrickling() {
  clearTrickleTimer()

  trickleTimer = setInterval(() => {
    if (!snapshot.active || !snapshot.visible) {
      clearTrickleTimer()
      return
    }

    const remainingProgress = MAX_PROGRESS - snapshot.progress
    if (remainingProgress <= 0) {
      return
    }

    const nextProgress = Math.min(
      MAX_PROGRESS,
      snapshot.progress + Math.max(remainingProgress * 0.15, 0.02)
    )

    setSnapshot({
      ...snapshot,
      progress: nextProgress,
    })
  }, TRICKLE_INTERVAL_MS)
}

export function startNavigationFeedback() {
  if (snapshot.active) {
    return
  }

  clearHideTimer()
  clearShowTimer()

  setSnapshot({
    active: true,
    visible: false,
    progress: 0,
    completing: false,
  })

  showTimer = setTimeout(() => {
    showTimer = null

    if (!snapshot.active) {
      return
    }

    setSnapshot({
      active: true,
      visible: true,
      progress: INITIAL_PROGRESS,
      completing: false,
    })

    startTrickling()
  }, SHOW_DELAY_MS)
}

export function doneNavigationFeedback() {
  if (!snapshot.active) {
    return
  }

  clearShowTimer()
  clearTrickleTimer()

  if (snapshot.visible) {
    setSnapshot({
      active: false,
      visible: true,
      progress: 1,
      completing: true,
    })

    clearHideTimer()
    hideTimer = setTimeout(() => {
      hideTimer = null
      resetSnapshot()
    }, COMPLETE_HIDE_DELAY_MS)

    return
  }

  resetSnapshot()
}

export function subscribeNavigationFeedback(
  listener: NavigationFeedbackListener
) {
  listeners.add(listener)

  return () => {
    listeners.delete(listener)
  }
}

export function getNavigationFeedbackSnapshot() {
  return snapshot
}
