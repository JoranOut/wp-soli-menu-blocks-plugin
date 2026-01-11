![npm](https://img.shields.io/badge/npm-v9.5.0-fb8817)
![node](https://img.shields.io/badge/node-v16.13.0-43853d)
![wp_env](https://img.shields.io/badge/wp&dash;env-v5.12.0-40a8af)
![wordpress](https://img.shields.io/badge/Wordpress-v6.3.1-3858e9)

# WP Soli Menu blocks image
Plugin for wordpress dedicated to displaying an mega menu via blocks on [soli.nl](https://www.soli.nl)

~Plugin Name: wp-soli-menu-blocks-plugin~
~Current Version: 1.0.2~

Contains:
- a mega-panel block
- a submenu-item block for flat menu items
- a random page picker block to select random pages

# Development

## WP-ENV
### Install
```cmd
 npm -g install @wordpress/env 
```

### Start
```cmd
 wp-env start [--debug] 
``` 

### Stop
```cmd 
wp-env stop 
```

## Mysql container
### Login 
```cmd 
mariadb -U -ppassword wordpress 
```

## Localhost
### Front-end
[front-end]( http://localhost:8888/)
### Back-end
[back-end]( http://localhost:8888/wp-admin/) \
username: admin \
password: password

## Configuration
```json
 {
    "env": {
        "site": {
            "plugins": [
                "./wp-soli-admin-plugin",
                "./wp-soli-menu-plugin"
            ]
        },
        "winkel": {
            "plugins": [
                "./event-tickets",
                "./woocommerce",
                "./wp-soli-wc-events",
                "./wp-soli-wc-kindermuziekweek",
                "./mollie-payments-for-woocommerce"
            ]
        }
    }
}
```
