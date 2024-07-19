// ==UserScript==
// @name         Google Docs - Caret Line Number and Injection
// @namespace    https://https://github.com/RyanBlaney/Google-Docs---Relative-Line-Numbers
// @version      1.9
// @description  Displays the line number of the caret position and injects characters to the left of the page in Google Docs
// @match        https://docs.google.com/document/*
// @author       Ryan Blaney
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let lastCaretRect = null;
    let lastUpdateTime = 0;

    const injectCharacter = (caretRect, offset, text, center = false) => {
        if (caretRect.top + window.scrollY + offset < 120) return;

        const marker = document.createElement("div");
        marker.className = "caret-line-marker";
        marker.textContent = text;
        marker.style.position = "absolute";
        marker.style.left = center ? `${caretRect.left + window.scrollX}px` : `${540 - (caretRect.height * 16)}px`;
        marker.style.top = `${caretRect.top + window.scrollY + offset}px`;
        marker.style.color = "red";
        marker.style.fontWeight = "bold";
        marker.style.zIndex = 1000;
        marker.style.fontSize = "15px";

        document.body.appendChild(marker);
    };

    const clearMarkers = () => {
        const markers = document.querySelectorAll(".caret-line-marker");
        markers.forEach(marker => marker.remove());
    };

    const displayLineNumber = () => {
        const now = Date.now();
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

                const zoomLevel = document.querySelector(".docs-title-outer").style.zoom || 1;
                const lineHeight = (caretRect.height / .85) * zoomLevel;

                for (let i = 1; i <= 20; i++) {
                    injectCharacter(caretRect, -lineHeight * i, i.toString());
                    injectCharacter(caretRect, lineHeight * i, i.toString());
                }

                for (let i = 5; i <= 20; i += 5) {
                    injectCharacter(caretRect, -lineHeight * i, '-', true);
                    injectCharacter(caretRect, lineHeight * i, '-', true);
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

    document.addEventListener("keyup", displayLineNumber);
    document.addEventListener("keydown", displayLineNumber);
    document.addEventListener("mouseup", displayLineNumber);
    document.addEventListener("scroll", displayLineNumber, true);

    displayLineNumber();
    observeChanges();
})();
