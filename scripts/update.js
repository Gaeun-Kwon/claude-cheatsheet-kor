#!/usr/bin/env node

/**
 * Claude Code 치트시트 자동 업데이트 스크립트
 *
 * 매일 GitHub Actions에서 실행되어 npm 레지스트리에서 최신 버전을 확인하고
 * 새 버전이 감지되면 data.json의 meta.version / meta.lastUpdated를 갱신합니다.
 *
 * 사용법: node scripts/update.js
 *
 * 주요 동작:
 * 1. npm 레지스트리에서 @anthropic-ai/claude-code 최신 버전 조회
 * 2. data.json의 현재 버전과 비교
 * 3. 변경이 있으면 data.json 업데이트
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const NPM_PACKAGE = "@anthropic-ai/claude-code";
const NPM_REGISTRY_URL = `https://registry.npmjs.org/${NPM_PACKAGE}/latest`;
const DATA_PATH = path.join(__dirname, "..", "data.json");

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "Claude-Code-Cheatsheet-KR/1.0",
          },
        },
        (res) => {
          if (res.statusCode !== 200) {
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(new Error("JSON 파싱 실패: " + e.message));
            }
          });
          res.on("error", reject);
        },
      )
      .on("error", reject);
  });
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
  console.log("🔍 npm 레지스트리에서 Claude Code 최신 버전 확인 중...");

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

  // npm 레지스트리에서 최신 버전 가져오기
  let latestVersion;
  try {
    const pkg = await fetchJSON(NPM_REGISTRY_URL);
    latestVersion = pkg.version;
  } catch (e) {
    console.error("❌ npm 레지스트리 접근 실패:", e.message);
    process.exit(1);
  }

  if (!latestVersion) {
    console.log("⚠️ 버전 정보를 가져올 수 없습니다.");
    process.exit(0);
  }

  console.log(`🌐 npm 최신 버전: ${latestVersion}`);

  if (compareVersions(latestVersion, currentVersion) <= 0) {
    console.log("✅ 이미 최신 버전입니다. 업데이트 불필요.");
    process.exit(0);
  }

  // 업데이트 적용
  console.log(`🆕 새 버전 감지: ${currentVersion} → ${latestVersion}`);

  data.meta.version = latestVersion;
  data.meta.lastUpdated = new Date().toISOString().split("T")[0];

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf-8");

  console.log(
    `✅ data.json 업데이트 완료 (v${latestVersion}, ${data.meta.lastUpdated})`,
  );
  console.log(
    "📝 참고: 새로운 기능의 상세 데이터는 수동으로 data.json에 추가해주세요.",
  );

  // GitHub Actions output
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(
      process.env.GITHUB_OUTPUT,
      `updated=true\nnew_version=${latestVersion}\n`,
    );
  }
}

main().catch((e) => {
  console.error("❌ 예상치 못한 오류:", e);
  process.exit(1);
});
