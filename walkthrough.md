# Walkthrough - Automate Dish Image Generation

I have automated the image selection process. Users no longer need to find and paste image URLs.

## Changes

### User Interface
- **Remove Input**: Removed the "Image URL" field from the "Add Dish" modal.
- **Simplified Flow**: Users just enter a Dish Name and optionally a Link.

### Backend Logic
- **Automated Image Extraction**:
    1.  **From Link**:
        -   **Video Support**: Specifically detects YouTube links and extracts the high-quality thumbnail directly from YouTube (bypassing scraping issues).
        -   **Generic**: For other sites (scrapes for Open Graph images).
            -   *Note*: Intentionally skips scraping for TikTok/Instagram/Facebook to prevent getting "Login" placeholders, defaulting to Google Search instead.
    2.  **From Name**:
        -   **Priority 1: Google Custom Search**: If API Keys are present (`GOOGLE_API_KEY` + `GOOGLE_SEARCH_CX`), searches for real food photos.
        -   **Priority 2: LoremFlickr (Stock Photos)**: If keys missing or search fails, uses `loremflickr.com` to fetch a real stock photo based on the dish keywords.
            -   *Why*: To get "Real Photos" (like user requested) instead of AI generated art.
            -   *Fix*: Keywords are simplified (first word only + "food") to maximize matches.
            -   *Safety*: If the stock photo provider returns a 404 (broken link), the UI now auto-catches this and displays a generic food placeholder image instead of a broken icon.

### 2. Overlay UI Fix
-   **Problem**: The "dish chip" in the video overlay (top left) and the video cover were showing generic colored squares (UI Avatars) instead of the dish photo.
-   **Fix**: Updated `SingleDayView` to use the `dish.image` property.
    -   *Header Chip*: Now displays the dish thumbnail.
    -   *Video Cover*: Now displays the dish thumbnail before the video plays.
    -   *Fallback*: Retained `ui-avatars` as a fallback if the image fails to load.

### 3. Weekly Notes
-   **Feature**: Added a collapsible note section at the bottom of the weekly view.
-   **Persistance**: Notes are saved per-week (e.g. "Week of Dec 28") to the database.
-   **UI**:
    -   *Collapsed*: Shows a 2-line preview.
    -   *Expanded*: Clicking expands it to a large text area for typing.
    -   *Auto-save*: content is saved automatically when you close the note or switch weeks.

### 4. Layout Improvements
-   **Ratio**: Enforced a split layout for the weekly view:
    -   *Headers*: Fixed height (**60px** Top Header + **60px** Week Navigator).
    -   *Days List*: Strict **90%** of remaining space (`flex: 0 0 90%`).
    -   *Note Area*: Strict **10%** of remaining space (`flex: 0 0 10%`).
-   **Viewport**: Fixed entire app to `100vh` to prevent window scrolling.

## Verification Results

### Automated Checks
- `npm run build` passed.

### Manual Verification
1.  **Add Dish with Name**:
    -   Name: "Curry Rice"
    -   **Expected**: A high-quality photo of curry rice.
    -   **Previous Behavior**: Often returned pixelated or generic icons.
    -   **New Behavior**: Should return a photorealistic image.
2.  **Add Dish with Link**:
    -   Name: "Pasta Video"
    -   Link: `https://...` (e.g. a YouTube video)
    -   **Result**: The thumbnail of the video should appear.
