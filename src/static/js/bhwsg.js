if(typeof(console) === 'undefined') {
    var console = {};
    console.log = console.error = console.info = console.debug = console.warn = console.trace = console.dir = console.dirxml = console.group = console.groupEnd = console.time = console.timeEnd = console.assert = console.profile = function() {};
}

/* PlugTrade.com - jQuery draggit Function */
/* Drag A Div with jQuery */
/* http://stackoverflow.com/questions/561844/how-to-move-div-with-the-mouse-using-jquery */
jQuery.fn.draggit = function (el) {
    var thisdiv = this;
    var thistarget = $(el);
    var ismousedown = false;
    var relX;
    var relY;
    var targetw = thistarget.width();
    var targeth = thistarget.height();
    var docw;
    var doch;

    thistarget.css('position','absolute');

    thisdiv.bind('mousedown', function(e){
        $("*").addClass("noselect");
        var pos = $(el).offset();
        var srcX = pos.left;
        var srcY = pos.top;

        docw = $('body').width();
        doch = $('body').height();

        relX = e.pageX - srcX;
        relY = e.pageY - srcY;

        ismousedown = true;
    });

    $(document).bind('mousemove',function(e){
        if(ismousedown)
        {
            targetw = thistarget.width();
            targeth = thistarget.height();

            var maxX = docw - targetw - 10;
            var maxY = doch - targeth - 10;

            var mouseX = e.pageX;
            var mouseY = e.pageY;

            var diffX = mouseX - relX;
            var diffY = mouseY - relY;

            if(diffX < 0)   diffX = 0;
            if(diffY < 0)   diffY = 0;
            if(diffX > maxX) diffX = maxX;
            if(diffY > maxY) diffY = maxY;

            $(el).css('top', (diffY)+'px');
            $(el).css('left', (diffX)+'px');
        }
    });

    $(window).bind('mouseup', function(e){
        $("*").removeClass("noselect");
        ismousedown = false;
    });
    return this;
}; // end jQuery draggit function

////////////////// BHWSG //////////////////

var BHWSG = (function(){
    return {
        init: function(){
            console.log("Module is OK.");
            BHWSG.resizePanels();
            BHWSG.slideHeaders();
            BHWSG.highlightItemList();
            BHWSG.buildUI();
        }, // init

        buildUI: function(){
            BHWSG.fetchInboxes();
        }, // buildUI

        layout: {
            'primary': $("#primary"),
            'secondary': $("#secondary"),
            'mail': $("#mail"),
            'body': $("body"),
            'active': 'secondary'
        }, // layout

        resizePanels: function(){
            var sec = BHWSG.layout.secondary;
            var scroller = $("<div id='scroller'></div>");
            BHWSG.layout.body.append(scroller);
            scroller.css("left", sec.offset().left + sec.outerWidth());
            $("#scroller").draggit("#scroller");
            $("#scroller").mousemove(function(){
                var this_left = parseInt($(this).css("left"), 10);
                sec.width(this_left - parseInt(sec.css("left"), 10));
                BHWSG.layout.mail.css("left", this_left);
                return true;
            });
        }, // resizePanels

        slideHeaders: function(){
            // we need check if headers is there.
            var headers = BHWSG.layout.mail.find(".headers");
            BHWSG.layout.mail.find(".status .action").on("click", function(){
                headers.slideToggle(100);
            });
        }, // slideHeaders

        highlightItemList: function(){
            var items = BHWSG.layout.secondary.find("li");
            items.on("click", function(){
                var this_ = $(this);
                items.filter(".active").removeClass("active");
                this_.addClass("active");
                // BHWSG.getMessage(messageid)
                // history.pushState(data, event.target.textContent, event.target.href);

                return false;
            });
            Mousetrap.bind(["space", "down"], function(){BHWSG.pleaseHifhlightItemList("next");});
            Mousetrap.bind("up", function(){BHWSG.pleaseHifhlightItemList("prev");});
        }, // highlightItemList
        pleaseHifhlightItemList: function(direction){
            if (BHWSG.layout.active === "secondary"){
                var current = BHWSG.layout.secondary.find("li.active");
                var next;
                if (direction === "next"){
                    next = current.next();
                }
                if (direction === "prev"){
                    next = current.prev();
                }
                if (next.length){
                    next.click();
                    // BHWSG.layout.secondary.scrollTop(next.position().top - 56);
                }
            }
        }, // pleaseHifhlightItemList

        // Temlates
        templates: {
            inboxes: $("#template-inbox-list").html(),
            mails: $("#template-mail-list").html()
        }, // templates

        // Renders

        _render: function(template, data, el, callback) {
            console.log("Template is: ");
            console.log(template);
            console.log("Data is: ");
            console.log(data);
            console.log("El is: ");
            console.log(el);
            var html = $.mustache(template, data);
            el = $(el);
            if (el.length){el.html(html);}
            if (typeof(callback) === "function") {
                callback();
            }
            if (!!!el.length){return html;}
        },

        renderInboxes: function(data){
            var html = $.mustache(BHWSG.templates.inboxes, data);
            BHWSG.layout.primary.find("ul").html(html);
            BHWSG.actionInbox();
        }, // renderInboxes

        renderMails: function(data){
            var html = $.mustache(BHWSG.templates.mails, data);
            BHWSG.layout.secondary.find("ul").html(html);
        }, // renderMails

        // Actions
        actionInbox: function(){
            BHWSG.layout.primary.find("ul li a").on("click", function(){
                // Activate This inbox.
                // 1. Switch title in secondary.
                // 2. Activate loader.
                // 3. fetch items.
                // 4. Activate controls?
                var this_ = $(this);
                BHWSG.layout.secondary.find("h1 .label").text(this_.text());
                BHWSG.layout.secondary.find("h1 .unread").text(this_.attr("data-unread"));
                BHWSG.layout.secondary.find("h1 .total").text(this_.attr("data-count"));
                BHWSG.fetchMails(this_.attr("data-slug"));
            });
        }, // actionInbox

        // Fetchers
        fetchInboxes: function(){
            $.getJSON("/inbox/list/", function(data){
                if (data.status === 200){
                    console.log("Status is OK, will render...");
                    // BHWSG.renderInboxes(data.data);
                    //
                    BHWSG._render(
                        BHWSG.templates.inboxes, // template
                        data.data, // data
                        BHWSG.layout.primary.find("ul"), // el
                        BHWSG.actionInbox // callback
                        );
                }
                else {
                    alert("Status: " + data.status + " Message: " + data.message);
                }
            });
        }, // fetchInboxes

        fetchMails: function(slug){
            $.getJSON("/inbox/mail_list/" + slug + "/", function(data){
                if (data.status === 200){
                    BHWSG.renderMails(data.data);
                    BHWSG._render(
                        BHWSG.templates.mails,
                        data.data,
                        BHWSG.layout.secondary.find("ul")
                        // action?
                        );
                }
                else {
                    alert("Status: " + data.status + " Message: " + data.message);
                }
            });
        } // fetchMails
    };
})($);


$(document).ready(function(){
        BHWSG.init();
});
