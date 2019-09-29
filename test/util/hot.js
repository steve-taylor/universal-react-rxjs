import {Observable, ConnectableObservable} from 'rxjs';
import {delay, publish} from 'rxjs/operators';

/**
 * Make an observable hot.
 *
 * @param {Observable} observable$ - an RxJS Observable
 * @returns {ConnectableObservable} a hot observable
 */
export default function hot(observable$) {
    const hot$ = observable$.pipe(
        delay(0),
        publish()
    );

    hot$.connect();

    return hot$;
}
