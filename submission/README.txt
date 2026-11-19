TrackStack submission pack
===========================

Files in this folder
--------------------
1. TrackStack-Submission.pdf    One document containing:
                                - TrackStack in plain English (read this first)
                                - Project brief
                                - Architecture
                                - Page designs
                                - Presentation script and Q&A
                                - Hosting plan and runbook
                                - Testing
2. TrackStack-Presentation.pdf  The 13-slide deck, one slide per page, 16:9.
                                The talk is 3 minutes including the advert.
3. TrackStack-Presentation.pptx The editable PowerPoint with all speaker notes.
                                Notes include the 3-minute timing and 2-minute Q&A.
4. TrackStack-Ad.mp4            30-second STAR advert with live app screenshots.
                                Play it at 2:30 in the presentation.

Please attach these as individual files in Google Classroom. I have not zipped
the folder, because Classroom asks for files rather than a folder or archive.

Links to submit or paste into the private comment
-------------------------------------------------
GitHub repository: https://github.com/josephgreville/trackstack-v2
Live application:  https://trackstack-zin9.onrender.com
Demo login:        joey@example.com / Password123!
Second account:    sam@example.com / Password123!

Presentation format
-------------------
0:00 to 2:30    Slides 1 to 12, including the live demo
2:30 to 3:00    STAR video advert
3:00 to 5:00    Questions, with a hard stop at 5 minutes

The STAR beats in the advert are Situation, Target, Action and Result. The
captions carry the story, so the video works with the sound off.

Notes for the marker
--------------------
- The live app is free-tier hosted and sleeps after 15 minutes idle. The first
  request can take about 30 seconds; wait for it to wake before signing in.
- The database is a free Render Postgres instance and expires on 2026-12-17.
- The Android build is in the repository under android/; the debug APK is at
  android/app/build/outputs/apk/debug/app-debug.apk.
- No API keys are stored in the frontend or in the repository. The secrets are
  DATABASE_URL and SESSION_SECRET, plus GOOGLE_CLIENT_SECRET if Google sign-up
  is enabled, all supplied as environment variables. The Google button appears
  only when GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in Render.
- Discover search calls iTunes through the API first. If a hosting provider is
  blocked by iTunes, the browser uses a read-only fallback to the same public
  endpoint, keeping the same collection IDs.
- To show the Android version, install the debug APK on a phone or emulator and
  open it. It loads the deployed site, so the same login, shelves and bottom dock
  appear in a native shell.

Regenerate these files
----------------------
npm run deck:pptx        # rebuild the PowerPoint from the HTML deck
node scripts/build-submission.cjs
Then print submission/TrackStack-Submission.html to PDF with Edge or Chrome
(Ctrl+P -> Save as PDF).
Print docs/presentation/index.html to submission/TrackStack-Presentation.pdf
with Edge or Chrome (Ctrl+P -> Save as PDF, margins None, background graphics on).
