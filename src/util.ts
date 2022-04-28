import credentials from "../credentials.json";

export function playlistItemsList(playlistId: string, pageToken?: string) {
  return gapi.client.youtube.playlistItems.list({
    part: ["snippet,contentDetails"],
    maxResults: 25,
    playlistId,
    pageToken,
  });
}

export function playlistItemsInsert(playlistId: string, videoId: string) {
  return gapi.client.youtube.playlistItems.insert({
    part: ["snippet"],
    resource: {
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    },
  });
}

export function playlistItemsDelete(playlistItemId: string) {
  return gapi.client.youtube.playlistItems.delete({
    id: playlistItemId,
  });
}

export function playlistList(pageToken?: string) {
  return gapi.client.youtube.playlists.list({
    maxResults: 25,
    part: ["snippet", "contentDetails"],
    mine: true,
    pageToken,
  });
}

export function playlistInsert(
  title: string,
  description: string,
  tags: string[] = []
) {
  return gapi.client.youtube.playlists.insert({
    part: ["snippet,status"],
    resource: {
      snippet: { title, description, tags, defaultLanguage: "en" },
      status: {
        privacyStatus: "private",
      },
    },
  });
}

export function playlistDelete(playlistId: string) {
  return gapi.client.youtube.playlists.delete({ id: playlistId });
}

export function loadClient() {
  gapi.client.setApiKey(credentials.api.key);
  return gapi.client.load("youtube", "v3");
}

export function authenticate() {
  return gapi.auth2
    .getAuthInstance()
    .signIn({ scope: "https://www.googleapis.com/auth/youtube.force-ssl" });
}
