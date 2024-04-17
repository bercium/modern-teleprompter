(function ($) {
    // default values
    var initPageSpeed = 35,
        initFontSize = 60,
        initPrompterWidth = 100,
        initMarkerPosition = 30,
        scrollDelay, //scrolling timer
        textColor = '#ffffff',
        backgroundColor = '#141414',
        //socket,
        //remote,
        initFlipX = false,
        initFlipY = false,
        initMarker = true,
        initTimer = false,
        initFontBold = false,
        initTextLock = false,   
        initStartDelay = 0, // before we start how much delay
        dragable = false,
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
        // Check if we've been here before and made changes
        if (config.get('teleprompter_font_size')) initFontSize = config.get('teleprompter_font_size');
        if (config.get('teleprompter_speed')) initPageSpeed = config.get('teleprompter_speed');
        if (config.get('teleprompter_prompter_width')) initPrompterWidth = config.get('teleprompter_prompter_width');
        if (config.get('teleprompter_marker_position')) initMarkerPosition = config.get('teleprompter_marker_position');
        if (config.get('teleprompter_text')) $('#teleprompter').html(config.get('teleprompter_text'));

        if (config.get('teleprompter_text_color')) {
            textColor = config.get('teleprompter_text_color');
            $('#text-color-picker').val(textColor);
            $('#teleprompter').css('color', textColor);
            $('#count_down').css('color', textColor);
        }
        if (config.get('teleprompter_background_color')) {
            backgroundColor = config.get('teleprompter_background_color');
            $('#background-color-picker').val(backgroundColor);
            $('#teleprompter').css('background-color', backgroundColor);
        } else {
            clean_teleprompter();
        }
        if (config.get('teleprompter_flip_x')) initFlipX = config.get('teleprompter_flip_x') == 'true';
        if (config.get('teleprompter_flip_y')) initFlipY = config.get('teleprompter_flip_y') == 'true';
        if (config.get('teleprompter_marker')) initMarker = config.get('teleprompter_marker') == 'true';
        if (config.get('teleprompter_timer')) initTimer = config.get('teleprompter_timer') == 'true';
        

        // Listen for Key Presses
        $('#teleprompter').on("keyup",update_teleprompter);
        $('body').on("keydown",navigate).on("mousedown",function(){dragable = true;}).on("mouseup",function(){dragable = false;});

        // Setup GUI
        $('article').stop().animate({ scrollTop: 0 }, 100, 'linear', function () { $('article').clearQueue(); });
        $('.marker, .overlay').fadeOut(0);
        $('article #teleprompter').css({'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px' });

        // Create Font Size Slider
        $('#font_size').val(initFontSize).on("change", function () { fontSize(true); }).on("mousemove", function () { if (dragable) fontSize(true); });
        $('#speed').val(initPageSpeed).on("change", function () { speed(true); }).on("mousemove", function () { if (dragable) speed(true); });

        $('#font_bold').prop('checked', initFontBold).on("change", function () {
            if ($("#font_bold").is(":checked"))
                $('article #teleprompter').css("font-weight", "bold");
            else
                $('article #teleprompter').css("font-weight", "normal");
        });
        $('#text_lock').prop('checked', initTextLock).on("change", function () {
            if ($("#text_lock").is(":checked"))
                $('article #teleprompter').prop("contenteditable", false);
            else
                $('article #teleprompter').prop("contenteditable", true);
        });

        $('#prompter_width').val(initPrompterWidth).on("change", function () { prompterWidth(true); }).on("mousemove", function () { if (dragable) prompterWidth(true); });
        $('#marker_position').val(initMarkerPosition).on("change", function () {
            markerPosition(true);
            if (!$('body').hasClass('playing')) $('.marker, .overlay').fadeOut('slow');
        }).on("mousemove", function () {
            if (dragable) markerPosition(true);
        });


        $('#flipx').prop("checked",initFlipX).on("click", function(){flipX(true)} );
        $('#flipy').prop("checked",initFlipY).on("click", function(){flipY(true)} );
        
        $('#marker_enabled').prop("checked",initMarker).on("click", function(){toggleMarker(true)} );
        
        $('#timer').prop("checked",initTimer).on("click",function () { toggleTimer(true); });
        
        // when editing return to normal text
        $('#teleprompter').on("focusin",function(){ $('#teleprompter').removeClass("flipx").removeClass("flipy").removeClass("flipxy"); })
                          .on("focusout",function(){
                                if (initFlipY && initFlipY) $('#teleprompter').addClass("flipxy");
                                else{
                                    if (initFlipX) $('#teleprompter').addClass("flipx");
                                    if (initFlipY) $('#teleprompter').addClass("flipy");
                                }
                          });
        
        // Listen for Reset Button Click
        $('.button.reset').on("click", function () {
            stop_teleprompter();
            resetTimer();

            $('article').stop().animate({
                scrollTop: 0
            }, 100, 'linear', function () {
                $('article').clearQueue();
            });
        });

        $('#text-color-picker').on("change",function () {
            var color = $(this).val();
            $('#teleprompter').css('color', color);
            $('#count_down').css('color', color);
            config.set('teleprompter_text_color', color);
        });
        $('#background-color-picker').on("change",function () {
            var color = $(this).val();
            $('#teleprompter').css('background-color', color);
            config.set('teleprompter_background_color', color);
        });
        
        // Listen for Play Button Click
        $('#start_prompter').on("click",function () {
            if ($(this).hasClass('icon-play')) {
                
                var counter = Number($("input[type='radio'][name='start-delay']:checked").val());
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
            } else {
                stop_teleprompter();
            }
        });

        $('.button.upload').on("click",function () {
            $('.button.upload').addClass("active");
            //setTimeout(function(){$('.button.upload').removeClass("active");}, 2000);
            $.post('cloud.php', // url
                    {text: $("#teleprompter").html()}, // data to be submit
                    function (data, status, jqXHR) {// success callback
                        $('.button.upload').removeClass("active");
                    });
        });

        $('.button.download').on("click",function () { load_data(); });
        //$('.button.showmarker').on("click",function () { toggleMarker(true); });


        // Run initial configuration on sliders
        fontSize(false);
        speed(false);
        prompterWidth(false);
        markerPosition(false);
        if (initFlipX) flipX(false);
        if (initFlipY) flipY(false);
        if (!initMarker) toggleMarker(false);
        toggleTimer(false);

    });


    function random_string() {
        var chars = "3456789ABCDEFGHJKLMNPQRSTUVWXY";
        var string_length = 6;
        var randomstring = '';

        for (var i = 0; i < string_length; i++) {
            var rnum = Math.floor(Math.random() * chars.length);
            randomstring += chars.substring(rnum, rnum + 1);
        }

        return randomstring;
    }

    // Manage Font Size Change
    function fontSize(save) {
        initFontSize = $('#font_size').val();

        $('article #teleprompter').css({
            'font-size': initFontSize + 'px',
            'line-height': Math.ceil(initFontSize * 1.5) + 'px',
            'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
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
    function speed(save) {
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
        if ($('#timer').is(":checked")) {
            $('.timer_container').show();
        } else {
            $('.timer_container').hide();
        }
        initTimer = $('#timer').is(":checked");

        if (save) {
            config.set('teleprompter_timer', initTimer);
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
            config.set('teleprompter_marker_position', $('#speed').val());
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

    function load_data() {
        $('.button.download').addClass("active");
        $.get('cloud.php', // url
                function (data, textStatus, jqXHR) {  // success callback
                    $("#teleprompter").html(data);
                    $('.button.download').removeClass("active");
                });
    }

    // Listen for Key Presses on Body
    function navigate(evt) {
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
            load_key = 76, // L char
            speed_val = Number($('#speed').val()),
            font_size = Number($('#font_size').val());

        // Exit if we're inside an input field
        if (typeof evt.target.id == 'undefined' || evt.target.id == 'teleprompter') {
            return;
        } else if (typeof evt.target.id == 'undefined' || evt.target.id != 'gui') {
            evt.preventDefault();
            evt.stopPropagation();
            return false;
        }

        // Reset GUI
        if (evt.keyCode == escape) {
            $('.button.reset').trigger('click');
        }
        // Start Stop Scrolling
        else if (evt.keyCode == space || evt.keyCode == pause /* letter v - quieter key*/) {
            $('start_prompter').trigger('click');
        }
        // Decrease Speed with Left Arrow
        else if (evt.keyCode == left) {
            $('#speed').val(speed_val - 2);
            speed(true);
        }
        // Increase Speed with Right Arrow
        else if (evt.keyCode == right) {
            $('#speed').val(speed_val + 2);
            speed(true);
        }
        // Decrease Font Size with Minus
        else if (evt.keyCode == font_down) {
            $('#font_size').val(--font_size);
            fontSize(true);
        }
        // Increase Font Size with Plus
        else if (evt.keyCode == font_up) {
            $('#font_size').val(++font_size);
            fontSize(true);
        }
        // Move scroller down
        else if (evt.keyCode == down) {
            $('article').scrollTop($('article').scrollTop() - font_size / 4);
        }
        // Move scroller up
        else if (evt.keyCode == up) {
            $('article').scrollTop($('article').scrollTop() + font_size / 4);
        }
        // Flip text on X axis
        else if (evt.keyCode == mirror_x) {
            flipX(true);
        }
        // Flip text on y axis
        else if (evt.keyCode == mirror_y) {
            flipY(true)
        }
        // Prompter width up
        else if (evt.keyCode == width_up) {
            $('#prompter_width').val(Number($('#prompter_width').val()) + 10);
            prompterWidth(save);
        }
        // Prompter width down
        else if (evt.keyCode == width_down) {
            $('#prompter_width').val(Number($('#prompter_width').val()) - 10);
            prompterWidth(save);
        }
        // Marker position  up
        else if (evt.keyCode == marker_up) {
            $('#marker_position').val(Number($('#marker_position').val()) + 5);
            markerPosition(save);
        }
        // Marker position down
        else if (evt.keyCode == marker_down) {
            $('#marker_position').val(Number($('#marker_position').val()) - 5);
            markerPosition(save);
        }
        // Marker position down
        else if (evt.keyCode == load_key) {
            load_data();
        } else return true;

        evt.preventDefault();
        evt.stopPropagation();
        return false;
    }

    // Start Teleprompter
    function start_teleprompter() {
        /*if (socket && remote) {
            socket.emit('clientCommand', 'play');
        }*/

        $('#teleprompter').attr('contenteditable', false);
        $('body').addClass('playing');
        $('start_prompter').removeClass('icon-play').addClass('icon-pause');
        //$('header h1, header nav').fadeTo('slow', 0.15);
        
        
        $('header').fadeOut('fast');
        $('.marker, .overlay').not('.nomarker').fadeIn('slow');

        if ($('#timer').is(":checked")) {
            
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
        $('#teleprompter').attr('contenteditable', true);
        //$('header h1, header nav').fadeTo('slow', 1);
        $('header').fadeIn('fast');
        $('start_prompter').removeClass('icon-pause').addClass('icon-play');
        $('.marker, .overlay').fadeOut('slow');
        $('body').removeClass('playing');

        if ($('#timer').is(":checked")) {
           
            timer.stopTimer();
        }

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
})(jQuery);