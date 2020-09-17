// Notify native code that the page has loaded.
window.addEventListener("load", function() { // on page load
    // Notify native code that the page is loaded.
    if (isScrollModeEnabled()) {
        console.log("last_known_scrollY_position " + last_known_scrollY_position);
    } else {
        console.log("last_known_scrollX_position " + last_known_scrollX_position);
    }
}, false);

var last_known_scrollX_position = 0;
var last_known_scrollY_position = 0;
var ticking = false;

// Position in range [0 - 1].
var update = function(position) {
    let positionString = position.toString()
    Android.progressionDidChange(positionString);
    getCfi();
};

var getCfi = debounce(function() {
    Android.cfiDidChange(getFirstVisiblePartialCfi(getFrameRect()));
}, 50);

function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

function getFrameRect() {
  return {
     left: 0,
     right: window.innerWidth,
     top: 0,
     bottom: window.innerHeight
  };
}

function isScrollModeEnabled() {
    return document.documentElement.style.getPropertyValue("--USER__scroll").toString().trim() == 'readium-scroll-on';
}

window.addEventListener('scroll', function(e) {
    last_known_scrollY_position = window.scrollY / document.scrollingElement.scrollHeight;
    last_known_scrollX_position = Math.abs(window.scrollX / document.scrollingElement.scrollWidth);
    console.log("last_known_scrollX_position " + last_known_scrollX_position);
    console.log("last_known_scrollY_position " + last_known_scrollY_position);
    if (!ticking) {
        window.requestAnimationFrame(function() {
            update(isScrollModeEnabled() ? last_known_scrollY_position : last_known_scrollX_position);
            ticking = false;
        });
    }
    ticking = true;
});

var uScrollWidth = function() {
    return document.scrollingElement.scrollWidth
};
var uScrollX = function() {
    return window.scrollX
};

var scrollToPage = function(page) {
    console.log("scrollToPage " + page);

    var offset = window.innerWidth * page;

    document.scrollingElement.scrollLeft = snapOffset(offset);
    last_known_scrollX_position = window.scrollX / document.scrollingElement.scrollWidth;
    update(last_known_scrollX_position);

    return document.scrollingElement.scrollLeft
};

// Scroll to the given TagId in document and snap.
var scrollToId = function(id) {
    console.log("scrollToId " + id);
    var element = document.getElementById(id);
    var elementOffset = element.scrollLeft // element.getBoundingClientRect().left works for Gutenbergs books
    var offset = Math.round(window.scrollX + elementOffset);

    document.scrollingElement.scrollLeft = snapOffset(offset);
};

var scrollToAnchor = function(id) {
    console.log("scrollToAnchor " + id);
    var element = document.getElementById(id);
    scrollToElement(element);
};

var scrollToElement = function(element, textPosition) {
    console.log("ScrollToElement " + element.tagName + (textPosition ? (" (offset: " + textPosition + ")") : ""));
    var windowWidth = window.innerWidth;
    var elementScreenLeftOffset = element.getBoundingClientRect().left;

    if (window.scrollX % windowWidth === 0 && (elementScreenLeftOffset >= 0 && elementScreenLeftOffset <= windowWidth)) {
      return;
    }

    var page = getPageForElement(element, elementScreenLeftOffset, textPosition);
    document.scrollingElement.scrollLeft = page * windowWidth;
};

function getPageForElement(element, elementScreenLeftOffset, textOffset) {
    if (!textOffset) {
      return Math.ceil((window.scrollX + elementScreenLeftOffset) / window.innerWidth) - 1;
    }

    const position = textOffset / element.textContent.length;
    const rects = Array.from(element.getClientRects()).map(function (rect) {
        return {
            rect,
            offset: Math.floor(rect.left / window.innerWidth),
            surface: rect.width * rect.height
        }
    });
    const textTotalSurface = rects.reduce(function (total, current) { return total + current.surface; }, 0);

    const rectToDisplay = rects.map(function(rect, index) {
        if (index === 0) {
            rect.start = 0;
            rect.end = rect.surface / textTotalSurface;
        } else {
            rect.start = rects[index - 1].end;
            rect.end = rect.start + (rect.surface / textTotalSurface);
        }
        return rect;
    }).find(function (rect) {
        return position >= rect.start && position < rect.end;
    });

    return rectToDisplay ? rectToDisplay.offset : 0;
}

// Position must be in the range [0 - 1], 0-100%.
var scrollToPosition = function(position) {
    console.log("ScrollToPosition " + position);
    if ((position < 0) || (position > 1)) {
        console.log("InvalidPosition");
        return;
    }
    var offset = document.scrollingElement.scrollWidth * position;

    document.scrollingElement.scrollLeft = snapOffset(offset);
    update(position);
};

var scrollToPartialCfi = function(partialCfi) {
    console.log("ScrollToPartialCfi " + partialCfi);
    var epubCfi = new EpubCFI("epubcfi(/6/2!" + partialCfi + ")");
    var element = document.querySelector(epubCfi.generateHtmlQuery());
    if (element) {
      var textPosition = parseInt(EpubCFI.getCharacterOffsetComponent(partialCfi), 10);
      scrollToElement(element, textPosition);
    }
};

var scrollToEnd = function() {
    if (!isScrollModeEnabled()) {
        console.log("scrollToEnd " + document.scrollingElement.scrollWidth);
        document.scrollingElement.scrollLeft = document.scrollingElement.scrollWidth;
    } else {
        console.log("scrollToBottom " + document.body.scrollHeight);
        document.scrollingElement.scrollTop = document.body.scrollHeight;
        window.scrollTo(0, document.body.scrollHeight);
    }
};

var scrollToStart = function() {
    if (!isScrollModeEnabled()) {
        console.log("scrollToStart " + 0);
        document.scrollingElement.scrollLeft = 0;
    } else {
        console.log("scrollToTop " + 0);
        document.scrollingElement.scrollTop = 0;
        window.scrollTo(0, 0);
    }
};

var scrollToPosition = function(position, dir) {
    console.log("ScrollToPosition " + position);
    if ((position < 0) || (position > 1)) {
        console.log("InvalidPosition");
        return;
    }

    if (!isScrollModeEnabled()) {
        var offset = 0;
        if (dir == 'rtl') {
            offset = (-document.scrollingElement.scrollWidth + window.innerWidth) * (1.0 - position);
        } else {
            offset = document.scrollingElement.scrollWidth * position;
        }
        document.scrollingElement.scrollLeft = snapOffset(offset);
        update(position);
    } else {
        var offset = Math.round(document.body.scrollHeight * position);
        document.scrollingElement.scrollTop = offset;
        window.scrollTo(0, offset);
        update(position);
    }
};

var scrollLeft = function() {
    console.log("scrollLeft");

    var offset = Math.round(window.scrollX - window.innerWidth);
    if (offset >= 0) {
        document.scrollingElement.scrollLeft = snapOffset(offset);
        last_known_scrollX_position = window.scrollX / document.scrollingElement.scrollWidth;
        update(last_known_scrollX_position);
        return "";
    } else {
        document.scrollingElement.scrollLeft = 0;
        update(1.0);
        return "edge"; // Need to previousDocument.
    }
};

var scrollLeftRTL = function() {
    console.log("scrollLeftRTL");

    var scrollWidth = document.scrollingElement.scrollWidth;
    var offset = Math.round(window.scrollX - window.innerWidth);
    var edge = -scrollWidth + window.innerWidth;

    if (window.innerWidth == scrollWidth) {
        // No scroll and default zoom
        return "edge";
    } else {
        // Scrolled and zoomed
        if (offset > edge) {
            document.scrollingElement.scrollLeft = snapOffset(offset)
            return 0;
        } else {
            var oldOffset = window.scrollX;
            document.scrollingElement.scrollLeft = edge;
            var diff = Math.abs(edge - oldOffset) / window.innerWidth;
            // In some case the scrollX cannot reach the position respecting to innerWidth
            if (diff > 0.01) {
                return 0;
            } else {
                return "edge";
            }
        }
    }
};

var scrollRight = function() {
    console.log("scrollRight");
    var offset = Math.round(window.scrollX + window.innerWidth);
    var scrollWidth = document.scrollingElement.scrollWidth;

    if (offset < scrollWidth) {
        console.log("offset < scrollWidth");

        document.scrollingElement.scrollLeft = snapOffset(offset);
        var newScrollPos = window.scrollX / document.scrollingElement.scrollWidth
        if ((newScrollPos - last_known_scrollX_position) > 0.001) {
            last_known_scrollX_position = window.scrollX / document.scrollingElement.scrollWidth;
            update(last_known_scrollX_position);
        } else {
            var newoffset = Math.round(window.scrollX + window.innerWidth);
            document.scrollingElement.scrollLeft = snapOffset(newoffset);
            last_known_scrollX_position = window.scrollX / document.scrollingElement.scrollWidth;
            update(last_known_scrollX_position);
        }
        return "";
    } else {
        console.log("else");
        document.scrollingElement.scrollLeft = scrollWidth;
        last_known_scrollX_position = scrollWidth;
        update(0.0);
        return "edge"; // Need to nextDocument.
    }
};

var scrollRightRTL = function() {
    console.log("scrollRightRTL");

    var scrollWidth = document.scrollingElement.scrollWidth;
    var offset = Math.round(window.scrollX + window.innerWidth);
    var edge = 0;

    if (window.innerWidth == scrollWidth) {
        // No scroll and default zoom
        return "edge";
    } else {
        // Scrolled and zoomed
        if (offset < edge) {
            document.scrollingElement.scrollLeft = snapOffset(offset)
            return 0;
        } else {
            var oldOffset = window.scrollX;
            document.scrollingElement.scrollLeft = edge;
            var diff = Math.abs(edge - oldOffset) / window.innerWidth;
            // In some case the scrollX cannot reach the position respecting to innerWidth
            if (diff > 0.01) {
                return 0;
            } else {
                return "edge";
            }
        }
    }
};

// Snap the offset to the screen width (page width).
var snapOffset = function(offset) {
    var value = offset + 1;
    return value - (value % window.innerWidth);
};

/// User Settings.

// For setting user setting.
var setProperty = function(key, value) {
    var root = document.documentElement;

    root.style.setProperty(key, value);
};

// For removing user setting.
var removeProperty = function(key) {
    var root = document.documentElement;

    root.style.removeProperty(key);
};


// TODO Work In Progress

//Highlighting related
var setHighlight = function() {
        var paragraphs = document.getElementsByClassName("highlighted");
	for (var i=0 ; i<paragraphs.length ; i++) {
		if (paragraphs[i].style.backgroundColor != "yellow") {
			paragraphs[i].style.backgroundColor = "yellow";
		} else {
			var parentNode = paragraphs[i].parentNode;

			var frag = (function() {
				var wrap = document.createElement('div'),
				    fragm = document.createDocumentFragment();
				wrap.innerHTML = paragraphs[i].textContent;
				while (wrap.firstChild) {
				    fragm.appendChild(wrap.firstChild);
				}
				return fragm;
			    })();

			parentNode.insertBefore(frag, paragraphs[i]);
			parentNode.removeChild(paragraphs[i]);
		}
	}
};

var findUtterance = function(searchText, searchNode) {
    var regex = typeof searchText === 'string' ? new RegExp(searchText, 'g') : searchText,
        childNodes = (searchNode || document.body).childNodes,
        cnLength = childNodes.length,
        excludes = 'html,head,style,title,link,meta,script,object,iframe';

    while (cnLength--) {
        var currentNode = childNodes[cnLength];

        if (currentNode.nodeType === 1 && (excludes + ',').indexOf(currentNode.nodeName.toLowerCase() + ',') === -1) {
            arguments.callee(searchText, currentNode);
        }

        if (currentNode.nodeType !== 3 || !currentNode.data.includes(searchText)) {
	        //console.log("(Node " + cnLength + ", " + currentNode.nodeType + ", " + currentNode.data + ") isn't what I'm looking for");
            continue;
        }
	    //console.log("data : " + typeof currentNode.data);

        var parent = currentNode.parentNode;
	    var frag = (function() {
		var spanBegin = "<span class=\"highlighted\">",
                    spanEnd = "</span>";
                var readByTTS = spanBegin + searchText + spanEnd;
                var html = currentNode.nodeValue.replace(regex, readByTTS),
                    wrap = document.createElement('div'),
                    fragm = document.createDocumentFragment();
                wrap.innerHTML = html;
                while (wrap.firstChild) {
                    fragm.appendChild(wrap.firstChild);
                }
                return fragm;
            })();

	    parent.insertBefore(frag, currentNode);
	    parent.removeChild(currentNode);
	    setHighlight();
    }
};
