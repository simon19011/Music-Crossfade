// Manages the DOM elements like all the stuff the user sees
// When a DOM element is changed (i.e. innerHTML = ...) it should be here

class DOMManager {
    // Set up DOM elements
    static elements = {};

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
            libraryContents : document.getElementById("library_Contents")
        };

        this.centerElements();
    }


    // Center all DOM elements 
    static centerElements() {
        this.centerPlayer();
        this.centerQueue();
        this.centerSearch();
        this.centerLibrary();
    }

    static centerPlayer() {
        let rect = this.elements.fullPlayer.getBoundingClientRect();
        let centerX = (window.innerWidth * 0.5) - (rect.width / 2);
        let centerY = (window. innerHeight * 0.30) - (rect.height / 2);
        this.elements.fullPlayer.style.left = `${centerX}px`;
        this.elements.fullPlayer.style.top = `${centerY}px`;
    }

    static centerQueue() {
        let rect = this.elements.queueBox.getBoundingClientRect();
        let centerX = (window.innerWidth * 0.5) - (rect.width / 2);
        let centerY = (window. innerHeight * 0.4) + (rect.height / 2);
        this.elements.queueBox.style.left = `${centerX}px`;
        this.elements.queueBox.style.top = `${centerY}px`;
    }

    static centerSearch() {
        let rect = this.elements.searchBox.getBoundingClientRect();
        let centerX = (window.innerWidth * 0.25) - (rect.width / 2);
        let centerY = (window. innerHeight * 0.15) + (rect.height / 2);
        this.elements.searchBox.style.left = `${centerX}px`;
        this.elements.searchBox.style.top = `${centerY}px`;
    }

    static centerLibrary() {
        let rect = this.elements.libraryBox.getBoundingClientRect();
        let centerX = (window.innerWidth * 0.25) - (rect.width / 2);
        let centerY = (window. innerHeight * 0.65) - (rect.height / 2);
        this.elements.libraryBox.style.left = `${centerX}px`;
        this.elements.libraryBox.style.top = `${centerY}px`;
    }
}