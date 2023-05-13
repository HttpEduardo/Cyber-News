import { Component, For, Show, createSignal, onMount, onCleanup } from 'solid-js';

import CLASS from "./index.module.scss";

const HACKERNEWS = {
    API: "https://hacker-news.firebaseio.com/v0",
    URL: "https://news.ycombinator.com",
}
type HackerNewsItem = {
    by: string;
    descendants: number;
    hidden: boolean;
    id: number;
    kids: number[];
    original: string;
    score: number;
    time: number;
    title: string;
    type: "story";
    url: string;
};

export const App: Component = () => {
    const [items, setItems] = createSignal<HackerNewsItem[]>([]);
    const [index, setIndex] = createSignal(0);

    onMount(handleFetch);
    onMount(handleEvents);
    onCleanup(handleCleanup)

    return (
        <Show when={items().length > 0} fallback={<h1>Loading...</h1>}>
            <For each={items()}>
                {(item, i) => (
                    !item.hidden && (
                        <article class={i() === index() ? CLASS.SELECTED : ""}>
                            <aside>
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M0 499.82h102.4V207.24H0v292.58zm510.17-210.78L465.7 448.37c-7.35 30.26-35.64 51.45-68.23 51.45H153.6V207.75l44.01-151.07c4.12-25.6 27.26-44.5 54.48-44.5 30.44 0 55.12 23.5 55.12 52.49v142.56h134.74c45.03.01 78.36 40.02 68.22 81.81z" class="st0"/>
                                    </svg>
                                    <span>{item.score}</span>
                                </div>
                                <div>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                        <path d="M460.8 0H51.2A51.25 51.25 0 0 0 0 51.2V512l102.4-102.4h358.4a51.25 51.25 0 0 0 51.2-51.2V51.2A51.27 51.27 0 0 0 460.8 0zM307.2 281.6H128v-51.2h179.2v51.2zM384 179.2H128V128h256v51.2z"/>
                                    </svg>
                                    <span>{item.descendants}</span>
                                </div>
                            </aside>
                            <h3>
                                <a href={item.url || item.original} target="_blank" rel="noopener noreferrer">{item.title}</a>
                            </h3>
                        </article>
                    )
                )}
            </For>
        </Show>
    );

    function handleEvents() {
        document.addEventListener("keyup", handleKeyUp);
    }

    function handleCleanup() {
        document.removeEventListener("keyup", handleKeyUp);
    }

    function handleKeyUp(ev: KeyboardEvent) {
        switch (ev.key) {
            // go down
            case "j":
                if (index() <= items().length) setIndex(index() + 1);
                break;
            // go up
            case "k":
                if (index() > 0) setIndex(index() - 1);
                break;
            // hide
            case "h":
                setItems((prev) => {
                    // Clone the items array to make it immutable
                    const _items = prev.slice();
                    const item = { ..._items[index()], hidden: true };
                    _items[index()] = item;
                    localStorage.setItem(String(item.id), JSON.stringify(item));
                    return _items;
                });
                if (index() < items().length - 1) setIndex(index() + 1);
                break;
            // visit link
            case "l": {
                const item = items()[index()];
                if (item.url) window.open(item.url, "_blank");
                else if (item.original) window.open(item.original, "_blank");
                break;
            }
            case "Enter": {
                const item = items()[index()];
                window.open(item.original, "_blank");
            }
            default: return;
        }
    }

    async function handleFetch() {
        try {
            const bestResp = await fetch(`${HACKERNEWS.API}/beststories.json`);
            const bestData: number[] = await bestResp.json();
            const items: HackerNewsItem[] = await Promise.all(bestData.map(async (id) => {
                {
                    const item = localStorage.getItem(String(id));
                    if (item) return Promise.resolve(JSON.parse(item));
                }
                const resp = await fetch(`${HACKERNEWS.API}/item/${id}.json`);
                const data = await resp.json();
                const item = { ...data, hidden: false, original: `${HACKERNEWS.URL}/item?id=${id}` };
                localStorage.setItem(String(id), JSON.stringify(item));
                return item;
            }));
            const stories = items
                .sort(((a, b) => a.score < b.score ? 1 : (a.score > b.score ? -1 : 0)))
                .filter((item) => !item.hidden);
            setItems(stories);
        } catch (err) {
            throw err;
        }
    }

};