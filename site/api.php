<?php
declare(strict_types=1);

// ---------------------------------------------------------------------------
// Map tracker API. One JSON file and one image per published map, overwritten on
// every publish. Players can only read (a=snap, a=img). Everything else needs the DM key.
// ---------------------------------------------------------------------------

$CFG = require __DIR__ . '/config.php';
$DATA = __DIR__ . '/data';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, X-DM-Key');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: no-referrer');
header('X-Robots-Tag: noindex, nofollow');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }

function out(int $code, array $body): never {
  http_response_code($code);
  header('Content-Type: application/json; charset=utf-8');
  header('Cache-Control: no-store');
  echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  exit;
}

// ---- storage helpers ------------------------------------------------------
function ensure_dir(string $d): void {
  if (!is_dir($d) && !@mkdir($d, 0775, true) && !is_dir($d)) out(500, ['error' => 'storage']);
}
function init_data(string $DATA): void {
  ensure_dir($DATA);
  $ht = $DATA . '/.htaccess';
  if (!file_exists($ht)) @file_put_contents($ht, "Require all denied\n");
  ensure_dir($DATA . '/c');
  ensure_dir($DATA . '/rl');
}
function write_atomic(string $path, string $bytes): void {
  $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
  if (file_put_contents($tmp, $bytes, LOCK_EX) === false) out(500, ['error' => 'storage']);
  if (!@rename($tmp, $path)) { @unlink($tmp); out(500, ['error' => 'storage']); }
}
function read_json(string $path): ?array {
  if (!is_file($path)) return null;
  $j = json_decode((string)file_get_contents($path), true);
  return is_array($j) ? $j : null;
}
function valid_cid(string $s): bool { return (bool)preg_match('/^[a-f0-9]{8}$/', $s); }
function valid_mid(string $s): bool { return (bool)preg_match('/^[A-Za-z0-9_-]{1,40}$/', $s); }
function camp_dir(string $DATA, string $cid): string { return $DATA . '/c/' . $cid; }

// ---- rate limiting (failures only, per IP) --------------------------------
function rl_file(string $DATA, string $bucket): string {
  $ip = $_SERVER['REMOTE_ADDR'] ?? '0';
  return $DATA . '/rl/' . $bucket . '-' . substr(hash('sha256', $ip), 0, 24) . '.json';
}
function rl_recent(string $DATA, string $bucket): array {
  $f = rl_file($DATA, $bucket);
  $arr = read_json($f) ?? [];
  $cut = time() - 600;
  return array_values(array_filter($arr, fn($t) => is_int($t) && $t > $cut));
}
function rl_block(string $DATA, string $bucket, int $max): void {
  if (count(rl_recent($DATA, $bucket)) >= $max) {
    header('Retry-After: 600');
    out(429, ['error' => 'slow-down']);
  }
}
function rl_fail(string $DATA, string $bucket): void {
  $arr = rl_recent($DATA, $bucket); $arr[] = time();
  write_atomic(rl_file($DATA, $bucket), json_encode($arr));
}

// ---- auth -----------------------------------------------------------------
function require_dm(array $CFG, string $DATA): void {
  $key = (string)($CFG['dm_key'] ?? '');
  if ($key === '' || str_starts_with($key, 'CHANGE-ME') || strlen($key) < 32) out(503, ['error' => 'server-not-configured']);
  rl_block($DATA, 'dm', (int)$CFG['max_fail_dm']);
  $given = (string)($_SERVER['HTTP_X_DM_KEY'] ?? '');
  if ($given === '' || !hash_equals($key, $given)) { rl_fail($DATA, 'dm'); out(401, ['error' => 'bad-key']); }
}
// Resolve a player link "cid-secret" to its campaign, or answer with the same 404 for every kind of failure.
function resolve_link(array $CFG, string $DATA, string $token): array {
  rl_block($DATA, 'link', (int)$CFG['max_fail_link']);
  $cid = ''; $secret = '';
  if (preg_match('/^([a-f0-9]{8})-([A-Za-z0-9_-]{22,64})$/', $token, $m)) { $cid = $m[1]; $secret = $m[2]; }
  $camp = $cid !== '' ? read_json(camp_dir($DATA, $cid) . '/campaign.json') : null;
  if (!$camp || !isset($camp['secret']) || !hash_equals((string)$camp['secret'], $secret)) {
    rl_fail($DATA, 'link');
    out(404, ['error' => 'link']);
  }
  return [$cid, $camp];
}
function new_secret(): string { return rtrim(strtr(base64_encode(random_bytes(16)), '+/', '-_'), '='); } // 128 bits, 22 chars
function body_json(): array {
  $raw = file_get_contents('php://input');
  if ($raw === false || $raw === '') out(400, ['error' => 'empty']);
  $j = json_decode($raw, true);
  if (!is_array($j)) out(400, ['error' => 'bad-json']);
  return $j;
}
function campaign_maps(string $dir): array {
  $maps = [];
  foreach (glob($dir . '/*.json') ?: [] as $f) {
    if (basename($f) === 'campaign.json') continue;
    $j = read_json($f); if (!$j) continue;
    $maps[] = ['mid' => (string)$j['mid'], 'name' => (string)($j['name'] ?? ''), 'published' => (int)($j['published'] ?? 0)];
  }
  usort($maps, fn($a, $b) => $b['published'] <=> $a['published']);
  return $maps;
}
function sniff_image(string $bytes): ?string {
  if (strncmp($bytes, "\x89PNG\r\n\x1a\n", 8) === 0) return 'image/png';
  if (strncmp($bytes, "\xFF\xD8\xFF", 3) === 0) return 'image/jpeg';
  if (strlen($bytes) > 12 && substr($bytes, 0, 4) === 'RIFF' && substr($bytes, 8, 4) === 'WEBP') return 'image/webp';
  return null;
}
function delete_map(string $dir, string $mid): void {
  @unlink("$dir/$mid.json"); @unlink("$dir/$mid.img");
}

init_data($DATA);
$a = (string)($_GET['a'] ?? '');

// ===========================================================================
// Player endpoints (read only)
// ===========================================================================
if ($a === 'snap') {
  [$cid, $camp] = resolve_link($CFG, $DATA, (string)($_GET['t'] ?? ''));
  $dir = camp_dir($DATA, $cid);
  $maps = campaign_maps($dir);
  if (!$maps) out(200, ['campaign' => $camp['name'], 'maps' => [], 'map' => null]);
  $mid = (string)($_GET['m'] ?? '');
  if ($mid === '' || !valid_mid($mid) || !is_file("$dir/$mid.json")) $mid = $maps[0]['mid'];
  $rec = read_json("$dir/$mid.json");
  if (!$rec) out(404, ['error' => 'map']);
  if (isset($_GET['check'])) out(200, ['mid' => $mid, 'published' => (int)$rec['published'], 'latest' => $maps[0]['mid'], 'latestPublished' => $maps[0]['published']]);
  out(200, [
    'campaign' => $camp['name'], 'maps' => $maps,
    'map' => ['mid' => $mid, 'name' => $rec['name'], 'published' => (int)$rec['published'], 'snapshot' => $rec['snapshot'], 'v' => (int)$rec['published']],
  ]);
}

if ($a === 'img') {
  [$cid] = resolve_link($CFG, $DATA, (string)($_GET['t'] ?? ''));
  $mid = (string)($_GET['m'] ?? '');
  if (!valid_mid($mid)) out(404, ['error' => 'map']);
  $dir = camp_dir($DATA, $cid);
  $rec = read_json("$dir/$mid.json");
  $img = is_file("$dir/$mid.img") ? file_get_contents("$dir/$mid.img") : false;
  if (!$rec || $img === false) out(404, ['error' => 'map']);
  header('Content-Type: ' . ($rec['mime'] ?? 'image/png'));
  header('Cache-Control: private, max-age=31536000, immutable'); // URL carries ?v=<published>, so a new publish is a new URL
  header('Content-Length: ' . strlen($img));
  echo $img; exit;
}

// ===========================================================================
// DM endpoints (need X-DM-Key)
// ===========================================================================
require_dm($CFG, $DATA);

if ($a === 'ping') out(200, ['ok' => true, 'time' => time()]);

if ($a === 'campaigns') {
  $list = [];
  foreach (glob($DATA . '/c/*/campaign.json') ?: [] as $f) {
    $c = read_json($f); if (!$c) continue;
    $cid = basename(dirname($f));
    $list[] = ['cid' => $cid, 'name' => $c['name'], 'token' => $cid . '-' . $c['secret'], 'maps' => campaign_maps(dirname($f))];
  }
  out(200, ['campaigns' => $list]);
}

if ($a === 'publish' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $b = body_json();
  $name = trim((string)($b['campaign'] ?? ''));
  $cid = (string)($b['cid'] ?? '');
  $mid = (string)($b['mid'] ?? '');
  $title = mb_substr(trim((string)($b['mapName'] ?? '')), 0, 120);
  if ($name === '' || mb_strlen($name) > 120) out(400, ['error' => 'campaign-name']);
  if (!valid_cid($cid)) out(400, ['error' => 'bad-cid']);
  if (!valid_mid($mid)) out(400, ['error' => 'bad-mid']);
  if (!isset($b['snapshot']) || !is_array($b['snapshot'])) out(400, ['error' => 'snapshot']);
  $snapJson = json_encode($b['snapshot'], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
  if ($snapJson === false || strlen($snapJson) > 1024 * 1024) out(413, ['error' => 'snapshot-too-large']);

  $img = (string)($b['image'] ?? '');
  if (!preg_match('#^data:image/(?:png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$#', $img, $m)) out(400, ['error' => 'image']);
  $bytes = base64_decode($m[1], true);
  if ($bytes === false || $bytes === '') out(400, ['error' => 'image']);
  if (strlen($bytes) > (int)$CFG['max_image_mb'] * 1024 * 1024) out(413, ['error' => 'image-too-large']);
  $mime = sniff_image($bytes);
  if ($mime === null) out(400, ['error' => 'image']);

  $dir = camp_dir($DATA, $cid);
  ensure_dir($dir);
  $lock = fopen($dir . '/.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX)) out(500, ['error' => 'lock']);

  $camp = read_json("$dir/campaign.json");
  $created = false;
  if (!$camp) { $camp = ['name' => $name, 'secret' => new_secret(), 'created' => time()]; $created = true; }
  $camp['name'] = $name;
  write_atomic("$dir/campaign.json", json_encode($camp));

  $now = time();
  write_atomic("$dir/$mid.img", $bytes);
  write_atomic("$dir/$mid.json", json_encode(['mid' => $mid, 'name' => $title, 'published' => $now, 'mime' => $mime, 'snapshot' => $b['snapshot']], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

  // keep storage bounded: drop the oldest published maps beyond the limit
  // the world map (mid starting with 'w') is never evicted; only ordinary battle maps count toward the limit
  $maps = array_values(array_filter(campaign_maps($dir), fn($m) => !str_starts_with($m['mid'], 'w')));
  $limit = max(1, (int)$CFG['max_maps']);
  foreach (array_slice($maps, $limit) as $old) delete_map($dir, $old['mid']);

  flock($lock, LOCK_UN); fclose($lock);
  out(200, ['ok' => true, 'cid' => $cid, 'token' => $cid . '-' . $camp['secret'], 'created' => $created, 'published' => $now, 'bytes' => strlen($bytes)]);
}

if ($a === 'rotate' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $b = body_json();
  $cid = (string)($b['cid'] ?? '');
  if (!valid_cid($cid)) out(400, ['error' => 'bad-cid']);
  $dir = camp_dir($DATA, $cid);
  $camp = read_json("$dir/campaign.json");
  if (!$camp) out(404, ['error' => 'campaign']);
  $camp['secret'] = new_secret();
  write_atomic("$dir/campaign.json", json_encode($camp));
  out(200, ['ok' => true, 'cid' => $cid, 'token' => $cid . '-' . $camp['secret']]);
}

if ($a === 'unpublish' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $b = body_json();
  $cid = (string)($b['cid'] ?? ''); $mid = (string)($b['mid'] ?? '');
  if (!valid_cid($cid) || !valid_mid($mid)) out(400, ['error' => 'bad-id']);
  delete_map(camp_dir($DATA, $cid), $mid);
  out(200, ['ok' => true]);
}

out(404, ['error' => 'unknown-action']);
