# Bugs
- [ ] Injection is broken.
Fix idea: Instead of generating the wrapper dynamically based on the expected return value, just make a monolithic
wrapper that handles all cases and put it on the window object. Ex: `window.__injector__(...)`

# Improvements
- [ ] Better error handling in the scraper for cases where the return
      value cannot be serialized (e.g. `undefined`, 'Infinity', etc.)) 
- [ ] Add a way to inject a function that takes parameters (make sure the parameters are serialized)
- [ ] Add a mouse jiggle to prevent website from logging out
- [ ] Provide a way to automatically log in to the website (just for development purposes)

# Base functionality
- [ ] javascript library injection like jquery
- [ ] Injection state object on "window" object to prevent multiple injections of the same library


# Features ideas
- [ ] Cache scraped data
- [ ] Export schedule to Google Calendar
