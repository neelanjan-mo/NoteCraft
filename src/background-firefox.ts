// src/background-firefox.ts
console.log('NoteCraft background script running (Firefox).');

browser.runtime.onInstalled.addListener(() => {
    console.log('NoteCraft installed on Firefox');
});
