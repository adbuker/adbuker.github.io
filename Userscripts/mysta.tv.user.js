// ==UserScript==
// @name         mysta.tv - edited
// @namespace
// @version      1.2.r
// @description  get uuid, load json, get m3u8, streamlink, hls player
// @include      https://appweb.mysta.tv/web/share/profile?id=*
// @include      https://api.mysta.tv/*
// @require      https://code.jquery.com/jquery-latest.js
// @grant        GM_xmlhttpRequest
// @run-at       document-ready
// ==/UserScript==
(function() {
	'use strict';
	var css = [
        //video player
        ".nd_video_box,.nd_video_mask{position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;min-height:100%;justify-content:center;align-items:center}.nd_video_box{display:none;opacity:0;/*transition:opacity 0.5s ease-in*/}.nd_video_mask{display:flex;background-color:rgba(0,0,0,0.9)}.nd_video{position:relative;width:calc(80vh/1.77);height:80vh;display:flex;background-color:#000;z-index:1000}.nd_video_close{position:fixed;top:24px;right:24px;width:48px;cursor:pointer;z-index:1000}.nd_btn_container{display:inline-block;margin:5px 0;width:100%}.nd_button{display:inherit;text-decoration:none;text-align:center;color:white;width:97%;padding:10px 0;margin:0 2px 5px;border-radius:4px;font-size:16px;}.nd_button.browser{background:#4CAF50;cursor: pointer;}.nd_button.computer{background:#2196f3}.nd_button.download{background:#009688}",
        //prev next
        ".nd_video_wrapper{position: relative;} .nd_video_prev {left: -72px;} .nd_video_next {right: -72px;} .nd_video_prev, .nd_video_next {position: absolute;top: 50%;margin-top: -24px;width: 48px;cursor: pointer;z-index: 1000;}",
        //bigger thumbnail
        "#profile .video_list{max-width: unset !important;}#profile .video_list li{width: 20vw !important;min-width: 300px !important;margin-right: 5px !important;margin-left: 5px !important;margin-bottom: 0px !important;margin-top: 0px !important;}#profile .video_list li:nth-child(3n){margin-right: 10px !important;}@media (max-width: 740px){#profile .video_list li{width: 80vw !important;}}",
        //img alt title
        ".alt-wrap{display:block;position:relative;color:#f5f5f5;}.alt-wrap p.alt{color:#fff !important;text-align: center !important;position:absolute;opacity:0;left:0;right:0;bottom:0;margin:0;padding:5px;font-size:14px;line-height:22px;background-color:rgba(0,0,0,.8);transition:all .3s ease;}.alt-wrap:hover>p.alt{opacity:1;}"
	].join("\n");

	var jscript = [
        "function playvideo(playlist) {",
        "   console.log('Play video : '+playlist);",
		"	var player = document.getElementsByClassName('nd_video')[0];",
		"	var hls = new Hls({autoStartLoad: false});",
		"	hls.loadSource(playlist);",
		"	hls.attachMedia(player);",
		"	hls.on(Hls.Events.MANIFEST_PARSED, function () {",
		"		hls.startLevel = 1;",
		"		hls.loadLevel = 1;",
		"		hls.currentLevel = 1;",
		"		hls.nextLevel = 1;",
		"		hls.startLoad(startPosition = -1);",
		"		player.play();",
		"	});",
		"}",
        "function stopvideo() {",
        "   console.log('Stop video');",
        "	var player = document.getElementsByClassName('nd_video')[0];",
        "   player.pause();",
		"}"
	].join("\n");

	function addStyle(style){
		var head = document.getElementsByTagName("head");
		var cssNode = document.createElement("style");
		var elementStyle = head[0].appendChild(cssNode);
		elementStyle.innerHTML = style;
		return elementStyle;
	}

	function addScript(jssc, pos){
		//console.log("addScript : " +jssc);
		var loc = document.getElementsByTagName(pos);
		var script = document.createElement("script");
		var elementScr;
		if (jssc.indexOf("http") == 0) {
			script.src = jssc;
			script.type = 'text/javascript';
			elementScr = loc[0].appendChild(script);
		}else{
			elementScr = loc[0].appendChild(script);
			elementScr.innerHTML = jssc;
		}
		return elementScr;
	}

    //insert video player
    var videohtml = "<div class='nd_video_box'><div class='nd_video_mask' ></div>"+
    "<div class='nd_video_wrapper'><img class='nd_video_prev' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij4KICAgIDxwYXRoIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjRkZGIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0zMCAzNkwxOCAyNGwxMi0xMiIvPgo8L3N2Zz4K' >"+
    "<img class='nd_video_next' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij4KICAgIDxwYXRoIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlPSIjRkZGIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjMiIGQ9Ik0xOCAzNmwxMi0xMi0xMi0xMiIvPgo8L3N2Zz4K' >"+
    "<video class='nd_video' controls></video></div>"+
    "<img class='nd_video_close' src='data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4Ij4KICAgIDxnIGZpbGw9IiNGRkYiIGZpbGwtcnVsZT0iZXZlbm9kZCI+CiAgICAgICAgPHBhdGggZD0iTTE2LjU3NSAzNC4wNDZsMTYuOTctMTYuOTctMi4xMi0yLjEyMi0xNi45NyAxNi45N3oiLz4KICAgICAgICA8cGF0aCBkPSJNMTQuNDU0IDE3LjA3NWwxNi45NyAxNi45NyAyLjEyMi0yLjEyLTE2Ljk3LTE2Ljk3eiIvPgogICAgPC9nPgo8L3N2Zz4K' ></div>";
	$("body").append(videohtml);

    //get profile id from url
	var urlparams = new URL(window.location.href).searchParams;
	var user_id = urlparams.get("id");

    function start(){
        //get movie lists
        //https://api.mysta.tv/v1/cast/movie/list?castid=401313&page=1
        $(".video_list").empty();
        var jsonURL = "https://api.mysta.tv/v1/cast/movie/list?castid="+user_id+"&page=1";
        console.log(jsonURL);
        GM_xmlhttpRequest({
            method: "GET",
            url: jsonURL,
            headers: {
                //"origin": "mysta.tv",
                "accept": "application/json",
                "user-agent": "okhttp/3.12.1",
                "accept-encoding": "gzip",
                "x-mysta-token" : "",
                "x-mysta-nonce" : "",
                "x-mysta-device" : "android",
                "x-mysta-app-version" : "",
                "x-mysta-uuid" : ""
            },
            onload: function(jsonData) {
                var data = jsonData.responseText;
                var jsonResult = JSON.parse(data);
                //console.log(">> Movie count : " +jsonResult.movies.length);
                for (var i = 0; i < jsonResult.movies.length; i++){
                    var vid_url = jsonResult.movies[i].url;
                    var vid_dt = vid_url.split("/")[3].split("_")[1];
                    var vid_thumb = jsonResult.movies[i].thumbnail;
                    var vid_uuid = jsonResult.movies[i].uuid;
                    var vid_regdt = jsonResult.movies[i].regdt.replace(/\:/g, '.');
                    //2019-05-07 13:13:21 --> 2019-05-07 13.13 am/pm
                    var vid_date = vid_regdt.substr(0,10);
                    var vid_hour = vid_regdt.substr(11,2);
                    var vid_mins = vid_regdt.substr(14,2);
                    var vid_ampm = vid_hour >= 12 ? "pm" : "am";
                    vid_hour = vid_hour % 12;
                    vid_hour = vid_hour ? vid_hour : 12; // the hour '0' should be '12'
                    vid_hour = vid_hour < 10 ? "0"+vid_hour : vid_hour;
                    var url_dload = "streamlink-mysta://download/"+vid_uuid+"/"+vid_dt+"/"+vid_date+"/"+vid_hour+"/"+vid_mins+"/"+vid_ampm;
                    var url_stream = "streamlink-mysta://watch/"+vid_uuid+"/"+vid_dt+"/"+vid_date+"/"+vid_hour+"/"+vid_mins+"/"+vid_ampm;

                    //extra
                    var vid_title = jsonResult.movies[i].title;

                    /*
                    var vid_id = jsonResult.movies[i].id;
                    var vid_parentMovieId = jsonResult.movies[i].parent_movie_id;
                    var hasParent = "";
                    if(vid_parentMovieId !== 0){
                        //hasParent = " parent='"+vid_parentMovieId+"'";
                        hasParent = " has parent : "+vid_parentMovieId;
                    }
                    var id_data = "ID : "+vid_id+" "+hasParent;
                     */

                    var vid_movieType = jsonResult.movies[i].movie_type;
                    var hasAppeal = "";
                    if(vid_movieType == 2){
                        hasAppeal = "<div class='label appeal' style='z-index: 1;'><img src='https://d1wkpu36mmv5um.cloudfront.net/assets/img/web_share/icon_appeal.png' width='26' height='16'></div>";
                    }

                    var vidlist_html = ""+
                    "<li>"+
                    "<div class='thumbnail'>"+
                        ""+hasAppeal+""+
                        "<img class='nd_thumb' src='"+vid_thumb+"' alt='"+vid_title+"' >"+
                        "<div class='nd_btn_container'>"+
                            "<a href='"+url_dload+"' class='nd_button download'>📥 Download</a>"+
                            //"<a onclick='nd_video_open(\""+vid_url+"\");' class='nd_button browser'>▶ Play on browser</a>"+
                            //"<a url-data-"+i+"='"+vid_url+"' onclick='nd_video_open("+i+");' class='nd_button browser'>▶ Play on browser</a>"+
                            "<a data-playindex='"+i+"' data-playlist-"+i+"='"+vid_url+"' class='nd_button browser'>▶ Play on browser</a>"+
                            "<a href='"+url_stream+"' class='nd_button computer'>▶ Watch on PC</a>"+
                        "</div>"
                    "</div>"+
                    "</li>";

                    $(".video_list").append(vidlist_html);

                }

                var playindex;
                var playlist;
                var player;
                var hls;
                ;
                function close_video(){
                    //console.log("Closing video box");
                    $(".nd_video_box").css({opacity: 1}).animate({
                        opacity: 0
                    }, 500, function(){$(this).css({display: 'none'}) });
                    stopvideo();
                }

                function open_video(index){
                    if($(".nd_video_box").css("opacity") === "0"){
                        //console.log("Showing video box");
                        $(".nd_video_box").css({opacity: 0, display: 'flex'}).animate({
                            opacity: 1
                        }, 500);
                    }else{
                        //console.log("Video box already shown");
                    }
                    //update prevnext
                    if(index-1 == -1){
                        $(".nd_video_prev").hide();
                    }else{
                        $(".nd_video_prev").show();
                    }
                    if( $(".nd_button.browser").last().data("playindex") == index ){
                        $(".nd_video_next").hide();
                    }else{
                        $(".nd_video_next").show();
                    }

                    //console.log("Playing index "+index);
                    playlist = $(".nd_button.browser").eq(index).data("playlist-"+index);
                    console.log("Playlist is "+playlist);

                    playvideo(playlist);

                }

                $(document).keydown(function(e) {
                    if (e.key === "Escape") { // escape key maps to keycode `27`
                        close_video();
                   }
                });
                $(".nd_button.browser").each(function(index) {
                    $(this).on("click", function(){
                        playindex = $(this).data("playindex");
                        open_video(playindex);
                    });
                });
                $(".nd_video_next, .nd_video_prev").on("click", function(){
                    var now = $(this).attr("class").substr(9);
                    switch (now) {
                        case "next":
                            playindex++;
                            open_video(playindex);
                            break;
                        case "prev":
                            playindex--;
                            open_video(playindex);
                            break;
                    }
                });
                $(".nd_video_close, .nd_video_mask").on("click",close_video);
                $(".thumbnail .nd_thumb").wrap('<div class="alt-wrap"/>');
                $(".thumbnail .nd_thumb").each(function() {
                    $(this).after('<p class="alt">' + $(this).attr('alt') + '</p>');
                })
            }
        });


    }
    addStyle(css);
	addScript("https://cdnjs.cloudflare.com/ajax/libs/hls.js/0.12.4/hls.min.js", "body");
    addScript(jscript, "body");
    start();
})();
