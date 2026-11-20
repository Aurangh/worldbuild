<?php
// Copy to config.php ON THE SERVER ONLY (never commit the real one).
return [
  // Owner key: full access. Open /admin.html with it to create keys for other DMs.
  'dm_key'        => 'CHANGE-ME-to-a-long-random-string-of-32+-characters',
  'max_image_mb'  => 4,
  'max_maps'      => 40,            // per campaign, for the owner key
  // Default limits for each DM key (override per DM in admin.html)
  'dm_defaults'   => ['max_campaigns' => 5, 'max_maps' => 20, 'max_mb' => 100],
  'max_fail_dm'   => 10,
  'max_fail_link' => 40,
];
