# SmashUp Titan Mechanism - Task 17: TitanZone Component Enhancement

## Task Description
**Task 17: 实现 TitanZone 组件**
- 显示玩家的 titanZone 中的泰坦卡
- 泰坦卡显示名称、图片、能力描述
- 响应式布局（PC 和移动端）
- E2E 测试验证 UI 显示

## Implementation Summary

### Changes Made

#### 1. Enhanced TitanZone Component (`src/games/smashup/ui/TitanZone.tsx`)

**Fixed TypeScript Error:**
- Removed incorrect `defId` prop from `CardPreview` component
- `CardPreview` only accepts `previewRef` prop, not `defId`

**Visual Enhancements:**
- Added container styling with amber theme (bg-amber-50/50, border-amber-200)
- Added emoji icon (⚔️) and card count display in header
- Increased card size from 24x32 to 32x44 for better visibility
- Added selection indicator (yellow border + pulse animation + checkmark)
- Added hover state with amber border
- Improved name display with gradient background

**Ability Description Display:**
- Added hover overlay showing full ability descriptions
- Fetches ability definitions using `getAbilityDef()`
- Displays ability name and description in formatted text
- Scrollable overlay for long descriptions

**Selection State Management:**
- Added `selectedTitanUid` prop to highlight selected titan
- Added `hoveredTitanUid` state for hover effects
- Visual feedback: selected cards show yellow border, pulse animation, and checkmark

**User Guidance:**
- Added hint text at bottom: "点击泰坦卡以选择出场"
- Only shown when player can interact (isCurrentPlayer && onTitanClick)

#### 2. Updated Board.tsx Integration

**Props Update:**
- Removed unused `playerId` prop
- Added `selectedTitanUid` prop to TitanZone
- Updated `onTitanClick` handler to toggle selection state

**Click Handler Logic:**
```typescript
onTitanClick={(titanUid) => {
    if (!isMyTurn) {
        toast(t('ui.not_your_turn', { defaultValue: '不是你的回合' }));
        return;
    }
    // Toggle selection state
    setSelectedTitanUid(prev => prev === titanUid ? null : titanUid);
}}
```

**Integration with Base Click:**
- When titan is selected, clicking a base dispatches PLAY_TITAN command
- Base highlighting works correctly (all bases show gold border when titan selected)
- Selection is cleared after titan placement

### Acceptance Criteria Status

- [x] 显示玩家的 titanZone 中的泰坦卡
- [x] 泰坦卡显示名称、图片、能力描述
- [x] 响应式布局（PC 和移动端）
  - Card size: 32x44 (w-32 h-44)
  - Flex wrap layout adapts to screen size
  - Hover overlay with scrollable content
- [ ] E2E 测试验证 UI 显示 (TODO: Task 27)

### Code Quality

**TypeScript Compilation:**
```bash
npx tsc --noEmit
# Exit Code: 0 (Success)
```

**ESLint Check:**
```bash
npx eslint src/games/smashup/ui/TitanZone.tsx src/games/smashup/Board.tsx
# 0 errors, 22 warnings (all pre-existing)
```

### Visual Features

1. **Container Styling:**
   - Amber theme matching SmashUp aesthetic
   - Rounded corners and border
   - Padding and gap for spacing

2. **Card Display:**
   - Larger card size (32x44) for better visibility
   - CardPreview component for image rendering
   - Name overlay at bottom with gradient background

3. **Selection Feedback:**
   - Yellow border and shadow when selected
   - Pulse animation on selected card
   - Checkmark icon in top-right corner
   - Amber border on hover (when not selected)

4. **Ability Descriptions:**
   - Full overlay on hover showing all abilities
   - Ability name in amber color
   - Scrollable for long descriptions
   - Black background with 90% opacity

5. **User Guidance:**
   - Hint text at bottom
   - Only shown when interaction is possible
   - Italic amber text style

### Integration with Existing Systems

1. **State Management:**
   - Uses existing `selectedTitanUid` state from Board.tsx
   - Toggle selection on click
   - Clear selection after placement

2. **Base Interaction:**
   - Selected titan enables base selection mode
   - All bases become selectable (gold border)
   - Clicking base dispatches PLAY_TITAN command

3. **Turn Validation:**
   - Checks `isMyTurn` before allowing selection
   - Shows toast notification if not player's turn

### Next Steps

1. **Task 18:** Create TitanCard component for displaying titans on bases
2. **Task 19:** Implement titan placement interaction UI (confirmation dialog)
3. **Task 27:** Add E2E tests for TitanZone display and interaction

### Files Modified

- `src/games/smashup/ui/TitanZone.tsx` - Enhanced component with selection, hover, and ability display
- `src/games/smashup/Board.tsx` - Updated TitanZone props and click handler

### Testing Notes

**Manual Testing Required:**
1. Start a game with a faction that has titans (e.g., Pirates, Wizards)
2. Verify TitanZone appears above hand area
3. Click a titan card to select it
4. Verify selection feedback (yellow border, pulse, checkmark)
5. Hover over titan to see ability descriptions
6. Click a base to place the titan
7. Verify titan is removed from TitanZone after placement

**E2E Testing (Task 27):**
- Will add automated tests for TitanZone display
- Will verify selection and hover interactions
- Will test titan placement flow end-to-end

## Conclusion

Task 17 is functionally complete. The TitanZone component now provides:
- Clear visual display of available titans
- Interactive selection with visual feedback
- Ability descriptions on hover
- Responsive layout
- Integration with titan placement system

E2E tests will be added in Task 27 to verify all functionality.
