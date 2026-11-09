# 4. Firebase Hosting으로 화면 공개 (무료)

## 순서
1. https://console.firebase.google.com → **프로젝트 추가** (이름 아무거나, 애널리틱스는 꺼도 OK)
2. [Node.js](https://nodejs.org) 설치 후 터미널에서:
   ```
   npm install -g firebase-tools
   firebase login
   ```
3. 이 폴더(`goat-rampage`)에서:
   ```
   firebase init hosting
   ```
   - **Use an existing project** → 방금 만든 프로젝트 선택
   - public directory → `public`
   - single-page app? → `No`
   - GitHub 자동배포? → `No`
   - `public/index.html` 덮어쓸까요? → **`No` (중요!)**
4. 배포:
   ```
   firebase deploy --only hosting
   ```
5. 나온 `https://프로젝트이름.web.app` 주소로 접속 🎉

> 이미 들어있는 `firebase.json` 은 `public` 폴더를 올리도록 설정돼 있어요.

## 온라인 대전도 되게 하기
Firebase Hosting은 화면만 올라가요. 서버는 [1-서버-Render.md](1-서버-Render.md) 로 올린 뒤
`public/index.html` 맨 위의
```js
window.GOAT_SERVER_URL = "https://goat-rampage-xxxx.onrender.com";
```
를 수정하고 `firebase deploy --only hosting` 을 다시 실행하세요.

## (참고) 서버까지 Firebase/구글 쪽에 올리고 싶다면
Cloud Run에 올릴 수 있지만 **결제 수단 등록(Blaze 요금제)** 이 필요해서 초보자에겐 Render를 추천해요.
