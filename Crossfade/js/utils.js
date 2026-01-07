class Utils {

    static removeSongCleanUp(mediaItem) {
        if (!mediaItem) return;

        if (mediaItem.type !== 'youtube') {
            let element = mediaItem.Element;
            if (element) {
                element.pause();
                
                element.removeAttribute('src');
                element.load();

                let clone = element.cloneNode(true);
                element.replaceWith(clone);

                if (mediaItem.blobURL) {
                    URL.revokeObjectURL(mediaItem.blobURL);
                }
            }
        }

        else {
            let player = mediaItem.player;
            if (player) {
                player.destroy();
            }
            youtubeDataPlayer.delete(mediaItem);

            let div = document.getElementById("yt_" + mediaItem.videoId);
            if (div) {
                div.remove();
            }
        }

        for (let key of Object.keys(mediaItem)) {
            delete mediaItem[key];
        }
    }
}