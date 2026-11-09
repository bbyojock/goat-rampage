# 1. 서버 + 게임 한 번에 올리기 (Render, 무료)

주소 하나로 **게임 화면 + 온라인 대전 + 로그인** 모두 됩니다.

## 준비물
- GitHub 계정, Render 계정 (Render는 "GitHub로 로그인" 가능)

## 순서
1. 먼저 **[docs/2-GitHub.md](2-GitHub.md) 의 1~3번**으로 이 폴더를 GitHub 저장소에 올립니다.
2. https://render.com 접속 → 로그인
3. 오른쪽 위 **New +** → **Web Service**
4. GitHub 저장소 목록에서 방금 올린 `goat-rampage` 선택 → **Connect**
5. 설정 (대부분 자동으로 채워져요. 아래만 확인):
   - **Language / Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
6. **Deploy Web Service** 클릭 → 2~5분 기다리기
7. 위쪽에 나오는 `https://goat-rampage-xxxx.onrender.com` 주소를 열면 게임 시작! 🎉

> `render.yaml` 이 들어있어서 **New + → Blueprint** 로 올리면 설정 입력 없이 더 빨라요.

## 확인하는 법
`주소/api/health` 를 열어서 `{"ok":true,...}` 가 보이면 서버 정상.

## 친구와 온라인 대전
같은 주소를 친구에게 보내고 → 게임에서 **ONLINE 1v1** → 방 코드 만들기/입장.

## 데이터(계정) 유지하고 싶다면 (선택, 유료)
Render 서비스 → **Disks** → 디스크 추가 (Mount Path: `/data`) →
**Environment** 에 `DB_FILE_PATH` = `/data/data.json` 추가 → 재배포.
무료로 쓸 땐 재시작 시 계정이 사라질 수 있다는 점만 기억하세요.
