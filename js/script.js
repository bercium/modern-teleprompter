(function ($) {
    // default values
    var initPageSpeed = 45,
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
        coutdownTimer,
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
        loadSettingsData();
        
        if (config.get('teleprompter_remote_code')) initRemoteCode = config.get('teleprompter_remote_code'); // can't change if set once
        else config.set('teleprompter_remote_code', initRemoteCode);
        $("#upload_code").val(initRemoteCode);
        
        if (config.get('teleprompter_text')) $('#teleprompter').html(config.get('teleprompter_text'));
        
        
        // set set actions
        $('#speed').on("change", function () { promptSpeed(true); }).on("mousemove", function () { if (dragable) promptSpeed(false); });        
        $('#font_size').on("change", function () { fontSize(true); }).on("mousemove", function () { if (dragable) fontSize(false); });
        $('#prompter_width').on("change", function () { prompterWidth(true); }).on("mousemove", function () { if (dragable) prompterWidth(false); });
        $('#marker_position').on("change", function () { markerPosition(true); }).on("mousemove", function () { if (dragable) markerPosition(false); });
        
        $('#text_color_picker').on("change",function () { textColor(true); });
        $('#background_color_picker').on("change",function () { backgroundColor(true); });
        
        $('#flipx').on("change", function(){flipX(true)} );
        $('#flipy').on("change", function(){flipY(true)} );
        $('#marker_enabled').on("change", function(){readingMarker(true)} );
        $('#reading_timer').on("change",function () { readingTimer(true); });
                
        $('#font_bold').on("change", function () { fontBold(true); });
        $('#text_lock').on("change", function () { textLock(true) });
        
        $("input[name='start_delay']").on("change",function () { startDelay(); });
        
        // teleprompter actions, editing and focus changes
        $('#teleprompter').on("keyup",function () { teleprompterUpdate(); })
                          .on("focusin",function(){ teleprompterFocus(true) })
                          .on("focusout",function(){ teleprompterFocus(false); })
                          .bind("paste", function(e){ pasteCleanText(e); } );
        
        
        // Listen for actions and button clicks
        $('body').on("keydown",keyShortcuts).on("mousedown",function(){dragable = true;}).on("mouseup",function(){dragable = false;});
 
        
        // Listen for Play Button Click
        $('#start_prompter, #start_prompter_display').on("click",function () { teleprompterStart(); });
        $('#pause_prompter').on("click",function () { teleprompterStop(); }).hide();
        
        $('#cloud_upload').on("click",function () { cloudSaveData(); });
        $('#cloud_download_settings').on("click",function () { cloudLoadData("settings"); });
        $('#cloud_download_text').on("click",function () { cloudLoadData("text"); });

        // set initial UI
        
        /*
        if (config.get('teleprompter_background_color')) {
            initBackgroundColor = config.get('teleprompter_background_color');
            $('#background_color_picker').val(initBackgroundColor);
            $('#teleprompter').css('background-color', initBackgroundColor);
            $('article').css('background-color', initBackgroundColor);
        } else {
            teleprompterClean();
        }*/
        
        // Run initial configuration
        setSettings(false);

    });
    
    
    // ********   Click actions
    
    function fontBold(save){
        if ($("#font_bold").is(":checked")) $('#teleprompter').css("font-weight", "bold");
        else $('#teleprompter').css("font-weight", "normal");
        if (save) config.set('teleprompter_font_bold',$("#font_bold").is(":checked"));
    }
    
    function textLock(save){
        if ($("#text_lock").is(":checked")) $('#teleprompter').prop("contenteditable", false);
        else $('#teleprompter').prop("contenteditable", true);
        if (save) config.set('teleprompter_text_lock',$("#text_lock").is(":checked"));
    }
    
    function textColor(save) {
        var color = $("#text_color_picker").val();
        $('#teleprompter').css('color', color);
        $('#count_down').css('color', color);
        if (save) config.set('teleprompter_text_color', color);
    }
    
    function backgroundColor(save){
        var color = $("#background_color_picker").val();
        $('#teleprompter').css('background-color', color);
        $('article').css('background-color', color);
        if (save) config.set('teleprompter_background_color', color);
    }
    
    function startDelay() {
        config.set('teleprompter_start_delay',Number($("input[name='start_delay']:checked").val()));
    }

    // Manage Font Size Change
    function fontSize(save) {
        var fontSize = $('#font_size').val();

        $('article #teleprompter').css({
            'font-size': fontSize + 'px',
            'line-height': Math.ceil(fontSize * 1.5) + 'px',
            //'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
        });

        $('article #teleprompter p').css({
            'padding-bottom': Math.ceil(fontSize * 0.25) + 'px',
            'margin-bottom': Math.ceil(fontSize * 0.25) + 'px'
        });

        $('label.font_size_label span').text('(' + fontSize + ')');

        if (save) config.set('teleprompter_font_size', fontSize);
        
    }

    // Manage Speed Change
    function promptSpeed(save) {
        $('label.speed_label span').text('(' + $('#speed').val() + ')');

        if (save) config.set('teleprompter_speed', $('#speed').val());
    }


    // Manage contetn width
    function prompterWidth(save) {
        $('article #teleprompter').css({ 'width': Math.floor($('#prompter_width').val()) + '%', });
        $('label.prompter_width_label span').text('(' + $('#prompter_width').val() + '%)');
        if (save) config.set('teleprompter_prompter_width', $('#prompter_width').val());
    }


    function flipX(save) {
        //resetTimer();
        $('#teleprompter').removeClass('flipx').removeClass('flipy').removeClass('flipxy');
        
        if ($('#flipx').is(":checked") && $('#flipy').is(":checked")) $('#teleprompter').addClass('flipxy');
        else if ($('#flipy').is(":checked")) $('#teleprompter').addClass('flipy');
        else if ($('#flipx').is(":checked")) $('#teleprompter').addClass('flipx');
        
        if (save) config.set('teleprompter_flip_x', $('#flipx').is(":checked"));
    }

    function flipY(save) {
        //resetTimer();
        $('#teleprompter').removeClass('flipx').removeClass('flipy').removeClass('flipxy');
        
        if ($('#flipx').is(":checked") && $('#flipy').is(":checked")) $('#teleprompter').addClass('flipxy');
        else if ($('#flipy').is(":checked")) $('#teleprompter').addClass('flipy');
        else if ($('#flipx').is(":checked")) $('#teleprompter').addClass('flipx');
        

        if ($('#flipy').is(":checked")) {
            scrollAnimation($("#teleprompter").height());
        } else {
            scrollAnimation();
        }
        
        if (save) config.set('teleprompter_flip_y', $('#flipy').is(":checked"));
    }


    function readingTimer(save) {
        if ($('#reading_timer').is(":checked")) $('.timer_container').show();
        else $('.timer_container').hide();

        if (save) config.set('teleprompter_reading_timer', $('#reading_timer').is(":checked"));
    }
    
    function readingMarker(save) {
        
        if ($('#marker_enabled').is(":checked")) {
           //$('.button.showmarker').addClass("active");
            $('.overlay .top, .overlay .bottom').removeClass("nomarker");
            $('.marker').show();
            $('#marker_position').prop("disabled",false);
            markerPosition(false);
        } else {
             //$('.button.showmarker').removeClass("active");
            $('.overlay .top, .overlay .bottom').addClass("nomarker").css("height", "20%");
            $('.marker').hide();
            $('#marker_position').prop("disabled",true);
        }

        if (save) config.set('teleprompter_marker', $('#marker_enabled').is(":checked"));
    }
    
    // Manage marker position
    function markerPosition(save) {
        var markerPosition = Number($('#marker_position').val());

        $('.marker').css({ 'top': 'calc(' + markerPosition + '% - 20px)', });

        $('.overlay .top').not('.nomarker').css({ 'height': 'calc(' + markerPosition + '% - 50px)', });
        $('.overlay .bottom').not('.nomarker').css({ 'height': 'calc(100% - ' + markerPosition + '% - 50px)', });

        $('label.marker_position_label span').text('(' + markerPosition + '%)');
        
        if (save) config.set('teleprompter_marker_position', markerPosition);
    }


    function cloudSaveData(){
        //$('#cloud_upload i').addClass("bi-cloud-upload-fill").removeClass("bi-cloud-arrow-up");
        //setTimeout(function(){$('.button.upload').removeClass("active");}, 2000);
        $.post('https://teleprompter.evolution-team.net/cloud.php', // url
                getSettingsData(), // data to be submit
                function (data, status, jqXHR) {// success callback
                   //$('#cloud_upload i').addClass("bi-cloud-arrow-up").removeClass("bi-cloud-upload-fill");
                });
    }

    function cloudLoadData(what) {
        $('#cloud_download i').addClass("bi-cloud-download-fill").removeClass("bi-cloud-arrow-down");
                
        $.ajax({
            url: 'https://teleprompter.evolution-team.net/cloud.php', // Update the endpoint as necessary
            type: 'GET',
            data: {type: what, remote_code:$("#download_code").val()},
            dataType: 'json',
            cache: false,
            complete: function (event) {
                $('#cloud_download i').addClass("bi-cloud-arrow-down").removeClass("bi-cloud-download-fill");
                
                var response = event.responseJSON;
                
                if (!response.error) {
                    // Populate the row with data from the response
                    if (what == "settings"){
                        loadSettingsData(response);
                        setSettings(true);
                    }
                    else{
                        $('#teleprompter').html(response.teleprompter_text);
                        teleprompterUpdate();
                    }
                } else {
                    console.error(response.error);
                    alert(response.error);
                    // Handle the error (e.g., display a message to the user)
                }
            },
            error: function (xhr, status, error) {
                $('#cloud_download i').addClass("bi-cloud-arrow-down").removeClass("bi-cloud-download-fill");
                console.error("Error fetching data: ", error);
                alert(error);
            }
        });
    }
    

    // ********   Teleprompter
    
    function scrollAnimation(position = 0, duration = 250, easing = 'swing'){
        $('article').stop().animate({ scrollTop: position }, duration, easing, function () { $('article').clearQueue(); }, duration);
    }
    
    
     // Manage Scrolling Teleprompter
    function pageScroll() {
       
        pageSpeed = Math.floor(80 - Number($('#speed').val()));
        clearTimeout(scrollDelay);
        scrollDelay = setTimeout(pageScroll, pageSpeed);
  
        if ($('#flipy').is(":checked")) {
            scrollAnimation('-=2px',0,"linear");

            // We're at the bottom of the document, stop
            if ($("article").scrollTop() === 0) {
                teleprompterStop();
                setTimeout(function () { scrollAnimation($("#teleprompter").height(),500); }, 500);
            }
        } else {
             scrollAnimation('+=2px',0,"linear");

            // We're at the bottom of the document, stop
            if ($("article").scrollTop() >= (($("article")[0].scrollHeight - $(window).height()) - 100)) {
                teleprompterStop();
                setTimeout(function () { scrollAnimation(0, 500); }, 500);
            }
        }
    }

    // Start Teleprompter
    function teleprompterStart() {
        initOffcanvas.hide();
        
        $('#teleprompter').attr('contenteditable', false);
        $('article').addClass('playing');
        
        $('.overlay').not('.nomarker').fadeIn('fast');
        $('#menu_burger_icon, #start_prompter_display').hide();
        $('#pause_prompter').show();
        
        fullScreenEnter();
        
        
        var counter = Number($("input[name='start_delay']:checked").val());
        if (counter > 0) {
            $("#count_down").addClass("active").html(counter);

            coutdownTimer = setInterval(() => {
              counter--;
              if (counter == 0){
                    clearInterval(coutdownTimer);
                    $("#count_down").removeClass("active").html("");
                    
                    if ($('#reading_timer').is(":checked")) timer.startTimer();
                    pageScroll();
              }else $("#count_down").html(counter);

            }, 1000);
        }
        else{
            if ($('#reading_timer').is(":checked")) timer.startTimer();
            pageScroll();
        }
        
        
    }
    
    function teleprompterPause() {
        
    }

    // Stop Teleprompter
    function teleprompterStop() {
        fullScreenExit();

        clearTimeout(scrollDelay);
        clearInterval(coutdownTimer);
        
        if ($("#text_lock").is(":checked")) $('#teleprompter').prop("contenteditable", false);
        else $('#teleprompter').prop("contenteditable", true);
        
        initOffcanvas.show();
        
        $('.overlay').fadeOut('slow');
        $('article').removeClass('playing');
        $('#menu_burger_icon, #start_prompter_display').show();
        $('#pause_prompter').hide();
        $("#count_down").removeClass("active").html("");

        if ($('#reading_timer').is(":checked")) timer.stopTimer();
        timer.resetTimer();
        //resetTimer();
        
        // get to the beginning
        if ($('#flipy').is(":checked")) scrollAnimation($("#teleprompter").height());
        else scrollAnimation();
        
    }

    
    function teleprompterFocus(isFocused) {
        if (isFocused) $('#teleprompter').removeClass("flipx").removeClass("flipy").removeClass("flipxy");
        else{
            if ($('#flipx').is(":checked") && $('#flipy').is(":checked")) $('#teleprompter').addClass("flipxy");
                else{
                if ($('#flipx').is(":checked")) $('#teleprompter').addClass("flipx");
                if ($('#flipy').is(":checked")) $('#teleprompter').addClass("flipy");
            }
        }
    }
    
    
    // Update Teleprompter
    function teleprompterUpdate() {
        config.set('teleprompter_text', $('#teleprompter').html());
    }    
    
        // Clean Teleprompter
    function teleprompterClean() {
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
    
    
    // ********   Other functions
    
    function pasteCleanText(e){
        e.preventDefault();
        var text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand("insertHTML", false, text);
    }
    

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
    
    
    function fullScreenEnter(){
        var elem = document.body;
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
    }
    
    function fullScreenExit(){
        var elem = document;
        if (elem.exitFullscreen) {
          elem.exitFullscreen();
        } else if (elem.msExitFullscreen) {
          elem.msExitFullscreen();
        } else if (elem.mozExitFullScreen) {
          elem.mozExitFullScreen();
        } else if (elem.webkitExitFullscreen) {
          elem.webkitExitFullscreen();
        }
    }
    
     function booleanStringCheck(value){
        if (value === "true") return true;
        else if (value === "false") return false;
        else return value;
    }
    
    function dataFromStorage(key, fallbackValue, data = {}){
        var value = null;
        var dataEmpty = Object.keys(data).length === 0; 
        
        if (!dataEmpty && (key in data)){
            return booleanStringCheck(data[key]);
        }else if (config.get(key)){
            return booleanStringCheck(config.get(key));
        }else return fallbackValue;
    }
    
    function loadSettingsData(data = {}){
        
        $('#speed').val(Number(dataFromStorage("teleprompter_speed",initPageSpeed,data)));
        $('#font_size').val(Number(dataFromStorage("teleprompter_font_size",initFontSize,data)));
        $('#prompter_width').val(Number(dataFromStorage("teleprompter_prompter_width",initPrompterWidth,data)));
        $('#marker_position').val(Number(dataFromStorage("teleprompter_marker_position",initMarkerPosition,data)));
        
        $('#text_color_picker').val(dataFromStorage("teleprompter_text_color",initTextColor,data));
        $('#background_color_picker').val(dataFromStorage("teleprompter_background_color",initBackgroundColor,data));
        
        $('#flipx').prop('checked', dataFromStorage("teleprompter_flip_x",initFlipX,data));
        $('#flipy').prop('checked', dataFromStorage("teleprompter_flip_y",initFlipY,data));
        $('#marker_enabled').prop('checked', dataFromStorage("teleprompter_marker",initMarker,data));
        $('#reading_timer').prop('checked', dataFromStorage("teleprompter_reading_timer",initReadingTimer,data));
        
        $('#font_bold').prop('checked', dataFromStorage("teleprompter_font_bold",initFontBold,data));
        $('#text_lock').prop('checked', dataFromStorage("teleprompter_text_lock",initTextLock,data));
        
        $("input[name='start_delay'][value="+dataFromStorage("teleprompter_start_delay",initStartDelay,data)+"]").prop("checked",true);
    }
    
    function setSettings(save) {
        fontBold(save);
        textLock(save);
        textColor(save);
        backgroundColor(save);
        fontSize(save);
        promptSpeed(save);
        prompterWidth(save);
        flipX(save);
        flipY(save);
        readingMarker(save);
        markerPosition(save);
        readingTimer(save);
    }
    
    
    function getSettingsData(){
        var data = {
            teleprompter_speed:$('#speed').val(),
            teleprompter_font_size:$('#font_size').val(),
            teleprompter_prompter_width:$('#prompter_width').val(),
            teleprompter_marker_position:$('#marker_position').val(),

            teleprompter_text_color:$('#text_color_picker').val(),
            teleprompter_background_color:$('#background_color_picker').val(),

            teleprompter_flip_x:$('#flipx').is(':checked'),
            teleprompter_flip_y:$('#flipy').is(':checked'),
            teleprompter_marker:$('#marker_enabled').is(':checked'),
            teleprompter_reading_timer:$('#reading_timer').is(':checked'),

            teleprompter_font_bold:$('#font_bold').is(':checked'),
            teleprompter_text_lock:$('#text_lock').is(':checked'),

            teleprompter_start_delay:$("input[name='start_delay']:checked").val(),
            
            teleprompter_remote_code:initRemoteCode,
            teleprompter_text:$('#teleprompter').html()
        };
        return data;
    }
    
    
       // Listen for Key Presses on Body
    function keyShortcuts(evt) {
        var space = 32,
            pause = 80, // letter V =  for letter P use 80
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
        if (evt.keyCode == escape) teleprompterStop(); // stop teleprompter
        else if (evt.keyCode == space || evt.keyCode == pause /* letter v - quieter key*/){
            if ($('article').hasClass('playing')) teleprompterStop();
            else teleprompterStart();
        }  // Start Stop Scrolling
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
        else if (evt.keyCode == load_key) cloudLoadData("text"); // Load text
        else return true;

        evt.preventDefault();
        evt.stopPropagation();
        return false;
    }
    
})(jQuery);