/**
 * JavaScript Toolbar Widget
 * David Underhill and James Chen
 */

var JTB = function() {
    /*  private members */
    var toolbars = [];
    var mouseX, mouseY;
    var animSplit = 0.0;


    var debugMode = false;
    var MAX_DEBUG_LINES = 5;
    var debugLines = [MAX_DEBUG_LINES];
    function debug(newstr) {
        var i, str="";
        for(i=MAX_DEBUG_LINES-2; i>=0; i--) {
            if(debugLines[i] !== undefined) {
                str = '<br/>' + debugLines[i] + str;
                debugLines[i+1] = debugLines[i];
            }
        }
        str = '<br/>' + newstr + str;
        debugLines[0] = newstr;

        if(debugMode) {
            document.getElementById('debug').innerHTML = str;
        }
    }

    function findPosX(obj) {
        var curleft = 0;
        if(obj.offsetParent) {
            while(1) {
                curleft += obj.offsetLeft;
                if(!obj.offsetParent) {
                    break;
                }
                obj = obj.offsetParent;
            }
        }
        else if(obj.x) {
            curleft += obj.x;
        }

        return curleft;
    }

    function findPosY(obj) {
        var curtop = 0;
        if(obj.offsetParent) {
            while(1) {
                curtop += obj.offsetTop;
                if(!obj.offsetParent) {
                    break;
                }
                obj = obj.offsetParent;
            }
        }
        else if(obj.y) {
            curtop += obj.y;
        }

        return curtop;
    }

    /** returns the effective z-index of the object */
    function findZIndex(obj) {
        var z = obj.style.zIndex;
        if(z === '') {
            if(obj.parentNode==document.body || obj.prentNode===null) {
                return 0;
            }
            else {
                return findZIndex(obj.parentNode);
            }
        }
        else {
            return z;
        }
    }

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
        if(percentDone > 1.0) {
            percentDone = 1.0;
        }

        /* update position and size */
        var es = tb.e_tb.style;
        var p;
        if(percentDone <= animSplit) {
            p = percentDone / animSplit;
            es.left   = parseInt((p*tb.int_left)   + ((1.0-p)*tb.src_left),   10) + 'px';
            es.top    = parseInt((p*tb.int_top)    + ((1.0-p)*tb.src_top),    10) + 'px';
            es.width  = parseInt((p*tb.int_width)  + ((1.0-p)*tb.src_width),  10) + 'px';
            es.height = parseInt((p*tb.int_height) + ((1.0-p)*tb.src_height), 10) + 'px';
        }
        else {
            p = (percentDone - animSplit) / (1.0 - animSplit);
            es.left   = parseInt((p*tb.dst_left)   + ((1.0-p)*tb.int_left),   10) + 'px';
            es.top    = parseInt((p*tb.dst_top)    + ((1.0-p)*tb.int_top),    10) + 'px';
            es.width  = parseInt((p*tb.dst_width)  + ((1.0-p)*tb.int_width),  10) + 'px';
            es.height = parseInt((p*tb.dst_height) + ((1.0-p)*tb.int_height), 10) + 'px';
        }

        /* periodically call this method until the animation is done */
        if(percentDone < 1) {
            setTimeout('JTB.handleAnimationCallback("' + tb.tb_id + '");', JTB.ANIM_INTERVAL_MSEC);
        }
        else {
            tb.refreshGfx();
            tb.anim_start = -1;
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
         * Helps determine what size an element should be.  It allows width
         * and/or the height dimensions to be forced to a specific value if
         * desired.
         */
        SizeHelper : function(e) {
            /** the element this handles size for */
            this.e = e;

            /** true if width refers to a forced width, else a natural one */
            this.forced_width = false;

            /** true if height refers to a forced height, else a natural one */
            this.forced_height = false;

            /** the width of this element when it is visible */
            this.width = 0;

            /** the height of this element when it is visible */
            this.height = 0;

            /** the default width of this element when it is visible */
            this.default_width = '';

            /** the default height of this element when it is visible */
            this.default_height = '';

            /* set the forced sizes if they exist */
            if(e.style.width !== '') {
                this.forced_width = true;
                this.width = e.style.width;
                this.default_width = e.style.width;
            }
            if(e.style.height !== '') {
                this.forced_height = true;
                this.height = e.style.height;
                this.default_height = e.style.height;
            }

            this.refreshSizeData();
        },

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

            /* elements which compose the toolbar */
            this.e_container      = null;
            this.e_content        = null;
            this.e_tb             = null;
            this.e_icon_pin       = null;
            this.e_links          = null;

            /* sizing information helpers */
            this.sz_container     = null;
            this.sz_tb            = null;

            /* where the tb is coming from / heading (position and size) */
            this.src_left       = 0;
            this.src_top        = 0;
            this.src_width      = 0;
            this.src_height     = 0;
            this.int_left       = 0;
            this.int_top        = 0;
            this.int_width      = 0;
            this.int_height     = 0;
            this.dst_left       = 0;
            this.dst_top        = 0;
            this.dst_width      = 0;
            this.dst_height     = 0;

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

            /** whether the toolbar always takes up space (even when unpinned) */
            this.alwaysShiftContent = false;

            /* whether the toolbar is visible, invis, or transitioning */
            this.state          = JTB.STATE_VIS;

            /* number of milliseconds for the toolbar to slide in/out */
            this.animation_len_msec = 400;

            /* whether to use the spring animation or not */
            this.anim_springy   = true;

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
            /** refresh the internal data about how much space this elt uses */
            JTB.SizeHelper.prototype.refreshSizeData = function() {
                if(this.forced_width && this.forced_height) {
                    /* nothing to do: just go with the forced values */
                    return;
                }

                /* unset any dimensions which are not forced */
                var w = this.e.style.width;
                var h = this.e.style.height;
                if(!this.forced_width) {
                    this.e.style.width = '';
                }
                if(!this.forced_height) {
                    this.e.style.height = '';
                }

                /* make sure the element is visible and unrestricted so we can
                   get its preferred size */
                var dis = this.e.style.display;
                var pos = this.e.style.position;
                if(dis == 'none') { this.e.style.display = 'block'; }
                this.e.style.position = 'absolute';

                /* get the preferred sizes */
                if(!this.forced_width) {
                    this.width = this.e.offsetWidth;
                }
                if(!this.forced_height) {
                    this.height = this.e.offsetHeight;
                }

                /* restore the original style */
                if(dis == 'none') { this.e.style.display = dis; }
                this.e.style.position = pos;
                this.e.style.width = w;
                this.e.style.height = h;
            };

            /** require the element to have the specified width */
            JTB.SizeHelper.prototype.forceWidth = function(w) {
                if(w === '') {
                    this.useNaturalWidth();
                }
                else if(!this.forced_width || this.width!=w) {
                    this.forced_width = true;
                    this.width = w;
                    this.refreshSizeData();
                }
            };

            /** require the element to have the specified height */
            JTB.SizeHelper.prototype.forceHeight = function(h) {
                if(h === '') {
                    this.useNaturalHeight();
                }
                else if(!this.forced_height || this.height!=h) {
                    this.forced_height = true;
                    this.height = h;
                    this.refreshSizeData();
                }
            };

            /** make the current width the required width */
            JTB.SizeHelper.prototype.forceCurrentWidth = function() {
                this.forced_width = true;
            };

            /** make the current height the required height */
            JTB.SizeHelper.prototype.forceCurrentHeight = function() {
                this.forced_height = true;
            };

            /** make the current width and height the required size */
            JTB.SizeHelper.prototype.forceCurrent = function() {
                this.forceCurrentWidth();
                this.forceCurrentHeight();
            };

            /** make the current forced width the default width */
            JTB.SizeHelper.prototype.resetToDefaultWidth = function() {
                this.forceWidth(this.default_width);
            };

            /** make the current forced height the default height */
            JTB.SizeHelper.prototype.resetToDefaultHeight = function() {
                this.forceHeight(this.default_height);
            };

            /** make the element use whatever its natural width is */
            JTB.SizeHelper.prototype.useNaturalWidth = function() {
                if(this.forced_width) {
                    this.forced_width = false;
                    this.refreshSizeData();
                }
            };

            /** make the element use whatever its natural height is */
            JTB.SizeHelper.prototype.useNaturalHeight = function() {
                if(this.forced_height) {
                    this.forced_height = false;
                    this.refreshSizeData();
                }
            };

            /** update the size of the element based on our data */
            JTB.SizeHelper.prototype.setToBestSize = function() {
                this.e.style.width  = this.width  + 'px';
                this.e.style.height = this.height + 'px';
            };

            /** gets the width the element uses when it is visible */
            JTB.SizeHelper.prototype.getVisWidth = function() {
                return this.width;
            };

            /** gets the height the element uses when it is visible */
            JTB.SizeHelper.prototype.getVisHeight = function() {
                return this.height;
            };

            /** gets the current width of the element */
            JTB.SizeHelper.prototype.getCurWidth = function() {
                return this.e.offsetWidth;
            };

            /** gets the current height of the element */
            JTB.SizeHelper.prototype.getCurHeight = function() {
                return this.e.offsetHeight;
            };


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
                return this.e_content.parentNode;
            };

            /** get the container element which holds toolbar and its attached content */
            JTB.Toolbar.prototype.getContainer = function() {
                return this.e_container;
            };

            /** get the content element to which the toolbar is attached */
            JTB.Toolbar.prototype.getContent = function() {
                return this.e_content;
            };

            /** return the name of the element containing the toolbar */
            JTB.Toolbar.prototype.getToolbarName = function() {
                return this.tb_id;
            };

            /** set the name of the element containing the toolbar */
            JTB.Toolbar.prototype.setToolbarName = function(tb_name) {
                var tb = document.getElementById(tb_name);
                if(tb === null) {
                    return;
                }

                this.tb_id = tb_name;
                this.getContainer().replaceChild(tb, this.e_tb);
                this.e_tb = tb;

                return this;
            };

            /** get the location of the toolbar on its parent */
            JTB.Toolbar.prototype.getDockLocation = function() {
                return this.dock;
            };

            /** set the location of the toolbar on its parent */
            JTB.Toolbar.prototype.setDockLocation = function(dock) {
                this.dock = dock;
                this.refreshGfx();
                return this;
            };

            /** set toolbar attributes so it displays according to the current Toolbar state */
            JTB.Toolbar.prototype.refreshGfx = function() {
                var container = this.getContainer();
                var content = this.getContent();

                /* efficiency: hide the toolbar container while we arrange it */
                var origDisp = container.style.display;
                container.style.display = '';

                /* show/hide toolbar based on its state */
                this.e_tb.style.display = ((this.getState() == JTB.STATE_VIS) ? 'block' : 'none');

                /* setup the pin/unpin icon */
                this.refreshPinGfx();

                /* show it again */
                container.style.display = origDisp;

                return this;
            };

            /** set pin icon attributes so it displays according to the current Toolbar state */
            JTB.Toolbar.prototype.refreshPinGfx = function() {
                var es = this.e_icon_pin.style;
                if(this.isShowPinIcon()) {
                    /* show it */
                    var imgName = this.getImagePath() + (this.isPinned() ? 'pin.gif' : 'unpin.gif');
                    es.backgroundImage = 'url(' + imgName + ')';
                    es.display = 'block';
                }
                else {
                    /* hide it */
                    es.display = 'none';
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

            /** show or hide the toolbar */
            JTB.Toolbar.prototype.setVisible = function(b) {
                if(b) {
                    this.setState(JTB.STATE_VIS);
                }
                else {
                    this.setState(JTB.STATE_INVIS);
                }
                return this;
            };

            /** update the state and make the transition as appropriate */
            JTB.Toolbar.prototype.setState = function(newState) {
                /* do nothing if the state has not changed */
                if(newState == this.state) {
                    return this;
                }

                /* reject state changes which try to occur during an animation */
                if(this.anim_start != -1) {
                    return false;
                }

                this.state = newState;

                /* determine how to animate it into the correct position */
                var w, h;
                w = this.sz_tb.getWidth();
                h = this.sz_tb.getHeight();
                if(newState != JTB.STATE_VIS) {
                    if(this.dock==JTB.DOCK_TOP || this.dock==JTB.DOCK_BOTTOM) {
                        h = 0;
                    }
                    else {
                        w = 0;
                    }
                }

                /* perform the transition animation */
                this.animate(-1, -1, w, h, this.anim_springy, true);
            };

            /** sets the visibility of the toolbar based on the mouse location */
            JTB.Toolbar.prototype.setStateBasedOnMouse = function() {
                /* always show if pinned */
                if(this.pinned) {
                    this.setVisible(true);
                    return;
                }

                /* determine the max deviation from the top-left corner of the toolbar */
                var vis = (this.getState() == JTB.STATE_VIS);
                var maxdx, maxdy;
                if(vis) {
                    maxdx = this.e_tb.offsetWidth;
                    maxdy = this.e_tb.offsetHeight;
                }
                else {
                    if(this.dock==JTB.DOCK_LEFT || this.dock==JTB.DOCK_RIGHT) {
                        maxdx = this.trigger_dist;
                        maxdy = this.sz_tb.getHeight();
                    }
                    else {
                        maxdx = this.sz_tb.getWidth();
                        maxdy = this.trigger_dist;
                    }
                }

                /* get the position of the toolbar */
                var x = findPosX(this.e_tb);
                var y = findPosY(this.e_tb);

                /* adjust based on docking location */
                if(this.dock == JTB.DOCK_RIGHT) {
                    if(vis) {
                        x -= this.sz_tb.getWidth();
                        maxdx += this.sz_tb.getWidth();
                    }
                    else {
                        x = findPosX(this.e_content) + this.e_content.offsetWidth - this.sz_tb.getWidth();
                    }
                }
                else if(this.dock == JTB.DOCK_BOTTOM) {
                    if(vis) {
                        y -= this.sz_tb.getHeight();
                        maxdy += this.sz_tb.getHeight();
                    }
                    else {
                        y = findPosY(this.e_content) + this.e_content.offsetHeight - this.sz_tb.getHeight();
                    }
                }

                /* display the toolbar iff the mouse is within the maximum deviation */
                this.setVisible(mouseX>=x && mouseX<x+maxdx && mouseY>=y && mouseY<y+maxdy);
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

            /** get whether animations will be springy */
            JTB.Toolbar.prototype.isAnimationSpringy = function() {
                return this.anim_springy;
            };

            /** set whether animations will be springy */
            JTB.Toolbar.prototype.setAnimationSpringy = function(b) {
                this.anim_springy = b;
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
                var i, len;

                this.e_links.innerHTML = "";

                len = this.links.length;
                for(i=0; i<len; i++) {
                    this.e_links.innerHTML += this.links[i].makeLink();
                }

                this.sz_tb.refershSizeData();
                this.refreshGfx();
            };

            /* create and hook the toolbar into the UI (assumes it is not already hooked in */
            JTB.Toolbar.prototype.hookup = function() {
                /* get the toolbar element */
                this.e_tb = document.getElementById(this.tb_id);
                if(this.e_tb === null) {
                    /* create the toolbar if it doesn't exist */
                    this.e_tb = document.createElement("div");
                    this.e_tb.setAttribute('id', this.tb_id);
                }
                else {
                    /* remove the toolbar from its current parent */
                    this.e_tb.parentNode.removeChild(this.e_tb);
                }

                /* crop overflow so animation can smoothly reduce size */
                this.e_tb.style.overflow = 'hidden';

                /* create a div to hold the toolbar and its attached content */
                this.e_container = document.createElement("div");
                this.e_container.setAttribute('id', this.tb_id + "_container");

                /* get the content and its parent */
                this.e_content = document.getElementById(this.content_id);
                var parent = this.e_content.parentNode;

                /* determine where in the parent's list of children the content is */
                var childIndex, nextChild = null;
                for(childIndex=0; childIndex<parent.childNodes.length; childIndex++) {
                    if(parent.childNodes[childIndex] == this.e_content) {
                        if(parent.childNodes.length > childIndex + 1) {
                            nextChild = parent.childNodes[childIndex + 1];
                        }
                        break;
                    }
                }

                /* remove the content for now */
                parent.removeChild(this.e_content);

                /* give container position, size, and layout properties of orig content */
                this.e_container.style.display = this.e_content.style.display;
                this.e_container.style.height  = this.e_content.style.height;
                this.e_container.style.left    = this.e_content.style.left;
                this.e_container.style.top     = this.e_content.style.top;
                this.e_container.style.width   = this.e_content.style.width;
                this.e_container.style.zIndex  = this.e_content.style.zIndex;

                /* clear the copied properties from the content */
                this.e_content.style.display = 'block';
                this.e_content.style.height  = '';
                this.e_content.style.left    = '';
                this.e_content.style.top     = '';
                this.e_content.style.width   = '';

                /* create a div to put the links in within the toolbar */
                this.e_links = document.createElement("div");
                this.e_links.setAttribute('id', this.tb_id + "_links");
                this.e_tb.appendChild(this.e_links);

                /* create a div to put the pin icon in within the toolbar */
                this.e_icon_pin = document.createElement("div");
                this.e_icon_pin.setAttribute('id', this.tb_id + "_icon_pin");
                this.e_icon_pin.setAttribute('onclick', "JTB.handlePinClickEvent('" + this.tb_id + "');");
                this.e_icon_pin.style.backgroundRepeat = 'no-repeat';
                this.e_icon_pin.style.border = '1px solid black';
                this.e_icon_pin.style.width = '16px';
                this.e_icon_pin.style.height = '16px';
                this.e_icon_pin.style.cssFloat = 'right';
                this.e_icon_pin.style.margin = '3px 3px 3px 3px';
                this.e_tb.insertBefore(this.e_icon_pin, this.e_tb.childNodes[0]);

                /* setup the show/hide handler for the toolbar */
                this.e_container.setAttribute('onmousemove', "JTB.handleMouseMove('" + this.tb_id + "', event);");

                /* toolbar and content will be absolutely positioned within the container */
                this.e_tb.style.position = 'absolute';
                this.e_content.style.position = 'absolute';

                /* toolbar just in front of the content */
                var z = findZIndex(this.e_content);
                this.e_tb.style.zIndex = z + 1;
                this.e_content.style.zIndex = z;

                /* put our new elements into the DOM */
                this.e_container.appendChild(this.e_tb);
                this.e_container.appendChild(this.e_content);

                if(nextChild === null) {
                    parent.appendChild(this.e_container);
                }
                else {
                    parent.insertBefore(this.e_container, nextChild);
                }

                /* create size helpers */
                this.sz_container = new JTB.SizeHelper(this.container);
                this.sz_tb = new JTB.SizeHelper(this.tb);

                this.refreshGfx();
            };

            /** unhook the toolbar from the UI (assumes it is currently hooked in) */
            JTB.Toolbar.prototype.unhook = function() {
                /* TODO */
            };

            /**
             * start a toolbar animation (any negatively-valued parameter means
             * don't change that field)
             */
            JTB.Toolbar.prototype.animate = function(l, t, w, h, springAnim, onlyInDockDir) {
                var e = this.e_tb;
                this.src_left   = findPosX(e);
                this.src_top    = findPosY(e);
                this.src_width  = e.offsetWidth;
                this.src_height = e.offsetHeight;

                this.dst_left   = ((l == -1) ? this.src_left   : l);
                this.dst_top    = ((t == -1) ? this.src_top    : t);
                this.dst_width  = ((w == -1) ? this.src_width  : w);
                this.dst_height = ((h == -1) ? this.src_height : h);

                if(springAnim === false) {
                    this.int_left   = (this.src_left   + this.dst_left)   / 2;
                    this.int_top    = (this.src_top    + this.dst_top)    / 2;
                    this.int_width  = (this.src_width  + this.dst_width)  / 2;
                    this.int_height = (this.src_height + this.dst_height) / 2;
                }
                else {
                    if(this.src_width > this.dst_width || this.src_height > this.dst_height) {
                        this.int_left   = this.src_left;
                        this.int_top    = this.src_top;
                        this.int_width  = this.src_width;
                        this.int_height = this.src_height;
                    }
                    else {
                        this.int_left   = this.dst_left;
                        this.int_top    = this.dst_top;
                        this.int_width  = this.dst_width;
                        this.int_height = this.dst_height;
                    }
                    if(this.dock==JTB.DOCK_LEFT || this.dock==JTB.DOCK_RIGHT) {
                        this.int_width *= 1.3;
                    }
                    else {
                        this.int_height *= 1.3;
                    }
                }
                animSplit = 0.5;

                /* restrict animation to a single direction if requested to do so */
                if(onlyInDockDir === true) {
                    if(this.dock==JTB.DOCK_LEFT || this.dock==JTB.DOCK_RIGHT) {
                        this.src_height = this.int_height = this.dst_height;
                    }
                    else {
                        this.src_width = this.int_width = this.dst_width;
                    }
                }

                debug(this.src_left + ',' + this.src_top + ' ' + this.src_width + '-' + this.src_height + ' ---- ' +
                      this.dst_left + ',' + this.dst_top + ' ' + this.dst_width + '-' + this.dst_height);

                debug(document.getElementById('custom_toolbar').offsetHeight + ' / ' + document.getElementById('tempest').offsetHeight);

                this.anim_start = new Date().getTime();
                this.e_tb.style.display = 'block';
                handleToolbarAnimation(this);
            };

            /** refreshes the toolbar elements to reflect a change in available space */
            JTB.Toolbar.prototype.handleResizing = function() {
                this.sz_container.refreshSizeData();
                this.sz_tb.refreshSizeData();
                this.refreshGfx();
            };

            /** set whether debug mode is on */
            JTB.Toolbar.prototype.setDebugMode = function(b) {
                debugMode = b;
            };

            /** called when the mouse moves on the toolbar's parent */
            JTB.handleMouseMove = function(tb_id, event) {
                mouseX = event.clientX;
                mouseY = event.clientY;

                var tb = getToolbar(tb_id);
                if(tb !== null && !tb.pinned && tb.anim_start==-1) {
                    tb.setStateBasedOnMouse();
                }
            };

            /** handle a click on a pin icon */
            JTB.handlePinClickEvent = function(tb_id) {
                var tb = getToolbar(tb_id);
                if(tb === null) {
                    return;
                }

                tb.pinned = !tb.pinned;
                tb.refreshPinGfx();
                tb.setStateBasedOnMouse();
            };

            /** handle callback for an animation event */
            JTB.handleAnimationCallback = function(tb_id) {
                var tb = getToolbar(tb_id);
                if(tb === null) {
                    return;
                }

                handleToolbarAnimation(tb);
            };

            /** handle the callback for the window being resized */
            JTB.handleWindowResizeEvent = function() {
                var i;
                for(i=0; i<toolbars.length; i++) {
                    toolbars[i].handleResizing();
                }
            };

            /* install a function which lets us know when the window is resized */
            var onresize = document.body.getAttribute('onresize');
            onresize += '; JTB.handleWindowResizeEvent();';
            document.body.setAttribute('onresize', onresize);
        }
    };
}();
JTB.init();
