<?php

namespace Soli\MenuBlocks;

/*
  Plugin Name: Soli Menu Blocks Plugin
  Version: 1.0.2
  Author: Joran Out
*/

require_once 'updater.php';
require_once 'inc/blocks.php';

if (!defined('ABSPATH')) exit; // Exit if accessed directly
define('SOLI_MENU_BLOCKS__PLUGIN_DIR_PATH', plugin_dir_path(__FILE__));
define('SOLI_MENU_BLOCKS__PLUGIN_DIR_URL', plugin_dir_url(__FILE__));
define('SOLI_MENU_BLOCKS__PLUGIN_VERSION', "1.0.2");

add_action('init', function () {

  include_once 'updater.php';

  if (!defined('WP_GITHUB_FORCE_UPDATE')) define('WP_GITHUB_FORCE_UPDATE', true);

  if (is_admin()) { // note the use of is_admin() to double check that this is happening in the admin

    $config = array(
      'slug' => plugin_basename(__FILE__), // this is the slug of your plugin
      'proper_folder_name' => dirname(plugin_basename(__FILE__)), // this is the name of the folder your plugin lives in
      'api_url' => 'https://api.github.com/repos/JoranOut/wp-soli-menu-blocks-plugin', // the GitHub API url of your GitHub repo
      'raw_url' => 'https://raw.githubusercontent.com/JoranOut/wp-soli-menu-blocks-plugin/main', // the GitHub raw url of your GitHub repo
      'github_url' => 'https://github.com/JoranOut/wp-soli-menu-blocks-plugin', // the GitHub url of your GitHub repo
      // Fallback only. The updater resolves the real download from the GitHub
      // releases API and overrides this with the release's zip asset.
      'zip_url' => 'https://github.com/JoranOut/wp-soli-menu-blocks-plugin/releases/latest/download/wp-soli-menu-blocks-plugin.zip', // the zip url of the GitHub repo
      'sslverify' => true, // whether WP should check the validity of the SSL cert when getting an update, see https://github.com/jkudish/WordPress-GitHub-Plugin-Updater/issues/2 and https://github.com/jkudish/WordPress-GitHub-Plugin-Updater/issues/4 for details
      'requires' => '6.0.0', // which version of WordPress does your plugin require?
      'tested' => '6.3.1',  // which version of WordPress is your plugin tested up to?
      'readme' => 'README.md', // which file to use as the readme for the version number
    );

    new WP_GitHub_Updater($config);
  }

});

