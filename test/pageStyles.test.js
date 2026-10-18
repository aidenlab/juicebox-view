import { describe, it, expect } from 'vitest'
import { compile } from 'sass'
import { resolve } from 'node:path'

const { css } = compile(resolve('src/styles/page.scss'))
const sheet = new CSSStyleSheet()
sheet.replaceSync(css)
const rules = [...sheet.cssRules]

/**
 * The animation a rule list gives the pulsing Room indicator, or undefined.
 *
 * @param {CSSRuleList} ruleList
 */
function pulseAnimation(ruleList) {
  const rule = [...ruleList].find((r) => r.selectorText === '.room-indicator--pulsing')
  return rule && (rule.style.animationName || rule.style.animation.split(' ')[0])
}

/**
 * The text of the @keyframes rule with the given name.
 *
 * @param {string} name
 */
function keyframes(name) {
  return rules.find((r) => r instanceof CSSKeyframesRule && r.name === name)?.cssText
}

describe('Page styles: the Room indicator\'s pulse', () => {
  it('moves the dot', () => {
    expect(keyframes(pulseAnimation(rules))).toMatch(/transform/)
  })

  it('with prefers-reduced-motion: reduce, changes the dot without moving it', () => {
    const reduced = rules.find((r) => r instanceof CSSMediaRule && /prefers-reduced-motion:\s*reduce/.test(r.conditionText))
    expect(reduced).toBeDefined()

    const frames = keyframes(pulseAnimation(reduced.cssRules))
    expect(frames).toBeDefined()
    expect(frames).not.toMatch(/transform|translate|scale|rotate|width|height|margin/)
  })
})
