# 🏠 Home Hub: Home Assistant Green setup

This folder has a main hub dashboard for Home Assistant
([`dashboards/main-hub.yaml`](dashboards/main-hub.yaml)) and a short setup guide for a
new **Home Assistant Green**.

The dashboard uses only built-in cards, so it works on a fresh install with no HACS or
custom frontend resources.

## What's in the dashboard

| View | What it shows |
| --- | --- |
| **Home** | Time-of-day greeting with a live count of lights on, locks unlocked and doors/windows open. Also weather, one-tap actions (All lights off, Lock up, Movie night, Good night), favorite devices and the front-door camera |
| **Lights** | Room-by-room light tiles with brightness and color-temperature sliders |
| **Climate** | Thermostat with HVAC modes, indoor temperature and humidity with a 24 h history, and the hourly forecast |
| **Security** | Alarm panel, locks, door and motion sensors, cameras and a recent-activity logbook |
| **Energy** | Energy distribution and usage graph, once the Energy dashboard is configured |
| **System** | CPU, memory and disk gauges for the Green, plus Core/OS/Supervisor updates and backup status |

All views use the **sections** layout, so the same dashboard works on a phone, a laptop or a
wall-mounted tablet.

---

## 1. First boot of the Green

1. Plug the Green into your **router with Ethernet**, then plug in power. (It has no Wi-Fi.)
2. Wait a few minutes, then open **http://homeassistant.local:8123** on a computer or phone
   on the same network. If that doesn't load, look up the Green's IP address in your
   router's app and use `http://<ip>:8123`.
3. The first startup can take up to about 20 minutes while it downloads the latest version.
4. Onboarding: create your user, set your home location (this creates `weather.forecast_home`),
   and pick your units and country.
5. Home Assistant will list the devices it **discovered** on your network (TVs, speakers,
   printers, Hue bridges, and so on). Add the ones you want.

## 2. Recommended first steps

- **Update everything:** Settings → System → Updates.
- **Turn on automatic backups:** Settings → System → Backups. Store a copy off the Green,
  for example on a NAS, Google Drive or Home Assistant Cloud.
- **Install the Companion app** (iOS or Android) and sign in. This creates your
  `person.*` entity for presence tracking and lets the hub send notifications to your phone.
- **Add System Monitor:** Settings → Devices & services → Add integration → *System Monitor*.
  Enable the processor use, memory usage, disk usage and processor temperature sensors. The
  **System** view uses them.
- **Name your areas:** Settings → Areas, labels & zones. Assign each device to a room. It
  makes renaming entities and building automations much easier.
- *(Optional)* **Install the Studio Code Server or File editor add-on** if you want to
  edit YAML on the Green directly.

## 3. Install the Home Hub dashboard

1. **Settings → Dashboards → + Add dashboard → New dashboard from scratch.**
   Name it `Home Hub` and pick an icon such as `mdi:home-variant`.
2. Open the new dashboard, click the **pencil (Edit)**, then **⋮ → Raw configuration editor**.
3. Delete what's there, paste the full contents of
   [`dashboards/main-hub.yaml`](dashboards/main-hub.yaml), and click **Save**.
4. *(Optional)* Make it the default: Settings → Dashboards → select *Home Hub* → **Set as default**.

## 4. Swap in your own entities

The entity IDs in the file are **placeholders** such as `light.living_room` and
`lock.front_door`. Cards that point to entities you don't have yet show a yellow warning.

- Find your real IDs in **Settings → Devices & services → Entities**.
- Use the visual editor (click any card while in edit mode) to pick entities from a list,
  or edit the YAML in the raw editor.
- Delete cards for devices you don't own. You can add more later.
- Change `Winston` in the greeting card to your own name if needed.

These parts work with **no changes**:

- The **status summary** on the Home view, which counts every light, lock and door/window sensor.
- The **All lights off** and **Lock up** buttons, which target `entity_id: all`.

### Scenes used by the quick-action buttons

Create these in **Settings → Automations & scenes → Scenes**, or point the buttons at
scenes you already have:

| Button | Entity |
| --- | --- |
| Movie night | `scene.movie_night` |
| Good night | `scene.good_night` |

### No alarm system?

Settings → Devices & services → Helpers → **+ Create helper → Manual alarm control panel**,
then rename it to `alarm_control_panel.home_alarm`. This gives you a working software alarm
you can automate with your door and motion sensors.

## 5. Ideas once the basics work

- **Energy:** Settings → Dashboards → Energy. Add your utility meter, smart plugs or a CT clamp
  such as Emporia or Shelly EM, and the Energy view fills in.
- **Zigbee / Thread / Matter:** the Green has no radios built in. Add a
  **Home Assistant Connect ZBT-2** (or a similar USB dongle) to use Zigbee or Thread devices
  locally without cloud hubs.
- **Wall tablet:** open the dashboard on an old tablet, and use the Companion app's kiosk
  options or Fully Kiosk Browser to keep the screen on.
- **Automations to start with:** porch light at sunset, "doors left open for 10 min"
  phone alert, and Good night when you plug your phone in after 10 pm.
