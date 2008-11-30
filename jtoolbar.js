/**
 * JavaScript Toolbar Widget
 * David Underhill and James Chen
 */

var JTB = function() {
    /*  private members */
    var priv_var = null;

    function privMethod(){}

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
         * @param div_name  name of the div to use, or a new id for a new div
         * @param ...       remaining arguments specify name-link pairs
         */
        Toolbar : function(div_name) {
            /* name of the div which contains the toolbar */
            this.div_id         = div_name;

            /* where to place our div relative to its parent */
            this.dock           = JTB.DOCK_BOTTOM;

            /* whether to show the pin/unpin graphic */
            this.show_pin       = true;

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

            /* create the div if it doesn't exist */
            var div = document.getElementById(div_name);
            if(div === null) {
                div = document.createElement("div");
                div.id = div_name;
            }
            var divLinks = document.createElement("div");
            divLinks.id = this.getToolbarLinksDiv();
            div.appendChild(divLinks);

            /* create the requested links */
            if(arguments.length > 1) {
                var i, name, link;
                for(i=0; i<arguments.length/2; i+=1) {
                    name = arguments[2*i];
                    link = arguments[2*i+1];
                    this.links[i] = new JTB.ToolbarLink(name, link);
                }
            }
            this.refreshLinks();

            /* TODO: setup event handlers */
            /* TODO: setup pin and its handler */
            /* TODO: add toolbar to the DOM */
        },

        init : function() {
            /** return the HTML representation of this link object */
            JTB.ToolbarLink.prototype.makeLink = function() {
                return '<a href="' + this.link + '">' + this.name + '</a>';
            };

            /** return the name of the div containing the toolbar */
            JTB.Toolbar.prototype.getToolbarDiv = function() {
                return this.div_id;
            };

            /** return the name of the div containing the toolbar basic links */
            JTB.Toolbar.prototype.getToolbarLinksDiv = function() {
                return this.div_id + "_links";
            };

            /** set the name of the div containing the toolbar */
            JTB.Toolbar.prototype.setToolbarDiv = function(div_name) {
                this.div_id = div_name;
                return this;
            };

            /** get the location of the toolbar on its parent */
            JTB.Toolbar.prototype.getDockLocation = function() {
                return this.dock;
            };

            /** set the location of the toolbar on its parent */
            JTB.Toolbar.prototype.setDockLocation = function(dock) {
                this.dock = dock;
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
        }
    };
}();
JTB.init();

var t = new JTB.Toolbar("tb", "dound", "http://www.dound.com");
