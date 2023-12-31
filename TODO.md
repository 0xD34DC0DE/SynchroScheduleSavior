# Bugs
- [ ] Scraped window doesn't close when the main window is closed

# Tasks
- [x] _Add a way to listen to navigation events to certain pages_
- [ ] Refactor navigation events to use the js api __1*__ 
- [ ] Use `once` instead of `listen` and `unlisten` to listen for injection results. This way, the RAII pattern 
      won't be needed.
- [ ] Use `app.ipc_scope().configure_remote_access` instead of `tauri.conf.json` to configure allowed domains
- [ ] Add a mouse jiggle to prevent website from logging out
- [ ] Provide a way to automatically log in to the website (just for development purposes)

# Features ideas
- [ ] Cache scraped data
- [ ] Export schedule to Google Calendar

### 1*:
In `@tauri-apps/api/helpers/event` there is a version of `listen` and `once` where the window to listen to can 
be specified. It would be much simpler to just emit the navigation events from the window that is being monitored.
The event name could just be `navigation-<hash>` where `<hash>` is a small hash of the url.