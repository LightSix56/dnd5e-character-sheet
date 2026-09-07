import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import path from 'path';
import fs from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 3099;
const OUT_DIR = path.resolve('mobile_audit');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

function waitForServer(port, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(`http://localhost:${port}/`, (res) => {
        if (res.statusCode === 200 || res.statusCode === 304) resolve();
        else setTimeout(check, 400);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Server start timed out'));
        else setTimeout(check, 400);
      });
    };
    check();
  });
}

async function run() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const nextServer = spawn('npx.cmd', ['next', 'start', '-p', String(PORT)], {
    cwd: path.resolve('.'),
    stdio: 'ignore',
    shell: true
  });

  let browser;
  try {
    await waitForServer(PORT);
    console.log('Next.js server is ready. Launching headless Edge (mobile viewport 390x844)...');

    browser = await puppeteer.launch({
      executablePath: EDGE_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setViewport({
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true
    });

    // 1. Home header & page 1 top
    console.log('Capturing Home screen...');
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle2', timeout: 20000 });
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(OUT_DIR, '01_home_header.png') });

    // 1b. Open Mobile Action Menu
    const menuBtn = await page.$('button[aria-label="Меню листа персонажа"]');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUT_DIR, '01b_mobile_menu_open.png') });
      // Close menu by clicking overlay
      await page.evaluate(() => {
        const overlay = document.querySelector('.parchment-modal-overlay');
        if (overlay) overlay.click();
      });
      await new Promise(r => setTimeout(r, 300));
    }

    // 3. Combat stats
    await page.evaluate(() => window.scrollBy(0, 500));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '02_home_combat_stats.png') });

    // 3b. Skills
    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '03_home_skills.png') });

    // 3c. Attacks & Personality
    await page.evaluate(() => window.scrollBy(0, 700));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '03b_home_attacks.png') });

    // 3d. Equipment & Traits
    await page.evaluate(() => window.scrollBy(0, 700));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '03c_home_equipment_traits.png') });

    // 4. Tab 2: Details / Backstory
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 300));
    const tab2 = await page.$('button.parchment-tabs button, .parchment-tabs button:nth-child(2)');
    if (tab2) {
      await tab2.click();
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUT_DIR, '04_home_tab2_details.png') });
    }

    // 5. Tab 3: Spells
    const tab3 = await page.$('.parchment-tabs button:nth-child(3)');
    if (tab3) {
      await tab3.click();
      await new Promise(r => setTimeout(r, 400));
      await page.screenshot({ path: path.join(OUT_DIR, '05_home_tab3_spells.png') });
    }

    // Return to Tab 1
    const tab1 = await page.$('.parchment-tabs button:nth-child(1)');
    if (tab1) await tab1.click();
    await new Promise(r => setTimeout(r, 300));

    // 6. Create Character Modal
    const createBtn = await page.$('.parchment-mobile-bar button[title*="Создать персонажа"]');
    if (createBtn) {
      await createBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUT_DIR, '06_modal_create_choice.png') });

      // Open Wizard
      const modalBtns = await page.$$('.parchment-modal button');
      if (modalBtns.length > 1) {
        await modalBtns[1].click(); // Interactive Wizard option
        await new Promise(r => setTimeout(r, 700));
        await page.screenshot({ path: path.join(OUT_DIR, '07_modal_wizard_step1.png') });

        // Scroll inside wizard
        await page.evaluate(() => {
          const m = document.querySelector('.parchment-modal');
          if (m) m.scrollBy(0, 350);
        });
        await new Promise(r => setTimeout(r, 400));
        await page.screenshot({ path: path.join(OUT_DIR, '07b_modal_wizard_step1_scrolled.png') });

        // Close wizard
        const closeWizard = await page.$('button[title="Закрыть"], .parchment-remove-btn');
        if (closeWizard) {
          await closeWizard.click();
          await new Promise(r => setTimeout(r, 400));
        }
      }
    }

    // 7. Stats Calculator Modal
    const statsBtn = await page.$('button[title*="калькулятор"], button[title*="Покупка"]');
    if (statsBtn) {
      await statsBtn.click();
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(OUT_DIR, '08_modal_stats_calc.png') });
      const closeStats = await page.$('button[title="Закрыть"]');
      if (closeStats) {
        await closeStats.click();
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // 8. Saved Characters Grid (open via mobile menu)
    console.log('Capturing Characters modal...');
    if (menuBtn) {
      await menuBtn.click();
      await new Promise(r => setTimeout(r, 400));
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('.parchment-mobile-drawer button'));
        const charBtn = btns.find(b => b.textContent?.includes('Персонажи'));
        if (charBtn) charBtn.click();
      });
      await new Promise(r => setTimeout(r, 600));
      await page.screenshot({ path: path.join(OUT_DIR, '09_modal_character_grid.png') });
      const closeGrid = await page.$('button[title="Закрыть"], .parchment-remove-btn');
      if (closeGrid) {
        await closeGrid.click();
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // 9. Share / DM View page (mock share code DEMO1234)
    console.log('Capturing Share View page...');
    await page.goto(`http://localhost:${PORT}/share/DEMO1234`, { waitUntil: 'networkidle2', timeout: 15000 });
    await new Promise(r => setTimeout(r, 700));
    await page.screenshot({ path: path.join(OUT_DIR, '10_share_view.png') });

    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '10b_share_view_scrolled.png') });

    await page.evaluate(() => window.scrollBy(0, 600));
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: path.join(OUT_DIR, '10c_share_view_bottom.png') });

    console.log('All screenshots captured successfully in mobile_audit/');
  } catch (err) {
    console.error('Audit error:', err);
  } finally {
    if (browser) await browser.close();
    console.log('Shutting down Next.js test server...');
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(nextServer.pid), '/T', '/F']);
    } else {
      nextServer.kill('SIGTERM');
    }
  }
}

run();
