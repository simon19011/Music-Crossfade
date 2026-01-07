class StorageManager {
    constructor() {
        this.db = null;
        this.dbName = 'MusicPlayerDB';
        this.dbVersion = 1;
    }

    static async initialise() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onerror = (event) => {
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                this.db = event.target.result;
                this.createStores(event);
            };
        });
    }

    static createStores(event) {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('preferences')) {
            const preferencesStore = db.createObjectStore('preferences', { keyPath: 'id' });
            preferencesStore.createIndex('id', 'id', { unique: true});

            preferencesStore.add({
                id: 'userPrefs',
                theme: 'default',
                storageUsed: 0
            });
        }

        if (!db.objectStoreNames.contains('mediaLibrary')) {
            const mediaStore = db.createObjectStore('mediaLibrary', { keyPath: 'title'});
            
            // Indexes are used to create references of data based on whatever
            // we define (i.e. type, title, etc.) for quicker lookup
            mediaStore.createIndex('type', 'type', { unique: false});
            mediaStore.createIndex('title', 'title', { unique: false});
            mediaStore.createIndex('artist', 'artist', { unique: false});
            mediaStore.createIndex('fileSize', 'fileSize', { unique: false});
        }
    }

    static async storeFile(data = {}) {
        try {
            let file = data.file;
            const arrayBuffer = await this.fileToArrayBuffer(file);

            let fileTitle = data.title;
            let fileType = data.type.startsWith('audio') ? 'audio' : 'video';
            let fileSize = file.size;

            const mediaItem = {
                title: fileTitle,
                type: fileType,
                fileData: arrayBuffer,
                fileSize: fileSize,
                artist: data.artist || 'Unknown Artist' /* Update to pull artist straight from file */,
                duration: data.duration || 0,
                thumbnail: data.thumbnail || null /* Update to pull thumbnail straight from file */
            };

            await this.addMediaToDatabase(mediaItem);
            await this.updateStorage(fileSize);
        }

        catch (error) {
            console.error('Failed to store file:', error);
        }
    }

    static fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    static async addMediaToDatabase(mediaItem) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['mediaLibrary'], 'readwrite');
            const store = transaction.objectStore('mediaLibrary');
            const request = store.add(mediaItem);

            request.onsuccess = () => {
                this.loadLibrary();
                resolve(mediaItem);
            };
            request.onerror = (event) => reject(event.target.error);
        })
    }

    static async updateStorage(sizeChange) {
        const prefs = await this.getUserPreferences();
        prefs.storageUsed = prefs.storageUsed + sizeChange;
        await this.saveUserPreferences(prefs);
    }

    static async deleteFile(fileTitle) {
        try {
            const mediaItem = await this.getMediaItem(fileTitle);
            const fileSize = mediaItem.fileSize;

            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['mediaLibrary'], 'readwrite');
                const store = transaction.objectStore('mediaLibrary');
                const request = store.delete(fileTitle);

                request.onsuccess = () => resolve();
                request.onerror = (event) => reject(event.target.error);
            });

            await this.updateStorage(-fileSize);
            await this.loadLibrary();
        }

        catch (error) {
            console.error('Failed to delete file:', error);
            throw error;
        }
    }

    static async getMediaItem(fileTitle) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['mediaLibrary'], 'readonly');
            const store = transaction.objectStore('mediaLibrary');
            const request = store.get(fileTitle);

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve(result);
                }

                else {
                    reject(new Error('Media item not found'));
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async getUserPreferences() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['preferences'], 'readonly');
            const store = transaction.objectStore('preferences');
            const request = store.get('userPrefs');

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (result) {
                    resolve(result);
                }

                else {
                    const defaultPrefs = {
                        id: 'userPrefs',
                        theme: 'default',
                        storageUsed: 0
                    };

                    resolve(defaultPrefs);
                }
            };

            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async saveUserPreferences(prefs) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['preferences'], 'readwrite');
            const store = transaction.objectStore('preferences');
            const request = store.put(prefs);

            request.onsuccess = () => resolve(prefs);
            request.onerror = (event) => reject(event.target.error);
        });
    }

    static async addToQueueFromLibrary(fileTitle) {
        const mediaItem = await StorageManager.getMediaItem(fileTitle);
        const blob = new Blob([mediaItem.fileData]);
        const blobURL = URL.createObjectURL(blob);

        let playerItem;

        if (mediaItem.type === 'audio') {
            const audio = document.createElement("audio");
            audio.src = blobURL;
            audio.controls = true;
            audio.loop = false;

            let name = mediaItem.title.replace(/\.[^/.]+$/, "");
            name = name.trim();
            audio.dataset.title = name;
            const duration = await getAudioDuration(blob);

            playerItem = {
                type: 'audio',
                file: blob,
                Element: audio,
                title: name,
                duration: duration,
                blobURL: blobURL
            };
        }

        else {
            return;
        }

        QueueManager.addToQueue(playerItem, playlist.push(playerItem) - 1);

        if (playlist.length === 1) {
            QueueManager.playFirstSong();
        }
    }

    static async loadLibrary() {
        try {
            DOMManager.elements.libraryContents.innerHTML = '';

            const loadingDiv = document.createElement('div');
            loadingDiv.textContent = "Loading files..."
            loadingDiv.classList.add('loading-text');

            DOMManager.elements.libraryContents.appendChild(loadingDiv);

            const allMedia = await this.getAllDatabase();

            if (allMedia.length === 0) {
                loadingDiv.textContent = "No media found"
                const addDiv = document.createElement('div');
                addDiv.textContent = "+";
                addDiv.classList.add('add-text');
                DOMManager.elements.libraryContents.appendChild(addDiv);
                return;
            }

            DOMManager.elements.libraryContents.innerHTML = '';

            allMedia.forEach(item => {
                this.createLibraryElement(item);
            });
        }

        catch (error) {
            console.error('Failed to load library:', error);
            DOMManager.elements.libraryContents.innerHTML = '<div style="color: red; text-align: center; padding: 20px;">Failed to load library</div>';
        }
    }

    static createLibraryElement(item) {
        const singleSongDiv = document.createElement('div');
        singleSongDiv.classList.add('library_element');
        singleSongDiv.addEventListener('click', () => {
            this.addToQueueFromLibrary(item.title);
        });

        const thumbnailDiv = document.createElement('div');
        thumbnailDiv.classList.add('library_thumbnail');
        
        if (item.thumbnail) {
            const img = document.createElement('img');
            img.src = item.thumbnail;
            img.alt = item.title;
            thumbnailDiv.appendChild(img);
            thumbnailDiv.classList.add('has-thumbnail');
        }
        singleSongDiv.appendChild(thumbnailDiv);

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('library_content');

        const titleDiv = document.createElement('div');
        titleDiv.textContent = item.title;
        titleDiv.classList.add('library_title');
        contentDiv.appendChild(titleDiv);

        const metaDiv = document.createElement('div');
        metaDiv.classList.add('library_meta');

        const artistDiv = document.createElement('div');
        artistDiv.textContent = item.artist;
        artistDiv.classList.add('library_artist');

        const durationDiv = document.createElement('div');
        let formattedDuration = this.formatDuration(item.duration);
        durationDiv.textContent = formattedDuration;
        durationDiv.classList.add('library_duration');

        metaDiv.appendChild(artistDiv);
        metaDiv.appendChild(durationDiv);

        contentDiv.appendChild(metaDiv);

        singleSongDiv.appendChild(thumbnailDiv);
        singleSongDiv.appendChild(contentDiv);

        const removeDiv = document.createElement('button');
        removeDiv.textContent = "-";
        removeDiv.classList.add('library_remove_btn');
        removeDiv.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteFile(item.title);
        });
        singleSongDiv.appendChild(removeDiv);

        DOMManager.elements.libraryContents.appendChild(singleSongDiv);
    }

    static formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) {
            return '0:00';
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = Math.floor(minutes % 60);
            return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
        }

        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    static async getAllDatabase() {
        return new Promise ((resolve, reject) => {
            const transaction = this.db.transaction(['mediaLibrary'], 'readonly');
            const store = transaction.objectStore('mediaLibrary');
            const request = store.getAll();

            request.onsuccess = (event) => resolve(event.target.result || []);
            request.onerror = (event) => reject(event.target.error);
        });
    }
}