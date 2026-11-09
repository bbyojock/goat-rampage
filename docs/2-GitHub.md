# 2. GitHub에 올리기 + GitHub Pages로 화면 공개

## A. 코드 올리기 (Render/Cloudflare/Firebase 모두 먼저 필요)
1. https://github.com 로그인 → 오른쪽 위 **+** → **New repository**
2. 이름 `goat-rampage` 입력, **Public** 선택 → **Create repository**
3. 새 저장소 화면의 **uploading an existing file** 클릭
   → 이 폴더 안의 **모든 파일/폴더를 끌어다 놓기**
   (⚠️ `.github` 폴더는 숨김 폴더라 안 보일 수 있어요. 안 올라가면 아래 "터미널로 올리기" 사용)
4. 아래쪽 **Commit changes** 클릭

### (대안) 터미널로 올리기 — 숨김 폴더까지 한 번에
```
cd goat-rampage
git init
git add .
git commit -m "first"
git branch -M main
git remote add origin https://github.com/내아이디/goat-rampage.git
git push -u origin main
```

## B. GitHub Pages 켜기 (화면만, 무료)
1. 저장소 → **Settings** → 왼쪽 **Pages**
2. **Source** 를 **GitHub Actions** 로 선택
3. 저장소 **Actions** 탭에서 배포가 초록 ✅ 되면 끝
4. 주소: `https://내아이디.github.io/goat-rampage/`

## C. 온라인 대전도 되게 하기
GitHub Pages는 화면만 올라가요. 서버는 [1-서버-Render.md](1-서버-Render.md) 로 올린 뒤,
`public/index.html` 을 GitHub에서 열고 ✏️(편집) → 맨 위쪽 이 줄을 찾아 수정:
```js
window.GOAT_SERVER_URL = "https://goat-rampage-xxxx.onrender.com";
```
→ **Commit changes** → 1분 뒤 반영. (주소 끝에 `/` 없이)
