/**
 * Multifamily Listing Scanner (Daily Automation)
 * Uses Playwright to scrape Zillow multifamily search results.
 * Designed to run ONCE daily (not repeatedly) to avoid rate-limiting.
 * 
 * Usage: node scanner.js
 * Output: scanner-data.json
 */
const { chromium } = require('playwright-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(StealthPlugin());

const fs = require('fs');
const path = require('path');

const CITIES = ['Mesa', 'Tempe', 'Phoenix'];
const OUTPUT = path.join(__dirname, 'scanner-data.json');
const STATE = path.join(__dirname, 'scanner-state.json');
const DELAY_BETWEEN_CITIES = 15000; // 15 seconds to avoid rate-limiting

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }
  catch { return { knownZPIDs: [], lastScan: null, scans: {} }; }
}

function saveState(s) {
  fs.writeFileSync(STATE, JSON.stringify(s, null, 2));
}

async function scrapeCity(browser, city) {
  const url = `https://www.zillow.com/${city.toLowerCase()}-az/multifamily/`;
  
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();
  let listings = [];
  
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const content = await page.content();
    
    if (content.includes('Access denied') || content.includes('px-captcha')) {
      console.log(`  BLOCKED by PerimeterX`);
      return [];
    }
    
    if (!content.includes('__NEXT_DATA__')) {
      console.log(`  No __NEXT_DATA__ (${content.length} chars)`);
      return [];
    }
    
    const extracted = await page.evaluate(() => {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el) return null;
      const data = JSON.parse(el.textContent);
      const cat1 = data?.props?.pageProps?.searchPageState?.cat1;
      const sr = cat1?.searchResults;
      return {
        total: sr?.totalResultCount || 0,
        listings: (sr?.listResults || []).map(item => ({
          zpid: String(item.zpid || ''),
          address: item.address || '',
          city: item.addressCity || '',
          state: item.addressState || 'AZ',
          zip: item.addressZipcode || '',
          price: item.unformattedPrice || item.price || 0,
          beds: item.beds || 0,
          baths: item.baths || 0,
          sqft: item.area || 0,
          daysOnMarket: item.daysOnZillow || 0,
          homeType: item.homeType || '',
          homeStatus: item.homeStatus || '',
          detailUrl: (item.detailUrl || '').startsWith('http') ? item.detailUrl : 'https://www.zillow.com' + (item.detailUrl || ''),
          lat: item.latLong?.latitude,
          lng: item.latLong?.longitude,
        }))
      };
    });
    
    listings = extracted?.listings || [];
    console.log(`  ${listings.length} listings (total avail: ${extracted?.total || '?'})`);
    
  } catch (e) {
    console.error(`  Error: ${e.message}`);
  } finally {
    await ctx.close();
  }
  return listings;
}

async function main() {
  console.log('=== Multifamily Daily Scanner ===');
  console.log(`Start: ${new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' })} MST`);
  
  const state = loadState();
  const knownSet = new Set(state.knownZPIDs || []);
  
  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });
  
  let all = [];
  
  try {
    for (let i = 0; i < CITIES.length; i++) {
      const city = CITIES[i];
      console.log(`\n[${city}] Fetching...`);
      const cityListings = await scrapeCity(browser, city);
      
      for (const l of cityListings) {
        l.sourceCity = city;
        l.isNew = !knownSet.has(l.zpid);
        l.scanDate = new Date().toISOString().slice(0, 10);
        knownSet.add(l.zpid);
      }
      all = [...all, ...cityListings];
      
      if (i < CITIES.length - 1) {
        console.log(`  Waiting ${DELAY_BETWEEN_CITIES/1000}s before next city...`);
        await new Promise(r => setTimeout(r, DELAY_BETWEEN_CITIES));
      }
    }
  } finally {
    await browser.close();
  }
  
  // Save state
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toLocaleTimeString('en-US', { timeZone: 'America/Phoenix', hour12: false });
  state.lastScan = today;
  state.knownZPIDs = [...knownSet];
  state.scans[today] = {
    time: now,
    total: all.length,
    new: all.filter(l => l.isNew).length,
    cities: {}
  };
  for (const c of CITIES) state.scans[today].cities[c] = all.filter(l => l.sourceCity === c).length;
  saveState(state);
  
  // Save results
  const summary = {
    total: all.length,
    new: all.filter(l => l.isNew).length,
    byCity: {}
  };
  for (const c of CITIES) {
    const cl = all.filter(l => l.sourceCity === c);
    summary.byCity[c] = cl.length;
  }
  
  fs.writeFileSync(OUTPUT, JSON.stringify({
    scanDate: today,
    scanTime: now,
    listings: all,
    summary
  }, null, 2));
  
  console.log(`\n=== DONE: ${today} ${now} ===`);
  console.log(`Total: ${all.length} (${summary.new} new)`);
  for (const c of CITIES) {
    const cl = all.filter(l => l.sourceCity === c);
    const nc = all.filter(l => l.sourceCity === c && l.isNew).length;
    console.log(`  ${c}: ${cl.length} listings, ${nc} new`);
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
