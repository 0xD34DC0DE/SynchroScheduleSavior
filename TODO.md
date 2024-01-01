# Bugs
- [ ] Scraped window doesn't close when the main window is closed
- [ ] onNavigationEventOnce will be unregistered event if the event didn't match the filter.
      Happens because the event filter is being called on a navigation event, and it unregisters the event. 

# Tasks
- [ ] Prevent the closing of the scraped window
- [ ] Use `once` instead of `listen` and `unlisten` to listen for injection results. This way, the RAII pattern 
      won't be needed.
- [ ] Use `app.ipc_scope().configure_remote_access` instead of `tauri.conf.json` to configure allowed domains
- [ ] Verify that the session keep alive works
- [ ] Create a multiline Typography component that splits the text into paragraphs using \n
- [ ] Put the scraper code in its own library/crate and refactor the giant file
- [ ] let the Scraper store recreate the scraper upon page reload
- [ ] Provide a way to automatically log in to the website (just for development purposes)
- [ ] About page
- [ ] Refactor the error handling of the scraper to make it more readable and less repetitive.

# Features ideas
- [ ] Cache scraped data
- [ ] Export schedule to Google Calendar