import type { Accessor, Component } from "solid-js";
import {
  authenticate,
  loadClient,
  playlistDelete,
  playlistItemsList,
  playlistList,
} from "./util";
import {
  createSignal,
  Switch,
  Match,
  For,
  Show,
  createRoot,
  createEffect,
} from "solid-js";
import credentials from "../credentials.json";

const store = createRoot(() => {
  const [getUser, setUser] = createSignal<null | false | gapi.auth2.GoogleUser>(
    null
  );
  const [getPlaylists, setPlaylists] = createSignal<
    gapi.client.youtube.Playlist[]
  >([]);
  const [getPlaylist, setPlaylist] =
    createSignal<null | gapi.client.youtube.Playlist>(null);

  return {
    getUser,
    setUser,
    getPlaylists,
    setPlaylists,
    getPlaylist,
    setPlaylist,
  };
});

const Playlist: Component<{ playlist: gapi.client.youtube.Playlist }> = (
  props
) => {
  const [getPageToken, setPageToken] = createSignal<string>();
  const [getPage, setPage] =
    createSignal<gapi.client.youtube.PlaylistItemListResponse>();
  createEffect(() => {
    playlistItemsList(props.playlist.id!, getPageToken())
      .then((response) => response.result)
      .then(setPage);
  });

  function onDelete() {
    if (confirm(`Really delete ${props.playlist.snippet!.title}`))
      playlistDelete(props.playlist.id!);
  }

  return (
    <section>
      <details>
        <h3>Playlist</h3>
        <pre>{JSON.stringify(props.playlist, null, 2)}</pre>
        <h3>Items</h3>
        <pre>{JSON.stringify(getPage(), null, 2)}</pre>
      </details>
      <button onclick={onDelete}>Delete</button>
      <button
        onclick={() => setPageToken(getPage()!.prevPageToken)}
        disabled={!getPage()?.prevPageToken}
      >
        Prev
      </button>
      <button
        onclick={() => setPageToken(getPage()!.nextPageToken)}
        disabled={!getPage()?.nextPageToken}
      >
        Next
      </button>
      <ul>
        <For each={getPage()?.items ?? []}>
          {(item: gapi.client.youtube.PlaylistItem) => (
            <li>
              <details>
                <summary>{item.snippet?.title}</summary>
                <img
                  src={item.snippet?.thumbnails?.default?.url}
                  alt="thumbnail"
                />
                <p>{item.snippet?.description}</p>
                <iframe
                  width="560"
                  height="315"
                  src={`https://www.youtube.com/embed/${item.contentDetails?.videoId}`}
                  title={item.snippet?.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                />
                <pre>{JSON.stringify(item, null, 2)}</pre>
              </details>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
};

const Playlists: Component = () => {
  playlistList()
    .then((response) => response.result.items ?? [])
    .then(store.setPlaylists);

  return (
    <ul>
      <For each={store.getPlaylists()}>
        {(pl) => {
          return (
            <li>
              <details>
                <summary>
                  <button onclick={[store.setPlaylist, pl]}>Select</button>
                  <span>
                    {pl.snippet!.title} ({pl.contentDetails!.itemCount})
                  </span>
                </summary>
                <img
                  src={pl.snippet!.thumbnails?.default?.url}
                  alt="thumbnail"
                />
                <Show when={pl.snippet!.description}>
                  <p>{pl.snippet!.description}</p>
                </Show>
              </details>
            </li>
          );
        }}
      </For>
    </ul>
  );
};

const App: Component = () => {
  gapi.load("client:auth2", async function () {
    gapi.auth2.init({ client_id: credentials.web.client_id });
    await loadClient();
    gapi.auth2.getAuthInstance().currentUser.listen((user) => {
      store.setUser(() => (user.isSignedIn() ? user : false));
    });
    setTimeout(() => {
      const user = gapi.auth2.getAuthInstance().currentUser.get();
      store.setUser(() => (user.isSignedIn() ? user : false));
    }, 10000);
  });

  function signIn() {
    authenticate().then(loadClient);
  }

  function signOut() {
    gapi.auth2.getAuthInstance().signOut();
  }

  return (
    <main>
      <h1>Hello, world!</h1>
      <Switch>
        <Match when={store.getUser() === null}>
          <i>Loading...</i>
        </Match>
        <Match when={store.getUser() === false}>
          <button onclick={signIn}>Sign In</button>
        </Match>
        <Match when={store.getUser()}>
          <button onclick={signOut}>sign Out</button>
          <Playlists />
          <Show
            when={store.getPlaylist()}
            fallback={<i>Please select a playlist.</i>}
          >
            <Playlist playlist={store.getPlaylist()!} />
          </Show>
        </Match>
      </Switch>
    </main>
  );
};

export default App;
