import {combineLatest, of as observableOf} from 'rxjs';
import {map} from 'rxjs/operators';

import fetchBaseValue from '../streams/fetch-base-value';

export default function getData(props$, hydration) {
    const power$ = props$.pipe(map(({power = 1}) => power));

    // Get baseValue from hydration if hydrating, or from an external data source if not hydrating.
    const baseValue$ = hydration
        ? observableOf(hydration.baseValue)
        : fetchBaseValue();

    // Calculate x based on baseValue (from external data source) and power (from props)
    const x$ = combineLatest([baseValue$, power$]).pipe(
        map(([baseValue, power]) => baseValue ** power)
    );

    return combineLatest([x$, baseValue$]).pipe(
        map(([x, baseValue]) => ({
            state: {
                x,
            },
            hydration: {
                baseValue,
            },
            data: {
                maxAge: 60,
            },
        }))
    );
}
