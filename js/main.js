// To implement:
// - Youtube playlists - Might have to use Youtube API for this
// - Work with copyrighted songs
//   - Use yt-dlp to work around (?)
// - Videos have visual player
// - Thumbnail and artist name extraction

// - Local song library
//   - Download youtube songs w/yt-dlp(?)
//   - Add Thumbnail and artist name to audio files

// - Sound effect player
//   - Sound effect library
//   - Each sound effect has symbol (?) - some default ones + user uploads

// - Ambiance Player
//   - Long form background sounds
//   - Same symbol feature as sound effect player

// - Different Themes
//   - Vinyl Theme - doesn't crossfade but plays a scratch sound when switching songs
//   - Immersive Theme - gets colour of album cover/thumbnail - used 
//     mainly for immersive experience (change background [fades to next background])
//   - Blue Tech Theme - glitchy sounds and radio frequency vibes
//   - Cassete Theme - old cassete tape vibes
//   - High Fantasy Theme - you know what high fantasy is


let playlist = [];
let currentSongIndex = 0;
let previousQueueElement = null;
let draggedElement = null;
let currentEndedListener = null;
let dropIndicator = document.createElement('div');
dropIndicator.classList.add('queue_Drop_Indicator');

// Flags
let isPlaying = true;
let isLoop = false;
let isFading = false;
let isChangingSong = false;
let isDraggingPlayer = false;
let isDraggingQueue = false;
let isDraggingQueueElement = false;
let isDraggingSearch = false;
let isDraggingLibrary = false;
let pendingRemoveCurrentSong = undefined;
let resizeOn = false;

// Global Variables needed across functions
let currentVolume = 1;
let fadeTime = 10;
let fadeInPercent = 0;
let fadeOutPercent = 1;
let intervalTime = 100;
let offsetX = 0;
let offsetY = 0;

// Youtube Variables
let youtubeDataPlayer = new Map();

var fadeInterval;

document.addEventListener('DOMContentLoaded', async () => {
    // Initialise all stuff needed at start
    // This is our DOMs, Events and Database
    DOMManager.initialise();
    EventHandlers.setUpEventListeners();

    const storageManager = new StorageManager();
    await StorageManager.initialise();
    await StorageManager.loadLibrary();
});

// Update visual DOM elements

function getAudioDuration(file) {
    return new Promise((resolve, reject) => {
        const audio = document.createElement('audio');
        const blobURL = URL.createObjectURL(file);

        audio.preload = 'metadata';
        audio.src = blobURL;

        audio.onloadedmetadata = () => {
            URL.revokeObjectURL(blobURL); // Clean up the blob URL
            resolve(audio.duration);
        };

        audio.onerror = () => {
            URL.revokeObjectURL(blobURL); // Clean up the blob URL
            reject(new Error(`Failed to load audio metadata for ${file.name}`));
        };

        // Set a timeout in case the audio never loads
        setTimeout(() => {
            audio.onloadedmetadata = null;
            audio.onerror = null;
            URL.revokeObjectURL(blobURL);
            reject(new Error(`Timeout loading audio metadata for ${file.name}`));
        }, 10000); // 10 second timeout
    });
}

function updatePlayButton(isPlaying) {
    DOMManager.elements.playButton.textContent = isPlaying ? "❚❚" : "▶";
}

function updateLoopButton(isLoop) {
    DOMManager.elements.loopButton.classList.toggle('active', isLoop);
}

function updateFadeTimeLabel(fadeTime) {
    DOMManager.elements.fadeTimeLabel.innerHTML = fadeTime + "seconds";
}

function onAnimationEnd() {
    DOMManager.elements.songName.removeEventListener('animationiteration', this.onAnimationEnd);
    if (!playlist[currentSongIndex]) return;
    let currentItem = playlist[currentSongIndex];
    DOMManager.elements.songName.innerText = currentItem.type === 'audio' ? currentItem.title : currentItem.title;
}

function rebuildQueue() {
    let currentAudio = playlist[currentSongIndex];
    DOMManager.elements.queueContents.innerHTML = "";

    playlist.forEach((audio, index) => {
        QueueManager.addToQueue(audio, index);
    });
    
    currentSongIndex = playlist.indexOf(currentAudio);
    updateCurrentSongHighlight();
}

function updateCurrentSongHighlight() {
    document.querySelectorAll('.queue_Element').forEach(el => el.classList.remove('current'));

    let currentAudio = playlist[currentSongIndex];
    if (!currentAudio) return;

    let currentElement = document.getElementById(`queue_Element_${currentSongIndex}`);
    if (currentElement) {
        currentElement.classList.add('current');
    }
}

function updatePlaytime() {
    let currentItem = playlist[currentSongIndex];
    if (!currentItem) {
        return;
    }

    let currentTime = 0;
    let duration = 0;

    if (currentItem.type !== "youtube") {
        currentTime = currentItem.Element.currentTime
        duration = currentItem.duration;
    }

    else {
        let player = currentItem.player;

        currentTime = player.getCurrentTime();
        duration = player.getDuration();
    }

    let currentTimeMinutes = Math.floor(currentTime / 60);
    let currentTimeSeconds = Math.floor(currentTime % 60);
    let durationMinutes = Math.floor(duration / 60);
    let durationSeconds = Math.floor(duration % 60);

    DOMManager.elements.playtimeSlider.value = currentTime;
    DOMManager.elements.playtimeSlider.max = duration;
    DOMManager.elements.currentPlaytime.innerHTML = `${currentTimeMinutes}:${currentTimeSeconds.toString().padStart(2, '0')}`;
    DOMManager.elements.endPlaytime.innerHTML = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;
}

function changeFadeTime(time) {
    if (isFading) {
        DOMManager.elements.fadeTimeSlider.value = fadeTime;
        return;
    }
    DOMManager.elements.fadeTimeLabel.innerHTML = time + " Seconds";
    fadeTime = time;
}

function updateSongName(name) {
    DOMManager.elements.songName.innerText = name;
}