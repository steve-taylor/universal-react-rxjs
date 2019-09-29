import {combineLatest, of as observableOf} from 'rxjs';
import {map, shareReplay} from 'rxjs/operators';

import fetchV from '../streams/fetch-v';
import fetchW from '../streams/fetch-w';

export default function getData(props$, hydration) {
    const coefficient$ = props$.pipe(
        map(({coefficient = 1}) => coefficient)
    );

    // Get {v, w} from hydration if hydrating, or from an external data source if not hydrating.
    const v$ = hydration
        ? observableOf(hydration.v)
        : fetchV().pipe(shareReplay(1));

    const w$ = hydration
        ? observableOf(hydration.w)
        : fetchW().pipe(shareReplay(1));

    // Calculate {a, b} based on v (from external data source) and coefficient (from props)
    const a$ = combineLatest([v$, coefficient$]).pipe(
        map(([v, coefficient]) => coefficient * v)
    );
    const b$ = combineLatest([w$, coefficient$]).pipe(
        map(([w, coefficient]) => coefficient * w)
    );

    return combineLatest([a$, b$, v$, w$]).pipe(
        map(([a, b, v, w]) => ({
            state: {
                isLoading: false,
                a,
                b,
            },
            hydration: {
                v,
                w,
            },
        }))
    );
}
