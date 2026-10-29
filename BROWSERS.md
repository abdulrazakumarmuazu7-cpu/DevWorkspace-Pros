# Browser Support

DevWorkspace Pro yana aiki a kowane browser na zamani:

| Browser | Matsakaici | Notes |
|---|---|---|
| Chrome / Edge | 69+ | Mafi kyawun experience, PWA install |
| Firefox | 98+ | Duka fasalulluka, PWA install (desktop) |
| Safari | 12+ | **Dialog polyfill** yana aiki (showModal ba a tsoffin Safari), PWA partial |
| Chrome Android | 69+ | Full support, Add to Home Screen |
| Safari iOS | 12+ | Dialog polyfill, share sheet (babu direct install) |

## Feature Detection
App yana amfani da feature detection, babu wani abin da zai karyata loading:
- `serviceWorker` -> guarded (offline/PWA optional)
- `navigator.clipboard` -> fallback zuwa execCommand
- `HTMLDialogElement.showModal` -> **polyfill** cikin app.ts
- `matchMedia` -> guarded (system theme)
- `history.replaceState` -> try/catch (file:// safe)

## Don Tsofaffi Browser (< Chrome 69)
Monaco editor kansa yana bukatar Chrome 69+. Don goyon baya mafi faɗi, rebuild:
```bash
npm run build:js   # yanzu yana target es2017
```

## Known Limitations
- iOS Safari < 15.4: dialogs suna aiki ta polyfill (banda `::backdrop` native)
- Firefox Android: PWA install yana desktop kawai
- `accent-color` checkbox: tsoffin Chrome (<93) suna nuna default checkbox
