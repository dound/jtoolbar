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
        for(i=0; i<toolbars.length; i++)
            if(toolbars[i].tb_id == name)
                return toolbars[i];

        return null;
    }

    /** adds a toolbar to its parent */
    function addToolbarToDOM(tb) {
        removeToolbarFromDOM(tb);
        refreshToolbarAttrs(tb);

        var parent = document.getElementById(tb.parent_id);
        parent.insertBefore(tb.tb_elt, parent.firstChild);
    }

    /** get a child element */
    function getChild(elt, child_name) {
        var children = elt.childNodes;
        var i;

        for(i=0; i<children.length; i++) {
            var name = children[i].getAttribute('id');
            if(name == child_name)
                return children[i];
        }
        return null;
    }

    /** refreshes the attributes of the toolbar div */
    function refreshToolbarAttrs(tb) {
        /* TODO: implement me! */

        /* setup the pin/unpin icon */
        var divPinIcon = getChild(tb.tb_elt, tb.getToolbarPinIconDiv());
        if(tb.isShowPinIcon()) {
            /* show it */
            var imgName = tb.getImagePath() + (tb.isPinned()) ? 'pin.gif' : 'unpin.gif';
            divPinIcon.setAttribute('style', 'display:yes; top:5px; left:5px; position:absolute; ' +
                                    'background-image:' + imgName);
        }
        else {
            /* hide it */
            divPinIcon.setAttribute('style', 'display:none');
        }
    }

    /** adds a toolbar to its parent */
    function removeToolbarFromDOM(tb) {
        var parent = document.getElementById(tb.parent_id);
        try {
            parent.removeChild(tb.tb_elt);
        }
        catch(err) {
            /* ignore */
        }
    }

    /** configures the pin button for the toolbar */
    function setupPinHandler(tb) {
        /* TODO: implement me! */
    }

    /** setup the show/hide handlers for the toolbar */
    function setupEventHandlers(tb) {
        /* TODO: implement me! */
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
        STATE_TO_VIS   : "to_vis",
        STATE_TO_INVIS : "to_invis",

        /**
         * Toolbar link constructor
         */
        ToolbarLink : function() {
            this.name = arguments[0];
            this.link = arguments[1];
        },

        /**
         * Toolbar constructor
         * @param parent_name  name of the parent element
         * @param div_name     name of the div to use, or a new id for a new div
         * @param ...          remaining arguments specify name-link pairs
         */
        Toolbar : function(parent_name, div_name) {
            /* name of the element which is the toolbar's parent */
            this.parent_id      = parent_name;

            /* name of the div which contains the toolbar */
            this.tb_id          = div_name;

            /* the element which is the div */
            this.tb_elt         = null;

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
            this.tb_elt = document.getElementById(div_name);
            if(this.tb_elt === null) {
                this.tb_elt = document.createElement("div");
                this.tb_elt.setAttribute('id', div_name);
            }

            /* create a div to put the links in within the toolbar */
            var divLinks = document.createElement("div");
            divLinks.setAttribute('id', this.getToolbarLinksDiv());
            this.tb_elt.appendChild(divLinks);

            /* create a div to put the pin icon in within the toolbar */
            var divPinIcon = document.createElement("div");
            divPinIcon.setAttribute('id', this.getToolbarPinIconDiv());
            divPinIcon.setAttribute('onclick', 'javascript:JTB.handlePinClickEvent("' + div_name + '");');
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

            setupPinHandler(this);
            setupEventHandlers(this);
        },

        init : function() {
            /** return the HTML representation of this link object */
            JTB.ToolbarLink.prototype.makeLink = function() {
                return '<a href="' + this.link + '">' + this.name + '</a>';
            };

            /** return the name of the parent containing the toolbar */
            JTB.Toolbar.prototype.getParentName = function() {
                return this.parent_id;
            };

            /** set the name of the parent containing the toolbar */
            JTB.Toolbar.prototype.setToolbarDiv = function(parent_name) {
                this.parent_id = parent_name;
                return this;
            };

            /** return the name of the div containing the toolbar */
            JTB.Toolbar.prototype.getToolbarDiv = function() {
                return this.tb_id;
            };

            /** return the name of the div containing the toolbar basic links */
            JTB.Toolbar.prototype.getToolbarLinksDiv = function() {
                return this.tb_id + "_links";
            };

            /** return the name of the div containing the toolbar pin icon */
            JTB.Toolbar.prototype.getToolbarPinIconDiv = function() {
                return this.tb_id + "_pinicon";
            };

            /** set the name of the div containing the toolbar */
            JTB.Toolbar.prototype.setToolbarDiv = function(div_name) {
                removeToolbarFromDOM(this);
                this.tb_id = div_name;
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

                divLinks = document.getElementById(this.getToolbarLinksDiv());
                divLinks.innerHTML = "";

                len = this.links.length;
                for(i=0; i<len; i++) {
                    divLinks.innerHTML += this.links[i].makeLink();
                }
            };

            /** handle a click on a pin icon */
            JTB.handlePinClickEvent = function(tb_id) {
                var tb = getToolbar(tb_id);
                if(tb === null) return;

                tb.pinned = !tb.pinned;
                refreshToolbarAttrs(tb);
            }

        }
    };
}();
JTB.init();

var t = new JTB.Toolbar("par", "tb", "dound", "http://www.dound.com");
