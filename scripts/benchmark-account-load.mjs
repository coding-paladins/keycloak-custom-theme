/**
 * Simulates account page load strategies using realistic per-endpoint latencies.
 * Run: node scripts/benchmark-account-load.mjs
 */

const ITERATIONS = 100;

/** Representative latencies (ms) from a typical Keycloak cluster. */
const LATENCY = {
  getAccessToken: 45,
  profile: 110,
  messagesAccount: 75,
  messagesLogin: 70,
  applications: 185,
  credentials: 140,
  lazyChunk: 35
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function getAccessToken() {
  await sleep(LATENCY.getAccessToken);
}

async function fetchProfile() {
  await sleep(LATENCY.profile);
}

async function fetchMessagesSequential() {
  await sleep(LATENCY.messagesAccount);
  await sleep(LATENCY.messagesLogin);
}

async function fetchMessagesParallel() {
  await Promise.all([sleep(LATENCY.messagesAccount), sleep(LATENCY.messagesLogin)]);
}

async function fetchApplications() {
  await sleep(LATENCY.applications);
}

async function fetchCredentials() {
  await sleep(LATENCY.credentials);
}

async function loadLazyChunk() {
  await sleep(LATENCY.lazyChunk);
}

/** Current: Account waits for fetchAllAccountData (4 endpoints) + lazy form chunk. */
async function baselineAccountPage() {
  const start = performance.now();
  await getAccessToken();
  await Promise.allSettled([
    fetchProfile(),
    fetchMessagesSequential(),
    fetchApplications(),
    fetchCredentials()
  ]);
  await loadLazyChunk();
  return performance.now() - start;
}

/** Optimized: profile + parallel messages only; form eager-loaded. */
async function optimizedAccountPage() {
  const start = performance.now();
  await getAccessToken();
  await Promise.allSettled([fetchProfile(), fetchMessagesParallel()]);
  return performance.now() - start;
}

/** Optimized with profile-first paint (messages continue in background). */
async function optimizedProfileFirst() {
  const start = performance.now();
  await getAccessToken();
  await fetchProfile();
  return performance.now() - start;
}

/** Cached profile: show form immediately, messages load in background. */
async function optimizedCachedProfile() {
  const start = performance.now();
  await fetchMessagesParallel();
  return performance.now() - start;
}

async function benchmark(name, fn) {
  const samples = [];
  for (let i = 0; i < ITERATIONS; i++) {
    samples.push(await fn());
  }
  samples.sort((a, b) => a - b);
  const sum = samples.reduce((a, b) => a + b, 0);
  const p50 = samples[Math.floor(samples.length * 0.5)];
  const p95 = samples[Math.floor(samples.length * 0.95)];
  return { name, mean: sum / samples.length, p50, p95, min: samples[0], max: samples[samples.length - 1] };
}

function theoreticalMax() {
  const token = LATENCY.getAccessToken;
  const baseline =
    token +
    Math.max(
      LATENCY.profile,
      LATENCY.messagesAccount + LATENCY.messagesLogin,
      LATENCY.applications,
      LATENCY.credentials
    ) +
    LATENCY.lazyChunk;
  const optimized =
    token + Math.max(LATENCY.profile, Math.max(LATENCY.messagesAccount, LATENCY.messagesLogin));
  const profileFirst = token + LATENCY.profile;
  return { baseline, optimized, profileFirst };
}

function printRow(result) {
  console.log(
    `  ${result.name.padEnd(28)} mean=${result.mean.toFixed(1)}ms  p50=${result.p50.toFixed(1)}ms  p95=${result.p95.toFixed(1)}ms`
  );
}

async function main() {
  const theory = theoreticalMax();
  console.log("Account page load benchmark");
  console.log(`Iterations per strategy: ${ITERATIONS}`);
  console.log("");
  console.log("Latency model (ms):", LATENCY);
  console.log("");
  console.log("Theoretical minimum (ms):");
  console.log(`  baseline (all 4 + lazy):     ~${theory.baseline}`);
  console.log(`  optimized (profile+messages):  ~${theory.optimized}`);
  console.log(`  profile-first paint:           ~${theory.profileFirst}`);
  console.log("");
  console.log("Simulated results:");

  const results = await Promise.all([
    benchmark("BEFORE: all endpoints + lazy", baselineAccountPage),
    benchmark("AFTER: profile + messages", optimizedAccountPage),
    benchmark("AFTER: profile-first (cold)", optimizedProfileFirst),
    benchmark("AFTER: cached profile", optimizedCachedProfile)
  ]);

  for (const result of results) {
    printRow(result);
  }

  const baselineMean = results[0].mean;
  const optimizedMean = results[1].mean;
  const profileFirstMean = results[2].mean;
  const cachedMean = results[3].mean;
  const savingsVsBaseline = ((1 - optimizedMean / baselineMean) * 100).toFixed(1);
  const savingsProfileFirst = ((1 - profileFirstMean / baselineMean) * 100).toFixed(1);
  const savingsCached = ((1 - cachedMean / baselineMean) * 100).toFixed(1);

  console.log("");
  console.log("Comparison vs BEFORE:");
  console.log(`  AFTER (profile + messages):  ${savingsVsBaseline}% faster (mean)`);
  console.log(`  AFTER (profile-first):     ${savingsProfileFirst}% faster (mean)`);
  console.log(`  AFTER (cached profile):    ${savingsCached}% faster (mean)`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
