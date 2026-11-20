<?php
// SPDX-License-Identifier: MIT | Copyright (c) 2026 Rodrigo Díaz Morales | See LICENSE
declare(strict_types=1);

// ---------------------------------------------------------------------------
// Map tracker API. One JSON file and one image per published map, overwritten on
// every publish. Players can only read (a=snap, a=img). Everything else needs a DM key
// (the owner key from config.php, or a per-DM key issued from admin.html).
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
  ensure_dir($DATA . '/dms');
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
// Two kinds of key: the owner key in config.php (full access, owns every campaign made before DM keys existed)
// and per-DM keys "<8 hex id>.<secret>" created from admin.html. DM records keep only a hash of the secret.
function admin_key_ok(array $CFG): bool {
  $k = (string)($CFG['dm_key'] ?? '');
  return !($k === '' || str_starts_with($k, 'CHANGE-ME') || strlen($k) < 32);
}
function dm_defaults(array $CFG): array {
  return array_merge(['max_campaigns' => 5, 'max_maps' => 20, 'max_mb' => 100], (array)($CFG['dm_defaults'] ?? []));
}
function dm_quota(array $CFG, ?array $rec, string $k): int {
  $d = dm_defaults($CFG);
  return isset($rec[$k]) && is_numeric($rec[$k]) ? (int)$rec[$k] : (int)$d[$k];
}
function require_dm(array $CFG, string $DATA): array {
  $hasDms = (glob($DATA . '/dms/*.json') ?: []) !== [];
  if (!admin_key_ok($CFG) && !$hasDms) out(503, ['error' => 'server-not-configured']);
  rl_block($DATA, 'dm', (int)$CFG['max_fail_dm']);
  $given = (string)($_SERVER['HTTP_X_DM_KEY'] ?? '');
  if ($given !== '') {
    if (admin_key_ok($CFG) && hash_equals((string)$CFG['dm_key'], $given)) return ['id' => 'admin', 'admin' => true, 'name' => 'owner', 'rec' => null];
    if (preg_match('/^([a-f0-9]{8})\.([A-Za-z0-9_-]{32,64})$/', $given, $m)) {
      $rec = read_json($DATA . '/dms/' . $m[1] . '.json');
      if ($rec && empty($rec['disabled']) && isset($rec['hash']) && hash_equals((string)$rec['hash'], hash('sha256', $m[2]))) {
        return ['id' => $m[1], 'admin' => false, 'name' => (string)($rec['name'] ?? ''), 'rec' => $rec];
      }
    }
  }
  rl_fail($DATA, 'dm'); out(401, ['error' => 'bad-key']);
}
function owner_of(?array $camp): string { return (string)($camp['owner'] ?? 'admin'); }
function may_touch(array $who, ?array $camp): bool { return $who['admin'] || ($camp !== null && owner_of($camp) === $who['id']); }
function rm_tree(string $d): void {
  foreach (glob($d . '/{,.}*', GLOB_BRACE) ?: [] as $f) { $n = basename($f); if ($n === '.' || $n === '..') continue; is_dir($f) ? rm_tree($f) : @unlink($f); }
  @rmdir($d);
}
function dm_usage(string $DATA, string $id): array {
  $n = 0; $bytes = 0;
  foreach (glob($DATA . '/c/*/campaign.json') ?: [] as $f) {
    $c = read_json($f); if (!$c || owner_of($c) !== $id) continue;
    $n++; foreach (glob(dirname($f) . '/*') ?: [] as $x) if (is_file($x)) $bytes += filesize($x);
  }
  return [$n, $bytes];
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
$WHO = require_dm($CFG, $DATA);

if ($a === 'ping') out(200, ['ok' => true, 'time' => time(), 'name' => $WHO['name'], 'admin' => $WHO['admin']]);

// ---- owner only: manage DM keys (used by admin.html) ----------------------
if (str_starts_with($a, 'dm_') || $a === 'dms') {
  if (!$WHO['admin']) out(403, ['error' => 'owner-only']);
  $post = ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST';
  $put = function (string $id, array $rec) use ($DATA) { write_atomic($DATA . '/dms/' . $id . '.json', json_encode($rec, JSON_UNESCAPED_UNICODE)); };
  $nums = function (array $b, array $rec) { foreach (['max_campaigns', 'max_maps', 'max_mb'] as $k) if (isset($b[$k]) && is_numeric($b[$k])) $rec[$k] = max(1, min(100000, (int)$b[$k])); return $rec; };
  if ($a === 'dms') {
    $list = [];
    foreach (glob($DATA . '/dms/*.json') ?: [] as $f) {
      $r = read_json($f); if (!$r) continue; $id = basename($f, '.json'); [$nc, $by] = dm_usage($DATA, $id);
      $list[] = ['id' => $id, 'name' => $r['name'] ?? '', 'created' => $r['created'] ?? 0, 'disabled' => !empty($r['disabled']), 'campaigns' => $nc, 'mb' => round($by / 1048576, 1),
        'max_campaigns' => dm_quota($CFG, $r, 'max_campaigns'), 'max_maps' => dm_quota($CFG, $r, 'max_maps'), 'max_mb' => dm_quota($CFG, $r, 'max_mb')];
    }
    usort($list, fn($x, $y) => $x['created'] <=> $y['created']);
    out(200, ['dms' => $list, 'defaults' => dm_defaults($CFG)]);
  }
  if ($a === 'dm_create' && $post) {
    $b = body_json(); $name = mb_substr(trim((string)($b['name'] ?? '')), 0, 60);
    if ($name === '') out(400, ['error' => 'name']);
    $id = bin2hex(random_bytes(4)); $secret = rtrim(strtr(base64_encode(random_bytes(24)), '+/', '-_'), '=');
    $put($id, $nums($b, ['name' => $name, 'hash' => hash('sha256', $secret), 'created' => time()]));
    out(200, ['ok' => true, 'id' => $id, 'key' => $id . '.' . $secret]); // shown once, only the hash is kept
  }
  $id = (string)(($post ? (body_json()['id'] ?? '') : ($_GET['id'] ?? '')));
  if (!preg_match('/^[a-f0-9]{8}$/', $id)) out(400, ['error' => 'bad-id']);
  $rec = read_json($DATA . '/dms/' . $id . '.json'); if (!$rec) out(404, ['error' => 'dm']);
  if ($a === 'dm_set' && $post) { $b = body_json(); if (isset($b['disabled'])) $rec['disabled'] = (bool)$b['disabled']; $rec = $nums($b, $rec); $put($id, $rec); out(200, ['ok' => true]); }
  if ($a === 'dm_purge' && $post) {
    foreach (glob($DATA . '/c/*/campaign.json') ?: [] as $f) { $c = read_json($f); if ($c && owner_of($c) === $id) rm_tree(dirname($f)); }
    @unlink($DATA . '/dms/' . $id . '.json'); out(200, ['ok' => true]);
  }
  out(404, ['error' => 'unknown-action']);
}

if ($a === 'campaigns') {
  $list = [];
  foreach (glob($DATA . '/c/*/campaign.json') ?: [] as $f) {
    $c = read_json($f); if (!$c) continue;
    if (!may_touch($WHO, $c)) continue;
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
  if ($camp && !may_touch($WHO, $camp)) out(403, ['error' => 'not-yours']);
  [$nc, $used] = $WHO['admin'] ? [0, 0] : dm_usage($DATA, $WHO['id']);
  if (!$camp) {
    if (!$WHO['admin'] && $nc >= dm_quota($CFG, $WHO['rec'], 'max_campaigns')) out(403, ['error' => 'quota-campaigns']);
    $camp = ['name' => $name, 'secret' => new_secret(), 'created' => time(), 'owner' => $WHO['id']]; $created = true;
  }
  if (!$WHO['admin']) {
    $old = 0; foreach (["$dir/$mid.img", "$dir/$mid.json"] as $x) if (is_file($x)) $old += filesize($x);
    if ($used - $old + strlen($bytes) + strlen($snapJson) > dm_quota($CFG, $WHO['rec'], 'max_mb') * 1048576) out(413, ['error' => 'quota-storage']);
  }
  $camp['name'] = $name;
  write_atomic("$dir/campaign.json", json_encode($camp));

  $now = time();
  write_atomic("$dir/$mid.img", $bytes);
  write_atomic("$dir/$mid.json", json_encode(['mid' => $mid, 'name' => $title, 'published' => $now, 'mime' => $mime, 'snapshot' => $b['snapshot']], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

  // keep storage bounded: drop the oldest published maps beyond the limit
  // the world map (mid starting with 'w') is never evicted; only ordinary battle maps count toward the limit
  $maps = array_values(array_filter(campaign_maps($dir), fn($m) => !str_starts_with($m['mid'], 'w')));
  $limit = max(1, $WHO['admin'] ? (int)$CFG['max_maps'] : dm_quota($CFG, $WHO['rec'], 'max_maps'));
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
  if (!may_touch($WHO, $camp)) out(403, ['error' => 'not-yours']);
  $camp['secret'] = new_secret();
  write_atomic("$dir/campaign.json", json_encode($camp));
  out(200, ['ok' => true, 'cid' => $cid, 'token' => $cid . '-' . $camp['secret']]);
}

if ($a === 'unpublish' && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
  $b = body_json();
  $cid = (string)($b['cid'] ?? ''); $mid = (string)($b['mid'] ?? '');
  if (!valid_cid($cid) || !valid_mid($mid)) out(400, ['error' => 'bad-id']);
  $camp = read_json(camp_dir($DATA, $cid) . '/campaign.json');
  if ($camp && !may_touch($WHO, $camp)) out(403, ['error' => 'not-yours']);
  delete_map(camp_dir($DATA, $cid), $mid);
  out(200, ['ok' => true]);
}

out(404, ['error' => 'unknown-action']);
