// Manages the DOM elements like all the stuff the user sees
// When a DOM element is changed (i.e. innerHTML = ...) it should be here

class DOMManager {
    // Set up DOM elements
    static elements = {};
    static boxPositions = {
        full_Player: { x: 0.5, y: 0.5, height: 0.48},
        queue_Box: { x: 0.75, y: 0.25, height: 0.33},
        search_Box: { x: 0.25, y: 0.15},
        library_Box: { x: 0.25, y: 0.65},
        ambience_Box: { x: 0.75, y: 0.65}
    };

    static initialise() {
        this.elements = {
            fullPlayer : document.getElementById("full_Player"),
            playerHeader : document.getElementById("player_Header"),
            videoPlayer : document.getElementById("video_Player"),
            songName : document.getElementById("song_Name"),
            currentPlaytime : document.getElementById("current_Playtime"),
            playtimeSlider : document.getElementById("playtime_Slider"),
            endPlaytime : document.getElementById("end_Playtime"),
            backButton : document.getElementById("back_Button"),
            forwardButton : document.getElementById("forward_Button"),
            playButton : document.getElementById("play_Button"),
            loopButton : document.getElementById("loop_Button"),
            volumeSlider : document.getElementById("volume_Slider"),
            volumeLabel : document.getElementById("volume_Label"),
            fadeTimeSlider : document.getElementById("fade_Time_Slider"),
            fadeTimeLabel : document.getElementById("fade_Time_Label"),
            queueBox : document.getElementById("queue_Box"),
            queueHeader : document.getElementById("queue_Header"),
            queueContents : document.getElementById("queue_Contents"),
            queueText : document.getElementById('queue_Text'),
            queueAddText : document.getElementById('queue_Add_Text'),
            searchBox : document.getElementById("search_Box"),
            searchHeader : document.getElementById("search_Header"),
            searchInput : document.getElementById("search_Input"),
            searchButton : document.getElementById("search_Button"),
            searchResult : document.getElementById("search_Result"),
            libraryBox : document.getElementById("library_Box"),
            libraryHeader : document.getElementById("library_Header"),
            libraryContents : document.getElementById("library_Contents"),
            ambienceBox : document.getElementById("ambience_Box"),
            ambienceHeader : document.getElementById("ambience_Header"),
            ambienceContents : document.getElementById("ambience_Contents")
        };

        this.centerElements();
    }


    // Center all DOM elements 
    static centerElements() {
        Object.entries(this.boxPositions).forEach(([id, config]) => {
            const el = document.getElementById(id);

            if (config.height) {
                let minHeight = parseInt(getComputedStyle(el).minHeight);
                let targetHeight = window.innerHeight * config.height;

                el.style.height = `${Math.max(targetHeight, minHeight)}px`
            }
            
            let rect = el.getBoundingClientRect();

            let centerX = (window.innerWidth * config.x) - rect.width / 2;
            let centerY = (window.innerHeight * config.y) - rect.height / 2;

            el.style.left = `${centerX}px`;
            el.style.top = `${centerY}px`;
        });
    }
}