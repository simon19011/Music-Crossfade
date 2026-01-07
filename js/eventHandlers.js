class EventHandlers {
    static setUpEventListeners() {
        this.setUpKeyboardEvents();
        this.setUpDragEvents();
        this.setUpWindowEvents();
        this.setUpQueueDragDropEvents();
        this.setUpButtons();
    }

    static setUpKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            if (isChangingSong) {
                return;
            }
            e.preventDefault();
            document.activeElement.blur();
            Player.playPause();
        }
        });
    }

    static setUpDragEvents() {
        DOMManager.elements.playerHeader.addEventListener('mousedown', (e) => {
        isDraggingPlayer = true;
        DOMManager.elements.playerHeader.style.cursor = 'grabbing';

        let rect = DOMManager.elements.fullPlayer.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
        });

        DOMManager.elements.queueHeader.addEventListener('mousedown', (e) => {
        isDraggingQueue = true;
        DOMManager.elements.queueHeader.style.cursor = 'grabbing';

        let rect = DOMManager.elements.queueBox.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
        });

        DOMManager.elements.searchHeader.addEventListener('mousedown', (e) => {
        isDraggingSearch = true;
        DOMManager.elements.searchHeader.style.cursor = 'grabbing';

        let rect = DOMManager.elements.searchBox.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        document.body.style.userSelect = "none";
        });

        DOMManager.elements.libraryHeader.addEventListener('mousedown', (e) => {
            isDraggingLibrary = true;
            DOMManager.elements.libraryHeader.style.cursor = 'grabbing';

            let rect = DOMManager.elements.libraryBox.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            document.body.style.userSelect = "none";
        });

        document.addEventListener('mouseup', () => {
        isDraggingPlayer = false;
        isDraggingQueue = false;
        isDraggingSearch = false;
        isDraggingLibrary = false;

        DOMManager.elements.playerHeader.style.cursor = 'grab';
        DOMManager.elements.queueHeader.style.cursor = 'grab';
        DOMManager.elements.searchHeader.style.cursor = 'grab';
        DOMManager.elements.libraryHeader.style.cursor = 'grab';
        document.body.style.userSelect = "auto";
        });

        document.addEventListener('mousemove', (e) => {
        // Moves the boxes when mouse is held down on headers
        if (isDraggingPlayer) {
            let x = e.clientX - offsetX
            let y = e.clientY - offsetY;
            DOMManager.elements.fullPlayer.style.left = `${x}px`;
            DOMManager.elements.fullPlayer.style.top = `${y}px`;
        }

        if (isDraggingQueue) {
            let x = e.clientX - offsetX
            let y = e.clientY - offsetY;
            DOMManager.elements.queueBox.style.left = `${x}px`;
            DOMManager.elements.queueBox.style.top = `${y}px`;
        }

        if (isDraggingSearch) {
            let x = e.clientX - offsetX
            let y = e.clientY - offsetY;
            DOMManager.elements.searchBox.style.left = `${x}px`;
            DOMManager.elements.searchBox.style.top = `${y}px`;
        }

        if (isDraggingLibrary) {
            let x = e.clientX - offsetX
            let y = e.clientY - offsetY;
            DOMManager.elements.libraryBox.style.left = `${x}px`;
            DOMManager.elements.libraryBox.style.top = `${y}px`;
        }
        });
    }

    static setUpWindowEvents() {
        window.addEventListener('resize', () => {
            if (resizeOn) {
                DOMManager.centerQueue();
                DOMManager.centerPlayer();
                DOMManager.centerSearch();
                DOMManager.centerLibrary();
            }
        });
    }

    static setUpQueueDragDropEvents() {
        DOMManager.elements.queueContents.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (!draggedElement) return;

            let mouseY = e.clientY;
            let children = Array.from(DOMManager.elements.queueContents.children).filter(el => el !== draggedElement && el !== dropIndicator);

            let closest = null;
            let closestDistance = Infinity;

            children.forEach(el => {
                let rect = el.getBoundingClientRect();
                let dist = Math.abs(mouseY - (rect.top + rect.height / 2));

                if (dist < closestDistance) {
                    closestDistance = dist;
                    closest = el;
                }
            });

            if (DOMManager.elements.queueContents.contains(dropIndicator)) dropIndicator.remove();

            if (!closest) {
                // Empty list or dragged above/below all
                DOMManager.elements.queueContents.appendChild(dropIndicator);
            } 

            else {
                let rect = closest.getBoundingClientRect();
                let middleY = rect.top + rect.height / 2;

                if (mouseY > middleY) {
                    if (closest.nextSibling) {
                        DOMManager.elements.queueContents.insertBefore(dropIndicator, closest.nextSibling);
                    }

                    else {
                        DOMManager.elements.queueContents.appendChild(dropIndicator);
                    }
                }

                else {
                    DOMManager.elements.queueContents.insertBefore(dropIndicator, closest);
                }
            }
        });

        DOMManager.elements.queueContents.addEventListener('drop', (e) => {
            e.preventDefault();
            if (!draggedElement) return;
            
            let newIndex;
            
            if (DOMManager.elements.queueContents.contains(dropIndicator)) {
                let dropIndex = Array.from(DOMManager.elements.queueContents.children).indexOf(dropIndicator);
                newIndex = Math.max(0, dropIndex);
            } 
            
            else {
                newIndex = playlist.length;
            }
        
            let fromIndex = parseInt(draggedElement.dataset.index);
        
            // Adjust newIndex if dragging within the list
            if (fromIndex < newIndex) {
                newIndex = Math.max(0, newIndex - 1);
            }
        
            // Move the song in the playlist
            let movedSong = playlist.splice(fromIndex, 1)[0];
            playlist.splice(newIndex, 0, movedSong);
        
            // Update currentSongIndex if necessary
            if (fromIndex === currentSongIndex) {
                currentSongIndex = newIndex;
            } 
            else if (fromIndex < currentSongIndex && newIndex >= currentSongIndex) {
                currentSongIndex--;
            } 
            else if (fromIndex > currentSongIndex && newIndex <= currentSongIndex) {
                currentSongIndex++;
            }
        
            // Clean up
            if (DOMManager.elements.queueContents.contains(dropIndicator)) {
                dropIndicator.remove();
            }
            draggedElement = null;
        
            rebuildQueue();
        });

        DOMManager.elements.queueBox.addEventListener('dragover', (e) => {
            // When dragging a file over, changes the colour
            e.preventDefault();
            DOMManager.elements.queueBox.classList.add('drag-over');
        });

        DOMManager.elements.queueBox.addEventListener('dragleave', () => {
            // When dragging off, changes the colour back
            DOMManager.elements.queueBox.classList.remove('drag-over');
        });

        DOMManager.elements.queueBox.addEventListener('drop', (e) => {
            // Adds file(s) to the list of songs
            e.preventDefault();
            DOMManager.elements.queueBox.classList.remove('drag-over');

            Player.addSongs(e.dataTransfer, false);
        });

        DOMManager.elements.libraryBox.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOMManager.elements.libraryBox.classList.add('drag-over');
        });

        DOMManager.elements.libraryBox.addEventListener('dragleave', () => {
            DOMManager.elements.libraryBox.classList.remove('drag-over');
        });

        DOMManager.elements.libraryBox.addEventListener('drop', (e) => {
            // Adds file(s) to the list of songs
            e.preventDefault();
            DOMManager.elements.libraryBox.classList.remove('drag-over');

            // Add Files to library logic -------------

            if (draggedElement) {
                let playlistIndex = parseInt(draggedElement.dataset.index);
                let item = playlist[playlistIndex];

                if (item.type === 'audio') {
                    StorageManager.storeFile(item);
                }

                else {
                    // Download youtube video and save to library
                    return;
                }

                if (DOMManager.elements.queueContents.contains(dropIndicator)) {
                    dropIndicator.remove();
                }
                draggedElement = null;
                return;
            }

            else {
                Player.addSongs(e.dataTransfer, false, true);
            }

        });
    }

    static setUpButtons() {
        DOMManager.elements.backButton.addEventListener('click', () => Player.changeSong("back"));

        DOMManager.elements.forwardButton.addEventListener('click', () => Player.changeSong("forward"));

        DOMManager.elements.playButton.addEventListener('click', () => Player.playPause());

        DOMManager.elements.loopButton.addEventListener('click', () => Player.loopSong());

        DOMManager.elements.playtimeSlider.addEventListener('input', (e) => Player.seek(e.target.value));

        DOMManager.elements.volumeSlider.addEventListener('input', (e) => Player.changeVolume(e.target.value));

        DOMManager.elements.fadeTimeSlider.addEventListener('input', (e) => changeFadeTime(parseInt(e.target.value)));

        DOMManager.elements.searchButton.addEventListener('click', () => {
            let urlInput = DOMManager.elements.searchInput;
            let url = urlInput.value.trim();
            this.clearSearch(false);
            Youtube.newYouTubeSearch(url);
        });

        DOMManager.elements.searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                let url = e.target.value.trim();
                this.clearSearch(false);
                if (url) {
                    Youtube.newYouTubeSearch(url);
                }
            }
        });
    }

    static clearSearch(clearAll) {
        DOMManager.elements.searchResult.innerHTML = '';
    
        DOMManager.elements.searchBox.style.minWidth = '';
        DOMManager.elements.searchBox.style.minHeight = '';

        if (clearAll) {
            DOMManager.elements.searchInput.value = '';
            DOMManager.elements.searchBox.style.width = DOMManager.elements.searchBox.style.minWidth;
            DOMManager.elements.searchBox.style.height = DOMManager.elements.searchBox.style.minHeight;
            DOMManager.elements.searchBox.style.transition = 'background-color 0.2s ease-out, min-width 0.3s ease, min-height 0.3s ease, width 0.3s ease, height 0.3s ease';
            DOMManager.elements.searchBox.style.transition = 'background-color 0.2s ease-out, min-width 0.3s ease, min-height 0.3s ease';
        }

        let searchResults = document.querySelectorAll('.search-result');
        let searchVideoIds = Array.from(searchResults).map(el => el.dataset.videoId);

         youtubeDataPlayer.forEach((player, videoId) => {
            let isInPlaylist = playlist.some(song => song.videoId === videoId);
            let isInSearchResults = searchVideoIds.includes(videoId);
            let isCurrentSong = currentSongIndex !== -1 && playlist[currentSongIndex]?.videoId === videoId;
            
            if (!isInPlaylist && !isInSearchResults && !isCurrentSong) {
                // Remove the player from DOM
                let playerDiv = document.getElementById(`yt_${videoId}`);
                if (playerDiv) {
                    playerDiv.remove();
                }
                // Remove from youtubeDataPlayer map
                youtubeDataPlayer.delete(videoId);
            }
        });
    }
}