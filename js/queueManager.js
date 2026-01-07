// Manages anything related to the queue, includes adding songs
// Functions that use the function changeSong() in their code should go here 

class QueueManager {

    static addToQueue(audio, index) {
        DOMManager.elements.queueText.innerHTML = "";
        DOMManager.elements.queueAddText.innerHTML = "";
        const elementDiv = document.createElement('div');
        const dragHandle = document.createElement('div');
        const removeButton = document.createElement('button');
    
        elementDiv.classList.add('queue_Element');
        elementDiv.id = `queue_Element_${index}`;
        elementDiv.dataset.index = index;
        elementDiv.audioRef = audio;
        elementDiv.addEventListener('click', () => {
            Player.changeSong(parseInt(elementDiv.dataset.index));
        });
    
        dragHandle.classList.add('drag_Handle');
        dragHandle.innerText = '☰';
        dragHandle.draggable = true;
        dragHandle.addEventListener('dragstart', (e) => DragDrop.dragStart(e, elementDiv));
        dragHandle.addEventListener('dragend', DragDrop.dragEnd);
    
        removeButton.textContent = 'X'; 
        removeButton.classList.add('queue_Remove_Button');
        removeButton.id = `queue_Remove_Button_${index}`;
        removeButton.addEventListener('click', (event) => {
            event.stopPropagation();
            QueueManager.removeSong(parseInt(elementDiv.dataset.index));
        });


        DOMManager.elements.fullPlayer.style.minHeight = "435px";
        const outerContentDiv = document.createElement('div');
        outerContentDiv.classList.add('outer-queue-content');

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('queue-content');

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('queue-thumbnail');

        if (audio.thumbnail) {
            const img = document.createElement('img');
            img.src = audio.thumbnail;
            img.alt = audio.title;
            thumbnailDiv.appendChild(img);
            thumbnailDiv.classList.add('has-thumbnail');
        }

        const titleDiv = document.createElement('div');
        titleDiv.classList.add('queue-title');
        titleDiv.textContent = audio.title;

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('queue-info');
        infoDiv.textContent = audio.artist || 'Unknown Artist';


        contentDiv.appendChild(titleDiv);
        contentDiv.appendChild(infoDiv);

        outerContentDiv.appendChild(thumbnailDiv);
        outerContentDiv.appendChild(contentDiv);

        elementDiv.appendChild(outerContentDiv);
        elementDiv.appendChild(dragHandle);
    
        elementDiv.appendChild(removeButton);
        DOMManager.elements.queueContents.appendChild(elementDiv);
    }

    static playFirstSong() {
        // Helper function to play first song
        let firstSong = playlist[0];
        isPlaying = true;
        updatePlayButton(isPlaying);
        updateSongName(firstSong.title)

        if (firstSong.type !== 'youtube') {
            firstSong.Element.volume = currentVolume;
            firstSong.Element.loop = isLoop;
            firstSong.Element.addEventListener('timeupdate', updatePlaytime);
            firstSong.Element.addEventListener('ended', this.handleSongEnded);
            firstSong.Element.play();
        }

        else {
            let videoId = firstSong.videoId;
            Youtube.showYouTubeVideo(videoId);
            
            firstSong.player.setVolume(currentVolume * 100);
            firstSong.player.playVideo();
        }

        DOMManager.elements.songName.addEventListener('animationiteration', onAnimationEnd);
        updateCurrentSongHighlight();
    }

    static removeSong(index) {
        if (isFading) return;

        if (playlist.length === 1) {
            DOMManager.elements.queueText.innerHTML = "Drop a Song";
            DOMManager.elements.queueAddText.innerHTML = "+";
        }

        let removingAudio = playlist[index];

        playlist.splice(index, 1);

        // Rebuild queue DOM
        DOMManager.elements.queueContents.innerHTML = "";
        playlist.forEach((audio, newIndex) => {
            this.addToQueue(audio, newIndex);
        });

        if (index === currentSongIndex) {
            if (playlist.length === 0) {
                // This variable is used to track audio for clean up
                pendingRemoveCurrentSong = removingAudio;
                Player.changeSong(undefined, removingAudio);
            } 
            
            else {
                let nextIndex = Math.min(index, playlist.length - 1);
                // This variable is used to track audio for clean up
                pendingRemoveCurrentSong = removingAudio;
                Player.changeSong(nextIndex, removingAudio);
            }
        } 

        else if (index < currentSongIndex) {
            // Since audio is removed without having to wait for fade logic to
            // complete, we can clean up immediately
            Utils.removeSongCleanUp(removingAudio);
            currentSongIndex--;
        }

        else {
            // Since audio is removed without having to wait for fade logic to
            // complete, we can clean up immediately
            Utils.removeSongCleanUp(removingAudio);
        }

        updateCurrentSongHighlight();
    }

    static handleSongEnded() {
        if (!isLoop && !isFading) {
            playlist[currentSongIndex].Element.removeEventListener('ended', this.handleSongEnded);
            if (currentSongIndex === (playlist.length - 1)) {
                Player.changeSong(0);
            }

            else {
                Player.changeSong("forward");
            }
        }
    }
}