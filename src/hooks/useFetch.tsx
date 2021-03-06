import { useReducer, useEffect } from "react";
import { JokeInterface, AppState } from "./useJokeState";
import axios from "axios";

type Action =
    | { type: "FETCH_SUCCESS"; payload: JokeInterface[] }
    | { type: "FETCH_INIT" }
    | { type: "FETCH_FAILURE" };

function fetchReducer(state: AppState, action: Action): AppState {
    switch (action.type) {
        case "FETCH_INIT":
            return { ...state, isLoading: true, isError: false };
        case "FETCH_SUCCESS":
            return {
                ...state,
                jokes: [...state.jokes, ...action.payload],
                isError: false,
                isLoading: false,
            };
        case "FETCH_FAILURE":
            return { ...state, isLoading: false, isError: true };

        default:
            throw new Error();
    }
}

const useFetch = (initialState: AppState): [AppState, () => void] => {
    const [state, dispatch] = useReducer(fetchReducer, initialState);
    const ids: string[] = state.jokes.reduce(
        (acc: string[], next: JokeInterface): string[] => {
            acc.push(next.id);
            return acc;
        },
        [],
    );

    async function fetchJokes(): Promise<any> {
        dispatch({ type: "FETCH_INIT" });
        try {
            let data: JokeInterface[] = [];

            while (data.length < 10) {
                const result = await axios({
                    method: "get",
                    url: "https://icanhazdadjoke.com/",
                    headers: {
                        Accept: "application/json",
                    },
                });

                if (!ids.includes(result.data.id)) {
                    ids.push(result.data.id);
                    const joke = {
                        id: result.data.id,
                        joke: result.data.joke,
                        rating: 0,
                    };
                    data.push(joke);
                }
            }

            if (data.length === 10) {
                dispatch({ type: "FETCH_SUCCESS", payload: data });
            }
        } catch (error) {
            dispatch({ type: "FETCH_FAILURE" });
        }
    }

    useEffect((): void => {
        function hasItem(key: string): boolean {
            return localStorage.getItem(key) !== null;
        }
        const { jokes } = JSON.parse(
            window.localStorage.getItem("jokesState") || String(initialState),
        );

        if (!hasItem("jokesState") || jokes.length === 0) {
            fetchJokes();
        }
    }, []);

    return [state, fetchJokes];
};

export default useFetch;
