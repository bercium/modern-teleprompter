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
        initVoiceControll = false,
        initVoiceControllLanguage = 'en-US',
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
        
    var speechRec = null,
        speechPosition = 0,
        currentRecording = [],
        currentMatchArray = [], 
        matchHistory = [],
        currentPosition=0,
        recText = [];
        

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
        
        $('#voice_control').on("change", function () { voiceControll(true) });
        $('#voice_control_language').on("change", function () { voiceControllLanguage(true) });
        
        // teleprompter actions, editing and focus changes
        $('#teleprompter').on("keyup",function () { teleprompterUpdate(); })
                          .on("focusin",function(){ teleprompterFocus(true) })
                          .on("focusout",function(){ teleprompterFocus(false); })
                          .bind("paste", function(e){ pasteCleanText(e); } );
        
        
        // Listen for actions and button clicks
        $('body').on("keydown",keyShortcuts).on("mousedown",function(){dragable = true;}).on("mouseup",function(){dragable = false;});
 
        
        // Listen for Play Button Click
        $('#start_prompter, #start_prompter_display').on("click",function () { teleprompterStart(); });
        $('#stop_prompter').on("click",function () { teleprompterStop(); }).hide();
        $('#pause_prompter').on("click",function () { teleprompterPause(); }).hide();
        
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
        if ($("#font_bold").is(":checked")) $('#teleprompter, #voiceprompter').css("font-weight", "bold");
        else $('#teleprompter, #voiceprompter').css("font-weight", "normal");
        if (save) config.set('teleprompter_font_bold',$("#font_bold").is(":checked"));
    }
    
    function textLock(save){
        if ($("#text_lock").is(":checked")) $('#teleprompter').prop("contenteditable", false);
        else $('#teleprompter').prop("contenteditable", true);
        if (save) config.set('teleprompter_text_lock',$("#text_lock").is(":checked"));
    }
    
    function textColor(save) {
        var color = $("#text_color_picker").val();
        $('#teleprompter, #voiceprompter').css('color', color);
        $('#count_down').css('color', color);
        if (save) config.set('teleprompter_text_color', color);
    }
    
    function backgroundColor(save){
        var color = $("#background_color_picker").val();
        $('#teleprompter, #voiceprompter').css('background-color', color);
        $('article').css('background-color', color);
        if (save) config.set('teleprompter_background_color', color);
    }
    
    function startDelay(save) {
        if (save) config.set('teleprompter_start_delay',Number($("input[name='start_delay']:checked").val()));
    }

    // Manage Font Size Change
    function fontSize(save) {
        var fontSize = $('#font_size').val();

        $('#teleprompter, #voiceprompter').css({
            'font-size': fontSize + 'px',
            'line-height': Math.ceil(fontSize * 1.5) + 'px',
            //'padding-bottom': Math.ceil($(window).height() - $('header').height()) + 'px'
        });

        $('#teleprompter p, #voiceprompter p').css({
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
        $('#teleprompter, #voiceprompter').css({ 'width': Math.floor($('#prompter_width').val()) + '%', });
        $('label.prompter_width_label span').text('(' + $('#prompter_width').val() + '%)');
        if (save) config.set('teleprompter_prompter_width', $('#prompter_width').val());
    }


    function flipX(save) {
        //resetTimer();
        $('#teleprompter, #voiceprompter').removeClass('flipx').removeClass('flipy').removeClass('flipxy');
        
        if ($('#flipx').is(":checked") && $('#flipy').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipxy');
        else if ($('#flipy').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipy');
        else if ($('#flipx').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipx');
        
        if (save) config.set('teleprompter_flip_x', $('#flipx').is(":checked"));
    }

    function flipY(save) {
        //resetTimer();
        $('#teleprompter, #voiceprompter').removeClass('flipx').removeClass('flipy').removeClass('flipxy');
        
        if ($('#flipx').is(":checked") && $('#flipy').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipxy');
        else if ($('#flipy').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipy');
        else if ($('#flipx').is(":checked")) $('#teleprompter, #voiceprompter').addClass('flipx');
        

        if ($('#flipy').is(":checked")) {
            scrollAnimation($("#teleprompter, #voiceprompter").height());
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
    
    
    function voiceControll(save) {
        if (save) config.set('teleprompter_voice_control', $('#voice_control').is(":checked"));
    }
    
    
    function voiceControllLanguage(save) {
        if (save) config.set('teleprompter_voice_control_language', $('#voice_control_language').val());
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
        
        clearTimeout(scrollDelay);
        scrollDelay = setTimeout(pageScroll, Math.floor(80 - Number($('#speed').val())));
  
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
    
    
    function speechResult(type, finalRes, interimRes) {
        
        if (type == 'error') {
          //this.addMessage('error', interimRes);
          console.log(interimRes);
          if (speechRec !== null) teleprompterStop();
          //this.applySettings();
        } else if (type == 'result') {
                      
          finalRes = splitResult(finalRes);
          interimRes = splitResult(interimRes);
          
          currentRecording = finalRes;
          for (let i = 0; i < interimRes.length; i++) currentRecording.push(interimRes[i]);
          let match;
          [currentPosition, speechPosition, currentMatchArray, match] = matchText(recText, currentPosition, currentRecording, speechPosition, currentMatchArray);
          
          matchHistory.push(match);
          
          /*if (currentPosition >= recText.length) teleprompterStop();
          else speachProgress(currentPosition);*/
          if (currentPosition < recText.length) speachProgress(currentPosition);
        }
    }
    

    function speachProgress(position, reset = false) {

        if (reset) {
            for (let i = 0; i < recText.length; i++) $(".word_" + i).css("opacity", "1");
        } else {
            if ($("#voiceprompter").is(":hidden")) return;
            for (let i = 0; i < position; i++) $(".word_" + i).css("opacity", "0.3");

            let scrollToElem = $(".word_"+position);
            let top = scrollToElem.offset().top;
            let i = position;
            while (++i < recText.length) {
              scrollToElem = $(".word_"+i);
              
              if (Math.abs(scrollToElem.offset().top - top) >= $("#font_size").val()) break;
            }
            scrollToElem[0].scrollIntoView({ behavior: 'smooth', block: 'center' });

        }
    }
    

    // Start Teleprompter
    function teleprompterStart() {
        initOffcanvas.hide();
        
        $('#teleprompter').attr('contenteditable', false);
        $('article').addClass('playing').removeClass('paused');
        
        $('.overlay').not('.nomarker').fadeIn('fast');
        $('#menu_burger_icon, #start_prompter_display').hide();
        $('#stop_prompter').show();
        $('#pause_prompter').hide();
        
        
        fullScreenEnter();
        
        timer.resetTimer();
        
        // voice control
        if ($("#voice_control").is(":checked")){
            adaptText();

            speechPosition = 0;
            currentRecording = [];
            currentMatchArray = [];
            speechRec = new SpeechRecognizer((a, b, c) => speechResult(a, b, c), $("#language").val());

            $('#teleprompter').hide();
            $('#voiceprompter').show();

            speechRec.start();
            
            if ($('#reading_timer').is(":checked")) timer.startTimer();
            
        }else{
        // countdown
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
                // start the prompter
                if ($('#reading_timer').is(":checked")) timer.startTimer();
                pageScroll();
            }
        }
        
    }
    
    function teleprompterPause() {
        if (!$('article').hasClass('playing')) return;
            
        if ($('article').hasClass('paused')){
            $('article').removeClass('paused');
            $('#pause_prompter').fadeOut();
            timer.startTimer();
            if ($("#voice_control").is(":checked")){
                if (speechRec !== null) speechRec.start();
            }else pageScroll();
        }else{
            $('article').addClass('paused');
            $('#pause_prompter').fadeIn('fast');
            if (speechRec !== null) speechRec.stop();
            timer.stopTimer();
            clearTimeout(scrollDelay);            
        }
    }

    // Stop Teleprompter
    function teleprompterStop() {
        fullScreenExit();
        
        if ($("#voice_control").is(":checked")){
            if (speechRec !== null) speechRec.stop();
            currentPosition = 0;
            speachProgress(0,true);

            $('#teleprompter').show();
            $('#voiceprompter').hide();
        }

        clearTimeout(scrollDelay);
        clearInterval(coutdownTimer);
        
        if ($("#text_lock").is(":checked")) $('#teleprompter').prop("contenteditable", false);
        else $('#teleprompter').prop("contenteditable", true);
        
        initOffcanvas.show();
        
        $('.overlay').fadeOut('slow');
        $('article').removeClass('playing').removeClass('paused');
        $('#menu_burger_icon, #start_prompter_display').show();
        $('#stop_prompter').hide();
        $("#count_down").removeClass("active").html("");
        
        $('#pause_prompter').hide();

        if ($('#reading_timer').is(":checked")){
            timer.stopTimer();
            timer.resetTimer();
        }
                
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
        if (document.fullscreenElement === null) return;
        
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        } else if (document.mozExitFullScreen) {
          document.mozExitFullScreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
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
        
        $("#voice_control").prop('checked', dataFromStorage("teleprompter_voice_control",initVoiceControll,data));
        $("#voice_control_language option[value='"+dataFromStorage("teleprompter_voice_control_language",initVoiceControllLanguage,data)+"']").prop("selected",true);
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
        voiceControll(save);
        voiceControllLanguage(save);
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
            
            teleprompter_voice_control:$('#voice_control').is(':checked'),
            teleprompter_voice_control_language:$('#voice_control_language').val(),
            
            teleprompter_text:$('#teleprompter').html()
        };
        return data;
    }
    
    
       // Listen for Key Presses on Body
    function keyShortcuts(evt) {
        var space = 32,
            play = 80, // letter V =  for letter P use 80
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
            //console.log("target: "+evt.target.id);
            return true;
        }

        // Reset GUI
        if (evt.keyCode == escape) teleprompterStop(); // stop teleprompter
        if (evt.keyCode == play) {
            console.log("playing");
            if ($('article').hasClass('playing')) teleprompterStop();
            else teleprompterStart();
        }  // stop teleprompter
        else if (evt.keyCode == space) teleprompterPause();
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
    
    
    
    function adaptText() {
        const regex = /[\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\xd7\xf7]+/gm;
        recText = [];
        var splitText = [];
        var text = $("#teleprompter").text();
        let match;
        let idx = 0;
        while ((match = regex.exec(text)) !== null) {
            if (match.index > idx) {
                const word = text.substring(idx, match.index);
                recText.push({idx: splitText.length, word: simplify(word)});
                splitText.push(word);
            }
            splitText.push(match[0]);
            idx = match.index + match[0].length;
        }
        if (text.length > idx) {
            const word = text.substring(idx, text.length);
            recText.push({idx: splitText.length, word: simplify(word)});
            splitText.push(word);
        }
        
        $("#voiceprompter").html(wrapWordsWithSpans($("#teleprompter").html()));
        currentPosition = 0;
    }
    
    function wrapWordsWithSpans(html) {
        let wordCounter = -1; // Initialize word counter
        const div = document.createElement('div'); // Create a new div element to hold the HTML
        div.innerHTML = html; // Set the HTML to the div

        function handleTextNodes(node) {
            if (node.nodeType === 3) { // Node type 3 is a text node
                let text = node.nodeValue;
                // Updated regex to include punctuation following a word
                var matched = false
                let wrappedText = text.replace(/(\b\w+\b)([\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\xd7\xf7]*)/g, function(match, word, punctuation) {
                    matched = true;
                    wordCounter++;
                    return `<span class="word_${wordCounter}">${word}${punctuation}</span>`;
                });
                if (!matched && wrappedText.trim() != ''){
                    wordCounter++;
                    return `<span class="word_${wordCounter}">${wrappedText}</span>`;
                }

                node.nodeValue = ''; // Clear the text node
                let tempDiv = document.createElement('div'); // Temporary div to convert HTML string back to DOM
                tempDiv.innerHTML = wrappedText;
                while (tempDiv.firstChild) {
                    node.parentNode.insertBefore(tempDiv.firstChild, node);
                }
            } else if (node.nodeType === 1) { // Node type 1 is an element node
                Array.from(node.childNodes).forEach(handleTextNodes); // Recursively handle child nodes
            }
        }

        Array.from(div.childNodes).forEach(handleTextNodes); // Start processing
        return div.innerHTML; // Return the modified HTML as a string
    }

    function max(a, b) {
        return a > b ? a : b;
    }

    function min(a, b) {
        return a > b ? b : a;
    }
    
    function escapeHtml(word) {
        return word.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/ /g, '&nbsp;')
                .replace(/\r?\n/g, '&#8203;<br />&#8203;');
    }

    function simplify(word) {
        word = word.toLowerCase();
        word = word.replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss');
        word = word.replace(/é/g, 'e').replace(/è/g, 'e').replace(/ê/g, 'e').replace(/á/g, 'a');
        word = word.replace(/à/g, 'a').replace(/â/g, 'a').replace(/ô/g, 'o').replace(/î/g, 'i');
        word = word.replace(/ù/g, 'u').replace(/û/g, 'u').replace(/ë/g, 'e').replace(/ï/g, 'i');
        word = word.replace(/ç/g, 'c').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
        return word;
    }

    function lcs(stra, strb) {
        const l = [];
        for (let i = 0; i <= stra.length; i++) {
            l[i] = [];
            for (let j = 0; j <= strb.length; j++)
                l[i][j] = [0, 0, 0];
        }
        for (let i = 0; i <= stra.length; i++) {
            for (let j = 0; j <= strb.length; j++) {
                if (i == 0 || j == 0)
                    l[i][j] = [-1, -1, 0];
                else if (stra[i - 1] == strb[j - 1])
                    l[i][j] = [i - 1, j - 1, l[i - 1][j - 1][2] + 1];
                else {
                    if (l[i - 1][j][2] > l[i][j - 1][2])
                        l[i][j] = [i - 1, j, l[i - 1][j][2]];
                    else
                        l[i][j] = [i, j - 1, l[i][j - 1][2]];
                }
            }
        }
        let res = '';
        let i = stra.length, j = strb.length;
        let cur = l[i][j];
        while (cur[2] > 0) {
            if (cur[0] < i && cur[1] < j)
                res = stra[ cur[0] ] + res;
            i = cur[0];
            j = cur[1];
            cur = l[i][j];
        }
        return res;
    }

    function cmpScore(stra, strb) {
        const maxlen = max(stra.length, strb.length);
        const lenfac = (maxlen < 4) ? Math.sqrt(maxlen / 4) : 1;
        if (stra == strb)
            return lenfac * 1;
        if (stra.length < strb.length)
            [stra, strb] = [strb, stra];
        if (stra.includes(strb))
            return lenfac * strb.length / stra.length;
        const lcstr = lcs(stra, strb);
        const fac = stra.includes(lcstr) ? (strb.includes(lcstr) ? 1 : 0.9) : (strb.includes(lcstr) ? 0.9 : 0.8);
        return lenfac * fac * lcstr.length / stra.length;
    }

    function splitResult(result) {
        const regex = /[\x00-\x2f\x3a-\x40\x5b-\x60\x7b-\xbf\xd7\xf7]+/gm;
        const res = result.split(regex);
        for (let i = res.length - 1; i >= 0; i--) {
            res[i] = simplify(res[i]);
            if (res[i] == '')
                res.splice(i, 1);
        }
        return res;
    }

    function ceilIndex(tail, l, r, val) {
        while (r - l > 1) {
            m = l + Math.floor((r - l) / 2);
            if (val <= tail[m])
                r = m;
            else
                l = m;
        }
        return r;
    }

    function lis(seq) {
        if (seq.length == 0)
            return [];
        let tail = [];
        let idxTail = [];
        let p = [];
        let length = 1;
        for (let i = 0; i < seq.length; i++) {
            tail.push(0);
            idxTail.push(0);
            p.push(-1);
        }
        tail[0] = seq[0];
        idxTail[0] = 0;
        p[0] = -1;
        for (let i = 1; i < seq.length; i++) {
            if (seq[i] < tail[0]) {
                tail[0] = seq[i];
                idxTail[0] = i;
                p[i] = -1;
            } else if (seq[i] > tail[length - 1]) {
                tail[length++] = seq[i];
                idxTail[length - 1] = i;
                p[i] = idxTail[length - 2];
            } else {
                const ci = ceilIndex(tail, -1, length - 1, seq[i]);
                tail[ci] = seq[i];
                idxTail[ci] = i;
                p[i] = ci > 0 ? idxTail[ci - 1] : -1;
            }
        }
        let res = [];
        let cpos = idxTail[length - 1];
        while (cpos >= 0) {
            res.push(cpos);
            cpos = p[cpos];
        }
        res.reverse();
        if (res.length != length)
            throw new Error('fatal');
        return res;
    }

    function matchText(recText, currentPosition, currentRecording, speechPosition, currentMatchArray) {
        let newPosition = currentPosition;
        if (speechPosition > currentRecording.length) {
            newPosition -= speechPosition - currentRecording.length;
            speechPosition = currentRecording.length;
        }

        const mWord = i => currentMatchArray[i][0];
        const firstIdx = (i, val) => {
            if (typeof val === 'undefined')
                return currentMatchArray[i][1][0];
            currentMatchArray[i][1][0] = val;
        };
        const firstScore = (i, val) => {
            if (typeof val === 'undefined')
                return currentMatchArray[i][1][1];
            currentMatchArray[i][1][1] = val;
        };
        const secondIdx = (i, val) => {
            if (typeof val === 'undefined')
                return currentMatchArray[i][2][0];
            currentMatchArray[i][2][0] = val;
        };
        const secondScore = (i, val) => {
            if (typeof val === 'undefined')
                return currentMatchArray[i][2][1];
            currentMatchArray[i][2][1] = val;
        };

        let maxScore = -1;
        for (let i = max(0, speechPosition - 10); i < currentRecording.length; i++) {
            while (i >= currentMatchArray.length)
                currentMatchArray.push(['PLACEHOLDER WORD', [-1, -1], [-1, -1]]);
            if (mWord(i) != currentRecording[i] || firstIdx(i) == -1 || bestScore(i) < 0.7) {
                const targetIdx = newPosition + i - speechPosition;
                firstIdx(i, -1);
                firstScore(i, -1);
                secondIdx(i, -1);
                secondScore(i, -1);
                for (let j = max(0, targetIdx - 3); j < min(recText.length, targetIdx + 9); j++) {
                    const score = cmpScore(recText[j].word, currentRecording[i]);
                    if (score > firstScore(i) || (score == firstScore(i) && Math.abs(j - targetIdx) < Math.abs(firstIdx(i) - targetIdx))) {
                        secondScore(i, firstScore(i));
                        secondIdx(i, firstIdx(i));
                        firstScore(i, score);
                        firstIdx(i, j);
                    }
                }
                let setnew = false, fIdx = firstIdx(i), fScore = firstScore(i);
                if (fIdx == -1)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 3 && fScore < 0.5)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 5 && fScore < 0.7)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 7 && fScore < 0.9)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 9 && fScore < 1)
                    setnew = true;
                if (setnew) {
                    firstScore(i, secondScore(i));
                    firstIdx(i, secondIdx(i));
                    secondScore(i, -1);
                    secondIdx(i, -1);
                }
                setnew = false;
                fIdx = firstIdx(i);
                fScore = firstScore(i);
                if (fIdx == -1)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 3 && fScore < 0.5)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 5 && fScore < 0.7)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 7 && fScore < 0.9)
                    setnew = true;
                else if (Math.abs(fIdx - targetIdx) > 9 && fScore < 1)
                    setnew = true;
                if (setnew) {
                    firstIdx(i, max(0, min(targetIdx, recText.length - 1)));
                    firstScore(i, cmpScore(recText[max(0, min(targetIdx, recText.length - 1))].word, currentRecording[i]));
                }
                maxScore = max(maxScore, firstScore(i));
            }
        }
        let idxMaxArr = [], idxMatchArr = [];
        for (let i = max(0, speechPosition - 10); i < currentRecording.length; i++) {
            if (firstScore(i) >= maxScore - 1e-6) {
                idxMaxArr.push(i);
                idxMatchArr.push(firstIdx(i));
            }
        }
        let lisequ = lis(idxMatchArr).map(i => idxMaxArr[i]);

        const recBestMatch = (leftBoundary, rightBoundary, lowerBound, upperBound, liseq) => {
            for (let maxIdx = 0; maxIdx <= liseq.length; maxIdx++) {
                let rangeStart = (maxIdx == 0) ? leftBoundary : liseq[maxIdx - 1] + 1;
                let rangeEnd = (maxIdx == liseq.length) ? rightBoundary : liseq[maxIdx];
                let lower = lowerBound, upper = upperBound;
                if (maxIdx > 0)
                    lower = firstIdx(liseq[maxIdx - 1]);
                if (maxIdx < liseq.length)
                    upper = firstIdx(liseq[maxIdx]);
                if (rangeEnd - rangeStart > 0) {
                    maxScore = -1;
                    for (let i = rangeStart; i < rangeEnd; i++) {
                        if (firstIdx(i) <= lower || firstIdx(i) >= upper) {
                            if (secondIdx(i) > lower && secondIdx(i) < upper) {
                                firstScore(i, secondScore(i));
                                firstIdx(i, secondIdx(i));
                                secondScore(i, -1);
                                secondIdx(i, -1);
                            } else if (upper - lower >= 2) {
                                const newIdx = Math.floor(lower + (upper - lower - 1) * (i + 1 - rangeStart) / (rangeEnd - rangeStart));
                                firstScore(i, cmpScore(currentRecording[i], recText[newIdx].word));
                                firstIdx(i, newIdx);
                                secondScore(i, -1);
                                secondIdx(i, -1);
                            } else {
                                firstScore(i, -1);
                                firstIdx(i, -1);
                                secondScore(i, -1);
                                secondIdx(i, -1);
                            }
                        }
                        maxScore = max(maxScore, firstScore(i));
                    }
                    if (rangeEnd - rangeStart > 1 && maxScore >= 0) {
                        idxMaxArr = [];
                        idxMatchArr = [];
                        for (let i = rangeStart; i < rangeEnd; i++) {
                            if (firstScore(i) >= maxScore - 1e-6 && firstIdx(i) >= 0) {
                                idxMaxArr.push(i);
                                idxMatchArr.push(firstIdx(i));
                            }
                        }
                        let lisequ2 = lis(idxMatchArr).map(i => idxMaxArr[i]);
                        recBestMatch(rangeStart, rangeEnd, lower, upper, lisequ2);
                    }
                }
            }
        };
        recBestMatch(
                max(0, speechPosition - 10),
                currentRecording.length,
                max(-1, firstIdx(lisequ[0]) - 6),
                min(recText.length, firstIdx(lisequ[lisequ.length - 1])
                        + min(1 + 2 * (currentRecording.length - lisequ[lisequ.length - 1] - 1), 6)),
                lisequ);

        maxScore = -1;
        let maxPos = -1, foundPos = false;
        for (let i = currentRecording.length - 1; i >= max(0, currentRecording.length - 5); i--) {
            if (firstScore(i) >= 0.8) {
                speechPosition = i + 1;
                foundPos = true;
                break;
            } else if (firstScore(i) > maxScore) {
                maxScore = firstScore(i);
                maxPos = i + 1;
            }
        }
        if (!foundPos && maxPos >= 1)
            speechPosition = maxPos;
        if (speechPosition >= 1 && firstIdx(speechPosition - 1) >= 0)
            newPosition = firstIdx(speechPosition - 1) + 1;
        else if (speechPosition < currentRecording.length && firstIdx(speechPosition) >= 0)
            newPosition = firstIdx(speechPosition);
        if (newPosition < currentPosition && currentPosition - newPosition == 1) {
            newPosition = currentPosition;
            speechPosition++;
        }
        let match = [[], []];
        let lastUpperIdx = -1;
        for (let i = max(0, speechPosition - 10); i < currentRecording.length; i++) {
            if (firstIdx(i) == -1) {
                match[0].push(' ');
                match[1].push(currentRecording[i]);
            } else {
                while (lastUpperIdx >= 0 && lastUpperIdx + 1 < firstIdx(i)) {
                    lastUpperIdx++;
                    match[0].push(recText[lastUpperIdx].word);
                    match[1].push(' ');
                }
                lastUpperIdx = firstIdx(i);
                match[0].push(recText[lastUpperIdx].word);
                match[1].push(currentRecording[i]);
            }
        }
        for (let j = lastUpperIdx + 1; j < min(lastUpperIdx + 6, recText.length); j++) {
            match[0].push(recText[j].word);
            match[1].push(' ');
        }
        while (currentMatchArray.length > currentRecording.length)
            currentMatchArray.pop();
        return [newPosition, speechPosition, currentMatchArray, match];
    }

    
    
    
    
})(jQuery);