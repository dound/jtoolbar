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
            this.tb_width   = 0;
            this.tb_height  = 0;

            /* time the toolbar animation started */
            this.anim_start     = -1;

            /* where to place our div relative to its parent */
            this.dock           = JTB.DOCK_LEFT;

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

            /* create the requested links */
            if(arguments.length > 1) {
                var i, name, link;
                for(i=1; i<arguments.length/2; i+=1) {
                    name = arguments[2*i];
                    link = arguments[2*i+1];
                    this.links[i-1] = new JTB.ToolbarLink(name, link);
                }
            }

            this.hookup();
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

            /** get the parent element of the toolbar and its attached content */
            JTB.Toolbar.prototype.getParent = function() {
                return document.getElementById(tb.content_id).parentNode;
            };

            /** get the container element which holds toolbar and its attached content */
            JTB.Toolbar.prototype.getContainer = function() {
                return document.getElementById(this.getToolbarContainerEltName());
            };

            /** get the content element to which the toolbar is attached */
            JTB.Toolbar.prototype.getContent = function() {
                return document.getElementById(this.getContentName());
            };

            /** return the name of the element containing the toolbar */
            JTB.Toolbar.prototype.getToolbarName = function() {
                return this.tb_id;
            };

            /** return the name of the element containing the basic links */
            JTB.Toolbar.prototype.getToolbarLinksEltName = function() {
                return this.tb_id + "_links";
            };

            /** return the name of the element containing the toolbar and attached content */
            JTB.Toolbar.prototype.getToolbarContainerEltName = function() {
                return this.tb_id + "_container";
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

                this.tb_id = tb_name;
                this.getContainer().replaceChild(tb, this.tb_elt);
                this.tb_elt = tb;

                return this;
            };

            /** get the location of the toolbar on its parent */
            JTB.Toolbar.prototype.getDockLocation = function() {
                return this.dock;
            };

            /** set the location of the toolbar on its parent */
            JTB.Toolbar.prototype.setDockLocation = function(dock) {
                this.dock = dock;
                this.refreshToolbarGfx();
                return this;
            };

            /** set toolbar attributes so it displays according to the current Toolbar state */
            JTB.Toolbar.prototype.refreshToolbarGfx = function() {
                var container = this.getContainer();
                var display   = '';

                /* put the toolbar and content in correct order in container */
                switch(this.dock) {
                case JTB.DOCK_LEFT:
                case JTB.DOCK_TOP:
                    var content = this.getContent();
                    container.appendChild(content); /* make sure content is at the end */
                    display = ((this.dock == JTB.DOCK_LEFT) ? 'table-cell' : 'table-row');
                    break;

                case JTB.DOCK_RIGHT:
                case JTB.DOCK_BOTTOM:
                    container.appendChild(this.tb_elt); /* make sure toolbar is at the end */
                    display = ((this.dock == JTB.DOCK_RIGHT) ? 'table-cell' : 'table-row');
                    break;
                }
                this.tb_elt.style.display = display;
                content.style.display = display;

                /* setup the pin/unpin icon */
                this.refreshPinGfx();

                /* rebuild the links */
                this.refreshLinks();
                return this;
            };

            /** set pin icon attributes so it displays according to the current Toolbar state */
            JTB.Toolbar.prototype.refreshPinGfx = function() {
                var divPinIcon = getChild(this.tb_elt, this.getToolbarPinIconEltName());
                if(this.isShowPinIcon()) {
                    /* show it */
                    var imgName = this.getImagePath() + (this.isPinned() ? 'pin.gif' : 'unpin.gif');
                    divPinIcon.style.backgroundImage = 'url(' + imgName + ')';
                    divPinIcon.style.display = 'block';
                }
                else {
                    /* hide it */
                    divPinIcon.style.display = 'none';
                }

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
                this.refreshPinGfx();
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

                this.tb_width  = this.tb_elt.offsetWidth;
                this.tb_height = this.tb_elt.offsetHeight;
            };

            /* create and hook the toolbar into the UI (assumes it is not already hooked in */
            JTB.Toolbar.prototype.hookup = function() {
                /* get the toolbar element */
                this.tb_elt = document.getElementById(this.tb_id);
                if(this.tb_elt === null) {
                    /* create the toolbar if it doesn't exist */
                    this.tb_elt = document.createElement("div");
                    this.tb_elt.setAttribute('id', this.tb_id);
                }
                else {
                    /* remove the toolbar from its current parent */
                    this.tb_elt.parentNode.removeChild(this.tb_elt);
                }

                /* create a div to hold the toolbar and its attached content */
                var divContainer = document.createElement("div");
                divContainer.setAttribute('id', this.getToolbarContainerEltName());

                /* remove the content for now */
                var divContent = document.getElementById(this.content_id);
                var parent = divContent.parentNode;
                parent.removeChild(divContent);

                /* give container position, size, and layout properties of orig content */
                divContainer.style.display = divContent.style.display;
                divContainer.style.height  = divContent.style.height;
                divContainer.style.left    = divContent.style.left;
                divContainer.style.top     = divContent.style.top;
                divContainer.style.width   = divContent.style.width;

                /* clear the copied properties from the content */
                divContent.style.display = '';
                divContent.style.height  = '';
                divContent.style.left    = '';
                divContent.style.top     = '';
                divContent.style.width   = '';

                /* create a div to put the links in within the toolbar */
                var divLinks = document.createElement("div");
                divLinks.setAttribute('id', this.getToolbarLinksEltName());
                this.tb_elt.appendChild(divLinks);

                /* create a div to put the pin icon in within the toolbar */
                var divPinIcon = document.createElement("div");
                divPinIcon.setAttribute('id', this.getToolbarPinIconEltName());
                divPinIcon.setAttribute('onclick', "JTB.handlePinClickEvent('" + this.tb_id + "');");
                divPinIcon.style.backgroundRepeat = 'no-repeat';
                divPinIcon.style.border = '1px solid black';
                divPinIcon.style.width = '16px';
                divPinIcon.style.height = '16px';
                divPinIcon.style.cssFloat = 'right';
                divPinIcon.style.margin = '3px 3px 3px 3px';
                this.tb_elt.insertBefore(divPinIcon, this.tb_elt.childNodes[0]);

                /* setup the show/hide handler for the toolbar */
                divContainer.setAttribute('onmousemove', "JTB.handleMouseMove('" + this.tb_id + "', event);");

                /* put our new elements into the DOM */
                divContainer.appendChild(this.tb_elt);
                divContainer.appendChild(divContent);
                parent.appendChild(divContainer);

                this.refreshToolbarGfx();
            };

            /** unhook the toolbar from the UI (assumes it is currently hooked in) */
            JTB.Toolbar.prototype.unhook = function() {
                /* TODO */
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
                var container = tb.getContainer();
                var show = false;
                var l=0, t=0, w=0, h=0;
                switch(tb.dock) {
                case JTB.DOCK_TOP:
                    if(tb.trigger_dist <= event.offsetY) {
                        show = true;
                    }
                    else {
                        w = tb.tb_width;
                    }
                    break;
                case JTB.DOCK_BOTTOM:
                    if(tb.trigger_dist <= (tb.tb_elt.offsetHeight - event.offsetY)) {
                        show = true;
                        t = container.offsetHeight - tb.tb_height;
                    }
                    else {
                        t = container.offsetHeight;
                        w = tb.tb_width;
                        h = 0;
                    }
                    break;
                case JTB.DOCK_LEFT:
                    if(tb.trigger_dist <= event.offsetX) {
                        show = true;
                    }
                    else {
                        h = tb.tb_height;
                    }
                    break;
                case JTB.DOCK_RIGHT:
                    if(tb.trigger_dist <= (tb.tb_elt.offsetWidth - event.offsetX)) {
                        show = true;
                        l = container.offsetWidth - tb.tb_width;
                    }
                    else {
                        l = container.offsetWidth;
                        w = 0;
                        h = tb.tb_height;
                    }
                    break;
                }

                /* if the state changed, update it and perform an animation */
                if(show && tb.state!=JTB.STATE_VIS) {
                    tb.state = JTB.STATE_VIS;
                    tb.animate(l, t, tb.tb_width, tb.tb_height);
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
                this.refreshPinGfx();
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
