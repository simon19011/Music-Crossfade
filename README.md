# Music-Crossfade

[Music Crossfade Web App](https://simon19011.github.io/Music-Crossfade/)

Music Crossfade is an application used for queuing and playing songs/videos natively in your browser. It's main purpose is to fade from the current song to the next queued or played song. 

![alt text](https://github.com/simon19011/Music-Crossfade/blob/main/Sample%20Images/Crossfade%20Example.png "Crossfade Example")

## Adding Songs
Local files such as mp3, mp4, wav, etc. can be uploaded directly. <br />
Youtube URL links can be pasted in the "YouTube Search" tab and added to queue. <br />
All songs and videos can be downloaded and saved to "Library" on your local computer, stored on the browser (actual files cannot be directly accessed). <br />

## Queue
The queue can be reorganised by dragging a song to another location indicated by a coloured bar. <br />
Remove a song from queue by clicking on the X button. <br />
Songs can be dragged from queue directly into the Library. <br />

## YouTube Search
The YouTube search bar only accepts urls. <br />
This includes playlists but currently, only the first song of the playlist can be selected. <br />

## Song Library
Songs can be added to the Song Library for cross session play. <br />
Dragging queue items or files directly into the Song Library will save them into the browser database. <br />
Clearing the browser cache will remove all songs from the library as they are saved to IndexedDB. <br />

## Ambience Library
Currently not implemented. <br />

## Known Bugs
Local files cannot recognise artist name and thumbnails. <br />
Currently, YouTube videos cannot be saved to the "Library". <br />
Queue is cut off at the bottom. <br />
Queue scroll sidebar spacing present even without scroll. <br />
