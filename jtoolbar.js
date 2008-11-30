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
            this.div_id         = div_name;
            this.dock           = JTB.DOCK_BOTTOM;
            this.show_pin       = true;
            this.pinned         = true;
            this.state          = JTB.STATE_VIS;
            this.animation_time = 250;
            this.trigger_dist   = 100;
            this.links          = [];

            /* create the div if it doesn't exist */
            div = document.getElementById(div_name);
            if(div == null) {
                div = document.createElement("div");
                div.id = div_name;
            }

            /* create the requested links */
            if(arguments.length > 1) {
                var i, name, link;
                for(i=0; i<arguments.length/2; i+=1) {
                    name = arguments[2*i];
                    link = arguments[2*i+1];
                    this.links[i] = new JTB.ToolbarLink(name, link);

                    div.innerHTML += this.links[i].makeLink();
                }
            }

            /* TODO: setup event handlers */
            /* TODO: setup pin and its handler */
            /* TODO: add toolbar to the DOM */
        },

        init : function() {
            /* return the HTML representation of this link object */
            JTB.ToolbarLink.prototype.makeLink = function() {
                return '<a href="' + this.link + '">' + this.name + '</a>';
            }
        }
    };
}();
JTB.init();

var t = new JTB.Toolbar("tb", "dound", "http://www.dound.com");
