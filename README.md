# Calorie Calc App — ChatGPT Continuity README

Use this README to continue the **Calorie Calc App** project in a new ChatGPT chat without losing context.

**Last updated:** 25 May 2026  
**Current stage:** Core app flows are working. UI polish, manual testing, barcode handling, onboarding, progress/settings, navigation, and lint cleanup have been completed. TypeScript check and final clean app start should still be confirmed if not already done locally.

---

## 1. Project Overview

**Calorie Calc App** is a free calorie and nutrition tracking app built with a Laravel API backend and an Expo React Native frontend.

The app focuses on:

- Daily calorie tracking
- Macro tracking: protein, carbs, fat
- Weight loss, maintenance, and weight gain goals
- Nepali and South Asian foods
- Practical serving sizes such as plate, bowl, cup, spoon, piece, glass, and grams
- Manual food entry when database values are not available
- Barcode lookup through Open Food Facts
- Favourite and recent foods
- Weight logs and nutrition progress tracking

---

## 2. Repository and Local Structure

Repository:

```txt
thesid66/calorie-calc
```

Local project root:

```txt
C:\Users\Admin\Herd\calorie-calc
```

Project structure:

```txt
C:\Users\Admin\Herd\calorie-calc\
  calorie-calc-api\   Laravel API backend
  calorie-calc-app\   Expo React Native frontend
```

Frontend API environment:

```env
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

Use `127.0.0.1:8000` for Expo API requests, not the Herd `.test` domain.

---

## 3. Main Development Commands

From the monorepo root:

```bash
cd /c/Users/Admin/Herd/calorie-calc
npm run dev:web
```

Backend only:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-api
php artisan serve --host=0.0.0.0 --port=8000
```

Frontend only:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-app
npx expo start --web
```

Clean Expo start:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-app
npx expo start --web -c
```

Lint:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-app
npm run lint
```

TypeScript check:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-app
npm exec tsc -- --noEmit
```

Important: do not use plain `npx tsc --noEmit` if it asks to install `tsc@2.0.4`. Use `npm exec tsc -- --noEmit` or `npx --no-install tsc --noEmit` from the frontend folder.

---

## 4. Current Tech Stack

Backend:

- Laravel API
- Laravel Sanctum authentication
- PostgreSQL
- Form Request validation
- Resource-based API responses
- Open Food Facts barcode lookup integration

Frontend:

- Expo `~56.0.3`
- Expo Router `~56.2.5`
- React `19.2.3`
- React Native `0.85.3`
- React Native Web `^0.21.2`
- TypeScript
- Custom UI components
- `expo-secure-store` for native token storage
- Web fallback token storage through localStorage
- `react-native-ui-datepicker`
- `dayjs`

---

## 5. User / Developer Preferences

Siddhartha prefers:

- Exact file paths
- Full replacement code when requested
- Copy-paste ready snippets
- Manual implementation instead of direct repo patching unless explicitly requested
- Practical explanations without over-complication
- Clean, modern, mobile-first UI
- Consistent app-like design
- Avoid unnecessary libraries unless they clearly improve UX
- Continue from the current project state instead of restarting from planning

When helping in a new chat, first read this README and then continue from the current completed state.

---

## 6. UI Direction and Design System

The app follows a modern health-app style called **Your Daily Plate**.

Main palette:

```txt
Background:      #FFF8ED
Primary orange:  #FF6B35
Success green:   #22C55E
Protein indigo:  #6366F1
Carbs amber:     #F59E0B
Fat pink:        #EC4899
Text dark:       #111827
Muted text:      #6B7280
Card:            #FFFFFF
```

Common UI style:

- Rounded cards
- Soft shadows
- Warm background
- Orange hero sections
- Macro cards
- Chips for choices
- Modern grouped form sections
- Friendly empty states
- Clear loading states
- Mobile-first layout

Important theme files:

```txt
calorie-calc-app/src/constants/colors.ts
calorie-calc-app/src/constants/theme.ts
```

Reusable UI components:

```txt
calorie-calc-app/src/components/ui/AppButton.tsx
calorie-calc-app/src/components/ui/AppInput.tsx
calorie-calc-app/src/components/ui/Screen.tsx
calorie-calc-app/src/components/ui/AppCard.tsx
calorie-calc-app/src/components/ui/SectionHeader.tsx
calorie-calc-app/src/components/ui/Chip.tsx
calorie-calc-app/src/components/ui/ErrorCard.tsx
calorie-calc-app/src/components/ui/LoadingState.tsx
calorie-calc-app/src/components/ui/AppDatePicker.tsx
calorie-calc-app/src/components/ui/index.ts
```

Common theme tokens used in the app:

```txt
colors.heading
colors.cardWarm
colors.borderStrong
colors.primarySoft
colors.surfaceAlt
colors.success
colors.successSoft
colors.white
colors.caloriesSoft
colors.mutedDark
colors.warningSoft
colors.dangerSoft
colors.warning

radius['3xl']
radius['2xl']
radius.xl
radius.pill

spacing.xs
spacing.sm
spacing.md
spacing.lg
spacing.xl
spacing['2xl']

typography.tiny
typography.title
typography.heading

macroTones
mealTones
```

---

## 7. Backend API Routes

API prefix:

```txt
/api/v1
```

Auth:

```txt
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /auth/logout
POST   /auth/logout-all
```

Profile and goals:

```txt
GET    /activity-levels
GET    /profile
PUT    /profile
GET    /nutrition-goal
POST   /nutrition-goal
```

Foods:

```txt
GET    /foods
POST   /foods/custom
GET    /foods/{food}
```

Diary and meal entries:

```txt
GET    /diary
POST   /meal-entries
GET    /meal-entries/recent
POST   /meal-entries/copy-meal
POST   /meal-entries/copy-day
GET    /meal-entries/{mealEntry}
PUT    /meal-entries/{mealEntry}
DELETE /meal-entries/{mealEntry}
```

Favourites:

```txt
GET    /food-favorites
POST   /food-favorites/{food}
DELETE /food-favorites/{food}
```

Weight and progress:

```txt
GET    /weight-logs
POST   /weight-logs
GET    /weight-logs/{weightLog}
PUT    /weight-logs/{weightLog}
DELETE /weight-logs/{weightLog}
GET    /progress/overview
GET    /progress/weight
GET    /progress/nutrition
```

Barcodes:

```txt
GET    /barcodes/{barcode}
POST   /barcodes/{barcode}/save-as-food
```

Important backend route ordering reminder:

```txt
Keep these above /meal-entries/{mealEntry}:

GET  /meal-entries/recent
POST /meal-entries/copy-meal
POST /meal-entries/copy-day
```

---

## 8. Completed Core Features

Completed and working:

- User registration
- Login
- Logout
- Token persistence
- Protected routes
- Profile setup
- Nutrition goal setup
- Onboarding summary
- Food database search
- Custom foods
- Food logging
- Manual meal entry
- Edit meal entry
- Delete meal entry
- Diary screen
- Dashboard summary
- Favourite foods
- Recent foods
- Copy previous meal/day flow
- Barcode lookup
- Barcode save-as-food flow
- Friendly barcode not-found handling
- Weight logs
- Progress overview
- Nutrition trends
- Settings/profile save
- Goal save

---

## 9. Frontend Screens

Auth:

```txt
calorie-calc-app/src/app/(auth)/login.tsx
calorie-calc-app/src/app/(auth)/register.tsx
```

Onboarding:

```txt
calorie-calc-app/src/app/onboarding/profile.tsx
calorie-calc-app/src/app/onboarding/goal.tsx
calorie-calc-app/src/app/onboarding/summary.tsx
```

Tabs:

```txt
calorie-calc-app/src/app/(tabs)/index.tsx
calorie-calc-app/src/app/(tabs)/diary.tsx
calorie-calc-app/src/app/(tabs)/add-food.tsx
calorie-calc-app/src/app/(tabs)/progress.tsx
calorie-calc-app/src/app/(tabs)/settings.tsx
```

Meal screens:

```txt
calorie-calc-app/src/app/meal/manual.tsx
calorie-calc-app/src/app/meal/barcode.tsx
calorie-calc-app/src/app/meal/custom-food.tsx
calorie-calc-app/src/app/meal/edit-entry/[id].tsx
calorie-calc-app/src/app/meal/_layout.tsx
```

---

## 10. Completed UI Polish

The following screens were redesigned and polished:

### Dashboard

File:

```txt
calorie-calc-app/src/app/(tabs)/index.tsx
```

Completed:

- Header
- Goal warning
- Orange calorie hero
- Calories left/over state
- Macro cards
- Meal cards
- Quick actions
- Tip card

### Diary

File:

```txt
calorie-calc-app/src/app/(tabs)/diary.tsx
```

Completed:

- Header
- Previous/next date navigation
- Goal warning
- Orange summary hero
- Macro cards
- Action cards
- Meal cards
- Entry cards

The user decided not to use datepicker on the Diary screen. It keeps previous/next date navigation.

### Add Food

File:

```txt
calorie-calc-app/src/app/(tabs)/add-food.tsx
```

Completed:

- Search hero
- Logging context card
- Manual / Barcode / Custom action cards
- Selected food logging form
- Meal chips
- Datepicker
- Serving selector
- Estimated calorie preview
- Favourite foods
- Recent foods
- Food result cards
- Improved search UX

Latest Add Food UX update:

```txt
When search box has text:
- Manual / Barcode / Custom cards are hidden
- Favourite foods are hidden
- Recent foods are hidden
- Default food results are hidden
- Search results appear directly below the search box

When search box is cleared:
- Normal Add Food layout returns
```

### Manual Entry

File:

```txt
calorie-calc-app/src/app/meal/manual.tsx
```

Completed:

- Modern form layout
- Meal details card
- Nutrition card
- Live preview card
- Date and meal type params
- Validation

### Barcode

File:

```txt
calorie-calc-app/src/app/meal/barcode.tsx
```

Completed:

- Header
- Barcode input card
- Friendly loading
- Friendly no-product-found state
- Product result card
- Save-as-food flow

Important barcode not-found fix:

```txt
A 404 product-not-found response should not show an ugly HTTP error.
It should display a friendly no-product-found card and allow another barcode search.
```

### Custom Food

File:

```txt
calorie-calc-app/src/app/meal/custom-food.tsx
```

Completed:

- Basic details card
- Food type card
- Nutrition per 100g card
- Default serving card
- Public/private card
- Live food preview

### Edit Meal Entry

File:

```txt
calorie-calc-app/src/app/meal/edit-entry/[id].tsx
```

Completed:

- Modern edit layout
- Food/manual mode support
- Custom grams fix
- Correct update payload for serving vs custom grams

Important custom grams helper:

```tsx
function hasFoodServing() {
  return (
    isFoodMode() &&
    entry?.serving_grams !== null &&
    entry?.serving_grams !== undefined &&
    Number(entry.serving_grams) > 0
  )
}
```

### Progress

File:

```txt
calorie-calc-app/src/app/(tabs)/progress.tsx
```

Completed:

- Body progress header
- Range filter
- Current weight hero
- Metrics
- Weight trend chart
- Log weight form
- Weight history
- Calories trend
- Nutrition averages

### Settings

File:

```txt
calorie-calc-app/src/app/(tabs)/settings.tsx
```

Completed:

- Account center header
- Orange account hero with initials
- Summary grid
- Profile card
- Activity cards
- Goal cards
- Target preview
- Logout card

### Onboarding

Files:

```txt
calorie-calc-app/src/app/onboarding/profile.tsx
calorie-calc-app/src/app/onboarding/goal.tsx
calorie-calc-app/src/app/onboarding/summary.tsx
```

Completed:

- Step 1: profile setup polished
- Step 2: goal setup polished
- Step 3: summary polished
- Fresh account onboarding flow manually tested and passed

### Auth

Files:

```txt
calorie-calc-app/src/app/(auth)/login.tsx
calorie-calc-app/src/app/(auth)/register.tsx
```

Completed:

- Login polished
- Register polished
- Development default values removed
- Register now redirects fresh account users to onboarding profile

Register should route to:

```txt
/onboarding/profile
```

---

## 11. Navigation and Back Button State

Root layout:

```txt
calorie-calc-app/src/app/_layout.tsx
```

Tabs layout:

```txt
calorie-calc-app/src/app/(tabs)/_layout.tsx
```

Meal layout:

```txt
calorie-calc-app/src/app/meal/_layout.tsx
```

Current meal screens are outside the `(tabs)` group. Therefore bottom tabs do not show on `/meal/...` screens. This is accepted for now.

Meal screens have a custom/fallback back behaviour through `src/app/meal/_layout.tsx`.

Current desired behaviour:

```txt
Normal navigation:
Back button goes to previous screen.

After browser refresh / no navigation history:
Back button remains visible and redirects to fallback route.
```

Current fallback routes:

```txt
/meal/manual          -> /(tabs)/add-food
/meal/barcode         -> /(tabs)/add-food
/meal/custom-food     -> /(tabs)/add-food
/meal/edit-entry/[id] -> /(tabs)/diary
```

Recent back button decision:

- A custom `Pressable` back button worked without warnings.
- User later asked to use the Expo Router back button with `tintColor` prop.
- Current recommended Expo-compatible import is:

```tsx
import { HeaderBackButton } from 'expo-router/react-navigation'
```

Fallback logic should remain:

```tsx
if (router.canGoBack()) {
  router.back()
  return
}

router.replace(fallbackHref)
```

If the React Native Web `Image: style.tintColor is deprecated` warning returns, switch back to the custom `Pressable` back button version.

---

## 12. Completed Manual Testing

The following manual checks passed:

```txt
✅ Fresh account onboarding flow
✅ Food search logging
✅ Manual entry logging
✅ Custom food flow
✅ Recent/favourite/manual Add Food views
✅ Improved Add Food search UX
✅ Edit meal entry
✅ Delete meal entry
✅ Diary totals after meal changes
✅ Barcode not-found flow
✅ Friendly barcode no-product-found handling
✅ Progress screen
✅ Weight log save/update behaviour
✅ Settings profile save
✅ Settings goal save
✅ Logout/login persistence
```

---

## 13. Lint Cleanup

`npm run lint` originally reported multiple issues, mainly from React’s newer `react-hooks/set-state-in-effect` rule.

The app uses normal API loading patterns inside screens, so the project-level ESLint fix was to disable that rule in:

```txt
calorie-calc-app/eslint.config.js
```

Final recommended ESLint config:

```js
// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      'react-hooks/set-state-in-effect': 'off'
    }
  }
])
```

Other lint fixes completed:

```txt
✅ Removed unused macroTones import from add-food.tsx
✅ Wrapped progress loadProgress in useCallback
✅ Fixed Progress useFocusEffect dependency warning
✅ Wrapped edit-entry loadMealEntry in useCallback
✅ Fixed Edit Meal Entry useEffect dependency warning
```

User confirmed lint errors are gone.

---

## 14. Remaining Validation

Before committing or ending the milestone, confirm these if not already done:

```bash
cd /c/Users/Admin/Herd/calorie-calc/calorie-calc-app
npm exec tsc -- --noEmit
```

Expected:

```txt
No output = TypeScript passed
```

Then:

```bash
npx expo start --web -c
```

Expected:

```txt
App starts normally after cache clear.
```

---

## 15. Recommended Next Steps

Suggested order:

```txt
1. Run TypeScript check.
2. Run clean Expo start.
3. Commit the current stable frontend polish milestone.
4. Decide whether meal screens should stay outside tabs or move under /(tabs)/meal.
5. Review production readiness items.
6. Start next feature milestone.
```

Potential next feature/polish ideas:

```txt
- Better empty states for new users
- Food database seed expansion with Nepali foods
- Nutrition insight cards
- Meal plan suggestions
- Weekly summary screen
- User preference settings
- Production API environment setup
- App icon/splash screen polish
- Deployment planning
```

---

## 16. Git Commit Suggestion

After TypeScript and clean app start pass:

```bash
cd /c/Users/Admin/Herd/calorie-calc
git status
git add .
git commit -m "Polish frontend flows and complete app validation"
git push
```

Alternative commit message:

```txt
Complete frontend UI polish and validation cleanup
```

---

## 17. Prompt to Start a New Chat

Use this prompt in a new ChatGPT chat:

```txt
Please read the attached Calorie Calc App ChatGPT continuity README first and continue the project from the current state.

Project: Calorie Calc App
Repository: thesid66/calorie-calc
Local root: C:\Users\Admin\Herd\calorie-calc
Backend: Laravel API in calorie-calc-api
Frontend: Expo React Native app in calorie-calc-app

Current state:
- Core backend APIs are working.
- Frontend auth, onboarding, dashboard, diary, add-food, manual entry, barcode, custom food, edit meal, progress, and settings screens are implemented and polished.
- Manual testing passed for onboarding, meal logging/edit/delete, barcode not-found, progress, settings, and logout/login.
- Add Food search UX was improved so typing in the search box hides other views and shows results directly below the search box.
- Meal back button uses fallback logic so it still works after browser refresh.
- Lint issues were fixed, including the set-state-in-effect rule configuration.

Please continue from this state. Do not restart planning from scratch. Give exact file paths and copy-paste ready code snippets. I prefer manual implementation unless I explicitly ask you to patch files directly.
```

---

## 18. Important Notes for ChatGPT

When continuing this project:

- Do not assume the code is unchanged; inspect files if needed.
- Use exact paths.
- Give complete replacement code when the user asks for complete code.
- Keep answers practical and implementation-focused.
- Do not directly modify the repository unless Siddhartha explicitly asks.
- If using GitHub connector, fetch files with `ref: main`, not `branch`.
- If checking current package/library behaviour, verify with current docs when needed.
- Do not claim TypeScript passed unless the user confirms `npm exec tsc -- --noEmit` has no output.
