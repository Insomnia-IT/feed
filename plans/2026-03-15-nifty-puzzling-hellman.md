## Context
The group badge feeding UI in the scanner frontend is overly complex. The requirements are to simplify it by:
- Removing the "Кормить часть"/"Кормить всех" toggle button and showing the "feed part" interface by default.
- Deleting UI elements that display "Максимум … суммарно" and the "X мясоед" label.
- Keeping the vegans and meat‑eaters input fields but **removing all validation** (no max limits, no capping).
- Preserving the existing "Без порции" button functionality.

## Approach
We will modify two components:
1. **`post-scan-group-badge-misc.tsx`** – the main card component handling the feed UI.
2. **`feed-other-count.tsx`** – the sub‑component rendering the vegans/meat‑eaters inputs.

The changes will:
- Initialise `showOtherCount` to `true` and drop the toggle logic.
- Omit the `alternativeText`/`handleAlternativeAction` props when rendering `BottomBlock` so the secondary button disappears.
- Always render `<FeedOtherCount>` (no conditional).
- In `FeedOtherCount`, remove the "Максимум …" label, drop the `max` attribute on `<Input>`, and simplify the `onChange` handlers to only parse the number and set the state, without enforcing a maximum.
- Update the prop signature of `FeedOtherCount` (remove `maxCount`).
- Ensure the "Без порции" button (rendered by `NotFeedListModalTrigger`) remains untouched.

## Files to Modify
- `packages/scanner/src/components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/post-scan-group-badge-misc.tsx`
- `packages/scanner/src/components/post-scan/post-scan-group-badge/post-scan-group-badge-misc/feed-other-count.tsx`

## Detailed Steps
### 1. `post-scan-group-badge-misc.tsx`
- Change `const [showOtherCount, setShowOtherCount] = useState(false);` to `useState(true);`.
- Delete the `handleAlternativeAction` prop passed to `<BottomBlock>` and remove the `alternativeText` prop.
- Remove the conditional rendering of `<FeedOtherCount>` (`{showOtherCount ? <FeedOtherCount .../> : null}`) and render `<FeedOtherCount>` unconditionally.
- Remove the `setShowOtherCount` state and any associated toggle button logic (the button that previously toggled `showOtherCount`).
- Update imports if necessary (remove any unused imports).

### 2. `BottomBlock` component (inside the same file)
- Delete the block that renders the alternative button (lines around 156‑160).
- Adjust the component props to no longer require `alternativeText` or `handleAlternativeAction` (optional props can stay but unused).

### 3. `feed-other-count.tsx`
- Remove the `<b>Максимум {maxCount} суммарно</b>` label.
- Remove the `maxCount` prop from the component signature and all calls.
- Eliminate the calculations of `maxVeganCount` and `maxNonVeganCount` or keep them but do **not** use them for validation.
- Remove `max={maxVeganCount}` and `max={maxNonVeganCount}` attributes from the `<Input>` elements.
- Simplify `onChange` handlers:
  ```tsx
  const value = fixNumber(textValue);
  setVegansCount(value);
  ```
  and similarly for `nonVegansCount`.
- Ensure the component still accepts `vegansCount`, `nonVegansCount`, and the setter functions.
- Adjust the import/export to match the new prop list.

### 4. Update Call Sites
- In `post-scan-group-badge-misc.tsx`, adjust the `<FeedOtherCount>` invocation to omit the `maxCount` prop.

### 5. Cleanup
- Run TypeScript compile (`npm run tc`) to verify no type errors.
- Remove any now‑unused variables/imports.

## Verification
1. Start the scanner UI (`npm run dev` in `packages/scanner`).
2. Scan a group badge to open the modal.
3. Verify that the UI immediately displays the vegans and meat‑eaters numeric inputs (no "Максимум …" label).
4. Confirm that there is **no** secondary button labeled "Кормить часть"/"Кормить всех".
5. Enter any numbers, including values larger than the previously enforced max, and ensure the values are accepted without warning.
6. Click the primary "Кормить (N)" button and confirm feeding proceeds.
7. Verify the "Без порции" button is still present and functional.
8. Run the full test suite (`npm run test` or `npm run tc`) to ensure no regression.

---

**Note:** All changes are limited to the two files listed above. No other parts of the application are modified.
