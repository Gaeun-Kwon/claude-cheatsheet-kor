#!/usr/bin/env node

/**
 * Claude Code 치트시트 자동 업데이트 스크립트
 *
 * 매일 GitHub Actions에서 실행되어 changelog을 확인하고
 * 새 버전이 감지되면 data.json의 meta.version / meta.lastUpdated를 갱신합니다.
 *
 * 사용법: node scripts/update.js
 *
 * 주요 동작:
 * 1. https://code.claude.com/docs/en/changelog 페이지 fetch
 * 2. 최신 버전 번호 추출
 * 3. data.json의 현재 버전과 비교
 * 4. 변경이 있으면 data.json 업데이트
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const CHANGELOG_URL = "https://code.claude.com/docs/en/changelog";
const DATA_PATH = path.join(__dirname, "..", "data.json");

function fetchPage(url) {
  return new Promise((resolve, reject) => {
    const doFetch = (fetchUrl, redirectCount = 0) => {
      if (redirectCount > 5) return reject(new Error("Too many redirects"));

      const lib = fetchUrl.startsWith("https") ? https : require("http");
      lib
        .get(fetchUrl, { headers: { "User-Agent": "Claude-Code-Cheatsheet-KR/1.0" } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            return doFetch(res.headers.location, redirectCount + 1);
          }
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => resolve(body));
          res.on("error", reject);
        })
        .on("error", reject);
    };
    doFetch(url);
  });
}

function extractLatestVersion(html) {
  // changelog 페이지에서 버전 패턴 추출
  // 예: "Version 2.1.84" 또는 "## 2.1.84" 등의 패턴
  const patterns = [
    /Version\s+(\d+\.\d+\.\d+)/gi,
    /##\s+(?:v)?(\d+\.\d+\.\d+)/gi,
    /(\d+\.\d+\.\d+)\s*\(/gi,
    /v(\d+\.\d+\.\d+)/gi,
  ];

  const versions = new Set();

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      versions.add(match[1]);
    }
  }

  if (versions.size === 0) return null;

  // 가장 높은 버전 반환
  return [...versions].sort((a, b) => {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
      if (pa[i] !== pb[i]) return pb[i] - pa[i];
    }
    return 0;
  })[0];
}

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

async function main() {
  console.log("🔍 Claude Code changelog 확인 중...");

  // 현재 data.json 읽기
  let data;
  try {
    data = JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch (e) {
    console.error("❌ data.json을 읽을 수 없습니다:", e.message);
    process.exit(1);
  }

  const currentVersion = data.meta.version;
  console.log(`📌 현재 버전: ${currentVersion}`);

  // Changelog 페이지 가져오기
  let html;
  try {
    html = await fetchPage(CHANGELOG_URL);
  } catch (e) {
    console.error("❌ Changelog 페이지 접근 실패:", e.message);
    process.exit(1);
  }

  // 최신 버전 추출
  const latestVersion = extractLatestVersion(html);

  if (!latestVersion) {
    console.log("⚠️ 버전 정보를 추출할 수 없습니다. 페이지 구조가 변경되었을 수 있습니다.");
    process.exit(0);
  }

  console.log(`🌐 최신 버전: ${latestVersion}`);

  if (compareVersions(latestVersion, currentVersion) <= 0) {
    console.log("✅ 이미 최신 버전입니다. 업데이트 불필요.");
    process.exit(0);
  }

  // 업데이트 적용
  console.log(`🆕 새 버전 감지: ${currentVersion} → ${latestVersion}`);

  data.meta.version = latestVersion;
  data.meta.lastUpdated = new Date().toISOString().split("T")[0];

  // NEW 배지 갱신: 이전 NEW 항목 중 오래된 것 제거
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - (data.meta.newBadgeDays || 14));

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");

  console.log(`✅ data.json 업데이트 완료 (v${latestVersion}, ${data.meta.lastUpdated})`);
  console.log("📝 참고: 새로운 기능의 상세 데이터는 수동으로 data.json에 추가해주세요.");

  // GitHub Actions output
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `updated=true\nnew_version=${latestVersion}\n`);
  }
}

main().catch((e) => {
  console.error("❌ 예상치 못한 오류:", e);
  process.exit(1);
});
