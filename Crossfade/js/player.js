// Controls the audio files and how they behave specifically

class Player {

    static async addSongs(added_Songs, isURL, toLibrary) {
        if (isURL) {
            const videoId = Youtube.extractVideoId(added_Songs);
            if (videoId) {
                Youtube.addYouTubetoQueue(Youtube.getYouTubeVideoData(videoId))
            }
        }

        else {
            var files = added_Songs.files;

            for (var i = 0; i < files.length; i++) {
                var workingFile = files[i];

                let name = workingFile.name.replace(/\.[^/.]+$/, "");
                name = name.trim();

                const duration = await getAudioDuration(workingFile);

                let mediaItem;

                if (workingFile.type.startsWith('video/')) {
                    var video = document.createElement('video');
                    let blobURL = URL.createObjectURL(workingFile);
                    video.src = blobURL;
                    video.controls = true;
                    video.loop = false;

                    mediaItem = {
                        type: 'video',
                        file: workingFile,
                        Element: video,
                        title: name,
                        duration: duration,
                        blobURL: blobURL
                        /* Store also artist and thumbnail*/
                    };
                }

                else {
                    var audio = document.createElement("audio");
                    let blobURL = audio.src = URL.createObjectURL(workingFile);
                    audio.src = blobURL;
                    audio.controls = true;
                    audio.loop = false;

                    mediaItem = {
                        type: 'audio',
                        file: workingFile,
                        Element: audio,
                        title: name,
                        duration: duration,
                        blobURL: blobURL
                        /* Store also artist and thumbnail*/
                    };
                }

                if (toLibrary) {
                    StorageManager.storeFile(mediaItem);
                }
                else {
                    QueueManager.addToQueue(mediaItem, playlist.push(mediaItem) - 1);
                    if (playlist.length == 1) {
                        QueueManager.playFirstSong();
                    }
                }
            }
        }
    }

    static playPause() {
        if (isFading || isChangingSong) return;

        if (isPlaying) {
            this.changeSong(undefined);
        }

        else {
            this.changeSong("resume");
        }
    }

    static changeSong(type, song) {
        if (isFading || isChangingSong) return;
        isChangingSong = true;
        let nextIndex;

        // Handles edge case where if the song is paused and we change songs and not resuming
        if (!isPlaying && type !== "resume") {
            isPlaying = !isPlaying;
            updatePlayButton(isPlaying);
        }

        if (type == "back"){
            if (currentSongIndex === 0) {
                isChangingSong = false;
                return;
            }

            else {
                nextIndex = currentSongIndex - 1;
            }
        }

        else if (type == "forward") {
            if (currentSongIndex === (playlist.length - 1)) {
                nextIndex = 0;
            }

            else {
                nextIndex = currentSongIndex + 1;
            }
        }

        else if (typeof type === "number" && !isNaN(type)) {
            if (type === currentSongIndex && !song) {
                isChangingSong = false;
                return;
            }

            else {
                nextIndex = type;
            }
        }

        else if (type === undefined) {
            isPlaying = !isPlaying;
            updatePlayButton(isPlaying);
            if (song) {
                fadeInterval = setInterval(() => this.fade(song, undefined), intervalTime);
                return;
            }

            else {
                fadeInterval = setInterval(() => this.fade(currentSongIndex, undefined), intervalTime);
                return;
            }
        }

        else if (type === "resume") {
            isPlaying = !isPlaying;
            updatePlayButton(isPlaying);

            let currentItem = playlist[currentSongIndex];
            if (currentItem.type !== 'youtube') {
                currentItem.Element.volume = 0;
                currentItem.Element.play();
            }

            else {
                let player = currentItem.player;
                if (player) {
                    player.setVolume(0);
                    player.playVideo();
                }
            }
            fadeInterval = setInterval(() => this.fade(undefined, currentSongIndex), intervalTime);
            return;
        }

        let nextItem = playlist[nextIndex];

        if (nextItem.type === 'youtube') {
            let player = nextItem.player;
            if (player) {
                // Add loop youtube player logic
                player.seekTo(0);
                player.setVolume(0);
                player.playVideo();
            }
        }

        else {
            nextItem.Element.currentTime = 0;
            nextItem.Element.volume = 0;
            nextItem.Element.loop = isLoop;
            nextItem.Element.play();
        }

        if (song) {
            fadeInterval = setInterval(() => this.fade(song, nextIndex), intervalTime);
        }
        else {
            fadeInterval = setInterval(() => this.fade(currentSongIndex, nextIndex), intervalTime);
        }
    }

    static seek(value) {
        // Seek time of song

        if (Date.now() - this._lastSeek < 150) {
            return;
        }
        this._lastSeek = Date.now();

        let item = playlist[currentSongIndex];
        if (!item) return;

        if (item.type !== "youtube") {
            item.Element.currentTime = value;
        }

        else {
            let player = item.player;
            player.seekTo(parseFloat(value));
        }

        updatePlaytime();
    }

    static changeVolume(volume) {
        // Controls volume

        currentVolume = volume / 100;
        if (playlist[currentSongIndex].type !== "youtube") {
            playlist[currentSongIndex].Element.volume = currentVolume;
        }

        else {
            playlist[currentSongIndex].player.setVolume(currentVolume * 100);
        }
    }

    static loopSong() {
        // Updates looping stuff
        isLoop = !isLoop;
        updateLoopButton(isLoop);

        if (playlist[currentSongIndex]) {
                const currentItem = playlist[currentSongIndex];
            
            if (currentItem.type !== 'youtube') {
                currentItem.Element.loop = isLoop;
            } 
            
            else {
                const player = currentItem.player;
                if (player) {
                    // YouTube player loop handling
                    // Note: YouTube API doesn't have a direct loop property like audio elements
                    // You might need to handle this differently for YouTube
                    // This can be done with events listeners and states(?)
                }
            }
        }
    }

    static fade(currentSong, nextSong) {
        // Run a number of times set by SetInterval (built-in funciton)
        let currentAudio = (typeof currentSong === "number") ? playlist[currentSong] : currentSong;

        let nextAudio = (typeof nextSong === "number") ? playlist[nextSong] : nextSong;

        isFading = true;

        const noInfiniteFadeTime = Math.max(fadeTime, 0.1);

        fadeInPercent += intervalTime/(noInfiniteFadeTime * 1000);
        fadeOutPercent -= intervalTime/(noInfiniteFadeTime * 1000);

        let inVolume = fadeInPercent * currentVolume;
        let outVolume = fadeOutPercent * currentVolume;


        // Calculating audio dynamic fade volumes
        if (nextAudio !== undefined) {
            if (nextAudio.type !== 'youtube') {
                nextAudio.Element.volume = Math.min(1, Math.max(0, inVolume));
            }

            else {
                nextAudio.player.setVolume(Math.min(100, Math.max(0, inVolume * 100)));
            }
        }

        if (currentAudio !== undefined) {
            if (currentAudio.type !== 'youtube') {
                currentAudio.Element.volume = Math.min(1, Math.max(0, outVolume));
            } 
            
            else {
                currentAudio.player.setVolume(Math.min(100, Math.max(0, outVolume * 100)));
            }
        }

        // Code for when fades ends
        if (fadeInPercent >= 1 && fadeOutPercent <= 0){
            fadeInPercent = 0;
            fadeOutPercent = 1;

            // Code for when we are fading to nothing
            // Pauses and sets time to 0 of old song
            if (currentAudio !== undefined && nextAudio === undefined) {
                if (currentAudio.type !== 'youtube') {
                    currentAudio.Element.pause();
                } 
                
                else {
                    currentAudio.player.pauseVideo();
                }

                // If we remove the current song clean up here in fade()
                if (pendingRemoveCurrentSong !== undefined) {
                    Utils.removeSongCleanUp(pendingRemoveCurrentSong);
                    pendingRemoveCurrentSong = undefined;
                }

                if (playlist.length === 0) {
                    updateSongName("...");
                    updatePlaytime("0:00", "0:00");
                    
                    if (previousQueueElement) {
                        previousQueueElement.classList.remove('current');
                        previousQueueElement = null;
                    }
                }
            }

            // Code for when we are fading to another song
            else if (currentAudio !== undefined && nextAudio !== undefined) {
                let newIndex = playlist.indexOf(nextAudio);
                if (newIndex !== -1) {
                    if (currentAudio.type !== 'youtube') {
                        currentAudio.Element.pause();
                        currentAudio.Element.removeEventListener('ended', QueueManager.handleSongEnded);
                        currentAudio.Element.removeEventListener('timeupdate', updatePlaytime);
                    }

                    else {
                        Youtube.hideYouTubeVideo(currentAudio.videoId);
                        currentAudio.player.pauseVideo();
                    }

                    // If we remove the current song clean up here in fade()
                    if (pendingRemoveCurrentSong !== undefined) {
                        Utils.removeSongCleanUp(pendingRemoveCurrentSong);
                        pendingRemoveCurrentSong = undefined;
                    }

                    currentSongIndex = newIndex;
                    DOMManager.elements.songName.addEventListener('animationiteration', onAnimationEnd);
                    
                    if (nextAudio.type !== 'youtube') {
                        nextAudio.Element.volume = currentVolume;
                        nextAudio.Element.addEventListener('timeupdate', updatePlaytime);
                        nextAudio.Element.addEventListener('ended', QueueManager.handleSongEnded);
                    }
                    
                    else {
                        Youtube.showYouTubeVideo(nextAudio.videoId);
                        nextAudio.player.setVolume(currentVolume * 100);
                    }

                    updateCurrentSongHighlight();
                }
            }
            isFading = false;
            isChangingSong = false;
            clearInterval(fadeInterval);
            fadeInterval = null;
        }
    }
}