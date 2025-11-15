# Animation Testing Guide - GanttCanvasV3 Phase Collapse/Expand

## Quick Test Checklist

### 1. Basic Functionality
- [ ] **Expand Phase**: Click chevron (→) to expand
  - Tasks should fade in smoothly (waterfall effect)
  - Chevron should rotate 90° smoothly
  - No visual jumps or glitches

- [ ] **Collapse Phase**: Click chevron (↓) to collapse
  - Tasks should fade out in reverse order (bottom-up)
  - Chevron should rotate back to →
  - Smooth height collapse

### 2. Performance Testing

#### Frame Rate Check (Chrome DevTools)
1. Open Chrome DevTools (F12)
2. Go to "Performance" tab
3. Click "Record" 🔴
4. Expand/collapse a phase with 10+ tasks
5. Stop recording
6. Check FPS graph (should be solid green at 60fps)

**Expected Result:**
```
FPS: ████████████████████ 60
     (no yellow/red dips)
```

#### GPU Layer Check
1. Open Chrome DevTools (F12)
2. Press `Ctrl+Shift+P` → Type "Show Rendering" → Enable
3. Enable "Layer borders"
4. Expand/collapse phase
5. Look for orange/blue layer borders (indicates GPU acceleration)

**Expected Result:**
- Task rows should show layer borders during animation
- No full-page repaints

### 3. Accessibility Testing

#### Reduced Motion Test
1. **MacOS:**
   - System Preferences → Accessibility → Display
   - Enable "Reduce motion"

2. **Windows:**
   - Settings → Ease of Access → Display
   - Enable "Show animations in Windows"

3. **Browser DevTools (Quick Test):**
   ```javascript
   // In browser console:
   // Temporarily simulate reduced motion
   document.documentElement.style.setProperty('--prefers-reduced-motion', 'reduce');
   ```

4. **Test:**
   - Expand/collapse phase
   - Should be instant (no animation)
   - Functionality should still work

**Expected Result:**
- No animation (instant state change)
- No lag or delay
- Fully functional

### 4. Visual Quality Testing

#### Smoothness Checklist
- [ ] No "popping" or sudden jumps
- [ ] No flickering during animation
- [ ] Tasks appear in order (top to bottom)
- [ ] Tasks disappear in reverse (bottom to top)
- [ ] Chevron rotation is smooth (no steps)
- [ ] Height collapse is smooth (no jitter)

#### Timing Checklist
- [ ] Expand takes ~300ms (feels instant but smooth)
- [ ] Collapse takes ~200ms (feels snappy)
- [ ] Stagger is noticeable but not slow
- [ ] Chevron rotates in sync with expansion

### 5. Edge Cases

#### Single Task Phase
- [ ] Expand: Task should still animate (no instant pop)
- [ ] Collapse: Task should animate out smoothly

#### Many Tasks (20+)
- [ ] Expand: Stagger should feel rhythmic, not endless
- [ ] Collapse: Should reverse smoothly
- [ ] Performance: Should maintain 60fps
- [ ] No memory leaks (test in DevTools Memory tab)

#### Rapid Toggling
- [ ] Click chevron rapidly (5 times in 1 second)
- [ ] Animation should cancel/restart cleanly
- [ ] No animation queue buildup
- [ ] No visual glitches

#### During Scroll
- [ ] Scroll while phase is animating
- [ ] Should continue smoothly (no interruption)
- [ ] No visual artifacts

### 6. Browser Compatibility

Test in each browser:
- [ ] **Chrome/Edge** (Blink engine)
- [ ] **Safari** (WebKit engine)
- [ ] **Firefox** (Gecko engine)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

**Expected Result:**
All browsers should show smooth animations at 60fps.

### 7. Mobile Testing

#### Touch Interaction
- [ ] Tap chevron to expand/collapse
- [ ] No accidental double-taps
- [ ] Smooth animation on 60Hz screens
- [ ] Smooth animation on 120Hz screens (ProMotion devices)

#### Performance
- [ ] No lag on mid-range devices
- [ ] Battery usage is normal (no excessive drain)
- [ ] No thermal throttling during repeated animations

### 8. Keyboard Navigation

#### Keyboard Shortcuts
- [ ] Press `ArrowDown` to navigate tasks
- [ ] Press `ArrowUp` to navigate tasks
- [ ] Press `Enter` to edit selected item
- [ ] Press `Escape` to close modals

**During Animation:**
- [ ] Keyboard nav should work during expand animation
- [ ] No focus loss during collapse animation

### 9. Screen Recording Test

**Purpose:** Catch subtle timing issues invisible to naked eye

1. Use screen recorder (60fps or higher)
2. Record expanding/collapsing a phase
3. Play back at 0.25x speed
4. Look for:
   - [ ] Smooth motion curves (no linear jumps)
   - [ ] Proper stagger timing (50ms intervals visible)
   - [ ] No frame skips

### 10. Animation Quality Comparison

#### Before (Instant)
```
State: Collapsed → Expanded
Time: 0ms
Effect: Instant jump ❌
Feel: Jarring, robotic
```

#### After (Pixar-Quality)
```
State: Collapsed → Expanded
Time: 300ms
Effect: Smooth stagger ✅
Feel: Delightful, professional
```

**Verification:**
- [ ] Expansion feels natural (not instant)
- [ ] Collapse feels responsive (not slow)
- [ ] Overall feel is "polished" and "premium"

## Automated Testing (Future)

### Potential Test Cases
```typescript
describe('Phase Collapse/Expand Animations', () => {
  it('should animate tasks with stagger on expand', () => {
    // Test stagger timing
  });

  it('should respect prefers-reduced-motion', () => {
    // Test accessibility
  });

  it('should maintain 60fps during animation', () => {
    // Performance test
  });

  it('should animate in reverse on collapse', () => {
    // Test reverse stagger
  });
});
```

## Debugging Tips

### Animation Not Working?
1. Check browser console for errors
2. Verify Framer Motion is installed: `npm list framer-motion`
3. Check if `AnimatePresence` is wrapping animated elements
4. Ensure `initial`, `animate`, `exit` props are set

### Animation Too Slow?
1. Check if `prefers-reduced-motion` is accidentally enabled
2. Reduce `STAGGER.normal` value (currently 50ms)
3. Use `SPRING.snappy` instead of `SPRING.gentle`

### Animation Janky?
1. Check for expensive CSS properties (avoid `width`, `height`, `padding`)
2. Use GPU-accelerated properties only (`transform`, `opacity`)
3. Add `overflow: hidden` to parent
4. Check for excessive re-renders in React DevTools

### Performance Issues?
1. Open Chrome DevTools → Performance
2. Look for yellow/red bars (layout/paint)
3. Enable "Paint flashing" to see repaints
4. Reduce number of animated elements

## Success Criteria

### Animation passes if:
✅ Smooth 60fps on desktop
✅ Smooth 60fps on mobile
✅ Respects `prefers-reduced-motion`
✅ No visual glitches
✅ Feels delightful, not distracting
✅ Keyboard navigation works
✅ Works across all browsers
✅ No memory leaks

### Animation fails if:
❌ Dropped frames (< 60fps)
❌ Visual jumps or pops
❌ Doesn't respect accessibility settings
❌ Feels slow or sluggish
❌ Blocks user interaction
❌ Causes layout shift

## Resources

### Chrome DevTools Performance Panel
```
1. Open DevTools (F12)
2. Performance tab
3. Record → Interact → Stop
4. Analyze:
   - FPS (green = good, yellow/red = bad)
   - Main Thread (look for long tasks)
   - GPU (check for compositing)
```

### Safari Web Inspector
```
1. Develop → Show Web Inspector
2. Timelines tab
3. Enable "JavaScript & Events", "Layout & Rendering"
4. Record → Test → Stop
5. Look for smooth frame rate graph
```

### Firefox DevTools
```
1. Open DevTools (F12)
2. Performance tab
3. Record → Test → Stop
4. Check frame rate (should be 60fps)
```

---

**Testing Guide Version:** 1.0.0
**Last Updated:** 2025-11-14
**Target:** GanttCanvasV3 Phase Collapse/Expand Animations
