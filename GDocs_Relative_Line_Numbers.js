// ==UserScript==
// @name         Google Docs - Caret Line Number and Injection
// @namespace    https://github.com/RyanBlaney/Google-Docs---Relative-Line-Numbers
// @version      1.8
// @description  Displays the line number of the caret position and injects characters to the left of the page in Google Docs
// @match        https://docs.google.com/document/*
// @author       Ryan Blaney
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastCaretRect = null;
    let lastUpdateTime = 0;
    let verticalOffset = -5;

    const injectCharacter = (caretRect, offset, text) => {
        if (caretRect.top + window.scrollY + offset + verticalOffset < 120) return; // Cutoff to avoid displaying in toolbar

        // Create a new marker
        const marker = document.createElement("div");
        marker.className = "caret-line-marker";
        marker.textContent = text;
        marker.style.position = "absolute";
        marker.style.left = `${240}px`; // fixed position to the left of the caret
        marker.style.top = `${caretRect.top + window.scrollY + offset + verticalOffset}px`; // align with caret
        marker.style.color = "red"; // make it visible
        marker.style.fontWeight = "bold";
        marker.style.zIndex = 1000; // ensure it is on top of other elements
        marker.style.fontSize = "15px"; // size for visibility

        document.body.appendChild(marker);
    };

    const clearMarkers = () => {
        const markers = document.querySelectorAll(".caret-line-marker");
        markers.forEach(marker => marker.remove());
    };

    const displayLineNumber = () => {
        const now = Date.now();
        // Throttle the updates to once every 100ms
        if (now - lastUpdateTime < 100) return;

        const caret = document.querySelector(".kix-cursor-caret");
        if (caret) {
            const caretRect = caret.getBoundingClientRect();
            if (caretRect.width === 0 && caretRect.height === 0) {
                console.log("Invalid caret rect detected, retrying...");
                return;
            }

            if (!lastCaretRect ||
                caretRect.top !== lastCaretRect.top ||
                caretRect.left !== lastCaretRect.left ||
                caretRect.width !== lastCaretRect.width ||
                caretRect.height !== lastCaretRect.height) {

                lastCaretRect = caretRect;
                console.log(`Caret Rect: ${JSON.stringify(caretRect)}`);

                clearMarkers();

                // Adjust for zoom level
                const zoomLevel = document.querySelector(".docs-title-outer").style.zoom || 1;
                const lineHeight = caretRect.height / .85 * zoomLevel;

                // Inject markers for lines above and below
                for (let i = 1; i <= 20; i++) { // Adjust range as needed
                    injectCharacter(caretRect, -lineHeight * i, i.toString()); // Above caret
                    injectCharacter(caretRect, lineHeight * i, i.toString()); // Below caret
                }

                lastUpdateTime = now;
            }
        } else {
            console.log("Caret not found");
        }
    };

    const observeChanges = () => {
        const caret = document.querySelector(".kix-cursor-caret");
        if (caret) {
            const observer = new MutationObserver(displayLineNumber);
            observer.observe(caret, { attributes: true, characterData: true, subtree: true });
        } else {
            console.log("Caret element not found for MutationObserver");
        }
    };

    // Add event listeners for key and mouse events
    document.addEventListener("keyup", displayLineNumber);
    document.addEventListener("keydown", displayLineNumber);
    document.addEventListener("mouseup", displayLineNumber);
    document.addEventListener("scroll", displayLineNumber, true); // capture scroll events

    // Initial setup
    displayLineNumber();
    observeChanges();
})();
