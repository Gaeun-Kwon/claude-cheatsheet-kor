# Claude Code 한국어 치트시트

Claude Code의 모든 기능(단축키, 슬래시 명령어, CLI 플래그, MCP 설정, 환경 변수 등)을 한눈에 볼 수 있는 한국어 치트시트입니다.

## 주요 기능

- Mac/Windows 단축키 자동 감지 및 토글
- 새 기능에 "NEW" 배지 표시
- A4 가로 인쇄 최적화 (Ctrl+P)
- 모바일 반응형 대응
- 매일 자동 업데이트 (GitHub Actions)
- 검색 기능 (Ctrl+K)

## 파일 구조

```
├── index.html                    # 치트시트 UI
├── data.json                     # 전체 데이터 (한국어)
├── scripts/
│   └── update.js                 # 자동 업데이트 스크립트
├── .github/
│   └── workflows/
│       └── update.yml            # GitHub Actions (매일 오전 9시 KST)
└── README.md
```

## 로컬에서 실행

```bash
# 간단한 HTTP 서버로 실행
npx serve .
# 또는
python3 -m http.server 8000
```

## 배포

GitHub Pages에서 무료로 호스팅됩니다.

1. 이 저장소를 GitHub에 push
2. Settings → Pages → Source: GitHub Actions
3. 매일 오전 9시(KST) 자동 업데이트

## 참고

- 원본: [cc.storyfox.cz](https://cc.storyfox.cz)
- Changelog: [code.claude.com/docs/en/changelog](https://code.claude.com/docs/en/changelog)
- 공식 문서: [code.claude.com/docs](https://code.claude.com/docs)
