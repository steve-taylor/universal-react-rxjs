import {map} from 'rxjs/operators';

export default function getData(props$) {
    const power$ = props$.pipe(
        map(({power = 1}) => power)
    );

    return power$.pipe(
        map((power) => ({
            state: {
                x: 5 ** power,
            },
        }))
    );
}
