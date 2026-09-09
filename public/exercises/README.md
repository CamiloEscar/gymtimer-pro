# Exercise videos

Drop your reference clips here. The catalog points to these by `videoUrl`.

## File naming

Use kebab-case matching the exercise name. Examples:

- `/exercises/pull-ups.mp4`
- `/exercises/kettlebell-swing.mp4`

For thumbnails (optional):

- `/exercises/pull-ups.jpg`

## Recommended format

- Container: MP4 (H.264 + AAC); WebM (VP9 + Opus) as backup.
- Resolution: 720p (1280×720). Don't go above 1080p — TVs are usually 1080p max.
- Duration: 5–15 seconds, looped.
- Size: < 2 MB per clip. Compress aggressively. These load on every workout start.
- Audio: strip it — videos play muted on the display.

## Linking from the catalog

Edit `src/lib/workout/exerciseCatalog.ts` (or the CrossFit one) and set `videoUrl` on the matching exercise. The clip will render in the exercise detail page and on the display if the toggle is on.

## Sources for free reference clips

- Wodflix demo clips
- Gymnastics Bodies YouTube embeds (download first, don't hot-link)
- CrossFit Football reference videos

Anything you drop here is yours — keep file sizes small and the catalog tidy.
