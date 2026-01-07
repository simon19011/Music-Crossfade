 class Youtube {
    // Helper function for getting Video ID out of a link
    static extractVideoId(url) {
        // Extracts YouTube video ID from URL 

        if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
            return url;
        }

        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/,
            /youtube\.com\/embed\/([^?]+)/,
            /youtube\.com\/v\/([^?]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    static async getYouTubeVideoData(videoId) {

        if (youtubeDataPlayer.has(videoId)) {
            let cached = youtubeDataPlayer.get(videoId);
            return cached.media;
        }

        const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        const data = await response.json();

        let mediaData = {
            type: 'youtube',
            videoId: videoId,
            title: data.title,
            artist: data.author_name,
            thumbnail: data.thumbnail_url,
            duration: 'Loading...',
            player: null,
            playerReady: false
        }

        youtubeDataPlayer.set(videoId, mediaData);

        return mediaData;
    }

    static async newYouTubeSearch(url) {
        // Create search video DOM elements

        let videoId = this.extractVideoId(url);
        let videoIdDoubleCheck = false;

        if (youtubeDataPlayer.has(videoId)) {
            videoIdDoubleCheck = true;
        }

        let mediaData = await this.getYouTubeVideoData(videoId);
        let mediaItem = youtubeDataPlayer.get(videoId);

        // Create the result container
        const resultDiv = document.createElement('div');
        resultDiv.classList.add('search-result');
        resultDiv.dataset.videoId = videoId;
        resultDiv.addEventListener('click', () => {
            if (!mediaItem.playerReady) {
                return;
            }

            if (videoIdDoubleCheck) {
                return;
            }

            this.addYouTubetoQueue(videoId);
            EventHandlers.clearSearch(true);
        });

        // Create thumbnail
        const thumbnail = document.createElement('img');
        thumbnail.src = mediaData.thumbnail;
        thumbnail.alt = "Video thumbnail";
        thumbnail.classList.add('search-thumbnail');

        // Create content container
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('search-content');

        // Create title
        const titleDiv = document.createElement('div');
        titleDiv.classList.add('search-title');
        titleDiv.textContent = mediaData.title;

        const metaContainer = document.createElement('div');
        metaContainer.classList.add('search-meta');

        // Create artist
        const artistDiv = document.createElement('div');
        artistDiv.classList.add('search-artist');
        artistDiv.textContent = mediaData.artist;

        // Create duration
        const durationDiv = document.createElement('div');
        durationDiv.classList.add('search-duration');
        durationDiv.textContent = mediaData.duration;

        // Assemble the content
        contentDiv.appendChild(titleDiv);
        metaContainer.appendChild(artistDiv);
        metaContainer.appendChild(durationDiv);
        contentDiv.appendChild(metaContainer);

        // Assemble the result
        resultDiv.appendChild(thumbnail);
        resultDiv.appendChild(contentDiv);
        DOMManager.elements.searchResult.appendChild(resultDiv);
        DOMManager.elements.searchBox.style.minWidth = '480px';
        DOMManager.elements.searchBox.style.minHeight = '230px';

        // Creates the player and updates duration
        this.createYouTubePlayer(videoId, durationDiv);
        durationDiv.textContent = mediaItem.duration;
    }

    static async addYouTubetoQueue(videoId) {
        // Does all the stuff needed to add the YouTube video to queue

        let mediaItem = youtubeDataPlayer.get(videoId);

        QueueManager.addToQueue(mediaItem, playlist.push(mediaItem) - 1);

        if (playlist.length == 1) {
            QueueManager.playFirstSong();
        }
    }

    static handleYouTubeStateChange(event) {
        let playerEvent = event.target;

        if (event.data === YT.PlayerState.ENDED) {
            if (isLoop) {
                playerEvent.seekTo(0);
            }
            else Player.changeSong("forward");
        }
    }

    static createYouTubePlayer(videoId, durationDiv) {
        // Creates the player that is going to be displayed

        const cached = youtubeDataPlayer.get(videoId);
        if (cached && cached.player) {
            return cached.player;
        }

        let playerDiv = document.createElement("div");
        playerDiv.id = "yt_" + videoId;
        playerDiv.style.width = "100%";
        playerDiv.style.height = "100%";
        playerDiv.style.position = "relative";
        playerDiv.style.display = "none";
        playerDiv.style.pointerEvents = "none";
        playerDiv.style.borderRadius = "7px";
        DOMManager.elements.videoPlayer.appendChild(playerDiv);

        let player = new YT.Player(playerDiv, {
            videoId: videoId, 
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                modestbranding: 1,
                playsinline: 1,
                rel: 0,
                iv_load_policy: 3,
                preload: "auto"
            }, 
            events: {
                onReady: (e) => {
                    let totalSeconds = player.getDuration();
                    let seconds = Math.floor(totalSeconds % 60);
                    let minutes = Math.floor(totalSeconds / 60) % 60;
                    let durationText;
                    if (totalSeconds >= 3600) {
                        let hours = Math.floor(totalSeconds / 3600);
                        durationText = `${hours}:${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }

                    else {
                        durationText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                        
                    const cached = youtubeDataPlayer.get(videoId);
                    if (cached) {
                        cached.duration = durationText;
                        durationDiv.textContent = durationText;
                        cached.playerReady = true;
                    }
                }, 
                onStateChange: (event) => {
                    this.handleYouTubeStateChange(event);

                    const cached = youtubeDataPlayer.get(videoId);

                    if (event.data === YT.PlayerState.PLAYING) {
                        if (!cached.animationFrameId) {
                            const updateTime = () => {
                                if (player.getPlayerState() === YT.PlayerState.PLAYING) {
                                    updatePlaytime();
                                    cached.animationFrameId = requestAnimationFrame(updateTime);
                                }
                            };
                            cached.animationFrameId = requestAnimationFrame(updateTime);
                        }
                    }

                    else {
                        if (cached.animationFrameId) {
                            cancelAnimationFrame(cached.animationFrameId);
                            cached.animationFrameId = null;
                        }
                    }

                    if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
                        updatePlaytime();
                    }
                }
            }
        });

        youtubeDataPlayer.get(videoId).player = player;
        return player;
    }

    static showYouTubeVideo(videoId) {
        let mediaItem = youtubeDataPlayer.get(videoId);
        const container = document.getElementById("yt_" + videoId);
        container.style.display = "block";
    }

    static hideYouTubeVideo(videoId) {
        let mediaItem = youtubeDataPlayer.get(videoId);
        const container = document.getElementById("yt_" + videoId);
        container.style.display = "none";
    }
}