const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "videos");
const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
const videoDir = path.join(outDir, `capture-${stamp}`);
const port = Number(process.env.TRAINING_CATALOG_PORT || 8787);
const chromePath = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const cursorPosition = { x: -40, y: -40 };

fs.mkdirSync(videoDir, { recursive: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitForServer(url, timeout = 8000) {
  const started = Date.now();
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const res = await fetch(url);
        if (res.ok) {
          resolve();
          return;
        }
      } catch (_) {
        // Server is still starting.
      }
      if (Date.now() - started > timeout) {
        reject(new Error(`Server unavailable at ${url}`));
        return;
      }
      setTimeout(tick, 250);
    };
    tick();
  });
}

async function injectTourLayer(page) {
  await page.addStyleTag({
    content: `
      html { scroll-behavior: smooth; }
      body.tour-recording, body.tour-recording * { cursor: none !important; }
      #tourCursor {
        position: fixed;
        z-index: 999999;
        left: 0;
        top: 0;
        width: 22px;
        height: 22px;
        pointer-events: none;
        transform: translate3d(-40px, -40px, 0);
        filter: drop-shadow(0 8px 14px rgba(44,52,70,.35));
      }
      #tourCursor:before {
        content: "";
        position: absolute;
        left: 2px;
        top: 0;
        width: 0;
        height: 0;
        border-left: 15px solid #2C3446;
        border-top: 22px solid transparent;
        transform: rotate(-18deg);
      }
      #tourCursor:after {
        content: "";
        position: absolute;
        left: 7px;
        top: 14px;
        width: 7px;
        height: 12px;
        border-radius: 4px;
        background: #F0CBB4;
        transform: rotate(-18deg);
      }
      #tourCursor.clicking .ring {
        position: absolute;
        left: -12px;
        top: -12px;
        width: 42px;
        height: 42px;
        border: 2px solid #C37C5A;
        border-radius: 50%;
        animation: tourClick .45s ease-out;
      }
      #tourCaption {
        position: fixed;
        z-index: 999998;
        right: 22px;
        bottom: 20px;
        width: min(330px, calc(100vw - 44px));
        padding: 11px 13px;
        border-radius: 8px;
        background: rgba(44,52,70,.90);
        color: #fff;
        box-shadow: 0 18px 44px rgba(44,52,70,.24);
        font-family: Inter, Arial, sans-serif;
      }
      #tourCaption b {
        display: block;
        color: #F0CBB4;
        font-family: Georgia, serif;
        font-size: 15px;
        line-height: 1.05;
      }
      #tourCaption span {
        display: block;
        margin-top: 5px;
        color: rgba(255,255,255,.86);
        font-size: 10.5px;
        line-height: 1.32;
      }
      @keyframes tourClick {
        from { transform: scale(.45); opacity: .95; }
        to { transform: scale(1.45); opacity: 0; }
      }
    `
  });

  await page.evaluate(() => {
    document.body.classList.add("tour-recording");
    const cursor = document.createElement("div");
    cursor.id = "tourCursor";
    cursor.innerHTML = '<span class="ring"></span>';
    const caption = document.createElement("div");
    caption.id = "tourCaption";
    caption.innerHTML = "<b>Referentiel pays LCB-FT</b><span>Une base lisible pour piloter le risque pays, les obligations et les impacts operationnels.</span>";
    document.body.append(cursor, caption);
    window.__tourMove = (x, y) => {
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };
    window.__tourClick = () => {
      cursor.classList.remove("clicking");
      void cursor.offsetWidth;
      cursor.classList.add("clicking");
    };
    window.__tourCaption = (title, text) => {
      caption.innerHTML = `<b>${title}</b><span>${text}</span>`;
    };
  });
}

async function setCaption(page, title, text) {
  await page.evaluate(([t, x]) => window.__tourCaption(t, x), [title, text]);
}

async function moveTo(page, x, y, steps = 24) {
  const startX = cursorPosition.x;
  const startY = cursorPosition.y;
  for (let i = 1; i <= steps; i += 1) {
    const ease = i / steps;
    const cx = startX + (x - startX) * ease;
    const cy = startY + (y - startY) * ease;
    await page.mouse.move(cx, cy);
    await page.evaluate(([mx, my]) => window.__tourMove(mx, my), [cx, cy]);
    await wait(8);
  }
  cursorPosition.x = x;
  cursorPosition.y = y;
}

async function clickAt(page, x, y) {
  await moveTo(page, x, y, 18);
  await page.evaluate(() => window.__tourClick());
  await page.mouse.click(x, y);
  await wait(450);
}

async function clickSelector(page, selector) {
  const box = await page.locator(selector).boundingBox();
  if (!box) throw new Error(`Missing selector: ${selector}`);
  await clickAt(page, box.x + box.width / 2, box.y + box.height / 2);
}

async function main() {
  const server = spawn(process.execPath, ["server.js"], {
    cwd: root,
    env: { ...process.env, TRAINING_CATALOG_PORT: String(port) },
    stdio: "ignore"
  });

  let browser;
  try {
    await waitForServer(`http://127.0.0.1:${port}/api/health`);
    browser = await chromium.launch({
      headless: true,
      executablePath: chromePath,
      args: ["--disable-web-security", "--font-render-hinting=none"]
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
      recordVideo: { dir: videoDir, size: { width: 1280, height: 720 } }
    });
    const page = await context.newPage();
    await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: "networkidle" });
    await injectTourLayer(page);
    await moveTo(page, 250, 300, 1);
    await wait(1400);

    await setCaption(page, "Un cockpit pays directement exploitable", "Dates sources, exports et lecture operationnelle sont accessibles des l'ouverture.");
    await moveTo(page, 1010, 170, 32);
    await wait(1000);

    await setCaption(page, "Le cadre de lecture integre", "Un overlay rassemble le glossaire et les textes utiles pour cadrer la decision.");
    await clickSelector(page, "a[href='#lecture']");
    await wait(700);
    await clickSelector(page, "#openIntelOverlay");
    await page.locator("#intelOverlay.show").waitFor({ state: "visible", timeout: 3000 });
    await wait(1600);
    await moveTo(page, 1095, 110, 30);
    await wait(450);
    await page.keyboard.press("Escape");
    await wait(600);

    await setCaption(page, "Actualisation lisible", "Le bouton de synchronisation simule la mise a jour des sources et affiche une progression.");
    await clickSelector(page, "a[href='#sources-donnees']");
    await wait(550);
    await clickSelector(page, "#refreshData");
    await wait(1300);

    await setCaption(page, "Filtrer en quelques secondes", "Recherche, filtres par liste et seuil d'empilement recentrent instantanement la base.");
    await clickSelector(page, "a[href='#tableau']");
    await wait(600);
    await clickSelector(page, "#searchInput");
    await page.locator("#searchInput").fill("Iran");
    await wait(700);

    await setCaption(page, "Une ligne devient une fiche pays", "Au clic, la synthese pays s'ouvre en overlay avec les sources declenchantes.");
    await clickSelector(page, 'tbody tr[data-country="Iran"]');
    await page.locator("#countryOverlay.show").waitFor({ state: "visible", timeout: 3000 });
    await wait(1700);

    await setCaption(page, "Une fiche prete a partager", "La fiche pays garde la logique metier : niveau, effet prioritaire, posture et actions immediates.");
    await moveTo(page, 970, 160, 28);
    await wait(1200);
    await page.keyboard.press("Escape");
    await wait(600);

    await setCaption(page, "Exporter plusieurs pays", "Les cases PDF permettent de composer une selection d'export en quelques clics.");
    await page.locator("#searchInput").fill("");
    await wait(450);
    const boxes = await page.locator("[data-select-country]").all();
    for (const box of boxes.slice(0, 3)) {
      const rect = await box.boundingBox();
      if (rect) await clickAt(page, rect.x + rect.width / 2, rect.y + rect.height / 2);
    }
    await wait(900);

    await setCaption(page, "Piloter par la statistique", "La vue statistique expose la couverture GAFI, les empilements et les niveaux critiques.");
    await clickSelector(page, "a[href='#statistiques']");
    await wait(1800);
    await moveTo(page, 710, 420, 30);
    await wait(1400);

    await setCaption(page, "Un referentiel clair, actionnable, commercialisable", "Une experience sobre pour passer de la source publique a la decision de controle.");
    await wait(1600);

    await context.close();
    const files = fs.readdirSync(videoDir).filter((name) => name.endsWith(".webm"));
    if (!files.length) throw new Error("No video was recorded.");
    const raw = path.join(videoDir, files[0]);
    const finalWebm = path.join(outDir, `referentiel-pays-demo-${stamp}.webm`);
    fs.copyFileSync(raw, finalWebm);
    console.log(finalWebm);
  } finally {
    if (browser) await browser.close().catch(() => {});
    server.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
