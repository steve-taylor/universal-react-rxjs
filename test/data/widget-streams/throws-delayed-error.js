import {of as observableOf, throwError} from 'rxjs'
import {delay, switchMap} from 'rxjs/operators';

export default function getData() {
    return observableOf(null).pipe(
        delay(1),
        switchMap(() => throwError('Nope!'))
    );
}
