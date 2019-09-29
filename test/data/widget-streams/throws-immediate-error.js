import {of as observableOf, throwError} from 'rxjs';
import {switchMap} from 'rxjs/operators';

export default function getData() {
    return observableOf(null).pipe(
        switchMap(() => throwError('Nope!'))
    );
}
