/**
 * JavaScript Toolbar Widget
 * David Underhill and James Chen
 */

var JTB = function() {
    /*  private members */
    var toolbars = [];

    /** gets a toolbar object based on its name */
    function getToolbar(name) {
        var i;
        for(i=0; i<toolbars.length; i++) {
            if(toolbars[i].tb_id == name) {
                return toolbars[i];
            }
        }

        return null;
    }

    /** get a child element */
    function getChild(elt, child_name) {
        var children = elt.childNodes;
        var i;

        for(i=0; i<children.length; i++) {
            try {
                var c = children[i];
                var name = c.getAttribute('id');
                if(name == child_name) {
                    return c;
                }
            }
            catch(err) {}
        }
        return null;
    }

    /** refreshes the attributes of the toolbar div */
    function refreshToolbarAttrs(tb) {
        /* setup the pin/unpin icon */
        var divPinIcon = getChild(tb.tb_elt, tb.getToolbarPinIconEltName());
        if(tb.isShowPinIcon()) {
            /* show it */
            var imgName = tb.getImagePath() + (tb.isPinned() ? 'pin.gif' : 'unpin.gif');
            var left = tb.native_width - 17;
            divPinIcon.setAttribute('style', 'background-image: url(' + imgName + ')');
            divPinIcon.style.display = 'inline';
            divPinIcon.style.position = 'absolute';
            divPinIcon.style.top = '5px';
            divPinIcon.style.left = left + 'px';
            divPinIcon.style.width = '16px';
            divPinIcon.style.height = '16px';
        }
        else {
            /* hide it */
            divPinIcon.style.display = 'none';
        }
    }

    /** adds a toolbar to its parent */
    function removeToolbarFromDOM(tb) {
        var parent = document.getElementById(tb.content_id);
        try {
            parent.removeChild(tb.tb_elt);
        }
        catch(err) {
            /* ignore */
        }
    }

    /** adds a toolbar to its parent */
    function addToolbarToDOM(tb) {
        removeToolbarFromDOM(tb);
        refreshToolbarAttrs(tb);

        var parent = document.getElementById(tb.content_id);
        parent.insertBefore(tb.tb_elt, parent.firstChild);
    }

    /** setup the show/hide handler for the toolbar */
    function setupProximityHandler(tb) {
        var parent = document.getElementById(tb.content_id);
        parent.setAttribute('onmousemove', 'JTB.handleMouseMove("' + tb.tb_id + '", event);');
    }

    /** updates the toolbar's size and position based on the ongoing animation */
    function handleToolbarAnimation(tb) {
        /* compute how far done (%) the animation is */
        var millisElapsed = new Date().getTime() - tb.anim_start;
        var percentDone = millisElapsed / tb.animation_len_msec;

        /* update position and size */
        var es = tb.tb_elt.style;
        es.left   = ((percentDone*tb.dst_left)   + ((1.0-percentDone)*tb.src_left))   + 'px';
        es.top    = ((percentDone*tb.dst_top)    + ((1.0-percentDone)*tb.src_top))    + 'px';
        es.width  = ((percentDone*tb.dst_width)  + ((1.0-percentDone)*tb.src_width))  + 'px';
        es.height = ((percentDone*tb.dst_height) + ((1.0-percentDone)*tb.src_height)) + 'px';

        if(es.width=='0px' || es.height=='0px') {
            es.display = 'none';
        }
        else {
            es.display = 'inline';
        }

        /* periodically call this method until the animation is done */
        if(percentDone < 1) {
            setTimeout('JTB.handleAnimationCallback("' + tb.tb_id + '");', JTB.ANIM_INTERVAL_MSEC);
        }
    }

    /* export public members */
    return {
        /* public constants */
        VERSION        : "0.1",
        DOCK_LEFT      : "left",
        DOCK_RIGHT     : "right",
        DOCK_TOP       : "top",
        DOCK_BOTTOM    : "bottom",
        STATE_VIS      : "vis",
        STATE_INVIS    : "invis",
        ANIM_INTERVAL_MSEC : 25,

        /**
         * Toolbar link constructor
         */
        ToolbarLink : function() {
            this.name = arguments[0];
            this.link = arguments[1];
        },

        /**
         * Toolbar constructor
         * @param content_name  name of the element the toolbar is attached to
         * @param tb_name       name of the element to use or make for the toolbar
         * @param ...           remaining arguments specify name-link pairs
         */
        Toolbar : function(content_name, tb_name) {
            /* name of the element which is the toolbar is attached to */
            this.content_id     = content_name;

            /* name of the div which contains the toolbar */
            this.tb_id          = tb_name;

            /* the element which is the div */
            this.tb_elt         = null;

            /* where the tb is coming from / heading (position and size) */
            this.src_left       = 0;
            this.src_top        = 0;
            this.src_width      = 0;
            this.src_height     = 0;
            this.dst_left       = 0;
            this.dst_top        = 0;
            this.dst_width      = 0;
            this.dst_height     = 0;
            this.native_width   = 0;
            this.native_height  = 0;

            /* time the toolbar animation started */
            this.anim_start     = -1;

            /* where to place our div relative to its parent */
            this.dock           = JTB.DOCK_BOTTOM;

            /* whether to show the pin/unpin graphic */
            this.show_pin       = true;

            /* path to icon location */
            this.img_path       = 'images/';

            /* whether the toolbar is currently pinned */
            this.pinned         = true;

            /* whether the toolbar is visible, invis, or transitioning */
            this.state          = JTB.STATE_VIS;

            /* number of milliseconds for the toolbar to slide in/out */
            this.animation_len_msec = 250;

            /* pixels from the edge which triggers the toolbar to show */
            this.trigger_dist   = 100;

            /* array of ToolbarLink objects to show in the toolbar div */
            this.links          = [];

            /* register the toolbar so we can find it later */
            toolbars[toolbars.length] = this;

            /* create the div if it doesn't exist */
            this.tb_elt = document.getElementById(tb_name);
            if(this.tb_elt === null) {
                this.tb_elt = document.createElement("div");
                this.tb_elt.setAttribute('id', tb_name);
            }
            else {
                /* remove the toolbar from its current parent */
                this.tb_elt.parentNode.removeChild(this.tb_elt);
            }
            this.setDockLocation(JTB.DOCK_BOTTOM);

            /* create a div to put the links in within the toolbar */
            var divLinks = document.createElement("div");
            divLinks.setAttribute('id', this.getToolbarLinksEltName());
            this.tb_elt.appendChild(divLinks);

            /* create a div to put the pin icon in within the toolbar */
            var divPinIcon = document.createElement("div");
            divPinIcon.setAttribute('id', this.getToolbarPinIconEltName());
            divPinIcon.setAttribute('onclick', 'JTB.handlePinClickEvent("' + tb_name + '");');
            this.tb_elt.appendChild(divPinIcon);

            addToolbarToDOM(this);

            /* create the requested links */
            if(arguments.length > 1) {
                var i, name, link;
                for(i=1; i<arguments.length/2; i+=1) {
                    name = arguments[2*i];
                    link = arguments[2*i+1];
                    this.links[i-1] = new JTB.ToolbarLink(name, link);
                }
            }
            this.refreshLinks();
            setupProximityHandler(this);
        },

        init : function() {
            /** return the HTML representation of this link object */
            JTB.ToolbarLink.prototype.makeLink = function() {
                return '<a href="' + this.link + '">' + this.name + '</a>';
            };

            /** get the name of the element the toolbar is attached to */
            JTB.Toolbar.prototype.getContentName = function() {
                return this.content_id;
            };

            /** set the name of the element the toolbar is attached to */
            JTB.Toolbar.prototype.setContentName = function(content_name) {
                this.content_id = content_name;
                return this;
            };

            /** return the name of the element containing the toolbar */
            JTB.Toolbar.prototype.getToolbarName = function() {
                return this.tb_id;
            };

            /** return the name of the element containing the basic links */
            JTB.Toolbar.prototype.getToolbarLinksEltName = function() {
                return this.tb_id + "_links";
            };

            /** return the name of the element containing the attached content */
            JTB.Toolbar.prototype.getToolbarContentContainerEltName = function() {
                return this.tb_id + "_content";
            };

            /** return the name of the div containing the toolbar pin icon */
            JTB.Toolbar.prototype.getToolbarPinIconEltName = function() {
                return this.tb_id + "_pinicon";
            };

            /** set the name of the element containing the toolbar */
            JTB.Toolbar.prototype.setToolbarName = function(tb_name) {
                var tb = document.getElementById(tb_name);
                if(tb == null) {
                    return;
                }

                removeToolbarFromDOM(this);
                this.tb_id = tb_name;
                this.tb_elt = tb;
                addToolbarToDOM(this);
                return this;
            };

            /** get the location of the toolbar on its parent */
            JTB.Toolbar.prototype.getDockLocation = function() {
                return this.dock;
            };

            /** set the location of the toolbar on its parent */
            JTB.Toolbar.prototype.setDockLocation = function(dock) {
                this.dock = dock;
                /* TODO: put toolbar at the appropriate place */
                return this;
            };

            /** get whether the pin icon is showing */
            JTB.Toolbar.prototype.isShowPinIcon = function() {
                return this.show_pin;
            };

            /** set whether the pin icon is showing */
            JTB.Toolbar.prototype.setShowPinIcon = function(b) {
                this.show_pin = b;
                return this;
            };

            /** get the path to the location where images are stored */
            JTB.Toolbar.prototype.getImagePath = function() {
                return this.img_path;
            };

            /** set the path to the location where images are stored */
            JTB.Toolbar.prototype.setImagePath = function(path) {
                this.img_path = path;
                refreshToolbarAttrs(this);
                return this;
            };

            /** get whether the toolbar is pinned */
            JTB.Toolbar.prototype.isPinned = function() {
                return this.pinned;
            };

            /** set whether the toolbar is pinned */
            JTB.Toolbar.prototype.setPinned = function(b) {
                this.pinned = b;
                return this;
            };

            /** get the state of the toolbar's visibility */
            JTB.Toolbar.prototype.getState = function() {
                return this.state;
            };

            /** get the number of milliseconds the animation will last */
            JTB.Toolbar.prototype.getAnimationLength = function() {
                return this.animation_len_msec;
            };

            /** set the number of milliseconds the animation will last */
            JTB.Toolbar.prototype.setAnimationLength = function(msec) {
                this.animation_len_msec = msec;
                return this;
            };

            /** get the # of pixels from the edge at which the toolbar will popup */
            JTB.Toolbar.prototype.getTriggerDistance = function() {
                return this.trigger_dist;
            };

            /** set the # of pixels from the edge at which the toolbar will popup */
            JTB.Toolbar.prototype.setTriggerDistance = function(d) {
                this.trigger_dist = d;
                return this;
            };

            /** get the array of ToolbarLinks links associated with the toolbar */
            JTB.Toolbar.prototype.getLinks = function() {
                return this.links;
            };

            /** add a link to the toolbar (at the end of the array) */
            JTB.Toolbar.prototype.addLink = function(name, link) {
                this.insertLink(this.links.length, name, link);
                return this;
            };

            /** insert a link into the array of basic toolbar links */
            JTB.Toolbar.prototype.insertLink = function(index, name, link) {
                var i, len;
                len = this.links.length;

                if(index > len || index < 0) {
                    throw("bad index in Toolbar.insertLink");
                }

                for(i=len; i>=index; i--) {
                    this.links[i] = this.links[i-1];
                }

                this.links[index] = new JTB.ToolbarLink(name, link);
                this.refreshLinks();
                return this;
            };

            /** remove a link from the array of basic toolbar links */
            JTB.Toolbar.prototype.removeLink = function(index) {
                var i, len;
                len = this.links.length;
                for(i=index; i<len-1; i++) {
                    this.links[i] = this.links[i+1];
                }

                this.refreshLinks();
                return this;
            };

            /** refresh the links shown in the toolbar */
            JTB.Toolbar.prototype.refreshLinks = function() {
                var i, len, divLinks;

                divLinks = document.getElementById(this.getToolbarLinksEltName());
                divLinks.innerHTML = "";

                len = this.links.length;
                for(i=0; i<len; i++) {
                    divLinks.innerHTML += this.links[i].makeLink();
                }

                this.native_width  = this.tb_elt.offsetWidth;
                this.native_height = this.tb_elt.offsetHeight;
            };

            /**
             * start a toolbar animation (any negatively-valued parameter means
             * don't change that field)
             */
            JTB.Toolbar.prototype.animate = function(l, t, w, h) {
                var es = this.tb_elt.style;
                this.src_left   = es.left;
                this.src_top    = es.top;
                this.src_width  = es.width;
                this.src_height = es.height;

                this.dst_left   = ((l == -1) ? this.src_left   : l);
                this.dst_top    = ((t == -1) ? this.src_top    : l);
                this.dst_width  = ((w == -1) ? this.src_width  : l);
                this.dst_height = ((h == -1) ? this.src_height : l);

                this.anim_start = new Date().getTime();
                handleToolbarAnimation(this);
            };

            /** called when the mouse moves on the toolbar's parent */
            JTB.handleMouseMove = function(tb_id, event) {
                var tb = getToolbar(tb_id);
                if(tb === null || tb.pinned) {
                    return; /* do nothing if tb is pinned */
                }

                /* determine if we should be showing the toolbar and how to
                 * animate it into the correct position */
                var parent = document.getElementById(tb.content_id);
                var show = false;
                var l=0, t=0, w=0, h=0;
                switch(tb.dock) {
                case JTB.DOCK_TOP:
                    if(tb.trigger_dist <= event.offsetY) {
                        show = true;
                    }
                    else {
                        w = tb.native_width;
                    }
                    break;
                case JTB.DOCK_BOTTOM:
                    if(tb.trigger_dist <= (tb.tb_elt.style.height - event.offsetY)) {
                        show = true;
                        t = parent.style.height - tb.native_height;
                    }
                    else {
                        t = parent.style.height;
                        w = tb.native_width;
                        h = 0;
                    }
                    break;
                case JTB.DOCK_LEFT:
                    if(tb.trigger_dist <= event.offsetX) {
                        show = true;
                    }
                    else {
                        h = tb.native_height;
                    }
                    break;
                case JTB.DOCK_RIGHT:
                    if(tb.trigger_dist <= (tb.tb_elt.style.width - event.offsetX)) {
                        show = true;
                        l = parent.style.width - tb.native_width;
                    }
                    else {
                        l = parent.style.width;
                        w = 0;
                        h = tb.native_height;
                    }
                    break;
                }

                /* if the state changed, update it and perform an animation */
                if(show && tb.state!=JTB.STATE_VIS) {
                    tb.state = JTB.STATE_VIS;
                    tb.animate(l, t, tb.native_width, tb.native_height);
                }
                else if(!show && tb.state!=JTB.STATE_INVIS) {
                    tb.state = JTB.STATE_INVIS;
                    tb.animate(l, t, w, h);
                }
            };

            /** handle a click on a pin icon */
            JTB.handlePinClickEvent = function(tb_id) {
                var tb = getToolbar(tb_id);
                if(tb === null) {
                    return;
                }

                tb.pinned = !tb.pinned;
                tb.state = JTB.STATE_VIS;
                refreshToolbarAttrs(tb);
            };

            /** handle callback for an animation event */
            JTB.handleAnimationCallback = function(tb_id) {
                var tb = getToolbar(tb_id);
                if(tb === null) {
                    return;
                }

                handleToolbarAnimation(tb);
            };
        }
    };
}();
JTB.init();
