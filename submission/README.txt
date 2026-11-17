TrackStack — submission pack
============================

Files in this folder
--------------------
1. TrackStack-Submission.pdf    One document containing:
                                - Project brief
                                - Architecture
                                - Page designs
                                - Presentation script and Q&A
                                - Hosting plan and runbook
                                - Testing
2. TrackStack-Presentation.pdf  The 14-slide deck, 16:9, one slide per page.
3. TrackStack-Presentation.pptx The editable PowerPoint with all speaker notes.

Links to submit or paste into the private comment
-------------------------------------------------
GitHub repository: https://github.com/josephgreville/trackstack-v2
Live application:  https://trackstack-zin9.onrender.com
Demo login:        joey@example.com / Password123!
Second account:    sam@example.com / Password123!

Notes for the marker
--------------------
- The live app is free-tier hosted and sleeps after 15 minutes idle. The first
  request can take about 30 seconds; wait for it to wake before signing in.
- The database is a free Render Postgres instance and expires on 2026-12-17.
- The Android build is in the repository under android/; the debug APK is at
  android/app/build/outputs/apk/debug/app-debug.apk.
- No API keys are stored in the frontend or in the repository. The only secrets
  are DATABASE_URL and SESSION_SECRET, supplied as environment variables.

Regenerate these files
----------------------
npm run deck:pptx        # rebuild the PowerPoint from the HTML deck
node scripts/build-submission.cjs
Then print submission/TrackStack-Submission.html to PDF with Edge or Chrome
(Ctrl+P -> Save as PDF).
