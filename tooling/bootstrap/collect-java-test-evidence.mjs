/** Collect existing final-build evidence only. Never executes Maven/tests.
 * Deliberately omits XML properties, system-out, test bodies and raw log output.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const logFile = '.tools/backend-java21-final-gaps.log';
const outputFile = '.runtime/java-tests-report.json';
const report = {
  collectedAt: new Date().toISOString(),
  scope: 'Existing final Java 21 Maven run only; no test execution or rebuild. Selects only classes explicitly reported by this log, never counts other Surefire XML.',
  logFile,
  checks: [],
  suites: [],
  limitations: [
    'The build log has a finish time and rounded total duration rather than per-line timestamps. The run start is inferred, with a two-second timestamp rounding tolerance.',
    'These Surefire XML files have no testsuite timestamp attribute. Matching class/count/duration and XML modification times within the recorded run window provide cross-validation; compiled-test files must predate those XML results but may be reused by Maven incremental compilation. This is local evidence, not an external attestation.',
    'This report covers the selected 22 tests from this one run, not every test in the repository or earlier test reports.'
  ]
};
const verify = (name, condition) => {
  report.checks.push({ name, status: condition ? 'PASSED' : 'FAILED' });
  if (!condition) throw new Error('Evidence does not match');
};
const read = filename => fs.readFileSync(path.join(root, filename));
const stat = filename => fs.statSync(path.join(root, filename));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const counts = match => ({ tests: Number(match[1]), failures: Number(match[2]), errors: Number(match[3]), skipped: Number(match[4]) });
const fields = ['tests', 'failures', 'errors', 'skipped'];
try {
  const logBytes = read(logFile);
  const lines = logBytes.toString('utf8').replace(/\x1b\[[0-9;]*m/g, '').split(/\r?\n/);
  report.logSha256 = digest(logBytes);
  report.logModifiedAt = stat(logFile).mtime.toISOString();
  const finished = lines.flatMap(line => { const match = line.match(/^\[INFO\]\s+Finished at:\s+(\S+)\s*$/); return match ? [match[1]] : []; });
  const elapsed = lines.flatMap(line => { const match = line.match(/^\[INFO\]\s+Total time:\s+(\d+):(\d+(?:\.\d+)?)\s+min\s*$/); return match ? [Number(match[1]) * 60 + Number(match[2])] : []; });
  verify('Exactly one successful build with an unambiguous final run time',
    lines.filter(line => /^\[INFO\]\s+BUILD SUCCESS\s*$/.test(line)).length === 1 &&
    !lines.some(line => /BUILD FAILURE/.test(line)) && finished.length === 1 && elapsed.length === 1 && Number.isFinite(Date.parse(finished[0])));
  const end = Date.parse(finished[0]), start = end - elapsed[0] * 1000;
  const tolerance = 2000;
  report.buildFinishedAt = finished[0];
  report.buildDurationSeconds = elapsed[0];
  report.inferredBuildStartedAt = new Date(start).toISOString();
  report.timestampToleranceMs = tolerance;
  verify('Log modification time agrees with the recorded build finish', Math.abs(stat(logFile).mtimeMs - end) <= tolerance);

  const running = lines.flatMap((line, index) => { const match = line.match(/^\[INFO\]\s+Running (cn\.iocoder\.yudao\.module\.[\w.]+)\s*$/); return match ? [{ className: match[1], line: index + 1 }] : []; });
  const summaries = lines.flatMap((line, index) => {
    const match = line.match(/^\[INFO\]\s+Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+), Time elapsed: ([\d.]+) s -- in (cn\.iocoder\.yudao\.module\.[\w.]+)\s*$/);
    return match ? [{ className: match[6], ...counts(match), timeSeconds: Number(match[5]), line: index + 1 }] : [];
  });
  const expected = new Map([
    ['cn.iocoder.yudao.module.infra.service.file.PrivateFilePathsTest', 1],
    ['cn.iocoder.yudao.module.crm.service.CrmAdmissionsBoundaryTest', 4],
    ['cn.iocoder.yudao.module.edu.service.EduAccessServiceTest', 1],
    ['cn.iocoder.yudao.module.edu.service.EduReviewServiceTest', 4],
    ['cn.iocoder.yudao.module.edu.service.EduRulesTest', 5],
    ['cn.iocoder.yudao.module.edu.service.EduTradeLifecycleServiceTest', 7]
  ]);
  verify('Six distinct logged test classes match the final selected 22-test batch',
    running.length === 6 && summaries.length === 6 && new Set(running.map(entry => entry.className)).size === 6 && new Set(summaries.map(entry => entry.className)).size === 6 &&
    summaries.every(summary => expected.get(summary.className) === summary.tests && running.some(entry => entry.className === summary.className && entry.line < summary.line)));

  for (const summary of summaries) {
    const module = summary.className.match(/^cn\.iocoder\.yudao\.module\.(infra|crm|edu)\./)[1];
    const base = 'apps/server/yudao-module-' + module;
    const xmlFile = base + '/target/surefire-reports/TEST-' + summary.className + '.xml';
    const compiledFile = base + '/target/test-classes/' + summary.className.replaceAll('.', '/') + '.class';
    const xmlBytes = read(xmlFile);
    const xml = xmlBytes.toString('utf8');
    const opening = xml.match(/<testsuite\s[^>]+>/)?.[0] ?? '';
    const attrs = Object.fromEntries([...opening.matchAll(/([\w:.-]+)="([^"]*)"/g)].map(match => [match[1], match[2]]));
    const xmlCounts = Object.fromEntries(fields.map(field => [field, Number(attrs[field])]));
    const xmlModified = stat(xmlFile), compiledModified = stat(compiledFile);
    const testCases = [...xml.matchAll(/<testcase\s[^>]+>/g)];
    const suite = {
      className: summary.className,
      ...xmlCounts,
      timeSeconds: Number(attrs.time),
      logRunningLine: running.find(entry => entry.className === summary.className).line,
      logSummaryLine: summary.line,
      xmlFile,
      xmlSha256: digest(xmlBytes),
      xmlModifiedAt: xmlModified.mtime.toISOString(),
      compiledTestFile: compiledFile,
      compiledTestModifiedAt: compiledModified.mtime.toISOString(),
      status: 'PENDING'
    };
    report.suites.push(suite);
    verify('Matching Surefire class/count/duration and testcase count: ' + summary.className,
      attrs.name === summary.className && fields.every(field => xmlCounts[field] === summary[field]) &&
      Number.isFinite(suite.timeSeconds) && Math.abs(suite.timeSeconds - summary.timeSeconds) < 0.000001 && testCases.length === summary.tests);
    verify('Surefire XML belongs to this run window and compiled test predates its result: ' + summary.className,
      xmlModified.mtimeMs >= start - tolerance && xmlModified.mtimeMs <= end + tolerance &&
      compiledModified.mtimeMs <= xmlModified.mtimeMs + tolerance);
    suite.status = 'PASSED';
  }
  report.totals = Object.fromEntries(fields.map(field => [field, report.suites.reduce((sum, suite) => sum + suite[field], 0)]));
  const moduleSummaries = lines.flatMap(line => { const match = line.match(/^\[INFO\]\s+Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)\s*$/); return match ? [counts(match)] : []; });
  verify('Three reactor module summaries independently total the same 22 successful, unskipped tests',
    moduleSummaries.length === 3 && fields.every(field => moduleSummaries.reduce((sum, item) => sum + item[field], 0) === report.totals[field]) &&
    report.totals.tests === 22 && report.totals.failures === 0 && report.totals.errors === 0 && report.totals.skipped === 0);
  report.status = 'PASSED';
} catch {
  report.status = 'UNVERIFIED';
  report.verificationLimit = 'An expected log/Surefire correlation could not be established. Inspect only the selected paths and named failed checks; no raw log or XML property values were exported.';
}
report.completedAt = new Date().toISOString();
fs.mkdirSync(path.join(root, '.runtime'), { recursive: true });
fs.writeFileSync(path.join(root, outputFile), JSON.stringify(report, null, 2) + '\n');
console.log(`${report.status}: ${report.totals?.tests ?? 0} tests across ${report.suites.length} explicitly logged classes. Report: ${outputFile}`);
for (const check of report.checks.filter(check => check.status !== 'PASSED')) console.log('UNVERIFIED: ' + check.name);
process.exitCode = report.status === 'PASSED' ? 0 : 1;
