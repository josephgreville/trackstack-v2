# TrackStack for Android

TrackStack ships as a Capacitor app: the same React client, wrapped in a
native Android shell and built for phones.

```
TrackStack (React + Vite)
        │  build → client/dist
        ▼
Capacitor (android/)
        │
        ▼
TrackStack.apk  →  install on a phone
```

## What you need

| Tool | Version | Notes |
|---|---|---|
| JDK | 21 or newer | `java -version` |
| Android Studio | Ladybug or newer | Bundles the SDK and emulator |
| Android SDK | API 36 | `compileSdk`/`targetSdk` are 36 |
| Node | 20 or newer | Already required by the web app |

Set `ANDROID_HOME` to your SDK path (usually
`C:\Users\<you>\AppData\Local\Android\Sdk` on Windows, or
`~/Library/Android/sdk` on macOS), and make sure `platform-tools` is on your
`PATH` so `adb` works.

## Point the app at a server

The native app cannot use a relative `/api/v1` address, so it needs the
absolute address of the TrackStack API.

Copy the template and edit it:

```sh
cp client/.env.mobile.example client/.env.mobile
```

Then choose the address that matches where the app will run:

| Where the app runs | Address |
|---|---|
| Android emulator | `http://10.0.2.2:4000/api/v1` |
| Physical device on your Wi-Fi | `http://192.168.x.x:4000/api/v1` |
| Deployed server | `https://your-domain.com/api/v1` |

For a physical device the server must be reachable from the phone, so start it
on `0.0.0.0` rather than `localhost`, and allow the port through your
firewall.

You can also change the address at runtime from **You → Server connection**
in the app, which is handy when testing against several machines. The value
is stored on the device, so no rebuild is needed.

### Cross-site session cookies

The app runs on `https://localhost` while the API lives on another origin, so
the session cookie has to be marked `SameSite=None; Secure`. Set these on the
server:

```sh
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

`SameSite=None` requires HTTPS, so serve the API over TLS for a real device.
For local testing over plain HTTP, run the app through the `server.url`
option in `capacitor.config.json` instead, which loads the whole web app from
one origin.

## Build and run

```sh
# 1. Build the web client for mobile
npm run build --workspace client -- --mode mobile

# 2. Copy the build into the Android project
npx cap sync android

# 3. Open in Android Studio
npm run android:open
```

From Android Studio you can run on an emulator or a connected device.

### From the command line

```sh
# Build and install a debug APK on a connected device
npm run android:run

# Just build the APK
npm run android:apk
```

The APK lands in `android/app/build/outputs/apk/debug/app-debug.apk`.

### Live reload against a dev server

Point the app at your dev machine instead of the bundled assets by adding a
`server.url` to `capacitor.config.json`:

```json
{
  "server": {
    "url": "http://192.168.x.x:5173",
    "cleartext": true
  }
}
```

The app then loads the site from that address, and Vite's `/api` proxy keeps
the API on the same origin, so cookies behave exactly as they do in the
browser. Remember to remove the `server.url` before shipping a release build.

## Native behaviour

| Area | What happens |
|---|---|
| Status bar | Dark charcoal with light text; the web view sits below it |
| Hardware back | Walks the app's own history, then exits from the root |
| Keyboard | Floats over the page instead of resizing it, so the tab dock stays put |
| Safe areas | The notch, rounded corners and gesture bar are all respected |
| Haptics | A light tap on native interactions |
| Splash | Charcoal background with the TrackStack record, no white flash |

## Project layout

```
capacitor.config.json     App id, web dir and native plugin settings
android/                   The native Android project (commit this)
client/src/native/         Native bootstrap: status bar, keyboard, back button
client/src/styles/native.css  Styles that only apply inside the app
client/.env.mobile         The API address used for mobile builds
```

## Troubleshooting

**The app shows "We could not reach TrackStack"**
The API address is wrong or unreachable. Check the address in
**You → Server connection**, and confirm the phone can reach the server.

**Sign-in does not stick**
The session cookie was rejected. The API needs `SameSite=None; Secure` and
`Secure` requires HTTPS.

**The app loads a blank screen**
Run `npm run build --workspace client -- --mode mobile && npx cap sync android`
so the Android project has the latest web assets.

**Gradle cannot find the SDK**
Set `ANDROID_HOME`, or create `android/local.properties` with
`sdk.dir=/path/to/Android/Sdk`.
