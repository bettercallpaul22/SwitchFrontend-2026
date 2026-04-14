# Frontend Agent Instructions

These instructions apply to all work inside the frontend app.

## UI Component Rules

- Always use `AppButton` for buttons and primary actions.
- Always use `AppText` for rendering text instead of raw `Text` unless there is a strong existing reason not to.
- Always use `AppInput` for text inputs and form fields instead of building custom input styling from scratch.
- Always use `appColors` from `src/theme/colors.ts` for colors instead of hardcoding new colors unless extending the shared theme is necessary.

## Implementation Guidance

- Before creating a new UI primitive, check whether an existing shared component already covers the need.
- Prefer extending shared components over introducing one-off local variants.
- Keep new screens and components visually aligned with the existing design system.
- If a missing shared capability is required, update the shared component or theme first, then consume it from the feature component.
