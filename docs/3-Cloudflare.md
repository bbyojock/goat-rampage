# 3. Cloudflare Pages로 화면 공개 (무료)

1. [docs/2-GitHub.md](2-GitHub.md) 의 **A. 코드 올리기** 먼저 완료
2. https://dash.cloudflare.com 로그인 → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. GitHub 연결 → `goat-rampage` 저장소 선택 → **Begin setup**
4. 설정:
   - **Framework preset**: `None`
   - **Build command**: *(비워두기)*
   - **Build output directory**: `public`
5. **Save and Deploy** → 1분 뒤 `https://goat-rampage.pages.dev` 완성 🎉

## 온라인 대전도 되게 하기
Cloudflare Pages는 화면만 올라가요. 서버는 [1-서버-Render.md](1-서버-Render.md) 로 올리고,
`public/index.html` 맨 위의
```js
window.GOAT_SERVER_URL = "https://goat-rampage-xxxx.onrender.com";
```
를 수정해서 GitHub에 저장하면 Cloudflare가 자동으로 다시 배포합니다.

> 💡 이 게임 서버(Node.js + WebSocket)는 Cloudflare Workers에서 그대로 돌릴 수 없어요
> (Durable Objects로 다시 짜야 함). 그래서 서버는 Render를 추천합니다.
