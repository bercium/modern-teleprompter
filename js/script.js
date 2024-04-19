(function ($) {
    // default values
    var initPageSpeed = 35,
        initFontSize = 60,
        initPrompterWidth = 100,
        initMarkerPosition = 30,
        initTextColor = '#ffffff',
        initBackgroundColor = '#141414',
        initFlipX = false,
        initFlipY = false,
        initMarker = true,
        initReadingTimer = false,
        initFontBold = false,
        initTextLock = false,
        initStartDelay = 0, // before we start how much delay
        initRemoteCode = random_string(),
        coutdown_timer,
        dragable = false,
        scrollDelay, //scrolling timer     
        initOffcanvas = new bootstrap.Offcanvas('#offcanvas'),
        timer = $('.clock').timer({
            stopVal: 10000,
            onChange: function (time) {
                /*if (socket && remote) {
                    socket.emit('clientCommand', 'updateTime', time);
                }*/
            }
        });

    /**
     * Config Wrapper to add Local Storage support while maintaining
     * support for previous cooking settings. All existing cookies will
     * be ported over to local storage.
     */
    var config = {
        get: function (key) {
            if (typeof localStorage !== 'undefined' && localStorage[key]) {
                return localStorage[key];
            } else if ($.cookie(key)) {
                var val = $.cookie(key);

                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem(key, val);
                }

                return val;
            }
        },
        set: function (key, val) {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(key, val);
            } else {
                $.cookie(key, val);
            }
        }
    };
    
    

    $(function(){
        
        // Load saved values
        if (config.get('teleprompter_speed')) initPageSpeed = Number(config.get('teleprompter_speed'));
        if (config.get('teleprompter_font_size')) initFontSize = Number(config.get('teleprompter_font_size'));
        if (config.get('teleprompter_prompter_width')) initPrompterWidth = Number(config.get('teleprompter_prompter_width'));
        if (config.get('teleprompter_marker_position')) initMarkerPosition = Number(config.get('teleprompter_marker_position'));
                
        if (config.get('teleprompter_text_color')) initTextColor = config.get('teleprompter_text_color');
        if (config.get('teleprompter_background_color')) initBackgroundColor = config.get('teleprompter_background_color');
        
        if (config.get('teleprompter_flip_x')) initFlipX = config.get('teleprompter_flip_x') == 'true';
        if (config.get('teleprompter_flip_y')) initFlipY = config.get('teleprompter_flip_y') == 'true';
        if (config.get('teleprompter_marker')) initMarker = config.get('teleprompter_marker') == 'true';
        if (config.get('teleprompter_reading_timer')) initReadingTimer = config.get('teleprompter_reading_timer') == 'true';

        if (config.get('teleprompter_font_bold')) initFontBold = config.get('teleprompter_font_bold') == 'true';
        if (config.get('teleprompter_text_lock')) initTextLock = config.get('teleprompter_text_lock') == 'true';
        
        if (config.get('teleprompter_start_delay')) initStartDelay = Number(config.get('teleprompter_start_delay'));
        if (config.get('teleprompter_remote_code')) initRemoteCode = config.get('teleprompter_remote_code');
        else config.set('teleprompter_remote_code', initRemoteCode);
        
        if (config.get('teleprompter_text')) $('#teleprompter').html(config.get('teleprompter_text'));
        
        
        // set values and set actions
        $('#speed').val(initPageSpeed).on("change", function () { promptSpeed(true); }).on("mousemove", function () { if (dragable) promptSpeed(true); });        
        $('#font_size').val(initFontSize).on("change", function () { fontSize(true); }).on("mousemove", function () { if (dragable) fontSize(true); });
        $('#prompter_width').val(initPrompterWidth).on("change", function () { prompterWidth(true); }).on("mousemove", function () { if (dragable) prompterWidth(true); });
        $('#marker_position').val(initMarkerPosition).on("change", function () { markerPosition(true); }).on("mousemove", function () { if (dragable) markerPosition(true); });
        
        $('#text_color_picker').val(initTextColor).on("change",function () { textColor(); });
        $('#background_color_picker').val(initBackgroundColor).on("change",function () { backgroundColor(); });
        
        $('#flipx').prop("checked",initFlipX).on("change", function(){flipX(true)} );
        $('#flipy').prop("checked",initFlipY).on("change", function(){flipY(true)} );
        $('#marker_enabled').prop("checked",initMarker).on("change", function(){toggleMarker(true)} );
        $('#reading_timer').prop("checked",initReadingTimer).on("change",function () { toggleTimer(true); });
                
        $('#font_bold').prop('checked', initFontBold).on("change", function () { fontBold(); });
        $('#text_lock').prop('checked', initTextLock).on("change", function () { textLock() });
        
        $("input[name='start_delay'][value="+initStartDelay+"]").prop("checked",true).on("change",function () { startDelay(); });
        $("input[name='start_delay']").on("change",function () { startDelay(); });
        $("#upload_code").val(initRemoteCode);
        
        // teleprompter actions, editing and focus changes
        $('#teleprompter').on("keyup",function () { update_teleprompter(); })
                          .on("focusin",function(){ focus_teleprompter(true) })
                          .on("focusout",function(){ focus_teleprompter(false); })
                          .bind("paste", function(e){ paste_clean_text(e); } );
        
        
        // Listen for actions and button clicks
        $('body').on("keydown",keyShortcuts).on("mousedown",function(){dragable = true;}).on("mouseup",function(){dragable = false;});
 
        
        // Listen for Play Button Click
        $('#start_prompter').on("click",function () { start_prompter(); });
        $('#pause_prompter').on("click",function () { stop_teleprompter(); });
        
        $('#cloud_upload').on("click",function () { cloud_save_data(); });
        $('#cloud_download').on("click",function () { cloud_load_data(); });
        

        // set initial UI
        
        



        if (config.get('teleprompter_text_color')) {
            initTextColor = config.get('teleprompter_text_color');
            $('#text_color_picker').val(initTextColor);
            $('#teleprompter').css('color', initTextColor);
            $('#count_down').css('color', initTextColor);
        }
        if (config.get('teleprompter_background_color')) {
            initBackgroundColor = config.get('teleprompter_background_color');
            $('#background_color_picker').val(initBackgroundColor);
            $('#teleprompter').css('background-color', initBackgroundColor);
            $('article').css('background-color', initBackgroundColor);
        } else {
            clean_teleprompter();
        }

        // Run initial configuration on sliders
        fontSize(false);
        promptSpeed(false);
        prompterWidth(false);
        markerPosition(false);
        if (initFlipX) flipX(false);
        if (initFlipY) flipY(false);
        if (!initMarker) toggleMarker(false);
        toggleTimer(false);

    });


    function random_string() {
        var chars = "123456789ABCDEFGHIJKLMNOPQRSTUVZWXY";
        var string_length = 10;
        var randomstring = '';

        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
            if (i == 2 || i == 5) randomstring += "-";
        }

        return randomstring;
    }
    
    function fontBold(){
        
        if ($("#font_bold").is(":checked"))
            $('#teleprompter').css("font-weight", "bold");
        else
            $('#teleprompter').css("font-weight", "normal");
        config.set('teleprompter_font_bold',$("#font_bold").is(":checked"));
    }
    
    function textLock(){
        if ($("#text_lock").is(":checked"))
            $('#teleprompter').prop("contenteditable", false);
        else
            $('#teleprompter').prop("contenteditable", true);
        
        config.set('teleprompter_text_lock',$("#text_lock").is(":checked"));
    }
    
    function textColor() {
        var color = $(this).val();
            $('#teleprompter').css('color', color);
            $('#count_down').css('color', color);
            config.set('teleprompter_text_color', color);
    }
    
    function backgroundColor(){
        var color = $(this).val();
        $('#teleprompter').css('background-color', color);
        $('article').css('background-color', color);
        config.set('teleprompter_background_color', color);

    }
    
    function startDelay() {
        initStartDelay = Number($("input[name='start_delay']:checked").val());
        config.set('teleprompter_start_delay',initStartDelay);
    }
    

    // Manage Font Size Change
    function fontSize(save) {
        initFontSize = $('#font_size').val();

        $('article #teleprompter').css({
            'font-size': initFontSize + 'px',
            'line-height': Math.ceil(initFontSize * 1.5) + 'px',
            //'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
        });

        $('article #teleprompter p').css({
            'padding-bottom': Math.ceil(initFontSize * 0.25) + 'px',
            'margin-bottom': Math.ceil(initFontSize * 0.25) + 'px'
        });

        $('label.font_size_label span').text('(' + initFontSize + ')');

        if (save) {
            config.set('teleprompter_font_size', initFontSize);
        }
    }

    // Manage Speed Change
    function promptSpeed(save) {
        var speed = $('#speed').val();
        initPageSpeed = Math.floor(50 - speed);
        $('label.speed_label span').text('(' + speed + ')');

        if (save) {
            config.set('teleprompter_speed', speed);
        }
    }


    // Manage contetn width
    function prompterWidth(save) {
        initPrompterWidth = Math.floor($('#prompter_width').val());

        $('article #teleprompter').css({ 'width': initPrompterWidth + '%', });
        $('label.prompter_width_label span').text('(' + $('#prompter_width').val() + '%)');

        if (save) {
            config.set('teleprompter_prompter_width', $('#prompter_width').val());
        }
    }

    function resetTimer() {
        timer.resetTimer();

        /*if (socket && remote) {
            socket.emit('clientCommand', 'updateTime', '00:00:00');
        }*/
    }

    function flipX(save) {
        resetTimer();

        if ($('#teleprompter').hasClass('flipxy')) $('#teleprompter').removeClass('flipxy').addClass('flipy');
        else $('#teleprompter').toggleClass('flipx');

        if ($('#teleprompter').hasClass('flipx') && $('#teleprompter').hasClass('flipy')) {
            $('#teleprompter').removeClass('flipx').removeClass('flipy').addClass('flipxy');
        }

        //$('.button.flipx').toggleClass("active");
        initFlipX = $('#flipx').is(":checked");

        if (save) {
            config.set('teleprompter_flip_x', initFlipX);
        }
    }

    function flipY(save) {
        resetTimer();

        if ($('#teleprompter').hasClass('flipxy')) $('#teleprompter').removeClass('flipxy').addClass('flipx');
        else $('#teleprompter').toggleClass('flipy');

        if ($('#teleprompter').hasClass('flipx') && $('#teleprompter').hasClass('flipy')) {
            $('#teleprompter').removeClass('flipx').removeClass('flipy').addClass('flipxy');
        }

        //$('.button.flipy').toggleClass("active");
        initFlipY = $('#flipy').is(":checked");

        if ($('#teleprompter').hasClass('flipy')) {
            $('article').stop().animate({
                scrollTop: $("#teleprompter").height() + 100
            }, 250, 'swing', function () {
                $('article').clearQueue();
            });
        } else {
            $('article').stop().animate({
                scrollTop: 0
            }, 250, 'swing', function () {
                $('article').clearQueue();
            });
        }
        if (save) {
            config.set('teleprompter_flip_y', initFlipY);
        }
    }


    function toggleMarker(save) {
        if (!$('#marker_enabled').is(":checked")) {
            //$('.button.showmarker').removeClass("active");
            $('.overlay .top, .overlay .bottom, .marker').addClass("nomarker");
            $('.overlay .bottom, .overlay .top').css("height", "20%");
            $('#marker_position').prop("disabled",true);
        } else {
            //$('.button.showmarker').addClass("active");
            $('.overlay .top, .overlay .bottom, .marker').removeClass("nomarker");
            $('#marker_position').prop("disabled",false);
            markerPosition(false);
        }
        initMarker = $('#marker_enabled').is(":checked");

        if (save) {
            config.set('teleprompter_marker', initMarker);
        }
    }

    function toggleTimer(save) {
        if ($('#reading_timer').is(":checked")) {
            $('.timer_container').show();
        } else {
            $('.timer_container').hide();
        }
        initReadingTimer = $('#reading_timer').is(":checked");

        if (save) {
            config.set('teleprompter_reading_timer', initReadingTimer);
        }
    }

    // Manage marker position
    function markerPosition(save) {
        initMarkerPosition = Math.floor($('#marker_position').val());

        $('.marker').css({
            'top': 'calc(' + initMarkerPosition + '% - 20px)',
        });

        $('.overlay .top').not('.nomarker').css({
            'height': 'calc(' + initMarkerPosition + '% - 50px)',
        });
        $('.overlay .bottom').not('.nomarker').css({
            'height': 'calc(100% - ' + initMarkerPosition + '% - 50px)',
        });

        $('label.marker_position_label span').text('(' + $('#marker_position').val() + '%)');

        if (save) {
            $('.marker, .overlay').not('.nomarker').fadeIn('slow');
            config.set('teleprompter_marker_position', $('#marker_position').val());
        }
    }


    // Manage Scrolling Teleprompter
    function pageScroll(direction, offset) {
        var animate = 0;

        if (!offset) offset = 2;

        if (!direction) {
            direction = 'down'
            clearTimeout(scrollDelay);
            scrollDelay = setTimeout(pageScroll, initPageSpeed);
        } else {
            offset = window.screen.availHeight / 2;
            animate = 500;
        }

        if ($('#teleprompter').hasClass('flipy')) {
            $('article').stop().animate({
                scrollTop: (direction === 'down') ? '-=' + offset + 'px' : '+=' + offset + 'px'
            }, animate, 'linear', function () {
                $('article').clearQueue();
            });

            // We're at the bottom of the document, stop
            if ($("article").scrollTop() === 0) {
                stop_teleprompter();
                setTimeout(function () {
                    $('article').stop().animate({
                        scrollTop: $("#teleprompter").height() + 100
                    }, 500, 'swing', function () {
                        $('article').clearQueue();
                    });
                }, 500);
            }
        } else {
            $('article').stop().animate({
                scrollTop: (direction === 'down') ? '+=' + offset + 'px' : '-=' + offset + 'px'
            }, animate, 'linear', function () {
                $('article').clearQueue();
            });

            // We're at the bottom of the document, stop
            if ($("article").scrollTop() >= (($("article")[0].scrollHeight - $(window).height()) - 100)) {
                stop_teleprompter();
                setTimeout(function () {
                    $('article').stop().animate({
                        scrollTop: 0
                    }, 500, 'swing', function () {
                        $('article').clearQueue();
                    });
                }, 500);
            }
        }
    }
    
    function cloud_save_data(){
        $('#cloud_upload i').addClass("bi-cloud-upload-fill").removeClass("bi-cloud-arrow-up");
        //setTimeout(function(){$('.button.upload').removeClass("active");}, 2000);
        $.post('cloud.php', // url
                {text: $("#teleprompter").html()}, // data to be submit
                function (data, status, jqXHR) {// success callback
                   $('#cloud_upload i').addClass("bi-cloud-arrow-up").removeClass("bi-cloud-upload-fill");
                });
    }

    function cloud_load_data() {
        $('#cloud_download i').addClass("bi-cloud-download-fill").removeClass("bi-cloud-arrow-down");
        $.get('cloud.php', // url
                function (data, textStatus, jqXHR) {  // success callback
                    $("#teleprompter").html(data);
                    $('#cloud_download i').addClass("bi-cloud-arrow-down").removeClass("bi-cloud-download-fill");
                });
    }

    // Listen for Key Presses on Body
    function keyShortcuts(evt) {
        var space = 32,
            pause = 80, // letter V for letter P use 80
            escape = 27,
            left = 37,
            right = 39,
            up = 38,
            down = 40,
            font_up = 71, // G char
            font_down = 70, // F char
            mirror_x = 88, // Y char
            mirror_y = 89, // X char
            width_up = 69, // E charr
            width_down = 87, // W char
            marker_up = 77, // M char
            marker_down = 78, // N char
            load_key = 76; // L char

        // Exit if we're inside an input field
        if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter' ||  $(evt.target).is("input") || (evt.target.id != 'gui' && evt.target.id != 'offcanvas')) {
            return true;
        }

        // Reset GUI
        if (evt.keyCode == escape) stop_teleprompter(); // stop teleprompter
        else if (evt.keyCode == space || evt.keyCode == pause /* letter v - quieter key*/) $('#start_prompter').click();  // Start Stop Scrolling
        else if (evt.keyCode == left) $('#speed').val(Number($('#speed').val()) - 2).change(); // Decrease Speed with Left Arrow
        else if (evt.keyCode == right) $('#speed').val(Number($('#speed').val()) + 2).change(); // Increase Speed with Right Arrow
        else if (evt.keyCode == font_down) $('#font_size').val(Number($('#font_size').val())-1).change();   // Decrease Font Size with Minus
        else if (evt.keyCode == font_up) $('#font_size').val(Number($('#font_size').val())+1).change();  // Increase Font Size with Plus
        else if (evt.keyCode == down) $('article').scrollTop($('article').scrollTop() - Number($('#font_size').val()) / 4); // Move scroller down
        else if (evt.keyCode == up) $('article').scrollTop($('article').scrollTop() + Number($('#font_size').val()) / 4);  // Move scroller up
        else if (evt.keyCode == mirror_x) $("#flipx").click(); // Flip text on X axis
        else if (evt.keyCode == mirror_y) $("#flipy").click(); // Flip text on y axis
        else if (evt.keyCode == width_up) $('#prompter_width').val(Number($('#prompter_width').val()) + 10).change(); // Prompter width up
        else if (evt.keyCode == width_down) $('#prompter_width').val(Number($('#prompter_width').val()) - 10).change(); // Prompter width down
        else if (evt.keyCode == marker_up) $('#marker_position').val(Number($('#marker_position').val()) + 5).change(); // Marker position  up
        else if (evt.keyCode == marker_down) $('#marker_position').val(Number($('#marker_position').val()) - 5).change(); // Marker position down
        else if (evt.keyCode == load_key) cloud_load_data(); // Marker position down
        else return true;

        evt.preventDefault();
        evt.stopPropagation();
        return false;
    }
    
    
    function start_prompter(){
        initOffcanvas.hide();
        
        var counter = Number($("input[name='start_delay']:checked").val());
        if (counter > 0){
            $("#count_down").addClass("active").html(counter);

            coutdown_timer = setInterval(() => {
              counter--;
              if (counter == 0){
                    clearInterval(coutdown_timer);
                    $("#count_down").removeClass("active").html("");
                    start_teleprompter();
              }else $("#count_down").html(counter);

            }, 1000);
        }  else start_teleprompter();
        
    }

    // Start Teleprompter
    function start_teleprompter() {
        /*if (socket && remote) {
            socket.emit('clientCommand', 'play');
        }*/

        $('#teleprompter').attr('contenteditable', false);
        $('body').addClass('playing');
        //$('start_prompter').removeClass('icon-play').addClass('icon-pause');
        //$('header h1, header nav').fadeTo('slow', 0.15);
        
        
        //$('header').fadeOut('fast');

        $('.marker, .overlay').not('.nomarker').fadeIn('slow');

        if ($('#reading_timer').is(":checked")) {
            
            timer.startTimer();
        }

        pageScroll();
    }

    // Stop Teleprompter
    function stop_teleprompter() {
        /*if (socket && remote) {
            socket.emit('clientCommand', 'stop');
        }*/

        clearTimeout(scrollDelay);
        clearInterval(coutdown_timer);
        $('#teleprompter').attr('contenteditable', true);
        //$('header h1, header nav').fadeTo('slow', 1);
        //$('header').fadeIn('fast');
        initOffcanvas.show();
        //$('start_prompter').removeClass('icon-pause').addClass('icon-play');
        $('.marker, .overlay').fadeOut('slow');
        $('body').removeClass('playing');

        if ($('#reading_timer').is(":checked")) {
           
            timer.stopTimer();
        }
        resetTimer();
        $('article').stop().animate({
                scrollTop: 0
            }, 100, 'linear', function () {
                $('article').clearQueue();
            });
    }

    // Update Teleprompter
    function update_teleprompter() {
        config.set('teleprompter_text', $('#teleprompter').html());
    }

    // Clean Teleprompter
    function clean_teleprompter() {
        var text = $('#teleprompter').html();
        text = text.replace(/<br>+/g, '@@').replace(/@@@@/g, '</p><p>');
        text = text.replace(/@@/g, '<br>');
        text = text.replace(/([a-z])\. ([A-Z])/g, '$1.&nbsp;&nbsp; $2');
        text = text.replace(/<p><\/p>/g, '');

        if (text.substr(0, 3) !== '<p>') {
            text = '<p>' + text + '</p>';
        }

        $('#teleprompter').html(text);
    }
    
    function focus_teleprompter(isFocused) {
        if (isFocused) $('#teleprompter').removeClass("flipx").removeClass("flipy").removeClass("flipxy");
        else{
            if (initFlipY && initFlipY) $('#teleprompter').addClass("flipxy");
                else{
                if (initFlipX) $('#teleprompter').addClass("flipx");
                if (initFlipY) $('#teleprompter').addClass("flipy");
            }
        }
    }
    
    function paste_clean_text(e){
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand("insertHTML", false, text);
    }
    
})(jQuery);