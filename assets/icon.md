# Plugin Icon Requirements

## Required Icons

### Main Plugin Icon
- **File**: `icon.png`
- **Size**: 256x256 pixels
- **Format**: PNG with transparent background
- **Style**: Should fit Steam Deck's UI aesthetic
- **Content**: Visual novel/book icon or VN-related imagery

### Store Icon (if publishing to Decky store)
- **File**: `store_icon.png`
- **Size**: 512x512 pixels
- **Format**: PNG
- **Style**: Higher resolution version of main icon

## Icon Design Guidelines

1. **Visibility**: Should be clearly visible on both light and dark backgrounds
2. **Recognition**: Instantly recognizable as related to visual novels
3. **Steam Deck Style**: Match the rounded corners and visual style of Steam Deck UI
4. **Scalability**: Should look good at different sizes (24px to 256px)

## Suggested Icon Concepts
- Open book with sparkles/stars
- Manga/light novel cover design
- Speech bubble with heart
- Japanese-style book/scroll
- Stylized VN character silhouette

## Implementation
Once icons are created:
1. Place `icon.png` in the `assets/` directory
2. Update `plugin.json` to reference the icon
3. Ensure proper file permissions for Steam Deck access